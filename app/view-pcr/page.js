'use client';
import { useSearchParams } from 'next/navigation';

export default function ViewPCR() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // Dummy data (you can fetch real data here later)
  const sampleForms = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      complaint: 'Difficulty breathing after accident',
    },
    {
      id: 2,
      name: 'Maria Santos',
      complaint: 'Loss of consciousness for 5 mins',
    },
  ];

  const form = sampleForms.find(f => f.id === Number(id));

  if (!form) return <div className="p-6">Form not found.</div>;

  return (
    <div className="p-6 bg-white">
      <h1 className="text-xl font-bold mb-4">View PCR</h1>
      <p><strong>Patient Name:</strong> {form.name}</p>
      <p><strong>Complaint:</strong> {form.complaint}</p>
    </div>
  );
}
