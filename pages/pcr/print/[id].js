import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

export default function PcrPrintPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/pcr/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load PCR');
        }
        if (!cancelled) {
          setForm(data?.data || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const fullForm = useMemo(() => form?.full_form || {}, [form]);

  const formatPHDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    if (/^\d{2}:\d{2} (AM|PM)$/.test(timeString)) return timeString;
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
      const period = hours >= 12 ? 'PM' : 'AM';
      const adjustedHours = hours % 12 || 12;
      return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return '';
    }
  };

  const displayRaw = (value) => value ?? '';

  const title = form?.patient_name
    ? `PCR - ${form.patient_name}`
    : 'PCR';

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 0.3in; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
        body { background: #f3f4f6; }
        .page-wrap { min-height: 100vh; padding: 16px; }
        .sheet { background: white; max-width: 210mm; margin: 0 auto; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .controls { max-width: 210mm; margin: 0 auto 12px auto; display: flex; justify-content: space-between; align-items: center; }
        .btn { border: 0; border-radius: 8px; padding: 10px 12px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #2563eb; color: white; }
        .btn-secondary { background: #111827; color: white; }
        .btn-danger { background: #dc2626; color: white; }
        .muted { color: #6b7280; font-size: 12px; }

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
          line-height: 1.25;
        }

        .form-header {
          text-align: center;
          font-weight: bold;
          background-color: #f0f0f0;
          padding: 6px;
        }

        .checkbox {
          width: 10px;
          height: 10px;
          border: 1px solid #000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 4px;
          font-size: 9px;
          line-height: 10px;
          vertical-align: middle;
        }

        .underline {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 80px;
          padding-bottom: 1px;
        }

        .signature-box {
          border: 1px solid #000;
          height: 26px;
          margin: 2px 0;
          padding: 1px 2px;
        }

        .tiny {
          font-size: 8px;
        }
      `}</style>

      <div className="page-wrap">
        <div className="controls no-print">
          <div>
            <div style={{ fontWeight: 800 }}>{title}</div>
            <div className="muted">Tip: use your browser Print dialog and choose “Save as PDF”.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
            <button className="btn btn-secondary" onClick={() => window.close()}>
              Close
            </button>
          </div>
        </div>

        <div className="sheet">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div style={{ color: '#dc2626', fontWeight: 700 }}>{error}</div>
          ) : !form ? (
            <div>No data.</div>
          ) : (
            <>
              <table className="form-table" style={{ marginBottom: '6px' }}>
                <tbody>
                  <tr>
                      <img src="/Logoo.png" alt="Municipality Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
    
                    <td className="form-header">
                      Republic of the Philippines<br />
                      Province of Misamis Oriental<br />
                      <strong>MUNICIPALITY OF BALINGSAG</strong>
                    </td>
                    <td style={{ width: '18%', textAlign: 'center', fontWeight: 800 }}>MDRRMO</td>
                  </tr>
                    <td colSpan="3" className="form-header" style={{ fontSize: '12pt' }}>
                      PATIENT CARE REPORT
                    </td>

                </tbody>
              </table>

              <table className="form-table">
                <tbody>
                  <tr>
                    <td style={{ width: '52%' }}>
                      <strong>CASE TYPE - DESCRIPTION:</strong>{' '}
                      <span className="underline" style={{ minWidth: '200px' }}>{fullForm.caseType || ''}</span>
                    </td>
                    <td style={{ width: '30%' }}>
                      <strong>NAME OF RECORDER:</strong>{' '}
                      <span className="underline" style={{ minWidth: '150px' }}>{form.recorder || ''}</span>
                    </td>
                    <td style={{ width: '18%' }}>
                      <strong>DATE:</strong>{' '}
                      <span className="underline" style={{ minWidth: '80px' }}>{formatPHDate(form.date)}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>NAME OF PATIENT:</strong>{' '}
                      <span className="underline" style={{ minWidth: '220px' }}>{form.patient_name || ''}</span>
                    </td>
                    <td colSpan="2">
                      <strong>HOSPITAL TRANSPORTED TO:</strong>{' '}
                      <span className="underline" style={{ minWidth: '260px' }}>{fullForm.hospitalTransported || ''}</span>
                      <span style={{ marginLeft: 12 }}><strong>TIME OF CALL:</strong>{' '}</span>
                      <span className="underline" style={{ minWidth: '90px' }}>{formatTime(fullForm.timeCall)}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>AGE:</strong> <span className="underline" style={{ minWidth: '60px' }}>{fullForm.age || ''}</span>{'  '}
                      <strong>GENDER</strong>{' '}
                      <span className="checkbox">{String(fullForm.gender).toLowerCase() === 'male' ? '✓' : ''}</span> M
                      <span style={{ marginLeft: 8 }} className="checkbox">{String(fullForm.gender).toLowerCase() === 'female' ? '✓' : ''}</span> F
                      <span style={{ marginLeft: 12 }}><strong>CATEGORY:</strong>{' '}</span>
                      <span className="checkbox">{String(fullForm.category).toLowerCase() === 'driver' ? '✓' : ''}</span> DRIVER
                      <span style={{ marginLeft: 8 }} className="checkbox">{String(fullForm.category).toLowerCase() === 'passenger' ? '✓' : ''}</span> PASSENGER
                      <span style={{ marginLeft: 8 }} className="checkbox">{String(fullForm.category).toLowerCase() === 'patient' ? '✓' : ''}</span> PATIENT
                    </td>
                    <td colSpan="2">
                      <strong>TIME ARRIVED AT SCENE:</strong>{' '}
                      <span className="underline" style={{ minWidth: '90px' }}>{formatTime(fullForm.timeArrivedScene)}</span>
                      <span style={{ marginLeft: 12 }}><strong>TIME LEFT SCENE:</strong>{' '}</span>
                      <span className="underline" style={{ minWidth: '90px' }}>{formatTime(fullForm.timeLeftScene)}</span>
                      <span style={{ marginLeft: 12 }}><strong>TIME ARRIVED AT HOSPITAL:</strong>{' '}</span>
                      <span className="underline" style={{ minWidth: '90px' }}>{formatTime(fullForm.timeArrivedHospital)}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>BLOOD PRESSURE</strong> <span className="underline" style={{ minWidth: '80px' }}>{fullForm.bloodPressure || ''}</span>{'  '}
                      <strong>PR</strong> <span className="underline" style={{ minWidth: '60px' }}>{fullForm.pr || ''}</span>{'  '}
                      <strong>RR</strong> <span className="underline" style={{ minWidth: '60px' }}>{fullForm.rr || ''}</span>{'  '}
                      <strong>O2SAT</strong> <span className="underline" style={{ minWidth: '60px' }}>{fullForm.o2sat || ''}</span>{'  '}
                      <strong>TEMPERATURE</strong> <span className="underline" style={{ minWidth: '70px' }}>{fullForm.temp || ''}</span>
                    </td>
                    <td style={{ width: '30%' }}>
                      <strong>UNDER INFLUENCE:</strong><br />
                      <span className="checkbox">{fullForm.underInfluence?.alcohol ? '✓' : ''}</span> ALCOHOL
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.underInfluence?.drugs ? '✓' : ''}</span> DRUGS
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.underInfluence?.unknown ? '✓' : ''}</span> UNKNOWN
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.underInfluence?.none ? '✓' : ''}</span> N/A
                    </td>
                    <td style={{ width: '18%' }}>
                      <strong>EVACUATION CODE:</strong><br />
                      <span className="checkbox">{fullForm.evacuationCode?.black ? '✓' : ''}</span> BLACK
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.evacuationCode?.red ? '✓' : ''}</span> RED
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.evacuationCode?.yellow ? '✓' : ''}</span> YELLOW
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.evacuationCode?.green ? '✓' : ''}</span> GREEN
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>HOME ADDRESS:</strong>{' '}
                      <span className="underline" style={{ minWidth: '340px' }}>{fullForm.homeAddress || ''}</span>
                    </td>
                    <td>
                      <strong>RESPONSE TEAM:</strong>{' '}
                      <span className="checkbox">{fullForm.responseTeam?.includes('TEAM 1') ? '✓' : ''}</span> TEAM 1
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.responseTeam?.includes('TEAM 2') ? '✓' : ''}</span> TEAM 2
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.responseTeam?.includes('TEAM 3') ? '✓' : ''}</span> TEAM 3
                    </td>
                    <td>
                      <strong>AMBULANCE NO:</strong>{' '}
                      <span className="underline" style={{ minWidth: '90px' }}>{fullForm.ambulanceNo || ''}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>CONTACT PERSON</strong>{' '}
                      <span className="underline" style={{ minWidth: '150px' }}>{fullForm.contactPerson || ''}</span>{'  '}
                      <strong>RELATIONSHIP</strong>{' '}
                      <span className="underline" style={{ minWidth: '110px' }}>{fullForm.relationship || ''}</span>{'  '}
                      <strong>CONTACT NUMBER</strong>{' '}
                      <span className="underline" style={{ minWidth: '130px' }}>{fullForm.contactNumber || ''}</span>
                    </td>
                    <td colSpan="2">
                      <strong>DOI:</strong> <span className="underline" style={{ minWidth: '80px' }}>{displayRaw(fullForm.doi)}</span>{'  '}
                      <strong>TOI:</strong> <span className="underline" style={{ minWidth: '80px' }}>{displayRaw(fullForm.toi)}</span>{'  '}
                      <strong>NOI:</strong> <span className="underline" style={{ minWidth: '80px' }}>{fullForm.noi || ''}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>LOSS OF CONSCIOUSNESS</strong>{' '}
                      <span className="checkbox">{String(fullForm.lossOfConsciousness).toLowerCase() === 'yes' ? '✓' : ''}</span> YES
                      <span style={{ marginLeft: 8 }} className="checkbox">{String(fullForm.lossOfConsciousness).toLowerCase() === 'no' ? '✓' : ''}</span> NO
                      <span style={{ marginLeft: 12 }}><strong>MINUTES:</strong>{' '}</span>
                      <span className="underline" style={{ minWidth: '70px' }}>{fullForm.lossOfConsciousnessMinutes || ''}</span>
                    </td>
                    <td colSpan="2">
                      <strong>POI:</strong>{' '}
                      <strong>BRGY:</strong> <span className="underline" style={{ minWidth: '140px' }}>{fullForm.poi?.brgy || ''}</span>{'  '}
                      <span className="checkbox">{fullForm.poi?.highway ? '✓' : ''}</span> HIGHWAY/ROAD
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.poi?.residence ? '✓' : ''}</span> RESIDENCE
                      <span style={{ marginLeft: 8 }} className="checkbox">{fullForm.poi?.publicBuilding ? '✓' : ''}</span> PUBLIC BUILDING/PLACE
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="3">
                      <strong>CHIEF COMPLAINT/S:</strong>{' '}
                      <span className="underline" style={{ minWidth: '520px' }}>{fullForm.chiefComplaints || ''}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3">
                      <strong>INTERVENTIONS:</strong>{' '}
                      <span className="underline" style={{ minWidth: '560px' }}>{fullForm.interventions || ''}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="form-table">
                <tbody>
                  <tr>
                    <td colSpan="2" className="form-header">HISTORY</td>
                    <td className="form-header">NARRATIVE OF THE INCIDENT</td>
                  </tr>
                  <tr>
                    <td style={{ width: '30%' }}><strong>SIGNS & SYMPTOMS:</strong></td>
                    <td style={{ width: '30%' }}>{fullForm.signsSymptoms || ''}</td>
                    <td rowSpan="6" style={{ width: '40%', minHeight: '120px' }}>{fullForm.narrative || ''}</td>
                  </tr>
                  <tr>
                    <td><strong>ALLERGIES:</strong></td>
                    <td>{fullForm.allergies || ''}</td>
                  </tr>
                  <tr>
                    <td><strong>MEDICATION:</strong></td>
                    <td>{fullForm.medication || ''}</td>
                  </tr>
                  <tr>
                    <td><strong>PAST HISTORY:</strong></td>
                    <td>{fullForm.pastHistory || ''}</td>
                  </tr>
                  <tr>
                    <td><strong>LAST INTAKE:</strong></td>
                    <td>{fullForm.lastIntake || ''}</td>
                  </tr>
                  <tr>
                    <td><strong>EVENTS:</strong></td>
                    <td>{fullForm.events || ''}</td>
                  </tr>
                </tbody>
              </table>

              <table className="form-table">
                <tbody>
                  <tr>
                    <td colSpan="2" className="form-header">ADDITIONAL NOTES</td>
                  </tr>
                  <tr>
                    <td style={{ width: '50%', height: '120px' }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: 120, height: 110, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FRONT</div>
                        <div style={{ width: 120, height: 110, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BACK</div>
                      </div>
                    </td>
                    <td style={{ width: '50%' }}>
                      <div style={{ fontWeight: 700 }}>Waiver of Treatment / Patient Refusal</div>
                      <div className="tiny" style={{ marginTop: 4, textAlign: 'justify' }}>
                        I acknowledge that I have been informed that my medical condition requires immediate treatment and/or transport to a physician and that with refusing further emergency medical treatment there is a risk of serious injury, illness, or death. Understanding these risks, I hereby release the attending medical personnel, their home agency, and their advising physician from all responsibility regarding any ill effects which may result from this decision.
                      </div>
                      <table style={{ width: '100%', marginTop: 6, fontSize: '8px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%' }}>
                              <div><strong>Patient Signature:</strong></div>
                              <div className="signature-box">
                                {fullForm.patientSignature ? (
                                  <img src={fullForm.patientSignature} alt="Patient Signature" style={{ maxWidth: '100%', maxHeight: '24px', objectFit: 'contain' }} />
                                ) : ''}
                              </div>
                              <div>Date: <span className="underline" style={{ minWidth: '90px' }}>{formatPHDate(fullForm.patientSignatureDate)}</span></div>
                            </td>
                            <td style={{ width: '50%' }}>
                              <div><strong>Witness Signature:</strong></div>
                              <div className="signature-box">
                                {fullForm.witnessSignature ? (
                                  <img src={fullForm.witnessSignature} alt="Witness Signature" style={{ maxWidth: '100%', maxHeight: '24px', objectFit: 'contain' }} />
                                ) : ''}
                              </div>
                              <div>Date: <span className="underline" style={{ minWidth: '90px' }}>{formatPHDate(fullForm.witnessSignatureDate)}</span></div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="form-table">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }}>
                      <div><strong>DRIVER:</strong> <span className="underline" style={{ minWidth: '220px' }}>{fullForm.driver || ''}</span></div>
                      <div><strong>TEAM LEADER:</strong> <span className="underline" style={{ minWidth: '200px' }}>{fullForm.teamLeader || ''}</span></div>
                      <div><strong>CREW:</strong> <span className="underline" style={{ minWidth: '240px' }}>{fullForm.crew || ''}</span></div>
                    </td>
                    <td style={{ width: '50%' }}>
                      <div className="form-header">RECEIVING HOSPITAL</div>
                      <div style={{ marginTop: 4 }}><strong>NAME:</strong> <span className="underline" style={{ minWidth: '240px' }}>{fullForm.receivingName || ''}</span></div>
                      <div style={{ marginTop: 4 }}><strong>SIGNATURE:</strong></div>
                      <div className="signature-box" style={{ height: 28 }}>
                        {fullForm.receivingSignature ? (
                          <img src={fullForm.receivingSignature} alt="Receiving Signature" style={{ maxWidth: '100%', maxHeight: '26px', objectFit: 'contain' }} />
                        ) : ''}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
}
