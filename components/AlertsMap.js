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
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timeout);
  }, [watch, map]);

  return null;
}

function FlyToAndOpenPopup({ alerts, selectedAlertId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedAlertId) return;

    const alert = alerts.find((a) => a.id === selectedAlertId);
    const markerRef = markerRefs.current[selectedAlertId];

    if (alert && markerRef && markerRef.current) {
      map.flyTo(alert.coords, 16, { duration: 1.5 });
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 1500);
    }
  }, [selectedAlertId, alerts, markerRefs, map]);

  return null;
}

export default function AlertsMap({ alerts, fallbackCenter, selectedAlertId }) {
  const markerRefs = useRef({});
  const [leafletReady, setLeafletReady] = useState(false);
  const [L, setL] = useState(null);

  const mapCenter = alerts.length ? alerts[0].coords : fallbackCenter;

  // Lazy load Leaflet CSS and configure icons
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
    import('leaflet').then((LeafletModule) => {
      const LeafletLib = LeafletModule.default;
      delete LeafletLib.Icon.Default.prototype._getIconUrl;
      LeafletLib.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(LeafletLib);
      setLeafletReady(true);
    });
  }, []);

  // Add CSS for tinting icons
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tint-red { filter: hue-rotate(0deg) brightness(0.8) sepia(0.5); }
      .tint-orange { filter: hue-rotate(40deg) brightness(0.9) sepia(0.5); }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (!leafletReady || !L) {
    return (
      <div className="rounded-lg overflow-hidden h-[40vh] md:h-[65vh] bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden h-[40vh] md:h-[65vh]">
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
                <Popup>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Type:</strong> {alert.type || '—'}
                    </p>
                    <p>
                      <strong>Status:</strong> {alert.status || '—'}
                    </p>
                    <p>
                      <strong>Address:</strong> {alert.address || '—'}
                    </p>
                    <p>
                      <strong>Date:</strong>{' '}
                      {alert.date || <span className="italic text-gray-500">Unknown</span>}
                    </p>
                    <p>
                      <strong>Responder:</strong>{' '}
                      {alert.user || <span className="italic text-gray-500">Unassigned</span>}
                    </p>
                    {alert.description ? (
                      <p>
                        <strong>Description:</strong> {alert.description}
                      </p>
                    ) : (
                      <p className="italic text-gray-500">No description provided</p>
                    )}
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