// pages/alerts.js or components/IncomingAlerts.js
import React from 'react';

export default function IncomingAlerts() {
  const alerts = [
    {
      id: 1,
      user: 'Anonymous',
      time: '9:41 AM',
      location: 'Brgy. Linggangao',
      type: 'Vehicular Accident',
      description: 'Collision between two vehicles',
      image: 'https://via.placeholder.com/150x100?text=Car+Crash',
      status: 'New',
    },
    {
      id: 2,
      user: 'Anonymous',
      time: '9:32 AM',
      location: 'Brgy. Linggangao',
      type: 'Fire Incident',
      description: 'Building engulfed in flames',
      image: 'https://via.placeholder.com/150x100?text=Fire+Scene',
      status: 'Ongoing',
    },
    {
      id: 3,
      user: 'Anonymous',
      time: '8:50 AM',
      location: 'Brgy. Linggangao',
      type: 'Vehicular Accident',
      description: 'Accident cleared and resolved',
      image: 'https://via.placeholder.com/150x100?text=Resolved',
      status: 'Resolved',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Incoming Alerts</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 text-sm">
        <select className="p-1.5 rounded border border-gray-300 bg-white shadow-sm">
          <option>Emergency Type</option>
        </select>
        <select className="p-1.5 rounded border border-gray-300 bg-white shadow-sm">
          <option>Date Range</option>
        </select>
        <select className="p-1.5 rounded border border-gray-300 bg-white shadow-sm">
          <option>Status</option>
        </select>
        <input
          type="text"
          placeholder="Search by Barangay"
          className="p-1.5 rounded border border-gray-300 bg-white shadow-sm flex-1 min-w-[180px]"
        />
      </div>

      {/* Alerts */}
      <div className="grid gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white p-4 rounded-lg shadow-sm grid md:grid-cols-4 gap-3 items-center text-sm"
          >
            <div className="flex items-start space-x-3 col-span-2">
              <img
                src="https://via.placeholder.com/50x50?text=Map"
                alt="Map"
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <p className="font-medium text-gray-800">{alert.user}</p>
                <p className="text-gray-500">{alert.location}</p>
                <p className="font-semibold mt-1 text-gray-700">{alert.type}</p>
                <p className="text-gray-600">{alert.description}</p>
              </div>
            </div>

            <div>
              <img
                src={alert.image}
                alt="Incident"
                className="w-full h-20 rounded object-cover"
              />
              <span className="block mt-1 text-xs text-gray-500">{alert.time}</span>
            </div>

            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                  alert.status === 'New'
                    ? 'bg-red-100 text-red-700'
                    : alert.status === 'Ongoing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {alert.status}
              </span>
              <div className="flex flex-wrap gap-1">
                <button className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100">View</button>
                <button className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100">Nav</button>
                <button className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100">Call</button>
                <button className="px-2 py-0.5 border rounded text-gray-600 hover:bg-gray-100">SMS</button>
                <button className="px-2 py-0.5 border rounded text-green-600 hover:bg-green-50">Resolve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
