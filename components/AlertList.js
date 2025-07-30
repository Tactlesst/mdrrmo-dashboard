'use client';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function AlertList({
  alerts,
  currentPage,
  setCurrentPage,
  entriesPerPage,
  setEntriesPerPage,
  totalPages,
  onView,
}) {
  const getStatusBadge = (status) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-semibold';
    switch (status) {
      case 'Accepted by Responder':
      case 'Resolved':
        return `${base} bg-green-100 text-green-700`;
      case 'Not Responded':
        return `${base} bg-red-100 text-red-700`;
      case 'Pending':
      case 'Responders On The Way':
        return `${base} bg-yellow-100 text-yellow-700`;
      default:
        return `${base} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[calc(100vh-6rem)]">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Alert Management</h1>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-gray-50 p-3 rounded-md mb-2 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{alert.user}</p>
                  <p className="text-xs text-gray-600">{alert.address}</p>
                </div>
                <div className="flex gap-2 text-sm text-gray-500">
                  <FiEye
                    className="hover:text-blue-500 cursor-pointer"
                    onClick={() => onView(alert.id)}
                  />
                  <FiEdit2 className="hover:text-green-500 cursor-pointer" />
                  <FiTrash2 className="hover:text-red-500 cursor-pointer" />
                </div>
              </div>
              <div className="text-xs mt-1 space-y-1">
                <p>Type: {alert.type}</p>
                <p>
                  Status:{' '}
                  <span className={getStatusBadge(alert.status)}>
                    {alert.status}
                  </span>
                </p>
                <p>Date: {alert.date}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-6 text-sm">No alerts found.</p>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex gap-2 items-center">
          <label>Show</label>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded-md px-2 py-1"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="flex gap-1 flex-wrap justify-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded-md bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-2 py-1 border rounded-md ${
                currentPage === i + 1 ? 'bg-red-600 text-white' : 'bg-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded-md bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
