# Phase 4 Database Migration Instructions

**Date:** March 15, 2026
**Scope:** Editorial Curation Visibility & Discovery Integration
**Status:** Ready for deployment to Supabase

## Prerequisites

- Supabase project access
- SQL editor access in Supabase dashboard
- Backup of production database (recommended)

## Migration Steps

### Step 1: Run Migration SQL in Supabase

1. Go to Supabase dashboard for your project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy entire contents of: `supabase/migrations/20260315_add_editorial_curation_layer.sql`
5. Paste into Supabase SQL editor
6. Click **Run** button

**Expected output:** No errors, all statements executed successfully

### Step 2: Verify Migration Success

Run this verification query in Supabase SQL editor:

```sql
-- Verify listings table columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'listings'
AND column_name IN ('editorial_enabled', 'editorial_collections', 'aura_recommended')
ORDER BY column_name;

-- Verify platform_settings table was created
SELECT table_name FROM information_schema.tables
WHERE table_name = 'platform_settings';

-- Verify default platform setting exists
SELECT setting_key, setting_value FROM platform_settings
WHERE setting_key = 'editorial_curation_enabled';
```

**Expected results:**
- 3 rows for listings columns (editorial_enabled, editorial_collections, aura_recommended)
- 1 row for platform_settings table
- 1 row showing `editorial_curation_enabled` with `{"enabled": true}`

### Step 3: Test Editorial Boost in Aura (Local)

1. Ensure code is deployed (all Phase 4 commits merged)
2. Start application locally
3. Open Aura chat
4. Test default venue recommendations - should show editorial boost applied
5. Test with query like "tuscan venues" - should rank approved venues higher
6. Verify tier badges and approval indicators display on cards

### Step 4: Test Toggle Behavior (Local Browser Console)

Open browser console and run:

```javascript
// Check current setting
localStorage.getItem('lwd_platform_settings');

// Toggle editorial curation off
localStorage.setItem('lwd_platform_settings', JSON.stringify({ editorial_curation_enabled: false }));

// Refresh page - badges should disappear
// Aura should use standard ranking (no editorial boost)

// Toggle back on
localStorage.setItem('lwd_platform_settings', JSON.stringify({ editorial_curation_enabled: true }));

// Refresh page - badges should reappear
```

## Rollback Instructions (If Needed)

If migration causes issues, run this in Supabase SQL editor:

```sql
-- Drop new columns from listings
ALTER TABLE listings DROP COLUMN IF EXISTS editorial_enabled;
ALTER TABLE listings DROP COLUMN IF EXISTS editorial_collections;
ALTER TABLE listings DROP COLUMN IF EXISTS aura_recommended;

-- Drop platform_settings table
DROP TABLE IF EXISTS platform_settings CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_platform_settings_updated_at();
```

## Data Migration Notes

- **editorial_enabled** defaults to `true` for all existing listings (editorial curation is ON by default)
- **editorial_collections** defaults to empty array `[]` (no manual collections assigned yet)
- **aura_recommended** defaults to `false` (only set by Aura algorithm at runtime)
- **platform_settings** table starts with one record: `editorial_curation_enabled = true`

No existing data is lost or modified during this migration.

## Deployment Timeline

1. **Local Testing** - Verify editorial boost behavior ✓
2. **Staging Deployment** - Deploy code + run migration ✓
3. **Staging Testing** - Full QA on staging environment ✓
4. **Production Deployment** - Run migration in production ✓
5. **Production Testing** - Verify editorial features live ✓

## Support

If migration fails or causes issues:
1. Check Supabase activity logs for errors
2. Verify SQL syntax is correct (copy-paste from migration file)
3. Check that all prerequisites are met (permissions, etc.)
4. Use rollback instructions above if needed
5. Contact development team with error messages

---

**Migration Status:** ✅ Ready for deployment

All code is committed and tested. Database schema is prepared. Ready to proceed with staging and production deployment.
