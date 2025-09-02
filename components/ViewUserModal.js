"use client";

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export default function ViewUserModal({ user, formatDatePH, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative transition-all"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition"
        >
          <FiX size={22} />
        </button>

        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{user.fullName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 gap-4 text-gray-700 text-sm">
          <div>
            <p className="font-medium text-gray-500">Date of Birth</p>
            <p className="text-gray-800">{formatDatePH(user.dob)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Contact</p>
            <p className="text-gray-800">{user.contact || '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Address</p>
            <p className="text-gray-800">{user.address || '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Created At</p>
            <p className="text-gray-800">{formatDatePH(user.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}