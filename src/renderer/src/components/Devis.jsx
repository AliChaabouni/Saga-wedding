import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Printer, FileText, X, Save, Eye } from 'lucide-react';
import PdfPreviewModal from './PdfPreviewModal';
import { generateFactureOrDevisPDF } from '../utils/pdfGenerator';

export default function Devis({ showToast, showConfirmDialog, closeConfirmDialog }) {
  const [devis, setDevis] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, doc: null, filename: '' });
  const [formData, setFormData] = useState({
    id: null, numero: '', client_id: '', date_creation: new Date().toISOString().split('T')[0], 
    date_validite: '', statut: 'Brouillon', notes: 'Location matériels pour événement', items: []
  });

  const fetchDevis = async () => {
    setLoading(true);
    try {
      const data = await window.api.getDevis();
      setDevis(data || []);
      const clientsData = await window.api.getClients();
      setClients(clientsData || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevis(); }, []);

  const handleOpenModal = async (item = null) => {
    if (item) {
      setFormData({...item});
    } else {
      const nextNumero = await window.api.getNextDevisNumber(new Date().toISOString().split('T')[0]);
      setFormData({
        id: null, numero: nextNumero, client_id: '', date_creation: new Date().toISOString().split('T')[0], 
        date_validite: '', statut: 'Brouillon', notes: 'Location matériels pour événement', 
        items: [{ description: '', quantite: 1, prix_unitaire: 0, total: 0 }]
      });
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantite: 1, prix_unitaire: 0, total: 0 }]
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
      if (field === 'quantite' || field === 'prix_unitaire') {
        newItems[index].total = newItems[index].quantite * newItems[index].prix_unitaire;
      }
      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    const total_ht = formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tva = total_ht * 0.19; 
    const timbre = 1.000;
    const total_ttc = total_ht + tva + timbre;
    return { total_ht, tva, timbre, total_ttc };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id) return showToast("Veuillez sélectionner un client", 'error');
    
    const totals = calculateTotals();
    const dataToSave = { ...formData, ...totals };

    try {
      if (formData.id) {
        await window.api.updateDevis(dataToSave);
        showToast('Devis mis à jour avec succès');
      } else {
        await window.api.addDevis(dataToSave);
        showToast('Devis créé avec succès');
      }
      setIsModalOpen(false);
      fetchDevis();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    showConfirmDialog("Voulez-vous vraiment supprimer ce devis ?", async () => {
      try {
        await window.api.deleteDevis(id);
        showToast('Devis supprimé');
        fetchDevis();
      } catch (err) {
        showToast(err.message, 'error');
      }
      closeConfirmDialog();
    });
  };

  const handleGeneratePDF = async (devisItem) => {
    try {
      showToast("Génération du PDF en cours...", "success");
      const doc = await generateFactureOrDevisPDF('devis', devisItem);
      setPreviewModal({
        isOpen: true,
        doc: doc,
        filename: `Devis_${devisItem.numero.replace('/', '_')}.pdf`
      });
    } catch (err) {
      showToast("Erreur lors de la génération du PDF", "error");
    }
  };

  const createFactureFromDevis = async (devisItem) => {
    showConfirmDialog("Convertir ce devis en facture ?", async () => {
      try {
        const date_creation = new Date().toISOString().split('T')[0];
        const nextNumero = await window.api.getNextFactureNumber(date_creation);
        
        const factureData = {
          numero: nextNumero,
          client_id: devisItem.client_id,
          devis_id: devisItem.id,
          date_creation: date_creation,
          date_echeance: '',
          statut: 'Brouillon',
          total_ht: devisItem.total_ht,
          tva: devisItem.tva,
          total_ttc: devisItem.total_ttc,
          notes: `Généré depuis le devis ${devisItem.numero}`,
          items: devisItem.items
        };
        await window.api.addFacture(factureData);
        showToast('Facture générée avec succès');
        closeConfirmDialog();
      } catch(e) {
        showToast(e.message, 'error');
        closeConfirmDialog();
      }
    }, { confirmText: 'CONVERTIR', confirmIcon: 'check', confirmClass: 'btn-confirm-action' });
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Gestion des Devis</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Nouveau Devis
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
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Total TTC</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devis.map(item => {
                const clientName = item.type_client === 'physique' ? `${item.nom} ${item.prenom}` : item.raison_sociale;
                let statusClass = 'badge-status-brouillon';
                if(item.statut === 'Envoyé') statusClass = 'badge-status-envoye';
                else if(item.statut === 'Accepté') statusClass = 'badge-status-accepte';
                else if(item.statut === 'Refusé') statusClass = 'badge-status-refuse';
                
                return (
                  <tr key={item.id}>
                    <td><strong>{item.numero}</strong></td>
                    <td>{clientName}</td>
                    <td>{item.date_creation}</td>
                    <td><span className={`badge ${statusClass}`}>{item.statut}</span></td>
                    <td>{Number(item.total_ttc).toFixed(3)} TND</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-success" onClick={() => createFactureFromDevis(item)} title="Générer Facture">
                          <FileText size={14} />
                        </button>
                        <button className="btn btn-sm btn-info" onClick={() => handleGeneratePDF(item)} title="Aperçu & Télécharger PDF">
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
              {devis.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Aucun devis.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '800px', width: '90%', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{formData.id ? `Modifier Devis ${formData.numero}` : 'Nouveau Devis'}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Numéro <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={formData.numero || ''} onChange={e => setFormData({...formData, numero: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Client <span className="text-danger">*</span></label>
                  <select className="form-control" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} required>
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.type_client === 'physique' ? `${c.nom} ${c.prenom}` : c.raison_sociale}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Objet (affiché sur le PDF)</label>
                  <input type="text" className="form-control" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Ex: Location matériels pour événement" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date Création</label>
                  <input type="date" className="form-control" value={formData.date_creation} onChange={e => setFormData({...formData, date_creation: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Statut</label>
                  <select className="form-control" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                    <option value="Brouillon">Brouillon</option>
                    <option value="Envoyé">Envoyé</option>
                    <option value="Accepté">Accepté</option>
                    <option value="Refusé">Refusé</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Lignes du devis</h4>
                <div className="table-container" style={{ overflowX: 'auto', marginBottom: '10px' }}>
                  <table className="table" style={{ width: '100%', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ width: '100px' }}>Qté</th>
                        <th style={{ width: '150px' }}>Prix Unitaire</th>
                        <th style={{ width: '150px' }}>Total</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><input type="text" className="form-control" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} required style={{ width: '100%', minWidth: '150px' }} /></td>
                          <td><input type="number" className="form-control" value={item.quantite} onChange={e => handleItemChange(idx, 'quantite', e.target.value)} required min="1" style={{ width: '100%' }} /></td>
                          <td><input type="number" className="form-control" value={item.prix_unitaire} onChange={e => handleItemChange(idx, 'prix_unitaire', e.target.value)} required step="0.001" style={{ width: '100%' }} /></td>
                          <td><input type="text" className="form-control" value={item.total} readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontWeight: 'bold', width: '100%' }}/></td>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-main)', borderRadius: '4px' }}>
                <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total HT:</span> <strong>{Number(calculateTotals().total_ht).toFixed(3)} TND</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>TVA (19%):</span> <strong>{Number(calculateTotals().tva).toFixed(3)} TND</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Timbre:</span> <strong>{Number(calculateTotals().timbre).toFixed(3)} TND</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '1.1em' }}>
                    <span>Total TTC:</span> <strong>{Number(calculateTotals().total_ttc).toFixed(3)} TND</strong>
                  </div>
                </div>
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
