# Fixing ECONNRESET Database Errors

## What Was Fixed

The `ECONNRESET` errors were caused by database connections being abruptly closed. This is common in serverless environments like Next.js where connections can timeout or be terminated by the database server.

## Changes Made

### 1. Updated Database Pool Configuration (`lib/db.js`)

**Key improvements:**
- Reduced `max` connections from 20 to 10 (better for serverless)
- Reduced `idleTimeoutMillis` from 30s to 10s (faster cleanup)
- Added `allowExitOnIdle: true` (allows pool to exit when idle)
- Added `keepAlive: true` (maintains connection health)
- Added error handlers for pool and client errors

**Why this helps:**
- Prevents connection pool exhaustion
- Closes idle connections faster
- Maintains connection health with keepalive
- Gracefully handles connection errors without crashing

### 2. Created Database Query Wrapper (`lib/dbQuery.js`)

**Features:**
- Automatic retry on connection errors (ECONNRESET, ETIMEDOUT, etc.)
- Exponential backoff between retries
- Transaction support with retry logic
- Connection health check utility

**Usage:**
```javascript
import { executeQuery } from '@/lib/dbQuery';

// Instead of:
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// Use:
await executeQuery('SELECT * FROM users WHERE id = $1', [userId]);
```

### 3. Updated Critical Endpoints

Updated the following endpoints to use the retry wrapper:
- `/api/heartbeat.js` - Admin heartbeat
- `/api/responders/heartbeat.js` - Responder heartbeat

These endpoints are called frequently and are most likely to encounter connection issues.

## How to Apply to Other Endpoints

To update other API routes to use the retry wrapper:

### Step 1: Update Import
```javascript
// Before
import pool from '@/lib/db';

// After
import { executeQuery } from '@/lib/dbQuery';
```

### Step 2: Replace pool.query Calls
```javascript
// Before
const result = await pool.query('SELECT * FROM users', []);

// After
const result = await executeQuery('SELECT * FROM users', []);
```

### Step 3: For Transactions
```javascript
import { executeTransaction } from '@/lib/dbQuery';

const result = await executeTransaction(async (client) => {
  await client.query('UPDATE users SET name = $1 WHERE id = $2', ['John', 1]);
  await client.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [1, 'update']);
  return { success: true };
});
```

## Priority Endpoints to Update

Update these endpoints first (they're called most frequently):

1. ✅ `/api/heartbeat.js` - Already updated
2. ✅ `/api/responders/heartbeat.js` - Already updated
3. `/api/responders/tracking.js` - Location tracking
4. `/api/responders/location.js` - Location updates
5. `/api/alerts/index.js` - Alert listing
6. `/api/chat/messages.js` - Chat messages
7. `/api/login.js` - Authentication

## Testing

### 1. Restart Your Dev Server
```bash
npm run dev
```

### 2. Monitor Console
Watch for these messages:
- ✅ "Database connection error, retrying..." - Retry is working
- ✅ "Client connection error:" - Error is being caught
- ❌ "uncaughtException: ECONNRESET" - Should no longer appear

### 3. Test High-Traffic Scenarios
- Open multiple dashboard tabs
- Enable location tracking on mobile app
- Create/update multiple alerts
- Send multiple chat messages

## Additional Recommendations

### 1. Database Connection Limits
Check your PostgreSQL max_connections setting:
```sql
SHOW max_connections;
```

If you have many concurrent users, you may need to increase this.

### 2. Connection Pooling Service
Consider using a connection pooler like PgBouncer for production:
- Reduces connection overhead
- Better connection management
- Prevents connection exhaustion

### 3. Monitor Database Performance
Use these queries to monitor connections:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connections by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Check idle connections
SELECT * FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < NOW() - INTERVAL '5 minutes';
```

### 4. Environment Variables
Ensure these are set in your `.env.local`:
```env
NETLIFY_DATABASE_URL=your_connection_string
JWT_SECRET=your_secret
```

## Troubleshooting

### Still Getting ECONNRESET?

1. **Check database server status**
   - Is the database online?
   - Are there network issues?

2. **Check connection string**
   - Is `NETLIFY_DATABASE_URL` correct?
   - Does it include SSL parameters?

3. **Check database logs**
   - Are connections being forcefully closed?
   - Are there too many connections?

4. **Increase retry attempts**
   ```javascript
   await executeQuery(query, params, 3); // Try 3 times instead of 2
   ```

5. **Add more logging**
   ```javascript
   pool.on('acquire', () => {
     console.log('Connection acquired from pool');
   });
   
   pool.on('release', () => {
     console.log('Connection released back to pool');
   });
   ```

### Performance Issues?

If queries are slow:
1. Add database indexes
2. Optimize complex queries
3. Use query result caching
4. Consider read replicas for heavy read workloads

## Next Steps

1. ✅ Database pool configuration updated
2. ✅ Query wrapper created
3. ✅ Critical endpoints updated
4. ⏳ Update remaining endpoints (optional but recommended)
5. ⏳ Monitor for errors
6. ⏳ Consider PgBouncer for production

## Support

If issues persist:
1. Check Next.js dev server logs
2. Check database server logs
3. Monitor network connectivity
4. Check SSL certificate validity
