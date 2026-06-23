import { C, radii } from '../../constants/theme';

/**
 * Badge — compact status chip.
 *
 * Colour is reserved for meaning: appointment/clinical status uses status
 * tints; plain categories (new / returning) stay neutral gray so colour keeps
 * its signal value (alarm-fatigue guard). Tag-shaped (4px) for a precise feel.
 *
 * @param {string} label
 * @param {'new'|'returning'|'scheduled'|'completed'|'cancelled'|'critical'|'warning'|'stable'|'neutral'} type
 */

const BADGE_STYLES = {
  // Categories — neutral (not clinical status)
  new:       { background: C.gray[100], color: C.gray[600] },
  returning: { background: C.gray[100], color: C.gray[600] },
  neutral:   { background: C.gray[100], color: C.gray[600] },

  // Workflow status
  scheduled: { background: C.infoSoft,    color: C.info },
  completed: { background: C.successSoft, color: C.success },
  cancelled: { background: C.gray[100],   color: C.faint },

  // Clinical status — reserved
  critical:  { background: C.criticalSoft, color: C.critical },
  warning:   { background: C.warningSoft,  color: C.warning },
  stable:    { background: C.successSoft,  color: C.success },
};

export function Badge({ label, type }) {
  const style = BADGE_STYLES[type] ?? BADGE_STYLES.neutral;

  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        fontSize:      11,
        fontWeight:    600,
        padding:       '2px 7px',
        borderRadius:  radii.sm,
        letterSpacing: 0.2,
        whiteSpace:    'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
