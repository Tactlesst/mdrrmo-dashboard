"use client";

import React, { useState, useEffect } from "react";
import PCRForm from "./PCRForm";

const PCREdit = ({ form, onClose }) => {
  const [imageStatus, setImageStatus] = useState({
    patientSignature: { loaded: false, error: null },
    witnessSignature: { loaded: false, error: null },
    receivingSignature: { loaded: false, error: null },
  });

  // Helpers
  const toNull = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    return value;
  };

  const toIntOrNull = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Preload and verify Cloudinary images
  useEffect(() => {
    console.log("PCREdit form data:", form); // Debug form data
    const fullForm = form.full_form || {};

    const preloadImages = async () => {
      const images = [
        { field: "patientSignature", url: fullForm.patientSignature },
        { field: "witnessSignature", url: fullForm.witnessSignature },
        { field: "receivingSignature", url: fullForm.receivingSignature },
      ];

      const loadPromises = images.map(({ field, url }) => {
        if (url && url.startsWith("https://res.cloudinary.com")) {
          console.log(`Preloading ${field} image:`, url);
          return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = "anonymous"; // Handle CORS
            img.onload = () => {
              console.log(`${field} image loaded successfully`);
              setImageStatus((prev) => ({
                ...prev,
                [field]: { loaded: true, error: null },
              }));
              resolve();
            };
            img.onerror = () => {
              console.error(`${field} image failed to load:`, url);
              setImageStatus((prev) => ({
                ...prev,
                [field]: { loaded: false, error: "Failed to load image" },
              }));
              resolve();
            };
          });
        }
        console.log(`No valid URL for ${field}:`, url);
        return Promise.resolve();
      });

      await Promise.all(loadPromises);
    };

    preloadImages();
  }, [form]);

  // Upload signature to Cloudinary
  const uploadSignature = async (signatureData, field) => {
    if (!signatureData || signatureData.startsWith("https://res.cloudinary.com")) {
      console.log(`No new ${field} to upload, retaining existing`);
      return signatureData; // Retain existing URL or null
    }
    try {
      console.log(`Uploading new ${field}`);
      const response = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureData }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || `Failed to upload ${field}`);
      }
      const { url } = await response.json();
      console.log(`Uploaded ${field} URL:`, url);
      return url;
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (!formData.patientName) {
        throw new Error("Patient Name is required.");
      }
      if (!formData.date) {
        throw new Error("Date is required.");
      }
      if (!formData.recorder) {
        throw new Error("Recorder is required.");
      }

      let poiType = null;
      if (formData.poi?.highway) poiType = "highway";
      else if (formData.poi?.residence) poiType = "residence";
      else if (formData.poi?.publicBuilding) poiType = "public_building";

      // Upload new signatures if provided, otherwise retain existing
      const patientSignature = await uploadSignature(formData.patientSignature, "patientSignature");
      const witnessSignature = await uploadSignature(formData.witnessSignature, "witnessSignature");
      const receivingSignature = await uploadSignature(formData.receivingSignature, "receivingSignature");

      const transformedData = {
        patient_name: formData.patientName, // Required
        date: formData.date, // Required
        location: toNull(formData.location),
        recorder: formData.recorder, // Required
        full_form: {
          caseNumber: toNull(formData.caseType),
          age: toIntOrNull(formData.age),
          sex: toNull(formData.gender),
          contactNumber: toNull(formData.contactNumber),
          address: toNull(formData.homeAddress),
          poiType: toNull(poiType),
          poiDetails: {
            brgy: toNull(formData.poi?.brgy),
            highway: !!formData.poi?.highway,
            residence: !!formData.poi?.residence,
            publicBuilding: !!formData.poi?.publicBuilding,
          },
          vitals: {
            bloodPressure: toNull(formData.bloodPressure),
            pulseRate: toIntOrNull(formData.pr),
            respiratoryRate: toIntOrNull(formData.rr),
            temperature: toNull(formData.temp),
            oxygenSaturation: toNull(formData.o2sat),
            gcsEye: toIntOrNull(formData.gcs_eye),
            gcsVerbal: toIntOrNull(formData.gcs_verbal),
            gcsMotor: toIntOrNull(formData.gcs_motor),
          },
          historyPresentIllness: toNull(formData.chiefComplaints),
          pastMedicalHistory: toNull(formData.pastHistory),
          medications: toNull(formData.medication),
          allergies: toNull(formData.allergies),
          bodyDiagram:
            formData.bodyDiagram && Object.keys(formData.bodyDiagram).length > 0
              ? Object.keys(formData.bodyDiagram).filter(
                  (key) => formData.bodyDiagram[key]
                )
              : null,
          waiverSigned: patientSignature || witnessSignature ? true : null,
          category: toNull(formData.category),
          hospitalTransported: toNull(formData.hospitalTransported),
          timeCall: toNull(formData.timeCall),
          timeArrivedScene: toNull(formData.timeArrivedScene),
          timeLeftScene: toNull(formData.timeLeftScene),
          timeArrivedHospital: toNull(formData.timeArrivedHospital),
          ambulanceNo: toNull(formData.ambulanceNo),
          underInfluence: formData.underInfluence || null,
          evacuationCode: formData.evacuationCode || null,
          responseTeam: formData.responseTeam?.length ? formData.responseTeam : null,
          contactPerson: toNull(formData.contactPerson),
          relationship: toNull(formData.relationship),
          doi: toNull(formData.doi),
          toi: toNull(formData.toi),
          noi: toNull(formData.noi),
          lossOfConsciousness: toNull(formData.lossOfConsciousness),
          lossOfConsciousnessMinutes: toIntOrNull(formData.lossOfConsciousnessMinutes),
          chiefComplaints: toNull(formData.chiefComplaints),
          interventions: toNull(formData.interventions),
          signsSymptoms: toNull(formData.signsSymptoms),
          lastIntake: toNull(formData.lastIntake),
          events: toNull(formData.events),
          narrative: toNull(formData.narrative),
          driver: toNull(formData.driver),
          teamLeader: toNull(formData.teamLeader),
          crew: toNull(formData.crew),
          receivingHospital: toNull(formData.receivingHospital),
          patientSignature: toNull(patientSignature),
          witnessSignature: toNull(witnessSignature),
          receivingSignature: toNull(receivingSignature),
          patientSignatureDate: toNull(formData.patientSignatureDate),
          witnessSignatureDate: toNull(formData.witnessSignatureDate),
          receivingSignatureDate: toNull(formData.receivingSignatureDate),
          receivingName: toNull(formData.receivingName),
        },
      };

      console.log("Submitting transformedData:", transformedData);

      const response = await fetch(`/api/pcr/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update form");
      }

      onClose(true); // Trigger refresh
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message);
      throw error;
    }
  };

  // Map DB format to PCRForm expected props
  const initialData = {
    caseType: form.full_form?.caseNumber || "",
    recorder: form.recorder || "",
    date: form.date ? form.date.split("T")[0] : "",
    patientName: form.patient_name || "",
    age: form.full_form?.age || "",
    gender: form.full_form?.sex || "",
    category: form.full_form?.category || "Patient",
    bloodPressure: form.full_form?.vitals?.bloodPressure || "",
    pr: form.full_form?.vitals?.pulseRate || "",
    rr: form.full_form?.vitals?.respiratoryRate || "",
    o2sat: form.full_form?.vitals?.oxygenSaturation || "",
    temp: form.full_form?.vitals?.temperature || "",
    hospitalTransported: form.full_form?.hospitalTransported || "",
    timeCall: form.full_form?.timeCall || "",
    timeArrivedScene: form.full_form?.timeArrivedScene || "",
    timeLeftScene: form.full_form?.timeLeftScene || "",
    timeArrivedHospital: form.full_form?.timeArrivedHospital || "",
    ambulanceNo: form.full_form?.ambulanceNo || "",
    homeAddress: form.full_form?.address || "",
    location: form.location || "",
    underInfluence: form.full_form?.underInfluence || {
      alcohol: false,
      drugs: false,
      unknown: false,
      none: false,
    },
    evacuationCode: form.full_form?.evacuationCode || {
      black: false,
      red: false,
      yellow: false,
      green: false,
    },
    responseTeam: form.full_form?.responseTeam || [],
    contactPerson: form.full_form?.contactPerson || "",
    relationship: form.full_form?.relationship || "",
    contactNumber: form.full_form?.contactNumber || "",
    doi: form.full_form?.doi || "",
    toi: form.full_form?.toi || "",
    noi: form.full_form?.noi || "",
    poi: form.full_form?.poiDetails || {
      brgy: "",
      highway: false,
      residence: false,
      publicBuilding: false,
    },
    lossOfConsciousness: form.full_form?.lossOfConsciousness || "no",
    lossOfConsciousnessMinutes: form.full_form?.lossOfConsciousnessMinutes || "",
    chiefComplaints: form.full_form?.chiefComplaints || form.full_form?.historyPresentIllness || "",
    interventions: form.full_form?.interventions || "",
    signsSymptoms: form.full_form?.signsSymptoms || "",
    allergies: form.full_form?.allergies || "",
    medication: form.full_form?.medications || "",
    pastHistory: form.full_form?.pastMedicalHistory || "",
    lastIntake: form.full_form?.lastIntake || "",
    events: form.full_form?.events || "",
    narrative: form.full_form?.narrative || "",
    driver: form.full_form?.driver || "",
    teamLeader: form.full_form?.teamLeader || "",
    crew: form.full_form?.crew || "",
    receivingHospital: form.full_form?.receivingHospital || "",
    patientSignature: form.full_form?.patientSignature || "",
    witnessSignature: form.full_form?.witnessSignature || "",
    patientSignatureDate: form.full_form?.patientSignatureDate || "",
    witnessSignatureDate: form.full_form?.witnessSignatureDate || "",
    receivingName: form.full_form?.receivingName || "",
    receivingSignature: form.full_form?.receivingSignature || "",
    receivingSignatureDate: form.full_form?.receivingSignatureDate || "",
    bodyDiagram: (form.full_form?.bodyDiagram || []).reduce(
      (acc, part) => ({ ...acc, [part]: true }),
      {}
    ),
  };

  return (
    <PCRForm
      onClose={onClose}
      initialData={initialData}
      onSubmit={handleSubmit}
      imageStatus={imageStatus}
    />
  );
};

export default PCREdit;