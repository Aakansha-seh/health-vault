import { useState, useEffect } from 'react';
import { C } from '../constants/theme';

const EKG_PATH =
  'M -50,60 L 270,60 L 282,55 L 292,44 L 302,55 L 312,60 ' +
  'L 319,66 L 326,4 L 333,88 L 340,60 ' +
  'L 352,54 L 367,36 L 382,54 L 397,60 L 1100,60';

/**
 * SplashScreen — full-screen branded launch animation.
 *
 * Sequence:
 *   0 ms   → EKG line begins drawing (stroke-dashoffset animation, 1.9 s)
 *   1700 ms → Logo + wordmark fade up
 *   2900 ms → Screen begins fade-out
 *   3400 ms → onComplete() called → login screen renders
 *
 * @param {Function} onComplete - Called when the animation finishes.
 */
export function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1700);
    const t2 = setTimeout(() => setPhase(2), 2900);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     C.primary,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        opacity:        phase === 2 ? 0 : 1,
        transition:     phase === 2 ? 'opacity .55s ease' : 'none',
      }}
    >
      {/* ── EKG line ── */}
      <div
        style={{
          position:  'absolute',
          inset:     0,
          display:   'flex',
          alignItems: 'center',
          overflow:  'hidden',
        }}
      >
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 120 }}
        >
          <defs>
            <filter id="ekgGlow" x="-20%" y="-80%" width="140%" height="260%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dim trail */}
          <path d={EKG_PATH} stroke="rgba(90,138,114,0.18)" strokeWidth="1.5" fill="none" />

          {/* Animated line */}
          <path
            d={EKG_PATH}
            stroke={C.secondary}
            strokeWidth="2.5"
            fill="none"
            filter="url(#ekgGlow)"
            style={{
              strokeDasharray:  1500,
              strokeDashoffset: 1500,
              animation:        'drawEKG 1.9s cubic-bezier(.25,.46,.45,.94) forwards',
            }}
          />

          {/* Glowing dot riding the line tip */}
          <circle
            r="6"
            fill={C.secondary}
            filter="url(#dotGlow)"
            style={{
              opacity:    phase >= 1 ? 0 : 1,
              transition: 'opacity .4s ease',
            }}
          >
            <animateMotion dur="1.9s" fill="freeze" path={EKG_PATH} />
          </circle>
        </svg>
      </div>

      {/* ── Logo + wordmark ── */}
      <div
        style={{
          position:   'relative',
          zIndex:     1,
          textAlign:  'center',
          opacity:    phase >= 1 ? 1 : 0,
          transform:  phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity .65s ease, transform .65s ease',
        }}
      >
        <div
          style={{
            width:          68,
            height:         68,
            margin:         '0 auto 18px',
            background:     'rgba(255,255,255,0.06)',
            border:         '1px solid rgba(90,138,114,0.35)',
            borderRadius:   18,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.secondary} strokeWidth="1.5" fill="none" />
            <path d="M12 8v8M8 12h8" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          style={{
            fontSize:     34,
            fontWeight:   600,
            color:        C.white,
            letterSpacing: -1,
            marginBottom: 10,
            fontFamily:   'Inter',
          }}
        >
          HealthVault
        </h1>

        <p style={{ fontSize: 13, color: 'rgba(90,138,114,0.85)', letterSpacing: 0.6, fontFamily: 'Inter' }}>
          Secure patient records for clinicians
        </p>
      </div>
    </div>
  );
}
