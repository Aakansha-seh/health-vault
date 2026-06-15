// Audit log routes — clinic-scoped
// GET /api/audit
// POST /api/audit
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const VALID_ACTIONS = [
  'LOGIN', 'LOGOUT', 'LOCK_SESSION', 'VIEW_PATIENT', 'ADD_PATIENT',
  'UPDATE_PATIENT', 'ADD_VISIT', 'EDIT_VISIT', 'ADD_APPOINTMENT',
  'UPDATE_APPOINTMENT', 'COMPLETE_APPOINTMENT', 'CANCEL_APPOINTMENT',
  'GCAL_SYNC', 'PRINT_PRESCRIPTION', 'EDIT_PROFILE',
];

const CreateAuditSchema = z.object({
  action: z.enum(VALID_ACTIONS, { required_error: 'Action required' }),
  details: z.string().optional(),
});

// GET /api/audit — all audit entries for current clinic, newest first (max 500)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { action, doctorId, limit = '100' } = req.query;
    const where = { clinicId: req.user.clinicId };
    if (action && VALID_ACTIONS.includes(action)) where.action = action;
    if (doctorId) where.doctorId = doctorId;

    const take = Math.min(parseInt(limit, 10) || 100, 500);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take,
      include: {
        doctor: { select: { id: true, name: true, specialisation: true } },
      },
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// POST /api/audit — frontend-driven audit entry
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { action, details } = CreateAuditSchema.parse(req.body);

    const log = await prisma.auditLog.create({
      data: {
        doctorId: req.user.doctorId,
        doctorName: req.user.doctorName,
        clinicId: req.user.clinicId,
        action,
        details,
      },
    });

    res.status(201).json(log);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
