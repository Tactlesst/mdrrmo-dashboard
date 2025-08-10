'use client';
import React, { useEffect, useState } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { formatPHDateTime, formatPHDateISO } from '@/lib/dateUtils';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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

  useEffect(() => {
    if (!selectedDate) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(
        (log) => formatPHDateISO(log.login_time) === selectedDate
      );
      setFilteredLogs(filtered);
    }
  }, [selectedDate, logs]);

  const uniqueDates = Array.from(
    new Set(logs.map((log) => formatPHDateISO(log.login_time)))
  ).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="overflow-x-auto max-h-[300vh] overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-red-700 mb-6">Admin Login Logs</h2>

        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-red-700">Filter by Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 text-sm border border-red-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-red-800"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString("en-PH", {
                  timeZone: "Asia/Manila",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-red-500">Loading logs...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-red-400 italic">No logs found for selected date.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto rounded-xl shadow-md border border-red-300 bg-white">
              <table className="min-w-full">
                <thead className="bg-red-100 text-sm font-semibold text-red-800 uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left border border-red-200">Email</th>
                    <th className="px-4 py-3 text-left border border-red-200">IP Address</th>
                    <th className="px-4 py-3 text-left border border-red-200">Device Info</th>
                    <th className="px-4 py-3 text-left border border-red-200">Login Time</th>
                    <th className="px-4 py-3 text-center border border-red-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-red-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-red-50 transition-all">
                      <td className="px-4 py-3">{log.email}</td>
                      <td className="px-4 py-3">{log.ip_address}</td>
                      <td className="px-4 py-3 truncate max-w-xs">{log.user_agent}</td>
                      <td className="px-4 py-3">{formatPHDateTime(log.login_time)}</td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
