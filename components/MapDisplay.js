'use client';

import React, { useRef, useEffect, useState, useMemo, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { FiUserPlus, FiAlertCircle, FiUsers, FiClock, FiPlay, FiCheckCircle, FiMapPin, FiActivity } from 'react-icons/fi';
import dayjs from 'dayjs';

// Lazy load heavy dependencies to improve LCP
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster').then(mod => mod.default), { ssr: false });

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

  // Calculate alert statistics
  const alertStats = useMemo(() => {
    const pending = alerts.filter(alert => alert.status?.toLowerCase() === 'pending' || alert.status?.toLowerCase() === 'unverified').length;
    const ongoing = alerts.filter(alert => alert.status?.toLowerCase() === 'ongoing' || alert.status?.toLowerCase() === 'verified').length;
    const responded = alerts.filter(alert => alert.status?.toLowerCase() === 'responded' || alert.status?.toLowerCase() === 'resolved').length;
    const referred = alerts.filter(alert => alert.status?.toLowerCase() === 'referred' || alert.status?.toLowerCase() === 'transferred').length;
    
    return { pending, ongoing, responded, referred, total: alerts.length };
  }, [alerts]);

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
    <>
      {/* Custom Styles for Map Markers and Clustering */}
      <style jsx global>{`
        /* Custom Marker Styles */
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .marker-pin {
          position: relative;
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .marker-pin:hover {
          transform: rotate(-45deg) scale(1.1);
        }
        
        .marker-yellow {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }
        
        .marker-blue {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .marker-green {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .marker-red {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .marker-indigo {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        
        .marker-icon {
          width: 16px;
          height: 16px;
          transform: rotate(45deg);
        }
        
        .marker-pulse {
          position: absolute;
          top: -5px;
          left: -5px;
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          animation: pulse 2s infinite;
          opacity: 0.6;
        }
        
        .marker-pulse-yellow {
          background: #fbbf24;
        }
        
        .marker-pulse-blue {
          background: #3b82f6;
        }
        
        .marker-pulse-green {
          background: #10b981;
        }
        
        .marker-pulse-red {
          background: #ef4444;
        }
        
        .marker-pulse-indigo {
          background: #6366f1;
        }
        
        @keyframes pulse {
          0% {
            transform: rotate(-45deg) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: rotate(-45deg) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: rotate(-45deg) scale(1.4);
            opacity: 0;
          }
        }
        
        /* Marker Cluster Styles */
        .marker-cluster {
          background: linear-gradient(135deg, #4f46e5, #3730a3);
          border: 3px solid white;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
          transition: all 0.3s ease;
        }
        
        .marker-cluster:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.6);
        }
        
        .marker-cluster div {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .marker-cluster-small {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .marker-cluster-medium {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .marker-cluster-large {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        /* Custom Popup Styles */
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid #e5e7eb !important;
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          border-radius: 12px !important;
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Leaflet Container Enhancements */
        .leaflet-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          color: #374151 !important;
          border: none !important;
          font-size: 18px !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
          color: #1f2937 !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 p-6 font-sans flex flex-col gap-6">
      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {/* Pending Alerts Badge */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl shadow-lg border border-yellow-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 text-lg transition-all duration-300 group-hover:bg-yellow-500 group-hover:text-white group-hover:rotate-12 relative">
            <FiClock />
            {!loading && alertStats.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-yellow-700 text-xs font-medium">Pending Alerts</p>
            <p className="text-xl font-bold text-yellow-800">
              {loading ? <span className="animate-pulse">...</span> : alertStats.pending}
            </p>
          </div>
        </div>

        {/* Ongoing Alerts Badge */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl shadow-lg border border-blue-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 text-lg transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:rotate-12 relative">
            <FiPlay />
            {!loading && alertStats.ongoing > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-blue-700 text-xs font-medium">Ongoing Alerts</p>
            <p className="text-xl font-bold text-blue-800">
              {loading ? <span className="animate-pulse">...</span> : alertStats.ongoing}
            </p>
          </div>
        </div>

        {/* Responded Alerts Badge */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl shadow-lg border border-green-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-green-100 rounded-full text-green-600 text-lg transition-all duration-300 group-hover:bg-green-500 group-hover:text-white group-hover:rotate-12">
            <FiCheckCircle />
          </div>
          <div className="flex-1">
            <p className="text-green-700 text-xs font-medium">Responded</p>
            <p className="text-xl font-bold text-green-800">
              {loading ? <span className="animate-pulse">...</span> : alertStats.responded}
            </p>
          </div>
        </div>

        {/* Referred Alerts Badge */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl shadow-lg border border-indigo-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 text-lg transition-all duration-300 group-hover:bg-indigo-500 group-hover:text-white group-hover:rotate-12 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {!loading && alertStats.referred > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-indigo-700 text-xs font-medium">Referred</p>
            <p className="text-xl font-bold text-indigo-800">
              {loading ? <span className="animate-pulse">...</span> : alertStats.referred}
            </p>
          </div>
        </div>

        {/* Total Alerts Badge */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl shadow-lg border border-red-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-red-100 rounded-full text-red-600 text-lg transition-all duration-300 group-hover:bg-red-500 group-hover:text-white group-hover:rotate-12 relative">
            <FiAlertCircle />
            {!loading && alertStats.total > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-red-700 text-xs font-medium">Total Alerts</p>
            <p className="text-xl font-bold text-red-800">
              {loading ? <span className="animate-pulse">...</span> : alertStats.total}
            </p>
          </div>
        </div>

        {/* Active Locations Badge */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl shadow-lg border border-purple-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600 text-lg transition-all duration-300 group-hover:bg-purple-500 group-hover:text-white group-hover:rotate-12">
            <FiMapPin />
          </div>
          <div className="flex-1">
            <p className="text-purple-700 text-xs font-medium">Locations</p>
            <p className="text-xl font-bold text-purple-800">
              {loading ? <span className="animate-pulse">...</span> : locations.length}
            </p>
          </div>
        </div>

        {/* Responders Available Badge */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl shadow-lg border border-teal-200 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
          <div className="p-3 bg-teal-100 rounded-full text-teal-600 text-lg transition-all duration-300 group-hover:bg-teal-500 group-hover:text-white group-hover:rotate-12 relative">
            <FiActivity />
            {!loading && availableResponders > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-teal-700 text-xs font-medium">Available</p>
            <p className="text-xl font-bold text-teal-800">
              {loading ? <span className="animate-pulse">...</span> : `${availableResponders}/${totalResponders}`}
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

      {/* Enhanced Leaflet Map with Clustering */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">📍 Location Overview</h2>
              <p className="text-sm text-gray-600">Real-time alert locations with clustering</p>
            </div>
          </div>
          
          {/* Map Statistics */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{locations.length} Locations</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-yellow-200">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{alertStats.pending} Pending</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium text-gray-700">{alertStats.ongoing} Ongoing</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{alertStats.responded} Resolved</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-200">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{alertStats.referred} Referred</span>
            </div>
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
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                className="z-0 leaflet-container"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Marker Clustering */}
                <MarkerClusterGroup
                  chunkedLoading
                  iconCreateFunction={(cluster) => {
                    const count = cluster.getChildCount();
                    let className = 'marker-cluster-small';
                    if (count > 10) className = 'marker-cluster-medium';
                    if (count > 20) className = 'marker-cluster-large';
                    
                    return new (window.L || {}).DivIcon({
                      html: `<div><span>${count}</span></div>`,
                      className: `marker-cluster ${className}`,
                      iconSize: new (window.L || {}).Point(40, 40)
                    });
                  }}
                >
                  {locations.map((loc, i) => {
                    if (!loc.lat || !loc.lng) return null;
                    
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
                        key={i} 
                        position={[loc.lat, loc.lng]}
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
                </MarkerClusterGroup>
              </MapContainer>
            </Suspense>
          )}
          
          {/* Enhanced Map Legend */}
          {!loading && leafletReady && (
            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-xl p-4 z-[1000] border border-gray-200 backdrop-blur-sm bg-white/95">
              <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Alert Status Legend
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Ongoing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Resolved</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Referred</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Critical</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default Dashboard;