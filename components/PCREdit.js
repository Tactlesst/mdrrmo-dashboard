// components/PCREdit.jsx
"use client";

import React from "react";
import PCRForm from "./PCRForm";

const PCREdit = ({ form, onClose }) => {
  const handleSubmit = async (formData) => {
    try {
      const transformedData = {
        patient_name: formData.patientName,
        date: formData.date,
        location: formData.homeAddress,
        recorder: formData.recorder,
        full_form: {
          case_number: formData.caseType,
          age: parseInt(formData.age) || 0,
          sex: formData.gender,
          contact_number: formData.contactNumber,
          address: formData.homeAddress,
          poi_type: formData.poi.brgy,
          poi_details: {
            brgy: formData.poi.brgy,
            highway: formData.poi.highway,
            residence: formData.poi.residence,
            publicBuilding: formData.poi.publicBuilding,
          },
          vitals: {
            blood_pressure: formData.bloodPressure,
            pulse_rate: parseInt(formData.pr) || 0,
            respiratory_rate: parseInt(formData.rr) || 0,
            temperature: formData.temp,
            oxygen_saturation: formData.o2sat,
            gcs_eye: 0, // Add input if needed
            gcs_verbal: 0, // Add input if needed
            gcs_motor: 0, // Add input if needed
          },
          history_present_illness: formData.chiefComplaints,
          past_medical_history: formData.pastHistory,
          medications: formData.medication,
          allergies: formData.allergies,
          body_diagram: Object.keys(formData.bodyDiagram).filter(
            (key) => formData.bodyDiagram[key]
          ),
          waiver_signed: !!formData.patientSignature,
          category: formData.category,
          hospital_transported: formData.hospitalTransported,
          time_call: formData.timeCall,
          time_arrived_scene: formData.timeArrivedScene,
          time_left_scene: formData.timeLeftScene,
          time_arrived_hospital: formData.timeArrivedHospital,
          ambulance_no: formData.ambulanceNo,
          under_influence: formData.underInfluence,
          evacuation_code: formData.evacuationCode,
          response_team: formData.responseTeam,
          contact_person: formData.contactPerson,
          relationship: formData.relationship,
          doi: formData.doi,
          toi: formData.toi,
          noi: formData.noi,
          loss_of_consciousness: formData.lossOfConsciousness,
          loss_of_consciousness_minutes: formData.lossOfConsciousnessMinutes,
          chief_complaints: formData.chiefComplaints,
          interventions: formData.interventions,
          signs_symptoms: formData.signsSymptoms,
          last_intake: formData.lastIntake,
          events: formData.events,
          narrative: formData.narrative,
          driver: formData.driver,
          team_leader: formData.teamLeader,
          crew: formData.crew,
          receiving_hospital: formData.receivingHospital,
          patient_signature: formData.patientSignature,
          witness_signature: formData.witnessSignature,
          patient_signature_date: formData.patientSignatureDate,
          witness_signature_date: formData.witnessSignatureDate,
          receiving_name: formData.receivingName,
          receiving_signature: formData.receivingSignature,
        },
      };

      const response = await fetch(`/api/pcr/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update form");
      }

      onClose();
    } catch (error) {
      throw error; // Handled by PCRForm
    }
  };

  const initialData = {
    caseType: form.full_form?.case_number || "",
    recorder: form.recorder || "",
    date: form.date || "",
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
    homeAddress: form.full_form?.address || form.location || "",
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
      brgy: form.full_form?.poi_type || "",
      highway: false,
      residence: false,
      publicBuilding: false,
    },
    lossOfConsciousness: form.full_form?.loss_of_consciousness || "no",
    lossOfConsciousnessMinutes: form.full_form?.loss_of_consciousness_minutes || "",
    chiefComplaints: form.full_form?.chief_complaints || form.full_form?.history_present_illness || "",
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
    bodyDiagram: (form.full_form?.body_diagram || []).reduce((acc, part) => ({
      ...acc,
      [part]: true,
    }), {}),
    receivingName: form.full_form?.receiving_name || "",
    receivingSignature: form.full_form?.receiving_signature || "",
  };

  return <PCRForm onClose={onClose} initialData={initialData} onSubmit={handleSubmit} />;
};

export default PCREdit;