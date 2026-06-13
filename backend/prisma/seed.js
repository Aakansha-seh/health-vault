'use strict';
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DOCTOR_PASSWORD = 'MediRecord@2025';
const CLINIC_PASSWORD = 'Clinic@2025';
const ROUNDS = 10;

async function main() {
  console.log('🌱  Seeding HealthVault database…');

  const hDoctor = await bcrypt.hash(DOCTOR_PASSWORD, ROUNDS);
  const hClinic = await bcrypt.hash(CLINIC_PASSWORD, ROUNDS);

  // ── Clinics ──
  const c1 = await prisma.clinic.upsert({
    where:  { phone: '9811000000' },
    update: {},
    create: {
      name:     'HealthVault Clinic',
      address:  '12-B, Connaught Place, New Delhi — 110001',
      phone:    '9811000000',
      email:    'delhi@healthvault.in',
      password: hClinic,
    },
  });

  const c2 = await prisma.clinic.upsert({
    where:  { phone: '9822000000' },
    update: {},
    create: {
      name:     'HealthVault Wellness',
      address:  'Level 4, BKC, Mumbai — 400051',
      phone:    '9822000000',
      email:    'mumbai@healthvault.in',
      password: hClinic,
    },
  });

  // ── Doctors ──
  const d1 = await prisma.doctor.upsert({
    where:  { contact: '9810000001' },
    update: {},
    create: {
      name:           'Dr. Aakansha Singh',
      specialisation: 'General Physician & Internal Medicine',
      contact:        '9810000001',
      email:          'aakansha@healthvault.in',
      password:       hDoctor,
      regNumber:      'DL-00001',
      clinicHours:    'Mon–Sat, 9 AM – 6 PM',
      yearsPractice:  8,
      clinicId:       c1.id,
    },
  });

  const d2 = await prisma.doctor.upsert({
    where:  { contact: '9810000002' },
    update: {},
    create: {
      name:           'Dr. Rohan Mehta',
      specialisation: 'Cardiologist',
      contact:        '9810000002',
      email:          'rohan@healthvault.in',
      password:       hDoctor,
      regNumber:      'DL-00002',
      clinicHours:    'Mon–Fri, 10 AM – 7 PM',
      yearsPractice:  12,
      clinicId:       c1.id,
    },
  });

  const d3 = await prisma.doctor.upsert({
    where:  { contact: '9820000001' },
    update: {},
    create: {
      name:           'Dr. Priyanka Sharma',
      specialisation: 'Gynaecologist',
      contact:        '9820000001',
      email:          'priyanka@healthvault.in',
      password:       hDoctor,
      regNumber:      'MH-00001',
      clinicHours:    'Tue–Sun, 9 AM – 5 PM',
      yearsPractice:  6,
      clinicId:       c2.id,
    },
  });

  // ── Patients ──
  const patients = [
    {
      name: 'Priya Sharma',   age: 34, gender: 'Female', bloodGroup: 'B+',
      phone: '9000000001', clinicId: c1.id, isReturning: true,
      allergies: 'None', chronicConditions: 'Mild asthma',
    },
    {
      name: 'Arjun Mehta',    age: 52, gender: 'Male',   bloodGroup: 'O+',
      phone: '9000000002', clinicId: c1.id, isReturning: false,
      allergies: 'Penicillin', chronicConditions: 'T2 Diabetes, Hyperlipidemia',
    },
    {
      name: 'Meera Nair',     age: 28, gender: 'Female', bloodGroup: 'A+',
      phone: '9000000003', clinicId: c1.id, isReturning: false,
    },
    {
      name: 'Rahul Verma',    age: 41, gender: 'Male',   bloodGroup: 'AB+',
      phone: '9000000004', clinicId: c1.id, isReturning: true,
      chronicConditions: 'Obesity (BMI 31)',
    },
    {
      name: 'Sunita Kapoor',  age: 65, gender: 'Female', bloodGroup: 'O-',
      phone: '9000000005', clinicId: c1.id, isReturning: false,
      chronicConditions: 'Hypertension, Hypothyroidism',
    },
    {
      name: 'Kavita Patel',   age: 38, gender: 'Female', bloodGroup: 'B-',
      phone: '9000000006', clinicId: c2.id, isReturning: false,
      chronicConditions: 'PCOS',
    },
  ];

  const createdPatients = [];
  for (const p of patients) {
    const created = await prisma.patient.create({ data: p });
    createdPatients.push(created);
  }

  const [p1, p2, p3, p4, p5, p6] = createdPatients;

  // ── Visits ──
  const mo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d; };

  const visits = [
    { patientId: p1.id, doctorId: d1.id, date: mo(5), chiefComplaint: 'Persistent cough and fatigue', diagnosis: 'Asthma exacerbation', medications: 'Salbutamol inhaler — PRN\nVitamin D3 60,000 IU — once weekly × 8 weeks', examination: 'Chest clear, mild wheeze' },
    { patientId: p1.id, doctorId: d1.id, date: mo(1), chiefComplaint: 'Follow-up asthma management', diagnosis: 'Asthma — stable, improved', medications: 'Salbutamol inhaler — PRN (continue)\nMontelukast 10mg — once nightly', notes: 'Peak flow up 20%.' },
    { patientId: p2.id, doctorId: d2.id, date: mo(2), chiefComplaint: 'Annual cardiac checkup', diagnosis: 'T2 Diabetes, Hyperlipidemia — stable', medications: 'Metformin 500mg — twice daily\nAtorvastatin 20mg — once daily\nAspirin 75mg — once daily' },
    { patientId: p3.id, doctorId: d1.id, date: mo(0), chiefComplaint: 'Migraine evaluation', diagnosis: 'Migraine without aura', medications: 'Sumatriptan 50mg — at onset PRN\nPropranolol 40mg — once daily' },
    { patientId: p4.id, doctorId: d1.id, date: mo(4), chiefComplaint: 'Knee pain', diagnosis: 'Osteoarthritis bilateral knees', medications: 'Diclofenac gel — twice daily' },
    { patientId: p4.id, doctorId: d1.id, date: mo(1), chiefComplaint: 'Knee follow-up', diagnosis: 'OA knees — partial improvement', medications: 'Continue physio\nGlucosamine 1500mg — once daily', notes: 'Weight reduced 3 kg.' },
    { patientId: p5.id, doctorId: d1.id, date: mo(3), chiefComplaint: 'Hypertension management', diagnosis: 'Hypertension — uncontrolled', medications: 'Amlodipine 10mg — once daily\nLosartan 50mg — once daily\nLevothyroxine 50mcg — empty stomach' },
    { patientId: p6.id, doctorId: d3.id, date: mo(1), chiefComplaint: 'Routine gynaecology checkup', diagnosis: 'PCOS — managed', medications: 'Metformin 500mg — twice daily\nInositol 2g — once daily' },
  ];

  for (const v of visits) {
    await prisma.visit.create({ data: v });
  }

  // ── Appointments ──
  const fwd = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  const appointments = [
    { patientId: p1.id, doctorId: d1.id, clinicId: c1.id, date: fwd(1), time: '10:30', reason: 'Follow-up — asthma review', notes: 'Check peak flow. Assess Montelukast.', status: 'scheduled' },
    { patientId: p2.id, doctorId: d2.id, clinicId: c1.id, date: fwd(2), time: '11:00', reason: 'Cardiac follow-up — lipid results', notes: 'Review repeat lipid panel.', status: 'scheduled' },
    { patientId: p4.id, doctorId: d1.id, clinicId: c1.id, date: fwd(5), time: '09:00', reason: 'Knee follow-up #3', notes: 'Physio progress check.', status: 'scheduled' },
    { patientId: p3.id, doctorId: d1.id, clinicId: c1.id, date: mo(0),  time: '14:30', reason: 'Migraine review', status: 'completed' },
    { patientId: p5.id, doctorId: d1.id, clinicId: c1.id, date: mo(1),  time: '16:00', reason: 'BP monitoring check', status: 'completed' },
  ];

  for (const a of appointments) {
    await prisma.appointment.create({ data: a });
  }

  console.log('✅  Seed complete.');
  console.log(`\n    Demo credentials:`);
  console.log(`    Doctor phone  : 9810000001 (or 9810000002, 9820000001)`);
  console.log(`    Doctor pass   : ${DOCTOR_PASSWORD}`);
  console.log(`    Clinic phone  : 9811000000 (or 9822000000)`);
  console.log(`    Clinic pass   : ${CLINIC_PASSWORD}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
