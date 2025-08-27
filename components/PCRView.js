"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import BodyDiagram3D from "./BodyDiagram3D";

const PCRView = ({ form, onClose }) => {
  const fullForm = form.full_form || {};

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
        >
          <FiX size={22} />
        </button>

        <div className="flex flex-col items-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold text-center">PATIENT CARE REPORT (View)</h1>
        </div>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient Name:</label>
              <p className="mt-1 text-sm">{form.patient_name || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date:</label>
              <p className="mt-1 text-sm">{form.date ? form.date.split("T")[0] : "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recorder:</label>
              <p className="mt-1 text-sm">{form.recorder || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Location:</label>
              <p className="mt-1 text-sm">{form.location || "N/A"}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Case Type:</label>
              <p className="mt-1 text-sm">{fullForm.case_number || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age:</label>
              <p className="mt-1 text-sm">{fullForm.age || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender:</label>
              <p className="mt-1 text-sm">{fullForm.sex || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category:</label>
              <p className="mt-1 text-sm">{fullForm.category || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number:</label>
              <p className="mt-1 text-sm">{fullForm.contact_number || "N/A"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Address:</label>
              <p className="mt-1 text-sm">{fullForm.address || "N/A"}</p>
            </div>
          </div>

          {/* Vitals and Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vitals:</label>
              <p className="mt-1 text-sm">
                BP: {fullForm.vitals?.blood_pressure || "N/A"}<br />
                PR: {fullForm.vitals?.pulse_rate || "N/A"}<br />
                RR: {fullForm.vitals?.respiratory_rate || "N/A"}<br />
                Temp: {fullForm.vitals?.temperature || "N/A"}<br />
                O2Sat: {fullForm.vitals?.oxygen_saturation || "N/A"}<br />
                GCS: E{fullForm.vitals?.gcs_eye || "N/A"} V{fullForm.vitals?.gcs_verbal || "N/A"} M{fullForm.vitals?.gcs_motor || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Place of Incident (POI):</label>
              <p className="mt-1 text-sm">
                Type: {fullForm.poi_type || "N/A"}<br />
                Brgy: {fullForm.poi_details?.brgy || "N/A"}<br />
                Highway: {fullForm.poi_details?.highway ? "Yes" : "No"}<br />
                Residence: {fullForm.poi_details?.residence ? "Yes" : "No"}<br />
                Public Building: {fullForm.poi_details?.publicBuilding ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Incident Details:</label>
              <p className="mt-1 text-sm">
                DOI: {fullForm.doi || "N/A"}<br />
                TOI: {fullForm.toi || "N/A"}<br />
                NOI: {fullForm.noi || "N/A"}
              </p>
            </div>
          </div>

          {/* Medical and Evacuation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Under Influence:</label>
              <p className="mt-1 text-sm">
                Alcohol: {fullForm.under_influence?.alcohol ? "Yes" : "No"}<br />
                Drugs: {fullForm.under_influence?.drugs ? "Yes" : "No"}<br />
                Unknown: {fullForm.under_influence?.unknown ? "Yes" : "No"}<br />
                None: {fullForm.under_influence?.none ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Evacuation Code:</label>
              <p className="mt-1 text-sm">
                Black: {fullForm.evacuation_code?.black ? "Yes" : "No"}<br />
                Red: {fullForm.evacuation_code?.red ? "Yes" : "No"}<br />
                Yellow: {fullForm.evacuation_code?.yellow ? "Yes" : "No"}<br />
                Green: {fullForm.evacuation_code?.green ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Response Team:</label>
              <p className="mt-1 text-sm">{fullForm.response_team?.length ? fullForm.response_team.join(", ") : "N/A"}</p>
            </div>
          </div>

          {/* Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical History:</label>
              <p className="mt-1 text-sm">
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
              <label className="block text-sm font-medium text-gray-700">Narrative:</label>
              <p className="mt-1 text-sm">{fullForm.narrative || "N/A"}</p>
            </div>
          </div>

          {/* Transport and Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transport Details:</label>
              <p className="mt-1 text-sm">
                Hospital Transported: {fullForm.hospital_transported || "N/A"}<br />
                Time of Call: {fullForm.time_call || "N/A"}<br />
                Arrived Scene: {fullForm.time_arrived_scene || "N/A"}<br />
                Left Scene: {fullForm.time_left_scene || "N/A"}<br />
                Arrived Hospital: {fullForm.time_arrived_hospital || "N/A"}<br />
                Ambulance No: {fullForm.ambulance_no || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Person:</label>
              <p className="mt-1 text-sm">
                Name: {fullForm.contact_person || "N/A"}<br />
                Relationship: {fullForm.relationship || "N/A"}<br />
                Contact Number: {fullForm.contact_number || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Loss of Consciousness:</label>
              <p className="mt-1 text-sm">
                {fullForm.loss_of_consciousness || "N/A"} ({fullForm.loss_of_consciousness_minutes || "0"} minutes)
              </p>
            </div>
          </div>

          {/* Crew and Receiving Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Crew Details:</label>
              <p className="mt-1 text-sm">
                Driver: {fullForm.driver || "N/A"}<br />
                Team Leader: {fullForm.team_leader || "N/A"}<br />
                Crew: {fullForm.crew || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Receiving Hospital:</label>
              <p className="mt-1 text-sm">
                Hospital: {fullForm.receiving_hospital || "N/A"}<br />
                Name: {fullForm.receiving_name || "N/A"}<br />
                Signature: {fullForm.receiving_signature || "N/A"}
              </p>
            </div>
          </div>

          {/* Waiver and Body Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">Waiver:</label>
              <p className="mt-1 text-sm">
                Signed: {fullForm.waiver_signed ? "Yes" : "No"}<br />
                Patient Signature: {fullForm.patient_signature || "N/A"}<br />
                Witness Signature: {fullForm.witness_signature || "N/A"}<br />
                Patient Signature Date: {fullForm.patient_signature_date || "N/A"}<br />
                Witness Signature Date: {fullForm.witness_signature_date || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Body Diagram:</label>
              <p className="mt-1 text-sm">
                {fullForm.body_diagram?.length ? fullForm.body_diagram.join(", ") : "N/A"}
              </p>
              <BodyDiagram3D initialData={fullForm.body_diagram} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRView;