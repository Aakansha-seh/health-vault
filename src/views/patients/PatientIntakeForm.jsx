import { useState, useEffect } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { uid } from '../../utils/helpers';
import { formatDate } from '../../utils/formatters';
import { ConfirmLeaveModal } from '../../components/ui';

// ─── Duplicate detection ───────────────────────────────────────────────────────
const normalisePhone = (s) => s.replace(/\D/g, '');

function nameScore(a, b) {
  const n = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const na = n(a), nb = n(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wa = na.split(' '), wb = nb.split(' ');
  const overlap = wa.filter((w) => wb.includes(w)).length;
  return overlap / Math.max(wa.length, wb.length);
}

function findDuplicate(name, phone, patients) {
  const p = normalisePhone(phone);
  if (p.length < 8 || !name.trim()) return null;
  return (
    patients.find((pt) => {
      const pp = normalisePhone(pt.phone ?? '');
      return pp === p && nameScore(name, pt.name) > 0.4;
    }) ?? null
  );
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
const FREQ_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'HS', 'Stat'];
const DUR_OPTIONS  = ['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];

function sectionHeader(label, color = C.primary) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
      color, paddingBottom: 7, borderBottom: `2px solid ${color}25`, marginBottom: 10,
    }}>
      {label}
    </div>
  );
}

function Field({ label, error, children, required }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: error ? C.error : C.muted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.error }}> *</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: C.error, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (err) => ({
  width: '100%', padding: '9px 11px', borderRadius: 6, outline: 'none', fontFamily: 'Inter',
  fontSize: 13, color: C.text, background: C.white, boxSizing: 'border-box',
  border: `1px solid ${err ? C.error : C.border}`, transition: 'border-color .15s',
});

function TextInput({ label, value, onChange, placeholder, type = 'text', required, error, autoFocus }) {
  return (
    <Field label={label} error={error} required={required}>
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle(error)}
        onFocus={(e) => (e.target.style.borderColor = error ? C.error : C.primary)}
        onBlur={(e)  => (e.target.style.borderColor = error ? C.error : C.border)}
      />
    </Field>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3, required, error }) {
  return (
    <Field label={label} error={error} required={required}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle(error), resize: 'vertical', lineHeight: 1.5 }}
        onFocus={(e) => (e.target.style.borderColor = error ? C.error : C.primary)}
        onBlur={(e)  => (e.target.style.borderColor = error ? C.error : C.border)}
      />
    </Field>
  );
}

function Select({ label, value, onChange, options, required, error }) {
  return (
    <Field label={label} error={error} required={required}>
      <select
        value={value}
        onChange={onChange}
        style={{ ...inputStyle(error), cursor: 'pointer' }}
        onFocus={(e) => (e.target.style.borderColor = C.primary)}
        onBlur={(e)  => (e.target.style.borderColor = error ? C.error : C.border)}
      >
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </Field>
  );
}

