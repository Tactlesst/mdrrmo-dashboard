"use client";

import React, { useRef, useState, useEffect } from "react";
import { FiX, FiPrinter, FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";
import BodyDiagram3D from "./BodyDiagram3D";

const PCRPrint = ({ form, onClose }) => {
  const fullForm = form.full_form || {};
  const componentRef = useRef();
  const [isReady, setIsReady] = useState(false);

  // Format date/time for Manila timezone
  const formatPHDateTime = (dateString, dateOnly = false) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options = {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
    return date.toLocaleString("en-PH", options);
  };

  // Ensure content is ready before enabling print/download
  useEffect(() => {
    const timer = setTimeout(() => {
      if (componentRef.current) {
        console.log("Print component ref is ready:", componentRef.current);
        setIsReady(true);
      } else {
        console.error("Print component ref is not ready");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Trigger browser print
  const handlePrint = () => {
    if (!isReady) {
      alert("Content is still loading. Please wait a moment and try again.");
      return;
    }
    const printContents = componentRef.current.innerHTML;
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 10pt; color: #000; }
            h1 { margin-bottom: 10px; text-align: center; }
            .section { margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
            .border { border: 1px solid #000; padding: 8px; border-radius: 4px; }
            .print-label { font-weight: bold; margin-bottom: 4px; }
            .print-text { line-height: 1.4; word-wrap: break-word; margin-bottom: 4px; }
            .print-break { page-break-after: always; }
            @page { size: A4; margin: 1cm; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };

  // Download PDF using jsPDF
  const handleDownload = () => {
    if (!isReady) {
      alert("Content is still loading. Please wait a moment and try again.");
      return;
    }
    const doc = new jsPDF("p", "pt", "a4");
    doc.html(componentRef.current, {
      callback: (doc) => {
        doc.save(`PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}.pdf`);
      },
      margin: [20, 20, 20, 20],
      x: 10,
      y: 10,
      width: 550,
      windowWidth: 900,
      html2canvas: { scale: 0.75 },
    });
  };

  // Fallback: Generate a text-based file
  const handleDownloadText = () => {
    const content = `
      PATIENT CARE REPORT

      Basic Information
      ----------------
      Patient Name: ${form.patient_name || "N/A"}
      Date: ${formatPHDateTime(form.date, true)}
      Recorder: ${form.recorder || "N/A"}
      Location: ${form.location || "N/A"}

      Patient Details
      ---------------
      Case Type: ${fullForm.case_number || "N/A"}
      Age: ${fullForm.age || "N/A"}
      Gender: ${fullForm.sex || "N/A"}
      Category: ${fullForm.category || "N/A"}
      Contact Number: ${fullForm.contact_number || "N/A"}
      Address: ${fullForm.address || "N/A"}

      Vitals and Incident Details
      ---------------------------
      Vitals:
        BP: ${fullForm.vitals?.blood_pressure || "N/A"}
        PR: ${fullForm.vitals?.pulse_rate || "N/A"}
        RR: ${fullForm.vitals?.respiratory_rate || "N/A"}
        Temp: ${fullForm.vitals?.temperature || "N/A"}
        O2Sat: ${fullForm.vitals?.oxygen_saturation || "N/A"}
        GCS: E${fullForm.vitals?.gcs_eye || "N/A"} V${fullForm.vitals?.gcs_verbal || "N/A"} M${fullForm.vitals?.gcs_motor || "N/A"}
      Place of Incident (POI):
        Type: ${fullForm.poi_type || "N/A"}
        Brgy: ${fullForm.poi_details?.brgy || "N/A"}
        Highway: ${fullForm.poi_details?.highway ? "Yes" : "No"}
        Residence: ${fullForm.poi_details?.residence ? "Yes" : "No"}
        Public Building: ${fullForm.poi_details?.publicBuilding ? "Yes" : "No"}
      Incident Details:
        DOI: ${formatPHDateTime(fullForm.doi, true)}
        TOI: ${formatPHDateTime(fullForm.toi)}
        NOI: ${fullForm.noi || "N/A"}

      Medical and Evacuation Details
      -----------------------------
      Under Influence:
        Alcohol: ${fullForm.under_influence?.alcohol ? "Yes" : "No"}
        Drugs: ${fullForm.under_influence?.drugs ? "Yes" : "No"}
        Unknown: ${fullForm.under_influence?.unknown ? "Yes" : "No"}
        None: ${fullForm.under_influence?.none ? "Yes" : "No"}
      Evacuation Code:
        Black: ${fullForm.evacuation_code?.black ? "Yes" : "No"}
        Red: ${fullForm.evacuation_code?.red ? "Yes" : "No"}
        Yellow: ${fullForm.evacuation_code?.yellow ? "Yes" : "No"}
        Green: ${fullForm.evacuation_code?.green ? "Yes" : "No"}
      Response Team: ${fullForm.response_team?.length ? fullForm.response_team.join(", ") : "N/A"}

      Medical History
      ---------------
      Chief Complaints: ${fullForm.chief_complaints || fullForm.history_present_illness || "N/A"}
      Signs & Symptoms: ${fullForm.signs_symptoms || "N/A"}
      Allergies: ${fullForm.allergies || "N/A"}
      Medications: ${fullForm.medications || "N/A"}
      Past Medical History: ${fullForm.past_medical_history || "N/A"}
      Last Intake: ${fullForm.last_intake || "N/A"}
      Events: ${fullForm.events || "N/A"}
      Interventions: ${fullForm.interventions || "N/A"}
      Narrative: ${fullForm.narrative || "N/A"}

      Transport and Contact Details
      -----------------------------
      Transport Details:
        Hospital Transported: ${fullForm.hospital_transported || "N/A"}
        Time of Call: ${formatPHDateTime(fullForm.time_call)}
        Arrived Scene: ${formatPHDateTime(fullForm.time_arrived_scene)}
        Left Scene: ${formatPHDateTime(fullForm.time_left_scene)}
        Arrived Hospital: ${formatPHDateTime(fullForm.time_arrived_hospital)}
        Ambulance No: ${fullForm.ambulance_no || "N/A"}
      Contact Person:
        Name: ${fullForm.contact_person || "N/A"}
        Relationship: ${fullForm.relationship || "N/A"}
        Contact Number: ${fullForm.contact_number || "N/A"}
      Loss of Consciousness: ${fullForm.loss_of_consciousness || "N/A"}${fullForm.loss_of_consciousness === "yes" ? ` (${fullForm.loss_of_consciousness_minutes || "0"} minutes)` : ""}

      Crew and Receiving Hospital
      ---------------------------
      Crew Details:
        Driver: ${fullForm.driver || "N/A"}
        Team Leader: ${fullForm.team_leader || "N/A"}
        Crew: ${fullForm.crew || "N/A"}
      Receiving Hospital:
        Hospital: ${fullForm.receiving_hospital || "N/A"}
        Name: ${fullForm.receiving_name || "N/A"}
        Signature: ${fullForm.receiving_signature || "N/A"}

      Waiver and Body Diagram
      -----------------------
      Waiver:
        Signed: ${fullForm.waiver_signed ? "Yes" : "No"}
        Patient Signature: ${fullForm.patient_signature || "N/A"}
        Witness Signature: ${fullForm.witness_signature || "N/A"}
        Patient Signature Date: ${formatPHDateTime(fullForm.patient_signature_date, true)}
        Witness Signature Date: ${formatPHDateTime(fullForm.witness_signature_date, true)}
      Body Diagram: ${fullForm.body_diagram?.length ? fullForm.body_diagram.join(", ") : "N/A"}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log("Fallback text file generated");
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 flex justify-center items-center p-4 print:bg-transparent print:z-0">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8 print:shadow-none print:p-0">
        <div className="flex justify-between items-center mb-4 no-print">
          <h2 className="text-lg font-semibold">Print Patient Care Report</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              disabled={!isReady}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition no-print ${!isReady ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FiPrinter className="mr-2" size={18} />
              Print Report
            </button>
            <button
              onClick={handleDownload}
              disabled={!isReady}
              className={`flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition no-print ${!isReady ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FiDownload className="mr-2" size={18} />
              Download PDF
            </button>
            <button
              onClick={handleDownloadText}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition no-print"
            >
              <FiDownload className="mr-2" size={18} />
              Download Text
            </button>
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition no-print"
            >
              <FiX className="mr-2" size={18} />
              Close
            </button>
          </div>
        </div>

        <div ref={componentRef} className="space-y-4 print:space-y-2 print:p-4">
          <style jsx>{`
            @media print {
              .no-print {
                display: none !important;
              }
              .print-break {
                page-break-after: always;
              }
              .print-font {
                font-size: 10pt;
                font-family: Arial, sans-serif;
                color: #000;
              }
              .print-border {
                border: 1px solid #000;
                padding: 8px;
                margin-bottom: 8px;
              }
              .print-label {
                font-weight: bold;
                margin-bottom: 4px;
              }
              .print-text {
                margin-bottom: 4px;
                line-height: 1.4;
                word-wrap: break-word;
                max-width: 100%;
              }
              .modal-container {
                background: transparent !important;
                position: static !important;
                z-index: 0 !important;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          `}</style>

          <div className="flex flex-col items-center border-b pb-4 mb-4 print:print-border print-font">
            <h1 className="text-xl font-bold text-center print:print-font">PATIENT CARE REPORT</h1>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Patient Name:</label>
              <p className="mt-1 text-sm print:print-text">{form.patient_name || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Date:</label>
              <p className="mt-1 text-sm print:print-text">{formatPHDateTime(form.date, true)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Recorder:</label>
              <p className="mt-1 text-sm print:print-text">{form.recorder || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 print:print-label">Location:</label>
              <p className="mt-1 text-sm print:print-text">{form.location || "N/A"}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Case Type:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.case_number || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Age:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.age || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Gender:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.sex || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Category:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.category || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Contact Number:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.contact_number || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 print:print-label">Address:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.address || "N/A"}</p>
            </div>
          </div>

          {/* Vitals and Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Vitals:</label>
              <p className="mt-1 text-sm print:print-text">
                BP: {fullForm.vitals?.blood_pressure || "N/A"}<br />
                PR: {fullForm.vitals?.pulse_rate || "N/A"}<br />
                RR: {fullForm.vitals?.respiratory_rate || "N/A"}<br />
                Temp: {fullForm.vitals?.temperature || "N/A"}<br />
                O2Sat: {fullForm.vitals?.oxygen_saturation || "N/A"}<br />
                GCS: E{fullForm.vitals?.gcs_eye || "N/A"} V{fullForm.vitals?.gcs_verbal || "N/A"} M{fullForm.vitals?.gcs_motor || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Place of Incident (POI):</label>
              <p className="mt-1 text-sm print:print-text">
                Type: {fullForm.poi_type || "N/A"}<br />
                Brgy: {fullForm.poi_details?.brgy || "N/A"}<br />
                Highway: {fullForm.poi_details?.highway ? "Yes" : "No"}<br />
                Residence: {fullForm.poi_details?.residence ? "Yes" : "No"}<br />
                Public Building: {fullForm.poi_details?.publicBuilding ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Incident Details:</label>
              <p className="mt-1 text-sm print:print-text">
                DOI: {formatPHDateTime(fullForm.doi, true)}<br />
                TOI: {formatPHDateTime(fullForm.toi)}<br />
                NOI: {fullForm.noi || "N/A"}
              </p>
            </div>
          </div>

          {/* Medical and Evacuation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Under Influence:</label>
              <p className="mt-1 text-sm print:print-text">
                Alcohol: {fullForm.under_influence?.alcohol ? "Yes" : "No"}<br />
                Drugs: {fullForm.under_influence?.drugs ? "Yes" : "No"}<br />
                Unknown: {fullForm.under_influence?.unknown ? "Yes" : "No"}<br />
                None: {fullForm.under_influence?.none ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Evacuation Code:</label>
              <p className="mt-1 text-sm print:print-text">
                Black: {fullForm.evacuation_code?.black ? "Yes" : "No"}<br />
                Red: {fullForm.evacuation_code?.red ? "Yes" : "No"}<br />
                Yellow: {fullForm.evacuation_code?.yellow ? "Yes" : "No"}<br />
                Green: {fullForm.evacuation_code?.green ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Response Team:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.response_team?.length ? fullForm.response_team.join(", ") : "N/A"}</p>
            </div>
          </div>

          {/* Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Medical History:</label>
              <p className="mt-1 text-sm print:print-text">
                Chief Complaints: {fullForm.chief_complaints || fullForm.history_present_illness || "N/A"}<br />
                Signs & Symptoms: {fullForm.signs_symptoms || "N/A"}<br />
                Allergies: {fullForm.allergies || "N/A"}<br />
                Medications: {fullForm.medications || "N/A"}<br />
                Past Medical History: {fullForm.past_medical_history || "N/A"}<br />
                Last Intake: {fullForm.last_intake || "N/A"}<br />
                Events: {fullForm.events || "N/A"}<br />
                Interventions: {fullForm.interventions || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Narrative:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.narrative || "N/A"}</p>
            </div>
          </div>

          {/* Transport and Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Transport Details:</label>
              <p className="mt-1 text-sm print:print-text">
                Hospital Transported: {fullForm.hospital_transported || "N/A"}<br />
                Time of Call: {formatPHDateTime(fullForm.time_call)}<br />
                Arrived Scene: {formatPHDateTime(fullForm.time_arrived_scene)}<br />
                Left Scene: {formatPHDateTime(fullForm.time_left_scene)}<br />
                Arrived Hospital: {formatPHDateTime(fullForm.time_arrived_hospital)}<br />
                Ambulance No: {fullForm.ambulance_no || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Contact Person:</label>
              <p className="mt-1 text-sm print:print-text">
                Name: ${fullForm.contact_person || "N/A"}<br />
                Relationship: ${fullForm.relationship || "N/A"}<br />
                Contact Number: ${fullForm.contact_number || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Loss of Consciousness:</label>
              <p className="mt-1 text-sm print:print-text">
                ${fullForm.loss_of_consciousness || "N/A"}
                ${fullForm.loss_of_consciousness === "yes" ? ` (${fullForm.loss_of_consciousness_minutes || "0"} minutes)` : ""}
              </p>
            </div>
          </div>

          {/* Crew and Receiving Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Crew Details:</label>
              <p className="mt-1 text-sm print:print-text">
                Driver: ${fullForm.driver || "N/A"}<br />
                Team Leader: ${fullForm.team_leader || "N/A"}<br />
                Crew: ${fullForm.crew || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Receiving Hospital:</label>
              <p className="mt-1 text-sm print:print-text">
                Hospital: ${fullForm.receiving_hospital || "N/A"}<br />
                Name: ${fullForm.receiving_name || "N/A"}<br />
                Signature: ${fullForm.receiving_signature || "N/A"}
              </p>
            </div>
          </div>

          {/* Waiver and Body Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font print-break">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Waiver:</label>
              <p className="mt-1 text-sm print:print-text">
                Signed: ${fullForm.waiver_signed ? "Yes" : "No"}<br />
                Patient Signature: ${fullForm.patient_signature || "N/A"}<br />
                Witness Signature: ${fullForm.witness_signature || "N/A"}<br />
                Patient Signature Date: ${formatPHDateTime(fullForm.patient_signature_date, true)}<br />
                Witness Signature Date: ${formatPHDateTime(fullForm.witness_signature_date, true)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Body Diagram:</label>
              <p className="mt-1 text-sm print:print-text">
                ${fullForm.body_diagram?.length ? fullForm.body_diagram.join(", ") : "N/A"}
              </p>
              <div className="no-print">
                <BodyDiagram3D initialData={fullForm.body_diagram} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRPrint;