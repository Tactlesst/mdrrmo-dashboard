'use client';
import React, { useEffect, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';

// Lazy load Leaflet components to improve LCP
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet icon configuration will be loaded dynamically

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
    console.log('FlyToAndOpenPopup triggered:', { selectedAlertId, alertsCount: alerts.length });
    
    if (!selectedAlertId) {
      console.log('No selectedAlertId, skipping');
      return;
    }

    const alert = alerts.find((a) => a.id === selectedAlertId);
    console.log('Found alert:', alert);
    
    if (!alert || !alert.coords || alert.coords.some(isNaN)) {
      console.warn('Invalid alert or coordinates');
      return;
    }

    try {
      if (map && map.flyTo) {
        console.log('Flying to:', alert.coords);
        map.flyTo(alert.coords, 16, { duration: 1.5 });
        console.log('FlyTo executed successfully');
        
        // Wait for flyTo animation to complete, then open popup
        const popupTimeout = setTimeout(() => {
          try {
            // Find the marker using Leaflet's layer system
            map.eachLayer((layer) => {
              if (layer.getLatLng && layer.openPopup) {
                const pos = layer.getLatLng();
                // Check if this layer is at the alert's coordinates
                if (Math.abs(pos.lat - alert.coords[0]) < 0.0001 && 
                    Math.abs(pos.lng - alert.coords[1]) < 0.0001) {
                  layer.openPopup();
                  console.log('Popup opened successfully via layer search');
                }
              }
            });
          } catch (error) {
            console.error('Popup open error:', error);
          }
        }, 1600); // Slightly longer than flyTo duration
        
        return () => clearTimeout(popupTimeout);
      } else {
        console.warn('Map or flyTo method not available');
      }
    } catch (error) {
      console.error('Map flyTo error:', error);
    }
  }, [selectedAlertId, alerts, map]);

  return null;
}

export default function AlertsMap({ alerts, fallbackCenter, selectedAlertId }) {
  const markerRefs = useRef({});
  const [leafletReady, setLeafletReady] = useState(false);
  const [L, setL] = useState(null);
  const isMountedRef = useRef(true);
  const [responders, setResponders] = useState([]);

  const mapCenter = alerts.length ? alerts[0].coords : fallbackCenter;

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch responder locations
  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const url = selectedAlertId 
          ? `/api/responders/tracking?alertId=${selectedAlertId}`
          : '/api/responders/tracking';
        
        console.log('Fetching responders from:', url);
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('Responder data received:', data);
        
        if (data.success && isMountedRef.current) {
          setResponders(data.responders || []);
          console.log(`✅ ${data.responders?.length || 0} responders loaded`);
        } else {
          console.warn('Failed to fetch responders:', data);
        }
      } catch (err) {
        console.error('Error fetching responder locations:', err);
      }
    };

    fetchResponders();
    const interval = setInterval(fetchResponders, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [selectedAlertId]);

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
    <div className="w-full h-full">
      <Suspense fallback={
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      }>
        <MapContainer center={mapCenter} zoom={17} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {alerts.map((alert) => {
            if (!alert.coords || alert.coords.some(isNaN)) return null; // Skip invalid coordinates

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
                <Popup maxWidth={240} className="custom-popup">
                  <div className="p-0">
                    {/* Header with icon and type */}
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-200">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.status === 'Not Responded' ? 'bg-red-500' : 
                        alert.status === 'Ongoing' || alert.status === 'In Progress' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                      <h3 className="font-bold text-gray-800 text-sm">{alert.type || 'Alert'}</h3>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        alert.status === 'Not Responded' ? 'bg-red-100 text-red-700' : 
                        alert.status === 'Ongoing' || alert.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {alert.status || 'Unknown Status'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-800 font-medium flex-1">{alert.address || '—'}</span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">📅</span>
                        <span className="text-gray-800">
                          {alert.date ? new Date(alert.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          }) : <span className="italic text-gray-400">Unknown</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-800">
                          {alert.user || <span className="italic text-gray-400">Unassigned</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render responder markers */}
          {responders.map((responder) => {
            if (!responder.location?.latitude || !responder.location?.longitude) return null;

            const responderCoords = [responder.location.latitude, responder.location.longitude];
            const isActive = responder.status === 'online' || responder.status === 'ready to go';
            const responderIcon = createResponderIcon(isActive, responder.location.heading, L);

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
                      
                      {responder.assignment && (
                        <div className="mt-2 p-1.5 bg-red-50 rounded border border-red-200">
                          <p className="text-xs font-semibold text-red-800">
                            Responding to: {responder.assignment.type}
                          </p>
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