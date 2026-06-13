'use strict';
const { Router }     = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl            = require('../controllers/doctorController');

const router = Router();

router.get ('/me',  requireAuth, ctrl.getMe);
router.put ('/me',  requireAuth, ctrl.updateMe);

module.exports = router;
