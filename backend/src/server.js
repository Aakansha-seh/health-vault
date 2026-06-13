'use strict';
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const env          = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const routes       = require('./routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      env.CORS_ORIGINS,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (!env.IS_PROD) app.use(morgan('dev'));
else              app.use(morgan('combined'));

// ── Global rate limiter (100 req / 15 min per IP) ─────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found.` }));

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`\n🏥  HealthVault API running on http://localhost:${env.PORT}`);
  console.log(`    Environment : ${env.NODE_ENV}`);
  console.log(`    Twilio SMS  : ${env.TWILIO_LIVE ? 'LIVE' : 'DEMO (OTP printed to console)'}\n`);
});
