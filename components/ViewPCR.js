'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Dummy data
const dummyData = [
  /* paste the same `sampleForms` array here */
];

export default function ViewPCR() {
  const searchParams = useSearchParams();
  const id = parseInt(searchParams.get('id'));
  const [form, setForm] = useState(null);

  useEffect(() => {
    const found = dummyData.find((item) => item.id === id);
    setForm(found);
  }, [id]);

  if (!form) return <div className="p-6">Form not found.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">📄 View PCR - {form.name}</h1>
      <div className="grid grid-cols-2 gap-4 bg-white shadow p-6 rounded-lg">
        <p><strong>Date:</strong> {form.date}</p>
        <p><strong>Location:</strong> {form.location}</p>
        <p><strong>Recorder:</strong> {form.recorder}</p>
        <p><strong>Age / Gender:</strong> {form.age} / {form.gender}</p>
        <p><strong>Hospital:</strong> {form.hospital}</p>
        <p><strong>Complaint:</strong> {form.complaint}</p>
        <p><strong>Evac Code:</strong> {form.evacCode}</p>
        <p><strong>Under Influence:</strong> {form.underInfluence.join(', ')}</p>
        <div className="col-span-2">
          <h3 className="font-semibold mt-4 mb-2">Vital Signs:</h3>
          <ul className="list-disc list-inside text-sm">
            <li>BP: {form.vitalSigns.bp}</li>
            <li>PR: {form.vitalSigns.pr}</li>
            <li>RR: {form.vitalSigns.rr}</li>
            <li>O2SAT: {form.vitalSigns.o2sat}</li>
            <li>Temperature: {form.vitalSigns.temp}</li>
          </ul>
        </div>
        <div className="col-span-2">
          <h3 className="font-semibold mt-4 mb-2">Narrative:</h3>
          <p className="bg-gray-100 p-3 rounded">{form.narrative}</p>
        </div>
      </div>
    </div>
  );
}