// ─── Duplicate card ────────────────────────────────────────────────────────────
function DuplicateCard({ patient, onAddVisit, onIgnore }) {
  const lastVisit = [...(patient.visits ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const hue = patient.id.charCodeAt(1) * 30;
  return (
    <div style={{
      background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 10,
      padding: '14px 16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(251,191,36,.15)',
    }} className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `hsl(${hue},40%,88%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 700, color: C.primary,
        }}>
          {patient.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#D97706"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient already exists</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{patient.name}</p>
          <p style={{ fontSize: 12, color: C.muted }}>
            {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
            {lastVisit ? ` · Last seen ${formatDate(lastVisit.date)}` : ' · No visits yet'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={onAddVisit}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: C.primary, color: C.white, fontSize: 13, fontWeight: 600,
            fontFamily: 'Inter', transition: 'opacity .12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Add new visit for {patient.name.split(' ')[0]}
        </button>
        <button
          onClick={onIgnore}
          style={{
            padding: '9px 16px', borderRadius: 7, border: `1px solid ${C.border}`, cursor: 'pointer',
            background: C.white, color: C.muted, fontSize: 13, fontFamily: 'Inter',
          }}
        >
          Register as new
        </button>
      </div>
    </div>
  );
}

// ─── Medication row ────────────────────────────────────────────────────────────
function MedRow({ med, onChange, onRemove, index }) {
  const set = (field) => (e) => onChange(index, field, e.target.value);
  const miniInput = { padding: '7px 8px', fontSize: 12, borderRadius: 5, border: `1px solid ${C.border}`, fontFamily: 'Inter', outline: 'none', background: C.white, color: C.text, width: '100%', boxSizing: 'border-box' };
  const miniSelect = { ...miniInput, cursor: 'pointer' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 68px 84px 24px', gap: 5, alignItems: 'center', marginBottom: 7 }}>
      <input value={med.name} onChange={set('name')} placeholder="Drug name" style={miniInput} onFocus={(e) => (e.target.style.borderColor = C.primary)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
      <input value={med.dose} onChange={set('dose')} placeholder="500mg" style={miniInput} onFocus={(e) => (e.target.style.borderColor = C.primary)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
      <select value={med.frequency} onChange={set('frequency')} style={miniSelect}>
        <option value="">Freq</option>
        {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={med.duration} onChange={set('duration')} style={miniSelect}>
        <option value="">Duration</option>
        {DUR_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <button onClick={() => onRemove(index)} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill={C.muted}><path d={ICONS.close}/></svg>
      </button>
    </div>
  );
}

// ─── Vitals grid ──────────────────────────────────────────────────────────────
function VitalsGrid({ vitals, setVitals }) {
  const set = (field) => (e) => setVitals((v) => ({ ...v, [field]: e.target.value }));
  const vInput = {
    padding: '8px 10px', fontSize: 13, borderRadius: '0 6px 6px 0',
    border: `1px solid ${C.border}`, borderLeft: 'none', fontFamily: 'Inter',
    outline: 'none', color: C.text, background: C.white, flex: 1, minWidth: 0,
  };
  const vUnit = {
    padding: '8px 10px', fontSize: 12, fontWeight: 600, color: C.muted,
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px 0 0 6px',
    whiteSpace: 'nowrap',
  };
  const field = (label, key, unit, placeholder) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex' }}>
        <span style={vUnit}>{unit}</span>
        <input value={vitals[key] ?? ''} onChange={set(key)} placeholder={placeholder} type="text" inputMode="decimal" style={vInput} onFocus={(e) => (e.target.style.borderColor = C.primary)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
      </div>
    </div>
  );

  const lbl = (text) => (
    <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>{text}</label>
  );

  // Every cell needs minWidth:0 so the flex child (unit+input) can shrink inside the grid column
  const cell = { minWidth: 0, overflow: 'hidden' };

  const vCell = (label, key, unit, placeholder) => (
    <div style={cell}>
      {lbl(label)}
      <div style={{ display: 'flex', minWidth: 0 }}>
        <span style={{ ...vUnit, flexShrink: 0 }}>{unit}</span>
        <input
          value={vitals[key] ?? ''} onChange={set(key)} placeholder={placeholder}
          type="text" inputMode="decimal"
          style={{ ...vInput, minWidth: 0, width: 0, flex: 1 }}
          onFocus={(e) => (e.target.style.borderColor = C.primary)}
          onBlur={(e)  => (e.target.style.borderColor = C.border)}
        />
      </div>
    </div>
  );

  return (
    <div className="vitals-grid grid-safe" style={{ display: 'grid', gap: 8 }}>

      {/* Temp — unit is a toggle button */}
      <div style={cell}>
        {lbl('Temp')}
        <div style={{ display: 'flex', minWidth: 0 }}>
          <button
            onClick={() => setVitals((v) => ({ ...v, tempUnit: v.tempUnit === 'F' ? 'C' : 'F' }))}
            style={{ ...vUnit, cursor: 'pointer', background: '#EEF2FF', color: C.primary, fontWeight: 700, flexShrink: 0 }}
          >°{vitals.tempUnit}</button>
          <input
            value={vitals.temp ?? ''} onChange={set('temp')}
            placeholder={vitals.tempUnit === 'F' ? '98.6' : '37'}
            type="text" inputMode="decimal"
            style={{ ...vInput, minWidth: 0, width: 0, flex: 1 }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e)  => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      {vCell('Height', 'height', 'cm',  '170')}
      {vCell('Weight', 'weight', 'kg',  '70')}
      {vCell('Pulse',  'pulse',  'bpm', '72')}
      {vCell('SpO₂',  'spo2',   '%',   '99')}

      {/* BP — two inputs in one cell */}
      <div style={cell}>
        {lbl('BP (mmHg)')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <input value={vitals.bpSys ?? ''} onChange={set('bpSys')} placeholder="120"
            type="text" inputMode="numeric"
            style={{ flex: 1, minWidth: 0, width: 0, padding: '8px 6px', fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: 'Inter', outline: 'none', color: C.text, background: C.white }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e)  => (e.target.style.borderColor = C.border)} />
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>/</span>
          <input value={vitals.bpDia ?? ''} onChange={set('bpDia')} placeholder="80"
            type="text" inputMode="numeric"
            style={{ flex: 1, minWidth: 0, width: 0, padding: '8px 6px', fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: 'Inter', outline: 'none', color: C.text, background: C.white }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e)  => (e.target.style.borderColor = C.border)} />
        </div>
      </div>

    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────
function Section({ label, color, accentBg, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ background: accentBg ?? 'transparent', borderRadius: 8, padding: '12px 14px', border: `1px solid ${color}22` }}>
        {sectionHeader(label, color)}
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PatientIntakeForm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PatientIntakeForm — unified new-patient + first-visit intake.
 *
 * mode="new"   — demographics (editable) + consultation
 * mode="visit" — demographics (read-only banner) + consultation only
 *
 * Duplicate detection: when both name + phone are filled, checks allPatients.
 * If match found → shows DuplicateCard; doctor can "Add visit" or "Register as new".
 */
export function PatientIntakeForm({
  mode = 'new',      // 'new' | 'visit'
  patient = null,    // pre-filled patient for 'visit' mode
  allPatients = [],  // all clinic patients for duplicate detection
  clinicId,
  doctorId,
  onSave,            // (newPatient, visit | null) → called on save
  onAddVisitOnly,    // (patientId, visit) → called when duplicate → "add visit"
  onCancel,
}) {
  const visitMode = mode === 'visit';

  // ── Demographics state ──
  const [demo, setDemo] = useState({
    name:              patient?.name              ?? '',
    age:               patient?.age               ?? '',
    gender:            patient?.gender            ?? 'Male',
    bloodGroup:        patient?.bloodGroup        ?? 'O+',
    phone:             patient?.phone             ?? '',
    allergies:         patient?.allergies         ?? '',
    chronicConditions: patient?.chronicConditions ?? '',
    insurance:         patient?.insurance         ?? '',
    address:           patient?.address           ?? '',
    emergencyContact:  patient?.emergencyContact  ?? '',
  });

  // ── Consultation state ──
  const today = new Date().toISOString().split('T')[0];
  const [consult, setConsult] = useState({
    date:           today,
    chiefComplaint: '',
    examination:    '',
    diagnosis:      '',
    advice:         '',
  });

  const [vitals, setVitalsRaw] = useState({ temp: '', tempUnit: 'F', height: '', weight: '', pulse: '', spo2: '', bpSys: '', bpDia: '' });
  const setVitals = (updater) => { setIsDirty(true); setVitalsRaw(updater); };

  const [meds, setMeds] = useState([{ id: uid(), name: '', dose: '', frequency: '', duration: '' }]);

  // ── Duplicate detection ──
  const [duplicate,      setDuplicate]      = useState(null);
  const [ignoredDup,     setIgnoredDup]     = useState(false);
  const [dupCheckDone,   setDupCheckDone]   = useState(false);

  const [errors,         setErrors]         = useState({});
  const [isDirty,        setIsDirty]        = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState('');

  // Run duplicate check whenever name or phone changes (not in visit mode)
  useEffect(() => {
    if (visitMode || ignoredDup) return;
    const dup = findDuplicate(demo.name, demo.phone, allPatients);
    setDuplicate(dup);
    if (demo.name.trim() && demo.phone.length >= 8) setDupCheckDone(true);
  }, [demo.name, demo.phone, visitMode, ignoredDup, allPatients]);

  const setD = (field) => (e) => {
    setIsDirty(true);
    setDemo((d) => ({ ...d, [field]: e.target.value }));
    setErrors((er) => { const next = { ...er }; delete next[field]; return next; });
  };

  const setC = (field) => (e) => {
    setIsDirty(true);
    setConsult((c) => ({ ...c, [field]: e.target.value }));
    setErrors((er) => { const next = { ...er }; delete next[field]; return next; });
  };

  // Medications
  const addMed    = () => { setIsDirty(true); setMeds((m) => [...m, { id: uid(), name: '', dose: '', frequency: '', duration: '' }]); };
  const removeMed = (i) => { setIsDirty(true); setMeds((m) => m.filter((_, idx) => idx !== i)); };
  const changeMed = (i, field, val) => { setIsDirty(true); setMeds((m) => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med)); };

  // Serialise meds to newline string for storage (compatible with prescription printer)
  const serialiseMeds = () =>
    meds.filter((m) => m.name.trim()).map((m) => {
      const parts = [m.name.trim()];
      if (m.dose)      parts.push(m.dose);
      if (m.frequency) parts.push(m.frequency);
      if (m.duration)  parts.push(`× ${m.duration}`);
      return parts.join(' — ');
    }).join('\n');

  // Serialise vitals to examination string
  const serialiseVitals = () => {
    const v = vitals;
    const parts = [];
    if (v.temp)  parts.push(`Temp ${v.temp}°${v.tempUnit}`);
    if (v.pulse) parts.push(`Pulse ${v.pulse} bpm`);
    if (v.spo2)  parts.push(`SpO₂ ${v.spo2}%`);
    if (v.bpSys && v.bpDia) parts.push(`BP ${v.bpSys}/${v.bpDia} mmHg`);
    if (v.height) parts.push(`Ht ${v.height} cm`);
    if (v.weight) parts.push(`Wt ${v.weight} kg`);
    const examText = consult.examination.trim();
    return [...parts, ...(examText ? [examText] : [])].join(' · ');
  };

  const hasConsultationData = () =>
    consult.chiefComplaint.trim() || consult.diagnosis.trim() || serialiseMeds();

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!visitMode) {
      if (!demo.name.trim())  errs.name  = 'Name is required.';
      if (!demo.age || isNaN(demo.age) || Number(demo.age) < 0 || Number(demo.age) > 130)
        errs.age = 'Valid age required (0–130).';
      if (!demo.phone.trim()) errs.phone = 'Phone is required.';
    }
    if (hasConsultationData()) {
      if (!consult.chiefComplaint.trim()) errs.chiefComplaint = 'Chief complaint is required when recording a visit.';
      if (!consult.diagnosis.trim())      errs.diagnosis      = 'Diagnosis is required when recording a visit.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ──
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');

    const visitObj = hasConsultationData() ? {
      date:           consult.date,
      chiefComplaint: consult.chiefComplaint.trim(),
      examination:    serialiseVitals(),
      diagnosis:      consult.diagnosis.trim(),
      medications:    serialiseMeds(),
      notes:          consult.advice.trim(),
    } : null;

    try {
      if (visitMode) {
        await onAddVisitOnly(patient.id, visitObj);
      } else {
        const newPatient = {
          name:              demo.name.trim(),
          age:               Number(demo.age),
          gender:            demo.gender,
          phone:             demo.phone.trim() || undefined,
          bloodGroup:        demo.bloodGroup || undefined,
          allergies:         demo.allergies.trim() || undefined,
          chronicConditions: demo.chronicConditions.trim() || undefined,
          insurance:         demo.insurance.trim() || undefined,
          address:           demo.address.trim() || undefined,
          emergencyContact:  demo.emergencyContact.trim() || undefined,
        };
        await onSave(newPatient, visitObj);
      }
    } catch (err) {
      setSaveError(err?.response?.data?.error ?? err.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Duplicate → add visit directly ──
  const handleDupVisit = () => {
    // Switch to visit mode for the found patient
    if (onAddVisitOnly) {
      // We'll still collect consultation data, but switch the "patient" context
      setIgnoredDup(false);
      onAddVisitOnly(duplicate.id, null); // signal parent to open AddVisit for this patient
    }
  };

  const showDuplicate = duplicate && !ignoredDup && dupCheckDone && !visitMode;

  // ── Save button label ──
  const saveLabel = visitMode
    ? 'Save visit'
    : hasConsultationData()
      ? 'Register patient & save visit'
      : 'Register patient';

  // ── Shared select options ──
  const genderOpts   = ['Male', 'Female', 'Other'];
  const bgOpts       = ['A+','A−','B+','B−','AB+','AB−','O+','O−'];

  const handleCancel = () => {
    if (isDirty) setShowLeaveModal(true);
    else onCancel();
  };

  return (
    <div className="fade-in" style={{ width: '100%', minWidth: 0 }}>
      <ConfirmLeaveModal
        open={showLeaveModal}
        onReturn={() => setShowLeaveModal(false)}
        onDiscard={onCancel}
      />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary, margin: 0 }}>
            {visitMode ? `New visit — ${patient.name}` : 'New patient intake'}
          </h2>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            {visitMode
              ? `${patient.age} yrs · ${patient.gender} · ${patient.bloodGroup}`
              : 'Register a new patient. Add the consultation details below or save demographics first.'}
          </p>
        </div>
        <button
          onClick={handleCancel}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.secondary, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.secondary} style={{ transform: 'rotate(180deg)' }}>
            <path d={ICONS.chevronRight} />
          </svg>
          {visitMode ? 'Back to patient' : 'Back to records'}
        </button>
      </div>


      {/* ── Duplicate card ── */}
      {showDuplicate && (
        <DuplicateCard
          patient={duplicate}
          onAddVisit={handleDupVisit}
          onIgnore={() => { setIgnoredDup(true); setDuplicate(null); }}
        />
      )}

      {/* ── Two-column layout ── */}
      <div className={visitMode ? '' : 'intake-2col grid-safe'} style={{ display: 'grid', gridTemplateColumns: visitMode ? 'minmax(0,680px)' : undefined, gap: 14, alignItems: 'start' }}>

        {/* ══ LEFT — Demographics ══════════════════════════════════════════ */}
        {!visitMode && (
          <div>

            {/* Patient basics */}
            <Section label="Patient information" color={C.primary} accentBg={C.white}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Phone FIRST — used for duplicate detection */}
                <TextInput
                  label="Mobile number"
                  value={demo.phone}
                  onChange={setD('phone')}
                  placeholder="10-digit number"
                  type="tel"
                  required
                  error={errors.phone}
                  autoFocus
                />

                <TextInput
                  label="Full name"
                  value={demo.name}
                  onChange={setD('name')}
                  placeholder="Patient's full name"
                  required
                  error={errors.name}
                />

                <div className="form-row" style={{ display: 'grid', gap: 10 }}>
                  <TextInput label="Age (years)" value={demo.age} onChange={setD('age')} placeholder="e.g. 35" type="number" required error={errors.age} />
                  <Select label="Gender" value={demo.gender} onChange={setD('gender')} options={genderOpts} required />
                </div>

                <Select label="Blood group" value={demo.bloodGroup} onChange={setD('bloodGroup')} options={bgOpts} />

                <TextInput label="Insurance / ABHA ID" value={demo.insurance} onChange={setD('insurance')} placeholder="Optional" />
              </div>
            </Section>

            {/* Medical history */}
            <Section label="Medical history" color="#7C3AED" accentBg={C.white}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Textarea label="Known allergies" value={demo.allergies} onChange={setD('allergies')} placeholder="e.g. Penicillin, Sulfa drugs…" rows={2} />
                <Textarea label="Chronic conditions" value={demo.chronicConditions} onChange={setD('chronicConditions')} placeholder="e.g. Type 2 diabetes, Hypertension…" rows={2} />
              </div>
            </Section>

            {/* Contact */}
            <Section label="Contact & emergency" color="#0891B2" accentBg={C.white}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <TextInput label="Emergency contact" value={demo.emergencyContact} onChange={setD('emergencyContact')} placeholder="Name — Phone number" />
                <Textarea label="Address" value={demo.address} onChange={setD('address')} placeholder="Patient's home address" rows={2} />
              </div>
            </Section>

          </div>
        )}

        {/* ══ RIGHT — Consultation ═════════════════════════════════════════ */}
        <div>

          {/* Visit date */}
          <Section label="Visit" color={C.secondary} accentBg={C.white}>
            <TextInput label="Date" value={consult.date} onChange={setC('date')} type="date" />
          </Section>

          {/* Chief complaint */}
          <Section label="Chief complaint" color="#7C3AED" accentBg="#F5F3FF">
            <Textarea
              value={consult.chiefComplaint}
              onChange={setC('chiefComplaint')}
              placeholder="e.g. Persistent dry cough for 5 days, worsening at night…"
              rows={3}
              error={errors.chiefComplaint}
            />
          </Section>

          {/* Vitals */}
          <Section label="Vitals" color="#DB2777" accentBg="#FDF2F8">
            <VitalsGrid vitals={vitals} setVitals={setVitals} />
            <div style={{ marginTop: 12 }}>
              <Textarea
                label="Additional examination findings"
                value={consult.examination}
                onChange={setC('examination')}
                placeholder="e.g. Chest clear, no wheeze, throat mildly erythematous…"
                rows={2}
              />
            </div>
          </Section>

          {/* Diagnosis */}
          <Section label="Diagnosis" color="#0891B2" accentBg="#ECFEFF">
            <Textarea
              value={consult.diagnosis}
              onChange={setC('diagnosis')}
              placeholder="e.g. Acute viral upper respiratory tract infection…"
              rows={2}
              error={errors.diagnosis}
            />
          </Section>

          {/* Prescription / Medications */}
          <Section label="Prescription" color="#059669" accentBg="#F0FDF4">
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 68px 84px 24px', gap: 5, marginBottom: 5 }}>
              {['Drug name', 'Dose', 'Freq', 'Duration', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</span>
              ))}
            </div>
            {meds.map((m, i) => (
              <MedRow key={m.id} med={m} onChange={changeMed} onRemove={removeMed} index={i} />
            ))}
            <button
              onClick={addMed}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px dashed #6EE7B7`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', color: '#059669', fontFamily: 'Inter', fontSize: 13, fontWeight: 500, marginTop: 4, width: '100%', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#059669"><path d={ICONS.plus}/></svg>
              Add another medicine
            </button>
          </Section>

          {/* Advice */}
          <Section label="Advice & instructions" color="#D97706" accentBg="#FFFBEB">
            <Textarea
              value={consult.advice}
              onChange={setC('advice')}
              placeholder="e.g. Rest for 3 days, increase fluid intake. Follow up if fever persists > 3 days. Avoid cold drinks…"
              rows={3}
            />
          </Section>

        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        background: 'rgba(248,249,252,.96)', backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${C.border}`, padding: '12px 0',
        display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8,
        boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
      }}>
        {saveError && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 7, padding: '8px 14px', fontSize: 13, color: C.error }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{ padding: '10px 22px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.muted, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter', fontSize: 14, opacity: saving ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 28px', borderRadius: 7, border: 'none', background: C.primary, color: C.white, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter', fontSize: 14, fontWeight: 600, transition: 'opacity .12s', opacity: saving ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '.88'; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1'; }}
          >
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
