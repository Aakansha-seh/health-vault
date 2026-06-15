import { useState, useMemo, useCallback } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Badge, Button, Card, SectionHeading } from '../../components/ui';
import { formatDate } from '../../utils/formatters';

/* ─── Avatar helpers ─────────────────────────────────────────────────────── */
const AVATAR_PALETTE = [
  { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#FAECE7', color: '#712B13' },
  { bg: '#FBEAF0', color: '#72243E' },
  { bg: '#EAF3DE', color: '#27500A' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#F1EFE8', color: '#5F5E5A' },
];

function avatarColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/* ─── Sort icon ──────────────────────────────────────────────────────────── */
function SortArrow({ active, dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft: 4, verticalAlign: 'middle', opacity: active ? 1 : 0.3 }}>
      {dir === 'asc' && active
        ? <polygon points="5,2 9,8 1,8" fill={C.secondary} />
        : <polygon points="5,8 9,2 1,2" fill={active ? C.secondary : C.muted} />
      }
    </svg>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent ?? C.primary, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Download icon (inline — not in ICONS map) ─────────────────────────── */
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ─── PatientList ────────────────────────────────────────────────────────── */
/**
 * @param {object[]} patients    - Clinic-filtered patient array.
 * @param {Function} onSelect    - Called with patient on row click / "View".
 * @param {Function} onAddNew    - Called when "Add patient" is clicked.
 * @param {Function} onAddVisit  - Called with patient when "+ Visit" is clicked.
 */
export function PatientList({ patients, onSelect, onAddNew, onAddVisit }) {
  const [search,       setSearch]       = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterType,   setFilterType]   = useState('All');
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [sortKey,      setSortKey]      = useState('name');
  const [sortDir,      setSortDir]      = useState('asc');

  /* Stats */
  const totalPatients = patients.length;
  const newCount      = patients.filter((p) => !p.isReturning).length;
  const retCount      = patients.filter((p) =>  p.isReturning).length;

  /* Sort toggler */
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  /* Filtered + sorted list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = patients.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.phone ?? '').includes(q)) return false;
      if (filterGender !== 'All' && p.gender !== filterGender) return false;
      if (filterType === 'New'       && p.isReturning)  return false;
      if (filterType === 'Returning' && !p.isReturning) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
      } else if (sortKey === 'age') {
        va = Number(a.age) || 0; vb = Number(b.age) || 0;
      } else if (sortKey === 'lastVisit') {
        const la = [...(a.visits ?? [])].sort((x, y) => new Date(y.date) - new Date(x.date))[0];
        const lb = [...(b.visits ?? [])].sort((x, y) => new Date(y.date) - new Date(x.date))[0];
        va = la ? new Date(la.date).getTime() : 0;
        vb = lb ? new Date(lb.date).getTime() : 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [patients, search, filterGender, filterType, sortKey, sortDir]);

  /* Export CSV */
  const exportCSV = useCallback(() => {
    const headers = ['Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Last Visit', 'Total Visits', 'Status'];
    const rows = filtered.map((p) => {
      const sorted = [...(p.visits ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date));
      return [
        p.name, p.age, p.gender, p.phone ?? '',
        p.bloodGroup ?? '',
        sorted[0] ? formatDate(sorted[0].date) : '',
        p.visits.length,
        p.isReturning ? 'Returning' : 'New',
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'patients.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  /* ── Styles ── */
  const chip = (active) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '6px 14px', borderRadius: 20,
    border:  `1px solid ${active ? C.secondary : C.border}`,
    background: active ? `${C.secondary}18` : C.white,
    color:   active ? C.secondary : C.muted,
    fontSize: 13, fontFamily: 'Inter', cursor: 'pointer',
    fontWeight: active ? 600 : 400, transition: 'all .12s', outline: 'none',
  });

  const sortBtn = (label, key) => (
    <button
      onClick={() => toggleSort(key)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter',
        fontSize: 12, fontWeight: 600, color: sortKey === key ? C.primary : C.muted,
        textTransform: 'uppercase', letterSpacing: 0.4, padding: 0,
        display: 'flex', alignItems: 'center',
      }}
    >
      {label}
      <SortArrow active={sortKey === key} dir={sortDir} />
    </button>
  );

  const qBtn = (label, onClick, accent = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: '4px 11px', fontSize: 12, borderRadius: 7,
        border: `1px solid ${accent ? C.secondary : C.border}`,
        background: accent ? `${C.secondary}12` : C.white,
        color: accent ? C.secondary : C.muted,
        fontFamily: 'Inter', fontWeight: accent ? 600 : 400,
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="fade-in">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <SectionHeading>Patient records</SectionHeading>
        <Button variant="amber" small onClick={onAddNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}><path d={ICONS.plus} /></svg>
          Add patient
        </Button>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <StatCard label="Total patients" value={totalPatients} accent={C.primary}   />
        <StatCard label="New patients"   value={newCount}      accent={C.success}   />
        <StatCard label="Returning"      value={retCount}      accent={C.amber}     />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path d={ICONS.search} />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              borderRadius: 20, border: `1px solid ${C.border}`,
              background: C.white, fontSize: 13,
              fontFamily: 'Inter', color: C.text, outline: 'none',
            }}
          />
        </div>

        {/* Gender chips */}
        {['All', 'Male', 'Female'].map((g) => (
          <button key={g} style={chip(filterGender === g)} onClick={() => setFilterGender(g)}>
            {g === 'All' ? 'All genders' : g}
          </button>
        ))}

        {/* Type chips */}
        <button style={chip(filterType === 'New')}       onClick={() => setFilterType(filterType === 'New'       ? 'All' : 'New')}>New</button>
        <button style={chip(filterType === 'Returning')} onClick={() => setFilterType(filterType === 'Returning' ? 'All' : 'Returning')}>Returning</button>

        {/* Export */}
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            border: `1px solid ${C.border}`, background: C.white,
            color: C.muted, fontSize: 13, fontFamily: 'Inter', cursor: 'pointer',
          }}
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      {/* ── Table ── */}
      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill={C.border} style={{ marginBottom: 12 }}>
              <path d={ICONS.patients} />
            </svg>
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
              className="pt-header"
              style={{
                display: 'grid', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                borderBottom: `1px solid ${C.border}`,
                background: `${C.bg}cc`,
              }}
            >
              <span />
              {sortBtn('Name', 'name')}
              <span className="pt-col-age">{sortBtn('Age', 'age')}</span>
              <span className="pt-col-gender" style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Gender</span>
              <span className="pt-col-last">{sortBtn('Last visit', 'lastVisit')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Status</span>
              <span className="pt-col-actions" />
            </div>

            {/* Rows */}
            {filtered.map((patient) => {
              const sortedVisits = [...(patient.visits ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date));
              const lastVisit    = sortedVisits[0];
              const ac           = avatarColor(patient.id);
              const hovered      = hoveredRow === patient.id;

              return (
                <div
                  key={patient.id}
                  className="pt-row"
                  onClick={() => onSelect(patient)}
                  onMouseEnter={() => setHoveredRow(patient.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    display: 'grid', alignItems: 'center', gap: 8,
                    padding: '11px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    background: hovered ? C.bg : 'transparent',
                    transition: 'background .12s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: ac.bg, color: ac.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0,
                    userSelect: 'none',
                  }}>
                    {initials(patient.name)}
                  </div>

                  {/* Name + visit count */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: C.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {patient.name}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {patient.visits.length} visit{patient.visits.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <span className="pt-col-age"    style={{ fontSize: 14, color: C.text }}>{patient.age}</span>
                  <span className="pt-col-gender" style={{ fontSize: 14, color: C.text }}>{patient.gender}</span>
                  <span className="pt-col-last"   style={{ fontSize: 13, color: C.muted }}>{formatDate(lastVisit?.date) || '—'}</span>

                  <Badge label={patient.isReturning ? 'Returning' : 'New'} type={patient.isReturning ? 'returning' : 'new'} />

                  {/* Quick actions — fade in on hover */}
                  <div
                    className="pt-col-actions"
                    style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {qBtn('+ Visit', () => onAddVisit?.(patient), true)}
                    {qBtn('View',    () => onSelect(patient))}
                  </div>
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
