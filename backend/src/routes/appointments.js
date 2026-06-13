'use strict';
const { Router }      = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl            = require('../controllers/appointmentController');

const router = Router();

router.get  ('/',             requireAuth, ctrl.list);
router.post ('/',             requireAuth, ctrl.create);
router.patch('/:id/status',   requireAuth, ctrl.updateStatus);

module.exports = router;
