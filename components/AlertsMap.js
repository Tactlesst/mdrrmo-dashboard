'use client';
import React, { useEffect, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';

// Lazy load Leaflet components to improve LCP
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Leaflet icon configuration will be loaded dynamically

// Validate if coordinates are valid numbers
const isValidCoordinate = (coord) => {
  return coord !== null && 
         coord !== undefined && 
         typeof coord === 'number' && 
         !isNaN(coord) && 
         isFinite(coord);
};

// Validate if an alert has valid coordinates
const hasValidCoords = (alert) => {
  if (!alert || !alert.coords || !Array.isArray(alert.coords) || alert.coords.length !== 2) {
    return false;
  }
  const [lat, lng] = alert.coords;
  return isValidCoordinate(lat) && 
         isValidCoordinate(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Calculate distance between two coordinates in meters using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Cluster alerts that are within 100 meters of each other
const clusterAlerts = (alerts, maxDistance = 100) => {
  const clusters = [];
  const processed = new Set();

  alerts.forEach((alert, index) => {
    if (processed.has(index)) return;

    const cluster = {
      alerts: [alert],
      center: alert.coords,
      indices: [index],
    };

    // Find nearby alerts
    alerts.forEach((otherAlert, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      // Check for exact coordinate match first
      const isSameLocation = 
        alert.coords[0] === otherAlert.coords[0] && 
        alert.coords[1] === otherAlert.coords[1];

      // Calculate distance if not exact match
      const distance = isSameLocation ? 0 : calculateDistance(
        alert.coords[0],
        alert.coords[1],
        otherAlert.coords[0],
        otherAlert.coords[1]
      );

      if (isSameLocation || distance <= maxDistance) {
        cluster.alerts.push(otherAlert);
        cluster.indices.push(otherIndex);
        processed.add(otherIndex);
      }
    });

    // Calculate center point for clusters with multiple alerts
    if (cluster.alerts.length > 1) {
      // Filter out any alerts with invalid coords before calculating center
      const validAlertsInCluster = cluster.alerts.filter(a => 
        a.coords && 
        Array.isArray(a.coords) && 
        a.coords.length === 2 &&
        typeof a.coords[0] === 'number' &&
        typeof a.coords[1] === 'number' &&
        !isNaN(a.coords[0]) && 
        !isNaN(a.coords[1]) &&
        isFinite(a.coords[0]) &&
        isFinite(a.coords[1])
      );
      
      if (validAlertsInCluster.length > 0) {
        const avgLat = validAlertsInCluster.reduce((sum, a) => sum + a.coords[0], 0) / validAlertsInCluster.length;
        const avgLng = validAlertsInCluster.reduce((sum, a) => sum + a.coords[1], 0) / validAlertsInCluster.length;
        
        // Final validation of calculated center
        if (!isNaN(avgLat) && !isNaN(avgLng) && isFinite(avgLat) && isFinite(avgLng)) {
          cluster.center = [avgLat, avgLng];
        }
      }
    }

    processed.add(index);
    clusters.push(cluster);
  });

  return clusters;
};

// Create cluster icon
const createClusterIcon = (count, L) => {
  if (!L) return null;
  
  const size = count > 10 ? 50 : count > 5 ? 45 : 40;
  const color = count > 10 ? '#DC2626' : count > 5 ? '#EA580C' : '#F59E0B';
  
  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-weight: bold;
        color: white;
        font-size: ${count > 99 ? '12px' : '16px'};
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const createCustomIcon = (type, status, L) => {
  if (!L) return null;
  const normalizedType = type ? type.toLowerCase() : '';
  const iconUrls = {
    'car accident': 'https://images.icon-icons.com/3196/PNG/512/car_crash_icon_194614.png',
    'rear_end': 'https://images.icon-icons.com/3375/PNG/512/crash_car_icon_211807.png',
    'sideswipe': 'https://images.icon-icons.com/494/PNG/512/car_icon-icons.com_48342.png',
    'car crash': 'https://images.icon-icons.com/3196/PNG/512/car_crash_icon_194614.png',
  };
  const baseIconUrl = iconUrls[normalizedType] || iconUrls['car accident'];

  // Adjust icon size and color based on status
  let iconSize = [38, 38];
  let iconAnchor = [19, 38];
  let popupAnchor = [0, -38];
  let shadowSize = [41, 41];

  if (status === 'Not Responded') {
    // Red tint for Not Responded
    return new L.Icon({
      iconUrl: baseIconUrl,
      iconRetinaUrl: baseIconUrl,
      iconSize,
      iconAnchor,
      popupAnchor,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize,
      className: 'tint-red',
    });
  } else if (status === 'Ongoing' || status === 'In Progress' || status === 'Pending') {
    // Orange tint for Ongoing
    return new L.Icon({
      iconUrl: baseIconUrl,
      iconRetinaUrl: baseIconUrl,
      iconSize,
      iconAnchor,
      popupAnchor,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize,
      className: 'tint-orange',
    });
  }

  // Default case (should not reach here due to filter, but included for safety)
  return new L.Icon({
    iconUrl: baseIconUrl,
    iconRetinaUrl: baseIconUrl,
    iconSize,
    iconAnchor,
    popupAnchor,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize,
  });
};

const createResponderIcon = (isActive, heading, L) => {
  if (!L) return null;
  const color = isActive ? '#059669' : '#6B7280';
  const bgColor = isActive ? '#D1FAE5' : '#E5E7EB';
  const rotation = heading || 0;
  
  return L.divIcon({
    className: 'custom-responder-marker',
    html: `
      <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease;">
        <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <!-- Background circle -->
          <circle cx="12" cy="12" r="11" fill="${bgColor}" stroke="${color}" stroke-width="2"/>
          <!-- Ambulance/Emergency vehicle icon -->
          <g transform="translate(12, 12)">
            <!-- Vehicle body -->
            <rect x="-6" y="-4" width="12" height="6" rx="1" fill="${color}"/>
            <!-- Cross symbol -->
            <rect x="-1" y="-3" width="2" height="4" fill="white"/>
            <rect x="-2.5" y="-1.5" width="5" height="1" fill="white"/>
            <!-- Direction indicator (arrow) -->
            <path d="M 0,-6 L 2,-4 L -2,-4 Z" fill="${color}"/>
          </g>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

function MapResizer({ watch }) {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        if (map && map.invalidateSize) {
          map.invalidateSize();
        }
      } catch (error) {
        // Silently catch errors when navigating away quickly
        console.debug('Map resize skipped - component unmounting');
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [watch, map]);

  return null;
}

function FlyToAndOpenPopup({ alerts, selectedAlertId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedAlertId || !map) {
      return;
    }

    const alert = alerts.find((a) => a.id === selectedAlertId);
    
    if (!alert) {
      console.warn('Alert not found:', selectedAlertId);
      return;
    }

    // Comprehensive coordinate validation
    if (!alert.coords || !Array.isArray(alert.coords) || alert.coords.length !== 2) {
      console.warn('Alert has invalid coords structure:', alert.coords);
      return;
    }

    const [lat, lng] = alert.coords;
    
    // Check every possible way coordinates could be invalid
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      console.warn('Coordinates are null or undefined');
      return;
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn('Coordinates are not numbers:', { lat: typeof lat, lng: typeof lng });
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Coordinates are NaN:', { lat, lng });
      return;
    }

    if (!isFinite(lat) || !isFinite(lng)) {
      console.warn('Coordinates are not finite:', { lat, lng });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Coordinates out of valid range:', { lat, lng });
      return;
    }

    try {
      // Use setView instead of flyTo to avoid animation issues
      map.setView([lat, lng], 18);
      
      // Check if this alert is part of a cluster
      const validAlerts = alerts.filter(a => a.coords !== null && hasValidCoords(a));
      const clusters = clusterAlerts(validAlerts, 100);
      
      // Find if the selected alert is in a cluster
      const cluster = clusters.find(c => c.alerts.some(a => a.id === selectedAlertId));
      
      setTimeout(() => {
        if (cluster && cluster.alerts.length > 1) {
          // Alert is in a cluster - open cluster popup
          const clusterRefKey = `cluster-${cluster.alerts[0].id}`;
          const clusterRef = markerRefs.current[clusterRefKey];
          if (clusterRef && clusterRef.current) {
            try {
              // Try different methods to open the popup
              if (typeof clusterRef.current.openPopup === 'function') {
                clusterRef.current.openPopup();
              } else if (clusterRef.current._popup) {
                clusterRef.current._popup.openOn(map);
              }
            } catch (err) {
              console.warn('Could not open cluster popup:', err);
            }
          }
        } else {
          // Single alert - open individual marker popup
          const markerRef = markerRefs.current[selectedAlertId];
          if (markerRef && markerRef.current) {
            try {
              if (typeof markerRef.current.openPopup === 'function') {
                markerRef.current.openPopup();
              } else if (markerRef.current._popup) {
                markerRef.current._popup.openOn(map);
              }
            } catch (err) {
              console.warn('Could not open marker popup:', err);
            }
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error navigating to alert:', error);
    }
  }, [selectedAlertId, alerts, map, markerRefs]);

  return null;
}

export default function AlertsMap({ alerts, fallbackCenter, selectedAlertId, onSeverityUpdate }) {
  const markerRefs = useRef({});
  const [leafletReady, setLeafletReady] = useState(false);
  const [L, setL] = useState(null);
  const isMountedRef = useRef(true);
  const [responders, setResponders] = useState([]);

  // Filter alerts with valid coordinates and use the first valid one, or fallback
  const validAlerts = alerts.filter(alert => alert.coords !== null && hasValidCoords(alert));
  const mapCenter = validAlerts.length > 0 ? validAlerts[0].coords : fallbackCenter;

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch responder locations (all responders, not filtered by alert)
  useEffect(() => {
    const wsEnabled = Boolean(process.env.NEXT_PUBLIC_WS_BASE_URL);

    const fetchResponders = async () => {
      try {
        const res = await fetch('/api/responders/tracking');
        const data = await res.json();
        
        if (isMountedRef.current && data.success) {
          setResponders(data.responders || []);
        }
      } catch (err) {
        console.error('Error fetching responder locations:', err);
      }
    };

    fetchResponders();

    if (!wsEnabled) {
      const interval = setInterval(fetchResponders, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }

    const httpBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const wsBase = httpBase
      .replace(/^https:\/\//i, 'wss://')
      .replace(/^http:\/\//i, 'ws://')
      .replace(/\/$/, '');

    const url = `${wsBase}/ws/notifications?channel=all`;
    const ws = new WebSocket(url);
    let timer = null;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'tracking') {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            fetchResponders();
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
  }, []); // No dependencies - just fetch all responders periodically

  // Lazy load Leaflet CSS and configure icons
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
    import('leaflet').then((LeafletModule) => {
      if (!isMountedRef.current) return; // Don't update if unmounted
      
      try {
        const LeafletLib = LeafletModule.default;
        delete LeafletLib.Icon.Default.prototype._getIconUrl;
        LeafletLib.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        setL(LeafletLib);
        setLeafletReady(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    }).catch((error) => {
      console.error('Failed to load Leaflet module:', error);
    });
  }, []);

  // Add CSS for tinting icons and custom popup styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Ensure map container has proper height */
      .leaflet-container {
        height: 100% !important;
        width: 100% !important;
        z-index: 0;
      }
      
      .tint-red { filter: hue-rotate(0deg) brightness(0.8) sepia(0.5); }
      .tint-orange { filter: hue-rotate(40deg) brightness(0.9) sepia(0.5); }
      
      /* Responder Marker Styles */
      .custom-responder-marker {
        background: transparent !important;
        border: none !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .custom-responder-marker svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
      
      /* Modern Popup Styles */
      .leaflet-popup-content-wrapper {
        border-radius: 12px !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        padding: 0 !important;
        overflow: hidden;
      }
      
      .leaflet-popup-content {
        margin: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .leaflet-popup-tip {
        box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1) !important;
      }
      
      .custom-popup .leaflet-popup-close-button {
        color: #6B7280 !important;
        font-size: 24px !important;
        padding: 8px 12px !important;
        transition: all 0.2s ease;
      }
      
      .custom-popup .leaflet-popup-close-button:hover {
        color: #EF4444 !important;
        background-color: #FEE2E2 !important;
        border-radius: 6px;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (!leafletReady || !L) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Suspense fallback={
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      }>
        <MapContainer 
          center={mapCenter} 
          zoom={17} 
          className="w-full h-full"
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Cluster alerts within 100 meters */}
          {clusterAlerts(alerts.filter(alert => alert.coords !== null && hasValidCoords(alert)), 100)
            .filter(cluster => {
              // Ensure cluster has a valid center before rendering
              if (!cluster.center || !Array.isArray(cluster.center) || cluster.center.length !== 2) {
                return false;
              }
              const [lat, lng] = cluster.center;
              return typeof lat === 'number' && typeof lng === 'number' && 
                     !isNaN(lat) && !isNaN(lng) && 
                     isFinite(lat) && isFinite(lng);
            })
            .map((cluster, clusterIndex) => {
            const isCluster = cluster.alerts.length > 1;
            
            if (isCluster) {
              // Render cluster marker
              const clusterIcon = createClusterIcon(cluster.alerts.length, L);
              
              // Store cluster marker ref using the first alert's ID as reference
              const clusterRefKey = `cluster-${cluster.alerts[0].id}`;
              if (!markerRefs.current[clusterRefKey]) {
                markerRefs.current[clusterRefKey] = React.createRef();
              }
              
              return (
                <Marker
                  key={`cluster-${clusterIndex}`}
                  position={cluster.center}
                  icon={clusterIcon}
                  ref={markerRefs.current[clusterRefKey]}
                >
                  <Popup maxWidth={320} className="custom-popup">
                    <div className="p-0">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <h3 className="font-bold text-gray-800 text-base">
                          {cluster.alerts.length} Incidents in This Area
                        </h3>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto space-y-3">
                        {cluster.alerts.map((alert) => (
                          <div key={alert.id} className="p-3 bg-white rounded-lg border border-gray-300 shadow-sm">
                            {/* Alert Type and Badges */}
                            <div className="mb-2">
                              <h4 className="font-semibold text-sm text-gray-900 mb-1.5 flex items-center gap-1.5">
                                {alert.type || 'Alert'}
                                {/* NEW badge for alerts created within last 5 minutes */}
                                {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
                                  <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </h4>
                              <div className="flex gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  alert.status === 'Not Responded' ? 'bg-red-500 text-white' : 
                                  alert.status === 'Pending' ? 'bg-yellow-400 text-gray-900' :
                                  alert.status === 'Ongoing' || alert.status === 'In Progress' ? 'bg-yellow-400 text-gray-900' : 
                                  'bg-green-500 text-white'
                                }`}>
                                  {alert.status || 'Unknown'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  alert.is_verified ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                                }`}>
                                  {alert.is_verified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Priority Dropdown */}
                            <div className="mb-2">
                              <label className="text-[10px] font-medium text-gray-600 block mb-1">Set Priority:</label>
                              <select 
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={alert.severity || 'medium'}
                                onChange={async (e) => {
                                  const newSeverity = e.target.value;
                                  try {
                                    const res = await fetch('/api/alerts/update-severity', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ alertId: alert.id, severity: newSeverity })
                                    });
                                    if (res.ok && onSeverityUpdate) {
                                      onSeverityUpdate(alert.id, newSeverity);
                                    }
                                  } catch (err) {
                                    console.error('Error updating severity:', err);
                                  }
                                }}
                              >
                                <option value="low">🟢 Low Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="high">🟠 High Priority</option>
                                <option value="critical">🔴 Critical</option>
                              </select>
                            </div>
                            
                            {/* Alert Details */}
                            <div className="text-xs text-gray-700 space-y-1">
                              <div className="flex items-start gap-1">
                                <span className="text-gray-500">📍</span>
                                <span className="flex-1">{alert.address || '—'}</span>
                              </div>
                              {alert.contact && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">📞</span>
                                  <a href={`tel:${alert.contact}`} className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                                    {alert.contact}
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">📅</span>
                                <span>{alert.occurred_at ? new Date(alert.occurred_at).toLocaleDateString('en-PH', { 
                                  timeZone: 'Asia/Manila',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">🕐</span>
                                <span>{alert.occurred_at ? new Date(alert.occurred_at).toLocaleTimeString('en-PH', { 
                                  timeZone: 'Asia/Manila',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Unknown'}</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="text-gray-500">📱</span>
                                <span className="flex-1"><span className="font-medium">Sent by:</span> {alert.resident_name || alert.contact || 'Unknown'}</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="text-gray-500">🚑</span>
                                <span className="flex-1"><span className="font-medium">Responder:</span> {alert.user || alert.responder_name || 'Not Assigned'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            } else {
              // Render single alert marker
              const alert = cluster.alerts[0];
              
              if (!markerRefs.current[alert.id]) {
                markerRefs.current[alert.id] = React.createRef();
              }

              const customIcon = createCustomIcon(alert.type, alert.status, L);

              return (
                <Marker
                  key={alert.id}
                  position={alert.coords}
                  ref={markerRefs.current[alert.id]}
                  icon={customIcon}
                >
                  <Popup maxWidth={280} className="custom-popup">
                  <div className="p-0">
                    {/* Header with icon and type */}
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-200">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.status === 'Not Responded' ? 'bg-red-500' : 
                        alert.status === 'Pending' ? 'bg-yellow-500' :
                        alert.status === 'Ongoing' || alert.status === 'In Progress' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                      <h3 className="font-bold text-gray-800 text-sm">{alert.type || 'Alert'}</h3>
                    </div>

                    {/* Status, Severity, and Verification Badges */}
                    <div className="mb-2 flex gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        alert.status === 'Not Responded' ? 'bg-red-100 text-red-700' : 
                        alert.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        alert.status === 'Ongoing' || alert.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {alert.status || 'Unknown Status'}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        alert.severity === 'critical' ? 'bg-red-600 text-white' : 
                        alert.severity === 'high' ? 'bg-orange-500 text-white' : 
                        alert.severity === 'medium' ? 'bg-yellow-500 text-white' : 
                        'bg-blue-500 text-white'
                      }`}>
                        {alert.severity ? alert.severity.toUpperCase() : 'MEDIUM'}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        alert.is_verified ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {alert.is_verified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
                      </span>
                    </div>
                    
                    {/* Severity Selector for Admins */}
                    <div className="mb-2">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Set Priority:</label>
                      <select 
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={alert.severity || 'medium'}
                        onChange={async (e) => {
                          const newSeverity = e.target.value;
                          try {
                            const res = await fetch('/api/alerts/update-severity', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ alertId: alert.id, severity: newSeverity })
                            });
                            if (res.ok) {
                              // Update local state without reload
                              if (onSeverityUpdate) {
                                onSeverityUpdate(alert.id, newSeverity);
                              }
                            }
                          } catch (err) {
                            console.error('Error updating severity:', err);
                          }
                        }}
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="high">🟠 High Priority</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-800 font-medium flex-1">{alert.address || '—'}</span>
                      </div>
                      
                      {alert.contact && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">📞</span>
                          <a href={`tel:${alert.contact}`} className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                            {alert.contact}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">📅</span>
                        <span className="text-gray-800">
                          {alert.occurred_at ? new Date(alert.occurred_at).toLocaleDateString('en-PH', { 
                            timeZone: 'Asia/Manila',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : <span className="italic text-gray-400">Unknown</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">🕐</span>
                        <span className="text-gray-800">
                          {alert.occurred_at ? new Date(alert.occurred_at).toLocaleTimeString('en-PH', { 
                            timeZone: 'Asia/Manila',
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true
                          }) : <span className="italic text-gray-400">Unknown</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">📱</span>
                        <span className="text-gray-800">
                          <span className="font-medium">Sent by:</span> {alert.resident_name || alert.user_name || alert.contact || <span className="italic text-gray-400">Unknown</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">🚑</span>
                        <span className="text-gray-800">
                          <span className="font-medium">Responder:</span> {alert.user || alert.responder_name || <span className="italic text-gray-400">Unassigned</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
              );
            }
          })}

          {/* Render route lines from responders to their assigned alerts */}
          {responders.map((responder) => {
            // Debug logging
            console.log('Processing responder for route:', {
              responderId: responder.responderId,
              responderName: responder.responderName,
              hasAssignment: !!responder.assignment,
              assignmentAlertId: responder.assignment?.alertId,
              hasLocation: !!(responder.location?.latitude && responder.location?.longitude),
              location: responder.location
            });

            if (!responder.assignment || !responder.location?.latitude || !responder.location?.longitude) {
              console.log('❌ Skipping responder - missing assignment or location');
              return null;
            }

            // Find the alert this responder is assigned to
            const assignedAlert = alerts.find(alert => alert.id === responder.assignment.alertId);
            
            console.log('Looking for alert:', responder.assignment.alertId, 'Found:', !!assignedAlert);
            
            if (!assignedAlert) {
              console.log('❌ Alert not found in alerts array');
              return null;
            }
            
            if (!assignedAlert.coords || assignedAlert.coords.length !== 2) {
              console.log('❌ Alert has invalid coords:', assignedAlert.coords);
              return null;
            }

            // Also check if alert has matching responder name (for ongoing alerts)
            const isMatchingResponder = assignedAlert.user && 
              assignedAlert.user.toLowerCase().includes(responder.responderName.toLowerCase());

            const responderCoords = [responder.location.latitude, responder.location.longitude];
            const alertCoords = assignedAlert.coords;

            // Different colors for different matching scenarios
            let routeColor = '#2563EB'; // Default blue
            let routeOpacity = 0.8;
            let routeWeight = 5;
            
            if (isMatchingResponder && assignedAlert.status === 'Ongoing') {
              routeColor = '#059669'; // Green for matching responder on ongoing alert
              routeOpacity = 0.95;
              routeWeight = 6;
            }

            console.log('✅ Drawing route:', {
              from: responderCoords,
              to: alertCoords,
              color: routeColor,
              isMatching: isMatchingResponder
            });

            return (
              <Polyline
                key={`route-${responder.responderId}`}
                positions={[responderCoords, alertCoords]}
                pathOptions={{
                  color: routeColor,
                  weight: routeWeight,
                  opacity: routeOpacity,
                  dashArray: '10, 10',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            );
          })}

          {/* Render responder markers */}
          {responders.map((responder) => {
            console.log('Rendering responder marker:', {
              id: responder.responderId,
              name: responder.responderName,
              status: responder.status,
              hasLocation: !!(responder.location?.latitude && responder.location?.longitude),
              coords: responder.location ? [responder.location.latitude, responder.location.longitude] : null
            });
            
            if (!responder.location?.latitude || !responder.location?.longitude) {
              console.log('❌ Skipping responder marker - no location');
              return null;
            }

            const responderCoords = [responder.location.latitude, responder.location.longitude];
            const isActive = responder.status === 'online' || responder.status === 'ready to go' || responder.status === 'active';
            const responderIcon = createResponderIcon(isActive, responder.location.heading, L);
            
            console.log('✅ Creating responder marker at:', responderCoords, 'isActive:', isActive);

            return (
              <Marker
                key={`responder-${responder.responderId}`}
                position={responderCoords}
                icon={responderIcon}
              >
                <Popup maxWidth={220} className="custom-popup">
                  <div className="p-0">
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-200">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <h3 className="font-bold text-gray-800 text-sm">🚑 {responder.responderName}</h3>
                    </div>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {responder.status}
                        </span>
                      </div>
                      
                      {responder.location.speed && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500">⚡</span>
                          <span className="text-gray-800">Speed: {(responder.location.speed * 3.6).toFixed(1)} km/h</span>
                        </div>
                      )}
                      
                      {responder.location.distance && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500">📍</span>
                          <span className="text-gray-800">Distance: {responder.location.distance}</span>
                        </div>
                      )}
                      
                      {responder.location.eta && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500">⏱️</span>
                          <span className="text-gray-800 font-semibold">ETA: {responder.location.eta} min</span>
                        </div>
                      )}
                      
                      {responder.assignment && (
                        <div className="mt-2 p-1.5 bg-red-50 rounded border border-red-200">
                          <p className="text-xs font-semibold text-red-800">
                            Responding to: {responder.assignment.type}
                          </p>
                          {responder.location.eta && (
                            <p className="text-xs text-red-600 mt-0.5">
                              Arriving in ~{responder.location.eta} minutes
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-start gap-1.5 text-gray-500">
                        <span>🕐</span>
                        <span>Updated: {new Date(responder.location.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <FlyToAndOpenPopup
            alerts={alerts}
            selectedAlertId={selectedAlertId}
            markerRefs={markerRefs}
          />

          <MapResizer watch={alerts.length} />
        </MapContainer>
      </Suspense>
    </div>
  );
}