// Audit log routes
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { action, page = '1', limit = '100' } = req.query;
    const take = Math.min(parseInt(limit, 10) || 100, 500);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = { hospitalId: req.actor.hospitalId };
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take, skip,
        include: {
          credential: { select: { id: true, username: true, label: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page, 10), pages: Math.ceil(total / take) });
  } catch (err) { next(err); }
});

export default router;
