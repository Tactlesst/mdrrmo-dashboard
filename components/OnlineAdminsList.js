'use client';

import { useEffect, useState } from 'react';

export default function OnlineAdminsList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch('/api/admins/status');
        if (!res.ok) throw new Error('Failed to fetch admin status');
        const data = await res.json();
        setAdmins(data.admins || []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) return <p className="text-gray-600">Loading admins...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Admin Status</h2>
      <ul className="space-y-4">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={admin.profile_image_url || '/default-avatar.png'}
                alt="Admin"
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div>
                <p className="font-medium text-gray-800">{admin.name}</p>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {admin.status === 'Online' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-600 text-sm font-medium">Online</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-gray-500 text-sm font-medium">Offline</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
