/** @format */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import basicAuth from "express-basic-auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
  "/admin",
  basicAuth({
    users: { "Pierre-Antoine": "ProfCRDV25" },
    challenge: true,
    unauthorizedResponse: "Accès non autorisé",
  })
);

// Charger les variables d'environnement depuis un fichier .env
dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "plateau",
  password: process.env.DB_PASS || "Plateau70",
  database: process.env.DB_NAME || "plateau",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ Connecté à la base de données MySQL");

// Routes définies
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "page", "HTML", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "page", "HTML", "admin.html"));
});

app.post("/api/plateau", async (req, res) => {
  const { name, caseNames, cases } = req.body;

  if (!name || !caseNames || !cases) {
    return res.status(400).json({ error: "Données du plateau incomplètes." });
  }

  try {
    const jsonData = JSON.stringify({ caseNames, cases });
    const [result] = await db.execute(
      "INSERT INTO plateau (name, data) VALUES (?, ?)",
      [name, jsonData]
    );
    res.status(201).json({
      message: "Plateau enregistré avec succès.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erreur MySQL :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'enregistrement du plateau." });
  }
});

app.get("/api/plateaux-list", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name FROM plateau ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erreur MySQL :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des plateaux." });
  }
});

app.get("/plateau/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "page", "HTML", "plateau.html"));
});

app.get("/api/plateau/:id", async (req, res) => {
  const plateauId = req.params.id;
  try {
    const [rows] = await db.execute("SELECT * FROM plateau WHERE id = ?", [
      plateauId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Plateau non trouvé" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur MySQL :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du plateau." });
  }
});

// Middleware pour gérer les routes non définies et rediriger vers "/"
app.use((req, res) => {
  res.redirect("/");
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
