/**
 * server.js
 * Serveur Express pour Jeu Plateau avec architecture relationnelle MySQL
 * Node.js >= 14, ES Modules
 *
 * @format
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import basicAuth from "express-basic-auth";

// Charger les variables d'environnement
dotenv.config();

// Initialisation Express
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Connexion au pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "plateau",
  password: process.env.DB_PASS || "Plateau70",
  database: process.env.DB_NAME || "plateau",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Authentification basique pour l'interface admin
app.use(
  "/admin",
  basicAuth({
    users: { "Pierre-Antoine": "ProfCRDV25" },
    challenge: true,
    unauthorizedResponse: "Accès non autorisé",
  })
);

// Routes HTML
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/page/HTML/index.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public/page/HTML/admin.html"))
);
app.get("/plateau/:id", (req, res) =>
  res.sendFile(path.join(__dirname, "public/page/HTML/plateau.html"))
);

// POST /api/plateau : création d'un nouveau plateau relationnel
app.post("/api/plateau", async (req, res, next) => {
  const { name, caseNames, caseOrder, connections } = req.body;
  if (
    !name ||
    typeof caseNames !== "object" ||
    !Array.isArray(caseOrder) ||
    !Array.isArray(connections)
  ) {
    return res
      .status(400)
      .json({ error: "Données du plateau incomplètes ou invalides." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insertion dans plateau
    const [platRes] = await conn.execute(
      `INSERT INTO plateau (name) VALUES (?)`,
      [name]
    );
    const plateauId = platRes.insertId;

    // 2) Insertion des cases
    if (caseOrder.length > 0) {
      const caseRows = caseOrder.map((key, idx) => [
        plateauId,
        key,
        caseNames[key],
        idx,
      ]);
      await conn.query(
        `INSERT INTO plateau_case 
           (plateau_id, case_key, name, sort_order) 
         VALUES ?`,
        [caseRows]
      );
    }

    // 3) Insertion des connexions
    if (connections.length > 0) {
      const connRows = connections.map(({ source, arrow, dest }, idx) => [
        plateauId,
        source,
        arrow,
        dest,
        idx,
      ]);
      await conn.query(
        `INSERT INTO plateau_connection
           (plateau_id, source_case_key, arrow_label, dest_case_key, sort_order)
         VALUES ?`,
        [connRows]
      );
    }

    await conn.commit();
    res
      .status(201)
      .json({ message: "Plateau créé avec succès.", id: plateauId });
  } catch (error) {
    await conn.rollback();
    console.error("Erreur création plateau :", error);
    next(error);
  } finally {
    conn.release();
  }
});

// PUT /api/plateau/:id : mise à jour d'un plateau existant
app.put("/api/plateau/:id", async (req, res, next) => {
  const plateauId = req.params.id;
  const { name, caseNames, caseOrder, connections } = req.body;
  if (
    !name ||
    typeof caseNames !== "object" ||
    !Array.isArray(caseOrder) ||
    !Array.isArray(connections)
  ) {
    return res.status(400).json({ error: "Données invalides." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Mettre à jour le nom
    await conn.execute(`UPDATE plateau SET name = ? WHERE id = ?`, [
      name,
      plateauId,
    ]);

    // 2) Supprimer anciennes données
    await conn.execute(`DELETE FROM plateau_case WHERE plateau_id = ?`, [
      plateauId,
    ]);
    await conn.execute(`DELETE FROM plateau_connection WHERE plateau_id = ?`, [
      plateauId,
    ]);

    // 3) Réinsérer les cases
    if (caseOrder.length > 0) {
      const caseRows = caseOrder.map((key, idx) => [
        plateauId,
        key,
        caseNames[key],
        idx,
      ]);
      await conn.query(
        `INSERT INTO plateau_case
           (plateau_id, case_key, name, sort_order)
         VALUES ?`,
        [caseRows]
      );
    }

    // 4) Réinsérer les connexions
    if (connections.length > 0) {
      const connRows = connections.map(({ source, arrow, dest }, idx) => [
        plateauId,
        source,
        arrow,
        dest,
        idx,
      ]);
      await conn.query(
        `INSERT INTO plateau_connection
           (plateau_id, source_case_key, arrow_label, dest_case_key, sort_order)
         VALUES ?`,
        [connRows]
      );
    }

    await conn.commit();
    res.json({ message: "Plateau mis à jour." });
  } catch (error) {
    await conn.rollback();
    console.error("Erreur mise à jour plateau :", error);
    next(error);
  } finally {
    conn.release();
  }
});

// GET /api/plateaux-list : liste des plateaux
app.get("/api/plateaux-list", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name FROM plateau ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Erreur récupération plateaux :", error);
    next(error);
  }
});

// GET /api/plateau/:id : récupération d'un plateau complet
app.get("/api/plateau/:id", async (req, res, next) => {
  const plateauId = req.params.id;
  try {
    // 1) Récupérer le nom
    const [[plat]] = await pool.execute(
      `SELECT name FROM plateau WHERE id = ?`,
      [plateauId]
    );
    if (!plat) {
      return res.status(404).json({ error: "Plateau non trouvé." });
    }

    // 2) Récupérer les cases
    const [cases] = await pool.execute(
      `SELECT case_key AS caseKey, name, sort_order
         FROM plateau_case
        WHERE plateau_id = ?
        ORDER BY sort_order`,
      [plateauId]
    );

    // 3) Récupérer les connexions
    const [conns] = await pool.execute(
      `SELECT source_case_key AS source,
              arrow_label   AS arrow,
              dest_case_key AS dest,
              sort_order
         FROM plateau_connection
        WHERE plateau_id = ?
        ORDER BY sort_order`,
      [plateauId]
    );

    // 4) Formater la réponse
    const caseNames = {};
    const caseOrderResp = [];
    cases.forEach(({ caseKey, name }) => {
      caseNames[caseKey] = name;
      caseOrderResp.push(caseKey);
    });

    res.json({
      id: plateauId,
      name: plat.name,
      caseNames,
      caseOrder: caseOrderResp,
      connections: conns.map(({ source, arrow, dest }) => ({
        source,
        arrow,
        dest,
      })),
    });
  } catch (error) {
    console.error("Erreur récupération plateau :", error);
    next(error);
  }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Erreur interne serveur." });
});

// Redirection pour les routes inconnues
app.use((req, res) => res.redirect("/"));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
