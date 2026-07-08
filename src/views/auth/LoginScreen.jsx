import { useState } from 'react';
import { adminLogin, credentialLogin, patientLogin } from '../../services/api';
import { C, shadow } from '../../constants/theme';
import { Card, Input, Button } from '../../components/ui';

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
        : tab === 'patient'
          ? await patientLogin({ username: form.identifier, password: form.password })
          : await credentialLogin({ username: form.identifier, password: form.password });
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="hv-bg-grid" 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24 
      }}
    >
      <div className="hv-fade-up" style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 46, 
              height: 46, 
              borderRadius: 12, 
              background: C.primary, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(26,60,52,0.2)' 
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.primary, letterSpacing: '-0.5px' }}>HealthVault</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6, fontWeight: 500 }}>Hospital Management Platform</p>
        </div>

        {/* Card */}
        <Card style={{ padding: '32px', border: `1px solid ${C.border}`, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: C.bg, borderRadius: 8, padding: 4, marginBottom: 28, gap: 4 }}>
            {[['credential', 'Staff'], ['admin', 'Admin'], ['patient', 'Patient']].map(([t, label]) => (
              <button 
                key={t} 
                onClick={() => { setTab(t); setError(''); setForm({ identifier: '', password: '' }); }}
                className="hv-press"
                style={{ 
                  flex: 1, 
                  padding: '8px 0', 
                  borderRadius: 6, 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 13, 
                  fontWeight: 600, 
                  transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                  background: tab === t ? C.white : 'transparent', 
                  color: tab === t ? C.primary : C.muted, 
                  boxShadow: tab === t ? '0 2px 6px rgba(16,24,40,0.06)' : 'none' 
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'patient' && (
              <p style={{ fontSize: 12, color: C.muted, margin: '-8px 0 0', lineHeight: 1.5 }}>
                Use the username and password emailed to you by your hospital.
              </p>
            )}
            <Input
              label={tab === 'admin' ? 'Admin Email' : 'Username'}
              type={tab === 'admin' ? 'email' : 'text'}
              value={form.identifier}
              onChange={set('identifier')}
              placeholder={tab === 'admin' ? 'admin@hospital.com' : 'your.username'}
              required
            />

            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
            />

            {error && (
              <div style={{ 
                background: C.criticalSoft, 
                border: `1px solid ${C.error}20`, 
                borderRadius: 8, 
                padding: '10px 14px', 
                color: C.error, 
                fontSize: 13, 
                fontWeight: 500,
                marginTop: 4 
              }}>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              variant="primary"
              style={{ width: '100%', padding: '12px', marginTop: 12 }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.muted }}>
          New hospital?{' '}
          <button 
            onClick={onShowSetup} 
            className="hv-press"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: C.secondary, 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: 13, 
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Set up your account →
          </button>
        </p>
      </div>
    </div>
  );
}
