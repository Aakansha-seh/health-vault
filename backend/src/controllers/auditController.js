'use strict';
const prisma = require('../config/db');
const R      = require('../utils/response');

// GET /audit?page=1&limit=50&action=LOGIN
exports.list = async (req, res, next) => {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1);
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const action = req.query.action;

    const where = {
      doctor: { clinicId: req.user.clinicId },
      ...(action && { action }),
    };

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { doctor: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return R.ok(res, { entries, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};
