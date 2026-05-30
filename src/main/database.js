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

    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_client TEXT DEFAULT 'physique',
      nom TEXT,
      prenom TEXT,
      raison_sociale TEXT,
      email TEXT,
      telephone TEXT,
      adresse TEXT,
      matricule_fiscale TEXT,
      cin_passport TEXT
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE,
      client_id INTEGER,
      date_creation TEXT,
      date_validite TEXT,
      statut TEXT DEFAULT 'Brouillon',
      total_ht REAL DEFAULT 0,
      tva REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS devis_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      devis_id INTEGER,
      description TEXT,
      quantite INTEGER DEFAULT 1,
      prix_unitaire REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY(devis_id) REFERENCES devis(id) ON DELETE CASCADE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE,
      client_id INTEGER,
      devis_id INTEGER,
      date_creation TEXT,
      date_echeance TEXT,
      statut TEXT DEFAULT 'Brouillon',
      total_ht REAL DEFAULT 0,
      tva REAL DEFAULT 0,
      total_ttc REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(devis_id) REFERENCES devis(id) ON DELETE SET NULL
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS facture_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facture_id INTEGER,
      description TEXT,
      quantite INTEGER DEFAULT 1,
      prix_unitaire REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY(facture_id) REFERENCES factures(id) ON DELETE CASCADE
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS bons_sortie (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE,
      facture_id INTEGER,
      employe_id INTEGER,
      date_creation TEXT,
      notes TEXT,
      FOREIGN KEY(facture_id) REFERENCES factures(id) ON DELETE SET NULL,
      FOREIGN KEY(employe_id) REFERENCES employes(id) ON DELETE SET NULL
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS bons_sortie_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bon_sortie_id INTEGER,
      description TEXT,
      quantite INTEGER DEFAULT 1,
      FOREIGN KEY(bon_sortie_id) REFERENCES bons_sortie(id) ON DELETE CASCADE
    )`)

    // Migrations to add columns if they don't exist
    const addCol = (table, colDef) => db.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`, () => {});
    addCol('clients', `type_client TEXT DEFAULT 'physique'`);
    addCol('clients', `prenom TEXT`);
    addCol('clients', `raison_sociale TEXT`);
    addCol('clients', `email TEXT`);
    addCol('clients', `telephone TEXT`);
    addCol('clients', `adresse TEXT`);
    addCol('clients', `matricule_fiscale TEXT`);
    addCol('clients', `cin_passport TEXT`);
    
    addCol('devis', `numero TEXT UNIQUE`);
    addCol('factures', `numero TEXT UNIQUE`);
    addCol('factures', `devis_id INTEGER`);
    
    // Migrations for bons_sortie just in case table was created partially
    addCol('bons_sortie', `facture_id INTEGER`);
    addCol('bons_sortie', `employe_id INTEGER`);
    addCol('bons_sortie', `date_creation TEXT`);
    addCol('bons_sortie', `notes TEXT`);

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
