/**
 * Google Calendar deep-link builder.
 *
 * Opens Google Calendar's "Create event" page with the appointment
 * pre-filled. No OAuth or API key required — works via URL parameters.
 *
 * The appointment is assumed to be 1 hour long.
 *
 * @param {object} appt    - Appointment record { date, time, reason, notes }
 * @param {object} patient - Patient record      { name }
 * @param {object} doctor  - Doctor record       { name }
 * @param {object} clinic  - Clinic record       { name, address }
 * @returns {string}        Google Calendar URL
 */
export function buildGoogleCalendarUrl(appt, patient, doctor, clinic) {
  const pad   = (n) => String(n).padStart(2, '0');
  const ds    = appt.date.replace(/-/g, '');
  const [h, m] = appt.time.split(':').map(Number);
  const endH  = (h + 1) % 24;

  const startDT = `${ds}T${pad(h)}${pad(m)}00`;
  const endDT   = `${ds}T${pad(endH)}${pad(m)}00`;

  const details = [
    `Doctor: ${doctor.name}`,
    `Clinic: ${clinic.name}`,
    `Reason: ${appt.reason}`,
    appt.notes ? `Notes: ${appt.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     `${patient.name} — ${appt.reason}`,
    dates:    `${startDT}/${endDT}`,
    details,
    location: `${clinic.name}, ${clinic.address}`,
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}
