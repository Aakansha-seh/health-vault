'use strict';
require('dotenv').config();

/**
 * Centralised environment config with validation.
 * The server refuses to start if required vars are missing.
 */

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key, fallback) {
  return process.env[key] ?? fallback;
}

module.exports = {
  NODE_ENV:   optional('NODE_ENV', 'development'),
  PORT:       Number(optional('PORT', 4000)),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET:           required('JWT_SECRET'),
  JWT_EXPIRES_IN:       optional('JWT_EXPIRES_IN', '8h'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:3000').split(','),

  OTP_EXPIRY_SECONDS: Number(optional('OTP_EXPIRY_SECONDS', 300)),
  OTP_MAX_ATTEMPTS:   Number(optional('OTP_MAX_ATTEMPTS', 3)),

  TWILIO_ACCOUNT_SID:   optional('TWILIO_ACCOUNT_SID', ''),
  TWILIO_AUTH_TOKEN:    optional('TWILIO_AUTH_TOKEN', ''),
  TWILIO_PHONE_NUMBER:  optional('TWILIO_PHONE_NUMBER', ''),

  BCRYPT_ROUNDS: Number(optional('BCRYPT_ROUNDS', 10)),

  get IS_PROD()    { return this.NODE_ENV === 'production'; },
  get TWILIO_LIVE(){ return !!(this.TWILIO_ACCOUNT_SID && this.TWILIO_AUTH_TOKEN && this.TWILIO_PHONE_NUMBER); },
};
