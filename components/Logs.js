'use client';
import React, { useEffect, useState } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { formatPHDateTime } from '@/lib/dateUtils';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [modalLogs, setModalLogs] = useState([]);

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

  useEffect(() => {
    if (!selectedDate) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log) => formatDate(log.login_time) === selectedDate);
      setFilteredLogs(filtered);
    }
  }, [selectedDate, logs]);

  const uniqueDates = Array.from(
    new Set(logs.map((log) => formatDate(log.login_time)))
  ).sort((a, b) => (a > b ? -1 : 1));

  const uniqueEmails = Array.from(
    new Set(logs.map((log) => log.email))
  ).sort();

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    const emailLogs = logs.filter((log) => log.email === email);
    setModalLogs(emailLogs);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmail('');
    setModalLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="text-blue-600">📋</span>
          Admin Login Logs
        </h2>

        <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Filter by Date:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg shadow-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all cursor-pointer"
            >
              <option value="">All Dates</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-blue-600">👥</span>
            Accounts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uniqueEmails.map((email) => (
              <div
                key={email}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl cursor-pointer hover:shadow-lg hover:scale-105 hover:border-blue-400 transition-all duration-200"
                onClick={() => handleEmailClick(email)}
              >
                <p className="text-sm font-semibold text-gray-800 truncate">{email}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl shadow-md">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-gray-50 border-2 border-gray-200 p-8 rounded-xl shadow-md text-center">
            <p className="text-gray-500 italic">No logs found for selected date.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Login History</h3>
            </div>
            <div className="overflow-x-auto">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-sm font-semibold text-gray-800 uppercase sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left border-b-2 border-gray-300">Email</th>
                      <th className="px-6 py-4 text-left border-b-2 border-gray-300">IP Address</th>
                      <th className="px-6 py-4 text-left border-b-2 border-gray-300">Device Info</th>
                      <th className="px-6 py-4 text-left border-b-2 border-gray-300">Login Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50 transition-all duration-150">
                        <td className="px-6 py-4 font-medium text-gray-900">{log.email}</td>
                        <td className="px-6 py-4 text-gray-600">{log.ip_address}</td>
                        <td className="px-6 py-4 truncate max-w-xs text-gray-600">{log.user_agent}</td>
                        <td className="px-6 py-4 text-gray-600">{formatPHDateTime(log.login_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border-2 border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📧</span>
                  Logs for {selectedEmail}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-lg px-4 py-2 font-semibold transition-all"
                >
                  ✕ Close
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {modalLogs.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-gray-200 p-8 rounded-xl text-center">
                    <p className="text-gray-500 italic">No logs found for this account.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-sm font-semibold text-gray-800 uppercase">
                          <tr>
                            <th className="px-6 py-4 text-left border-b-2 border-gray-300">IP Address</th>
                            <th className="px-6 py-4 text-left border-b-2 border-gray-300">Device Info</th>
                            <th className="px-6 py-4 text-left border-b-2 border-gray-300">Login Time</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-200">
                          {modalLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-blue-50 transition-all duration-150">
                              <td className="px-6 py-4 font-medium text-gray-900">{log.ip_address}</td>
                              <td className="px-6 py-4 truncate max-w-xs text-gray-600">{log.user_agent}</td>
                              <td className="px-6 py-4 text-gray-600">{formatPHDateTime(log.login_time)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}