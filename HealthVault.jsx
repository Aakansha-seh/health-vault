/**
 * HealthVault — entry point.
 * The full application now lives in src/App.jsx and its component tree.
 * This file is kept as the single-file monolith backup; the live app is below.
 */
export { default } from './src/App';

/* ─── MONOLITH BACKUP (kept for reference) ────────────────────────────────── */
// The code below is intentionally unreachable. Delete this file once confident
// the multi-file build is stable.
import { useState, useReducer, useCallback, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────── */
const C = {
  primary:   "#1A3C34",
  secondary: "#5A8A72",
  bg:        "#F0F7F4",
  white:     "#FFFFFF",
  amber:     "#D4882A",
  border:    "#E0EDE8",
  error:     "#C62828",
  success:   "#2E7D32",
  muted:     "#8AA89E",
  text:      "#1A3C34",
};
const shadow = "0 1px 4px rgba(0,0,0,0.07)";
const radius = "8px";

/* ─── GLOBAL STYLE ──────────────────────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: ${C.bg}; color: ${C.text}; -webkit-font-smoothing: antialiased; }
    input, textarea, select { font-family: 'Inter', sans-serif; outline: none; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
    .fade-in { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @keyframes drawEKG { from { stroke-dashoffset: 1500; } to { stroke-dashoffset: 0; } }
    @media (max-width: 768px) {
      .sidebar { display: none !important; }
      .bottom-nav { display: flex !important; }
      .main-content { margin-left: 0 !important; margin-bottom: 64px !important; }
    }
    @media (min-width: 769px) { .bottom-nav { display: none !important; } }
  `}</style>
);

/* ─── SAMPLE DATA ────────────────────────────────────────────────────────── */
const _now = new Date();
const mo = (n) => { const d = new Date(_now); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };
const dFwd = (n) => { const d = new Date(_now); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const SAMPLE_CLINICS = [
  { id: "c1", name: "HealthVault Clinic", address: "12-B, Connaught Place, New Delhi — 110001", phone: "+91 11 4000 0000", email: "delhi@healthvault.in" },
  { id: "c2", name: "HealthVault Wellness", address: "Level 4, BKC, Mumbai — 400051", phone: "+91 22 6000 0000", email: "mumbai@healthvault.in" },
];

const DEMO_PW = "MediRecord@2025";

const SAMPLE_DOCTORS = [
  { id: "d1", name: "Dr. Aakansha Singh",  specialisation: "General Physician & Internal Medicine", clinicId: "c1", email: "aakansha@healthvault.in", contact: "+91 98100 00001", yearsPractice: 8,  clinicHours: "Mon–Sat, 9 AM – 6 PM", password: DEMO_PW },
  { id: "d2", name: "Dr. Rohan Mehta",     specialisation: "Cardiologist",                           clinicId: "c1", email: "rohan@healthvault.in",    contact: "+91 98100 00002", yearsPractice: 12, clinicHours: "Mon–Fri, 10 AM – 7 PM", password: DEMO_PW },
  { id: "d3", name: "Dr. Priyanka Sharma", specialisation: "Gynaecologist",                          clinicId: "c2", email: "priyanka@healthvault.in", contact: "+91 98200 00001", yearsPractice: 6,  clinicHours: "Tue–Sun, 9 AM – 5 PM",  password: DEMO_PW },
];

const SAMPLE_PATIENTS = [
  {
    id: "p1", name: "Priya Sharma",   age: 34, gender: "Female", clinicId: "c1", isReturning: true,
    visits: [
      { id: "v1a", date: mo(5), doctorId: "d1", reason: "Persistent cough and fatigue",     previousHistory: "Mild asthma since childhood",   symptoms: "Dry cough 3 weeks, fatigue, breathlessness", testsDone: "Chest X-ray, Spirometry, CBC", testReports: [], prescription: "Salbutamol inhaler — PRN\nVitamin D3 60,000 IU — once weekly × 8 weeks", progressSinceLastVisit: "" },
      { id: "v1b", date: mo(1), doctorId: "d1", reason: "Follow-up — asthma management",   previousHistory: "Mild asthma since childhood",   symptoms: "Improved. Occasional morning wheeze",       testsDone: "Peak flow meter",             testReports: [], prescription: "Salbutamol inhaler — PRN (continue)\nMontelukast 10mg — once nightly",           progressSinceLastVisit: "Significantly better. Peak flow up 20%. No emergency episodes." },
    ],
  },
  {
    id: "p2", name: "Arjun Mehta",    age: 52, gender: "Male",   clinicId: "c1", isReturning: false,
    visits: [
      { id: "v2a", date: mo(2), doctorId: "d2", reason: "Annual cardiac checkup",           previousHistory: "T2 diabetes (2018), hyperlipidemia", symptoms: "Mild chest discomfort on exertion",     testsDone: "ECG, Echo, Lipid panel, HbA1c", testReports: [], prescription: "Metformin 500mg — twice daily\nAtorvastatin 20mg — once daily\nAspirin 75mg — once daily", progressSinceLastVisit: "" },
    ],
  },
  {
    id: "p3", name: "Meera Nair",     age: 28, gender: "Female", clinicId: "c1", isReturning: false,
    visits: [
      { id: "v3a", date: mo(0), doctorId: "d1", reason: "Migraine evaluation",              previousHistory: "No significant history",             symptoms: "Unilateral throbbing HA, photophobia",   testsDone: "Neuro exam, BP",             testReports: [], prescription: "Sumatriptan 50mg — at onset PRN\nPropranolol 40mg — once daily (prophylaxis)",      progressSinceLastVisit: "" },
    ],
  },
  {
    id: "p4", name: "Rahul Verma",    age: 41, gender: "Male",   clinicId: "c1", isReturning: true,
    visits: [
      { id: "v4a", date: mo(4), doctorId: "d1", reason: "Knee pain evaluation",             previousHistory: "Obesity BMI 31",                    symptoms: "Bilateral knee pain on stairs",           testsDone: "X-ray knees",                testReports: [], prescription: "Diclofenac gel — apply twice daily\nPhysiotherapy — 3×/week × 4 weeks",              progressSinceLastVisit: "" },
      { id: "v4b", date: mo(1), doctorId: "d1", reason: "Knee follow-up",                   previousHistory: "Obesity BMI 31",                    symptoms: "Reduced pain, lost 3 kg",                 testsDone: "Clinical assessment",        testReports: [], prescription: "Continue physiotherapy\nGlucosamine 1500mg — once daily",                            progressSinceLastVisit: "Partial improvement. Weight reduced 3 kg. Good compliance." },
    ],
  },
  {
    id: "p5", name: "Sunita Kapoor",  age: 65, gender: "Female", clinicId: "c1", isReturning: false,
    visits: [
      { id: "v5a", date: mo(3), doctorId: "d1", reason: "Hypertension management",          previousHistory: "HTN ×10 yrs, hypothyroidism",       symptoms: "BP 160/100 at home",                     testsDone: "24h ABPM, RFT, TFT",         testReports: [], prescription: "Amlodipine 10mg — once daily\nLosartan 50mg — once daily\nLevothyroxine 50mcg — empty stomach",   progressSinceLastVisit: "" },
    ],
  },
  {
    id: "p6", name: "Kavita Patel",   age: 38, gender: "Female", clinicId: "c2", isReturning: false,
    visits: [
      { id: "v6a", date: mo(1), doctorId: "d3", reason: "Routine gynaecology checkup",      previousHistory: "PCOS diagnosed 2020",               symptoms: "Irregular cycles, mild hair thinning",   testsDone: "Hormonal panel, Pelvic USG", testReports: [], prescription: "Metformin 500mg — twice daily\nInositol 2g — once daily",                                     progressSinceLastVisit: "" },
    ],
  },
];

const SAMPLE_APPOINTMENTS = [
  { id: "a1", patientId: "p1", doctorId: "d1", clinicId: "c1", date: dFwd(1),  time: "10:30", reason: "Follow-up — asthma review",       notes: "Check peak flow. Assess Montelukast response.", status: "scheduled", gcalSynced: false },
  { id: "a2", patientId: "p2", doctorId: "d2", clinicId: "c1", date: dFwd(2),  time: "11:00", reason: "Cardiac follow-up — lipid results",notes: "Review repeat lipid panel. Echo report pending.", status: "scheduled", gcalSynced: false },
  { id: "a3", patientId: "p4", doctorId: "d1", clinicId: "c1", date: dFwd(5),  time: "09:00", reason: "Knee follow-up #3",               notes: "Physiotherapy progress check.",                 status: "scheduled", gcalSynced: false },
  { id: "a4", patientId: "p3", doctorId: "d1", clinicId: "c1", date: mo(0),    time: "14:30", reason: "Migraine review",                  notes: "",                                              status: "completed", gcalSynced: true  },
  { id: "a5", patientId: "p5", doctorId: "d1", clinicId: "c1", date: mo(1),    time: "16:00", reason: "BP monitoring check",              notes: "",                                              status: "completed", gcalSynced: false },
];

/* ─── REDUCER ───────────────────────────────────────────────────────────── */
const initState = {
  clinics: SAMPLE_CLINICS,
  doctors: SAMPLE_DOCTORS,
  currentDoctorId: null,
  patients: SAMPLE_PATIENTS,
  appointments: SAMPLE_APPOINTMENTS,
  auditLog: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":    return { ...state, currentDoctorId: action.doctorId };
    case "LOGOUT":   return { ...state, currentDoctorId: null };
    case "ADD_PATIENT":
      return { ...state, patients: [...state.patients, action.payload] };
    case "UPDATE_PATIENT":
      return { ...state, patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p) };
    case "ADD_VISIT":
      return {
        ...state,
        patients: state.patients.map(p =>
          p.id === action.patientId ? { ...p, isReturning: true, visits: [...p.visits, action.visit] } : p
        ),
      };
    case "ADD_APPOINTMENT":
      return { ...state, appointments: [...state.appointments, action.payload] };
    case "UPDATE_APPOINTMENT":
      return { ...state, appointments: state.appointments.map(a => a.id === action.payload.id ? action.payload : a) };
    case "UPDATE_DOCTOR":
      return { ...state, doctors: state.doctors.map(d => d.id === action.doctorId ? { ...d, ...action.payload } : d) };
    case "AUDIT":
      return { ...state, auditLog: [action.entry, ...state.auditLog].slice(0, 500) };
    default: return state;
  }
}

