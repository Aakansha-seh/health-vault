'use strict';
const bcrypt  = require('bcryptjs');
const prisma  = require('../config/db');
const env     = require('../config/env');

// Twilio client — only instantiated when credentials are present
let twilioClient = null;
if (env.TWILIO_LIVE) {
  const twilio  = require('twilio');
  twilioClient  = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * generateOtp() — returns a 6-digit numeric string.
 */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * sendOtp(phone) — generates, hashes, and persists an OTP session.
 * Sends SMS via Twilio if credentials are configured, otherwise logs to console.
 *
 * Returns the plain OTP only in demo mode (for display in the frontend banner).
 */
const sendOtp = async (phone) => {
  const otp      = generateOtp();
  const hashed   = await bcrypt.hash(otp, env.BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

  // Invalidate any existing un-verified sessions for this phone
  await prisma.otpSession.updateMany({
    where:  { phone, verified: false },
    data:   { expiresAt: new Date(0) },   // expire immediately
  });

  await prisma.otpSession.create({
    data: { phone, otp: hashed, expiresAt },
  });

  if (twilioClient) {
    await twilioClient.messages.create({
      body: `Your HealthVault OTP is ${otp}. Valid for ${env.OTP_EXPIRY_SECONDS / 60} minutes. Do not share it.`,
      from: env.TWILIO_PHONE_NUMBER,
      to:   `+91${phone}`,
    });
    return { demo: false };
  } else {
    // Demo mode — return OTP in response so frontend can show it
    console.log(`\n📱  [DEMO OTP] Phone: ${phone}  →  OTP: ${otp}\n`);
    return { demo: true, otp };
  }
};

/**
 * verifyOtp(phone, otp) — checks the OTP against the stored hash.
 * Returns { valid: true } or { valid: false, reason }.
 * Marks the session verified on success, increments attempts on failure.
 */
const verifyOtp = async (phone, otp) => {
  const session = await prisma.otpSession.findFirst({
    where:   { phone, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) return { valid: false, reason: 'OTP expired or not found. Please request a new one.' };

  if (session.attempts >= env.OTP_MAX_ATTEMPTS) {
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const match = await bcrypt.compare(otp, session.otp);
  if (!match) {
    await prisma.otpSession.update({
      where: { id: session.id },
      data:  { attempts: { increment: 1 } },
    });
    const remaining = env.OTP_MAX_ATTEMPTS - session.attempts - 1;
    return { valid: false, reason: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }

  await prisma.otpSession.update({
    where: { id: session.id },
    data:  { verified: true },
  });

  return { valid: true, sessionId: session.id };
};

module.exports = { sendOtp, verifyOtp };
