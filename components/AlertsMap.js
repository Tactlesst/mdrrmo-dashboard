'use client';
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to fly to and open popup
function FlyToAndOpenPopup({ alerts, selectedAlertId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedAlertId) return;

    const alert = alerts.find(a => a.id === selectedAlertId);
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

  return (
 <div className="rounded-lg overflow-hidden h-[40vh] md:h-[75vh]">
  <MapContainer center={mapCenter} zoom={17} className="w-full h-full">
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    {alerts.map(alert => {
      if (!markerRefs.current[alert.id]) {
        markerRefs.current[alert.id] = L.marker(alert.coords).bindPopup();
        markerRefs.current[alert.id] = React.createRef();
      }

      return (
        <Marker
          key={alert.id}
          position={alert.coords}
          ref={markerRefs.current[alert.id]}
        >
          <Popup>
            <div className="text-sm">
              <p><strong>Type:</strong> {alert.type}</p>
              <p><strong>Status:</strong> {alert.status}</p>
              <p><strong>Address:</strong> {alert.address}</p>
              <p><strong>Date:</strong> {alert.date}</p>
              <p><strong>Responder:</strong> {alert.user}</p>
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
  </MapContainer>
</div>

  );
}
