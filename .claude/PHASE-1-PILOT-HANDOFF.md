# DdeShowcasePage Section Intros — Approved Schema & Technical Handoff

**Status:** ✅ Approved Pilot (Phase 1)
**Date:** March 14, 2026
**Scope:** Domaine des Etangs Only (DdeShowcasePage.jsx)
**Next Phase:** Database integration + admin editing UI

---

## Supported Section Intro Keys

The following six keys are **canonically approved** and must not be renamed without explicit approval:

```javascript
{
  "overview": "string",    // Main venue description (13th-century château context)
  "spaces": "string",      // Event spaces introduction (chapel to barn)
  "dining": "string",      // Culinary philosophy (chef + organic kitchen garden)
  "rooms": "string",       // Accommodation overview (29 rooms + cottages)
  "art": "string",         // Art programme description (sculpture + installations)
  "weddings": "string"     // Wedding experience summary (personalization focus)
}
```

**Key Naming Note:** These key names are now locked in. Renaming them in Phase 2+ will require database migrations and admin UI updates. Do not change casually.

---

## Approved Content (Reference)

All six intros have been approved for Domaine des Etangs:

| Key | Approved Text |
|-----|---|
| **overview** | "A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland — one of the most extraordinary estate wedding venues in France." |
| **spaces** | "From an intimate lakeside chapel to a 200 m² stone barn, each space at Domaine des Etangs carries centuries of character — and a contemporary soul." |
| **dining** | "Chef Matthieu Pasgrimaud builds every menu around the Domaine's own organic kitchen garden — inventive, terroir-driven, and rooted in the seasons of Charente." |
| **rooms** | "Each of the 29 rooms and cottages at Domaine des Etangs echoes the estate's character — stone fireplaces, hand-woven textiles, and views onto the lakes and gardens." |
| **art** | "A rotating programme of contemporary sculpture and site-specific installations transforms the estate into an open-air gallery." |
| **weddings** | "Every wedding at Domaine des Etangs is designed to feel entirely unique — shaped by your story, your guests, and the landscape itself." |

---

## Front-End Usage Pattern

**File:** `src/pages/DdeShowcasePage.jsx`

**Current Implementation:**

```javascript
// In DDE_VENUE object (lines 134–141)
sectionIntros: {
  overview: "A 13th-century château...",
  spaces: "From an intimate lakeside...",
  dining: "Chef Matthieu Pasgrimaud...",
  rooms: "Each of the 29 rooms...",
  art: "A rotating programme...",
  weddings: "Every wedding..."
}
```

**Section Header Usage Pattern:**

```javascript
<SectionHeader
  title="Section Title"
  subtitle={venue.sectionIntros?.sectionKey || "Fallback hardcoded text"}
/>
```

**Fallback Logic:**
- If `venue.sectionIntros.sectionKey` exists → use it
- If missing → fall back to hardcoded default
- Ensures graceful degradation during Phase 2 database integration

---

## Database Field Recommendation

**Phase 2 Implementation:**

**Table:** `listings`
**Field Name:** `sectionIntros`
**Data Type:** `JSONB`
**Default Value:** `'{}'::jsonb` (empty object)
**Nullable:** `true`

**Recommended Schema:**

```sql
ALTER TABLE listings ADD COLUMN sectionIntros JSONB DEFAULT '{}'::jsonb;

-- Example data for domaine-des-etangs:
{
  "overview": "A 13th-century château set within...",
  "spaces": "From an intimate lakeside chapel...",
  "dining": "Chef Matthieu Pasgrimaud builds...",
  "rooms": "Each of the 29 rooms...",
  "art": "A rotating programme...",
  "weddings": "Every wedding at Domaine des Etangs..."
}
```

**Migration Strategy:**
1. Add `sectionIntros` column with default `{}`
2. Migrate approved hardcoded text from DdeShowcasePage.jsx into database for Domaine des Etangs
3. Keep hardcoded defaults as permanent fallback
4. When rolling to other venues, populate their `sectionIntros` via admin UI or data migration

---

## Admin UI Expectations

**Phase 2 Admin Editing Interface should:**

✅ Provide six input fields corresponding to the approved keys
✅ Display field labels clearly (overview, spaces, dining, rooms, art, weddings)
✅ Show character counts or length guidelines for UX consistency
✅ Allow rich text or markdown (if applicable)
✅ Validate against empty strings (require non-empty text for each field)
✅ Display live preview of how intros render on front-end
✅ Include approval workflow (draft → fact-checked → approved)
✅ Track `lastReviewedAt` and `lastUpdatedAt` timestamps

**Do NOT:**
- ❌ Add new keys without explicit approval
- ❌ Rename existing keys
- ❌ Remove keys from the schema
- ❌ Change section heading titles (only subtitle/intro text is editable)

---

## Fallback Hardcoded Defaults (Permanent)

These hardcoded defaults remain in DdeShowcasePage.jsx as permanent fallback and serve as the source of truth during Phase 1:

```javascript
const defaultIntros = {
  overview: 'A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland — one of the most extraordinary estate wedding venues in France.',
  spaces: 'From an intimate lakeside chapel to a 200 m² stone barn, each space at Domaine des Etangs carries centuries of character — and a contemporary soul.',
  dining: "Chef Matthieu Pasgrimaud builds every menu around the Domaine's own organic kitchen garden — inventive, terroir-driven, and rooted in the seasons of Charente.",
  rooms: "Each of the 29 rooms and cottages at Domaine des Etangs echoes the estate's character — stone fireplaces, hand-woven textiles, and views onto the lakes and gardens.",
  art: 'A rotating programme of contemporary sculpture and site-specific installations transforms the estate into an open-air gallery.',
  weddings: 'Every wedding at Domaine des Etangs is designed to feel entirely unique — shaped by your story, your guests, and the landscape itself.'
};
```

---

## Phase 2 Implementation Checklist

- [ ] Database: Add `sectionIntros` JSONB column to `listings` table
- [ ] Migration: Populate Domaine des Etangs `sectionIntros` with approved content
- [ ] Code: Update DdeShowcasePage.jsx to read from `venue.sectionIntros` (keep fallback pattern)
- [ ] Admin UI: Create editing interface for the six approved keys
- [ ] Approval Workflow: Implement `factChecked` + `approved` flags
- [ ] Testing: Verify fallback logic works when `sectionIntros` is empty/null
- [ ] Docs: Update data model documentation with this schema
- [ ] Rollout: Do NOT expand to other venue pages until DB + admin UI are complete

---

## Important Notes

**Key Stability:** The six key names (overview, spaces, dining, rooms, art, weddings) are now locked in. Changing them later will create unnecessary migration work. Do not rename without a strong business reason and explicit approval.

**Scope Lock:** This pattern applies to **Domaine des Etangs (DdeShowcasePage.jsx) only** during Phase 1. Do not expand to VenueProfilePage.jsx or other pages without separate approval.

**Design Integrity:** These section intros are **text-only updates**. Do not change section titles, layout, styling, or component structure when implementing Phase 2. Changes are data-driven, not visual.

---

**Approved by:** LDW Product & Content Team
**Reference Implementation:** `src/pages/DdeShowcasePage.jsx` (lines 133–141)
**For Phase 2 Questions:** Reference this document as the canonical schema
