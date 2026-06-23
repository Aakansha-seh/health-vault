// Dashboard routes
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const hId = req.actor.hospitalId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // A DOCTOR sees only their granted profiles — optionally narrowed to one via
    // ?profileId. Receptionists/admins are hospital-wide (no profile scoping).
    const { profileId } = req.query;
    let profileFilter = {};   // for visits/appointments (by doctorProfileId)
    let patientScope   = {};   // for patient counts (linked via visit/appointment)
    if (req.actor.type === 'credential' && req.actor.role === 'DOCTOR') {
      const accesses = await prisma.profileAccess.findMany({
        where: { credentialId: req.actor.id },
        select: { doctorProfileId: true },
      });
      let ids = accesses.map(a => a.doctorProfileId);
      if (profileId && ids.includes(profileId)) ids = [profileId]; // selected profile only
      profileFilter = { doctorProfileId: { in: ids } };
      patientScope  = { OR: [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ]};
    }

    const [totalPatients, newThisMonth, visitsThisMonth, upcomingAppointments] = await Promise.all([
      prisma.patient.count({ where: { hospitalId: hId, ...patientScope } }),
      prisma.patient.count({ where: { hospitalId: hId, ...patientScope, createdAt: { gte: startOfMonth } } }),
      prisma.visit.count({ where: { patient: { hospitalId: hId }, ...profileFilter, date: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { hospitalId: hId, ...profileFilter, status: 'scheduled', date: { gte: now.toISOString().split('T')[0] } } }),
    ]);

    let pendingRequests = 0;
    if (req.actor.type === 'admin') {
      pendingRequests = await prisma.permissionRequest.count({
        where: { credential: { hospitalId: hId }, status: 'PENDING' },
      });
    }

    res.json({ totalPatients, newThisMonth, visitsThisMonth, upcomingAppointments, pendingRequests });
  } catch (err) { next(err); }
});

router.get('/chart', authenticate, async (req, res, next) => {
  try {
    const hId = req.actor.hospitalId;
    const now = new Date();
    const results = [];

    const { profileId } = req.query;
    let profileFilter = {};
    let patientScope   = {};
    if (req.actor.type === 'credential' && req.actor.role === 'DOCTOR') {
      const accesses = await prisma.profileAccess.findMany({
        where: { credentialId: req.actor.id },
        select: { doctorProfileId: true },
      });
      let ids = accesses.map(a => a.doctorProfileId);
      if (profileId && ids.includes(profileId)) ids = [profileId];
      profileFilter = { doctorProfileId: { in: ids } };
      patientScope  = { OR: [
        { visits:       { some: { doctorProfileId: { in: ids } } } },
        { appointments: { some: { doctorProfileId: { in: ids } } } },
      ]};
    }

    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      const [newPatients, count] = await Promise.all([
        prisma.patient.count({ where: { hospitalId: hId, ...patientScope, createdAt: { gte: start, lte: end } } }),
        prisma.visit.count({ where: { patient: { hospitalId: hId }, ...profileFilter, date: { gte: start, lte: end } } }),
      ]);
      results.push({ month: label, label, newPatients, count });
    }

    res.json({ data: results });
  } catch (err) { next(err); }
});

export default router;
