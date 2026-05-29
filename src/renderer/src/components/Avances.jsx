import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function Avances({ 
  avances, fetchAvances, employes, fetchDashboardData, 
  showToast, showConfirmDialog, closeConfirmDialog, selectedMonth, selectedYear 
}) {
  const [avanceDate, setAvanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [avanceEmploye, setAvanceEmploye] = useState('');
  const [avanceMontant, setAvanceMontant] = useState('');

  const handleAvanceSubmit = async (e) => {
    e.preventDefault(); 
    if(!avanceEmploye || !avanceMontant) return showToast("Veuillez sélectionner un employé et un montant.", "error");
    try { 
      await window.api.addAvance({ employe_id: avanceEmploye, date: avanceDate, montant: parseFloat(avanceMontant) }); 
      showToast("Avance enregistrée !"); 
      setAvanceMontant(''); 
      fetchAvances(); 
      fetchDashboardData(); 
    } catch(e) { showToast(e.message, 'error') }
  };

  const handleDeleteAvance = (id) => { 
    showConfirmDialog("Supprimer cette avance ?", async () => { 
      try { 
        await window.api.deleteAvance(id); 
        showToast("Avance supprimée !"); 
        fetchAvances(); 
        fetchDashboardData(); 
      } catch (e) { showToast(e.message, 'error') } 
      closeConfirmDialog(); 
    }); 
  };

  return (
    <>
      <div className="card">
        <h3>Donner une avance</h3>
        <form onSubmit={handleAvanceSubmit} className="form-row">
          <div className="form-group"><label>Date</label><input type="date" className="form-control" value={avanceDate} onChange={(e) => setAvanceDate(e.target.value)} required /></div>
          <div className="form-group"><label>Employé</label><select className="form-control" value={avanceEmploye || ''} onChange={(e) => setAvanceEmploye(e.target.value)} required><option value="" disabled>Sélectionner un employé</option>{(employes || []).map(emp => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}</select></div>
          <div className="form-group"><label>Montant (TND)</label><input type="number" step="1" className="form-control" value={avanceMontant || ''} onChange={(e) => setAvanceMontant(e.target.value)} placeholder="0.00" required /></div>
          <div className="form-group" style={{ flex: '0 0 auto', flexDirection: 'row' }}><button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Enregistrer</button></div>
        </form>
      </div>
      <div className="card">
        <h3>Historique des Avances ({selectedMonth}/{selectedYear})</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Employé</th><th style={{ textAlign: 'center' }}>Montant</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {(avances || []).map((av) => (<tr key={av.avance_id}><td>{av.date}</td><td style={{ fontWeight: '600' }}>{av.nom}</td><td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--danger)' }}>{av.montant.toFixed(2)} TND</td><td style={{ textAlign: 'right' }}><button className="btn btn-sm btn-danger" onClick={() => handleDeleteAvance(av.avance_id)}><Trash2 size={14} /></button></td></tr>))}
              {avances.length === 0 && (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucune avance.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
