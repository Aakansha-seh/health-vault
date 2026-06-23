import { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/theme';
import { getUploadConfig, uploadReportFile } from '../../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text, background: C.white, boxSizing: 'border-box',
};
const btnPrimary = {
  padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: C.primary, color: C.white, fontSize: 14, fontWeight: 600,
};

function Field({ label, required, children, full }) {
  return (
    <div style={{ marginBottom: 14, ...(full ? { gridColumn: '1/-1' } : {}) }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.primary, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.error }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{ gridColumn: '1/-1', fontSize: 12, fontWeight: 700, color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.6, margin: '8px 0 2px' }}>
      {children}
    </p>
  );
}

/**
 * PatientIntakeForm — front-desk walk-in intake. One submit creates the patient,
 * their first clinical visit, and (optionally) the next appointment.
 *
 * onSave(payload) should call the /patients/intake endpoint.
 */
export function PatientIntakeForm({ doctorProfiles = [], onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', gender: '', age: '', bloodGroup: '', allergies: '', address: '',
    doctorProfileId: doctorProfiles[0]?.id ?? '',
    symptoms: '', diagnosis: '', prescription: '', testsPrescribed: '', notes: '',
    appointmentDate: '', appointmentTime: '', appointmentReason: 'Follow-up',
  });
  const [reports, setReports]   = useState([]);     // [{ name, url, type }]
  const [uploads, setUploads]   = useState({ busy: false, error: '' });
  const [uploadOn, setUploadOn] = useState(false);  // Azure configured?
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const fileRef = useRef(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    getUploadConfig().then(r => setUploadOn(!!r.configured)).catch(() => setUploadOn(false));
  }, []);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploads({ busy: true, error: '' });
    try {
      for (const file of files) {
        const meta = await uploadReportFile(file);
        setReports(prev => [...prev, meta]);
      }
    } catch (err) {
      setUploads(u => ({ ...u, error: err.message || 'Upload failed' }));
    } finally {
      setUploads(u => ({ ...u, busy: false }));
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeReport = (url) => setReports(prev => prev.filter(r => r.url !== url));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())          { setError('Patient name is required'); return; }
    if (!form.doctorProfileId)      { setError('Select a doctor'); return; }
    if (!form.symptoms.trim())      { setError('Symptoms are required'); return; }
    if (form.appointmentDate && !form.appointmentTime) { setError('Pick a time for the next appointment'); return; }
    if (form.appointmentTime && !form.appointmentDate) { setError('Pick a date for the next appointment'); return; }

    setLoading(true); setError('');
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      age: form.age ? Number(form.age) : undefined,
      bloodGroup: form.bloodGroup || undefined,
      allergies: form.allergies.trim() || undefined,
      address: form.address.trim() || undefined,
      doctorProfileId: form.doctorProfileId,
      symptoms: form.symptoms.trim(),
      diagnosis: form.diagnosis.trim() || undefined,
      prescription: form.prescription.trim() || undefined,
      testsPrescribed: form.testsPrescribed.trim() || undefined,
      notes: form.notes.trim() || undefined,
      testReports: reports.length ? reports : undefined,
      appointmentDate: form.appointmentDate || undefined,
      appointmentTime: form.appointmentTime || undefined,
      appointmentReason: form.appointmentReason.trim() || undefined,
    };
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save intake');
      setLoading(false);
    }
  };

  const noDoctors = doctorProfiles.length === 0;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

        <SectionTitle>Patient</SectionTitle>
        <Field label="Full Name" required full>
          <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Patient full name" required />
        </Field>
        <Field label="Phone Number">
          <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Age">
          <input style={inputStyle} type="number" min="0" max="150" value={form.age} onChange={set('age')} placeholder="e.g. 34" />
        </Field>
        <Field label="Gender">
          <select style={inputStyle} value={form.gender} onChange={set('gender')}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <Field label="Blood Group">
          <select style={inputStyle} value={form.bloodGroup} onChange={set('bloodGroup')}>
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Known Allergies" full>
          <input style={inputStyle} value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, dust… (leave blank if none)" />
        </Field>
        <Field label="Address" full>
          <input style={inputStyle} value={form.address} onChange={set('address')} placeholder="Full address" />
        </Field>

        <SectionTitle>Consultation</SectionTitle>
        <Field label="Assign Doctor" required full>
          <select style={inputStyle} value={form.doctorProfileId} onChange={set('doctorProfileId')} required>
            <option value="">{noDoctors ? 'No doctor profiles available' : 'Select doctor…'}</option>
            {doctorProfiles.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty ?? 'General'}</option>)}
          </select>
        </Field>
        <Field label="Symptoms / Chief Complaint" required full>
          <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.symptoms} onChange={set('symptoms')} placeholder="Fever, cough for 3 days…" required />
        </Field>
        <Field label="Diagnosis">
          <input style={inputStyle} value={form.diagnosis} onChange={set('diagnosis')} placeholder="Provisional diagnosis" />
        </Field>
        <Field label="Tests Prescribed">
          <input style={inputStyle} value={form.testsPrescribed} onChange={set('testsPrescribed')} placeholder="CBC, X-ray chest…" />
        </Field>
        <Field label="Prescription" full>
          <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.prescription} onChange={set('prescription')} placeholder="Medication, dosage, duration…" />
        </Field>
        <Field label="Notes" full>
          <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={form.notes} onChange={set('notes')} placeholder="Any extra observations…" />
        </Field>

        <SectionTitle>Reports {uploadOn ? '' : '(uploads not configured)'}</SectionTitle>
        <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            disabled={!uploadOn || uploads.busy}
            onChange={handleFiles}
            style={{ fontSize: 13, color: C.text }}
          />
          {uploads.busy && <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Uploading…</p>}
          {uploads.error && <p style={{ fontSize: 12, color: C.error, marginTop: 6 }}>{uploads.error}</p>}
          {!uploadOn && <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Add an Azure connection string on the server to enable report uploads.</p>}
          {reports.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reports.map(r => (
                <div key={r.url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, borderRadius: 8, padding: '6px 10px' }}>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.secondary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</a>
                  <button type="button" onClick={() => removeReport(r.url)} style={{ background: 'none', border: 'none', color: C.error, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <SectionTitle>Next Appointment (optional)</SectionTitle>
        <Field label="Date">
          <input style={inputStyle} type="date" value={form.appointmentDate} onChange={set('appointmentDate')} />
        </Field>
        <Field label="Time">
          <input style={inputStyle} type="time" value={form.appointmentTime} onChange={set('appointmentTime')} />
        </Field>
        <Field label="Reason" full>
          <input style={inputStyle} value={form.appointmentReason} onChange={set('appointmentReason')} placeholder="Follow-up, report review…" />
        </Field>
      </div>

      {error && <p style={{ color: C.error, fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={{ ...btnPrimary, background: C.bg, color: C.text }}>Cancel</button>
        <button type="submit" disabled={loading || uploads.busy} style={{ ...btnPrimary, opacity: (loading || uploads.busy) ? 0.7 : 1 }}>
          {loading ? 'Saving…' : 'Register Patient'}
        </button>
      </div>
    </form>
  );
}
