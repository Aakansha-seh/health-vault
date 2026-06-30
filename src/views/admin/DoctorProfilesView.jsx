import { useState } from 'react';
import { C, shadow } from '../../constants/theme';

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology',
  'Oncology', 'Psychiatry', 'Radiology', 'Anesthesiology', 'Urology', 'Other',
];

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text, background: C.white, boxSizing: 'border-box',
};
const btnPrimary = {
  padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: C.primary, color: C.white, fontSize: 14, fontWeight: 600,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.primary, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.primary, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProfileForm({ initial = {}, onSave, onClose, submitLabel = 'Save' }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    specialty: initial.specialty ?? 'General Medicine',
    qualification: initial.qualification ?? '',
    registration: initial.registration ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    bio: initial.bio ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    // Trim every field before sending — a stray trailing space in e.g. email
    // makes the backend's .email() check fail with an opaque "Validation failed".
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    );
    try { await onSave(payload); onClose(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Full Name *">
            <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Dr. Ayesha Khan" required />
          </Field>
        </div>
        <Field label="Specialty">
          <select style={inputStyle} value={form.specialty} onChange={set('specialty')}>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Qualification">
          <input style={inputStyle} value={form.qualification} onChange={set('qualification')} placeholder="MBBS, MD" />
        </Field>
        <Field label="Registration No.">
          <input style={inputStyle} value={form.registration} onChange={set('registration')} placeholder="MCI-12345" />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Email">
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="doctor@hospital.com" />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Bio / Notes">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.bio} onChange={set('bio')} placeholder="Brief description…" />
          </Field>
        </div>
      </div>
      {error && <p style={{ color: C.error, fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={{ ...btnPrimary, background: C.bg, color: C.text }}>Cancel</button>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ProfileCard({ profile, credentials, onEdit }) {
  const credCount = credentials?.filter(c =>
    c.profileAccesses?.some(a => a.doctorProfileId === profile.id)
  ).length ?? 0;

  return (
    <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
      {/* Avatar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.secondary }}>{profile.name?.[0] ?? 'D'}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 1 }}>{profile.name}</p>
          <p style={{ fontSize: 12, color: C.secondary }}>{profile.specialty ?? 'General Medicine'}</p>
        </div>
        <button onClick={() => onEdit(profile)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: C.primary }}>
          Edit
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {profile.qualification && <p style={{ fontSize: 12, color: C.muted }}>{profile.qualification}</p>}
        {profile.registration   && <p style={{ fontSize: 12, color: C.muted }}>Reg: {profile.registration}</p>}
        {profile.email          && <p style={{ fontSize: 12, color: C.muted }}>{profile.email}</p>}
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.muted }}>{credCount} credential{credCount !== 1 ? 's' : ''} linked</span>
        <span style={{ fontSize: 11, color: C.secondary, background: `${C.secondary}18`, padding: '2px 8px', borderRadius: 99 }}>
          {profile._count?.visits ?? profile.visitCount ?? 0} visits
        </span>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function DoctorProfilesView({ actor, profiles, credentials, onCreate, onUpdate }) {
  const [showCreate, setCreate] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState('');

  const filtered = profiles.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Doctor Profiles</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{profiles.length} profiles</p>
        </div>
        <button onClick={() => setCreate(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Profile
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialty…"
          style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, boxSizing: 'border-box' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 14 }}>No doctor profiles yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProfileCard key={p.id} profile={p} credentials={credentials} onEdit={setEditing} />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Doctor Profile" onClose={() => setCreate(false)}>
          <ProfileForm onSave={data => onCreate(data)} onClose={() => setCreate(false)} submitLabel="Create Profile" />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(null)}>
          <ProfileForm
            initial={editing}
            onSave={data => onUpdate(editing.id, data)}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
