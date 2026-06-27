import { useState } from 'react';
import { registerHospital } from '../../services/api';
import { C, shadow } from '../../constants/theme';
import { Card, Input, Button } from '../../components/ui';

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
      <div className="hv-fade-up" style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 44, 
              height: 44, 
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
            <span style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>HealthVault</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            Hospital Setup — Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div 
              key={i} 
              style={{ 
                flex: 1, 
                height: 4, 
                borderRadius: 2, 
                background: i <= step ? C.primary : C.border, 
                transition: 'background 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' 
              }} 
            />
          ))}
        </div>

        <Card style={{ padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: `1px solid ${C.border}` }}>
          {step === 2 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }} className="hv-fade-up">
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: C.successSoft, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px',
                border: `1.5px solid ${C.success}30`,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ color: C.primary, marginBottom: 8, fontSize: 20, fontWeight: 700 }}>You're all set!</h2>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
                Your hospital account has been created. Sign in with your admin credentials.
              </p>
              <Button onClick={onComplete} style={{ width: '100%', padding: '12px' }}>
                Go to Login →
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="hv-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ color: C.primary, marginBottom: 4, fontSize: 17, fontWeight: 700 }}>
                {STEPS[step]}
              </h3>

              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Input
                    label="Hospital Name"
                    value={form.hospitalName}
                    onChange={set('hospitalName')}
                    placeholder="City General Hospital"
                    required
                  />
                  <Input
                    label="Address"
                    value={form.hospitalAddress}
                    onChange={set('hospitalAddress')}
                    placeholder="123 Main St, City"
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={form.hospitalPhone}
                    onChange={set('hospitalPhone')}
                    placeholder="+91 98765 43210"
                    required
                  />
                  <Input
                    label="Hospital Email"
                    type="email"
                    value={form.hospitalEmail}
                    onChange={set('hospitalEmail')}
                    placeholder="info@hospital.com"
                    required
                  />
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Input
                    label="Full Name"
                    value={form.adminName}
                    onChange={set('adminName')}
                    placeholder="Dr. Admin Name"
                    required
                  />
                  <Input
                    label="Admin Email"
                    type="email"
                    value={form.adminEmail}
                    onChange={set('adminEmail')}
                    placeholder="admin@hospital.com"
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={form.adminPassword}
                    onChange={set('adminPassword')}
                    placeholder="••••••••"
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={form.adminPasswordConfirm}
                    onChange={set('adminPasswordConfirm')}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

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

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {step > 0 && (
                  <Button 
                    type="button" 
                    onClick={() => setStep(s => s - 1)} 
                    variant="secondary"
                    style={{ flex: '0 0 auto', width: 100 }}
                  >
                    ← Back
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={loading} 
                  style={{ flex: 1 }}
                >
                  {loading ? 'Creating…' : step === 1 ? 'Create Account' : 'Next →'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
