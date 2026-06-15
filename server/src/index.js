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
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
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
  console.log(`    CORS allowed: ${ALLOWED_ORIGIN}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
