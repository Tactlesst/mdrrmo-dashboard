'use client';
import { useEffect, useState } from 'react';
import ResponderTrackingMap from './ResponderTrackingMap';

export default function ResponderTracking() {
  const [responders, setResponders] = useState([]);
  const [selectedResponderId, setSelectedResponderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await fetch('/api/responders/tracking');
        const data = await res.json();
        
        if (data.success) {
          setResponders(data.responders || []);
        }
      } catch (err) {
        console.error('Error fetching responders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResponders();
    const interval = setInterval(fetchResponders, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'ready to go':
        return 'bg-green-100 text-green-800';
      case 'standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 font-serif h-[calc(100vh-4rem)]">
      {/* Map Section */}
      <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden m-4">
        <div className="px-4 pt-4 pb-2 border-b">
          <h2 className="text-xl font-bold text-gray-800">Live Responder Tracking</h2>
          <p className="text-sm text-gray-600">Real-time location of active responders</p>
        </div>
        <div className="h-[calc(100%-4rem)]">
          <ResponderTrackingMap />
        </div>
      </div>

      {/* Responder List Section */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg overflow-hidden m-4">
        <div className="px-4 pt-4 pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-800">Active Responders</h2>
          <p className="text-sm text-gray-600">{responders.length} online</p>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : responders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No active responders
            </div>
          ) : (
            <div className="divide-y">
              {responders.map((responder) => (
                <div
                  key={responder.responderId}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedResponderId === responder.responderId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedResponderId(responder.responderId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{responder.responderName}</h3>
                      <p className="text-xs text-gray-500">{responder.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(responder.status)}`}>
                      {responder.status}
                    </span>
                  </div>

                  {responder.location && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Updated: {formatTime(responder.location.updatedAt)}</span>
                      </div>

                      {responder.location.speed && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Speed: {(responder.location.speed * 3.6).toFixed(1)} km/h</span>
                        </div>
                      )}

                      {responder.assignment && (
                        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                          <p className="text-xs font-semibold text-red-800 mb-1">
                            🚨 Responding to: {responder.assignment.type}
                          </p>
                          <p className="text-xs text-red-700">{responder.assignment.address}</p>
                          {responder.assignment.destination && responder.location && (
                            <p className="text-xs text-red-600 mt-1">
                              Distance: {calculateDistance(
                                responder.location.latitude,
                                responder.location.longitude,
                                responder.assignment.destination.latitude,
                                responder.assignment.destination.longitude
                              )} km
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
