# Timing Data Flow Diagram

## Complete Incident Timing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     INCIDENT LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

1. ALERT CREATED
   ┌──────────────────┐
   │  User Reports    │
   │   Emergency      │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  Alert Created   │
   │  in Database     │
   │                  │
   │  created_at: ✓   │ ← Timestamp recorded
   │  responded_at: ✗ │
   └────────┬─────────┘
            │
            │
2. RESPONDER RESPONDS
            │
            ▼
   ┌──────────────────┐
   │  Responder       │
   │  Accepts Alert   │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  Alert Updated   │
   │  in Database     │
   │                  │
   │  created_at: ✓   │
   │  responded_at: ✓ │ ← Timestamp recorded (CALL TIME)
   └────────┬─────────┘
            │
            │
3. PCR FORM CREATED
            │
            ▼
   ┌──────────────────────────────────────┐
   │  Responder Creates PCR Form          │
   │                                      │
   │  1. Selects Case Type                │
   │  2. Selects Alert Location           │
   └────────┬─────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────┐
   │  AUTO-POPULATION TRIGGERED           │
   │                                      │
   │  System extracts:                    │
   │  - alert.responded_at (preferred)    │
   │  - alert.created_at (fallback)       │
   │                                      │
   │  Converts to 12-hour format:         │
   │  "2025-10-28 14:30:00" → "02:30 PM"  │
   └────────┬─────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────┐
   │  PCR Form Fields Auto-Filled         │
   │                                      │
   │  ✓ timeCall: "02:30"                 │ ← AUTO-POPULATED
   │  ✓ timeCallPeriod: "PM"              │ ← AUTO-POPULATED
   │  ✓ location: "123 Main St"           │
   │  ✓ chiefComplaints: "Fire incident"  │
   │  ✗ timeArrivedScene: (empty)         │ ← User enters manually
   └────────┬─────────────────────────────┘
            │
            │
4. RESPONDERS ARRIVE AT SCENE
            │
            ▼
   ┌──────────────────────────────────────┐
   │  Responder Manually Enters           │
   │  Time Arrived at Scene               │
   │                                      │
   │  timeArrivedScene: "02:45 PM"        │ ← MANUALLY ENTERED (END TIME)
   └────────┬─────────────────────────────┘
            │
            │
5. PCR SAVED
            │
            ▼
   ┌──────────────────────────────────────┐
   │  PCR Saved to Database               │
   │                                      │
   │  full_form: {                        │
   │    alertId: "abc-123",               │
   │    timeCall: "02:30 PM",             │ ← From alert
   │    timeArrivedScene: "02:45 PM",     │ ← Manual entry
   │    ...                               │
   │  }                                   │
   └────────┬─────────────────────────────┘
            │
            │
6. ANALYTICS CALCULATED
            │
            ▼
   ┌──────────────────────────────────────┐
   │  Response Time Calculation           │
   │                                      │
   │  Call Time:    02:30 PM              │ ← From alert.responded_at
   │  End Time:     02:45 PM              │ ← From PCR.timeArrivedScene
   │  ────────────────────────            │
   │  Response Time: 15 minutes           │ ← Calculated
   └──────────────────────────────────────┘
```

## Field Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE FIELD MAPPING                        │
└─────────────────────────────────────────────────────────────────┘

ALERTS TABLE
├── id (UUID)
├── type (text)
├── address (text)
├── created_at (timestamp)      ─────┐
├── responded_at (timestamp)    ─────┼─→ Used for auto-population
└── ...                              │
                                     │
                                     │
PCR_FORMS TABLE                      │
├── id (UUID)                        │
├── alert_id (references alerts)     │
├── full_form (JSONB)                │
│   ├── alertId ←──────────────────┘
│   ├── timeCall ←──────────────── AUTO-POPULATED from alert timestamp
│   ├── timeCallPeriod ←────────── AUTO-POPULATED (AM/PM)
│   ├── timeArrivedScene ←──────── MANUALLY ENTERED (resolution time)
│   ├── timeLeftScene ←──────────── MANUALLY ENTERED
│   └── timeArrivedHospital ←────── MANUALLY ENTERED
└── ...
```

## Auto-Population Logic

```
┌─────────────────────────────────────────────────────────────────┐
│              WHEN DOES AUTO-POPULATION OCCUR?                    │
└─────────────────────────────────────────────────────────────────┘

SCENARIO 1: Case Type Selected
   User Action: Selects "Fire" from case type dropdown
        ↓
   System: Finds all "Fire" alerts
        ↓
   System: Auto-selects most recent alert
        ↓
   System: Extracts timestamp from alert
        ↓
   Result: timeCall auto-populated


SCENARIO 2: Alert Location Changed
   User Action: Changes alert from dropdown
        ↓
   System: Finds selected alert
        ↓
   System: Extracts timestamp from new alert
        ↓
   Result: timeCall updated to new alert's time


SCENARIO 3: Editing Existing PCR
   User Action: Opens PCR for editing
        ↓
   System: Loads PCR data with alert_id
        ↓
   System: Fetches associated alert
        ↓
   System: If timeCall not set, extracts from alert
        ↓
   Result: timeCall populated if previously empty
```

## Timestamp Conversion

```
┌─────────────────────────────────────────────────────────────────┐
│              TIMESTAMP FORMAT CONVERSION                         │
└─────────────────────────────────────────────────────────────────┘

DATABASE TIMESTAMP (PostgreSQL)
   2025-10-28 14:30:45.123456
        ↓
        │ extractTimeFromTimestamp()
        ↓
PARSED DATE OBJECT
   Date {
     hours: 14,
     minutes: 30
   }
        ↓
        │ Convert to 12-hour format
        ↓
12-HOUR FORMAT
   hours: 14 % 12 = 2
   period: 14 >= 12 ? "PM" : "AM"
        ↓
        │ Format with padding
        ↓
FORM FIELDS
   timeCall: "02:30"
   timeCallPeriod: "PM"
        ↓
        │ formatTimeToAMPM() on submit
        ↓
SAVED FORMAT
   "02:30 PM"
```

## User Override Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER OVERRIDE CAPABILITY                      │
└─────────────────────────────────────────────────────────────────┘

1. Auto-Population
   timeCall: "02:30 PM" ← From alert
        ↓
        │ User notices time is incorrect
        ↓
2. Manual Edit
   User changes to: "02:25 PM"
        ↓
        │ onChange handler updates state
        ↓
3. Form State Updated
   timeCall: "02:25 PM" ← Manual override
        ↓
        │ User submits form
        ↓
4. Saved to Database
   full_form.timeCall: "02:25 PM" ← User's value preserved
```

## Priority Logic

```
┌─────────────────────────────────────────────────────────────────┐
│              TIMESTAMP PRIORITY ORDER                            │
└─────────────────────────────────────────────────────────────────┘

When extracting time from alert:

1st Priority: alert.responded_at
   ├─ If exists → Use this timestamp
   └─ Reason: Most accurate (when responder accepted)

2nd Priority: alert.created_at
   ├─ If responded_at is null → Use this timestamp
   └─ Reason: Fallback to when alert was created

3rd Priority: Empty
   └─ If both are null → Leave field empty
```
