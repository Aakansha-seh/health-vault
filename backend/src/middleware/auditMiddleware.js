'use strict';
const prisma = require('../config/db');

/**
 * makeAuditLogger(action) — factory that returns a middleware which writes
 * an audit entry AFTER the response is sent.
 *
 * Usage in a route:
 *   router.post('/patients', requireAuth, makeAuditLogger('ADD_PATIENT'), createPatient);
 */
module.exports.makeAuditLogger = (action) => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    originalJson(body);                       // send response first
    if (body?.success && req.user?.doctorId) {
      prisma.auditLog.create({
        data: {
          action,
          detail:   body?.data?.id ? `ID: ${body.data.id}` : '',
          doctorId: req.user.doctorId,
        },
      }).catch(() => { /* non-blocking — never crash on audit failure */ });
    }
  };

  next();
};
