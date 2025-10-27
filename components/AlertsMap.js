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

  const mapCenter = alerts.length ? alerts[0].coords : fallbackCenter;

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      <div className="rounded-lg overflow-hidden h-[calc(70vh-8rem)] bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden h-[calc(70vh-8rem)]">
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