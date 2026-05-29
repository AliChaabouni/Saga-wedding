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
    const { type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale } = clientData;
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO clients (type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID, ...clientData })
        }
      )
    })
  })

  ipcMain.handle('update-client', (event, clientData) => {
    const { id, type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale } = clientData;
    return new Promise((resolve, reject) => {
      db.run(`UPDATE clients SET type_client = ?, nom = ?, prenom = ?, raison_sociale = ?, email = ?, telephone = ?, adresse = ?, matricule_fiscale = ? WHERE id = ?`,
        [type_client, nom, prenom, raison_sociale, email, telephone, adresse, matricule_fiscale, id],
        function (err) {
          if (err) return reject(err)
          resolve({ success: true })
        }
      )
    })
  })

  ipcMain.handle('delete-client', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM clients WHERE id = ?`, [id], function (err) {
        if (err) return reject(err)
        resolve({ success: true })
      })
    })
  })
}
