import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';

const NAV_CONFIG = {
  dashboard:    { label: 'Home',         icon: 'dashboard' },
  credentials:  { label: 'Credentials',  icon: null },
  profiles:     { label: 'Profiles',     icon: 'profile' },
  permissions:  { label: 'Requests',     icon: null },
  audit:        { label: 'Audit',        icon: 'audit' },
  patients:     { label: 'Patients',     icon: 'patients' },
  appointments: { label: 'Schedule',     icon: 'calendar' },
  ai:           { label: 'AI',           icon: null },
  subscription: { label: 'Plan',         icon: null },
};

function TabIcon({ iconKey, active }) {
  const color = active ? C.primary : C.muted;
  const size = 20;

  if (iconKey && ICONS[iconKey]) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={ICONS[iconKey]}/></svg>;
  }
  if (!iconKey || iconKey === null) {
    // generic circle placeholder
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><circle cx="12" cy="12" r="8"/></svg>;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={ICONS.dashboard}/></svg>;
}

export function BottomNav({ actor, view, setView, navViews }) {
  // Show max 5 items on mobile
  const items = navViews.slice(0, 5);

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: 'flex', zIndex: 100, height: 64,
    }}>
      {items.map(key => {
        const cfg    = NAV_CONFIG[key] ?? { label: key, icon: null };
        const active = view === key;
        return (
          <div key={key} onClick={() => setView(key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            cursor: 'pointer',
            borderTop: active ? `3px solid ${C.secondary}` : '3px solid transparent',
            paddingTop: 2,
          }}>
            <TabIcon iconKey={cfg.icon} active={active} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? C.primary : C.muted }}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
