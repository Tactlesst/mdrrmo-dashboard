"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import BodyDiagram3D from "./BodyDiagram3D";

const PCRView = ({ form, onClose }) => {
  const fullForm = form.full_form || {};

  // Format date for Manila timezone
  const formatPHDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      console.error(`Error formatting date ${dateString}:`, error);
      return "N/A";
    }
  };

  // Format time string
  const formatPHTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      if (/\d{2}:\d{2}\s?(AM|PM)/i.test(timeString)) {
        return timeString.trim();
      }
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        const [hours, minutes] = timeString.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const adjustedHours = hours % 12 || 12;
        return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      }
      return "N/A";
    } catch (error) {
      console.error(`Error formatting time ${timeString}:`, error);
      return "N/A";
    }
  };

  const displayRaw = (value) => value ?? "N/A";

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="fixed inset-0 bg-opacity-50 z-40" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative flex flex-col max-h-[95vh] z-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
        >
          <FiX size={22} />
        </button>

        <div className="overflow-y-auto p-8 space-y-4">
          <div className="flex flex-col items-center border-b pb-4 mb-4">
            <h1 className="text-xl font-bold text-center">
              PATIENT CARE REPORT (View)
            </h1>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Patient Name:
              </label>
              <p className="mt-1 text-sm">{form.patient_name || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date:
              </label>
              <p className="mt-1 text-sm">{formatPHDate(form.date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recorder:
              </label>
              <p className="mt-1 text-sm">{form.recorder || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location:
              </label>
              <p className="mt-1 text-sm">{form.location || "N/A"}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Case Type:
              </label>
              <p className="mt-1 text-sm">{fullForm.caseType || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age:
              </label>
              <p className="mt-1 text-sm">{fullForm.age || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender:
              </label>
              <p className="mt-1 text-sm">{fullForm.gender || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category:
              </label>
              <p className="mt-1 text-sm">{fullForm.category || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number:
              </label>
              <p className="mt-1 text-sm">{fullForm.contactNumber || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Home Address:
              </label>
              <p className="mt-1 text-sm">{fullForm.homeAddress || "N/A"}</p>
            </div>
          </div>

          {/* Vitals and Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vitals:
              </label>
              <p className="mt-1 text-sm">
                BP: {fullForm.bloodPressure || "N/A"}<br />
                PR: {fullForm.pr || "N/A"}<br />
                RR: {fullForm.rr || "N/A"}<br />
                Temp: {fullForm.temp || "N/A"}<br />
                O2Sat: {fullForm.o2sat || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Place of Incident (POI):
              </label>
              <p className="mt-1 text-sm">
                Brgy: {fullForm.poi?.brgy || "N/A"}<br />
                Highway: {fullForm.poi?.highway ? "Yes" : "No"}<br />
                Residence: {fullForm.poi?.residence ? "Yes" : "No"}<br />
                Public Building: {fullForm.poi?.publicBuilding ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Incident Details:
              </label>
              <p className="mt-1 text-sm">
                DOI: {displayRaw(fullForm.doi)}<br />
                TOI: {displayRaw(fullForm.toi)}<br />
                NOI: {fullForm.noi || "N/A"}
              </p>
            </div>
          </div>

          {/* Medical and Evacuation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Under Influence:
              </label>
              <p className="mt-1 text-sm">
                Alcohol: {fullForm.underInfluence?.alcohol ? "Yes" : "No"}<br />
                Drugs: {fullForm.underInfluence?.drugs ? "Yes" : "No"}<br />
                Unknown: {fullForm.underInfluence?.unknown ? "Yes" : "No"}<br />
                None: {fullForm.underInfluence?.none ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Evacuation Code:
              </label>
              <p className="mt-1 text-sm">
                Black: {fullForm.evacuationCode?.black ? "Yes" : "No"}<br />
                Red: {fullForm.evacuationCode?.red ? "Yes" : "No"}<br />
                Yellow: {fullForm.evacuationCode?.yellow ? "Yes" : "No"}<br />
                Green: {fullForm.evacuationCode?.green ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Response Team:
              </label>
              <p className="mt-1 text-sm">
                {fullForm.responseTeam?.length ? fullForm.responseTeam.join(", ") : "N/A"}
              </p>
            </div>
          </div>

          {/* Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medical History:
              </label>
              <p className="mt-1 text-sm">
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
              <label className="block text-sm font-medium text-gray-700">
                Narrative:
              </label>
              <p className="mt-1 text-sm">{fullForm.narrative || "N/A"}</p>
            </div>
          </div>

          {/* Transport and Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transport Details:
              </label>
              <p className="mt-1 text-sm">
                Hospital Transported: {fullForm.hospitalTransported || "N/A"}<br />
                Time of Call: {formatPHTime(fullForm.timeCall)}<br />
                Arrived Scene: {formatPHTime(fullForm.timeArrivedScene)}<br />
                Left Scene: {formatPHTime(fullForm.timeLeftScene)}<br />
                Arrived Hospital: {formatPHTime(fullForm.timeArrivedHospital)}<br />
                Ambulance No: {fullForm.ambulanceNo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Person:
              </label>
              <p className="mt-1 text-sm">
                Name: {fullForm.contactPerson || "N/A"}<br />
                Relationship: {fullForm.relationship || "N/A"}<br />
                Contact Number: {fullForm.contactNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loss of Consciousness:
              </label>
              <p className="mt-1 text-sm">
                {fullForm.lossOfConsciousness || "N/A"}
                {fullForm.lossOfConsciousness === "yes" ? ` (${fullForm.lossOfConsciousnessMinutes || "0"} minutes)` : ""}
              </p>
            </div>
          </div>

          {/* Crew and Receiving Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Crew Details:
              </label>
              <p className="mt-1 text-sm">
                Driver: {fullForm.driver || "N/A"}<br />
                Team Leader: {fullForm.teamLeader || "N/A"}<br />
                Crew: {fullForm.crew || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Receiving Hospital:
              </label>
              <p className="mt-1 text-sm">
                Hospital: {fullForm.receivingHospital || "N/A"}<br />
                Name: {fullForm.receivingName || "N/A"}<br />
                {fullForm.receivingSignature ? (
                  <>
                    Signature:<br />
                    <img
                      src={fullForm.receivingSignature}
                      alt="Receiving Signature"
                      className="mt-2 h-16 object-contain border rounded"
                    />
                  </>
                ) : (
                  "Signature: N/A"
                )}
              </p>
              {fullForm.receivingSignatureDate && (
                <p className="mt-1 text-sm">
                  Signature Date: {formatPHDate(fullForm.receivingSignatureDate)}
                </p>
              )}
            </div>
          </div>

          {/* Waiver and Body Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Waiver:
              </label>
              <p className="mt-1 text-sm">
                Signed: {fullForm.patientSignature || fullForm.witnessSignature ? "Yes" : "No"}
              </p>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Patient Signature:</span>{" "}
                  {fullForm.patientSignature ? (
                    <img
                      src={fullForm.patientSignature}
                      alt="Patient Signature"
                      className="mt-1 h-16 object-contain border rounded"
                    />
                  ) : (
                    "N/A"
                  )}
                </div>
                <div>
                  <span className="font-medium">Patient Signature Date:</span>{" "}
                  {formatPHDate(fullForm.patientSignatureDate)}
                </div>
                <div>
                  <span className="font-medium">Witness Signature:</span>{" "}
                  {fullForm.witnessSignature ? (
                    <img
                      src={fullForm.witnessSignature}
                      alt="Witness Signature"
                      className="mt-1 h-16 object-contain border rounded"
                    />
                  ) : (
                    "N/A"
                  )}
                </div>
                <div>
                  <span className="font-medium">Witness Signature Date:</span>{" "}
                  {formatPHDate(fullForm.witnessSignatureDate)}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Body Diagram:
              </label>
              <p className="mt-1 text-sm">
                {fullForm.bodyDiagram?.length ? fullForm.bodyDiagram.join(", ") : "No injuries marked"}
              </p>
              <BodyDiagram3D initialData={fullForm.bodyDiagram} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRView;