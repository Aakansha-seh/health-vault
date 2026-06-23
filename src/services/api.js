/**
 * HealthVault API Client v2
 *
 * Axios instance with automatic JWT injection and 401 handling.
 * Supports two token types: admin and credential.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'hv_token';

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url   = err.config?.url ?? '';
    const status = err.response?.status;
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/admin/login');

    const serverError = err.response?.data?.error;
    const details     = err.response?.data?.details;
    if (serverError) {
      // For validation errors, surface WHICH field(s) failed instead of a generic
      // "Validation failed" — details is the array of Zod issues from the backend.
      if (Array.isArray(details) && details.length) {
        const fieldMsgs = details.map((d) => {
          const field = Array.isArray(d.path) ? d.path.filter((p) => p !== undefined && p !== '').join('.') : '';
          return field ? `${field}: ${d.message}` : d.message;
        });
        err.message = `${serverError} — ${fieldMsgs.join('; ')}`;
      } else {
        err.message = serverError;
      }
    } else if (err.code === 'ECONNABORTED') {
      err.message = 'Request timed out. Check your connection.';
    } else if (!err.response) {
      err.message = 'Cannot reach the server. Make sure it is running.';
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
export const setToken   = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()  => localStorage.removeItem(TOKEN_KEY);
export const getToken   = ()  => localStorage.getItem(TOKEN_KEY);

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Admin login: POST /auth/admin/login → { token, actor } */
export const adminLogin      = (body)  => api.post('/auth/admin/login', body).then(r => r.data);

/** Credential login: POST /auth/login → { token, actor } */
export const credentialLogin = (body)  => api.post('/auth/login', body).then(r => r.data);

/** GET /auth/me → actor (admin or credential with profile accesses) */
export const getMe           = ()      => api.get('/auth/me').then(r => r.data);

/** POST /auth/logout */
export const logout          = ()      => api.post('/auth/logout').then(r => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────────

/** POST /admin/register → { hospital, admin } — one-time hospital setup */
export const registerHospital = (body) => api.post('/admin/register', body).then(r => r.data);

/** GET /admin/hospital */
export const getHospital      = ()     => api.get('/admin/hospital').then(r => r.data);

/** PATCH /admin/hospital */
export const updateHospital   = (body) => api.patch('/admin/hospital', body).then(r => r.data);

/** GET /admin/stats */
export const getAdminStats    = ()     => api.get('/admin/stats').then(r => r.data);

// ── Credentials ───────────────────────────────────────────────────────────────

/** GET /credentials */
export const getCredentials       = ()         => api.get('/credentials').then(r => r.data);

/** POST /credentials */
export const createCredential     = (body)     => api.post('/credentials', body).then(r => r.data);

/** PATCH /credentials/:id */
export const updateCredential     = (id, body) => api.patch(`/credentials/${id}`, body).then(r => r.data);

/** POST /credentials/:id/reset-password */
export const resetCredentialPassword = (id, body) =>
  api.post(`/credentials/${id}/reset-password`, body).then(r => r.data);

// ── Doctor Profiles ───────────────────────────────────────────────────────────

/** GET /doctor-profiles */
export const getDoctorProfiles  = ()         => api.get('/doctor-profiles').then(r => r.data);

/** POST /doctor-profiles */
export const createDoctorProfile = (body)    => api.post('/doctor-profiles', body).then(r => r.data);

/** GET /doctor-profiles/:id */
export const getDoctorProfile   = (id)       => api.get(`/doctor-profiles/${id}`).then(r => r.data);

/** PATCH /doctor-profiles/:id */
export const updateDoctorProfile = (id, body) => api.patch(`/doctor-profiles/${id}`, body).then(r => r.data);

/** DELETE /doctor-profiles/:id */
export const deleteDoctorProfile = (id)      => api.delete(`/doctor-profiles/${id}`).then(r => r.data);

// ── Profile Access ────────────────────────────────────────────────────────────

/** GET /profile-access/:credentialId */
export const getProfileAccess  = (credId)  => api.get(`/profile-access/${credId}`).then(r => r.data);

/** POST /profile-access — { credentialId, doctorProfileId, permission } */
export const grantAccess       = (body)    => api.post('/profile-access', body).then(r => r.data);

/** DELETE /profile-access/:credId/:profileId */
export const revokeAccess      = (credId, profileId) =>
  api.delete(`/profile-access/${credId}/${profileId}`).then(r => r.data);

// ── Permission Requests ───────────────────────────────────────────────────────

/** POST /permission-requests — { doctorProfileId, reason? } */
export const requestWriteAccess = (body) => api.post('/permission-requests', body).then(r => r.data);

/** GET /permission-requests */
export const getPermissionRequests = ()  => api.get('/permission-requests').then(r => r.data);

/** PATCH /permission-requests/:id/resolve — { decision: 'APPROVED'|'DENIED' } */
export const resolvePermissionRequest = (id, body) =>
  api.patch(`/permission-requests/${id}/resolve`, body).then(r => r.data);

// ── Patients ──────────────────────────────────────────────────────────────────

/** GET /patients — { patients, total, page, pages } */
export const getPatients   = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))).toString();
  return api.get(`/patients${q ? `?${q}` : ''}`).then(r => r.data);
};

