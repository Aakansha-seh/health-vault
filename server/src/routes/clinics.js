// Clinics routes — GET /api/clinics, POST /api/clinics
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const ClinicSchema = z.object({
  name: z.string().min(2, 'Name required'),
  address: z.string().min(5, 'Address required'),
  phone: z.string().min(7, 'Phone required'),
  email: z.string().email('Valid email required'),
});

// GET /api/clinics — public (used on login/signup screen to populate dropdown)
router.get('/', async (_req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(clinics);
  } catch (err) {
    next(err);
  }
});

// POST /api/clinics — protected
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = ClinicSchema.parse(req.body);

    const clinic = await prisma.clinic.create({ data });
    res.status(201).json(clinic);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
