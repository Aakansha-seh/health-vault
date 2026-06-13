/**
 * Badge — compact status chip.
 *
 * @param {string} label - Text to display.
 * @param {'new'|'returning'|'scheduled'|'completed'|'cancelled'} type
 */

const BADGE_STYLES = {
  new:       { background: '#E8F5E9', color: '#2E7D32' },
  returning: { background: '#FFF8E1', color: '#D4882A' },
  scheduled: { background: '#E3F2FD', color: '#1565C0' },
  completed: { background: '#E8F5E9', color: '#2E7D32' },
  cancelled: { background: '#F5F5F5', color: '#8AA89E' },
};

export function Badge({ label, type }) {
  const style = BADGE_STYLES[type] ?? { background: '#F0F7F4', color: '#8AA89E' };

  return (
    <span
      style={{
        fontSize:      11,
        fontWeight:    600,
        padding:       '2px 8px',
        borderRadius:  20,
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
