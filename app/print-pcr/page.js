'use client';

import { useSearchParams } from 'next/navigation';
import sampleForms from '../../Data/sampleForms';

export default function PrintPCR() {
  const searchParams = useSearchParams();
  const id = parseInt(searchParams.get('id'));
  const form = sampleForms.find(f => f.id === id);

  if (!form) {
    return <div className="p-10 text-red-600">Form not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🖨️ Patient Care Report (PCR)</h1>
      <div className="text-sm space-y-2">
        <p><strong>Name:</strong> {form.name}</p>
        <p><strong>Date:</strong> {form.date}</p>
        <p><strong>Location:</strong> {form.location}</p>
        <p><strong>Recorded By:</strong> {form.recorder}</p>
        <p><strong>Age:</strong> {form.age}</p>
        <p><strong>Gender:</strong> {form.gender}</p>
        <p><strong>Hospital:</strong> {form.hospital}</p>
        <p><strong>Complaint:</strong> {form.complaint}</p>
        <div>
          <strong>Vital Signs:</strong>
          <ul className="ml-5 list-disc">
            <li>BP: {form.vitalSigns.bp}</li>
            <li>PR: {form.vitalSigns.pr}</li>
            <li>RR: {form.vitalSigns.rr}</li>
            <li>O2 Sat: {form.vitalSigns.o2sat}</li>
            <li>Temp: {form.vitalSigns.temp}</li>
          </ul>
        </div>
        <div>
          <strong>Contact Person:</strong>
          <p>{form.contactPerson.name} ({form.contactPerson.relation}) – {form.contactPerson.number}</p>
        </div>
        <p><strong>Evac Code:</strong> {form.evacCode}</p>
        <p><strong>Under Influence:</strong> {form.underInfluence.join(', ')}</p>
        <p><strong>Narrative:</strong> {form.narrative}</p>
      </div>
      <div className="mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
        >
          Print
        </button>
      </div>
    </div>
  );
}
