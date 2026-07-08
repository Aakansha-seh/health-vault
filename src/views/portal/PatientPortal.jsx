import { useState, useEffect, useCallback, useRef } from 'react';
import { C } from '../../constants/theme';
import { Card, Input, Button } from '../../components/ui';
import {
  getPortalVisits, getPortalAppointments, getPortalFiles,
  uploadPortalFile, portalChangePassword, fetchReportBlob,
} from '../../services/api';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

async function openReportFile(r) {
  try {
    const blob = await fetchReportBlob(r.fileId ?? r.url ?? r.id);
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  } catch (e) {
    alert(e.message || 'Could not open the file');
  }
}

const REPORT_TYPES = ['Lab report', 'Prescription', 'Discharge summary', 'Scan / Imaging', 'Vaccination record', 'Other'];

// ─── Forced first-login password change ──────────────────────────────────────

function ChangePasswordGate({ onDone }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('New password must be at least 8 characters.');
    if (form.next !== form.confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      await portalChangePassword({ currentPassword: form.current, newPassword: form.next });
      onDone();
    } catch (err) {
      setError(err.message || 'Could not update the password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hv-bg-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="hv-fade-up" style={{ width: '100%', maxWidth: 420 }}>
        <Card style={{ padding: 32, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 8 }}>Set your new password</h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            For your security, please replace the temporary password you received by email.
          </p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Temporary password" type="password" required value={form.current}
              onChange={(e) => setForm(f => ({ ...f, current: e.target.value }))} />
            <Input label="New password (min. 8 characters)" type="password" required value={form.next}
              onChange={(e) => setForm(f => ({ ...f, next: e.target.value }))} />
            <Input label="Confirm new password" type="password" required value={form.confirm}
              onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} />
            {error && <p style={{ color: C.error, fontSize: 13 }}>{error}</p>}
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', padding: 12, marginTop: 6 }}>
              {loading ? 'Saving…' : 'Save & continue →'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ─── Portal shell ─────────────────────────────────────────────────────────────

export function PatientPortal({ actor, onLogout, onPasswordChanged }) {
  const [tab, setTab] = useState('visits');
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const [v, a, f] = await Promise.allSettled([getPortalVisits(), getPortalAppointments(), getPortalFiles()]);
    if (v.status === 'fulfilled') setVisits(v.value); else setLoadError(v.reason?.message || 'Could not load your records');
    if (a.status === 'fulfilled') setAppointments(a.value);
    if (f.status === 'fulfilled') setFiles(f.value);
    setLoading(false);
  }, []);

  useEffect(() => { if (!actor.mustChangePassword) load(); }, [actor.mustChangePassword, load]);

  if (actor.mustChangePassword) {
    return <ChangePasswordGate onDone={onPasswordChanged} />;
  }

  const hospitalName = actor.hospital?.name ?? 'Your hospital';
  const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(`${a.date}T${a.time || '00:00'}`) >= new Date());

  return (
    <div className="hv-bg-grid" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, padding: '12px 20px',
        background: C.white, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, background: C.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink ?? C.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hospitalName}</p>
            <p style={{ fontSize: 11, color: C.muted }}>Patient portal · {actor.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="hv-press" style={{
          padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
          background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.primary,
        }}>
          Sign out
        </button>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 60px' }}>
        {/* Read-only notice */}
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Your medical records are managed by {hospitalName} and cannot be edited or deleted here.
          You can add your previous records under <strong>My documents</strong> — your care team will see them.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['visits', `Visits (${visits.length})`], ['appointments', `Appointments (${upcoming.length})`], ['documents', `My documents (${files.length})`]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? C.primary : C.bg, color: tab === t ? C.white : C.muted,
              fontSize: 13, fontWeight: tab === t ? 600 : 500,
            }}>
              {label}
            </button>
          ))}
        </div>

        {loadError && (
          <Card style={{ padding: 16, marginBottom: 14, border: `1px solid ${C.error}40` }}>
            <p style={{ fontSize: 13, color: C.error }}>{loadError}</p>
            <Button variant="secondary" small onClick={load} style={{ marginTop: 8 }}>Retry</Button>
          </Card>
        )}

        {loading ? (
          <Card style={{ padding: 30, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.muted }}>Loading your records…</p>
          </Card>
        ) : (
          <>
            {tab === 'visits' && <VisitsTab visits={visits} />}
            {tab === 'appointments' && <AppointmentsTab appointments={appointments} />}
            {tab === 'documents' && <DocumentsTab files={files} onUploaded={load} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Visits (read-only timeline) ─────────────────────────────────────────────

function VisitsTab({ visits }) {
  const [expanded, setExpanded] = useState({});
  if (!visits.length) {
    return <Card style={{ padding: 30, textAlign: 'center' }}><p style={{ fontSize: 13, color: C.muted }}>No visits on record yet.</p></Card>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {visits.map((v) => {
        const open = !!expanded[v.id];
        return (
          <Card key={v.id} style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpanded(p => ({ ...p, [v.id]: !open }))}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{fmtDate(v.date)}</span>
                {v.doctorProfile?.name && <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>· {v.doctorProfile.name}{v.doctorProfile.specialty ? ` (${v.doctorProfile.specialty})` : ''}</span>}
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{open ? 'Hide ▲' : 'Details ▼'}</span>
            </div>
            {!open && v.diagnosis && <p style={{ fontSize: 12, color: C.text, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.diagnosis}</p>}
            {open && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                {v.chiefComplaint && <p style={{ fontSize: 13, color: C.text }}><strong>Complaint:</strong> {v.chiefComplaint}</p>}
                {v.diagnosis && <p style={{ fontSize: 13, color: C.text }}><strong>Diagnosis:</strong> {v.diagnosis}</p>}
                {v.prescription && <p style={{ fontSize: 13, color: C.text }}><strong>Rx:</strong> {v.prescription}</p>}
                {v.testsPrescribed && <p style={{ fontSize: 13, color: C.text }}><strong>Tests:</strong> {v.testsPrescribed}</p>}
                {v.followUpDate && <p style={{ fontSize: 13, color: C.text }}><strong>Follow-up:</strong> {fmtDate(v.followUpDate)}</p>}
                {Array.isArray(v.testReports) && v.testReports.length > 0 && (
                  <p style={{ fontSize: 13, color: C.text }}>
                    <strong>Reports:</strong>{' '}
                    {v.testReports.map((r, i) => (
                      <span key={r.fileId ?? r.url ?? i}>
                        {i > 0 && ', '}
                        <a onClick={() => openReportFile(r)} style={{ color: C.secondary, cursor: 'pointer', textDecoration: 'underline' }}>
                          {r.reportType ?? r.name ?? `Report ${i + 1}`}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Appointments ─────────────────────────────────────────────────────────────

function AppointmentsTab({ appointments }) {
  if (!appointments.length) {
    return <Card style={{ padding: 30, textAlign: 'center' }}><p style={{ fontSize: 13, color: C.muted }}>No appointments on record.</p></Card>;
  }
  const statusColor = { scheduled: C.secondary, completed: C.success ?? C.secondary, cancelled: C.error };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {appointments.map((a) => (
        <Card key={a.id} style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{fmtDate(a.date)} · {a.time}</span>
              {a.doctorProfile?.name && <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>· {a.doctorProfile.name}</span>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[a.status] ?? C.muted, textTransform: 'capitalize' }}>{a.status}</span>
          </div>
          {a.reason && <p style={{ fontSize: 12, color: C.text, marginTop: 6 }}>{a.reason}</p>}
        </Card>
      ))}
    </div>
  );
}

// ─── My documents (list + upload — the patient's only write) ────────────────

function DocumentsTab({ files, onUploaded }) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';                       // allow re-picking the same file
    if (!file) return;
    setError(''); setSuccess('');
    if (file.size > 15 * 1024 * 1024) return setError('Files must be 15 MB or smaller.');
    setUploading(true);
    try {
      await uploadPortalFile(file, reportType);
      setSuccess(`"${file.name}" uploaded — your care team can now see it.`);
      await onUploaded();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>Upload a previous record</p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
          PDF, image, or document up to 15 MB. Uploaded files are shared with your care team and cannot be deleted from the portal.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{
            padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.white, color: C.text, fontSize: 13,
          }}>
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx" style={{ display: 'none' }} onChange={onPick} />
          <Button variant="primary" small disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : '+ Choose file'}
          </Button>
        </div>
        {error && <p style={{ fontSize: 12, color: C.error, marginTop: 10 }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: C.success ?? C.secondary, marginTop: 10 }}>{success}</p>}
      </Card>

      {files.length === 0 ? (
        <Card style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted }}>You have not uploaded any documents yet.</p>
        </Card>
      ) : (
        files.map((f) => (
          <Card key={f.id} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{f.reportType ? `${f.reportType} · ` : ''}{fmtDate(f.createdAt)}</p>
            </div>
            <Button variant="secondary" small onClick={() => openReportFile(f)}>Open</Button>
          </Card>
        ))
      )}
    </div>
  );
}
