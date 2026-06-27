import { useState } from 'react';
import { C, radii, tnum } from '../../constants/theme';

/**
 * Input — text field or multiline textarea with consistent styling.
 *
 * @param {string}  label
 * @param {string}  value
 * @param {Function}onChange
 * @param {string}  type        - Input type (default "text"). Ignored when multiline.
 * @param {string}  placeholder
 * @param {string}  error       - Error message shown below the field.
 * @param {boolean} required    - Appends a red asterisk to the label.
 * @param {React.ReactNode} rightEl - Element rendered inside the right edge (e.g. show/hide toggle).
 * @param {boolean} multiline   - Renders a <textarea> instead of <input>.
 * @param {number}  rows        - Row count for textarea (default 3).
 * @param {boolean} disabled
 * @param {boolean} numeric     - Use tabular figures (for vitals / IDs / labs).
 */
export function Input({
  label,
  value,
  onChange,
  type       = 'text',
  placeholder,
  error,
  required   = false,
  rightEl,
  multiline  = false,
  rows       = 3,
  disabled   = false,
  numeric    = false,
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const borderColor = error
    ? C.error
    : focused
      ? C.secondary
      : hovered
        ? C.gray[400]
        : C.border;

  const fieldStyle = {
    width:        '100%',
    padding:      rightEl ? '9px 40px 9px 12px' : '9px 12px',
    borderRadius: radii.md,
    border:       `1px solid ${borderColor}`,
    background:   disabled ? C.gray[50] : C.white,
    fontSize:     14,
    color:        C.ink,
    fontFamily:   'Inter',
    resize:       multiline ? 'vertical' : 'none',
    transition:   'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline:      'none',
    boxShadow:    focused && !error ? `0 0 0 3px ${C.secondary}22` : 'none',
    ...(numeric ? tnum : null),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
          {label}
          {required && <span style={{ color: C.error }}> *</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            rows={rows}
            style={fieldStyle}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={disabled}
          />
        ) : (
          <input
            type={type}
            style={fieldStyle}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={disabled}
          />
        )}

        {rightEl && (
          <div
            style={{
              position:  'absolute',
              right:     10,
              top:       '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {rightEl}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 12, color: C.error }}>{error}</span>
      )}
    </div>
  );
}
