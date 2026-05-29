import { ipcMain } from 'electron'
import db from '../database'

export function setupPointagesHandlers() {
  ipcMain.handle('get-all-pointages', () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT p.id as pointage_id, p.employe_id, p.date, p.heure_entree, p.heure_sortie, p.heures_normales, p.heures_supp, p.est_conge, e.nom, e.categorie FROM pointages p JOIN employes e ON p.employe_id = e.id`, [], (err, rows) => {
        if (err) return reject(err); resolve(rows || []);
      });
    });
  });

  ipcMain.handle('save-pointage', (event, data) => {
    const { pointage_id, employe_id, date, heure_entree, heure_sortie, heures_normales, heures_supp, est_conge } = data;
    return new Promise((resolve, reject) => {
      if (pointage_id) {
        db.run(`UPDATE pointages SET employe_id = ?, date = ?, heure_entree = ?, heure_sortie = ?, heures_normales = ?, heures_supp = ?, est_conge = ? WHERE id = ?`,
          [employe_id, date, heure_entree, heure_sortie, heures_normales, heures_supp, est_conge ? 1 : 0, pointage_id], function (err) { if (err) return reject(err); resolve({ success: true, id: pointage_id }); }
        );
      } else {
        db.run(`INSERT INTO pointages (employe_id, date, heure_entree, heure_sortie, heures_normales, heures_supp, est_conge) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [employe_id, date, heure_entree, heure_sortie, heures_normales, heures_supp, est_conge ? 1 : 0], function (err) { if (err) return reject(err); resolve({ success: true, id: this.lastID }); }
        );
      }
    });
  });

  ipcMain.handle('delete-pointage', async (event, id) => {
    return new Promise((resolve, reject) => { db.run(`DELETE FROM pointages WHERE id = ?`, [id], function (err) { if (err) return reject(err); resolve({ success: true }); }); });
  });
}
