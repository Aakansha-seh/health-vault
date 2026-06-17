import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Badge, Button } from '../../components/ui';
import { formatDate, formatTime, isToday, isTomorrow } from '../../utils/formatters';
import { buildGoogleCalendarUrl } from '../../utils/gcal';

const STATUS_LABELS = {
  scheduled:  { label: 'Scheduled',  type: 'scheduled'  },
  completed:  { label: 'Completed',  type: 'completed'  },
  cancelled:  { label: 'Cancelled',  type: 'cancelled'  },
};

function RelativeDate({ date }) {
  if (isToday(date))    return <span style={{ color: C.amber, fontWeight: 600 }}>Today</span>;
  if (isTomorrow(date)) return <span style={{ color: C.secondary, fontWeight: 600 }}>Tomorrow</span>;
  return <span>{formatDate(date)}</span>;
}

/**
 * AppointmentRow — single row in the appointments table.
 *
 * @param {object}   appt      - Appointment object from state.
 * @param {object}   patient   - Resolved patient for this appointment.
 * @param {object}   doctor    - Resolved doctor.
 * @param {object}   clinic    - Resolved clinic.
 * @param {Function} onUpdate  - Called with (apptId, newStatus).
 */
export function AppointmentRow({ appt, patient, doctor, clinic, onUpdate }) {
  const [hovered, setHovered] = useState(false);

  const statusInfo = STATUS_LABELS[appt.status] ?? STATUS_LABELS.scheduled;

  const handleGCal = () => {
    const url = buildGoogleCalendarUrl(appt, patient, doctor, clinic);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="appt-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'grid', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: hovered ? C.bg : 'transparent', transition: 'background .12s', alignItems: 'center', gap: 8 }}
    >
      {/* Patient name + reason */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {patient?.name ?? 'Unknown'}
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.reason}
        </p>
        {/* Mobile: show date inline */}
        <p className="appt-meta" style={{ display: 'none', fontSize: 11, color: C.secondary, marginTop: 2 }}>
          <RelativeDate date={appt.date} /> · {formatTime(appt.time)}
        </p>
      </div>

      <div className="appt-col-date" style={{ fontSize: 13, color: C.text }}><RelativeDate date={appt.date} /></div>
      <span className="appt-col-time"   style={{ fontSize: 13, color: C.text }}>{formatTime(appt.time)}</span>
      <Badge label={statusInfo.label} type={statusInfo.type} />

      {appt.status === 'scheduled' ? (
        <div className="appt-col-doctor" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button variant="gcal"      small onClick={handleGCal}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={C.white}><path d={ICONS.calendar} /></svg>
            GCal
          </Button>
          <Button variant="secondary" small onClick={() => onUpdate(appt.id, { status: 'completed' })}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={C.primary}><path d={ICONS.check} /></svg>
            Done
          </Button>
          <Button variant="danger"    small onClick={() => onUpdate(appt.id, { status: 'cancelled' })}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={C.white}><path d={ICONS.cancel} /></svg>
            Cancel
          </Button>
        </div>
      ) : (
        <span className="appt-col-doctor" style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
          {appt.status === 'completed' ? 'Completed' : 'Cancelled'}
        </span>
      )}
    </div>
  );
}
