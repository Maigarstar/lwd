# Listings Integrity Audit

## Purpose
Verify that no listings have been corrupted or cross-contaminated during the `listings.ts` service file failure (2026-04-09).

## What This Checks

✅ **ID Integrity** — Each ID maps to one listing  
✅ **Core Fields** — name, slug, country_slug, region_slug, category_slug are present  
✅ **Slug Validity** — slug matches the name pattern  
✅ **Duplicates** — No duplicate names, slugs, or content  
✅ **Routing Context** — All location fields are complete  
✅ **Content Mismatches** — Detects if same content appears under multiple IDs  

## How to Run

### Prerequisites
```bash
# Ensure you have the Supabase client installed
npm install @supabase/supabase-js
```

### Setup Environment Variables
```bash
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_KEY="your-supabase-anon-key"
```

Or add to `.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=eyJxx...
```

### Run the Audit
```bash
cd /Users/taiwoadedayo/LDW-01
node audit-listings-integrity.js
```

## Output

### Console Output
You'll see:
- Total listings scanned
- Clean vs affected count
- Pass rate percentage
- List of any issues found
- Detailed findings per affected listing

### Full Report
A file called `audit-report.json` will be created with:
- Complete issue breakdown
- All affected listings with IDs and specific issues
- Timestamps for when listings were last updated

## Interpreting Results

### If Pass Rate = 100%
✅ All listings are integrity-clean  
→ Proceed with preventive guard rails

### If Issues Are Found

#### Missing Name / Slug / Routing Context
- These fields are required
- **Action:** Update the affected listing with correct values

#### Slug/Name Mismatch
- Slug doesn't match the name pattern
- **Action:** Update slug to match: `slugify(name)`

#### Duplicate Slugs or Names
- Multiple listings share the same slug or name
- **Action:** Identify which is the source; keep one, update or remove others

#### Suspicious Content Duplication
- Same description or hero_image appears under multiple IDs
- **Action:** Investigate; one may be corrupted copy, restore correct data

## Next Steps After Audit

### If No Issues Found
1. ✅ Audit clean
2. Implement preventive guards:
   - Add build guard for empty service files
   - Add validation in `updateListing()`
   - Add CI checks for admin vs public parity

### If Issues Found
1. Review `audit-report.json`
2. For each affected listing:
   - Check database directly
   - Restore from backup if corrupted
   - Correct field values if mismatched
   - Merge duplicates if necessary
3. Re-run audit to verify fixes
4. Then implement preventive guards

## Preventive Actions Checklist

After audit completes (pass or fail):

- [ ] Add build check: fail if `src/services/listings.ts` is empty
- [ ] Add editor validation: block save if `payload.id !== currentListingId`
- [ ] Add slug validation: block save if slug doesn't match name pattern
- [ ] Add CI job: daily admin vs public listing parity check
- [ ] Add startup guard: fail gracefully if service imports are broken

## Questions?

If the audit finds unexpected issues:
1. Check the `updated_at` timestamps to isolate the failure window
2. Cross-reference with Git history to identify when listings.ts was corrupted
3. Restore corrupted records from backup if available
4. Document the exact corruption pattern for team learning
