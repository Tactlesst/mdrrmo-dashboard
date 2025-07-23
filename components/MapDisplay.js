'use client';

import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FiUserPlus, FiAlertCircle, FiUsers } from 'react-icons/fi';

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

  const totalResponders = 10;
  const availableResponders = 7;

  const dailyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    newUsers: [5, 8, 6, 7, 10, 4, 3],
    alerts: [1, 2, 3, 1, 4, 0, 2],
  };

  const weeklyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    newUsers: [45, 50, 55, 60],
    alerts: [10, 15, 20, 25],
  };

  const monthlyData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    newUsers: [120, 150, 180, 200, 220, 250, 270, 260, 240, 230, 210, 190],
    alerts: [30, 45, 60, 70, 85, 90, 100, 110, 105, 95, 80, 70],
  };

  const getChartData = () => {
    if (selectedTab === 'Daily') return dailyData;
    if (selectedTab === 'Weekly') return weeklyData;
    return monthlyData;
  };

  const chartColors = {
    users: '#3B82F6',
    alerts: '#EF4444',
  };

  useEffect(() => {
    const ctx = barChartRef.current?.getContext('2d');
    if (!ctx) return;

    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    const chartData = getChartData();

    barChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'New Users',
            data: chartData.newUsers,
            backgroundColor: chartColors.users,
            borderRadius: 6,
          },
          {
            label: 'Alerts',
            data: chartData.alerts,
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

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [selectedTab]);

  const position = [8.8167, 124.8155];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600 text-xl">
            <FiUserPlus />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total New Users</p>
            <p className="text-2xl font-semibold text-green-600">+320</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600 text-xl">
            <FiAlertCircle />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Number of Alerts</p>
            <p className="text-2xl font-semibold text-red-600">+30</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 text-xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Responders Available</p>
            <p className="text-2xl font-semibold text-blue-600">
              {availableResponders} / {totalResponders}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart with Tabs */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">📊 User & Alert Trends</h2>
          <div className="space-x-2">
            {['Daily', 'Weekly', 'Monthly'].map(tab => (
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
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">🗺️ Location Overview</h2>
        <div className="h-[400px] w-full overflow-hidden rounded-lg">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">Balingasag MDRRMO Office</p>
                  <p className="text-sm text-gray-600">Latitude: {position[0]}</p>
                  <p className="text-sm text-gray-600">Longitude: {position[1]}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
