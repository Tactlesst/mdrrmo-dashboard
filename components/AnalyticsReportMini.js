'use client';
import { FiDownload } from 'react-icons/fi';

export default function AnalyticsExportOnly() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold text-lg mb-2">Alert Reports</h3>
      <a
        href="/api/alerts/export"
        download
        className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        <FiDownload /> Export CSV
      </a>
    </div>
  );
}
