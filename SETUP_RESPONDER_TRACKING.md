# Quick Setup Guide - Responder Tracking System

## 🚀 What Was Added

A complete real-time responder tracking system that shows where emergency responders are going and tracks their routes to incidents.

## 📁 Files Created

### Database
- `migrations/add_responder_location_tracking.sql` - Database schema updates

### Backend API (Dashboard)
- `pages/api/responders/location.js` - Receives location updates from mobile app
- `pages/api/responders/tracking.js` - Returns active responder locations
- `pages/api/responders/route-history.js` - Returns historical route data

### Frontend Components (Dashboard)
- `components/ResponderTrackingMap.js` - Map showing all responders
- `components/ResponderTracking.js` - Full tracking page with list
- `components/AlertsMap.js` - Enhanced to show responders on alert map

### Mobile App
- `services/locationTracking.js` - Location tracking service
- `app/(tabs)/HomeScreen.js` - Updated with tracking toggle

### Documentation
- `RESPONDER_TRACKING_GUIDE.md` - Complete implementation guide

## ⚡ Quick Start

### Step 1: Database Setup

Run the migration on your PostgreSQL database:

```bash
psql -U your_user -d your_database -f migrations/add_responder_location_tracking.sql
```

Or manually execute the SQL file in your database management tool.

### Step 2: Mobile App - No Changes Needed!

The mobile app already has `expo-location` installed. The tracking service will:
- ✅ Start automatically when user logs in
- ✅ Update location every 10 seconds
- ✅ Work in background (with permissions)
- ✅ Show toggle button in Home screen

**User will see:**
- "Tracking: ON/OFF" button in Quick Actions
- Location permission prompts on first use

### Step 3: Dashboard - Deploy API Endpoints

The API endpoints are ready to use. Just ensure your Next.js app is deployed with:
- `/pages/api/responders/location.js`
- `/pages/api/responders/tracking.js`
- `/pages/api/responders/route-history.js`

### Step 4: Dashboard - Add Tracking Page (Optional)

To add a dedicated tracking page, create a new page:

**File:** `pages/responder-tracking.js`
```javascript
import ResponderTracking from '@/components/ResponderTracking';

export default function ResponderTrackingPage() {
  return <ResponderTracking />;
}
```

Add to your navigation menu:
```javascript
<Link href="/responder-tracking">
  📍 Track Responders
</Link>
```

## 🎯 How It Works

### Mobile App Flow
1. User logs in → Location tracking starts automatically
2. App sends GPS coordinates every 10 seconds to `/api/responders/location`
3. When responding to alert, location is linked to that alert
4. User can toggle tracking ON/OFF from Home screen

### Dashboard Flow
1. Dashboard fetches responder locations from `/api/responders/tracking`
2. Map shows responders as green/gray markers (active/inactive)
3. When viewing an alert, responders assigned to that alert are shown
4. Route lines connect responders to their destinations
5. Updates automatically every 5-10 seconds

## 🔧 Configuration

### Mobile App Permissions

The app will request:
- **Foreground location** - When app is open
- **Background location** - When app is in background (optional)

Users can deny background permission and tracking will still work when app is open.

### Update Intervals

**Mobile App** (`services/locationTracking.js`):
```javascript
updateInterval: 10000, // 10 seconds
distanceInterval: 10,  // 10 meters
```

**Dashboard** (Components):
```javascript
setInterval(fetchResponders, 5000); // 5 seconds for tracking map
setInterval(fetchResponders, 10000); // 10 seconds for alerts map
```

Adjust these values based on your needs and server capacity.

## 📊 What You'll See

### On Dashboard - Alerts Map
- 🚨 Red/Orange markers = Alerts
- 🟢 Green circles = Active responders
- ⚪ Gray circles = Inactive responders
- 📍 Dashed lines = Routes to incidents

### On Dashboard - Tracking Page
- **Left side:** Live map with all responders
- **Right side:** List of responders with:
  - Status (online/offline/standby)
  - Speed and heading
  - Assignment details
  - Distance to destination
  - Last update time

### On Mobile App
- **Home Screen:** "Tracking: ON/OFF" button
- **Green icon** = Tracking active
- **Red icon** = Tracking inactive

## 🔐 Security

- ✅ All API endpoints require JWT authentication
- ✅ Location data only accessible to authenticated users
- ✅ Responders can only update their own location
- ✅ Historical data linked to specific sessions

## 🐛 Troubleshooting

### Location Not Updating

**Mobile App:**
1. Check location permissions in device settings
2. Ensure "Tracking: ON" in app
3. Check network connectivity
4. Verify user is logged in

**Dashboard:**
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check database connection
4. Review server logs

### Markers Not Showing

1. Verify database has location data:
   ```sql
   SELECT * FROM responder_sessions WHERE current_latitude IS NOT NULL;
   ```
2. Check API response in browser Network tab
3. Ensure Leaflet CSS is loaded
4. Check for JavaScript errors in console

### High Battery Usage

1. Increase update interval in mobile app
2. Reduce GPS accuracy
3. Disable background tracking
4. Only enable when actively responding

## 📱 Testing

### Test Mobile App
1. Login to mobile app
2. Enable location permissions
3. Toggle "Tracking: ON"
4. Move around (or use location simulator)
5. Check console logs for "Location updated"

### Test Dashboard
1. Open Alerts page
2. Look for green/gray markers (responders)
3. Click marker to see popup with details
4. Open browser console to see update logs

### Test API Directly
```bash
# Get tracking data
curl -X GET "http://your-domain/api/responders/tracking" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return JSON with responders array
```

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Mobile app shows "Tracking: ON" in green
- ✅ Dashboard map shows responder markers
- ✅ Clicking markers shows responder details
- ✅ Markers update position as responder moves
- ✅ Route lines appear when responder is assigned to alert

## 📞 Next Steps

1. **Run the database migration**
2. **Test mobile app location tracking**
3. **Verify dashboard shows responders**
4. **Add tracking page to navigation (optional)**
5. **Train users on the new feature**

## 💡 Tips

- Start with a few test responders before full rollout
- Monitor server load with real-time updates
- Consider adding rate limiting for production
- Set up alerts for responders going offline
- Use historical data for performance analysis

## 📚 Full Documentation

See `RESPONDER_TRACKING_GUIDE.md` for:
- Complete API reference
- Database schema details
- Advanced configuration
- Performance optimization
- Future enhancements

---

**Need Help?**
- Check server logs for errors
- Review browser console for client-side issues
- Test API endpoints with Postman
- Verify database migrations completed successfully
