'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export default function RespondedAlertsMap({ alerts }) {
  const mapInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Filter alerts with valid coordinates
    const validAlerts = alerts.filter(alert => alert.lat && alert.lng);
    
    if (validAlerts.length === 0) {
      setIsReady(true);
      return;
    }

    // Cleanup function
    const cleanup = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          // Silently handle cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };

    // Clean up any existing map
    cleanup();

    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const container = document.getElementById('responded-alerts-map');
      
      if (!container) {
        console.warn('Map container not found');
        return;
      }

      // Clear container
      container.innerHTML = '';
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      // Check if container has dimensions
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Map container has no dimensions');
        return;
      }

      try {
        // Initialize map
        const map = L.map(container, {
          center: [validAlerts[0].lat, validAlerts[0].lng],
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;
        setIsReady(true);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Create custom icon for responded alerts
        const respondedIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #16a34a; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 16px; font-weight: bold;">✓</span>
          </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15],
        });

        // Add markers for each responded alert
        validAlerts.forEach((alert) => {
          const marker = L.marker([alert.lat, alert.lng], { icon: respondedIcon }).addTo(map);
          
          // Create popup content
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${alert.type}</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Address:</strong> ${alert.address}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Responder:</strong> ${alert.responder_name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Responded At:</strong> ${alert.responded_at}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Resident:</strong> ${alert.resident_name}</p>
              ${alert.description ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Description:</strong> ${alert.description}</p>` : ''}
            </div>
          `;
          
          marker.bindPopup(popupContent);
        });

        // Fit map bounds to show all markers
        if (validAlerts.length > 1) {
          const bounds = L.latLngBounds(validAlerts.map(alert => [alert.lat, alert.lng]));
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        // Invalidate size after a short delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 300);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [alerts]);

  return (
    <div 
      id="responded-alerts-map" 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '384px' }}
    />
  );
}
