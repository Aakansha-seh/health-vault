// Admin routes — hospital admin management
// POST /api/admin/register        (create first admin for a hospital — one-time setup)
// GET  /api/admin/hospital        (get own hospital details)
// PATCH /api/admin/hospital       (update hospital details)
// GET  /api/admin/stats           (hospital-wide stats)

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

// ─── One-time hospital + admin registration ───────────────────────────────────
// This is called during hospital onboarding. No auth required.
// After first admin is created, this endpoint is locked per hospital (by email uniqueness).

const RegisterSchema = z.object({
  hospitalName:    z.string().min(2),
  hospitalAddress: z.string().min(5),
  hospitalPhone:   z.string().min(6),
  hospitalEmail:   z.string().email(),
  adminName:       z.string().min(2),
  adminEmail:      z.string().email(),
  adminPassword:   z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);

    // Check hospital email not already taken
    const existingHospital = await prisma.hospital.findUnique({ where: { email: data.hospitalEmail } });
    if (existingHospital) {
      return res.status(409).json({ error: 'A hospital with this email already exists' });
    }

    // Check admin email not already taken
    const existingAdmin = await prisma.admin.findUnique({ where: { email: data.adminEmail } });
    if (existingAdmin) {
      return res.status(409).json({ error: 'An admin with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(data.adminPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name:    data.hospitalName,
          address: data.hospitalAddress,
          phone:   data.hospitalPhone,
          email:   data.hospitalEmail,
        },
      });

      const admin = await tx.admin.create({
        data: {
          name:         data.adminName,
          email:        data.adminEmail,
          passwordHash,
          hospitalId:   hospital.id,
        },
      });

      return { hospital, admin };
    });

    const { passwordHash: _, ...safeAdmin } = result.admin;
    return res.status(201).json({
      message:  'Hospital and admin account created successfully',
      hospital: result.hospital,
      admin:    safeAdmin,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── GET /api/admin/hospital ──────────────────────────────────────────────────

router.get('/hospital', authenticateAdmin, async (req, res, next) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.actor.hospitalId },
    });
    res.json(hospital);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/hospital ────────────────────────────────────────────────

const UpdateHospitalSchema = z.object({
  name:    z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone:   z.string().min(6).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field required' });

router.patch('/hospital', authenticateAdmin, async (req, res, next) => {
  try {
    const data = UpdateHospitalSchema.parse(req.body);
    const hospital = await prisma.hospital.update({
      where: { id: req.actor.hospitalId },
      data,
    });
    await writeAudit({ actor: req.actor, action: 'DOCTOR_PROFILE_UPDATED', details: 'Hospital details updated', ipAddress: req.ip });
    res.json(hospital);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

router.get('/stats', authenticateAdmin, async (req, res, next) => {
  try {
    const hId = req.actor.hospitalId;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalCredentials, activeCredentials, totalDoctorProfiles, totalPatients, visitsThisMonth, pendingRequests] =
      await Promise.all([
        prisma.credential.count({ where: { hospitalId: hId } }),
        prisma.credential.count({ where: { hospitalId: hId, isActive: true } }),
        prisma.doctorProfile.count({ where: { hospitalId: hId } }),
        prisma.patient.count({ where: { hospitalId: hId } }),
        prisma.visit.count({ where: { patient: { hospitalId: hId }, date: { gte: startOfMonth } } }),
        prisma.permissionRequest.count({ where: { credential: { hospitalId: hId }, status: 'PENDING' } }),
      ]);

    // Alias totalDoctorProfiles -> totalProfiles for the dashboard card.
    res.json({ totalCredentials, activeCredentials, totalDoctorProfiles, totalProfiles: totalDoctorProfiles, totalPatients, visitsThisMonth, pendingRequests });
  } catch (err) {
    next(err);
  }
});

export default router;
