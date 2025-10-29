import { Ollama } from 'ollama';
import logger from './logger';

// Initialize Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434'
});

// Default model configuration
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const FALLBACK_ENABLED = process.env.OLLAMA_FALLBACK !== 'false';

/**
 * Generate AI narrative from PCR form data
 * @param {Object} formData - PCR form data
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Generated narrative
 */
export async function generateAINarrative(formData, options = {}) {
  try {
    const prompt = buildMedicalPrompt(formData);
    
    const response = await ollama.generate({
      model: options.model || DEFAULT_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent medical narratives
        top_p: 0.9,
        top_k: 40,
        num_predict: 500, // Max tokens
      }
    });

    if (!response || !response.response) {
      throw new Error('Empty response from Ollama');
    }

    // Clean and format the response
    const narrative = cleanNarrative(response.response);
    
    logger.info('AI narrative generated successfully', {
      model: options.model || DEFAULT_MODEL,
      promptLength: prompt.length,
      responseLength: narrative.length
    });

    return narrative;

  } catch (error) {
    logger.error('Error generating AI narrative:', error.message);
    
    if (FALLBACK_ENABLED) {
      logger.info('Falling back to rule-based narrative generation');
      return null; // Signal to use fallback
    }
    
    throw error;
  }
}

/**
 * Build medical prompt from form data
 * @param {Object} data - Form data
 * @returns {string} - Formatted prompt
 */
function buildMedicalPrompt(data) {
  const sections = [];

  // System instruction
  sections.push('You are a medical professional writing a concise, professional Patient Care Report (PCR) narrative. Write in third person, past tense, using clear medical terminology.');
  sections.push('\nGenerate a brief narrative based on the following information:\n');

  // Case Type
  if (data.caseType) {
    sections.push(`Incident Type: ${getCaseTypeDescription(data.caseType)}`);
  }

  // Alert Description
  if (data.description) {
    sections.push(`Alert: ${data.description}`);
  }

  // Patient Information
  if (data.patientName) {
    const age = data.age ? `, ${data.age} years old` : '';
    const gender = data.gender ? `, ${data.gender}` : '';
    sections.push(`Patient: ${data.patientName}${age}${gender}`);
  }

  // Chief Complaint
  if (data.chiefComplaints) {
    sections.push(`Chief Complaint: ${data.chiefComplaints}`);
  }

  // Location and Time
  if (data.location) {
    sections.push(`Location: ${data.location}`);
  } else if (data.poi?.brgy) {
    sections.push(`Location: Brgy. ${data.poi.brgy}`);
  }

  if (data.homeAddress) {
    sections.push(`Residence: ${data.homeAddress}`);
  }

  if (data.date) {
    sections.push(`Date: ${data.date}`);
  }

  if (data.toi) {
    sections.push(`Time of Incident: ${data.toi}`);
  }

  // Timeline
  if (data.timeCall) {
    sections.push(`Call Received: ${data.timeCall}`);
  }
  if (data.timeArrivedScene) {
    sections.push(`Arrived on Scene: ${data.timeArrivedScene}`);
  }
  if (data.timeLeftScene) {
    sections.push(`Left Scene: ${data.timeLeftScene}`);
  }
  if (data.timeArrivedHospital && data.hospitalTransported) {
    sections.push(`Arrived at ${data.hospitalTransported}: ${data.timeArrivedHospital}`);
  }

  // Vital Signs
  const vitals = [];
  if (data.bloodPressure) vitals.push(`BP: ${data.bloodPressure}`);
  if (data.pr) vitals.push(`PR: ${data.pr}`);
  if (data.rr) vitals.push(`RR: ${data.rr}`);
  if (data.o2sat) vitals.push(`O2Sat: ${data.o2sat}%`);
  if (data.temp) vitals.push(`Temp: ${data.temp}`);
  
  if (vitals.length > 0) {
    sections.push(`Vital Signs: ${vitals.join(', ')}`);
  }

  // Signs and Symptoms
  if (data.signsSymptoms) {
    sections.push(`Signs/Symptoms: ${data.signsSymptoms}`);
  }

  // Medical History
  if (data.medicalHistory) {
    sections.push(`Medical History: ${data.medicalHistory}`);
  }

  // Allergies
  if (data.allergies) {
    sections.push(`Allergies: ${data.allergies}`);
  }

  // Medications
  if (data.medications) {
    sections.push(`Current Medications: ${data.medications}`);
  }

  // Assessment
  if (data.assessment) {
    sections.push(`Assessment: ${data.assessment}`);
  }

  // Interventions
  if (data.interventions) {
    sections.push(`Interventions: ${data.interventions}`);
  }

  // Treatment
  if (data.treatment) {
    sections.push(`Treatment: ${data.treatment}`);
  }

  // Disposition
  if (data.disposition) {
    sections.push(`Disposition: ${data.disposition}`);
  }

  // Body Diagram Injuries
  if (data.bodyDiagram && Array.isArray(data.bodyDiagram) && data.bodyDiagram.length > 0) {
    const injuries = data.bodyDiagram
      .filter(entry => entry && entry.bodyPart && entry.condition)
      .map(entry => `${entry.condition} on ${entry.bodyPart}`)
      .join(', ');
    if (injuries) {
      sections.push(`Injuries: ${injuries}`);
    }
  }

  // Response Team
  const team = [];
  if (data.driver) team.push(`Driver: ${data.driver}`);
  if (data.teamLeader) team.push(`Team Leader: ${data.teamLeader}`);
  if (data.crew) team.push(`Crew: ${data.crew}`);
  if (team.length > 0) {
    sections.push(`Response Team: ${team.join(', ')}`);
  }

  // Ambulance
  if (data.ambulanceNo) {
    sections.push(`Ambulance: ${data.ambulanceNo}`);
  }

  // Recorder
  if (data.recorder) {
    sections.push(`Recorded by: ${data.recorder}`);
  }

  sections.push('\nWrite a professional, concise narrative (3-5 sentences) summarizing this emergency response. Focus on the key medical facts and timeline.');

  return sections.join('\n');
}

