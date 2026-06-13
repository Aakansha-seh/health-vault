import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, Input, SectionHeading } from '../../components/ui';
import { uid } from '../../utils/helpers';

/**
 * VisitForm — Record a new clinical visit for a patient.
 *
 * @param {object}   patient  - The patient receiving the visit.
 * @param {Function} onSave   - Called with the new visit object on submit.
 * @param {Function} onCancel - Close without saving.
 */
export function VisitForm({ patient, onSave, onCancel }) {
  const [form, setForm] = useState({
    date:            new Date().toISOString().split('T')[0],
    chiefComplaint:  '',
    examination:     '',
    diagnosis:       '',
    medications:     '',
    notes:           '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.chiefComplaint.trim()) errs.chiefComplaint = 'Chief complaint is required.';
    if (!form.diagnosis.trim())      errs.diagnosis      = 'Diagnosis is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: uid() });
  };

  return (
    <div className="fade-in">
      {/* ── Header ── */}
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
        <SectionHeading>New visit — {patient.name}</SectionHeading>
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
          Back to patient
        </button>
      </div>

      <Card style={{ maxWidth: 720 }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Input
            label="Visit date"
            type="date"
            value={form.date}
            onChange={set('date')}
            required
          />

          <Input
            label="Chief complaint"
            value={form.chiefComplaint}
            onChange={set('chiefComplaint')}
            placeholder="e.g. Persistent cough for 5 days"
            required
            error={errors.chiefComplaint}
          />

          <Input
            label="Examination findings"
            value={form.examination}
            onChange={set('examination')}
            placeholder="e.g. BP 120/80, chest clear, no crepitations"
            multiline
            rows={3}
          />

          <Input
            label="Diagnosis"
            value={form.diagnosis}
            onChange={set('diagnosis')}
            placeholder="e.g. Acute upper respiratory tract infection"
            required
            error={errors.diagnosis}
          />

          <div>
            <Input
              label="Medications"
              value={form.medications}
              onChange={set('medications')}
              placeholder={"One per line, format: Drug — dose\ne.g. Amoxicillin 500mg — 1 tab TDS × 5 days"}
              multiline
              rows={4}
            />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Each line becomes a separate prescription entry. Printed via the prescription button.
            </p>
          </div>

          <Input
            label="Additional notes"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Follow-up instructions, referrals, lifestyle advice…"
            multiline
            rows={3}
          />
        </div>

        {/* ── Footer ── */}
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
          <Button onClick={handleSave}>Save visit</Button>
        </div>
      </Card>
    </div>
  );
}
