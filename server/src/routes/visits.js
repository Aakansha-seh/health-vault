// Visit routes — nested under /api/patients/:patientId/visits
// POST /api/patients/:patientId/visits
// PATCH /api/patients/:patientId/visits/:id
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const TestReportSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
});

const CreateVisitSchema = z.object({
  date:           z.string().min(1, 'Date required'),
  chiefComplaint: z.string().min(2, 'Chief complaint required'),
  examination:    z.string().optional(),
  diagnosis:      z.string().optional(),
  medications:    z.string().optional(),
  notes:          z.string().optional(),
  testReports:    z.array(TestReportSchema).optional(),
});

const UpdateVisitSchema = CreateVisitSchema.partial();

// Helper: verify patient belongs to caller's clinic
async function verifyPatientAccess(patientId, clinicId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });
  return patient;
}

// POST /api/patients/:patientId/visits
router.post('/:patientId/visits', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await verifyPatientAccess(patientId, req.user.clinicId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const data = CreateVisitSchema.parse(req.body);

    const visit = await prisma.visit.create({
      data: {
        patientId,
        doctorId: req.user.doctorId,
        date:           new Date(data.date),
        chiefComplaint: data.chiefComplaint,
        examination:    data.examination,
        diagnosis:      data.diagnosis,
        medications:    data.medications,
        notes:          data.notes,
        testReports:    data.testReports ?? [],
      },
      include: {
        doctor: { select: { id: true, name: true, specialisation: true } },
      },
    });

    // Mark patient as returning if they have more than 1 visit
    const visitCount = await prisma.visit.count({ where: { patientId } });
    if (visitCount > 1 && !patient.isReturning) {
      await prisma.patient.update({ where: { id: patientId }, data: { isReturning: true } });
    }

    res.status(201).json(visit);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// PATCH /api/patients/:patientId/visits/:id
router.patch('/:patientId/visits/:id', authenticate, async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    const patient = await verifyPatientAccess(patientId, req.user.clinicId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Verify visit belongs to this patient
    const existing = await prisma.visit.findFirst({ where: { id, patientId } });
    if (!existing) return res.status(404).json({ error: 'Visit not found' });

    const data = UpdateVisitSchema.parse(req.body);

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        ...(data.date           ? { date: new Date(data.date) } : {}),
        ...(data.chiefComplaint !== undefined ? { chiefComplaint: data.chiefComplaint } : {}),
        ...(data.examination    !== undefined ? { examination:    data.examination }    : {}),
        ...(data.diagnosis      !== undefined ? { diagnosis:      data.diagnosis }      : {}),
        ...(data.medications    !== undefined ? { medications:    data.medications }    : {}),
        ...(data.notes          !== undefined ? { notes:          data.notes }          : {}),
        ...(data.testReports    !== undefined ? { testReports:    data.testReports }    : {}),
      },
      include: {
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
