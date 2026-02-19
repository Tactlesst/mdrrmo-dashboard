"use client";

import { useRef } from "react";

export default function PCRPrintPage({ form = {}, fullForm = {} }) {
  const componentRef = useRef(null);

  // ---------- DATE FORMAT (PH Timezone) ----------
  const formatPHDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // ---------- TIME FORMAT ----------
  const formatTime = (time) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) return time;
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h)) return "";
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  // ---------- GENERATE FULL GOVERNMENT HTML ----------
  const generateFullHTMLDocument = () => {
    const patientSignature = fullForm.patientSignature || "";
    const witnessSignature = fullForm.witnessSignature || "";
    const receivingSignature = fullForm.receivingSignature || "";

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>PCR - ${form.patient_name || "Patient"}</title>

<style>
@page {
  size: A4;
  margin: 0.3in;
}

body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 10px;
  -webkit-print-color-adjust: exact;
}

.form-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.form-table td, .form-table th {
  border: 1px solid #000;
  padding: 4px;
  vertical-align: top;
}

.header {
  text-align: center;
  font-weight: bold;
  background: #f0f0f0;
}

.underline {
  border-bottom: 1px solid #000;
  display: inline-block;
  min-width: 120px;
}

.signature-box {
  border: 1px solid #000;
  height: 45px;
  width: 100%;
}

.section-title {
  font-weight: bold;
  background: #eaeaea;
}

</style>
</head>

<body>

<table class="form-table">
<tr>
  <td rowspan="2" style="width:15%;text-align:center;">
    <img src="/Logoo.png" style="width:60px;height:60px;" />
  </td>
  <td class="header">
    REPUBLIC OF THE PHILIPPINES<br/>
    MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)
  </td>
  <td rowspan="2" style="width:15%;text-align:center;">
    <strong>PCR FORM</strong>
  </td>
</tr>
<tr>
  <td class="header" style="font-size:16px;">
    PATIENT CARE REPORT (PCR)
  </td>
</tr>
</table>

<table class="form-table">
<tr>
  <td><b>PATIENT NAME:</b></td>
  <td><span class="underline">${form.patient_name || ""}</span></td>
  <td><b>DATE:</b></td>
  <td>${formatPHDate(form.date)}</td>
</tr>

<tr>
  <td><b>AGE:</b></td>
  <td>${fullForm.age || ""}</td>
  <td><b>GENDER:</b></td>
  <td>${fullForm.gender || ""}</td>
</tr>

<tr>
  <td><b>ADDRESS:</b></td>
  <td colspan="3">${fullForm.homeAddress || ""}</td>
</tr>

<tr>
  <td><b>TIME OF CALL:</b></td>
  <td>${formatTime(fullForm.timeCall)}</td>
  <td><b>ARRIVED AT SCENE:</b></td>
  <td>${formatTime(fullForm.timeArrivedScene)}</td>
</tr>

<tr>
  <td><b>BLOOD PRESSURE:</b></td>
  <td>${fullForm.bloodPressure || ""}</td>
  <td><b>PULSE RATE:</b></td>
  <td>${fullForm.pr || ""}</td>
</tr>

<tr>
  <td><b>RESPIRATORY RATE:</b></td>
  <td>${fullForm.rr || ""}</td>
  <td><b>TEMPERATURE:</b></td>
  <td>${fullForm.temp || ""}</td>
</tr>

<tr>
  <td colspan="4" class="section-title">CHIEF COMPLAINTS</td>
</tr>
<tr>
  <td colspan="4" style="min-height:60px;">
    ${fullForm.chiefComplaints || ""}
  </td>
</tr>

<tr>
  <td colspan="4" class="section-title">NARRATIVE OF INCIDENT</td>
</tr>
<tr>
  <td colspan="4" style="min-height:120px;">
    ${fullForm.narrative || ""}
  </td>
</tr>

<tr>
  <td colspan="4" class="section-title">INTERVENTIONS / TREATMENT</td>
</tr>
<tr>
  <td colspan="4" style="min-height:80px;">
    ${fullForm.interventions || ""}
  </td>
</tr>
</table>

<br/>

<table class="form-table">
<tr>
  <td style="width:33%;">
    <b>Patient Signature:</b>
    <div class="signature-box">
      ${
        patientSignature
          ? `<img src="${patientSignature}" style="max-height:40px;">`
          : ""
      }
    </div>
  </td>

  <td style="width:33%;">
    <b>Witness Signature:</b>
    <div class="signature-box">
      ${
        witnessSignature
          ? `<img src="${witnessSignature}" style="max-height:40px;">`
          : ""
      }
    </div>
  </td>

  <td style="width:33%;">
    <b>Receiving Facility Signature:</b>
    <div class="signature-box">
      ${
        receivingSignature
          ? `<img src="${receivingSignature}" style="max-height:40px;">`
          : ""
      }
    </div>
  </td>
</tr>
</table>

</body>
</html>
`;
  };

  // ---------- PRINT PREVIEW (FIXED LAYOUT) ----------
  const handlePrintPreview = () => {
    const htmlContent = generateFullHTMLDocument();

    const formElement = document.createElement("form");
    formElement.method = "POST";
    formElement.action = "/api/pcr/print-preview";
    formElement.target = "_blank";

    const htmlInput = document.createElement("input");
    htmlInput.type = "hidden";
    htmlInput.name = "htmlContent";
    htmlInput.value = htmlContent;

    formElement.appendChild(htmlInput);
    document.body.appendChild(formElement);
    formElement.submit();
    document.body.removeChild(formElement);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* CONTROL BUTTONS (NOT PRINTED) */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handlePrintPreview}
          style={{
            padding: "10px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🖨️ Print Preview (Government A4)
        </button>
      </div>

      {/* ONSCREEN PREVIEW */}
      <div
        ref={componentRef}
        style={{
          background: "#fff",
          padding: 20,
          border: "1px solid #000",
          maxWidth: "800px",
          margin: "auto",
          fontFamily: "Arial",
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          PATIENT CARE REPORT (PCR) - MDRRMO
        </h2>

        <p>
          <strong>Patient Name:</strong> {form.patient_name || "N/A"}
        </p>
        <p>
          <strong>Date:</strong> {formatPHDate(form.date)}
        </p>
        <p>
          <strong>Chief Complaints:</strong>{" "}
          {fullForm.chiefComplaints || "N/A"}
        </p>
        <p>
          <strong>Narrative:</strong> {fullForm.narrative || "N/A"}
        </p>
      </div>
    </div>
  );
}
