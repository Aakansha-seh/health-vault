import api from './api';

/** Fetch the currently authenticated doctor's full profile. */
export const getMe = async () => {
  const { data } = await api.get('/doctors/me');
  return data.data;
};

/** Update the currently authenticated doctor's profile. */
export const updateMe = async (patch) => {
  const { data } = await api.put('/doctors/me', patch);
  return data.data;
};
