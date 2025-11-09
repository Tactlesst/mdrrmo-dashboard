# Alert Status & Verification Guide

## Overview
This document explains how to identify different alert states in the MDRRMO Dashboard.

---

## 🔍 Three Main Sections

### 1. **Verify Incidents** (Left Panel)
Shows **unverified alerts** that need admin approval before being sent to responders.

**Indicators:**
- 🟠 **Orange "Pending" badge** - Shows count of unverified incidents
- 🚨 **Red emergency icon** - Marks each unverified alert
- **Click to expand** - Select an alert to verify or reject it

**Actions:**
- ✅ **Verify** - Approves the incident and sends it to responders
- ❌ **Reject** - Dismisses false alarms

---

### 2. **Incident Map** (Center)
Visual map showing all verified alerts with clustering.

**Map Markers:**
- 🔴 **Red cluster** - Multiple incidents in 100m radius (10+ alerts)
- 🟠 **Orange cluster** - Medium cluster (5-10 alerts)
- 🟡 **Yellow cluster** - Small cluster (2-4 alerts)
- 📍 **Individual markers** - Single incidents (color-coded by status)

---

### 3. **Alert Management** (Right Panel)
Shows all **verified alerts** that are active (not yet completed).

## 📊 Alert Status Indicators

### **Status Summary Badges** (Top of Alert Management)
Quick overview of current alert states:

| Badge | Meaning | Description |
|-------|---------|-------------|
| 🆕 **X New** | New incoming alerts | Alerts received in the last 5 minutes |
| 🔴 **X Needs Response** | Pending alerts | Waiting for responder assignment |
| 🟡 **X In Progress** | Active response | Responder is en route or working on it |
| ✅ **All Clear** | No active alerts | Everything is handled |

---

## 🎯 Individual Alert Visual Indicators

### **1. NEW ALERTS** (Within 5 minutes)
**Visual Indicators:**
- 🆕 **Animated "NEW" badge** (top-right corner, pulsing)
- 💙 **Blue border with ring** effect
- 🔵 **Light blue background**

**What it means:** Fresh alert just came in - requires immediate attention

---

### **2. NEEDS RESPONSE** (Not Responded status)
**Visual Indicators:**
- ⚠️ **"NEEDS RESPONSE" badge** (red, top-right)
- 🔴 **Red dot** next to resident name
- 🔴 **Red border** and light red background
- 🔴 **Red status badge** in details

**What it means:** No responder assigned yet - action required

---

### **3. IN PROGRESS** (Ongoing/Pending/In Progress status)
**Visual Indicators:**
- 🚑 **"IN PROGRESS" badge** (yellow, top-right)
- 🟡 **Yellow dot** next to resident name
- 📦 **Blue info box** showing:
  - 🚦 Route start time
  - 🏁 Estimated arrival
  - ⏱️ ETA in minutes
  - 📍 Distance remaining
  - ⚡ Responder speed

**What it means:** Responder is actively working on this incident

---

## 🔄 Alert Lifecycle Flow

```
1. 📱 Resident Reports → 2. 🔍 Verify Incidents → 3. ✅ Verified → 4. 🔴 Needs Response → 5. 🟡 In Progress → 6. ✅ Responded (Hidden)
```

### Detailed Flow:

1. **Resident submits alert** via mobile app
2. **Alert appears in "Verify Incidents"** (left panel)
   - Shows with orange "Pending" badge
   - Admin reviews details
3. **Admin verifies or rejects**
   - If rejected: Alert is removed
   - If verified: Moves to next step
4. **Alert appears in "Alert Management"** with "NEEDS RESPONSE" status
   - Shows red indicators
   - Marked as "NEW" if within 5 minutes
5. **Responder accepts the alert**
   - Status changes to "IN PROGRESS"
   - Shows yellow indicators
   - Real-time tracking info appears
6. **Responder completes the incident**
   - Status becomes "Responded"
   - Alert is filtered out (no longer shown)

---

## 🎨 Color Coding System

| Color | Status | Priority Level |
|-------|--------|----------------|
| 🔵 **Blue** | New alert (< 5 min) | Immediate attention |
| 🔴 **Red** | Not Responded | High priority - needs assignment |
| 🟡 **Yellow** | In Progress | Active - being handled |
| 🟢 **Green** | Responded | Completed (hidden from view) |
| 🟠 **Orange** | Unverified | Awaiting admin approval |

---

## 🚨 Priority Levels

Each alert also has a severity/priority level:

| Badge | Level | Color |
|-------|-------|-------|
| 🔴 **CRITICAL** | Highest | Red background |
| 🟠 **HIGH** | High | Orange background |
| 🟡 **MEDIUM** | Medium | Yellow background |
| 🟢 **LOW** | Low | Blue background |

**Note:** Priority can be changed by clicking the dropdown in the alert details or map popup.

---

## 💡 Quick Tips

### How to identify what needs attention:

1. **Check "Verify Incidents" count** - If > 0, review and verify/reject
2. **Look for pulsing 🆕 badges** - New alerts need quick review
3. **Count red 🔴 badges** - Shows how many alerts need responder assignment
4. **Monitor yellow 🟡 badges** - Active responses in progress

### Best Practices:

- ✅ Verify incidents promptly (within 2-3 minutes)
- ✅ Assign responders to red "NEEDS RESPONSE" alerts immediately
- ✅ Monitor "IN PROGRESS" alerts for ETA and distance
- ✅ Check the map for clustered incidents (may need multiple responders)

---

## 🔔 Real-time Updates

The dashboard automatically refreshes:
- **Verify Incidents**: Every 30 seconds
- **Alert Management**: Every 30 seconds
- **Responder Tracking**: Every 10 seconds

No manual refresh needed!

---

## 📱 Summary

**To answer your question:**

### "How do I know what is verified and still not verified?"
- **Unverified** = In "Verify Incidents" section (left) with orange badge
- **Verified** = In "Alert Management" section (right)

### "How do I know if there are new alerts incoming?"
- Look for **🆕 pulsing "NEW" badge** on alerts
- Check **blue border with ring effect**
- See **summary count** at top: "🆕 X New"

### "How do I know what is still pending?"
- Look for **⚠️ "NEEDS RESPONSE" badge** (red)
- Check **🔴 red dot** next to name
- See **summary count** at top: "🔴 X Needs Response"
- Status shows "Not Responded"

---

**Last Updated:** November 7, 2025
