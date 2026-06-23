import { useState } from 'react';
import { C, radii, shadows } from '../../constants/theme';

/**
 * Button — multi-variant action element.
 *
 * @param {'primary'|'secondary'|'amber'|'ghost'|'danger'|'gcal'} variant
 * @param {boolean} small   - Compact size (padding / font-size).
 * @param {boolean} disabled
 * @param {string}  type    - Native button type (default 'button').
 *
 * Notes: solid variants carry a hairline shadow for precision; all variants get
 * fast (<150ms) hover + press feedback via the shared `.hv-press` utility.
 */

const BASE = {
  display:      'inline-flex',
  alignItems:   'center',
  justifyContent: 'center',
  gap:          6,
  borderRadius: radii.md,
  border:       'none',
  fontFamily:   'Inter',
  fontWeight:   600,
  lineHeight:   1,
  cursor:       'pointer',
};

export function Button({ children, onClick, variant = 'primary', small = false, disabled = false, type = 'button', style: sx }) {
  const [hovered, setHovered] = useState(false);

  const sizeStyle = {
    padding:  small ? '6px 14px' : '9px 18px',
    fontSize: small ? 13 : 14,
  };

  const VARIANTS = {
    primary:   { background: hovered ? C.primaryHover : C.primary, color: C.white, boxShadow: shadows.xs },
    secondary: { background: hovered ? C.gray[50] : C.white, color: C.ink, border: `1px solid ${C.border}`, boxShadow: shadows.xs },
    amber:     { background: hovered ? '#B45309' : C.amber, color: C.white, boxShadow: shadows.xs },
    ghost:     { background: hovered ? C.gray[100] : 'transparent', color: C.ink },
    danger:    { background: hovered ? '#B91C1C' : C.critical, color: C.white, boxShadow: shadows.xs },
    gcal:      { background: hovered ? '#1557A0' : '#1a73e8', color: C.white, boxShadow: shadows.xs },
  };

  return (
    <button
      type={type}
      className="hv-press"
      style={{
        ...BASE,
        ...sizeStyle,
        ...VARIANTS[variant],
        opacity: disabled ? 0.5 : 1,
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
