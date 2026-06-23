// Visit routes — nested under /api/patients/:patientId/visits
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

const CreateVisitSchema = z.object({
  doctorProfileId: z.string().min(1),
  date:            z.string().min(1),
  chiefComplaint:  z.string().min(1),
  diagnosis:       z.string().optional(),
  prescription:    z.string().optional(),
  notes:           z.string().optional(),
  followUpDate:    z.string().optional(),
});

const UpdateVisitSchema = CreateVisitSchema.omit({ doctorProfileId: true, date: true }).partial();

router.post('/:patientId/visits', authenticateCredential, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const data = CreateVisitSchema.parse(req.body);

    const profile = await prisma.doctorProfile.findFirst({
      where: { id: data.doctorProfileId, hospitalId: req.actor.hospitalId },
    });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    // Verify access (READ_WRITE required)
    const access = await prisma.profileAccess.findUnique({
      where: { credentialId_doctorProfileId: { credentialId: req.actor.id, doctorProfileId: data.doctorProfileId } },
    });
    if (!access) return res.status(403).json({ error: 'You do not have access to this doctor profile' });
    if (access.permission !== 'READ_WRITE') return res.status(403).json({ error: 'Write access required. Request it from your administrator.' });

    const patient = await prisma.patient.findFirst({ where: { id: patientId, hospitalId: req.actor.hospitalId } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const visit = await prisma.visit.create({
      data: {
        patientId,
        doctorProfileId: data.doctorProfileId,
        date:           new Date(data.date),
        chiefComplaint: data.chiefComplaint,
        diagnosis:      data.diagnosis,
        prescription:   data.prescription,
        notes:          data.notes,
        followUpDate:   data.followUpDate ? new Date(data.followUpDate) : null,
        createdBy:      req.actor.id,
      },
      include: { doctorProfile: { select: { id: true, name: true } } },
    });

    const visitCount = await prisma.visit.count({ where: { patientId } });
    if (visitCount > 1 && !patient.isReturning) {
      await prisma.patient.update({ where: { id: patientId }, data: { isReturning: true } });
    }

    await writeAudit({
      actor: req.actor, action: 'VISIT_CREATED',
      target: { type: 'Patient', id: patientId, label: patient.name },
      details: `Visit for ${profile.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json(visit);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

router.patch('/:patientId/visits/:id', authenticateCredential, async (req, res, next) => {
  try {
    const { patientId, id } = req.params;
    const visit = await prisma.visit.findFirst({
      where: { id, patientId, patient: { hospitalId: req.actor.hospitalId } },
    });
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const access = await prisma.profileAccess.findUnique({
      where: { credentialId_doctorProfileId: { credentialId: req.actor.id, doctorProfileId: visit.doctorProfileId } },
    });
    if (!access || access.permission !== 'READ_WRITE') {
      return res.status(403).json({ error: 'Write access required' });
    }

    const data = UpdateVisitSchema.parse(req.body);
    const updated = await prisma.visit.update({
      where: { id },
      data,
      include: { doctorProfile: { select: { id: true, name: true } } },
    });

    await writeAudit({ actor: req.actor, action: 'VISIT_UPDATED', target: { type: 'Visit', id }, ipAddress: req.ip });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
