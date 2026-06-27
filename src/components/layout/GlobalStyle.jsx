import { C } from '../../constants/theme';

export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      :root {
        --hv-primary: #1A3C34;
        --hv-primary-hover: #15302A;
        --hv-brand: #1A3C34;
        --hv-secondary: #3F6B58;
        --hv-bg: #F7F8F9;
        --hv-surface: #FFFFFF;
        --hv-white: #FFFFFF;
        --hv-border: #E6E8EB;
        --hv-border-strong: #D5D9DD;
        --hv-ink: #1A1D21;
        --hv-text: #1A1D21;
        --hv-muted: #7C858D;
        --hv-faint: #A8AFB6;
        --hv-critical: #DC2626;
        --hv-error: #DC2626;
        --hv-warning: #D97706;
        --hv-amber: #D97706;
        --hv-success: #16A34A;
        --hv-info: #2563EB;
        --hv-critical-soft: #FEF2F2;
        --hv-warning-soft: #FFFBEB;
        --hv-success-soft: #F0FDF4;
        --hv-info-soft: #EFF6FF;

        --hv-gray-50: #F7F8F9;
        --hv-gray-100: #F1F3F4;
        --hv-gray-200: #E6E8EB;
        --hv-gray-300: #D5D9DD;
        --hv-gray-400: #A8AFB6;
        --hv-gray-500: #7C858D;
        --hv-gray-600: #5B636B;
        --hv-gray-700: #3E454C;
        --hv-gray-800: #272B30;
        --hv-gray-900: #1A1D21;
      }

      body.hv-dark-mode {
        --hv-primary: #52B788;
        --hv-primary-hover: #74C69D;
        --hv-brand: #52B788;
        --hv-secondary: #74C69D;
        --hv-bg: #0D0F12;
        --hv-surface: #161A1D;
        --hv-white: #161A1D;
        --hv-border: #22272E;
        --hv-border-strong: #2D333B;
        --hv-ink: #ECF2F8;
        --hv-text: #ECF2F8;
        --hv-muted: #8B949E;
        --hv-faint: #484F58;
        --hv-critical: #F85149;
        --hv-error: #F85149;
        --hv-warning: #F0883E;
        --hv-amber: #F0883E;
        --hv-success: #56B466;
        --hv-info: #58A6FF;
        --hv-critical-soft: #2D1D1F;
        --hv-warning-soft: #2D241E;
        --hv-success-soft: #1E2D22;
        --hv-info-soft: #1E252D;

        --hv-gray-50: #161A1D;
        --hv-gray-100: #22272E;
        --hv-gray-200: #2D333B;
        --hv-gray-300: #3E454C;
        --hv-gray-400: #5B636B;
        --hv-gray-500: #8B949E;
        --hv-gray-600: #A8AFB6;
        --hv-gray-700: #D5D9DD;
        --hv-gray-800: #F1F3F4;
        --hv-gray-900: #F7F8F9;
      }

      /* ── Command Palette ── */
      .hv-command-palette-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 5000;
        display: flex; align-items: start; justify-content: center; padding-top: 15vh;
        backdrop-filter: blur(2px);
      }
      .hv-command-palette-modal {
        background: var(--hv-surface); border: 1px solid var(--hv-border);
        border-radius: 12px; width: 100%; max-width: 520px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.25); overflow: hidden;
        animation: paletteReveal 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      @keyframes paletteReveal {
        from { opacity: 0; transform: translateY(-8px) scale(0.98); }
        to   { opacity: 1; transform: none; }
      }
      .hv-command-palette-input {
        width: 100%; padding: 14px 16px; border: none; outline: none;
        background: transparent; font-size: 15px; color: var(--hv-text);
        border-bottom: 1px solid var(--hv-border);
      }
      .hv-command-palette-list {
        max-height: 320px; overflow-y: auto; padding: 6px;
      }
      .hv-command-palette-item {
        width: 100%; padding: 10px 12px; border: none; text-align: left;
        background: transparent; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; justify-content: space-between;
        color: var(--hv-muted); font-size: 13px; font-weight: 500;
        transition: all 0.1s ease;
      }
      .hv-command-palette-item.selected {
        background: var(--hv-gray-100); color: var(--hv-primary);
      }

      /* ── Drag & Drop Uploader ── */
      .hv-dropzone {
        border: 2px dashed var(--hv-border);
        border-radius: 10px;
        padding: 24px;
        text-align: center;
        background: var(--hv-gray-50);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--hv-muted);
      }
      .hv-dropzone.dragover {
        border-color: var(--hv-secondary);
        background: var(--hv-info-soft);
        color: var(--hv-primary);
      }

      /* ── Vitals badges ── */
      .hv-vital-badge-critical {
        background: var(--hv-critical-soft);
        color: var(--hv-critical);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        border: 1px solid rgba(248,81,73,0.15);
      }
      .hv-vital-badge-warning {
        background: var(--hv-warning-soft);
        color: var(--hv-warning);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        border: 1px solid rgba(240,136,62,0.15);
      }
      .hv-vital-badge-stable {
        background: var(--hv-gray-100);
        color: var(--hv-muted);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        border: 1px solid var(--hv-border);
      }

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      html, body {
        max-width: 100%;
        overflow-x: hidden;
      }

      body {
        font-family: 'Inter', sans-serif;
        background: ${C.bg};
        color: ${C.text};
        -webkit-font-smoothing: antialiased;
      }

      /* App root must never exceed the viewport width. */
      #root { max-width: 100vw; overflow-x: clip; }

      /* ── Global overflow guards ──
         Flex/grid children default to min-width:auto, which lets wide content
         (long unbreakable usernames, tables, etc.) push the layout past the
         viewport. These rules keep every screen in-bounds at any width. */
      main { min-width: 0; max-width: 100%; }
      img, svg, video, canvas { max-width: 100%; height: auto; }
      table { max-width: 100%; }

      input, textarea, select { font-family: 'Inter', sans-serif; outline: none; max-width: 100%; }

      /* Wrap any wide table in this so it scrolls inside its card instead of
         breaking the page. */
      .hv-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

      /* Break long unbreakable tokens (emails, IDs) instead of forcing width. */
      .hv-break { overflow-wrap: anywhere; word-break: break-word; }
      /* (responsive overflow guards) */

      ::-webkit-scrollbar       { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }

      /* ── Prevent ALL grid/flex children from overflowing ── */
      .grid-safe > * { min-width: 0; }

      /* ── Animations ── */
      .fade-in { animation: fadeIn 0.2s ease; }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: none; }
      }

      /* ── Elegant grid background with ambient glow ── */
      .hv-bg-grid {
        position: relative;
        background-color: ${C.bg};
        background-image: 
          radial-gradient(circle at 10% 20%, rgba(26,60,52,0.04) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(63,107,88,0.03) 0%, transparent 50%),
          linear-gradient(rgba(26,60,52,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26,60,52,0.015) 1px, transparent 1px);
        background-size: 100% 100%, 100% 100%, 24px 24px, 24px 24px;
      }

      /* ── Interactive premium card hover ── */
      .hv-card-hover {
        transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), 
                    box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), 
                    border-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
      }
      .hv-card-hover:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(16,24,40,0.08) !important;
        border-color: ${C.gray[300]} !important;
      }

      /* ── Premium fade-up animation ── */
      .hv-fade-up {
        opacity: 0;
        animation: hvFadeUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      @keyframes hvFadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Staggered delays ── */
      .hv-delay-1 { animation-delay: 0.05s; }
      .hv-delay-2 { animation-delay: 0.1s; }
      .hv-delay-3 { animation-delay: 0.15s; }
      .hv-delay-4 { animation-delay: 0.2s; }
      .hv-delay-5 { animation-delay: 0.25s; }

      /* ── Bar Chart Grow Animation ── */
      .hv-bar-grow {
        transform-origin: bottom;
        animation: hvBarGrow 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      @keyframes hvBarGrow {
        from { transform: scaleY(0); }
        to   { transform: scaleY(1); }
      }

      @keyframes drawEKG {
        from { stroke-dashoffset: 1500; }
        to   { stroke-dashoffset: 0; }
      }

      /* ── AI summary: staggered reveal + generating shimmer ── */
      @keyframes hv-reveal {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }
      @keyframes hv-pulse {
        0%, 100% { transform: scale(1);    opacity: 1;   }
        50%      { transform: scale(1.08); opacity: 0.65; }
      }
      @keyframes hv-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .hv-ai-pulse { animation: hv-pulse 1.4s ease-in-out infinite; }
      .hv-shimmer {
        background: linear-gradient(90deg, ${C.bg} 25%, ${C.border} 37%, ${C.bg} 63%);
        background-size: 400% 100%;
        animation: hv-shimmer 1.4s ease infinite;
      }

      /* ── Tabular numerals: align columns of vitals / IDs / timestamps / labs ── */
      .hv-num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1, "lnum" 1; }

      /* ── Skeleton loading block (replaces spinners on data fetch) ── */
      .hv-skeleton {
        position: relative;
        overflow: hidden;
        background: ${C.gray[100]};
        border-radius: 6px;
      }
      .hv-skeleton::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
        animation: hv-sweep 1.3s ease-in-out infinite;
      }
      @keyframes hv-sweep { 100% { transform: translateX(100%); } }

      /* ── Fast (<150ms) press feedback on interactive elements ── */
      .hv-press { transition: transform .1s ease, background .12s ease, box-shadow .12s ease; }
      .hv-press:active { transform: translateY(0.5px) scale(0.985); }

      /* ── Accessible keyboard focus — single green accent ring ── */
      :focus-visible {
        outline: 2px solid ${C.secondary};
        outline-offset: 2px;
        border-radius: 4px;
      }
      /* Don't double-ring elements that draw their own focus border */
      input:focus-visible, textarea:focus-visible, select:focus-visible { outline: none; }

      /* ── Respect reduced-motion preferences ── */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }

      /* ─────────────────────────────────────────────────────
         DESKTOP DEFAULTS
      ───────────────────────────────────────────────────── */

      /* Layout shell */
      .sidebar      { display: flex !important; }
      .bottom-nav   { display: none !important; }
      .main-content { margin-left: 220px; padding: 28px 32px 80px; }

      /* Two-col form (add patient left/right) */
      .intake-2col  { grid-template-columns: minmax(0,1fr) minmax(0,1.5fr) !important; }

      /* Vitals 3-col grid */
      .vitals-grid  { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }

      /* Patient table row — avatar | name | age | gender | last-visit | status | actions */
      .pt-header, .pt-row {
        grid-template-columns: 40px 1fr 56px 76px 110px 90px 110px !important;
      }

      /* Appointment table */
      .appt-header, .appt-row {
        grid-template-columns: 1fr 120px 80px 130px 100px !important;
      }

      /* Clinic-wide patients table */
      .cp-header, .cp-row {
        grid-template-columns: 1fr 56px 76px 120px 120px 100px !important;
      }

      /* Clinic-wide appointments table */
      .ca-header, .ca-row {
        grid-template-columns: 1fr 120px 80px 130px 100px !important;
      }

      /* Audit table */
      .audit-header, .audit-row {
        grid-template-columns: 180px 130px 1fr auto !important;
      }

      /* Dashboard charts side by side */
      .dashboard-charts { grid-template-columns: 1fr 1fr !important; }

      /* Form rows (2 inputs per row) */
      .form-row { grid-template-columns: 1fr 1fr !important; }

      /* Clinic admin shell */
      .clinic-shell   { flex-direction: row !important; }
      .clinic-sidebar {
        width: 220px !important; flex-shrink: 0 !important;
        position: static !important; border-right: 1px solid ${C.border} !important;
        border-bottom: none !important;
        flex-direction: column !important;
      }
      .clinic-nav     { flex-direction: column !important; gap: 2px !important; }
      .clinic-nav-btn { width: 100% !important; padding: 9px 14px !important; }
      .clinic-content { overflow: auto !important; flex: 1 !important; }

      /* ─────────────────────────────────────────────────────
         TABLET  ≤ 900 px
         Stack intake form, keep vitals 3-col
      ───────────────────────────────────────────────────── */
      @media (max-width: 900px) {
        .intake-2col { grid-template-columns: 1fr !important; }
      }

      /* ─────────────────────────────────────────────────────
         MOBILE  ≤ 640 px
      ───────────────────────────────────────────────────── */
      @media (max-width: 640px) {
        /* Shell */
        .sidebar      { display: none !important; }
        .bottom-nav   { display: flex !important; }
        .main-content {
          margin-left: 0 !important;
          padding: 16px 12px 80px !important;
        }

        /* Vitals → 2 cols */
        .vitals-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }

        /* Patient list → avatar + name + badge only */
        .pt-header { display: none !important; }
        .pt-row    { grid-template-columns: 40px 1fr auto !important; }
        .pt-col-age, .pt-col-gender, .pt-col-last, .pt-col-actions { display: none !important; }

        /* Appointment table → patient + status only */
        .appt-header { display: none !important; }
        .appt-row    { grid-template-columns: 1fr auto !important; padding: 10px 12px !important; }
        .appt-col-date, .appt-col-time, .appt-col-doctor { display: none !important; }
        .appt-meta   { display: block !important; }

        /* Clinic patients */
        .cp-header { display: none !important; }
        .cp-row    { grid-template-columns: 1fr auto !important; }
        .cp-col-age, .cp-col-gender, .cp-col-last, .cp-col-doctor { display: none !important; }

        /* Clinic appointments */
        .ca-header { display: none !important; }
        .ca-row    { grid-template-columns: 1fr auto !important; }
        .ca-col-date, .ca-col-time, .ca-col-doctor { display: none !important; }

        /* Audit → action + time */
        .audit-header { display: none !important; }
        .audit-row    { grid-template-columns: 1fr auto !important; }
        .audit-col-detail { display: none !important; }

        /* Dashboard charts → stack */
        .dashboard-charts { grid-template-columns: 1fr !important; }

        /* Form rows → single column */
        .form-row { grid-template-columns: 1fr !important; }

        /* Clinic admin shell → vertical */
        .clinic-shell   { flex-direction: column !important; height: auto !important; min-height: 100vh !important; }
        .clinic-sidebar {
          width: 100% !important; border-right: none !important;
          border-bottom: 1px solid ${C.border} !important;
          flex-direction: row !important; flex-wrap: wrap !important;
          padding: 8px !important; gap: 4px !important;
        }
        .clinic-nav     { flex-direction: row !important; flex-wrap: wrap !important; gap: 4px !important; }
        .clinic-nav-btn { width: auto !important; padding: 7px 12px !important; font-size: 12px !important; }
        .clinic-content { padding: 16px 12px 32px !important; overflow: visible !important; }
        .clinic-logo    { width: 100% !important; margin-bottom: 8px !important; }
        .clinic-logout  { margin-top: 0 !important; }
      }
    `}</style>
  );
}
