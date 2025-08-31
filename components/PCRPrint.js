"use client";

import React, { useRef, useState, useEffect } from "react";
import { FiX, FiPrinter, FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";
import BodyDiagram3D from "./BodyDiagram3D";

const PCRPrint = ({ form, onClose }) => {
  const fullForm = form.full_form || {};
  const componentRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({
    patientSignature: false,
    witnessSignature: false,
    receivingSignature: false,
  });
  const [imageErrors, setImageErrors] = useState({
    patientSignature: null,
    witnessSignature: null,
    receivingSignature: null,
  });

  // Format date for Manila timezone
  const formatPHDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const options = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      return date.toLocaleDateString("en-PH", options);
    } catch (error) {
      console.error(`Error formatting date ${dateString}:`, error);
      return "N/A";
    }
  };

  // Format time (expects "HH:mm AM/PM" or empty string)
  const formatTime = (timeString) => {
    if (!timeString) return "";
    if (/^\d{2}:\d{2} (AM|PM)$/.test(timeString)) {
      return timeString; // Already in "HH:mm AM/PM" format
    }
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return "";
      const period = hours >= 12 ? "PM" : "AM";
      const adjustedHours = hours % 12 || 12;
      return `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error(`Error formatting time ${timeString}:`, error);
      return "";
    }
  };

  // Display raw string value, handling null/undefined
  const displayRaw = (value) => {
    return value ?? "N/A"; // Use ?? to handle null/undefined, keep empty strings
  };

  // Preload images to ensure they are ready for printing/PDF
  useEffect(() => {
    console.log("PCRPrint form data:", JSON.stringify(form, null, 2));
    console.log("Full form data:", JSON.stringify(fullForm, null, 2));

    const preloadImages = async () => {
      const images = [
        { field: "patientSignature", url: fullForm.patientSignature },
        { field: "witnessSignature", url: fullForm.witnessSignature },
        { field: "receivingSignature", url: fullForm.receivingSignature },
      ];

      const loadPromises = images.map(({ field, url }) => {
        if (url && url.startsWith("https://res.cloudinary.com")) {
          console.log(`Preloading ${field} image:`, url);
          return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = "anonymous";
            img.onload = () => {
              console.log(`${field} image loaded successfully`);
              setImageLoaded((prev) => ({ ...prev, [field]: true }));
              setImageErrors((prev) => ({ ...prev, [field]: null }));
              resolve();
            };
            img.onerror = async () => {
              console.error(`${field} image failed to load:`, url);
              try {
                const response = await fetch(url);
                const errorText = response.ok ? "Loaded after retry" : await response.text().catch(() => "No error details");
                setImageErrors((prev) => ({
                  ...prev,
                  [field]: `Failed to load ${field} (${url}): HTTP ${response.status} - ${errorText}`,
                }));
              } catch (fetchError) {
                setImageErrors((prev) => ({
                  ...prev,
                  [field]: `Failed to load ${field} (${url}): ${fetchError.message}`,
                }));
              }
              setImageLoaded((prev) => ({ ...prev, [field]: false }));
              resolve();
            };
          });
        }
        console.log(`No valid URL for ${field}:`, url);
        setImageLoaded((prev) => ({ ...prev, [field]: false }));
        setImageErrors((prev) => ({ ...prev, [field]: null }));
        return Promise.resolve();
      });

      await Promise.all(loadPromises);

      if (componentRef.current) {
        console.log("Print component ref is ready:", componentRef.current);
        setIsReady(true);
      } else {
        console.error("Print component ref is not ready");
      }
    };

    preloadImages();
  }, [fullForm.patientSignature, fullForm.witnessSignature, fullForm.receivingSignature]);

  // Trigger browser print
  const handlePrint = () => {
    if (!isReady || Object.values(imageErrors).some((error) => error)) {
      alert("Some images failed to load. Check console for details or try downloading as text.");
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
            .print-image { max-width: 150px; max-height: 50px; object-fit: contain; margin-top: 4px; }
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
    if (!isReady || Object.values(imageErrors).some((error) => error)) {
      alert("Some images failed to load. Check console for details or try downloading as text.");
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
      html2canvas: { scale: 0.75, useCORS: true },
    });
  };

  // Fallback: Generate a text-based file
  const handleDownloadText = () => {
    const content = `
      PATIENT CARE REPORT

      Basic Information
      ----------------
      Patient Name: ${form.patient_name || "N/A"}
      Date: ${formatPHDate(form.date)}
      Recorder: ${form.recorder || "N/A"}
      Location: ${form.location || "N/A"}

      Patient Details
      ---------------
      Case Type: ${fullForm.caseType || "N/A"}
      Age: ${fullForm.age || "N/A"}
      Gender: ${fullForm.gender || "N/A"}
      Category: ${fullForm.category || "N/A"}
      Contact Number: ${fullForm.contactNumber || "N/A"}
      Address: ${fullForm.homeAddress || "N/A"}

      Vitals and Incident Details
      ---------------------------
      Vitals:
        BP: ${fullForm.bloodPressure || "N/A"}
        PR: ${fullForm.pr || "N/A"}
        RR: ${fullForm.rr || "N/A"}
        Temp: ${fullForm.temp || "N/A"}
        O2Sat: ${fullForm.o2sat || "N/A"}
      Place of Incident (POI):
        Brgy: ${fullForm.poi?.brgy || "N/A"}
        Highway: ${fullForm.poi?.highway ? "Yes" : "No"}
        Residence: ${fullForm.poi?.residence ? "Yes" : "No"}
        Public Building: ${fullForm.poi?.publicBuilding ? "Yes" : "No"}
      Incident Details:
        DOI: ${displayRaw(fullForm.doi)}
        TOI: ${displayRaw(fullForm.toi)}
        NOI: ${fullForm.noi || "N/A"}

      Medical and Evacuation Details
      -----------------------------
      Under Influence:
        Alcohol: ${fullForm.underInfluence?.alcohol ? "Yes" : "No"}
        Drugs: ${fullForm.underInfluence?.drugs ? "Yes" : "No"}
        Unknown: ${fullForm.underInfluence?.unknown ? "Yes" : "No"}
        None: ${fullForm.underInfluence?.none ? "Yes" : "No"}
      Evacuation Code:
        Black: ${fullForm.evacuationCode?.black ? "Yes" : "No"}
        Red: ${fullForm.evacuationCode?.red ? "Yes" : "No"}
        Yellow: ${fullForm.evacuationCode?.yellow ? "Yes" : "No"}
        Green: ${fullForm.evacuationCode?.green ? "Yes" : "No"}
      Response Team: ${fullForm.responseTeam?.length ? fullForm.responseTeam.join(", ") : "N/A"}

      Medical History
      ---------------
      Chief Complaints: ${fullForm.chiefComplaints || "N/A"}
      Signs & Symptoms: ${fullForm.signsSymptoms || "N/A"}
      Allergies: ${fullForm.allergies || "N/A"}
      Medications: ${fullForm.medication || "N/A"}
      Past Medical History: ${fullForm.pastHistory || "N/A"}
      Last Intake: ${fullForm.lastIntake || "N/A"}
      Events: ${fullForm.events || "N/A"}
      Interventions: ${fullForm.interventions || "N/A"}
      Narrative: ${fullForm.narrative || "N/A"}

      Transport and Contact Details
      -----------------------------
      Transport Details:
        Hospital Transported: ${fullForm.hospitalTransported || "N/A"}
        Time of Call: ${formatTime(fullForm.timeCall)}
        Arrived Scene: ${formatTime(fullForm.timeArrivedScene)}
        Left Scene: ${formatTime(fullForm.timeLeftScene)}
        Arrived Hospital: ${formatTime(fullForm.timeArrivedHospital)}
        Ambulance No: ${fullForm.ambulanceNo || "N/A"}
      Contact Person:
        Name: ${fullForm.contactPerson || "N/A"}
        Relationship: ${fullForm.relationship || "N/A"}
        Contact Number: ${fullForm.contactNumber || "N/A"}
      Loss of Consciousness: ${fullForm.lossOfConsciousness || "N/A"}${fullForm.lossOfConsciousness === "yes" ? ` (${fullForm.lossOfConsciousnessMinutes || "0"} minutes)` : ""}

      Crew and Receiving Hospital
      ---------------------------
      Crew Details:
        Driver: ${fullForm.driver || "N/A"}
        Team Leader: ${fullForm.teamLeader || "N/A"}
        Crew: ${fullForm.crew || "N/A"}
      Receiving Hospital:
        Hospital: ${fullForm.receivingHospital || "N/A"}
        Name: ${fullForm.receivingName || "N/A"}
        Signature URL: ${fullForm.receivingSignature || "N/A"}

      Waiver and Body Diagram
      -----------------------
      Waiver:
        Signed: ${fullForm.patientSignature || fullForm.witnessSignature ? "Yes" : "No"}
        Patient Signature URL: ${fullForm.patientSignature || "N/A"}
        Witness Signature URL: ${fullForm.witnessSignature || "N/A"}
        Patient Signature Date: ${formatPHDate(fullForm.patientSignatureDate)}
        Witness Signature Date: ${formatPHDate(fullForm.witnessSignatureDate)}
      Body Diagram: ${fullForm.bodyDiagram?.length ? fullForm.bodyDiagram.join(", ") : "N/A"}
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
              disabled={!isReady || Object.values(imageErrors).some((error) => error)}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition no-print ${
                !isReady || Object.values(imageErrors).some((error) => error) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FiPrinter className="mr-2" size={18} />
              Print Report
            </button>
            <button
              onClick={handleDownload}
              disabled={!isReady || Object.values(imageErrors).some((error) => error)}
              className={`flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition no-print ${
                !isReady || Object.values(imageErrors).some((error) => error) ? "opacity-50 cursor-not-allowed" : ""
              }`}
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
              .print-image {
                max-width: 150px;
                max-height: 50px;
                object-fit: contain;
                margin-top: 4px;
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
              <p className="mt-1 text-sm print:print-text">{formatPHDate(form.date)}</p>
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
              <p className="mt-1 text-sm print:print-text">{fullForm.caseType || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Age:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.age || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Gender:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.gender || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Category:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.category || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Contact Number:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.contactNumber || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 print:print-label">Address:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.homeAddress || "N/A"}</p>
            </div>
          </div>

          {/* Vitals and Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Vitals:</label>
              <p className="mt-1 text-sm print:print-text">
                BP: {fullForm.bloodPressure || "N/A"}<br />
                PR: {fullForm.pr || "N/A"}<br />
                RR: {fullForm.rr || "N/A"}<br />
                Temp: {fullForm.temp || "N/A"}<br />
                O2Sat: {fullForm.o2sat || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Place of Incident (POI):</label>
              <p className="mt-1 text-sm print:print-text">
                Brgy: {fullForm.poi?.brgy || "N/A"}<br />
                Highway: {fullForm.poi?.highway ? "Yes" : "No"}<br />
                Residence: {fullForm.poi?.residence ? "Yes" : "No"}<br />
                Public Building: {fullForm.poi?.publicBuilding ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Incident Details:</label>
              <p className="mt-1 text-sm print:print-text">
                DOI: {displayRaw(fullForm.doi)}<br />
                TOI: {displayRaw(fullForm.toi)}<br />
                NOI: {fullForm.noi || "N/A"}
              </p>
            </div>
          </div>

          {/* Medical and Evacuation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Under Influence:</label>
              <p className="mt-1 text-sm print:print-text">
                Alcohol: {fullForm.underInfluence?.alcohol ? "Yes" : "No"}<br />
                Drugs: {fullForm.underInfluence?.drugs ? "Yes" : "No"}<br />
                Unknown: {fullForm.underInfluence?.unknown ? "Yes" : "No"}<br />
                None: {fullForm.underInfluence?.none ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Evacuation Code:</label>
              <p className="mt-1 text-sm print:print-text">
                Black: {fullForm.evacuationCode?.black ? "Yes" : "No"}<br />
                Red: {fullForm.evacuationCode?.red ? "Yes" : "No"}<br />
                Yellow: {fullForm.evacuationCode?.yellow ? "Yes" : "No"}<br />
                Green: {fullForm.evacuationCode?.green ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Response Team:</label>
              <p className="mt-1 text-sm print:print-text">{fullForm.responseTeam?.length ? fullForm.responseTeam.join(", ") : "N/A"}</p>
            </div>
          </div>

          {/* Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Medical History:</label>
              <p className="mt-1 text-sm print:print-text">
                Chief Complaints: {fullForm.chiefComplaints || "N/A"}<br />
                Signs & Symptoms: {fullForm.signsSymptoms || "N/A"}<br />
                Allergies: {fullForm.allergies || "N/A"}<br />
                Medications: {fullForm.medication || "N/A"}<br />
                Past Medical History: {fullForm.pastHistory || "N/A"}<br />
                Last Intake: {fullForm.lastIntake || "N/A"}<br />
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
                Hospital Transported: {fullForm.hospitalTransported || "N/A"}<br />
                Time of Call: {formatTime(fullForm.timeCall)}<br />
                Arrived Scene: {formatTime(fullForm.timeArrivedScene)}<br />
                Left Scene: {formatTime(fullForm.timeArrivedHospital)}<br />
                Arrived Hospital: {formatTime(fullForm.timeLeftScene)}<br />
                Ambulance No: {fullForm.ambulanceNo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Contact Person:</label>
              <p className="mt-1 text-sm print:print-text">
                Name: {fullForm.contactPerson || "N/A"}<br />
                Relationship: {fullForm.relationship || "N/A"}<br />
                Contact Number: {fullForm.contactNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Loss of Consciousness:</label>
              <p className="mt-1 text-sm print:print-text">
                {fullForm.lossOfConsciousness || "N/A"}
                {fullForm.lossOfConsciousness === "yes" ? ` (${fullForm.lossOfConsciousnessMinutes || "0"} minutes)` : ""}
              </p>
            </div>
          </div>

          {/* Crew and Receiving Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font">
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Crew Details:</label>
              <p className="mt-1 text-sm print:print-text">
                Driver: {fullForm.driver || "N/A"}<br />
                Team Leader: {fullForm.teamLeader || "N/A"}<br />
                Crew: {fullForm.crew || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 print:print-label">Receiving Hospital:</label>
              <p className="mt-1 text-sm print:print-text">
                Hospital: {fullForm.receivingHospital || "N/A"}<br />
                Name: {fullForm.receivingName || "N/A"}<br />
                {fullForm.receivingSignature ? (
                  <>
                    Signature: <br />
                    {imageErrors.receivingSignature ? (
                      <span className="text-red-600 print:print-text">Error: {imageErrors.receivingSignature}</span>
                    ) : imageLoaded.receivingSignature ? (
                      <img
                        src={fullForm.receivingSignature}
                        alt="Receiving Signature"
                        className="print-image"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-gray-500 print:print-text">Loading signature...</span>
                    )}
                  </>
                ) : (
                  "Signature: N/A"
                )}
              </p>
            </div>
          </div>

{/* Waiver and Body Diagram */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded print:print-border print-font print-break">
  <div>
    <label className="block text-sm font-medium text-gray-700 print:print-label">Waiver:</label>
    <p className="mt-1 text-sm print:print-text">
      Signed: {fullForm.patientSignature || fullForm.witnessSignature ? "Yes" : "No"}<br />
      {fullForm.patientSignature ? (
        <>
          Patient Signature: <br />
          {imageErrors.patientSignature ? (
            <span className="text-red-600 print:print-text">Error: {imageErrors.patientSignature}</span>
          ) : imageLoaded.patientSignature ? (
            <img
              src={fullForm.patientSignature}
              alt="Patient Signature"
              className="print-image"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-gray-500 print:print-text">Loading signature...</span>
          )}
        </>
      ) : (
        "Patient Signature: N/A"
      )}<br />
      {fullForm.witnessSignature ? (
        <>
          Witness Signature: <br />
          {imageErrors.witnessSignature ? (
            <span className="text-red-600 print:print-text">Error: {imageErrors.witnessSignature}</span>
          ) : imageLoaded.witnessSignature ? (
            <img
              src={fullForm.witnessSignature}
              alt="Witness Signature"
              className="print-image"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-gray-500 print:print-text">Loading signature...</span>
          )}
        </>
      ) : (
        "Witness Signature: N/A"
      )}<br />
      Patient Signature Date: {formatPHDate(fullForm.patientSignatureDate)}<br />
      Witness Signature Date: {formatPHDate(fullForm.witnessSignatureDate)}
    </p>
  </div>
  <div>

    <div className="no-print mt-4">
      <BodyDiagram3D initialData={fullForm.bodyDiagram} readOnly />
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default PCRPrint;