/**
 * Clean and format AI-generated narrative
 * @param {string} text - Raw AI output
 * @returns {string} - Cleaned narrative
 */
function cleanNarrative(text) {
  return text
    .trim()
    .replace(/\n\n+/g, ' ') // Replace multiple newlines with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\.\s*\./g, '.') // Remove duplicate periods
    .trim();
}

/**
 * Get case type description
 * @param {string} caseType - Case type code
 * @returns {string} - Human-readable description
 */
function getCaseTypeDescription(caseType) {
  const descriptions = {
    'single_vehicle': 'Single Vehicle Crash',
    'rear_end': 'Rear-End Collision',
    'sideswipe': 'Sideswipe Collision',
    'head_on': 'Head-On Collision',
    't_bone': 'T-Bone Collision',
    'rollover': 'Rollover Accident',
    'hit_and_run': 'Hit and Run',
    'pedestrian': 'Pedestrian Accident',
    'motorcycle': 'Motorcycle Accident',
    'bicycle': 'Bicycle Accident',
    'multi_vehicle': 'Multi-Vehicle Collision',
    'medical_emergency': 'Medical Emergency',
    'fire': 'Fire Incident',
    'natural_disaster': 'Natural Disaster',
    'other': 'Other Incident',
  };
  return descriptions[caseType] || caseType;
}

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>}
 */
export async function checkOllamaHealth() {
  try {
    const response = await fetch(`${process.env.OLLAMA_HOST || 'http://localhost:11434'}/api/tags`);
    return response.ok;
  } catch (error) {
    logger.warn('Ollama health check failed:', error.message);
    return false;
  }
}

/**
 * List available models
 * @returns {Promise<Array>}
 */
export async function listModels() {
  try {
    const response = await ollama.list();
    return response.models || [];
  } catch (error) {
    logger.error('Error listing Ollama models:', error.message);
    return [];
  }
}

export default {
  generateAINarrative,
  checkOllamaHealth,
  listModels
};
