import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, Input, Select, SectionHeading } from '../../components/ui';
import { uid } from '../../utils/helpers';

/**
 * AppointmentForm — schedule a new appointment.
 *
 * @param {object[]} patients - Clinic-filtered patients for the dropdown.
 * @param {string}   doctorId - Embedded into the created appointment.
 * @param {string}   clinicId - Embedded into the created appointment.
 * @param {Function} onSave   - Called with the new appointment object.
 * @param {Function} onCancel
 */
export function AppointmentForm({ patients, doctorId, clinicId, onSave, onCancel }) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? '',
    date:      new Date().toISOString().split('T')[0],
    time:      '10:00',
    reason:    '',
    notes:     '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.patientId) errs.patientId = 'Please select a patient.';
    if (!form.date)      errs.date      = 'Date is required.';
    if (!form.time)      errs.time      = 'Time is required.';
    if (!form.reason.trim()) errs.reason = 'Reason is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id:        uid(),
      patientId: form.patientId,
      doctorId,
      clinicId,
      date:      form.date,
      time:      form.time,
      reason:    form.reason,
      notes:     form.notes,
      status:    'scheduled',
      createdAt: new Date().toISOString(),
    });
  };

  const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="fade-in">
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   20,
          flexWrap:       'wrap',
          gap:            10,
        }}
      >
        <SectionHeading>Schedule appointment</SectionHeading>
        <button
          onClick={onCancel}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            background: 'none',
            border:     'none',
            color:      C.secondary,
            fontSize:   14,
            cursor:     'pointer',
            fontFamily: 'Inter',
            padding:    0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={C.secondary}
            style={{ transform: 'rotate(180deg)' }}
          >
            <path d={ICONS.chevronRight} />
          </svg>
          Back to appointments
        </button>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Patient"
            value={form.patientId}
            onChange={set('patientId')}
            options={patientOptions}
            required
            error={errors.patientId}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={set('date')}
              required
              error={errors.date}
            />
            <Input
              label="Time"
              type="time"
              value={form.time}
              onChange={set('time')}
              required
              error={errors.time}
            />
          </div>

          <Input
            label="Reason for visit"
            value={form.reason}
            onChange={set('reason')}
            placeholder="e.g. Follow-up after hypertension diagnosis"
            required
            error={errors.reason}
          />

          <Input
            label="Notes (optional)"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Any pre-appointment instructions or context"
            multiline
            rows={3}
          />
        </div>

        <div
          style={{
            display:        'flex',
            justifyContent: 'flex-end',
            gap:            10,
            padding:        '14px 24px',
            borderTop:      `1px solid ${C.border}`,
          }}
        >
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Schedule</Button>
        </div>
      </Card>
    </div>
  );
}
