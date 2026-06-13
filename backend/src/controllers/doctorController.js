'use strict';
const bcrypt = require('bcryptjs');
const { z }  = require('zod');
const prisma = require('../config/db');
const env    = require('../config/env');
const audit  = require('../services/auditService');
const R      = require('../utils/response');

const updateSchema = z.object({
  name:          z.string().min(2).optional(),
  specialisation: z.string().optional(),
  regNumber:     z.string().optional(),
  clinicHours:   z.string().optional(),
  yearsPractice: z.number().int().min(0).optional(),
  email:         z.string().email().optional().nullable(),
  avatarUrl:     z.string().url().optional().nullable(),
  password:      z.string().min(8).optional(),
});

// GET /doctors/me
exports.getMe = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where:   { id: req.user.doctorId },
      include: { clinic: true },
    });
    if (!doctor) return R.notFound(res, 'Doctor not found.');
    const { password: _, ...safe } = doctor;
    return R.ok(res, safe);
  } catch (err) { next(err); }
};

// PUT /doctors/me
exports.updateMe = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    }
    const doctor = await prisma.doctor.update({
      where: { id: req.user.doctorId },
      data,
    });
    audit.log(req.user.doctorId, 'UPDATE_DOCTOR', `${doctor.name} updated their profile`);
    const { password: _, ...safe } = doctor;
    return R.ok(res, safe);
  } catch (err) { next(err); }
};
