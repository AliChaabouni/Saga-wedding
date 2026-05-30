import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Printer, X, Save, Eye } from 'lucide-react';
import PdfPreviewModal from './PdfPreviewModal';
import { generateBonSortiePDF } from '../utils/pdfGenerator';

export default function BonsSortie({ showToast, showConfirmDialog, closeConfirmDialog }) {
  const [bons, setBons] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, doc: null, filename: '' });
  const [formData, setFormData] = useState({
    id: null, numero: '', facture_id: '', employe_id: '', date_creation: new Date().toISOString().split('T')[0], 
    notes: 'Sortie matériel', items: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await window.api.getBonsSortie();
      setBons(data || []);
      const employesData = await window.api.getEmployes();
      setEmployes(employesData || []);
      const facturesData = await window.api.getFactures();
      setFactures(facturesData || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = async (item = null) => {
    if (item) {
      setFormData({...item});
    } else {
      const nextNumero = await window.api.getNextBonSortieNumber(new Date().toISOString().split('T')[0]);
      setFormData({
        id: null, numero: nextNumero, facture_id: '', employe_id: '', date_creation: new Date().toISOString().split('T')[0], 
        notes: 'Sortie matériel', 
        items: [{ description: '', quantite: 1 }]
      });
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantite: 1 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employe_id) return showToast("Veuillez sélectionner un employé responsable", 'error');
    
    try {
      if (formData.id) {
        await window.api.updateBonSortie(formData);
        showToast('Bon de sortie mis à jour avec succès');
      } else {
        await window.api.addBonSortie(formData);
        showToast('Bon de sortie créé avec succès');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    showConfirmDialog("Voulez-vous vraiment supprimer ce bon de sortie ?", async () => {
      try {
        await window.api.deleteBonSortie(id);
        showToast('Bon de sortie supprimé');
        fetchData();
      } catch (err) {
        showToast(err.message, 'error');
      }
      closeConfirmDialog();
    });
  };

  const handleGeneratePDF = async (bonItem) => {
    try {
      showToast("Génération du PDF en cours...", "success");
      const doc = await generateBonSortiePDF(bonItem);
      setPreviewModal({
        isOpen: true,
        doc: doc,
        filename: `Bon_de_Sortie_${bonItem.numero.replace('/', '_')}.pdf`
      });
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la génération du PDF", "error");
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Bons de Sortie</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Nouveau Bon de Sortie
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Employé/Livreur</th>
                <th>Lié à la Facture</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bons.map(item => {
                const employeName = item.employe_id ? item.employe_nom : 'Non assigné';
                return (
                  <tr key={item.id}>
                    <td><strong>{item.numero}</strong></td>
                    <td>{employeName}</td>
                    <td>{item.facture_numero ? `Facture ${item.facture_numero}` : '-'}</td>
                    <td>{item.date_creation}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-info" onClick={() => handleGeneratePDF(item)} title="Aperçu PDF">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-sm btn-warning" onClick={() => handleOpenModal(item)} title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {bons.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Aucun bon de sortie.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '800px', width: '90%', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{formData.id ? `Modifier Bon de Sortie ${formData.numero}` : 'Nouveau Bon de Sortie'}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Numéro <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={formData.numero || ''} onChange={e => setFormData({...formData, numero: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Employé (Livreur/Responsable) <span className="text-danger">*</span></label>
                  <select className="form-control" value={formData.employe_id} onChange={e => setFormData({...formData, employe_id: e.target.value})} required>
                    <option value="">Sélectionner un employé</option>
                    {employes.map(e => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Lier à une Facture (Optionnel)</label>
                  <select className="form-control" value={formData.facture_id} onChange={e => setFormData({...formData, facture_id: e.target.value})}>
                    <option value="">Aucune</option>
                    {factures.map(f => (
                      <option key={f.id} value={f.id}>{f.numero}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={formData.date_creation} onChange={e => setFormData({...formData, date_creation: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Objet / Notes (affiché sur le PDF)</label>
                  <input type="text" className="form-control" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Ex: Sortie matériel pour l'événement X" />
                </div>
              </div>

              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Liste du matériel</h4>
                <div className="table-container" style={{ overflowX: 'auto', marginBottom: '10px' }}>
                  <table className="table" style={{ width: '100%', minWidth: '400px' }}>
                    <thead>
                      <tr>
                        <th>Désignation</th>
                        <th style={{ width: '150px' }}>Quantité</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><input type="text" className="form-control" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} required style={{ width: '100%', minWidth: '150px' }} /></td>
                          <td><input type="number" className="form-control" value={item.quantite} onChange={e => handleItemChange(idx, 'quantite', e.target.value)} required min="1" style={{ width: '100%' }} /></td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16}/> Ajouter une ligne</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={16} /> Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <PdfPreviewModal 
        isOpen={previewModal.isOpen} 
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        doc={previewModal.doc}
        filename={previewModal.filename}
      />
    </div>
  );
}
