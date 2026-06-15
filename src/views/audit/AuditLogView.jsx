import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { ICONS } from '../../constants/icons';
import { Card, SectionHeading } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';

const ACTION_COLOR = {
  LOGIN:              C.success,
  LOGOUT:             C.muted,
  ADD_PATIENT:        C.primary,
  UPDATE_PATIENT:     C.secondary,
  ADD_VISIT:          C.primary,
  ADD_APPOINTMENT:    C.amber,
  UPDATE_APPOINTMENT: C.amber,
  UPDATE_DOCTOR:      C.secondary,
};

const ACTION_LABELS = {
  LOGIN:              'Signed in',
  LOGOUT:             'Signed out',
  ADD_PATIENT:        'Patient added',
  UPDATE_PATIENT:     'Patient updated',
  ADD_VISIT:          'Visit recorded',
  ADD_APPOINTMENT:    'Appointment scheduled',
  UPDATE_APPOINTMENT: 'Appointment updated',
  UPDATE_DOCTOR:      'Profile updated',
};

/**
 * AuditLogView — immutable, paginated audit trail.
 *
 * @param {object[]} log - Audit entries from state.auditLog (newest first).
 */
export function AuditLogView({ log }) {
  const [filterAction, setFilterAction] = useState('All');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 25;

  const actionTypes = ['All', ...Object.keys(ACTION_LABELS)];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return log.filter((entry) => {
      if (filterAction !== 'All' && entry.action !== filterAction) return false;
      if (q && !entry.detail?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [log, filterAction, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectStyle = {
    fontSize:   13,
    padding:    '7px 10px',
    borderRadius: 6,
    border:     `1px solid ${C.border}`,
    background: C.white,
    fontFamily: 'Inter',
    color:      C.text,
    cursor:     'pointer',
    outline:    'none',
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   16,
          flexWrap:       'wrap',
          gap:            12,
        }}
      >
        <div>
          <SectionHeading>Audit log</SectionHeading>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Immutable record of all session activity · capped at 500 entries
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.muted}>
              <path d={ICONS.search} />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search log…"
            style={{
              width:        '100%',
              padding:      '8px 12px 8px 30px',
              borderRadius: 6,
              border:       `1px solid ${C.border}`,
              background:   C.white,
              fontSize:     13,
              fontFamily:   'Inter',
              color:        C.text,
              outline:      'none',
            }}
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          style={selectStyle}
        >
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a === 'All' ? 'All actions' : ACTION_LABELS[a]}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <Card>
        {paginated.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: C.muted }}>No audit entries match.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="audit-header" style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Timestamp</span>
              <span>Action</span>
              <span className="audit-col-detail">Detail</span>
            </div>

            {paginated.map((entry, i) => (
              <div
                key={i}
                className="audit-row"
                style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'start', fontSize: 13 }}
              >
                <span style={{ color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatDateTime(entry.timestamp)}
                </span>
                <span style={{ fontWeight: 600, color: ACTION_COLOR[entry.action] ?? C.text }}>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="audit-col-detail" style={{ color: C.text, lineHeight: 1.5 }}>
                  {entry.detail ?? '—'}
                </span>
              </div>
            ))}
          </>
        )}
      </Card>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginTop:      12,
          }}
        >
          <p style={{ fontSize: 12, color: C.muted }}>
            {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'} · page {page} of {totalPages}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding:      '6px 14px',
                borderRadius: 6,
                border:       `1px solid ${C.border}`,
                background:   page === 1 ? C.bg : C.white,
                color:        page === 1 ? C.muted : C.primary,
                cursor:       page === 1 ? 'default' : 'pointer',
                fontSize:     13,
                fontFamily:   'Inter',
              }}
            >
              ‹ Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding:      '6px 14px',
                borderRadius: 6,
                border:       `1px solid ${C.border}`,
                background:   page === totalPages ? C.bg : C.white,
                color:        page === totalPages ? C.muted : C.primary,
                cursor:       page === totalPages ? 'default' : 'pointer',
                fontSize:     13,
                fontFamily:   'Inter',
              }}
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
