import { ipcMain } from 'electron'
import db from '../database'

export function setupCalendarHandlers() {
  ipcMain.handle('get-jours-feries', (event, month) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM jours_feries ORDER BY date ASC`;
      let params = [];
      if (month) { query = `SELECT * FROM jours_feries WHERE date LIKE ? ORDER BY date ASC`; params = [`${month}-%`]; }
      db.all(query, params, (err, rows) => { if (err) return reject(err); resolve(rows || []); });
    });
  });

  ipcMain.handle('add-jour-ferie', (event, data) => {
    const { date, nom, est_paye } = data;
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO jours_feries (date, nom, est_paye) VALUES (?, ?, ?)`, [date, nom, est_paye ? 1 : 0], function (err) {
        if (err) return reject(err); resolve({ success: true });
      });
    });
  });

  ipcMain.handle('delete-jour-ferie', (event, date) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM jours_feries WHERE date = ?`, [date], function (err) { if (err) return reject(err); resolve({ success: true }); });
    });
  });

  ipcMain.handle('get-periodes-ramadan', () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM periodes_ramadan ORDER BY date_debut ASC`, [], (err, rows) => {
        if (err) return reject(err); resolve(rows || []);
      });
    });
  });

  ipcMain.handle('add-periode-ramadan', (event, data) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO periodes_ramadan (date_debut, date_fin) VALUES (?, ?)`, [data.date_debut, data.date_fin], function (err) {
        if (err) return reject(err); resolve({ success: true, id: this.lastID });
      });
    });
  });

  ipcMain.handle('delete-periode-ramadan', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM periodes_ramadan WHERE id = ?`, [id], function (err) {
        if (err) return reject(err); resolve({ success: true });
      });
    });
  });
}
