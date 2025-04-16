/**
 * admin.js
 *
 * Gestion de la création, modification, suppression des cases
 * et connexions d'un plateau, avec enregistrement temporaire dans le localStorage.
 */

const board = {
  caseNames: {}, // stocke : { caseId: caseName }
  cases: {}      // stocke les connexions : { sourceCase: { arrowLabel: destinationCase } }
};

document.addEventListener("DOMContentLoaded", () => {
  const caseForm = document.getElementById("caseForm");
  const connectionForm = document.getElementById("connectionForm");
  const caseList = document.getElementById("caseList");
  const connectionList = document.getElementById("connectionList");
  const boardData = document.getElementById("boardData");
  const publishBoard = document.getElementById("publishBoard");
  const sourceCaseSelect = document.getElementById("sourceCase");
  const destinationCaseSelect = document.getElementById("destinationCase");
  const boardNameInput = document.getElementById("boardName");

  const STORAGE_KEY = "boardDraft";

  /** Enregistre l'état actuel du plateau dans le localStorage */
  function saveDraft() {
    const dataToSave = {
      boardName: boardNameInput.value.trim(),
      board
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }

  /** Charge les données enregistrées (le brouillon) */
  function loadDraft() {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        boardNameInput.value = data.boardName || "";
        if (data.board) {
          board.caseNames = data.board.caseNames || {};
          board.cases = data.board.cases || {};
        }
        updateCaseList();
        updateCaseSelects();
        updateConnectionList();
        updateBoardPreview();
      } catch (e) {
        console.error("Erreur lors du chargement du brouillon :", e);
      }
    }
  }

  /** Supprime le brouillon du localStorage (appelé après publication) */
  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Met à jour les listes déroulantes avec les cases créées
  function updateCaseSelects() {
    sourceCaseSelect.innerHTML = "";
    destinationCaseSelect.innerHTML = "";
    for (const id in board.caseNames) {
      const option1 = document.createElement("option");
      option1.value = id;
      option1.textContent = `${id} - ${board.caseNames[id]}`;
      sourceCaseSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = id;
      option2.textContent = `${id} - ${board.caseNames[id]}`;
      destinationCaseSelect.appendChild(option2);
    }
  }

  // Met à jour l'aperçu du plateau en affichant les données en JSON
  function updateBoardPreview() {
    const previewData = {
      name: boardNameInput.value.trim() || "(Nom du plateau non défini)",
      ...board,
    };
    boardData.textContent = JSON.stringify(previewData, null, 2);
    saveDraft();
  }

  // --- Gestion des Cases ---

  // Regénère la liste des cases avec les options "Modifier" et "Supprimer"
  function updateCaseList() {
    caseList.innerHTML = "";
    for (let id in board.caseNames) {
      const li = createCaseListItem(id, board.caseNames[id]);
      caseList.appendChild(li);
    }
  }

  // Crée un élément de liste pour une case avec boutons d'édition et de suppression
  function createCaseListItem(caseId, caseName) {
    const li = document.createElement("li");
    
    // Contenu texte
    const span = document.createElement("span");
    span.textContent = `${caseId} : ${caseName}`;
    li.appendChild(span);

    // Bouton pour modifier la case
    const editButton = document.createElement("button");
    editButton.textContent = "Modifier";
    editButton.addEventListener("click", () => editCase(caseId));
    li.appendChild(editButton);

    // Bouton pour supprimer la case
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => deleteCase(caseId));
    li.appendChild(deleteButton);

    return li;
  }

  // Permet de modifier le nom d'une case
  function editCase(caseId) {
    const newName = prompt("Entrez le nouveau nom pour la case :", board.caseNames[caseId]);
    if (newName !== null && newName.trim() !== "") {
      board.caseNames[caseId] = newName.trim();
      updateCaseList();
      updateCaseSelects();
      updateBoardPreview();
    }
  }

  // Permet de supprimer une case et ses connexions associées (en tant que source)
  function deleteCase(caseId) {
    if (confirm("Voulez-vous vraiment supprimer cette case ?")) {
      delete board.caseNames[caseId];
      delete board.cases[caseId]; // supprime les connexions dont cette case est la source
      updateCaseList();
      updateCaseSelects();
      updateBoardPreview();
    }
  }

  // --- Gestion des Connexions ---

  // Regénère la liste des connexions à partir de board.cases
  function updateConnectionList() {
    connectionList.innerHTML = "";
    for (let source in board.cases) {
      for (let arrow in board.cases[source]) {
        const dest = board.cases[source][arrow];
        const div = createConnectionElement(source, arrow, dest);
        connectionList.appendChild(div);
      }
    }
    saveDraft();
  }

  // Crée un élément pour afficher une connexion avec boutons "Modifier" et "Supprimer"
  function createConnectionElement(source, arrow, destination) {
    const div = document.createElement("div");
    
    // Élément de texte contenant la connexion
    const span = document.createElement("span");
    span.textContent = `${source} --[${arrow}]--> ${destination}`;
    div.appendChild(span);

    // Bouton pour modifier la connexion
    const editButton = document.createElement("button");
    editButton.textContent = "Modifier";
    editButton.addEventListener("click", () => editConnection(source, arrow));
    div.appendChild(editButton);

    // Bouton pour supprimer la connexion
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => deleteConnection(source, arrow));
    div.appendChild(deleteButton);

    return div;
  }

  // Permet de modifier le label et la destination d'une connexion
  function editConnection(source, arrow) {
    const currentDest = board.cases[source][arrow];
    const newArrow = prompt("Entrez le nouveau label de flèche :", arrow);
    if (newArrow === null || newArrow.trim() === "") return;
    const newDest = prompt("Entrez la nouvelle case destination :", currentDest);
    if (newDest === null || newDest.trim() === "") return;

    const trimmedNewArrow = newArrow.trim();
    const trimmedNewDest = newDest.trim();
    // Si le label change, on supprime l'ancienne entrée
    if (trimmedNewArrow !== arrow) {
      delete board.cases[source][arrow];
    }
    board.cases[source][trimmedNewArrow] = trimmedNewDest;

    updateConnectionList();
    updateBoardPreview();
  }

  // Permet de supprimer une connexion donnée
  function deleteConnection(source, arrow) {
    if (confirm("Voulez-vous vraiment supprimer cette connexion ?")) {
      delete board.cases[source][arrow];
      updateConnectionList();
      updateBoardPreview();
    }
  }

  // --- Événements sur les formulaires ---

  // Ajout d'une case
  caseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const caseId = document.getElementById("caseId").value.trim();
    const caseName = document.getElementById("caseName").value.trim();
    if (caseId && caseName) {
      board.caseNames[caseId] = caseName;
      // Initialise l'objet de connexions pour cette case s'il n'existe pas déjà
      if (!board.cases[caseId]) {
        board.cases[caseId] = {};
      }
      updateCaseList();
      updateCaseSelects();
      updateBoardPreview();
      caseForm.reset();
    }
  });

  // Ajout d'une connexion entre deux cases
  connectionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const source = document.getElementById("sourceCase").value;
    const arrow = document.getElementById("arrowLabel").value.trim();
    const destination = document.getElementById("destinationCase").value;
    if (source && arrow && destination) {
      if (!board.cases[source]) {
        board.cases[source] = {};
      }
      board.cases[source][arrow] = destination;
      updateConnectionList();
      updateBoardPreview();
      connectionForm.reset();
    }
  });

  // Mise à jour de l'aperçu lors du changement du nom du plateau
  boardNameInput.addEventListener("input", updateBoardPreview);

  // Publication du plateau
  publishBoard.addEventListener("click", () => {
    const boardName = boardNameInput.value.trim();
    if (!boardName) {
      alert("Veuillez entrer un nom pour le plateau avant de publier.");
      boardNameInput.focus();
      return;
    }
    if (Object.keys(board.caseNames).length === 0) {
      alert("Veuillez ajouter au moins une case avant de publier le plateau.");
      return;
    }
    const dataToSend = {
      name: boardName,
      ...board,
    };
    fetch("/api/plateau", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        alert(`Plateau "${boardName}" publié avec succès!`);
        clearDraft(); // Efface le brouillon après publication
      })
      .catch((error) => {
        console.error("Une erreur s'est produite lors de la publication du plateau :", error);
        alert(`Erreur lors de la publication: ${error.message}`);
      });
  });

  // À l'initialisation, on charge le brouillon existant s'il y en a un.
  if (localStorage.getItem(STORAGE_KEY)) {
    if (confirm("Un brouillon a été trouvé. Voulez-vous le charger ?")) {
      loadDraft();
    } else {
      clearDraft();
    }
  }

  // Initialisation des affichages
  updateCaseList();
  updateConnectionList();
  updateBoardPreview();
});
