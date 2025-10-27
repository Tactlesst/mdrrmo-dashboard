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
  const [manualAddress, setManualAddress] = useState(true); // Default to manual input

  // Dropdown data
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [streets, setStreets] = useState([]);

  // Selected IDs
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);

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

  // Fetch provinces on mount
  useEffect(() => {
    fetch('/api/addresses/provinces')
      .then(res => res.json())
      .then(setProvinces);
  }, []);

  // Fetch municipalities when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`/api/addresses/municipalities?provinceId=${selectedProvince}`)
        .then(res => res.json())
        .then(setMunicipalities);
    }
  }, [selectedProvince]);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      fetch(`/api/addresses/barangays?municipalityId=${selectedMunicipality}`)
        .then(res => res.json())
        .then(setBarangays);
    }
  }, [selectedMunicipality]);

  // Fetch streets when barangay changes
  useEffect(() => {
    if (selectedBarangay) {
      fetch(`/api/addresses/streets?barangayId=${selectedBarangay}`)
        .then(res => res.json())
        .then(setStreets);
    }
  }, [selectedBarangay]);

  // Auto-generate address
  useEffect(() => {
    if (!manualAddress && selectedProvince && selectedMunicipality && selectedBarangay && selectedStreet) {
      const province = provinces.find(p => p.id === Number(selectedProvince))?.name || '';
      const municipality = municipalities.find(m => m.id === Number(selectedMunicipality))?.name || '';
      const barangay = barangays.find(b => b.id === Number(selectedBarangay))?.name || '';
      const street = streets.find(s => s.id === Number(selectedStreet))?.name || '';

      const fullAddress = `${street}, Brgy. ${barangay}, ${municipality}, ${province}`;
      setFormData(prev => ({ ...prev, address: fullAddress }));
    }
  }, [selectedProvince, selectedMunicipality, selectedBarangay, selectedStreet, manualAddress]);

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

    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.replace(/\s+/g, ' ').trim();

    const payload = {
      id: user.id,
      role,
      name: fullName,
      email: formData.email.trim(),
      contact: formData.contact.trim(),
      dob: user.dob || null,
      address: formData.address.trim(),
    };

    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Failed to update user');
      }

      const { user: updatedUser } = await response.json();
      onSave(updatedUser);
      onClose();
    } catch (error) {
      alert('Failed to update user. ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition"
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit User</h2>

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-700">
          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-2">
            {['First Name', 'Middle Name', 'Last Name'].map((label, i) => (
              <div key={label}>
                <label className="text-gray-500 font-medium">{label}</label>
                <input
                  type="text"
                  value={formData[['firstName', 'middleName', 'lastName'][i]]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [['firstName', 'middleName', 'lastName'][i]]: e.target.value.replace(/^\w|\s\w/g, (c) => c.toUpperCase()),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            ))}
          </div>
          {formErrors.fullName && <p className="text-red-500 text-xs">{formErrors.fullName}</p>}

          {/* Email & Contact */}
          {['Email', 'Contact Number'].map((label, i) => (
            <div key={label}>
              <label className="text-gray-500 font-medium">{label}</label>
              <input
                type={i === 0 ? 'email' : 'text'}
                value={i === 0 ? formData.email : formData.contact}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [i === 0 ? 'email' : 'contact']: i === 1 ? e.target.value.replace(/[^0-9]/g, '') : e.target.value,
                  })
                }
                maxLength={i === 1 ? 11 : undefined}
                placeholder={i === 1 ? 'e.g. 09171234567' : ''}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {formErrors[i === 0 ? 'email' : 'contact'] && (
                <p className="text-red-500 text-xs">{formErrors[i === 0 ? 'email' : 'contact']}</p>
              )}
            </div>
          ))}

          {/* Address Section */}
          <div>
            <label className="text-gray-500 font-medium flex justify-between items-center">
              Full Address
              <button
                type="button"
                onClick={() => setManualAddress(!manualAddress)}
                className="text-blue-600 text-xs underline hover:text-blue-800 transition"
              >
                {manualAddress ? 'Select from Dropdown' : 'Enter Manually'}
              </button>
            </label>

            {manualAddress ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select value={selectedProvince || ''} onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedMunicipality(null);
                  setSelectedBarangay(null);
                  setSelectedStreet(null);
                }} className="border px-3 py-2 rounded-md">
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select value={selectedMunicipality || ''} onChange={(e) => {
                  setSelectedMunicipality(e.target.value);
                  setSelectedBarangay(null);
                  setSelectedStreet(null);
                }} className="border px-3 py-2 rounded-md" disabled={!selectedProvince}>
                  <option value="">Select Municipality</option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select value={selectedBarangay || ''} onChange={(e) => {
                  setSelectedBarangay(e.target.value);
                  setSelectedStreet(null);
                }} className="border px-3 py-2 rounded-md" disabled={!selectedMunicipality}>
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select value={selectedStreet || ''} onChange={(e) => {
                  setSelectedStreet(e.target.value);
                }} className="border px-3 py-2 rounded-md" disabled={!selectedBarangay}>
                  <option value="">Select Street</option>
                  {streets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
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
