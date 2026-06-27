import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';

const EXPANDED_W  = 256;
const COLLAPSED_W = 68;

const NAV_CONFIG = {
  dashboard:   { label: 'Dashboard',       icon: 'dashboard' },
  credentials: { label: 'Credentials',     icon: 'credentials' },
  profiles:    { label: 'Doctor Profiles', icon: 'profile' },
  permissions: { label: 'Permissions',     icon: 'permissions' },
  audit:       { label: 'Audit Log',       icon: 'audit' },
  patients:    { label: 'Patients',        icon: 'patients' },
  appointments:{ label: 'Appointments',    icon: 'calendar' },
  ai:          { label: 'AI Summary',      icon: 'ai' },
  subscription:{ label: 'Subscription',    icon: 'subscription' },
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function NavIcon({ iconKey, color, size = 19 }) {
  const s = { flexShrink: 0 };
  if (iconKey === 'dashboard') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
  if (iconKey === 'credentials') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
  if (iconKey === 'profile') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
  if (iconKey === 'permissions') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  if (iconKey === 'audit') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
  if (iconKey === 'patients') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  if (iconKey === 'calendar') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
  if (iconKey === 'ai') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
  if (iconKey === 'subscription') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" style={s}>
      <circle cx="12" cy="12" r="6"/>
    </svg>
  );
}

function LogoMark() {
  return (
    <div style={{ width: 34, height: 34, background: C.primary, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ actor, view, setView, navViews, onLogout, isOpen, onToggle, isDarkMode, onToggleTheme }) {
  const W            = isOpen ? EXPANDED_W : COLLAPSED_W;
  const hospitalName = actor?.hospitalName ?? actor?.hospital?.name ?? 'Hospital';
  const actorName    = actor?.name ?? actor?.label ?? '';
  const roleLabel    = actor?.type === 'admin' ? 'Administrator' : (actor?.role ?? 'Staff');
  const initials     = actorName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <>
      <style>{`
        .hv-nav-btn { transition: background 0.15s, color 0.15s; }
        .hv-nav-btn:hover { background: ${C.primary}0A !important; }
        .hv-toggle-btn:hover { background: ${C.bg} !important; }
        .hv-logout-btn:hover { background: ${C.bg} !important; }
      `}</style>

      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: W,
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        zIndex: 200,
        boxShadow: '2px 0 16px rgba(0,0,0,0.06)',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          height: 64, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: isOpen ? '0 12px 0 16px' : '0',
          justifyContent: isOpen ? 'space-between' : 'center',
          borderBottom: `1px solid ${C.border}`,
          gap: 8,
        }}>
          {isOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
              <LogoMark />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.primary, lineHeight: 1.2 }}>HealthVault</div>
                <div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hospitalName}
                </div>
              </div>
            </div>
          )}
          {!isOpen && <LogoMark />}

          <button
            onClick={onToggle}
            className="hv-toggle-btn"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none',
              background: 'transparent', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.muted,
            }}
          >
            {isOpen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>
        </div>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: isOpen ? '10px 8px' : '10px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navViews.map(key => {
            const cfg    = NAV_CONFIG[key] ?? { label: key, icon: 'dashboard' };
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className="hv-nav-btn"
                title={!isOpen ? cfg.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center',
                  gap: 10,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  width: '100%',
                  padding: isOpen ? '9px 10px' : '10px 0',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: active ? `${C.primary}12` : 'transparent',
                  color: active ? C.primary : C.muted,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13, marginBottom: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 22,
                    background: C.primary, borderRadius: '0 3px 3px 0',
                  }}/>
                )}
                <NavIcon iconKey={cfg.icon} color={active ? C.primary : C.muted} />
                {isOpen && cfg.label}
              </button>
            );
          })}
        </nav>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${C.border}`, flexShrink: 0,
          padding: isOpen ? '14px 16px' : '14px 6px',
        }}>
          {isOpen ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `${C.secondary}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.secondary }}>{initials}</span>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {actorName}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{roleLabel}</div>
                </div>
              </div>

              {/* Night Mode Toggle */}
              <button
                onClick={onToggleTheme}
                className="hv-logout-btn"
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer', background: 'transparent',
                  color: C.muted, fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginBottom: 8,
                }}
              >
                {isDarkMode ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    Light Mode
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    Night Mode
                  </>
                )}
              </button>

              <button
                onClick={onLogout}
                className="hv-logout-btn"
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer', background: 'transparent',
                  color: C.primary, fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? 'Light Mode' : 'Night Mode'}
                className="hv-logout-btn"
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8,
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDarkMode ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
              <button
                onClick={onLogout}
                title="Sign out"
                className="hv-logout-btn"
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8,
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
