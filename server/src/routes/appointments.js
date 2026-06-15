// Appointments routes — all clinic-scoped via JWT
// GET /api/appointments
// POST /api/appointments
// PATCH /api/appointments/:id
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient required'),
  doctorId: z.string().min(1, 'Doctor required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  reason: z.string().min(2, 'Reason required'),
  notes: z.string().optional(),
});

const UpdateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  gcalSynced: z.boolean().optional(),
  reason: z.string().min(2).optional(),
  notes: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field must be provided' }
);

// GET /api/appointments — all appointments for current clinic, with joined names
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = { clinicId: req.user.clinicId };
    if (status) where.status = status;
    if (date) where.date = date;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, specialisation: true } },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments — create appointment (no past scheduling)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = CreateAppointmentSchema.parse(req.body);

    // Reject past appointments
    const appointmentDateTime = new Date(`${data.date}T${data.time}`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({
        error: 'Cannot schedule an appointment in the past',
        details: [{ field: 'date/time', message: 'Appointment date and time must be in the future' }],
      });
    }

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, clinicId: req.user.clinicId },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found in your clinic' });

    // Verify doctor belongs to this clinic
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, clinicId: req.user.clinicId },
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found in your clinic' });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        clinicId: req.user.clinicId,
        date: data.date,
        time: data.time,
        reason: data.reason,
        notes: data.notes,
      },
      include: {
        patient: { select: { id: true, name: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, specialisation: true } },
      },
    });

    res.status(201).json(appointment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// PATCH /api/appointments/:id — update status or gcalSynced (clinic-scoped)
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.appointment.findFirst({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    });
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });

    const data = UpdateAppointmentSchema.parse(req.body);

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
      include: {
        patient: { select: { id: true, name: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, specialisation: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
