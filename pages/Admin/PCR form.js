import React from 'react';

export default function PCRForm() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Patient Care Report</h1>

      <form className="bg-white p-4 rounded-lg shadow-md space-y-4 max-w-xl mx-auto text-sm">
        <div>
          <label className="block mb-1 font-medium text-gray-700">Responder Name</label>
          <input type="text" className="w-full p-2 border rounded-md" placeholder="Responder Name" />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Incident Date & Time</label>
          <input type="datetime-local" className="w-full p-2 border rounded-md" />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Location of Incident</label>
          <input type="text" className="w-full p-2 border rounded-md" placeholder="Type location" />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Type of Emergency</label>
          <select className="w-full p-2 border rounded-md">
            <option>Select type</option>
            <option>Vehicular Accident</option>
            <option>Fire</option>
            <option>Medical Emergency</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Victim Name</label>
            <input type="text" className="w-full p-2 border rounded-md" placeholder="Name" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Gender</label>
            <input type="text" className="w-full p-2 border rounded-md" placeholder="Gender" />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Age</label>
          <input type="number" className="w-full p-2 border rounded-md" placeholder="Age" />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Action Taken</label>
          <select className="w-full p-2 border rounded-md">
            <option>Select action</option>
            <option>CPR</option>
            <option>Transported</option>
            <option>Triage</option>
            <option>Stabilized</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Status of Victim</label>
            <select className="w-full p-2 border rounded-md">
              <option>Select status</option>
              <option>Alive</option>
              <option>Unconscious</option>
              <option>Deceased</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Additional Notes</label>
            <textarea className="w-full p-2 border rounded-md" rows="3" placeholder="..." />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Upload Images</label>
          <div className="border border-dashed border-gray-300 p-4 rounded-md text-center">
            <p className="text-xs text-gray-500 mb-1">Upload scene photos or medical files</p>
            <input type="file" className="block mx-auto text-xs" />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button type="button" className="px-4 py-2 bg-gray-200 rounded-md text-gray-800">Save to Logs</button>
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md">Export PDF</button>
        </div>
      </form>
    </div>
  );
}
