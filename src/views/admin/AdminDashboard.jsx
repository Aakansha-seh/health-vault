import { useState, useEffect } from 'react';
import { getAdminStats, getDashboardChart } from '../../services/api';
import { C, shadow } from '../../constants/theme';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, padding: '20px 24px', boxShadow: shadow, flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? C.primary, marginBottom: 2 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
  );
}

export function AdminDashboard({ actor, permRequests, setView }) {
  const [stats,   setStats]   = useState(null);
  const [chart,   setChart]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getDashboardChart()])
      .then(([s, c]) => { setStats(s); setChart(c.data ?? c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = (permRequests ?? []).filter(r => r.status === 'PENDING');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
          Welcome back, {actor?.name?.split(' ')[0] ?? 'Admin'}
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Here's what's happening at your hospital today.</p>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div onClick={() => setView('permissions')} style={{
          background: '#FFF8E1', border: '1.5px solid #F9A825', borderRadius: 10,
          padding: '12px 16px', marginBottom: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F9A825">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#5D4037' }}>
              {pending.length} pending permission request{pending.length > 1 ? 's' : ''} awaiting your review
            </span>
          </div>
          <span style={{ fontSize: 13, color: '#F9A825', fontWeight: 600 }}>Review →</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} style={{ flex: 1, minWidth: 140, height: 88, background: C.white, borderRadius: 12, boxShadow: shadow, opacity: 0.5 }}/>)
        ) : (
          <>
            <StatCard label="Total Patients"     value={stats?.totalPatients}    sub="across all profiles" />
            <StatCard label="Total Credentials"  value={stats?.totalCredentials} sub={`${stats?.activeCredentials ?? 0} active`} />
            <StatCard label="Doctor Profiles"    value={stats?.totalProfiles}    />
            <StatCard label="Visits This Month"  value={stats?.visitsThisMonth}  color={C.secondary} />
          </>
        )}
      </div>

      {/* Chart + Quick actions */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Visit chart */}
        <div style={{ flex: 2, minWidth: 'min(300px, 100%)', background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.primary, marginBottom: 20 }}>Visits — Last 6 Months</h3>
          {chart.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No visit data yet</p>
          ) : (
            <BarChart data={chart} />
          )}
        </div>

        {/* Quick actions */}
        <div style={{ flex: 1, minWidth: 220, background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Quick Actions</h3>
          {[
            { label: 'Add Credential',     view: 'credentials' },
            { label: 'Add Doctor Profile', view: 'profiles' },
            { label: 'Review Permissions', view: 'permissions', badge: pending.length },
            { label: 'View Audit Log',     view: 'audit' },
          ].map(item => (
            <button key={item.view} onClick={() => setView(item.view)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.primary,
              fontWeight: 500, marginBottom: 8,
            }}>
              {item.label}
              {item.badge > 0 && (
                <span style={{ background: C.amber, color: C.white, borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{d.count}</span>
          <div style={{ width: '100%', height: Math.max(4, (d.count / max) * 100), background: C.secondary, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}/>
          <span style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>{d.label ?? d.month}</span>
        </div>
      ))}
    </div>
  );
}
