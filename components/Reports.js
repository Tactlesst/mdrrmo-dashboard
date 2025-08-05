'use client';

import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import dayjs from 'dayjs';
import { FiAlertCircle, FiUsers } from 'react-icons/fi';
import {
  MdOutlineAccessTime,
  MdOutlinePerson,
  MdOutlineDevices,
  MdOutlinePieChart,
  MdOutlineLocationOn,
} from 'react-icons/md';

// Mock data is retained for parts of the dashboard not covered by the API
const mockData = {
  keyTrends: [
    { label: '# Avg. Daily Sessions', prev: 84, current: 153, change: '+82%' },
    { label: '# Avg. Pageviews', prev: 150, current: 466, change: '+211%' },
    { label: '% Bounce Rate', prev: '58.3%', current: '64.2%', change: '+12%' },
    { label: '% New Sessions', prev: '69.6%', current: '78.2%', change: '+12%' },
    { label: 'Avg. Visit Duration', prev: '3:55', current: '2:42', change: '-30%' },
    { label: 'Pages per Visit', prev: '2.51', current: '2.81', change: '+12%' },
  ],
  sessionsByDevice: {
    labels: ['Tablet', 'Phone', 'Desktop'],
    data: [12, 59, 29],
    colors: ['#3B82F6', '#EF4444', '#10B981'],
    datasets: [
      {
        label: 'Tablet',
        data: [12],
        backgroundColor: '#F59E0B',
      },
      {
        label: 'Phone',
        data: [59],
        backgroundColor: '#EF4444',
      },
      {
        label: 'Desktop',
        data: [29],
        backgroundColor: '#10B981',
      },
    ],
  },
  channelSource: [
    { source: 'Organic Search', percentage: 65.4, color: '#3B82F6' },
    { source: 'Direct', percentage: 17.7, color: '#F59E0B' },
    { source: 'Display (Online Ad)', percentage: 10.1, color: '#EF4444' },
    { source: 'Referral', percentage: 2.0, color: '#10B981' },
    { source: 'Social', percentage: 1.1, color: '#EC4899' },
    { source: 'Email', percentage: 0.4, color: '#6B7280' },
  ],
  socialFollowers: [
    { platform: 'facebook', count: 18.2, color: '#3B82F6' },
    { platform: 'twitter', count: 18.8, color: '#3B82F6' },
    { platform: 'google-plus', count: 15.6, color: '#3B82F6' },
    { platform: 'linkedin', count: 17.3, color: '#3B82F6' },
  ],
  newVsReturning: {
    new: 29,
    returning: 71,
    colors: ['#3B82F6', '#D1D5DB'],
  },
  metroAreas: [
    { state: 'Top States', value: 100 },
    { state: 'Texas', value: 90 },
    { state: 'Florida', value: 85 },
    { state: 'Pennsylvania', value: 80 },
    { state: 'Ohio', value: 75 },
    { state: 'Nevada', value: 70 },
    { state: 'North Carolina', value: 65 },
    { state: 'Georgia', value: 60 },
    { state: 'Tennessee', value: 55 },
    { state: 'New York', value: 50 },
  ],
};

const Header = () => (
  <div className="bg-red-800 p-4 text-white flex justify-between items-center">
    <h2 className="text-xl font-bold">Web Analytics Dashboard Report</h2>
    <p className="text-sm">For Week Ending 5-18-14</p>
  </div>
);

