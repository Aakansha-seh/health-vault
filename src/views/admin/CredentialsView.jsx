import { useState } from 'react';
import { C, shadow } from '../../constants/theme';
import { resetCredentialPassword, grantAccess, revokeAccess } from '../../services/api';

const ROLES = ['DOCTOR', 'RECEPTIONIST'];

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label }) {
  // Token-based so the pills invert correctly in Night Mode. Roles aren't
  // clinical status, so RECEPTIONIST uses a neutral chip rather than a colour.
  const map = {
    active:       { bg: C.successSoft,  color: C.success },
    inactive:     { bg: C.criticalSoft, color: C.critical },
    DOCTOR:       { bg: C.infoSoft,     color: C.info },
    RECEPTIONIST: { bg: C.gray[100],    color: C.gray[600] },
  };
  const s = map[label] ?? { bg: C.gray[100], color: C.muted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="hv-modal-backdrop-anim"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--hv-backdrop-bg)',
        backdropFilter: 'blur(var(--hv-backdrop-blur))',
        WebkitBackdropFilter: 'blur(var(--hv-backdrop-blur))',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div onMouseDown={e => e.stopPropagation()} className="hv-modal-card-anim" style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: 28, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.primary, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.primary, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text, background: C.white, boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: C.primary, color: C.white, fontSize: 14, fontWeight: 600,
};

// ── Create Credential Modal ───────────────────────────────────────────────────

