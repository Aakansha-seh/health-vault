// Permission request flow
// POST   /api/permission-requests                   (credential requests write access)
// GET    /api/permission-requests                   (admin: all pending; credential: own)
// PATCH  /api/permission-requests/:id/resolve       (admin approves or denies)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authenticateAdmin, authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

// ─── POST /api/permission-requests ───────────────────────────────────────────

const CreateRequestSchema = z.object({
  doctorProfileId: z.string().min(1),
  reason:          z.string().max(500).optional(),
});

router.post('/', authenticateCredential, async (req, res, next) => {
  try {
    const data = CreateRequestSchema.parse(req.body);

    // Profile must exist and belong to same hospital
    const profile = await prisma.doctorProfile.findFirst({
      where: { id: data.doctorProfileId, hospitalId: req.actor.hospitalId },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    // Must already have VIEW access (can't request write for something they can't see)
    const existing = await prisma.profileAccess.findUnique({
      where: { credentialId_doctorProfileId: { credentialId: req.actor.id, doctorProfileId: data.doctorProfileId } },
    });
    if (!existing) {
      return res.status(403).json({ error: 'You must have view access before requesting write access' });
    }
    if (existing.permission === 'READ_WRITE') {
      return res.status(400).json({ error: 'You already have write access to this profile' });
    }

    // Check for existing pending request
    const pendingRequest = await prisma.permissionRequest.findFirst({
      where: { credentialId: req.actor.id, doctorProfileId: data.doctorProfileId, status: 'PENDING' },
    });
    if (pendingRequest) {
      return res.status(409).json({ error: 'A pending request for this profile already exists' });
    }

    const request = await prisma.permissionRequest.create({
      data: {
        credentialId:    req.actor.id,
        doctorProfileId: data.doctorProfileId,
        reason:          data.reason,
      },
      include: {
        doctorProfile: { select: { id: true, name: true } },
      },
    });

    await writeAudit({
      actor: req.actor, action: 'PERMISSION_REQUEST_SENT',
      target: { type: 'DoctorProfile', id: profile.id, label: profile.name },
      details: `Requested write access. Reason: ${data.reason || 'Not specified'}`,
      ipAddress: req.ip,
    });

    res.status(201).json(request);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── GET /api/permission-requests ────────────────────────────────────────────

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.actor.type === 'admin') {
      const requests = await prisma.permissionRequest.findMany({
        where: { credential: { hospitalId: req.actor.hospitalId } },
        include: {
          credential:   { select: { id: true, label: true, username: true, role: true } },
          doctorProfile: { select: { id: true, name: true, specialty: true } },
        },
        orderBy: { requestedAt: 'desc' },
      });
      return res.json(requests);
    }

    // Credential: own requests only
    const requests = await prisma.permissionRequest.findMany({
      where: { credentialId: req.actor.id },
      include: { doctorProfile: { select: { id: true, name: true } } },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/permission-requests/:id/resolve ───────────────────────────────

const ResolveSchema = z.object({
  decision: z.enum(['APPROVED', 'DENIED']),
});

router.patch('/:id/resolve', authenticateAdmin, async (req, res, next) => {
  try {
    const { decision } = ResolveSchema.parse(req.body);

    const request = await prisma.permissionRequest.findFirst({
      where: { id: req.params.id, credential: { hospitalId: req.actor.hospitalId } },
      include: {
        credential:   { select: { id: true, label: true } },
        doctorProfile: { select: { id: true, name: true } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Permission request not found' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request has already been resolved' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.permissionRequest.update({
        where: { id: request.id },
        data: { status: decision, resolvedAt: new Date(), resolvedBy: req.actor.id },
      });

      // If approved, upgrade the ProfileAccess to READ_WRITE
      if (decision === 'APPROVED') {
        await tx.profileAccess.update({
          where: {
            credentialId_doctorProfileId: {
              credentialId:    request.credentialId,
              doctorProfileId: request.doctorProfileId,
            },
          },
          data: { permission: 'READ_WRITE', grantedBy: req.actor.id, grantedAt: new Date() },
        });
      }
    });

    const action = decision === 'APPROVED'
      ? 'PERMISSION_REQUEST_APPROVED'
      : 'PERMISSION_REQUEST_DENIED';

    await writeAudit({
      actor: req.actor, action,
      target: { type: 'Credential', id: request.credentialId, label: request.credential.label },
      details: `${decision} write access to profile: ${request.doctorProfile.name}`,
      ipAddress: req.ip,
    });

    res.json({ message: `Request ${decision.toLowerCase()}` });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
