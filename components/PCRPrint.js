"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

export default function PCRPrint({ form, onClose }) {
  const fullForm = form.full_form || {};
  const printRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "", "width=1000,height=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>PCR Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h2, h3 { text-align: center; margin-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; display: inline-block; min-width: 150px; }
            .row { margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .diagram { margin-top: 20px; display: flex; justify-content: space-between; }
            .diagram img { height: 250px; object-fit: contain; border: 1px solid #ccc; }
            .waiver { margin-top: 10px; font-style: italic; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-6 relative shadow-xl overflow-y-auto max-h-[95vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <FiX size={20} />
        </button>

        <div ref={printRef}>
          <h2>Patient Care Report</h2>
          <h3>{form.patient_name}</h3>

          <div className="section">
            <div className="grid">
              <div className="row"><span className="label">Case No:</span> {fullForm.case_number || "N/A"}</div>
              <div className="row"><span className="label">Date:</span> {new Date(form.date).toLocaleString()}</div>
              <div className="row"><span className="label">Recorder:</span> {form.recorder}</div>
              <div className="row"><span className="label">Age/Sex:</span> {fullForm.age || "?"} / {fullForm.sex || "?"}</div>
              <div className="row"><span className="label">Contact:</span> {fullForm.contact_number || "N/A"}</div>
              <div className="row"><span className="label">Address:</span> {fullForm.address || "N/A"}</div>
              <div className="row"><span className="label">Location:</span> {form.location}</div>
              <div className="row"><span className="label">POI:</span> {fullForm.poi_details || fullForm.poi || "N/A"}</div>
            </div>
          </div>

          <div className="section">
            <h4>Vital Signs</h4>
            <div className="grid">
              <div className="row"><span className="label">BP:</span> {fullForm.blood_pressure || fullForm.vitals?.bp || "N/A"}</div>
              <div className="row"><span className="label">Pulse:</span> {fullForm.pulse_rate || fullForm.vitals?.pulse || "N/A"}</div>
              <div className="row"><span className="label">RR:</span> {fullForm.respiratory_rate || "N/A"}</div>
              <div className="row"><span className="label">Temperature:</span> {fullForm.temperature || "N/A"}</div>
              <div className="row"><span className="label">O2 Sat:</span> {fullForm.oxygen_saturation || "N/A"}</div>
              <div className="row"><span className="label">GCS:</span> {fullForm.gcs_eye}/{fullForm.gcs_verbal}/{fullForm.gcs_motor}</div>
            </div>
          </div>

          <div className="section">
            <h4>Patient History</h4>
            <div className="row"><span className="label">HPI:</span> {fullForm.history_present_illness || "N/A"}</div>
            <div className="row"><span className="label">Past Medical History:</span> {fullForm.past_medical_history || "N/A"}</div>
            <div className="row"><span className="label">Medications:</span> {fullForm.medications || "N/A"}</div>
            <div className="row"><span className="label">Allergies:</span> {fullForm.allergies || "N/A"}</div>
          </div>

          {Array.isArray(fullForm.body_diagram) && (
            <div className="section">
              <h4>Body Diagram Markings</h4>
              <ul className="list-disc pl-6">
                {fullForm.body_diagram.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="diagram">
            <img src="/front-body.png" alt="Front Diagram" />
            <img src="/back-body.png" alt="Back Diagram" />
          </div>

          <div className="waiver">
            Waiver: {fullForm.waiver_signed ? "✅ Signed" : "❌ Not Signed"}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
