import api from './api';

/** Fetch all patients for the authenticated doctor's clinic. */
export const listPatients = async () => {
  const { data } = await api.get('/patients');
  return data.data;   // Patient[]
};

/** Fetch a single patient by ID. */
export const getPatient = async (id) => {
  const { data } = await api.get(`/patients/${id}`);
  return data.data;
};

/** Create a new patient. */
export const createPatient = async (patient) => {
  const { data } = await api.post('/patients', patient);
  return data.data;
};

/** Update an existing patient's details. */
export const updatePatient = async (id, patch) => {
  const { data } = await api.put(`/patients/${id}`, patch);
  return data.data;
};

/** Add a visit to a patient's record. */
export const addVisit = async (patientId, visit) => {
  const { data } = await api.post(`/patients/${patientId}/visits`, visit);
  return data.data;
};
