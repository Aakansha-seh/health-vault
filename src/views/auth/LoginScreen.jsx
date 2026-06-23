import { useState } from 'react';
import { adminLogin, credentialLogin } from '../../services/api';
import { C, shadow, radius } from '../../constants/theme';

export function LoginScreen({ onLogin, onShowSetup }) {
  const [tab,     setTab]     = useState('credential');
  const [form,    setForm]    = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = tab === 'admin'
        ? await adminLogin({ email: form.identifier, password: form.password })
        : await credentialLogin({ username: form.identifier, password: form.password });
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.primary, letterSpacing: '-0.5px' }}>HealthVault</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Hospital Management Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: C.white, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: C.bg, borderRadius: 8, padding: 4, marginBottom: 28, gap: 4 }}>
            {[['credential', 'Staff Login'], ['admin', 'Admin Login']].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setForm({ identifier: '', password: '' }); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: tab === t ? C.white : 'transparent', color: tab === t ? C.primary : C.muted, boxShadow: tab === t ? shadow : 'none' }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label style={lbl}>{tab === 'admin' ? 'Admin Email' : 'Username'}</label>
            <input type={tab === 'admin' ? 'email' : 'text'} value={form.identifier} onChange={set('identifier')}
              placeholder={tab === 'admin' ? 'admin@hospital.com' : 'your.username'} required autoFocus style={inp} />

            <label style={{ ...lbl, marginTop: 16 }}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required style={inp} />

            {error && <div style={{ background: '#FFF5F5', border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginTop: 16, color: C.error, fontSize: 13 }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer', background: C.primary, color: C.white, fontSize: 15, fontWeight: 700, marginTop: 24, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.muted }}>
          New hospital?{' '}
          <button onClick={onShowSetup} style={{ background: 'none', border: 'none', color: C.secondary, cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>
            Set up your account →
          </button>
        </p>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 };
const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, outline: 'none', boxSizing: 'border-box' };
