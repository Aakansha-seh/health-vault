import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button } from '../ui/Button';
import { NavItem } from './NavItem';

const NAV_ITEMS = [
  { key: 'patients',     iconKey: 'patients',  label: 'Patient records'  },
  { key: 'appointments', iconKey: 'calendar',  label: 'Appointments'     },
  { key: 'dashboard',    iconKey: 'dashboard', label: 'Dashboard'        },
  { key: 'audit',        iconKey: 'audit',     label: 'Audit log'        },
  { key: 'profile',      iconKey: 'profile',   label: 'Doctor profile'   },
];

/**
 * Sidebar — fixed left navigation (desktop only, hidden via CSS on mobile).
 *
 * @param {string}   view       - Currently active view key.
 * @param {Function} setView
 * @param {object}   doctor     - Current doctor { name }
 * @param {object}   clinic     - Current clinic { name }
 * @param {Date}     loginTime
 * @param {Function} onLock     - Callback to lock the session.
 */
export function Sidebar({ view, setView, doctor, clinic, loginTime, onLock }) {
  const timeStr = loginTime
    ? loginTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <aside
      className="sidebar"
      style={{
        position:    'fixed',
        left:        0,
        top:         0,
        bottom:      0,
        width:       220,
        background:  C.white,
        borderRight: `1px solid ${C.border}`,
        display:     'flex',
        flexDirection: 'column',
        zIndex:      100,
        boxShadow:   '2px 0 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding:      '20px 16px 14px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width:       32,
              height:      32,
              background:  C.primary,
              borderRadius: 8,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              flexShrink:  0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.white} strokeWidth="1.5" fill="none" />
              <path d="M12 8v8M8 12h8" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.primary, display: 'block' }}>
              HealthVault
            </span>
            {clinic && (
              <span style={{ fontSize: 10, color: C.muted }}>{clinic.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ key, iconKey, label }) => (
          <NavItem
            key={key}
            iconKey={iconKey}
            label={label}
            active={view === key}
            onClick={() => setView(key)}
          />
        ))}
      </nav>

      {/* ── Session footer ── */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
        <p
          style={{
            fontSize:      12,
            fontWeight:    500,
            color:         C.text,
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            marginBottom:  3,
          }}
        >
          {doctor?.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <div
            style={{
              width:       7,
              height:      7,
              borderRadius: '50%',
              background:  C.success,
              flexShrink:  0,
            }}
          />
          <span style={{ fontSize: 11, color: C.muted }}>Active · {timeStr}</span>
        </div>

        <Button variant="secondary" small onClick={onLock} style={{ width: '100%', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>
            <path d={ICONS.lock} />
          </svg>
          Lock session
        </Button>
      </div>
    </aside>
  );
}
