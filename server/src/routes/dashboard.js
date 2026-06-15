// Dashboard routes — derived stats, no extra table
// GET /api/dashboard/stats
// GET /api/dashboard/chart
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/stats
// Returns: { totalPatients, newThisMonth, returningThisMonth, upcomingAppointments }
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { clinicId } = req.user;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total patients in clinic
    const totalPatients = await prisma.patient.count({
      where: { clinicId },
    });

    // New patients this month (not returning, created this month)
    const newThisMonth = await prisma.patient.count({
      where: {
        clinicId,
        isReturning: false,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Returning patients who had a visit this month
    const returningThisMonth = await prisma.visit.count({
      where: {
        patient: { clinicId, isReturning: true },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Upcoming appointments (scheduled, date >= today)
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        status: 'scheduled',
        date: { gte: todayStr },
      },
    });

    res.json({ totalPatients, newThisMonth, returningThisMonth, upcomingAppointments });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/chart
// Returns last 6 months visit data: [{ month: 'Jan 2026', newPts: N, returning: M }, ...]
router.get('/chart', authenticate, async (req, res, next) => {
  try {
    const { clinicId } = req.user;
    const now = new Date();
    const results = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      // New patients created in this month (not returning at time of visit — approximated by isReturning flag)
      const newPts = await prisma.visit.count({
        where: {
          patient: { clinicId, isReturning: false },
          date: { gte: start, lte: end },
        },
      });

      // Returning patients who visited this month
      const returning = await prisma.visit.count({
        where: {
          patient: { clinicId, isReturning: true },
          date: { gte: start, lte: end },
        },
      });

      results.push({ month: monthLabel, newPts, returning });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
