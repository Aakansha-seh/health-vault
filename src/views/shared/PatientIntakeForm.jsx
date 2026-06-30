import { useState } from 'react';
import { C } from '../../constants/theme';
import { ReportUploader } from '../../components/ui/ReportUploader';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Input, Button, Select } from '../../components/ui';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function SectionTitle({ children }) {
  return (
    <p style={{ gridColumn: '1/-1', fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.6, margin: '8px 0 6px' }}>
      {children}
    </p>
  );
}

const STEPS = ['Demographics', 'Consultation', 'Schedule & Reports'];

export function PatientIntakeForm({ doctorProfiles = [], onSave, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', phone: '', gender: '', age: '', weight: '', bloodGroup: '', allergies: '', address: '',
    doctorProfileId: doctorProfiles[0]?.id ?? '',
    symptoms: '', diagnosis: '', prescription: '', testsPrescribed: '', notes: '',
    appointmentDate: '', appointmentTime: '', appointmentReason: 'Follow-up',
  });
  const [reports, setReports] = useState([]);   // [{ name, url, type, reportType }]
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleNext = () => {
    setError('');
    if (step === 0) {
      if (!form.name.trim()) { setError('Patient name is required'); return; }
    } else if (step === 1) {
      if (!form.doctorProfileId) { setError('Select an assigned doctor'); return; }
      if (!form.symptoms.trim()) { setError('Chief complaint/symptoms are required'); return; }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  // In this multi-step wizard, pressing Enter inside a field must NOT submit or
  // advance — only the explicit Next / Register buttons should. Textareas keep
  // Enter for newlines. This prevents the form from registering the patient
  // before the user has finished (e.g. on the upload step).
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  // Registration happens ONLY when the user explicitly clicks "Register Patient"
  // on the final step — never via an implicit form submit. (The form has no
  // submit button and swallows Enter, so it can't auto-save.)
  const handleRegister = async () => {
    if (form.appointmentDate && !form.appointmentTime) { setError('Pick a time for the next appointment'); return; }
    if (form.appointmentTime && !form.appointmentDate) { setError('Pick a date for the next appointment'); return; }

    setLoading(true); setError('');
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      age: form.age ? Number(form.age) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      bloodGroup: form.bloodGroup || undefined,
      allergies: form.allergies.trim() || undefined,
      address: form.address.trim() || undefined,
      doctorProfileId: form.doctorProfileId,
      symptoms: form.symptoms.trim(),
      diagnosis: form.diagnosis.trim() || undefined,
      prescription: form.prescription.trim() || undefined,
      testsPrescribed: form.testsPrescribed.trim() || undefined,
      notes: form.notes.trim() || undefined,
      testReports: reports.length ? reports : undefined,
      appointmentDate: form.appointmentDate || undefined,
      appointmentTime: form.appointmentTime || undefined,
      appointmentReason: form.appointmentReason.trim() || undefined,
    };
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save intake');
      setLoading(false);
    }
  };

  const noDoctors = doctorProfiles.length === 0;

  return (
    <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown} className="hv-fade-up">
      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ 
              height: 4, 
              borderRadius: 2, 
              background: i <= step ? C.primary : C.border, 
              transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            }} />
            <span style={{ 
              fontSize: 10, 
              fontWeight: 600, 
              color: i <= step ? C.primary : C.muted,
              textAlign: 'center',
              transition: 'color 0.3s ease'
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div style={{ minHeight: '340px' }}>
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }} className="hv-fade-up">
            <SectionTitle>Patient Information</SectionTitle>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Patient full name" required />
            </div>
            <Input label="Phone Number" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            <Input label="Age" type="number" value={form.age} onChange={set('age')} placeholder="e.g. 34" numeric />
            
            <Select 
              label="Gender" 
              value={form.gender} 
              onChange={set('gender')}
              options={[
                { value: '', label: 'Select' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
            />
            
            <Select 
              label="Blood Group" 
              value={form.bloodGroup} 
              onChange={set('bloodGroup')}
              options={[
                { value: '', label: 'Unknown' },
                ...BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))
              ]}
            />

            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Known Allergies" value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, dust… (leave blank if none)" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }} className="hv-fade-up">
            <SectionTitle>Consultation Details</SectionTitle>
            <div style={{ gridColumn: '1/-1' }}>
              <SearchableSelect
                label="Assign Doctor *"
                required
                value={form.doctorProfileId}
                onChange={set('doctorProfileId')}
                placeholder={noDoctors ? 'No doctor profiles available' : 'Select doctor…'}
                options={doctorProfiles.map(p => ({ value: p.id, label: `${p.name} — ${p.specialty ?? 'General'}` }))}
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Symptoms / Chief Complaint *" multiline rows={3} value={form.symptoms} onChange={set('symptoms')} placeholder="Fever, cough for 3 days…" required />
            </div>
            <Input label="Weight (kg)" type="number" value={form.weight} onChange={set('weight')} placeholder="e.g. 72.5" numeric />
            <Input label="Diagnosis" value={form.diagnosis} onChange={set('diagnosis')} placeholder="Provisional diagnosis" />
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Tests Prescribed" value={form.testsPrescribed} onChange={set('testsPrescribed')} placeholder="CBC, X-ray chest…" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Prescription" multiline rows={3} value={form.prescription} onChange={set('prescription')} placeholder="Medication, dosage, duration…" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} placeholder="Any extra observations…" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }} className="hv-fade-up">
            <SectionTitle>Reports & Attachments</SectionTitle>
            <div style={{ gridColumn: '1/-1', marginBottom: 8 }}>
              <ReportUploader reports={reports} setReports={setReports} />
            </div>

            <SectionTitle>Next Appointment (optional)</SectionTitle>
            <Input label="Date" type="date" value={form.appointmentDate} onChange={set('appointmentDate')} />
            <Input label="Time" type="time" value={form.appointmentTime} onChange={set('appointmentTime')} />
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Reason" value={form.appointmentReason} onChange={set('appointmentReason')} placeholder="Follow-up, report review…" />
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ color: C.error, fontSize: 13, marginTop: 16, fontWeight: 500 }}>{error}</p>}
      
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
        {step > 0 ? (
          <Button type="button" onClick={handleBack} variant="secondary">Back</Button>
        ) : (
          <Button type="button" onClick={onClose} variant="ghost">Cancel</Button>
        )}
        
        {step < 2 ? (
          <Button type="button" onClick={handleNext}>Next</Button>
        ) : (
          <Button type="button" onClick={handleRegister} disabled={loading}>
            {loading ? 'Saving…' : 'Register Patient'}
          </Button>
        )}
      </div>
    </form>
  );
}
