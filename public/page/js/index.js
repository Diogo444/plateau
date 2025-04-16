/** @format */

document.addEventListener("DOMContentLoaded", () => {
  const plateauxList = document.getElementById("plateaux");

  // Fonction pour récupérer les plateaux depuis l'API
  async function fetchPlateaux() {
    try {
      const response = await fetch("/api/plateaux-list");
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const plateaux = await response.json();

      // Efface la liste avant de la mettre à jour
      plateauxList.innerHTML = "";

      // Affiche chaque plateau dans la liste
      plateaux.forEach((plateau) => {
        const li = document.createElement("li");
        li.textContent = plateau.name;
        li.dataset.id = plateau.id;

        // Ajoute un bouton pour charger un plateau
        const button = document.createElement("button");
        button.textContent = "Voir";
        button.onclick = () => loadPlateau(plateau.id);
        li.appendChild(button);

        plateauxList.appendChild(li);
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des plateaux :", error);
      plateauxList.innerHTML = "<p>Erreur de chargement des plateaux.</p>";
    }
  }

  // Fonction pour charger un plateau spécifique
  // Fonction pour charger un plateau spécifique
  function loadPlateau(id) {
    window.location.href = `/plateau/${id}`;
  }

  // Chargement des plateaux au chargement de la page
  fetchPlateaux();
});
