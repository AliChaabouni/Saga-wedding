import { ipcMain } from 'electron'
import db from '../database'

export function setupEmployesHandlers() {
  ipcMain.handle('get-employes', () => {
    return new Promise((resolve, reject) => {
      const query = `SELECT e.*, (SELECT COUNT(id) FROM pointages WHERE employe_id = e.id AND est_conge = 1) as conges_total_pris FROM employes e ORDER BY e.id DESC`;
      db.all(query, [], (err, rows) => { if (err) return reject(err); resolve(rows || []); })
    })
  })

  ipcMain.handle('add-employe', async (event, employeData) => {
    const { nom, cin, categorie, prix_journalier, salaire_mensuel, taux_horaire_supp, jours_conge } = employeData;
    if (categorie === 'CONTRAT' && cin) {
      const existing = await new Promise((res) => db.get("SELECT id FROM employes WHERE cin = ?", [cin], (err, row) => res(row)));
      if (existing) return Promise.reject(new Error("Erreur : Ce numéro de CIN est déjà utilisé."));
    }
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO employes (nom, cin, categorie, prix_journalier, salaire_mensuel, taux_horaire_supp, jours_conge) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, cin, categorie, prix_journalier, salaire_mensuel, taux_horaire_supp, jours_conge],
        function (err) { if (err) return reject(err); resolve({ id: this.lastID, ...employeData }); }
      );
    });
  });

  ipcMain.handle('update-employe', async (event, employeData) => {
    const { id, nom, cin, categorie, prix_journalier, salaire_mensuel, taux_horaire_supp, jours_conge } = employeData;
    if (categorie === 'CONTRAT' && cin) {
      const existing = await new Promise((res) => db.get("SELECT id FROM employes WHERE cin = ? AND id != ?", [cin, id], (err, row) => res(row)));
      if (existing) return Promise.reject(new Error("Erreur : Ce CIN est déjà attribué."));
    }
    return new Promise((resolve, reject) => {
      db.run(`UPDATE employes SET nom = ?, cin = ?, categorie = ?, prix_journalier = ?, salaire_mensuel = ?, taux_horaire_supp = ?, jours_conge = ? WHERE id = ?`,
        [nom, cin, categorie, prix_journalier, salaire_mensuel, taux_horaire_supp, jours_conge, id],
        function (err) { if (err) return reject(err); resolve({ success: true }); }
      );
    });
  });

  ipcMain.handle('delete-employe', async (event, id) => {
    return new Promise((resolve, reject) => { db.run(`DELETE FROM employes WHERE id = ?`, [id], function (err) { if (err) return reject(err); resolve({ success: true }); }); });
  });
}
