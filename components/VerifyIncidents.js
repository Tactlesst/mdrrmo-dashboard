'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { FiCheck, FiX, FiAlertCircle, FiMapPin, FiClock, FiUser, FiFileText, FiShare2, FiNavigation, FiMessageSquare, FiPlus } from 'react-icons/fi';
import { getAuthUser } from '@/lib/auth';
import Swal from 'sweetalert2';
import { swrJsonFetcher } from '@/lib/swrFetcher';

export default function VerifyIncidents({ onView, onVerified, refreshRef }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [referralAuthority, setReferralAuthority] = useState('');
  const [showReferralOptions, setShowReferralOptions] = useState(false);
  const [adminName, setAdminName] = useState('MDRRMO Admin');
  const [showSmsParser, setShowSmsParser] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [parsingSms, setParsingSms] = useState(false);

  // Get admin name from auth cookie
  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser && authUser.name) {
      setAdminName(authUser.name);
    }
  }, []);

  // Authority options for referral
  const authorities = [
    { value: 'police', label: 'Police Department (PNP)' },
    { value: 'fire', label: 'Fire Department (BFP)' },
    { value: 'medical', label: 'Medical Emergency (Hospital)' },
    { value: 'barangay', label: 'Barangay Officials' },
    { value: 'dpwh', label: 'DPWH (Infrastructure)' },
    { value: 'environmental', label: 'Environmental Agency' },
    { value: 'other', label: 'Other Authority' },
  ];

  const wsEnabled = Boolean(process.env.NEXT_PUBLIC_WS_BASE_URL);

  const {
    data,
    isLoading,
    mutate,
  } = useSWR('/api/alerts/unverified', swrJsonFetcher, {
    refreshInterval: wsEnabled ? 0 : 30000,
    revalidateOnFocus: true,
  });

  const unverifiedAlerts = data?.alerts || [];
  const loading = isLoading;

  // Expose refresh via ref so parent can trigger refresh
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => mutate();
    }
  }, [refreshRef, mutate]);

  // WS-triggered refresh (stop polling when WS is enabled)
  useEffect(() => {
    if (!wsEnabled) return;

    const httpBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const wsBase = httpBase
      .replace(/^https:\/\//i, 'wss://')
      .replace(/^http:\/\//i, 'ws://')
      .replace(/\/+$/, '');

    const url = `${wsBase}/ws/notifications?channel=all`;
    const ws = new WebSocket(url);
    let timer = null;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.channel === 'alerts') {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            mutate();
          }, 250);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      if (timer) clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [wsEnabled, mutate]);

  // Handle verification
  const handleVerify = async (alertId, isApproved) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/alerts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          isApproved,
          notes: verificationNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Remove from list
        mutate(
          (current) => {
            const currentAlerts = current?.alerts || [];
            return {
              ...current,
              alerts: currentAlerts.filter((a) => a.id !== alertId),
            };
          },
          { revalidate: false }
        );
        setSelectedAlert(null);
        setVerificationNotes('');
        setShowReferralOptions(false);
        setReferralAuthority('');
        
        // Trigger parent refresh
        if (onVerified) {
          onVerified();
        }
        
        // Show success message with SweetAlert2
        Swal.fire({
          icon: isApproved ? 'success' : 'info',
          title: isApproved ? 'Verified!' : 'Rejected',
          text: isApproved 
            ? 'Alert verified and sent to responders' 
            : 'Alert has been rejected',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          width: '300px',
          padding: '10px',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to process verification',
          confirmButtonColor: '#DC2626',
          width: '300px',
          padding: '10px',
        });
      }
    } catch (err) {
      console.error('Error verifying alert:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error processing verification',
        confirmButtonColor: '#DC2626',
        width: '300px',
        padding: '10px',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle referral to other authority
  const handleReferral = async (alertId) => {
    if (!referralAuthority) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Selection',
        text: 'Please select an authority to refer to',
        confirmButtonColor: '#2563EB',
        width: '300px',
        padding: '10px',
      });
      return;
    }

    setProcessing(true);
    try {
      // First verify the alert
      const verifyRes = await fetch('/api/alerts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          isApproved: true,
          notes: verificationNotes,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error verifying incident',
          confirmButtonColor: '#DC2626',
          width: '300px',
          padding: '10px',
        });
        setProcessing(false);
        return;
      }

      // Then refer it to the selected authority
      const referRes = await fetch('/api/alerts/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          authority: referralAuthority,
          notes: verificationNotes,
          referredBy: adminName,
        }),
      });

      const referData = await referRes.json();
      if (referData.success) {
        // Remove from list
        mutate(
          (current) => {
            const currentAlerts = current?.alerts || [];
            return {
              ...current,
              alerts: currentAlerts.filter((a) => a.id !== alertId),
            };
          },
          { revalidate: false }
        );
        setSelectedAlert(null);
        setVerificationNotes('');
        setShowReferralOptions(false);
        setReferralAuthority('');
        
        // Trigger parent refresh
        if (onVerified) {
          onVerified();
        }
        
        const authorityName = authorities.find(a => a.value === referralAuthority)?.label;
        Swal.fire({
          icon: 'success',
          title: 'Referred!',
          text: `Alert verified and referred to ${authorityName}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          width: '300px',
          padding: '10px',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: referData.message || 'Failed to refer incident',
          confirmButtonColor: '#DC2626',
          width: '400px',
          padding: '15px',
        });
      }
    } catch (err) {
      console.error('Error referring alert:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error processing referral',
        confirmButtonColor: '#DC2626',
        width: '400px',
        padding: '15px',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Parse SMS message and create alert
  const parseSmsMessage = (message) => {
    try {
      const lines = message.trim().split('\n');
      const result = {
        phoneNumber: null,
        description: '',
        location: '',
        coordinates: null
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Extract phone number from "send From" line
        if (line.toLowerCase().includes('send from') || line.toLowerCase().includes('from')) {
          const phoneMatch = line.match(/(\d{11}|\+?\d{12,13})/);
          if (phoneMatch) {
            result.phoneNumber = phoneMatch[1];
          }
        }
        // Extract location
        else if (line.toLowerCase().startsWith('location:')) {
          result.location = line.substring(9).trim();
        }
        // Extract coordinates
        else if (line.toLowerCase().startsWith('coords:')) {
          const coordsText = line.substring(7).trim();
          const coordsMatch = coordsText.match(/([\d.-]+)[,\s]+([\d.-]+)/);
          if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              result.coordinates = { lat, lng };
            }
          }
        }
        // Extract message content (lines that are not metadata)
        else if (line && 
                 !line.toLowerCase().includes('send from') &&
                 !line.toLowerCase().startsWith('location:') &&
                 !line.toLowerCase().startsWith('coords:')) {
          if (result.description) {
            result.description += ' ' + line;
          } else {
            result.description = line;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing SMS:', error);
      return null;
    }
  };

  // Handle SMS message submission
  const handleSmsSubmit = async () => {
    if (!smsMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Message',
        text: 'Please paste the SMS message content',
        confirmButtonColor: '#2563EB',
        width: '400px',
        padding: '15px',
      });
      return;
    }

    setParsingSms(true);
    try {
      const parsed = parseSmsMessage(smsMessage);
      
      if (!parsed || !parsed.coordinates) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid SMS Format',
          text: 'Could not parse coordinates from SMS message. Please check the format.',
          confirmButtonColor: '#DC2626',
          width: '450px',
          padding: '15px',
        });
        setParsingSms(false);
        return;
      }

      // Create alert from parsed SMS
      const alertData = {
        type: 'Emergency',
        lat: parsed.coordinates.lat,
        lng: parsed.coordinates.lng,
        address: parsed.location || `Lat: ${parsed.coordinates.lat}, Lng: ${parsed.coordinates.lng}`,
        description: parsed.description || 'Emergency SMS Alert',
        occurred_at: new Date().toISOString(),
        contact: parsed.phoneNumber,
        source: 'SMS',
        created_by: adminName,
        severity: 'medium' // SMS alerts default to medium priority
      };

      const res = await fetch('/api/alerts/create-from-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });

      const data = await res.json();
      if (data.success) {
        // Clear form and close modal
        setSmsMessage('');
        setShowSmsParser(false);
        
        // Refresh alerts list
        mutate();
        
        Swal.fire({
          icon: 'success',
          title: 'SMS Alert Created!',
          text: `Alert created from SMS message. Phone: ${parsed.phoneNumber || 'Unknown'}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          width: '350px',
          padding: '10px',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to create alert from SMS',
          confirmButtonColor: '#DC2626',
          width: '400px',
          padding: '15px',
        });
      }
    } catch (err) {
      console.error('Error creating SMS alert:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error processing SMS message',
        confirmButtonColor: '#DC2626',
        width: '400px',
        padding: '15px',
      });
    } finally {
      setParsingSms(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading incidents for verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiAlertCircle className="text-orange-600" />
            Verify Incidents
          </h1>
          <button
            onClick={() => setShowSmsParser(!showSmsParser)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-blue-700 transition-colors"
          >
            <FiMessageSquare className="w-3 h-3" />
            Add SMS Alert
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Review before dispatch
          </p>
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-semibold">
            {unverifiedAlerts.length} Pending
          </div>
        </div>
      </div>

      {/* SMS Parser Modal */}
      {showSmsParser && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <FiMessageSquare className="w-4 h-4" />
              Create Alert from SMS
            </h3>
            <button
              onClick={() => setShowSmsParser(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">
                Paste SMS Message:
              </label>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder={`Example format:\nsend From 09516569463\nEmergency message here\nLocation: Street Name, City\nCoords: 8.74541,124.77758`}
                className="w-full px-3 py-2 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows="5"
              />
            </div>
            
            <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
              <strong>Expected format:</strong>
              <br />• Line 1: "send From [phone number]"
              <br />• Line 2+: Emergency message
              <br />• "Location: [address or coordinates]"
              <br />• "Coords: [latitude,longitude]"
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSmsSubmit}
                disabled={parsingSms || !smsMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {parsingSms ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiPlus className="w-4 h-4" />
                )}
                {parsingSms ? 'Creating...' : 'Create Alert'}
              </button>
              <button
                onClick={() => {
                  setSmsMessage('');
                  setShowSmsParser(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {unverifiedAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <FiCheck className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">All Caught Up!</h3>
          <p className="text-xs text-gray-600">No pending verifications</p>
        </div>
      ) : (
        <>
          {/* Compact Alerts List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
            {unverifiedAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedAlert?.id === alert.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                      <span className="text-red-600">🚨</span>
                      {alert.type || 'Emergency'}
                      {/* NEW badge for alerts created within last 5 minutes */}
                      {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
                          NEW
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {alert.resident_name || alert.contact || 'Unknown'}
                    </p>
                    {alert.contact && (
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        📞 {alert.contact}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' :
                    alert.severity === 'high' ? 'bg-orange-500 text-white' :
                    alert.severity === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {alert.severity ? alert.severity.toUpperCase() : 'MED'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-1 text-gray-700">
                    <FiMapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{alert.address || 'Location unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <FiClock className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {alert.occurred_at
                        ? new Date(alert.occurred_at).toLocaleString('en-PH', {
                            timeZone: 'Asia/Manila',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Time unknown'}
                    </span>
                  </div>
                </div>

                {/* View Location Button - Always visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Validate coordinates
                    const lat = parseFloat(alert.lat);
                    const lng = parseFloat(alert.lng);
                    const hasValidCoords = 
                      !isNaN(lat) && 
                      !isNaN(lng) && 
                      isFinite(lat) && 
                      isFinite(lng) &&
                      lat >= -90 && 
                      lat <= 90 && 
                      lng >= -180 && 
                      lng <= 180;
                    
                    if (hasValidCoords && onView) {
                      onView(alert.id);
                    } else {
                      window.alert('Cannot view on map: Invalid location coordinates.');
                    }
                  }}
                  disabled={!alert.lat || !alert.lng}
                  className={`mt-2 w-full px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                    alert.lat && alert.lng
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiNavigation className="w-3 h-3" />
                  View Location
                </button>

                {selectedAlert?.id === alert.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {/* Referral Option - Always Available */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                      <p className="text-xs text-blue-800 font-semibold mb-1">
                        💡 Need to refer this incident to another authority?
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReferralOptions(!showReferralOptions);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        {showReferralOptions ? 'Hide referral options' : 'Show referral options'}
                      </button>
                    </div>

                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add verification notes..."
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="2"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Referral Options */}
                    {showReferralOptions && (
                      <div className="space-y-2 p-2 bg-orange-50 border border-orange-200 rounded" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-semibold text-gray-700">
                          Refer to Authority:
                        </label>
                        <select
                          value={referralAuthority}
                          onChange={(e) => setReferralAuthority(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="">Select authority...</option>
                          {authorities.map((auth) => (
                            <option key={auth.value} value={auth.value}>
                              {auth.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {showReferralOptions && referralAuthority ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReferral(alert.id);
                            }}
                            disabled={processing}
                            className="flex-1 bg-orange-600 text-white px-3 py-1.5 rounded text-xs hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <FiShare2 className="w-3 h-3" />
                            Refer & Verify
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(alert.id, false);
                            }}
                            disabled={processing}
                            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <FiX className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(alert.id, true);
                            }}
                            disabled={processing}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <FiCheck className="w-3 h-3" />
                            Verify
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(alert.id, false);
                            }}
                            disabled={processing}
                            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <FiX className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
