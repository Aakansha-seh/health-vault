'use strict';
const { verifyToken } = require('../services/jwtService');
const { unauthorised } = require('../utils/response');

/**
 * requireAuth — verifies the Bearer JWT on every protected route.
 * Attaches { doctorId, clinicId } to req.user on success.
 */
module.exports.requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return unauthorised(res, 'No token provided.');

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) return unauthorised(res, 'Invalid or expired token.');

  req.user = payload;   // { doctorId, clinicId, name }
  next();
};

/**
 * requireClinic — ensures the requesting doctor belongs to the target clinic.
 * Reads :clinicId from the route params.
 */
module.exports.requireClinic = (req, res, next) => {
  if (req.user.clinicId !== req.params.clinicId) {
    return unauthorised(res, 'You do not have access to this clinic.');
  }
  next();
};
