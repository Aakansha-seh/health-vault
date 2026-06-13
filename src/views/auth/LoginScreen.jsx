import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';

// ─── Mode toggle pill ─────────────────────────────────────────────────────────
function ModeToggle({ mode, setMode }) {
  return (
    <div
      style={{
        display:        'flex',
        background:     C.bg,
        border:         `1px solid ${C.border}`,
        borderRadius:   12,
        padding:        4,
        marginBottom:   28,
        gap:            4,
      }}
    >
      {['doctor', 'clinic'].map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex:           1,
              padding:        '10px 0',
              borderRadius:   9,
              border:         'none',
              background:     active ? C.primary : 'transparent',
              color:          active ? C.white : C.muted,
              fontSize:       14,
              fontWeight:     active ? 600 : 400,
              cursor:         'pointer',
              fontFamily:     'Inter',
              transition:     'all .2s',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? C.white : C.muted}>
              <path d={m === 'doctor' ? ICONS.profile : ICONS.patients} />
            </svg>
            {m === 'doctor' ? 'Sign in as Doctor' : 'Sign in as Clinic'}
          </button>
        );
      })}
    </div>
  );
}

// ─── DoctorPickerCard ─────────────────────────────────────────────────────────
/**
 * Card shown after clinic auth, letting the user pick which doctor to act as.
 * Extracted as its own component so useState for hover is legal.
 */
function DoctorPickerCard({ doctor, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const hue = doctor.id.charCodeAt(1) * 30;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        padding:      '14px 16px',
        background:   hovered ? C.bg : C.white,
        border:       `1px solid ${C.border}`,
        borderRadius: 10,
        cursor:       'pointer',
        transition:   'all .15s',
        marginBottom: 10,
        boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          width:          42,
          height:         42,
          borderRadius:   '50%',
          background:     `hsl(${hue},40%,88%)`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          fontSize:       17,
          fontWeight:     700,
          color:          C.primary,
        }}
      >
        {doctor.name.charAt(4)}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{doctor.name}</p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{doctor.specialisation}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>
        <path d={ICONS.chevronRight} />
      </svg>
    </div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
/**
 * LoginScreen — two-mode auth via registered phone number + password.
 *
 * Doctor mode : matches doctor.contact → doctor.password → sets currentDoctorId
 * Clinic mode : matches clinic.phone   → clinic.password  → shows doctor picker
 *
 * @param {object[]} doctors - Full doctors array from state.
 * @param {object[]} clinics - Full clinics array from state.
 * @param {Function} onLogin - Called with (doctorId) on success.
 */
export function LoginScreen({ doctors, clinics, onLogin, onSignUp }) {
  const [mode,         setMode]         = useState('doctor');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  // Clinic flow: after clinic auth succeeds, show doctor picker.
  const [clinicDoctors,  setClinicDoctors]  = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Strip non-digits so formats like '+91 98100 00001' and '9810000001' both match.
  const normalise = (s) => s.replace(/\D/g, '');

  const handleModeChange = (m) => {
    setMode(m);
    setPhone('');
    setPassword('');
    setError('');
    setClinicDoctors(null);
    setSelectedClinic(null);
  };

  /* ── Doctor login ── */
  const handleDoctorLogin = () => {
    if (!phone.trim())    { setError('Please enter your registered number.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    const doctor = doctors.find((d) => normalise(d.contact) === normalise(phone));
    if (!doctor)                      { setError('No doctor account found with this number.'); return; }
    if (password !== doctor.password) { setError('Incorrect password. Please try again.'); return; }

    setLoading(true);
    setTimeout(() => onLogin(doctor.id), 300);
  };

  /* ── Clinic login ── */
  const handleClinicLogin = () => {
    if (!phone.trim())    { setError('Please enter the clinic registered number.'); return; }
    if (!password.trim()) { setError('Please enter the clinic password.'); return; }

    const clinic = clinics.find((c) => normalise(c.phone) === normalise(phone));
    if (!clinic)                      { setError('No clinic found with this number.'); return; }
    if (password !== clinic.password) { setError('Incorrect clinic password.'); return; }

    const members = doctors.filter((d) => d.clinicId === clinic.id);
    setSelectedClinic(clinic);
    setClinicDoctors(members);
    setError('');
  };

  const handleSubmit = () => {
    setError('');
    if (mode === 'doctor') handleDoctorLogin();
    else                   handleClinicLogin();
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
          <p style={{ fontSize: 13, color: C.muted }}>
            {clinicDoctors
              ? `${selectedClinic.name} — select who's signing in`
              : 'Welcome back. Sign in to continue.'}
          </p>
        </div>

        {/* ── After clinic auth: doctor picker ── */}
        {clinicDoctors ? (
          <div className="fade-in">
            {/* Back button */}
            <button
              onClick={() => { setClinicDoctors(null); setSelectedClinic(null); setPhone(''); setPassword(''); }}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        4,
                background: 'none',
                border:     'none',
                color:      C.secondary,
                fontSize:   13,
                cursor:     'pointer',
                fontFamily: 'Inter',
                padding:    0,
                marginBottom: 14,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={C.secondary} style={{ transform: 'rotate(180deg)' }}>
                <path d={ICONS.chevronRight} />
              </svg>
              Back to sign-in
            </button>

            {clinicDoctors.length === 0 ? (
              <p style={{ textAlign: 'center', color: C.muted, fontSize: 14, padding: 32 }}>
                No doctors registered under this clinic yet.
              </p>
            ) : (
              clinicDoctors.map((doctor) => (
                <DoctorPickerCard
                  key={doctor.id}
                  doctor={doctor}
                  onSelect={() => onLogin(doctor.id)}
                />
              ))
            )}
          </div>
        ) : (
          /* ── Login form ── */
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
            {/* Mode toggle */}
            <ModeToggle mode={mode} setMode={handleModeChange} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onKeyDown={handleKeyDown}>

              {/* Phone */}
              <Input
                label={mode === 'doctor' ? 'Registered mobile number' : 'Clinic registered number'}
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder={mode === 'doctor' ? '9810000001' : '9811000000'}
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
                  Demo — Doctor:{' '}
                  <code style={{ color: C.secondary }}>MediRecord@2025</code>
                  {'  ·  '}
                  Clinic:{' '}
                  <code style={{ color: C.secondary }}>Clinic@2025</code>
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
                {loading
                  ? 'Signing in…'
                  : mode === 'doctor'
                    ? 'Sign in'
                    : 'Continue as Clinic'}
              </Button>

              {/* Sign-up link — only shown in Doctor mode */}
              {mode === 'doctor' && (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
