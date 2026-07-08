// Patients routes
import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';
import { sendPatientInvite, emailConfigured } from '../lib/email.js';

const router = Router();

// ─── Patient portal accounts ─────────────────────────────────────────────────

// What staff UIs need to know about a patient's portal account. NEVER include
// passwordHash here.
const accountSelect = {
  id: true, username: true, isActive: true, mustChangePassword: true,
  invitedAt: true, lastLoginAt: true,
};

// Patient-uploaded documents shown on the staff side.
const patientFilesInclude = {
  where:   { source: 'PATIENT' },
  orderBy: { createdAt: 'desc' },
  select:  { id: true, fileName: true, type: true, reportType: true, createdAt: true },
};

const usernameSlug = (name) =>
  (String(name).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'patient').slice(0, 20);

// Reserve a portal username at registration time. The password is NOT set here —
// it is generated when staff presses "Invite" and emailed to the patient.
// Never throws: a portal-account hiccup must not break patient registration.
async function ensurePatientAccount(db, patient) {
  try {
    const existing = await db.patientAccount.findUnique({ where: { patientId: patient.id } });
    if (existing) return existing;
    const slug = usernameSlug(patient.name);
    for (let attempt = 0; attempt < 6; attempt++) {
      const username = `${slug}.${crypto.randomInt(1000, 10000)}`;
      try {
        return await db.patientAccount.create({
          data: { patientId: patient.id, hospitalId: patient.hospitalId, username },
        });
      } catch (err) {
        if (err?.code !== 'P2002') throw err;   // retry only on username collision
      }
    }
    console.error(`[PatientAccount] Could not find a free username for patient ${patient.id}`);
    return null;
  } catch (err) {
    console.error('[PatientAccount] auto-create failed:', err.message);
    return null;
  }
}

// Unambiguous temporary password (no 0/O, 1/l/I).
function generateTempPassword(len = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(len), (b) => chars[b % chars.length]).join('');
}

const PatientSchema = z.object({
  name:           z.string().min(2),
  dob:            z.string().optional(),
  gender:         z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
  phone:          z.string().optional(),
  email:          z.string().email().optional().or(z.literal('')),
  bloodGroup:     z.string().optional(),
  address:        z.string().optional(),
  allergies:      z.string().optional(),
  medicalHistory: z.string().optional(),
});

// Drop empty strings / undefined so optional columns stay null and enum
// columns (gender) never receive '' (which Postgres would reject).
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));

// A DOCTOR credential may only see patients linked (via a visit or appointment)
// to a doctor profile the admin has granted them access to. Admins and
// receptionists are not profile-restricted (admins = full hospital; receptionists
// = front desk for the whole hospital).
const isRestrictedDoctor = (actor) => actor.type === 'credential' && actor.role === 'DOCTOR';

async function accessibleProfileIds(actor) {
  const accesses = await prisma.profileAccess.findMany({
    where: { credentialId: actor.id },
    select: { doctorProfileId: true },
  });
  return accesses.map((a) => a.doctorProfileId);
}

// A doctor may edit a patient only if they hold READ_WRITE on at least one
// profile the patient is linked to (via a visit or appointment).
async function doctorCanWritePatient(credentialId, patientId) {
  const rw = await prisma.profileAccess.findMany({
    where: { credentialId, permission: 'READ_WRITE' },
    select: { doctorProfileId: true },
  });
  const ids = rw.map((a) => a.doctorProfileId);
  if (!ids.length) return false;
  const linked = await prisma.patient.findFirst({
    where: {
      id: patientId,
      OR: [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ],
    },
    select: { id: true },
  });
  return !!linked;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = { hospitalId: req.actor.hospitalId };
    const and = [];

    if (search) {
      and.push({ OR: [
        { name:  { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]});
    }

    // Permission scoping: restrict doctors to their granted profiles.
    let visitWhere; // also filter the visits we return so other doctors' notes stay hidden
    if (isRestrictedDoctor(req.actor)) {
      const ids = await accessibleProfileIds(req.actor);
      and.push({ OR: [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ]});
      visitWhere = { doctorProfileId: { in: ids } };
    }

    if (and.length) where.AND = and;

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          visits: {
            where: visitWhere,
            orderBy: { date: 'desc' },
            take: 5,
            include: { doctorProfile: { select: { id: true, name: true } } },
          },
          account:     { select: accountSelect },
          attachments: patientFilesInclude,
        },
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({ patients, total, page: parseInt(page, 10), pages: Math.ceil(total / take) });
  } catch (err) { next(err); }
});

