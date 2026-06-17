/**
 * HealthVault API Client
 *
 * Axios instance with automatic JWT injection and 401 handling,
 * plus one named export per backend endpoint.
 *
 * Usage:
 *   import { getPatients, addPatient, logAudit } from '@/services/api';
 *   const patients = await getPatients();
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const TOKEN_KEY = 'hv_token';

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handling:
//   1. Surface the backend's human-readable error on err.message so forms/toasts
//      can show "Invalid email or password" instead of "Request failed with status code 401".
//   2. On a 401 from a *protected* request (expired/invalid session), reset to the
//      login screen — but NEVER for an in-progress login/signup attempt, whose 401
//      simply means "wrong credentials" and must reach the form unmodified.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url ?? '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/signup');
    const status = err.response?.status;

    // Normalise the error message for the UI
    const serverError = err.response?.data?.error;
    if (serverError) {
      err.message = serverError;
    } else if (err.code === 'ECONNABORTED') {
      err.message = 'Request timed out. Please check your connection and try again.';
    } else if (!err.response) {
      err.message = 'Cannot reach the server. Please make sure it is running and try again.';
    }

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Token helpers ─────────────────────────────────────────────────────────────

export const setToken  = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = ()     => localStorage.removeItem(TOKEN_KEY);
export const getToken  = ()      => localStorage.getItem(TOKEN_KEY);

// ── Auth ──────────────────────────────────────────────────────────────────────

/** POST /auth/login — { email, password } → { token, doctor } */
export const login   = (body) => api.post('/auth/login',  body).then((r) => r.data);

/** POST /auth/signup — { name, email, password, ... } → { token, doctor } */
export const signup  = (body) => api.post('/auth/signup', body).then((r) => r.data);

/** GET /auth/me — current doctor from token */
export const getMe   = ()     => api.get('/auth/me').then((r) => r.data);

// ── Clinics ───────────────────────────────────────────────────────────────────

/** GET /clinics — all clinics (public, used on login/signup screen) */
export const getClinics   = ()     => api.get('/clinics').then((r) => r.data);

/** POST /clinics — create a clinic */
export const createClinic = (body) => api.post('/clinics', body).then((r) => r.data);

// ── Doctors ───────────────────────────────────────────────────────────────────

/** GET /doctors — all doctors (public, used on login/signup screen) */
export const getDoctors   = ()        => api.get('/doctors').then((r) => r.data);

/** GET /doctors/:id */
export const getDoctor    = (id)      => api.get(`/doctors/${id}`).then((r) => r.data);

/** PATCH /doctors/:id — update profile fields */
export const updateDoctor = (id, body) => api.patch(`/doctors/${id}`, body).then((r) => r.data);

// ── Patients ──────────────────────────────────────────────────────────────────

/** GET /patients — all patients for current clinic */
export const getPatients   = ()         => api.get('/patients').then((r) => r.data);

/** POST /patients — create patient */
export const addPatient    = (body)     => api.post('/patients', body).then((r) => r.data);

/** GET /patients/:id — patient + all visits */
export const getPatient    = (id)       => api.get(`/patients/${id}`).then((r) => r.data);

/** PATCH /patients/:id — update patient (e.g. isReturning) */
export const updatePatient = (id, body) => api.patch(`/patients/${id}`, body).then((r) => r.data);

// ── Visits ────────────────────────────────────────────────────────────────────

/** POST /patients/:patientId/visits — add a visit */
export const addVisit = (patientId, body) =>
  api.post(`/patients/${patientId}/visits`, body).then((r) => r.data);

/** PATCH /patients/:patientId/visits/:visitId — edit a visit */
export const updateVisit = (patientId, visitId, body) =>
  api.patch(`/patients/${patientId}/visits/${visitId}`, body).then((r) => r.data);

// ── Appointments ──────────────────────────────────────────────────────────────

/**
 * GET /appointments — all appointments for current clinic
 * @param {{ status?: string, date?: string }} [filters]
 */
export const getAppointments = (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return api.get(`/appointments${params ? `?${params}` : ''}`).then((r) => r.data);
};

/** POST /appointments — create appointment */
export const addAppointment = (body) =>
  api.post('/appointments', body).then((r) => r.data);

/** PATCH /appointments/:id — update status, gcalSynced, etc. */
export const updateAppointment = (id, body) =>
  api.patch(`/appointments/${id}`, body).then((r) => r.data);

// ── Audit Log ─────────────────────────────────────────────────────────────────

/**
 * GET /audit — clinic audit entries
 * @param {{ action?: string, doctorId?: string, limit?: number }} [filters]
 */
export const getAuditLog = (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return api.get(`/audit${params ? `?${params}` : ''}`).then((r) => r.data);
};

/**
 * POST /audit — log a user action.
 * Call this from the frontend after every significant user action.
 *
 * @param {'LOGIN'|'LOGOUT'|'LOCK_SESSION'|'VIEW_PATIENT'|'ADD_PATIENT'|'UPDATE_PATIENT'|
 *         'ADD_VISIT'|'EDIT_VISIT'|'ADD_APPOINTMENT'|'UPDATE_APPOINTMENT'|
 *         'COMPLETE_APPOINTMENT'|'CANCEL_APPOINTMENT'|'GCAL_SYNC'|
 *         'PRINT_PRESCRIPTION'|'EDIT_PROFILE'} action
 * @param {string} [details]
 */
export const logAudit = (action, details) =>
  api.post('/audit', { action, details }).then((r) => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────

/** GET /dashboard/stats → { totalPatients, newThisMonth, returningThisMonth, upcomingAppointments } */
export const getDashboardStats = () => api.get('/dashboard/stats').then((r) => r.data);

/** GET /dashboard/chart → [{ month, newPts, returning }] — last 6 months */
export const getDashboardChart = () => api.get('/dashboard/chart').then((r) => r.data);
