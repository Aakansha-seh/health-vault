// Patient portal routes — everything a patient can do lives here.
//
//   POST /api/portal/login            → { token, actor }            (rate-limited)
//   POST /api/portal/change-password  → { message }                 (patient)
//   POST /api/portal/logout           → { message }                 (patient)
//   GET  /api/portal/me               → profile + hospital + flags  (patient)
//   GET  /api/portal/visits           → own visit history           (patient)
//   GET  /api/portal/appointments     → own appointments            (patient)
//   GET  /api/portal/files            → own uploaded documents      (patient)
//   POST /api/portal/uploads          → upload a previous record    (patient)
//
// Patients are strictly READ-ONLY on clinical data: there are deliberately no
// endpoints to edit or delete visits, appointments, staff files, or their own
// past uploads. The only write is uploading a new document.
// Every query is scoped to req.actor.patientId — never trust ids from the client.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticatePatient, requirePasswordChanged } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { writeAudit } from '../lib/audit.js';
import { saveBase64File } from '../lib/storage.js';

const router = Router();
const EXPIRES = process.env.JWT_EXPIRES_IN || '12h';
const MAX_PATIENT_UPLOADS = parseInt(process.env.PATIENT_UPLOAD_QUOTA || '30', 10);

// ─── Login ────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);
    const account = await prisma.patientAccount.findUnique({
      where: { username },
      include: {
        patient:  { select: { id: true, name: true, email: true } },
        hospital: { select: { id: true, name: true } },
      },
    });
    // Same generic message for every failure mode — no account enumeration.
    if (!account || !account.passwordHash || !(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (!account.isActive) {
      return res.status(403).json({ error: 'Portal access has been deactivated. Please contact the hospital.' });
    }

    const token = jwt.sign(
      { type: 'patient', patientAccountId: account.id, hospitalId: account.hospitalId },
      process.env.JWT_SECRET,
      { expiresIn: EXPIRES }
    );
    await prisma.patientAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
    await writeAudit({
      actor: { type: 'patient', id: account.id, hospitalId: account.hospitalId, role: 'PATIENT', label: account.patient.name },
      action: 'PATIENT_LOGIN',
      target: { type: 'Patient', id: account.patientId, label: account.patient.name },
      details: 'Patient signed in to the portal',
      ipAddress: req.ip,
    });

    return res.json({
      token,
      actor: {
        type: 'patient',
        id: account.id,
        patientId: account.patientId,
        name: account.patient.name,
        username: account.username,
        mustChangePassword: account.mustChangePassword,
        hospital: account.hospital,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

// ─── Password change (first login + any time after) ─────────────────────────

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(72, 'New password is too long'),
});

router.post('/change-password', authenticatePatient, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
    const account = await prisma.patientAccount.findUnique({ where: { id: req.actor.id } });
    if (!account?.passwordHash || !(await bcrypt.compare(currentPassword, account.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current one' });
    }
    await prisma.patientAccount.update({
      where: { id: account.id },
      data:  { passwordHash: await bcrypt.hash(newPassword, 12), mustChangePassword: false },
    });
    await writeAudit({
      actor: req.actor, action: 'PATIENT_PASSWORD_CHANGED',
      target: { type: 'Patient', id: req.actor.patientId, label: req.actor.name },
      ipAddress: req.ip,
    });
    res.json({ message: 'Password updated' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

router.post('/logout', authenticatePatient, async (req, res) => {
  await writeAudit({
    actor: req.actor, action: 'PATIENT_LOGOUT',
    target: { type: 'Patient', id: req.actor.patientId, label: req.actor.name },
    ipAddress: req.ip,
  });
  res.json({ message: 'Logged out successfully' });
});

// ─── Read-only data ──────────────────────────────────────────────────────────

router.get('/me', authenticatePatient, async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.actor.patientId },
      select: {
        id: true, name: true, dob: true, age: true, gender: true, phone: true,
        email: true, bloodGroup: true, allergies: true, chronicConditions: true,
        address: true, emergencyContact: true, createdAt: true,
        hospital: { select: { id: true, name: true, address: true, phone: true } },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient record not found' });
    res.json({
      type: 'patient',
      id: req.actor.id,
      patientId: patient.id,
      name: patient.name,
      mustChangePassword: req.actor.mustChangePassword,
      patient,
      hospital: patient.hospital,
    });
  } catch (err) { next(err); }
});

router.get('/visits', authenticatePatient, requirePasswordChanged, async (req, res, next) => {
  try {
    const visits = await prisma.visit.findMany({
      where:   { patientId: req.actor.patientId },
      orderBy: { date: 'desc' },
      include: { doctorProfile: { select: { id: true, name: true, specialty: true } } },
    });
    res.json(visits);
  } catch (err) { next(err); }
});

router.get('/appointments', authenticatePatient, requirePasswordChanged, async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where:   { patientId: req.actor.patientId },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      include: { doctorProfile: { select: { id: true, name: true, specialty: true } } },
    });
    res.json(appointments);
  } catch (err) { next(err); }
});

router.get('/files', authenticatePatient, requirePasswordChanged, async (req, res, next) => {
  try {
    const files = await prisma.attachment.findMany({
      where:   { patientId: req.actor.patientId, source: 'PATIENT' },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, fileName: true, type: true, reportType: true, createdAt: true },
    });
    res.json(files);
  } catch (err) { next(err); }
});

// ─── Upload a previous record (the patient's ONLY write) ────────────────────

const UploadSchema = z.object({
  fileName:    z.string().min(1, 'fileName required'),
  contentType: z.string().optional(),
  dataBase64:  z.string().min(1, 'file data required'),
  reportType:  z.string().max(60).optional(),
});

router.post('/uploads', authenticatePatient, requirePasswordChanged, async (req, res, next) => {
  try {
    const { fileName, contentType, dataBase64, reportType } = UploadSchema.parse(req.body);

    const count = await prisma.attachment.count({
      where: { patientId: req.actor.patientId, source: 'PATIENT' },
    });
    if (count >= MAX_PATIENT_UPLOADS) {
      return res.status(429).json({ error: `Upload limit reached (${MAX_PATIENT_UPLOADS} files). Please ask the hospital to add further documents.` });
    }

    const saved = saveBase64File({ fileName, contentType, dataBase64 });
    const attachment = await prisma.attachment.create({
      data: {
        hospitalId: req.actor.hospitalId,
        patientId:  req.actor.patientId,
        source:     'PATIENT',
        storedName: saved.id,
        fileName:   saved.name,
        type:       saved.type,
        reportType: reportType || null,
        uploadedBy: null,
      },
    });

    await writeAudit({
      actor: req.actor, action: 'PATIENT_FILE_UPLOADED',
      target: { type: 'Attachment', id: attachment.id, label: saved.name },
      details: reportType ? `Patient uploaded a document (${reportType})` : 'Patient uploaded a document',
      ipAddress: req.ip,
    });

    res.status(201).json({
      id:         attachment.id,
      fileName:   saved.name,
      type:       saved.type,
      reportType: reportType || null,
      createdAt:  attachment.createdAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

export default router;
