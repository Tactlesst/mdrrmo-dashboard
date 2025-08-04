// components/PCRView.jsx
"use client";

import React from "react";
import { FiX } from "react-icons/fi";

const PCRView = ({ form, onClose }) => {
  const { patient_name, date, location, recorder, full_form } = form;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
        >
          <FiX size={22} />
        </button>
        <h2 className="text-xl font-bold mb-4">PCR Form Details</h2>
        <div className="space-y-4">
          <p><strong>Patient Name:</strong> {patient_name}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Location:</strong> {location}</p>
          <p><strong>Recorder:</strong> {recorder}</p>
          <p><strong>Full Form Data:</strong></p>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(full_form, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PCRView;