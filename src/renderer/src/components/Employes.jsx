import React, { useState } from 'react';
import { Plus, Check, X, Pencil, Trash2, User, CreditCard, Palmtree } from 'lucide-react';

export default function Employes({ 
  employes, fetchEmployes, fetchPointages, fetchDashboardData, loading, 
  showToast, showConfirmDialog, closeConfirmDialog 
}) {
  const [nom, setNom] = useState(''); 
  const [cin, setCin] = useState(''); 
  const [categorie, setCategorie] = useState('CONTRAT');
  const [montant, setMontant] = useState(''); 
  const [tauxSupp, setTauxSupp] = useState(''); 
  const [joursConge, setJoursConge] = useState(''); 
  const [editingId, setEditingId] = useState(null);

  const handleEmployeSubmit = async (e) => {
    e.preventDefault(); 
    if (!nom || !montant) return showToast("Veuillez remplir le nom et la rémunération.", 'error')
    const safeCin = cin ? String(cin).trim() : "";
    if (categorie === 'CONTRAT' && safeCin !== "" && !/^\d{8}$/.test(safeCin)) return showToast("Le CIN doit contenir 8 chiffres.", 'error');

    const empData = { 
      nom: String(nom), cin: (categorie === 'CONTRAT' && safeCin !== "") ? safeCin : null, 
      categorie: String(categorie), 
      prix_journalier: categorie === 'SAISONNIER' ? parseFloat(montant || 0) : null, 
      salaire_mensuel: categorie === 'CONTRAT' ? parseFloat(montant || 0) : null, 
      taux_horaire_supp: parseFloat(tauxSupp || 0),
      jours_conge: categorie === 'CONTRAT' ? parseInt(joursConge || 0) : 0 
    }
    try {
      if (editingId) { await window.api.updateEmploye({ id: editingId, ...empData }); showToast("Employé modifié !") } 
      else { await window.api.addEmploye(empData); showToast("Employé ajouté !") }
      handleCancelEdit(); fetchEmployes(); fetchDashboardData();
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleEditClick = (emp) => {
    setEditingId(emp.id); setNom(emp.nom || ''); setCin(emp.cin ? String(emp.cin) : ''); 
    setCategorie(emp.categorie || 'CONTRAT'); 
    setMontant(emp.categorie === 'CONTRAT' ? (emp.salaire_mensuel || '') : (emp.prix_journalier || '')); 
    setTauxSupp(emp.taux_horaire_supp || ''); setJoursConge(emp.jours_conge || '');
  }

  const handleCancelEdit = () => { 
    setEditingId(null); setNom(''); setCin(''); setMontant(''); 
    setTauxSupp(''); setJoursConge(''); setCategorie('CONTRAT') 
  }

  const handleDeleteEmploye = (id) => { 
    showConfirmDialog("Voulez-vous supprimer cet employé ?", async () => { 
      try { 
        await window.api.deleteEmploye(id); 
        showToast("Employé supprimé !"); 
        fetchEmployes(); fetchPointages(); fetchDashboardData(); 
      } catch (e) { showToast(e.message, 'error') } 
      closeConfirmDialog(); 
    }); 
  }

  const handleCinChange = (e) => setCin(String(e.target.value).replace(/\D/g, ''));

  return (
    <>
      <div className={`card ${editingId ? 'editing' : ''}`}>
        <h3>{editingId ? `Modifier l'employé #${editingId}` : 'Enregistrer un nouvel employé'}</h3>
        <form onSubmit={handleEmployeSubmit} className="form-row">
          <div className="form-group"><label>Nom complet</label><input type="text" className="form-control" value={nom || ''} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Mohamed Ben Ali"/></div>
          <div className="form-group"><label>Type de contrat</label><select className="form-control" value={categorie || ''} onChange={(e) => setCategorie(e.target.value)}><option value="CONTRAT">Contrat Fixe</option><option value="SAISONNIER">Saisonnier</option></select></div>
          {categorie === 'CONTRAT' && (<div className="form-group"><label>Numéro CIN</label><input type="text" className="form-control" value={cin || ''} onChange={handleCinChange} placeholder="Ex: 01234567" maxLength="8"/></div>)}
          <div className="form-group"><label>{categorie === 'CONTRAT' ? 'Salaire Mensuel (TND)' : 'Prix Journalier (TND)'}</label><input type="number" step="0.1" className="form-control" value={montant || ''} onChange={(e) => setMontant(e.target.value)} placeholder="0.00"/></div>
          <div className="form-group"><label>Taux Heure Supp. (TND/h)</label><input type="number" step="0.1" className="form-control" value={tauxSupp || ''} onChange={(e) => setTauxSupp(e.target.value)} placeholder="Ex: 5.0" /></div>
          {categorie === 'CONTRAT' && (<div className="form-group"><label>Congés Annuels (Jours)</label><input type="number" step="1" className="form-control" value={joursConge || ''} onChange={(e) => setJoursConge(e.target.value)} placeholder="Ex: 21" /></div>)}
          <div className="form-group" style={{ flex: '0 0 auto', flexDirection: 'row', gap: '10px' }}>
            <button type="submit" className={`btn ${editingId ? 'btn-warning' : 'btn-primary'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{editingId ? <><Check size={18} /> Valider</> : <><Plus size={18} /> Ajouter</>}</button>
            {editingId && (<button type="button" className="btn btn-secondary" onClick={handleCancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><X size={18} /> Annuler</button>)}
          </div>
        </form>
      </div>
      <div className="card">
        <h3>Personnel Enregistré</h3>
        {loading ? <p>Chargement...</p> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Employé</th><th>Catégorie</th><th>Rémunération</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {(employes || []).map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: 'var(--border)', padding: '8px', borderRadius: '50%' }}><User size={20} color="var(--primary)" /></div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{emp.nom}</div>
                          {emp.categorie === 'CONTRAT' && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                              {Boolean(emp.cin) && <span style={{display:'flex', alignItems:'center', gap:'4px'}}><CreditCard size={12} /> CIN: {emp.cin}</span>}
                              {emp.jours_conge !== undefined && (<span style={{display:'flex', alignItems:'center', gap:'4px', color: 'var(--primary)', fontWeight: 'bold'}}><Palmtree size={12} /> Solde: {(emp.jours_conge || 0) - (emp.conges_total_pris || 0)} j restants</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${emp.categorie === 'CONTRAT' ? 'badge-contrat' : 'badge-saisonnier'}`}>{emp.categorie}</span></td>
                    <td>{emp.categorie === 'CONTRAT' ? `${emp.salaire_mensuel || 0} TND / Mois` : `${emp.prix_journalier || 0} TND / Jour`}<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Heure supp : {emp.taux_horaire_supp || 0} TND/h</span></td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-sm btn-warning" onClick={() => handleEditClick(emp)}><Pencil size={14} /></button><button className="btn btn-sm btn-danger" onClick={() => handleDeleteEmploye(emp.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {(!employes || employes.length === 0) && (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucun personnel enregistré.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
