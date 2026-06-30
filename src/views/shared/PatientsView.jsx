import { useState, useEffect } from 'react';
import { C, shadow } from '../../constants/theme';
import { PatientIntakeForm } from './PatientIntakeForm';
import { ReportUploader, openReportFile } from '../../components/ui/ReportUploader';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function renderTextWithVitals(text) {
  if (!text) return '';

  const regex = /(BP|Blood\s+Pressure)[\s:]*(\d{2,3})\s*\/\s*(\d{2,3})|(SpO2)[\s:]*(\d{2,3})%?|(HR|Pulse)[\s:]*(\d{2,3})\s*(bpm)?|(Temp|Temperature)[\s:]*(\d{2,3}(?:\.\d)?)\s*(F|C)?/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedText = match[0];

    if (match[1]) {
      const sys = parseInt(match[2], 10);
      const dia = parseInt(match[3], 10);
      let badgeType = 'stable';
      if (sys >= 140 || dia >= 90) badgeType = 'critical';
      else if (sys >= 120 || dia >= 80) badgeType = 'warning';

      parts.push(
        <span key={match.index} className={`hv-vital-badge-${badgeType}`} title={`BP Level: ${badgeType.toUpperCase()}`}>
          {matchedText}
        </span>
      );
    }
    else if (match[4]) {
      const spo2 = parseInt(match[5], 10);
      let badgeType = 'stable';
      if (spo2 < 92) badgeType = 'critical';
      else if (spo2 < 95) badgeType = 'warning';

      parts.push(
        <span key={match.index} className={`hv-vital-badge-${badgeType}`} title={`SpO2 Level: ${badgeType.toUpperCase()}`}>
          {matchedText}
        </span>
      );
    }
    else if (match[6]) {
      const hr = parseInt(match[7], 10);
      let badgeType = 'stable';
      if (hr > 105 || hr < 50) badgeType = 'critical';
      else if (hr > 95 || hr < 60) badgeType = 'warning';

      parts.push(
        <span key={match.index} className={`hv-vital-badge-${badgeType}`} title={`HR Level: ${badgeType.toUpperCase()}`}>
          {matchedText}
        </span>
      );
    }
    else if (match[9]) {
      const temp = parseFloat(match[10]);
      const unit = (match[11] || 'F').toUpperCase();
      let isFever = false;
      if (unit === 'C') {
        isFever = temp >= 38.0;
      } else {
        isFever = temp >= 100.4;
      }
      const badgeType = isFever ? 'critical' : 'stable';

      parts.push(
        <span key={match.index} className={`hv-vital-badge-${badgeType}`} title={`Temp Level: ${badgeType.toUpperCase()}`}>
          {matchedText}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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

function Modal({ title, onClose, children, wide, closeOnBackdrop = true }) {
  return (
    <div
      onMouseDown={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose?.(); } : undefined}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div onMouseDown={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: wide ? 700 : 520, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.primary, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 22 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Patient Form ──────────────────────────────────────────────────────────────

function PatientForm({ initial = {}, onSave, onClose, submitLabel = 'Save' }) {
  const [form, setForm] = useState({
    name: initial.name ?? '', dob: initial.dob ? initial.dob.split('T')[0] : '',
    gender: initial.gender ?? '', phone: initial.phone ?? '', email: initial.email ?? '',
    bloodGroup: initial.bloodGroup ?? '', address: initial.address ?? '',
    allergies: initial.allergies ?? '', medicalHistory: initial.medicalHistory ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Full Name *">
            <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Patient full name" required />
          </Field>
        </div>
        <Field label="Date of Birth">
          <input style={inputStyle} type="date" value={form.dob} onChange={set('dob')} />
        </Field>
        <Field label="Gender">
          <select style={inputStyle} value={form.gender} onChange={set('gender')}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Blood Group">
          <select style={inputStyle} value={form.bloodGroup} onChange={set('bloodGroup')}>
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Email">
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="patient@email.com" />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Address">
            <input style={inputStyle} value={form.address} onChange={set('address')} placeholder="Full address" />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Known Allergies">
            <input style={inputStyle} value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, dust, etc." />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Medical History">
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.medicalHistory} onChange={set('medicalHistory')} placeholder="Past diagnoses, surgeries…" />
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

// ── Visit Form ────────────────────────────────────────────────────────────────

function VisitForm({ patient, doctorProfiles, onSave, onClose, initial = {}, submitLabel = 'Save Visit' }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    doctorProfileId: initial.doctorProfileId ?? initial.doctorProfile?.id ?? doctorProfiles?.[0]?.id ?? '',
    date: initial.date ? new Date(initial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    chiefComplaint:  initial.chiefComplaint  ?? '',
    diagnosis:       initial.diagnosis       ?? '',
    prescription:    initial.prescription    ?? '',
    testsPrescribed: initial.testsPrescribed ?? '',
    notes:           initial.notes           ?? '',
    followUpDate:    initial.followUpDate ? new Date(initial.followUpDate).toISOString().split('T')[0] : '',
    weight:          initial.weight ?? '',
  });
  const [reports, setReports] = useState(Array.isArray(initial.testReports) ? initial.testReports : []);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.doctorProfileId) { setError('Select a doctor profile'); return; }
    if (!form.chiefComplaint.trim()) { setError('Chief complaint is required'); return; }
    setLoading(true); setError('');
    const common = {
      chiefComplaint:  form.chiefComplaint,
      diagnosis:       form.diagnosis || undefined,
      prescription:    form.prescription || undefined,
      testsPrescribed: form.testsPrescribed || undefined,
      notes:           form.notes || undefined,
      weight:          form.weight ? Number(form.weight) : undefined,
      testReports:     reports.length ? reports : undefined,
    };
    // On edit, doctor/date/follow-up are immutable (the backend ignores them).
    const payload = isEdit
      ? common
      : { ...common, doctorProfileId: form.doctorProfileId, date: form.date, followUpDate: form.followUpDate || undefined };
    try { await onSave(payload); onClose(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{isEdit ? 'Editing visit for' : 'Recording visit for'} <strong style={{ color: C.primary }}>{patient.name}</strong></p>
      <Field label="Doctor Profile *">
        <SearchableSelect
          value={form.doctorProfileId}
          onChange={set('doctorProfileId')}
          disabled={isEdit}
          placeholder="Select profile"
          options={doctorProfiles.map(p => ({ value: p.id, label: `${p.name} — ${p.specialty ?? 'General'}` }))}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Visit Date">
          <input style={{ ...inputStyle, opacity: isEdit ? 0.6 : 1 }} type="date" value={form.date} onChange={set('date')} disabled={isEdit} />
        </Field>
        <Field label="Follow-up Date">
          <input style={{ ...inputStyle, opacity: isEdit ? 0.6 : 1 }} type="date" value={form.followUpDate} onChange={set('followUpDate')} disabled={isEdit} />
        </Field>
        <Field label="Weight (kg)">
          <input style={inputStyle} type="number" min="0" step="0.1" value={form.weight} onChange={set('weight')} placeholder="e.g. 72.5" />
        </Field>
      </div>
      <Field label="Chief Complaint *">
        <input style={inputStyle} value={form.chiefComplaint} onChange={set('chiefComplaint')} placeholder="Fever, headache, etc." required />
      </Field>
      <Field label="Diagnosis">
        <input style={inputStyle} value={form.diagnosis} onChange={set('diagnosis')} placeholder="ICD-10 code or description" />
      </Field>
      <Field label="Tests Prescribed">
        <input style={inputStyle} value={form.testsPrescribed} onChange={set('testsPrescribed')} placeholder="CBC, X-ray chest…" />
      </Field>
      <Field label="Prescription">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.prescription} onChange={set('prescription')} placeholder="Medications, dosage…" />
      </Field>
      <Field label="Notes">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={set('notes')} placeholder="Additional observations…" />
      </Field>
      <Field label="Reports">
        <ReportUploader reports={reports} setReports={setReports} />
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

// ── Patient Detail ────────────────────────────────────────────────────────────

function PatientDetail({ patient, doctorProfiles, canWrite, onAddVisit, onUpdateVisit, onUpdatePatient, onRequestAccess, onClose }) {
  const [tab,         setTab]         = useState('visits');
  const [showVisit,   setShowVisit]   = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [editVisit,   setEditVisit]   = useState(null);   // a visit being edited (within 12h)
  const [reqStatus,   setReqStatus]   = useState('idle'); // idle | sending | sent | error
  const [reqMsg,      setReqMsg]      = useState('');

  // A visit may be edited only within 12 hours of creation (and with write access).
  const editableVisit = (v) =>
    canWrite && v.createdAt && (Date.now() - new Date(v.createdAt).getTime()) < 12 * 60 * 60 * 1000;

  const age = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  // The profile(s) this patient is filed under — what we'd request write access to.
  const linkedProfileIds = [...new Set((patient.visits ?? []).map(v => v.doctorProfile?.id).filter(Boolean))];

  const requestAccess = async () => {
    if (!linkedProfileIds.length || !onRequestAccess) return;
    setReqStatus('sending'); setReqMsg('');
    try {
      await onRequestAccess({ doctorProfileId: linkedProfileIds[0], reason: `Requesting edit access to manage ${patient.name}.` });
      setReqStatus('sent');
    } catch (e) {
      setReqStatus('error'); setReqMsg(e.message || 'Could not send request');
    }
  };

  return (
    <Modal title={patient.name} onClose={onClose} wide closeOnBackdrop>
      {/* Patient header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.secondary }}>{patient.name?.[0] ?? '?'}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{patient.name}</h4>
          <p style={{ fontSize: 13, color: C.muted }}>
            {[age && `${age} yrs`, patient.gender, patient.bloodGroup].filter(Boolean).join(' · ')}
          </p>
          {patient.isReturning && (
            <span style={{ fontSize: 11, color: C.secondary, background: `${C.secondary}15`, padding: '2px 8px', borderRadius: 99, marginTop: 4, display: 'inline-block' }}>Returning patient</span>
          )}
        </div>
        {canWrite ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowEdit(true)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, color: C.primary }}>Edit</button>
            <button onClick={() => setShowVisit(true)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: 12 }}>+ Visit</button>
          </div>
        ) : (onRequestAccess && linkedProfileIds.length > 0) ? (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: C.muted, background: C.bg, padding: '3px 8px', borderRadius: 99, display: 'inline-block', marginBottom: 6 }}>Read-only</span>
            <br />
            <button
              onClick={requestAccess}
              disabled={reqStatus === 'sending' || reqStatus === 'sent'}
              style={{
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.secondary}`,
                background: reqStatus === 'sent' ? `${C.success}15` : 'transparent',
                color: reqStatus === 'sent' ? C.success : C.secondary,
                cursor: reqStatus === 'sent' ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
                opacity: reqStatus === 'sending' ? 0.6 : 1,
              }}
            >
              {reqStatus === 'sent' ? 'Request sent ✓' : reqStatus === 'sending' ? 'Requesting…' : 'Request edit access'}
            </button>
            {reqStatus === 'error' && <p style={{ fontSize: 11, color: C.error, marginTop: 4, maxWidth: 200 }}>{reqMsg}</p>}
          </div>
        ) : null}
      </div>

      {/* Quick info */}
      {(patient.phone || patient.email || patient.allergies) && (
        <div style={{ background: C.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {patient.phone    && <span style={{ fontSize: 12, color: C.text }}>{patient.phone}</span>}
          {patient.email    && <span style={{ fontSize: 12, color: C.text }}>{patient.email}</span>}
          {patient.allergies && <span style={{ fontSize: 12, color: C.error }}>⚠ {patient.allergies}</span>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {['visits', 'info', ...(patient.aiSummary ? ['ai'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? C.primary : C.bg,
            color: tab === t ? C.white : C.muted, fontSize: 13, fontWeight: tab === t ? 600 : 400,
          }}>
            {t === 'visits' ? `Visits (${patient.visits?.length ?? 0})` : t === 'ai' ? 'AI Summary' : 'Info'}
          </button>
        ))}
      </div>

      {tab === 'visits' && (
        <div>
          {(patient.visits?.length ?? 0) === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, padding: '16px 0' }}>No visits recorded yet.</p>
          ) : [...(patient.visits ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map(v => (
            <div key={v.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>
                  {new Date(v.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {v.doctorProfile?.name && <span style={{ fontSize: 12, color: C.secondary }}>{v.doctorProfile.name}</span>}
                  {editableVisit(v) && (
                    <button type="button" onClick={() => setEditVisit(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, fontSize: 12, fontWeight: 600, padding: 0 }}>Edit</button>
                  )}
                </div>
              </div>
              {v.chiefComplaint  && <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}><strong>Complaint:</strong> {renderTextWithVitals(v.chiefComplaint)}</p>}
              {(v.weight || v.weight === 0) && <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}><strong>Weight:</strong> {v.weight} kg</p>}
              {v.diagnosis       && <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}><strong>Diagnosis:</strong> {renderTextWithVitals(v.diagnosis)}</p>}
              {v.prescription    && <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}><strong>Rx:</strong> {renderTextWithVitals(v.prescription)}</p>}
              {v.testsPrescribed && <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}><strong>Tests:</strong> {renderTextWithVitals(v.testsPrescribed)}</p>}
              {Array.isArray(v.testReports) && v.testReports.length > 0 && (
                <p style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>
                  <strong>Reports:</strong>{' '}
                  {v.testReports.map((r, i) => (
                    <span key={r.fileId ?? r.url ?? i}>
                      {i > 0 && ', '}
                      <a onClick={() => openReportFile(r)} style={{ color: C.secondary, cursor: 'pointer' }}>{r.reportType ?? r.name ?? `Report ${i + 1}`}</a>
                    </span>
                  ))}
                </p>
              )}
              {v.notes           && <p style={{ fontSize: 12, color: C.muted }}>{renderTextWithVitals(v.notes)}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && patient.aiSummary && (
        <div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
            {patient.aiSummaryModel ? `Generated with ${patient.aiSummaryModel}` : 'Saved AI summary'}
            {patient.aiSummaryAt && ` · ${new Date(patient.aiSummaryAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </p>
          <div style={{ background: C.bg, borderRadius: 8, padding: '14px 16px', maxHeight: 460, overflowY: 'auto', fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {patient.aiSummary.replace(/\*\*/g, '')}
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 10, fontStyle: 'italic' }}>
            AI-generated decision support. The treating clinician is responsible for all clinical decisions.
          </p>
        </div>
      )}

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Address',        patient.address],
            ['Medical History', patient.medicalHistory],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}>{k}</p>
              <p style={{ fontSize: 13, color: C.text }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {showVisit && (
        <Modal title="Record Visit" onClose={() => setShowVisit(false)}>
          <VisitForm patient={patient} doctorProfiles={doctorProfiles} onSave={d => onAddVisit(patient.id, d)} onClose={() => setShowVisit(false)} />
        </Modal>
      )}
      {showEdit && (
        <Modal title="Edit Patient" onClose={() => setShowEdit(false)}>
          <PatientForm initial={patient} onSave={d => onUpdatePatient(patient.id, d)} onClose={() => setShowEdit(false)} />
        </Modal>
      )}
      {editVisit && (
        <Modal title="Edit Visit" onClose={() => setEditVisit(null)}>
          <VisitForm
            patient={patient}
            doctorProfiles={doctorProfiles}
            initial={editVisit}
            submitLabel="Save Changes"
            onSave={d => onUpdateVisit(patient.id, editVisit.id, d)}
            onClose={() => setEditVisit(null)}
          />
        </Modal>
      )}
    </Modal>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function PatientsView({ actor, patients, doctorProfiles, onAddPatient, onIntake, onUpdatePatient, onAddVisit, onUpdateVisit, onRequestAccess, initialPatientId, setInitialPatientId }) {
  const [search,       setSearch]       = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');   // filter patients by doctor profile
  const [showAdd,      setShowAdd]       = useState(false);
  const [selected,     setSelected]      = useState(null);

  useEffect(() => {
    if (initialPatientId) {
      const p = patients.find(x => x.id === initialPatientId);
      if (p) setSelected(p);
      setInitialPatientId(null);
    }
  }, [initialPatientId, patients, setInitialPatientId]);

  // Admins/receptionists may write hospital-wide. A DOCTOR may write only to
  // patients linked to a profile they hold READ_WRITE on (per-patient).
  const isPrivileged = actor?.type === 'admin' || actor?.role === 'RECEPTIONIST';
  const rwProfileIds = new Set(
    (doctorProfiles ?? []).filter(p => p.permission === 'READ_WRITE').map(p => p.id)
  );
  const hasAnyWrite = isPrivileged || rwProfileIds.size > 0;
  const canWritePatient = (p) =>
    isPrivileged || (p?.visits ?? []).some(v => rwProfileIds.has(v.doctorProfile?.id ?? v.doctorProfileId));

  // Client-side filter for loaded patients (search + doctor)
  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !search
      || p.name?.toLowerCase().includes(q)
      || p.phone?.includes(search)
      || p.email?.toLowerCase().includes(q);
    const matchesDoctor = !doctorFilter
      || (p.visits ?? []).some(v => (v.doctorProfile?.id ?? v.doctorProfileId) === doctorFilter);
    return matchesSearch && matchesDoctor;
  });

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Patients</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{patients.length} loaded</p>
        </div>
        {hasAnyWrite && (
          <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            New Patient
          </button>
        )}
      </div>

      {/* Search + doctor filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 420 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 200 }}>
          <SearchableSelect
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            placeholder="All doctors"
            options={[{ value: '', label: 'All doctors' }, ...doctorProfiles.map(d => ({ value: d.id, label: `${d.name}${d.specialty ? ` — ${d.specialty}` : ''}` }))]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="hv-table-wrap" style={{ background: C.white, borderRadius: 12, boxShadow: shadow, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Patient', 'Phone', 'Gender', 'Visits', 'Last Visit', ''].map(h => (
                <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: C.muted }}>No patients found.</td></tr>
            ) : filtered.map(p => {
              const lastVisit = p.visits?.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
              return (
                <tr key={p.id} onClick={() => setSelected(p)}
                  style={{ borderTop: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.secondary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.secondary }}>{p.name?.[0]}</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: C.primary, marginBottom: 1 }}>{p.name}</p>
                        {p.isReturning && <span style={{ fontSize: 10, color: C.secondary }}>Returning</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', color: C.text }}>{p.phone || '—'}</td>
                  <td style={{ padding: '11px 16px', color: C.muted }}>{p.gender || '—'}</td>
                  <td style={{ padding: '11px 16px', color: C.text }}>{p.visits?.length ?? 0}</td>
                  <td style={{ padding: '11px 16px', color: C.muted }}>{lastVisit ? formatDate(lastVisit.date) : 'None'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ color: C.secondary, fontSize: 12, fontWeight: 600 }}>View →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        actor?.role === 'RECEPTIONIST'
          ? (
            <Modal title="New Patient — Intake" onClose={() => setShowAdd(false)} wide>
              <PatientIntakeForm doctorProfiles={doctorProfiles} onSave={onIntake} onClose={() => setShowAdd(false)} />
            </Modal>
          ) : (
            <Modal title="New Patient" onClose={() => setShowAdd(false)}>
              <PatientForm onSave={onAddPatient} onClose={() => setShowAdd(false)} submitLabel="Register Patient" />
            </Modal>
          )
      )}
      {selected && (
        <PatientDetail
          patient={selected}
          doctorProfiles={doctorProfiles}
          canWrite={canWritePatient(selected)}
          onAddVisit={onAddVisit}
          onUpdateVisit={onUpdateVisit}
          onUpdatePatient={onUpdatePatient}
          onRequestAccess={onRequestAccess}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
