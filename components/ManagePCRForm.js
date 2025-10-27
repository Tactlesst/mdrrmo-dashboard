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
    setSelectedForm(null);
    setEditForm(null);
    setPrintForm(null);
    if (refresh) {
      fetchForms();
    }
  };

  // Format date/time for Manila timezone
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const options = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleString("en-PH", options).replace(",", "");
    } catch (error) {
      console.error(`Error formatting date/time ${dateString}:`, error);
      return "N/A";
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-blue-100 text-blue-900 text-left">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Patient Name</th>
                    <th className="px-3 py-3 font-semibold">Date & Time</th>
                    <th className="px-3 py-3 font-semibold max-w-[200px]">Location</th>
                    <th className="px-3 py-3 font-semibold">Recorded By</th>
                    <th className="px-3 py-3 font-semibold text-center">Actions</th>
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
                      (a, b) => new Date(b.created_at) - new Date(a.created_at) // Sort by creation date, newest first
                    )
                    .map((form, index) => (
                      <tr
                        key={form.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } border-t border-gray-200 hover:bg-gray-100 transition`}
                      >
                        <td className="px-3 py-3">
                          <div className="truncate max-w-[150px]" title={form.patient_name || "N/A"}>
                            {form.patient_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{formatDateTime(form.created_at)}</td>
                        <td className="px-3 py-3">
                          <div className="truncate max-w-[200px]" title={form.location || "N/A"}>
                            {form.location || "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="truncate max-w-[120px]" title={form.recorder || "N/A"}>
                            {form.recorder || "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setSelectedForm(form)}
                              className="text-sm text-blue-600 hover:underline font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditForm(form)}
                              className="text-sm text-blue-600 hover:underline font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setPrintForm(form)}
                              className="text-sm text-green-600 hover:underline font-medium"
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </>
      ) : (
        <PCRAdd onClose={handleFormClose} onSubmitSuccess={fetchForms} />
      )}

      {selectedForm && (
        <PCRView
          form={selectedForm}
          onClose={() => handleFormClose(true)}
        />
      )}
      {editForm && (
        <PCREdit
          form={editForm}
          onClose={() => handleFormClose(true)}
        />
      )}
      {printForm && (
        <PCRPrint
          form={printForm}
          onClose={() => handleFormClose(true)}
        />
      )}
    </div>
  );
}