/* ─── UTILS ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const isToday = (iso) => iso === new Date().toISOString().slice(0, 10);
const isTomorrow = (iso) => { const d = new Date(); d.setDate(d.getDate() + 1); return iso === d.toISOString().slice(0, 10); };

const gcalUrl = (appt, patient, doctor, clinic) => {
  const ds = appt.date.replace(/-/g, "");
  const [h, m] = appt.time.split(":").map(Number);
  const eH = (h + 1) % 24;
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${ds}T${pad(h)}${pad(m)}00`;
  const end   = `${ds}T${pad(eH)}${pad(m)}00`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${patient.name} — ${appt.reason}`,
    dates: `${start}/${end}`,
    details: `Doctor: ${doctor.name}\nClinic: ${clinic.name}\nReason: ${appt.reason}${appt.notes ? "\nNotes: " + appt.notes : ""}`,
    location: `${clinic.name}, ${clinic.address}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
};

const printPrescription = (doctor, clinic, patient, visit) => {
  const lines = (visit.prescription || "").split("\n").filter(Boolean);
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Prescription — ${patient.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Inter,sans-serif;color:#1A3C34;background:white;}
.page{width:210mm;min-height:297mm;margin:0 auto;padding:28mm 20mm 20mm;}
.hdr{border-bottom:3px solid #5A8A72;padding-bottom:18px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end;}
.clinic-name{font-size:20px;font-weight:700;color:#1A3C34;margin-bottom:4px;}
.clinic-sub{font-size:12px;color:#5A8A72;line-height:1.7;}
.dr-block{text-align:right;}
.dr-name{font-size:15px;font-weight:600;}
.dr-spec{font-size:12px;color:#8AA89E;margin-top:2px;}
.pt-row{display:flex;gap:28px;background:#F0F7F4;padding:14px 16px;border-radius:8px;margin-bottom:26px;}
.f label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#8AA89E;}
.f p{font-size:14px;font-weight:500;margin-top:2px;}
.rxsym{font-size:52px;font-weight:700;font-family:Georgia,serif;margin-bottom:18px;color:#1A3C34;}
.meds{list-style:none;display:flex;flex-direction:column;gap:16px;margin-bottom:40px;}
.med{padding-left:18px;border-left:3px solid #5A8A72;}
.mn{font-size:15px;font-weight:600;}
.ms{font-size:13px;color:#5A8A72;margin-top:2px;}
.meta{font-size:13px;color:#8AA89E;margin-bottom:8px;}
.meta strong{color:#1A3C34;}
.footer{margin-top:60px;display:flex;justify-content:space-between;align-items:flex-end;}
.nv strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8AA89E;margin-bottom:8px;}
.nv{font-size:13px;}
.sig{text-align:right;}
.sl{width:160px;border-top:1px solid #1A3C34;margin:0 0 6px auto;}
.sn{font-size:13px;font-weight:600;}
.sr{font-size:11px;color:#8AA89E;margin-top:2px;}
.gen{font-size:11px;color:#8AA89E;margin-top:14px;}
@media print{@page{margin:0;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head>
<body onload="window.print()">
<div class="page">
  <div class="hdr">
    <div><div class="clinic-name">${clinic.name}</div><div class="clinic-sub">${clinic.address}<br/>${clinic.phone} · ${clinic.email}</div></div>
    <div class="dr-block"><div class="dr-name">${doctor.name}</div><div class="dr-spec">${doctor.specialisation}</div></div>
  </div>
  <div class="pt-row">
    <div class="f"><label>Patient</label><p>${patient.name}</p></div>
    <div class="f"><label>Age</label><p>${patient.age} yrs</p></div>
    <div class="f"><label>Gender</label><p>${patient.gender}</p></div>
    <div class="f"><label>Date</label><p>${formatDate(visit.date)}</p></div>
  </div>
  ${visit.symptoms ? `<p class="meta"><strong>Chief complaint:</strong> ${visit.symptoms.replace(/\n/g,", ")}</p>` : ""}
  ${visit.testsDone ? `<p class="meta"><strong>Investigations:</strong> ${visit.testsDone}</p>` : ""}
  ${(visit.symptoms || visit.testsDone) ? '<div style="margin-bottom:20px;"></div>' : ""}
  <div class="rxsym">℞</div>
  <ul class="meds">
    ${lines.map((ln, i) => {
      const [name, ...rest] = ln.split("—");
      return `<li class="med"><div class="mn">${i+1}. ${name.trim()}</div>${rest.length ? `<div class="ms">${rest.join("—").trim()}</div>` : ""}</li>`;
    }).join("")}
  </ul>
  <div class="footer">
    <div class="nv"><strong>Next visit</strong>_________________________</div>
    <div class="sig"><div class="sl"></div><div class="sn">${doctor.name}</div><div class="sr">Signature &amp; Stamp</div></div>
  </div>
  <p class="gen">Generated by HealthVault · ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p>
</div></body></html>`;
  const w = window.open("", "_blank", "width=900,height=750");
  if (w) { w.document.write(html); w.document.close(); }
};

/* ─── SMALL COMPONENTS ───────────────────────────────────────────────────── */
const Badge = ({ label, type }) => {
  const map = {
    new:        { bg: "#E8F5E9", color: C.success },
    returning:  { bg: "#FFF8E1", color: C.amber },
    scheduled:  { bg: "#E3F2FD", color: "#1565C0" },
    completed:  { bg: "#E8F5E9", color: C.success },
    cancelled:  { bg: "#F5F5F5", color: C.muted },
  };
  const s = map[type] || { bg: C.bg, color: C.muted };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, letterSpacing: 0.3 }}>{label}</span>;
};

