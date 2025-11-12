'use client';

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import useSupercluster from 'use-supercluster';
import dayjs from 'dayjs';

// MapEvents component for handling map events
const MapEvents = ({ setBounds, setZoom }) => {
  const map = useMap();
  
  useMapEvents({
    moveend: () => {
      if (map) {
        const b = map.getBounds();
        setBounds([
          b.getSouthWest().lng,
          b.getSouthWest().lat,
          b.getNorthEast().lng,
          b.getNorthEast().lat
        ]);
        setZoom(map.getZoom());
      }
    },
    zoomend: () => {
      if (map) {
        const b = map.getBounds();
        setBounds([
          b.getSouthWest().lng,
          b.getSouthWest().lat,
          b.getNorthEast().lng,
          b.getNorthEast().lat
        ]);
        setZoom(map.getZoom());
      }
    },
    load: () => {
      if (map) {
        const b = map.getBounds();
        setBounds([
          b.getSouthWest().lng,
          b.getSouthWest().lat,
          b.getNorthEast().lng,
          b.getNorthEast().lat
        ]);
        setZoom(map.getZoom());
      }
    }
  });
  return null;
};

// ClusterMarker component for handling cluster clicks
const ClusterMarker = ({ latitude, longitude, pointCount, clusterId }) => {
  const map = useMap();
  
  return (
    <Marker
      key={`cluster-${clusterId}`}
      position={[latitude, longitude]}
      icon={window.L ? new window.L.DivIcon({
        className: 'custom-marker',
        html: `
          <div class="cluster-marker" style="
            background: linear-gradient(135deg, #4f46e5, #3730a3);
            border: 3px solid white;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
            width: ${10 + (pointCount / 100) * 40}px;
            height: ${10 + (pointCount / 100) * 40}px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${pointCount}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      }) : undefined}
      eventHandlers={{
        click: () => {
          if (map) {
            const expansionZoom = Math.min(map.getZoom() + 2, 20);
            map.setView([latitude, longitude], expansionZoom);
          }
        }
      }}
    >
      <Popup>
        <div className="p-2">
          <p className="font-semibold">{pointCount} alerts in this area</p>
          <p className="text-sm text-gray-600">Click to zoom in and see individual alerts</p>
        </div>
      </Popup>
    </Marker>
  );
};

const MapWithClustering = ({ locations, defaultPosition }) => {
  // Clustering state
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(13);

  // Prepare data for clustering
  const points = useMemo(() => {
    return locations
      .filter(loc => loc.lat && loc.lng)
      .map((loc, index) => ({
        type: "Feature",
        properties: {
          cluster: false,
          locationId: loc.id || index,
          ...loc
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)]
        }
      }));
  }, [locations]);

  // Get clusters using supercluster
  const { clusters } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <MapContainer 
      center={defaultPosition} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="z-0 leaflet-container"
    >
      <MapEvents setBounds={setBounds} setZoom={setZoom} />
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Clustered Markers */}
      {clusters.map((cluster, i) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;
        
        if (isCluster) {
          // Render cluster marker
          return (
            <ClusterMarker
              key={`cluster-${cluster.id}`}
              latitude={latitude}
              longitude={longitude}
              pointCount={pointCount}
              clusterId={cluster.id}
            />
          );
        }
        
        // Render individual marker
        const loc = cluster.properties;
        const getStatusColor = (status) => {
          const s = status?.toLowerCase();
          if (s === 'pending' || s === 'unverified') return 'yellow';
          if (s === 'ongoing' || s === 'verified') return 'blue';
          if (s === 'responded' || s === 'resolved') return 'green';
          if (s === 'referred' || s === 'transferred') return 'indigo';
          return 'red';
        };
        
        const statusColor = getStatusColor(loc.status);
          
        return (
          <Marker 
            key={`marker-${loc.locationId || i}`} 
            position={[latitude, longitude]}
            icon={window.L ? new window.L.DivIcon({
              className: 'custom-marker',
              html: `
                <div class="marker-pin marker-${statusColor}">
                  <div class="marker-pulse marker-pulse-${statusColor}"></div>
                  <svg class="marker-icon" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            }) : undefined}
          >
            <Popup 
              maxWidth={350} 
              className="custom-popup"
              closeButton={true}
              autoPan={true}
            >
              <div className="p-4 min-w-[300px]">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4 pb-3 border-b border-gray-200">
                  <div className={`p-2 rounded-lg ${
                    statusColor === 'yellow' ? 'bg-yellow-100' :
                    statusColor === 'blue' ? 'bg-blue-100' :
                    statusColor === 'green' ? 'bg-green-100' :
                    statusColor === 'indigo' ? 'bg-indigo-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      statusColor === 'yellow' ? 'text-yellow-600' :
                      statusColor === 'blue' ? 'text-blue-600' :
                      statusColor === 'green' ? 'text-green-600' :
                      statusColor === 'indigo' ? 'text-indigo-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.06 19h13.88c1.54 0 2.5-1.66 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.34.19 3 1.72 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{loc.type || 'Emergency Alert'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                        statusColor === 'indigo' ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {loc.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      🕒 {dayjs(loc.occurred_at).format('MMM DD, YYYY • HH:mm')}
                    </p>
                  </div>
                </div>
                
                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-600">{loc.address || 'Address not available'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Reported by</p>
                      <p className="text-sm text-gray-600">{loc.resident_name || 'Anonymous'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Assigned Responder</p>
                      <p className="text-sm text-gray-600">{loc.responder_name || 'Not yet assigned'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    View Full Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapWithClustering;
