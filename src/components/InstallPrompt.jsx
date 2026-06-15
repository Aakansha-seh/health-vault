/**
 * InstallPrompt.jsx
 *
 * Listens for the browser's `beforeinstallprompt` event and renders a slim
 * install banner at the bottom of the screen.  Automatically hidden if:
 *   • The user dismisses it (stored in sessionStorage so it stays gone
 *     for the rest of the session but can reappear next visit)
 *   • The app is already running in standalone mode (i.e. already installed)
 *   • The browser never fires the event (iOS Safari, Firefox, etc.)
 *
 * Styling uses only inline styles so it is completely self-contained and
 * doesn't pollute any existing CSS.
 */

import { useEffect, useState, useCallback } from 'react';

const DISMISS_KEY = 'hv_install_dismissed';

// ── Design tokens (match HealthVault palette) ───────────────────────────────
const COLORS = {
  bg:          '#1A3C34',
  bgHover:     '#14302a',
  border:      '#5A8A72',
  text:        '#FFFFFF',
  textMuted:   '#A8C5B5',
  btnPrimary:  '#5A8A72',
  btnHover:    '#4a7560',
};

// ── Inline styles ────────────────────────────────────────────────────────────
const styles = {
  banner: {
    position:        'fixed',
    bottom:          '1rem',
    left:            '50%',
    transform:       'translateX(-50%)',
    zIndex:          9999,
    display:         'flex',
    alignItems:      'center',
    gap:             '0.75rem',
    padding:         '0.75rem 1rem',
    borderRadius:    '12px',
    background:      COLORS.bg,
    border:          `1px solid ${COLORS.border}`,
    boxShadow:       '0 8px 32px rgba(0,0,0,0.35)',
    color:           COLORS.text,
    fontFamily:      "'Inter', sans-serif",
    fontSize:        '0.875rem',
    lineHeight:      1.4,
    maxWidth:        'min(92vw, 420px)',
    animation:       'hv-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  icon: {
    flexShrink:      0,
    width:           '36px',
    height:          '36px',
  },
  text: {
    flex:            1,
    minWidth:        0,
  },
  title: {
    fontWeight:      600,
    color:           COLORS.text,
    whiteSpace:      'nowrap',
    overflow:        'hidden',
    textOverflow:    'ellipsis',
  },
  subtitle: {
    color:           COLORS.textMuted,
    fontSize:        '0.8rem',
    marginTop:       '1px',
  },
  installBtn: {
    flexShrink:      0,
    padding:         '0.45rem 1rem',
    borderRadius:    '8px',
    background:      COLORS.btnPrimary,
    color:           COLORS.text,
    border:          'none',
    cursor:          'pointer',
    fontFamily:      'inherit',
    fontSize:        '0.85rem',
    fontWeight:      600,
    transition:      'background 0.2s',
    whiteSpace:      'nowrap',
  },
  closeBtn: {
    flexShrink:      0,
    width:           '28px',
    height:          '28px',
    borderRadius:    '50%',
    background:      'rgba(255,255,255,0.08)',
    border:          'none',
    cursor:          'pointer',
    color:           COLORS.textMuted,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '1rem',
    lineHeight:      1,
    transition:      'background 0.2s',
  },
};

// Keyframe injected once into <head>
const KEYFRAMES = `
@keyframes hv-slide-up {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
}`;

function injectKeyframes() {
  if (document.getElementById('hv-install-kf')) return;
  const el = document.createElement('style');
  el.id = 'hv-install-kf';
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible]               = useState(false);

  useEffect(() => {
    // Already installed (standalone mode) — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // User dismissed earlier this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    injectKeyframes();

    const handler = (e) => {
      e.preventDefault();            // stop Chrome's default mini-infobar
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div role="banner" aria-label="Install HealthVault" style={styles.banner}>
      {/* Logo mark */}
      <svg style={styles.icon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="100" height="100" fill="#1A3C34" rx="18"/>
        <path d="M50 10L15 30v40l35 20 35-20V30L50 10z"
              stroke="#5A8A72" strokeWidth="3" fill="none"/>
        <path d="M50 35v30M35 50h30"
              stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round"/>
      </svg>

      {/* Text */}
      <div style={styles.text}>
        <div style={styles.title}>Install HealthVault</div>
        <div style={styles.subtitle}>Add to home screen for quick access</div>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={styles.installBtn}
        onMouseEnter={e => e.currentTarget.style.background = COLORS.btnHover}
        onMouseLeave={e => e.currentTarget.style.background = COLORS.btnPrimary}
        aria-label="Install app"
      >
        Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={styles.closeBtn}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        aria-label="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  );
}
