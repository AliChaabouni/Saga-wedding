import { useState, useEffect } from 'react';
import './assets/main.css';

import { Sun, Moon, CheckCircle, AlertCircle, Trash2, X } from 'lucide-react';

import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Employes from './components/Employes';
import Pointage from './components/Pointage';
import Avances from './components/Avances';
import Users from './components/Users';
import Clients from './components/Clients';
import Devis from './components/Devis';
import Factures from './components/Factures';
import BonsSortie from './components/BonsSortie';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    let cleanMessage = message;
    if (typeof cleanMessage === 'string' && cleanMessage.includes('Error invoking remote method')) {
      cleanMessage = cleanMessage.replace(/^Error invoking remote method '.*?': Error: /, '');
    }
    setToast({ visible: true, message: cleanMessage, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null, confirmText: 'DELETE', confirmIcon: 'trash', confirmClass: 'btn-confirm-delete' });
  const showConfirmDialog = (message, onConfirm, options = {}) => {
    setConfirmDialog({ 
      isOpen: true, message, onConfirm,
      confirmText: options.confirmText || 'DELETE',
      confirmIcon: options.confirmIcon || 'trash',
      confirmClass: options.confirmClass || 'btn-confirm-delete'
    });
  };
  const closeConfirmDialog = () => setConfirmDialog({ isOpen: false, message: '', onConfirm: null, confirmText: 'DELETE', confirmIcon: 'trash', confirmClass: 'btn-confirm-delete' });

  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pointages, setPointages] = useState([]);
  const [joursFeries, setJoursFeries] = useState([]);
  const [ramadanPeriods, setRamadanPeriods] = useState([]);
  const [avances, setAvances] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [dashboardData, setDashboardData] = useState([]);
  const [exportEmployeId, setExportEmployeId] = useState('');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(new Date().getFullYear()));
    setExportEmployeId('');
  };

  useEffect(() => { 
    document.documentElement.setAttribute('data-theme', theme); 
    localStorage.setItem('theme', theme); 
  }, [theme]);
  
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const fetchEmployes = async () => { setLoading(true); try { setEmployes(await window.api.getEmployes() || []) } catch (e) { showToast(e.message, 'error') } finally { setLoading(false) } };
  const fetchPointages = async () => { try { setPointages(await window.api.getAllPointages() || []) } catch (e) { showToast(e.message, 'error') } };
  const fetchJoursFeries = async () => { try { setJoursFeries(await window.api.getJoursFeries() || []) } catch (e) { showToast(e.message, 'error') } };
  const fetchRamadanPeriods = async () => { try { setRamadanPeriods(await window.api.getPeriodesRamadan() || []) } catch(e) { } };
  const fetchAvances = async () => { try { setAvances(await window.api.getAvances(`${selectedYear}-${selectedMonth}`) || []) } catch (e) { showToast(e.message, 'error') } };
  const fetchDashboardData = async () => { try { setDashboardData(await window.api.getDashboardData(`${selectedYear}-${selectedMonth}`) || []) } catch (e) { showToast(e.message, 'error') } };

  useEffect(() => { 
    if(isAuthenticated) {
      fetchEmployes(); fetchPointages(); fetchJoursFeries(); fetchRamadanPeriods(); 
    }
  }, [isAuthenticated]);
  
  useEffect(() => { 
    if(isAuthenticated) {
      if (activeTab === 'dashboard') fetchDashboardData(); 
      if (activeTab === 'avances') fetchAvances(); 
    }
  }, [activeTab, selectedMonth, selectedYear, isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); }}
        showToast={showToast}
        toggleTheme={toggleTheme}
        theme={theme}
        toast={toast}
      />
    );
  }

  return (
    <div className={`main-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      <div className="main-content" style={{ position: 'relative' }}>
        <div className="toast-container">
          <div className={`toast ${toast.type} ${toast.visible ? 'show' : ''}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
        </div>
        
        {confirmDialog.isOpen && (
          <div className="confirm-overlay">
            <div className="confirm-dialog-content">
              <p className="confirm-message">{confirmDialog.message}</p>
              <div className="confirm-actions">
                <button className={confirmDialog.confirmClass} onClick={confirmDialog.onConfirm}>
                  {confirmDialog.confirmIcon === 'trash' ? <Trash2 size={16} /> : <CheckCircle size={16} />} {confirmDialog.confirmText}
                </button>
                <button className="btn-confirm-cancel" onClick={closeConfirmDialog}>
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
          {(activeTab === 'dashboard' || activeTab === 'avances') && (
            <div className="period-selector" style={{ margin: 0 }}>
              <label>PÉRIODE :</label>
              <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '140px' }}>
                <option value="01">Janvier</option><option value="02">Février</option><option value="03">Mars</option><option value="04">Avril</option><option value="05">Mai</option><option value="06">Juin</option><option value="07">Juillet</option><option value="08">Août</option><option value="09">Septembre</option><option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
              </select>
              <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: '100px' }}>
                <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option>
              </select>
            </div>
          )}
          
          <button 
            onClick={toggleTheme} 
            style={{ 
              background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', 
              cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginLeft: 'auto' 
            }} 
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {activeTab === 'utilisateurs' && (
          <Users 
            currentUser={currentUser}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            employes={employes}
            dashboardData={dashboardData}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            showToast={showToast}
            exportEmployeId={exportEmployeId}
            setExportEmployeId={setExportEmployeId}
          />
        )}

        {activeTab === 'avances' && (
          <Avances 
            avances={avances}
            fetchAvances={fetchAvances}
            employes={employes}
            fetchDashboardData={fetchDashboardData}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}

        {activeTab === 'employes' && (
          <Employes 
            employes={employes}
            fetchEmployes={fetchEmployes}
            fetchPointages={fetchPointages}
            fetchDashboardData={fetchDashboardData}
            loading={loading}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'pointage' && (
          <Pointage 
            pointages={pointages}
            fetchPointages={fetchPointages}
            employes={employes}
            fetchEmployes={fetchEmployes}
            joursFeries={joursFeries}
            fetchJoursFeries={fetchJoursFeries}
            ramadanPeriods={ramadanPeriods}
            fetchRamadanPeriods={fetchRamadanPeriods}
            fetchDashboardData={fetchDashboardData}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'clients' && (
          <Clients 
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'devis' && (
          <Devis 
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'factures' && (
          <Factures 
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

        {activeTab === 'bons_sortie' && (
          <BonsSortie 
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            closeConfirmDialog={closeConfirmDialog}
          />
        )}

      </div>
    </div>
  );
}

export default App;