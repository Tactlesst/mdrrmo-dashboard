"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import BodyDiagram3D from "./BodyDiagram3D";
import SignatureCanvas from "react-signature-canvas";

const PCRForm = ({ onClose, initialData = null, onSubmit, createdByType, createdById }) => {
  const initialFormData = {
    caseType: "",
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
    timeArrivedScene: "",
    timeLeftScene: "",
    timeArrivedHospital: "",
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
  };

  const [formData, setFormData] = useState({
    ...initialFormData,
    ...(initialData || {}),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const patientSigRef = useRef(null);
  const witnessSigRef = useRef(null);
  const receivingSigRef = useRef(null);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...(initialData || {}),
    }));
  }, [initialData]);

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
    setFormData(prev => ({ ...prev, bodyDiagram: diagramData }));
  };

  const uploadSignature = async (sigRef, fieldName) => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      return formData[fieldName] || null;
    }
    const dataUrl = sigRef.current.toDataURL();
    try {
      const response = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      if (!response.ok) {
        throw new Error(`Failed to upload ${fieldName} signature`);
      }
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error(`Error uploading ${fieldName} signature:`, error);
      throw error;
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
      // Upload signatures and update formData
      const patientSignatureUrl = await uploadSignature(patientSigRef, "patientSignature");
      const witnessSignatureUrl = await uploadSignature(witnessSigRef, "witnessSignature");
      const receivingSignatureUrl = await uploadSignature(receivingSigRef, "receivingSignature");

      const updatedFormData = {
        ...formData,
        patientSignature: patientSignatureUrl,
        witnessSignature: witnessSignatureUrl,
        receivingSignature: receivingSignatureUrl,
        createdByType,
        createdById,
      };

      console.log("Submitting formData:", updatedFormData);

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
        [dateFieldName]: "", // Clear the corresponding date field
      }));
    }
  };

  // Helper to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8">
        <button
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
          disabled={isSubmitting}
        >
          <FiX size={22} />
        </button>

        <div className="flex flex-col items-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold text-center">PATIENT CARE REPORT</h1>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Case Type - Description:
              </label>
              <input
                type="text"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name of Recorder:
              </label>
              <input
                type="text"
                name="recorder"
                value={formData.recorder}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date:
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Name of Patient:
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Location:
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age:
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender:
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">Patient</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                BP:
              </label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleChange}
                placeholder="e.g., 120/80"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                PR:
              </label>
              <input
                type="text"
                name="pr"
                value={formData.pr}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                RR:
              </label>
              <input
                type="text"
                name="rr"
                value={formData.rr}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                O2SAT:
              </label>
              <input
                type="text"
                name="o2sat"
                value={formData.o2sat}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temperature:
              </label>
              <input
                type="text"
                name="temp"
                value={formData.temp}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hospital Transported To:
              </label>
              <input
                type="text"
                name="hospitalTransported"
                value={formData.hospitalTransported}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time of Call:
              </label>
              <input
                type="time"
                name="timeCall"
                value={formData.timeCall}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Arrived at Scene:
              </label>
              <input
                type="time"
                name="timeArrivedScene"
                value={formData.timeArrivedScene}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Left Scene:
              </label>
              <input
                type="time"
                name="timeLeftScene"
                value={formData.timeLeftScene}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Home Address:
              </label>
              <input
                type="text"
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Arrived at Hospital:
              </label>
              <input
                type="time"
                name="timeArrivedHospital"
                value={formData.timeArrivedHospital}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ambulance No:
              </label>
              <input
                type="text"
                name="ambulanceNo"
                value={formData.ambulanceNo}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">None</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">Green</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">Team 3</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Person:
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Relationship:
              </label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number:
              </label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                DOI:
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                TOI:
              </label>
              <input
                type="text"
                name="toi"
                value={formData.toi}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NOI:
              </label>
              <input
                type="text"
                name="noi"
                value={formData.noi}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                  disabled={isSubmitting}
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="poi.highway"
                    checked={formData.poi.highway}
                    onChange={handleChange}
                    className="form-checkbox"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">Public Building/Place</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Chief Complaint/s:
              </label>
              <input
                type="text"
                name="chiefComplaints"
                value={formData.chiefComplaints}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Interventions:
              </label>
              <input
                type="text"
                name="interventions"
                value={formData.interventions}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Narrative of the Incident
              </h3>
              <textarea
                name="narrative"
                value={formData.narrative}
                onChange={handleChange}
                rows="12"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                disabled={isSubmitting}
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
                  <label className="block text-sm font-medium text-gray-700">
                    DRIVER:
                  </label>
                  <input
                    type="text"
                    name="driver"
                    value={formData.driver}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TEAM LEADER:
                  </label>
                  <input
                    type="text"
                    name="teamLeader"
                    value={formData.teamLeader}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CREW:
                  </label>
                  <input
                    type="text"
                    name="crew"
                    value={formData.crew}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    NAME:
                  </label>
                  <input
                    type="text"
                    name="receivingName"
                    value={formData.receivingName}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    SIGNATURE:
                  </label>
                  <SignatureCanvas
                    ref={receivingSigRef}
                    penColor="black"
                    canvasProps={{
                      className: "border border-gray-300 rounded-md w-full h-24",
                    }}
                    onEnd={() =>
                      setFormData(prev => ({
                        ...prev,
                        receivingSignature: receivingSigRef.current.toDataURL(),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => clearSignature(receivingSigRef, "receivingSignature", "")}
                    className="mt-1 text-sm text-blue-600 hover:underline"
                    disabled={isSubmitting}
                  >
                    Clear Signature
                  </button>
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
                    <SignatureCanvas
                      ref={patientSigRef}
                      penColor="black"
                      canvasProps={{
                        className: "border border-gray-300 rounded-md w-full h-24",
                      }}
                      onEnd={() =>
                        setFormData(prev => ({
                          ...prev,
                          patientSignature: patientSigRef.current.toDataURL(),
                          patientSignatureDate: getCurrentDate(), // Set date when signed
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => clearSignature(patientSigRef, "patientSignature", "patientSignatureDate")}
                      className="mt-1 text-sm text-blue-600 hover:underline"
                      disabled={isSubmitting}
                    >
                      Clear Signature
                    </button>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">
                      Witness Signature:
                    </label>
                    <SignatureCanvas
                      ref={witnessSigRef}
                      penColor="black"
                      canvasProps={{
                        className: "border border-gray-300 rounded-md w-full h-24",
                      }}
                      onEnd={() =>
                        setFormData(prev => ({
                          ...prev,
                          witnessSignature: witnessSigRef.current.toDataURL(),
                          witnessSignatureDate: getCurrentDate(), // Set date when signed
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => clearSignature(witnessSigRef, "witnessSignature", "witnessSignatureDate")}
                      className="mt-1 text-sm text-blue-600 hover:underline"
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div className="relative mt-4">
                <h3 className="text-sm font-semibold text-gray-800">Body Diagram</h3>
                <BodyDiagram3D onChange={handleBodyDiagramChange} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isSubmitting}
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