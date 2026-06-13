import { useState, useRef, useEffect } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { uid }    from '../../utils/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────
const SPEC_OPTIONS = [
  'General Practitioner', 'Internal Medicine', 'Cardiologist',
  'Paediatrician', 'Dermatologist', 'Gynaecologist', 'Neurologist',
  'Orthopaedic Surgeon', 'Psychiatrist', 'ENT Specialist', 'Ophthalmologist',
  'Oncologist', 'Pulmonologist', 'Endocrinologist', 'Gastroenterologist',
].map((v) => ({ value: v, label: v }));

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width:        i === current ? 20 : 8,
            height:       8,
            borderRadius: 4,
            background:   i === current ? C.primary : i < current ? C.secondary : C.border,
            transition:   'all .25s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── OTP Input — six individual boxes that auto-advance ──────────────────────
function OtpInput({ value, onChange, disabled }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? '' : d).join('').padEnd(6, '').slice(0, 6).trimEnd();
      onChange(digits.map((d, idx) => (idx === i ? '' : d)).join(''));
      if (i > 0) refs[i - 1].current?.focus();
      return;
    }
    if (e.key === 'ArrowLeft'  && i > 0) { refs[i - 1].current?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { refs[i + 1].current?.focus(); return; }
  };

  const handleInput = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join(''));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).trimEnd().slice(0, pasted.length));
    if (pasted.length > 0) refs[Math.min(pasted.length - 1, 5)].current?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width:       48,
            height:      56,
            borderRadius: 10,
            border:      `2px solid ${d ? C.primary : C.border}`,
            background:  d ? '#F0F7F4' : C.white,
            fontSize:    22,
            fontWeight:  700,
            color:       C.primary,
            textAlign:   'center',
            fontFamily:  'Inter',
            outline:     'none',
            transition:  'border-color .15s',
            cursor:      disabled ? 'not-allowed' : 'text',
          }}
        />
      ))}
    </div>
  );
}

// ─── SignUpScreen ─────────────────────────────────────────────────────────────
/**
 * SignUpScreen — 3-step registration flow.
 *
 * Step 1 — Phone: enter number → simulate OTP send
 * Step 2 — OTP:   verify 6-digit code (shown in demo banner)
 * Step 3 — Profile: name, specialisation, clinic, password
 *
 * @param {object[]} clinics   - Existing clinics to choose from.
 * @param {object[]} doctors   - Existing doctors (for duplicate phone check).
 * @param {Function} onRegister - Called with new doctor object on success.
 * @param {Function} onBack     - Navigate back to login screen.
 */
