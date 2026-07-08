// Auth middleware — three token types: admin, credential, and patient
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

function extractToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function authenticateAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = verifyJWT(token);
    if (payload.type !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.actor = { type: 'admin', id: payload.adminId, hospitalId: payload.hospitalId, name: payload.name };
    next();
  } catch (err) { return jwtError(err, res); }
}

export async function authenticateCredential(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = verifyJWT(token);
    if (payload.type !== 'credential') return res.status(403).json({ error: 'Credential login required' });
    const credential = await prisma.credential.findUnique({
      where: { id: payload.credentialId },
      select: { id: true, isActive: true, hospitalId: true, role: true, label: true },
    });
    if (!credential || !credential.isActive) {
      return res.status(401).json({ error: 'Credential has been revoked or does not exist' });
    }
    req.actor = { type: 'credential', id: credential.id, hospitalId: credential.hospitalId, role: credential.role, label: credential.label, name: credential.label };
    next();
  } catch (err) { return jwtError(err, res); }
}

export async function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = verifyJWT(token);
    if (payload.type === 'admin') {
      req.actor = { type: 'admin', id: payload.adminId, hospitalId: payload.hospitalId, name: payload.name };
      return next();
    }
    if (payload.type === 'credential') {
      const credential = await prisma.credential.findUnique({
        where: { id: payload.credentialId },
        select: { id: true, isActive: true, hospitalId: true, role: true, label: true },
      });
      if (!credential || !credential.isActive) {
        return res.status(401).json({ error: 'Credential has been revoked or does not exist' });
      }
      req.actor = { type: 'credential', id: credential.id, hospitalId: credential.hospitalId, role: credential.role, label: credential.label, name: credential.label };
      return next();
    }
    return res.status(401).json({ error: 'Invalid token type' });
  } catch (err) { return jwtError(err, res); }
}

// Patient portal token. req.actor.patientId is the ONLY record the caller may
// touch — every portal query must be scoped to it.
export async function authenticatePatient(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = verifyJWT(token);
    if (payload.type !== 'patient') return res.status(403).json({ error: 'Patient login required' });
    const account = await prisma.patientAccount.findUnique({
      where: { id: payload.patientAccountId },
      include: { patient: { select: { id: true, name: true } } },
    });
    if (!account || !account.isActive || !account.passwordHash) {
      return res.status(401).json({ error: 'Portal access has been revoked or does not exist' });
    }
    req.actor = {
      type: 'patient',
      id: account.id,                       // PatientAccount id
      patientId: account.patientId,
      hospitalId: account.hospitalId,
      role: 'PATIENT',
      name: account.patient.name,
      label: account.patient.name,
      mustChangePassword: account.mustChangePassword,
    };
    next();
  } catch (err) { return jwtError(err, res); }
}

// Blocks portal data routes until the temporary password has been replaced.
export function requirePasswordChanged(req, res, next) {
  if (req.actor?.mustChangePassword) {
    return res.status(403).json({ error: 'Please set a new password first', code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.actor?.type !== 'credential') return res.status(403).json({ error: 'Credential access required' });
    if (!roles.includes(req.actor.role)) return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
    next();
  };
}

function jwtError(err, res) {
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired — please log in again' });
  return res.status(401).json({ error: 'Invalid token' });
}
