import { useReducer, useCallback, useMemo, useState } from 'react';

// ── Core state ──
import { reducer, initialState, ACTIONS } from './store/reducer';

// ── Layout ──
import { GlobalStyle, Sidebar, BottomNav } from './components/layout';

// ── Screens ──
import { SplashScreen }       from './views/SplashScreen';
import { LoginScreen }        from './views/auth/LoginScreen';
import { SignUpScreen }       from './views/auth/SignUpScreen';
import { PatientsView }       from './views/patients/PatientsView';
import { AppointmentsView }   from './views/appointments/AppointmentsView';
import { Dashboard }          from './views/dashboard/Dashboard';
import { AuditLogView }       from './views/audit/AuditLogView';
import { DoctorProfile }      from './views/profile/DoctorProfile';

// ── Design tokens ──
import { C } from './constants/theme';

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [state,    dispatch] = useReducer(reducer, initialState);
  const [splashed,    setSplashed]    = useState(false);
  const [view,        setView]        = useState('patients');
  const [authScreen,  setAuthScreen]  = useState('login'); // 'login' | 'signup'

  /* ── Derived from state ── */
  const doctor = useMemo(
    () => state.doctors.find((d) => d.id === state.currentDoctorId) ?? null,
    [state.doctors, state.currentDoctorId]
  );

  const clinic = useMemo(
    () => doctor ? state.clinics.find((c) => c.id === doctor.clinicId) ?? null : null,
    [state.clinics, doctor]
  );

  const clinicPatients = useMemo(
    () => state.patients.filter((p) => p.clinicId === clinic?.id),
    [state.patients, clinic]
  );

  const clinicAppointments = useMemo(
    () => state.appointments.filter((a) => a.clinicId === clinic?.id),
    [state.appointments, clinic]
  );

  /* ── Audit helper ── */
  const logAudit = useCallback((action, detail) => {
    dispatch({
      type:  ACTIONS.AUDIT,
      entry: {
        action,
        detail,
        timestamp: new Date().toISOString(),
        doctorId:  state.currentDoctorId,
      },
    });
  }, [state.currentDoctorId]);

  /* ── Auth ── */
  const handleLogin = useCallback((doctorId) => {
    dispatch({ type: ACTIONS.LOGIN, doctorId });
    const d = state.doctors.find((doc) => doc.id === doctorId);
    logAudit(ACTIONS.LOGIN, `${d?.name} signed in`);
    setView('patients');
  }, [state.doctors, logAudit]);

  const handleLogout = useCallback(() => {
    logAudit(ACTIONS.LOGOUT, `${doctor?.name} signed out`);
    dispatch({ type: ACTIONS.LOGOUT });
    setAuthScreen('login');
    setView('patients');
  }, [doctor, logAudit]);

  const handleRegister = useCallback((newDoctor) => {
    dispatch({ type: ACTIONS.REGISTER_DOCTOR, payload: newDoctor });
    // Log the registration, then auto-login as the new doctor.
    dispatch({
      type:  ACTIONS.AUDIT,
      entry: {
        action:    ACTIONS.REGISTER_DOCTOR,
        detail:    `${newDoctor.name} created an account`,
        timestamp: new Date().toISOString(),
        doctorId:  newDoctor.id,
      },
    });
    dispatch({ type: ACTIONS.LOGIN, doctorId: newDoctor.id });
    setAuthScreen('login');
    setView('patients');
  }, []);

  /* ── Patient actions ── */
  const handleAddPatient = useCallback((patient) => {
    dispatch({ type: ACTIONS.ADD_PATIENT, payload: patient });
    logAudit(ACTIONS.ADD_PATIENT, `Added patient: ${patient.name}`);
  }, [logAudit]);

  const handleUpdatePatient = useCallback((patient) => {
    dispatch({ type: ACTIONS.UPDATE_PATIENT, payload: patient });
    logAudit(ACTIONS.UPDATE_PATIENT, `Updated patient: ${patient.name}`);
  }, [logAudit]);

  const handleAddVisit = useCallback((patientId, visit) => {
    dispatch({ type: ACTIONS.ADD_VISIT, patientId, visit });
    const p = state.patients.find((pat) => pat.id === patientId);
    logAudit(ACTIONS.ADD_VISIT, `Visit recorded for ${p?.name ?? patientId}: ${visit.diagnosis}`);
  }, [state.patients, logAudit]);

  /* ── Appointment actions ── */
  const handleAddAppointment = useCallback((appt) => {
    dispatch({ type: ACTIONS.ADD_APPOINTMENT, payload: appt });
    const p = state.patients.find((pat) => pat.id === appt.patientId);
    logAudit(ACTIONS.ADD_APPOINTMENT, `Appointment scheduled for ${p?.name ?? appt.patientId} on ${appt.date}`);
  }, [state.patients, logAudit]);

  const handleUpdateAppointment = useCallback((apptId, status) => {
    const appt = state.appointments.find((a) => a.id === apptId);
    if (!appt) return;
    const updated = { ...appt, status };
    dispatch({ type: ACTIONS.UPDATE_APPOINTMENT, payload: updated });
    const p = state.patients.find((pat) => pat.id === appt.patientId);
    logAudit(ACTIONS.UPDATE_APPOINTMENT, `Appointment for ${p?.name ?? appt.patientId} marked ${status}`);
  }, [state.appointments, state.patients, logAudit]);

  /* ── Profile action ── */
  const handleUpdateDoctor = useCallback((updatedDoctor) => {
    dispatch({ type: ACTIONS.UPDATE_DOCTOR, doctorId: updatedDoctor.id, payload: updatedDoctor });
    logAudit(ACTIONS.UPDATE_DOCTOR, `${updatedDoctor.name} updated their profile`);
  }, [logAudit]);

  /* ── Render phases ── */
  if (!splashed) {
    return (
      <>
        <GlobalStyle />
        <SplashScreen onComplete={() => setSplashed(true)} />
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <GlobalStyle />
        {authScreen === 'signup' ? (
          <SignUpScreen
            clinics={state.clinics}
            doctors={state.doctors}
            onRegister={handleRegister}
            onBack={() => setAuthScreen('login')}
          />
        ) : (
          <LoginScreen
            doctors={state.doctors}
            clinics={state.clinics}
            onLogin={handleLogin}
            onSignUp={() => setAuthScreen('signup')}
          />
        )}
      </>
    );
  }

  /* ── Main app shell ── */
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
        {/* Desktop sidebar */}
        <Sidebar
          view={view}
          setView={setView}
          doctor={doctor}
          onLogout={handleLogout}
        />

        {/* Content area */}
        <main
          style={{
            flex:       1,
            marginLeft: 220,           /* sidebar width */
            padding:    '28px 32px',
            paddingBottom: 80,         /* clear mobile bottom nav */
            maxWidth:   '100%',
            overflowX:  'hidden',
          }}
          className="main-content"
        >
          {view === 'patients' && (
            <PatientsView
              key={doctor.id}
              patients={clinicPatients}
              doctor={doctor}
              clinic={clinic}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onAddVisit={handleAddVisit}
            />
          )}

          {view === 'appointments' && (
            <AppointmentsView
              appointments={clinicAppointments}
              patients={clinicPatients}
              doctor={doctor}
              clinic={clinic}
              onAdd={handleAddAppointment}
              onUpdate={handleUpdateAppointment}
            />
          )}

          {view === 'dashboard' && (
            <Dashboard
              patients={clinicPatients}
              appointments={clinicAppointments}
            />
          )}

          {view === 'audit' && (
            <AuditLogView log={state.auditLog} />
          )}

          {view === 'profile' && (
            <DoctorProfile
              doctor={doctor}
              clinic={clinic}
              onSave={handleUpdateDoctor}
            />
          )}
        </main>

        {/* Mobile bottom tab bar */}
        <BottomNav view={view} setView={setView} />
      </div>
    </>
  );
}
