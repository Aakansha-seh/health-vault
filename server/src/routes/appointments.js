// Appointments routes — hospital-scoped
// GET    /api/appointments
// POST   /api/appointments
// PATCH  /api/appointments/:id

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

const CreateAppointmentSchema = z.object({
  patientId:       z.string().min(1),
  doctorProfileId: z.string().min(1),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time:            z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  reason:          z.string().min(2),
  notes:           z.string().optional(),
});

const UpdateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  reason: z.string().min(2).optional(),
  notes:  z.string().optional(),
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field required' });

// --- GET /api/appointments ---

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, date, doctorProfileId } = req.query;

    const where = { hospitalId: req.actor.hospitalId };
    if (status)          where.status          = status;
    if (date)            where.date            = date;
    if (doctorProfileId) where.doctorProfileId = doctorProfileId;

    // Doctors only see appointments for profiles they're granted. Receptionists
    // run the front desk for the whole hospital; admins see everything.
    if (req.actor.type === 'credential' && req.actor.role === 'DOCTOR') {
      const accesses = await prisma.profileAccess.findMany({
        where: { credentialId: req.actor.id },
        select: { doctorProfileId: true },
      });
      where.doctorProfileId = { in: accesses.map(a => a.doctorProfileId) };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient:       { select: { id: true, name: true, age: true, gender: true } },
        doctorProfile: { select: { id: true, name: true, specialty: true } },
        creator:       { select: { id: true, label: true } },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// --- POST /api/appointments ---

router.post('/', authenticateCredential, async (req, res, next) => {
  try {
    const data = CreateAppointmentSchema.parse(req.body);

    const appointmentDateTime = new Date(`${data.date}T${data.time}`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule an appointment in the past' });
    }

    const [patient, profile] = await Promise.all([
      prisma.patient.findFirst({ where: { id: data.patientId, hospitalId: req.actor.hospitalId } }),
      prisma.doctorProfile.findFirst({ where: { id: data.doctorProfileId, hospitalId: req.actor.hospitalId } }),
    ]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    const appointment = await prisma.appointment.create({
      data: {
        patientId:       data.patientId,
        doctorProfileId: data.doctorProfileId,
        hospitalId:      req.actor.hospitalId,
        date:            data.date,
        time:            data.time,
        reason:          data.reason,
        notes:           data.notes,
        createdBy:       req.actor.id,
      },
      include: {
        patient:       { select: { id: true, name: true, age: true, gender: true } },
        doctorProfile: { select: { id: true, name: true, specialty: true } },
      },
    });

    await writeAudit({
      actor: req.actor, action: 'APPOINTMENT_CREATED',
      target: { type: 'Patient', id: patient.id, label: patient.name },
      details: `Appointment with ${profile.name} on ${data.date} at ${data.time}`,
      ipAddress: req.ip,
    });

    res.status(201).json(appointment);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// --- PATCH /api/appointments/:id ---

router.patch('/:id', authenticateCredential, async (req, res, next) => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, hospitalId: req.actor.hospitalId },
    });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const data = UpdateAppointmentSchema.parse(req.body);
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data,
      include: {
        patient:       { select: { id: true, name: true } },
        doctorProfile: { select: { id: true, name: true } },
      },
    });

    const action = data.status === 'cancelled' ? 'APPOINTMENT_CANCELLED'
                 : data.status === 'completed'  ? 'APPOINTMENT_COMPLETED'
                 : 'APPOINTMENT_UPDATED';

    await writeAudit({
      actor: req.actor, action,
      target: { type: 'Appointment', id: appt.id, label: `${appt.date} ${appt.time}` },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
