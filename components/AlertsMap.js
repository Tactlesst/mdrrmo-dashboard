'use client';
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons (optional if using fully custom icons)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (type, status) => {
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

  const mapCenter = alerts.length ? alerts[0].coords : fallbackCenter;

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

  return (
    <div className="rounded-lg overflow-hidden h-[40vh] md:h-[65vh]">
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

          const customIcon = createCustomIcon(alert.type, alert.status);

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
    </div>
  );
}