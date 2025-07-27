'use client';

import { useState, useEffect } from 'react';

export default function AdminProfileModal({ onClose }) {
  const [admin, setAdmin] = useState({
    name: '',
    email: '',
    profile_image_url: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ message: '', error: false });

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.admin) {
          setAdmin({
            name: data.admin.name || '',
            email: data.admin.email || '',
            profile_image_url: data.admin.profile_image_url || '',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setStatus({ message: 'Failed to load profile.', error: true });
      });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus({ message: '', error: false });

    const response = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: admin.name,
        profile_image_url: admin.profile_image_url,
        password: newPassword,
      }),
    });

    const data = await response.json();
    setStatus({ message: data.message, error: !response.ok });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-red-700 text-center">Admin Profile</h2>

        {status.message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="mt-1 w-full border rounded px-3 py-2"
              value={admin.name || ''}
              onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-100"
              value={admin.email || ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Image URL</label>
            <input
              type="text"
              className="mt-1 w-full border rounded px-3 py-2"
              value={admin.profile_image_url || ''}
              onChange={(e) =>
                setAdmin({ ...admin, profile_image_url: e.target.value })
              }
            />
            {admin.profile_image_url && (
              <img
                src={admin.profile_image_url}
                alt="Profile"
                className="mt-2 rounded w-24 h-24 object-cover"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}
