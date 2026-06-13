import api from './api';

/**
 * Fetch paginated audit log entries.
 * @param {number} page   - 1-based page number.
 * @param {number} limit  - Entries per page (max 100).
 * @param {string} action - Optional action filter (e.g. 'LOGIN').
 */
export const listAudit = async ({ page = 1, limit = 50, action = '' } = {}) => {
  const params = { page, limit, ...(action && { action }) };
  const { data } = await api.get('/audit', { params });
  return data.data;   // { entries, total, page, pages }
};