const KeyTrendsTable = ({ trends }) => (
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-bold">Key Stats Trends</h4>
      <div className="flex space-x-2 text-sm text-gray-500">
        <span>Pre-Period</span>
        <span>Current Period</span>
        <span>% Change</span>
      </div>
    </div>
    <div className="border-t border-gray-200">
      {trends.map((trend, index) => (
        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
          <span className="text-gray-700">{trend.label}</span>
          <div className="flex space-x-4 text-sm text-gray-600">
            <span className="w-20 text-right">{trend.prev}</span>
            <span className="w-20 text-right">{trend.current}</span>
            <span
              className={`font-semibold w-16 text-right ${
                trend.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DonutChart = ({ data, title, labels, colors }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current;
    if (!ctx) return;

    const chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            hoverOffset: 4,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
        },
        cutout: '70%',
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [data, labels, colors]);

  return (
    <div className="w-full h-full relative flex flex-col justify-center items-center">
      <div className="absolute text-center">
        <h4 className="text-xs font-bold">{title}</h4>
      </div>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

const ChannelSourceBarChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current;
    if (!ctx) return;

    const chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.source),
        datasets: [
          {
            data: data.map((d) => d.percentage),
            backgroundColor: data.map((d) => d.color),
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x}%`,
            },
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#374151',
            },
          },
        },
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [data]);

  return <canvas ref={chartRef} />;
};

const SocialFollowersChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current;
    if (!ctx) return;

    const chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['FB', 'TW', 'G+', 'IN'],
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: data.map((d) => d.color),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}K`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6B7280',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB',
            },
            ticks: {
              color: '#6B7280',
              callback: (value) => `${value}K`,
            },
          },
        },
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [data]);

  return <canvas ref={chartRef} />;
};

const LineChart = ({ data, view }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current;
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: `Alerts (${view})`,
            data: data.map((d) => d.count),
            backgroundColor: '#8B0000',
            borderColor: '#8B0000',
            fill: 'origin',
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6B7280',
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB',
            },
            ticks: {
              color: '#6B7280',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data, view]);

  return <canvas ref={chartRef} />;
};

const MapPlaceholder = () => (
  <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
    <p>Map Placeholder</p>
  </div>
);

const AnalyticsReport = () => {
  const [rawAlertTrends, setRawAlertTrends] = useState([]);
  const [processedAlertTrends, setProcessedAlertTrends] = useState([]);
  const [view, setView] = useState('daily');
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [preDailyAverage, setPreDailyAverage] = useState(0);

  // Group trends based on the selected view (daily, weekly, monthly)
  const groupTrends = (data, type) => {
    const grouped = {};
    const format = (d) => {
      if (type === 'weekly') return dayjs(d).startOf('week').format('YYYY-MM-DD');
      if (type === 'monthly') return dayjs(d).startOf('month').format('YYYY-MM-DD');
      return dayjs(d).format('YYYY-MM-DD');
    };

    data.forEach(({ day, alert_count }) => {
      const key = format(day);
      if (!grouped[key]) {
        grouped[key] = { count: 0 };
      }
      grouped[key].count += alert_count;
    });

    return Object.entries(grouped).map(([key, val]) => ({
      label: key,
      count: val.count,
    }));
  };

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/analytics/alert-trends');
        const data = await res.json();

        if (data.alertsPerDay) {
          const formattedData = data.alertsPerDay.map(item => ({
            day: item.day,
            alert_count: parseInt(item.alert_count, 10),
          }));
          setRawAlertTrends(formattedData);

          const total = formattedData.reduce((acc, curr) => acc + curr.alert_count, 0);
          setTotalAlerts(total);
          
          const avg = formattedData.length > 0 ? total / formattedData.length : 0;
          setPreDailyAverage(Math.round(avg));
        }

      } catch (error) {
        console.error('Failed to fetch alert trends', error);
      }
    };

    fetchTrends();
  }, []);

  useEffect(() => {
    if (rawAlertTrends.length > 0) {
      const groupedData = groupTrends(rawAlertTrends, view);
      setProcessedAlertTrends(groupedData);
    }
  }, [rawAlertTrends, view]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Top Banner with Report Title and Date */}
      <Header />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Top Section - Key Stats & Devices (Still using mock data) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
              <KeyTrendsTable trends={mockData.keyTrends} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl shadow-lg flex-1">
                <h4 className="font-bold mb-2">% Sessions By Device</h4>
                <div className="flex h-32 items-center">
                  <div className="w-1/2 h-full relative">
                    <DonutChart
                      data={mockData.sessionsByDevice.data}
                      labels={mockData.sessionsByDevice.labels}
                      colors={mockData.sessionsByDevice.colors}
                      title="%"
                    />
                  </div>
                  <div className="w-1/2 space-y-2 text-sm ml-4">
                    {mockData.sessionsByDevice.labels.map((label, index) => (
                      <div key={index} className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: mockData.sessionsByDevice.colors[index],
                          }}
                        ></span>
                        <span className="text-gray-700">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-lg flex-1">
                <h4 className="font-bold mb-2">% International</h4>
                <div className="flex h-32 items-center">
                  <div className="w-1/2 h-full relative">
                    <DonutChart
                      data={[25, 75]}
                      labels={['International', 'Domestic']}
                      colors={['#8B0000', '#D1D5DB']}
                      title="25%"
                    />
                  </div>
                  <div className="w-1/2 space-y-2 text-sm ml-4">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2 bg-[#8B0000]"></span>
                      <span className="text-gray-700">Intl.</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2 bg-[#D1D5DB]"></span>
                      <span className="text-gray-700">Dom.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Alerts Chart with dropdown */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold">Alerts</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Total Alerts = {totalAlerts}</span>
                <select
                  className="p-1 border rounded text-sm text-gray-700"
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="h-64">
              {processedAlertTrends.length > 0 ? (
                <LineChart data={processedAlertTrends} view={view} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Loading chart data...
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Pre Daily Average = {preDailyAverage}
            </div>
          </div>

          {/* Bottom Section - Channel Source & Other Stats (Still using mock data) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg">
              <h4 className="font-bold mb-4">% Channel Source</h4>
              <div className="h-64">
                <ChannelSourceBarChart data={mockData.channelSource} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <h4 className="font-bold mb-4">Other Stats</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-gray-500">bounce.com/...</span> - 2.5%
                </li>
                <li>
                  <span className="text-gray-500">9thofair.com</span> - 2.2%
                </li>
                <li>
                  <span className="text-gray-500">Day of war book</span> - 1.9%
                </li>
                <li>
                  <span className="text-gray-500">Seattle Tacoma</span> - 2.2%
                </li>
                <li>
                  <span className="text-gray-500">Denver</span> - 2.2%
                </li>
                <li>
                  <span className="text-gray-500">Atlanta</span> - 1.9%
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column (Still using mock data) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-blue-800 text-white p-4 rounded-lg">
            <h2 className="text-lg font-bold">Web Analytics Dashboard Report</h2>
            <p className="text-sm">June, 2014</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h4 className="font-bold mb-4">Social Followers (000)</h4>
            <div className="h-40">
              <SocialFollowersChart data={mockData.socialFollowers} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h4 className="font-bold mb-4">% New vs. Returning</h4>
            <div className="flex h-32 items-center">
              <div className="w-1/2 h-full relative">
                <DonutChart
                  data={[mockData.newVsReturning.new, mockData.newVsReturning.returning]}
                  labels={['New', 'Returning']}
                  colors={mockData.newVsReturning.colors}
                  title="29%"
                />
              </div>
              <div className="w-1/2 space-y-2 text-sm ml-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2 bg-[#3B82F6]"></span>
                  <span className="text-gray-700">New</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2 bg-[#D1D5DB]"></span>
                  <span className="text-gray-700">Returning</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h4 className="font-bold mb-4">Top States</h4>
            <ul className="space-y-1 text-sm">
              {mockData.metroAreas.slice(1, 11).map((area, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{index + 1}. {area.state}</span>
                  <span className="text-gray-500">{area.value}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h4 className="font-bold mb-4">Metro Area Density</h4>
            <div className="h-40">
                <MapPlaceholder />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;