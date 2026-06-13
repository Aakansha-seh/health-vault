'use strict';
const bcrypt      = require('bcryptjs');
const { z }       = require('zod');
const prisma      = require('../config/db');
const env         = require('../config/env');
const { signToken }         = require('../services/jwtService');
const { sendOtp, verifyOtp } = require('../services/otpService');
const audit       = require('../services/auditService');
const R           = require('../utils/response');

// ─── Validation schemas ───────────────────────────────────────────────────────
const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits.'),
});

const otpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  otp:   z.string().length(6, 'OTP must be 6 digits.'),
});

const loginSchema = z.object({
  phone:    z.string().regex(/^\d{10}$/),
  password: z.string().min(1),
  role:     z.enum(['doctor', 'clinic']),
});

const registerSchema = z.object({
  phone:          z.string().regex(/^\d{10}$/),
  otp:            z.string().length(6),
  name:           z.string().min(2),
  specialisation: z.string().min(2),
  clinicId:       z.string().min(1),
  password:       z.string().min(8, 'Password must be at least 8 characters.'),
  regNumber:      z.string().optional(),
  clinicHours:    z.string().optional(),
  yearsPractice:  z.number().int().min(0).optional(),
});

// ─── POST /auth/send-otp ──────────────────────────────────────────────────────
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = phoneSchema.parse(req.body);
    const result    = await sendOtp(phone);
    return R.ok(res, result);
  } catch (err) { next(err); }
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = otpSchema.parse(req.body);
    const result = await verifyOtp(phone, otp);
    if (!result.valid) return R.fail(res, result.reason, 400);
    return R.ok(res, { verified: true });
  } catch (err) { next(err); }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { phone, password, role } = loginSchema.parse(req.body);

    if (role === 'doctor') {
      const doctor = await prisma.doctor.findUnique({
        where:   { contact: phone },
        include: { clinic: { select: { id: true, name: true } } },
      });
      if (!doctor) return R.fail(res, 'No doctor account found with this number.', 401);

      const ok = await bcrypt.compare(password, doctor.password);
      if (!ok)  return R.fail(res, 'Incorrect password.', 401);

      const token = signToken({ doctorId: doctor.id, clinicId: doctor.clinicId, name: doctor.name, role: 'doctor' });
      audit.log(doctor.id, 'LOGIN', `${doctor.name} signed in`);

      const { password: _, ...safe } = doctor;
      return R.ok(res, { token, doctor: safe });
    }

    // clinic login
    const clinic = await prisma.clinic.findUnique({
      where:   { phone },
      include: {
        doctors: { select: { id: true, name: true, specialisation: true, clinicId: true, contact: true, regNumber: true, clinicHours: true, yearsPractice: true } },
      },
    });
    if (!clinic) return R.fail(res, 'No clinic found with this number.', 401);

    const ok = await bcrypt.compare(password, clinic.password);
    if (!ok)  return R.fail(res, 'Incorrect clinic password.', 401);

    const { password: _, ...safeClinic } = clinic;
    return R.ok(res, { clinic: safeClinic });
  } catch (err) { next(err); }
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Re-verify OTP on server side
    const result = await verifyOtp(data.phone, data.otp);
    if (!result.valid) return R.fail(res, result.reason, 400);

    // Check duplicate
    const exists = await prisma.doctor.findUnique({ where: { contact: data.phone } });
    if (exists) return R.fail(res, 'An account with this number already exists.', 409);

    const hashed = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const doctor = await prisma.doctor.create({
      data: {
        name:           data.name,
        specialisation: data.specialisation,
        clinicId:       data.clinicId,
        contact:        data.phone,
        password:       hashed,
        regNumber:      data.regNumber   ?? null,
        clinicHours:    data.clinicHours ?? 'Mon–Sat, 9 AM – 6 PM',
        yearsPractice:  data.yearsPractice ?? 0,
      },
      include: { clinic: { select: { id: true, name: true } } },
    });

    const token = signToken({ doctorId: doctor.id, clinicId: doctor.clinicId, name: doctor.name, role: 'doctor' });
    audit.log(doctor.id, 'REGISTER_DOCTOR', `${doctor.name} created an account`);

    const { password: _, ...safe } = doctor;
    return R.created(res, { token, doctor: safe });
  } catch (err) { next(err); }
};
