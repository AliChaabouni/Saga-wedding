import React, { useState } from 'react';
import { LayoutDashboard, Users, Calendar as CalendarIcon, Banknote, Shield, LogOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, FileSpreadsheet, Briefcase } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({
  isSidebarCollapsed, setIsSidebarCollapsed,
  activeTab, handleTabChange,
  currentUser, handleLogout
}) {
  const [openSubMenus, setOpenSubMenus] = useState({});

  const toggleSubMenu = (id) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'employes', icon: Users, label: 'Employés' },
    { id: 'pointage', icon: CalendarIcon, label: 'Calendrier' },
    { 
      id: 'paie_group', 
      icon: Banknote, 
      label: 'Paie',
      subItems: [
        { id: 'avances', label: 'Avances' }
      ]
    },
    {
      id: 'facturation_group',
      icon: Briefcase,
      label: 'Facturation',
      subItems: [
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'devis', label: 'Devis', icon: FileText },
        { id: 'factures', label: 'Factures', icon: FileSpreadsheet }
      ]
    },
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
          if (item.subItems) {
            const isOpen = openSubMenus[item.id];
            const isSubItemActive = item.subItems.some(subItem => subItem.id === activeTab);
            return (
              <div key={item.id} className="sidebar-menu-group">
                <div 
                  className={`sidebar-item ${isSubItemActive && !isOpen ? 'active-parent' : ''}`} 
                  onClick={() => {
                    if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                    toggleSubMenu(item.id);
                  }}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <Icon className="sidebar-item-icon" />
                  <span className="sidebar-item-label">{item.label}</span>
                  {!isSidebarCollapsed && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  )}
                </div>
                {isOpen && !isSidebarCollapsed && (
                  <div className="sidebar-submenu">
                    {item.subItems.map(subItem => (
                      <div 
                        key={subItem.id} 
                        className={`sidebar-item sub-item ${activeTab === subItem.id ? 'active' : ''}`} 
                        onClick={() => handleTabChange(subItem.id)}
                      >
                        <span className="sidebar-item-label" style={{ paddingLeft: '5px' }}>{subItem.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

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
