import { useState, useCallback, Fragment } from 'react';
import { C, shadow } from '../../constants/theme';
import { getAuditLog } from '../../services/api';

// Keys must match the AuditAction enum in schema.prisma.
const ACTION_COLORS = {
  ADMIN_LOGIN:               '#1565C0',
  ADMIN_LOGOUT:              '#546E7A',
  CREDENTIAL_LOGIN:          '#1976D2',
  CREDENTIAL_LOGOUT:         '#546E7A',
  SESSION_LOCKED:            '#546E7A',
  CREDENTIAL_CREATED:        '#2E7D32',
  CREDENTIAL_UPDATED:        '#558B2F',
  CREDENTIAL_REVOKED:        '#C62828',
  CREDENTIAL_REACTIVATED:    '#2E7D32',
  PERMISSION_GRANTED:        '#00838F',
  PERMISSION_REVOKED:        '#D84315',
  PERMISSION_REQUEST_SENT:   '#F9A825',
  PERMISSION_REQUEST_APPROVED: '#2E7D32',
  PERMISSION_REQUEST_DENIED: '#C62828',
  PATIENT_CREATED:           '#1B5E20',
  PATIENT_UPDATED:           '#33691E',
  PATIENT_VIEWED:            '#546E7A',
  VISIT_CREATED:             '#0D47A1',
  VISIT_UPDATED:             '#1565C0',
  VISIT_VIEWED:              '#546E7A',
  APPOINTMENT_CREATED:       '#00838F',
  APPOINTMENT_UPDATED:       '#0097A7',
  APPOINTMENT_CANCELLED:     '#C62828',
  APPOINTMENT_COMPLETED:     '#2E7D32',
  AI_SUMMARY_GENERATED:      '#AD1457',
  SUBSCRIPTION_UPGRADED:     '#6A1B9A',
  SUBSCRIPTION_CANCELLED:    '#C62828',
  SUBSCRIPTION_RENEWED:      '#7B1FA2',
  DOCTOR_PROFILE_UPDATED:    '#7B1FA2',
};

function ActionBadge({ action }) {
  const color = ACTION_COLORS[action] ?? '#546E7A';
  const label = action?.replace(/_/g, ' ') ?? '—';
  return (
    <span style={{ background: `${color}15`, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AuditLogView({ actor, logs: initialLogs }) {
  const [logs,    setLogs]    = useState(initialLogs ?? []);
  const [search,  setSearch]  = useState('');
  const [action,  setAction]  = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(initialLogs?.length ?? 0);
  const [expanded, setExpanded] = useState(null);

  const PER_PAGE = 50;

  const fetchLogs = useCallback(async (p = 1, act = action) => {
    setLoading(true);
    try {
      const res = await getAuditLog({ page: p, limit: PER_PAGE, action: act || undefined });
      setLogs(res.logs ?? res);
      setTotal(res.total ?? (res.logs ?? res).length);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [action]);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetLabel?.toLowerCase().includes(search.toLowerCase()) ||
    l.actorLabel?.toLowerCase().includes(search.toLowerCase()) ||
    (l.adminId && 'admin'.includes(search.toLowerCase())) ||
    l.ipAddress?.includes(search)
  );

  const allActions = [...new Set(logs.map(l => l.action))].sort();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Audit Log</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Immutable record of all actions in your hospital</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…"
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, boxSizing: 'border-box' }} />
        </div>
        <select value={action} onChange={e => { setAction(e.target.value); fetchLogs(1, e.target.value); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, minWidth: 160 }}>
          <option value="">All actions</option>
          {allActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="hv-table-wrap" style={{ background: C.white, borderRadius: 12, boxShadow: shadow, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Time', 'Actor', 'Action', 'Target', 'IP', ''].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.muted }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.muted }}>No audit entries found.</td></tr>
            ) : filtered.map(log => (
              <Fragment key={log.id}>
                <tr style={{ borderTop: `1px solid ${C.border}`, cursor: log.details ? 'pointer' : 'default' }}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                  <td style={{ padding: '10px 14px', color: C.muted, whiteSpace: 'nowrap' }}>{formatDate(log.timestamp)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {log.adminId ? (
                      <span style={{ color: C.primary, fontWeight: 600 }}>Admin</span>
                    ) : (
                      <span style={{ color: C.secondary }}>
                        {log.credential?.label || log.actorLabel || log.credential?.username || 'Staff'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}><ActionBadge action={log.action} /></td>
                  <td style={{ padding: '10px 14px', color: C.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.targetLabel || '—'}</td>
                  <td style={{ padding: '10px 14px', color: C.muted, fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {log.details && <span style={{ color: C.secondary, fontSize: 11 }}>{expanded === log.id ? '▲' : '▼'}</span>}
                  </td>
                </tr>
                {expanded === log.id && log.details && (
                  <tr key={`${log.id}-detail`} style={{ background: C.bg }}>
                    <td colSpan={6} style={{ padding: '10px 14px' }}>
                      <pre style={{ fontSize: 11, color: C.text, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PER_PAGE && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.muted }}>Page {page} · {total} total entries</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => fetchLogs(page - 1)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: C.text, opacity: page === 1 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <button disabled={page * PER_PAGE >= total} onClick={() => fetchLogs(page + 1)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', cursor: page * PER_PAGE >= total ? 'not-allowed' : 'pointer', fontSize: 12, color: C.text, opacity: page * PER_PAGE >= total ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
