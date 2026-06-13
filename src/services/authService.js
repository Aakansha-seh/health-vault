import api from './api';

const TOKEN_KEY = 'hv_token';

/** Persist token to localStorage after login/register. */
const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Remove token on logout. */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Check if a token exists (used to skip splash + login on page reload). */
export const hasToken = () => !!localStorage.getItem(TOKEN_KEY);

/**
 * sendOtp(phone) — requests an OTP for the given phone number.
 * Returns { demo: boolean, otp?: string } — otp only present in demo mode.
 */
export const sendOtp = async (phone) => {
  const { data } = await api.post('/auth/send-otp', { phone });
  return data.data;   // { demo, otp? }
};

/**
 * verifyOtp(phone, otp) — verifies the OTP on the server.
 * Returns { verified: true } or throws.
 */
export const verifyOtp = async (phone, otp) => {
  const { data } = await api.post('/auth/verify-otp', { phone, otp });
  return data.data;
};

/**
 * loginDoctor(phone, password) — authenticates a doctor by phone + password.
 * Saves the JWT and returns the doctor object.
 */
export const loginDoctor = async (phone, password) => {
  const { data } = await api.post('/auth/login', { phone, password, role: 'doctor' });
  saveToken(data.data.token);
  return data.data.doctor;
};

/**
 * loginClinic(phone, password) — authenticates a clinic.
 * Returns the clinic object with its doctors (no JWT — clinic doesn't get a session).
 */
export const loginClinic = async (phone, password) => {
  const { data } = await api.post('/auth/login', { phone, password, role: 'clinic' });
  return data.data.clinic;
};

/**
 * register(payload) — registers a new doctor (OTP must have been verified).
 * Saves the JWT and returns the new doctor object.
 */
export const register = async ({ phone, otp, name, specialisation, clinicId, password, regNumber, clinicHours, yearsPractice }) => {
  const { data } = await api.post('/auth/register', {
    phone, otp, name, specialisation, clinicId, password,
    regNumber, clinicHours, yearsPractice,
  });
  saveToken(data.data.token);
  return data.data.doctor;
};
