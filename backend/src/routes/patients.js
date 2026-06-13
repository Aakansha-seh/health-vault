'use strict';
const { Router }      = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl            = require('../controllers/patientController');

const router = Router();

router.get ('/',          requireAuth, ctrl.list);
router.post('/',          requireAuth, ctrl.create);
router.get ('/:id',       requireAuth, ctrl.getOne);
router.put ('/:id',       requireAuth, ctrl.update);
router.post('/:id/visits',requireAuth, ctrl.addVisit);

module.exports = router;
