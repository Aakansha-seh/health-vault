'use strict';
const { Router }  = require('express');
const rateLimit   = require('express-rate-limit');
const ctrl        = require('../controllers/authController');

const router = Router();

// Tighter rate limit on OTP endpoints — 5 requests per 10 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      5,
  message:  { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
});

router.post('/send-otp',   otpLimiter, ctrl.sendOtp);
router.post('/verify-otp', otpLimiter, ctrl.verifyOtp);
router.post('/login',      ctrl.login);
router.post('/register',   ctrl.register);

module.exports = router;
