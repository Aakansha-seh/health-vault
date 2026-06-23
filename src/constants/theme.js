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
  50:  '#F7F8F9',  // app canvas
  100: '#F1F3F4',  // subtle fill / table header
  200: '#E6E8EB',  // hairline border
  300: '#D5D9DD',  // strong border / divider
  400: '#A8AFB6',  // faint text / disabled
  500: '#7C858D',  // muted / secondary text
  600: '#5B636B',
  700: '#3E454C',
  800: '#272B30',
  900: '#1A1D21',  // primary ink
};

export const C = {
  // ── Brand (the single accent: primary actions, focus, key links) ──
  primary:      '#1A3C34',  // brand green — primary buttons / actions
  primaryHover: '#15302A',
  brand:        '#1A3C34',
  secondary:    '#3F6B58',  // deeper sage — accent text / links / focus ring
                            //   (darker than the old #5A8A72 for AA contrast on white)

  // ── Neutral canvas / surfaces ──
  bg:           '#F7F8F9',  // app canvas (was mint #F0F7F4)
  surface:      '#FFFFFF',
  white:        '#FFFFFF',
  border:       '#E6E8EB',  // neutral hairline (was greenish #E0EDE8)
  borderStrong: '#D5D9DD',

  // ── Text (neutral slate — NOT green) ──
  ink:          '#1A1D21',  // primary text
  text:         '#1A1D21',  // was green #1A3C34 → now neutral
  muted:        '#7C858D',  // secondary text (was greenish #8AA89E)
  faint:        '#A8AFB6',  // tertiary / disabled

  // ── Clinical status — RESERVED. Do not use decoratively. ──
  critical:     '#DC2626',  // red — critical / destructive
  error:        '#DC2626',
  warning:      '#D97706',  // amber — caution
  amber:        '#D97706',
  success:      '#16A34A',  // green — ok / done (kept distinct from brand green)
  info:         '#2563EB',  // blue — informational

  // ── Soft status fills (badges / banners) ──
  criticalSoft: '#FEF2F2',
  warningSoft:  '#FFFBEB',
  successSoft:  '#F0FDF4',
  infoSoft:     '#EFF6FF',

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
