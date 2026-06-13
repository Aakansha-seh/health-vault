import { useState } from 'react';

/**
 * Button — multi-variant action element.
 *
 * @param {'primary'|'secondary'|'amber'|'ghost'|'danger'|'gcal'} variant
 * @param {boolean} small   - Compact size (padding / font-size).
 * @param {boolean} disabled
 */

const BASE = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
  borderRadius: 6,
  border:       'none',
  fontFamily:   'Inter',
  fontWeight:   600,
  transition:   'background .15s, opacity .15s',
  cursor:       'pointer',
};

export function Button({ children, onClick, variant = 'primary', small = false, disabled = false, style: sx }) {
  const [hovered, setHovered] = useState(false);

  const sizeStyle = {
    padding:  small ? '6px 14px' : '9px 18px',
    fontSize: small ? 13 : 14,
  };

  const VARIANTS = {
    primary:   { background: hovered ? '#15302A' : '#1A3C34', color: '#FFFFFF' },
    secondary: { background: hovered ? '#F0F7F4' : '#FFFFFF',  color: '#1A3C34', border: '1px solid #E0EDE8' },
    amber:     { background: hovered ? '#B8731F' : '#D4882A', color: '#FFFFFF' },
    ghost:     { background: hovered ? '#F0F7F4' : 'transparent', color: '#1A3C34' },
    danger:    { background: hovered ? '#B71C1C' : '#C62828', color: '#FFFFFF' },
    gcal:      { background: hovered ? '#1557A0' : '#1a73e8', color: '#FFFFFF' },
  };

  return (
    <button
      style={{
        ...BASE,
        ...sizeStyle,
        ...VARIANTS[variant],
        opacity: disabled ? 0.55 : 1,
        cursor:  disabled ? 'not-allowed' : 'pointer',
        ...sx,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
