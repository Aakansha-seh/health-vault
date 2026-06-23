// Doctor profile routes
// GET    /api/doctor-profiles          (admin: all; credential: only accessible ones)
// POST   /api/doctor-profiles          (admin only)
// GET    /api/doctor-profiles/:id      (admin or credentialed access)
// PATCH  /api/doctor-profiles/:id      (admin only)
// DELETE /api/doctor-profiles/:id      (admin only)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authenticateAdmin, authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

const ProfileSchema = z.object({
  name:          z.string().min(2),
  specialty:     z.string().min(2),
  qualification: z.string().optional(),
  registration:  z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email().optional().or(z.literal('')),
  bio:           z.string().optional(),
});

// Returns the name of the first field that clashes with an existing profile in
// the same hospital, or null if the profile is unique. name/email are matched
// case-insensitively; phone/registration exactly. Empty values are not checked.
async function findProfileConflict(hospitalId, data, excludeId = null) {
  const checks = [
    ['name',         data.name,         true],
    ['email',        data.email,        true],
    ['phone',        data.phone,        false],
    ['registration', data.registration, false],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  for (const [field, value, insensitive] of checks) {
    const clash = await prisma.doctorProfile.findFirst({
      where: {
        hospitalId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        [field]: insensitive ? { equals: value, mode: 'insensitive' } : value,
      },
      select: { id: true },
    });
    if (clash) return field;
  }
  return null;
}

const FIELD_LABEL = { name: 'name', email: 'email address', phone: 'phone number', registration: 'registration number' };

// ─── GET /api/doctor-profiles ─────────────────────────────────────────────────

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.actor.type === 'admin') {
      const profiles = await prisma.doctorProfile.findMany({
        where: { hospitalId: req.actor.hospitalId },
        include: {
          profileAccesses: {
            include: { credential: { select: { id: true, label: true, role: true, isActive: true } } },
          },
        },
        orderBy: { name: 'asc' },
      });
      return res.json(profiles);
    }

    // Receptionists don't get per-profile access grants, but they must be able to
    // assign a doctor at intake — so return a lightweight list of all hospital profiles.
    if (req.actor.role === 'RECEPTIONIST') {
      const profiles = await prisma.doctorProfile.findMany({
        where: { hospitalId: req.actor.hospitalId },
        select: { id: true, name: true, specialty: true },
        orderBy: { name: 'asc' },
      });
      return res.json(profiles);
    }

    // Doctor credential: return only profiles they have access to
    const accesses = await prisma.profileAccess.findMany({
      where: { credentialId: req.actor.id },
      include: {
        doctorProfile: {
          include: {
            visits: {
              orderBy: { date: 'desc' },
              take: 5,
              include: { patient: { select: { id: true, name: true, age: true, gender: true } } },
            },
          },
        },
      },
    });
    return res.json(accesses.map(a => ({ ...a.doctorProfile, permission: a.permission })));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/doctor-profiles ───────────────────────────────────────────────

router.post('/', authenticateAdmin, async (req, res, next) => {
  try {
    const data = ProfileSchema.parse(req.body);

    const conflict = await findProfileConflict(req.actor.hospitalId, data);
    if (conflict) {
      return res.status(409).json({ error: `A doctor profile with this ${FIELD_LABEL[conflict]} already exists` });
    }

    const profile = await prisma.doctorProfile.create({
      data: { ...data, hospitalId: req.actor.hospitalId },
    });
    await writeAudit({
      actor: req.actor, action: 'DOCTOR_PROFILE_UPDATED',
      target: { type: 'DoctorProfile', id: profile.id, label: profile.name },
      details: 'Doctor profile created',
      ipAddress: req.ip,
    });
    res.status(201).json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── GET /api/doctor-profiles/:id ────────────────────────────────────────────

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.doctorProfile.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
      include: {
        visits: {
          orderBy: { date: 'desc' },
          include: { patient: { select: { id: true, name: true, age: true, gender: true } } },
        },
        appointments: {
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          include: { patient: { select: { id: true, name: true, age: true } } },
        },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    // For credentials, verify they have access
    if (req.actor.type === 'credential') {
      const access = await prisma.profileAccess.findUnique({
        where: { credentialId_doctorProfileId: { credentialId: req.actor.id, doctorProfileId: profile.id } },
      });
      if (!access) return res.status(403).json({ error: 'You do not have access to this profile' });
      await writeAudit({
        actor: req.actor, action: 'VISIT_VIEWED',
        target: { type: 'DoctorProfile', id: profile.id, label: profile.name },
        ipAddress: req.ip,
      });
      return res.json({ ...profile, permission: access.permission });
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/doctor-profiles/:id ──────────────────────────────────────────

const UpdateProfileSchema = ProfileSchema.partial().refine(
  d => Object.keys(d).length > 0, { message: 'At least one field required' }
);

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.doctorProfile.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    // Credentials need READ_WRITE permission
    if (req.actor.type === 'credential') {
      const access = await prisma.profileAccess.findUnique({
        where: { credentialId_doctorProfileId: { credentialId: req.actor.id, doctorProfileId: profile.id } },
      });
      if (!access || access.permission !== 'READ_WRITE') {
        return res.status(403).json({ error: 'Write access required. Request it from your administrator.' });
      }
    }

    const data = UpdateProfileSchema.parse(req.body);

    const conflict = await findProfileConflict(req.actor.hospitalId, data, profile.id);
    if (conflict) {
      return res.status(409).json({ error: `Another doctor profile with this ${FIELD_LABEL[conflict]} already exists` });
    }

    const updated = await prisma.doctorProfile.update({ where: { id: profile.id }, data });

    await writeAudit({
      actor: req.actor, action: 'DOCTOR_PROFILE_UPDATED',
      target: { type: 'DoctorProfile', id: profile.id, label: profile.name },
      ipAddress: req.ip,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── DELETE /api/doctor-profiles/:id ─────────────────────────────────────────

router.delete('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const profile = await prisma.doctorProfile.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    await prisma.doctorProfile.delete({ where: { id: profile.id } });

    await writeAudit({
      actor: req.actor, action: 'DOCTOR_PROFILE_UPDATED',
      target: { type: 'DoctorProfile', id: profile.id, label: profile.name },
      details: 'Doctor profile deleted',
      ipAddress: req.ip,
    });
    res.json({ message: 'Doctor profile deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
