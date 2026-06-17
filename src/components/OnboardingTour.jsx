import { useState, useEffect } from 'react';
import { C } from '../constants/theme';

export const TOUR_KEY       = 'hv_onboarding_done';
export const shouldShowTour = () => !localStorage.getItem(TOUR_KEY);

const STEPS = [
  { id: 'welcome',      target: null,                             icon: '🏥', title: 'Welcome to HealthVault', desc: "Quick 30-sec tour so you know your way around." },
  { id: 'patients',     target: '[data-tour="nav-patients"]',     side: 'right',  icon: '👥', title: 'Patient Records',    desc: 'Register patients, view history, record consultations.' },
  { id: 'add-patient',  target: '[data-tour="add-patient"]',      side: 'bottom', icon: '➕', title: 'Add a Patient',      desc: 'Demographics + consultation in one form.' },
  { id: 'appointments', target: '[data-tour="nav-appointments"]', side: 'right',  icon: '📅', title: 'Appointments',        desc: 'Schedule and manage follow-up appointments.' },
  { id: 'dashboard',    target: '[data-tour="nav-dashboard"]',    side: 'right',  icon: '📊', title: 'Dashboard',           desc: 'Clinic stats, trends and upcoming visits.' },
  { id: 'profile',      target: '[data-tour="nav-profile"]',      side: 'right',  icon: '👤', title: 'Your Profile',        desc: 'Your details appear on printed prescriptions.' },
  { id: 'done',         target: null,                             icon: '🎉', title: "You're all set!",       desc: 'Start by adding your first patient.', isLast: true },
];

const CARD_W = 228;
const GAP    = 10;

