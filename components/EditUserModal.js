'use client';

import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';

export default function EditUserModal({ user, role, onClose, onSave }) {
  const modalRef = useRef(null);
 
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contact: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});

useEffect(() => {
  if (!user) return;

  const fullName = user.fullName || user.name || '';
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 2 ? nameParts.slice(-1)[0] : nameParts[1] || '';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

  setFormData({
    firstName,
    middleName,
    lastName,
    email: user.email || '',
    contact: user.contact || '',
    address: user.address || '',
  });
}, [user]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const validate = () => {
    const errors = {};
    if (!formData.firstName || !formData.lastName)
      errors.fullName = 'First and last name are required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Invalid email format';
    if (!/^09\d{9}$/.test(formData.contact))
      errors.contact = 'Contact must be 11 digits starting with 09';
    if (!formData.address)
      errors.address = 'Address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async () => {
  if (!validate()) return;

  const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`
    .replace(/\s+/g, ' ')
    .trim();

const payload = {
  id: user.id, // optional, if your update API needs it
  type: role, // 👈 Add this
  name: fullName,
  email: formData.email.trim(),
  contact: formData.contact.trim(),
  dob: user.dob || null,
  address: formData.address.trim(),
};



  console.log('🚀 Sending payload:', payload);

  try {
    const response = await fetch('/api/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const { message } = await response.json();
      throw new Error(message || 'Failed to update user');
    }

    const data = await response.json();
    const updatedUser = data.user;

    // Callbacks
    onSave(updatedUser);
    onClose();

  } catch (error) {
    console.error('Update failed:', error);
    alert('Failed to update user. ' + error.message);
  }
};


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

        <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit User</h2>

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-700">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-gray-500 font-medium">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value.replace(/^\w|\s\w/g, c => c.toUpperCase()) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="text-gray-500 font-medium">Middle Name (optional)</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value.replace(/^\w|\s\w/g, c => c.toUpperCase()) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="text-gray-500 font-medium">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value.replace(/^\w|\s\w/g, c => c.toUpperCase()) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          {formErrors.fullName && <p className="text-red-500 text-xs">{formErrors.fullName}</p>}

          <div>
            <label className="text-gray-500 font-medium">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
          </div>

          <div>
            <label className="text-gray-500 font-medium">Contact Number</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/[^0-9]/g, '') })}
              maxLength={11}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. 09171234567"
            />
            {formErrors.contact && <p className="text-red-500 text-xs">{formErrors.contact}</p>}
          </div>

          <div>
            <label className="text-gray-500 font-medium">Full Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()) })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. 123 Main St, Brgy. San Isidro, Quezon City"
            />
            {formErrors.address && <p className="text-red-500 text-xs">{formErrors.address}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
