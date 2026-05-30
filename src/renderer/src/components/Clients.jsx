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
    document_type: 'cin',
    nom: '', prenom: '', raison_sociale: '',
    email: '', telephone: '', adresse: '', matricule_fiscale: '', cin_passport: ''
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
      setFormData({
        ...client,
        document_type: (client.cin_passport && !/^\d{8}$/.test(client.cin_passport)) ? 'passport' : 'cin'
      });
    } else {
      setFormData({
        id: null, type_client: 'physique', document_type: 'cin',
        nom: '', prenom: '', raison_sociale: '',
        email: '', telephone: '', adresse: '', matricule_fiscale: '', cin_passport: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.telephone && !isValidPhoneNumber(formData.telephone)) {
      return showToast('Numéro de téléphone invalide', 'error');
    }

    if (formData.type_client === 'physique' && formData.document_type === 'cin' && formData.cin_passport) {
      if (!/^\d{8}$/.test(formData.cin_passport)) {
        return showToast('Le CIN doit contenir exactement 8 chiffres.', 'error');
      }
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
                <th>Client</th>
                <th>Type</th>
                <th>Téléphone</th>
                <th>Identifiant</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: 'var(--border)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {client.type_client === 'physique' ? <User size={20} color="var(--primary)" /> : <Building size={20} color="var(--primary)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {client.type_client === 'physique' ? `${client.nom} ${client.prenom}` : client.raison_sociale}
                        </div>
                        {client.email && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {client.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: 'transparent', 
                      color: client.type_client === 'physique' ? 'var(--text-main)' : 'var(--primary)', 
                      border: `1px solid ${client.type_client === 'physique' ? 'var(--text-muted)' : 'var(--primary)'}` 
                    }}>
                      {client.type_client === 'physique' ? 'PHYSIQUE' : 'ENTREPRISE'}
                    </span>
                  </td>
                  <td>{client.telephone || '-'}</td>
                  <td>
                    {client.type_client === 'morale' 
                      ? (client.matricule_fiscale ? `MF: ${client.matricule_fiscale}` : '-') 
                      : (client.cin_passport ? `ID: ${client.cin_passport}` : '-')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-warning" onClick={() => handleOpenModal(client)} title="Modifier">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(client.id)} title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Aucun client trouvé.</td>
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
                <>
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
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label className="form-label">Type de pièce d'identité</label>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="radio" name="document_type" value="cin" checked={formData.document_type === 'cin'} onChange={e => setFormData({...formData, document_type: e.target.value, cin_passport: ''})} />
                        CIN
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="radio" name="document_type" value="passport" checked={formData.document_type === 'passport'} onChange={e => setFormData({...formData, document_type: e.target.value, cin_passport: ''})} />
                        Passeport
                      </label>
                    </div>
                    {formData.document_type === 'cin' ? (
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.cin_passport || ''} 
                        onChange={e => setFormData({...formData, cin_passport: e.target.value.replace(/\D/g, '')})} 
                        placeholder="Ex: 01234567" 
                        maxLength="8"
                      />
                    ) : (
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.cin_passport || ''} 
                        onChange={e => setFormData({...formData, cin_passport: e.target.value})} 
                        placeholder="Numéro de passeport" 
                      />
                    )}
                  </div>
                </>
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
