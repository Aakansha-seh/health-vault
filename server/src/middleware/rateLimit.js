// Rate limiting middleware — protects against brute-force and DDoS
import rateLimit from 'express-rate-limit';

const W  = parseInt(process.env.RATE_LIMIT_WINDOW_MS  || '900000',  10); // 15 min
const M  = parseInt(process.env.RATE_LIMIT_MAX         || '100',     10);
const AM = parseInt(process.env.AUTH_RATE_LIMIT_MAX    || '10',      10);
const AW = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS|| '3600000', 10); // 1 hr
const AI = parseInt(process.env.AI_RATE_LIMIT_MAX      || '20',      10);

const handler = (req, res) =>
  res.status(429).json({ error: 'Too many requests — please try again later.' });

// General API limiter — applied globally
export const generalLimiter = rateLimit({
  windowMs: W,
  max: M,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Auth limiter — stricter, for login endpoints
export const authLimiter = rateLimit({
  windowMs: W,
  max: AM,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => req.ip + (req.body?.username || req.body?.email || ''),
});

// AI limiter — per IP+credential, hourly window
export const aiLimiter = rateLimit({
  windowMs: AW,
  max: AI,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
