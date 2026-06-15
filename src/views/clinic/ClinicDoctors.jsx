import { useState } from 'react';
import { C } from '../../constants/theme';
import { Card, SectionHeading, Badge } from '../../components/ui';

function DoctorRow({ doctor, patients, appointments }) {
  const [expanded, setExpanded] = useState(false);

  const myPatients     = patients.filter((p) => p.visits?.some((v) => v.doctorId === doctor.id));
  const myVisits       = patients.reduce((s, p) => s + (p.visits?.filter((v) => v.doctorId === doctor.id).length ?? 0), 0);
  const myAppts        = appointments.filter((a) => a.doctorId === doctor.id);
  const scheduled      = myAppts.filter((a) => a.status === 'scheduled').length;
  const hue            = doctor.id.charCodeAt(1) * 30;

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', cursor: 'pointer',
          background: expanded ? C.bg : C.white, transition: 'background .12s',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `hsl(${hue},40%,88%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: C.primary, flexShrink: 0,
        }}>
          {doctor.name.charAt(0)}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{doctor.name}</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{doctor.specialisation}</p>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 20, marginRight: 12 }}>
          {[['Patients', myPatients.length], ['Visits', myVisits], ['Pending', scheduled]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{v}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{l}</p>
            </div>
          ))}
        </div>

        <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" stroke={C.muted} strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${C.border}`, background: C.white }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px', marginTop: 14 }}>
            {[
              ['Registration no.', doctor.regNumber  || '—'],
              ['Phone',            doctor.contact     || '—'],
              ['Email',            doctor.email       || '—'],
              ['Clinic hours',     doctor.clinicHours || '—'],
              ['Years in practice',doctor.yearsPractice != null ? `${doctor.yearsPractice} yrs` : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 13, color: C.text }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Recent patients */}
          {myPatients.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Recent patients</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {myPatients.slice(0, 6).map((p) => (
                  <div key={p.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 13, color: C.text }}>
                    {p.name}
                  </div>
                ))}
                {myPatients.length > 6 && (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 13, color: C.muted }}>
                    +{myPatients.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ClinicDoctors — all doctors in the clinic with expandable stats.
 */
export function ClinicDoctors({ doctors, patients, appointments }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <SectionHeading>Doctors ({doctors.length})</SectionHeading>
      </div>

      {doctors.length === 0 ? (
        <Card>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: C.muted, fontSize: 15 }}>No doctors registered in this clinic yet.</p>
          </div>
        </Card>
      ) : (
        doctors.map((d) => (
          <DoctorRow key={d.id} doctor={d} patients={patients} appointments={appointments} />
        ))
      )}
    </div>
  );
}
