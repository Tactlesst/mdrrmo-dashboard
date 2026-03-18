'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { FiX } from 'react-icons/fi';
import AlertMap from './AlertsMap';
import AlertList from './AlertList';
import VerifyIncidents from './VerifyIncidents';
import { swrJsonFetcher } from '@/lib/swrFetcher';

export default function Alerts({ verifyIncidentsRefreshRef }) {
  const fallbackCenter = [8.743412346817417, 124.77629163417616];
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const seenUnverifiedAlertIdsRef = useRef(new Set());
  const hasBootstrappedUnverifiedRef = useRef(false);
  const [unverifiedAlertModal, setUnverifiedAlertModal] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const audioRef = useRef(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;

    if (!soundEnabled && audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [soundEnabled]);

  useEffect(() => {
    audioRef.current = new Audio('/alarm.mp3.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.loop = true;
    audioRef.current.muted = false;

    const enableAudio = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    };
    document.addEventListener('click', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {
        // ignore
      }
    };
  }, []);

  function mergeResponderData(fetchedAlerts, fetchedResponders) {
    return (fetchedAlerts || []).map((alert) => {
      const responder = (fetchedResponders || []).find((r) => r.assignment?.alertId === alert.id);
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
  }

  const wsEnabled = Boolean(process.env.NEXT_PUBLIC_WS_BASE_URL);

  const {
    data: alertsData,
    isLoading: isAlertsLoading,
    mutate: mutateAlerts,
  } = useSWR('/api/alerts', swrJsonFetcher, {
    refreshInterval: wsEnabled ? 0 : 30000,
    revalidateOnFocus: true,
  });

  const {
    data: respondersData,
    isLoading: isRespondersLoading,
    mutate: mutateResponders,
  } = useSWR('/api/responders/tracking', swrJsonFetcher, {
    refreshInterval: wsEnabled ? 0 : 30000,
    revalidateOnFocus: true,
  });

  const alerts = useMemo(() => {
    const fetchedAlerts = alertsData?.alerts || [];
    const fetchedResponders = respondersData?.responders || [];
    return mergeResponderData(fetchedAlerts, fetchedResponders);
  }, [alertsData, respondersData]);

  const loading = isAlertsLoading || isRespondersLoading;

  useEffect(() => {
    if (loading) return;
    if (!Array.isArray(alerts) || alerts.length === 0) return;

    const unverified = alerts
      .filter((a) => a && a.is_verified === false)
      .filter((a) => {
        const status = (a.status || '').trim().toLowerCase();
        return status !== 'responded' && status !== 'referred' && status !== 'rejected';
      })
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

    if (!hasBootstrappedUnverifiedRef.current) {
      for (const a of unverified) {
        if (a?.id) seenUnverifiedAlertIdsRef.current.add(a.id);
      }
      hasBootstrappedUnverifiedRef.current = true;
      return;
    }

    const newlyArrived = unverified.find((a) => a?.id && !seenUnverifiedAlertIdsRef.current.has(a.id));
    if (!newlyArrived) return;

    seenUnverifiedAlertIdsRef.current.add(newlyArrived.id);

    setUnverifiedAlertModal(newlyArrived);
    if (soundEnabledRef.current && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [alerts, loading]);

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

  useEffect(() => {
    if (!wsEnabled) return;

    const httpBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const wsBase = httpBase
      .replace(/^https:\/\//i, 'wss://')
      .replace(/^http:\/\//i, 'ws://')
      .replace(/\/+$/, '');

    const url = `${wsBase}/ws/notifications?channel=all`;
    const ws = new WebSocket(url);
    let timer = null;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'tracking') {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            mutateResponders();
          }, 250);
        }
        if (msg?.type === 'notification') {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            mutateAlerts();
          }, 250);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      if (timer) clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [wsEnabled, mutateAlerts, mutateResponders]);

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
    mutateAlerts();
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
              mutateAlerts();
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
              mutateAlerts();
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

      {unverifiedAlertModal && (
        <div className="fixed bottom-4 right-4 z-[70] w-80 animate-slideIn">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-yellow-500 overflow-hidden animate-shake">
            <style jsx>{`
              @keyframes slideIn {
                from { 
                  transform: translateX(400px);
                  opacity: 0;
                }
                to { 
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                20%, 40%, 60%, 80% { transform: translateX(3px); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes glow {
                0%, 100% { box-shadow: 0 0 15px rgba(234, 179, 8, 0.35); }
                50% { box-shadow: 0 0 25px rgba(234, 179, 8, 0.6); }
              }
              .animate-slideIn {
                animation: slideIn 0.4s ease-out;
              }
              .animate-shake {
                animation: shake 0.5s ease-in-out, glow 2s ease-in-out infinite;
              }
              .animate-pulse-alert {
                animation: pulse 1.5s ease-in-out infinite;
              }
            `}</style>

            <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-white px-2.5 py-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 animate-pulse-alert opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-pulse-alert">
                    <span className="text-sm">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">Unverified Alert</h3>
                    <p className="text-[10px] text-yellow-100">New incident received</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSoundEnabled((v) => !v)}
                    className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full"
                    title={`Sound ${soundEnabled ? 'ON' : 'OFF'}`}
                  >
                    <span className={`text-xs ${soundEnabled ? 'animate-pulse-alert' : ''}`}>{soundEnabled ? '🔊' : '🔇'}</span>
                  </button>

                  <button
                    onClick={() => {
                      try {
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                      } catch {
                        // ignore
                      }
                      setUnverifiedAlertModal(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors text-xs px-2 py-1 bg-white/20 rounded"
                    title="Dismiss"
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() => {
                      try {
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                      } catch {
                        // ignore
                      }
                      setUnverifiedAlertModal(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Close"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 max-h-[300px] overflow-y-auto">
              <div className="bg-yellow-50 border-l-2 border-yellow-500 p-2 mb-2 rounded">
                <p className="text-xs font-medium text-yellow-900 line-clamp-2">{unverifiedAlertModal.type || 'Emergency Alert'}</p>
                <p className="text-[10px] text-yellow-700 mt-0.5">From: {unverifiedAlertModal.resident_name || 'Unknown User'}</p>
                <p className="text-[10px] text-yellow-600 mt-0.5">{unverifiedAlertModal.address || '—'}</p>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSelectedAlertId(unverifiedAlertModal.id);
                    try {
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                      }
                    } catch {
                      // ignore
                    }
                    setUnverifiedAlertModal(null);
                  }}
                  className="w-full px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs shadow animate-pulse-alert"
                >
                  <span className="text-sm">🗺️</span> VIEW ON MAP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}