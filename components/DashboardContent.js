'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Reports from './Reports';
import Users from './Users';
import ManagePCRForm from './ManagePCRForm';
import Logs from './Logs';
import AdminProfileModal from './AdminProfileModal';
import OnlineAdminsList from './OnlineAdminsList'; 

const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });
const Alerts = dynamic(() => import('./Alerts'), { ssr: false });

export default function DashboardContent({ user }) {
    const [admin, setAdmin] = useState({ name: '', email: '', profile_image_url: '' });
  const [activeContent, setActiveContent] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

const handleLogout = async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
};


  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    )},
    { id: 'alerts', name: 'Alerts', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.06 19h13.88c1.54 0 2.5-1.66 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.34.19 3 1.72 3z" />
        </svg>
    )},
    { id: 'users', name: 'Users', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m3-2h4m10 0a2 2 0 100-4 2 2 0 000 4zM13 8a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )},
    { id: 'online-admins', name: 'Online Status', icon: ( // New Tab!
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354l-7 7A.993.993 0 004 12v8a2 2 0 002 2h12a2 2 0 002-2v-8a.993.993 0 00-.354-.707l-7-7a.993.993 0 00-1.392 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4m10 4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4z" />
        </svg>
    )},
    { id: 'manage-pcr-form', name: 'Manage PCR form', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    )},
    { id: 'reports', name: 'Reports', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z" />
        </svg>
    )},
    { id: 'logs', name: 'Logs', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
    )},
  ];

  // Load saved tab
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    setActiveContent(savedTab || 'dashboard');
  }, []);
useEffect(() => {
  const fetchAdmin = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();

      if (data?.admin) {
        setAdmin(data.admin);
      } else {
        console.warn('No admin data found.');
      }
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
    }
  };

  fetchAdmin();
}, []);

  // Save current tab
  useEffect(() => {
    if (activeContent) {
      localStorage.setItem('activeTab', activeContent);
    }
  }, [activeContent]);

  // Collapse sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarCollapsed]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-red-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg px-6 py-4 flex items-center justify-between rounded-b-md">
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MDRRMO Accident Dashboard</h1>
        </div>

        {/* Admin Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center space-x-2 focus:outline-none"
          >
           <span className="text-lg font-medium hidden sm:block">
  {admin.name || 'Admin'}
</span>
 <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
  {admin.profile_image_url ? (
    <img
      src={admin.profile_image_url}
      alt="Admin"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
      {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
    </div>
  )}
</div>

            </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                onClick={() => setShowProfileModal(true)}
              >
                Edit Profile
              </button>

<button
  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  onClick={handleLogout}
>
  Logout
</button>

            </div>
          )}
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1 flex-col md:flex-row p-4 gap-4">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
          className={`bg-white text-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-20 items-center' : 'w-full md:w-64'}
            ${isSidebarCollapsed && 'fixed top-[90px] left-4 z-50 md:static'} md:relative`}
        >
          <div className="flex items-center mb-6 px-2">
            <div className="w-8 h-8 flex items-center justify-center mr-2">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">MDRRMO</h2>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveContent(item.id)}
                    className={`w-full flex items-center py-2 rounded-full transition-all duration-200 ease-in-out
                      ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}
                      ${activeContent === item.id
                        ? 'bg-red-600 text-white font-semibold shadow-inner'
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-700'}`}
                  >
                    <div className={`${isSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</div>
                    {!isSidebarCollapsed && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Collapse Sidebar */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              <svg
                className={`w-5 h-5 ${isSidebarCollapsed ? 'rotate-180' : ''} transition-transform duration-200 ease-in-out`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!isSidebarCollapsed && <span className="ml-2 whitespace-nowrap">Collapse Sidebar</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        {activeContent && (
          <main className="flex-1 bg-white rounded-xl shadow-md p-6 overflow-y-auto max-h-[calc(100vh-7rem)]">
            {activeContent === 'dashboard' && <MapDisplay />}
            {activeContent === 'alerts' && <Alerts />}
            {activeContent === 'users' && <Users />}
            {activeContent === 'online-admins' && <OnlineAdminsList />} {/* New Content Display */}
            {activeContent === 'manage-pcr-form' && <ManagePCRForm />}
            {activeContent === 'reports' && <Reports />}
            {activeContent === 'logs' && <Logs />}
          </main>
        )}
      </div>
            {/* ✅ Proper location for the profile modal */}
      {showProfileModal && (
        <AdminProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}