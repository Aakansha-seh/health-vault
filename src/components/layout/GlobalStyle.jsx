import { C } from '../../constants/theme';

/**
 * GlobalStyle — injects global CSS reset, font import, animations,
 * and responsive layout rules via a <style> tag.
 *
 * Rendered once at the root of the app, before any other content.
 */
export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

      *, *::before, *::after {
        box-sizing: border-box;
        margin:     0;
        padding:    0;
      }

      body {
        font-family:             'Inter', sans-serif;
        background:              ${C.bg};
        color:                   ${C.text};
        -webkit-font-smoothing:  antialiased;
      }

      input, textarea, select { font-family: 'Inter', sans-serif; outline: none; }

      ::-webkit-scrollbar       { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }

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

      /* ── Responsive layout ── */
      @media (max-width: 768px) {
        .sidebar       { display: none !important; }
        .bottom-nav    { display: flex !important; }
        .main-content  { margin-left: 0 !important; margin-bottom: 64px !important; }
      }
      @media (min-width: 769px) {
        .bottom-nav { display: none !important; }
      }
    `}</style>
  );
}
