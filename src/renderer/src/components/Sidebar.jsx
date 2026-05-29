import React from 'react';
import { LayoutDashboard, Users, Calendar as CalendarIcon, Banknote, Shield, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ 
  isSidebarCollapsed, setIsSidebarCollapsed, 
  activeTab, handleTabChange, 
  currentUser, handleLogout 
}) {
  const menuItems = [ 
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, 
    { id: 'employes', icon: Users, label: 'Employés' }, 
    { id: 'pointage', icon: CalendarIcon, label: 'Calendrier' }, 
    { id: 'avances', icon: Banknote, label: 'Avances' }, 
    { id: 'utilisateurs', icon: Shield, label: 'Utilisateurs' } 
  ];

  return (
    <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        style={{
          position: 'absolute', top: '35px', right: '-15px',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          color: 'var(--primary)', borderRadius: '50%',
          width: '30px', height: '30px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease', zIndex: 1000
        }}
        title={isSidebarCollapsed ? 'Déplier le menu' : 'Plier le menu'}
      >
        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="sidebar-header">
        <img src={logoImg} alt="Logo" className="sidebar-logo" />
        <h2 className="sidebar-title">SAGA WEDDING</h2>
        <p className="sidebar-subtitle">Gestion Personnel</p>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => handleTabChange(item.id)} title={isSidebarCollapsed ? item.label : ''}>
              <Icon className="sidebar-item-icon" />
              <span className="sidebar-item-label">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        {currentUser && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '15px', 
            padding: '0 15px 15px 15px', marginBottom: '5px',
            borderBottom: '1px solid var(--border)', width: '100%', boxSizing: 'border-box'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', 
              backgroundColor: 'var(--badge-contrat-bg)', color: 'var(--primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 'bold', flexShrink: 0, border: '1px solid var(--primary)',
              textTransform: 'uppercase', fontSize: '14px'
            }}>
              {currentUser.email.charAt(0)}
            </div>
            <div className="sidebar-item-label" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connecté en tant que</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
          </div>
        )}

        <div 
          className="sidebar-item" 
          onClick={handleLogout} 
          title={isSidebarCollapsed ? 'Se déconnecter' : ''}
          style={{ color: 'var(--danger)' }}
        >
          <LogOut className="sidebar-item-icon" />
          <span className="sidebar-item-label">Se déconnecter</span>
        </div>
      </div>
    </div>
  );
}
