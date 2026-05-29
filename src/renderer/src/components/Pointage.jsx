import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Moon, Star, X, Trash2, Save } from 'lucide-react';

export default function Pointage({
  pointages, fetchPointages,
  employes, fetchEmployes,
  joursFeries, fetchJoursFeries,
  ramadanPeriods, fetchRamadanPeriods,
  fetchDashboardData,
  showToast, showConfirmDialog, closeConfirmDialog
}) {
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();

  const isDateInRamadan = (dateStr) => ramadanPeriods.some(p => dateStr >= p.date_debut && dateStr <= p.date_fin);

  const getDefaultTimes = (dateStr) => {
    if (!dateStr) return { entree: '08:00', sortie: '16:00' };
    const d = new Date(dateStr).getUTCDay();
    const isWeekend = (d === 0 || d === 6);
    
    if (isDateInRamadan(dateStr)) {
      return isWeekend ? { entree: '08:00', sortie: '13:00' } : { entree: '08:00', sortie: '14:00' };
    }
    return isWeekend ? { entree: '08:00', sortie: '14:00' } : { entree: '08:00', sortie: '16:00' }; 
  };

  const calculateHours = (entree, sortie, dateStr) => {
    if (!entree || !sortie || !dateStr) return { normales: 0, supp: 0 };
    const [hE, mE] = entree.split(':').map(Number);
    const [hS, mS] = sortie.split(':').map(Number);
    let totalMinutes = (hS * 60 + mS) - (hE * 60 + mE);
    if (totalMinutes < 0) totalMinutes += 24 * 60; 

    const totalHours = totalMinutes / 60;
    const day = new Date(dateStr).getUTCDay();
    const isWeekend = (day === 0 || day === 6);

    let maxNormales = 8;
    if (isDateInRamadan(dateStr)) {
      maxNormales = isWeekend ? 5 : 6;
    } else {
      maxNormales = isWeekend ? 6 : 8;
    }

    const normales = Math.min(totalHours, maxNormales);
    const supp = Math.max(0, totalHours - maxNormales);

    return { normales, supp };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ pointage_id: null, employe_id: '', date: '', heure_entree: '', heure_sortie: '', heures_normales: 0, heures_supp: 0, est_conge: false });

  const [isFerieModalOpen, setIsFerieModalOpen] = useState(false);
  const [ferieDate, setFerieDate] = useState('');
  const [ferieNom, setFerieNom] = useState('');
  const [feriePaye, setFeriePaye] = useState(true);

  const [isRamadanModalOpen, setIsRamadanModalOpen] = useState(false);
  const [ramadanDebut, setRamadanDebut] = useState('');
  const [ramadanFin, setRamadanFin] = useState('');

  const handleTimeChange = (field, value) => {
    const newData = { ...modalData, [field]: value };
    const { normales, supp } = calculateHours(newData.heure_entree, newData.heure_sortie, newData.date);
    setModalData({ ...newData, heures_normales: normales, heures_supp: supp });
  };

  const sortedPointages = [...(pointages || [])].sort((a, b) => a.date.localeCompare(b.date));
  const consumedConges = {};
  const calendarEvents = sortedPointages.map(p => {
    let titleContent = "";
    let estSansSolde = false;

    if (p.est_conge) { 
      if (!consumedConges[p.employe_id]) consumedConges[p.employe_id] = 0;
      consumedConges[p.employe_id]++;
      
      const emp = employes.find(e => e.id === p.employe_id);
      const maxConges = emp ? (emp.jours_conge || 0) : 0;
      
      if (consumedConges[p.employe_id] > maxConges) {
        estSansSolde = true;
      }
      
      titleContent = estSansSolde ? "(SANS SOLDE)" : "(CONGÉ)"; 
    } 
    else {
      const horaires = (p.heure_entree && p.heure_sortie) ? `${p.heure_entree}-${p.heure_sortie} ` : "";
      const suppStr = p.heures_supp > 0 ? ` + ${p.heures_supp}h` : "";
      titleContent = `${horaires}(${p.heures_normales}h${suppStr})`;
    }

    let bgColor = p.est_conge 
      ? (estSansSolde ? '#d32f2f' : '#2ecc71') 
      : (p.categorie === 'CONTRAT' ? 'var(--primary)' : 'var(--text-muted)');

    return { 
      id: p.pointage_id.toString(), 
      title: `${p.nom} ${titleContent}`, 
      date: p.date, 
      backgroundColor: bgColor, 
      borderColor: 'transparent', 
      textColor: (p.categorie === 'CONTRAT' && !p.est_conge) ? '#000' : '#fff', 
      extendedProps: { ...p, est_sans_solde: estSansSolde } 
    }
  });

  const handleDateClick = (info) => {
    if (employes.length === 0) return showToast("Ajoutez un employé d'abord.", 'error');
    if (info.dateStr > todayStr) return showToast("Vous ne pouvez pas pointer un jour futur.", 'error');
    
    const { entree, sortie } = getDefaultTimes(info.dateStr);
    const { normales, supp } = calculateHours(entree, sortie, info.dateStr);

    setModalData({ 
      pointage_id: null, employe_id: '', date: info.dateStr, 
      heure_entree: entree, heure_sortie: sortie, heures_normales: normales, heures_supp: supp, est_conge: false 
    }); 
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const p = info.event.extendedProps; 
    const { entree, sortie } = getDefaultTimes(p.date);
    const hEntree = p.heure_entree || (p.est_conge ? '' : entree);
    const hSortie = p.heure_sortie || (p.est_conge ? '' : sortie);

    setModalData({ 
      pointage_id: p.pointage_id, employe_id: p.employe_id, date: p.date, 
      heure_entree: hEntree, heure_sortie: hSortie, heures_normales: p.heures_normales, heures_supp: p.heures_supp, est_conge: Boolean(p.est_conge) 
    }); 
    setIsModalOpen(true);
  };

  const handleCheckboxConge = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) { setModalData({...modalData, est_conge: true, heure_entree: '', heure_sortie: '', heures_normales: 8, heures_supp: 0 }); } 
    else {
      const { entree, sortie } = getDefaultTimes(modalData.date);
      const { normales, supp } = calculateHours(entree, sortie, modalData.date);
      setModalData({...modalData, est_conge: false, heure_entree: entree, heure_sortie: sortie, heures_normales: normales, heures_supp: supp });
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault(); 
    try { 
      await window.api.savePointage({ 
        pointage_id: modalData.pointage_id, employe_id: modalData.employe_id, date: modalData.date, 
        heure_entree: modalData.est_conge ? '' : modalData.heure_entree, heure_sortie: modalData.est_conge ? '' : modalData.heure_sortie, 
        heures_normales: modalData.heures_normales, heures_supp: modalData.heures_supp, est_conge: modalData.est_conge 
      }); 
      setIsModalOpen(false); 
      showToast("Pointage enregistré !"); 
      fetchPointages(); 
      fetchDashboardData(); 
      fetchEmployes(); 
    } catch (e) { showToast(e.message, 'error') }
  };

  const handleDeletePointage = () => { 
    showConfirmDialog("Supprimer ce pointage ?", async () => { 
      try { 
        await window.api.deletePointage(modalData.pointage_id); 
        setIsModalOpen(false); 
        showToast("Pointage supprimé !"); 
        fetchPointages(); 
        fetchDashboardData(); 
        fetchEmployes(); 
      } catch (e) { showToast(e.message, 'error') } 
      closeConfirmDialog(); 
    }); 
  };

  const handleAddFerie = async (e) => {
    e.preventDefault();
    if(!ferieDate || !ferieNom) return showToast("Remplissez tous les champs", "error");

    const isSunday = new Date(ferieDate).getUTCDay() === 0;
    if (isSunday && !feriePaye) {
      return showToast("Impossible d'ajouter un jour férié non payé sur un Dimanche.", "error");
    }

    try {
      await window.api.addJourFerie({ date: ferieDate, nom: ferieNom, est_paye: feriePaye });
      showToast("Jour férié enregistré !");
      setFerieDate(''); setFerieNom(''); setFeriePaye(true);
      fetchJoursFeries(); fetchDashboardData();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDeleteFerie = (date) => {
    showConfirmDialog("Supprimer ce jour férié ?", async () => {
      try {
        await window.api.deleteJourFerie(date);
        showToast("Jour férié supprimé !");
        fetchJoursFeries(); fetchDashboardData();
      } catch (e) { showToast(e.message, 'error') }
      closeConfirmDialog();
    });
  };

  return (
    <>
      <div className="card calendar-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Pointages & Calendrier</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => setIsRamadanModalOpen(true)} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <Moon size={16} /> Périodes Ramadan
            </button>
            <button className="btn btn-warning" onClick={() => setIsFerieModalOpen(true)} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <Star size={16} /> Jours Fériés
            </button>
          </div>
        </div>
        <FullCalendar
          plugins={[ dayGridPlugin, interactionPlugin ]}
          initialView="dayGridMonth" locale="fr" firstDay={1}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }} buttonIcons={false} 
          buttonText={{ today: "Aujourd'hui", month: 'Mois', prev: '‹', next: '›' }}
          events={calendarEvents} 
          dateClick={handleDateClick} 
          eventClick={handleEventClick} 
          height="85vh"
          dayCellContent={(arg) => {
            const y = arg.date.getFullYear();
            const m = String(arg.date.getMonth() + 1).padStart(2, '0');
            const d = String(arg.date.getDate()).padStart(2, '0');
            const dateString = `${y}-${m}-${d}`;

            const ferie = joursFeries.find(jf => jf.date === dateString);
            const ramadan = isDateInRamadan(dateString);

            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 4px' }}>
                <span>{arg.dayNumberText}</span>
                <div>
                  {ramadan && (
                    <span title="Période de Ramadan (Horaires réduits)" style={{ fontSize: '14px', color: 'var(--primary)', marginRight: '4px' }}>
                      🌙
                    </span>
                  )}
                  {ferie && (
                    <span 
                      title={`${ferie.nom} ${ferie.est_paye ? '(Payé)' : '(Non Payé)'}`} 
                      style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--primary)' }}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setIsFerieModalOpen(true); 
                      }}
                    >
                      {ferie.est_paye ? '🌟' : '⭐'}
                    </span>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{modalData.pointage_id ? 'Modifier le Pointage' : 'Nouveau Pointage'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleSaveModal}>
              <div className="form-group mb-3">
                <label>Date</label>
                <input type="date" className="form-control" value={modalData.date || ''} max={todayStr}
                  onChange={(e) => {
                    const newDate = e.target.value; let newEntree = modalData.heure_entree; let newSortie = modalData.heure_sortie;
                    if (!modalData.pointage_id && !modalData.est_conge) { const def = getDefaultTimes(newDate); newEntree = def.entree; newSortie = def.sortie; }
                    const { normales, supp } = calculateHours(newEntree, newSortie, newDate);
                    setModalData({...modalData, date: newDate, heure_entree: newEntree, heure_sortie: newSortie, heures_normales: normales, heures_supp: supp});
                  }} required />
              </div>
              <div className="form-group mb-3">
                <label>Employé</label>
                <select className="form-control" value={modalData.employe_id || ''} onChange={(e) => setModalData({...modalData, employe_id: e.target.value})} required>
                  <option value="" disabled>Sélectionner un employé</option>
                  {(employes || []).map(emp => <option key={emp.id} value={emp.id}>{emp.nom} ({emp.categorie})</option>)}
                </select>
              </div>
              
              {modalData.employe_id && employes.find(e => e.id === Number(modalData.employe_id))?.categorie === 'CONTRAT' && (
                (() => {
                  const empActuel = employes.find(e => e.id === Number(modalData.employe_id));
                  const solde = (empActuel.jours_conge || 0) - (empActuel.conges_total_pris || 0);
                  const isNegative = solde <= 0 && !modalData.est_conge;
                  
                  const ferieDuJour = joursFeries.find(jf => jf.date === modalData.date);
                  const isFeriePaye = ferieDuJour && ferieDuJour.est_paye === 1;

                  if (isFeriePaye) {
                    return (
                      <div className="form-group mb-3" style={{ padding: '10px', backgroundColor: 'var(--badge-contrat-bg)', borderRadius: '4px', border: '1px solid var(--primary)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🌟 <span>Impossible de poser un congé : Ce jour est un férié payé ({ferieDuJour.nom}).</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="form-group mb-3" style={{ padding: '10px', backgroundColor: 'var(--badge-contrat-bg)', borderRadius: '4px', border: '1px solid var(--primary)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, color: 'var(--primary)' }}>
                        <input type="checkbox" checked={modalData.est_conge} onChange={handleCheckboxConge} style={{ width: '18px', height: '18px' }} />
                        Marquer ce jour comme "Congé"
                      </label>
                      {isNegative && (
                        <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '6px', fontWeight: 'bold' }}>
                          ⚠️ Solde épuisé. Ce congé sera autorisé mais le solde deviendra négatif (Congé sans solde avec retenue).
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {!modalData.est_conge && (
                <>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Heure d'entrée</label>
                      <input type="time" className="form-control" value={modalData.heure_entree || ''} onChange={(e) => handleTimeChange('heure_entree', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Heure de sortie</label>
                      <input type="time" className="form-control" value={modalData.heure_sortie || ''} onChange={(e) => handleTimeChange('heure_sortie', e.target.value)} required />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', padding: '10px', backgroundColor: 'var(--border)', borderRadius: '4px' }}>
                    <div style={{ flex: 1, fontSize: '13px' }}><span style={{color: 'var(--text-muted)'}}>Heures Normales :</span> <strong style={{fontSize:'15px', color: 'var(--text-main)'}}>{modalData.heures_normales || 0} h</strong></div>
                    <div style={{ flex: 1, fontSize: '13px' }}><span style={{color: 'var(--warning)'}}>Heures Supp. :</span> <strong style={{fontSize:'15px', color: 'var(--warning)'}}>{modalData.heures_supp || 0} h</strong></div>
                  </div>
                </>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: modalData.est_conge ? '20px' : '0' }}>
                {modalData.pointage_id ? <button type="button" className="btn btn-danger" onClick={handleDeletePointage} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Trash2 size={16} /> Supprimer</button> : <div></div>}
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={16} /> Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFerieModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems:'center', gap:'8px' }}><Star size={20} color="var(--primary)" /> Gestion des Jours Fériés</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsFerieModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            
            <form onSubmit={handleAddFerie} className="form-row" style={{ marginBottom: '25px', backgroundColor: 'var(--table-header)', padding: '15px', borderRadius: '8px' }}>
              <div className="form-group"><label>Date du jour férié</label><input type="date" className="form-control" value={ferieDate} onChange={e => setFerieDate(e.target.value)} required /></div>
              <div className="form-group"><label>Nom / Libellé</label><input type="text" className="form-control" value={ferieNom} onChange={e => setFerieNom(e.target.value)} placeholder="Ex: Fête du Travail" required /></div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px', flexBasis: '100%' }}>
                 <input type="checkbox" checked={feriePaye} onChange={e => setFeriePaye(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                 <label style={{ margin: 0, cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px' }}>Ce jour est <strong>Payé</strong></label>
              </div>
              <div className="form-group" style={{ flexBasis: '100%', marginTop: '10px' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ajouter ce jour férié</button></div>
            </form>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Date</th><th>Nom</th><th>Type</th><th style={{textAlign: 'right'}}>Action</th></tr></thead>
                <tbody>
                  {joursFeries.map(jf => (
                    <tr key={jf.date}>
                      <td>{jf.date}</td>
                      <td style={{fontWeight: 'bold'}}>{jf.nom}</td>
                      <td>{jf.est_paye ? <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>Payé 🌟</span> : <span style={{color: 'var(--warning)', fontWeight: 'bold'}}>Non Payé ⭐</span>}</td>
                      <td style={{textAlign: 'right'}}><button className="btn btn-sm btn-danger" onClick={() => handleDeleteFerie(jf.date)}><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                  {joursFeries.length === 0 && (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucun jour férié enregistré.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isRamadanModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems:'center', gap:'8px' }}><Moon size={20} color="var(--primary)" /> Périodes de Ramadan</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsRamadanModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if(ramadanDebut > ramadanFin) return showToast("Date de fin invalide", "error");
              try {
                await window.api.addPeriodeRamadan({ date_debut: ramadanDebut, date_fin: ramadanFin });
                showToast("Période enregistrée !"); setRamadanDebut(''); setRamadanFin('');
                fetchRamadanPeriods(); fetchDashboardData();
              } catch(e) { showToast(e.message, 'error') }
            }} className="form-row" style={{ marginBottom: '25px', backgroundColor: 'var(--table-header)', padding: '15px', borderRadius: '8px' }}>
              <div className="form-group"><label>Date de début</label><input type="date" className="form-control" value={ramadanDebut} onChange={e => setRamadanDebut(e.target.value)} required /></div>
              <div className="form-group"><label>Date de fin</label><input type="date" className="form-control" value={ramadanFin} onChange={e => setRamadanFin(e.target.value)} required /></div>
              <div className="form-group" style={{ flexBasis: '100%', marginTop: '10px' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ajouter cette période</button></div>
            </form>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Début</th><th>Fin</th><th style={{textAlign: 'right'}}>Action</th></tr></thead>
                <tbody>
                  {ramadanPeriods.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{p.date_debut}</td>
                      <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{p.date_fin}</td>
                      <td style={{textAlign: 'right'}}>
                        <button className="btn btn-sm btn-danger" onClick={() => {
                          showConfirmDialog("Supprimer cette période ?", async () => {
                            try { await window.api.deletePeriodeRamadan(p.id); fetchRamadanPeriods(); fetchDashboardData(); } catch(e) {}
                            closeConfirmDialog();
                          });
                        }}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {ramadanPeriods.length === 0 && (<tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucune période configurée.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
