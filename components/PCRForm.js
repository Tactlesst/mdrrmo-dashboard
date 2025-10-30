"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import { FiX } from "react-icons/fi";
import BodyDiagram3D from "./BodyDiagram3D";
import SignatureCanvas from "react-signature-canvas";

const PCRForm = ({ onClose, initialData = null, onSubmit, createdByType, createdById, imageStatus, readOnly = false }) => {
  const initialFormData = {
    caseType: "",
    alertId: "", // New field to store selected alert ID
    recorder: "",
    date: "",
    patientName: "",
    age: "",
    gender: "",
    category: "Patient",
    bloodPressure: "",
    pr: "",
    rr: "",
    o2sat: "",
    temp: "",
    hospitalTransported: "",
    timeCall: "",
    timeCallPeriod: "AM",
    timeArrivedScene: "",
    timeArrivedScenePeriod: "AM",
    timeLeftScene: "",
    timeLeftScenePeriod: "AM",
    timeArrivedHospital: "",
    timeArrivedHospitalPeriod: "AM",
    ambulanceNo: "",
    homeAddress: "",
    location: "",
    underInfluence: {
      alcohol: false,
      drugs: false,
      unknown: false,
      none: false,
    },
    evacuationCode: {
      black: false,
      red: false,
      yellow: false,
      green: false,
    },
    responseTeam: [],
    contactPerson: "",
    relationship: "",
    relationshipOther: "",
    contactNumber: "",
    doi: "",
    toi: "",
    noi: "",
    poi: {
      brgy: "",
      highway: false,
      residence: false,
      publicBuilding: false,
    },
    lossOfConsciousness: "no",
    chiefComplaints: "",
    interventions: "",
    signsSymptoms: "",
    allergies: "",
    medication: "",
    pastHistory: "",
    lastIntake: "",
    events: "",
    narrative: "",
    driver: "",
    teamLeader: "",
    crew: "",
    receivingHospital: "",
    patientSignature: "",
    witnessSignature: "",
    patientSignatureDate: "",
    witnessSignatureDate: "",
    bodyDiagram: [],
    receivingName: "",
    receivingSignature: "",
    lossOfConsciousnessMinutes: "",
    receivingSignatureDate: "",
  };

  const [formData, setFormData] = useState({
    ...initialFormData,
    ...(initialData || {}),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [caseTypeOptions, setCaseTypeOptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [availableAlerts, setAvailableAlerts] = useState([]); // Alerts for selected caseType
  const [caseTypeLoading, setCaseTypeLoading] = useState(true);
  const [caseTypeError, setCaseTypeError] = useState(null);

  const patientSigRef = useRef(null);
  const witnessSigRef = useRef(null);
  const receivingSigRef = useRef(null);

  // Fetch case type options and alerts from /api/alerts
  useEffect(() => {
    const fetchCaseTypes = async () => {
      setCaseTypeLoading(true);
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) {
          throw new Error("Failed to fetch alert types");
        }
        const data = await response.json();
        console.log("Fetched alerts:", data.alerts);
        setAlerts(data.alerts);
        const types = [...new Set(data.alerts.map(alert => alert.type).filter(type => type && typeof type === "string"))];
        console.log("Unique case type options:", types);
        setCaseTypeOptions(types);
        // Validate initial caseType
        if (initialData?.caseType && !types.includes(initialData.caseType)) {
          console.warn(`Initial caseType "${initialData.caseType}" not in available types: ${types.join(", ")}`);
          setCaseTypeError(`Warning: Case Type "${initialData.caseType}" is not a valid option.`);
        }
        // Set available alerts for initial caseType
        if (initialData?.caseType) {
          const matchingAlerts = data.alerts
            .filter(alert => alert.type === initialData.caseType && alert.address && typeof alert.address === "string")
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setAvailableAlerts(matchingAlerts);
          // If editing, find alert matching initial location
          if (initialData?.location && initialData.alertId) {
            const matchingAlert = matchingAlerts.find(alert => alert.id === initialData.alertId);
            if (matchingAlert) {
              setFormData(prev => ({
                ...prev,
                alertId: matchingAlert.id,
                location: matchingAlert.address,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching case types:", err);
        setCaseTypeError("Failed to load case types. Please try again.");
      } finally {
        setCaseTypeLoading(false);
      }
    };
    fetchCaseTypes();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      console.log("PCRForm initialData:", JSON.stringify(initialData, null, 2));
      // Only update fields that exist in initialData (not undefined)
      const filteredData = Object.entries(initialData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      setFormData(prev => ({
        ...prev,
        ...filteredData,
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Validation for contact number
    if (name === "contactNumber") {
      // Only allow numbers and limit to 11 digits
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      }
      return;
    }

    if (type === "checkbox" && name.includes(".")) {
      const [parentName, childName] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parentName]: {
          ...prev[parentName],
          [childName]: checked,
        },
      }));
    } else if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name.includes(".")) {
      // Handle nested text/select inputs (e.g., poi.brgy)
      const [parentName, childName] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parentName]: {
          ...prev[parentName],
          [childName]: value,
        },
      }));
    } else if (name === "caseType") {
      // Update available alerts for selected caseType
      const matchingAlerts = alerts
        .filter(alert => alert.type === value && alert.address && typeof alert.address === "string")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAvailableAlerts(matchingAlerts);
      
      // Set default alertId and location to the most recent alert
      const defaultAlert = matchingAlerts[0];
      console.log("Selected caseType:", value, "Matching alerts:", matchingAlerts);
      console.log("Default alert:", defaultAlert);
      
      // Extract time from default alert's occurred_at timestamp
      let extractedTime = "";
      
      if (defaultAlert?.occurred_at) {
        try {
          const date = new Date(defaultAlert.occurred_at);
          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          
          // For the time input (24-hour format for HTML input type="time")
          extractedTime = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          console.log("Extracted time from default alert:", extractedTime);
        } catch (error) {
          console.error("Error extracting time from default alert:", error);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        caseType: value,
        alertId: prev.location && prev.caseType === initialData?.caseType ? prev.alertId : defaultAlert?.id || "",
        location: prev.location && prev.caseType === initialData?.caseType ? prev.location : defaultAlert?.address || "",
        timeCall: extractedTime || prev.timeCall,
      }));
    } else if (name === "alertId") {
      // Update location and time based on selected alert
      const selectedAlert = alerts.find(alert => alert.id === value);
      console.log("Selected alertId:", value, "Selected alert:", selectedAlert);
      
      // Extract time from alert's occurred_at timestamp (when incident happened)
      let extractedTime = "";
      
      if (selectedAlert?.occurred_at) {
        try {
          const date = new Date(selectedAlert.occurred_at);
          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          
          // For the time input (24-hour format for HTML input type="time")
          extractedTime = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          console.log("Extracted time from alert:", extractedTime);
        } catch (error) {
          console.error("Error extracting time from alert:", error);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        alertId: value,
        location: selectedAlert?.address || prev.location,
        timeCall: extractedTime || prev.timeCall,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxArrayChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value),
    }));
  };

  const handleBodyDiagramChange = (diagramData) => {
    console.log("PCRForm received bodyDiagram:", diagramData);
    setFormData(prev => ({ ...prev, bodyDiagram: diagramData }));
  };

  const uploadSignature = async (sigRef, fieldName) => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      console.log(`No new ${fieldName} drawn, retaining existing:`, formData[fieldName]);
      return formData[fieldName] || null;
    }
    const dataUrl = sigRef.current.toDataURL("image/png");
    try {
      console.log(`Uploading new ${fieldName}`);
      const response = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      if (!response.ok) {
        throw new Error(`Failed to upload ${fieldName} signature`);
      }
      const { url } = await response.json();
      console.log(`Uploaded ${fieldName} URL:`, url);
      return url;
    } catch (error) {
      console.error(`Error uploading ${fieldName} signature:`, error);
      throw error;
    }
  };

  const formatTimeToAMPM = (time) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return "";
    
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours24, minutes] = time.split(':');
    const hours = parseInt(hours24, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
  };

  const handleGenerateSummary = async () => {
    try {
      setIsSubmitting(true);
      
      // Confirm if there's existing text
      if (formData.narrative && formData.narrative.trim().length > 0) {
        const confirmed = window.confirm(
          'This will replace the current narrative text with an AI-generated summary based on all form fields. Continue?'
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare data for summary generation (exclude current narrative to avoid duplication)
      const summaryData = {
        ...formData,
        narrative: '', // Don't include existing narrative
        timeCall: formatTimeToAMPM(formData.timeCall),
        timeArrivedScene: formatTimeToAMPM(formData.timeArrivedScene),
        timeLeftScene: formatTimeToAMPM(formData.timeLeftScene),
        timeArrivedHospital: formatTimeToAMPM(formData.timeArrivedHospital),
      };

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary } = await response.json();
      
      // REPLACE narrative field with generated summary
      setFormData(prev => ({
        ...prev,
        narrative: summary, // This completely replaces the existing text
      }));

      // Show success message
      alert('✅Summary generated successfully! The narrative has been updated with a comprehensive summary of all form fields.');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('❌ Failed to generate summary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const requiredFields = ["patientName", "date", "recorder"];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const patientSignatureUrl = await uploadSignature(patientSigRef, "patientSignature");
      const witnessSignatureUrl = await uploadSignature(witnessSigRef, "witnessSignature");
      const receivingSignatureUrl = await uploadSignature(receivingSigRef, "receivingSignature");

      const updatedFormData = {
        ...formData,
        timeCall: formatTimeToAMPM(formData.timeCall),
        timeArrivedScene: formatTimeToAMPM(formData.timeArrivedScene),
        timeLeftScene: formatTimeToAMPM(formData.timeLeftScene),
        timeArrivedHospital: formatTimeToAMPM(formData.timeArrivedHospital),
        patientSignature: patientSignatureUrl,
        witnessSignature: witnessSignatureUrl,
        receivingSignature: receivingSignatureUrl,
        createdByType,
        createdById,
        bodyDiagram: Array.isArray(formData.bodyDiagram)
          ? formData.bodyDiagram.filter(
              entry =>
                entry &&
                typeof entry === "object" &&
                entry.bodyPart &&
                typeof entry.bodyPart === "string" &&
                entry.condition &&
                typeof entry.condition === "string"
            )
          : [],
      };

      console.log("PCRForm submitting formData:", JSON.stringify(updatedFormData, null, 2));

      if (onSubmit) {
        await onSubmit(updatedFormData);
      } else {
        const res = await fetch("/api/pcr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Failed to save form");
        }
      }
      setFormData(initialFormData);
      patientSigRef.current?.clear();
      witnessSigRef.current?.clear();
      receivingSigRef.current?.clear();
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = (sigRef, fieldName, dateFieldName) => {
    if (sigRef.current) {
      sigRef.current.clear();
      setFormData(prev => ({
        ...prev,
        [fieldName]: "",
        [dateFieldName]: "",
      }));
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8 border border-gray-200">
        <button
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
          disabled={isSubmitting}
        >
          <FiX size={20} />
        </button>

        <div className="border-b-2 border-blue-600 pb-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-8 px-8 -mt-8 pt-8 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-shrink-0 w-20 h-20">
              <Image src="/Logoo.png" alt="Municipality Logo" width={80} height={80} className="object-contain" priority />
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-gray-700">Republic of the Philippines</p>
              <p className="text-xs font-medium text-gray-700">Province of Misamis Oriental</p>
              <p className="text-xs font-semibold text-gray-800">MUNICIPALITY OF BALINGSAG</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 tracking-tight">PATIENT CARE REPORT</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        {caseTypeError && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{caseTypeError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Case Type:
              </label>
              {caseTypeLoading ? (
                <div className="mt-1 text-sm text-gray-500">Loading case types...</div>
              ) : caseTypeOptions.length === 0 ? (
                <div className="mt-1 text-sm text-yellow-600">No case types available</div>
              ) : (
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                  disabled={isSubmitting || readOnly}
                >
                  <option value="" disabled>Select Case Type</option>
                  {caseTypeOptions.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Alert Location:
              </label>
              {formData.caseType && availableAlerts.length > 0 ? (
                <select
                  name="alertId"
                  value={formData.alertId}
                  onChange={handleChange}
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                  disabled={isSubmitting || readOnly}
                >
                  <option value="" disabled>Select Alert Location</option>
                  {availableAlerts.map(alert => (
                    <option key={alert.id} value={alert.id}>
                      {alert.address} ({new Date(alert.created_at).toLocaleString()})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 text-sm text-gray-500">
                  {formData.caseType ? "No alerts available for this case type" : "Select a case type first"}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Name of Recorder:
              </label>
              <input
                type="text"
                name="recorder"
                value={formData.recorder}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date:
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Name of Patient:
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Location:
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Age:
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                max="150"
                placeholder="0-150"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Gender:
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category:
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="category"
                    value="Driver"
                    checked={formData.category === "Driver"}
                    onChange={handleChange}
                    className="form-radio"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Driver</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="category"
                    value="Passenger"
                    checked={formData.category === "Passenger"}
                    onChange={handleChange}
                    className="form-radio"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Passenger</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="category"
                    value="Patient"
                    checked={formData.category === "Patient"}
                    onChange={handleChange}
                    className="form-radio"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Patient</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                BP:
              </label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleChange}
                placeholder="e.g., 120/80"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                PR (Pulse Rate):
              </label>
              <input
                type="text"
                name="pr"
                value={formData.pr}
                onChange={handleChange}
                placeholder="e.g., 72 bpm"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                RR (Respiratory Rate):
              </label>
              <input
                type="text"
                name="rr"
                value={formData.rr}
                onChange={handleChange}
                placeholder="e.g., 16 breaths/min"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                O2SAT (Oxygen Saturation):
              </label>
              <input
                type="text"
                name="o2sat"
                value={formData.o2sat}
                onChange={handleChange}
                placeholder="e.g., 98%"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Temperature:
              </label>
              <input
                type="text"
                name="temp"
                value={formData.temp}
                onChange={handleChange}
                placeholder="e.g., 37°C or 98.6°F"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hospital Transported To:
              </label>
              <input
                type="text"
                name="hospitalTransported"
                value={formData.hospitalTransported}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time of Call:
              </label>
              <input
                type="time"
                name="timeCall"
                value={formData.timeCall}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time Arrived at Scene:
              </label>
              <input
                type="time"
                name="timeArrivedScene"
                value={formData.timeArrivedScene}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time Left Scene:
              </label>
              <input
                type="time"
                name="timeLeftScene"
                value={formData.timeLeftScene}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Home Address:
              </label>
              <input
                type="text"
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time Arrived at Hospital:
              </label>
              <input
                type="time"
                name="timeArrivedHospital"
                value={formData.timeArrivedHospital}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ambulance No:
              </label>
              <input
                type="text"
                name="ambulanceNo"
                value={formData.ambulanceNo}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Under Influence:
              </label>
              <div className="grid grid-cols-2 mt-1">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="underInfluence.alcohol"
                    checked={formData.underInfluence.alcohol}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Alcohol</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="underInfluence.drugs"
                    checked={formData.underInfluence.drugs}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Drugs</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="underInfluence.unknown"
                    checked={formData.underInfluence.unknown}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Unknown</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="underInfluence.none"
                    checked={formData.underInfluence.none}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">None</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Evaluation Code:
              </label>
              <div className="grid grid-cols-2 mt-1">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="evacuationCode.black"
                    checked={formData.evacuationCode.black}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Black</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="evacuationCode.red"
                    checked={formData.evacuationCode.red}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Red</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="evacuationCode.yellow"
                    checked={formData.evacuationCode.yellow}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Yellow</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="evacuationCode.green"
                    checked={formData.evacuationCode.green}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Green</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Response Team:
              </label>
              <div className="grid grid-cols-2 mt-1">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="responseTeam"
                    value="Team 1"
                    checked={formData.responseTeam.includes("Team 1")}
                    onChange={handleCheckboxArrayChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Team 1</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="responseTeam"
                    value="Team 2"
                    checked={formData.responseTeam.includes("Team 2")}
                    onChange={handleCheckboxArrayChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Team 2</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="responseTeam"
                    value="Team 3"
                    checked={formData.responseTeam.includes("Team 3")}
                    onChange={handleCheckboxArrayChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Team 3</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Person:
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Relationship:
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              >
                <option value="">Select Relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Grandfather">Grandfather</option>
                <option value="Aunt">Aunt</option>
                <option value="Uncle">Uncle</option>
                <option value="Cousin">Cousin</option>
                <option value="Nephew">Nephew</option>
                <option value="Niece">Niece</option>
                <option value="Friend">Friend</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Guardian">Guardian</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Other">Other</option>
              </select>
              {formData.relationship === "Other" && (
                <input
                  type="text"
                  name="relationshipOther"
                  value={formData.relationshipOther}
                  onChange={handleChange}
                  placeholder="Please specify relationship"
                  className="mt-2 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                  disabled={isSubmitting || readOnly}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Number:
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="09XXXXXXXXX"
                maxLength="11"
                pattern="[0-9]{11}"
                title="Please enter exactly 11 digits"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
              {formData.contactNumber && formData.contactNumber.length !== 11 && (
                <p className="text-xs text-red-500 mt-1">Contact number must be exactly 11 digits</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                DOI:
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                TOI:
              </label>
              <input
                type="text"
                name="toi"
                value={formData.toi}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                NOI:
              </label>
              <input
                type="text"
                name="noi"
                value={formData.noi}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                POI:
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="poi.brgy"
                  value={formData.poi.brgy}
                  onChange={handleChange}
                  placeholder="Brgy"
                  className="block w-full border-gray-300 rounded-md shadow-sm text-sm mb-1"
                  disabled={isSubmitting || readOnly}
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="poi.highway"
                    checked={formData.poi.highway}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Highway/Road</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="poi.residence"
                    checked={formData.poi.residence}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Residence</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="poi.publicBuilding"
                    checked={formData.poi.publicBuilding}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Public Building/Place</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Loss of Consciousness:
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="lossOfConsciousness"
                    value="yes"
                    checked={formData.lossOfConsciousness === "yes"}
                    onChange={handleChange}
                    className="form-radio"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="lossOfConsciousness"
                    value="no"
                    checked={formData.lossOfConsciousness === "no"}
                    onChange={handleChange}
                    className="form-radio"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">No</span>
                </label>
                {formData.lossOfConsciousness === "yes" && (
                  <input
                    type="text"
                    name="lossOfConsciousnessMinutes"
                    placeholder="Minutes"
                    value={formData.lossOfConsciousnessMinutes}
                    onChange={handleChange}
                    className="w-24 border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting || readOnly}
                  />
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Chief Complaint/s:
              </label>
              <input
                type="text"
                name="chiefComplaints"
                value={formData.chiefComplaints}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Interventions:
              </label>
              <input
                type="text"
                name="interventions"
                value={formData.interventions}
                onChange={handleChange}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">History</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    SIGNS & SYMPTOMS:
                  </label>
                  <input
                    type="text"
                    name="signsSymptoms"
                    value={formData.signsSymptoms}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    ALLERGIES:
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    MEDICATION:
                  </label>
                  <input
                    type="text"
                    name="medication"
                    value={formData.medication}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    PAST HISTORY:
                  </label>
                  <input
                    type="text"
                    name="pastHistory"
                    value={formData.pastHistory}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    LAST INTAKE:
                  </label>
                  <input
                    type="text"
                    name="lastIntake"
                    value={formData.lastIntake}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    EVENTS:
                  </label>
                  <input
                    type="text"
                    name="events"
                    value={formData.events}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                  Narrative of the Incident
                </h3>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Summary
                  </button>
                )}
              </div>
              <textarea
                name="narrative"
                value={formData.narrative}
                onChange={handleChange}
                rows="12"
                placeholder="Click 'Generate Summary' to automatically create a narrative based on the form data, or type your own..."
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                disabled={isSubmitting || readOnly}
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                ADDITIONAL NOTES
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    DRIVER:
                  </label>
                  <input
                    type="text"
                    name="driver"
                    value={formData.driver}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    TEAM LEADER:
                  </label>
                  <input
                    type="text"
                    name="teamLeader"
                    value={formData.teamLeader}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    CREW:
                  </label>
                  <input
                    type="text"
                    name="crew"
                    value={formData.crew}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    RECEIVING HOSPITAL
                  </h3>
                  <input
                    type="text"
                    name="receivingHospital"
                    value={formData.receivingHospital}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    NAME:
                  </label>
                  <input
                    type="text"
                    name="receivingName"
                    value={formData.receivingName}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    SIGNATURE:
                  </label>
                  {formData.receivingSignature && (
                    <div className="mt-1">
                      {imageStatus?.receivingSignature?.error ? (
                        <span className="text-red-600">
                          {imageStatus.receivingSignature.error}
                        </span>
                      ) : imageStatus?.receivingSignature?.loaded ? (
                        <img
                          src={formData.receivingSignature}
                          alt="Current Receiving Signature"
                          className="h-24 object-contain border rounded"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span className="text-gray-500">Loading signature...</span>
                      )}
                    </div>
                  )}
                  <SignatureCanvas
                    ref={receivingSigRef}
                    penColor="black"
                    canvasProps={{
                      className: "border border-gray-300 rounded-md w-full h-24 mt-2",
                    }}
                    onEnd={() =>
                      setFormData(prev => ({
                        ...prev,
                        receivingSignature: receivingSigRef.current.toDataURL(),
                        receivingSignatureDate: getCurrentDate(),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => clearSignature(receivingSigRef, "receivingSignature", "receivingSignatureDate")}
                    className="mt-1 text-sm text-blue-600 hover:underline"
                    disabled={isSubmitting || readOnly}
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date:
                  </label>
                  <input
                    type="date"
                    name="receivingSignatureDate"
                    value={formData.receivingSignatureDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
                    disabled={isSubmitting || readOnly}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="border p-4 rounded-md">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Waiver of Treatment / Patient Refusal
                </h3>
                <p className="text-xs italic text-gray-600 mb-4">
                  I acknowledge that I have been informed that my medical
                  condition requires immediate treatment and/or transport to a
                  physician and that with refusing further emergency medical
                  treatment there is a risk of serious injury, illness, or
                  death. Understanding these risks, I hereby release the
                  attending medical personnel, their home agency, and their
                  advising physician from all responsibility regarding any ill
                  effects which may result from this decision.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Patient Signature:
                    </label>
                    {formData.patientSignature && (
                      <div className="mt-1">
                        {imageStatus?.patientSignature?.error ? (
                          <span className="text-red-600">
                            {imageStatus.patientSignature.error}
                          </span>
                        ) : imageStatus?.patientSignature?.loaded ? (
                          <img
                            src={formData.patientSignature}
                            alt="Current Patient Signature"
                            className="h-24 object-contain border rounded"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="text-gray-500">Loading signature...</span>
                        )}
                      </div>
                    )}
                    <SignatureCanvas
                      ref={patientSigRef}
                      penColor="black"
                      canvasProps={{
                        className: "border border-gray-300 rounded-md w-full h-24 mt-2",
                      }}
                      onEnd={() =>
                        setFormData(prev => ({
                          ...prev,
                          patientSignature: patientSigRef.current.toDataURL(),
                          patientSignatureDate: getCurrentDate(),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => clearSignature(patientSigRef, "patientSignature", "patientSignatureDate")}
                      className="mt-1 text-sm text-blue-600 hover:underline"
                      disabled={isSubmitting || readOnly}
                    >
                      Clear Signature
                    </button>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">
                      Witness Signature:
                    </label>
                    {formData.witnessSignature && (
                      <div className="mt-1">
                        {imageStatus?.witnessSignature?.error ? (
                          <span className="text-red-600">
                            {imageStatus.witnessSignature.error}
                          </span>
                        ) : imageStatus?.witnessSignature?.loaded ? (
                          <img
                            src={formData.witnessSignature}
                            alt="Current Witness Signature"
                            className="h-24 object-contain border rounded"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="text-gray-500">Loading signature...</span>
                        )}
                      </div>
                    )}
                    <SignatureCanvas
                      ref={witnessSigRef}
                      penColor="black"
                      canvasProps={{
                        className: "border border-gray-300 rounded-md w-full h-24 mt-2",
                      }}
                      onEnd={() =>
                        setFormData(prev => ({
                          ...prev,
                          witnessSignature: witnessSigRef.current.toDataURL(),
                          witnessSignatureDate: getCurrentDate(),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => clearSignature(witnessSigRef, "witnessSignature", "witnessSignatureDate")}
                      className="mt-1 text-sm text-blue-600 hover:underline"
                      disabled={isSubmitting || readOnly}
                    >
                      Clear Signature
                    </button>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">
                      Date:
                    </label>
                    <input
                      type="date"
                      name="patientSignatureDate"
                      value={formData.patientSignatureDate}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      disabled={isSubmitting || readOnly}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">
                      Date:
                    </label>
                    <input
                      type="date"
                      name="witnessSignatureDate"
                      value={formData.witnessSignatureDate}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      disabled={isSubmitting || readOnly}
                    />
                  </div>
                </div>
              </div>
              <div className="relative mt-4">
                <h3 className="text-sm font-semibold text-gray-800">Body Diagram</h3>
                <BodyDiagram3D
                  onChange={handleBodyDiagramChange}
                  initialData={formData.bodyDiagram}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isSubmitting || readOnly}
            >
              {isSubmitting ? "Saving..." : "Save PCR Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PCRForm;