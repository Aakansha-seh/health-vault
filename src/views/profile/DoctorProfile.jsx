import { useState, useRef } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Button, Card, Input, Select, SectionHeading } from '../../components/ui';

const SPEC_OPTIONS = [
  'General Practitioner', 'Internal Medicine', 'Paediatrician',
  'Cardiologist', 'Dermatologist', 'Gynaecologist', 'Neurologist',
  'Orthopaedic Surgeon', 'Psychiatrist', 'ENT Specialist', 'Ophthalmologist',
].map((v) => ({ value: v, label: v }));

/**
 * DoctorProfile — view and edit the logged-in doctor's details.
 *
 * @param {object}   doctor  - Active doctor object.
 * @param {object}   clinic  - Doctor's clinic.
 * @param {Function} onSave  - Called with the updated doctor object.
 */
export function DoctorProfile({ doctor, clinic, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ ...doctor });
  const [saved,   setSaved]   = useState(false);
  const [avatar,  setAvatar]  = useState(null); // data URL for preview
  const fileRef = useRef();

  const hue = doctor.id.charCodeAt(1) * 30;

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
    setForm((f) => ({ ...f, avatarUrl: url }));
  };

  const handleSave = () => {
    onSave(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setForm({ ...doctor });
    setAvatar(null);
    setEditing(false);
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   20,
          flexWrap:       'wrap',
          gap:            12,
        }}
      >
        <SectionHeading>My profile</SectionHeading>
        {!editing && (
          <Button variant="ghost" small onClick={() => setEditing(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>
              <path d={ICONS.edit} />
            </svg>
            Edit profile
          </Button>
        )}
      </div>

      {/* ── Saved banner ── */}
      {saved && (
        <div
          style={{
            background:   '#E8F5E9',
            border:       '1px solid #A5D6A7',
            borderRadius: 8,
            padding:      '10px 16px',
            marginBottom: 14,
            fontSize:     13,
            color:        C.success,
            fontWeight:   500,
          }}
        >
          Profile updated successfully.
        </div>
      )}

      {/* ── Profile card ── */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display:    'flex',
            alignItems: 'flex-start',
            gap:        20,
            padding:    '24px 24px 20px',
          }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width:          80,
                height:         80,
                borderRadius:   '50%',
                background:     avatar
                  ? 'transparent'
                  : `hsl(${hue},40%,88%)`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       28,
                fontWeight:     700,
                color:          C.primary,
                overflow:       'hidden',
                border:         `2px solid ${C.border}`,
              }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : doctor.name.charAt(0)
              }
            </div>
            {editing && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position:       'absolute',
                    bottom:         0,
                    right:          0,
                    width:          24,
                    height:         24,
                    borderRadius:   '50%',
                    background:     C.secondary,
                    border:         '2px solid white',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    cursor:         'pointer',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={C.white}>
                    <path d={ICONS.upload} />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Name + clinic */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: C.primary }}>{doctor.name}</h2>
            <p style={{ fontSize: 14, color: C.secondary, marginTop: 2 }}>{doctor.specialisation}</p>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {clinic?.name} · Reg. {doctor.regNumber}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Read view ── */}
      {!editing ? (
        <Card>
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap:                 '16px 24px',
              padding:             24,
            }}
          >
            {[
              ['Full name',        doctor.name],
              ['Specialisation',   doctor.specialisation],
              ['Registration no.', doctor.regNumber],
              ['Phone',            doctor.phone],
              ['Email',            doctor.email ?? '—'],
              ['Clinic',           clinic?.name ?? '—'],
              ['Clinic address',   clinic?.address ?? '—'],
              ['Clinic phone',     clinic?.phone ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, color: C.text }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* ── Edit form ── */
        <Card>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row" style={{ display: 'grid', gap: 16 }}>
              <Input
                label="Full name"
                value={form.name}
                onChange={set('name')}
                required
              />
              <Input
                label="Registration number"
                value={form.regNumber}
                onChange={set('regNumber')}
              />
            </div>
            <div className="form-row" style={{ display: 'grid', gap: 16 }}>
              <Select
                label="Specialisation"
                value={form.specialisation}
                onChange={set('specialisation')}
                options={SPEC_OPTIONS}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={set('email')}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
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
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
