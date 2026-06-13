/**
 * api.js — Axios instance with automatic JWT injection and token refresh handling.
 *
 * All API service modules import this instance instead of raw axios.
 * The interceptors transparently attach the Bearer token from localStorage
 * and handle 401s by clearing the session and reloading.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hv_token');
      // Trigger full re-render by reloading — App will show LoginScreen
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
