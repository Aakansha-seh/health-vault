import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';

const TABS = [
  { key: 'patients',     iconKey: 'patients',  label: 'Records'      },
  { key: 'appointments', iconKey: 'calendar',  label: 'Appointments' },
  { key: 'dashboard',    iconKey: 'dashboard', label: 'Dashboard'    },
  { key: 'profile',      iconKey: 'profile',   label: 'Profile'      },
];

/**
 * BottomNav — fixed bottom tab bar for mobile (hidden on desktop via CSS).
 *
 * @param {string}   view    - Currently active view key.
 * @param {Function} setView
 */
export function BottomNav({ view, setView }) {
  return (
    <nav
      className="bottom-nav"
      style={{
        position:    'fixed',
        bottom:      0,
        left:        0,
        right:       0,
        background:  C.white,
        borderTop:   `1px solid ${C.border}`,
        display:     'flex',
        zIndex:      100,
        height:      64,
      }}
    >
      {TABS.map(({ key, iconKey, label }) => {
        const active = view === key;
        return (
          <div
            key={key}
            onClick={() => setView(key)}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            4,
              cursor:         'pointer',
              borderTop:      active ? `3px solid ${C.secondary}` : '3px solid transparent',
              paddingTop:     2,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? C.primary : C.muted}>
              <path d={ICONS[iconKey]} />
            </svg>
            <span
              style={{
                fontSize:   11,
                fontWeight: active ? 600 : 400,
                color:      active ? C.primary : C.muted,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
