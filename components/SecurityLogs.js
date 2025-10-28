// components/SecurityLogs.js - Security logs viewer for Settings
import { useState, useEffect } from 'react';
import { FiShield, FiAlertCircle, FiCheckCircle, FiXCircle, FiClock, FiFilter } from 'react-icons/fi';

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter, severityFilter, dateRange, pagination.offset]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/security/my-logs?limit=${pagination.limit}&offset=${pagination.offset}`;
      
      if (eventTypeFilter) url += `&eventType=${eventTypeFilter}`;
      if (severityFilter) url += `&severity=${severityFilter}`;
      
      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('days', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        url += `&startDate=${startDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch security logs');

      const data = await response.json();
      setLogs(data.logs);
      setUserEmail(data.userEmail);
      setPagination(data.pagination);
      setStatistics(data.statistics);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'login_success':
        return <FiCheckCircle className="text-green-500" />;
      case 'login_failed':
        return <FiXCircle className="text-red-500" />;
      case 'logout':
        return <FiClock className="text-blue-500" />;
      case 'validation_failed':
        return <FiAlertCircle className="text-yellow-500" />;
      default:
        return <FiShield className="text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity] || colors.medium}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getEventTypeLabel = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="text-blue-600" />
            Security Activity Log
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your account activity and security events for <strong>{userEmail}</strong>
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.last30Days.reduce((sum, item) => sum + parseInt(item.count), 0)}
                </p>
              </div>
              <FiShield className="text-3xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.last30Days.find(s => s.event_type === 'login_success')?.count || 0}
                </p>
              </div>
              <FiCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.last30Days.find(s => s.event_type === 'login_failed')?.count || 0}
                </p>
              </div>
              <FiXCircle className="text-3xl text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Events</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="logout">Logout</option>
              <option value="validation_failed">Validation Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading security logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <FiShield className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">No security events found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.event_type)}
                          <span className="text-sm font-medium text-gray-900">
                            {getEventTypeLabel(log.event_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate" title={log.details}>
                          {log.details || 'No details'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} events
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
