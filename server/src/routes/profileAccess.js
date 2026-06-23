// Profile access management — admin grants/revokes credential access to doctor profiles
// GET    /api/profile-access/:credentialId          (list accesses for a credential)
// POST   /api/profile-access                        (grant access)
// PATCH  /api/profile-access/:id                   (change permission level)
// DELETE /api/profile-access/:credentialId/:profileId  (revoke)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

// ─── GET /api/profile-access/:credentialId ────────────────────────────────────

router.get('/:credentialId', authenticateAdmin, async (req, res, next) => {
  try {
    const cred = await prisma.credential.findFirst({
      where: { id: req.params.credentialId, hospitalId: req.actor.hospitalId },
    });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const accesses = await prisma.profileAccess.findMany({
      where: { credentialId: cred.id },
      include: { doctorProfile: { select: { id: true, name: true, specialty: true } } },
    });
    res.json(accesses);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/profile-access ────────────────────────────────────────────────

const GrantSchema = z.object({
  credentialId:    z.string().min(1),
  doctorProfileId: z.string().min(1),
  permission:      z.enum(['VIEW', 'READ_WRITE']),
});

router.post('/', authenticateAdmin, async (req, res, next) => {
  try {
    const data = GrantSchema.parse(req.body);

    // Verify both belong to this hospital
    const [cred, profile] = await Promise.all([
      prisma.credential.findFirst({ where: { id: data.credentialId, hospitalId: req.actor.hospitalId } }),
      prisma.doctorProfile.findFirst({ where: { id: data.doctorProfileId, hospitalId: req.actor.hospitalId } }),
    ]);
    if (!cred)    return res.status(404).json({ error: 'Credential not found' });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    // Upsert — if access already exists, update the permission
    const access = await prisma.profileAccess.upsert({
      where: { credentialId_doctorProfileId: { credentialId: data.credentialId, doctorProfileId: data.doctorProfileId } },
      update: { permission: data.permission, grantedBy: req.actor.id, grantedAt: new Date() },
      create: { ...data, grantedBy: req.actor.id },
      include: { doctorProfile: { select: { id: true, name: true } } },
    });

    await writeAudit({
      actor: req.actor, action: 'PERMISSION_GRANTED',
      target: { type: 'Credential', id: cred.id, label: cred.label },
      details: `Granted ${data.permission} on profile: ${profile.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json(access);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── DELETE /api/profile-access/:credentialId/:profileId ─────────────────────

router.delete('/:credentialId/:profileId', authenticateAdmin, async (req, res, next) => {
  try {
    const { credentialId, profileId } = req.params;

    const [cred, profile] = await Promise.all([
      prisma.credential.findFirst({ where: { id: credentialId, hospitalId: req.actor.hospitalId } }),
      prisma.doctorProfile.findFirst({ where: { id: profileId, hospitalId: req.actor.hospitalId } }),
    ]);
    if (!cred)    return res.status(404).json({ error: 'Credential not found' });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    await prisma.profileAccess.delete({
      where: { credentialId_doctorProfileId: { credentialId, doctorProfileId: profileId } },
    });

    await writeAudit({
      actor: req.actor, action: 'PERMISSION_REVOKED',
      target: { type: 'Credential', id: cred.id, label: cred.label },
      details: `Revoked access to profile: ${profile.name}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Access revoked' });
  } catch (err) {
    next(err);
  }
});

export default router;
