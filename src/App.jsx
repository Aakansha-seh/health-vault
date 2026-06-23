import { useState, useCallback, useEffect } from 'react';

import {
  getMe, getToken, clearToken, setToken,
  credentialLogin, adminLogin, logout as apiLogout,
  getPatients, addPatient as apiAddPatient, updatePatient as apiUpdatePatient, createPatientIntake as apiCreateIntake,
  addVisit as apiAddVisit, updateVisit as apiUpdateVisit,
  getAppointments, addAppointment as apiAddAppointment, updateAppointment as apiUpdateAppointment,
  getDoctorProfiles, createDoctorProfile as apiCreateProfile, updateDoctorProfile as apiUpdateProfile,
  getCredentials, createCredential as apiCreateCredential, updateCredential as apiUpdateCredential,
  grantAccess as apiGrantAccess, revokeAccess as apiRevokeAccess,
  getPermissionRequests, resolvePermissionRequest as apiResolveRequest, requestWriteAccess as apiRequestAccess,
  getAuditLog,
} from './services/api';

import { GlobalStyle, Sidebar, BottomNav } from './components/layout';
import { SplashScreen }        from './views/SplashScreen';
import { LoginScreen }         from './views/auth/LoginScreen';
import { HospitalSetup }       from './views/auth/HospitalSetup';
import { AdminDashboard }      from './views/admin/AdminDashboard';
import { CredentialsView }     from './views/admin/CredentialsView';
import { DoctorProfilesView }  from './views/admin/DoctorProfilesView';
import { PermissionsView }     from './views/admin/PermissionsView';
import { AuditLogView }        from './views/admin/AuditLogView';
import { DoctorDashboard }     from './views/credential/DoctorDashboard';
import { PatientsView }        from './views/shared/PatientsView';
import { AppointmentsView }    from './views/shared/AppointmentsView';
import { AISummaryView }       from './views/credential/AISummaryView';
import { SubscriptionView }    from './views/credential/SubscriptionView';

import { C } from './constants/theme';

// ─── Responsive helper ────────────────────────────────────────────────────────
// Single source of truth for the mobile breakpoint so the shell stays in sync
// with the CSS media queries in GlobalStyle (640px).
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia(`(max-width:${breakpoint}px)`).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isMobile;
}

// Slim top bar shown only on mobile (the sidebar is hidden there) so users keep
// access to the app identity and sign-out.
function MobileTopBar({ actor, onLogout }) {
  const hospitalName = actor?.hospitalName ?? actor?.hospital?.name ?? 'HealthVault';
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, height: 56, padding: '0 16px',
      background: C.white, borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospitalName}</span>
      </div>
      <button onClick={onLogout} aria-label="Sign out" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', flexShrink: 0, padding: 6 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </header>
  );
}

// ─── Nav configs per role ─────────────────────────────────────────────────────

const ADMIN_VIEWS = ['dashboard', 'credentials', 'profiles', 'permissions', 'audit'];
const DOCTOR_VIEWS = ['dashboard', 'patients', 'appointments', 'ai', 'subscription'];
const RECEPTIONIST_VIEWS = ['patients', 'appointments'];

