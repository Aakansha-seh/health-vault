import { useState, useMemo } from 'react';
import { C } from '../../constants/theme';
import { Card, SectionHeading, Badge } from '../../components/ui';
import { formatDate, formatTime } from '../../utils/formatters';

const STATUS_COLORS = {
  scheduled: { bg: '#EEF2FF', text: '#4338CA' },
  completed:  { bg: '#ECFDF5', text: '#065F46' },
  cancelled:  { bg: '#FEF2F2', text: '#991B1B' },
};

const TABS = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'];

function statusStyle(status) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
  return { background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block' };
}

export function ClinicAppointments({ appointments, patients, doctors }) {
  const [tab,       setTab]       = useState('All');
  const [filterDoc, setFilterDoc] = useState('All');
  const [hoveredRow, setHoveredRow] = useState(null);

  const patientMap = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);
  const doctorMap  = useMemo(() => Object.fromEntries(doctors.map((d)  => [d.id, d])),  [doctors]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filterDoc !== 'All' && a.doctorId !== filterDoc) return false;
        const d = new Date(a.date); d.setHours(0, 0, 0, 0);
        if (tab === 'Today')     return d.getTime() === today.getTime();
        if (tab === 'Upcoming')  return d > today && a.status === 'scheduled';
        if (tab === 'Completed') return a.status === 'completed';
        if (tab === 'Cancelled') return a.status === 'cancelled';
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [appointments, tab, filterDoc, today]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((t) => {
      counts[t] = appointments.filter((a) => {
        const d = new Date(a.date); d.setHours(0, 0, 0, 0);
        if (t === 'Today')     return d.getTime() === today.getTime();
        if (t === 'Upcoming')  return d > today && a.status === 'scheduled';
        if (t === 'Completed') return a.status === 'completed';
        if (t === 'Cancelled') return a.status === 'cancelled';
        return true;
      }).length;
    });
    return counts;
  }, [appointments, today]);

  const doctorOptions = [{ value: 'All', label: 'All doctors' }, ...doctors.map((d) => ({ value: d.id, label: d.name }))];

  const selectStyle = {
    fontSize: 13, padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.white,
    fontFamily: 'Inter', color: C.text, cursor: 'pointer', outline: 'none',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <SectionHeading>All appointments</SectionHeading>
        <select value={filterDoc} onChange={(e) => setFilterDoc(e.target.value)} style={selectStyle}>
          {doctorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13,
              background: tab === t ? C.primary : C.bg,
              color:      tab === t ? C.white   : C.text,
              fontWeight: tab === t ? 600 : 400,
              transition: 'background .12s, color .12s',
            }}
          >
            {t} <span style={{ opacity: 0.7, fontSize: 11 }}>({tabCounts[t]})</span>
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: C.muted, fontSize: 15 }}>No appointments in this category.</p>
          </div>
        ) : (
          <>
            <div className="ca-header" style={{ display: 'grid', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Patient</span>
              <span className="ca-col-date">Date</span>
              <span className="ca-col-time">Time</span>
              <span className="ca-col-doctor">Doctor</span>
              <span>Status</span>
            </div>
            {filtered.map((appt) => {
              const patient = patientMap[appt.patientId];
              const doctor  = doctorMap[appt.doctorId];
              return (
                <div
                  key={appt.id}
                  className="ca-row"
                  onMouseEnter={() => setHoveredRow(appt.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ display: 'grid', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: hoveredRow === appt.id ? C.bg : 'transparent', transition: 'background .12s', alignItems: 'center' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient?.name ?? 'Unknown'}</p>
                    {appt.reason && <p style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.reason}</p>}
                  </div>
                  <span className="ca-col-date"   style={{ fontSize: 13, color: C.text }}>{formatDate(appt.date)}</span>
                  <span className="ca-col-time"   style={{ fontSize: 13, color: C.muted }}>{appt.time}</span>
                  <span className="ca-col-doctor" style={{ fontSize: 12, color: C.muted }}>{doctor?.name ?? '—'}</span>
                  <span style={statusStyle(appt.status)}>{appt.status}</span>
                </div>
              );
            })}
          </>
        )}
      </Card>

      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
        {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
