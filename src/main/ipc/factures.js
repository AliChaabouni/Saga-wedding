import { ipcMain } from 'electron'
import db from '../database'

export function setupFacturesHandlers() {
  ipcMain.handle('get-factures', () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT f.*, c.nom, c.prenom, c.raison_sociale, c.type_client 
        FROM factures f 
        LEFT JOIN clients c ON f.client_id = c.id 
        ORDER BY f.id DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) return reject(err)
        
        const facturesList = rows || [];
        if (facturesList.length === 0) return resolve(facturesList);

        let completed = 0;
        facturesList.forEach(facture => {
          db.all(`SELECT * FROM facture_items WHERE facture_id = ?`, [facture.id], (err, items) => {
            facture.items = items || [];
            completed++;
            if (completed === facturesList.length) resolve(facturesList);
          });
        });
      })
    })
  })

  ipcMain.handle('add-facture', async (event, factureData) => {
    const { client_id, devis_id, date_creation, date_echeance, statut, total_ht, tva, total_ttc, notes, items } = factureData;
    
    // Generate numero (e.g. 2026/0001) independently for factures
    const year = new Date(date_creation).getFullYear() || new Date().getFullYear();
    const numero = await new Promise((resolve) => {
      db.get(`SELECT numero FROM factures WHERE numero LIKE ? ORDER BY id DESC LIMIT 1`, [`${year}/%`], (err, row) => {
        if (row && row.numero) {
          const lastNum = parseInt(row.numero.split('/')[1]);
          resolve(`${year}/${String(lastNum + 1).padStart(4, '0')}`);
        } else {
          resolve(`${year}/0001`);
        }
      });
    });

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO factures (numero, client_id, devis_id, date_creation, date_echeance, statut, total_ht, tva, total_ttc, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [numero, client_id, devis_id || null, date_creation, date_echeance, statut, total_ht, tva, total_ttc, notes],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            const factureId = this.lastID;
            
            if (items && items.length > 0) {
              const stmt = db.prepare(`INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES (?, ?, ?, ?, ?)`);
              items.forEach(item => {
                stmt.run([factureId, item.description, item.quantite, item.prix_unitaire, item.total]);
              });
              stmt.finalize((err) => {
                if (err) { db.run('ROLLBACK'); return reject(err); }
                db.run('COMMIT', () => resolve({ id: factureId, numero, ...factureData }));
              });
            } else {
              db.run('COMMIT', () => resolve({ id: factureId, numero, ...factureData }));
            }
          }
        )
      });
    })
  })

  ipcMain.handle('update-facture', (event, factureData) => {
    const { id, statut, total_ht, tva, total_ttc, notes, items } = factureData;
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE factures SET statut = ?, total_ht = ?, tva = ?, total_ttc = ?, notes = ? WHERE id = ?`,
          [statut, total_ht, tva, total_ttc, notes, id],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            
            db.run(`DELETE FROM facture_items WHERE facture_id = ?`, [id], function(err) {
              if (err) { db.run('ROLLBACK'); return reject(err); }
              
              if (items && items.length > 0) {
                const stmt = db.prepare(`INSERT INTO facture_items (facture_id, description, quantite, prix_unitaire, total) VALUES (?, ?, ?, ?, ?)`);
                items.forEach(item => {
                  stmt.run([id, item.description, item.quantite, item.prix_unitaire, item.total]);
                });
                stmt.finalize((err) => {
                  if (err) { db.run('ROLLBACK'); return reject(err); }
                  db.run('COMMIT', () => resolve({ success: true }));
                });
              } else {
                db.run('COMMIT', () => resolve({ success: true }));
              }
            });
          }
        )
      });
    })
  })

  ipcMain.handle('delete-facture', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM factures WHERE id = ?`, [id], function (err) {
        if (err) return reject(err)
        resolve({ success: true })
      })
    })
  })
}