const Button = ({ children, onClick, variant = "primary", small, disabled, style: sx }) => {
  const [h, setH] = useState(false);
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 14px" : "9px 18px", borderRadius: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: small ? 13 : 14, transition: "background .15s, opacity .15s", opacity: disabled ? 0.55 : 1, ...sx };
  const variants = {
    primary:   { background: h ? "#15302A" : C.primary, color: C.white },
    secondary: { background: h ? C.bg : C.white, color: C.primary, border: `1px solid ${C.border}` },
    amber:     { background: h ? "#B8731F" : C.amber, color: C.white },
    ghost:     { background: h ? C.bg : "transparent", color: C.primary },
    danger:    { background: h ? "#B71C1C" : C.error, color: C.white },
    gcal:      { background: h ? "#1557A0" : "#1a73e8", color: C.white },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={disabled ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</button>;
};

const Input = ({ label, value, onChange, type = "text", placeholder, error, required, rightEl, multiline, rows = 3, disabled }) => {
  const [foc, setFoc] = useState(false);
  const borderColor = error ? C.error : foc ? C.secondary : C.border;
  const fs = { width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${borderColor}`, background: disabled ? C.bg : C.white, fontSize: 14, color: C.text, transition: "border-color .15s", fontFamily: "Inter", resize: multiline ? "vertical" : "none" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{label}{required && <span style={{ color: C.error }}> *</span>}</label>}
      <div style={{ position: "relative" }}>
        {multiline
          ? <textarea rows={rows} style={fs} value={value} onChange={onChange} placeholder={placeholder} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} disabled={disabled}/>
          : <input type={type} style={{ ...fs, paddingRight: rightEl ? 40 : 12 }} value={value} onChange={onChange} placeholder={placeholder} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} disabled={disabled}/>
        }
        {rightEl && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>{rightEl}</div>}
      </div>
      {error && <span style={{ fontSize: 12, color: C.error }}>{error}</span>}
    </div>
  );
};

const Select = ({ label, value, onChange, options, required, error }) => {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{label}{required && <span style={{ color: C.error }}> *</span>}</label>}
      <select value={value} onChange={onChange} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${error ? C.error : foc ? C.secondary : C.border}`, background: C.white, fontSize: 14, color: C.text, fontFamily: "Inter", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A8A72' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: 12, color: C.error }}>{error}</span>}
    </div>
  );
};

const Card = ({ children, style: sx }) => (
  <div style={{ background: C.white, borderRadius: radius, boxShadow: shadow, border: `1px solid ${C.border}`, ...sx }}>{children}</div>
);

const SectionHeading = ({ children }) => (
  <div style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12, fontSize: 16, fontWeight: 600, color: C.primary, marginBottom: 16 }}>{children}</div>
);

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
const IC = {
  patients:    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
  dashboard:   <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
  profile:     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>,
  lock:        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>,
  plus:        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
  back:        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>,
  search:      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>,
  edit:        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
  calendar:    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>,
  upload:      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>,
  close:       <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
  print:       <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>,
  audit:       <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>,
  check:       <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
  cancel:      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>,
};

const Icon = ({ d, size = 18, color = C.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={IC[d]?.props?.d || ""}/></svg>
);

/* ─── SPLASH SCREEN ─────────────────────────────────────────────────────── */
function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1700);
    const t2 = setTimeout(() => setPhase(2), 2900);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onComplete]);

  const ekgPath = "M -50,60 L 270,60 L 282,55 L 292,44 L 302,55 L 312,60 L 319,66 L 326,4 L 333,88 L 340,60 L 352,54 L 367,36 L 382,54 L 397,60 L 1100,60";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", opacity: phase === 2 ? 0 : 1, transition: phase === 2 ? "opacity .55s ease" : "none" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <svg viewBox="0 0 1000 120" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: 120 }}>
          <defs>
            <filter id="ekgGlow" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path d={ekgPath} stroke="rgba(90,138,114,0.18)" strokeWidth="1.5" fill="none"/>
          <path d={ekgPath} stroke={C.secondary} strokeWidth="2.5" fill="none" filter="url(#ekgGlow)" style={{ strokeDasharray: 1500, strokeDashoffset: 1500, animation: "drawEKG 1.9s cubic-bezier(.25,.46,.45,.94) forwards" }}/>
          <circle r="6" fill={C.secondary} filter="url(#dotGlow)" style={{ opacity: phase >= 1 ? 0 : 1, transition: "opacity .4s ease" }}>
            <animateMotion dur="1.9s" fill="freeze" path={ekgPath}/>
          </circle>
        </svg>
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(20px)", transition: "opacity .65s ease, transform .65s ease" }}>
        <div style={{ width: 68, height: 68, margin: "0 auto 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(90,138,114,0.35)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.secondary} strokeWidth="1.5" fill="none"/>
            <path d="M12 8v8M8 12h8" stroke={C.white} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 600, color: C.white, letterSpacing: -1, marginBottom: 10, fontFamily: "Inter" }}>HealthVault</h1>
        <p style={{ fontSize: 13, color: "rgba(90,138,114,0.85)", letterSpacing: 0.6, fontFamily: "Inter" }}>Secure patient records for clinicians</p>
      </div>
    </div>
  );
}

