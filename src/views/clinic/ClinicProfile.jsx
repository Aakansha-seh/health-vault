import { useState } from 'react';
import { C, shadow, radius } from '../../constants/theme';
import { Card, SectionHeading } from '../../components/ui';

const Field = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 6,
        border: `1px solid ${C.border}`, background: C.white,
        fontSize: 14, fontFamily: 'Inter', color: C.text, outline: 'none',
        transition: 'border-color .15s',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => (e.target.style.borderColor = C.primary)}
      onBlur={(e)  => (e.target.style.borderColor = C.border)}
    />
  </div>
);

/**
 * ClinicProfile — edit clinic name, phone, address, and change password.
 */
export function ClinicProfile({ clinic, onUpdateClinic }) {
  const [name,     setName]     = useState(clinic?.name    ?? '');
  const [phone,    setPhone]    = useState(clinic?.phone   ?? '');
  const [address,  setAddress]  = useState(clinic?.address ?? '');
  const [email,    setEmail]    = useState(clinic?.email   ?? '');

  const [curPwd,   setCurPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confPwd,  setConfPwd]  = useState('');

  const [banner,   setBanner]   = useState('');
  const [error,    setError]    = useState('');

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 3000); }
    else         { setBanner(msg); setTimeout(() => setBanner(''), 2500); }
  };

  const handleSave = () => {
    if (!name.trim()) return flash('Clinic name is required.', true);
    onUpdateClinic({ name: name.trim(), phone: phone.trim(), address: address.trim(), email: email.trim() });
    flash('Clinic profile updated.');
  };

  const handlePwd = () => {
    if (!curPwd) return flash('Enter current password.', true);
    if (newPwd.length < 6) return flash('New password must be at least 6 characters.', true);
    if (newPwd !== confPwd) return flash('Passwords do not match.', true);
    if (curPwd !== (clinic?.password ?? 'Clinic@2025')) return flash('Current password is incorrect.', true);
    onUpdateClinic({ password: newPwd });
    setCurPwd(''); setNewPwd(''); setConfPwd('');
    flash('Password changed.');
  };

  const infoSections = [
    { label: 'Clinic name',    value: name,    set: setName,    placeholder: 'e.g. City Heart Clinic' },
    { label: 'Phone',          value: phone,   set: setPhone,   placeholder: '10-digit mobile' },
    { label: 'Email',          value: email,   set: setEmail,   type: 'email', placeholder: 'clinic@example.com' },
    { label: 'Address',        value: address, set: setAddress, placeholder: 'Full clinic address' },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 620 }}>
      <SectionHeading style={{ marginBottom: 20 }}>Clinic settings</SectionHeading>

      {banner && (
        <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ✓ {banner}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Clinic info */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Clinic information</p>
          {infoSections.map(({ label, value, set, placeholder, type }) => (
            <Field key={label} label={label} value={value} onChange={set} placeholder={placeholder} type={type ?? 'text'} />
          ))}
          <button
            onClick={handleSave}
            style={{ marginTop: 8, padding: '10px 24px', background: C.primary, color: C.white, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}
          >
            Save changes
          </button>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <div style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Change password</p>
          <Field label="Current password" value={curPwd}  onChange={setCurPwd}  type="password" />
          <Field label="New password"     value={newPwd}  onChange={setNewPwd}  type="password" placeholder="Min. 6 characters" />
          <Field label="Confirm password" value={confPwd} onChange={setConfPwd} type="password" />
          <button
            onClick={handlePwd}
            style={{ marginTop: 8, padding: '10px 24px', background: C.primary, color: C.white, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}
          >
            Update password
          </button>
        </div>
      </Card>
    </div>
  );
}
