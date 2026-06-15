// JWT authentication middleware
// Attaches req.user = { doctorId, clinicId, doctorName } from verified token

import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      doctorId: payload.doctorId,
      clinicId: payload.clinicId,
      doctorName: payload.doctorName,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — please log in again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
