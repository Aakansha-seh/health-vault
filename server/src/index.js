// HealthVault API Server — Entry Point v2
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { errorHandler }     from './middleware/errorHandler.js';
import { generalLimiter }   from './middleware/rateLimit.js';

// Routers
import authRouter             from './routes/auth.js';
import adminRouter            from './routes/admin.js';
import credentialsRouter      from './routes/credentials.js';
import doctorProfilesRouter   from './routes/doctorProfiles.js';
import profileAccessRouter    from './routes/profileAccess.js';
import permissionReqRouter    from './routes/permissionRequests.js';
import patientsRouter         from './routes/patients.js';
import visitsRouter           from './routes/visits.js';
import appointmentsRouter     from './routes/appointments.js';
import auditRouter            from './routes/audit.js';
import dashboardRouter        from './routes/dashboard.js';
import aiRouter               from './routes/ai.js';
import subscriptionsRouter    from './routes/subscriptions.js';
import webhooksRouter         from './routes/webhooks.js';
import uploadsRouter          from './routes/uploads.js';
import portalRouter           from './routes/portal.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);

// Razorpay webhook MUST receive raw body (for HMAC verification) — mount BEFORE express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

// Security & parsing
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));  // 25mb so base64-encoded report uploads fit
app.set('trust proxy', 1);

// Global rate limiter
app.use('/api', generalLimiter);

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
);

// API Routes
app.use('/api/auth',                authRouter);
app.use('/api/admin',               adminRouter);
app.use('/api/credentials',         credentialsRouter);
app.use('/api/doctor-profiles',     doctorProfilesRouter);
app.use('/api/profile-access',      profileAccessRouter);
app.use('/api/permission-requests', permissionReqRouter);
app.use('/api/patients',            patientsRouter);
app.use('/api/patients',            visitsRouter);
app.use('/api/appointments',        appointmentsRouter);
app.use('/api/audit',               auditRouter);
app.use('/api/dashboard',           dashboardRouter);
app.use('/api/ai',                  aiRouter);
app.use('/api/subscriptions',       subscriptionsRouter);
app.use('/api/uploads',             uploadsRouter);
app.use('/api/portal',              portalRouter);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use(errorHandler);

// Safety net: log async/uncaught errors instead of letting them crash the
// process. (A pm2/systemd restart still happens if the process truly dies.)
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Start
app.listen(PORT, () => {
  console.log(`\n  HealthVault API v2`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  CORS: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`  Env: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
