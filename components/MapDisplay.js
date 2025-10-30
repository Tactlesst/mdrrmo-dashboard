'use client';

import React, { useRef, useEffect, useState, useMemo, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { FiUserPlus, FiAlertCircle, FiUsers } from 'react-icons/fi';
import dayjs from 'dayjs';

// Lazy load heavy dependencies to improve LCP
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet icon configuration will be loaded dynamically

const Dashboard = () => {
  const barChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const [selectedTab, setSelectedTab] = useState('Monthly');
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [responders, setResponders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalNewUsers, setTotalNewUsers] = useState(0);
  const [totalResponders, setTotalResponders] = useState(0);
  const [availableResponders, setAvailableResponders] = useState(0);
  const [leafletReady, setLeafletReady] = useState(false);
  const tabClickTimeoutRef = useRef(null);

  // Lazy load Leaflet CSS and configure icons
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      setLeafletReady(true);
    });
  }, []);

  // Debounced tab change to improve INP
  const handleTabChange = (tab) => {
    if (tabClickTimeoutRef.current) {
      clearTimeout(tabClickTimeoutRef.current);
    }
    tabClickTimeoutRef.current = setTimeout(() => {
      setSelectedTab(tab);
    }, 50);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for faster loading
        const [alertsRes, usersRes, locationsRes, respondersRes, statusRes] = await Promise.all([
          fetch('/api/alerts'),
          fetch('/api/users?role=Residents'),
          fetch('/api/alerts/locations'),
          fetch('/api/responders'),
          fetch('/api/admins/status'),
        ]);

        // Check responses
        if (!alertsRes.ok) throw new Error(`Alerts HTTP ${alertsRes.status}`);
        if (!usersRes.ok) throw new Error(`Users HTTP ${usersRes.status}`);
        if (!locationsRes.ok) throw new Error(`Locations HTTP ${locationsRes.status}`);
        if (!respondersRes.ok) throw new Error(`Responders HTTP ${respondersRes.status}`);
        if (!statusRes.ok) throw new Error(`Status HTTP ${statusRes.status}`);

        // Parse all responses in parallel
        const [alertsData, usersData, locationsData, respondersData, statusData] = await Promise.all([
          alertsRes.json(),
          usersRes.json(),
          locationsRes.json(),
          respondersRes.json(),
          statusRes.json(),
        ]);

        // Process alerts
        const alertsArr = alertsData.alerts || alertsData;
        setAlerts(
          alertsArr.map((alert) => ({
            id: alert.id ?? 'N/A',
            type: alert.type ?? 'Unknown',
            status: alert.status ?? 'N/A',
            occurred_at: alert.occurred_at ? dayjs(alert.occurred_at).format('YYYY-MM-DD HH:mm:ss') : 'Unknown',
            address: alert.address ?? 'N/A',
            resident_name: alert.resident_name ?? 'Unknown User',
            responder_name: alert.responder_name ?? 'Not Assigned',
            lat: alert.lat ?? null,
            lng: alert.lng ?? null,
          }))
        );

        // Process users
        setUsers(usersData);
        setTotalUsers(usersData.length);
        const thisMonth = dayjs().format('YYYY-MM');
        setTotalNewUsers(usersData.filter((user) => dayjs(user.created_at || user.dob).format('YYYY-MM') === thisMonth).length);

        // Process locations
        const locationsArr = locationsData.locations || locationsData;
        setLocations(locationsArr);

        // Process responders
        const respondersArr = respondersData.responders || respondersData;
        setResponders(respondersArr);
        setTotalResponders(respondersArr.length);

        // Process responder status from /api/admins/status
        const respondersStatus = statusData.responders || [];
        setSessions(respondersStatus);
        
        // Debug: Log responder status
        console.log('All responders from status API:', respondersStatus);
        console.log('Active responders:', respondersStatus.filter(r => r.responder_status?.toLowerCase() === 'active'));
        
        // Count responders that are available (responder_status = 'active')
        const activeResponders = respondersStatus.filter(r => r.responder_status?.toLowerCase() === 'active').length;
        
        console.log('Available responders count:', activeResponders);
        setAvailableResponders(activeResponders);
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
        setAlerts([]);
        setUsers([]);
        setLocations([]);
        setResponders([]);
        setSessions([]);
        setTotalUsers(0);
        setTotalNewUsers(0);
        setTotalResponders(0);
        setAvailableResponders(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Aggregate alert and user data for bar chart
  const chartData = useMemo(() => {
    const daily = { labels: [], alerts: [], newUsers: [] };
    const weekly = { labels: [], alerts: [], newUsers: [] };
    const monthly = { labels: [], alerts: [], newUsers: [] };

    // Generate labels
    const today = dayjs();
    daily.labels = Array.from({ length: 7 }, (_, i) => today.subtract(i, 'day').format('ddd')).reverse();
    weekly.labels = Array.from({ length: 4 }, (_, i) => `Week ${4 - i}`);
    monthly.labels = Array.from({ length: 12 }, (_, i) => today.subtract(i, 'month').format('MMM')).reverse();

    // Aggregate alerts
    daily.alerts = daily.labels.map((day, i) => {
      const date = today.subtract(daily.labels.length - 1 - i, 'day').format('YYYY-MM-DD');
      return alerts.filter((a) => a.occurred_at.startsWith(date)).length;
    });
    weekly.alerts = weekly.labels.map((_, i) => {
      const weekStart = today.subtract(weekly.labels.length - i - 1, 'week').startOf('week');
      const weekEnd = weekStart.endOf('week');
      return alerts.filter((a) => {
        const d = dayjs(a.occurred_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
    });
    monthly.alerts = monthly.labels.map((_, i) => {
      const monthStart = today.subtract(monthly.labels.length - i - 1, 'month').startOf('month');
      const monthEnd = monthStart.endOf('month');
      return alerts.filter((a) => {
        const d = dayjs(a.occurred_at);
        return d >= monthStart && d <= monthEnd;
      }).length;
    });

    // Aggregate new users
    daily.newUsers = daily.labels.map((day, i) => {
      const date = today.subtract(daily.labels.length - 1 - i, 'day').format('YYYY-MM-DD');
      return users.filter((u) => (u.created_at || u.dob)?.startsWith(date)).length;
    });
    weekly.newUsers = weekly.labels.map((_, i) => {
      const weekStart = today.subtract(weekly.labels.length - i - 1, 'week').startOf('week');
      const weekEnd = weekStart.endOf('week');
      return users.filter((u) => {
        const d = dayjs(u.created_at || u.dob);
        return d >= weekStart && d <= weekEnd;
      }).length;
    });
    monthly.newUsers = monthly.labels.map((_, i) => {
      const monthStart = today.subtract(monthly.labels.length - i - 1, 'month').startOf('month');
      const monthEnd = monthStart.endOf('month');
      return users.filter((u) => {
        const d = dayjs(u.created_at || u.dob);
        return d >= monthStart && d <= monthEnd;
      }).length;
    });

    return { daily, weekly, monthly };
  }, [alerts, users]);

  const getChartData = () => {
    if (selectedTab === 'Daily') return chartData.daily;
    if (selectedTab === 'Weekly') return chartData.weekly;
    return chartData.monthly;
  };

  const chartColors = {
    users: '#3B82F6',
    alerts: '#EF4444',
  };

  useEffect(() => {
    if (loading) return; // Prevent chart creation while loading

    const ctx = barChartRef.current?.getContext('2d');
    if (!ctx) return;

    // Lazy load Chart.js to improve LCP
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;
      
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const data = getChartData();

      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'New Users',
              data: data.newUsers,
              backgroundColor: chartColors.users,
              borderRadius: 6,
            },
            {
              label: 'Alerts',
              data: data.alerts,
              backgroundColor: chartColors.alerts,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#374151',
                font: { size: 13 },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#6B7280' },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#E5E7EB' },
              ticks: { color: '#6B7280' },
            },
          },
        },
      });

      // Force immediate resize to ensure chart renders correctly
      barChartInstance.current.resize();
    });

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [loading, selectedTab, chartData]);

  const defaultPosition = [8.743412346817417, 124.77629163417616];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600 text-xl">
            <FiUserPlus />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total New Users (This Month)</p>
            <p className="text-2xl font-semibold text-green-600">
              {loading ? <span className="animate-pulse">...</span> : totalNewUsers}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600 text-xl">
            <FiAlertCircle />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Number of Alerts</p>
            <p className="text-2xl font-semibold text-red-600">
              {loading ? <span className="animate-pulse">...</span> : alerts.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 text-xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Responders Available</p>
            <p className="text-2xl font-semibold text-blue-600">
              {loading ? <span className="animate-pulse">...</span> : `${availableResponders} / ${totalResponders}`}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600 text-xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-semibold text-purple-600">
              {loading ? <span className="animate-pulse">...</span> : totalUsers}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart with Tabs */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">📊 User & Alert Trends</h2>
          <div className="space-x-2">
            {['Daily', 'Weekly', 'Monthly'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedTab === tab
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading chart data...</p>
              </div>
            </div>
          ) : (
            <canvas ref={barChartRef}></canvas>
          )}
        </div>
      </div>

      {/* Leaflet Map - Enhanced Design */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Location Overview</h2>
              <p className="text-sm text-gray-600">Real-time alert locations on map</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">{locations.length} Active Locations</span>
          </div>
        </div>
        
        <div className="h-[500px] w-full overflow-hidden rounded-xl shadow-xl border-4 border-white relative">
          {loading || !leafletReady ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
                </div>
                <p className="text-base font-medium text-gray-700">Loading map...</p>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            }>
              <MapContainer 
                center={defaultPosition} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {locations.map((loc, i) => (
                  loc.lat && loc.lng && (
                    <Marker key={i} position={[loc.lat, loc.lng]}>
                      <Popup maxWidth={300} className="custom-popup">
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.06 19h13.88c1.54 0 2.5-1.66 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.34.19 3 1.72 3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base">{loc.type || 'Alert'}</p>
                              <p className="text-xs text-gray-500">{loc.occurred_at}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <p className="text-sm text-gray-700 flex-1">{loc.address || 'N/A'}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <p className="text-sm text-gray-700 flex-1">
                                <span className="font-medium">Responder:</span> {loc.responder_name || 'Not Assigned'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </Suspense>
          )}
          
          {/* Map Legend */}
          {!loading && leafletReady && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Alert Location</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;