// Auth middleware — two token types: admin and credential
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