export function OnboardingTour({ onComplete, onAddFirstPatient }) {
  const [step,   setStep]   = useState(0);
  const [rect,   setRect]   = useState(null);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });
  const [arr,    setArr]    = useState('left');
  const [mobile, setMobile] = useState(window.innerWidth < 640);

  const cur = STEPS[step];

  // Track viewport changes
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Find target element
  useEffect(() => {
    // On mobile, never spotlight — always show centered card
    if (!cur.target || mobile) { setRect(null); return; }
    const run = () => {
      const el = document.querySelector(cur.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    run();
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [step, cur.target, mobile]);

  // Position tooltip beside the spotlight
  useEffect(() => {
    if (!rect) return;
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const side = cur.side ?? 'right';
    let top, left, arrow = side;

    if (side === 'right') {
      left  = rect.x + rect.w + GAP;
      top   = rect.y + rect.h / 2 - 80;
      if (left + CARD_W > vw - 12) { left = rect.x - CARD_W - GAP; arrow = 'right'; }
    } else if (side === 'bottom') {
      top   = rect.y + rect.h + GAP;
      left  = rect.x + rect.w / 2 - CARD_W / 2;
      arrow = 'top';
    } else if (side === 'top') {
      top   = rect.y - 190 - GAP;
      left  = rect.x + rect.w / 2 - CARD_W / 2;
      arrow = 'bottom';
    }

    top  = Math.max(8, Math.min(top,  vh - 210));
    left = Math.max(8, Math.min(left, vw - CARD_W - 8));
    setTipPos({ top, left });
    setArr(arrow);
  }, [rect, cur.side]);

  const finish = () => { localStorage.setItem(TOUR_KEY, '1'); onComplete(); };
  const next   = () => step >= STEPS.length - 1 ? finish() : setStep(s => s + 1);
  const back   = () => setStep(s => Math.max(0, s - 1));
  const addPt  = () => { finish(); onAddFirstPatient?.(); };

  const isCentered = !cur.target || mobile;

  // Triangular speech-bubble arrow
  const SpeechArrow = () => {
    if (isCentered) return null;
    const s = 6;
    const b = { position: 'absolute', width: 0, height: 0 };
    const variants = {
      left:   { ...b, left: -s,   top: '50%', transform: 'translateY(-50%)',  borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderRight: `${s}px solid ${C.white}` },
      right:  { ...b, right: -s,  top: '50%', transform: 'translateY(-50%)',  borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderLeft:  `${s}px solid ${C.white}` },
      top:    { ...b, top: -s,    left: '40%', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderBottom: `${s}px solid ${C.white}` },
      bottom: { ...b, bottom: -s, left: '40%', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderTop:    `${s}px solid ${C.white}` },
    };
    return <div style={variants[arr]} />;
  };

  return (
    <>
      {/* ── Overlay ── */}
      {rect ? (
        <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9990, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="hv-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={rect.x - 6} y={rect.y - 6} width={rect.w + 12} height={rect.h + 12} rx="20" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(10,25,47,0.65)" mask="url(#hv-tour-mask)" />
        </svg>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.65)', zIndex: 9990, pointerEvents: 'none' }} />
      )}

      {/* ── Oval spotlight ring ── */}
      {rect && (
        <div style={{
          position: 'fixed',
          left: rect.x - 6, top: rect.y - 6,
          width: rect.w + 12, height: rect.h + 12,
          borderRadius: 20,
          border: `1.5px solid ${C.secondary}`,
          zIndex: 9991, pointerEvents: 'none',
          animation: 'hv-glow 2s ease-in-out infinite',
        }} />
      )}

      {/* ── Tooltip card ── */}
      <div
        className="fade-in"
        style={{
          position:     'fixed',
          zIndex:       9992,
          width:        isCentered ? Math.min(CARD_W, window.innerWidth - 32) : CARD_W,
          ...(isCentered
            ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
            : { top: tipPos.top, left: tipPos.left }
          ),
          background:   C.white,
          borderRadius: 18,
          padding:      '14px 16px 12px',
          boxShadow:    '0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          border:       `1.5px solid ${C.border}`,
        }}
      >
        <SpeechArrow />

        {/* Oval step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 11 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height:       6,
                borderRadius: 99,
                flex:         i === step ? 2.5 : 1,
                background:   i < step
                  ? C.secondary
                  : i === step
                    ? C.primary
                    : `${C.primary}18`,
                transition:   'all .3s ease',
              }}
            />
          ))}
        </div>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{
            fontSize: 14, lineHeight: 1,
            background: `${C.primary}12`, borderRadius: 99,
            padding: '4px 7px',
          }}>
            {cur.icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, lineHeight: 1.3 }}>
            {cur.title}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, margin: '0 0 12px', paddingLeft: 2 }}>
          {cur.desc}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={finish}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 10.5, cursor: 'pointer', fontFamily: 'Inter', padding: 0, letterSpacing: 0.2 }}
          >
            Skip
          </button>
          <div style={{ display: 'flex', gap: 5 }}>
            {step > 0 && (
              <button
                onClick={back}
                style={{
                  padding: '4px 10px', borderRadius: 99,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.muted, cursor: 'pointer', fontFamily: 'Inter', fontSize: 11,
                }}
              >
                ←
              </button>
            )}
            {cur.isLast ? (
              <button
                onClick={addPt}
                style={{
                  padding: '5px 13px', borderRadius: 99, border: 'none',
                  background: `linear-gradient(135deg, ${C.secondary}, ${C.primary})`,
                  color: C.white, cursor: 'pointer', fontFamily: 'Inter',
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
                }}
              >
                Add patient →
              </button>
            ) : (
              <button
                onClick={next}
                style={{
                  padding: '5px 13px', borderRadius: 99, border: 'none',
                  background: `linear-gradient(135deg, ${C.secondary}, ${C.primary})`,
                  color: C.white, cursor: 'pointer', fontFamily: 'Inter',
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
                }}
              >
                {step === 0 ? "Let's go →" : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hv-glow {
          0%,100% { box-shadow: 0 0 0 3px ${C.secondary}30; }
          50%      { box-shadow: 0 0 0 7px ${C.secondary}12; }
        }
      `}</style>
    </>
  );
}
