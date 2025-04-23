-- init.sql
-- Script de création de la base de données et des tables pour Jeu Plateau

-- 1) Création de la base de données
CREATE DATABASE IF NOT EXISTS plateau CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plateau;

-- 2) Table des plateaux
CREATE TABLE IF NOT EXISTS plateau (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3) Table des cases liées à un plateau
CREATE TABLE IF NOT EXISTS plateau_case (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plateau_id INT NOT NULL,
  case_key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL,
  FOREIGN KEY (plateau_id) REFERENCES plateau(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) Table des connexions entre cases
CREATE TABLE IF NOT EXISTS plateau_connection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plateau_id INT NOT NULL,
  source_case_key VARCHAR(255) NOT NULL,
  arrow_label VARCHAR(255) NOT NULL,
  dest_case_key VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL,
  FOREIGN KEY (plateau_id) REFERENCES plateau(id) ON DELETE CASCADE
) ENGINE=InnoDB;
