import { C } from '../../constants/theme';

/**
 * SectionHeading — section title. Hierarchy now comes from type weight + size +
 * spacing rather than the old green left-border, keeping dense screens calmer
 * and reserving colour for status. Pass `accent` to opt back into a subtle bar.
 */
export function SectionHeading({ children, accent = false }) {
  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        fontSize:      16,
        fontWeight:    600,
        letterSpacing: '-0.01em',
        color:         C.ink,
        marginBottom:  16,
      }}
    >
      {accent && (
        <span style={{ width: 3, height: 16, borderRadius: 2, background: C.primary, flexShrink: 0 }} />
      )}
      {children}
    </div>
  );
}
