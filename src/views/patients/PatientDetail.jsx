import { useState } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Badge, Button, Card, SectionHeading } from '../../components/ui';
import { formatDate } from '../../utils/formatters';
import { printPrescription } from '../../utils/prescription';

/**
 * VisitCard — collapsible card for a single visit entry.
 */
function VisitCard({ visit, patient, doctor, clinic }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border:       `1px solid ${C.border}`,
        borderRadius: 8,
        overflow:     'hidden',
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display:     'flex',
          alignItems:  'center',
          padding:     '12px 16px',
          cursor:      'pointer',
          background:  expanded ? C.bg : C.white,
          transition:  'background .12s',
          gap:         12,
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>
            {formatDate(visit.date)}
          </span>
          <span
            style={{
              fontSize:     12,
              color:        C.muted,
              marginLeft:   12,
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {visit.chiefComplaint}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={C.muted}
          style={{
            transform:  expanded ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform .15s',
            flexShrink: 0,
          }}
        >
          <path d={ICONS.chevronRight} />
        </svg>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div
          style={{
            padding:    '0 16px 16px',
            borderTop:  `1px solid ${C.border}`,
            background: C.white,
          }}
        >
          <table
            style={{
              width:          '100%',
              borderCollapse: 'collapse',
              marginTop:      12,
              fontSize:       13,
            }}
          >
            <tbody>
              {[
                ['Chief complaint', visit.chiefComplaint],
                ['Examination',     visit.examination],
                ['Diagnosis',       visit.diagnosis],
                ['Notes',           visit.notes],
              ].map(([label, value]) =>
                value ? (
                  <tr key={label}>
                    <td
                      style={{
                        width:         120,
                        paddingBottom: 8,
                        color:         C.muted,
                        fontWeight:    500,
                        verticalAlign: 'top',
                        paddingRight:  16,
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ paddingBottom: 8, color: C.text, lineHeight: 1.5 }}>
                      {value}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>

          {/* Medications */}
          {visit.medications && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>
                ℞ Medications
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {visit.medications.split('\n').filter(Boolean).map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background:   C.bg,
                      border:       `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding:      '6px 12px',
                      fontSize:     13,
                      color:        C.text,
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Print button */}
          {visit.medications && (
            <div style={{ marginTop: 14 }}>
              <Button
                variant="secondary"
                small
                onClick={() => printPrescription(doctor, clinic, patient, visit)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>
                  <path d={ICONS.print} />
                </svg>
                Print prescription
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PatientDetail ────────────────────────────────────────────────────────────

/**
 * PatientDetail — full patient profile with visit history.
 *
 * @param {object}   patient  - The selected patient object.
 * @param {object}   doctor   - Currently logged-in doctor (for prescriptions).
 * @param {object}   clinic   - Doctor's clinic object (for prescriptions).
 * @param {Function} onBack   - Navigate back to patient list.
 * @param {Function} onEdit   - Open the patient edit form.
 * @param {Function} onAddVisit - Open the add-visit form.
 */
export function PatientDetail({ patient, doctor, clinic, onBack, onEdit, onAddVisit }) {
  const sortedVisits = [...patient.visits].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="fade-in">
      {/* ── Back + actions header ── */}
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
        <button
          onClick={onBack}
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
          All patients
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" small onClick={onEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>
              <path d={ICONS.edit} />
            </svg>
            Edit
          </Button>
          <Button variant="amber" small onClick={onAddVisit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}>
              <path d={ICONS.plus} />
            </svg>
            Add visit
          </Button>
        </div>
      </div>

      {/* ── Demographics card ── */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-start',
            gap:            20,
            padding:        '20px 20px 0',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width:          60,
              height:         60,
              borderRadius:   '50%',
              background:     `hsl(${patient.id.charCodeAt(1) * 47},35%,85%)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              fontSize:       22,
              fontWeight:     700,
              color:          C.primary,
            }}
          >
            {patient.name.charAt(0)}
          </div>

          {/* Name + badge */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: C.primary }}>{patient.name}</h2>
              <Badge
                label={patient.isReturning ? 'Returning' : 'New patient'}
                type={patient.isReturning ? 'returning' : 'new'}
              />
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {patient.age} years • {patient.gender} • {patient.bloodGroup}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap:                 '16px 24px',
            padding:             20,
            marginTop:           4,
          }}
        >
          {[
            ['Phone',      patient.phone],
            ['Allergies',  patient.allergies || '—'],
            ['Conditions', patient.chronicConditions || '—'],
            ['Insurance',  patient.insurance || '—'],
            ['Address',    patient.address || '—'],
            ['Emergency',  patient.emergencyContact || '—'],
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

      {/* ── Visit history ── */}
      <SectionHeading style={{ marginBottom: 12 }}>
        Visit history ({sortedVisits.length})
      </SectionHeading>

      {sortedVisits.length === 0 ? (
        <Card>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: C.muted }}>No visits recorded yet.</p>
            <Button variant="amber" small onClick={onAddVisit} style={{ marginTop: 12 }}>
              Record first visit
            </Button>
          </div>
        </Card>
      ) : (
        sortedVisits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            patient={patient}
            doctor={doctor}
            clinic={clinic}
          />
        ))
      )}
    </div>
  );
}