function defaultView(actor) {
  if (!actor) return 'dashboard';
  if (actor.type === 'admin')       return 'dashboard';
  if (actor.role === 'RECEPTIONIST') return 'patients';
  return 'dashboard';
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [splashed,     setSplashed]     = useState(false);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [showSetup,    setShowSetup]    = useState(false);
  const [actor,        setActor]        = useState(null);
  const [view,         setView]         = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const isMobile = useIsMobile();

  // Data
  const [patients,        setPatients]        = useState([]);
  const [appointments,    setAppointments]    = useState([]);
  const [doctorProfiles,  setDoctorProfiles]  = useState([]);
  const [credentials,     setCredentials]     = useState([]);
  const [permRequests,    setPermRequests]    = useState([]);
  const [auditLog,        setAuditLog]        = useState([]);

  // ── Restore session ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthLoading(false); return; }
    getMe()
      .then(me => { setActor(me); return loadDataForActor(me); })
      .catch(() => clearToken())
      .finally(() => setAuthLoading(false));
  }, []);  // eslint-disable-line

  // If a payment return URL or /subscription deep-link is open, land there.
  // (Razorpay completes in-app via modal; this also covers the hosted-page fallback.)
  useEffect(() => {
    if (!actor) return;
    const p = new URLSearchParams(window.location.search);
    if (p.has('success') || p.has('cancelled') || window.location.pathname.includes('/subscription')) {
      setView('subscription');
    }
  }, [actor]);

  // Live-refresh a doctor's permission set so newly-approved write access (or a
  // revoke) reflects within seconds — no manual refresh/re-login needed.
  useEffect(() => {
    if (actor?.type !== 'credential' || actor?.role !== 'DOCTOR') return;
    let active = true;
    const refresh = () =>
      getDoctorProfiles()
        .then(p => { if (active) setDoctorProfiles(p); })
        .catch(() => {});
    const id = setInterval(refresh, 20000);          // poll every 20s
    const onFocus = () => refresh();                 // and instantly on tab focus
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [actor]);

  // ── Data loader ───────────────────────────────────────────────────────────

  const loadDataForActor = useCallback(async (me) => {
    // Each slice loads independently: one failing endpoint must NOT wipe the
    // entire dashboard (which previously made freshly-created records appear
    // "lost" on refresh). Settle all, apply whatever succeeded, log the rest.
    const apply = (result, setter, pick = (v) => v, label = '') => {
      if (result.status === 'fulfilled') setter(pick(result.value));
      else console.error(`Failed to load ${label}:`, result.reason);
    };

    if (me.type === 'admin') {
      const [profs, creds, pats, perms, audit] = await Promise.allSettled([
        getDoctorProfiles(),
        getCredentials(),
        getPatients(),
        getPermissionRequests(),
        getAuditLog({ limit: 200 }),
      ]);
      apply(profs, setDoctorProfiles, (v) => v, 'doctor profiles');
      apply(creds, setCredentials, (v) => v, 'credentials');
      apply(pats,  setPatients, (v) => v.patients ?? v, 'patients');
      apply(perms, setPermRequests, (v) => v, 'permission requests');
      apply(audit, setAuditLog, (v) => v.logs ?? v, 'audit log');
    } else {
      const [pats, appts, profs] = await Promise.allSettled([
        getPatients(),
        getAppointments(),
        // Both doctors and receptionists need the profile list (receptionists
        // pick a doctor at patient intake).
        (me.role === 'DOCTOR' || me.role === 'RECEPTIONIST') ? getDoctorProfiles() : Promise.resolve([]),
      ]);
      apply(pats,  setPatients, (v) => v.patients ?? v, 'patients');
      apply(appts, setAppointments, (v) => v, 'appointments');
      apply(profs, setDoctorProfiles, (v) => v, 'doctor profiles');
    }
  }, []);

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const handleLogin = useCallback(async ({ token, actor: me }) => {
    setToken(token);
    setActor(me);
    await loadDataForActor(me);
    setView(defaultView(me));
  }, [loadDataForActor]);

  const handleLogout = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    clearToken();
    setActor(null);
    setPatients([]); setAppointments([]); setDoctorProfiles([]);
    setCredentials([]); setPermRequests([]); setAuditLog([]);
    setView('dashboard');
  }, []);

  // ── Patient handlers ──────────────────────────────────────────────────────

  const handleAddPatient = useCallback(async (data) => {
    const p = await apiAddPatient(data);
    setPatients(prev => [{ ...p, visits: [] }, ...prev]);
    return p;
  }, []);

  // Combined front-desk intake: patient + first visit + optional next appointment
  const handleIntake = useCallback(async (data) => {
    const patient = await apiCreateIntake(data);          // { ...patient, visits, appointment }
    setPatients(prev => [{ ...patient, visits: patient.visits ?? [] }, ...prev]);
    if (patient.appointment) setAppointments(prev => [...prev, patient.appointment]);
    return patient;
  }, []);

  const handleUpdatePatient = useCallback(async (id, data) => {
    const updated = await apiUpdatePatient(id, data);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    return updated;
  }, []);

  const handleAddVisit = useCallback(async (patientId, data) => {
    const visit = await apiAddVisit(patientId, data);
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, visits: [visit, ...(p.visits ?? [])] } : p
    ));
    return visit;
  }, []);

  const handleUpdateVisit = useCallback(async (patientId, visitId, data) => {
    const visit = await apiUpdateVisit(patientId, visitId, data);
    setPatients(prev => prev.map(p =>
      p.id === patientId
        ? { ...p, visits: (p.visits ?? []).map(v => v.id === visitId ? visit : v) }
        : p
    ));
    return visit;
  }, []);

  // ── Appointment handlers ──────────────────────────────────────────────────

  const handleAddAppointment = useCallback(async (data) => {
    const appt = await apiAddAppointment(data);
    setAppointments(prev => [...prev, appt]);
    return appt;
  }, []);

  const handleUpdateAppointment = useCallback(async (id, data) => {
    const updated = await apiUpdateAppointment(id, data);
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  }, []);

  // ── Admin: credential handlers ────────────────────────────────────────────

  const handleCreateCredential = useCallback(async (data) => {
    const cred = await apiCreateCredential(data);
    setCredentials(prev => [cred, ...prev]);
    return cred;
  }, []);

  const handleUpdateCredential = useCallback(async (id, data) => {
    const updated = await apiUpdateCredential(id, data);
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    return updated;
  }, []);

  // ── Admin: profile handlers ───────────────────────────────────────────────

  const handleCreateProfile = useCallback(async (data) => {
    const profile = await apiCreateProfile(data);
    setDoctorProfiles(prev => [...prev, profile]);
    return profile;
  }, []);

  const handleUpdateProfile = useCallback(async (id, data) => {
    const updated = await apiUpdateProfile(id, data);
    setDoctorProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    return updated;
  }, []);

  // ── Admin: permission handlers ────────────────────────────────────────────

  const handleResolveRequest = useCallback(async (id, decision) => {
    await apiResolveRequest(id, { decision });
    setPermRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: decision, resolvedAt: new Date().toISOString() } : r)
    );
    if (decision === 'APPROVED') {
      const reqs = await getPermissionRequests();
      setPermRequests(reqs);
    }
  }, []);

  // ── Permission request (credential) ──────────────────────────────────────

  const handleRequestAccess = useCallback(async (data) => {
    return apiRequestAccess(data);
  }, []);

  // ── Rendering ─────────────────────────────────────────────────────────────

  if (!splashed) return <><GlobalStyle /><SplashScreen onComplete={() => setSplashed(true)} /></>;
  if (authLoading) return <><GlobalStyle /><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background: C.bg, color: C.muted, fontSize: 14 }}>Loading…</div></>;

  if (showSetup) return <><GlobalStyle /><HospitalSetup onComplete={() => setShowSetup(false)} /></>;

  if (!actor) {
    return (
      <>
        <GlobalStyle />
        <LoginScreen onLogin={handleLogin} onShowSetup={() => setShowSetup(true)} />
      </>
    );
  }

  const navViews = actor.type === 'admin'         ? ADMIN_VIEWS
                 : actor.role === 'RECEPTIONIST'  ? RECEPTIONIST_VIEWS
                 : DOCTOR_VIEWS;

  // Shared props passed to all views
  const shared = {
    actor,
    patients,
    appointments,
    doctorProfiles,
    onAddPatient:         handleAddPatient,
    onIntake:             handleIntake,
    onUpdatePatient:      handleUpdatePatient,
    onAddVisit:           handleAddVisit,
    onUpdateVisit:        handleUpdateVisit,
    onAddAppointment:     handleAddAppointment,
    onUpdateAppointment:  handleUpdateAppointment,
    onRequestAccess:      handleRequestAccess,
  };

  function renderView() {
    if (actor.type === 'admin') {
      switch (view) {
        case 'dashboard':   return <AdminDashboard actor={actor} permRequests={permRequests} setView={setView} />;
        case 'credentials': return <CredentialsView actor={actor} credentials={credentials} doctorProfiles={doctorProfiles} onCreate={handleCreateCredential} onUpdate={handleUpdateCredential} />;
        case 'profiles':    return <DoctorProfilesView actor={actor} profiles={doctorProfiles} onCreate={handleCreateProfile} onUpdate={handleUpdateProfile} credentials={credentials} />;
        case 'permissions': return <PermissionsView actor={actor} requests={permRequests} onResolve={handleResolveRequest} />;
        case 'audit':       return <AuditLogView actor={actor} logs={auditLog} />;
        default:            return <AdminDashboard actor={actor} permRequests={permRequests} setView={setView} />;
      }
    }

    // Credential (DOCTOR or RECEPTIONIST)
    switch (view) {
      case 'dashboard':    return <DoctorDashboard actor={actor} patients={patients} appointments={appointments} doctorProfiles={doctorProfiles} setView={setView} />;
      case 'patients':     return <PatientsView {...shared} />;
      case 'appointments': return <AppointmentsView {...shared} />;
      case 'ai':           return <AISummaryView actor={actor} patients={patients} doctorProfiles={doctorProfiles} onRequestAccess={handleRequestAccess} />;
      case 'subscription': return <SubscriptionView actor={actor} />;
      default:             return <PatientsView {...shared} />;
    }
  }

  return (
    <>
      <GlobalStyle />
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
        {!isMobile && (
          <Sidebar
            actor={actor}
            view={view}
            setView={setView}
            navViews={navViews}
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(o => !o)}
          />
        )}
        <main style={{
          marginLeft: isMobile ? 0 : (sidebarOpen ? 256 : 68),
          flex: 1,
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          padding: isMobile ? '0 0 80px' : '28px 32px 80px',
          transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}>
          {isMobile && <MobileTopBar actor={actor} onLogout={handleLogout} />}
          <div style={{ padding: isMobile ? '16px 14px' : 0 }}>
            {renderView()}
          </div>
        </main>
        {isMobile && (
          <BottomNav
            actor={actor}
            view={view}
            setView={setView}
            navViews={navViews}
          />
        )}
      </div>
    </>
  );
}
