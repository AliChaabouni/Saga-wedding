import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, Building, X, Save } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';

export default function Clients({ showToast, showConfirmDialog, closeConfirmDialog }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    type_client: 'physique',
    nom: '', prenom: '', raison_sociale: '',
    email: '', telephone: '', adresse: '', matricule_fiscale: ''
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await window.api.getClients();
      setClients(data || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (client = null) => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        id: null, type_client: 'physique',
        nom: '', prenom: '', raison_sociale: '',
        email: '', telephone: '', adresse: '', matricule_fiscale: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.telephone && !isValidPhoneNumber(formData.telephone)) {
      return showToast('Numéro de téléphone invalide', 'error');
    }

    try {
      if (formData.id) {
        await window.api.updateClient(formData);
        showToast('Client mis à jour avec succès');
      } else {
        await window.api.addClient(formData);
        showToast('Client ajouté avec succès');
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    showConfirmDialog("Voulez-vous vraiment supprimer ce client ?", async () => {
      try {
        await window.api.deleteClient(id);
        showToast('Client supprimé');
        fetchClients();
      } catch (err) {
        showToast(err.message, 'error');
      }
      closeConfirmDialog();
    });
  };

  const filteredClients = clients.filter(c => 
    (c.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.raison_sociale?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Gestion des Clients</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Nouveau Client
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Rechercher un client..." 
            style={{ paddingLeft: '35px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Nom / Raison Sociale</th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>Matricule Fiscale</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td>
                    {client.type_client === 'physique' ? 
                      <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}><User size={12} style={{ marginRight: '4px' }}/> Physique</span> : 
                      <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}><Building size={12} style={{ marginRight: '4px' }}/> Entreprise</span>
                    }
                  </td>
                  <td>{client.type_client === 'physique' ? `${client.nom} ${client.prenom}` : client.raison_sociale}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.telephone || '-'}</td>
                  <td>{client.matricule_fiscale || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-icon btn-edit" onClick={() => handleOpenModal(client)} title="Modifier">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-icon btn-delete" onClick={() => handleDelete(client.id)} title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Aucun client trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '600px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{formData.id ? 'Modifier le Client' : 'Nouveau Client'}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)} style={{ margin: 0 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Type de client</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="radio" name="type_client" value="physique" checked={formData.type_client === 'physique'} onChange={e => setFormData({...formData, type_client: e.target.value})} />
                    Personne Physique
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="radio" name="type_client" value="morale" checked={formData.type_client === 'morale'} onChange={e => setFormData({...formData, type_client: e.target.value})} />
                    Entreprise (Morale)
                  </label>
                </div>
              </div>

              {formData.type_client === 'physique' ? (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Nom <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required={formData.type_client === 'physique'} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Prénom <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} required={formData.type_client === 'physique'} />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Raison Sociale <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={formData.raison_sociale} onChange={e => setFormData({...formData, raison_sociale: e.target.value})} required={formData.type_client === 'morale'} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Téléphone</label>
                  <PhoneInput
                    defaultCountry="TN"
                    className="form-control"
                    placeholder="Numéro de téléphone"
                    value={formData.telephone}
                    onChange={phone => setFormData({...formData, telephone: phone})}
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: 'none' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input type="text" className="form-control" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} />
              </div>

              {formData.type_client === 'morale' && (
                <div className="form-group">
                  <label className="form-label">Matricule Fiscale</label>
                  <input type="text" className="form-control" value={formData.matricule_fiscale} onChange={e => setFormData({...formData, matricule_fiscale: e.target.value})} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={16} /> Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
