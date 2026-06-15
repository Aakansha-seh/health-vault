import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { Card, SectionHeading } from '../../components/ui';

const ACTION_COLORS = {
  login:          { bg: '#EEF2FF', text: '#4338CA' },
  logout:         { bg: '#F5F3FF', text: '#6D28D9' },
  add_patient:    { bg: '#ECFDF5', text: '#065F46' },
  update_patient: { bg: '#F0FDF4', text: '#15803D' },
  add_visit:      { bg: '#FFF7ED', text: '#C2410C' },
  add_appt:       { bg: '#EFF6FF', text: '#1D4ED8' },
  update_appt:    { bg: '#DBEAFE', text: '#1E40AF' },
  update_profile: { bg: '#FDF4FF', text: '#7E22CE' },
};

const PAGE_SIZE = 25;

function ActionBadge({ action }) {
  const s = ACTION_COLORS[action] ?? { bg: C.bg, text: C.muted };
  const label = action.replace(/_/g, ' ');
  return (
    <span style={{ background: s.bg, color: s.text, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function formatTS(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * ClinicAudit — full staff audit log (all doctors, all actions).
 * Paginated, searchable, filterable by action type.
 */
export function ClinicAudit({ auditLog, doctors }) {
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('All');
  const [page,       setPage]       = useState(0);

  const doctorMap = useMemo(() => Object.fromEntries(doctors.map((d) => [d.id, d])), [doctors]);

  const actionTypes = useMemo(() => {
    const types = new Set(auditLog.map((e) => e.action));
    return ['All', ...Array.from(types).sort()];
  }, [auditLog]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return auditLog.filter((e) => {
      if (filterType !== 'All' && e.action !== filterType) return false;
      if (q) {
        const doc = doctorMap[e.doctorId]?.name ?? '';
        const detail = JSON.stringify(e.detail ?? '').toLowerCase();
        if (!doc.toLowerCase().includes(q) && !detail.includes(q)) return false;
      }
      return true;
    });
  }, [auditLog, filterType, search, doctorMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const selectStyle = {
    fontSize: 13, padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.white,
    fontFamily: 'Inter', color: C.text, cursor: 'pointer', outline: 'none',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <SectionHeading>Audit log</SectionHeading>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Immutable record of all staff actions</p>
        </div>
      </div>

      {auditLog.length === 0 ? (
        <Card>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: C.muted }}>No activity recorded yet. Actions by doctors will appear here.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by doctor or detail…"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 13, fontFamily: 'Inter', color: C.text, outline: 'none' }}
              />
            </div>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }} style={selectStyle}>
              {actionTypes.map((t) => <option key={t} value={t}>{t === 'All' ? 'All actions' : t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <Card>
            <div className="audit-header" style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Doctor</span>
              <span>Action</span>
              <span className="audit-col-detail">Detail</span>
              <span>Time</span>
            </div>

            {pageItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: 14 }}>No entries match your search.</p>
              </div>
            ) : pageItems.map((entry, i) => (
              <div
                key={i}
                className="audit-row"
                style={{ display: 'grid', padding: '11px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', gap: 8 }}
              >
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doctorMap[entry.doctorId]?.name ?? entry.doctorId ?? '—'}
                </span>
                <ActionBadge action={entry.action} />
                <span className="audit-col-detail" style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof entry.detail === 'object' ? JSON.stringify(entry.detail) : String(entry.detail ?? '')}
                </span>
                <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{formatTS(entry.ts)}</span>
              </div>
            ))}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <p style={{ fontSize: 12, color: C.muted }}>
                Page {page + 1} of {totalPages} · {filtered.length} entries
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: 13, fontFamily: 'Inter' }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: 13, fontFamily: 'Inter' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
