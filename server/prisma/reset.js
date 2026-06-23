// Wipes ALL rows from every table (keeps the schema). Run: npm run db:wipe
// Deletes in FK-safe order (children before parents).
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

const steps = [
  ['audit logs',          () => prisma.auditLog.deleteMany()],
  ['AI usage',            () => prisma.aIUsage.deleteMany()],
  ['visits',              () => prisma.visit.deleteMany()],
  ['appointments',        () => prisma.appointment.deleteMany()],
  ['profile accesses',    () => prisma.profileAccess.deleteMany()],
  ['permission requests', () => prisma.permissionRequest.deleteMany()],
  ['subscriptions',       () => prisma.subscription.deleteMany()],
  ['patients',            () => prisma.patient.deleteMany()],
  ['doctor profiles',     () => prisma.doctorProfile.deleteMany()],
  ['credentials',         () => prisma.credential.deleteMany()],
  ['admins',              () => prisma.admin.deleteMany()],
  ['hospitals',           () => prisma.hospital.deleteMany()],
];

async function main() {
  console.log('⚠️  Wiping all data from the database…');
  for (const [label, run] of steps) {
    const { count } = await run();
    console.log(`  • cleared ${count} ${label}`);
  }
  console.log('✅ Database emptied (schema preserved).');
}

main()
  .catch((e) => { console.error('Reset failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
