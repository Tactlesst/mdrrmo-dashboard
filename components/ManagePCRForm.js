'use client';

import React, { useState } from 'react';
import PCRForm from './PCRForm';
import { FiPlus, FiX, FiPrinter } from 'react-icons/fi';
import sampleForms from '../Data/sampleForms'; // Make sure this file exports your data
import Image from 'next/image';

export default function ManagePCRForm() {
  const [showForm, setShowForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [printForm, setPrintForm] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 font-sans relative">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📋 Manage PCR Forms</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              <FiPlus className="text-lg" /> Add PCR Form
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sampleForms.map((form) => (
                  <tr key={form.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{form.name}</td>
                    <td className="px-4 py-3">{form.date}</td>
                    <td className="px-4 py-3">{form.location}</td>
                    <td className="px-4 py-3">{form.recorder}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => setSelectedForm(form)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setPrintForm(form)}
                        className="text-green-600 hover:underline"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <PCRForm onClose={() => setShowForm(false)} />
      )}

      {/* View Modal */}
{selectedForm && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full relative overflow-y-auto max-h-[90vh]">
      <button
        onClick={() => setSelectedForm(null)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
      >
        <FiX size={22} />
      </button>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">📝 Patient Care Report</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        <div><strong>👤 Name:</strong> {selectedForm.name}</div>
        <div><strong>📅 Date:</strong> {selectedForm.date}</div>
        <div><strong>📍 Location:</strong> {selectedForm.location}</div>
        <div><strong>🧑‍⚕️ Recorder:</strong> {selectedForm.recorder}</div>
        <div><strong>🎂 Age:</strong> {selectedForm.age}</div>
        <div><strong>🚻 Gender:</strong> {selectedForm.gender}</div>
        <div><strong>🏥 Hospital:</strong> {selectedForm.hospital}</div>
        <div><strong>🤕 Complaint:</strong> {selectedForm.complaint}</div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-2">📈 Vital Signs</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
          <div><strong>BP:</strong> {selectedForm.vitalSigns.bp}</div>
          <div><strong>PR:</strong> {selectedForm.vitalSigns.pr}</div>
          <div><strong>RR:</strong> {selectedForm.vitalSigns.rr}</div>
          <div><strong>O2 Sat:</strong> {selectedForm.vitalSigns.o2sat}</div>
          <div><strong>Temp:</strong> {selectedForm.vitalSigns.temp}</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-2">📞 Contact Person</h4>
        <div className="bg-gray-50 p-4 rounded-lg text-sm">
          {selectedForm.contactPerson.name} ({selectedForm.contactPerson.relation}) – {selectedForm.contactPerson.number}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div><strong>🚦 Evac Code:</strong> {selectedForm.evacCode}</div>
        <div><strong>🍷 Under Influence:</strong> {selectedForm.underInfluence.join(', ')}</div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-2">📝 Narrative</h4>
        <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
          {selectedForm.narrative}
        </div>
      </div>
    </div>
  </div>
)}


      {/* Print Modal */}
      {printForm && (
        <div className="fixed inset-0 z-50 bg-white text-black p-6 overflow-y-auto max-h-screen">
          <div className="flex justify-between mb-4 print:hidden">
            <h3 className="text-xl font-bold">🖨️ Printable PCR Form</h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                <FiPrinter /> Print
              </button>
              <button
                onClick={() => setPrintForm(null)}
                className="text-gray-600 hover:text-red-600"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="text-sm text-black border border-black p-6 space-y-4 print:text-black print:border-none">
            <h2 className="text-center font-bold text-xl mb-2">PATIENT CARE REPORT</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Patient Name:</strong> {printForm.name}</p>
                <p><strong>Date:</strong> {printForm.date}</p>
                <p><strong>Location:</strong> {printForm.location}</p>
                <p><strong>Recorder:</strong> {printForm.recorder}</p>
                <p><strong>Gender:</strong> {printForm.gender}</p>
                <p><strong>Age:</strong> {printForm.age}</p>
                <p><strong>Evac Code:</strong> {printForm.evacCode}</p>
              </div>
              <div>
                <p><strong>Hospital:</strong> {printForm.hospital}</p>
                <p><strong>Complaint:</strong> {printForm.complaint}</p>
                <p><strong>Under Influence:</strong> {printForm.underInfluence.join(', ')}</p>
                <p><strong>Contact:</strong> {printForm.contactPerson.name} ({printForm.contactPerson.relation}) - {printForm.contactPerson.number}</p>
                <p><strong>O2 Sat:</strong> {printForm.vitalSigns.o2sat}</p>
                <p><strong>Temp:</strong> {printForm.vitalSigns.temp}</p>
              </div>
            </div>

            <div>
              <strong>Vital Signs:</strong>
              <ul className="list-disc ml-5">
                <li>BP: {printForm.vitalSigns.bp}</li>
                <li>PR: {printForm.vitalSigns.pr}</li>
                <li>RR: {printForm.vitalSigns.rr}</li>
              </ul>
            </div>

            <div>
              <strong>Narrative:</strong>
              <p className="border p-2 mt-1">{printForm.narrative}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center justify-between">
              <div>
                <strong>Body Diagram:</strong>
                <Image
                  src="/body-outline.png"
                  alt="Body diagram"
                  width={200}
                  height={200}
                  className="border"
                />
              </div>
              <div>
                <p><strong>Responder Signature: </strong>________________________</p>
                <p><strong>Receiving Hospital: </strong>________________________</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
