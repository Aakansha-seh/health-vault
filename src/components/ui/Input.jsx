import { useState, useEffect } from 'react';
import { C, radii, tnum } from '../../constants/theme';

/**
 * Input — text field or multiline textarea with consistent styling.
 * Supports native Speech-to-Text dictation.
 *
 * @param {string}  label
 * @param {string}  value
 * @param {Function}onChange
 * @param {string}  type        - Input type (default "text"). Ignored when multiline.
 * @param {string}  placeholder
 * @param {string}  error       - Error message shown below the field.
 * @param {boolean} required    - Appends a red asterisk to the label.
 * @param {React.ReactNode} rightEl - Element rendered inside the right edge (e.g. show/hide toggle).
 * @param {boolean} multiline   - Renders a <textarea> instead of <input>.
 * @param {number}  rows        - Row count for textarea (default 3).
 * @param {boolean} disabled
 * @param {boolean} numeric     - Use tabular figures (for vitals / IDs / labs).
 * @param {boolean} voice       - Enable microphone speech-to-text dictation scribe.
 */
export function Input({
  label,
  value,
  onChange,
  type       = 'text',
  placeholder,
  error,
  required   = false,
  rightEl,
  multiline  = false,
  rows       = 3,
  disabled   = false,
  numeric    = false,
  voice      = false,
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Check speech recognition compatibility
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const toggleListening = () => {
    if (!isSupported) return;

    if (isListening) {
      if (window.hvSpeechRecognizer) {
        try { window.hvSpeechRecognizer.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-IN';

      recognizer.onstart = () => {
        setIsListening(true);
      };

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const newValue = value ? `${value} ${transcript}` : transcript;
          onChange?.({ target: { value: newValue } });
        }
      };

      recognizer.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      window.hvSpeechRecognizer = recognizer;
      recognizer.start();
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isListening && window.hvSpeechRecognizer) {
        try { window.hvSpeechRecognizer.stop(); } catch (_) {}
      }
    };
  }, [isListening]);

  const borderColor = error
    ? C.error
    : focused
      ? C.secondary
      : hovered
        ? C.gray[400]
        : C.border;

  const showMic = voice && isSupported && !disabled;

  const fieldStyle = {
    width:        '100%',
    padding:      (rightEl || showMic) ? '9px 44px 9px 12px' : '9px 12px',
    borderRadius: radii.md,
    border:       `1px solid ${borderColor}`,
    background:   disabled ? C.gray[50] : C.white,
    fontSize:     14,
    color:        C.ink,
    fontFamily:   'Inter',
    resize:       multiline ? 'vertical' : 'none',
    transition:   'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline:      'none',
    boxShadow:    focused && !error ? `0 0 0 3px ${C.secondary}22` : 'none',
    ...(numeric ? tnum : null),
  };

  const micButton = showMic && (
    <button
      type="button"
      onClick={toggleListening}
      className={`hv-mic-button ${isListening ? 'hv-mic-active' : ''}`}
      title={isListening ? 'Listening... click to stop' : 'Dictate notes (Voice-to-Text)'}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        color: isListening ? 'var(--hv-critical)' : 'var(--hv-muted)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
          {label}
          {required && <span style={{ color: C.error }}> *</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            rows={rows}
            style={fieldStyle}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={disabled}
          />
        ) : (
          <input
            type={type}
            style={fieldStyle}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={disabled}
          />
        )}

        {(rightEl || micButton) && (
          <div
            style={{
              position:  'absolute',
              right:     10,
              top:       multiline ? 10 : '50%',
              transform: multiline ? 'none' : 'translateY(-50%)',
              display:   'flex',
              alignItems:'center',
              gap:       6,
              zIndex:    5,
            }}
          >
            {micButton}
            {rightEl}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 12, color: C.error }}>{error}</span>
      )}
    </div>
  );
}
