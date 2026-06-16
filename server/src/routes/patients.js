// Patients routes — all scoped to req.user.clinicId from JWT
// GET /api/patients, POST /api/patients, GET /api/patients/:id, PATCH /api/patients/:id
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const CreatePatientSchema = z.object({
  name:             z.string().min(2, 'Name required'),
  age:              z.coerce.number().int().positive('Age must be a positive integer'),
  gender:           z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender required' }),
  phone:            z.string().optional(),
  bloodGroup:       z.string().optional(),
  allergies:        z.string().optional(),
  chronicConditions:z.string().optional(),
  insurance:        z.string().optional(),
  address:          z.string().optional(),
  emergencyContact: z.string().optional(),
});

const UpdatePatientSchema = z.object({
  name:             z.string().min(2).optional(),
  age:              z.coerce.number().int().positive().optional(),
  gender:           z.enum(['Male', 'Female', 'Other']).optional(),
  phone:            z.string().optional(),
  bloodGroup:       z.string().optional(),
  allergies:        z.string().optional(),
  chronicConditions:z.string().optional(),
  insurance:        z.string().optional(),
  address:          z.string().optional(),
  emergencyContact: z.string().optional(),
  isReturning:      z.boolean().optional(),
});

// GET /api/patients — all patients for current clinic
router.get('/', authenticate, async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { clinicId: req.user.clinicId },
      include: {
        visits: {
          orderBy: { date: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, specialisation: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(patients);
  } catch (err) {
    next(err);
  }
});

// POST /api/patients — create patient in current clinic
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = CreatePatientSchema.parse(req.body);

    const patient = await prisma.patient.create({
      data: { ...data, clinicId: req.user.clinicId },
    });

    res.status(201).json(patient);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// GET /api/patients/:id — patient + all visits (clinic-scoped)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, clinicId: req.user.clinicId },
      include: {
        visits: {
          orderBy: { date: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true, specialisation: true },
            },
          },
        },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/patients/:id — update patient (clinic-scoped)
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    // Verify patient belongs to this clinic
    const existing = await prisma.patient.findFirst({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    });
    if (!existing) return res.status(404).json({ error: 'Patient not found' });

    const data = UpdatePatientSchema.parse(req.body);
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data,
    });

    res.json(patient);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
