# Performance Notes

## WebSockets (real-time updates)

### WS base URL issue (localhost-relative WS)
**Problem**
- Some components built `wsBase` by stripping `http://` / `https://` rather than converting it to `ws://` / `wss://`.
- That produced relative URLs like `websocketmmdrmo.onrender.com/ws/...`.
- Browsers treat those as relative and prefix the current origin (e.g. `ws://localhost:3000/...`), causing incorrect connections.

**Fix**
- `components/DashboardContent.js`: implemented a `normalizeWsBaseUrl()` that:
  - accepts `https://...`, `http://...`, `wss://...`, `ws://...`, or a host without scheme
  - converts `https:` -> `wss:` and `http:` -> `ws:`
  - guarantees an absolute WebSocket base URL
- Additional components converted to proper WS base URL:
  - `components/Alerts.js`
  - `components/ResponderTracking.js`
  - `components/ResponderTrackingMap.js`
  - `components/AlertsMap.js`

### WS consumer behavior (dashboard refresh)
- `DashboardContent.js` connects to:
  - `${WS_BASE}/ws/notifications?channel=all`
- On `msg.type === 'notification'`:
  - debounces then calls `fetchNotifications()` to refresh the bell list and counts.

### Dev-only WebSocket
- In `npm run dev`, Next.js uses:
  - `ws://localhost:3000/_next/webpack-hmr`
- This is for hot reload and is unrelated to your application WS server.

## WS Publish flow (server -> WS server)

### Publisher implementation
- `lib/wsPublisher.js` posts to:
  - `${WS_PUBLISH_BASE_URL}/api/notifications/publish`
- Uses header:
  - `x-publish-secret: WS_PUBLISH_SECRET`

### Common failure
- `401 Unauthorized` from the WS publish endpoint means:
  - secrets do not match at runtime (`PUBLISH_SECRET` on WS server vs `WS_PUBLISH_SECRET` on dashboard)

## Notifications: PCR create/update

### PCR update publish
- `pages/api/pcr/index.js` (PUT) now inserts a notification and publishes a WS notification (`type: notification`) so the dashboard can refresh without manual reload.

## Duplicate alert verification notification

**Behavior change**
- `app/api/alerts/verify/route.js` was creating two alerts:
  - `🚨 VERIFIED EMERGENCY: ...`
  - `✅ Alert verified and dispatcher going soon: ...`
- The secondary `✅ ... dispatcher going soon` notification has been removed so only the `🚨 VERIFIED EMERGENCY` message is created/published.

## Heartbeat (polling vs WS)

### What it is
- `hooks/useHeartbeat.js` is HTTP polling (not WebSocket).
- Sends `POST /api/heartbeat` (admin) or `POST /api/responders/heartbeat` (responder) on a timer.

### Control flag
- `NEXT_PUBLIC_WS_PRESENCE_ENABLED=true` should disable heartbeat polling in the dashboard (when WS presence is used instead).

## Backend caching + headers (safe GET endpoints)

### In-memory cache
Added:
- `lib/inMemoryCache.js`

Used for read-heavy, safe endpoints:
- `pages/api/provinces.js` (TTL 5 minutes)
- `pages/api/municipalities.js` (TTL 5 minutes, keyed by `provinceId`)
- `pages/api/barangays.js` (TTL 5 minutes, keyed by `municipalityId`)
- `pages/api/streets.js` (TTL 5 minutes, keyed by `barangayId`)
- `pages/api/settings.js` (TTL 60 seconds)
  - cache is cleared on `PUT` updates

### Cache-Control headers
Added for the same safe endpoints:
- Geo lists: `private, max-age=300, stale-while-revalidate=600`
- Settings: `private, max-age=60, stale-while-revalidate=300`

### Notes
- Real-time endpoints (alerts/notifications/tracking) are intentionally NOT cached to prevent stale data.

## Validation/serialization for maintainability

### Zod
- Added `zod` dependency.
- Added validators:
  - `lib/validators/alerts.js` (`verifyAlertBodySchema`)
  - `lib/validators/pcr.js` (`pcrCreateBodySchema`, `pcrUpdateBodySchema`, `pcrUpdateByIdBodySchema`)
  - `lib/validators/http.js` (`zodErrorToResponse`)

### Serializers
- Added:
  - `lib/serializers/notifications.js`
- Centralizes message templates:
  - verified emergency message
  - PCR created/updated messages

## Recommended next steps (optional)
- Reduce remaining polling when WS is enabled (ex: `components/Alerts.js` still refreshes alerts every 30s).
- Consider client-side caching/dedupe with SWR or React Query for non-real-time pages.
- If deploying multiple instances, move cache to Redis.
