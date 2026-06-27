/**
 * Design tokens — single source of truth for all colours, type, shadows and radii.
 *
 * DESIGN LANGUAGE (clinician-facing): a neutral, near-monochrome canvas with a
 * single green accent for brand + primary actions. Red / amber / green are
 * RESERVED for clinical status and alerts only — never decorative — to protect
 * against alarm fatigue. Import `C` for colours; never hard-code hex in views.
 *
 * Back-compat: every key the codebase already imports (C.primary, C.secondary,
 * C.bg, C.white, C.amber, C.border, C.error, C.success, C.muted, C.text,
 * `shadow`, `radius`) still exists. Their VALUES were re-pointed to the neutral
 * system, so backgrounds/text/borders neutralise app-wide with zero view edits.
 */

// ── Neutral gray ramp ─────────────────────────────────────────────────────────
export const gray = {
  50:  'var(--hv-gray-50, #F7F8F9)',  // app canvas
  100: 'var(--hv-gray-100, #F1F3F4)',  // subtle fill / table header
  200: 'var(--hv-gray-200, #E6E8EB)',  // hairline border
  300: 'var(--hv-gray-300, #D5D9DD)',  // strong border / divider
  400: 'var(--hv-gray-400, #A8AFB6)',  // faint text / disabled
  500: 'var(--hv-gray-500, #7C858D)',  // muted / secondary text
  600: 'var(--hv-gray-600, #5B636B)',
  700: 'var(--hv-gray-700, #3E454C)',
  800: 'var(--hv-gray-800, #272B30)',
  900: 'var(--hv-gray-900, #1A1D21)',  // primary ink
};

export const C = {
  // ── Brand (the single accent: primary actions, focus, key links) ──
  primary:      'var(--hv-primary, #1A3C34)',  // brand green — primary buttons / actions
  primaryHover: 'var(--hv-primary-hover, #15302A)',
  brand:        'var(--hv-brand, #1A3C34)',
  secondary:    'var(--hv-secondary, #3F6B58)',  // deeper sage

  // ── Neutral canvas / surfaces ──
  bg:           'var(--hv-bg, #F7F8F9)',  // app canvas
  surface:      'var(--hv-surface, #FFFFFF)',
  white:        'var(--hv-white, #FFFFFF)',
  border:       'var(--hv-border, #E6E8EB)',  // neutral hairline
  borderStrong: 'var(--hv-border-strong, #D5D9DD)',

  // ── Text (neutral slate — NOT green) ──
  ink:          'var(--hv-ink, #1A1D21)',  // primary text
  text:         'var(--hv-text, #1A1D21)',
  muted:        'var(--hv-muted, #7C858D)',  // secondary text
  faint:        'var(--hv-faint, #A8AFB6)',  // tertiary / disabled

  // ── Clinical status — RESERVED. Do not use decoratively. ──
  critical:     'var(--hv-critical, #DC2626)',  // red — critical / destructive
  error:        'var(--hv-error, #DC2626)',
  warning:      'var(--hv-warning, #D97706)',  // amber — caution
  amber:        'var(--hv-amber, #D97706)',
  success:      'var(--hv-success, #16A34A)',  // green — ok / done
  info:         'var(--hv-info, #2563EB)',  // blue — informational

  // ── Soft status fills (badges / banners) ──
  criticalSoft: 'var(--hv-critical-soft, #FEF2F2)',
  warningSoft:  'var(--hv-warning-soft, #FFFBEB)',
  successSoft:  'var(--hv-success-soft, #F0FDF4)',
  infoSoft:     'var(--hv-info-soft, #EFF6FF)',

  // Expose the ramp for fine-grained use.
  gray,
};

// ── Radii — tightened for a precise (not bubbly) feel ──
export const radii = { sm: '4px', md: '6px', lg: '8px', xl: '10px', pill: '999px' };
export const radius = radii.md;  // default (was 8px)

// ── Shadows — subtle and crisp, low spread ──
export const shadows = {
  xs: '0 1px 2px rgba(16,24,40,0.05)',
  sm: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.05)',
  md: '0 4px 12px rgba(16,24,40,0.08)',
  lg: '0 12px 28px rgba(16,24,40,0.12)',
};
export const shadow = shadows.sm;  // default (was a softer 0 1px 4px)

// ── Type scale ──
// Sizes in px; pair with `weights`. Use `tnum` for any numeric data so columns
// of vitals / IDs / timestamps / lab values align.
export const type = {
  display: { fontSize: 24, fontWeight: 700, lineHeight: 1.2,  letterSpacing: '-0.02em' },
  h1:      { fontSize: 20, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
  h2:      { fontSize: 16, fontWeight: 600, lineHeight: 1.3 },
  h3:      { fontSize: 14, fontWeight: 600, lineHeight: 1.35 },
  body:    { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
  small:   { fontSize: 13, fontWeight: 400, lineHeight: 1.45 },
  caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4 },
  micro:   { fontSize: 11, fontWeight: 600, lineHeight: 1.3, letterSpacing: '0.04em' },
};
export const weights = { regular: 400, medium: 500, semibold: 600, bold: 700 };

// Spread onto any element rendering numbers so digits are fixed-width.
export const tnum = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

// Monospaced stack for IDs / MRNs / codes that should read as data.
export const mono =
  "'SFMono-Regular', ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace";

// 4px spacing scale helper.
export const space = (n) => `${n * 4}px`;
