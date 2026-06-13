/**
 * Date / time formatting utilities.
 * All functions are pure and side-effect free.
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) as "12 Jun 2026".
 * Returns "—" for falsy values.
 */
export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
};

/**
 * Formats a full ISO datetime string as "12 Jun, 10:30 AM".
 */
export const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });
};

/**
 * Converts a 24-hour "HH:MM" time string to "10:30 AM" format.
 */
export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Returns true if an ISO date string represents today. */
export const isToday = (iso) =>
  iso === new Date().toISOString().slice(0, 10);

/** Returns true if an ISO date string represents tomorrow. */
export const isTomorrow = (iso) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return iso === d.toISOString().slice(0, 10);
};
