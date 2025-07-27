'use client';
import React, { useEffect, useState } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Extract only the date portion (e.g., "2025-07-27")
  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  useEffect(() => {
    fetch('/api/login-logs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
          setFilteredLogs(data.logs);
        } else {
          throw new Error('Invalid data format');
        }
      })
      .catch((err) => {
        console.error('Failed to load logs:', err);
        setError('Failed to load logs');
      })
      .finally(() => setLoading(false));
  }, []);

  // When selected date changes, filter logs
  useEffect(() => {
    if (!selectedDate) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log) => formatDate(log.login_time) === selectedDate);
      setFilteredLogs(filtered);
    }
  }, [selectedDate, logs]);

  // Get unique login dates for dropdown
  const uniqueDates = Array.from(
    new Set(logs.map((log) => formatDate(log.login_time)))
  ).sort((a, b) => (a > b ? -1 : 1)); // Latest first

  return (
<div className="flex flex-col p-6 bg-gray-100 font-sans min-h-screen">
  <h2 className="text-2xl font-semibold mb-6 text-gray-800">Admin Login Logs</h2>

  <div className="mb-6 flex items-center gap-2">
    <label className="font-medium text-gray-700">Filter by Date:</label>
    <select
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Dates</option>
      {uniqueDates.map((date) => (
        <option key={date} value={date}>
          {new Date(date).toLocaleDateString()}
        </option>
      ))}
    </select>
  </div>

  {loading && <p className="text-gray-600">Loading logs...</p>}
  {error && <p className="text-red-600">{error}</p>}
  {!loading && filteredLogs.length === 0 && (
    <p className="text-gray-500 italic">No logs found for selected date.</p>
  )}

  {filteredLogs.length > 0 && (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="w-full border border-gray-300 text-sm text-gray-800 bg-white">
        <thead className="bg-gray-200 text-gray-700 uppercase text-xs tracking-wide">
          <tr>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">IP Address</th>
            <th className="border px-4 py-2">Device Info</th>
            <th className="border px-4 py-2">Login Time</th>
            <th className="border px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-all">
              <td className="border px-4 py-2">{log.email}</td>
              <td className="border px-4 py-2">{log.ip_address}</td>
              <td className="border px-4 py-2">{log.user_agent}</td>
              <td className="border px-4 py-2">
                {new Date(log.login_time).toLocaleString()}
              </td>
              <td className="border px-4 py-2 text-center space-x-2">
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
  )}
</div>

  );
}
