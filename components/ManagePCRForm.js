"use client";

import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import PCRForm from "./PCRForm";
import PCRView from "./PCRView";
import PCRPrint from "./PCRPrint";
import sampleForms from "../Data/sampleForms";

export default function ManagePCRForm() {
  const [showForm, setShowForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [printForm, setPrintForm] = useState(null);

  return (
    <div className="min-h-screen p-6 bg-gray-100 font-sans relative">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📋 Manage PCR Forms
            </h2>
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
                  <tr
                    key={form.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
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

      {selectedForm && (
        <PCRView form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}

      {printForm && (
        <PCRPrint form={printForm} onClose={() => setPrintForm(null)} />
      )}
    </div>
  );
}