// A doctor may only register patients if they hold READ_WRITE on at least one
// profile. Receptionists (front desk) always may. Read-only doctors may not.
async function doctorHasWriteAccess(credentialId) {
  const rw = await prisma.profileAccess.findFirst({
    where: { credentialId, permission: 'READ_WRITE' },
    select: { id: true },
  });
  return !!rw;
}

router.post('/', authenticateCredential, async (req, res, next) => {
  try {
    if (req.actor.role === 'DOCTOR' && !(await doctorHasWriteAccess(req.actor.id))) {
      return res.status(403).json({ error: 'Read-only access — you cannot register patients. Ask your administrator for write access.' });
    }
    const data = PatientSchema.parse(req.body);
    const patient = await prisma.patient.create({
      data: { ...clean(data), hospitalId: req.actor.hospitalId, registeredBy: req.actor.id },
    });
    const account = await ensurePatientAccount(prisma, patient);
    if (account) patient.account = { ...account, passwordHash: undefined };
    await writeAudit({
      actor: req.actor, action: 'PATIENT_CREATED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      ipAddress: req.ip,
    });
    res.status(201).json(patient);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── POST /api/patients/intake ───────────────────────────────────────────────
// Front-desk walk-in: create patient + first clinical visit + optional next
// appointment in ONE transaction. Any credential in the hospital (incl.
// receptionists) may record this; the assigned doctor profile just has to belong
// to the same hospital. Report files are uploaded to Azure first, then their
// blob URLs are passed here in `testReports`.
const ReportSchema = z.object({
  name:       z.string(),
  url:        z.string().min(1),   // relative path (/api/uploads/file/..) — not a full URL
  type:       z.string().optional().default('application/octet-stream'),
  reportType: z.string().optional(),
});

const IntakeSchema = z.object({
  // Patient
  name:            z.string().min(2, 'Patient name required'),
  phone:           z.string().optional(),
  gender:          z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
  age:             z.coerce.number().int().positive().max(150).optional(),
  weight:          z.coerce.number().positive().max(1000).optional(),
  bloodGroup:      z.string().optional(),
  allergies:       z.string().optional(),
  address:         z.string().optional(),
  email:           z.string().email().optional().or(z.literal('')),
  // Clinical visit
  doctorProfileId: z.string().min(1, 'Doctor required'),
  symptoms:        z.string().min(1, 'Symptoms required'),
  diagnosis:       z.string().optional(),
  prescription:    z.string().optional(),
  testsPrescribed: z.string().optional(),
  notes:           z.string().optional(),
  testReports:     z.array(ReportSchema).optional(),
  // Next appointment (optional)
  appointmentDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  appointmentTime:   z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  appointmentReason: z.string().optional(),
});

router.post('/intake', authenticateCredential, async (req, res, next) => {
  try {
    const data = IntakeSchema.parse(req.body);

    if (req.actor.role === 'DOCTOR' && !(await doctorHasWriteAccess(req.actor.id))) {
      return res.status(403).json({ error: 'Read-only access — you cannot register patients. Ask your administrator for write access.' });
    }

    const profile = await prisma.doctorProfile.findFirst({
      where: { id: data.doctorProfileId, hospitalId: req.actor.hospitalId },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found in your hospital' });

    const hasAppt = !!(data.appointmentDate && data.appointmentTime);
    if (hasAppt) {
      const when = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      if (when < new Date()) return res.status(400).json({ error: 'Next appointment cannot be in the past' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          ...clean({
            name: data.name, phone: data.phone, gender: data.gender, age: data.age,
            bloodGroup: data.bloodGroup, allergies: data.allergies, address: data.address, email: data.email,
          }),
          hospitalId:   req.actor.hospitalId,
          registeredBy: req.actor.id,
        },
      });

      const visit = await tx.visit.create({
        data: {
          patientId:       patient.id,
          doctorProfileId: data.doctorProfileId,
          date:            new Date(),
          chiefComplaint:  data.symptoms,
          weight:          data.weight ?? null,
          diagnosis:       data.diagnosis || null,
          prescription:    data.prescription || null,
          testsPrescribed: data.testsPrescribed || null,
          notes:           data.notes || null,
          testReports:     data.testReports ?? [],
          createdBy:       req.actor.id,
        },
        include: { doctorProfile: { select: { id: true, name: true } } },
      });

      let appointment = null;
      if (hasAppt) {
        appointment = await tx.appointment.create({
          data: {
            patientId:       patient.id,
            doctorProfileId: data.doctorProfileId,
            hospitalId:      req.actor.hospitalId,
            date:            data.appointmentDate,
            time:            data.appointmentTime,
            reason:          (data.appointmentReason || '').trim() || 'Follow-up',
            createdBy:       req.actor.id,
          },
          include: { doctorProfile: { select: { id: true, name: true } } },
        });
      }

      return { patient, visit, appointment };
    });

    // Auto-reserve a portal username (outside the transaction — non-critical).
    const account = await ensurePatientAccount(prisma, result.patient);
    if (account) result.patient.account = { ...account, passwordHash: undefined };

    await writeAudit({
      actor: req.actor, action: 'PATIENT_CREATED',
      target: { type: 'Patient', id: result.patient.id, label: result.patient.name },
      details: `Walk-in intake under ${profile.name}${result.appointment ? ' + next appointment' : ''}`,
      ipAddress: req.ip,
    });

    // Return the patient with its visit nested, matching the shape the UI expects
    res.status(201).json({ ...result.patient, visits: [result.visit], appointment: result.appointment });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const where = { id: req.params.id, hospitalId: req.actor.hospitalId };
    let visitWhere;

    // Doctors can only open a patient linked to a profile they're granted.
    if (isRestrictedDoctor(req.actor)) {
      const ids = await accessibleProfileIds(req.actor);
      where.OR = [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ];
      visitWhere = { doctorProfileId: { in: ids } };
    }

    const patient = await prisma.patient.findFirst({
      where,
      include: {
        visits: {
          where: visitWhere,
          orderBy: { date: 'desc' },
          include: { doctorProfile: { select: { id: true, name: true } } },
        },
        account:     { select: accountSelect },
        attachments: patientFilesInclude,
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) { next(err); }
});

const UpdatePatientSchema = PatientSchema.partial().extend({
  isReturning: z.boolean().optional(),
});

router.patch('/:id', authenticateCredential, async (req, res, next) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Read-only doctors cannot edit. (Receptionists = front desk; admins use other routes.)
    if (req.actor.role === 'DOCTOR') {
      const canWrite = await doctorCanWritePatient(req.actor.id, patient.id);
      if (!canWrite) {
        return res.status(403).json({ error: 'Read-only access — you cannot edit this patient. Request write access from your administrator.' });
      }
    }

    const data = UpdatePatientSchema.parse(req.body);
    const updated = await prisma.patient.update({ where: { id: patient.id }, data: clean(data) });
    await writeAudit({
      actor: req.actor, action: 'PATIENT_UPDATED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      ipAddress: req.ip,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── Patient portal: invite & access control ─────────────────────────────────

// POST /api/patients/:id/invite — generate a temporary password, email the
// portal credentials to the patient, and (re)activate their account.
// Any staff member (admin, receptionist, doctor) of the hospital may invite.
// Optional body { email } sets/updates the patient's email in the same step.
const InviteSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
});

router.post('/:id/invite', authenticate, async (req, res, next) => {
  try {
    if (!emailConfigured()) {
      return res.status(503).json({ error: 'Email is not configured on the server. Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env.' });
    }
    const { email: newEmail } = InviteSchema.parse(req.body ?? {});

    let patient = await prisma.patient.findFirst({
      where:   { id: req.params.id, hospitalId: req.actor.hospitalId },
      include: { hospital: { select: { name: true } } },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (newEmail && newEmail !== patient.email) {
      patient = await prisma.patient.update({
        where: { id: patient.id }, data: { email: newEmail },
        include: { hospital: { select: { name: true } } },
      });
    }
    if (!patient.email) {
      return res.status(400).json({ error: 'This patient has no email address on file. Add one to send the invite.' });
    }

    const account = await ensurePatientAccount(prisma, patient);
    if (!account) return res.status(500).json({ error: 'Could not create the portal account. Please try again.' });

    // Rotate the temporary password on every (re)invite; force a change on login.
    const tempPassword = generateTempPassword();
    await prisma.patientAccount.update({
      where: { id: account.id },
      data: {
        passwordHash: await bcrypt.hash(tempPassword, 12),
        mustChangePassword: true,
        isActive: true,
        invitedAt: new Date(),
      },
    });

    try {
      await sendPatientInvite({
        to:           patient.email,
        patientName:  patient.name,
        hospitalName: patient.hospital.name,
        username:     account.username,
        tempPassword,
      });
    } catch (mailErr) {
      console.error('[Invite] email send failed:', mailErr.message);
      return res.status(502).json({ error: 'The invite email could not be sent. Check the Gmail settings and press Invite again.' });
    }

    await writeAudit({
      actor: req.actor, action: 'PATIENT_INVITED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      details: `Portal credentials emailed to ${patient.email}`,
      ipAddress: req.ip,
    });

    const fresh = await prisma.patientAccount.findUnique({ where: { id: account.id }, select: accountSelect });
    res.json({ message: `Invite sent to ${patient.email}`, account: fresh });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// POST /api/patients/:id/portal-access — { active: boolean } revoke/restore
// the patient's portal login. Staff only.
const PortalAccessSchema = z.object({ active: z.boolean() });

router.post('/:id/portal-access', authenticate, async (req, res, next) => {
  try {
    const { active } = PortalAccessSchema.parse(req.body);
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
      select: { id: true, name: true },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const account = await prisma.patientAccount.findUnique({ where: { patientId: patient.id } });
    if (!account) return res.status(404).json({ error: 'This patient has no portal account yet' });

    const updated = await prisma.patientAccount.update({
      where: { id: account.id }, data: { isActive: active }, select: accountSelect,
    });
    await writeAudit({
      actor: req.actor, action: active ? 'PATIENT_ACCESS_REACTIVATED' : 'PATIENT_ACCESS_REVOKED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      ipAddress: req.ip,
    });
    res.json({ account: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── POST /api/patients/:id/ai-summary — save a generated AI summary onto the
// patient's record (latest-only; overwrites any previous saved summary). ──────
const SaveAISummarySchema = z.object({
  summary: z.string().min(1),
  model:   z.string().optional(),
});

router.post('/:id/ai-summary', authenticateCredential, async (req, res, next) => {
  try {
    const where = { id: req.params.id, hospitalId: req.actor.hospitalId };
    // Doctors may only save to patients linked to a profile they can access.
    if (isRestrictedDoctor(req.actor)) {
      const ids = await accessibleProfileIds(req.actor);
      where.OR = [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ];
    }
    const patient = await prisma.patient.findFirst({ where, select: { id: true, name: true } });
    if (!patient) return res.status(404).json({ error: 'Patient not found or you do not have access to it' });

    const { summary, model } = SaveAISummarySchema.parse(req.body);
    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data:  { aiSummary: summary, aiSummaryModel: model || null, aiSummaryAt: new Date() },
      select: { id: true, aiSummary: true, aiSummaryModel: true, aiSummaryAt: true },
    });

    await writeAudit({
      actor: req.actor, action: 'AI_SUMMARY_GENERATED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      details: `AI summary saved to record${model ? ` (${model})` : ''}`,
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
