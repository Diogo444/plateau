# Utilise une image Node officielle (version alpine pour un container léger)
FROM node:18-alpine

# Définir le répertoire de travail dans le container
WORKDIR /app

# Copier les fichiers de configuration npm et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste de ton code
COPY . .

# Exposer le port sur lequel l'application s'exécute
EXPOSE 3000

# Démarrer l'application
CMD ["node", "server.js"]
