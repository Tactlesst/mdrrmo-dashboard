'use client';
import { useEffect, useMemo, useState } from 'react';
import AlertMap from './AlertsMap';
import AlertList from './AlertList';
import VerifyIncidents from './VerifyIncidents';

export default function Alerts({ verifyIncidentsRefreshRef }) {
  const fallbackCenter = [8.743412346817417, 124.77629163417616];
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Clear selectedAlertId if the alert no longer exists
  useEffect(() => {
    if (selectedAlertId) {
      const alertExists = alerts.some(alert => alert.id === selectedAlertId);
      if (!alertExists) {
        console.log('Selected alert no longer exists, clearing selectedAlertId:', selectedAlertId);
        setSelectedAlertId(null);
      }
    }
  }, [alerts, selectedAlertId]);

  // Fetch data function - extracted so it can be called on demand
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Alerts for AlertList - only verified alerts
  const verifiedAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      const dateA = new Date(a.occurred_at);
      const dateB = new Date(b.occurred_at);
      return dateB - dateA; // Descending order (newest first)
    });

    // Filter: Only show VERIFIED alerts, exclude "Responded", "Referred", and "Rejected"
    return sorted
      .filter((alert) => {
        const status = (alert.status || '').trim();
        return alert.is_verified === true && 
               status !== 'Responded' && 
               status !== 'Referred' &&
               status !== 'Rejected';
      })
      .map((a) => {
        // Parse and validate coordinates
        const lat = parseFloat(a.lat);
        const lng = parseFloat(a.lng);
        
        // Only include valid coordinates
        const hasValidCoords = 
          !isNaN(lat) && 
          !isNaN(lng) && 
          isFinite(lat) && 
          isFinite(lng) &&
          lat >= -90 && 
          lat <= 90 && 
          lng >= -180 && 
          lng <= 180;
        
        return {
          id: a.id,
          resident_name: a.resident_name || 'Unknown User',
          responder_name: a.responder_name || 'Not Assigned',
          address: a.address || '—',
          type: a.type || '—',
          status: a.status || 'Not Responded',
          severity: a.severity || 'medium',
          occurred_at: a.occurred_at,
          responded_at: a.responded_at,
          date: a.occurred_at ? a.occurred_at.slice(0, 10) : null,
          coords: hasValidCoords ? [lat, lng] : null, // Set to null if invalid
          user: a.responder_name || 'Unassigned',
          description: a.description || '',
          eta: a.eta,
          distance: a.distance,
          responder_speed: a.responder_speed,
          route_started_at: a.route_started_at,
          estimated_arrival: a.estimated_arrival,
          is_verified: a.is_verified, // Include verification status
          contact: a.contact, // Include contact number
        };
      });
  }, [alerts]);

  // Alerts for Map - ALL alerts (verified and unverified), exclude only "Responded", "Referred", and "Rejected"
  const mapAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      // First priority: Verified alerts come before unverified
      if (a.is_verified && !b.is_verified) return -1;
      if (!a.is_verified && b.is_verified) return 1;
      
      // Second priority: Within same verification status, sort by time (newest first)
      const dateA = new Date(a.occurred_at);
      const dateB = new Date(b.occurred_at);
      return dateB - dateA;
    });

    return sorted
      .filter((alert) => {
        const status = (alert.status || '').trim();
        return status !== 'Responded' && 
               status !== 'Referred' && 
               status !== 'Rejected';
      })
      .map((a) => {
        const lat = parseFloat(a.lat);
        const lng = parseFloat(a.lng);
        
        const hasValidCoords = 
          !isNaN(lat) && 
          !isNaN(lng) && 
          isFinite(lat) && 
          isFinite(lng) &&
          lat >= -90 && 
          lat <= 90 && 
          lng >= -180 && 
          lng <= 180;
        
        return {
          id: a.id,
          resident_name: a.resident_name || 'Unknown User',
          responder_name: a.responder_name || 'Not Assigned',
          address: a.address || '—',
          type: a.type || '—',
          status: a.status || 'Not Responded',
          severity: a.severity || 'medium',
          occurred_at: a.occurred_at,
          responded_at: a.responded_at,
          date: a.occurred_at ? a.occurred_at.slice(0, 10) : null,
          coords: hasValidCoords ? [lat, lng] : null,
          user: a.responder_name || 'Unassigned',
          description: a.description || '',
          eta: a.eta,
          distance: a.distance,
          responder_speed: a.responder_speed,
          route_started_at: a.route_started_at,
          estimated_arrival: a.estimated_arrival,
          is_verified: a.is_verified,
          contact: a.contact, // Include contact number
        };
      });
  }, [alerts]);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAlerts = verifiedAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(verifiedAlerts.length / entriesPerPage));

  // Update severity without full page reload
  const handleSeverityUpdate = (alertId, newSeverity) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, severity: newSeverity } : alert
      )
    );
  };

  return (
    <div className="flex flex-col bg-gray-100 font-serif h-full overflow-hidden">
      {/* Mobile/Tablet: Stacked Layout */}
      <div className="flex flex-col xl:hidden h-full gap-4 p-4 overflow-hidden">
        {/* Verify Incidents - Top on mobile */}
        <div className="flex-shrink-0 max-h-[300px] overflow-auto">
          <VerifyIncidents 
            onView={(id) => {
              console.log('Alerts.js: Setting selectedAlertId from VerifyIncidents to:', id);
              setSelectedAlertId(id);
            }}
            onVerified={() => {
              console.log('Alert verified, refreshing data...');
              fetchData();
            }}
            refreshRef={verifyIncidentsRefreshRef}
          />
        </div>
        
        {/* Map and Alert List - Bottom on mobile */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden min-h-0">
            <div className="px-4 pt-4 pb-2 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Incident Map</h2>
            </div>
            <div className="h-[calc(100%-60px)] w-full">
              <AlertMap
                alerts={mapAlerts}
                fallbackCenter={fallbackCenter}
                selectedAlertId={selectedAlertId}
                onSeverityUpdate={handleSeverityUpdate}
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
      </div>

      {/* Desktop: Three Column Layout */}
      <div className="hidden xl:flex flex-row h-full gap-4 p-4 overflow-hidden">
        {/* Left Side - Verify Incidents */}
        <div className="w-96 flex-shrink-0 overflow-auto">
          <VerifyIncidents 
            onView={(id) => {
              console.log('Alerts.js: Setting selectedAlertId from VerifyIncidents to:', id);
              setSelectedAlertId(id);
            }}
            onVerified={() => {
              console.log('Alert verified, refreshing data...');
              fetchData();
            }}
            refreshRef={verifyIncidentsRefreshRef}
          />
        </div>

        {/* Middle - Incident Map */}
        <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden min-w-[400px]">
          <div className="px-4 pt-4 pb-2 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Incident Map</h2>
          </div>
          <div className="h-[calc(100%-60px)] w-full">
            <AlertMap
              alerts={mapAlerts}
              fallbackCenter={fallbackCenter}
              selectedAlertId={selectedAlertId}
              onSeverityUpdate={handleSeverityUpdate}
            />
          </div>
        </div>

        {/* Right Side - Alert List */}
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
    </div>
  );
}