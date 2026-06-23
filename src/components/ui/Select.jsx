import { useState } from 'react';
import { C, radii } from '../../constants/theme';

// Inline chevron as a data URI so we avoid an extra icon import (neutral gray).
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237C858D' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

/**
 * Select — styled native dropdown.
 *
 * @param {string} label
 * @param {string} value
 * @param {Function} onChange
 * @param {{ value: string, label: string }[]} options
 * @param {boolean} required
 * @param {string}  error
 */
export function Select({ label, value, onChange, options, required = false, error }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
          {label}
          {required && <span style={{ color: C.error }}> *</span>}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:               '100%',
          padding:             '9px 12px',
          borderRadius:        radii.md,
          border:              `1px solid ${error ? C.error : focused ? C.secondary : C.border}`,
          boxShadow:           focused && !error ? `0 0 0 3px ${C.secondary}22` : 'none',
          background:          C.white,
          fontSize:            14,
          color:               C.ink,
          fontFamily:          'Inter',
          cursor:              'pointer',
          appearance:          'none',
          backgroundImage:     CHEVRON,
          backgroundRepeat:    'no-repeat',
          backgroundPosition:  'right 12px center',
          outline:             'none',
          transition:          'border-color .15s, box-shadow .15s',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {error && <span style={{ fontSize: 12, color: C.error }}>{error}</span>}
    </div>
  );
}
