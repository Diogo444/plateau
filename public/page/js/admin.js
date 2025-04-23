/** @format */

// admin.js
// Interface d’administration : gestion des cases, connexions, création et modification des plateaux

let loadedBoardId = null;
const board = {
  caseNames: {},
  connections: [],
  caseOrder: [],
};
const STORAGE_KEY = "boardDraft";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ admin.js chargé et DOM prêt");

  // Sélecteurs
  const existingBoardsSelect = document.getElementById("existingBoards");
  const loadBoardBtn = document.getElementById("loadBoardBtn");
  const caseForm = document.getElementById("caseForm");
  const connectionForm = document.getElementById("connectionForm");
  const caseList = document.getElementById("caseList");
  const connectionList = document.getElementById("connectionList");
  const boardData = document.getElementById("boardData");
  const publishBoard = document.getElementById("publishBoard");
  const sourceCaseSelect = document.getElementById("sourceCase");
  const destinationCaseSelect = document.getElementById("destinationCase");
  const boardNameInput = document.getElementById("boardName");

  // Charger la liste des plateaux existants
  async function fetchBoardsList() {
    try {
      const res = await fetch("/api/plateaux-list");
      const list = await res.json();
      list.forEach((b) => existingBoardsSelect.add(new Option(b.name, b.id)));
    } catch (err) {
      console.error("Erreur récupération liste plateaux :", err);
    }
  }
  await fetchBoardsList();

  // Charger un plateau existant dans l’interface
  loadBoardBtn.addEventListener("click", async () => {
    const id = existingBoardsSelect.value;
    if (!id) return alert("Veuillez sélectionner un plateau.");
    try {
      const res = await fetch(`/api/plateau/${id}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      // Remplir le board
      board.caseNames = { ...data.caseNames };
      board.caseOrder = [...data.caseOrder];
      board.connections = [...data.connections];
      boardNameInput.value = data.name;
      loadedBoardId = id;
      refreshAll();
    } catch (err) {
      console.error("Erreur chargement plateau :", err);
      alert("Impossible de charger le plateau.");
    }
  });

  // LocalStorage helpers
  function saveDraft() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ boardName: boardNameInput.value.trim(), board })
    );
  }
  function loadDraft() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      boardNameInput.value = saved.boardName || "";
      Object.assign(board.caseNames, saved.board?.caseNames || {});
      board.connections = Array.isArray(saved.board?.connections)
        ? saved.board.connections
        : [];
      board.caseOrder = Array.isArray(saved.board?.caseOrder)
        ? saved.board.caseOrder.filter((id) => id in board.caseNames)
        : Object.keys(board.caseNames);
      console.log("📥 Brouillon chargé =>", board);
      refreshAll();
    } catch (e) {
      console.error("Brouillon illisible :", e);
    }
  }
  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Mise à jour vue & stockage
  function updateBoardPreview() {
    const cases = {};
    board.connections.forEach(({ source, arrow, dest }) => {
      if (!cases[source]) cases[source] = [];
      cases[source].push({ arrow, dest });
    });
    const preview = {
      name: boardNameInput.value.trim() || "(Nom du plateau non défini)",
      caseNames: board.caseNames,
      cases,
      caseOrder: board.caseOrder,
      connections: board.connections,
    };
    boardData.textContent = JSON.stringify(preview, null, 2);
    saveDraft();
  }

  function refreshAll() {
    renderCaseList();
    updateCaseSelects();
    renderConnectionList();
    updateBoardPreview();
  }

  // Gestion des cases
  function renderCaseList() {
    caseList.innerHTML = "";
    board.caseOrder.forEach((id, idx) => {
      const name = board.caseNames[id];
      const li = document.createElement("li");
      li.textContent = `${id} : ${name}`;
      const btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.textContent = "▲";
      btnUp.disabled = idx === 0;
      btnUp.addEventListener("click", () => moveCase(id, -1));
      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.textContent = "▼";
      btnDown.disabled = idx === board.caseOrder.length - 1;
      btnDown.addEventListener("click", () => moveCase(id, +1));
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.textContent = "Modifier";
      btnEdit.addEventListener("click", () => {
        const newName = prompt("Nouveau nom :", name)?.trim();
        if (!newName) return;
        board.caseNames[id] = newName;
        refreshAll();
      });
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.textContent = "Supprimer";
      btnDel.addEventListener("click", () => {
        if (!confirm("Supprimer cette case ?")) return;
        delete board.caseNames[id];
        board.caseOrder = board.caseOrder.filter((k) => k !== id);
        board.connections = board.connections.filter((c) => c.source !== id);
        refreshAll();
      });
      li.prepend(btnUp, btnDown);
      li.append(btnEdit, btnDel);
      caseList.append(li);
    });
  }
  function moveCase(id, delta) {
    const idx = board.caseOrder.indexOf(id);
    const target = idx + delta;
    if (target < 0 || target >= board.caseOrder.length) return;
    [board.caseOrder[idx], board.caseOrder[target]] = [
      board.caseOrder[target],
      board.caseOrder[idx],
    ];
    refreshAll();
  }
  function updateCaseSelects() {
    sourceCaseSelect.innerHTML = "";
    destinationCaseSelect.innerHTML = "";
    board.caseOrder.forEach((id) => {
      const name = board.caseNames[id];
      sourceCaseSelect.add(new Option(`${id} - ${name}`, id));
      destinationCaseSelect.add(new Option(`${id} - ${name}`, id));
    });
  }

  // Gestion des connexions
  function renderConnectionList() {
    connectionList.innerHTML = "";
    board.connections.forEach((conn, idx) => {
      const { source, arrow, dest } = conn;
      const row = document.createElement("div");
      row.classList.add("conn-row");
      const btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.textContent = "▲";
      btnUp.disabled = idx === 0;
      btnUp.addEventListener("click", () => {
        [board.connections[idx - 1], board.connections[idx]] = [
          board.connections[idx],
          board.connections[idx - 1],
        ];
        refreshAll();
      });
      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.textContent = "▼";
      btnDown.disabled = idx === board.connections.length - 1;
      btnDown.addEventListener("click", () => {
        [board.connections[idx], board.connections[idx + 1]] = [
          board.connections[idx + 1],
          board.connections[idx],
        ];
        refreshAll();
      });
      const span = document.createElement("span");
      span.textContent = `${source} --[${arrow}]--> ${dest}`;
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.textContent = "Modifier";
      btnEdit.addEventListener("click", () => {
        const newArrow = prompt("Label :", arrow)?.trim();
        const newDest = prompt("Destination :", dest)?.trim();
        if (!newArrow || !newDest) return;
        conn.arrow = newArrow;
        conn.dest = newDest;
        refreshAll();
      });
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.textContent = "Supprimer";
      btnDel.addEventListener("click", () => {
        if (!confirm("Supprimer cette connexion ?")) return;
        board.connections.splice(idx, 1);
        refreshAll();
      });
      row.append(btnUp, btnDown, span, btnEdit, btnDel);
      connectionList.append(row);
    });
  }

  // Handlers des formulaires
  caseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("caseId").value.trim();
    const name = document.getElementById("caseName").value.trim();
    if (!id || !name) return;
    board.caseNames[id] = name;
    board.caseOrder.push(id);
    refreshAll();
    caseForm.reset();
  });
  connectionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const src = sourceCaseSelect.value;
    const lbl = document.getElementById("arrowLabel").value.trim();
    const dest = destinationCaseSelect.value;
    if (!src || !lbl || !dest) return;
    board.connections.push({ source: src, arrow: lbl, dest });
    refreshAll();
    connectionForm.reset();
  });

  // Publication / mise à jour du plateau
  publishBoard.addEventListener("click", async () => {
    const name = boardNameInput.value.trim();
    if (!name) return alert("Nom du plateau obligatoire");
    if (!Object.keys(board.caseNames).length)
      return alert("Ajoutez au moins une case");

    const payload = { name, ...board };
    const url = loadedBoardId
      ? `/api/plateau/${loadedBoardId}`
      : "/api/plateau";
    const method = loadedBoardId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.status);
      alert(loadedBoardId ? "Modifications enregistrées." : "Plateau créé !");
      clearDraft();
      if (!loadedBoardId) loadedBoardId = null;
    } catch (err) {
      console.error("Erreur publication :", err);
      alert(`Erreur: ${err.message}`);
    }
  });

  // Chargement brouillon si existant
  if (
    localStorage.getItem(STORAGE_KEY) &&
    confirm("Charger le brouillon existant ?")
  ) {
    loadDraft();
  } else {
    refreshAll();
  }
});
