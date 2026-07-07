// HealthVault Seed Script — hospitals + admins + demo doctor credentials/profiles
// Patients, visits, appointments are NOT seeded so new hospitals start fresh.
// Run: node prisma/seed.js  (from server/ directory)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding HealthVault database...');

  // ── Clean slate ────────────────────────────────────────────────────────────
  // Delete in FK-safe order (children before parents)
  await prisma.auditLog.deleteMany();
  await prisma.aIUsage.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.profileAccess.deleteMany();
  await prisma.permissionRequest.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.patientAccount.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.hospital.deleteMany();

  const passwordHash = await bcrypt.hash('MediRecord@2025', 12);

  // ── 1. Create Hospitals (Clinics) ──────────────────────────────────────────
  await prisma.hospital.create({
    data: {
      id:      'c1',
      name:    'HealthVault Clinic — Delhi',
      address: '12-B Connaught Place, New Delhi 110001',
      phone:   '+91 11 4000 0000',
      email:   'delhi@healthvault.in',
    },
  });

  await prisma.hospital.create({
    data: {
      id:      'c2',
      name:    'HealthVault Wellness — Mumbai',
      address: 'Level 4, BKC, Mumbai 400051',
      phone:   '+91 22 6000 0000',
      email:   'mumbai@healthvault.in',
    },
  });

  console.log('✅  Hospitals created');

  // ── 2. Create Hospital Administrators ───────────────────────────────────────
  await prisma.admin.create({
    data: {
      id:           'admin_delhi',
      name:         'Delhi Clinic Admin',
      email:        'admin@healthvault.in',
      passwordHash: passwordHash,
      hospitalId:   'c1',
    },
  });

  await prisma.admin.create({
    data: {
      id:           'admin_mumbai',
      name:         'Mumbai Clinic Admin',
      email:        'mumbai-admin@healthvault.in',
      passwordHash: passwordHash,
      hospitalId:   'c2',
    },
  });

  console.log('✅  Administrators created');

  // ── 3. Create Doctor Logins (Credentials) ──────────────────────────────────
  await prisma.credential.create({
    data: {
      id:           'cred_aakansha',
      label:         'Dr. Aakansha Singh',
      username:     'aakansha',
      passwordHash: passwordHash,
      role:         'DOCTOR',
      isActive:     true,
      hospitalId:   'c1',
      createdBy:    'admin_delhi',
    },
  });

  await prisma.credential.create({
    data: {
      id:           'cred_rohan',
      label:         'Dr. Rohan Mehta',
      username:     'rohan',
      passwordHash: passwordHash,
      role:         'DOCTOR',
      isActive:     true,
      hospitalId:   'c1',
      createdBy:    'admin_delhi',
    },
  });

  await prisma.credential.create({
    data: {
      id:           'cred_priyanka',
      label:         'Dr. Priyanka Sharma',
      username:     'priyanka',
      passwordHash: passwordHash,
      role:         'DOCTOR',
      isActive:     true,
      hospitalId:   'c2',
      createdBy:    'admin_mumbai',
    },
  });

  console.log('✅  Doctor credentials created');

  // ── 4. Create Doctor Clinical Profiles ─────────────────────────────────────
  await prisma.doctorProfile.create({
    data: {
      id:             'dp_aakansha',
      name:           'Dr. Aakansha Singh',
      specialty:      'General Physician & Internal Medicine',
      phone:          '+91 98100 00001',
      hospitalId:     'c1',
    },
  });

  await prisma.doctorProfile.create({
    data: {
      id:             'dp_rohan',
      name:           'Dr. Rohan Mehta',
      specialty:      'Cardiologist',
      phone:          '+91 98100 00002',
      hospitalId:     'c1',
    },
  });

  await prisma.doctorProfile.create({
    data: {
      id:             'dp_priyanka',
      name:           'Dr. Priyanka Sharma',
      specialty:      'Gynaecologist',
      phone:          '+91 98100 00003',
      hospitalId:     'c2',
    },
  });

  console.log('✅  Doctor clinical profiles created');

  // ── 5. Grant Profile Access Permissions ────────────────────────────────────
  await prisma.profileAccess.create({
    data: {
      credentialId:    'cred_aakansha',
      doctorProfileId: 'dp_aakansha',
      permission:      'READ_WRITE',
      grantedBy:       'admin_delhi',
    },
  });

  await prisma.profileAccess.create({
    data: {
      credentialId:    'cred_rohan',
      doctorProfileId: 'dp_rohan',
      permission:      'READ_WRITE',
      grantedBy:       'admin_delhi',
    },
  });

  await prisma.profileAccess.create({
    data: {
      credentialId:    'cred_priyanka',
      doctorProfileId: 'dp_priyanka',
      permission:      'READ_WRITE',
      grantedBy:       'admin_mumbai',
    },
  });

  console.log('✅  Doctor permissions granted');

  // ── 6. Create Receptionist Accounts (Optional) ─────────────────────────────
  await prisma.credential.create({
    data: {
      id:           'cred_receptionist_delhi',
      label:         'Delhi Front Desk',
      username:     'receptionist_delhi',
      passwordHash: passwordHash,
      role:         'RECEPTIONIST',
      isActive:     true,
      hospitalId:   'c1',
      createdBy:    'admin_delhi',
    },
  });

  await prisma.credential.create({
    data: {
      id:           'cred_receptionist_mumbai',
      label:         'Mumbai Front Desk',
      username:     'receptionist_mumbai',
      passwordHash: passwordHash,
      role:         'RECEPTIONIST',
      isActive:     true,
      hospitalId:   'c2',
      createdBy:    'admin_mumbai',
    },
  });

  console.log('✅  Receptionist credentials created');

  console.log('\n🎉  Seed complete! No patient data seeded — new users start fresh.');
  console.log('\nDemo login credentials (password: MediRecord@2025):');
  console.log('  Admin (Delhi):     admin@healthvault.in');
  console.log('  Doctor (Delhi):    aakansha   (username)');
  console.log('  Doctor (Delhi):    rohan      (username)');
  console.log('  Doctor (Mumbai):   priyanka   (username)');
  console.log('  Receptionist (DL): receptionist_delhi (username)');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
