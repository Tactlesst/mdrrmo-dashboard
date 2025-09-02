'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FiUserPlus, FiAlertCircle, FiUsers } from 'react-icons/fi';
import dayjs from 'dayjs';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch alerts
        const alertsRes = await fetch('/api/alerts');
        if (!alertsRes.ok) throw new Error(`Alerts HTTP ${alertsRes.status}`);
        const alertsData = await alertsRes.json();
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

        // Fetch users (Residents)
        const usersRes = await fetch('/api/users?role=Residents');
        if (!usersRes.ok) throw new Error(`Users HTTP ${usersRes.status}`);
        const usersData = await usersRes.json();
        setUsers(usersData);
        setTotalUsers(usersData.length);
        const thisMonth = dayjs().format('YYYY-MM');
        setTotalNewUsers(usersData.filter((user) => dayjs(user.created_at || user.dob).format('YYYY-MM') === thisMonth).length);

        // Fetch alert locations for map
        const locationsRes = await fetch('/api/alerts/locations');
        if (!locationsRes.ok) throw new Error(`Locations HTTP ${locationsRes.status}`);
        const locationsData = await locationsRes.json();
        const locationsArr = locationsData.locations || locationsData;
        setLocations(locationsArr);

        // Fetch responders
        const respondersRes = await fetch('/api/responders');
        if (!respondersRes.ok) throw new Error(`Responders HTTP ${responders.status}`);
        const respondersData = await respondersRes.json();
        const respondersArr = respondersData.responders || respondersData;
        setResponders(respondersArr);
        setTotalResponders(respondersArr.length);

        // Fetch responder sessions for availability
        const sessionsRes = await fetch('/api/responders/sessions');
        if (!sessionsRes.ok) throw new Error(`Sessions HTTP ${sessionsRes.status}`);
        const sessionsData = await sessionsRes.json();
        const sessionsArr = sessionsData.sessions || sessionsData;
        setSessions(sessionsArr);
        const readyResponders = new Set(
          sessionsArr
            .filter((session) => session.is_active && session.status === 'ready to go')
            .map((session) => session.responder_id)
        ).size;
        setAvailableResponders(readyResponders);
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
            <p className="text-2xl font-semibold text-green-600">{loading ? '...' : totalNewUsers}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600 text-xl">
            <FiAlertCircle />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Number of Alerts</p>
            <p className="text-2xl font-semibold text-red-600">{loading ? '...' : alerts.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 text-xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Responders Available</p>
            <p className="text-2xl font-semibold text-blue-600">
              {loading ? '...' : `${availableResponders} / ${totalResponders}`}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600 text-xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-semibold text-purple-600">{loading ? '...' : totalUsers}</p>
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
                onClick={() => setSelectedTab(tab)}
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
            <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading…</div>
          ) : (
            <canvas ref={barChartRef}></canvas>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">🗺️ Location Overview</h2>
        <div className="h-[400px] w-full overflow-hidden rounded-lg">
          <MapContainer center={defaultPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {locations.map((loc, i) => (
              loc.lat && loc.lng && (
                <Marker key={i} position={[loc.lat, loc.lng]}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{loc.type || 'Alert'}</p>
                      <p className="text-sm text-gray-600">Occurred: {loc.occurred_at}</p>
                      <p className="text-sm text-gray-600">Address: {loc.address || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Responder: {loc.responder_name || 'Not Assigned'}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;