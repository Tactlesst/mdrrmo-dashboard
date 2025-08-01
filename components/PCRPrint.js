'use client';

import React from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import Image from 'next/image';

const PCRPrint = ({ form, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4 print:bg-transparent print:relative print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8 print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:p-0 print:w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h1 className="text-xl font-bold">🖨️ Printable Patient Care Report</h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <FiPrinter /> Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-red-600"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* Case Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
          <div className="space-y-1">
            <p><strong>Patient Name:</strong> {form.name}</p>
            <p><strong>Age:</strong> {form.age}</p>
            <p><strong>Gender:</strong> {form.gender}</p>
            <p><strong>Location:</strong> {form.location}</p>
            <p><strong>Date:</strong> {form.date}</p>
            <p><strong>Time:</strong> {form.time}</p>
            <p><strong>Evac Code:</strong> {form.evacCode}</p>
            <p><strong>Hospital:</strong> {form.hospital}</p>
            <p><strong>Complaint:</strong> {form.complaint}</p>
            <p><strong>Recorder:</strong> {form.recorder}</p>
          </div>
          <div className="space-y-1">
            <p>
              <strong>Under Influence:</strong>{' '}
              {(form.underInfluence || []).join(', ') || 'None'}
            </p>
            <p>
              <strong>Contact Person:</strong>{' '}
              {form.contactPerson?.name} ({form.contactPerson?.relation}) - {form.contactPerson?.number}
            </p>
            <p><strong>Consciousness:</strong> {form.consciousness}</p>
            <p><strong>Skin:</strong> {form.skin}</p>
            <p><strong>Pupils:</strong> {form.pupils}</p>
            <p><strong>Speech:</strong> {form.speech}</p>
          </div>
        </div>

        {/* Vitals */}
        <div className="mb-6">
          <strong>Vital Signs:</strong>
          <ul className="list-disc ml-5 mt-1">
            <li>BP: {form.vitalSigns?.bp}</li>
            <li>PR: {form.vitalSigns?.pr}</li>
            <li>RR: {form.vitalSigns?.rr}</li>
            <li>O2 Sat: {form.vitalSigns?.o2sat}</li>
            <li>Temp: {form.vitalSigns?.temp}</li>
          </ul>
        </div>

        {/* History */}
        <div className="mb-6">
          <strong>Medical History:</strong>
          <ul className="list-disc ml-5 mt-1">
            {(form.history || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* POI */}
        <div className="mb-6">
          <strong>Points of Interest:</strong>
          <ul className="list-disc ml-5 mt-1">
            {(form.poi || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Narrative */}
        <div className="mb-6">
          <strong>Narrative:</strong>
          <p className="border p-2 mt-1 whitespace-pre-line">{form.narrative}</p>
        </div>

        {/* Waiver */}
        <div className="mb-6">
          <strong>Waiver:</strong>
          <div className="border p-3 whitespace-pre-line">
            <p><strong>Name:</strong> {form.waiver?.name}</p>
            <p><strong>Relation:</strong> {form.waiver?.relation}</p>
            <p><strong>Reason:</strong> {form.waiver?.reason}</p>
            <p><strong>Remarks:</strong> {form.waiver?.remarks}</p>
          </div>
        </div>

        {/* Diagrams + Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 items-start">
          <div>
            <strong>Body Diagrams:</strong>
            <div className="flex gap-2 mt-2">
              <Image
                src="/body-outline.png"
                alt="Body diagram front"
                width={200}
                height={300}
                className="border p-2"
              />
              <Image
                src="/body-outline-back.png"
                alt="Body diagram back"
                width={200}
                height={300}
                className="border p-2"
              />
            </div>
          </div>
          <div className="space-y-4 mt-2">
            <p><strong>Responder Signature:</strong> ___________________________</p>
            <p><strong>Receiving Hospital:</strong> ___________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRPrint;
