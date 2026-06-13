'use strict';
const prisma = require('../config/db');

/**
 * log(doctorId, action, detail) — fire-and-forget audit entry.
 * Never throws — audit must never break the main request.
 */
const log = async (doctorId, action, detail = '') => {
  try {
    await prisma.auditLog.create({ data: { doctorId, action, detail } });
  } catch (err) {
    console.error('[AuditService] Failed to write audit log:', err.message);
  }
};

module.exports = { log };
