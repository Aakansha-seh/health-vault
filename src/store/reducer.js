import { SAMPLE_CLINICS, SAMPLE_DOCTORS, SAMPLE_PATIENTS, SAMPLE_APPOINTMENTS } from '../data/sampleData';

// ─── Initial state ────────────────────────────────────────────────────────────
export const initialState = {
  clinics:          SAMPLE_CLINICS,
  doctors:          SAMPLE_DOCTORS,
  currentDoctorId:  null,
  currentClinicId:  null,   // set when a clinic admin is logged in
  patients:         SAMPLE_PATIENTS,
  appointments:     SAMPLE_APPOINTMENTS,
  auditLog:         [],
};

// ─── Action types ─────────────────────────────────────────────────────────────
export const ACTIONS = {
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',
  LOGIN_CLINIC:       'LOGIN_CLINIC',
  LOGOUT_CLINIC:      'LOGOUT_CLINIC',
  REGISTER_DOCTOR:    'REGISTER_DOCTOR',
  UPDATE_CLINIC:      'UPDATE_CLINIC',
  ADD_PATIENT:        'ADD_PATIENT',
  UPDATE_PATIENT:     'UPDATE_PATIENT',
  ADD_VISIT:          'ADD_VISIT',
  ADD_APPOINTMENT:    'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  UPDATE_DOCTOR:      'UPDATE_DOCTOR',
  AUDIT:              'AUDIT',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOGIN:
      return { ...state, currentDoctorId: action.doctorId };

    case ACTIONS.LOGOUT:
      return { ...state, currentDoctorId: null };

    case ACTIONS.LOGIN_CLINIC:
      return { ...state, currentClinicId: action.clinicId, currentDoctorId: null };

    case ACTIONS.LOGOUT_CLINIC:
      return { ...state, currentClinicId: null };

    case ACTIONS.UPDATE_CLINIC:
      return {
        ...state,
        clinics: state.clinics.map((c) =>
          c.id === action.clinicId ? { ...c, ...action.payload } : c
        ),
      };

    case ACTIONS.REGISTER_DOCTOR:
      return { ...state, doctors: [...state.doctors, action.payload] };

    case ACTIONS.ADD_PATIENT:
      return { ...state, patients: [...state.patients, action.payload] };

    case ACTIONS.UPDATE_PATIENT:
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case ACTIONS.ADD_VISIT:
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId
            ? { ...p, isReturning: true, visits: [...p.visits, action.visit] }
            : p
        ),
      };

    case ACTIONS.ADD_APPOINTMENT:
      return { ...state, appointments: [...state.appointments, action.payload] };

    case ACTIONS.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };

    case ACTIONS.UPDATE_DOCTOR:
      return {
        ...state,
        doctors: state.doctors.map((d) =>
          d.id === action.doctorId ? { ...d, ...action.payload } : d
        ),
      };

    case ACTIONS.AUDIT:
      // Cap at 500 entries so the list never grows unbounded.
      return { ...state, auditLog: [action.entry, ...state.auditLog].slice(0, 500) };

    default:
      return state;
  }
}
