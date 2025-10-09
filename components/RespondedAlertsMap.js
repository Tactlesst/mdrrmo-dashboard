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

const createCustomIcon = (type) => {
  const normalizedType = type ? type.toLowerCase() : '';
  const iconUrls = {
    'car accident': 'https://images.icon-icons.com/3196/PNG/512/car_crash_icon_194614.png',
    'rear_end': 'https://images.icon-icons.com/3375/PNG/512/crash_car_icon_211807.png',
    'sideswipe': 'https://images.icon-icons.com/494/PNG/512/car_icon-icons.com_48342.png',
    'car crash': 'https://images.icon-icons.com/3196/PNG/512/car_crash_icon_194614.png',
    'single_vehicle': 'https://images.icon-icons.com/3196/PNG/512/car_crash_icon_194614.png',
    'pedestrian': 'https://images.icon-icons.com/3196/PNG/512/pedestrian_icon_194615.png', // Valid URL
  };
  const baseIconUrl = iconUrls[normalizedType] || iconUrls['car accident'];

  return new L.Icon({
    iconUrl: baseIconUrl,
    iconRetinaUrl: baseIconUrl,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
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
      map.flyTo([alert.lat, alert.lng], 16, { duration: 1.5 });
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 1500);
    }
  }, [selectedAlertId, alerts, markerRefs, map]);

  return null;
}

export default function AlertsMap({ alerts, loading, fallbackCenter = [8.743412346817417, 124.77629163417616], selectedAlertId }) {
  const markerRefs = useRef({});

  const mapCenter = alerts.length && alerts[0].lat && alerts[0].lng ? [alerts[0].lat, alerts[0].lng] : fallbackCenter;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      {loading ? (
        <div className="h-[65vh] flex items-center justify-center text-sm text-gray-500">Loading…</div>
      ) : alerts.length === 0 ? (
        <div className="h-[65vh] flex items-center justify-center text-sm text-gray-500">No responded alerts found</div>
      ) : (
        <div className="h-[65vh]">
          <MapContainer center={mapCenter} zoom={17} className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {alerts.map((alert) => {
              if (!alert.lat || !alert.lng || isNaN(alert.lat) || isNaN(alert.lng)) return null;

              if (!markerRefs.current[alert.id]) {
                markerRefs.current[alert.id] = React.createRef();
              }

              const customIcon = createCustomIcon(alert.type);

              return (
                <Marker
                  key={alert.id}
                  position={[alert.lat, alert.lng]}
                  ref={markerRefs.current[alert.id]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-sm space-y-1">
                      <p><strong>Type:</strong> {alert.type || '—'}</p>
                      <p><strong>Status:</strong> {alert.status || '—'}</p>
                      <p><strong>Address:</strong> {alert.address || '—'}</p>
                      <p><strong>Date:</strong> {alert.occurred_at || <span className="italic text-gray-500">Unknown</span>}</p>
                      <p><strong>Responder:</strong> {alert.responder_name || <span className="italic text-gray-500">Unassigned</span>}</p>
                      <p><strong>Description:</strong> {alert.description || <span className="italic text-gray-500">No description provided</span>}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            <FlyToAndOpenPopup alerts={alerts} selectedAlertId={selectedAlertId} markerRefs={markerRefs} />
            <MapResizer watch={alerts.length} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}