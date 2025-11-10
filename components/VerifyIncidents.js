'use client';
import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiMapPin, FiClock, FiUser, FiFileText, FiShare2, FiNavigation } from 'react-icons/fi';
import { getAuthUser } from '@/lib/auth';

export default function VerifyIncidents({ onView }) {
  const [unverifiedAlerts, setUnverifiedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [referralAuthority, setReferralAuthority] = useState('');
  const [showReferralOptions, setShowReferralOptions] = useState(false);
  const [adminName, setAdminName] = useState('MDRRMO Admin');

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

  // Fetch unverified alerts
  const fetchUnverifiedAlerts = async () => {
    try {
      const res = await fetch('/api/alerts/unverified');
      const data = await res.json();
      if (data.success) {
        setUnverifiedAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching unverified alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnverifiedAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnverifiedAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

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
        setUnverifiedAlerts(prev => prev.filter(a => a.id !== alertId));
        setSelectedAlert(null);
        setVerificationNotes('');
        setShowReferralOptions(false);
        setReferralAuthority('');
        
        // Show success message
        alert(isApproved 
          ? 'Incident verified and sent to responders!' 
          : 'Incident rejected successfully.');
      } else {
        alert('Error: ' + (data.message || 'Failed to process verification'));
      }
    } catch (err) {
      console.error('Error verifying alert:', err);
      alert('Error processing verification');
    } finally {
      setProcessing(false);
    }
  };

  // Handle referral to other authority
  const handleReferral = async (alertId) => {
    if (!referralAuthority) {
      alert('Please select an authority to refer to');
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
        alert('Error verifying incident');
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
        setUnverifiedAlerts(prev => prev.filter(a => a.id !== alertId));
        setSelectedAlert(null);
        setVerificationNotes('');
        setShowReferralOptions(false);
        setReferralAuthority('');
        
        const authorityName = authorities.find(a => a.value === referralAuthority)?.label;
        alert(`Incident verified and referred to ${authorityName}`);
      } else {
        alert('Error: ' + (referData.message || 'Failed to refer incident'));
      }
    } catch (err) {
      console.error('Error referring alert:', err);
      alert('Error processing referral');
    } finally {
      setProcessing(false);
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
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FiAlertCircle className="text-orange-600" />
          Verify Incidents
        </h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-600">
            Review before dispatch
          </p>
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-semibold">
            {unverifiedAlerts.length} Pending
          </div>
        </div>
      </div>

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
                      {alert.resident_name || 'Unknown'}
                    </p>
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
