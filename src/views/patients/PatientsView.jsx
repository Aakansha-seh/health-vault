import { useState } from 'react';
import { PatientList }   from './PatientList';
import { PatientDetail } from './PatientDetail';
import { PatientForm }   from './PatientForm';
import { VisitForm }     from './VisitForm';

const SCREENS = {
  LIST:         'LIST',
  DETAIL:       'DETAIL',
  ADD_PATIENT:  'ADD_PATIENT',
  EDIT_PATIENT: 'EDIT_PATIENT',
  ADD_VISIT:    'ADD_VISIT',
};

/**
 * PatientsView — orchestrates the full patient workflow.
 *
 * @param {object[]} patients  - Clinic-filtered patient array (from state).
 * @param {object}   doctor    - Currently active doctor.
 * @param {object}   clinic    - Doctor's clinic.
 * @param {Function} onAddPatient    - dispatch → ADD_PATIENT
 * @param {Function} onUpdatePatient - dispatch → UPDATE_PATIENT
 * @param {Function} onAddVisit      - dispatch → ADD_VISIT
 */
export function PatientsView({
  patients,
  doctor,
  clinic,
  onAddPatient,
  onUpdatePatient,
  onAddVisit,
}) {
  const [screen,          setScreen]          = useState(SCREENS.LIST);
  const [selectedPatient, setSelectedPatient] = useState(null);

  /* ── Navigation helpers ── */
  const goList   = ()      => { setScreen(SCREENS.LIST);         setSelectedPatient(null);    };
  const goDetail = (p)     => { setScreen(SCREENS.DETAIL);       setSelectedPatient(p);       };
  const goAdd    = ()      =>   setScreen(SCREENS.ADD_PATIENT);
  const goEdit   = ()      =>   setScreen(SCREENS.EDIT_PATIENT);
  const goVisit  = ()      =>   setScreen(SCREENS.ADD_VISIT);

  /* ── Handlers ── */
  const handleAddPatient = (patient) => {
    onAddPatient(patient);
    goList();
  };

  const handleUpdatePatient = (patient) => {
    onUpdatePatient(patient);
    // Refresh selectedPatient so PatientDetail gets updated props.
    setSelectedPatient(patient);
    setScreen(SCREENS.DETAIL);
  };

  const handleAddVisit = (visit) => {
    onAddVisit(selectedPatient.id, visit);
    // Optimistically update local selected patient state for instant UI refresh.
    const updated = {
      ...selectedPatient,
      isReturning: true,
      visits:      [...selectedPatient.visits, visit],
    };
    setSelectedPatient(updated);
    setScreen(SCREENS.DETAIL);
  };

  /* ── Render ── */
  switch (screen) {
    case SCREENS.LIST:
      return (
        <PatientList
          patients={patients}
          onSelect={goDetail}
          onAddNew={goAdd}
        />
      );

    case SCREENS.DETAIL:
      return (
        <PatientDetail
          patient={selectedPatient}
          doctor={doctor}
          clinic={clinic}
          onBack={goList}
          onEdit={goEdit}
          onAddVisit={goVisit}
        />
      );

    case SCREENS.ADD_PATIENT:
      return (
        <PatientForm
          patient={null}
          clinicId={clinic.id}
          doctorId={doctor.id}
          onSave={handleAddPatient}
          onCancel={goList}
        />
      );

    case SCREENS.EDIT_PATIENT:
      return (
        <PatientForm
          patient={selectedPatient}
          clinicId={clinic.id}
          doctorId={doctor.id}
          onSave={handleUpdatePatient}
          onCancel={() => setScreen(SCREENS.DETAIL)}
        />
      );

    case SCREENS.ADD_VISIT:
      return (
        <VisitForm
          patient={selectedPatient}
          onSave={handleAddVisit}
          onCancel={() => setScreen(SCREENS.DETAIL)}
        />
      );

    default:
      return null;
  }
}
