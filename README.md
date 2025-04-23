Description
Jeu Plateau est une application web pour créer, modifier et jouer à des « plateaux » composés de cases reliées par des connexions étiquetées. L’interface admin vous permet de gérer vos plateaux (CRUD complet), et l’interface joueur affiche un plateau interactif.


---

Prérequis

Node.js ≥ 14 (ES Modules)

MySQL 5.7+ (pour JSON, InnoDB, transactions)

Navigateur moderne (Fetch API)



---

Installation

# 1. Récupérer le code
git clone <repo-url> jeu-plateau
cd jeu-plateau

# 2. Installer les dépendances
npm install


---

Initialisation de la base de données

1. Modifier le .env à la racine (ou créer) :

DB_HOST=localhost
DB_USER=plateau
DB_PASS=Plateau70
DB_NAME=plateau
PORT=3000


2. Exécuter le script SQL init.sql :

mysql -u root -p < init.sql

Ceci crée la base plateau et les tables :

plateau (id, name, created_at)

plateau_case (id, plateau_id, case_key, name, sort_order)

plateau_connection (id, plateau_id, source_case_key, arrow_label, dest_case_key, sort_order)





---

Lancement du serveur

npm start
# ou
node server.js

Par défaut sur http://localhost:3000.


---

Structure du projet

.
├── init.sql              # script de création de la BDD
├── .env                  # variables d’environnement
├── server.js             # serveur Express + API REST
├── public/
│   ├── page/
│   │   ├── HTML/
│   │   │   ├── index.html     # liste des plateaux
│   │   │   ├── admin.html     # interface admin
│   │   │   └── plateau.html   # vue joueur
│   │   ├── js/
│   │   │   ├── index.js       # fetch liste & navigation
│   │   │   ├── admin.js       # CRUD plateau (POST/PUT)
│   │   │   └── plateau.js     # jeu dynamique
│   │   └── css/
│   │       ├── index.css
│   │       ├── admin.css
│   │       └── plateau.css
│   └── vite.svg (favicon, optionnel)
└── package.json


---

Interfaces

Admin (/admin)

Protégé par un Basic Auth (Pierre-Antoine/ProfCRDV25).
Permet de :

Charger un plateau existant depuis la liste

Ajouter / modifier / supprimer cases et connexions

Publier (création POST ou mise à jour PUT)


Liste des plateaux (/)

Affiche les plateaux disponibles avec bouton “Voir” renvoyant vers /plateau/:id.

Joueur (/plateau/:id)

Montre le plateau interactif :

Sélection de la “case actuelle”

Boutons “Flèche X” pour naviguer

Historique des déplacements

Bouton “Recommencer”



---

API REST

caseNames : objet { caseKey: label }

caseOrder : tableau d’ID de cases

connections : tableau { source, arrow, dest } en ordre


Toutes les opérations sont transactionnelles pour garantir la cohérence.


---

Développement & stylage

ES Modules + async/await

MySQL2 Promise pool

Transactions + bulk‐inserts (VALUES ?)

Basic Auth pour l’admin (express-basic-auth)

Stockage temporaire de brouillon dans localStorage


Les styles sont organisés par page (CSS pur, responsive mobile-first).


---

Licence & Auteur

Ce projet est mis à disposition sous [MIT License].
Développé par Pierre-Antoine pour la gestion de plateaux de jeu dynamiques.

"# plateau" 
"# plateau" 
