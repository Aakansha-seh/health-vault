import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { login, setToken } from '../../services/api';

// ─── LoginScreen ──────────────────────────────────────────────────────────────
/**
 * LoginScreen — email + password auth against the real backend.
 * On success: stores JWT, calls onLogin({ doctor, token }).
 */
export function LoginScreen({ onLogin, onSignUp }) {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim())    { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const result = await login({ email: email.trim().toLowerCase(), password });
      setToken(result.token);
      onLogin(result);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };
  const eyeIcon = showPassword ? ICONS.eyeOpen : ICONS.eyeClosed;

  return (
    <div
      style={{
        minHeight:      '100vh',
        background:     C.bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        16,
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width:          40,
                height:         40,
                background:     C.primary,
                borderRadius:   10,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.white} strokeWidth="1.5" fill="none" />
                <path d="M12 8v8M8 12h8" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 600, color: C.primary, letterSpacing: -0.5 }}>
              HealthVault
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>Welcome back. Sign in to continue.</p>
        </div>

        {/* ── Login form ── */}
        <div
          className="fade-in"
          style={{
            background:   C.white,
            borderRadius: 14,
            border:       `1px solid ${C.border}`,
            padding:      28,
            boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onKeyDown={handleKeyDown}>

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="e.g. aakansha@healthvault.in"
              required
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                required
                rightEl={
                  <div
                    onClick={() => setShowPassword((s) => !s)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={C.muted}>
                      <path d={eyeIcon} />
                    </svg>
                  </div>
                }
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
                Demo password:{' '}
                <code style={{ color: C.secondary }}>MediRecord@2025</code>
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  background:   '#FFEBEE',
                  border:       '1px solid #FFCDD2',
                  borderRadius: 8,
                  padding:      '10px 14px',
                  fontSize:     13,
                  color:        C.error,
                }}
              >
                {error}
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            {/* Sign-up link */}
            <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 4 }}>
              Don't have an account?{' '}
              <button
                onClick={onSignUp}
                style={{
                  background: 'none', border: 'none',
                  color:      C.secondary, fontWeight: 600,
                  fontSize:   13, cursor: 'pointer',
                  fontFamily: 'Inter', padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
