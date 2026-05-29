import { ipcMain } from 'electron'
import db from '../database'

export function setupUsersHandlers() {
  ipcMain.handle('login', (event, { email, password }) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id, email FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) return reject(err);
        if (row) resolve({ success: true, user: row });
        else reject(new Error("Email ou mot de passe incorrect."));
      });
    });
  });

  ipcMain.handle('get-users', () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, email FROM users ORDER BY id ASC`, [], (err, rows) => {
        if (err) return reject(err); resolve(rows || []);
      });
    });
  });

  ipcMain.handle('add-user', (event, { email, password }) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, password], function (err) {
        if (err) return reject(new Error("Cet email est déjà utilisé ou une erreur est survenue."));
        resolve({ success: true, id: this.lastID });
      });
    });
  });

  ipcMain.handle('update-user-password', (event, { id, password }) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [password, id], function (err) {
        if (err) return reject(err); resolve({ success: true });
      });
    });
  });

  ipcMain.handle('delete-user', (event, id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT email FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        if (row && row.email === 'ali.chaabouni@gmail.com') {
          return reject(new Error("Opération refusée : Le compte administrateur principal ne peut pas être supprimé."));
        }
        db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
          if (err) return reject(err); resolve({ success: true });
        });
      });
    });
  });
}