/* ─── LOGIN SCREEN ───────────────────────────────────────────────────────── */
function LoginScreen({ doctors, clinics, onLogin }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getClinic = (clinicId) => clinics.find(c => c.id === clinicId);

  const handleSelectDoctor = (d) => {
    setSelectedDoctor(d);
    setPassword("");
    setError("");
  };

  const handleLogin = () => {
    if (!password) { setError("Password is required."); return; }
    if (password !== selectedDoctor.password) { setError("Incorrect credentials. Please try again."); return; }
    setLoading(true);
    setTimeout(() => onLogin(selectedDoctor.id), 300);
  };

  const eyePath = showPw
    ? "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
    : "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: C.primary, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.white} strokeWidth="1.5" fill="none"/>
                <path d="M12 8v8M8 12h8" stroke={C.secondary} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 600, color: C.primary, letterSpacing: -0.5 }}>HealthVault</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>Select your profile to sign in</p>
        </div>

        {/* Doctor selection */}
        {!selectedDoctor ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Group by clinic */}
            {clinics.map(clinic => {
              const clinicDoctors = doctors.filter(d => d.clinicId === clinic.id);
              if (!clinicDoctors.length) return null;
              return (
                <div key={clinic.id}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4 }}>{clinic.name}</p>
                  {clinicDoctors.map(d => {
                    const [hov, setHov] = useState(false);
                    return (
                      <div key={d.id} onClick={() => handleSelectDoctor(d)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: hov ? C.bg : C.white, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", transition: "all .15s", marginBottom: 8, boxShadow: shadow }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${d.id.charCodeAt(1) * 30},40%,88%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, color: C.primary }}>{d.name.charAt(4)}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{d.name}</p>
                          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{d.specialisation}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <Card style={{ padding: 32 }}>
            {/* Selected doctor header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `hsl(${selectedDoctor.id.charCodeAt(1) * 30},40%,88%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: C.primary }}>{selectedDoctor.name.charAt(4)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>{selectedDoctor.name}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{getClinic(selectedDoctor.clinicId)?.name}</p>
              </div>
              <Button variant="ghost" small onClick={() => setSelectedDoctor(null)}>Change</Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Input
                  label="Password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  required
                  rightEl={
                    <div onClick={() => setShowPw(!showPw)} style={{ cursor: "pointer", display: "flex" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={C.muted}><path d={eyePath}/></svg>
                    </div>
                  }
                />
                <p style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
                  Demo password: <code style={{ color: C.secondary }}>MediRecord@2025</code>
                </p>
              </div>
              {error && <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: C.error }}>{error}</div>}
              <Button onClick={handleLogin} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── NAV ITEMS ─────────────────────────────────────────────────────────── */
function NavItem({ iconKey, label, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 6, cursor: "pointer", background: active ? "#E8F0EE" : hov ? "#F5F9F7" : "transparent", borderLeft: active ? `3px solid ${C.secondary}` : "3px solid transparent", transition: "all .15s", marginBottom: 2 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? C.primary : C.muted}>{IC[iconKey]}</svg>
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? C.primary : C.muted }}>{label}</span>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
function Sidebar({ view, setView, doctor, clinic, loginTime, onLock }) {
  const timeStr = loginTime ? loginTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className="sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: C.white, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, background: C.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={C.white} strokeWidth="1.5" fill="none"/>
              <path d="M12 8v8M8 12h8" stroke={C.secondary} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.primary, display: "block" }}>HealthVault</span>
            {clinic && <span style={{ fontSize: 10, color: C.muted }}>{clinic.name}</span>}
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <NavItem iconKey="patients"  label="Patient records"  active={view === "patients"}      onClick={() => setView("patients")} />
        <NavItem iconKey="calendar"  label="Appointments"     active={view === "appointments"}  onClick={() => setView("appointments")} />
        <NavItem iconKey="dashboard" label="Dashboard"        active={view === "dashboard"}     onClick={() => setView("dashboard")} />
        <NavItem iconKey="audit"     label="Audit log"        active={view === "audit"}         onClick={() => setView("audit")} />
        <NavItem iconKey="profile"   label="Doctor profile"   active={view === "profile"}       onClick={() => setView("profile")} />
      </nav>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{doctor?.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success }}/>
          <span style={{ fontSize: 11, color: C.muted }}>Active · {timeStr}</span>
        </div>
        <Button variant="secondary" small onClick={onLock} style={{ width: "100%", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>{IC.lock}</svg>
          Lock session
        </Button>
      </div>
    </div>
  );
}

/* ─── BOTTOM NAV ─────────────────────────────────────────────────────────── */
function BottomNav({ view, setView }) {
  const items = [
    { key: "patients", icon: "patients", label: "Records" },
    { key: "appointments", icon: "calendar", label: "Appointments" },
    { key: "dashboard", icon: "dashboard", label: "Dashboard" },
    { key: "profile", icon: "profile", label: "Profile" },
  ];
  return (
    <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, height: 64 }}>
      {items.map(({ key, icon, label }) => (
        <div key={key} onClick={() => setView(key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", borderTop: view === key ? `3px solid ${C.secondary}` : "3px solid transparent", paddingTop: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={view === key ? C.primary : C.muted}>{IC[icon]}</svg>
          <span style={{ fontSize: 11, fontWeight: view === key ? 600 : 400, color: view === key ? C.primary : C.muted }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── APPOINTMENT FORM ───────────────────────────────────────────────────── */
function AppointmentForm({ patients, doctors, clinicId, currentDoctorId, onSave, onCancel }) {
  const clinicPatients = patients.filter(p => p.clinicId === clinicId);
  const clinicDoctors  = doctors.filter(d => d.clinicId === clinicId);

  const [patientId, setPatientId]   = useState(clinicPatients[0]?.id || "");
  const [doctorId,  setDoctorId]    = useState(currentDoctorId);
  const [date,      setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [time,      setTime]        = useState("10:00");
  const [reason,    setReason]      = useState("");
  const [notes,     setNotes]       = useState("");
  const [errors,    setErrors]      = useState({});

  const validate = () => {
    const e = {};
    if (!patientId)     e.patient = "Select a patient.";
    if (!date)          e.date    = "Date is required.";
    if (!time)          e.time    = "Time is required.";
    if (!reason.trim()) e.reason  = "Reason is required.";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ id: uid(), patientId, doctorId, clinicId, date, time, reason: reason.trim(), notes: notes.trim(), status: "scheduled", gcalSynced: false });
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button variant="ghost" small onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.primary}>{IC.back}</svg> Back
        </Button>
        <SectionHeading>Schedule appointment</SectionHeading>
      </div>
      <Card style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <Select label="Patient" value={patientId} onChange={e => { setPatientId(e.target.value); setErrors(ev => ({...ev, patient: undefined})); }} error={errors.patient} required
            options={clinicPatients.map(p => ({ value: p.id, label: `${p.name} — ${p.age} yrs, ${p.gender}` }))}/>
          <Select label="Doctor" value={doctorId} onChange={e => setDoctorId(e.target.value)} required
            options={clinicDoctors.map(d => ({ value: d.id, label: d.name }))}/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Date" type="date" value={date} onChange={e => { setDate(e.target.value); setErrors(ev => ({...ev, date: undefined})); }} error={errors.date} required/>
            <Input label="Time" type="time" value={time} onChange={e => { setTime(e.target.value); setErrors(ev => ({...ev, time: undefined})); }} error={errors.time} required/>
          </div>
          <Input label="Reason for visit" value={reason} onChange={e => { setReason(e.target.value); setErrors(ev => ({...ev, reason: undefined})); }} placeholder="e.g. Follow-up, annual checkup…" error={errors.reason} required/>
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes for this appointment…" multiline rows={3}/>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button variant="amber" onClick={handleSave}>Save appointment</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── APPOINTMENTS VIEW ──────────────────────────────────────────────────── */
function AppointmentsView({ appointments, patients, doctors, clinics, clinicId, currentDoctorId, dispatch, logAudit }) {
  const [subview, setSubview] = useState("list");
  const [gcalAppt, setGcalAppt] = useState(null);

  const clinicAppts = useMemo(() =>
    appointments.filter(a => a.clinicId === clinicId)
      .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1),
    [appointments, clinicId]
  );

  const upcoming = clinicAppts.filter(a => a.status === "scheduled");
  const past     = clinicAppts.filter(a => a.status !== "scheduled");

  const getPatient = (id) => patients.find(p => p.id === id);
  const getDoctor  = (id) => doctors.find(d => d.id === id);
  const getClinic  = (id) => clinics.find(c => c.id === id);

  const markComplete = (appt) => {
    dispatch({ type: "UPDATE_APPOINTMENT", payload: { ...appt, status: "completed" } });
    logAudit("COMPLETE_APPOINTMENT", `Marked appointment complete: ${getPatient(appt.patientId)?.name} on ${formatDate(appt.date)}`);
  };

  const cancelAppt = (appt) => {
    dispatch({ type: "UPDATE_APPOINTMENT", payload: { ...appt, status: "cancelled" } });
    logAudit("CANCEL_APPOINTMENT", `Cancelled appointment: ${getPatient(appt.patientId)?.name} on ${formatDate(appt.date)}`);
  };

  const markGcalSynced = (appt) => {
    dispatch({ type: "UPDATE_APPOINTMENT", payload: { ...appt, gcalSynced: true } });
    logAudit("GCAL_SYNC", `Opened Google Calendar for: ${getPatient(appt.patientId)?.name} on ${formatDate(appt.date)}`);
  };

  const handleSaveAppt = (appt) => {
    dispatch({ type: "ADD_APPOINTMENT", payload: appt });
    logAudit("ADD_APPOINTMENT", `Scheduled appointment: ${getPatient(appt.patientId)?.name} on ${formatDate(appt.date)}`);
    setSubview("list");
  };

  if (subview === "form") return (
    <AppointmentForm patients={patients} doctors={doctors} clinicId={clinicId} currentDoctorId={currentDoctorId}
      onSave={handleSaveAppt} onCancel={() => setSubview("list")}/>
  );

  const ApptRow = ({ appt }) => {
    const pt = getPatient(appt.patientId);
    const dr = getDoctor(appt.doctorId);
    const cl = getClinic(appt.clinicId);
    const [hov, setHov] = useState(false);

    let dateLabelColor = C.muted;
    let dateLabel = formatDate(appt.date);
    if (appt.status === "scheduled") {
      if (isToday(appt.date))    { dateLabel = "Today"; dateLabelColor = C.success; }
      if (isTomorrow(appt.date)) { dateLabel = "Tomorrow"; dateLabelColor = C.amber; }
    }

    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: hov ? C.bg : "transparent", transition: "background .12s" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          {/* Time + date */}
          <div style={{ minWidth: 90, flexShrink: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>{formatTime(appt.time)}</p>
            <p style={{ fontSize: 12, color: dateLabelColor, marginTop: 2 }}>{dateLabel}</p>
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{pt?.name}</p>
              <Badge label={appt.status.charAt(0).toUpperCase() + appt.status.slice(1)} type={appt.status}/>
              {appt.gcalSynced && <Badge label="In Google Cal" type="scheduled"/>}
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>{appt.reason}</p>
            {appt.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{appt.notes}</p>}
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{dr?.name} · {pt?.age} yrs, {pt?.gender}</p>
          </div>
          {/* Actions */}
          {appt.status === "scheduled" && (
            <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
              {!appt.gcalSynced && (
                <a href={gcalUrl(appt, pt, dr, cl)} target="_blank" rel="noreferrer"
                  onClick={() => markGcalSynced(appt)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "#1a73e8", color: C.white, fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "Inter" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                  Add to Calendar
                </a>
              )}
              <Button variant="secondary" small onClick={() => markComplete(appt)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill={C.success}>{IC.check}</svg> Complete
              </Button>
              <Button variant="ghost" small onClick={() => cancelAppt(appt)} style={{ color: C.error }}>Cancel</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeading>Appointments</SectionHeading>
        <Button variant="amber" small onClick={() => setSubview("form")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}>{IC.plus}</svg> Schedule appointment
        </Button>
      </div>

      {/* Upcoming */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>Upcoming</p>
          <span style={{ fontSize: 12, color: C.muted }}>{upcoming.length} appointment{upcoming.length !== 1 ? "s" : ""}</span>
        </div>
        {upcoming.length === 0
          ? <p style={{ padding: "32px 20px", fontSize: 14, color: C.muted }}>No upcoming appointments. Schedule one above.</p>
          : upcoming.map(a => <ApptRow key={a.id} appt={a}/>)
        }
      </Card>

      {/* Past */}
      {past.length > 0 && (
        <Card>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>Past appointments</p>
          </div>
          {past.map(a => <ApptRow key={a.id} appt={a}/>)}
        </Card>
      )}
    </div>
  );
}

/* ─── PATIENT FORM ───────────────────────────────────────────────────────── */
function PatientForm({ onSave, onCancel, existingPatient, existingVisit, clinicId, currentDoctorId }) {
  const isEdit   = !!existingPatient;
  const isNewVisit = isEdit && !existingVisit;

  const [name,         setName]         = useState(existingPatient?.name || "");
  const [age,          setAge]          = useState(existingPatient?.age?.toString() || "");
  const [gender,       setGender]       = useState(existingPatient?.gender || "Male");
  const [date,         setDate]         = useState(existingVisit?.date || new Date().toISOString().slice(0, 10));
  const [reason,       setReason]       = useState(existingVisit?.reason || "");
  const [history,      setHistory]      = useState(existingVisit?.previousHistory || "");
  const [symptoms,     setSymptoms]     = useState(existingVisit?.symptoms || "");
  const [tests,        setTests]        = useState(existingVisit?.testsDone || "");
  const [prescription, setPrescription] = useState(existingVisit?.prescription || "");
  const [progress,     setProgress]     = useState(existingVisit?.progressSinceLastVisit || "");
  const [reports,      setReports]      = useState(existingVisit?.testReports || []);
  const [errors,       setErrors]       = useState({});
  const fileRef = useRef();

  const showProgress = isNewVisit || (existingPatient?.isReturning && existingVisit !== undefined);

  const validate = () => {
    const e = {};
    if (!isEdit && !name.trim()) e.name = "Full name is required.";
    if (!isEdit && (!age || isNaN(age) || +age < 1 || +age > 120)) e.age = "Enter a valid age (1–120).";
    if (!date)         e.date   = "Date of visit is required.";
    if (!reason.trim())e.reason = "Reason for visit is required.";
    return e;
  };

  const handleFile = (e) => {
    const newR = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f), type: f.type }));
    setReports(prev => [...prev, ...newR]);
    e.target.value = "";
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const visit = { id: existingVisit?.id || uid(), date, reason, previousHistory: history, symptoms, testsDone: tests, testReports: reports, prescription, progressSinceLastVisit: progress, doctorId: currentDoctorId };
    if (isEdit && existingVisit) onSave({ type: "edit_visit",  patientId: existingPatient.id, visit });
    else if (isNewVisit)          onSave({ type: "add_visit",   patientId: existingPatient.id, visit });
    else                          onSave({ type: "new_patient", patient: { id: uid(), name: name.trim(), age: +age, gender, clinicId, isReturning: false, visits: [visit] } });
  };

  const F = (label, val, set, opts = {}) => (
    <Input label={label} value={val} onChange={e => { set(e.target.value); setErrors(ev => ({...ev, [opts.key]: undefined})); }}
      error={opts.key ? errors[opts.key] : undefined} required={opts.required} multiline={opts.multiline} rows={opts.rows}
      placeholder={opts.placeholder} type={opts.type} disabled={opts.disabled}/>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button variant="ghost" small onClick={onCancel}><svg width="16" height="16" viewBox="0 0 24 24" fill={C.primary}>{IC.back}</svg> Back</Button>
        <SectionHeading>{isEdit ? (isNewVisit ? "Add new visit" : "Edit visit") : "Add new patient"}</SectionHeading>
      </div>
      <Card style={{ padding: 24, maxWidth: 760 }}>
        <div style={{ display: "grid", gap: 20 }}>
          {!isEdit && (
            <div style={{ paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Patient information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", gap: 16 }}>
                {F("Full name", name, setName, { key: "name", required: true, placeholder: "Patient's full name" })}
                {F("Age", age, setAge, { key: "age", required: true, placeholder: "Age", type: "number" })}
                <Select label="Gender" value={gender} onChange={e => setGender(e.target.value)} required
                  options={["Male","Female","Other"].map(g => ({ value: g, label: g }))}/>
              </div>
            </div>
          )}
          {isEdit && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bg, borderRadius: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={C.secondary}>{IC.profile}</svg>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{existingPatient.name}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{existingPatient.age} yrs · {existingPatient.gender}</p>
              </div>
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Visit details</p>
            <div style={{ display: "grid", gap: 16 }}>
              {F("Date of visit", date, setDate, { key: "date", required: true, type: "date" })}
              {F("Reason for visit", reason, setReason, { key: "reason", required: true, placeholder: "Chief complaint or reason" })}
              {F("Previous medical history", history, setHistory, { multiline: true, rows: 3, placeholder: "Past diagnoses, surgeries, chronic conditions…" })}
              {F("Symptoms", symptoms, setSymptoms, { multiline: true, rows: 3, placeholder: "Describe current symptoms…" })}
              {F("Tests done", tests, setTests, { placeholder: "e.g. CBC, X-ray, ECG…" })}
              {/* File upload */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.primary, display: "block", marginBottom: 6 }}>Test reports</label>
                <div onClick={() => fileRef.current?.click()} style={{ border: `1px dashed ${C.border}`, borderRadius: 6, padding: "16px 20px", textAlign: "center", cursor: "pointer", background: C.bg }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={C.muted} style={{ display: "block", margin: "0 auto 6px" }}>{IC.upload}</svg>
                  <p style={{ fontSize: 13, color: C.muted }}>Click to upload PDF or images</p>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleFile}/>
                {reports.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {reports.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.secondary, textDecoration: "none" }}>{r.name}</a>
                        <div onClick={() => setReports(prev => prev.filter((_, j) => j !== i))} style={{ cursor: "pointer" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>{IC.close}</svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {F("Prescription given", prescription, setPrescription, { multiline: true, rows: 4, placeholder: "One medication per line — format: Drug name — dose, frequency, duration" })}
              {showProgress && F("Progress since last visit", progress, setProgress, { multiline: true, rows: 3, placeholder: "Improvements, complications, or changes since last visit…" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button variant="amber" onClick={handleSave}>Save record</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── PATIENT DETAIL ─────────────────────────────────────────────────────── */
function PatientDetail({ patient, patients, doctors, clinics, currentDoctor, onBack, onAddVisit, onEditVisit, logAudit }) {
  const latestVisit = patient.visits[patient.visits.length - 1];
  const getDoctor = (id) => doctors.find(d => d.id === id);
  const clinic = clinics.find(c => c.id === patient.clinicId);

  const handlePrint = () => {
    const dr = getDoctor(latestVisit.doctorId) || currentDoctor;
    if (!dr || !clinic) { alert("Doctor or clinic info missing."); return; }
    printPrescription(dr, clinic, patient, latestVisit);
    logAudit("PRINT_PRESCRIPTION", `Printed prescription for ${patient.name} — visit ${formatDate(latestVisit.date)}`);
  };

  const F = ({ label, value }) => (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{value || "—"}</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button variant="ghost" small onClick={onBack}><svg width="16" height="16" viewBox="0 0 24 24" fill={C.primary}>{IC.back}</svg> Back</Button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: C.primary }}>{patient.name}</h2>
              <Badge label={patient.isReturning ? "Returning" : "New"} type={patient.isReturning ? "returning" : "new"}/>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>{patient.age} yrs · {patient.gender}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" small onClick={handlePrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>{IC.print}</svg> Print prescription
          </Button>
          <Button variant="secondary" small onClick={() => onEditVisit(latestVisit)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>{IC.edit}</svg> Edit visit
          </Button>
          <Button variant="amber" small onClick={onAddVisit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}>{IC.plus}</svg> Add visit
          </Button>
        </div>
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.primary }}>Latest visit — {formatDate(latestVisit.date)}</p>
          </div>
          <p style={{ fontSize: 12, color: C.muted }}>{getDoctor(latestVisit.doctorId)?.name}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          <F label="Reason for visit"         value={latestVisit.reason}/>
          <F label="Previous medical history"  value={latestVisit.previousHistory}/>
          <F label="Symptoms"                  value={latestVisit.symptoms}/>
          <F label="Tests done"                value={latestVisit.testsDone}/>
          <F label="Prescription"              value={latestVisit.prescription}/>
          {latestVisit.progressSinceLastVisit && <F label="Progress since last visit" value={latestVisit.progressSinceLastVisit}/>}
        </div>
        {latestVisit.testReports?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>Test reports</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {latestVisit.testReports.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ padding: "5px 12px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.secondary, textDecoration: "none" }}>{r.name}</a>
              ))}
            </div>
          </div>
        )}
      </Card>

      {patient.visits.length > 1 && (
        <Card style={{ padding: 24 }}>
          <SectionHeading>Visit history</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[...patient.visits].reverse().map((v, i, arr) => (
              <div key={v.id} style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: i === 0 ? C.secondary : C.border, border: `2px solid ${i === 0 ? C.secondary : C.muted}`, marginTop: 3 }}/>
                  {i < arr.length - 1 && <div style={{ width: 2, background: C.border, flex: 1, minHeight: 24, margin: "4px 0" }}/>}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{formatDate(v.date)}</p>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{v.reason}</p>
                  {v.progressSinceLastVisit && <p style={{ fontSize: 12, color: C.secondary, marginTop: 4, fontStyle: "italic" }}>"{v.progressSinceLastVisit}"</p>}
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{getDoctor(v.doctorId)?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── PATIENT LIST ───────────────────────────────────────────────────────── */
function PatientList({ patients, onSelect, onAddNew }) {
  const [search,       setSearch]       = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [filterType,   setFilterType]   = useState("All");
  const [rowHov,       setRowHov]       = useState(null);

  const filtered = useMemo(() => patients.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filterGender !== "All" && p.gender !== filterGender) return false;
    if (filterType === "New" && p.isReturning) return false;
    if (filterType === "Returning" && !p.isReturning) return false;
    return true;
  }), [patients, search, filterGender, filterType]);

  const ss = { fontSize: 13, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontFamily: "Inter", color: C.text, cursor: "pointer", appearance: "none" };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeading>Patient records</SectionHeading>
        <Button variant="amber" small onClick={onAddNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white}>{IC.plus}</svg> Add patient
        </Button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={C.muted}>{IC.search}</svg>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…"
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 14, fontFamily: "Inter", color: C.text, outline: "none" }}/>
        </div>
        <select value={filterGender} onChange={e => setFilterGender(e.target.value)} style={ss}>
          {["All","Male","Female","Other"].map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={ss}>
          {["All","New","Returning"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: C.muted }}>{patients.length === 0 ? "No patients yet. Add your first patient to get started." : "No patients match your search. Try adjusting the filters."}</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 120px 100px", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              <span>Name</span><span>Age</span><span>Gender</span><span>Last visit</span><span>Status</span>
            </div>
            {filtered.map(p => {
              const lv = p.visits[p.visits.length - 1];
              return (
                <div key={p.id} onClick={() => onSelect(p)} onMouseEnter={() => setRowHov(p.id)} onMouseLeave={() => setRowHov(null)}
                  style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 120px 100px", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: rowHov === p.id ? C.bg : "transparent", transition: "background .12s", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.primary }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: C.text }}>{p.age}</span>
                  <span style={{ fontSize: 14, color: C.text }}>{p.gender}</span>
                  <span style={{ fontSize: 13, color: C.muted }}>{formatDate(lv?.date)}</span>
                  <Badge label={p.isReturning ? "Returning" : "New"} type={p.isReturning ? "returning" : "new"}/>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

/* ─── PATIENTS VIEW ──────────────────────────────────────────────────────── */
function PatientsView({ patients, doctors, clinics, clinicId, currentDoctorId, currentDoctor, dispatch, logAudit }) {
  const [subview, setSubview]           = useState("list");
  const [selectedPatient, setSelected]  = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [addingVisitFor, setAddingFor]  = useState(null);

  const clinicPatients = useMemo(() => patients.filter(p => p.clinicId === clinicId), [patients, clinicId]);

  const syncedPatient = useMemo(() => {
    if (!selectedPatient) return null;
    return patients.find(p => p.id === selectedPatient.id) || selectedPatient;
  }, [patients, selectedPatient]);

  const handleSelect = (p) => {
    setSelected(p);
    setSubview("detail");
    logAudit("VIEW_PATIENT", `Viewed patient record: ${p.name}`);
  };

  const handleAddNew = () => { setSelected(null); setEditingVisit(null); setAddingFor(null); setSubview("form"); };
  const handleAddVisit = (p) => { setAddingFor(p); setEditingVisit(null); setSelected(p); setSubview("form"); };
  const handleEditVisit = (p, v) => { setAddingFor(null); setEditingVisit(v); setSelected(p); setSubview("form"); };

  const handleSave = (payload) => {
    if (payload.type === "new_patient") {
      dispatch({ type: "ADD_PATIENT", payload: payload.patient });
      logAudit("ADD_PATIENT", `Added new patient: ${payload.patient.name}`);
      setSubview("list");
    } else if (payload.type === "add_visit") {
      dispatch({ type: "ADD_VISIT", patientId: payload.patientId, visit: payload.visit });
      logAudit("ADD_VISIT", `Added visit for ${syncedPatient?.name} on ${formatDate(payload.visit.date)}`);
      setSelected(prev => ({ ...prev, isReturning: true, visits: [...prev.visits, payload.visit] }));
      setSubview("detail");
    } else if (payload.type === "edit_visit") {
      const updated = { ...syncedPatient, visits: syncedPatient.visits.map(v => v.id === payload.visit.id ? payload.visit : v) };
      dispatch({ type: "UPDATE_PATIENT", payload: updated });
      logAudit("EDIT_VISIT", `Edited visit for ${syncedPatient?.name} on ${formatDate(payload.visit.date)}`);
      setSelected(updated);
      setSubview("detail");
    }
    setAddingFor(null); setEditingVisit(null);
  };

  if (subview === "form") return (
    <PatientForm onSave={handleSave} onCancel={() => setSubview(selectedPatient ? "detail" : "list")}
      existingPatient={addingVisitFor || (editingVisit ? syncedPatient : null)} existingVisit={editingVisit}
      clinicId={clinicId} currentDoctorId={currentDoctorId}/>
  );
  if (subview === "detail" && syncedPatient) return (
    <PatientDetail patient={syncedPatient} patients={patients} doctors={doctors} clinics={clinics}
      currentDoctor={currentDoctor} onBack={() => setSubview("list")}
      onAddVisit={() => handleAddVisit(syncedPatient)} onEditVisit={(v) => handleEditVisit(syncedPatient, v)}
      logAudit={logAudit}/>
  );
  return <PatientList patients={clinicPatients} onSelect={handleSelect} onAddNew={handleAddNew}/>;
}

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({ patients, appointments, clinicId }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const clinicPatients = patients.filter(p => p.clinicId === clinicId);

  const stats = useMemo(() => {
    let total = clinicPatients.length, newM = 0, retM = 0;
    clinicPatients.forEach(p => {
      p.visits.forEach(v => {
        const d = new Date(v.date);
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
          if (!p.isReturning && v === p.visits[0]) newM++; else retM++;
        }
      });
    });
    return { total, newM, retM };
  }, [clinicPatients]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: d.toLocaleDateString("en-IN", { month: "short" }), key: `${d.getFullYear()}-${d.getMonth()}`, newPts: 0, returning: 0 };
    });
    clinicPatients.forEach(p => {
      p.visits.forEach((v, vi) => {
        const d = new Date(v.date);
        const bkt = months.find(m => m.key === `${d.getFullYear()}-${d.getMonth()}`);
        if (bkt) { if (vi === 0 && !p.isReturning) bkt.newPts++; else bkt.returning++; }
      });
    });
    return months;
  }, [clinicPatients]);

  const upcomingAppts = appointments.filter(a => a.clinicId === clinicId && a.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1).slice(0, 3);

  const recentActivity = useMemo(() => {
    const all = [];
    clinicPatients.forEach(p => {
      p.visits.forEach((v, i) => all.push({ patient: p.name, date: v.date, action: i === 0 ? "Added" : "Updated", reason: v.reason }));
    });
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [clinicPatients]);

  const Stat = ({ label, value, sub }) => (
    <Card style={{ padding: 20, flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 600, color: C.primary, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.secondary, marginTop: 6 }}>{sub}</p>}
    </Card>
  );

  return (
    <div className="fade-in">
      <SectionHeading>Dashboard</SectionHeading>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <Stat label="Total patients (all time)" value={stats.total}/>
        <Stat label="New patients this month"   value={stats.newM}/>
        <Stat label="Returning this month"      value={stats.retM}/>
        <Stat label="Upcoming appointments"     value={upcomingAppts.length}/>
      </div>
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>Patient visits — last 6 months</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={C.border}/>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip contentStyle={{ borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "Inter" }}/>
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }}/>
            <Bar dataKey="newPts"    name="New"       fill={C.secondary} radius={[4,4,0,0]}/>
            <Bar dataKey="returning" name="Returning" fill={C.amber}     radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap" }}>
        {/* Upcoming appointments */}
        <Card style={{ padding: 24 }}>
          <div style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>Upcoming appointments</p>
          </div>
          {upcomingAppts.length === 0
            ? <p style={{ fontSize: 14, color: C.muted }}>No upcoming appointments.</p>
            : upcomingAppts.map(a => {
                const pt = patients.find(p => p.id === a.patientId);
                let dLabel = formatDate(a.date);
                if (isToday(a.date))    dLabel = "Today";
                if (isTomorrow(a.date)) dLabel = "Tomorrow";
                return (
                  <div key={a.id} style={{ display: "flex", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ textAlign: "center", minWidth: 48 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{formatTime(a.time)}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{dLabel}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{pt?.name}</p>
                      <p style={{ fontSize: 12, color: C.muted }}>{a.reason}</p>
                    </div>
                  </div>
                );
              })
          }
        </Card>
        {/* Recent activity */}
        <Card style={{ padding: 24 }}>
          <div style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>Recent activity</p>
          </div>
          {recentActivity.length === 0
            ? <p style={{ fontSize: 14, color: C.muted }}>No activity yet.</p>
            : recentActivity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.secondary}>{IC.profile}</svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{a.patient}</p>
                    <p style={{ fontSize: 12, color: C.muted }}>{a.action} · {a.reason}</p>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{formatDate(a.date)}</span>
                </div>
              ))
          }
        </Card>
      </div>
    </div>
  );
}

/* ─── AUDIT LOG VIEW ─────────────────────────────────────────────────────── */
function AuditLogView({ auditLog }) {
  const actionColor = (a) => {
    if (a.includes("LOGIN"))        return { bg: "#E8F5E9", color: C.success };
    if (a.includes("LOGOUT") || a.includes("LOCK")) return { bg: "#FFF8E1", color: C.amber };
    if (a.includes("PRINT"))        return { bg: "#F3E5F5", color: "#7B1FA2" };
    if (a.includes("CANCEL"))       return { bg: "#FFEBEE", color: C.error };
    if (a.includes("GCAL"))         return { bg: "#E3F2FD", color: "#1565C0" };
    return { bg: C.bg, color: C.muted };
  };

  return (
    <div className="fade-in">
      <SectionHeading>Audit log</SectionHeading>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
        All record-level actions taken during this session are logged below. {auditLog.length === 0 ? "No activity yet." : `${auditLog.length} event${auditLog.length !== 1 ? "s" : ""} recorded.`}
      </p>
      {auditLog.length === 0 ? (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill={C.muted} style={{ display: "block", margin: "0 auto 12px" }}>{IC.audit}</svg>
          <p style={{ fontSize: 15, color: C.muted }}>Actions you take — viewing, editing, printing — will appear here.</p>
        </Card>
      ) : (
        <Card>
          {auditLog.map((entry, i) => {
            const c = actionColor(entry.action);
            return (
              <div key={entry.id} style={{ display: "flex", gap: 14, padding: "12px 16px", borderBottom: i < auditLog.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: c.bg, color: c.color, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
                  {entry.action.replace(/_/g, " ")}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: C.primary }}>{entry.details}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{entry.doctorName}</p>
                </div>
                <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, whiteSpace: "nowrap" }}>{formatDateTime(entry.timestamp)}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ─── DOCTOR PROFILE ─────────────────────────────────────────────────────── */
function DoctorProfile({ doctor, clinic, dispatch, loginTime, logAudit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...doctor });

  const handleSave = () => {
    dispatch({ type: "UPDATE_DOCTOR", doctorId: doctor.id, payload: form });
    logAudit("EDIT_PROFILE", "Updated doctor profile");
    setEditing(false);
  };

  const timeStr = loginTime ? loginTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
  const dateStr = loginTime ? loginTime.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

  const EF = ({ label, field, multiline }) => editing ? (
    <Input label={label} value={form[field]} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} multiline={multiline} rows={2}/>
  ) : (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, color: C.text }}>{doctor[field] || "—"}</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeading>Doctor profile</SectionHeading>
        {!editing
          ? <Button variant="secondary" small onClick={() => setEditing(true)}><svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}>{IC.edit}</svg> Edit profile</Button>
          : <div style={{ display: "flex", gap: 8 }}><Button variant="secondary" small onClick={() => { setForm({...doctor}); setEditing(false); }}>Cancel</Button><Button variant="amber" small onClick={handleSave}>Save changes</Button></div>
        }
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#E8F5E9", borderRadius: 6, border: "1px solid #C8E6C9", marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, flexShrink: 0 }}/>
        <p style={{ fontSize: 13, color: C.success, fontWeight: 500 }}>Session active — signed in {dateStr} at {timeStr}</p>
        {clinic && <p style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>{clinic.name}</p>}
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Personal & practice details</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          <EF label="Full name"          field="name"/>
          <EF label="Specialisation"     field="specialisation"/>
          <EF label="Clinic / hospital"  field="clinic" />
          <EF label="Contact number"     field="contact"/>
          <EF label="Email address"      field="email"/>
          <EF label="Clinic hours"       field="clinicHours"/>
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Practice summary</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[{ label: "Total patients", field: "totalPatients" }, { label: "Years of practice", field: "yearsPractice" }].map(({ label, field }) => (
            <div key={field}>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4 }}>{label}</p>
              {editing
                ? <input type="number" value={form[field]} onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "Inter" }}/>
                : <p style={{ fontSize: 28, fontWeight: 600, color: C.primary }}>{doctor[field]}</p>
              }
            </div>
          ))}
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4 }}>Clinic hours</p>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{doctor.clinicHours}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function HealthVault() {
  const [state, dispatch] = useReducer(reducer, initState);
  const [showSplash, setShowSplash] = useState(true);
  const [loginTime,  setLoginTime]  = useState(null);
  const [view, setView]             = useState("patients");
  const [appVisible, setAppVisible] = useState(false);

  const currentDoctor = useMemo(() => state.doctors.find(d => d.id === state.currentDoctorId), [state.doctors, state.currentDoctorId]);
  const currentClinic = useMemo(() => state.clinics.find(c => c.id === currentDoctor?.clinicId), [state.clinics, currentDoctor]);

  const logAudit = useCallback((action, details) => {
    if (!currentDoctor) return;
    dispatch({ type: "AUDIT", entry: { id: uid(), timestamp: new Date().toISOString(), doctorId: currentDoctor.id, doctorName: currentDoctor.name, action, details } });
  }, [currentDoctor]);

  const handleLogin = useCallback((doctorId) => {
    dispatch({ type: "LOGIN", doctorId });
    const lt = new Date();
    setLoginTime(lt);
    setTimeout(() => setAppVisible(true), 50);
    // Log will be dispatched after re-render with updated currentDoctor — use direct dispatch
    const dr = state.doctors.find(d => d.id === doctorId);
    if (dr) dispatch({ type: "AUDIT", entry: { id: uid(), timestamp: lt.toISOString(), doctorId: dr.id, doctorName: dr.name, action: "LOGIN", details: `Signed in at ${lt.toLocaleTimeString("en-IN")}` } });
  }, [state.doctors]);

  const handleLock = useCallback(() => {
    logAudit("LOCK_SESSION", "Session locked");
    setAppVisible(false);
    setTimeout(() => {
      dispatch({ type: "LOGOUT" });
      setLoginTime(null);
      setView("patients");
    }, 200);
  }, [logAudit]);

  if (showSplash) return <><GlobalStyle/><SplashScreen onComplete={() => setShowSplash(false)}/></>;

  if (!state.currentDoctorId) return (
    <>
      <GlobalStyle/>
      <LoginScreen doctors={state.doctors} clinics={state.clinics} onLogin={handleLogin}/>
    </>
  );

  return (
    <>
      <GlobalStyle/>
      <div style={{ opacity: appVisible ? 1 : 0, transition: "opacity .2s ease", minHeight: "100vh" }}>
        <Sidebar view={view} setView={setView} doctor={currentDoctor} clinic={currentClinic} loginTime={loginTime} onLock={handleLock}/>
        <BottomNav view={view} setView={setView}/>
        <div className="main-content" style={{ marginLeft: 220, padding: "28px 28px", minHeight: "100vh", background: C.bg }}>
          <div style={{ maxWidth: 1040 }}>
            {view === "patients" && (
              <PatientsView patients={state.patients} doctors={state.doctors} clinics={state.clinics}
                clinicId={currentClinic?.id} currentDoctorId={currentDoctor?.id} currentDoctor={currentDoctor}
                dispatch={dispatch} logAudit={logAudit}/>
            )}
            {view === "appointments" && (
              <AppointmentsView appointments={state.appointments} patients={state.patients} doctors={state.doctors}
                clinics={state.clinics} clinicId={currentClinic?.id} currentDoctorId={currentDoctor?.id}
                dispatch={dispatch} logAudit={logAudit}/>
            )}
            {view === "dashboard" && (
              <Dashboard patients={state.patients} appointments={state.appointments} clinicId={currentClinic?.id}/>
            )}
            {view === "audit" && (
              <AuditLogView auditLog={state.auditLog}/>
            )}
            {view === "profile" && (
              <DoctorProfile doctor={currentDoctor} clinic={currentClinic} dispatch={dispatch} loginTime={loginTime} logAudit={logAudit}/>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
