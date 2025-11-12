"use client";

import React from "react";
import SignatureCanvas from "react-signature-canvas";
import BodyDiagramSVG from "./BodyDiagramSVG";

// Step 1: Basic Information
export const BasicInfoStep = ({ formData, setFormData, caseTypeOptions, alerts, availableAlerts, setAvailableAlerts, caseTypeLoading, caseTypeError, isSubmitting, readOnly }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "caseType") {
      // Update available alerts for selected caseType
      const matchingAlerts = alerts
        .filter(alert => alert.type === value && alert.address && typeof alert.address === "string")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAvailableAlerts(matchingAlerts);
      
      // Set default alertId and location to the most recent alert
      const defaultAlert = matchingAlerts[0];
      
      // Extract time from default alert's occurred_at timestamp
      let extractedTime = "";
      if (defaultAlert?.occurred_at) {
        try {
          const date = new Date(defaultAlert.occurred_at);
          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          extractedTime = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } catch (error) {
          console.error("Error extracting time from default alert:", error);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        caseType: value,
        alertId: defaultAlert?.id || "",
        location: defaultAlert?.address || "",
        timeCall: extractedTime || prev.timeCall,
      }));
    } else if (name === "alertId") {
      // Update location and time based on selected alert
      const selectedAlert = alerts.find(alert => alert.id === value);
      
      // Extract time from alert's occurred_at timestamp
      let extractedTime = "";
      if (selectedAlert?.occurred_at) {
        try {
          const date = new Date(selectedAlert.occurred_at);
          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          extractedTime = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Basic Information</h3>
        <p className="text-gray-600">Enter the case type, recorder information, and date</p>
      </div>

      {caseTypeError && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{caseTypeError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Case Type <span className="text-red-500">*</span>
          </label>
          {caseTypeLoading ? (
            <div className="mt-1 text-sm text-gray-500 p-3 border rounded-lg">Loading case types...</div>
          ) : (
            <select
              name="caseType"
              value={formData.caseType || ""}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
              required
            >
              <option value="">Select Case Type</option>
              {/* Show current case type first if it exists (for edit mode) */}
              {formData.caseType && !caseTypeOptions.includes(formData.caseType) && (
                <option key={`current-${formData.caseType}`} value={formData.caseType}>
                  {formData.caseType} (Current)
                </option>
              )}
              {caseTypeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              {/* Fallback: if no options loaded but we have a case type, show it */}
              {caseTypeOptions.length === 0 && formData.caseType && (
                <option key={`fallback-${formData.caseType}`} value={formData.caseType}>
                  {formData.caseType}
                </option>
              )}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Alert Location
          </label>
          {formData.caseType && availableAlerts.length > 0 ? (
            <select
              name="alertId"
              value={formData.alertId}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
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
            <div className="mt-1 text-sm text-gray-500 p-3 border rounded-lg">
              {formData.caseType ? "No alerts available for this case type" : "Select a case type first"}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name of Recorder
          </label>
          <input
            type="text"
            name="recorder"
            value={formData.recorder}
            onChange={handleChange}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
            disabled={isSubmitting || readOnly}
            placeholder="Enter recorder's name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
            disabled={isSubmitting || readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
            disabled={isSubmitting || readOnly}
            placeholder="Enter incident location"
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Patient Details
export const PatientDetailsStep = ({ formData, setFormData, isSubmitting, readOnly }) => {
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
    } else if (name === "contactNumber") {
      // Only allow numbers and limit to 11 digits
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Patient Details</h3>
        <p className="text-gray-600">Enter patient information and vital signs</p>
      </div>

      {/* Patient Basic Info */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Patient Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name of Patient
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
              placeholder="Enter patient's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="150"
              placeholder="0-150"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <div className="flex items-center space-x-6 mt-2">
              {['Driver', 'Passenger', 'Patient'].map(category => (
                <label key={category} className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={formData.category === category}
                    onChange={handleChange}
                    className="form-radio text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting || readOnly}
                  />
                  <span className="ml-2">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signs */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Vital Signs</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Blood Pressure
            </label>
            <input
              type="text"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              placeholder="e.g., 120/80"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pulse Rate (PR)
            </label>
            <input
              type="text"
              name="pr"
              value={formData.pr}
              onChange={handleChange}
              placeholder="e.g., 72 bpm"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Respiratory Rate (RR)
            </label>
            <input
              type="text"
              name="rr"
              value={formData.rr}
              onChange={handleChange}
              placeholder="e.g., 16 breaths/min"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Oxygen Saturation (O2SAT)
            </label>
            <input
              type="text"
              name="o2sat"
              value={formData.o2sat}
              onChange={handleChange}
              placeholder="e.g., 98%"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="text"
              name="temp"
              value={formData.temp}
              onChange={handleChange}
              placeholder="e.g., 37°C or 98.6°F"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-3"
              disabled={isSubmitting || readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 3: Medical Information
export const MedicalInfoStep = ({ formData, setFormData, isSubmitting, readOnly, handleBodyDiagramChange }) => {
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox" && name.includes(".")) {
      const [parentName, childName] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parentName]: {
          ...prev[parentName],
          [childName]: checked,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Medical Information</h3>
        <p className="text-gray-600">Medical history, symptoms, and conditions</p>
      </div>

      {/* Medical History */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Medical History & Symptoms</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chief Complaints:
            </label>
            <textarea
              name="chiefComplaints"
              value={formData.chiefComplaints}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Describe the main complaints..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Signs & Symptoms:
            </label>
            <textarea
              name="signsSymptoms"
              value={formData.signsSymptoms}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Describe signs and symptoms..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Allergies:
            </label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows="2"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Known allergies..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Medications:
            </label>
            <textarea
              name="medication"
              value={formData.medication}
              onChange={handleChange}
              rows="2"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Current medications..."
            />
          </div>
        </div>

        {/* Under Influence */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Under Influence:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['alcohol', 'drugs', 'unknown', 'none'].map(influence => (
              <label key={influence} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  name={`underInfluence.${influence}`}
                  checked={formData.underInfluence[influence]}
                  onChange={handleChange}
                  className="form-checkbox text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting || readOnly}
                />
                <span className="ml-2 capitalize">{influence}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Evacuation Code */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Evacuation Code:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['black', 'red', 'yellow', 'green'].map(code => (
              <label key={code} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  name={`evacuationCode.${code}`}
                  checked={formData.evacuationCode[code]}
                  onChange={handleChange}
                  className="form-checkbox text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting || readOnly}
                />
                <span className="ml-2 capitalize">{code}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Body Diagram */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Body Diagram</h4>
        <div className="border rounded-lg p-4">
          <BodyDiagramSVG
            onChange={handleBodyDiagramChange}
            initialData={formData.bodyDiagram}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

// Step 4: Timeline & Transport
export const TimelineStep = ({ formData, setFormData, isSubmitting, readOnly, handleGenerateSummary }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Timeline & Transport</h3>
        <p className="text-gray-600">Time records and hospital information</p>
      </div>

      {/* Timeline */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Timeline</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time of Call:
            </label>
            <input
              type="time"
              name="timeCall"
              value={formData.timeCall}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
        </div>
      </div>

      {/* Transport Information */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Transport Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hospital Transported To:
            </label>
            <input
              type="text"
              name="hospitalTransported"
              value={formData.hospitalTransported}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Hospital name..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ambulance No:
            </label>
            <input
              type="text"
              name="ambulanceNo"
              value={formData.ambulanceNo}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Ambulance number..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Driver:
            </label>
            <input
              type="text"
              name="driver"
              value={formData.driver}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Driver name..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Team Leader:
            </label>
            <input
              type="text"
              name="teamLeader"
              value={formData.teamLeader}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Team leader name..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Crew Members:
            </label>
            <input
              type="text"
              name="crew"
              value={formData.crew}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Crew member names..."
            />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-700">Narrative</h4>
          {!readOnly && handleGenerateSummary && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isSubmitting ? 'Generating...' : 'Generate AI Summary'}
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Incident Narrative:
          </label>
          <textarea
            name="narrative"
            value={formData.narrative}
            onChange={handleChange}
            rows="6"
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
            disabled={isSubmitting || readOnly}
            placeholder="Detailed narrative of the incident and response... (or use 'Generate AI Summary' button)"
          />
        </div>
      </div>
    </div>
  );
};

// Step 5: Signatures & Review
export const SignaturesStep = ({ formData, setFormData, isSubmitting, readOnly, clearSignature, patientSigRef, witnessSigRef, receivingSigRef, getCurrentDate }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Signatures & Review</h3>
        <p className="text-gray-600">Final signatures and form submission</p>
      </div>

      {/* Contact Information */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Person:
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Contact person name..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <option value="Parent">Parent</option>
              <option value="Child">Child</option>
              <option value="Sibling">Sibling</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number:
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
              disabled={isSubmitting || readOnly}
              placeholder="Contact number..."
            />
          </div>
        </div>
      </div>

      {/* Form Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-blue-800 mb-4">Form Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Patient:</strong> {formData.patientName || 'Not specified'}
          </div>
          <div>
            <strong>Case Type:</strong> {formData.caseType || 'Not specified'}
          </div>
          <div>
            <strong>Date:</strong> {formData.date || 'Not specified'}
          </div>
          <div>
            <strong>Recorder:</strong> {formData.recorder || 'Not specified'}
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          <strong>⚠️ Important:</strong> Please review all information before submitting. Once submitted, changes may require administrative approval.
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Signatures</h4>
        
        <div className="space-y-6">
          {/* Patient Signature */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Patient Signature:
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {formData.patientSignature && (
                <div className="mb-2">
                  <img 
                    src={formData.patientSignature} 
                    alt="Patient Signature" 
                    className="border border-gray-300 rounded-md w-full h-24"
                  />
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
                    patientSignatureDate: getCurrentDate && getCurrentDate(),
                  }))
                }
              />
              <div className="flex justify-between items-center mt-4">
                <input
                  type="date"
                  name="patientSignatureDate"
                  value={formData.patientSignatureDate}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={isSubmitting || readOnly}
                />
                <button
                  type="button"
                  onClick={() => clearSignature && clearSignature(patientSigRef, "patientSignature", "patientSignatureDate")}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  disabled={isSubmitting || readOnly}
                >
                  Clear Signature
                </button>
              </div>
            </div>
          </div>

          {/* Witness Signature */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Witness Signature:
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {formData.witnessSignature && (
                <div className="mb-2">
                  <img 
                    src={formData.witnessSignature} 
                    alt="Witness Signature" 
                    className="border border-gray-300 rounded-md w-full h-24"
                  />
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
                    witnessSignatureDate: getCurrentDate && getCurrentDate(),
                  }))
                }
              />
              <div className="flex justify-between items-center mt-4">
                <input
                  type="date"
                  name="witnessSignatureDate"
                  value={formData.witnessSignatureDate}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={isSubmitting || readOnly}
                />
                <button
                  type="button"
                  onClick={() => clearSignature && clearSignature(witnessSigRef, "witnessSignature", "witnessSignatureDate")}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  disabled={isSubmitting || readOnly}
                >
                  Clear Signature
                </button>
              </div>
            </div>
          </div>

          {/* Receiving Hospital Signature */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Receiving Hospital Signature:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Receiving Person Name:
                </label>
                <input
                  type="text"
                  name="receivingName"
                  value={formData.receivingName}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={isSubmitting || readOnly}
                  placeholder="Name of receiving person..."
                />
              </div>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {formData.receivingSignature && (
                <div className="mb-2">
                  <img 
                    src={formData.receivingSignature} 
                    alt="Receiving Hospital Signature" 
                    className="border border-gray-300 rounded-md w-full h-24"
                  />
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
                    receivingSignatureDate: getCurrentDate && getCurrentDate(),
                  }))
                }
              />
              <div className="flex justify-between items-center mt-4">
                <input
                  type="date"
                  name="receivingSignatureDate"
                  value={formData.receivingSignatureDate}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={isSubmitting || readOnly}
                />
                <button
                  type="button"
                  onClick={() => clearSignature && clearSignature(receivingSigRef, "receivingSignature", "receivingSignatureDate")}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  disabled={isSubmitting || readOnly}
                >
                  Clear Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
