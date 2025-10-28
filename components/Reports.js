'use client';

import { useEffect, useState, useMemo } from 'react';
import { FiDownload } from 'react-icons/fi';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Dynamically import Leaflet map to avoid SSR issues
const RespondedAlertsMap = dynamic(() => import('./RespondedAlertsMap'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading map...</div>
});

export default function ReportsPage() {
  const [responderLogs, setResponderLogs] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/responders/logs');
        if (!res.ok) throw new Error(`Logs HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setResponderLogs(arr);
      } catch (e) {
        console.error('Failed to fetch responder logs:', e);
        setResponderLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    const fetchAlerts = async () => {
      try {
        // Fetch analytics and alerts in parallel
        const [analyticsRes, alertsRes] = await Promise.all([
          fetch('/api/alerts/analytics'),
          fetch('/api/alerts'),
        ]);

        if (!analyticsRes.ok) throw new Error(`Analytics HTTP ${analyticsRes.status}`);
        if (!alertsRes.ok) throw new Error(`Alerts HTTP ${alertsRes.status}`);

        const [analyticsData, alertsData] = await Promise.all([
          analyticsRes.json(),
          alertsRes.json(),
        ]);

        // Normalize possible shapes
        const rawType =
          analyticsData?.typeStats ??
          analyticsData?.data?.typeStats ??
          analyticsData?.analytics?.byType ??
          [];

        const rawDaily =
          analyticsData?.dailyStats ??
          analyticsData?.data?.dailyStats ??
          analyticsData?.analytics?.byDate ??
          analyticsData?.analytics?.monthlyStats ??
          analyticsData?.monthlyStats ??
          [];

        const normType = Array.isArray(rawType)
          ? rawType.map((r) => ({
              type: r.type ?? r.name ?? 'Unknown',
              total: Number(r.total ?? r.count ?? r.value ?? 0),
            }))
          : [];

        const normDaily = Array.isArray(rawDaily)
          ? rawDaily.map((r) => ({
              date:
                r.date ??
                r.day ??
                r.month ??
                (r.occurred_at ? dayjs(r.occurred_at).format('YYYY-MM-DD') : 'Unknown'),
              total: Number(r.total ?? r.count ?? 0),
            }))
          : [];

        setTypeStats(normType);
        setDailyStats(normDaily);

        // Process alerts
        const alertsArr = alertsData.alerts || alertsData;
        setAlerts(alertsArr.map((alert) => ({
          id: alert.id ?? 'N/A',
          type: alert.type ?? 'Unknown',
          status: alert.status ?? 'N/A',
          occurred_at: alert.occurred_at ? dayjs(alert.occurred_at).format('YYYY-MM-DD HH:mm:ss') : 'Unknown',
          address: alert.address ?? 'N/A',
          resident_name: alert.resident_name ?? 'Unknown User',
          responder_name: alert.responder_name ?? 'Not Assigned',
          responded_at: alert.responded_at ? dayjs(alert.responded_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
          lat: alert.lat,
          lng: alert.lng,
          description: alert.description ?? 'No description provided',
        })));
      } catch (e) {
        console.error('Failed to fetch alerts data:', e);
        setTypeStats([]);
        setDailyStats([]);
        setAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    };

    // Run both fetches in parallel
    Promise.all([fetchLogs(), fetchAlerts()]);
  }, []);

  // Filter responded alerts
  const respondedAlerts = useMemo(() => {
    return alerts.filter((alert) => alert.status === 'Responded');
  }, [alerts]);

  // Aggregate responded alerts by type for chart
  const respondedAlertsByType = useMemo(() => {
    const counts = {};
    respondedAlerts.forEach((alert) => {
      const type = alert.type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
    }));
  }, [respondedAlerts]);

  // Aggregate responded alerts by responder for chart
  const respondedAlertsByResponder = useMemo(() => {
    const counts = {};
    respondedAlerts.forEach((alert) => {
      const responder = alert.responder_name || 'Not Assigned';
      if (responder !== 'Not Assigned') {
        counts[responder] = (counts[responder] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([responder, count]) => ({
      responder,
      count,
    }));
  }, [respondedAlerts]);

  // Aggregate responder actions for chart
  const responderStats = useMemo(() => {
    const counts = {};
    (responderLogs || []).forEach((log) => {
      const name = log?.name ?? 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      actions: count,
    }));
  }, [responderLogs]);

  const exportAlerts = () => {
    const sortedAlerts = [...(alerts || [])].sort((a, b) => {
      const dateA = new Date(a.occurred_at).getTime();
      const dateB = new Date(b.occurred_at).getTime();
      return dateB - dateA;
    });

    const headers = ['ID', 'Type', 'Status', 'Occurred At', 'Address', 'Resident Name', 'Responder Name'];
    const csvRows = [
      headers.join(','),
      ...sortedAlerts.map((alert) =>
        [
          `"${alert.id || 'N/A'}"`,
          `"${alert.type || 'Unknown'}"`,
          `"${alert.status || 'N/A'}"`,
          `"${alert.occurred_at || 'Unknown'}"`,
          `"${alert.address || 'N/A'}"`,
          `"${alert.resident_name || 'Unknown User'}"`,
          `"${alert.responder_name || 'Not Assigned'}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportResponderLogs = () => {
    const headers = ['name', 'action', 'timestamp'];
    const csvRows = [
      headers.join(','),
      ...(Array.isArray(responderLogs) ? responderLogs : []).map((row) =>
        headers.map((f) => `"${(row && row[f]) || ''}"`).join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responder_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportRespondedAlerts = () => {
    const sortedAlerts = [...respondedAlerts].sort((a, b) => {
      const dateA = new Date(a.responded_at).getTime();
      const dateB = new Date(b.responded_at).getTime();
      return dateB - dateA;
    });

    const headers = ['ID', 'Type', 'Address', 'Resident Name', 'Responder Name', 'Responded At', 'Occurred At', 'Coordinates', 'Description'];
    const csvRows = [
      headers.join(','),
      ...sortedAlerts.map((alert) =>
        [
          `"${alert.id || 'N/A'}"`,
          `"${alert.type || 'Unknown'}"`,
          `"${alert.address || 'N/A'}"`,
          `"${alert.resident_name || 'Unknown User'}"`,
          `"${alert.responder_name || 'Not Assigned'}"`,
          `"${alert.responded_at || 'N/A'}"`,
          `"${alert.occurred_at || 'Unknown'}"`,
          `"${alert.lat && alert.lng ? `${alert.lat}, ${alert.lng}` : 'N/A'}"`,
          `"${alert.description || 'No description'}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responded_alerts_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#dc2626', '#f97316', '#2563eb', '#16a34a', '#9333ea'];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reports Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert Analytics */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg text-gray-700">Alert Analytics</h2>
            <button
              onClick={exportAlerts}
              className="flex items-center gap-1 text-sm text-white bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
            >
              <FiDownload /> Export Alerts
            </button>
          </div>
          {/* Alerts by Type (Pie Chart) */}
          <div className="h-56 mb-6">
            {loadingAlerts ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading…</div>
            ) : (typeStats?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No alert data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats}
                    dataKey="total"
                    nameKey="type"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {(typeStats || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Alerts Over Time (Line Chart) */}
          <div className="h-56">
            {loadingAlerts ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading…</div>
            ) : (dailyStats?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No alert data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#dc2626" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Responder Logs & Analytics */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg text-gray-700">Responder Logs</h2>
            <button
              onClick={exportResponderLogs}
              className="flex items-center gap-1 text-sm text-white bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
            >
              <FiDownload /> Export CSV
            </button>
          </div>

          {/* Quick Analytics */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-gray-100 p-2 rounded">
              <p className="font-semibold">Total Actions</p>
              <p>{Array.isArray(responderLogs) ? responderLogs.length : 0}</p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <p className="font-semibold">Unique Responders</p>
              <p>{new Set((responderLogs || []).map((l) => l?.name)).size}</p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <p className="font-semibold">Most Recent</p>
              <p>
                {(() => {
                  if (!Array.isArray(responderLogs) || responderLogs.length === 0) return 'N/A';
                  const mostRecent = [...responderLogs].reduce((acc, cur) => {
                    const t = new Date(cur?.timestamp ?? 0).getTime();
                    const a = new Date(acc?.timestamp ?? 0).getTime();
                    return t > a ? cur : acc;
                  });
                  return mostRecent?.timestamp ?? 'N/A';
                })()}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <p className="font-semibold">Top Responder</p>
              <p>
                {(() => {
                  if (!Array.isArray(responderLogs) || responderLogs.length === 0) return 'N/A';
                  const counts = {};
                  responderLogs.forEach((l) => {
                    const n = l?.name ?? 'Unknown';
                    counts[n] = (counts[n] || 0) + 1;
                  });
                  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                  return top ? `${top[0]} (${top[1]})` : 'N/A';
                })()}
              </p>
            </div>
          </div>

          {/* Chart: Actions per Responder */}
          <div className="h-64 mb-4">
            {(responderStats?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No responder data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responderStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actions" fill="#775757ff" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Logs List */}
          <div className="h-64 overflow-y-auto text-sm text-gray-600">
            {loadingLogs ? (
              <div className="py-6 text-center text-sm text-gray-500">Loading…</div>
            ) : (responderLogs?.length ?? 0) === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No logs found</div>
            ) : (
              responderLogs.map((log, i) => (
                <div key={i} className="border-b py-2">
                  <p><strong>{log?.name ?? 'Unknown'}</strong> — {log?.action ?? '—'}</p>
                  <p className="text-xs text-gray-500">{log?.timestamp ?? ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map of Responded Alerts */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg text-gray-700">Map of Responded Alerts</h2>
          <button
            onClick={exportRespondedAlerts}
            className="flex items-center gap-1 text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-all shadow-md hover:shadow-lg"
            disabled={respondedAlerts.length === 0}
          >
            <FiDownload /> Export Responded Alerts
          </button>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg overflow-hidden">
          {loadingAlerts ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading map...</div>
          ) : respondedAlerts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">No responded alerts to display</div>
          ) : (
            <RespondedAlertsMap alerts={respondedAlerts} />
          )}
        </div>
      
        {/* Responded Alerts Charts */}
        <div className="mt-4">
          <h3 className="font-semibold text-md text-gray-700 mb-2">
            Responded Alerts Analysis ({respondedAlerts.length} total alerts)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart - Who Responded */}
            <div className="h-64">
              <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">Responders Who Responded</h4>
              {respondedAlertsByResponder.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">No responded alerts</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={respondedAlertsByResponder}
                      dataKey="count"
                      nameKey="responder"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#16a34a"
                      label
                    >
                      {respondedAlertsByResponder.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar Chart - Case Types */}
            <div className="h-64">
              <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">Alerts by Case Type</h4>
              {respondedAlertsByType.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">No responded alerts</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={respondedAlertsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#16a34a" name="Responded Alerts" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}