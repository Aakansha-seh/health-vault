import { useState } from 'react';
import { C } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { signup, setToken } from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const SPEC_OPTIONS = [
  'General Practitioner', 'Internal Medicine', 'Cardiologist',
  'Paediatrician', 'Dermatologist', 'Gynaecologist', 'Neurologist',
  'Orthopaedic Surgeon', 'Psychiatrist', 'ENT Specialist', 'Ophthalmologist',
  'Oncologist', 'Pulmonologist', 'Endocrinologist', 'Gastroenterologist',
].map((v) => ({ value: v, label: v }));

// ─── SignUpScreen ─────────────────────────────────────────────────────────────
/**
 * Single-step registration — email + profile → calls /api/auth/signup.
 * On success: stores JWT, calls onRegister({ doctor, token }).
 */
export function SignUpScreen({ clinics, onRegister, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    specialisation:  'General Practitioner',
    clinicId:        clinics[0]?.id ?? '',
    contact:         '',
    clinicHours:     'Mon–Sat, 9 AM – 6 PM',
    yearsPractice:   '',
    password:        '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: '' }));
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())         errs.name            = 'Full name is required.';
    if (!form.email.trim())        errs.email           = 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email   = 'Enter a valid email address.';
    if (!form.clinicId)            errs.clinicId        = 'Select a clinic.';
    if (form.password.length < 8)  errs.password        = 'Minimum 8 characters.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const result = await signup({
        name:           form.name.trim(),
        email:          form.email.trim().toLowerCase(),
        password:       form.password,
        specialisation: form.specialisation,
        clinicId:       form.clinicId,
        contact:        form.contact.trim() || undefined,
        clinicHours:    form.clinicHours.trim() || undefined,
        yearsPractice:  form.yearsPractice ? Number(form.yearsPractice) : undefined,
      });
      setToken(result.token);
      onRegister(result);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clinicOptions = clinics.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div
      style={{
        minHeight:      '100vh',
        background:     C.bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px 16px',
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
          <p style={{ fontSize: 13, color: C.muted }}>Create your doctor account</p>
        </div>

        {/* ── Card ── */}
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
          <p style={{ fontSize: 16, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
            Your details
          </p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            This information appears on your prescriptions and patient records.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <Input
              label="Full name (with title)"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Dr. Anjali Verma"
              required
              error={formErrors.name}
            />

            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="e.g. anjali@healthvault.in"
              required
              error={formErrors.email}
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
              label="Contact number"
              type="tel"
              value={form.contact}
              onChange={set('contact')}
              placeholder="e.g. +91 98765 43210"
            />

            <Input
              label="Clinic hours"
              value={form.clinicHours}
              onChange={set('clinicHours')}
              placeholder="e.g. Mon–Sat, 9 AM – 6 PM"
            />

            <Input
              label="Years of practice"
              type="number"
              value={form.yearsPractice}
              onChange={set('yearsPractice')}
              placeholder="e.g. 5"
            />

            <div style={{ display: 'grid', gap: 12 }}>
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

            <Button
              onClick={handleRegister}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </div>

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
      </div>
    </div>
  );
}
