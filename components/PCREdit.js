
"use client";

import React from "react";
import PCRForm from "./PCRForm";

const PCREdit = ({ form, onClose }) => {
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

      const transformedData = {
        patient_name: formData.patientName, // Remove toNull to ensure non-null
        date: formData.date, // Required
        location: toNull(formData.location),
        recorder: toNull(formData.recorder),
        full_form: {
          case_number: toNull(formData.caseType),
          age: toIntOrNull(formData.age),
          sex: toNull(formData.gender),
          contact_number: toNull(formData.contactNumber),
          address: toNull(formData.homeAddress),
          poi_type: toNull(poiType),
          poi_details: {
            brgy: toNull(formData.poi?.brgy),
            highway: !!formData.poi?.highway,
            residence: !!formData.poi?.residence,
            publicBuilding: !!formData.poi?.publicBuilding,
          },
          vitals: {
            blood_pressure: toNull(formData.bloodPressure),
            pulse_rate: toIntOrNull(formData.pr),
            respiratory_rate: toIntOrNull(formData.rr),
            temperature: toNull(formData.temp),
            oxygen_saturation: toNull(formData.o2sat),
            gcs_eye: toIntOrNull(formData.gcs_eye),
            gcs_verbal: toIntOrNull(formData.gcs_verbal),
            gcs_motor: toIntOrNull(formData.gcs_motor),
          },
          history_present_illness: toNull(formData.chiefComplaints),
          past_medical_history: toNull(formData.pastHistory),
          medications: toNull(formData.medication),
          allergies: toNull(formData.allergies),
          body_diagram:
            formData.bodyDiagram && Object.keys(formData.bodyDiagram).length > 0
              ? Object.keys(formData.bodyDiagram).filter(
                  (key) => formData.bodyDiagram[key]
                )
              : null,
          waiver_signed:
            formData.patientSignature || formData.witnessSignature
              ? true
              : null,
          category: toNull(formData.category),
          hospital_transported: toNull(formData.hospitalTransported),
          time_call: toNull(formData.timeCall),
          time_arrived_scene: toNull(formData.timeArrivedScene),
          time_left_scene: toNull(formData.timeLeftScene),
          time_arrived_hospital: toNull(formData.timeArrivedHospital),
          ambulance_no: toNull(formData.ambulanceNo),
          under_influence: formData.underInfluence || null,
          evacuation_code: formData.evacuationCode || null,
          response_team: formData.responseTeam?.length
            ? formData.responseTeam
            : null,
          contact_person: toNull(formData.contactPerson),
          relationship: toNull(formData.relationship),
          doi: toNull(formData.doi),
          toi: toNull(formData.toi),
          noi: toNull(formData.noi),
          loss_of_consciousness: toNull(formData.lossOfConsciousness),
          loss_of_consciousness_minutes: toIntOrNull(
            formData.lossOfConsciousnessMinutes
          ),
          chief_complaints: toNull(formData.chiefComplaints),
          interventions: toNull(formData.interventions),
          signs_symptoms: toNull(formData.signsSymptoms),
          last_intake: toNull(formData.lastIntake),
          events: toNull(formData.events),
          narrative: toNull(formData.narrative),
          driver: toNull(formData.driver),
          team_leader: toNull(formData.teamLeader),
          crew: toNull(formData.crew),
          receiving_hospital: toNull(formData.receivingHospital),
          patient_signature: toNull(formData.patientSignature),
          witness_signature: toNull(formData.witnessSignature),
          patient_signature_date: toNull(formData.patientSignatureDate),
          witness_signature_date: toNull(formData.witnessSignatureDate),
          receiving_name: toNull(formData.receivingName),
          receiving_signature: toNull(formData.receivingSignature),
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

      onClose(true); // Updated to pass true for refresh
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message);
      throw error;
    }
  };

  // Map DB format to PCRForm expected props
  const initialData = {
    caseType: form.full_form?.case_number || "",
    recorder: form.recorder || "",
    date: form.date ? form.date.split("T")[0] : "", // Formatted for <input type="date">
    patientName: form.patient_name || "",
    age: form.full_form?.age || "",
    gender: form.full_form?.sex || "",
    category: form.full_form?.category || "Patient",
    bloodPressure: form.full_form?.vitals?.blood_pressure || "",
    pr: form.full_form?.vitals?.pulse_rate || "",
    rr: form.full_form?.vitals?.respiratory_rate || "",
    o2sat: form.full_form?.vitals?.oxygen_saturation || "",
    temp: form.full_form?.vitals?.temperature || "",
    hospitalTransported: form.full_form?.hospital_transported || "",
    timeCall: form.full_form?.time_call || "",
    timeArrivedScene: form.full_form?.time_arrived_scene || "",
    timeLeftScene: form.full_form?.time_left_scene || "",
    timeArrivedHospital: form.full_form?.time_arrived_hospital || "",
    ambulanceNo: form.full_form?.ambulance_no || "",
    homeAddress: form.full_form?.address || "",
    location: form.location || "",
    underInfluence: form.full_form?.under_influence || {
      alcohol: false,
      drugs: false,
      unknown: false,
      none: false,
    },
    evacuationCode: form.full_form?.evacuation_code || {
      black: false,
      red: false,
      yellow: false,
      green: false,
    },
    responseTeam: form.full_form?.response_team || [],
    contactPerson: form.full_form?.contact_person || "",
    relationship: form.full_form?.relationship || "",
    contactNumber: form.full_form?.contact_number || "",
    doi: form.full_form?.doi || "",
    toi: form.full_form?.toi || "",
    noi: form.full_form?.noi || "",
    poi: form.full_form?.poi_details || {
      brgy: "",
      highway: false,
      residence: false,
      publicBuilding: false,
    },
    lossOfConsciousness: form.full_form?.loss_of_consciousness || "no",
    lossOfConsciousnessMinutes:
      form.full_form?.loss_of_consciousness_minutes || "",
    chiefComplaints:
      form.full_form?.chief_complaints ||
      form.full_form?.history_present_illness ||
      "",
    interventions: form.full_form?.interventions || "",
    signsSymptoms: form.full_form?.signs_symptoms || "",
    allergies: form.full_form?.allergies || "",
    medication: form.full_form?.medications || "",
    pastHistory: form.full_form?.past_medical_history || "",
    lastIntake: form.full_form?.last_intake || "",
    events: form.full_form?.events || "",
    narrative: form.full_form?.narrative || "",
    driver: form.full_form?.driver || "",
    teamLeader: form.full_form?.team_leader || "",
    crew: form.full_form?.crew || "",
    receivingHospital: form.full_form?.receiving_hospital || "",
    patientSignature: form.full_form?.patient_signature || "",
    witnessSignature: form.full_form?.witness_signature || "",
    patientSignatureDate: form.full_form?.patient_signature_date || "",
    witnessSignatureDate: form.full_form?.witness_signature_date || "",
    bodyDiagram: (form.full_form?.body_diagram || []).reduce(
      (acc, part) => ({ ...acc, [part]: true }),
      {}
    ),
    receivingName: form.full_form?.receiving_name || "",
    receivingSignature: form.full_form?.receiving_signature || "",
  };

  return (
    <PCRForm
      onClose={onClose}
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
};

export default PCREdit;
