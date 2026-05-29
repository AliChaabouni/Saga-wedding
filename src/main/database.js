import { app } from 'electron'
import { join } from 'path'
import sqlite3 from 'sqlite3'

const dbPath = join(app.getPath('userData'), 'saga_v7.sqlite') 
const db = new sqlite3.Database(dbPath)

export function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS employes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT, cin TEXT, categorie TEXT,
      prix_journalier REAL, salaire_mensuel REAL,
      taux_horaire_supp REAL DEFAULT 0
    )`)
    db.run(`ALTER TABLE employes ADD COLUMN jours_conge INTEGER DEFAULT 0`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS pointages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER, date TEXT,
      heures_normales REAL DEFAULT 0, heures_supp REAL DEFAULT 0,
      est_conge INTEGER DEFAULT 0,
      heure_entree TEXT DEFAULT '',
      heure_sortie TEXT DEFAULT '',
      FOREIGN KEY(employe_id) REFERENCES employes(id) ON DELETE CASCADE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS avances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employe_id INTEGER, date TEXT, montant REAL DEFAULT 0,
      FOREIGN KEY(employe_id) REFERENCES employes(id) ON DELETE CASCADE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS jours_feries (
      date TEXT PRIMARY KEY,
      nom TEXT,
      est_paye INTEGER DEFAULT 1
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS periodes_ramadan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_debut TEXT,
      date_fin TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )`, () => {
      db.get(`SELECT COUNT(id) as count FROM users`, (err, row) => {
        if (row && row.count === 0) {
          db.run(`INSERT INTO users (email, password) VALUES ('ali.chaabouni@gmail.com', 'ali.ch1995')`);
        }
      });
    });
  })
}

export default db
