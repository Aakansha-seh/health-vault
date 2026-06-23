// Auth routes
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();
const EXPIRES = process.env.JWT_EXPIRES_IN || '12h';

const AdminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/admin/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = AdminLoginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { hospital: { select: { id: true, name: true } } },
    });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { type: 'admin', adminId: admin.id, hospitalId: admin.hospitalId, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: EXPIRES }
    );
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await writeAudit({
      actor: { type: 'admin', id: admin.id, hospitalId: admin.hospitalId, name: admin.name },
      action: 'ADMIN_LOGIN', details: 'Admin logged in', ipAddress: req.ip,
    });
    const { passwordHash: _, ...safeAdmin } = admin;
    return res.json({ token, actor: { type: 'admin', ...safeAdmin } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

const CredentialLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = CredentialLoginSchema.parse(req.body);
    const credential = await prisma.credential.findUnique({
      where: { username },
      include: { hospital: { select: { id: true, name: true } } },
    });
    if (!credential || !(await bcrypt.compare(password, credential.passwordHash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (!credential.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact your administrator.' });
    }
    const token = jwt.sign(
      { type: 'credential', credentialId: credential.id, hospitalId: credential.hospitalId, role: credential.role, label: credential.label },
      process.env.JWT_SECRET,
      { expiresIn: EXPIRES }
    );
    await prisma.credential.update({ where: { id: credential.id }, data: { lastLoginAt: new Date() } });
    await writeAudit({
      actor: { type: 'credential', id: credential.id, hospitalId: credential.hospitalId, role: credential.role, label: credential.label },
      action: 'CREDENTIAL_LOGIN', details: `${credential.role} logged in`, ipAddress: req.ip,
    });
    const { passwordHash: _, ...safeCredential } = credential;
    return res.json({ token, actor: { type: 'credential', ...safeCredential } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (req.actor.type === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: req.actor.id },
        include: { hospital: { select: { id: true, name: true, address: true, phone: true } } },
      });
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
      const { passwordHash: _, ...safe } = admin;
      return res.json({ type: 'admin', ...safe });
    }
    const credential = await prisma.credential.findUnique({
      where: { id: req.actor.id },
      include: {
        hospital: { select: { id: true, name: true } },
        subscription: { select: { tier: true, status: true, currentPeriodEnd: true } },
        profileAccesses: {
          include: { doctorProfile: { select: { id: true, name: true, specialty: true } } },
        },
      },
    });
    if (!credential) return res.status(404).json({ error: 'Credential not found' });
    const { passwordHash: _, ...safe } = credential;
    return res.json({ type: 'credential', ...safe });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res) => {
  const action = req.actor.type === 'admin' ? 'ADMIN_LOGOUT' : 'CREDENTIAL_LOGOUT';
  await writeAudit({ actor: req.actor, action, ipAddress: req.ip });
  return res.json({ message: 'Logged out successfully' });
});

export default router;
