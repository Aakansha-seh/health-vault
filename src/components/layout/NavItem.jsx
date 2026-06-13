import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';

/**
 * NavItem — single item in the sidebar navigation.
 * Applies the 3px sage left-border when active.
 *
 * @param {keyof ICONS} iconKey
 * @param {string}      label
 * @param {boolean}     active
 * @param {Function}    onClick
 */
export function NavItem({ iconKey, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '10px 16px',
        borderRadius: 6,
        cursor:      'pointer',
        background:  active ? '#E8F0EE' : hovered ? '#F5F9F7' : 'transparent',
        borderLeft:  active ? `3px solid ${C.secondary}` : '3px solid transparent',
        transition:  'all .15s',
        marginBottom: 2,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? C.primary : C.muted}
      >
        <path d={ICONS[iconKey]} />
      </svg>

      <span
        style={{
          fontSize:   14,
          fontWeight: active ? 600 : 400,
          color:      active ? C.primary : C.muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}
