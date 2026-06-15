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
  const c1 = await prisma.clinic.create({
    data: {
      id: 'c1',
      name: 'HealthVault Clinic',
      address: '12-B Connaught Place, New Delhi 110001',
      phone: '+91 11 4000 0000',
      email: 'delhi@healthvault.in',
    },
  });

  const c2 = await prisma.clinic.create({
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
  const d1 = await prisma.doctor.create({
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

  const d2 = await prisma.doctor.create({
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

  const d3 = await prisma.doctor.create({
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
  const p1 = await prisma.patient.create({
    data: {
      id: 'p1',
      name: 'Aarav Sharma',
      age: 34,
      gender: 'Male',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  const p2 = await prisma.patient.create({
    data: {
      id: 'p2',
      name: 'Sunita Verma',
      age: 52,
      gender: 'Female',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  const p3 = await prisma.patient.create({
    data: {
      id: 'p3',
      name: 'Karan Patel',
      age: 28,
      gender: 'Male',
      isReturning: false,
      clinicId: 'c1',
    },
  });

  const p4 = await prisma.patient.create({
    data: {
      id: 'p4',
      name: 'Meera Iyer',
      age: 41,
      gender: 'Female',
      isReturning: true,
      clinicId: 'c1',
    },
  });

  const p5 = await prisma.patient.create({
    data: {
      id: 'p5',
      name: 'Divya Nair',
      age: 29,
      gender: 'Female',
      isReturning: false,
      clinicId: 'c2',
    },
  });

  const p6 = await prisma.patient.create({
    data: {
      id: 'p6',
      name: 'Rajan Bose',
      age: 65,
      gender: 'Male',
      isReturning: true,
      clinicId: 'c2',
    },
  });

  console.log('✅  Patients created');

  // ── Visits ─────────────────────────────────────────────────────────────────

  // p1 – Aarav Sharma (returning, c1) — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p1',
      doctorId: 'd1',
      date: new Date('2025-10-15'),
      reason: 'Fever and body ache',
      previousHistory: 'Mild hypertension since 2022',
      symptoms: 'High grade fever (102°F), generalised body ache, fatigue',
      testsDone: 'CBC, Dengue NS1 Ag, Malaria RDT',
      prescription: 'Tab Paracetamol 650mg TDS × 5 days, Tab Dolo 650 SOS, ORS sachets, adequate hydration',
      progressSinceLastVisit: null,
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
      reason: 'Follow-up — hypertension management',
      previousHistory: 'Hypertension, past dengue episode Oct 2025',
      symptoms: 'Occasional headache, BP 148/92 mmHg at home',
      testsDone: 'BP monitoring, Lipid profile, Kidney function test',
      prescription: 'Tab Amlodipine 5mg OD, Tab Telma 40mg OD, low-sodium diet advised',
      progressSinceLastVisit: 'Fever resolved. BP slightly elevated. Started antihypertensives.',
      testReports: [
        { name: 'Lipid Profile', url: 'https://example.com/reports/p1_lipid.pdf', type: 'pdf' },
      ],
    },
  });

  // p2 – Sunita Verma (returning, c1) — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p2',
      doctorId: 'd2',
      date: new Date('2025-09-05'),
      reason: 'Chest discomfort and breathlessness on exertion',
      previousHistory: 'Type 2 Diabetes (on Metformin), family history of CAD',
      symptoms: 'Exertional chest tightness, dyspnoea on climbing stairs, palpitations',
      testsDone: 'ECG, 2D Echo, TMT, HbA1c',
      prescription: 'Tab Aspirin 75mg OD, Tab Atorvastatin 20mg HS, Tab Metoprolol 25mg BD — referred to cardiology OPD',
      progressSinceLastVisit: null,
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
      reason: 'Cardiology follow-up post angioplasty',
      previousHistory: 'CAD, PTCA done Nov 2025, DM2',
      symptoms: 'Well controlled, no chest pain, mild ankle swelling',
      testsDone: 'ECG, Echo, HbA1c, renal profile',
      prescription: 'Continue dual antiplatelet, Statin, Beta-blocker. Added Tab Furosemide 20mg OD for oedema.',
      progressSinceLastVisit: 'Post PTCA recovery satisfactory. Ejection fraction improved to 52%.',
      testReports: [],
    },
  });

  // p3 – Karan Patel (new, c1) — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p3',
      doctorId: 'd1',
      date: new Date('2026-05-18'),
      reason: 'Severe acidity and abdominal pain',
      previousHistory: 'No significant past history. Frequent NSAID use for gym-related pain.',
      symptoms: 'Epigastric burning, nausea post meals, occasional belching',
      testsDone: 'H. pylori breath test, UGI endoscopy advised',
      prescription: 'Tab Pantoprazole 40mg AC BD × 2 weeks, Tab Ondansetron 4mg SOS, dietary advice (avoid spicy/oily food)',
      progressSinceLastVisit: null,
      testReports: [],
    },
  });

  // p4 – Meera Iyer (returning, c1) — 2 visits
  await prisma.visit.create({
    data: {
      patientId: 'p4',
      doctorId: 'd1',
      date: new Date('2025-11-22'),
      reason: 'Hypothyroidism review',
      previousHistory: 'Hypothyroidism since 2019, on Eltroxin 50mcg',
      symptoms: 'Fatigue, weight gain (3 kg in 3 months), hair fall',
      testsDone: 'TSH, T3, T4, CBC',
      prescription: 'Increase Eltroxin to 75mcg OD (empty stomach). Repeat TFT after 6 weeks.',
      progressSinceLastVisit: null,
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
      reason: 'Thyroid follow-up',
      previousHistory: 'Hypothyroidism, dose increased Nov 2025',
      symptoms: 'Energy improved, weight stable, hair fall reduced',
      testsDone: 'TSH, T4',
      prescription: 'Continue Eltroxin 75mcg OD. Repeat TFT in 3 months.',
      progressSinceLastVisit: 'TSH normalised to 2.8 mIU/L. Significant clinical improvement.',
      testReports: [
        { name: 'TFT Follow-up', url: 'https://example.com/reports/p4_tft2.pdf', type: 'pdf' },
      ],
    },
  });

  // p5 – Divya Nair (new, c2) — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p5',
      doctorId: 'd3',
      date: new Date('2026-04-12'),
      reason: 'Irregular menstrual cycles',
      previousHistory: 'No significant history. Menarche at 13.',
      symptoms: 'Cycles varying 21–45 days, mild cramping, acne on jaw',
      testsDone: 'Pelvic USG, Hormonal panel (FSH, LH, AMH, Prolactin, DHEA-S), HbA1c',
      prescription: 'Tab Metformin 500mg BD (if PCOS confirmed), lifestyle modification — weight management, low GI diet',
      progressSinceLastVisit: null,
      testReports: [
        { name: 'Pelvic USG', url: 'https://example.com/reports/p5_usg.pdf', type: 'pdf' },
        { name: 'Hormonal Panel', url: 'https://example.com/reports/p5_hormones.pdf', type: 'pdf' },
      ],
    },
  });

  // p6 – Rajan Bose (returning, c2) — 1 visit
  await prisma.visit.create({
    data: {
      patientId: 'p6',
      doctorId: 'd3',
      date: new Date('2026-05-02'),
      reason: 'Annual wellness check + COPD management',
      previousHistory: 'COPD (GOLD Stage II), ex-smoker (40 pack-years), BP controlled on medication',
      symptoms: 'Stable breathlessness (mMRC grade 1), morning cough with mucus, no fever',
      testsDone: 'Spirometry, ABG, Chest X-ray, CBC, CMP',
      prescription: 'Continue Tiotropium 18mcg inhaler OD, Salbutamol SOS. Added Tab Carbocisteine 375mg TDS for sputum. Flu vaccine administered.',
      progressSinceLastVisit: 'FEV1 stable at 62% predicted. No exacerbations in past 6 months.',
      testReports: [
        { name: 'Spirometry Report', url: 'https://example.com/reports/p6_spirometry.pdf', type: 'pdf' },
        { name: 'Chest X-Ray', url: 'https://example.com/reports/p6_xray.jpg', type: 'image' },
      ],
    },
  });

  console.log('✅  Visits created');

  // ── Appointments ───────────────────────────────────────────────────────────
  // 2 past completed
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

  // 3 future scheduled
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
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'LOGIN', details: 'Doctor logged in', timestamp: new Date('2026-06-14T09:00:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'VIEW_PATIENT', details: 'Viewed patient: Aarav Sharma (p1)', timestamp: new Date('2026-06-14T09:05:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'ADD_VISIT', details: 'Added visit for patient: Aarav Sharma (p1)', timestamp: new Date('2026-06-14T09:20:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'ADD_APPOINTMENT', details: 'Scheduled appointment for Karan Patel on 2026-07-08', timestamp: new Date('2026-06-14T09:35:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta', clinicId: 'c1', action: 'LOGIN', details: 'Doctor logged in', timestamp: new Date('2026-06-14T10:00:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta', clinicId: 'c1', action: 'VIEW_PATIENT', details: 'Viewed patient: Sunita Verma (p2)', timestamp: new Date('2026-06-14T10:10:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta', clinicId: 'c1', action: 'PRINT_PRESCRIPTION', details: 'Printed prescription for Sunita Verma', timestamp: new Date('2026-06-14T10:25:00Z') },
    { doctorId: 'd2', doctorName: 'Dr. Rohan Mehta', clinicId: 'c1', action: 'LOGOUT', details: 'Doctor logged out', timestamp: new Date('2026-06-14T11:00:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'EDIT_PROFILE', details: 'Updated clinic hours', timestamp: new Date('2026-06-14T11:30:00Z') },
    { doctorId: 'd1', doctorName: 'Dr. Aakansha Singh', clinicId: 'c1', action: 'LOCK_SESSION', details: 'Session locked after inactivity', timestamp: new Date('2026-06-14T12:45:00Z') },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log('✅  Audit logs created');
  console.log('\n🎉  Seed complete! HealthVault is ready.');
  console.log('\nLogin credentials:');
  console.log('  All doctors → password: MediRecord@2025');
  console.log('  Dr. Aakansha Singh  → email: aakansha@healthvault.in (Clinic: Delhi)');
  console.log('  Dr. Rohan Mehta     → email: rohan@healthvault.in    (Clinic: Delhi)');
  console.log('  Dr. Priyanka Sharma → email: priyanka@healthvault.in (Clinic: Mumbai)');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
