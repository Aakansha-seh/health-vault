import api from './api';

/** Fetch all appointments for the clinic. */
export const listAppointments = async () => {
  const { data } = await api.get('/appointments');
  return data.data;
};

/** Create a new appointment. */
export const createAppointment = async (appt) => {
  const { data } = await api.post('/appointments', appt);
  return data.data;
};

/** Update appointment status (scheduled | completed | cancelled). */
export const updateAppointmentStatus = async (id, status) => {
  const { data } = await api.patch(`/appointments/${id}/status`, { status });
  return data.data;
};
