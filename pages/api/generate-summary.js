import logger from '@/lib/logger';
import { generateAINarrative, checkOllamaHealth } from '@/lib/ollama';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    const useAI = req.body.useAI !== false; // Default to true unless explicitly disabled

    let summary;
    let method = 'rule-based';

    // Try AI generation first if enabled
    if (useAI) {
      try {
        const aiSummary = await generateAINarrative(formData);
        if (aiSummary) {
          summary = aiSummary;
          method = 'ai';
          logger.info('Generated narrative using AI');
        }
      } catch (aiError) {
        logger.warn('AI generation failed, falling back to rule-based:', aiError.message);
      }
    }

    // Fallback to rule-based generation
    if (!summary) {
      summary = generateNarrative(formData);
      logger.info('Generated narrative using rule-based method');
    }

    return res.status(200).json({ 
      success: true, 
      summary,
      method // Return which method was used
    });
  } catch (error) {
    logger.error('Error generating summary:', error.message);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}

function generateNarrative(data) {
  const parts = [];

  // Case Type with Description
  if (data.caseType) {
    const caseTypeDescription = getCaseTypeDescription(data.caseType);
    parts.push(`Incident Type: ${caseTypeDescription}`);
  }

  // Alert Description (from database)
  if (data.description) {
    parts.push(`Alert Description: ${data.description}`);
  }

  // Patient Information
  if (data.patientName) {
    const age = data.age ? `, ${data.age} years old` : '';
    const gender = data.gender ? `, ${data.gender}` : '';
    parts.push(`Patient ${data.patientName}${age}${gender}`);
  }

  // Chief Complaint
  if (data.chiefComplaints) {
    parts.push(`presented with ${data.chiefComplaints.toLowerCase()}`);
  }

  // Location and Time
  const locationParts = [];
  if (data.location) {
    locationParts.push(`at ${data.location}`);
  } else if (data.poi?.brgy) {
    locationParts.push(`at Brgy. ${data.poi.brgy}`);
  }
  
  if (data.homeAddress) {
    locationParts.push(`(residence: ${data.homeAddress})`);
  }

  if (locationParts.length > 0) {
    parts.push(locationParts.join(' '));
  }

  // Date and Time of Incident
  if (data.date || data.toi) {
    const dateStr = data.date ? `on ${formatDate(data.date)}` : '';
    const timeStr = data.toi ? `at ${data.toi}` : '';
    if (dateStr || timeStr) {
      parts.push(`${dateStr} ${timeStr}`.trim());
    }
  }

  // Call and Response Timeline
  const timeline = [];
  if (data.timeCall) {
    timeline.push(`Emergency call received at ${data.timeCall}`);
  }
  if (data.timeArrivedScene) {
    timeline.push(`Response team arrived on scene at ${data.timeArrivedScene}`);
  }
  if (data.timeLeftScene) {
    timeline.push(`Departed scene at ${data.timeLeftScene}`);
  }
  if (data.timeArrivedHospital && data.hospitalTransported) {
    timeline.push(`Arrived at ${data.hospitalTransported} at ${data.timeArrivedHospital}`);
  }

  // Vital Signs
  const vitals = [];
  if (data.bloodPressure) vitals.push(`BP: ${data.bloodPressure}`);
  if (data.pr) vitals.push(`PR: ${data.pr}`);
  if (data.rr) vitals.push(`RR: ${data.rr}`);
  if (data.o2sat) vitals.push(`O2Sat: ${data.o2sat}`);
  if (data.temp) vitals.push(`Temp: ${data.temp}`);

  if (vitals.length > 0) {
    parts.push(`Vital signs: ${vitals.join(', ')}`);
  }

  // Signs and Symptoms
  if (data.signsSymptoms) {
    parts.push(`Observed signs/symptoms: ${data.signsSymptoms}`);
  }

  // Interventions
  if (data.interventions) {
    parts.push(`Interventions provided: ${data.interventions}`);
  }

  // Response Team
  const team = [];
  if (data.driver) team.push(`Driver: ${data.driver}`);
  if (data.teamLeader) team.push(`Team Leader: ${data.teamLeader}`);
  if (data.crew) team.push(`Crew: ${data.crew}`);
  
  if (team.length > 0) {
    parts.push(`Response team - ${team.join(', ')}`);
  }

  // Ambulance
  if (data.ambulanceNo) {
    parts.push(`Ambulance Unit: ${data.ambulanceNo}`);
  }

  // Medical History
  if (data.medicalHistory) {
    parts.push(`Medical history: ${data.medicalHistory}`);
  }

  // Allergies
  if (data.allergies) {
    parts.push(`Known allergies: ${data.allergies}`);
  }

  // Medications
  if (data.medications) {
    parts.push(`Current medications: ${data.medications}`);
  }

  // Assessment
  if (data.assessment) {
    parts.push(`Assessment: ${data.assessment}`);
  }

  // Treatment Provided
  if (data.treatment) {
    parts.push(`Treatment provided: ${data.treatment}`);
  }

  // Patient Disposition
  if (data.disposition) {
    parts.push(`Patient disposition: ${data.disposition}`);
  }

  // Body Diagram Injuries
  if (data.bodyDiagram && Array.isArray(data.bodyDiagram) && data.bodyDiagram.length > 0) {
    const injuries = data.bodyDiagram
      .filter(entry => entry && entry.bodyPart && entry.condition)
      .map(entry => `${entry.condition} on ${entry.bodyPart}`)
      .join(', ');
    if (injuries) {
      parts.push(`Documented injuries: ${injuries}`);
    }
  }

  // Under Influence
  if (data.underInfluence) {
    const influences = [];
    if (data.underInfluence.alcohol) influences.push('alcohol');
    if (data.underInfluence.drugs) influences.push('drugs');
    if (influences.length > 0) {
      parts.push(`Patient appeared to be under the influence of: ${influences.join(', ')}`);
    }
  }

  // Relationship to Patient
  if (data.relationshipToPatient && data.relationshipToPatient !== 'Other') {
    parts.push(`Relationship to patient: ${data.relationshipToPatient}`);
  } else if (data.relationshipOther) {
    parts.push(`Relationship to patient: ${data.relationshipOther}`);
  }

  // Category (Driver/Passenger/Patient)
  if (data.category) {
    parts.push(`Category: ${data.category}`);
  }

  // Recorder Information
  if (data.recorder) {
    parts.push(`Report recorded by: ${data.recorder}`);
  }

  // Join all parts with proper punctuation
  let narrative = parts.join('. ');
  
  // Clean up and format
  narrative = narrative
    .replace(/\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Ensure it ends with a period
  if (narrative && !narrative.endsWith('.')) {
    narrative += '.';
  }

  return narrative || 'No sufficient data to generate summary.';
}

function getCaseTypeDescription(caseType) {
  const caseTypeDescriptions = {
    'single_vehicle': 'Single Vehicle Crash - An incident involving a single vehicle that crashed or lost control',
    'rear_end': 'Rear-End Collision - A vehicle collision where one vehicle crashes into the back of another',
    'sideswipe': 'Sideswipe Collision - A collision where the sides of two parallel vehicles make contact',
    'head_on': 'Head-On Collision - A frontal collision between two vehicles traveling in opposite directions',
    't_bone': 'T-Bone Collision - A side-impact collision forming a "T" shape',
    'rollover': 'Rollover Accident - A vehicle overturned or rolled over',
    'hit_and_run': 'Hit and Run - A collision where the responsible party fled the scene',
    'pedestrian': 'Pedestrian Accident - An incident involving a pedestrian struck by a vehicle',
    'motorcycle': 'Motorcycle Accident - An incident involving a motorcycle',
    'bicycle': 'Bicycle Accident - An incident involving a bicycle',
    'multi_vehicle': 'Multi-Vehicle Collision - An incident involving three or more vehicles',
    'medical_emergency': 'Medical Emergency - A health-related emergency requiring immediate medical attention',
    'fire': 'Fire Incident - A fire emergency requiring response',
    'natural_disaster': 'Natural Disaster - An emergency caused by natural phenomena',
    'other': 'Other Incident - An incident not categorized above',
  };

  return caseTypeDescriptions[caseType] || caseType;
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
}
