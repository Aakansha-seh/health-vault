/**
 * Seed data used for the demo session.
 * In production this is replaced by API responses from the backend.
 */

// ─── Helpers (local only) ────────────────────────────────────────────────────
const _now = new Date();
const mo   = (n) => { const d = new Date(_now); d.setMonth(d.getMonth() - n);  return d.toISOString().slice(0, 10); };
const fwd  = (n) => { const d = new Date(_now); d.setDate(d.getDate()   + n);  return d.toISOString().slice(0, 10); };

// ─── Clinics ─────────────────────────────────────────────────────────────────
export const DEMO_CLINIC_PASSWORD = 'Clinic@2025';

export const SAMPLE_CLINICS = [
  {
    id:       'c1',
    name:     'HealthVault Clinic',
    address:  '12-B, Connaught Place, New Delhi — 110001',
    phone:    '9811000000',
    email:    'delhi@healthvault.in',
    password: DEMO_CLINIC_PASSWORD,
  },
  {
    id:       'c2',
    name:     'HealthVault Wellness',
    address:  'Level 4, BKC, Mumbai — 400051',
    phone:    '9822000000',
    email:    'mumbai@healthvault.in',
    password: DEMO_CLINIC_PASSWORD,
  },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const DEMO_PASSWORD  = 'MediRecord@2025';

export const SAMPLE_DOCTORS = [
  {
    id:              'd1',
    name:            'Dr. Aakansha Singh',
    specialisation:  'General Physician & Internal Medicine',
    clinicId:        'c1',
    email:           'aakansha@healthvault.in',
    contact:         '9810000001',
    yearsPractice:   8,
    clinicHours:     'Mon–Sat, 9 AM – 6 PM',
    password:        DEMO_PASSWORD,
  },
  {
    id:              'd2',
    name:            'Dr. Rohan Mehta',
    specialisation:  'Cardiologist',
    clinicId:        'c1',
    email:           'rohan@healthvault.in',
    contact:         '9810000002',
    yearsPractice:   12,
    clinicHours:     'Mon–Fri, 10 AM – 7 PM',
    password:        DEMO_PASSWORD,
  },
  {
    id:              'd3',
    name:            'Dr. Priyanka Sharma',
    specialisation:  'Gynaecologist',
    clinicId:        'c2',
    email:           'priyanka@healthvault.in',
    contact:         '9820000001',
    yearsPractice:   6,
    clinicHours:     'Tue–Sun, 9 AM – 5 PM',
    password:        DEMO_PASSWORD,
  },
];

// ─── Patients ─────────────────────────────────────────────────────────────────
export const SAMPLE_PATIENTS = [
  {
    id: 'p1', name: 'Priya Sharma', age: 34, gender: 'Female', clinicId: 'c1', isReturning: true,
    visits: [
      {
        id: 'v1a', date: mo(5), doctorId: 'd1',
        reason: 'Persistent cough and fatigue',
        previousHistory: 'Mild asthma since childhood',
        symptoms: 'Dry cough 3 weeks, fatigue, occasional breathlessness',
        testsDone: 'Chest X-ray, Spirometry, CBC',
        testReports: [],
        prescription: 'Salbutamol inhaler — PRN\nVitamin D3 60,000 IU — once weekly × 8 weeks',
        progressSinceLastVisit: '',
      },
      {
        id: 'v1b', date: mo(1), doctorId: 'd1',
        reason: 'Follow-up — asthma management',
        previousHistory: 'Mild asthma since childhood',
        symptoms: 'Improved. Occasional morning wheeze',
        testsDone: 'Peak flow meter reading',
        testReports: [],
        prescription: 'Salbutamol inhaler — PRN (continue)\nMontelukast 10mg — once nightly',
        progressSinceLastVisit: 'Significantly better. Peak flow up 20%. No emergency episodes.',
      },
    ],
  },
  {
    id: 'p2', name: 'Arjun Mehta', age: 52, gender: 'Male', clinicId: 'c1', isReturning: false,
    visits: [
      {
        id: 'v2a', date: mo(2), doctorId: 'd2',
        reason: 'Annual cardiac checkup',
        previousHistory: 'T2 diabetes (2018), hyperlipidemia',
        symptoms: 'Mild chest discomfort on exertion',
        testsDone: 'ECG, Echo, Lipid panel, HbA1c',
        testReports: [],
        prescription: 'Metformin 500mg — twice daily\nAtorvastatin 20mg — once daily\nAspirin 75mg — once daily',
        progressSinceLastVisit: '',
      },
    ],
  },
  {
    id: 'p3', name: 'Meera Nair', age: 28, gender: 'Female', clinicId: 'c1', isReturning: false,
    visits: [
      {
        id: 'v3a', date: mo(0), doctorId: 'd1',
        reason: 'Migraine evaluation',
        previousHistory: 'No significant history',
        symptoms: 'Unilateral throbbing headache, photophobia, nausea 2×/month',
        testsDone: 'Neurological exam, BP',
        testReports: [],
        prescription: 'Sumatriptan 50mg — at onset PRN\nPropranolol 40mg — once daily (prophylaxis)',
        progressSinceLastVisit: '',
      },
    ],
  },
  {
    id: 'p4', name: 'Rahul Verma', age: 41, gender: 'Male', clinicId: 'c1', isReturning: true,
    visits: [
      {
        id: 'v4a', date: mo(4), doctorId: 'd1',
        reason: 'Knee pain evaluation',
        previousHistory: 'Obesity BMI 31, no prior surgeries',
        symptoms: 'Bilateral knee pain worsening on stairs',
        testsDone: 'X-ray knees AP/Lateral',
        testReports: [],
        prescription: 'Diclofenac gel — apply twice daily\nPhysiotherapy — 3×/week × 4 weeks',
        progressSinceLastVisit: '',
      },
      {
        id: 'v4b', date: mo(1), doctorId: 'd1',
        reason: 'Knee follow-up',
        previousHistory: 'Obesity BMI 31',
        symptoms: 'Reduced pain, lost 3 kg',
        testsDone: 'Clinical assessment',
        testReports: [],
        prescription: 'Continue physiotherapy\nGlucosamine 1500mg — once daily',
        progressSinceLastVisit: 'Partial improvement. Weight reduced 3 kg. Good physio compliance.',
      },
    ],
  },
  {
    id: 'p5', name: 'Sunita Kapoor', age: 65, gender: 'Female', clinicId: 'c1', isReturning: false,
    visits: [
      {
        id: 'v5a', date: mo(3), doctorId: 'd1',
        reason: 'Hypertension management',
        previousHistory: 'HTN ×10 yrs, hypothyroidism',
        symptoms: 'BP averaging 160/100 at home',
        testsDone: '24h ABPM, Renal function, Thyroid panel',
        testReports: [],
        prescription: 'Amlodipine 10mg — once daily\nLosartan 50mg — once daily\nLevothyroxine 50mcg — empty stomach',
        progressSinceLastVisit: '',
      },
    ],
  },
  {
    id: 'p6', name: 'Kavita Patel', age: 38, gender: 'Female', clinicId: 'c2', isReturning: false,
    visits: [
      {
        id: 'v6a', date: mo(1), doctorId: 'd3',
        reason: 'Routine gynaecology checkup',
        previousHistory: 'PCOS diagnosed 2020',
        symptoms: 'Irregular cycles, mild hair thinning',
        testsDone: 'Hormonal panel, Pelvic USG',
        testReports: [],
        prescription: 'Metformin 500mg — twice daily\nInositol 2g — once daily',
        progressSinceLastVisit: '',
      },
    ],
  },
];

// ─── Appointments ─────────────────────────────────────────────────────────────
export const SAMPLE_APPOINTMENTS = [
  { id: 'a1', patientId: 'p1', doctorId: 'd1', clinicId: 'c1', date: fwd(1), time: '10:30', reason: 'Follow-up — asthma review',        notes: 'Check peak flow. Assess Montelukast response.', status: 'scheduled', gcalSynced: false },
  { id: 'a2', patientId: 'p2', doctorId: 'd2', clinicId: 'c1', date: fwd(2), time: '11:00', reason: 'Cardiac follow-up — lipid results', notes: 'Review repeat lipid panel. Echo pending.',        status: 'scheduled', gcalSynced: false },
  { id: 'a3', patientId: 'p4', doctorId: 'd1', clinicId: 'c1', date: fwd(5), time: '09:00', reason: 'Knee follow-up #3',                 notes: 'Physiotherapy progress check.',                  status: 'scheduled', gcalSynced: false },
  { id: 'a4', patientId: 'p3', doctorId: 'd1', clinicId: 'c1', date: mo(0),  time: '14:30', reason: 'Migraine review',                   notes: '',                                              status: 'completed', gcalSynced: true  },
  { id: 'a5', patientId: 'p5', doctorId: 'd1', clinicId: 'c1', date: mo(1),  time: '16:00', reason: 'BP monitoring check',               notes: '',                                              status: 'completed', gcalSynced: false },
];
