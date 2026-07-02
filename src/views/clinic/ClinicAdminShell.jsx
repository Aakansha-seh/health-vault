import { useState, useCallback } from 'react';
import { C, shadow } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { ClinicDashboard }    from './ClinicDashboard';
import { ClinicDoctors }      from './ClinicDoctors';
import { ClinicPatients }     from './ClinicPatients';
import { ClinicAppointments } from './ClinicAppointments';
import { ClinicAudit }        from './ClinicAudit';
import { ClinicProfile }      from './ClinicProfile';

const NAV = [
  { key: 'overview',      label: 'Overview',      icon: ICONS.dashboard },
  { key: 'doctors',       label: 'Doctors',       icon: ICONS.stethoscope ?? ICONS.profile },
  { key: 'patients',      label: 'Patients',      icon: ICONS.patient ?? ICONS.profile },
  { key: 'appointments',  label: 'Appointments',  icon: ICONS.calendar },
  { key: 'audit',         label: 'Audit log',     icon: ICONS.audit ?? ICONS.list },
  { key: 'settings',      label: 'Settings',      icon: ICONS.settings ?? ICONS.profile },
];

function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      className="clinic-nav-btn"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
        borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
        background: active ? C.primary : hov ? C.bg : 'transparent',
        color:      active ? C.white   : C.text,
        transition: 'background .12s, color .12s',
        fontFamily: 'Inter', fontSize: 14, fontWeight: active ? 600 : 400,
        marginBottom: 2,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? C.white : C.muted}>
        <path d={item.icon} />
      </svg>
      {item.label}
    </button>
  );
}

/**
 * ClinicAdminShell — full-screen shell for clinic admin sessions.
 * Separate sidebar (Overview / Doctors / Patients / Appointments / Audit / Settings)
 * and a content pane that renders the corresponding view.
 */
export function ClinicAdminShell({ clinic, doctors, patients, appointments, auditLog, onUpdateClinic, onLogout }) {
  const [activeKey, setActiveKey] = useState('overview');

  const clinicName = clinic?.name ?? 'Clinic';
  const initials   = clinicName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const renderContent = useCallback(() => {
    switch (activeKey) {
      case 'overview':
        return <ClinicDashboard clinic={clinic} doctors={doctors} patients={patients} appointments={appointments} />;
      case 'doctors':
        return <ClinicDoctors doctors={doctors} patients={patients} appointments={appointments} />;
      case 'patients':
        return <ClinicPatients patients={patients} doctors={doctors} />;
      case 'appointments':
        return <ClinicAppointments appointments={appointments} patients={patients} doctors={doctors} />;
      case 'audit':
        return <ClinicAudit auditLog={auditLog} doctors={doctors} />;
      case 'settings':
        return <ClinicProfile clinic={clinic} onUpdateClinic={onUpdateClinic} />;
      default:
        return null;
    }
  }, [activeKey, clinic, doctors, patients, appointments, auditLog, onUpdateClinic]);

  return (
    <div className="clinic-shell" style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: 'Inter' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="clinic-sidebar" style={{
        width: 220, flexShrink: 0, background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', padding: '0 12px 16px',
        boxShadow: shadow,
      }}>
        {/* Logo area */}
        <div className="clinic-logo" style={{ padding: '20px 4px 16px', borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.white, fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.primary, lineHeight: 1.2 }}>{clinicName}</p>
              <p style={{ fontSize: 10, color: C.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="clinic-nav" style={{ flex: 1 }}>
          {NAV.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={activeKey === item.key}
              onClick={() => setActiveKey(item.key)}
            />
          ))}
        </nav>

        {/* Google Form Feedback Review */}
        <button
          onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScE87vKLK9Gug6aEJK6b_aKT00LzapNnSV88vFAZq2f-0J4uw/viewform?usp=publish-editor', '_blank', 'noopener,noreferrer')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            background: 'transparent', color: C.text,
            fontFamily: 'Inter', fontSize: 14, fontWeight: 400,
            transition: 'background .12s, color .12s',
            marginBottom: 2
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Rate Portal
        </button>

        {/* Logout */}
        <button
          className="clinic-logout"
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            background: 'transparent', color: '#EF4444',
            fontFamily: 'Inter', fontSize: 14, fontWeight: 500,
            transition: 'background .12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="clinic-content" style={{ flex: 1, overflow: 'auto', padding: '28px 28px 60px' }}>
        {renderContent()}
      </main>
    </div>
  );
}
