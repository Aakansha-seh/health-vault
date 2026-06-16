// HealthVault Seed Script
// Run: node prisma/seed.js  (from server/ directory)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding HealthVault database...');

  // ── Clean slate ────────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.clinic.deleteMany();

  const passwordHash = await bcrypt.hash('MediRecord@2025', 12);

  // ── Clinics ────────────────────────────────────────────────────────────────
  await prisma.clinic.create({
    data: {
      id: 'c1',
      name: 'HealthVault Clinic',
      address: '12-B Connaught Place, New Delhi 110001',
      phone: '+91 11 4000 0000',
      email: 'delhi@healthvault.in',
    },
  });

  await prisma.clinic.create({
    data: {
      id: 'c2',
      name: 'HealthVault Wellness',
      address: 'Level 4, BKC, Mumbai 400051',
      phone: '+91 22 6000 0000',
      email: 'mumbai@healthvault.in',
    },
  });

  console.log('✅  Clinics created');

  // ── Doctors ────────────────────────────────────────────────────────────────
  await prisma.doctor.create({
    data: {
      id: 'd1',
      name: 'Dr. Aakansha Singh',
      email: 'aakansha@healthvault.in',
      password: passwordHash,
      specialisation: 'General Physician & Internal Medicine',
      contact: '+91 98100 00001',
      clinicHours: 'Mon–Sat 9:00 AM – 6:00 PM',
      yearsPractice: 8,
      clinicId: 'c1',
    },
  });

  await prisma.doctor.create({
    data: {
      id: 'd2',
      name: 'Dr. Rohan Mehta',
      email: 'rohan@healthvault.in',
      password: passwordHash,
      specialisation: 'Cardiologist',
      contact: '+91 98100 00002',
      clinicHours: 'Mon–Fri 10:00 AM – 5:00 PM',
      yearsPractice: 12,
      clinicId: 'c1',
    },
  });

  await prisma.doctor.create({
    data: {
      id: 'd3',
      name: 'Dr. Priyanka Sharma',
      email: 'priyanka@healthvault.in',
      password: passwordHash,
      specialisation: 'Gynaecologist',
      contact: '+91 98100 00003',
      clinicHours: 'Tue–Sat 9:00 AM – 4:00 PM',
      yearsPractice: 10,
      clinicId: 'c2',
    },
  });

  console.log('✅  Doctors created');

  // ── Patients ───────────────────────────────────────────────────────────────
  await prisma.patient.create({
    data: {
      id: 'p1',
      name: 'Aarav Sharma',
      age: 34,
      gender: 'Male',
      phone: '+91 98765 11001',
      bloodGroup: 'B+',
      allergies: 'Penicillin',
      chronicConditions: 'Mild hypertension',
      emergencyContact: 'Neha Sharma — +91 98765 11002',
      address: 'A-14, Vasant Vihar, New Delhi 110057',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  await prisma.patient.create({
    data: {
      id: 'p2',
      name: 'Sunita Verma',
      age: 52,
      gender: 'Female',
      phone: '+91 98765 22001',
      bloodGroup: 'O+',
      allergies: 'Sulfa drugs',
      chronicConditions: 'Type 2 Diabetes, Coronary Artery Disease (post PTCA)',
      emergencyContact: 'Amit Verma — +91 98765 22002',
      address: 'B-7, Green Park, New Delhi 110016',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  await prisma.patient.create({
    data: {
      id: 'p3',
      name: 'Karan Patel',
      age: 28,
      gender: 'Male',
      phone: '+91 98765 33001',
      bloodGroup: 'A+',
      allergies: 'NSAIDs (gastric intolerance)',
      chronicConditions: '',
      emergencyContact: '',
      address: 'C-22, Lajpat Nagar, New Delhi 110024',
      isReturning: false,
      clinicId: 'c1',
    },
  });

  await prisma.patient.create({
    data: {
      id: 'p4',
      name: 'Meera Iyer',
      age: 41,
      gender: 'Female',
      phone: '+91 98765 44001',
      bloodGroup: 'AB+',
      allergies: '',
      chronicConditions: 'Hypothyroidism (on Eltroxin)',
      emergencyContact: 'Ravi Iyer — +91 98765 44002',
      address: 'D-3, Saket, New Delhi 110017',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  await prisma.patient.create({
    data: {
      id: 'p5',
      name: 'Divya Nair',
      age: 29,
      gender: 'Female',
      phone: '+91 98765 55001',
      bloodGroup: 'B−',
      allergies: '',
      chronicConditions: 'PCOS (under evaluation)',
      emergencyContact: 'Suresh Nair — +91 98765 55002',
      address: '12, Bandra West, Mumbai 400050',
      isReturning: false,
      clinicId: 'c2',
    },
  });

  await prisma.patient.create({
    data: {
      id: 'p6',
      name: 'Rajan Bose',
      age: 65,
      gender: 'Male',
      phone: '+91 98765 66001',
      bloodGroup: 'O−',
      allergies: '',
      chronicConditions: 'COPD (GOLD Stage II), Hypertension',
      emergencyContact: 'Ananya Bose — +91 98765 66002',
      address: '45, Worli Sea Face, Mumbai 400018',
      isReturning: true,
      clinicId: 'c2',
    },
  });

  console.log('✅  Patients created');

  // ── Visits ─────────────────────────────────────────────────────────────────

  // p1 – Aarav Sharma — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p1',
      doctorId: 'd1',
      date: new Date('2025-10-15'),
      chiefComplaint: 'Fever and body ache for 3 days',
      examination: 'Temp 102°F · Pulse 96 bpm · BP 130/84 mmHg · SpO₂ 97% · Generalised body ache, fatigue. No rash.',
      diagnosis: 'Viral fever — Dengue ruled out (NS1 negative). Probable viral syndrome.',
      medications: 'Tab Paracetamol 650mg — TDS × 5 days\nTab Dolo 650 — SOS for fever > 101°F\nORS sachets — TDS × 3 days',
      notes: 'Advised adequate rest and 3L fluid intake per day. Follow up if fever persists beyond 5 days.',
      testReports: [
        { name: 'CBC Report', url: 'https://example.com/reports/p1_cbc.pdf', type: 'pdf' },
        { name: 'Dengue NS1', url: 'https://example.com/reports/p1_dengue.pdf', type: 'pdf' },
      ],
    },
  });

  await prisma.visit.create({
    data: {
      patientId: 'p1',
      doctorId: 'd1',
      date: new Date('2026-01-20'),
      chiefComplaint: 'Follow-up — hypertension management, occasional headaches',
      examination: 'BP 148/92 mmHg · Pulse 78 bpm · Weight 82 kg · SpO₂ 99%. Fundoscopy: grade 1 hypertensive retinopathy.',
      diagnosis: 'Primary hypertension — uncontrolled. Lipid profile mildly deranged.',
      medications: 'Tab Amlodipine 5mg — OD morning\nTab Telmisartan 40mg — OD morning\nTab Atorvastatin 10mg — HS',
      notes: 'Low-sodium diet. 30 min brisk walk daily. Avoid alcohol. Repeat BP check in 4 weeks. Lipid profile after 3 months.',
      testReports: [
        { name: 'Lipid Profile', url: 'https://example.com/reports/p1_lipid.pdf', type: 'pdf' },
      ],
    },
  });

  // p2 – Sunita Verma — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p2',
      doctorId: 'd2',
      date: new Date('2025-09-05'),
      chiefComplaint: 'Chest discomfort and breathlessness on climbing stairs',
      examination: 'BP 136/88 mmHg · Pulse 84 bpm · SpO₂ 96% on exertion · ECG: ST depression V4–V6. Heart sounds normal. No murmur.',
      diagnosis: 'Stable angina pectoris. Suspected significant CAD. TMT positive. Referred for coronary angiography.',
      medications: 'Tab Aspirin 75mg — OD after breakfast\nTab Atorvastatin 40mg — HS\nTab Metoprolol 25mg — BD\nTab Isosorbide mononitrate 10mg — BD',
      notes: 'Strict physical rest until angiography. Avoid strenuous activity. Low-fat diet. Diabetologist consult for HbA1c 8.2%.',
      testReports: [
        { name: 'ECG', url: 'https://example.com/reports/p2_ecg.pdf', type: 'pdf' },
        { name: '2D Echo', url: 'https://example.com/reports/p2_echo.pdf', type: 'pdf' },
      ],
    },
  });

  await prisma.visit.create({
    data: {
      patientId: 'p2',
      doctorId: 'd2',
      date: new Date('2026-02-10'),
      chiefComplaint: 'Cardiology follow-up post angioplasty — mild ankle swelling',
      examination: 'BP 128/80 mmHg · Pulse 72 bpm · SpO₂ 98% · Bilateral mild pedal oedema +1. Chest clear. EF 52% on echo.',
      diagnosis: 'Post-PTCA (Nov 2025) — satisfactory recovery. Mild cardiac failure — NYHA class I. HbA1c 7.4% (improved).',
      medications: 'Tab Aspirin 75mg — OD (continue)\nTab Clopidogrel 75mg — OD (continue dual antiplatelet × 1 year)\nTab Atorvastatin 40mg — HS\nTab Metoprolol 25mg — BD\nTab Furosemide 20mg — OD morning (for oedema)',
      notes: 'Strict fluid restriction 1.5L/day. Weigh daily — report if weight gain > 2 kg in 2 days. Follow up in 3 months with Echo and renal profile.',
      testReports: [],
    },
  });

  // p3 – Karan Patel — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p3',
      doctorId: 'd1',
      date: new Date('2026-05-18'),
      chiefComplaint: 'Severe acidity, epigastric burning after meals, nausea for 2 weeks',
      examination: 'Temp 37.1°C · BP 118/76 mmHg · Epigastric tenderness on deep palpation. No guarding. Bowel sounds normal.',
      diagnosis: 'Peptic ulcer disease — H. pylori positive (breath test). NSAID-induced gastric injury.',
      medications: 'Tab Pantoprazole 40mg — BD (before meals) × 4 weeks\nTab Clarithromycin 500mg — BD × 14 days\nTab Amoxicillin 1g — BD × 14 days\nSyrup Sucralfate 10ml — TDS (30 min before meals)',
      notes: 'Stop all NSAIDs immediately. Avoid spicy, oily, caffeinated foods. Small frequent meals. H. pylori eradication — retest after 4 weeks. UGI endoscopy if no improvement.',
      testReports: [],
    },
  });

  // p4 – Meera Iyer — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p4',
      doctorId: 'd1',
      date: new Date('2025-11-22'),
      chiefComplaint: 'Fatigue, weight gain of 3 kg in 3 months, hair fall',
      examination: 'Wt 68 kg (↑3 kg since last visit) · BP 116/74 mmHg · Pulse 62 bpm · Dry skin, periorbital puffiness. Thyroid not palpable. TSH 8.4 mIU/L.',
      diagnosis: 'Hypothyroidism — inadequately controlled (TSH elevated). Dose adjustment needed.',
      medications: 'Tab Eltroxin (Levothyroxine) 75mcg — OD empty stomach (increased from 50mcg)',
      notes: 'Take Eltroxin 30 min before food. Avoid calcium/iron supplements within 4 hours. Repeat TFT in 6 weeks. Hair fall expected to improve once TSH normalises.',
      testReports: [
        { name: 'TFT Report', url: 'https://example.com/reports/p4_tft.pdf', type: 'pdf' },
      ],
    },
  });

  await prisma.visit.create({
    data: {
      patientId: 'p4',
      doctorId: 'd1',
      date: new Date('2026-03-05'),
      chiefComplaint: 'Thyroid follow-up — energy improved, hair fall reduced',
      examination: 'Wt 66 kg (↓2 kg) · BP 112/72 mmHg · Pulse 68 bpm · Skin less dry. TSH 2.8 mIU/L (normal range 0.5–5.0).',
      diagnosis: 'Hypothyroidism — well controlled on current dose. Clinical improvement confirmed.',
      medications: 'Tab Eltroxin 75mcg — OD empty stomach (continue same dose)',
      notes: 'Continue current dose. Repeat TFT in 3 months. Can add biotin supplement for residual hair fall. Good progress!',
      testReports: [
        { name: 'TFT Follow-up', url: 'https://example.com/reports/p4_tft2.pdf', type: 'pdf' },
      ],
    },
  });

  // p5 – Divya Nair — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p5',
      doctorId: 'd3',
      date: new Date('2026-04-12'),
      chiefComplaint: 'Irregular menstrual cycles (21–45 day variation), mild pelvic cramping, facial acne',
      examination: 'BMI 26.4 · BP 112/70 mmHg · Acne on jaw and chin. Mild hirsutism. Pelvic USG: Polycystic ovaries (12 follicles right, 10 left). No adnexal mass. LH:FSH ratio 2.8:1.',
      diagnosis: 'Polycystic Ovarian Syndrome (PCOS) — Rotterdam criteria met (oligomenorrhea + polycystic ovaries + clinical hyperandrogenism).',
      medications: 'Tab Metformin 500mg — BD with meals × 3 months\nCap Inositol 2g — OD\nOral contraceptive (if contraception needed — discuss)',
      notes: 'Weight loss of 5–7% significantly improves PCOS. Low glycaemic index diet. 45 min cardio 5x/week. Follow-up with full hormonal panel results in 4 weeks.',
      testReports: [
        { name: 'Pelvic USG', url: 'https://example.com/reports/p5_usg.pdf', type: 'pdf' },
        { name: 'Hormonal Panel', url: 'https://example.com/reports/p5_hormones.pdf', type: 'pdf' },
      ],
    },
  });

  // p6 – Rajan Bose — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p6',
      doctorId: 'd3',
      date: new Date('2026-05-02'),
      chiefComplaint: 'Annual wellness review — stable breathlessness (mMRC grade 1), morning productive cough',
      examination: 'SpO₂ 94% at rest, 89% post 6MWT · BP 132/82 mmHg · Pulse 76 bpm · Barrel chest. Diffuse wheeze on auscultation. FEV1 62% predicted (stable). No pedal oedema.',
      diagnosis: 'COPD — GOLD Stage II, stable. Hypertension controlled. No acute exacerbation.',
      medications: 'Tiotropium 18mcg inhaler — OD morning (continue)\nSalbutamol 100mcg inhaler — SOS\nTab Carbocisteine 375mg — TDS × 4 weeks\nInfluenza vaccine administered',
      notes: 'Absolute smoking cessation (already ex-smoker since 2020 — reinforce). Pulmonary rehabilitation referral given. Avoid cold air exposure. Next spirometry in 6 months. ER if SpO₂ < 90% at rest.',
      testReports: [
        { name: 'Spirometry Report', url: 'https://example.com/reports/p6_spirometry.pdf', type: 'pdf' },
        { name: 'Chest X-Ray', url: 'https://example.com/reports/p6_xray.jpg', type: 'image' },
      ],
    },
  });

  console.log('✅  Visits created');

  // ── Appointments ───────────────────────────────────────────────────────────
  await prisma.appointment.create({
    data: {
      id: 'apt1',
      patientId: 'p1',
      doctorId: 'd1',
      clinicId: 'c1',
      date: '2026-01-20',
      time: '10:00',
      reason: 'Hypertension follow-up',
      notes: 'Bring previous BP readings',
      status: 'completed',
      gcalSynced: true,
    },
  });

  await prisma.appointment.create({
    data: {
      id: 'apt2',
      patientId: 'p2',
      doctorId: 'd2',
      clinicId: 'c1',
      date: '2026-02-10',
      time: '11:30',
      reason: 'Post-angioplasty cardiology review',
      notes: 'Bring all discharge documents from hospital',
      status: 'completed',
      gcalSynced: true,
    },
  });

  await prisma.appointment.create({
    data: {
      id: 'apt3',
      patientId: 'p3',
      doctorId: 'd1',
      clinicId: 'c1',
      date: '2026-07-08',
      time: '09:30',
      reason: 'Endoscopy report review',
      notes: 'Fast 4 hours before appointment',
      status: 'scheduled',
      gcalSynced: false,
    },
  });

  await prisma.appointment.create({
    data: {
      id: 'apt4',
      patientId: 'p4',
      doctorId: 'd1',
      clinicId: 'c1',
      date: '2026-07-15',
      time: '12:00',
      reason: 'Thyroid check follow-up',
      notes: '',
      status: 'scheduled',
      gcalSynced: false,
    },
  });

  await prisma.appointment.create({
    data: {
      id: 'apt5',
      patientId: 'p5',
      doctorId: 'd3',
      clinicId: 'c2',
      date: '2026-07-20',
      time: '10:30',
      reason: 'PCOS hormone report review',
      notes: 'Patient to bring all blood test reports',
      status: 'scheduled',
      gcalSynced: false,
    },
  });

  console.log('✅  Appointments created');

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const auditEntries = [
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'LOGIN',              details: 'Doctor logged in',                              timestamp: new Date('2026-06-14T09:00:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'VIEW_PATIENT',       details: 'Viewed patient: Aarav Sharma',                  timestamp: new Date('2026-06-14T09:05:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'ADD_VISIT',          details: 'Added visit for Aarav Sharma',                  timestamp: new Date('2026-06-14T09:20:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'ADD_APPOINTMENT',    details: 'Scheduled appointment for Karan Patel 2026-07-08', timestamp: new Date('2026-06-14T09:35:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta',    clinicId: 'c1', action: 'LOGIN',              details: 'Doctor logged in',                              timestamp: new Date('2026-06-14T10:00:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta',    clinicId: 'c1', action: 'VIEW_PATIENT',       details: 'Viewed patient: Sunita Verma',                  timestamp: new Date('2026-06-14T10:10:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta',    clinicId: 'c1', action: 'PRINT_PRESCRIPTION', details: 'Printed prescription for Sunita Verma',         timestamp: new Date('2026-06-14T10:25:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta',    clinicId: 'c1', action: 'LOGOUT',             details: 'Doctor logged out',                             timestamp: new Date('2026-06-14T11:00:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'EDIT_PROFILE',       details: 'Updated clinic hours',                          timestamp: new Date('2026-06-14T11:30:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'LOCK_SESSION',       details: 'Session locked after inactivity',               timestamp: new Date('2026-06-14T12:45:00Z') },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log('✅  Audit logs created');
  console.log('\n🎉  Seed complete! HealthVault is ready.');
  console.log('\nLogin credentials:');
  console.log('  All doctors → password: MediRecord@2025');
  console.log('  Dr. Aakansha Singh  → aakansha@healthvault.in  (Delhi clinic)');
  console.log('  Dr. Rohan Mehta     → rohan@healthvault.in     (Delhi clinic)');
  console.log('  Dr. Priyanka Sharma → priyanka@healthvault.in  (Mumbai clinic)');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
