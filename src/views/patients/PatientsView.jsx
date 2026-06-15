import { useState } from 'react';
import { PatientList }        from './PatientList';
import { PatientDetail }      from './PatientDetail';
import { PatientForm }        from './PatientForm';
import { PatientIntakeForm }  from './PatientIntakeForm';

const SCREENS = {
  LIST:         'LIST',
  DETAIL:       'DETAIL',
  ADD_PATIENT:  'ADD_PATIENT',   // → PatientIntakeForm (new mode)
  EDIT_PATIENT: 'EDIT_PATIENT',  // → PatientForm (demographics only)
  ADD_VISIT:    'ADD_VISIT',     // → PatientIntakeForm (visit mode)
};

/**
 * PatientsView — orchestrates the full patient workflow.
 *
 * ADD_PATIENT → PatientIntakeForm (demographics + consultation combined)
 * ADD_VISIT   → PatientIntakeForm (visit-only mode for existing patient)
 * EDIT_PATIENT → PatientForm (demographics only)
 *
 * @param {object[]} patients        - Clinic-filtered patient array (from state).
 * @param {object}   doctor          - Currently active doctor.
 * @param {object}   clinic          - Doctor's clinic.
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
  onUpdateVisit,
}) {
  const [screen,          setScreen]          = useState(SCREENS.LIST);
  const [selectedPatient, setSelectedPatient] = useState(null);

  /* ── Navigation helpers ── */
  const goList   = ()  => { setScreen(SCREENS.LIST);  setSelectedPatient(null); };
  const goDetail = (p) => { setScreen(SCREENS.DETAIL); setSelectedPatient(p);  };
  const goAdd    = ()  =>   setScreen(SCREENS.ADD_PATIENT);
  const goEdit   = ()  =>   setScreen(SCREENS.EDIT_PATIENT);
  const goVisit  = ()  =>   setScreen(SCREENS.ADD_VISIT);

  /* ── Handlers ── */

  // Called by PatientIntakeForm in "new" mode
  const handleIntakeSave = async (newPatient, visit) => {
    const saved = await onAddPatient(newPatient);
    if (visit && saved) {
      await onAddVisit(saved.id, visit);
    }
    // Navigate to the new patient's detail (use saved id from API)
    const withVisit = visit
      ? { ...saved, isReturning: false, visits: [visit] }
      : { ...(saved ?? newPatient), visits: [] };
    setSelectedPatient(withVisit);
    setScreen(SCREENS.DETAIL);
  };

  // Called when intake form detects a duplicate and doctor chooses "Add visit"
  // patientId = existing patient id; visit = null (just open the visit form)
  const handleDuplicateVisit = (patientId, _visit) => {
    const existing = patients.find((p) => p.id === patientId);
    if (existing) {
      setSelectedPatient(existing);
      setScreen(SCREENS.ADD_VISIT);
    }
  };

  const handleUpdatePatient = async (patient) => {
    const updated = await onUpdatePatient(patient);
    setSelectedPatient((prev) => ({ ...prev, ...(updated ?? patient) }));
    setScreen(SCREENS.DETAIL);
  };

  // Called by PatientIntakeForm in "visit" mode
  const handleAddVisit = async (patientId, visit) => {
    if (!visit) { setScreen(SCREENS.DETAIL); return; }
    const saved = await onAddVisit(patientId, visit);
    const updated = {
      ...selectedPatient,
      isReturning: true,
      visits: [saved ?? visit, ...(selectedPatient.visits ?? [])],
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
          onAddVisit={(patient) => {
            setSelectedPatient(patient);
            setScreen(SCREENS.ADD_VISIT);
          }}
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
        <PatientIntakeForm
          mode="new"
          allPatients={patients}
          clinicId={clinic?.id}
          doctorId={doctor?.id}
          onSave={handleIntakeSave}
          onAddVisitOnly={handleDuplicateVisit}
          onCancel={goList}
        />
      );

    case SCREENS.EDIT_PATIENT:
      return (
        <PatientForm
          patient={selectedPatient}
          clinicId={clinic?.id}
          doctorId={doctor?.id}
          onSave={handleUpdatePatient}
          onCancel={() => setScreen(SCREENS.DETAIL)}
        />
      );

    case SCREENS.ADD_VISIT:
      return (
        <PatientIntakeForm
          mode="visit"
          patient={selectedPatient}
          allPatients={patients}
          clinicId={clinic?.id}
          doctorId={doctor?.id}
          onAddVisitOnly={handleAddVisit}
          onCancel={() => setScreen(SCREENS.DETAIL)}
        />
      );

    default:
      return null;
  }
}
