import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, Input, Select, SectionHeading } from '../../components/ui';
import { uid } from '../../utils/helpers';

const GENDER_OPTIONS = [
  { value: 'Male',   label: 'Male'   },
  { value: 'Female', label: 'Female' },
  { value: 'Other',  label: 'Other'  },
];

const BLOOD_GROUP_OPTIONS = ['A+','A−','B+','B−','AB+','AB−','O+','O−'].map((v) => ({ value: v, label: v }));

/**
 * PatientForm — Add or edit a patient's demographic details.
 *
 * @param {object|null} patient    - Existing patient to edit, or null for new.
 * @param {string}      clinicId   - Active clinic ID, embedded into new patients.
 * @param {string}      doctorId   - Active doctor ID, embedded into new patients.
 * @param {Function}    onSave     - Called with the full patient object on save.
 * @param {Function}    onCancel   - Navigate back without saving.
 */
export function PatientForm({ patient, clinicId, doctorId, onSave, onCancel }) {
  const isNew = !patient;

  const [form, setForm] = useState({
    name:               patient?.name               ?? '',
    age:                patient?.age                ?? '',
    gender:             patient?.gender             ?? 'Male',
    bloodGroup:         patient?.bloodGroup         ?? 'O+',
    phone:              patient?.phone              ?? '',
    allergies:          patient?.allergies          ?? '',
    chronicConditions:  patient?.chronicConditions  ?? '',
    insurance:          patient?.insurance          ?? '',
    address:            patient?.address            ?? '',
    emergencyContact:   patient?.emergencyContact   ?? '',
  });

  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required.';
    if (!form.age || isNaN(form.age) || form.age < 0 || form.age > 130)
      errs.age = 'Enter a valid age (0–130).';
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const saved = isNew
      ? {
          ...form,
          id:           uid(),
          clinicId,
          doctorId,
          age:          Number(form.age),
          isReturning:  false,
          visits:       [],
          createdAt:    new Date().toISOString(),
        }
      : {
          ...patient,
          ...form,
          age: Number(form.age),
        };

    onSave(saved);
  };

  const fieldRows = [
    [
      { field: 'name',             label: 'Full name',         required: true   },
      { field: 'age',              label: 'Age',               required: true, type: 'number' },
    ],
    [
      { field: 'phone',            label: 'Phone number',      required: true   },
      { field: 'insurance',        label: 'Insurance / ABHA',  required: false  },
    ],
    [
      { field: 'allergies',        label: 'Known allergies',   required: false  },
      { field: 'chronicConditions',label: 'Chronic conditions',required: false  },
    ],
    [
      { field: 'emergencyContact', label: 'Emergency contact', required: false  },
      { field: 'address',          label: 'Address',           required: false  },
    ],
  ];

  return (
    <div className="fade-in">
      {/* ── Page header ── */}
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
        <SectionHeading>{isNew ? 'Add new patient' : `Edit — ${patient.name}`}</SectionHeading>
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
          {isNew ? 'Back to records' : 'Back to patient'}
        </button>
      </div>

      <Card style={{ maxWidth: 720 }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Field rows */}
          {fieldRows.map((row, ri) => (
            <div
              key={ri}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
              className="form-row"
            >
              {row.map(({ field, label, required, type }) => (
                <Input
                  key={field}
                  label={label}
                  value={form[field]}
                  onChange={set(field)}
                  type={type || 'text'}
                  required={required}
                  error={errors[field]}
                />
              ))}
            </div>
          ))}

          {/* Gender + Blood group */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select
              label="Gender"
              value={form.gender}
              onChange={set('gender')}
              options={GENDER_OPTIONS}
              required
            />
            <Select
              label="Blood group"
              value={form.bloodGroup}
              onChange={set('bloodGroup')}
              options={BLOOD_GROUP_OPTIONS}
            />
          </div>
        </div>

        {/* ── Footer actions ── */}
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
          <Button onClick={handleSave}>{isNew ? 'Add patient' : 'Save changes'}</Button>
        </div>
      </Card>
    </div>
  );
}
