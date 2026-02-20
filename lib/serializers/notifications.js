export function serializeVerifiedEmergencyMessage({
  type,
  address,
  residentName,
}) {
  const safeType = type || 'Incident';
  const safeAddress = address || 'Unknown location';
  const safeResident = residentName || 'Unknown';
  return `🚨 VERIFIED EMERGENCY: ${safeType} at ${safeAddress}. Resident: ${safeResident}. Immediate response required!`;
}

export function serializePcrCreatedMessage({
  accountType,
  userName,
  patientName,
  now = new Date(),
}) {
  const safeAccountType = accountType || 'admin';
  const safeUserName = userName || 'System';
  const safePatientName = patientName || 'Unknown';
  return `${safeAccountType.charAt(0).toUpperCase() + safeAccountType.slice(1)} ${safeUserName} added a PCR form for patient ${safePatientName} on ${now.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })}`;
}

export function serializePcrUpdatedMessage({
  accountType,
  userName,
  patientName,
  now = new Date(),
}) {
  const safeAccountType = accountType || 'admin';
  const safeUserName = userName || 'System';
  const safePatientName = patientName || 'Unknown';
  return `${safeAccountType.charAt(0).toUpperCase() + safeAccountType.slice(1)} ${safeUserName} updated a PCR form for patient ${safePatientName} on ${now.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })}`;
}
