// Credentials — admin manages login accounts for doctors and receptionists
// GET    /api/credentials
// POST   /api/credentials
// PATCH  /api/credentials/:id
// DELETE /api/credentials/:id  (soft-delete: sets isActive=false)
// POST   /api/credentials/:id/reset-password

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

// ─── GET /api/credentials ─────────────────────────────────────────────────────

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const credentials = await prisma.credential.findMany({
      where: { hospitalId: req.actor.hospitalId },
      select: {
        id: true, label: true, username: true, role: true,
        isActive: true, createdAt: true, lastLoginAt: true,
        profileAccesses: {
          include: { doctorProfile: { select: { id: true, name: true, specialty: true } } },
        },
        subscription: { select: { tier: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(credentials);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/credentials ────────────────────────────────────────────────────

const CreateCredentialSchema = z.object({
  label:    z.string().min(2, 'Label required'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters')
              .regex(/^[a-zA-Z0-9._@+-]+$/, 'Username may only contain letters, numbers, and . _ @ + -'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['DOCTOR', 'RECEPTIONIST']),
  // Optional: immediately grant profile access on creation
  profileAccesses: z.array(z.object({
    doctorProfileId: z.string(),
    permission:      z.enum(['VIEW', 'READ_WRITE']),
  })).optional(),
});

router.post('/', authenticateAdmin, async (req, res, next) => {
  try {
    const data = CreateCredentialSchema.parse(req.body);

    const existing = await prisma.credential.findUnique({ where: { username: data.username } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    // Display name (label) must be unique within the hospital
    const dupLabel = await prisma.credential.findFirst({
      where: { hospitalId: req.actor.hospitalId, label: { equals: data.label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dupLabel) return res.status(409).json({ error: 'A credential with this display name already exists' });

    // Validate profile IDs belong to this hospital
    if (data.profileAccesses?.length) {
      const profiles = await prisma.doctorProfile.findMany({
        where: {
          id:         { in: data.profileAccesses.map(p => p.doctorProfileId) },
          hospitalId: req.actor.hospitalId,
        },
        select: { id: true },
      });
      if (profiles.length !== data.profileAccesses.length) {
        return res.status(400).json({ error: 'One or more doctor profiles not found in this hospital' });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const credential = await prisma.$transaction(async (tx) => {
      const cred = await tx.credential.create({
        data: {
          label:        data.label,
          username:     data.username,
          passwordHash,
          role:         data.role,
          hospitalId:   req.actor.hospitalId,
          createdBy:    req.actor.id,
        },
      });

      // Create Subscription (FREE by default)
      await tx.subscription.create({ data: { credentialId: cred.id } });

      // Grant profile accesses if provided
      if (data.profileAccesses?.length) {
        await tx.profileAccess.createMany({
          data: data.profileAccesses.map(pa => ({
            credentialId:    cred.id,
            doctorProfileId: pa.doctorProfileId,
            permission:      pa.permission,
            grantedBy:       req.actor.id,
          })),
        });
      }

      return cred;
    });

    await writeAudit({
      actor: req.actor,
      action: 'CREDENTIAL_CREATED',
      target: { type: 'Credential', id: credential.id, label: credential.label },
      details: `Created ${data.role} credential: ${data.username}`,
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safe } = credential;
    return res.status(201).json(safe);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── PATCH /api/credentials/:id ──────────────────────────────────────────────

const UpdateCredentialSchema = z.object({
  label:    z.string().min(2).optional(),
  isActive: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field required' });

router.patch('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const cred = await prisma.credential.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const data = UpdateCredentialSchema.parse(req.body);

    if (data.label !== undefined) {
      const dupLabel = await prisma.credential.findFirst({
        where: {
          hospitalId: req.actor.hospitalId,
          id: { not: cred.id },
          label: { equals: data.label, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (dupLabel) return res.status(409).json({ error: 'Another credential with this display name already exists' });
    }

    const updated = await prisma.credential.update({ where: { id: cred.id }, data });

    const action = data.isActive === false ? 'CREDENTIAL_REVOKED'
                 : data.isActive === true  ? 'CREDENTIAL_REACTIVATED'
                 : 'CREDENTIAL_UPDATED';

    await writeAudit({
      actor: req.actor, action,
      target: { type: 'Credential', id: cred.id, label: cred.label },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── POST /api/credentials/:id/reset-password ────────────────────────────────

const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/:id/reset-password', authenticateAdmin, async (req, res, next) => {
  try {
    const cred = await prisma.credential.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const { newPassword } = ResetPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.credential.update({ where: { id: cred.id }, data: { passwordHash } });

    await writeAudit({
      actor: req.actor,
      action: 'CREDENTIAL_UPDATED',
      target: { type: 'Credential', id: cred.id, label: cred.label },
      details: 'Password reset by admin',
      ipAddress: req.ip,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
