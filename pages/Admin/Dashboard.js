import React from 'react';
import { Bell, Clock, CheckCircle } from 'lucide-react';

export default function ResponderDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow p-4 rounded-xl flex items-center space-x-4">
          <Bell className="text-red-500 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">New Alerts Today</p>
            <p className="text-xl font-bold text-red-500">5</p>
          </div>
        </div>
        <div className="bg-white shadow p-4 rounded-xl flex items-center space-x-4">
          <CheckCircle className="text-green-500 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">Active Responses</p>
            <p className="text-xl font-bold text-green-500">3 ongoing</p>
          </div>
        </div>
        <div className="bg-white shadow p-4 rounded-xl flex items-center space-x-4">
          <CheckCircle className="text-green-500 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">Resolved Cases</p>
            <p className="text-xl font-bold text-green-500">18</p>
          </div>
        </div>
        <div className="bg-white shadow p-4 rounded-xl flex items-center space-x-4">
          <Clock className="text-black w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">Avg. Response Time</p>
            <p className="text-xl font-bold">5m 23s</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white shadow p-4 rounded-xl mb-8">
        <h2 className="font-semibold text-lg mb-2">Quick Access Map</h2>
        <img src="https://maps.googleapis.com/maps/api/staticmap?center=8.569,124.758&zoom=14&size=600x300&markers=color:red%7C8.569,124.758" alt="Map" className="w-full h-60 object-cover rounded-md" />
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Start Navigation</button>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white shadow p-4 rounded-xl">
        <h2 className="font-semibold text-lg mb-4">Recent Alerts Feed</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="pb-2">Time</th>
              <th className="pb-2">Emergency Type</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm">
              <td className="py-2">8:41 AM</td>
              <td className="py-2">Vehicular Accident</td>
              <td className="py-2">Brgy. Binitinan</td>
              <td className="py-2 text-red-500">Pending</td>
            </tr>
            <tr className="text-sm">
              <td className="py-2">8:32 AM</td>
              <td className="py-2">Fire Incident</td>
              <td className="py-2">Brgy. Linggangao</td>
              <td className="py-2 text-yellow-500">En Route</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
