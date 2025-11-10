'use client';
import { FiNavigation } from 'react-icons/fi';

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
      case 'Ongoing':
        return `${base} bg-yellow-100 text-yellow-700`; // Yellow for Ongoing
      case 'Referred':
        return `${base} bg-orange-100 text-orange-700`; // Orange for Referred
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  // Helper to check if alert is new (within last 5 minutes)
  const isNewAlert = (occurredAt) => {
    if (!occurredAt) return false;
    const alertTime = new Date(occurredAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - alertTime) < fiveMinutes;
  };

  // Helper to shorten address - keep only street and barangay
  const shortenAddress = (address) => {
    if (!address) return '—';
    
    // Split by comma and take first 2-3 parts (usually street and barangay)
    const parts = address.split(',').map(p => p.trim());
    
    if (parts.length <= 2) return address;
    
    // Return first 2 parts (street + barangay/area)
    return parts.slice(0, 2).join(', ');
  };

  // Calculate counts
  const newAlertsCount = alerts.filter(a => isNewAlert(a.occurred_at)).length;
  const pendingCount = alerts.filter(a => a.status === 'Not Responded').length;
  const ongoingCount = alerts.filter(a => 
    a.status === 'Ongoing' || a.status === 'In Progress' || a.status === 'Pending'
  ).length;

  return (
    <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden h-full">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Alert Management</h1>
        
        {/* Status Summary */}
        <div className="flex gap-2 flex-wrap">
          {newAlertsCount > 0 && (
            <div className="bg-blue-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <span>🆕</span> {newAlertsCount} New
            </div>
          )}
          {pendingCount > 0 && (
            <div className="bg-red-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <span>⚠️</span> {pendingCount} Urgent
            </div>
          )}
          {ongoingCount > 0 && (
            <div className="bg-yellow-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <span>🚑</span> {ongoingCount} Active
            </div>
          )}
          {alerts.length === 0 && (
            <div className="bg-green-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <span>✅</span> All Clear
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        {alerts.length > 0 ? (
          <div className="divide-y divide-gray-200">
          {alerts.map((alert) => {
            const isNew = isNewAlert(alert.occurred_at);
            const isPending = alert.status === 'Not Responded';
            const isOngoing = alert.status === 'Ongoing' || alert.status === 'In Progress' || alert.status === 'Pending';
            
            return (
            <div key={alert.id} className={`relative p-4 transition-all hover:bg-white ${
              isNew ? 'bg-blue-50 border-l-4 border-blue-500' : 
              isPending ? 'bg-red-50 border-l-4 border-red-500' : 
              isOngoing ? 'bg-yellow-50 border-l-4 border-yellow-500' :
              'bg-white border-l-4 border-transparent'
            }`}>
              {/* New Alert Indicator - Only show for new alerts */}
              {isNew && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  NEW
                </div>
              )}
              
              {/* Main Content */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Status Indicator + Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {isPending && <span className="text-lg flex-shrink-0">🔴</span>}
                    {isOngoing && <span className="text-lg flex-shrink-0">🟡</span>}
                    {!isPending && !isOngoing && <span className="text-lg flex-shrink-0">⚪</span>}
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {alert.resident_name || <span className="italic text-gray-500">Unknown User</span>}
                    </h3>
                  </div>
                  
                  {/* Address */}
                  <p className="text-xs text-gray-600 mb-2 flex items-start gap-1" title={alert.address}>
                    <span className="flex-shrink-0">📍</span>
                    <span className="line-clamp-2">{shortenAddress(alert.address)}</span>
                  </p>
                  
                  {/* Contact Number */}
                  {alert.contact && (
                    <p className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                      <span className="flex-shrink-0">📞</span>
                      <a href={`tel:${alert.contact}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {alert.contact}
                      </a>
                    </p>
                  )}
                  
                  {/* Type & Time */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="font-medium text-gray-700 flex items-center gap-1.5">
                      {alert.type || 'Emergency'}
                      {/* NEW badge for alerts created within last 5 minutes */}
                      {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
                        <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
                          NEW
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{alert.occurred_at ? new Date(alert.occurred_at).toLocaleTimeString('en-PH', { 
                      timeZone: 'Asia/Manila',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Unknown'}</span>
                  </div>

                  {/* Status Badges Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {/* Verification Status Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      alert.is_verified ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {alert.is_verified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
                    </span>
                    
                    {/* Alert Status Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isPending ? 'bg-red-600 text-white' : 
                      isOngoing ? 'bg-yellow-600 text-white' : 
                      'bg-gray-600 text-white'
                    }`}>
                      {alert.status}
                    </span>
                    
                    {/* Severity Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      alert.severity === 'critical' ? 'bg-red-600 text-white' : 
                      alert.severity === 'high' ? 'bg-orange-500 text-white' : 
                      alert.severity === 'medium' ? 'bg-yellow-500 text-white' : 
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity ? alert.severity.toUpperCase() : 'MEDIUM'}
                    </span>
                  </div>
                  
                  {/* Responder Info */}
                  {alert.responder_name && (
                    <div className="text-xs text-gray-700 mb-2">
                      <span className="font-medium">👤 Responder:</span> {alert.responder_name}
                    </div>
                  )}
                  
                  {/* En Route Info */}
                  {alert.status === 'Ongoing' && alert.eta && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-900">🚑 En Route</span>
                        <span className="text-blue-700 font-bold">ETA: {alert.eta} min</span>
                      </div>
                      {alert.distance && (
                        <div className="text-xs text-blue-700 mt-1">
                          📍 {alert.distance} {alert.responder_speed && `• ⚡ ${alert.responder_speed} km/h`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Locate Button */}
                <button
                  onClick={() => {
                    // Validate coordinates before viewing - explicit null check first
                    if (alert.coords === null || 
                        alert.coords === undefined ||
                        !Array.isArray(alert.coords) || 
                        alert.coords.length !== 2) {
                      console.warn('Cannot view alert - missing or invalid coords structure:', {
                        id: alert.id,
                        coords: alert.coords
                      });
                      window.alert('Cannot view on map: This alert has invalid location coordinates.');
                      return;
                    }
                    
                    const [lat, lng] = alert.coords;
                    if (typeof lat !== 'number' ||
                        typeof lng !== 'number' ||
                        isNaN(lat) || 
                        isNaN(lng) ||
                        !isFinite(lat) ||
                        !isFinite(lng)) {
                      console.warn('Cannot view alert - invalid coordinate values:', {
                        id: alert.id,
                        lat,
                        lng
                      });
                      window.alert('Cannot view on map: This alert has invalid location coordinates.');
                      return;
                    }
                    
                    console.log('Navigate to alert:', alert.id, 'coords:', alert.coords);
                    onView(alert.id);
                  }}
                  disabled={
                    alert.coords === null ||
                    alert.coords === undefined ||
                    !Array.isArray(alert.coords) || 
                    alert.coords.length !== 2 ||
                    typeof alert.coords[0] !== 'number' ||
                    typeof alert.coords[1] !== 'number' ||
                    isNaN(alert.coords[0]) || 
                    isNaN(alert.coords[1]) ||
                    !isFinite(alert.coords[0]) ||
                    !isFinite(alert.coords[1])
                  }
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                    alert.coords !== null &&
                    alert.coords !== undefined &&
                    Array.isArray(alert.coords) && 
                    alert.coords.length === 2 &&
                    typeof alert.coords[0] === 'number' &&
                    typeof alert.coords[1] === 'number' &&
                    !isNaN(alert.coords[0]) && 
                    !isNaN(alert.coords[1]) &&
                    isFinite(alert.coords[0]) &&
                    isFinite(alert.coords[1])
                      ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    alert.coords !== null &&
                    alert.coords !== undefined &&
                    Array.isArray(alert.coords) && 
                    alert.coords.length === 2 &&
                    !isNaN(alert.coords[0]) && 
                    !isNaN(alert.coords[1])
                      ? "Fly to location on map"
                      : "Invalid coordinates"
                  }
                >
                  <FiNavigation className="text-sm" />
                  <span>Locate</span>
                </button>
              </div>

            </div>
            );
          })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">No Verified alerts</p>
            <p className="text-gray-400 text-sm">All incidents have been handled</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="entriesPerPage" className="font-medium">Show:</label>
          <select
            id="entriesPerPage"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ‹ Prev
          </button>
          <div className="flex items-center px-3 text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}