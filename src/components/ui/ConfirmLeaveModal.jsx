import { C, shadow } from '../../constants/theme';

/**
 * ConfirmLeaveModal — shown when a user tries to leave a form with unsaved changes.
 *
 * @param {boolean}  open        - Whether the modal is visible.
 * @param {Function} onReturn    - Close the modal, stay on the form.
 * @param {Function} onDiscard   - Discard changes and navigate away.
 */
export function ConfirmLeaveModal({ open, onReturn, onDiscard }) {
  if (!open) return null;

  return (
    /* ── Backdrop ── */
    <div
      onClick={onReturn}
      style={{
        position:   'fixed',
        inset:       0,
        background: 'rgba(15,23,42,.45)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex:     1000,
        padding:    16,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* ── Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background:   '#fff',
          borderRadius: 14,
          boxShadow:    '0 20px 60px rgba(0,0,0,.18)',
          padding:      32,
          width:        '100%',
          maxWidth:     400,
          fontFamily:   'Inter',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: '#FEF9C3', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#CA8A04">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.primary, margin: '0 0 8px' }}>
          Unsaved changes
        </h3>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.55 }}>
          You have unsaved changes that will be lost if you leave this page.
          What would you like to do?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Primary: stay */}
          <button
            onClick={onReturn}
            style={{
              padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: C.primary, color: '#fff',
              fontSize: 14, fontWeight: 600, fontFamily: 'Inter',
              transition: 'opacity .12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Return to form
          </button>

          {/* Secondary: leave */}
          <button
            onClick={onDiscard}
            style={{
              padding: '11px 0', borderRadius: 8, cursor: 'pointer',
              background: 'transparent',
              border: `1px solid #FECACA`,
              color: '#EF4444',
              fontSize: 14, fontWeight: 500, fontFamily: 'Inter',
              transition: 'background .12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Discard changes &amp; leave
          </button>
        </div>
      </div>
    </div>
  );
}
