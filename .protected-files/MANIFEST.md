# Protected Files — 27 March 2026

These files contain **good fixes from today's session** that must be preserved
when reverting the region template standardization (commits 39a852e + 7cccd99).

Git tag: `backup/good-fixes-2026-03-27` (original = 9c3f66a, latest = 8a9fb0e)

---

## Files and what they contain

### ShowcasePage.jsx
**Commit:** `9c3f66a`
**Fix:** Listing-fallback path for /showcase/:slug
- Hero image was black (imgs[0] is object, not string — now uses .src)
- Raw HTML tags were rendering as text (now uses dangerouslySetInnerHTML)
- Gallery was empty (camelCase mediaItems vs snake_case media_items)

### ShowcaseStudioModule.jsx
**Commits:** `46f81d0` + `dc7dafd`
**Fixes:**
- Hero section auto-created when hero_image_url is first set (no duplicates)
- Slug field forced lowercase on onChange
- onSaveComplete prop added — fires after first save so AdminDashboard gets the new ID
- loadedShowcaseIdRef guard prevents re-fetch overwriting in-session state

### AdminDashboard.jsx
**Commit:** `dc7dafd`
**Fix:** showcase-studio hash routing
- Hash normalised: #showcase-studio/* → activeTab = 'showcase-studio'
- activeShowcaseId initialised from #showcase-studio/{uuid} on page load
- onSaveComplete wired: after first save, writes hash and updates activeShowcaseId

### ListingEditor.jsx
**Commit:** `46f81d0`
**Fix:** pointer-events: none on preview panel
- Gallery images in live preview were intercepting clicks on Map Pin Apply button

### EditorialContentSection.jsx
**Commit:** `46f81d0`
**Fix:** Hero counter safeguarded with Math.max(0, ...) — prevents negative display

### listings.ts
**Commit:** `ee90a79`
**Fix:** createListing / updateListing routed through admin-listings edge function
- supabaseAdmin (service role) removed from frontend bundle
- Prevents VITE_SUPABASE_SERVICE_ROLE_KEY exposure in JS bundle

### socialStudioService.js
**Commit:** `ee90a79`
**Fix:** All 10 write operations routed through admin-managed-accounts edge function
- Reads stay on anon client directly

### ManagedAccountsModule.jsx
**Commit:** `48d8737`
**Fix:** Truthful create/edit flow — UI no longer claims success when save fails

### admin-managed-accounts-index.ts
**Commit:** `ee90a79`
**New file:** Edge function handling all writes for managed_accounts, social_campaigns,
social_content. Uses SUPABASE_SERVICE_ROLE_KEY from server-side secrets only.
Must be deployed: `supabase functions deploy admin-managed-accounts`

### useListingForm.js
**Commit:** `8a9fb0e`
**Fix:** rooms_images and dining_menu_images now uploaded before save
- uploadPendingFiles was only called for hero_images and media_items
- rooms_images / dining_menu_images items had url:'' → saved empty to DB
- Added both fields to the Promise.all block; payload now uses uploaded items

---

## How to restore after the revert

After resetting to 2f0cc47 (clean baseline), copy each file back to its original path:

```
.protected-files/ShowcasePage.jsx         → src/pages/ShowcasePage.jsx
.protected-files/ShowcaseStudioModule.jsx → src/pages/AdminModules/ShowcaseStudioModule.jsx
.protected-files/AdminDashboard.jsx       → src/pages/AdminDashboard.jsx
.protected-files/ListingEditor.jsx        → src/pages/ListingStudio/ListingEditor.jsx
.protected-files/EditorialContentSection.jsx → src/pages/ListingStudio/sections/EditorialContentSection.jsx
.protected-files/listings.ts              → src/services/listings.ts
.protected-files/socialStudioService.js   → src/services/socialStudioService.js
.protected-files/ManagedAccountsModule.jsx → src/pages/AdminModules/ManagedAccountsModule.jsx
.protected-files/admin-managed-accounts-index.ts → supabase/functions/admin-managed-accounts/index.ts
.protected-files/useListingForm.js        → src/pages/ListingStudio/hooks/useListingForm.js
```
