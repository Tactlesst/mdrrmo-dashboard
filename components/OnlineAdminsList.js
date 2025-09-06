'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { formatPHDate } from '@/lib/dateUtils';


export default function OnlineAdminsList() {
  const [admins, setAdmins] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // for modal
  const [selectedType, setSelectedType] = useState(null); // admin or responder

  useEffect(() => {
    let intervalId;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admins/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setAdmins(data.admins || []);
        setResponders(data.responders || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-500';
      case 'standby':
        return 'bg-yellow-500';
      case 'ready to go':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const renderUserCard = (user, type) => (
    <div
      key={`${type}-${user.id}`}
      className="border-2 border-gray-500 bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => {
        setSelectedUser(user);
        setSelectedType(type);
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src={user.profile_image_url || user.image_url || '/default-avatar.png'}
          alt="User"
          className="w-12 h-12 rounded-full object-cover border border-gray-300"
        />
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${getStatusColor(user.status)}`} />
          <span className="text-sm text-gray-800 capitalize">{user.status}</span>
        </div>
        {type === 'responder' && user.responder_status && (
          <div className="text-xs text-gray-600">
            <span className="font-medium text-red-600">Responder:</span>{' '}
            {user.responder_status}
          </div>
        )}
      </div>
    </div>
  );

const renderUserModal = () => {
  if (!selectedUser) return null;

  const {
    name,
    email,
    contact,
    dob,
    address,
    profile_image_url,
    image_url,
  } = selectedUser;

  return (
    <div
      className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setSelectedUser(null)} // close on backdrop click
    >
      <div
        className="bg-white rounded-xl border-2 border-gray-500 w-full max-w-md p-6 relative shadow-lg"
        onClick={(e) => e.stopPropagation()} // prevent modal click from closing
      >
        <button
          onClick={() => setSelectedUser(null)}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-600"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={profile_image_url || image_url || '/default-avatar.png'}
            alt="User"
            className="w-24 h-24 rounded-full border border-gray-300 object-cover mb-4"
          />
          <h2 className="text-xl font-bold text-blue-700">{name}</h2>
          <p className="text-gray-600">{email}</p>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-700">
          <p><span className="font-medium text-gray-700">Contact:</span> {contact || 'N/A'}</p>
          <p><span className="font-medium text-gray-700">Date of Birth:</span> {formatPHDate(dob)}</p>
          <p><span className="font-medium text-gray-700">Address:</span> {address || 'N/A'}</p>
          {selectedType === 'responder' && selectedUser.responder_status && (
            <p><span className="font-medium text-gray-700">Responder Status:</span> {selectedUser.responder_status}</p>
          )}
        </div>
      </div>
    </div>
  );
};


  if (loading) return <p className="text-gray-600">Loading status...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-xl">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Admin Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((admin) => renderUserCard(admin, 'admin'))}
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4">Responder Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responders.map((responder) => renderUserCard(responder, 'responder'))}
      </div>

      {renderUserModal()}
    </div>
  );
}
