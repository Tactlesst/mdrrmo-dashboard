"use client";

import React, { useRef, useState, useEffect } from "react";
import { FiX, FiPrinter, FiDownload } from "react-icons/fi";
import jsPDF from "jspdf";

const PCRPrint = ({ form, onClose }) => {
  const fullForm = form.full_form || {};
  const componentRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({
    patientSignature: false,
    witnessSignature: false,
    receivingSignature: false,
  });
  const [imageErrors, setImageErrors] = useState({
    patientSignature: null,
    witnessSignature: null,
    receivingSignature: null,
  });

  // Format date for Manila timezone
  const formatPHDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const options = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      return date.toLocaleDateString("en-PH", options);
    } catch (error) {
      console.error(`Error formatting date ${dateString}:`, error);
      return "N/A";
    }
  };

  // Format time (expects "HH:mm AM/PM" or empty string)
  const formatTime = (timeString) => {
    if (!timeString) return "";
    if (/^\d{2}:\d{2} (AM|PM)$/.test(timeString)) {
      return timeString; // Already in "HH:mm AM/PM" format
    }
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return "";
      const period = hours >= 12 ? "PM" : "AM";
      const adjustedHours = hours % 12 || 12;
      return `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error(`Error formatting time ${timeString}:`, error);
      return "";
    }
  };

  // Display raw string value, handling null/undefined
  const displayRaw = (value) => {
    return value ?? "N/A"; // Use ?? to handle null/undefined, keep empty strings
  };


  // Preload images to ensure they are ready for printing/PDF
  useEffect(() => {
    console.log("PCRPrint form data:", JSON.stringify(form, null, 2));
    console.log("Full form data:", JSON.stringify(fullForm, null, 2));

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
              setImageLoaded((prev) => ({ ...prev, [field]: true }));
              setImageErrors((prev) => ({ ...prev, [field]: null }));
              resolve();
            };
            img.onerror = async () => {
              console.error(`${field} image failed to load:`, url);
              try {
                const response = await fetch(url);
                const errorText = response.ok ? "Loaded after retry" : await response.text().catch(() => "No error details");
                setImageErrors((prev) => ({
                  ...prev,
                  [field]: `Failed to load ${field} (${url}): HTTP ${response.status} - ${errorText}`,
                }));
              } catch (fetchError) {
                setImageErrors((prev) => ({
                  ...prev,
                  [field]: `Failed to load ${field} (${url}): ${fetchError.message}`,
                }));
              }
              setImageLoaded((prev) => ({ ...prev, [field]: false }));
              resolve();
            };
          });
        }
        console.log(`No valid URL for ${field}:`, url);
        setImageLoaded((prev) => ({ ...prev, [field]: false }));
        setImageErrors((prev) => ({ ...prev, [field]: null }));
        return Promise.resolve();
      });

      await Promise.all(loadPromises);

      if (componentRef.current) {
        console.log("Print component ref is ready:", componentRef.current);
        setIsReady(true);
      } else {
        console.error("Print component ref is not ready");
      }
    };

    preloadImages();
  }, [fullForm.patientSignature, fullForm.witnessSignature, fullForm.receivingSignature]);

  // Open print preview in new tab with download capability
  const handlePrint = async () => {
    if (!isReady || Object.values(imageErrors).some((error) => error)) {
      alert("Some images failed to load. Check console for details or try downloading as text.");
      return;
    }

    try {
      // Show loading state
      const originalButton = document.querySelector('button[onclick*="handlePrint"]');
      if (originalButton) {
        originalButton.disabled = true;
        originalButton.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Opening Preview...';
      }

      // Prepare HTML content for print preview
      const htmlContent = componentRef.current.innerHTML;
      const fileName = `PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}`;

      // Create a form to POST to the print preview API
      const formElement = document.createElement('form');
      formElement.method = 'POST';
      formElement.action = '/api/pcr/print-preview';
      formElement.target = '_blank';
      formElement.style.display = 'none';

      // Add HTML content
      const htmlInput = document.createElement('input');
      htmlInput.type = 'hidden';
      htmlInput.name = 'htmlContent';
      htmlInput.value = htmlContent;
      formElement.appendChild(htmlInput);

      // Add file name
      const nameInput = document.createElement('input');
      nameInput.type = 'hidden';
      nameInput.name = 'fileName';
      nameInput.value = fileName;
      formElement.appendChild(nameInput);

      // Submit form to open in new tab
      document.body.appendChild(formElement);
      formElement.submit();
      document.body.removeChild(formElement);

    } catch (error) {
      console.error('Error opening print preview:', error);
      alert(`Failed to open print preview: ${error.message}`);
    } finally {
      // Restore button state
      const originalButton = document.querySelector('button[onclick*="handlePrint"]');
      if (originalButton) {
        originalButton.disabled = false;
        originalButton.innerHTML = '<svg class="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 6,2 18,2 18,9"></polyline><path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18"></path><polyline points="6,14 18,14"></polyline></svg>Open Preview';
      }
    }
  };

  // Download PDF using jsPDF
  const handleDownload = () => {
    if (!isReady || Object.values(imageErrors).some((error) => error)) {
      alert("Some images failed to load. Check console for details or try downloading as text.");
      return;
    }
    const doc = new jsPDF("p", "pt", "a4");
    doc.html(componentRef.current, {
      callback: (doc) => {
        doc.save(`PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}.pdf`);
      },
      margin: [20, 20, 20, 20],
      x: 10,
      y: 10,
      width: 550,
      windowWidth: 900,
      html2canvas: { scale: 0.75, useCORS: true },
    });
  };

  // Fallback: Generate a text-based file
  const handleDownloadText = () => {
    const content = `
      PATIENT CARE REPORT

      Basic Information
      ----------------
      Patient Name: ${form.patient_name || "N/A"}
      Date: ${formatPHDate(form.date)}
      Recorder: ${form.recorder || "N/A"}
      Location: ${form.location || "N/A"}

      Patient Details
      ---------------
      Case Type: ${fullForm.caseType || "N/A"}
      Age: ${fullForm.age || "N/A"}
      Gender: ${fullForm.gender || "N/A"}
      Category: ${fullForm.category || "N/A"}
      Contact Number: ${fullForm.contactNumber || "N/A"}
      Address: ${fullForm.homeAddress || "N/A"}

      Vitals and Incident Details
      ---------------------------
      Vitals:
        BP: ${fullForm.bloodPressure || "N/A"}
        PR: ${fullForm.pr || "N/A"}
        RR: ${fullForm.rr || "N/A"}
        Temp: ${fullForm.temp || "N/A"}
        O2Sat: ${fullForm.o2sat || "N/A"}
      Place of Incident (POI):
        Brgy: ${fullForm.poi?.brgy || "N/A"}
        Highway: ${fullForm.poi?.highway ? "Yes" : "No"}
        Residence: ${fullForm.poi?.residence ? "Yes" : "No"}
        Public Building: ${fullForm.poi?.publicBuilding ? "Yes" : "No"}
      Incident Details:
        DOI: ${displayRaw(fullForm.doi)}
        TOI: ${displayRaw(fullForm.toi)}
        NOI: ${fullForm.noi || "N/A"}

      Medical and Evacuation Details
      -----------------------------
      Under Influence:
        Alcohol: ${fullForm.underInfluence?.alcohol ? "Yes" : "No"}
        Drugs: ${fullForm.underInfluence?.drugs ? "Yes" : "No"}
        Unknown: ${fullForm.underInfluence?.unknown ? "Yes" : "No"}
        None: ${fullForm.underInfluence?.none ? "Yes" : "No"}
      Evacuation Code:
        Black: ${fullForm.evacuationCode?.black ? "Yes" : "No"}
        Red: ${fullForm.evacuationCode?.red ? "Yes" : "No"}
        Yellow: ${fullForm.evacuationCode?.yellow ? "Yes" : "No"}
        Green: ${fullForm.evacuationCode?.green ? "Yes" : "No"}
      Response Team: ${fullForm.responseTeam?.length ? fullForm.responseTeam.join(", ") : "N/A"}

      Medical History
      ---------------
      Chief Complaints: ${fullForm.chiefComplaints || "N/A"}
      Signs & Symptoms: ${fullForm.signsSymptoms || "N/A"}
      Allergies: ${fullForm.allergies || "N/A"}
      Medications: ${fullForm.medication || "N/A"}
      Past Medical History: ${fullForm.pastHistory || "N/A"}
      Last Intake: ${fullForm.lastIntake || "N/A"}
      Events: ${fullForm.events || "N/A"}
      Interventions: ${fullForm.interventions || "N/A"}
      Narrative: ${fullForm.narrative || "N/A"}

      Transport and Contact Details
      -----------------------------
      Transport Details:
        Hospital Transported: ${fullForm.hospitalTransported || "N/A"}
        Time of Call: ${formatTime(fullForm.timeCall)}
        Arrived Scene: ${formatTime(fullForm.timeArrivedScene)}
        Left Scene: ${formatTime(fullForm.timeLeftScene)}
        Arrived Hospital: ${formatTime(fullForm.timeArrivedHospital)}
        Ambulance No: ${fullForm.ambulanceNo || "N/A"}
      Contact Person:
        Name: ${fullForm.contactPerson || "N/A"}
        Relationship: ${fullForm.relationship || "N/A"}
        Contact Number: ${fullForm.contactNumber || "N/A"}
      Loss of Consciousness: ${fullForm.lossOfConsciousness || "N/A"}${fullForm.lossOfConsciousness === "yes" ? ` (${fullForm.lossOfConsciousnessMinutes || "0"} minutes)` : ""}

      Crew and Receiving Hospital
      ---------------------------
      Crew Details:
        Driver: ${fullForm.driver || "N/A"}
        Team Leader: ${fullForm.teamLeader || "N/A"}
        Crew: ${fullForm.crew || "N/A"}
      Receiving Hospital:
        Hospital: ${fullForm.receivingHospital || "N/A"}
        Name: ${fullForm.receivingName || "N/A"}
        Signature URL: ${fullForm.receivingSignature || "N/A"}

      Waiver and Body Diagram
      -----------------------
      Waiver:
        Signed: ${fullForm.patientSignature || fullForm.witnessSignature ? "Yes" : "No"}
        Patient Signature URL: ${fullForm.patientSignature || "N/A"}
        Witness Signature URL: ${fullForm.witnessSignature || "N/A"}
        Patient Signature Date: ${formatPHDate(fullForm.patientSignatureDate)}
        Witness Signature Date: ${formatPHDate(fullForm.witnessSignatureDate)}
      Body Diagram: ${fullForm.bodyDiagram?.length ? fullForm.bodyDiagram.join(", ") : "N/A"}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PCR_${form.patient_name || "Unknown"}_${form.date ? form.date.split("T")[0] : "Unknown"}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log("Fallback text file generated");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 print:bg-transparent print:z-0">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-y-auto max-h-[95vh] p-8 border border-gray-200 print:shadow-none print:p-0 print:border-0 print:bg-white">
        <div className="flex justify-between items-center mb-6 no-print">
          <h2 className="text-xl font-bold text-gray-800">Print Patient Care Report</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              disabled={!isReady || Object.values(imageErrors).some((error) => error)}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg no-print ${
                !isReady || Object.values(imageErrors).some((error) => error) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FiPrinter className="mr-2" size={18} />
              Open Preview
            </button>

            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg no-print"
            >
              <FiX className="mr-2" size={18} />
              Close
            </button>
          </div>
        </div>

        <div ref={componentRef} className="print:p-0">
          <style jsx>{`
            @media print {
              .no-print {
                display: none !important;
              }
              @page {
                size: A4;
                margin: 0.3in;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .form-table {
                width: 100%;
                border-collapse: collapse;
                font-family: Arial, sans-serif;
                font-size: 8pt;
                margin-bottom: 2px;
              }
              .form-table td, .form-table th {
                border: 1px solid #000;
                padding: 1px 3px;
                vertical-align: top;
                line-height: 1.2;
              }
              .form-header {
                text-align: center;
                font-weight: bold;
                background-color: #f0f0f0;
                padding: 4px;
              }
              .checkbox {
                width: 10px;
                height: 10px;
                border: 1px solid #000;
                display: inline-block;
                margin-right: 2px;
                text-align: center;
                font-size: 7pt;
                line-height: 8px;
                vertical-align: middle;
              }
              .checkbox.checked::after {
                content: "✓";
                font-weight: bold;
              }
              .underline {
                border-bottom: 1px solid #000;
                display: inline-block;
                min-width: 80px;
                padding-bottom: 1px;
                margin-left: 2px;
              }
              .body-diagram {
                width: 60px;
                height: 100px;
                border: 1px solid #000;
                margin: 2px auto;
                display: block;
              }
              .signature-box {
                border: 1px solid #000;
                height: 30px;
                margin: 2px 0;
                padding: 2px;
              }
              .field-label {
                font-weight: bold;
                font-size: 7pt;
              }
            }
            .form-table {
              width: 100%;
              border-collapse: collapse;
              font-family: Arial, sans-serif;
              font-size: 10px;
              margin-bottom: 4px;
            }
            .form-table td, .form-table th {
              border: 1px solid #000;
              padding: 3px 5px;
              vertical-align: top;
              line-height: 1.3;
            }
            .form-header {
              text-align: center;
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 6px;
            }
            .checkbox {
              width: 12px;
              height: 12px;
              border: 1px solid #000;
              display: inline-block;
              margin-right: 4px;
              text-align: center;
              font-size: 8pt;
              line-height: 10px;
              vertical-align: middle;
            }
            .checkbox.checked::after {
              content: "✓";
              font-weight: bold;
            }
            .underline {
              border-bottom: 1px solid #000;
              display: inline-block;
              min-width: 100px;
              padding-bottom: 2px;
              margin-left: 3px;
            }
            .body-diagram {
              width: 80px;
              height: 120px;
              border: 1px solid #000;
              margin: 4px auto;
              display: block;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120"><ellipse cx="40" cy="15" rx="8" ry="10" fill="none" stroke="black" stroke-width="1"/><line x1="40" y1="25" x2="40" y2="70" stroke="black" stroke-width="1"/><line x1="40" y1="35" x2="25" y2="50" stroke="black" stroke-width="1"/><line x1="40" y1="35" x2="55" y2="50" stroke="black" stroke-width="1"/><line x1="40" y1="70" x2="30" y2="110" stroke="black" stroke-width="1"/><line x1="40" y1="70" x2="50" y2="110" stroke="black" stroke-width="1"/></svg>') center/contain no-repeat;
            }
            .signature-box {
              border: 1px solid #000;
              height: 40px;
              margin: 4px 0;
              padding: 2px;
            }
            .field-label {
              font-weight: bold;
              font-size: 9px;
            }
          `}</style>

          {/* Header Section */}
          <table className="form-table" style={{marginBottom: '8px'}}>
            <tr>
              <td rowSpan="2" style={{width: '15%', textAlign: 'center', padding: '8px'}}>
                <img src="/Logoo.png" alt="Municipality Logo" style={{width: '50px', height: '50px'}} />
              </td>
              <td className="form-header" style={{fontSize: '9pt', padding: '4px'}}>
                Republic of the Philippines<br/>
                Province of Masbate Oriental<br/>
                <strong>MUNICIPALITY OF BALINGSAG</strong>
              </td>
              <td rowSpan="2" style={{width: '15%', textAlign: 'center', padding: '8px'}}>
                <div style={{border: '2px solid #000', width: '50px', height: '50px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt', fontWeight: 'bold'}}>
                  MDRRMO
                </div>
              </td>
            </tr>
            <tr>
              <td className="form-header" style={{fontSize: '12pt', fontWeight: 'bold', padding: '6px'}}>
                PATIENT CARE REPORT
              </td>
            </tr>
          </table>

          {/* Main Form Table */}
          <table className="form-table" style={{marginBottom: '4px'}}>
            <tr>
              <td style={{width: '20%', fontSize: '8pt'}}><strong>CASE TYPE - DESCRIPTION:</strong></td>
              <td style={{width: '30%'}}><span className="underline" style={{minWidth: '150px'}}>{fullForm.caseType || ""}</span></td>
              <td style={{width: '15%', fontSize: '8pt'}}><strong>NAME OF RECORDER:</strong></td>
              <td style={{width: '15%'}}><span className="underline">{form.recorder || ""}</span></td>
              <td style={{width: '10%', fontSize: '8pt'}}><strong>DATE:</strong></td>
              <td style={{width: '10%'}}><span className="underline">{formatPHDate(form.date)}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>NAME OF PATIENT:</strong></td>
              <td><span className="underline" style={{minWidth: '150px'}}>{form.patient_name || ""}</span></td>
              <td style={{fontSize: '8pt'}}><strong>HOSPITAL TRANSPORTED TO:</strong></td>
              <td colSpan="3"><span className="underline" style={{minWidth: '200px'}}>{fullForm.hospitalTransported || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>AGE:</strong></td>
              <td><span className="underline">{fullForm.age || ""}</span></td>
              <td style={{fontSize: '8pt'}}><strong>GENDER:</strong></td>
              <td>
                <span className={`checkbox ${fullForm.gender === 'male' ? 'checked' : ''}`}></span>M
                <span className={`checkbox ${fullForm.gender === 'female' ? 'checked' : ''}`} style={{marginLeft: '8px'}}></span>F
              </td>
              <td style={{fontSize: '8pt'}}><strong>TIME OF CALL:</strong></td>
              <td><span className="underline">{formatTime(fullForm.timeCall)}</span></td>
            </tr>
            <tr>
              <td colSpan="2" style={{fontSize: '8pt'}}>
                <strong>CATEGORY:</strong>
                <span className={`checkbox ${fullForm.category === 'driver' ? 'checked' : ''}`}></span>DRIVER ( )
                <span className={`checkbox ${fullForm.category === 'passenger' ? 'checked' : ''}`}></span>PASSENGER ( )
                <span className={`checkbox ${fullForm.category === 'patient' ? 'checked' : ''}`}></span>PATIENT ( )
              </td>
              <td style={{fontSize: '8pt'}}><strong>TIME ARRIVED AT SCENE:</strong></td>
              <td colSpan="3"><span className="underline">{formatTime(fullForm.timeArrivedScene)}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>BLOOD PRESSURE</strong></td>
              <td style={{fontSize: '8pt'}}><strong>PR</strong></td>
              <td style={{fontSize: '8pt'}}><strong>RR</strong></td>
              <td style={{fontSize: '8pt'}}><strong>O2SAT</strong></td>
              <td style={{fontSize: '8pt'}}><strong>TEMPERATURE</strong></td>
              <td style={{fontSize: '8pt'}}><strong>TIME LEFT SCENE:</strong></td>
            </tr>
            <tr>
              <td><span className="underline">{fullForm.bloodPressure || ""}</span></td>
              <td><span className="underline">{fullForm.pr || ""}</span></td>
              <td><span className="underline">{fullForm.rr || ""}</span></td>
              <td><span className="underline">{fullForm.o2sat || ""}</span></td>
              <td><span className="underline">{fullForm.temp || ""}</span></td>
              <td><span className="underline">{formatTime(fullForm.timeLeftScene)}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>HOME ADDRESS:</strong></td>
              <td colSpan="3"><span className="underline" style={{minWidth: '250px'}}>{fullForm.homeAddress || ""}</span></td>
              <td style={{fontSize: '8pt'}}><strong>TIME ARRIVED AT HOSPITAL:</strong></td>
              <td><span className="underline">{formatTime(fullForm.timeArrivedHospital)}</span></td>
            </tr>
            <tr>
              <td colSpan="3" style={{fontSize: '8pt'}}>
                <strong>UNDER INFLUENCE:</strong>
                <span className={`checkbox ${fullForm.underInfluence?.alcohol ? 'checked' : ''}`}></span>ALCOHOL ( )
                <span className={`checkbox ${fullForm.underInfluence?.drugs ? 'checked' : ''}`}></span>DRUGS ( )
                <span className={`checkbox ${fullForm.underInfluence?.unknown ? 'checked' : ''}`}></span>UNKNOWN ( )
                <span className={`checkbox ${fullForm.underInfluence?.none ? 'checked' : ''}`}></span>N/A ( )
              </td>
              <td colSpan="3" style={{fontSize: '8pt'}}>
                <strong>EVACUATION CODE:</strong>
                <span className={`checkbox ${fullForm.evacuationCode?.black ? 'checked' : ''}`}></span>BLACK ( )
                <span className={`checkbox ${fullForm.evacuationCode?.red ? 'checked' : ''}`}></span>RED ( )
                <span className={`checkbox ${fullForm.evacuationCode?.yellow ? 'checked' : ''}`}></span>YELLOW ( )
                <span className={`checkbox ${fullForm.evacuationCode?.green ? 'checked' : ''}`}></span>GREEN ( )
              </td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>CONTACT PERSON</strong></td>
              <td style={{fontSize: '8pt'}}><strong>RELATIONSHIP</strong></td>
              <td style={{fontSize: '8pt'}}><strong>CONTACT NUMBER</strong></td>
              <td style={{fontSize: '8pt'}}><strong>AMBULANCE NO:</strong></td>
              <td colSpan="2" style={{fontSize: '8pt'}}><strong>RESPONSE TEAM:</strong></td>
            </tr>
            <tr>
              <td><span className="underline">{fullForm.contactPerson || ""}</span></td>
              <td><span className="underline">{fullForm.relationship || ""}</span></td>
              <td><span className="underline">{fullForm.contactNumber || ""}</span></td>
              <td><span className="underline">{fullForm.ambulanceNo || ""}</span></td>
              <td colSpan="2" style={{fontSize: '8pt'}}>
                <span className={`checkbox ${fullForm.responseTeam?.includes('TEAM 1') ? 'checked' : ''}`}></span>TEAM 1 ( )
                <span className={`checkbox ${fullForm.responseTeam?.includes('TEAM 2') ? 'checked' : ''}`}></span>TEAM 2 ( )
                <span className={`checkbox ${fullForm.responseTeam?.includes('TEAM 3') ? 'checked' : ''}`}></span>TEAM 3 ( )
              </td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>DOI:</strong></td>
              <td style={{fontSize: '8pt'}}><strong>TOI:</strong></td>
              <td style={{fontSize: '8pt'}}><strong>NOI:</strong></td>
              <td colSpan="3" style={{fontSize: '8pt'}}><strong>BRGY:</strong></td>
            </tr>
            <tr>
              <td><span className="underline">{displayRaw(fullForm.doi)}</span></td>
              <td><span className="underline">{displayRaw(fullForm.toi)}</span></td>
              <td><span className="underline">{fullForm.noi || ""}</span></td>
              <td colSpan="3" style={{fontSize: '8pt'}}>
                <span className={`checkbox ${fullForm.poi?.highway ? 'checked' : ''}`}></span>HIGHWAY/ROAD ( )
                <span className={`checkbox ${fullForm.poi?.residence ? 'checked' : ''}`}></span>RESIDENCE ( )
                <span className={`checkbox ${fullForm.poi?.publicBuilding ? 'checked' : ''}`}></span>PUBLIC BUILDING/PLACE ( )
              </td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>LOSS OF CONSCIOUSNESS</strong></td>
              <td style={{fontSize: '8pt'}}>
                <span className={`checkbox ${fullForm.lossOfConsciousness === 'yes' ? 'checked' : ''}`}></span>YES ( ) 
                <span className={`checkbox ${fullForm.lossOfConsciousness === 'no' ? 'checked' : ''}`}></span>NO ( )
                <br/>MINUTES: <span className="underline">{fullForm.lossOfConsciousnessMinutes || ""}</span>
              </td>
              <td style={{fontSize: '8pt'}}><strong>CHIEF COMPLAINTS/S:</strong></td>
              <td colSpan="3"><span className="underline" style={{minWidth: '200px'}}>{fullForm.chiefComplaints || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>INTERVENTIONS:</strong></td>
              <td colSpan="5"><span className="underline" style={{minWidth: '400px'}}>{fullForm.interventions || ""}</span></td>
            </tr>
          </table>

          {/* Medical History Section */}
          <table className="form-table" style={{marginBottom: '4px'}}>
            <tr>
              <td colSpan="2" className="form-header" style={{fontSize: '9pt'}}>HISTORY</td>
              <td className="form-header" style={{fontSize: '9pt'}}>NARRATIVE OF THE INCIDENT</td>
            </tr>
            <tr>
              <td style={{width: '20%', fontSize: '8pt'}}><strong>SIGNS & SYMPTOMS:</strong></td>
              <td style={{width: '30%'}}><span className="underline">{fullForm.signsSymptoms || ""}</span></td>
              <td rowSpan="6" style={{width: '50%', verticalAlign: 'top', padding: '4px'}}>
                <div style={{minHeight: '120px', fontSize: '9pt', lineHeight: '1.3'}}>
                  {fullForm.narrative || ""}
                </div>
              </td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>ALLERGIES:</strong></td>
              <td><span className="underline">{fullForm.allergies || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>MEDICATION:</strong></td>
              <td><span className="underline">{fullForm.medication || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>PAST HISTORY:</strong></td>
              <td><span className="underline">{fullForm.pastHistory || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>LAST INTAKE:</strong></td>
              <td><span className="underline">{fullForm.lastIntake || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>EVENTS:</strong></td>
              <td><span className="underline">{fullForm.events || ""}</span></td>
            </tr>
          </table>

          {/* Additional Notes Section */}
          <table className="form-table" style={{marginBottom: '4px'}}>
            <tr>
              <td colSpan="3" className="form-header" style={{fontSize: '9pt'}}>ADDITIONAL NOTES</td>
            </tr>
            <tr>
              <td style={{width: '15%', verticalAlign: 'top', textAlign: 'center', padding: '4px'}}>
                <div className="body-diagram"></div>
                <div style={{textAlign: 'center', fontSize: '7pt', fontWeight: 'bold'}}>FRONT</div>
              </td>
              <td style={{width: '15%', verticalAlign: 'top', textAlign: 'center', padding: '4px'}}>
                <div className="body-diagram"></div>
                <div style={{textAlign: 'center', fontSize: '7pt', fontWeight: 'bold'}}>BACK</div>
              </td>
              <td style={{width: '70%', verticalAlign: 'top', padding: '4px'}}>
                <div style={{fontSize: '8pt', lineHeight: '1.2'}}>
                  <strong>Waiver of Treatment / Patient Refusal</strong><br/>
                  <div style={{fontSize: '7pt', marginTop: '4px', textAlign: 'justify'}}>
                    I acknowledge that I have been informed that my medical condition requires immediate treatment and/or transport to a physician and that with refusing further emergency medical treatment there is a risk of serious injury, illness, or death. Understanding these risks, I hereby release the attending medical personnel, their home agency, and their advising physician from all responsibility regarding any ill effects which may result from this decision.
                  </div>
                  <table style={{width: '100%', marginTop: '8px', fontSize: '7pt'}}>
                    <tr>
                      <td style={{width: '50%', verticalAlign: 'top'}}>
                        <strong>Patient Signature:</strong><br/>
                        <div className="signature-box" style={{height: '25px'}}>
                          {fullForm.patientSignature && imageLoaded.patientSignature ? (
                            <img src={fullForm.patientSignature} alt="Patient Signature" style={{maxWidth: '100%', maxHeight: '25px'}} />
                          ) : ""}
                        </div>
                        Date: <span className="underline" style={{minWidth: '60px'}}>{formatPHDate(fullForm.patientSignatureDate)}</span>
                      </td>
                      <td style={{width: '50%', verticalAlign: 'top'}}>
                        <strong>Witness Signature:</strong><br/>
                        <div className="signature-box" style={{height: '25px'}}>
                          {fullForm.witnessSignature && imageLoaded.witnessSignature ? (
                            <img src={fullForm.witnessSignature} alt="Witness Signature" style={{maxWidth: '100%', maxHeight: '25px'}} />
                          ) : ""}
                        </div>
                        Date: <span className="underline" style={{minWidth: '60px'}}>{formatPHDate(fullForm.witnessSignatureDate)}</span>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>

          {/* Crew and Receiving Hospital Section */}
          <table className="form-table" style={{marginBottom: '0'}}>
            <tr>
              <td style={{width: '20%', fontSize: '8pt'}}><strong>DRIVER:</strong></td>
              <td style={{width: '30%'}}><span className="underline">{fullForm.driver || ""}</span></td>
              <td style={{width: '25%', fontSize: '8pt'}}><strong>RECEIVING HOSPITAL</strong></td>
              <td style={{width: '25%'}}></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>TEAM LEADER:</strong></td>
              <td><span className="underline">{fullForm.teamLeader || ""}</span></td>
              <td style={{fontSize: '8pt'}}><strong>NAME:</strong></td>
              <td><span className="underline">{fullForm.receivingName || ""}</span></td>
            </tr>
            <tr>
              <td style={{fontSize: '8pt'}}><strong>CREW:</strong></td>
              <td><span className="underline">{fullForm.crew || ""}</span></td>
              <td style={{fontSize: '8pt'}}><strong>SIGNATURE:</strong></td>
              <td>
                <div className="signature-box" style={{height: '30px'}}>
                  {fullForm.receivingSignature && imageLoaded.receivingSignature ? (
                    <img src={fullForm.receivingSignature} alt="Receiving Signature" style={{maxWidth: '100%', maxHeight: '30px'}} />
                  ) : ""}
                </div>
              </td>
            </tr>
          </table>

        </div>
      </div>
    </div>
  );
};

export default PCRPrint;