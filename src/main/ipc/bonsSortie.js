import { ipcMain } from 'electron'
import db from '../database'

export function setupBonsSortieHandlers() {
  ipcMain.handle('get-bons-sortie', () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT bons_sortie.*, employes.nom as employe_nom, factures.numero as facture_numero 
              FROM bons_sortie 
              LEFT JOIN employes ON bons_sortie.employe_id = employes.id 
              LEFT JOIN factures ON bons_sortie.facture_id = factures.id 
              ORDER BY bons_sortie.id DESC`, [], (err, rows) => {
        if (err) return reject(err)
        if (!rows || rows.length === 0) return resolve([])

        const promises = rows.map(bon => {
          return new Promise((res, rej) => {
            db.all(`SELECT * FROM bons_sortie_items WHERE bon_sortie_id = ?`, [bon.id], (errItems, items) => {
              if (errItems) return rej(errItems)
              bon.items = items || []
              res(bon)
            })
          })
        })

        Promise.all(promises)
          .then(results => resolve(results))
          .catch(err => reject(err))
      })
    })
  })

  ipcMain.handle('get-next-bon-sortie-number', async (event, date) => {
    const year = new Date(date || new Date()).getFullYear();
    return new Promise((resolve) => {
      db.get(`SELECT numero FROM bons_sortie WHERE numero LIKE ? ORDER BY CAST(substr(numero, 9) AS INTEGER) DESC LIMIT 1`, [`BS-${year}/%`], (err, row) => {
        if (row && row.numero) {
          const lastNum = parseInt(row.numero.split('/')[1]);
          resolve(`BS-${year}/${String(lastNum + 1).padStart(4, '0')}`);
        } else {
          resolve(`BS-${year}/0001`);
        }
      });
    });
  });

  ipcMain.handle('add-bon-sortie', async (event, bonData) => {
    const { numero, facture_id, employe_id, date_creation, notes, items } = bonData;
    
    const exists = await new Promise((resolve) => {
      db.get(`SELECT id FROM bons_sortie WHERE numero = ?`, [numero], (err, row) => resolve(!!row));
    });
    if (exists) {
      throw new Error(`Le numéro de bon de sortie ${numero} existe déjà.`);
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO bons_sortie (numero, facture_id, employe_id, date_creation, notes) VALUES (?, ?, ?, ?, ?)`,
          [numero, facture_id || null, employe_id || null, date_creation, notes],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            const bonId = this.lastID;
            
            if (items && items.length > 0) {
              const stmt = db.prepare(`INSERT INTO bons_sortie_items (bon_sortie_id, description, quantite) VALUES (?, ?, ?)`);
              items.forEach(item => {
                stmt.run([bonId, item.description, item.quantite]);
              });
              stmt.finalize((errFinalize) => {
                if (errFinalize) { db.run('ROLLBACK'); return reject(errFinalize); }
                db.run('COMMIT');
                resolve({ id: bonId, ...bonData });
              });
            } else {
              db.run('COMMIT');
              resolve({ id: bonId, ...bonData });
            }
          }
        )
      })
    })
  })

  ipcMain.handle('update-bon-sortie', async (event, bonData) => {
    const { id, numero, facture_id, employe_id, date_creation, notes, items } = bonData;

    const exists = await new Promise((resolve) => {
      db.get(`SELECT id FROM bons_sortie WHERE numero = ? AND id != ?`, [numero, id], (err, row) => resolve(!!row));
    });
    if (exists) {
      throw new Error(`Le numéro de bon de sortie ${numero} existe déjà.`);
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE bons_sortie SET numero = ?, facture_id = ?, employe_id = ?, date_creation = ?, notes = ? WHERE id = ?`,
          [numero, facture_id || null, employe_id || null, date_creation, notes, id],
          function (err) {
            if (err) { db.run('ROLLBACK'); return reject(err); }
            
            db.run(`DELETE FROM bons_sortie_items WHERE bon_sortie_id = ?`, [id], (errDel) => {
              if (errDel) { db.run('ROLLBACK'); return reject(errDel); }
              
              if (items && items.length > 0) {
                const stmt = db.prepare(`INSERT INTO bons_sortie_items (bon_sortie_id, description, quantite) VALUES (?, ?, ?)`);
                items.forEach(item => {
                  stmt.run([id, item.description, item.quantite]);
                });
                stmt.finalize((errFinalize) => {
                  if (errFinalize) { db.run('ROLLBACK'); return reject(errFinalize); }
                  db.run('COMMIT');
                  resolve({ success: true });
                });
              } else {
                db.run('COMMIT');
                resolve({ success: true });
              }
            });
          }
        )
      })
    })
  })

  ipcMain.handle('delete-bon-sortie', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM bons_sortie WHERE id = ?`, [id], function (err) {
        if (err) return reject(err)
        resolve({ success: true })
      })
    })
  })
}
