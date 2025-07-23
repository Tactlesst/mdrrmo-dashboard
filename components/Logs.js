import React from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';

export default function Logs() {
  const logs = [
    { id: 1, user: 'John Doe', action: 'Created report', time: '2025-07-04 10:12 AM' },
    { id: 2, user: 'Razel D.', action: 'Edited Form 2', time: '2025-07-04 10:35 AM' },
    { id: 3, user: 'Admin', action: 'Deleted Form 3', time: '2025-07-03 3:21 PM' },
  ];

  return (
    <div className="flex flex-col p-6 bg-gray-100 font-serif min-h-screen">
      <table className="w-full border border-gray-300 text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="border border-gray-300 px-3 py-2">User</th>
            <th className="border border-gray-300 px-3 py-2">Action</th>
            <th className="border border-gray-300 px-3 py-2">Timestamp</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Log Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">{log.user}</td>
              <td className="border border-gray-300 px-3 py-2">{log.action}</td>
              <td className="border border-gray-300 px-3 py-2">{log.time}</td>
              <td className="border border-gray-300 px-3 py-2 text-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800" title="View">
                  <FaEye />
                </button>
                <button className="text-red-600 hover:text-red-800" title="Delete">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}