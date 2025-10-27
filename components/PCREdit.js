"use client";

import React, { useState, useEffect } from "react";
import PCRForm from "./PCRForm";

const PCREdit = ({ form, onClose }) => {
  const [imageStatus, setImageStatus] = useState({
    patientSignature: { loaded: false, error: null },
    witnessSignature: { loaded: false, error: null },
    receivingSignature: { loaded: false, error: null },
  });
  const [caseTypeError, setCaseTypeError] = useState(null);

  const toNull = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    return value;
  };

  const toIntOrNull = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  };

  const splitTime = (timeString) => {
    if (!timeString || !/\d{2}:\d{2}\s?(AM|PM)/i.test(timeString)) {
      return { time: "", period: "AM" };
    }
    const [time, period] = timeString.split(" ");
    return { time: time.trim(), period: period?.toUpperCase() || "AM" };
  };

  useEffect(() => {
    console.log("PCREdit form data:", JSON.stringify(form, null, 2));
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
            img.crossOrigin = "anonymous";
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

  const uploadSignature = async (signatureData, field) => {
    if (!signatureData || signatureData.startsWith("https://res.cloudinary.com")) {
      console.log(`No new ${field} to upload, retaining existing`);
      return signatureData;
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

  const combineTimeWithPeriod = (time, period) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      console.warn(`Invalid time format: ${time}`);
      return null;
    }
    if (!period || !/^(AM|PM)$/i.test(period)) {
      console.warn(`Invalid period: ${period}`);
      return null;
    }
    return `${time} ${period.toUpperCase()}`;
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

      const patientSignature = await uploadSignature(formData.patientSignature, "patientSignature");
      const witnessSignature = await uploadSignature(formData.witnessSignature, "witnessSignature");
      const receivingSignature = await uploadSignature(formData.receivingSignature, "receivingSignature");

      const cleanedBodyDiagram = Array.isArray(formData.bodyDiagram)
        ? formData.bodyDiagram.filter(
            entry =>
              entry &&
              typeof entry === "object" &&
              entry.bodyPart &&
              typeof entry.bodyPart === "string" &&
              entry.condition &&
              typeof entry.condition === "string"
          )
        : [];

      const transformedData = {
        id: form.id,
        patient_name: formData.patientName,
        date: formData.date,
        location: toNull(formData.location),
        recorder: formData.recorder,
        full_form: {
          case_number: toNull(formData.case_number),
          caseType: toNull(formData.caseType),
          category: toNull(formData.category),
          age: toIntOrNull(formData.age),
          gender: toNull(formData.gender),
          contactNumber: toNull(formData.contactNumber),
          homeAddress: toNull(formData.homeAddress),
          bloodPressure: toNull(formData.bloodPressure),
          pr: toNull(formData.pr), // Keep as string (can include units like "72 bpm")
          rr: toNull(formData.rr), // Keep as string (can include units like "16 breaths/min")
          temp: toNull(formData.temp),
          o2sat: toNull(formData.o2sat),
          poi: {
            brgy: toNull(formData.poi?.brgy),
            highway: !!formData.poi?.highway,
            residence: !!formData.poi?.residence,
            publicBuilding: !!formData.poi?.publicBuilding,
          },
          underInfluence: formData.underInfluence || null,
          evacuationCode: formData.evacuationCode || null,
          responseTeam: formData.responseTeam?.length ? formData.responseTeam : null,
          contactPerson: toNull(formData.contactPerson),
          relationship: toNull(formData.relationship),
          doi: toNull(formData.doi),
          toi: toNull(formData.toi),
          noi: toNull(formData.noi),
          chiefComplaints: toNull(formData.chiefComplaints),
          interventions: toNull(formData.interventions),
          signsSymptoms: toNull(formData.signsSymptoms),
          allergies: toNull(formData.allergies),
          medication: toNull(formData.medication),
          pastHistory: toNull(formData.pastHistory),
          lastIntake: toNull(formData.lastIntake),
          events: toNull(formData.events),
          narrative: toNull(formData.narrative),
          driver: toNull(formData.driver),
          teamLeader: toNull(formData.teamLeader),
          crew: toNull(formData.crew),
          hospitalTransported: toNull(formData.hospitalTransported),
          ambulanceNo: toNull(formData.ambulanceNo),
          timeCall: toNull(combineTimeWithPeriod(formData.timeCall, formData.timeCallPeriod)),
          timeArrivedScene: toNull(combineTimeWithPeriod(formData.timeArrivedScene, formData.timeArrivedScenePeriod)),
          timeLeftScene: toNull(combineTimeWithPeriod(formData.timeLeftScene, formData.timeLeftScenePeriod)),
          timeArrivedHospital: toNull(combineTimeWithPeriod(formData.timeArrivedHospital, formData.timeArrivedHospitalPeriod)),
          patientSignature: toNull(patientSignature),
          witnessSignature: toNull(witnessSignature),
          receivingSignature: toNull(receivingSignature),
          patientSignatureDate: toNull(formData.patientSignatureDate),
          witnessSignatureDate: toNull(formData.witnessSignatureDate),
          receivingSignatureDate: toNull(formData.receivingSignatureDate),
          receivingName: toNull(formData.receivingName),
          bodyDiagram: cleanedBodyDiagram,
          lossOfConsciousness: toNull(formData.lossOfConsciousness),
          lossOfConsciousnessMinutes: toIntOrNull(formData.lossOfConsciousnessMinutes),
        },
      };

      console.log("Submitting transformedData:", JSON.stringify(transformedData, null, 2));

      const response = await fetch(`/api/pcr?id=${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update form");
      }

      onClose(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message);
    }
  };

  const cleanedBodyDiagram = Array.isArray(form.full_form?.bodyDiagram)
    ? form.full_form.bodyDiagram.filter(
        entry =>
          entry &&
          typeof entry === "object" &&
          entry.bodyPart &&
          typeof entry.bodyPart === "string" &&
          entry.condition &&
          typeof entry.condition === "string"
      )
    : [];

  const initialData = {
    case_number: form.full_form?.case_number || "",
    caseType: form.full_form?.caseType || "",
    category: form.full_form?.category || "Patient",
    patientName: form.patient_name || "",
    age: form.full_form?.age || "",
    gender: form.full_form?.gender || "",
    contactNumber: form.full_form?.contactNumber || "",
    homeAddress: form.full_form?.homeAddress || "",
    location: form.location || "",
    recorder: form.recorder || "",
    date: form.date ? form.date.split("T")[0] : "",
    bloodPressure: form.full_form?.bloodPressure || "",
    pr: form.full_form?.pr || "",
    rr: form.full_form?.rr || "",
    temp: form.full_form?.temp || "",
    o2sat: form.full_form?.o2sat || "",
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
    doi: form.full_form?.doi || "",
    toi: form.full_form?.toi || "",
    noi: form.full_form?.noi || "",
    poi: form.full_form?.poi || {
      brgy: "",
      highway: false,
      residence: false,
      publicBuilding: false,
    },
    chiefComplaints: form.full_form?.chiefComplaints || "",
    interventions: form.full_form?.interventions || "",
    signsSymptoms: form.full_form?.signsSymptoms || "",
    allergies: form.full_form?.allergies || "",
    medication: form.full_form?.medication || "",
    pastHistory: form.full_form?.pastHistory || "",
    lastIntake: form.full_form?.lastIntake || "",
    events: form.full_form?.events || "",
    narrative: form.full_form?.narrative || "",
    driver: form.full_form?.driver || "",
    teamLeader: form.full_form?.teamLeader || "",
    crew: form.full_form?.crew || "",
    hospitalTransported: form.full_form?.hospitalTransported || "",
    ambulanceNo: form.full_form?.ambulanceNo || "",
    timeCall: splitTime(form.full_form?.timeCall).time,
    timeCallPeriod: splitTime(form.full_form?.timeCall).period,
    timeArrivedScene: splitTime(form.full_form?.timeArrivedScene).time,
    timeArrivedScenePeriod: splitTime(form.full_form?.timeArrivedScene).period,
    timeLeftScene: splitTime(form.full_form?.timeLeftScene).time,
    timeLeftScenePeriod: splitTime(form.full_form?.timeLeftScene).period,
    timeArrivedHospital: splitTime(form.full_form?.timeArrivedHospital).time,
    timeArrivedHospitalPeriod: splitTime(form.full_form?.timeArrivedHospital).period,
    patientSignature: form.full_form?.patientSignature || "",
    witnessSignature: form.full_form?.witnessSignature || "",
    receivingSignature: form.full_form?.receivingSignature || "",
    patientSignatureDate: form.full_form?.patientSignatureDate || "",
    witnessSignatureDate: form.full_form?.witnessSignatureDate || "",
    receivingSignatureDate: form.full_form?.receivingSignatureDate || "",
    receivingName: form.full_form?.receivingName || "",
    bodyDiagram: cleanedBodyDiagram,
    lossOfConsciousness: form.full_form?.lossOfConsciousness || "no",
    lossOfConsciousnessMinutes: form.full_form?.lossOfConsciousnessMinutes || "",
  };

  console.log("PCREdit initialData:", JSON.stringify(initialData, null, 2));

  return (
    <div>
      {caseTypeError && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded">
          {caseTypeError}
        </div>
      )}
      <PCRForm
        onClose={onClose}
        initialData={initialData}
        onSubmit={handleSubmit}
        imageStatus={imageStatus}
        readOnly={false}
      />
    </div>
  );
};

export default PCREdit;