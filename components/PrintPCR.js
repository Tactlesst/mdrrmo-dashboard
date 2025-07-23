'use client';
import React, { useEffect } from 'react';

export default function PrintPCR() {
  const data = {
    name: 'Juan Dela Cruz',
    date: '2025-07-04',
    location: 'Brgy. A',
    recorder: 'Ben',
    symptoms: 'Fever, Headache',
    actions: 'Transported to Hospital',
  };

  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="p-8 font-serif">
      <h1 className="text-2xl font-bold mb-4 text-center">📄 Patient Care Report</h1>
      <div className="space-y-2">
        <p><strong>Patient Name:</strong> {data.name}</p>
        <p><strong>Date:</strong> {data.date}</p>
        <p><strong>Location:</strong> {data.location}</p>
        <p><strong>Recorded By:</strong> {data.recorder}</p>
        <p><strong>Symptoms:</strong> {data.symptoms}</p>
        <p><strong>Actions Taken:</strong> {data.actions}</p>
      </div>
    </div>
  );
}
