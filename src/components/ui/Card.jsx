import { C, shadows, radii } from '../../constants/theme';

/**
 * Card — standard white surface. Crisp hairline border + low-spread shadow for a
 * precise (not bubbly) feel. Accepts an optional `style` prop for overrides.
 */
export function Card({ children, style }) {
  return (
    <div
      style={{
        background:   C.surface,
        borderRadius: radii.lg,
        boxShadow:    shadows.xs,
        border:       `1px solid ${C.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
