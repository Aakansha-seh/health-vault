import { C, shadows, radii } from '../../constants/theme';

/**
 * Card — standard white surface. Crisp hairline border + low-spread shadow for a
 * precise (not bubbly) feel. Accepts an optional `style` prop for overrides.
 */
export function Card({ children, style, interactive = false, ...props }) {
  return (
    <div
      className={`${interactive ? "hv-card-hover" : ""} hv-glass-panel`}
      style={{
        borderRadius: radii.lg,
        boxShadow:    shadows.xs,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
