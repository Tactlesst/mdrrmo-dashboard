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
      case 'Responded':
        return `${base} bg-green-100 text-green-700`; // Hidden in filter, but kept for completeness
      case 'Not Responded':
        return `${base} bg-red-100 text-red-700`; // Red for Not Responded
      case 'Pending':
      case 'In Progress':
      case 'Ongoing': // Orange for Ongoing
        return `${base} bg-yellow-100 text-yellow-700`;
      default:
        return `${base} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="w-full lg:w-96 bg-white border border-white-300 rounded-xl shadow-md p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[calc(100vh-6rem)]">
      <h1 className="text-xl font-bold text-black-700 mb-4">Alert Management</h1>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-white-50 border border-black-200 p-3 rounded-md mb-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-black-800 text-sm">
                    {alert.resident_name || <span className="italic text-gray-500">Unknown User</span>}
                  </p>
                  <p className="text-xs text-gray-600">{alert.address}</p>
                </div>
                <div className="flex gap-2 text-sm text-gray-500 mt-1">
                  <FiEye
                    className="hover:text-red-600 cursor-pointer"
                    onClick={() => {
                      console.log('Eye icon clicked for alert:', alert.id);
                      onView(alert.id);
                    }}
                    title="View on Map"
                  />
                  <FiEdit2 className="hover:text-green-600 cursor-pointer" title="Edit Alert" />
                  <FiTrash2 className="hover:text-red-600 cursor-pointer" title="Delete Alert" />
                </div>
              </div>

              <div className="text-xs mt-2 space-y-1 text-gray-800">
                <p>
                  <span className="font-medium">Responder:</span>{' '}
                  {alert.responder_name || <span className="text-gray-500 italic">Not Assigned</span>}
                </p>
                
                {/* Show navigation status for ongoing alerts */}
                {alert.status === 'Ongoing' && alert.responder_name && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                    <p className="font-semibold text-blue-800 flex items-center gap-1">
                      🚑 En Route to Incident
                    </p>
                    {alert.route_started_at && (
                      <p className="text-blue-700 text-xs mt-1">
                        🚦 Started: <span className="font-semibold">
                          {new Date(alert.route_started_at).toLocaleString('en-PH', { 
                            timeZone: 'Asia/Manila',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    )}
                    {alert.estimated_arrival && (
                      <p className="text-blue-700 text-xs">
                        🏁 Est. Arrival: <span className="font-semibold">
                          {new Date(alert.estimated_arrival).toLocaleString('en-PH', { 
                            timeZone: 'Asia/Manila',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    )}
                    {alert.eta && (
                      <p className="text-blue-700 mt-1">
                        ⏱️ ETA: <span className="font-semibold">{alert.eta} min</span>
                      </p>
                    )}
                    {alert.distance && (
                      <p className="text-blue-700">
                        📍 Distance: <span className="font-semibold">{alert.distance}</span>
                      </p>
                    )}
                    {alert.responder_speed && (
                      <p className="text-blue-700">
                        ⚡ Speed: <span className="font-semibold">{alert.responder_speed} km/h</span>
                      </p>
                    )}
                  </div>
                )}
                
                <p>
                  <span className="font-medium">Responded At:</span>{' '}
                  {alert.responded_at
                    ? new Date(alert.responded_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
                    : <span className="text-gray-500 italic">Not yet responded</span>}
                </p>
                <p><span className="font-medium">Type:</span> {alert.type || 'Unknown'}</p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={getStatusBadge(alert.status)}>{alert.status}</span>
                </p>
                <p>
                  <span className="font-medium">Priority:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' : 
                    alert.severity === 'high' ? 'bg-orange-500 text-white' : 
                    alert.severity === 'medium' ? 'bg-yellow-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}>
                    {alert.severity ? alert.severity.toUpperCase() : 'MEDIUM'}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Reported On:</span>{' '}
                  {alert.occurred_at
                    ? new Date(alert.occurred_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
                    : <span className="italic text-gray-500">Unknown</span>}
                </p>
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
          <label htmlFor="entriesPerPage">Show</label>
          <select
            id="entriesPerPage"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded-md px-2 py-1"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
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
                currentPage === i + 1 ? 'bg-gray-600 text-white' : 'bg-white'
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