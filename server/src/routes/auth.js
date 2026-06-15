// Auth routes — POST /api/auth/login, /signup, GET /api/auth/me
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const DOCTOR_SELECT = {
  id: true,
  name: true,
  email: true,
  specialisation: true,
  contact: true,
  clinicHours: true,
  yearsPractice: true,
  clinicId: true,
  createdAt: true,
  clinic: { select: { id: true, name: true, address: true, phone: true } },
};

function signToken(doctor) {
  return jwt.sign(
    { doctorId: doctor.id, clinicId: doctor.clinicId, doctorName: doctor.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

async function writeAudit(doctorId, doctorName, clinicId, action, details) {
  try {
    await prisma.auditLog.create({ data: { doctorId, doctorName, clinicId, action, details } });
  } catch (_) {
    // non-fatal — never let audit failure break auth
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({
      where: { email },
      include: { clinic: { select: { id: true, name: true, address: true, phone: true } } },
    });

    if (!doctor) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, doctor.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(doctor);

    // Server-side audit entry for login
    await writeAudit(doctor.id, doctor.name, doctor.clinicId, 'LOGIN', 'Doctor logged in');

    // Never return password
    const { password: _pw, ...safeDoctor } = doctor;
    return res.json({ token, doctor: safeDoctor });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  specialisation: z.string().min(2, 'Specialisation required'),
  clinicId: z.string().min(1, 'Clinic required'),
  contact: z.string().optional(),
  clinicHours: z.string().optional(),
  yearsPractice: z.coerce.number().int().nonnegative().optional(),
});

router.post('/signup', async (req, res, next) => {
  try {
    const data = SignupSchema.parse(req.body);

    // Check clinic exists
    const clinic = await prisma.clinic.findUnique({ where: { id: data.clinicId } });
    if (!clinic) {
      return res.status(400).json({ error: 'Clinic not found' });
    }

    // Check email uniqueness
    const existing = await prisma.doctor.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'A doctor with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const doctor = await prisma.doctor.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        specialisation: data.specialisation,
        clinicId: data.clinicId,
        contact: data.contact,
        clinicHours: data.clinicHours,
        yearsPractice: data.yearsPractice,
      },
      select: {
        ...DOCTOR_SELECT,
        clinic: { select: { id: true, name: true, address: true, phone: true } },
      },
    });

    const token = signToken(doctor);
    await writeAudit(doctor.id, doctor.name, doctor.clinicId, 'LOGIN', 'Doctor account created and logged in');

    return res.status(201).json({ token, doctor });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.doctorId },
      select: {
        ...DOCTOR_SELECT,
        clinic: { select: { id: true, name: true, address: true, phone: true } },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json(doctor);
  } catch (err) {
    next(err);
  }
});

export default router;