export function SignUpScreen({ clinics, doctors, onRegister, onBack }) {
  const STEPS = 3;
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Step 2 — OTP (simulated: generated client-side, shown in demo banner)
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp,   setEnteredOtp]   = useState('');
  const [otpError,     setOtpError]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3
  const [form, setForm] = useState({
    name:           '',
    specialisation: 'General Practitioner',
    clinicId:       clinics[0]?.id ?? '',
    password:       '',
    confirmPassword:'',
    regNumber:      '',
    clinicHours:    'Mon–Sat, 9 AM – 6 PM',
    yearsPractice:  '',
  });
  const [formErrors, setFormErrors] = useState({});

  const normalise = (s) => s.replace(/\D/g, '');

  /* ── Resend cooldown timer ── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = () => {
    const cleaned = normalise(phone);
    if (cleaned.length < 10) { setPhoneError('Enter a valid 10-digit mobile number.'); return; }

    const exists = doctors.some((d) => normalise(d.contact) === cleaned);
    if (exists) { setPhoneError('An account with this number already exists. Please sign in.'); return; }

    setPhoneError('');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setResendCooldown(30);
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setStep(1);
    }, 800);
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = () => {
    if (enteredOtp.length < 6) { setOtpError('Please enter the 6-digit OTP.'); return; }
    if (enteredOtp !== generatedOtp) { setOtpError('Incorrect OTP. Please try again.'); return; }

    setOtpError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 400);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setOtpError('');
    setResendCooldown(30);
  };

  /* ── Step 3: Register ── */
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validateProfile = () => {
    const errs = {};
    if (!form.name.trim())           errs.name    = 'Full name is required.';
    if (!form.clinicId)              errs.clinicId = 'Select a clinic.';
    if (form.password.length < 8)    errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = () => {
    if (!validateProfile()) return;
    setLoading(true);

    const newDoctor = {
      id:             uid(),
      name:           form.name.trim(),
      specialisation: form.specialisation,
      clinicId:       form.clinicId,
      contact:        normalise(phone),
      email:          '',
      password:       form.password,
      regNumber:      form.regNumber.trim(),
      clinicHours:    form.clinicHours,
      yearsPractice:  Number(form.yearsPractice) || 0,
      createdAt:      new Date().toISOString(),
    };

    setTimeout(() => {
      setLoading(false);
      onRegister(newDoctor);
    }, 500);
  };

  const clinicOptions = clinics.map((c) => ({ value: c.id, label: c.name }));

  /* ─────────────────────────────────────────────────────────────── */

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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 38, height: 38, background: C.primary, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.white} strokeWidth="1.5" fill="none" />
                <path d="M12 8v8M8 12h8" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 600, color: C.primary, letterSpacing: -0.5 }}>
              HealthVault
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>
            {step === 0 && 'Create your doctor account'}
            {step === 1 && 'Verify your mobile number'}
            {step === 2 && 'Complete your profile'}
          </p>
        </div>

        {/* Step dots */}
        <StepDots current={step} total={STEPS} />

        {/* ── Card ── */}
        <div
          className="fade-in"
          key={step}
          style={{
            background:   C.white,
            borderRadius: 14,
            border:       `1px solid ${C.border}`,
            padding:      28,
            boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >

          {/* ══ STEP 1 — Phone ══ */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                  Enter your mobile number
                </p>
                <p style={{ fontSize: 13, color: C.muted }}>
                  We'll send a one-time password to verify your identity.
                </p>
              </div>

              <Input
                label="Mobile number"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                placeholder="10-digit number, e.g. 9876543210"
                required
                error={phoneError}
              />

              <Button
                onClick={handleSendOtp}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </Button>

              <button
                onClick={onBack}
                style={{
                  background: 'none', border: 'none', color: C.muted,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Inter',
                  textAlign: 'center', padding: 0,
                }}
              >
                Already have an account?{' '}
                <span style={{ color: C.secondary, fontWeight: 500 }}>Sign in</span>
              </button>
            </div>
          )}

          {/* ══ STEP 2 — OTP ══ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                  Enter the OTP
                </p>
                <p style={{ fontSize: 13, color: C.muted }}>
                  Sent to <strong>+91 {normalise(phone)}</strong>
                </p>
              </div>

              {/* Demo OTP banner */}
              <div
                style={{
                  background:   '#E8F5E9',
                  border:       '1px solid #C8E6C9',
                  borderRadius: 8,
                  padding:      '10px 14px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={C.success}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p style={{ fontSize: 13, color: C.success }}>
                  Demo OTP: <strong style={{ letterSpacing: 2 }}>{generatedOtp}</strong>
                </p>
              </div>

              <OtpInput
                value={enteredOtp}
                onChange={setEnteredOtp}
                disabled={loading}
              />

              {otpError && (
                <p style={{ fontSize: 13, color: C.error, textAlign: 'center' }}>{otpError}</p>
              )}

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || enteredOtp.length < 6}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Verifying…' : 'Verify OTP'}
              </Button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: C.muted }}>Didn't receive it? </span>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  style={{
                    background: 'none', border: 'none',
                    color:      resendCooldown > 0 ? C.muted : C.secondary,
                    fontSize:   13, fontWeight: 500, cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    fontFamily: 'Inter', padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                onClick={() => setStep(0)}
                style={{
                  background: 'none', border: 'none', color: C.muted,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'Inter',
                  textAlign: 'center', padding: 0,
                }}
              >
                ← Change number
              </button>
            </div>
          )}

          {/* ══ STEP 3 — Profile ══ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                  Complete your profile
                </p>
                <p style={{ fontSize: 13, color: C.muted }}>
                  This information appears on your prescriptions and patient records.
                </p>
              </div>

              <Input
                label="Full name (with title)"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Dr. Anjali Verma"
                required
                error={formErrors.name}
              />

              <Select
                label="Specialisation"
                value={form.specialisation}
                onChange={set('specialisation')}
                options={SPEC_OPTIONS}
                required
              />

              <Select
                label="Clinic"
                value={form.clinicId}
                onChange={set('clinicId')}
                options={clinicOptions}
                required
                error={formErrors.clinicId}
              />

              <Input
                label="Medical registration number"
                value={form.regNumber}
                onChange={set('regNumber')}
                placeholder="e.g. MH-12345"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  required
                  error={formErrors.password}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter password"
                  required
                  error={formErrors.confirmPassword}
                />
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </div>
          )}
        </div>

        {/* Back to sign-in link (steps 0 and 2) */}
        {step !== 1 && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.muted }}>
            Already have an account?{' '}
            <button
              onClick={onBack}
              style={{
                background: 'none', border: 'none',
                color: C.secondary, fontWeight: 500,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', padding: 0,
              }}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
