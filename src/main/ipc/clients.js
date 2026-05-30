import { ipcMain } from 'electron'
import db from '../database'

export function setupClientsHandlers() {
  ipcMain.handle('get-clients', () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM clients ORDER BY id DESC`, [], (err, rows) => {
        if (err) return reject(err)
        resolve(rows || [])
      })
    })
  })

  ipcMain.handle('add-client', (event, clientData) => {
    const { type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, cin_passport } = clientData;
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO clients (type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, cin_passport) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, cin_passport],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID, ...clientData })
        }
      )
    })
  })

  ipcMain.handle('update-client', (event, clientData) => {
    const { id, type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, cin_passport } = clientData;
    return new Promise((resolve, reject) => {
      db.run(`UPDATE clients SET type_client = ?, nom = ?, prenom = ?, raison_sociale = ?, email = ?, telephone = ?, adresse = ?, matricule_fiscale = ?, cin_passport = ? WHERE id = ?`,
        [type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, cin_passport, id],
        function (err) {
          if (err) return reject(err)
          resolve({ success: true })
        }
      )
    })
  })

  ipcMain.handle('delete-client', async (event, id) => {
    try {
      const hasDevis = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM devis WHERE client_id = ?`, [id], (err, row) => {
          if (err) return reject(err);
          resolve(row.count > 0);
        });
      });

      const hasFactures = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM factures WHERE client_id = ?`, [id], (err, row) => {
          if (err) return reject(err);
          resolve(row.count > 0);
        });
      });

      if (hasDevis || hasFactures) {
        throw new Error("Impossible de supprimer ce client. Il possède des devis ou factures associés. Veuillez les supprimer d'abord.");
      }

      return await new Promise((resolve, reject) => {
        db.run(`DELETE FROM clients WHERE id = ?`, [id], function (err) {
          if (err) return reject(err);
          resolve({ success: true });
        });
      });
    } catch (err) {
      throw err;
    }
  })
}
