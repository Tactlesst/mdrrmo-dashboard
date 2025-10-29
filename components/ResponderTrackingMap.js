'use client';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom responder icon
const createResponderIcon = (isActive, heading) => {
  const color = isActive ? '#059669' : '#6B7280';
  const rotation = heading || 0;
  
  return L.divIcon({
    className: 'custom-responder-marker',
    html: `
      <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15 8L21 9L16 14L17 20L12 17L7 20L8 14L3 9L9 8L12 2Z" stroke="white" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Alert destination icon
const createDestinationIcon = () => {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="background: #DC2626; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function ResponderTrackingMap({ 
  center = [8.743412346817417, 124.77629163417616],
  zoom = 13,
  alertId = null,
  showAllResponders = true,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch responder locations
  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const url = alertId 
          ? `/api/responders/tracking?alertId=${alertId}`
          : '/api/responders/tracking';
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          setResponders(data.responders || []);
        }
      } catch (err) {
        console.error('Error fetching responder locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResponders();
    const interval = setInterval(fetchResponders, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [alertId]);

  // Update markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !responders.length) return;

    const map = mapInstanceRef.current;

    // Clear old markers and polylines
    Object.values(markersRef.current).forEach(marker => marker.remove());
    Object.values(polylinesRef.current).forEach(polyline => polyline.remove());
    markersRef.current = {};
    polylinesRef.current = {};

    responders.forEach((responder) => {
      const { responderId, responderName, location, assignment, status } = responder;

      if (!location || !location.latitude || !location.longitude) return;

      const responderLatLng = [location.latitude, location.longitude];
      const isActive = status === 'online' || status === 'ready to go';

      // Create responder marker
      const responderMarker = L.marker(responderLatLng, {
        icon: createResponderIcon(isActive, location.heading),
      }).addTo(map);

      responderMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${responderName}
          </h3>
          <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">
            <strong>Status:</strong> ${status}
          </p>
          ${location.speed ? `
            <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">
              <strong>Speed:</strong> ${(location.speed * 3.6).toFixed(1)} km/h
            </p>
          ` : ''}
          ${assignment ? `
            <p style="margin: 4px 0; font-size: 14px; color: #DC2626;">
              <strong>Responding to:</strong> ${assignment.type}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
              ${assignment.address}
            </p>
          ` : ''}
          <p style="margin: 4px 0; font-size: 12px; color: #9CA3AF;">
            Last update: ${new Date(location.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      `);

      markersRef.current[responderId] = responderMarker;

      // If responder has an assignment, show destination and route
      if (assignment && assignment.destination) {
        const destLatLng = [assignment.destination.latitude, assignment.destination.longitude];

        // Create destination marker
        const destMarker = L.marker(destLatLng, {
          icon: createDestinationIcon(),
        }).addTo(map);

        destMarker.bindPopup(`
          <div style="font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #DC2626;">
              Alert Destination
            </h3>
            <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">
              <strong>Type:</strong> ${assignment.type}
            </p>
            <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">
              ${assignment.address}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #9CA3AF;">
              Responder: ${responderName}
            </p>
          </div>
        `);

        markersRef.current[`dest-${responderId}`] = destMarker;

        // Draw route line
        const routeLine = L.polyline([responderLatLng, destLatLng], {
          color: '#DC2626',
          weight: 3,
          opacity: 0.6,
          dashArray: '10, 10',
        }).addTo(map);

        polylinesRef.current[responderId] = routeLine;

        // Fit bounds to show both responder and destination
        const bounds = L.latLngBounds([responderLatLng, destLatLng]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    // If no assignments, fit bounds to show all responders
    if (responders.length > 0 && !responders.some(r => r.assignment)) {
      const bounds = L.latLngBounds(
        responders
          .filter(r => r.location?.latitude && r.location?.longitude)
          .map(r => [r.location.latitude, r.location.longitude])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [responders]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          <p style={{ margin: 0, color: '#6B7280' }}>Loading responder locations...</p>
        </div>
      )}

      {!loading && responders.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, color: '#6B7280' }}>No active responders found</p>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#059669', borderRadius: '50%', marginRight: '8px' }} />
          <span>Active Responder</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#6B7280', borderRadius: '50%', marginRight: '8px' }} />
          <span>Inactive Responder</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '16px', height: '16px', background: '#DC2626', borderRadius: '50%', marginRight: '8px' }} />
          <span>Alert Location</span>
        </div>
      </div>
    </div>
  );
}
