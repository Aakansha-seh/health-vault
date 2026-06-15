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
  date: z.string().min(1, 'Date required'),
  reason: z.string().min(2, 'Reason required'),
  previousHistory: z.string().optional(),
  symptoms: z.string().optional(),
  testsDone: z.string().optional(),
  prescription: z.string().optional(),
  progressSinceLastVisit: z.string().optional(),
  testReports: z.array(TestReportSchema).optional(),
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
        date: new Date(data.date),
        reason: data.reason,
        previousHistory: data.previousHistory,
        symptoms: data.symptoms,
        testsDone: data.testsDone,
        prescription: data.prescription,
        progressSinceLastVisit: data.progressSinceLastVisit,
        testReports: data.testReports ?? [],
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
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.reason !== undefined ? { reason: data.reason } : {}),
        ...(data.previousHistory !== undefined ? { previousHistory: data.previousHistory } : {}),
        ...(data.symptoms !== undefined ? { symptoms: data.symptoms } : {}),
        ...(data.testsDone !== undefined ? { testsDone: data.testsDone } : {}),
        ...(data.prescription !== undefined ? { prescription: data.prescription } : {}),
        ...(data.progressSinceLastVisit !== undefined ? { progressSinceLastVisit: data.progressSinceLastVisit } : {}),
        ...(data.testReports !== undefined ? { testReports: data.testReports } : {}),
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
