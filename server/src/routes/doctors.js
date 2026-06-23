// Doctors routes — GET /api/doctors, GET /api/doctors/:id, PATCH /api/doctors/:id
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const DOCTOR_SELECT = {
  id: true,
  name: true,
  email: true,
  specialty: true,
  contact: true,
  clinicHours: true,
  yearsPractice: true,
  clinicId: true,
  createdAt: true,
  clinic: { select: { id: true, name: true, address: true, phone: true, email: true } },
};

const UpdateDoctorSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.string().min(2).optional(),
  contact: z.string().optional(),
  clinicHours: z.string().optional(),
  yearsPractice: z.coerce.number().int().nonnegative().optional(),
});

// GET /api/doctors — public (login screen doctor list)
router.get('/', async (_req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      select: DOCTOR_SELECT,
      orderBy: { name: 'asc' },
    });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id — protected
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: DOCTOR_SELECT,
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/doctors/:id — protected, only the doctor themselves can update
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.doctorId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const data = UpdateDoctorSchema.parse(req.body);

    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data,
      select: DOCTOR_SELECT,
    });

    res.json(doctor);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
