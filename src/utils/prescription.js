import { formatDate } from './formatters';

/**
 * Opens a print-ready prescription in a new browser tab.
 *
 * Prescription lines are expected in the format:
 *   "Drug name — dose, frequency, duration"
 * (one medication per line, separated by "\n").
 *
 * The new window triggers window.print() automatically on load.
 *
 * @param {object} doctor  - { name, specialisation }
 * @param {object} clinic  - { name, address, phone, email }
 * @param {object} patient - { name, age, gender }
 * @param {object} visit   - { date, symptoms, testsDone, prescription }
 */
export function printPrescription(doctor, clinic, patient, visit) {
  const lines = (visit.prescription || '').split('\n').filter(Boolean);

  const medicationRows = lines
    .map((line, i) => {
      const [name, ...rest] = line.split('—');
      return `
        <li class="med">
          <div class="med-name">${i + 1}. ${name.trim()}</div>
          ${rest.length ? `<div class="med-sig">${rest.join('—').trim()}</div>` : ''}
        </li>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Prescription — ${patient.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Inter, sans-serif;
      color: #1A3C34;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 28mm 20mm 20mm;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 18px;
      margin-bottom: 22px;
      border-bottom: 3px solid #5A8A72;
    }
    .clinic-name  { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .clinic-meta  { font-size: 12px; color: #5A8A72; line-height: 1.7; }
    .doctor-block { text-align: right; }
    .doctor-name  { font-size: 15px; font-weight: 600; }
    .doctor-spec  { font-size: 12px; color: #8AA89E; margin-top: 2px; }

    /* ── Patient row ── */
    .patient-row {
      display: flex;
      gap: 28px;
      background: #F0F7F4;
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 26px;
    }
    .field label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #8AA89E; display: block; }
    .field p     { font-size: 14px; font-weight: 500; margin-top: 2px; }

    /* ── Clinical meta ── */
    .clinical-meta       { font-size: 13px; color: #8AA89E; margin-bottom: 8px; }
    .clinical-meta strong{ color: #1A3C34; }

    /* ── Prescription ── */
    .rx-symbol { font-size: 52px; font-weight: 700; font-family: Georgia, serif; margin-bottom: 18px; }

    .med-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 40px;
    }
    .med      { padding-left: 18px; border-left: 3px solid #5A8A72; }
    .med-name { font-size: 15px; font-weight: 600; }
    .med-sig  { font-size: 13px; color: #5A8A72; margin-top: 2px; }

    /* ── Footer ── */
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; }
    .next-visit strong { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #8AA89E; margin-bottom: 8px; }
    .next-visit        { font-size: 13px; }
    .signature         { text-align: right; }
    .sig-line          { width: 160px; border-top: 1px solid #1A3C34; margin: 0 0 6px auto; }
    .sig-name          { font-size: 13px; font-weight: 600; }
    .sig-reg           { font-size: 11px; color: #8AA89E; margin-top: 2px; }
    .generated         { font-size: 11px; color: #8AA89E; margin-top: 14px; }

    @media print {
      @page { margin: 0; }
      body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="page">

    <div class="header">
      <div>
        <div class="clinic-name">${clinic.name}</div>
        <div class="clinic-meta">${clinic.address}<br />${clinic.phone} · ${clinic.email}</div>
      </div>
      <div class="doctor-block">
        <div class="doctor-name">${doctor.name}</div>
        <div class="doctor-spec">${doctor.specialisation}</div>
      </div>
    </div>

    <div class="patient-row">
      <div class="field"><label>Patient</label><p>${patient.name}</p></div>
      <div class="field"><label>Age</label><p>${patient.age} yrs</p></div>
      <div class="field"><label>Gender</label><p>${patient.gender}</p></div>
      <div class="field"><label>Date</label><p>${formatDate(visit.date)}</p></div>
    </div>

    ${visit.symptoms  ? `<p class="clinical-meta"><strong>Chief complaint:</strong> ${visit.symptoms.replace(/\n/g, ', ')}</p>` : ''}
    ${visit.testsDone ? `<p class="clinical-meta" style="margin-bottom:20px"><strong>Investigations:</strong> ${visit.testsDone}</p>` : ''}

    <div class="rx-symbol">℞</div>

    <ul class="med-list">${medicationRows}</ul>

    <div class="footer">
      <div class="next-visit">
        <strong>Next visit</strong>
        _________________________
      </div>
      <div class="signature">
        <div class="sig-line"></div>
        <div class="sig-name">${doctor.name}</div>
        <div class="sig-reg">Signature &amp; Stamp</div>
      </div>
    </div>

    <p class="generated">
      Generated by HealthVault · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>

  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=750');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
