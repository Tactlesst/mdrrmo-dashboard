// mdrrmo-dashboard/data/sampleForms.js

const sampleForms = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    date: '2025-07-04',
    location: 'Brgy. A',
    recorder: 'Ben',
    age: 45,
    gender: 'Male',
    hospital: 'Balingasag Provincial Hospital',
    complaint: 'Difficulty breathing after accident',
    vitalSigns: {
      bp: '120/80',
      pr: '90',
      rr: '22',
      o2sat: '98%',
      temp: '37.2°C',
    },
    contactPerson: {
      name: 'Jose Dela Cruz',
      relation: 'Brother',
      number: '09171234567',
    },
    evacCode: 'Red',
    underInfluence: ['N/A'],
    narrative: 'Patient found conscious at roadside, with minor abrasions and stable vitals. Transported to hospital for observation.',
  },
  {
    id: 2,
    name: 'Maria Santos',
    date: '2025-07-03',
    location: 'Brgy. B',
    recorder: 'Anna',
    age: 32,
    gender: 'Female',
    hospital: 'City Health Center',
    complaint: 'Loss of consciousness for 5 mins',
    vitalSigns: {
      bp: '110/70',
      pr: '78',
      rr: '18',
      o2sat: '97%',
      temp: '36.8°C',
    },
    contactPerson: {
      name: 'Rosa Santos',
      relation: 'Mother',
      number: '09221234567',
    },
    evacCode: 'Yellow',
    underInfluence: ['Alcohol'],
    narrative: 'Patient collapsed in public area. Responded within 10 minutes. Conscious upon arrival. Alcohol odor detected.',
  },
];

export default sampleForms;
