import { useState, useCallback, useEffect } from 'react';

// ── API client ──
import {
  getMe, getToken, clearToken, setToken,
  getPatients, addPatient as apiAddPatient, updatePatient as apiUpdatePatient,
  addVisit as apiAddVisit, updateVisit as apiUpdateVisit,
  getAppointments, addAppointment as apiAddAppointment, updateAppointment as apiUpdateAppointment,
  getAuditLog, logAudit as apiLogAudit,
  getClinics, updateDoctor as apiUpdateDoctor,
} from './services/api';

// ── Layout ──
import { GlobalStyle, Sidebar, BottomNav } from './components/layout';

// ── Screens ──
import { SplashScreen }     from './views/SplashScreen';
import { LoginScreen }      from './views/auth/LoginScreen';
import { SignUpScreen }     from './views/auth/SignUpScreen';
import { PatientsView }     from './views/patients/PatientsView';
import { AppointmentsView } from './views/appointments/AppointmentsView';
import { Dashboard }        from './views/dashboard/Dashboard';
import { AuditLogView }     from './views/audit/AuditLogView';
import { DoctorProfile }    from './views/profile/DoctorProfile';

// ── Design tokens ──
import { C } from './constants/theme';

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [splashed,   setSplashed]   = useState(false);
  const [authScreen, setAuthScreen] = useState('login');
  const [view,       setView]       = useState('patients');

  // Auth state
  const [doctor,      setDoctor]      = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data state (all scoped to current doctor's clinic by the backend)
  const [clinics,      setClinics]      = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLog,     setAuditLog]     = useState([]);

  /* ── Derived ── */
  const clinic = doctor?.clinic ?? null;

  /* ── Load all clinic data after login ── */
  const loadData = useCallback(async () => {
    try {
      const [pats, appts, audit, cls] = await Promise.all([
        getPatients(),
        getAppointments(),
        getAuditLog({ limit: 500 }),
        getClinics(),
      ]);
      setPatients(pats);
      setAppointments(appts);
      setAuditLog(audit);
      setClinics(cls);
    } catch (err) {
      console.error('Failed to load clinic data:', err);
    }
  }, []);

  /* ── Restore session from localStorage on mount ── */
  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthLoading(false); return; }
    getMe()
      .then((doc) => { setDoctor(doc); return loadData(); })
      .catch(() => clearToken())
      .finally(() => setAuthLoading(false));
  }, [loadData]);

  /* ── Silent audit helper (never blocks UI) ── */
  const logAudit = useCallback((action, details) => {
    apiLogAudit(action, details).catch(() => {});
    // Optimistically prepend to local audit log
    setAuditLog((prev) => [{
      id:         crypto.randomUUID(),
      timestamp:  new Date().toISOString(),
      doctorId:   doctor?.id,
      doctorName: doctor?.name ?? '',
      clinicId:   doctor?.clinicId,
      action,
      details,
    }, ...prev].slice(0, 500));
  }, [doctor]);

  /* ── Auth handlers ── */
  const handleLogin = useCallback(async ({ doctor: doc }) => {
    setDoctor(doc);
    await loadData();
    setView('patients');
  }, [loadData]);

  const handleRegister = useCallback(async ({ doctor: doc }) => {
    setDoctor(doc);
    await loadData();
    setAuthScreen('login');
    setView('patients');
  }, [loadData]);

  const handleLogout = useCallback(() => {
    logAudit('LOGOUT', `${doctor?.name} signed out`);
    clearToken();
    setDoctor(null);
    setPatients([]);
    setAppointments([]);
    setAuditLog([]);
    setClinics([]);
    setAuthScreen('login');
    setView('patients');
  }, [doctor, logAudit]);

  /* ── Patient handlers ── */
  const handleAddPatient = useCallback(async (patientData) => {
    const patient = await apiAddPatient(patientData);
    setPatients((prev) => [{ ...patient, visits: [] }, ...prev]);
    logAudit('ADD_PATIENT', `Added patient: ${patient.name}`);
    return patient;
  }, [logAudit]);

  const handleUpdatePatient = useCallback(async (patientData) => {
    const updated = await apiUpdatePatient(patientData.id, patientData);
    setPatients((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
    logAudit('UPDATE_PATIENT', `Updated patient: ${updated.name}`);
    return updated;
  }, [logAudit]);

  const handleAddVisit = useCallback(async (patientId, visitData) => {
    const visit = await apiAddVisit(patientId, visitData);
    setPatients((prev) => prev.map((p) =>
      p.id === patientId
        ? { ...p, isReturning: true, visits: [visit, ...(p.visits ?? [])] }
        : p
    ));
    const p = patients.find((pt) => pt.id === patientId);
    logAudit('ADD_VISIT', `Visit recorded for ${p?.name ?? patientId}`);
    return visit;
  }, [patients, logAudit]);

  const handleUpdateVisit = useCallback(async (patientId, visitId, visitData) => {
    const visit = await apiUpdateVisit(patientId, visitId, visitData);
    setPatients((prev) => prev.map((p) =>
      p.id === patientId
        ? { ...p, visits: (p.visits ?? []).map((v) => v.id === visitId ? visit : v) }
        : p
    ));
    logAudit('EDIT_VISIT', `Edited visit for patient ${patientId}`);
    return visit;
  }, [logAudit]);

  /* ── Appointment handlers ── */
  const handleAddAppointment = useCallback(async (apptData) => {
    const appt = await apiAddAppointment(apptData);
    setAppointments((prev) => [...prev, appt]);
    const p = patients.find((pt) => pt.id === appt.patientId);
    logAudit('ADD_APPOINTMENT', `Appointment scheduled for ${p?.name ?? appt.patientId} on ${appt.date}`);
    return appt;
  }, [patients, logAudit]);

  const handleUpdateAppointment = useCallback(async (apptId, payload) => {
    const updated = await apiUpdateAppointment(apptId, payload);
    setAppointments((prev) => prev.map((a) => a.id === apptId ? updated : a));
    if (payload.status === 'completed') logAudit('COMPLETE_APPOINTMENT', `Appointment ${apptId} completed`);
    else if (payload.status === 'cancelled') logAudit('CANCEL_APPOINTMENT', `Appointment ${apptId} cancelled`);
    else logAudit('UPDATE_APPOINTMENT', `Appointment ${apptId} updated`);
    return updated;
  }, [logAudit]);

  /* ── Doctor profile handler ── */
  const handleUpdateDoctor = useCallback(async (updatedData) => {
    const updated = await apiUpdateDoctor(doctor.id, updatedData);
    setDoctor((prev) => ({ ...prev, ...updated }));
    logAudit('EDIT_PROFILE', `${updated.name} updated their profile`);
    return updated;
  }, [doctor, logAudit]);

  /* ── Render: splash ── */
  if (!splashed) {
    return (
      <>
        <GlobalStyle />
        <SplashScreen onComplete={() => setSplashed(true)} />
      </>
    );
  }

  /* ── Render: restoring session ── */
  if (authLoading) {
    return (
      <>
        <GlobalStyle />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
          <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
        </div>
      </>
    );
  }

  /* ── Render: auth screens ── */
  if (!doctor) {
    return (
      <>
        <GlobalStyle />
        {authScreen === 'signup' ? (
          <SignUpScreen
            clinics={clinics.length ? clinics : []}
            onRegister={handleRegister}
            onBack={() => setAuthScreen('login')}
          />
        ) : (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => {
              // Pre-load clinics for the signup form
              if (!clinics.length) getClinics().then(setClinics).catch(() => {});
              setAuthScreen('signup');
            }}
          />
        )}
      </>
    );
  }

  /* ── Render: main app shell ── */
  return (
    <>
      <GlobalStyle />
      <div
        style={{
          display:    'flex',
          minHeight:  '100vh',
          background: C.bg,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Sidebar view={view} setView={setView} doctor={doctor} onLogout={handleLogout} />

        <main
          style={{
            flex:          1,
            marginLeft:    220,
            padding:       '28px 32px',
            paddingBottom: 80,
            maxWidth:      '100%',
            overflowX:     'hidden',
          }}
          className="main-content"
        >
          {view === 'patients' && (
            <PatientsView
              key={doctor.id}
              patients={patients}
              doctor={doctor}
              clinic={clinic}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onAddVisit={handleAddVisit}
              onUpdateVisit={handleUpdateVisit}
            />
          )}

          {view === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              patients={patients}
              doctor={doctor}
              clinic={clinic}
              onAdd={handleAddAppointment}
              onUpdate={handleUpdateAppointment}
            />
          )}

          {view === 'dashboard' && (
            <Dashboard
              patients={patients}
              appointments={appointments}
            />
          )}

          {view === 'audit' && (
            <AuditLogView log={auditLog} />
          )}

          {view === 'profile' && (
            <DoctorProfile
              doctor={doctor}
              clinic={clinic}
              onSave={handleUpdateDoctor}
            />
          )}
        </main>

        <BottomNav view={view} setView={setView} />
      </div>
    </>
  );
}
