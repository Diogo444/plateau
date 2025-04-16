/** @format */
document.addEventListener("DOMContentLoaded", async () => {
  const plateauTitle = document.getElementById("plateauTitle");
  const currentCaseDisplay = document.getElementById("currentCase");
  const choicesList = document.getElementById("choicesList");
  const historyList = document.getElementById("historyList");
  const restartButton = document.getElementById("restart");

  let plateauData = null;
  let currentCase = "case1"; // Utilisation de la première case existante
  let lastCase = null;
  let history = [];

  // Récupérer l'ID du plateau depuis l'URL
  const plateauId = window.location.pathname.split("/").pop();
  console.log("Plateau ID:", plateauId);

  try {
    const response = await fetch(`/api/plateau/${plateauId}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const plateau = await response.json();

    // Stocke les données du plateau SANS JSON.parse()
    plateauData = plateau.data; // ✅ Correction ici
    plateauTitle.textContent = plateau.name;

    updateChoices(); // Affiche les choix dès le début
  } catch (error) {
    console.error("Erreur lors du chargement du plateau :", error);
    plateauTitle.textContent = "Erreur";
    currentCaseDisplay.textContent = "Impossible de charger ce plateau.";
  }

  function updateChoices() {
    if (!plateauData) return;

    // Vérifie si la case actuelle existe
    if (!plateauData.caseNames[currentCase]) {
      console.error(`Case "${currentCase}" introuvable dans le plateau.`);
      currentCaseDisplay.textContent = "Erreur : Case introuvable.";
      return;
    }

    // Met à jour le texte de la case actuelle
    currentCaseDisplay.textContent = `Case actuelle : ${plateauData.caseNames[currentCase]}`;

    // Efface la liste des choix
    choicesList.innerHTML = "";
    const availableChoices = Object.keys(
      plateauData.cases[currentCase] || {}
    ).filter((arrow) => plateauData.cases[currentCase][arrow] !== lastCase);

    availableChoices.forEach((arrow) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.textContent = `Flèche ${arrow}`;
      button.onclick = () => moveTo(plateauData.cases[currentCase][arrow]);
      li.appendChild(button);
      choicesList.appendChild(li);
    });

    // Met à jour l'affichage de l'historique
    historyList.innerHTML = "";
    history.forEach((visitedCase, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${plateauData.caseNames[visitedCase]}`;
      historyList.appendChild(li);
    });
  }

  function moveTo(newCase) {
    lastCase = currentCase;
    history.push(currentCase);
    currentCase = newCase;
    updateChoices();
  }

  restartButton.onclick = () => {
    currentCase = "case1"; // Remet sur la première case
    lastCase = null;
    history = [];
    updateChoices();
  };
});
