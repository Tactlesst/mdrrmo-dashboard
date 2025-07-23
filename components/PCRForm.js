import React from 'react';

export default function PCRForm({ onClose }) {
  return (
    <div className="flex flex-col p-6 bg-gray-100 font-serif min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-800">Patient Care Report</h2>
        <button
  onClick={onClose}
  className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
>
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
  <span className="hidden sm:inline">Back</span>
</button>

      </div>

      {/* Case Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Case Type - Description" className="border rounded px-3 py-2" />
        <input placeholder="Name of Recorder" className="border rounded px-3 py-2" />
        <input type="date" className="border rounded px-3 py-2" />
        <input placeholder="Time of Call" className="border rounded px-3 py-2" />
        <input placeholder="Time Arrived at Scene" className="border rounded px-3 py-2" />
        <input placeholder="Time Left Scene" className="border rounded px-3 py-2" />
        <input placeholder="Time Arrived at Hospital" className="border rounded px-3 py-2" />
        <input placeholder="Ambulance No." className="border rounded px-3 py-2" />
      </div>

      {/* Patient Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Name of Patient" className="border rounded px-3 py-2" />
        <input placeholder="Hospital Transported To" className="border rounded px-3 py-2" />
        <input type="number" placeholder="Age" className="border rounded px-3 py-2" />
        <select className="border rounded px-3 py-2">
          <option>Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>
        <div>
          <label className="block font-medium">Category:</label>
          <div className="flex gap-3">
            <label><input type="checkbox" /> Driver</label>
            <label><input type="checkbox" /> Passenger</label>
            <label><input type="checkbox" /> Patient</label>
          </div>
        </div>
        <input placeholder="Home Address" className="border rounded px-3 py-2 col-span-2" />
      </div>

      {/* Vital Signs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <input placeholder="BP" className="border rounded px-3 py-2" />
        <input placeholder="PR" className="border rounded px-3 py-2" />
        <input placeholder="RR" className="border rounded px-3 py-2" />
        <input placeholder="O2SAT" className="border rounded px-3 py-2" />
        <input placeholder="Temperature" className="border rounded px-3 py-2" />
      </div>

      {/* Influence & Evacuation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Under Influence:</label>
          <div className="flex gap-3">
            <label><input type="checkbox" /> Alcohol</label>
            <label><input type="checkbox" /> Drugs</label>
            <label><input type="checkbox" /> Unknown</label>
            <label><input type="checkbox" /> N/A</label>
          </div>
        </div>
        <div>
          <label className="block font-medium">Evacuation Code:</label>
          <div className="flex gap-3">
            <label><input type="checkbox" /> Black</label>
            <label><input type="checkbox" /> Red</label>
            <label><input type="checkbox" /> Yellow</label>
            <label><input type="checkbox" /> Green</label>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <input placeholder="Contact Person" className="border rounded px-3 py-2" />
        <input placeholder="Relationship" className="border rounded px-3 py-2" />
        <input placeholder="Contact Number" className="border rounded px-3 py-2" />
      </div>

      {/* Incident Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="DOI (Date of Incident)" className="border rounded px-3 py-2" />
        <input placeholder="TOI (Time of Incident)" className="border rounded px-3 py-2" />
        <input placeholder="POI (Place of Incident)" className="border rounded px-3 py-2" />
        <input placeholder="Barangay" className="border rounded px-3 py-2" />
        <div>
          <label className="block font-medium">Location Type:</label>
          <div className="flex gap-3">
            <label><input type="checkbox" /> Highway/Road</label>
            <label><input type="checkbox" /> Residence</label>
            <label><input type="checkbox" /> Public Building/Place</label>
          </div>
        </div>
      </div>

      {/* Loss of Consciousness */}
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          Loss of Consciousness: 
          <input type="checkbox" className="ml-2" /> Yes 
          <input type="checkbox" className="ml-2" /> No
        </label>
        <input placeholder="How many minutes?" className="border rounded px-3 py-2" />
      </div>

      {/* Complaint and History */}
      <div>
        <label className="font-medium">Chief Complaint/s:</label>
        <textarea rows="2" className="w-full border rounded px-3 py-2" />
        <label className="font-medium">Interventions:</label>
        <textarea rows="2" className="w-full border rounded px-3 py-2" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Signs & Symptoms:</label>
          <textarea className="w-full border rounded px-3 py-2" />
          <label className="font-medium">Allergies:</label>
          <input className="w-full border rounded px-3 py-2" />
          <label className="font-medium">Medication:</label>
          <input className="w-full border rounded px-3 py-2" />
          <label className="font-medium">Past History:</label>
          <input className="w-full border rounded px-3 py-2" />
          <label className="font-medium">Last Intake:</label>
          <input className="w-full border rounded px-3 py-2" />
          <label className="font-medium">Events:</label>
          <textarea className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="font-medium">Narrative of the Incident:</label>
          <textarea rows="12" className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      {/* Body Diagram Placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded p-4 text-center">[ FRONT BODY DIAGRAM ]</div>
        <div className="bg-gray-100 rounded p-4 text-center">[ BACK BODY DIAGRAM ]</div>
      </div>

      {/* Waiver */}
      <div className="border p-4 rounded bg-gray-50 text-sm">
        <p>
          I acknowledge that I have been informed that my medical condition requires immediate treatment or transport to a physician and that with refusing further emergency medical treatment there is a risk of serious injury, illness, or death. Understanding these risks, I hereby release the attending medical personnel, their home agency, and their advising physician from all responsibility regarding any ill effects which may result from this decision.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <input placeholder="Patient Signature" className="border rounded px-2 py-1" />
          <input placeholder="Witness Signature" className="border rounded px-2 py-1" />
        </div>
      </div>

      {/* Footer Crew Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Receiving Hospital" className="w-full border rounded px-3 py-2" />
        <input placeholder="Hospital Staff Name" className="w-full border rounded px-3 py-2" />
        <input placeholder="Hospital Staff Signature" className="w-full border rounded px-3 py-2" />
        <input placeholder="Driver" className="w-full border rounded px-3 py-2" />
        <input placeholder="Team Leader" className="w-full border rounded px-3 py-2" />
        <input placeholder="Crew" className="w-full border rounded px-3 py-2" />
      </div>
    </div>
  );
}
