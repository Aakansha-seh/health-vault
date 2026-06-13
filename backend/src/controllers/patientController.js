'use strict';
const { z }  = require('zod');
const prisma = require('../config/db');
const audit  = require('../services/auditService');
const R      = require('../utils/response');

const patientSchema = z.object({
  name:              z.string().min(1),
  age:               z.number().int().min(0).max(130),
  gender:            z.enum(['Male', 'Female', 'Other']),
  bloodGroup:        z.string().optional(),
  phone:             z.string().optional(),
  allergies:         z.string().optional(),
  chronicConditions: z.string().optional(),
  insurance:         z.string().optional(),
  address:           z.string().optional(),
  emergencyContact:  z.string().optional(),
});

// GET /patients?clinicId=
exports.list = async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      where:   { clinicId: req.user.clinicId },
      include: { visits: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return R.ok(res, patients);
  } catch (err) { next(err); }
};

// GET /patients/:id
exports.getOne = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findFirst({
      where:   { id: req.params.id, clinicId: req.user.clinicId },
      include: { visits: { orderBy: { date: 'desc' } } },
    });
    if (!patient) return R.notFound(res);
    return R.ok(res, patient);
  } catch (err) { next(err); }
};

// POST /patients
exports.create = async (req, res, next) => {
  try {
    const data    = patientSchema.parse(req.body);
    const patient = await prisma.patient.create({
      data: { ...data, clinicId: req.user.clinicId },
    });
    audit.log(req.user.doctorId, 'ADD_PATIENT', `Added patient: ${patient.name}`);
    return R.created(res, patient);
  } catch (err) { next(err); }
};

// PUT /patients/:id
exports.update = async (req, res, next) => {
  try {
    const data = patientSchema.partial().parse(req.body);
    const existing = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return R.notFound(res);
    const patient = await prisma.patient.update({ where: { id: req.params.id }, data });
    audit.log(req.user.doctorId, 'UPDATE_PATIENT', `Updated patient: ${patient.name}`);
    return R.ok(res, patient);
  } catch (err) { next(err); }
};

// ─── Visits ───────────────────────────────────────────────────────────────────

const visitSchema = z.object({
  date:           z.string(),
  chiefComplaint: z.string().min(1),
  examination:    z.string().optional(),
  diagnosis:      z.string().min(1),
  medications:    z.string().optional(),
  notes:          z.string().optional(),
});

// POST /patients/:id/visits
exports.addVisit = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!patient) return R.notFound(res);

    const data  = visitSchema.parse(req.body);
    const visit = await prisma.visit.create({
      data: {
        ...data,
        date:      new Date(data.date),
        patientId: patient.id,
        doctorId:  req.user.doctorId,
      },
    });

    // Mark as returning if this is their 2nd+ visit
    const visitCount = await prisma.visit.count({ where: { patientId: patient.id } });
    if (visitCount > 1) {
      await prisma.patient.update({ where: { id: patient.id }, data: { isReturning: true } });
    }

    audit.log(req.user.doctorId, 'ADD_VISIT', `Visit recorded for ${patient.name}: ${data.diagnosis}`);
    return R.created(res, visit);
  } catch (err) { next(err); }
};
