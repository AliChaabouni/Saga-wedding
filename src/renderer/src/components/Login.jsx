import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, Sun, Moon, CheckCircle, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login({ onLoginSuccess, showToast, toggleTheme, theme, toast }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.login({ email: loginEmail, password: loginPassword });
      onLoginSuccess(res.user);
      setLoginPassword('');
      setShowLoginPassword(false);
      showToast("Connexion réussie !");
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="login-container">
      <button 
        onClick={toggleTheme} 
        style={{
          position: 'fixed', top: '20px', right: '20px',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          color: 'var(--text-main)', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 1000, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="toast-container"><div className={`toast ${toast.type} ${toast.visible ? 'show' : ''}`}>{toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}<span>{toast.message}</span></div></div>

      <div className="login-card card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src={logoImg} alt="Logo" style={{ width: '80px', marginBottom: '15px' }} />
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>SAGA WEDDING</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>Authentification requise</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group mb-3" style={{ textAlign: 'center' }}>
            <label style={{ display: 'block', textAlign: 'center' }}>Email</label>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--text-muted)' }} />
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="form-control" style={{ padding: '10px 35px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} placeholder="abcdef@gmail.com" required />
            </div>
          </div>
          <div className="form-group mb-4" style={{ textAlign: 'center' }}>
            <label style={{ display: 'block', textAlign: 'center' }}>Mot de passe</label>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--text-muted)' }} />
              <input type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="form-control" style={{ padding: '10px 35px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', display: 'flex' }} title={showLoginPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}>
                {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
