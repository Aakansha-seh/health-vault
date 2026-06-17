// HealthVault Seed Script — clinics + demo doctors only
// Patients, visits, appointments are NOT seeded so new signups start fresh.
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
      id:      'c1',
      name:    'HealthVault Clinic — Delhi',
      address: '12-B Connaught Place, New Delhi 110001',
      phone:   '+91 11 4000 0000',
      email:   'delhi@healthvault.in',
    },
  });

  await prisma.clinic.create({
    data: {
      id:      'c2',
      name:    'HealthVault Wellness — Mumbai',
      address: 'Level 4, BKC, Mumbai 400051',
      phone:   '+91 22 6000 0000',
      email:   'mumbai@healthvault.in',
    },
  });

  console.log('✅  Clinics created');

  // ── Demo doctors (for testing — remove in production) ─────────────────────
  await prisma.doctor.create({
    data: {
      id:             'd1',
      name:           'Dr. Aakansha Singh',
      email:          'aakansha@healthvault.in',
      password:       passwordHash,
      specialisation: 'General Physician & Internal Medicine',
      contact:        '+91 98100 00001',
      clinicHours:    'Mon–Sat 9:00 AM – 6:00 PM',
      yearsPractice:  8,
      clinicId:       'c1',
    },
  });

  await prisma.doctor.create({
    data: {
      id:             'd2',
      name:           'Dr. Rohan Mehta',
      email:          'rohan@healthvault.in',
      password:       passwordHash,
      specialisation: 'Cardiologist',
      contact:        '+91 98100 00002',
      clinicHours:    'Mon–Fri 10:00 AM – 5:00 PM',
      yearsPractice:  12,
      clinicId:       'c1',
    },
  });

  await prisma.doctor.create({
    data: {
      id:             'd3',
      name:           'Dr. Priyanka Sharma',
      email:          'priyanka@healthvault.in',
      password:       passwordHash,
      specialisation: 'Gynaecologist',
      contact:        '+91 98100 00003',
      clinicHours:    'Tue–Sat 9:00 AM – 4:00 PM',
      yearsPractice:  10,
      clinicId:       'c2',
    },
  });

  console.log('✅  Demo doctors created');
  console.log('\n🎉  Seed complete! No patient data seeded — new users start fresh.');
  console.log('\nDemo login credentials (password: MediRecord@2025):');
  console.log('  aakansha@healthvault.in  — Delhi clinic');
  console.log('  rohan@healthvault.in     — Delhi clinic');
  console.log('  priyanka@healthvault.in  — Mumbai clinic');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
