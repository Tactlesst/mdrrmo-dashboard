'use client';

import { useEffect, useState, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import Select from 'react-select';

export default function AddUserModal({ onClose, role, onAddUser }) {
  const modalRef = useRef();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    dob: '',
    contact: '',
    barangay: '',
    street: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const barangayOptions = [
    'Barangay 1',
    'Barangay 2',
    'Barangay 3',
    'Barangay 4',
    'Barangay 5',
    'Others',
  ].map((b) => ({ label: b, value: b }));

  const streetsByBarangay = {
    'Barangay 1': ['Maple St', 'Palm Dr', 'Cedar Rd'],
    'Barangay 2': ['Oak St', 'Birch Ln'],
    'Barangay 3': ['Pine Ave', 'Elm St'],
    'Barangay 4': ['Acacia Blvd', 'Mango St'],
    'Barangay 5': ['Narra St', 'Mahogany Dr'],
    'Others': ['Custom'],
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName || !formData.lastName) {
      errors.fullName = 'First and last name are required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!/^\d{4} \d{3} \d{4}$/.test(formData.contact)) {
      errors.contact = 'Contact number must be in format 0917 123 4567.';
    }

    if (!formData.barangay) {
      errors.barangay = 'Please select a barangay.';
    }

    if (!formData.street) {
      errors.street = 'Please select a street.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contact') {
      const raw = value.replace(/\D/g, '').slice(0, 11);
      const formatted = raw.replace(/(\d{4})(\d{3})(\d{0,4})/, (_, a, b, c) =>
        c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a
      );
      setFormData((prev) => ({ ...prev, contact: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`
      .trim()
      .replace(/\s+/g, ' ');

    const fullAddress = `${formData.street}, ${formData.barangay}`;

    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fullName,
          address: fullAddress,
          role,
        }),
      });

      if (res.ok) {
        const newUser = await res.json();
        if (onAddUser) onAddUser(newUser);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Something went wrong while saving.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative"
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          onClick={onClose}
        >
          <FiX size={22} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">Add New User</h2>
        <p className="text-sm text-gray-500 mb-6">
          Register a new {role.slice(0, -1)} by filling in the information below.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Middle Name (optional)</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Contact Number</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="e.g. 0917 123 4567"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.contact && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.contact}</p>
            )}
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">Barangay</label>
            <Select
              options={barangayOptions}
              placeholder="Select Barangay"
              value={barangayOptions.find((opt) => opt.value === formData.barangay)}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  barangay: selected?.value || '',
                  street: '',
                }))
              }
              classNamePrefix="react-select"
              className={fieldErrors.barangay ? 'border border-red-500 rounded-md' : ''}
            />
            {fieldErrors.barangay && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.barangay}</p>
            )}
          </div>

          {formData.barangay && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-600 mb-1">Street</label>
              <Select
                options={streetsByBarangay[formData.barangay]?.map((s) => ({
                  label: s,
                  value: s,
                }))}
                placeholder="Select Street"
                value={
                  formData.street
                    ? { label: formData.street, value: formData.street }
                    : null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, street: selected?.value || '' }))
                }
                classNamePrefix="react-select"
                className={fieldErrors.street ? 'border border-red-500 rounded-md' : ''}
              />
              {fieldErrors.street && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.street}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>
    </div>
  );
}
