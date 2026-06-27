import { useState, useEffect } from 'react';
import { getAdminStats, getDashboardChart } from '../../services/api';
import { C, shadow } from '../../constants/theme';

function StatCard({ label, value, sub, color, delayClass }) {
  return (
    <div 
      className={`hv-card-hover hv-fade-up ${delayClass}`}
      style={{ 
        background: C.white, 
        borderRadius: 12, 
        padding: '20px 24px', 
        boxShadow: shadow, 
        flex: 1, 
        minWidth: 140,
        border: `1px solid ${C.border}`,
      }}
    >
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? C.primary, marginBottom: 2 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function QuickActionBtn({ label, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button 
      className="hv-press" 
      onClick={onClick} 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 14px', borderRadius: 8, 
        border: `1px solid ${hovered ? C.secondary : C.border}`,
        background: hovered ? `${C.secondary}0A` : C.white, 
        cursor: 'pointer', fontSize: 13, color: hovered ? C.secondary : C.primary,
        fontWeight: 600, marginBottom: 8,
        transition: 'all 0.2s ease',
      }}
    >
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge > 0 && (
          <span style={{ background: C.critical, color: C.white, borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
            {badge}
          </span>
        )}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={hovered ? C.secondary : C.muted} 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ transform: hovered ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }}
        >
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </button>
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
    <div className="hv-fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
          Welcome back, {actor?.name?.split(' ')[0] ?? 'Admin'}
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Here's what's happening at your hospital today.</p>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div 
          onClick={() => setView('permissions')} 
          className="hv-press hv-fade-up"
          style={{
            background: C.warningSoft, 
            border: `1.5px solid ${C.warning}`, 
            borderRadius: 10,
            padding: '12px 16px', 
            marginBottom: 24, 
            cursor: 'pointer',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: shadow,
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.warning}>
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#5D4037' }}>
              {pending.length} pending permission request{pending.length > 1 ? 's' : ''} awaiting your review
            </span>
          </div>
          <span style={{ fontSize: 13, color: C.warning, fontWeight: 600 }}>Review →</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {loading ? (
          [1,2,3,4].map(i => (
            <div 
              key={i} 
              className="hv-skeleton" 
              style={{ flex: 1, minWidth: 140, height: 98 }}
            />
          ))
        ) : (
          <>
            <StatCard label="Total Patients"     value={stats?.totalPatients}    sub="across all profiles" delayClass="hv-delay-1" />
            <StatCard label="Total Credentials"  value={stats?.totalCredentials} sub={`${stats?.activeCredentials ?? 0} active`} delayClass="hv-delay-1" />
            <StatCard label="Doctor Profiles"    value={stats?.totalProfiles}    delayClass="hv-delay-1" />
            <StatCard label="Visits This Month"  value={stats?.visitsThisMonth}  color={C.secondary} delayClass="hv-delay-1" />
          </>
        )}
      </div>

      {/* Chart + Quick actions */}
      <div className="hv-fade-up hv-delay-2" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Visit chart */}
        <div style={{ flex: 2, minWidth: 'min(300px, 100%)', background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.primary, marginBottom: 20 }}>Visits — Last 6 Months</h3>
          {chart.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No visit data yet</p>
          ) : (
            <BarChart data={chart} />
          )}
        </div>

        {/* Quick actions */}
        <div style={{ flex: 1, minWidth: 220, background: C.white, borderRadius: 12, boxShadow: shadow, padding: 24, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.primary, marginBottom: 16 }}>Quick Actions</h3>
          {[
            { label: 'Add Credential',     view: 'credentials' },
            { label: 'Add Doctor Profile', view: 'profiles' },
            { label: 'Review Permissions', view: 'permissions', badge: pending.length },
            { label: 'View Audit Log',     view: 'audit' },
          ].map(item => (
            <QuickActionBtn 
              key={item.view} 
              label={item.label} 
              badge={item.badge} 
              onClick={() => setView(item.view)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
      {data.map((d, i) => {
        const barHeight = Math.max(4, (d.count / max) * 100);
        const isHovered = hoveredIdx === i;
        return (
          <div 
            key={i} 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span style={{ 
              fontSize: 10, 
              color: isHovered ? C.secondary : C.muted, 
              fontWeight: isHovered ? 600 : 400, 
              transition: 'color 0.2s',
              fontVariantNumeric: 'tabular-nums' 
            }}>
              {d.count}
            </span>
            <div 
              className="hv-bar-grow"
              style={{ 
                width: '100%', 
                height: barHeight, 
                background: isHovered ? C.primary : C.secondary, 
                borderRadius: '4px 4px 0 0', 
                transition: 'height 0.3s, background-color 0.2s',
                cursor: 'pointer'
              }}
            />
            <span style={{ 
              fontSize: 10, 
              color: isHovered ? C.ink : C.muted, 
              fontWeight: isHovered ? 600 : 400, 
              transition: 'color 0.2s', 
              whiteSpace: 'nowrap' 
            }}>
              {d.label ?? d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}
