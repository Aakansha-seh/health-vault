import { useEffect, useRef, useState } from 'react';
import { C, radii } from '../../constants/theme';

/**
 * SearchableSelect — single-select dropdown with type-to-filter.
 *
 * Drop-in for a native <select> bound with `set('field')`: `onChange` is called
 * with a synthetic `{ target: { value } }`, so existing handlers keep working.
 *
 * @param {string}   value
 * @param {Function} onChange   called with { target: { value } }
 * @param {{value:string,label:string}[]} options
 * @param {string}   label      optional field label rendered above
 * @param {string}   placeholder
 * @param {boolean}  required
 * @param {boolean}  disabled
 */
export function SearchableSelect({ value, onChange, options = [], label, placeholder = 'Select…', required = false, disabled = false }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const q = search.trim().toLowerCase();
  const filtered = q ? options.filter(o => (o.label || '').toLowerCase().includes(q)) : options;

  const choose = (v) => { onChange?.({ target: { value: v } }); setOpen(false); setSearch(''); };

  const boxStyle = {
    width: '100%', padding: '9px 12px', borderRadius: radii.md,
    border: `1.5px solid ${C.border}`, fontSize: 14, color: C.ink, background: C.white,
    boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 4 }}>
          {label}{required && <span style={{ color: C.error }}> *</span>}
        </label>
      )}
      <div ref={ref} style={{ position: 'relative' }}>
        <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} style={boxStyle}>
          <span style={{ color: selected ? C.ink : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : placeholder}
          </span>
          <span style={{ color: C.muted, fontSize: 11, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
        </button>

        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(16,24,40,0.12)', padding: 6, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) choose(filtered[0].value); }
                else if (e.key === 'Escape') { setOpen(false); setSearch(''); }
              }}
              placeholder="Type to search…"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.ink, background: C.white, boxSizing: 'border-box', marginBottom: 6, outline: 'none' }}
            />
            <div style={{ overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 13, color: C.muted, padding: 10 }}>No matches</p>
              ) : filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => choose(o.value)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, background: o.value === value ? `${C.secondary}14` : 'transparent', color: o.value === value ? C.primary : C.ink, fontWeight: o.value === value ? 600 : 400 }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
