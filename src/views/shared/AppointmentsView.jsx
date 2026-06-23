import { useState } from 'react';
import { C, shadow } from '../../constants/theme';

const STATUS_OPTS = ['scheduled', 'completed', 'cancelled'];

const STATUS_STYLE = {
  scheduled:  { bg: '#E3F2FD', color: '#1565C0' },
  completed:  { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled:  { bg: '#FFF5F5', color: '#C62828' },
};

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

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? { bg: C.bg, color: C.muted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.primary, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 22 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Appointment Form ──────────────────────────────────────────────────────────

function AppointmentForm({ initial = {}, patients, doctorProfiles, onSave, onClose, submitLabel = 'Book' }) {
  const [form, setForm] = useState({
    patientId:        initial.patientId ?? '',
    doctorProfileId:  initial.doctorProfileId ?? (doctorProfiles?.[0]?.id ?? ''),
    date:             initial.date ?? '',                 // YYYY-MM-DD
    time:             initial.time ?? '',                 // HH:MM
    reason:           initial.reason ?? 'Consultation',
    notes:            initial.notes ?? '',
    status:           initial.status ?? 'scheduled',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.patientId)       { setError('Select a patient'); return; }
    if (!form.doctorProfileId) { setError('Select a doctor profile'); return; }
    if (!form.date || !form.time) { setError('Pick a date and time'); return; }
    setLoading(true); setError('');
    // Backend contract: date = YYYY-MM-DD, time = HH:MM, reason (min 2). On edit,
    // patient/doctor can't change, so they're omitted there.
    const isEdit = submitLabel !== 'Book';
    const payload = isEdit
      ? { date: form.date, time: form.time, reason: form.reason, notes: form.notes, status: form.status }
      : { patientId: form.patientId, doctorProfileId: form.doctorProfileId, date: form.date, time: form.time, reason: form.reason, notes: form.notes };
    try { await onSave(payload); onClose(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Patient *">
        <select style={inputStyle} value={form.patientId} onChange={set('patientId')} required>
          <option value="">Select patient…</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Doctor Profile *">
        <select style={inputStyle} value={form.doctorProfileId} onChange={set('doctorProfileId')} required>
          <option value="">Select doctor…</option>
          {doctorProfiles.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty ?? 'General'}</option>)}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Date *">
          <input style={inputStyle} type="date" value={form.date} onChange={set('date')} required />
        </Field>
        <Field label="Time *">
          <input style={inputStyle} type="time" value={form.time} onChange={set('time')} required />
        </Field>
        <Field label="Reason / Type">
          <select style={inputStyle} value={form.reason} onChange={set('reason')}>
            {['Consultation', 'Follow-up', 'Emergency', 'Lab', 'Procedure', 'Other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={set('status')}>
            {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.notes} onChange={set('notes')} placeholder="Additional notes…" />
      </Field>
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

// ── Main View ─────────────────────────────────────────────────────────────────

export function AppointmentsView({ actor, appointments, patients, doctorProfiles, onAddAppointment, onUpdateAppointment }) {
  const [tab,      setTab]      = useState('upcoming');
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState('');

  const now = new Date();

  const dt = a => new Date(`${a.date}T${a.time || '00:00'}`);

  const filtered = appointments
    .filter(a => {
      if (tab === 'upcoming')  return a.status === 'scheduled' && dt(a) >= now;
      if (tab === 'today')     return isToday(a.date);
      if (tab === 'completed') return a.status === 'completed';
      return true;
    })
    .filter(a =>
      !search ||
      a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => dt(a) - dt(b));

  const todayCount = appointments.filter(a => isToday(a.date)).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Appointments</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{todayCount} today</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Book Appointment
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.bg, borderRadius: 8, padding: 4, marginBottom: 16, width: 'fit-content' }}>
        {[['upcoming', 'Upcoming'], ['today', `Today (${todayCount})`], ['completed', 'Completed'], ['all', 'All']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
            background: tab === key ? C.white : 'transparent',
            color: tab === key ? C.primary : C.muted,
            fontWeight: tab === key ? 700 : 400,
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or type…"
          style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, boxSizing: 'border-box' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 14 }}>No appointments found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(appt => {
            const profileName = appt.doctorProfile?.name ?? doctorProfiles?.find(p => p.id === appt.doctorProfileId)?.name;
            const dateStr = new Date(`${appt.date}T${appt.time || '00:00'}`).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
            const timeStr = appt.time || '—';

            return (
              <div key={appt.id} style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Date block */}
                <div style={{ background: C.bg, borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 60, flexShrink: 0 }}>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{dateStr.split(',')[0]}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{dateStr.split(' ')[1]}</p>
                  <p style={{ fontSize: 10, color: C.muted }}>{dateStr.split(' ').slice(2).join(' ')}</p>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>
                      {appt.patient?.name ?? appt.patientName ?? 'Patient'}
                    </p>
                    <StatusBadge status={appt.status} />
                    <span style={{ fontSize: 12, color: C.muted }}>· {appt.reason ?? 'Consultation'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {timeStr}{profileName && ` · ${profileName}`}
                  </p>
                  {appt.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{appt.notes}</p>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {appt.status === 'scheduled' && (
                    <button onClick={() => onUpdateAppointment(appt.id, { status: 'completed' })}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: C.success, cursor: 'pointer', color: C.white, fontSize: 12, fontWeight: 600 }}>
                      ✓ Done
                    </button>
                  )}
                  <button onClick={() => setEditing(appt)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 12 }}>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Book Appointment" onClose={() => setShowAdd(false)}>
          <AppointmentForm patients={patients} doctorProfiles={doctorProfiles} onSave={onAddAppointment} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Appointment" onClose={() => setEditing(null)}>
          <AppointmentForm
            initial={editing}
            patients={patients}
            doctorProfiles={doctorProfiles}
            onSave={d => onUpdateAppointment(editing.id, d)}
            onClose={() => setEditing(null)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}
    </div>
  );
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
