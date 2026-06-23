import { useState } from 'react';
import { C, shadow } from '../../constants/theme';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }) {
  const map = {
    PENDING:  { bg: '#FFF8E1', color: '#F9A825' },
    APPROVED: { bg: '#E8F5E9', color: '#2E7D32' },
    DENIED:   { bg: '#FFF5F5', color: '#C62828' },
  };
  const s = map[status] ?? { bg: C.bg, color: C.muted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

export function PermissionsView({ actor, requests, onResolve }) {
  const [tab,     setTab]     = useState('pending');
  const [loading, setLoading] = useState(null); // id of resolving request
  const [error,   setError]   = useState('');

  const filtered = requests.filter(r =>
    tab === 'all' ? true : tab === 'pending' ? r.status === 'PENDING' : r.status !== 'PENDING'
  );

  const handleResolve = async (id, decision) => {
    setLoading(id); setError('');
    try { await onResolve(id, decision); }
    catch (e) { setError(e.message); }
    finally { setLoading(null); }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>Permission Requests</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Staff requesting write access to doctor profiles</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.bg, borderRadius: 8, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {[['pending', `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}`], ['resolved', 'Resolved'], ['all', 'All']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
            background: tab === key ? C.white : 'transparent',
            color: tab === key ? C.primary : C.muted,
            fontWeight: tab === key ? 700 : 400,
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
          }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#FFF5F5', border: `1px solid ${C.error}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.error, fontSize: 13 }}>{error}</div>}

      {filtered.length === 0 ? (
        <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 14 }}>
            {tab === 'pending' ? 'No pending requests. Great — you\'re all caught up!' : 'No requests found.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(req => (
            <div key={req.id} style={{ background: C.white, borderRadius: 12, boxShadow: shadow, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.secondary }}>
                        {(req.credential?.label || req.credential?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>
                        {req.credential?.label || req.credential?.username || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 6 }}>@{req.credential?.username}</span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <p style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
                    Requesting <strong>WRITE</strong> access to{' '}
                    <strong>{req.doctorProfile?.name ?? 'a doctor profile'}</strong>
                    {req.doctorProfile?.specialty && <span style={{ color: C.muted }}> ({req.doctorProfile.specialty})</span>}
                  </p>

                  {req.reason && (
                    <p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>"{req.reason}"</p>
                  )}

                  <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                    Requested {timeAgo(req.createdAt)}
                    {req.resolvedAt && ` · Resolved ${timeAgo(req.resolvedAt)}`}
                  </p>
                </div>

                {req.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleResolve(req.id, 'DENIED')}
                      disabled={loading === req.id}
                      style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.error}`, background: 'transparent', cursor: 'pointer', color: C.error, fontSize: 13, fontWeight: 600, opacity: loading === req.id ? 0.5 : 1 }}
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, 'APPROVED')}
                      disabled={loading === req.id}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.success, cursor: 'pointer', color: C.white, fontSize: 13, fontWeight: 600, opacity: loading === req.id ? 0.5 : 1 }}
                    >
                      {loading === req.id ? '…' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
