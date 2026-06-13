'use strict';
const { Router } = require('express');
const router = Router();

router.use('/auth',         require('./auth'));
router.use('/doctors',      require('./doctors'));
router.use('/patients',     require('./patients'));
router.use('/appointments', require('./appointments'));
router.use('/audit',        require('./audit'));

module.exports = router;
