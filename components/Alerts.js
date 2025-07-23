import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

export default function Alerts() {
  const initialPosition = [8.8167, 124.8155];

  const allAlerts = [
    { id: 1, user: 'Razel Del Puerto', address: 'Brgy. 1 Balingasag', type: 'Car collision', status: 'Not Responded', date: '—', coords: [8.8167, 124.8155] },
    { id: 2, user: 'Marian Cortez', address: 'Zone 5, Cugman', type: 'Fire', status: 'Responded', date: '2025-07-02', coords: [8.8200, 124.8200] },
    { id: 3, user: 'Jason De Mesa', address: 'Aplaya, Davao City', type: 'Flood', status: 'Not Responded', date: '2025-07-03', coords: [8.8150, 124.8100] },
    { id: 4, user: 'Lourdes Tan', address: 'Bunawan, Agusan', type: 'Car collision', status: 'Responded', date: '2025-07-01', coords: [8.8180, 124.8180] },
    { id: 5, user: 'Arvin Santos', address: 'Claveria, Misamis Oriental', type: 'Fire', status: 'Not Responded', date: '2025-07-04', coords: [8.8130, 124.8120] },
    { id: 6, user: 'Benito Locsin', address: 'Kauswagan, Cagayan de Oro', type: 'Medical Emergency', status: 'Responded', date: '2025-07-05', coords: [8.4770, 124.6300] },
    { id: 7, user: 'Clara Dela Cruz', address: 'Patag, Cagayan de Oro', type: 'Robbery', status: 'Not Responded', date: '2025-07-06', coords: [8.4800, 124.6250] },
  ];

  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [alertTypeFilter, setAlertTypeFilter] = useState('All Alert Types');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesUser = userFilter ? alert.user.toLowerCase().includes(userFilter.toLowerCase()) : true;
    const matchesStatus = statusFilter === 'All Statuses' ? true : alert.status === statusFilter;
    const matchesType = alertTypeFilter === 'All Alert Types' ? true : alert.type === alertTypeFilter;
    const matchesDate = dateFilter ? alert.date === dateFilter : true;
    return matchesUser && matchesStatus && matchesType && matchesDate;
  });

  const indexOfLastAlert = currentPage * entriesPerPage;
  const indexOfFirstAlert = indexOfLastAlert - entriesPerPage;
  const currentAlerts = filteredAlerts.slice(indexOfFirstAlert, indexOfLastAlert);
  const totalPages = Math.ceil(filteredAlerts.length / entriesPerPage);

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 font-serif">
      {/* Map Section */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-5">Incident Map</h2>
        <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
          <MapContainer center={initialPosition} zoom={13} className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredAlerts.map((alert) => (
              <Marker key={alert.id} position={alert.coords}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{alert.user}</p>
                    <p className="text-sm text-gray-700">Address: {alert.address}</p>
                    <p className="text-sm text-gray-700">Type: {alert.type}</p>
                    <p className="text-sm text-gray-700">Status: {alert.status}</p>
                    <p className="text-sm text-gray-700">Date: {alert.date}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Scrollable Sidebar Section */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[calc(100vh-6rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">Alert Management</h1>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md text-sm">
            + Add Alert
          </button>
        </div>

        {/* Filter Toggle */}
        <div className="mb-2">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Filter by user"
              className="border px-3 py-2 rounded-md text-sm"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
            <select
              className="border px-3 py-2 rounded-md text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Responded</option>
              <option>Not Responded</option>
            </select>
            <select
              className="border px-3 py-2 rounded-md text-sm"
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
            >
              <option>All Alert Types</option>
              {[...new Set(allAlerts.map(a => a.type))].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <input
              type="date"
              className="border px-3 py-2 rounded-md text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        )}

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          {currentAlerts.length > 0 ? (
            currentAlerts.map((alert) => (
              <div key={alert.id} className="bg-gray-50 p-3 rounded-md mb-2 shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{alert.user}</p>
                    <p className="text-xs text-gray-600">{alert.address}</p>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <FiEye className="hover:text-blue-500 cursor-pointer" />
                    <FiEdit2 className="hover:text-green-500 cursor-pointer" />
                    <FiTrash2 className="hover:text-red-500 cursor-pointer" />
                  </div>
                </div>
                <div className="text-xs mt-1">
                  <p>Type: {alert.type}</p>
                  <p>
                    Status:{' '}
                    <span className={`font-semibold ${alert.status === 'Responded' ? 'text-green-600' : 'text-red-600'}`}>
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
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="flex gap-1 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border rounded-md bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
