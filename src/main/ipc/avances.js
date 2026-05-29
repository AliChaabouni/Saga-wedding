import { ipcMain } from 'electron'
import db from '../database'

export function setupAvancesHandlers() {
  ipcMain.handle('get-avances', (event, month) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT a.id as avance_id, a.employe_id, a.date, a.montant, e.nom FROM avances a JOIN employes e ON a.employe_id = e.id WHERE a.date LIKE ? ORDER BY a.date DESC`, [`${month}-%`], (err, rows) => {
        if (err) return reject(err); resolve(rows || []);
      });
    });
  });

  ipcMain.handle('add-avance', (event, data) => {
    const { employe_id, date, montant } = data;
    return new Promise((resolve, reject) => { db.run(`INSERT INTO avances (employe_id, date, montant) VALUES (?, ?, ?)`, [employe_id, date, montant], function (err) { if (err) return reject(err); resolve({ success: true, id: this.lastID }); }); });
  });

  ipcMain.handle('delete-avance', async (event, id) => {
    return new Promise((resolve, reject) => { db.run(`DELETE FROM avances WHERE id = ?`, [id], function (err) { if (err) return reject(err); resolve({ success: true }); }); });
  });
}
