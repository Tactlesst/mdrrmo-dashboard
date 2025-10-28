# Incident Timing Logic

## Overview
This document clarifies the timing logic for incident tracking in the MDRRMO Dashboard system.

## Timing Fields

### From Alerts Table
- **responded_at**: Timestamp when a responder accepts/responds to an alert
- **created_at**: Timestamp when the alert was created (fallback if responded_at is not set)

### From PCR Forms
- **timeCall**: Time when responders responded to the alert (AUTO-POPULATED from alert's responded_at or created_at)
- **timeArrivedScene**: Time when response team arrived at the scene (manually entered)
- **timeLeftScene**: Time when team departed from the scene (manually entered)
- **timeArrivedHospital**: Time when arrived at hospital if applicable (manually entered)

## Incident Timing Requirements

### Call Time (Start Time)
- **Definition**: When responders respond to the alert
- **Source**: `responded_at` field from `alerts` table
- **Usage**: Marks the beginning of the response

### End Time (Resolution Time)
- **Definition**: When the incident is resolved (arrival at scene)
- **Source**: `timeArrivedScene` field from PCR form
- **Condition**: If `timeArrivedScene` is blank/null, end time should also be blank
- **Usage**: Marks when responders arrive and can begin handling the incident

## Response Time Calculation
- **Formula**: `End Time - Call Time`
- **Meaning**: Time taken from when responders accept the alert to when they arrive at the scene
- **Note**: Only calculated when both times are available

## Implementation Notes
1. The system links PCR forms to their corresponding alerts via `alert_id`
2. **AUTO-POPULATION**: When an alert is selected in the PCR form, the `timeCall` field is automatically populated from the alert's `responded_at` timestamp (or `created_at` as fallback)
3. Response time metrics use `responded_at` as the start point
4. Arrival at scene (`timeArrivedScene`) marks the completion of the response phase
5. If arrival time is not recorded, the incident is considered "in progress" or "incomplete"
6. Users can manually override the auto-populated time if needed
