import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Badge, Card, SectionHeading } from '../../components/ui';
import { formatDate } from '../../utils/formatters';

/**
 * ClinicPatients — read-only view of all patients across every doctor.
 * Clinic admin can see but cannot edit clinical records.
 */
export function ClinicPatients({ patients, doctors }) {
  const [search,   setSearch]   = useState('');
  const [filterDoc, setFilterDoc] = useState('All');
  const [hoveredRow, setHoveredRow] = useState(null);

  const doctorMap = useMemo(() => Object.fromEntries(doctors.map((d) => [d.id, d])), [doctors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterDoc !== 'All') {
        const hasDoc = p.visits?.some((v) => v.doctorId === filterDoc);
        if (!hasDoc) return false;
      }
      return true;
    });
  }, [patients, search, filterDoc]);

  const doctorOptions = [{ value: 'All', label: 'All doctors' }, ...doctors.map((d) => ({ value: d.id, label: d.name }))];

  const selectStyle = {
    fontSize: 13, padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.white,
    fontFamily: 'Inter', color: C.text, cursor: 'pointer', outline: 'none',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <SectionHeading>All patients</SectionHeading>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Read-only — edit from within a doctor's session</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.muted}><path d={ICONS.search} /></svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients…"
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 13, fontFamily: 'Inter', color: C.text, outline: 'none' }}
          />
        </div>
        <select value={filterDoc} onChange={(e) => setFilterDoc(e.target.value)} style={selectStyle}>
          {doctorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: C.muted, fontSize: 15 }}>No patients match your search.</p>
          </div>
        ) : (
          <>
            <div className="cp-header" style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Name</span>
              <span className="cp-col-age">Age</span>
              <span className="cp-col-gender">Gender</span>
              <span className="cp-col-last">Last visit</span>
              <span className="cp-col-doctor">Doctor</span>
              <span>Status</span>
            </div>
            {filtered.map((patient) => {
              const lastVisit = [...(patient.visits ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
              const primaryDoc = lastVisit ? doctorMap[lastVisit.doctorId] : null;
              return (
                <div
                  key={patient.id}
                  className="cp-row"
                  onMouseEnter={() => setHoveredRow(patient.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ display: 'grid', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: hoveredRow === patient.id ? C.bg : 'transparent', transition: 'background .12s', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.name}</span>
                  <span className="cp-col-age"    style={{ fontSize: 13, color: C.text }}>{patient.age}</span>
                  <span className="cp-col-gender" style={{ fontSize: 13, color: C.text }}>{patient.gender}</span>
                  <span className="cp-col-last"   style={{ fontSize: 12, color: C.muted }}>{formatDate(lastVisit?.date)}</span>
                  <span className="cp-col-doctor" style={{ fontSize: 12, color: C.muted }}>{primaryDoc ? primaryDoc.name.replace('Dr. ', 'Dr ') : '—'}</span>
                  <Badge label={patient.isReturning ? 'Returning' : 'New'} type={patient.isReturning ? 'returning' : 'new'} />
                </div>
              );
            })}
          </>
        )}
      </Card>

      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
        {filtered.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
