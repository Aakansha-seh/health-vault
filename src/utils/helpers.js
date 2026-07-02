/**
 * General-purpose helpers used across the app.
 */

/** Generates a short random ID suitable for client-side entity creation. */
export const uid = () => Math.random().toString(36).slice(2, 9);

/** Parses raw doctor-patient conversation transcripts into structured EMR fields. */
export function parseClinicalTranscript(text) {
  const result = {
    chiefComplaint: '',
    diagnosis: '',
    testsPrescribed: '',
    prescription: '',
    notes: ''
  };

  if (!text) return result;

  // Split transcript into lines/sentences
  const sentences = text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const complaintKeywords = ['complain', 'fever', 'pain', 'cough', 'symptom', 'cold', 'ache', 'vomit', 'nausea', 'since', 'days', 'weeks', 'hurt', 'throat', 'headache', 'swelling', 'itch', 'chills', 'fatigue', 'tired'];
  const diagnosisKeywords = ['diagnos', 'infection', 'disease', 'looks like', 'condition', 'positive for', 'negative for', 'inflammation', 'syndrome', 'acute', 'chronic', 'diabetes', 'hypertension', 'migraine', 'flu', 'bronchitis', 'asthma'];
  const testKeywords = ['test', 'blood', 'x-ray', 'mri', 'ultrasound', 'cbc', 'scan', 'lab', 'checkup', 'urine', 'ecg', 'ekg', 'biopsy'];
  const prescriptionKeywords = ['prescrib', 'take', 'mg', 'tablet', 'pill', 'capsule', 'dosage', 'daily', 'twice', 'three times', 'ml', 'ointment', 'dose', 'medication', 'paracetamol', 'amoxicillin', 'ibuprofen', 'aspirin', 'mg/day'];
  const notesKeywords = ['advice', 'advise', 'drink', 'rest', 'avoid', 'follow up', 'return', 'eat', 'exercise', 'bedrest', 'sleep', 'hydrated', 'diet'];

  const complaintLines = [];
  const diagnosisLines = [];
  const testLines = [];
  const prescriptionLines = [];
  const notesLines = [];

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    
    // Check match scores
    const isPrescription = prescriptionKeywords.some(kw => lower.includes(kw));
    const isTest = testKeywords.some(kw => lower.includes(kw));
    const isDiagnosis = diagnosisKeywords.some(kw => lower.includes(kw));
    const isComplaint = complaintKeywords.some(kw => lower.includes(kw));
    const isNote = notesKeywords.some(kw => lower.includes(kw));

    if (isPrescription) {
      prescriptionLines.push(sentence);
    } else if (isTest) {
      testLines.push(sentence);
    } else if (isDiagnosis) {
      diagnosisLines.push(sentence);
    } else if (isComplaint) {
      complaintLines.push(sentence);
    } else if (isNote) {
      notesLines.push(sentence);
    } else {
      notesLines.push(sentence);
    }
  });

  result.chiefComplaint = complaintLines.join('. ') + (complaintLines.length ? '.' : '');
  result.diagnosis = diagnosisLines.join('. ') + (diagnosisLines.length ? '.' : '');
  result.testsPrescribed = testLines.join('. ') + (testLines.length ? '.' : '');
  result.prescription = prescriptionLines.join('. ') + (prescriptionLines.length ? '.' : '');
  result.notes = notesLines.join('. ') + (notesLines.length ? '.' : '');

  return result;
}
