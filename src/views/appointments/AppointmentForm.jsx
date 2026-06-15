import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, Input, Select, SectionHeading, ConfirmLeaveModal } from '../../components/ui';
import { uid } from '../../utils/helpers';

export function AppointmentForm({ patients, doctorId, clinicId, onSave, onCancel }) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? '',
    date:      new Date().toISOString().split('T')[0],
    time:      '10:00',
    reason:    '',
    notes:     '',
  });
  const [errors,         setErrors]         = useState({});
  const [isDirty,        setIsDirty]        = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const set = (field) => (e) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleCancel = () => {
    if (isDirty) setShowLeaveModal(true);
    else onCancel();
  };

  const validate = () => {
    const errs = {};
    if (!form.patientId)     errs.patientId = 'Please select a patient.';
    if (!form.date)          errs.date      = 'Date is required.';
    if (!form.time)          errs.time      = 'Time is required.';
    if (!form.reason.trim()) errs.reason    = 'Reason is required.';

    // Past date/time check
    if (form.date && form.time) {
      const selected = new Date(`${form.date}T${form.time}`);
      if (selected < new Date()) {
        errs.date = 'Appointment date and time cannot be in the past.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ id: uid(), patientId: form.patientId, doctorId, clinicId, date: form.date, time: form.time, reason: form.reason, notes: form.notes, status: 'scheduled', createdAt: new Date().toISOString() });
  };

  const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));

  const isPast = form.date && form.time
    ? new Date(`${form.date}T${form.time}`) < new Date()
    : false;

  return (
    <div className="fade-in">
      <ConfirmLeaveModal
        open={showLeaveModal}
        onReturn={() => setShowLeaveModal(false)}
        onDiscard={onCancel}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <SectionHeading>Schedule appointment</SectionHeading>
        <button
          onClick={handleCancel}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.secondary, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.secondary} style={{ transform: 'rotate(180deg)' }}>
            <path d={ICONS.chevronRight} />
          </svg>
          Back to appointments
        </button>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Patient" value={form.patientId} onChange={set('patientId')} options={patientOptions} required error={errors.patientId} />

          <div className="form-row" style={{ display: 'grid', gap: 16 }}>
            <Input label="Date" type="date" value={form.date} onChange={set('date')} required error={errors.date} />
            <Input label="Time" type="time" value={form.time} onChange={set('time')} required error={errors.time} />
          </div>

          {isPast && !errors.date && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ fontSize: 13, color: '#C2410C', lineHeight: 1.5 }}>
                The selected date and time are in the past. Please choose a future slot.
              </p>
            </div>
          )}

          <Input label="Reason for visit" value={form.reason} onChange={set('reason')} placeholder="e.g. Follow-up after hypertension diagnosis" required error={errors.reason} />
          <Input label="Notes (optional)"  value={form.notes}  onChange={set('notes')}  placeholder="Any pre-appointment instructions or context" multiline rows={3} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${C.border}` }}>
          <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPast}>Schedule</Button>
        </div>
      </Card>
    </div>
  );
}
