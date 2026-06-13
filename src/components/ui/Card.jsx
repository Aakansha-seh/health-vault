import { shadow, radius } from '../../constants/theme';

/**
 * Card — standard white surface with shadow and border.
 * Accepts an optional `style` prop for overrides.
 */
export function Card({ children, style }) {
  return (
    <div
      style={{
        background:   '#FFFFFF',
        borderRadius: radius,
        boxShadow:    shadow,
        border:       '1px solid #E0EDE8',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
