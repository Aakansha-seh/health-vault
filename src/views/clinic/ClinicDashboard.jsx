import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { C, shadow, radius } from '../../constants/theme';
import { Card, SectionHeading } from '../../components/ui';
import { isToday } from '../../utils/formatters';

function StatCard({ label, value, sub, color, accent }) {
  return (
    <Card>
      <div style={{ padding: '18px 20px 14px', borderLeft: `3px solid ${accent ?? C.secondary}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </p>
        <p style={{ fontSize: 30, fontWeight: 700, color: color ?? C.primary, lineHeight: 1.2, marginTop: 6 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</p>}
      </div>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius, padding: '10px 14px', boxShadow: shadow, fontSize: 13 }}>
      <p style={{ fontWeight: 600, color: C.primary, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

/**
 * ClinicDashboard — clinic-wide KPIs, activity chart, and top diagnoses.
 */
export function ClinicDashboard({ clinic, doctors, patients, appointments }) {
  const totalPatients    = patients.length;
  const totalDoctors     = doctors.length;
  const todayAppts       = appointments.filter((a) => isToday(a.date) && a.status === 'scheduled').length;
  const totalVisits      = patients.reduce((s, p) => s + (p.visits?.length ?? 0), 0);
  const completedAppts   = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts   = appointments.filter((a) => a.status === 'cancelled').length;

  // Doctor leaderboard by patient count
  const doctorStats = useMemo(() => doctors.map((d) => ({
    name:     d.name.replace('Dr. ', ''),
    Patients: patients.filter((p) => p.visits?.some((v) => v.doctorId === d.id)).length,
    Visits:   patients.reduce((s, p) => s + (p.visits?.filter((v) => v.doctorId === d.id).length ?? 0), 0),
  })).sort((a, b) => b.Patients - a.Patients), [doctors, patients]);

  // Monthly activity (last 6 months)
  const monthlyData = useMemo(() => {
    const counts = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      counts[key] = { month: key, Visits: 0, Appointments: 0 };
    }
    patients.forEach((p) => p.visits?.forEach((v) => {
      const key = new Date(v.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (counts[key]) counts[key].Visits++;
    }));
    appointments.forEach((a) => {
      if (a.status !== 'cancelled') {
        const key = new Date(a.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (counts[key]) counts[key].Appointments++;
      }
    });
    return Object.values(counts);
  }, [patients, appointments]);

  return (
    <div className="fade-in">
      <SectionHeading style={{ marginBottom: 20 }}>Clinic overview</SectionHeading>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Doctors"         value={totalDoctors}   sub="registered"              accent={C.primary}   />
        <StatCard label="Total patients"  value={totalPatients}  sub="across all doctors"      accent={C.secondary} />
        <StatCard label="Today"           value={todayAppts}     sub="scheduled"               accent={C.amber}     color={C.amber} />
        <StatCard label="Total visits"    value={totalVisits}    sub="all time"                accent={C.secondary} />
        <StatCard label="Completed appts" value={completedAppts} sub="all time"                accent={C.success}   color={C.success} />
        <StatCard label="Cancelled"       value={cancelledAppts} sub="all time"                accent={C.error}     color={C.error} />
      </div>

      <div className="dashboard-charts grid-safe" style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
        {/* Activity chart */}
        <Card>
          <div style={{ padding: '18px 20px 8px' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Activity — last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} iconType="circle" />
                <Bar dataKey="Visits"       fill={C.primary}   radius={[3,3,0,0]} />
                <Bar dataKey="Appointments" fill={C.secondary} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Doctor breakdown */}
        <Card>
          <div style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Doctors — patient load</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {doctorStats.map(({ name, Patients, Visits }, i) => {
                const pct = doctorStats[0].Patients > 0 ? Math.round((Patients / doctorStats[0].Patients) * 100) : 0;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{name}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{Patients} patients · {Visits} visits</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? C.primary : C.secondary, borderRadius: 3, transition: 'width .4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
