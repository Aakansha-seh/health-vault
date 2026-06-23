import { useState } from 'react';
import { registerHospital } from '../../services/api';
import { C, shadow } from '../../constants/theme';

const STEPS = ['Hospital Info', 'Admin Account', 'Done'];

export function HospitalSetup({ onComplete }) {
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    hospitalName: '', hospitalAddress: '', hospitalPhone: '', hospitalEmail: '',
    adminName: '', adminEmail: '', adminPassword: '', adminPasswordConfirm: '',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 1) { setStep(s => s + 1); return; }

    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError('Passwords do not match'); return;
    }
    setError('');
    setLoading(true);
    try {
      await registerHospital({
        hospitalName:    form.hospitalName,
        hospitalAddress: form.hospitalAddress,
        hospitalPhone:   form.hospitalPhone,
        hospitalEmail:   form.hospitalEmail,
        adminName:       form.adminName,
        adminEmail:      form.adminEmail,
        adminPassword:   form.adminPassword,
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>HealthVault</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Hospital Setup — Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.primary : C.border, transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ background: C.white, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>

          {step === 2 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ color: C.primary, marginBottom: 8, fontSize: 20 }}>You're all set!</h2>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>Your hospital account has been created. Sign in with your admin credentials.</p>
              <button onClick={onComplete} style={btn}>Go to Login →</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ color: C.primary, marginBottom: 20, fontSize: 17 }}>{STEPS[step]}</h3>

              {step === 0 && (
                <>
                  {field('Hospital Name', form.hospitalName, set('hospitalName'), 'City General Hospital', 'text', true)}
                  {field('Address', form.hospitalAddress, set('hospitalAddress'), '123 Main St, City', 'text', true)}
                  {field('Phone', form.hospitalPhone, set('hospitalPhone'), '+91 98765 43210', 'tel', true)}
                  {field('Hospital Email', form.hospitalEmail, set('hospitalEmail'), 'info@hospital.com', 'email', true)}
                </>
              )}

              {step === 1 && (
                <>
                  {field('Full Name', form.adminName, set('adminName'), 'Dr. Admin Name', 'text', true)}
                  {field('Admin Email', form.adminEmail, set('adminEmail'), 'admin@hospital.com', 'email', true)}
                  {field('Password', form.adminPassword, set('adminPassword'), '••••••••', 'password', true)}
                  {field('Confirm Password', form.adminPasswordConfirm, set('adminPasswordConfirm'), '••••••••', 'password', true)}
                </>
              )}

              {error && <div style={{ background: '#FFF5F5', border: `1px solid ${C.error}30`, borderRadius: 8, padding: '10px 14px', marginTop: 12, color: C.error, fontSize: 13 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                {step > 0 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} style={{ ...btn, background: C.bg, color: C.text, flex: '0 0 auto', width: 100 }}>← Back</button>
                )}
                <button type="submit" disabled={loading} style={{ ...btn, flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating…' : step === 1 ? 'Create Account' : 'Next →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function field(label, value, onChange, placeholder, type = 'text', required = false) {
  return (
    <div key={label} style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A3C34', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E0EDE8', fontSize: 14, color: '#1A3C34', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

const btn = { width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#1A3C34', color: '#FFFFFF', fontSize: 15, fontWeight: 700 };
