'use client';

import { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import AnalyticsReport from './AnalyticsReportMini';
import dayjs from 'dayjs';

export default function ReportsPage() {
  const [responderLogs, setResponderLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/responders/logs');
      const data = await res.json();
      setResponderLogs(data);
    };
    fetchLogs();
  }, []);

  const exportResponderLogs = () => {
    const headers = ['name', 'action', 'timestamp'];
    const csvRows = [
      headers.join(','),
      ...responderLogs.map(row =>
        headers.map(f => `"${row[f] || ''}"`).join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responder_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPCRReports = () => {
    const a = document.createElement('a');
    a.href = '/api/pcr/export/pcr';
    a.download = `pcr_reports_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-red-800 mb-4">Reports Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PCR Reports */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg text-gray-700">PCR Reports</h2>
            <button
              onClick={downloadPCRReports}
              className="flex items-center gap-1 text-sm text-white bg-red-700 hover:bg-red-800 px-3 py-1 rounded"
            >
              <FiDownload /> Export CSV
            </button>
          </div>
          <div className="h-64 overflow-y-auto text-sm text-gray-600">
            <p className="text-gray-400">PCR reports are exported directly as CSV.</p>
          </div>
        </div>

        {/* Alert Analytics Chart */}
        <div className="bg-white shadow rounded-lg p-4 col-span-1">
          <h2 className="font-semibold text-lg text-gray-700 mb-2">Alert Analytics</h2>
          <AnalyticsReport />
        </div>

        
        {/* Responder Reports */}
        <div className="bg-white shadow rounded-lg p-4 col-span-1">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg text-gray-700">Responder Logs</h2>
            <button
              onClick={exportResponderLogs}
              className="flex items-center gap-1 text-sm text-white bg-red-700 hover:bg-red-800 px-3 py-1 rounded"
            >
              <FiDownload /> Export CSV
            </button>
          </div>
          <div className="h-64 overflow-y-auto text-sm text-gray-600">
            {responderLogs.map((log, i) => (
              <div key={i} className="border-b py-2">
                <p><strong>{log.name}</strong> — {log.action}</p>
                <p className="text-xs text-gray-500">{log.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
