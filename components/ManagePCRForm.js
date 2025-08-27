"use client";

import React, { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import PCRAdd from "./PCRAdd";
import PCRView from "./PCRView";
import PCRPrint from "./PCRPrint";
import PCREdit from "./PCREdit";
import { formatPHDateTime } from "@/lib/dateUtils";

export default function ManagePCRForm() {
  const [showForm, setShowForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [printForm, setPrintForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [pcrForms, setPcrForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pcr");
      const data = await res.json();
      if (res.ok) {
        setPcrForms(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch PCR forms");
      }
    } catch (err) {
      console.error("Error fetching PCR forms:", err);
      setError("Failed to fetch PCR forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleFormClose = (refresh = false) => {
    setShowForm(false);
    if (refresh) {
      fetchForms();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 font-sans relative">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
              📋 Manage PCR Forms
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition-all duration-200"
            >
              <FiPlus className="text-lg" />
              <span className="text-sm font-semibold">Add PCR Form</span>
            </button>
          </div>

          <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-blue-100 text-blue-900 text-left">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient Name</th>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Recorded By</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : pcrForms.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No PCR forms found.
                    </td>
                  </tr>
                ) : (
                  [...pcrForms]
                    .sort(
                      (a, b) => new Date(b.date) - new Date(a.date) // 🔹 newest first
                    )
                    .map((form, index) => (
                      <tr
                        key={form.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } border-t border-gray-200 hover:bg-gray-100 transition`}
                      >
                        <td className="px-6 py-4">{form.patient_name}</td>
                        <td className="px-6 py-4">
                          {formatPHDateTime(form.date)}
                        </td>
                        <td className="px-6 py-4">{form.location}</td>
                        <td className="px-6 py-4">{form.recorder}</td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => setSelectedForm(form)}
                            className="inline-block text-sm text-blue-600 hover:underline font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditForm(form)}
                            className="inline-block text-sm text-blue-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setPrintForm(form)}
                            className="inline-block text-sm text-green-600 hover:underline font-medium"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <PCRAdd onClose={handleFormClose} onSubmitSuccess={fetchForms} />
      )}

      {selectedForm && (
        <PCRView form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}
      {editForm && (
        <PCREdit form={editForm} onClose={() => setEditForm(null)} />
      )}
      {printForm && (
        <PCRPrint form={printForm} onClose={() => setPrintForm(null)} />
      )}
    </div>
  );
}
