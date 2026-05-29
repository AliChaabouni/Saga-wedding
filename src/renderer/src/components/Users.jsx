import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Pencil, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

export default function Users({ currentUser, showToast, showConfirmDialog, closeConfirmDialog }) {
  const [systemUsers, setSystemUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserPassword, setEditUserPassword] = useState('');

  const isAdmin = currentUser?.email === 'ali.chaabouni@gmail.com';

  const fetchSystemUsers = async () => { 
    try { setSystemUsers(await window.api.getUsers() || []) } 
    catch (e) { showToast(e.message, 'error') } 
  };

  useEffect(() => { fetchSystemUsers(); }, []);

  const handleAddSystemUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return showToast("Remplissez tous les champs", "error");
    try {
      await window.api.addUser({ email: newUserEmail, password: newUserPassword });
      showToast("Utilisateur ajouté !");
      setNewUserEmail(''); setNewUserPassword(''); setShowNewPassword(false);
      fetchSystemUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDeleteSystemUser = (id) => {
    showConfirmDialog("Voulez-vous vraiment supprimer cet accès ?", async () => {
      try {
        await window.api.deleteUser(id);
        showToast("Utilisateur supprimé !");
        fetchSystemUsers();
      } catch (e) { showToast(e.message, 'error') }
      closeConfirmDialog();
    });
  };

  const handleUpdatePassword = async (id) => {
    if (!editUserPassword) return showToast("Le mot de passe ne peut pas être vide.", "error");
    try {
      await window.api.updateUserPassword({ id, password: editUserPassword });
      showToast("Mot de passe mis à jour avec succès !");
      setEditingUserId(null); setEditUserPassword('');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <>
      {isAdmin && (
        <div className="card">
          <h3>Créer un nouvel accès (Login)</h3>
          <form onSubmit={handleAddSystemUser} className="form-row">
            <div className="form-group">
               <label>Email de connexion</label>
               <input type="email" className="form-control" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required style={{ boxSizing: 'border-box', width: '100%' }} />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input type={showNewPassword ? "text" : "password"} className="form-control" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Définir un mot de passe" required style={{ width: '100%', paddingRight: '35px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', display: 'flex' }}>
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ flex: '0 0 auto', flexDirection: 'row' }}>
               <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Ajouter</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Utilisateurs Autorisés</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Email</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {systemUsers.map(u => {
                const isSuperAdmin = u.email === 'ali.chaabouni@gmail.com';
                const canEdit = isAdmin || currentUser?.id === u.id; 
                const canDelete = isAdmin && !isSuperAdmin; 

                return (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                      {u.email} {isSuperAdmin && <span style={{fontSize:'10px', color:'var(--warning)'}}>(Admin)</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingUserId === u.id ? (
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'8px', alignItems:'center'}}>
                          <input type="text" className="form-control" style={{width:'150px', padding:'4px 8px'}} placeholder="Nouveau mot de passe" value={editUserPassword} onChange={e=>setEditUserPassword(e.target.value)} />
                          <button className="btn btn-sm btn-primary" onClick={() => handleUpdatePassword(u.id)} title="Enregistrer"><Check size={14}/></button>
                          <button className="btn btn-sm btn-secondary" onClick={() => {setEditingUserId(null); setEditUserPassword('');}} title="Annuler"><X size={14}/></button>
                        </div>
                      ) : (
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                          {canEdit && (
                             <button className="btn btn-sm btn-warning" onClick={() => {setEditingUserId(u.id); setEditUserPassword('');}} title="Modifier le mot de passe">
                               <Pencil size={14} />
                             </button>
                          )}
                          {canDelete && (
                             <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSystemUser(u.id)} title="Supprimer l'accès">
                               <Trash2 size={14} />
                             </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