function CreateModal({ doctorProfiles, onCreate, onClose }) {
  // access: { [profileId]: 'VIEW' | 'READ_WRITE' } — presence of a key means access is granted
  const [form, setForm] = useState({ username: '', password: '', label: '', role: 'DOCTOR', access: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleProfile = id => setForm(f => {
    const access = { ...f.access };
    if (id in access) delete access[id];
    else access[id] = 'VIEW';            // default to read-only when first granted
    return { ...f, access };
  });

  const setPermission = (id, permission) =>
    setForm(f => ({ ...f, access: { ...f.access, [id]: permission } }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        label:    form.label.trim(),
        role:     form.role,
        profileAccesses: Object.entries(form.access).map(([doctorProfileId, permission]) => ({ doctorProfileId, permission })),
      };
      await onCreate(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="New Credential" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Username">
          <input style={inputStyle} value={form.username} onChange={set('username')} placeholder="dr.smith or anita@hospital.com" required minLength={3} />
        </Field>
        <Field label="Password">
          <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" required minLength={8} />
        </Field>
        <Field label="Display Name">
          <input style={inputStyle} value={form.label} onChange={set('label')} placeholder="Dr. Smith" required minLength={2} />
        </Field>
        <Field label="Role">
          <select style={inputStyle} value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        {form.role === 'DOCTOR' && doctorProfiles?.length > 0 && (
          <Field label="Grant Profile Access (optional)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {doctorProfiles.map(p => {
                const granted = p.id in form.access;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                      <input type="checkbox" checked={granted} onChange={() => toggleProfile(p.id)} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name} — {p.specialty ?? 'General'}
                      </span>
                    </label>
                    {granted && (
                      <select
                        value={form.access[p.id]}
                        onChange={e => setPermission(p.id, e.target.value)}
                        style={{ ...inputStyle, width: 'auto', padding: '5px 8px', fontSize: 12, flexShrink: 0 }}
                      >
                        <option value="VIEW">Read-only</option>
                        <option value="READ_WRITE">Read &amp; write</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </Field>
        )}
        {error && <p style={{ color: C.error, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ ...btnPrimary, background: C.bg, color: C.text }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Credential Detail Modal ───────────────────────────────────────────────────

function DetailModal({ cred, doctorProfiles, onUpdate, onClose }) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [resetting, setResetting] = useState(false);

  const toggleActive = async () => {
    setLoading(true); setError('');
    try { await onUpdate(cred.id, { isActive: !cred.isActive }); onClose(); }
    catch (e) { setError(e.message); setLoading(false); }
  };

  const handleResetPassword = async e => {
    e.preventDefault();
    if (!newPass || newPass.length < 8) { setError('Password must be at least 8 characters'); return; }
    setResetting(true); setError('');
    try {
      await resetCredentialPassword(cred.id, { newPassword: newPass });
      setNewPass(''); alert('Password reset successfully');
    } catch (e) { setError(e.message); }
    finally { setResetting(false); }
  };

  // Local copy so grant/revoke/permission changes reflect immediately in the modal
  const [accesses, setAccesses] = useState(cred.profileAccesses ?? []);
  // Chosen permission level for profiles not yet granted (applied on "Grant")
  const [pendingPerm, setPendingPerm] = useState({});

  const handleGrant = async (profileId, permission = 'VIEW') => {
    setError('');
    try {
      await grantAccess({ credentialId: cred.id, doctorProfileId: profileId, permission });
      setAccesses(prev => {
        const others = prev.filter(a => a.doctorProfileId !== profileId);
        return [...others, { doctorProfileId: profileId, permission }];
      });
    } catch (e) { setError(e.message); }
  };

  const handleRevoke = async profileId => {
    setError('');
    try {
      await revokeAccess(cred.id, profileId);
      setAccesses(prev => prev.filter(a => a.doctorProfileId !== profileId));
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal title={cred.label || cred.username} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Badge label={cred.role} />
        <Badge label={cred.isActive ? 'active' : 'inactive'} />
        <span style={{ fontSize: 12, color: C.muted }}>@{cred.username}</span>
      </div>

      {/* Activate / Deactivate */}
      <div style={{ background: C.bg, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>Account Status</p>
        <button onClick={toggleActive} disabled={loading} style={{
          ...btnPrimary, background: cred.isActive ? C.error : C.success, fontSize: 13, padding: '8px 16px',
          opacity: loading ? 0.7 : 1,
        }}>
          {cred.isActive ? 'Deactivate Credential' : 'Reactivate Credential'}
        </button>
      </div>

      {/* Reset password */}
      <form onSubmit={handleResetPassword} style={{ background: C.bg, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>Reset Password</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" disabled={resetting} style={{ ...btnPrimary, padding: '9px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>
            {resetting ? '…' : 'Reset'}
          </button>
        </div>
      </form>

      {/* Profile access */}
      {cred.role === 'DOCTOR' && doctorProfiles?.length > 0 && (
        <div style={{ background: C.bg, borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>Profile Access</p>
          {doctorProfiles.map(p => {
            const access = accesses.find(a => a.doctorProfileId === p.id);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {/* Permission selector — changing it (re)grants at the chosen level */}
                <select
                  value={access ? access.permission : (pendingPerm[p.id] ?? 'VIEW')}
                  onChange={e => access
                    ? handleGrant(p.id, e.target.value)                       // already granted → apply immediately
                    : setPendingPerm(m => ({ ...m, [p.id]: e.target.value }))} // not granted → stage for Grant
                  style={{ ...inputStyle, width: 'auto', padding: '5px 8px', fontSize: 12, flexShrink: 0 }}
                >
                  <option value="VIEW">Read-only</option>
                  <option value="READ_WRITE">Read &amp; write</option>
                </select>
                {access ? (
                  <button onClick={() => handleRevoke(p.id)} style={{ fontSize: 11, color: C.error, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Revoke</button>
                ) : (
                  <button onClick={() => handleGrant(p.id, pendingPerm[p.id] ?? 'VIEW')} style={{ fontSize: 11, color: C.secondary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Grant</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p style={{ color: C.error, fontSize: 13, marginTop: 10 }}>{error}</p>}
    </Modal>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function CredentialsView({ actor, credentials, doctorProfiles, onCreate, onUpdate }) {
  const [search,   setSearch]   = useState('');
  const [showCreate, setCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = credentials.filter(c =>
    [c.username, c.label, c.role].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Credentials</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{credentials.length} total · {credentials.filter(c => c.isActive).length} active</p>
        </div>
        <button onClick={() => setCreate(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Credential
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 380 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search credentials…"
          style={{ ...inputStyle, paddingLeft: 38 }} />
      </div>

      {/* Table */}
      <div className="hv-table-wrap" style={{ background: C.white, borderRadius: 12, boxShadow: shadow, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Username', 'Name', 'Role', 'Status', 'Profiles', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.muted }}>No credentials yet. Create one above.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, cursor: 'pointer' }} onClick={() => setSelected(c)}>
                <td className="hv-break" style={{ padding: '12px 16px', fontWeight: 600, color: C.primary }}>@{c.username}</td>
                <td style={{ padding: '12px 16px', color: C.text }}>{c.label || '—'}</td>
                <td style={{ padding: '12px 16px' }}><Badge label={c.role} /></td>
                <td style={{ padding: '12px 16px' }}><Badge label={c.isActive ? 'active' : 'inactive'} /></td>
                <td style={{ padding: '12px 16px', color: C.muted }}>{(c.profileAccesses?.length ?? 0)} profiles</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ color: C.secondary, fontSize: 12, fontWeight: 600 }}>Manage →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateModal
          doctorProfiles={doctorProfiles}
          onCreate={async data => { await onCreate(data); }}
          onClose={() => setCreate(false)}
        />
      )}
      {selected && (
        <DetailModal
          cred={selected}
          doctorProfiles={doctorProfiles}
          onUpdate={onUpdate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