/** POST /patients */
export const addPatient    = (body)     => api.post('/patients', body).then(r => r.data);

/** POST /patients/intake — combined: patient + first visit + optional next appointment */
export const createPatientIntake = (body) => api.post('/patients/intake', body).then(r => r.data);

// ── Uploads (Azure Blob via short-lived SAS) ──────────────────────────────────

/** GET /uploads/config → { configured } */
export const getUploadConfig = () => api.get('/uploads/config').then(r => r.data);

/**
 * Upload a File directly to Azure Blob Storage using a server-issued SAS URL.
 * Returns { name, url, type } suitable for a visit's testReports array.
 */
export const uploadReportFile = async (file) => {
  const ct = file.type || 'application/octet-stream';
  const { uploadUrl, blobUrl } = await api
    .post('/uploads/sas', { fileName: file.name, contentType: ct })
    .then(r => r.data);

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': ct },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status}). Check the storage account's CORS settings.`);
  return { name: file.name, url: blobUrl, type: ct };
};

/** GET /patients/:id */
export const getPatient    = (id)       => api.get(`/patients/${id}`).then(r => r.data);

/** PATCH /patients/:id */
export const updatePatient = (id, body) => api.patch(`/patients/${id}`, body).then(r => r.data);

// ── Visits ────────────────────────────────────────────────────────────────────

/** POST /patients/:pid/visits */
export const addVisit    = (pid, body)          => api.post(`/patients/${pid}/visits`, body).then(r => r.data);

/** PATCH /patients/:pid/visits/:vid */
export const updateVisit = (pid, vid, body)     => api.patch(`/patients/${pid}/visits/${vid}`, body).then(r => r.data);

// ── Appointments ──────────────────────────────────────────────────────────────

/** GET /appointments */
export const getAppointments   = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))).toString();
  return api.get(`/appointments${q ? `?${q}` : ''}`).then(r => r.data);
};

/** POST /appointments */
export const addAppointment    = (body)     => api.post('/appointments', body).then(r => r.data);

/** PATCH /appointments/:id */
export const updateAppointment = (id, body) => api.patch(`/appointments/${id}`, body).then(r => r.data);

// ── Audit ─────────────────────────────────────────────────────────────────────

/** GET /audit — { logs, total, page, pages } */
export const getAuditLog = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))).toString();
  return api.get(`/audit${q ? `?${q}` : ''}`).then(r => r.data);
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

/** GET /dashboard/stats — optional profileId narrows a doctor to one profile */
export const getDashboardStats = (profileId) =>
  api.get(`/dashboard/stats${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`).then(r => r.data);

/** GET /dashboard/chart — optional profileId narrows a doctor to one profile */
export const getDashboardChart = (profileId) =>
  api.get(`/dashboard/chart${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`).then(r => r.data);

// ── AI ────────────────────────────────────────────────────────────────────────

/** GET /ai/models → { models, tier, usage } */
export const getAIModels    = ()      => api.get('/ai/models').then(r => r.data);

/** POST /ai/summary → { summary, model, promptTokens, outputTokens } */
export const generateAISummary = (body) => api.post('/ai/summary', body).then(r => r.data);

// ── Subscriptions ─────────────────────────────────────────────────────────────

/** GET /subscriptions/me */
export const getSubscription     = () => api.get('/subscriptions/me').then(r => r.data);

/** POST /subscriptions/checkout → { subscriptionId, keyId, shortUrl } (Razorpay) */
export const createCheckout      = () => api.post('/subscriptions/checkout').then(r => r.data);

/** POST /subscriptions/cancel → { message } */
export const cancelSubscription  = () => api.post('/subscriptions/cancel').then(r => r.data);
