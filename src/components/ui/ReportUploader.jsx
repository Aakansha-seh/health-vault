import { useRef, useState } from 'react';
import { C } from '../../constants/theme';
import { uploadReportFile, fetchReportBlob } from '../../services/api';

// Report categories offered in the "name" dropdown.
export const REPORT_TYPES = [
  'Prescription', 'Blood Test', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound',
  'ECG', 'Urine Test', 'Pathology Report', 'Discharge Summary', 'Other',
];

/**
 * Open a stored report file in a new tab. The file is fetched with the user's
 * auth header (so the server can confirm it belongs to their hospital), turned
 * into an object URL, and opened. Works for both new files (fileId) and older
 * ones that still carry a direct `url`.
 *
 * The tab is opened synchronously (inside the click) so popup blockers don't
 * kill it, then pointed at the object URL once the file arrives.
 */
export async function openReportFile(r) {
  const key = r.fileId ?? r.url;
  if (!key) return;
  const tab = window.open('', '_blank');
  try {
    const blob = await fetchReportBlob(key);
    const objUrl = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = objUrl;
    } else {
      const a = document.createElement('a');
      a.href = objUrl; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
  } catch (e) {
    if (tab) tab.close();
    const denied = e?.response?.status === 403;
    alert(denied ? 'You do not have access to this file.' : `Could not open the file${e?.message ? ': ' + e.message : ''}`);
  }
}

/**
 * ReportUploader — pick a report type, then choose a file from the computer.
 * Supports drag-and-drop or clicking to browse.
 * Each uploaded file is stored with its type label. Controlled via
 * `reports` (array of { name, url, type, reportType }) + `setReports`.
 */
export function ReportUploader({ reports = [], setReports, disabled = false }) {
  const fileRef = useRef(null);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fieldStyle = {
    padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`,
    fontSize: 13, color: C.text, background: C.white, boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    uploadFileList(files);
  };

  const uploadFileList = async (files) => {
    setBusy(true); setError('');
    try {
      for (const file of files) {
        const meta = await uploadReportFile(file, reportType);
        setReports(prev => [...prev, meta]);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled || busy) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || busy) return;
    
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      uploadFileList(files);
    }
  };

  const removeReport = (key) => setReports(prev => prev.filter(r => (r.fileId ?? r.url) !== key));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Tag reports as:</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          disabled={disabled || busy}
          style={fieldStyle}
          aria-label="Report type"
        >
          {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div
        className={`hv-dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !busy && fileRef.current?.click()}
        style={{
          opacity: (disabled || busy) ? 0.6 : 1,
          cursor: (disabled || busy) ? 'not-allowed' : 'pointer'
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ marginBottom: 4, transition: 'transform 0.2s', transform: isDragOver ? 'translateY(-2px)' : 'none' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {busy ? 'Uploading files…' : 'Drag & drop reports here or click to browse'}
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>
          Files will be tagged as "{reportType}"
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        onChange={handleFiles}
        disabled={disabled || busy}
        style={{ display: 'none' }}
      />

      {error && <p style={{ fontSize: 12, color: C.error, marginTop: 4, fontWeight: 500 }}>{error}</p>}

      {reports.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reports.map((r, i) => (
            <div key={r.fileId ?? r.url ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: C.bg, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.border}` }}>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.secondary, background: `${C.secondary}15`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
                  {r.reportType || 'Report'}
                </span>
                <button type="button" onClick={() => openReportFile(r)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {r.name}
                </button>
              </div>
              <button type="button" onClick={() => removeReport(r.fileId ?? r.url)} style={{ background: 'none', border: 'none', color: C.critical, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
