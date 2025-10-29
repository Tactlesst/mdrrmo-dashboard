"use client";

import { useEffect, useState, useRef } from "react";
import { FiX } from "react-icons/fi";

export default function AddUserModal({ onClose, role, onAddUser }) {
  const modalRef = useRef();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    dob: "",
    contact: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [streets, setStreets] = useState([]);
  const [manualAddress, setManualAddress] = useState(true); // Default to manual input
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);

  const fetchProvinces = async () => {
    const res = await fetch("/api/addresses/provinces");
    const data = await res.json();
    setProvinces(data);
  };

  const fetchMunicipalities = async (provinceId) => {
    const res = await fetch(`/api/addresses/municipalities?provinceId=${provinceId}`);
    const data = await res.json();
    setMunicipalities(data);
  };

  const fetchBarangays = async (municipalityId) => {
    const res = await fetch(`/api/addresses/barangays?municipalityId=${municipalityId}`);
    const data = await res.json();
    setBarangays(data);
  };

  const fetchStreets = async (barangayId) => {
    const res = await fetch(`/api/addresses/streets?barangayId=${barangayId}`);
    const data = await res.json();
    setStreets(data);
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince && !manualAddress) {
      fetchMunicipalities(selectedProvince);
      setSelectedMunicipality(null);
      setSelectedBarangay(null);
      setSelectedStreet(null);
    }
  }, [selectedProvince, manualAddress]);

  useEffect(() => {
    if (selectedMunicipality && !manualAddress) {
      fetchBarangays(selectedMunicipality);
      setSelectedBarangay(null);
      setSelectedStreet(null);
    }
  }, [selectedMunicipality, manualAddress]);

  useEffect(() => {
    if (selectedBarangay && !manualAddress) {
      fetchStreets(selectedBarangay);
      setSelectedStreet(null);
    }
  }, [selectedBarangay, manualAddress]);

  // Auto-generate address like EditUserModal
  useEffect(() => {
    if (!manualAddress && selectedProvince && selectedMunicipality && selectedBarangay && selectedStreet) {
      const province = provinces.find((p) => p.id === Number(selectedProvince))?.name || "";
      const municipality = municipalities.find((m) => m.id === Number(selectedMunicipality))?.name || "";
      const barangay = barangays.find((b) => b.id === Number(selectedBarangay))?.name || "";
      const street = streets.find((s) => s.id === Number(selectedStreet))?.name || "";
      const fullAddress = `${street}, Brgy. ${barangay}, ${municipality}, ${province}`;
      console.log("Generated address:", fullAddress); // Debugging log
      setFormData((prev) => ({ ...prev, address: fullAddress }));
    }
  }, [selectedProvince, selectedMunicipality, selectedBarangay, selectedStreet, manualAddress, provinces, municipalities, barangays, streets]);

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName || !formData.lastName) {
      errors.fullName = "First and last name are required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!/^09\d{9}$/.test(formData.contact)) {
      errors.contact = "Contact number must be in format 09171234567.";
    }

    if (!formData.dob) {
      errors.dob = "Date of birth is required.";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      if (dob > today) {
        errors.dob = "Date of birth cannot be in the future.";
      } else if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0))) ) {
        // Check if user is at least 18 years old
        errors.dob = "User must be at least 18 years old.";
      }
    }

    if (!formData.address) {
      errors.address = "Address is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      const raw = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, contact: raw }));
    } else if (name === "address") {
      setFormData((prev) => ({
        ...prev,
        address: value.replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim().replace(/\s+/g, " ");

    const payload = {
      fullName,
      email: formData.email.trim(),
      dob: formData.dob,
      contact: formData.contact.trim(),
      address: formData.address.trim(),
      role,
    };

    console.log("Payload sent to API:", payload); // Debugging log

    try {
      const res = await fetch("/api/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newUser = await res.json();
        console.log("API response:", newUser); // Debugging log
        if (onAddUser) onAddUser(newUser);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add user");
        console.error("API error response:", data); // Debugging log
      }
    } catch (err) {
      console.error("Error saving user:", err);
      setError("Something went wrong while saving.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.fullName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Middle Name (optional)
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Enter middle name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.fullName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              placeholder="Select date of birth"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.dob ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.dob && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.dob}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contact Number
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="e.g. 09171234567"
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 ${
                fieldErrors.contact ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.contact && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.contact}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="text-gray-500 font-medium flex justify-between items-center mb-1">
              Full Address
              <button
                type="button"
                onClick={() => setManualAddress(!manualAddress)}
                className="text-blue-600 text-xs underline hover:text-blue-800 transition"
              >
                {manualAddress ? "Select from Dropdown" : "Enter Manually"}
              </button>
            </label>
            {manualAddress ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Brgy Talusan, Balingasag, Misamis Oriental"
                className={`w-full border rounded-md px-3 py-2 ${
                  fieldErrors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedProvince || ""}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedMunicipality(null);
                    setSelectedBarangay(null);
                    setSelectedStreet(null);
                  }}
                  className={`border px-3 py-2 rounded-md ${
                    fieldErrors.address ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={selectedMunicipality || ""}
                  onChange={(e) => {
                    setSelectedMunicipality(e.target.value);
                    setSelectedBarangay(null);
                    setSelectedStreet(null);
                  }}
                  className={`border px-3 py-2 rounded-md ${
                    fieldErrors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={!selectedProvince}
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={selectedBarangay || ""}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    setSelectedStreet(null);
                  }}
                  className={`border px-3 py-2 rounded-md ${
                    fieldErrors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={!selectedMunicipality}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={selectedStreet || ""}
                  onChange={(e) => setSelectedStreet(e.target.value)}
                  className={`border px-3 py-2 rounded-md ${
                    fieldErrors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={!selectedBarangay}
                >
                  <option value="">Select Street</option>
                  {streets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            {fieldErrors.address && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
            )}
          </div>
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
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save User"}
          </button>
        </div>
      </div>
    </div>
  );
}