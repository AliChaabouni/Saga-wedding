import { ipcMain } from 'electron'
import db from '../database'

export function setupDevisHandlers() {
  ipcMain.handle('get-devis', () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT d.*, c.nom, c.prenom, c.raison_sociale, c.type_client 
        FROM devis d 
        LEFT JOIN clients c ON d.client_id = c.id 
        ORDER BY d.id DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) return reject(err)
        
        // Fetch items for each devis
        const devisList = rows || [];
        if (devisList.length === 0) return resolve(devisList);

        let completed = 0;
        devisList.forEach(devis => {
          db.all(`SELECT * FROM devis_items WHERE devis_id = ?`, [devis.id], (err, items) => {
            devis.items = items || [];
            completed++;
            if (completed === devisList.length) resolve(devisList);
          });
        });
      })
    })
  })

  ipcMain.handle('get-next-devis-number', async (event, date) => {
    const year = new Date(date || new Date()).getFullYear();
    return new Promise((resolve) => {
      db.get(`SELECT numero FROM devis WHERE numero LIKE ? ORDER BY CAST(substr(numero, 6) AS INTEGER) DESC LIMIT 1`, [`${year}/%`], (err, row) => {
        if (row && row.numero) {
          const lastNum = parseInt(row.numero.split('/')[1]);
          resolve(`${year}/${String(lastNum + 1).padStart(4, '0')}`);
        } else {
          resolve(`${year}/0001`);
        }
      });
    });
  });

  ipcMain.handle('add-devis', async (event, devisData) => {
    const { numero, client_id, date_creation, date_validite, statut, total_ht, tva, total_ttc, notes, items } = devisData;
    
    const exists = await new Promise((resolve) => {
      db.get(`SELECT id FROM devis WHERE numero = ?`, [numero], (err, row) => resolve(!!row));
    });
    if (exists) {
      throw new Error(`Le numéro de devis ${numero} existe déjà.`);
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO devis (numero, client_id, date_creation, date_validite, statut, total_ht, tva, total_ttc, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [numero, client_id, date_creation, date_validite, statut, total_ht, tva, total_ttc, notes],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            const devisId = this.lastID;
            
            if (items && items.length > 0) {
              const stmt = db.prepare(`INSERT INTO devis_items (devis_id, description, quantite, prix_unitaire, total) VALUES (?, ?, ?, ?, ?)`);
              items.forEach(item => {
                stmt.run([devisId, item.description, item.quantite, item.prix_unitaire, item.total]);
              });
              stmt.finalize((err) => {
                if (err) { db.run('ROLLBACK'); return reject(err); }
                db.run('COMMIT', () => resolve({ id: devisId, numero, ...devisData }));
              });
            } else {
              db.run('COMMIT', () => resolve({ id: devisId, numero, ...devisData }));
            }
          }
        )
      });
    })
  })

  ipcMain.handle('update-devis', async (event, devisData) => {
    const { id, numero, statut, total_ht, tva, total_ttc, notes, items } = devisData;

    const exists = await new Promise((resolve) => {
      db.get(`SELECT id FROM devis WHERE numero = ? AND id != ?`, [numero, id], (err, row) => resolve(!!row));
    });
    if (exists) {
      throw new Error(`Le numéro de devis ${numero} existe déjà.`);
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE devis SET numero = ?, statut = ?, total_ht = ?, tva = ?, total_ttc = ?, notes = ? WHERE id = ?`,
          [numero, statut, total_ht, tva, total_ttc, notes, id],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            
            db.run(`DELETE FROM devis_items WHERE devis_id = ?`, [id], function(err) {
              if (err) { db.run('ROLLBACK'); return reject(err); }
              
              if (items && items.length > 0) {
                const stmt = db.prepare(`INSERT INTO devis_items (devis_id, description, quantite, prix_unitaire, total) VALUES (?, ?, ?, ?, ?)`);
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

  ipcMain.handle('delete-devis', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM devis WHERE id = ?`, [id], function (err) {
        if (err) return reject(err)
        resolve({ success: true })
      })
    })
  })
}
