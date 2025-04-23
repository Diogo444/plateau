/** @format */
// plateau.js
// Gestion du jeu de plateau côté client avec l'ordre des connexions

document.addEventListener("DOMContentLoaded", async () => {
  const plateauTitle = document.getElementById("plateauTitle");
  const currentCaseDisplay = document.getElementById("currentCase");
  const choicesList = document.getElementById("choicesList");
  const historyList = document.getElementById("historyList");
  const restartButton = document.getElementById("restart");

  let plateauData = null;
  let currentCase = null;
  let lastCase = null;
  let history = [];

  // Récupérer l'ID du plateau depuis l'URL
  const plateauId = window.location.pathname.split("/").pop();

  try {
    const response = await fetch(`/api/plateau/${plateauId}`);
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    plateauData = await response.json();

    // Afficher le nom du plateau
    plateauTitle.textContent = plateauData.name;

    // Initialiser sur la première connexion
    if (
      Array.isArray(plateauData.connections) &&
      plateauData.connections.length
    ) {
      currentCase = plateauData.connections[0].source;
    } else {
      // Fallback : première clé de caseNames
      currentCase = Object.keys(plateauData.caseNames || {})[0] || null;
    }

    updateChoices();
  } catch (err) {
    console.error("Erreur lors du chargement du plateau :", err);
    plateauTitle.textContent = "Erreur";
    currentCaseDisplay.textContent = "Impossible de charger le plateau.";
    choicesList.innerHTML = "";
  }

  function updateChoices() {
    if (!plateauData || !currentCase) return;
    const { caseNames, connections } = plateauData;

    // Afficher la case actuelle
    const label = caseNames[currentCase] || currentCase;
    currentCaseDisplay.textContent = `Case actuelle : ${label}`;

    // Filtrer les connexions valides (pas de retour immédiat)
    const options = connections.filter(
      (c) => c.source === currentCase && c.dest !== lastCase
    );

    // Réinitialiser la liste des choix
    choicesList.innerHTML = "";

    if (!options.length) {
      const li = document.createElement("li");
      li.textContent = "Aucun choix disponible.";
      choicesList.appendChild(li);
    } else {
      options.forEach(({ arrow, dest }) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = `Flèche ${arrow}`;
        btn.addEventListener("click", () => moveTo(dest));
        li.appendChild(btn);
        choicesList.appendChild(li);
      });
    }

    // Mise à jour de l'historique
    historyList.innerHTML = "";
    history.forEach((c, idx) => {
      const li = document.createElement("li");
      li.textContent = `${idx + 1}. ${caseNames[c] || c}`;
      historyList.appendChild(li);
    });
  }

  function moveTo(dest) {
    lastCase = currentCase;
    history.push(currentCase);
    currentCase = dest;
    updateChoices();
  }

  restartButton.addEventListener("click", () => {
    // Réinitialiser historique et position
    history = [];
    lastCase = null;
    if (
      Array.isArray(plateauData.connections) &&
      plateauData.connections.length
    ) {
      currentCase = plateauData.connections[0].source;
    } else {
      currentCase = Object.keys(plateauData.caseNames || {})[0] || null;
    }
    updateChoices();
  });
});
