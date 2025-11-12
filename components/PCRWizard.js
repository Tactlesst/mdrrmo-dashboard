"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
import BodyDiagramSVG from "./BodyDiagramSVG";
import SignatureCanvas from "react-signature-canvas";
import { BasicInfoStep, PatientDetailsStep, MedicalInfoStep, TimelineStep, SignaturesStep } from "./PCRWizardSteps";
import Swal from 'sweetalert2';

const PCRWizard = ({ onClose, initialData = null, onSubmit, createdByType, createdById, imageStatus, readOnly = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const initialFormData = {
    caseType: "",
    alertId: "",
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

  const [caseTypeOptions, setCaseTypeOptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [availableAlerts, setAvailableAlerts] = useState([]);
  const [caseTypeLoading, setCaseTypeLoading] = useState(true);
  const [caseTypeError, setCaseTypeError] = useState(null);

  const patientSigRef = useRef(null);
  const witnessSigRef = useRef(null);
  const receivingSigRef = useRef(null);
  const isInitialized = useRef(false);

  // Fetch case type options and alerts from /api/alerts (only once)
  useEffect(() => {
    const fetchCaseTypes = async () => {
      setCaseTypeLoading(true);
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) {
          throw new Error("Failed to fetch alert types");
        }
        const data = await response.json();
        setAlerts(data.alerts);
        const types = [...new Set(data.alerts.map(alert => alert.type).filter(type => type && typeof type === "string"))];
        setCaseTypeOptions(types);
      } catch (err) {
        console.error("Error fetching case types:", err);
        setCaseTypeError("Failed to load case types. Please try again.");
      } finally {
        setCaseTypeLoading(false);
      }
    };
    fetchCaseTypes();
  }, []); // Empty dependency array - fetch only once

  // Handle initial data setup separately
  useEffect(() => {
    if (initialData?.caseType && caseTypeOptions.length > 0) {
      if (!caseTypeOptions.includes(initialData.caseType)) {
        setCaseTypeError(`Warning: Case Type "${initialData.caseType}" is not a valid option.`);
      }
      
      // Set available alerts for initial case type
      const matchingAlerts = alerts
        .filter(alert => alert.type === initialData.caseType && alert.address && typeof alert.address === "string")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAvailableAlerts(matchingAlerts);
    }
  }, [initialData?.caseType, caseTypeOptions, alerts]);

  // Initialize form data when initialData is available (only once)
  useEffect(() => {
    if (initialData && !isInitialized.current) {
      const filteredData = Object.entries(initialData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {});
      setFormData(prev => ({
        ...prev,
        ...filteredData,
      }));
      isInitialized.current = true;
    }
  }, [initialData]); // Run when initialData changes but only initialize once

  // Signature upload function
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

  // Format time to AM/PM
  const formatTimeToAMPM = (time) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return "";
    
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours24, minutes] = time.split(':');
    const hours = parseInt(hours24, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
  };

  // Generate AI summary function
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
      await Swal.fire({
        icon: 'success',
        title: 'Summary Generated!',
        text: 'The narrative has been updated with a comprehensive summary of all form fields.',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        text: 'Failed to generate summary. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear signature function
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

  // Get current date
  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Handle body diagram changes
  const handleBodyDiagramChange = (diagramData) => {
    console.log("PCRWizard received bodyDiagram:", diagramData);
    setFormData(prev => ({ ...prev, bodyDiagram: diagramData }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const requiredFields = ["caseType"];
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

      console.log("PCRWizard submitting formData:", JSON.stringify(updatedFormData, null, 2));

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
      
      // Clear form and close
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

  // Define wizard steps
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Case type, recorder, and date'
    },
    {
      id: 'patient',
      title: 'Patient Details',
      description: 'Patient information and vitals'
    },
    {
      id: 'medical',
      title: 'Medical Information',
      description: 'Symptoms, history, and body diagram'
    },
    {
      id: 'timeline',
      title: 'Timeline & Transport',
      description: 'Times and hospital information'
    },
    {
      id: 'signatures',
      title: 'Signatures & Review',
      description: 'Final signatures and submission'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl relative max-h-[95vh] border border-gray-200 flex flex-col">
        
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 pt-8">
          <button
            onClick={() => onClose(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md z-10"
            disabled={isSubmitting}
          >
            <FiX size={20} />
          </button>

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
          <h1 className="text-2xl font-bold text-center text-gray-800 tracking-tight mb-4">PATIENT CARE REPORT</h1>
          
          {/* Step Indicator */}
          <div className="flex justify-center items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? <FiCheck size={16} /> : index + 1}
                </div>
                <div className="ml-2 text-xs">
                  <div className={`font-medium ${index === currentStep ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-8 pb-4 overflow-y-auto min-h-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <BasicInfoStep
                formData={formData}
                setFormData={setFormData}
                caseTypeOptions={caseTypeOptions}
                alerts={alerts}
                availableAlerts={availableAlerts}
                setAvailableAlerts={setAvailableAlerts}
                caseTypeLoading={caseTypeLoading}
                caseTypeError={caseTypeError}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
              />
            )}
            
            {currentStep === 1 && (
              <PatientDetailsStep
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
              />
            )}
            
            {currentStep === 2 && (
              <MedicalInfoStep
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
                handleBodyDiagramChange={handleBodyDiagramChange}
              />
            )}
            
            {currentStep === 3 && (
              <TimelineStep
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
                handleGenerateSummary={handleGenerateSummary}
              />
            )}
            
            {currentStep === 4 && (
              <SignaturesStep
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
                clearSignature={clearSignature}
                patientSigRef={patientSigRef}
                witnessSigRef={witnessSigRef}
                receivingSigRef={receivingSigRef}
                getCurrentDate={getCurrentDate}
              />
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentStep === 0 || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <FiChevronLeft size={16} />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              Next
              <FiChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit PCR'}
              <FiCheck size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCRWizard;
