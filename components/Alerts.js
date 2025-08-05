'use client';
import { useEffect, useMemo, useState } from 'react';
import AlertMap from './AlertsMap';
import AlertList from './AlertList';

export default function Alerts() {
const fallbackCenter = [8.743412346817417, 124.77629163417616];
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

const normalizedAlerts = useMemo(() => {
  const sorted = [...alerts].sort((a, b) => {
    const dateA = new Date(a.occurred_at);
    const dateB = new Date(b.occurred_at);
    return dateB - dateA; // Descending order (newest first)
  });

  return sorted.map((a) => ({
    id: a.id,
    resident_name: a.resident_name || 'Unknown User',
    responder_name: a.responder_name || 'Not Assigned',
    address: a.address || '—',
    type: a.type || '—',
    status: a.status || 'Not Responded',
    occurred_at: a.occurred_at,
    responded_at: a.responded_at,
    date: a.occurred_at ? a.occurred_at.slice(0, 10) : null,
    coords: [a.lat, a.lng],
    user: a.responder_name || 'Unassigned',
    description: a.description || '',
  }));
}, [alerts]);




  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAlerts = normalizedAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(normalizedAlerts.length / entriesPerPage));

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 font-serif h-[40vh] md:h-[70vh]">
      <div className="flex-1 bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">Incident Map</h2>
        <AlertMap
          alerts={normalizedAlerts}
          fallbackCenter={fallbackCenter}
          selectedAlertId={selectedAlertId}
          
        />
      </div>

      <AlertList
        alerts={currentAlerts}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        totalPages={totalPages}
        onView={(id) => setSelectedAlertId(id)}
      />
    </div>
  );
}
