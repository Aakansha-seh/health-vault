import { C } from '../../constants/theme';

export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Inter', sans-serif;
        background: ${C.bg};
        color: ${C.text};
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }

      input, textarea, select { font-family: 'Inter', sans-serif; outline: none; }

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
      @keyframes drawEKG {
        from { stroke-dashoffset: 1500; }
        to   { stroke-dashoffset: 0; }
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
