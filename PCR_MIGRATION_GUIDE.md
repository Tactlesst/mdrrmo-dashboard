# PCR Forms Migration Guide

## Overview
This migration adds proper foreign key relationships to the `pcr_forms` table to ensure data integrity and improve query performance.

## What Changed?

### Database Schema Changes

#### 1. New Column: `alert_id`
- **Type:** `uuid`
- **Purpose:** Links PCR forms to alerts
- **Nullable:** Yes (PCR forms can exist without an alert)
- **Foreign Key:** References `alerts(id)` with `ON DELETE SET NULL`

#### 2. New Foreign Key Constraints
- `pcr_forms_alert_id_fkey` → Links to `alerts` table
- `pcr_forms_created_by_admin_fkey` → Links to `admins` table (deferred)
- `pcr_forms_created_by_responder_fkey` → Links to `responders` table (deferred)

#### 3. New Indexes
- `idx_pcr_forms_alert_id` → Improves queries filtering by alert
- `idx_pcr_forms_created_by` → Improves queries filtering by creator

### API Changes

#### Updated: `/pages/api/pcr/index.js`

**POST (Create PCR Form):**
- Now extracts `alertId` from request body
- Inserts into both the new `alert_id` column AND keeps it in JSONB for backward compatibility
- Updated INSERT query to include `alert_id` parameter

**PUT (Update PCR Form):**
- Now handles `alert_id` updates
- Extracts from request body or JSONB field
- Updated UPDATE query to include `alert_id` parameter

## Migration Steps

### Step 1: Backup Your Database
```bash
# Create a backup before running migration
pg_dump -h your-host -U your-user -d your-database > backup_before_pcr_migration.sql
```

### Step 2: Run the Migration Script
```bash
psql -h your-host -U your-user -d your-database -f migrate_pcr_forms.sql
```

The migration script will:
1. ✅ Add `alert_id` column (if not exists)
2. ✅ Migrate existing `alertId` values from JSONB to the new column
3. ✅ Add foreign key constraints (if not exist)
4. ✅ Create performance indexes (if not exist)
5. ✅ Display verification results

### Step 3: Deploy Updated API Code
After the database migration succeeds, deploy the updated `/pages/api/pcr/index.js` file.

### Step 4: Verify
Check that:
- ✅ New PCR forms are created successfully
- ✅ Existing PCR forms can be updated
- ✅ Alert relationships are properly maintained

## Rollback (If Needed)

If something goes wrong, you can rollback using:
```bash
psql -h your-host -U your-user -d your-database -f rollback_pcr_forms.sql
```

Then restore from backup:
```bash
psql -h your-host -U your-user -d your-database < backup_before_pcr_migration.sql
```

## Benefits

### 1. Data Integrity
- ✅ PCR forms can only reference valid alerts
- ✅ PCR forms can only be created by valid admins or responders
- ✅ Orphaned records are prevented

### 2. Better Performance
- ✅ Indexed queries are faster
- ✅ Joins between PCR forms and alerts are optimized

### 3. Easier Queries
```sql
-- Before: Had to extract from JSONB
SELECT * FROM pcr_forms WHERE full_form->>'alertId' = 'some-uuid';

-- After: Direct column query (faster)
SELECT * FROM pcr_forms WHERE alert_id = 'some-uuid';

-- Join with alerts table
SELECT p.*, a.type, a.address 
FROM pcr_forms p
LEFT JOIN alerts a ON p.alert_id = a.id
WHERE p.created_at > NOW() - INTERVAL '7 days';
```

### 4. Backward Compatibility
- ✅ `alertId` is still stored in JSONB `full_form` field
- ✅ Existing code that reads from JSONB will continue to work
- ✅ Migration is safe and non-breaking

## Database Relationships After Migration

```
pcr_forms
├── alert_id → alerts(id) [SET NULL on delete]
├── created_by_id → admins(id) [CASCADE on delete, deferred]
└── created_by_id → responders(id) [CASCADE on delete, deferred]
```

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** The script is idempotent. It will skip existing columns/constraints. Safe to re-run.

### Issue: Foreign key constraint violation
**Solution:** Check if there are PCR forms with invalid `created_by_id` values:
```sql
-- Find PCR forms with invalid admin references
SELECT * FROM pcr_forms 
WHERE created_by_type = 'admin' 
AND created_by_id NOT IN (SELECT id FROM admins);

-- Find PCR forms with invalid responder references
SELECT * FROM pcr_forms 
WHERE created_by_type = 'responder' 
AND created_by_id NOT IN (SELECT id FROM responders);
```

### Issue: API returns error after migration
**Solution:** 
1. Check that the API code has been deployed
2. Verify database connection
3. Check application logs for specific errors

## Testing Checklist

After migration, test:
- [ ] Create new PCR form with alert
- [ ] Create new PCR form without alert
- [ ] Update existing PCR form
- [ ] View PCR forms list
- [ ] Delete an alert (PCR form's alert_id should become NULL)
- [ ] Delete an admin/responder (their PCR forms should be deleted)

## Questions?

If you encounter any issues, check:
1. Database logs for constraint violations
2. Application logs for API errors
3. Migration script output for warnings
