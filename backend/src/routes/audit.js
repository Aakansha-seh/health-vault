'use strict';
const { Router }      = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl            = require('../controllers/auditController');

const router = Router();

router.get('/', requireAuth, ctrl.list);

module.exports = router;
