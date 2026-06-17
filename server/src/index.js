// HealthVault API Server — Entry Point
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import clinicsRouter from './routes/clinics.js';
import doctorsRouter from './routes/doctors.js';
import patientsRouter from './routes/patients.js';
import visitsRouter from './routes/visits.js';
import appointmentsRouter from './routes/appointments.js';
import auditRouter from './routes/audit.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Accept one or more comma-separated origins (e.g. "http://localhost:3000,http://localhost:5173")
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header) and any whitelisted origin.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/patients', visitsRouter);       // /api/patients/:patientId/visits
app.use('/api/appointments', appointmentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/dashboard', dashboardRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🏥  HealthVault API running on http://localhost:${PORT}`);
  console.log(`    CORS allowed: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
