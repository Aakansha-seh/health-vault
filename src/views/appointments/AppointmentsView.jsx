import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, SectionHeading } from '../../components/ui';
import { AppointmentRow }  from './AppointmentRow';
import { AppointmentForm } from './AppointmentForm';
import { isToday, isTomorrow } from '../../utils/formatters';

const FILTER_TABS = [
  { key: 'upcoming',  label: 'Upcoming'  },
  { key: 'today',     label: 'Today'     },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All'       },
];

/**
 * AppointmentsView — appointment list with scheduling.
 *
 * @param {object[]} appointments - All appointments from state (pre-filtered by clinic via App).
 * @param {object[]} patients     - Clinic patients (for name lookup + scheduling form).
 * @param {object}   doctor       - Active doctor.
 * @param {object}   clinic       - Active clinic.
 * @param {Function} onAdd        - dispatch → ADD_APPOINTMENT
 * @param {Function} onUpdate     - dispatch → UPDATE_APPOINTMENT (apptId, status)
 */
export function AppointmentsView({ appointments, patients, doctor, clinic, onAdd, onUpdate }) {
  const [showForm, setShowForm]   = useState(false);
  const [filterTab, setFilterTab] = useState('upcoming');

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p])),
    [patients]
  );

  const filtered = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)
    );
    switch (filterTab) {
      case 'today':
        return sorted.filter((a) => isToday(a.date) && a.status === 'scheduled');
      case 'upcoming':
        return sorted.filter((a) => {
          const dt = new Date(a.date + 'T' + a.time);
          return dt >= new Date() && a.status === 'scheduled';
        });
      case 'completed':
        return sorted.filter((a) => a.status === 'completed');
      case 'all':
      default:
        return sorted;
    }
  }, [appointments, filterTab]);

  const todayCount = appointments.filter((a) => {
    if (!isToday(a.date) || a.status !== 'scheduled') return false;
    return new Date(`${a.date}T${a.time}`) >= new Date();
  }).length;

  if (showForm) {
    return (
      <AppointmentForm
        patients={patients}
        doctorId={doctor.id}
        clinicId={clinic.id}
        onSave={(appt) => { onAdd(appt); setShowForm(false); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   16,
          flexWrap:       'wrap',
          gap:            12,
        }}
      >
        <div>
          <SectionHeading>Appointments</SectionHeading>
          {todayCount > 0 && (
            <p style={{ fontSize: 12, color: C.amber, marginTop: 4, fontWeight: 500 }}>
              {todayCount} appointment{todayCount !== 1 ? 's' : ''} scheduled today
            </p>
          )}
        </div>
        <Button variant="amber" small onClick={() => setShowForm(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}>
            <path d={ICONS.plus} />
          </svg>
          Schedule
        </Button>
      </div>

      {/* ── Filter tabs ── */}
      <div
        style={{
          display:      'flex',
          gap:          4,
          marginBottom: 16,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {FILTER_TABS.map(({ key, label }) => {
          const active = filterTab === key;
          return (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              style={{
                padding:        '8px 14px',
                background:     'none',
                border:         'none',
                borderBottom:   active ? `2px solid ${C.secondary}` : '2px solid transparent',
                color:          active ? C.primary : C.muted,
                fontWeight:     active ? 600 : 400,
                fontSize:       13,
                cursor:         'pointer',
                fontFamily:     'Inter',
                marginBottom:   -1,
                transition:     'color .12s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: C.muted }}>
              {filterTab === 'today'
                ? "No appointments today."
                : filterTab === 'upcoming'
                  ? "No upcoming appointments."
                  : "No appointments found."}
            </p>
            <Button variant="amber" small onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
              Schedule one
            </Button>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="appt-header" style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Patient</span>
              <span className="appt-col-date">Date</span>
              <span className="appt-col-time">Time</span>
              <span>Status</span>
              <span className="appt-col-doctor">Actions</span>
            </div>

            {filtered.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                patient={patientMap[appt.patientId]}
                doctor={doctor}
                clinic={clinic}
                onUpdate={onUpdate}
              />
            ))}
          </>
        )}
      </Card>

      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
        {filtered.length} appointment{filtered.length !== 1 ? 's' : ''} shown
      </p>
    </div>
  );
}
