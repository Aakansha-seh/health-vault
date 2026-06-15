import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { C, shadow, radius } from '../../constants/theme';
import { Card, SectionHeading } from '../../components/ui';
import { isToday, isTomorrow } from '../../utils/formatters';

/**
 * StatCard — a single KPI tile.
 */
function StatCard({ label, value, sub, color }) {
  return (
    <Card>
      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </p>
        <p style={{ fontSize: 32, fontWeight: 700, color: color ?? C.primary, lineHeight: 1.2, marginTop: 6 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</p>}
      </div>
    </Card>
  );
}

/**
 * CustomTooltip — styled chart tooltip.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background:   C.white,
        border:       `1px solid ${C.border}`,
        borderRadius: radius,
        padding:      '10px 14px',
        boxShadow:    shadow,
        fontSize:     13,
      }}
    >
      <p style={{ fontWeight: 600, color: C.primary, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/**
 * Dashboard — KPI tiles + visit-frequency bar chart.
 *
 * @param {object[]} patients     - Clinic-filtered patients.
 * @param {object[]} appointments - Clinic-filtered appointments.
 */
export function Dashboard({ patients, appointments }) {
  /* ── Stats ── */
  const totalPatients     = patients.length;
  const returning         = patients.filter((p) => p.isReturning).length;
  const newPatients       = totalPatients - returning;
  const todayAppts        = appointments.filter((a) => isToday(a.date) && a.status === 'scheduled').length;
  const tomorrowAppts     = appointments.filter((a) => isTomorrow(a.date) && a.status === 'scheduled').length;
  const completedAppts    = appointments.filter((a) => a.status === 'completed').length;
  const totalVisits       = patients.reduce((sum, p) => sum + p.visits.length, 0);

  /* ── Visits by month (last 6 months) ── */
  const monthlyData = useMemo(() => {
    const counts = {};
    const now    = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      counts[key] = { month: key, Visits: 0, Appointments: 0 };
    }

    patients.forEach((p) =>
      p.visits.forEach((v) => {
        const d   = new Date(v.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (counts[key]) counts[key].Visits++;
      })
    );

    appointments.forEach((a) => {
      if (a.status !== 'cancelled') {
        const d   = new Date(a.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (counts[key]) counts[key].Appointments++;
      }
    });

    return Object.values(counts);
  }, [patients, appointments]);

  /* ── Most common diagnoses (top 5) ── */
  const diagnosisData = useMemo(() => {
    const freq = {};
    patients.forEach((p) =>
      p.visits.forEach((v) => {
        if (!v.diagnosis) return;
        const d = v.diagnosis.trim();
        freq[d] = (freq[d] ?? 0) + 1;
      })
    );
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [patients]);

  return (
    <div className="fade-in">
      <SectionHeading style={{ marginBottom: 20 }}>Dashboard</SectionHeading>

      {/* ── KPI grid ── */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap:                 12,
          marginBottom:        24,
        }}
      >
        <StatCard label="Total patients"   value={totalPatients}  sub={`${returning} returning`}              />
        <StatCard label="New patients"     value={newPatients}    sub="no prior visits"                       />
        <StatCard label="Today"            value={todayAppts}     sub="scheduled"   color={C.amber}           />
        <StatCard label="Tomorrow"         value={tomorrowAppts}  sub="scheduled"   color={C.secondary}       />
        <StatCard label="Total visits"     value={totalVisits}    sub="all time"                              />
        <StatCard label="Completed appts"  value={completedAppts} sub="all time"    color={C.success}         />
      </div>

      {/* ── Charts row ── */}
      <div className="dashboard-charts grid-safe" style={{ display: 'grid', gap: 16 }}>
        {/* Activity chart */}
        <Card>
          <div style={{ padding: '18px 20px 8px' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>
              Activity — last 6 months
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconSize={10} iconType="circle" />
                <Bar dataKey="Visits"       fill={C.primary}   radius={[4,4,0,0]} />
                <Bar dataKey="Appointments" fill={C.secondary} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top diagnoses */}
        {diagnosisData.length > 0 ? (
          <Card>
            <div style={{ padding: '18px 20px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 16 }}>
                Most frequent diagnoses
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {diagnosisData.map(({ name, count }, i) => {
                  const pct = Math.round((count / diagnosisData[0].count) * 100);
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: C.text }}>{name}</span>
                        <span style={{ fontSize: 12, color: C.muted }}>{count} case{count !== 1 ? 's' : ''}</span>
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
        ) : (
          <Card>
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <p style={{ color: C.muted, fontSize: 14 }}>No diagnoses recorded yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
