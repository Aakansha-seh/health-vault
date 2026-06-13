'use strict';
const { z }  = require('zod');
const prisma = require('../config/db');
const audit  = require('../services/auditService');
const R      = require('../utils/response');

const apptSchema = z.object({
  patientId: z.string().min(1),
  date:      z.string(),
  time:      z.string().regex(/^\d{2}:\d{2}$/),
  reason:    z.string().min(1),
  notes:     z.string().optional(),
});

// GET /appointments
exports.list = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where:   { clinicId: req.user.clinicId },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return R.ok(res, appointments);
  } catch (err) { next(err); }
};

// POST /appointments
exports.create = async (req, res, next) => {
  try {
    const data = apptSchema.parse(req.body);
    const appt = await prisma.appointment.create({
      data: {
        ...data,
        date:      new Date(data.date),
        doctorId:  req.user.doctorId,
        clinicId:  req.user.clinicId,
        status:    'scheduled',
      },
      include: { patient: { select: { id: true, name: true } } },
    });
    audit.log(req.user.doctorId, 'ADD_APPOINTMENT', `Appointment scheduled for ${appt.patient.name} on ${data.date}`);
    return R.created(res, appt);
  } catch (err) { next(err); }
};

// PATCH /appointments/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['scheduled', 'completed', 'cancelled']) }).parse(req.body);
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return R.notFound(res);

    const appt = await prisma.appointment.update({
      where:   { id: req.params.id },
      data:    { status },
      include: { patient: { select: { name: true } } },
    });
    audit.log(req.user.doctorId, 'UPDATE_APPOINTMENT', `Appointment for ${appt.patient.name} marked ${status}`);
    return R.ok(res, appt);
  } catch (err) { next(err); }
};
