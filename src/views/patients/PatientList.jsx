import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Badge, Button, Card, SectionHeading } from '../../components/ui';
import { formatDate } from '../../utils/formatters';

/**
 * PatientList — searchable, filterable table of all patients in the clinic.
 *
 * @param {object[]} patients   - Clinic-filtered patient array.
 * @param {Function} onSelect   - Called with the patient object on row click.
 * @param {Function} onAddNew   - Called when "Add patient" is clicked.
 */
export function PatientList({ patients, onSelect, onAddNew }) {
  const [search,       setSearch]       = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterType,   setFilterType]   = useState('All');
  const [hoveredRow,   setHoveredRow]   = useState(null);

  const filtered = useMemo(() =>
    patients.filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterGender !== 'All' && p.gender !== filterGender) return false;
      if (filterType === 'New'       && p.isReturning)  return false;
      if (filterType === 'Returning' && !p.isReturning) return false;
      return true;
    }),
    [patients, search, filterGender, filterType]
  );

  const selectStyle = {
    fontSize:       13,
    padding:        '7px 10px',
    borderRadius:   6,
    border:         `1px solid ${C.border}`,
    background:     C.white,
    fontFamily:     'Inter',
    color:          C.text,
    cursor:         'pointer',
    appearance:     'none',
    outline:        'none',
  };

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div
        style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          marginBottom:  20,
          flexWrap:      'wrap',
          gap:           12,
        }}
      >
        <SectionHeading>Patient records</SectionHeading>
        <Button variant="amber" small onClick={onAddNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d={ICONS.plus} />
          </svg>
          Add patient
        </Button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>
              <path d={ICONS.search} />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients…"
            style={{
              width:        '100%',
              padding:      '9px 12px 9px 34px',
              borderRadius: 6,
              border:       `1px solid ${C.border}`,
              background:   C.white,
              fontSize:     14,
              fontFamily:   'Inter',
              color:        C.text,
              outline:      'none',
            }}
          />
        </div>

        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={selectStyle}>
          {['All', 'Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
        </select>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
          {['All', 'New', 'Returning'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: C.muted }}>
              {patients.length === 0
                ? 'No patients yet. Add your first patient to get started.'
                : 'No patients match your search. Try adjusting the filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div
              style={{
                display:       'grid',
                gridTemplateColumns: '1fr 60px 80px 120px 100px',
                padding:       '10px 16px',
                borderBottom:  `1px solid ${C.border}`,
                fontSize:      12,
                fontWeight:    600,
                color:         C.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              <span>Name</span>
              <span>Age</span>
              <span>Gender</span>
              <span>Last visit</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            {filtered.map((patient) => {
              const lastVisit = patient.visits[patient.visits.length - 1];
              return (
                <div
                  key={patient.id}
                  onClick={() => onSelect(patient)}
                  onMouseEnter={() => setHoveredRow(patient.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    display:       'grid',
                    gridTemplateColumns: '1fr 60px 80px 120px 100px',
                    padding:       '12px 16px',
                    borderBottom:  `1px solid ${C.border}`,
                    cursor:        'pointer',
                    background:    hoveredRow === patient.id ? C.bg : 'transparent',
                    transition:    'background .12s',
                    alignItems:    'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.primary }}>{patient.name}</span>
                  <span style={{ fontSize: 14, color: C.text }}>{patient.age}</span>
                  <span style={{ fontSize: 14, color: C.text }}>{patient.gender}</span>
                  <span style={{ fontSize: 13, color: C.muted }}>{formatDate(lastVisit?.date)}</span>
                  <Badge
                    label={patient.isReturning ? 'Returning' : 'New'}
                    type={patient.isReturning  ? 'returning' : 'new'}
                  />
                </div>
              );
            })}
          </>
        )}
      </Card>

      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
        Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
