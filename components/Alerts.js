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
    const fetchData = async () => {
      try {
        const alertsRes = await fetch('/api/alerts');
        const alertsData = await alertsRes.json();
        const fetchedAlerts = alertsData.alerts || [];
        
        const respondersRes = await fetch('/api/responders/tracking');
        const respondersData = await respondersRes.json();
        const fetchedResponders = respondersData.responders || [];
        
        const alertsWithResponderData = fetchedAlerts.map(alert => {
          const responder = fetchedResponders.find(r => r.assignment?.alertId === alert.id);
          if (responder && responder.location) {
            return {
              ...alert,
              eta: responder.location.eta,
              distance: responder.location.distance,
              responder_speed: responder.location.speed ? (responder.location.speed * 3.6).toFixed(1) : null,
              route_started_at: responder.assignment?.routeStartedAt,
              estimated_arrival: responder.estimatedArrival,
            };
          }
          return alert;
        });
        
        setAlerts(alertsWithResponderData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const normalizedAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      const dateA = new Date(a.occurred_at);
      const dateB = new Date(b.occurred_at);
      return dateB - dateA; // Descending order (newest first)
    });

    // Filter out "Responded" alerts
    return sorted
      .filter((alert) => alert.status !== 'Responded')
      .map((a) => ({
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
        description: a.description || '', // Added description field
      }));
  }, [alerts]);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAlerts = normalizedAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(normalizedAlerts.length / entriesPerPage));

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 font-serif h-[40vh] md:h-[70vh]">
      <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <h2 className="text-xl font-bold">Incident Map</h2>
        </div>
        <div className="h-[calc(100%-3rem)]">
          <AlertMap
            alerts={normalizedAlerts}
            fallbackCenter={fallbackCenter}
            selectedAlertId={selectedAlertId}
          />
        </div>
      </div>

      <AlertList
        alerts={currentAlerts}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        totalPages={totalPages}
        onView={(id) => {
          console.log('Alerts.js: Setting selectedAlertId to:', id);
          setSelectedAlertId(id);
        }}
      />
    </div>
  );
}