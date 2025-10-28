# Timing Logic Updates Summary

## Overview
Updated the MDRRMO Dashboard to correctly implement incident timing logic where:
- **Call Time** = When responders respond to the alert
- **End Time (Resolution)** = When responders arrive at the scene
- If arrival at scene is blank, end time remains blank

## Changes Made

### 1. Documentation Created
- **TIMING_LOGIC.md** - Comprehensive documentation of timing requirements and implementation notes

### 2. API Endpoint Created
- **pages/api/analytics/response-times.js** - New endpoint to calculate response times
  - Joins alerts and PCR forms
  - Calculates response time as: `timeArrivedScene - responded_at`
  - Returns average response times overall and by alert type
  - Handles cases where arrival time is blank

### 3. Summary Generation Updated
- **pages/api/generate-summary.js**
  - Updated timeline narrative to clarify:
    - "Responders responded to alert at [time]" for call time
    - "Incident resolved - Response team arrived on scene at [time]" for end time

### 4. Form Labels Updated
- **components/PCRForm.js**
  - Changed "Time of Call" to "Time of Call (Responder Response)"
  - Added helper text: "When responders responded to the alert"
  - Changed "Time Arrived at Scene" to "Time Arrived at Scene (Resolution)"
  - Added helper text: "When responders arrived and resolved the incident"

### 5. View Components Updated
- **components/PCRView.js**
  - Updated labels to show "Time of Call (Responder Response)"
  - Updated labels to show "Arrived Scene (Resolution)"

- **components/PCRPrint.js**
  - Updated both text export and print view labels
  - Fixed bug where timeLeftScene and timeArrivedHospital were swapped
  - Updated labels to match new timing terminology

## Database Schema Reference

### Alerts Table
```sql
CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    address text,
    type text,
    status text DEFAULT 'Not Responded'::text,
    occurred_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responder_id integer,
    responded_at timestamp without time zone,  -- CALL TIME
    description text
);
```

### PCR Forms Table
```sql
CREATE TABLE public.pcr_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_name text NOT NULL,
    date date NOT NULL,
    location text,
    recorder text NOT NULL,
    full_form jsonb DEFAULT '{}'::jsonb NOT NULL,  -- Contains timeArrivedScene (END TIME)
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_type text NOT NULL,
    created_by_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
```

## Response Time Calculation

### Formula
```
Response Time = timeArrivedScene - responded_at
```

### Conditions
- Only calculated when both times are available
- If `timeArrivedScene` is blank/null, response time is not calculated
- Incident is considered "in progress" or "incomplete" without arrival time

## Usage

### To Get Response Time Analytics
```javascript
// GET /api/analytics/response-times
const response = await fetch('/api/analytics/response-times');
const data = await response.json();

// Returns:
// {
//   responseTimes: [...],           // Array of all incidents with timing data
//   averageResponseTime: 12.5,      // Average in minutes
//   responseTimesByType: [...],     // Grouped by alert type
//   totalIncidents: 50,
//   completedResponses: 45          // Incidents with both times recorded
// }
```

## Testing Recommendations

1. **Test with complete data**: Create PCR with both timeCall and timeArrivedScene
2. **Test with missing arrival time**: Create PCR with only timeCall (should show blank end time)
3. **Test response time calculation**: Verify calculation is correct in analytics endpoint
4. **Test form labels**: Verify all labels display correctly in form, view, and print modes

## Future Enhancements

1. Add visual indicators for incomplete incidents (missing arrival time)
2. Create dashboard widget showing average response times
3. Add alerts for incidents with unusually long response times
4. Generate reports comparing response times across different time periods
