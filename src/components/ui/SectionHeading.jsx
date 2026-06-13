import { C } from '../../constants/theme';

/**
 * SectionHeading — page-level heading with the 3px sage left-border
 * that is the signature element of the HealthVault design language.
 */
export function SectionHeading({ children }) {
  return (
    <div
      style={{
        borderLeft:   `3px solid ${C.secondary}`,
        paddingLeft:  12,
        fontSize:     16,
        fontWeight:   600,
        color:        C.primary,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
