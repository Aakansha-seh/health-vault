import { useState, useEffect } from 'react';
import { getDashboardStats, getDashboardChart } from '../../services/api';
import { C, shadow } from '../../constants/theme';

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, padding: '18px 20px', boxShadow: shadow, flex: 1, minWidth: 130, borderLeft: `4px solid ${accent ?? C.primary}` }}>
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function UpcomingItem({ appt, profiles }) {
  const profileName = appt.doctorProfile?.name ?? profiles?.find(p => p.id === appt.doctorProfileId)?.name;
  const time    = appt.time || '—';
  const date    = new Date(`${appt.date}T${appt.time || '00:00'}`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ background: `${C.secondary}15`, borderRadius: 8, padding: '8px 10px', textAlign: 'center', minWidth: 48 }}>
        <p style={{ fontSize: 11, color: C.secondary, fontWeight: 700 }}>{date.split(' ')[1]}</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>{date.split(' ')[0]}</p>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.patientName ?? appt.patient?.name ?? 'Patient'}
        </p>
        <p style={{ fontSize: 12, color: C.muted }}>{time} · {profileName ?? 'Dr.'}</p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <span style={{ fontSize: 11, color: C.secondary, background: `${C.secondary}15`, padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>
          {appt.reason ?? 'Visit'}
        </span>
      </div>
    </div>
  );
}

export function DoctorDashboard({ actor, patients, appointments, doctorProfiles, setView }) {
  const [stats,   setStats]   = useState(null);
  const [chart,   setChart]   = useState([]);
  const [profileId, setProfileId] = useState(''); // '' = all of my profiles

  // Only doctors with more than one granted profile get the selector.
  const isDoctor    = actor?.role === 'DOCTOR';
  const myProfiles  = isDoctor ? (doctorProfiles ?? []) : [];
  const showPicker  = isDoctor && myProfiles.length > 1;

  useEffect(() => {
    Promise.all([getDashboardStats(profileId || undefined), getDashboardChart(profileId || undefined)])
      .then(([s, c]) => { setStats(s); setChart(c.data ?? c); })
      .catch(console.error);
  }, [profileId]);

  const today   = new Date();
  const dt = a => new Date(`${a.date}T${a.time || '00:00'}`);
  const upcoming = appointments
    .filter(a => a.status === 'scheduled' && dt(a) >= today && (!profileId || a.doctorProfileId === profileId))
    .sort((a, b) => dt(a) - dt(b))
    .slice(0, 5);

  const roleLabel = actor.role === 'RECEPTIONIST' ? 'Receptionist' : 'Doctor';

  return (
    <div>
      {/* Greeting + profile picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
            Good {greeting()}, {(actor?.name ?? actor?.label)?.split(' ')[0] ?? roleLabel}
          </h1>
          {isDoctor && myProfiles.length > 0 && (
            <p style={{ color: C.muted, fontSize: 14 }}>
              {profileId
                ? `Viewing ${myProfiles.find(p => p.id === profileId)?.name ?? 'profile'}`
                : `Managing ${myProfiles.length} profile${myProfiles.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        {showPicker && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Viewing</label>
            <select
              value={profileId}
              onChange={e => setProfileId(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, minWidth: 220 }}
            >
              <option value="">All my profiles</option>
              {myProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` — ${p.specialty}` : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Patients"    value={stats?.totalPatients   ?? patients.length}     accent={C.primary} />
        <StatCard label="Visits This Month" value={stats?.visitsThisMonth ?? '—'}                 accent={C.secondary} />
        <StatCard label="Today's Appts"     value={stats?.todayAppointments ?? upcoming.filter(a => isToday(a.date)).length} accent={C.amber} />
        {actor.role !== 'RECEPTIONIST' && (
          <StatCard label="Returning"       value={stats?.returningPatients ?? patients.filter(p => p.isReturning).length} sub="patients" accent="#7B1FA2" />
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Chart */}
        {chart.length > 0 && (
          <div style={{ flex: 2, minWidth: 'min(280px, 100%)', background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 18 }}>Visits — Last 6 Months</h3>
            <BarChart data={chart} />
          </div>
        )}

        {/* Upcoming */}
        <div style={{ flex: 1, minWidth: 240, background: C.white, borderRadius: 12, boxShadow: shadow, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>Upcoming Appointments</h3>
            <button onClick={() => setView('appointments')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.secondary, fontWeight: 600 }}>View all</button>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, padding: '16px 0' }}>No upcoming appointments.</p>
          ) : (
            upcoming.map(a => <UpcomingItem key={a.id} appt={a} profiles={doctorProfiles} />)
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        {[
          { label: '+ New Patient',     view: 'patients' },
          { label: '+ Appointment',     view: 'appointments' },
          ...(actor.role === 'DOCTOR' ? [{ label: 'AI Summary', view: 'ai' }] : []),
        ].map(item => (
          <button key={item.view} onClick={() => setView(item.view)} style={{
            padding: '10px 18px', borderRadius: 8, border: `1.5px solid ${C.border}`,
            background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.primary,
          }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{d.count}</span>
          <div style={{ width: '100%', height: Math.max(4, (d.count / max) * 84), background: C.secondary, borderRadius: '4px 4px 0 0' }}/>
          <span style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>{d.label ?? d.month}</span>
        </div>
      ))}
    </div>
  );
}
