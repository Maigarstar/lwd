# Aura AI Knowledge Layer - Integration Guide

## Overview

The Aura AI Knowledge Layer connects three core data sources into a unified structure for intelligent venue intelligence:

1. **listings** - Core venue information (name, location, style, capacity, description)
2. **venue_content** - Editorial metadata (section intros, visibility toggles, approval status, content quality score)
3. **reviews** - Guest feedback (ratings, sentiment, themes, common praise)

This enables Aura AI to:
- Generate venue summaries using approved editorial content
- Answer "What is special about this venue?" with data-driven insights
- Understand content quality signals and editorial ownership
- Analyze guest feedback for common themes and sentiment patterns
- Identify hidden sections (art, golf) via visibility toggles

## Architecture

### Three Core Services

#### 1. `venueContentService.js`
Manages venue editorial content and quality scoring.

**Key Functions:**
- `saveVenueContent(venueId, contentForm, adminUserId)` - Save/create venue content with auto-calculated content score
- `markFactChecked(venueId, adminUserId)` - Flag content as fact-checked, recalculate score
- `approveContent(venueId, adminUserId)` - Approve content, set review timestamp, recalculate score
- `fetchVenuesByContentScore(minScore, limit)` - Get venues ranked by content quality (for rankings)
- `getContentQualityStats()` - Aggregate stats across all venues (for dashboards)

**Content Score Calculation (0-100):**
```
- Sections with intros: 0-40 points (6.7 per filled section, max 6 sections)
- Fact-checked status: 0-30 points (all-or-nothing)
- Approved status: 0-30 points (all-or-nothing)
```

**Editorial Tracking:**
- `updated_by` UUID field tracks which admin last modified content
- `last_reviewed_at` TIMESTAMPTZ tracks approval timestamp
- Enables audit trails and editorial accountability

#### 2. `auraKnowledgeLayerService.js`
Integrates listings, venue_content, and reviews for AI consumption.

**Key Functions:**
- `fetchVenueKnowledgeLayer(venueId)` - Get complete integrated data for a venue
- `fetchVenueKnowledgeLayerBySlug(slug)` - Fetch by slug for public pages
- `generateVenueSummary(knowledge)` - Create summaries from approved editorial
- `extractVenueHighlights(knowledge)` - Identify key strengths and themes
- `analyzeReviewThemes(knowledge)` - Extract sentiment, common themes, praise patterns
- `isVenueContentComplete(knowledge)` - Check editorial completeness
- `buildAuraPromptContext(knowledge)` - Format data for AI prompts

#### 3. `VenueContentEditorSection.jsx`
Admin UI component for editing venue content.

**Features:**
- Edit section intros with character counts
- Toggle section visibility (hide/show sections)
- View approval status and fact-check status
- Auto-save with 1.5s debounce on text changes
- Immediate save on visibility toggles
- Tracks admin user ID for editorial accountability

## Data Flow

### Saving Venue Content

```
Admin UI (VenueContentEditorSection)
  ↓
  Gets current admin user ID from Supabase auth
  ↓
  Calls saveVenueContent(venueId, contentForm, adminUserId)
  ↓
  Service calculates contentScore based on:
    - Number of filled sections
    - fact_checked status
    - approved status
  ↓
  Updates database with:
    - section_intros (JSONB)
    - section_visibility (JSONB)
    - content_score (INT)
    - updated_by (UUID of admin)
    - updated_at (AUTO NOW)
  ↓
  Returns response with all fields for UI feedback
```

### Aura AI Integration

```
Page or Component needs AI insight
  ↓
  Calls fetchVenueKnowledgeLayer(venueId)
  ↓
  Service fetches and merges:
    - Listing data (core info)
    - Venue content (editorial + scores)
    - Reviews (sentiment + themes)
  ↓
  Returns unified structure:
    {
      venue: { name, location, description, highlights, ... },
      content: { sectionIntros, sectionVisibility, approved, contentScore, ... },
      reviews: { total, averageRating, items[], themes, ... },
      metadata: { contentQualityLevel, isApprovedEditorial, ... }
    }
  ↓
  Component calls buildAuraPromptContext(knowledge)
  ↓
  Returns formatted context string for AI prompts
  ↓
  AI uses context to generate:
    - "What couples love about this venue"
    - "Highlights of this property"
    - "Best suited for..."
    - "Common praise themes"
```

## Database Schema

### venue_content Table

```sql
CREATE TABLE venue_content (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES listings(id) ON DELETE CASCADE,

  -- Editorial content
  section_intros JSONB DEFAULT '{...}'  -- Per-section intro text
  section_visibility JSONB DEFAULT '{...}'  -- Show/hide toggles

  -- Approval workflow
  fact_checked BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  last_reviewed_at TIMESTAMPTZ,

  -- Content quality and accountability
  content_score INT DEFAULT 0,  -- 0-100 algorithmic score
  updated_by UUID REFERENCES auth.users(id),  -- Editorial ownership

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(venue_id)
);

-- Indexes for Aura's ranking and filtering
CREATE INDEX venue_content_approved_idx ON venue_content(approved);
CREATE INDEX venue_content_score_idx ON venue_content(content_score DESC);
```

## Content Quality Scoring

Content score measures editorial completeness and quality on a 0-100 scale:

- **0-30:** Minimal content (few sections filled, not fact-checked, not approved)
- **30-60:** Partial content (some sections filled, may be fact-checked)
- **60-90:** Good content (most sections filled, fact-checked, not yet approved)
- **90-100:** Premium content (all sections filled, fact-checked, approved)

**Calculation Example:**
```
Venue A:
- 4 sections filled (out of 6): 4/6 * 40 = 26 points
- Fact-checked: +30 points
- Approved: +30 points
- Total: 86/100 (High quality)

Venue B:
- 2 sections filled: 2/6 * 40 = 13 points
- Not fact-checked: +0 points
- Not approved: +0 points
- Total: 13/100 (Low quality, needs work)
```

## Approval Workflow

### States

1. **No Status** (just created)
   - fact_checked = false
   - approved = false
   - contentScore = 0-40 (depends on section count)

2. **Fact-Checked** (internal status)
   - fact_checked = true
   - approved = false
   - contentScore = 30-70 (adds 30 points for fact-check)
   - Means: Content has been verified against sources
   - Not public-facing - stays internal-only

3. **Approved** (final status)
   - fact_checked = true (recommended but not required)
   - approved = true
   - contentScore = 60-100
   - last_reviewed_at = timestamp
   - Means: Ready for public display, all approvals complete
   - Shows approval tick on front-end (if enabled)

### Content Freshness Signals

```javascript
// Admin can see and filter by freshness status

function getRefreshStatus(lastReviewedAt) {
  if (!lastReviewedAt) return 'needs-update'
  const diffDays = Math.floor((now - lastReviewedAt) / (1000 * 60 * 60 * 24))

  if (diffDays <= 90) return 'current'      // Recent review
  if (diffDays <= 180) return 'review-soon' // Schedule review
  return 'stale'                            // Needs immediate review
}
```

Stale status is **internal-only** and never shown to public users.

## Using Aura Knowledge Layer

### Example 1: Generate Venue Summary

```javascript
import { fetchVenueKnowledgeLayer, generateVenueSummary } from '@/services/auraKnowledgeLayerService';

// In a component
const knowledge = await fetchVenueKnowledgeLayer(venueId);
const summary = generateVenueSummary(knowledge);

// Returns:
// {
//   name: "Domaine des Etangs",
//   location: "Charente, France",
//   summary: "A 13th-century château...", // From approved intro if available
//   contentApproved: true,
//   contentScore: 95,
//   averageRating: 4.8,
//   reviewCount: 24
// }
```

### Example 2: Get AI Prompt Context

```javascript
import { fetchVenueKnowledgeLayer, buildAuraPromptContext } from '@/services/auraKnowledgeLayerService';

const knowledge = await fetchVenueKnowledgeLayer(venueId);
const context = buildAuraPromptContext(knowledge);

// Use in Claude API call:
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  system: 'You are a luxury wedding editor...',
  messages: [
    {
      role: 'user',
      content: `${context}\n\nGenerate a compelling summary for this venue.`
    }
  ]
});
```

### Example 3: Extract Venue Highlights

```javascript
import { fetchVenueKnowledgeLayer, extractVenueHighlights } from '@/services/auraKnowledgeLayerService';

const knowledge = await fetchVenueKnowledgeLayer(venueId);
const highlights = extractVenueHighlights(knowledge);

// Returns array like:
// ['Distinctive Spaces', 'Culinary Excellence', 'Luxury Accommodations', 'Stunning Venue', 'Championship Golf']
```

### Example 4: Analyze Review Sentiment

```javascript
import { fetchVenueKnowledgeLayer, analyzeReviewThemes } from '@/services/auraKnowledgeLayerService';

const knowledge = await fetchVenueKnowledgeLayer(venueId);
const analysis = analyzeReviewThemes(knowledge);

// Returns:
// {
//   topThemes: [
//     { theme: 'venue', mentions: 18, percentage: 75 },
//     { theme: 'service', mentions: 16, percentage: 67 },
//     { theme: 'food', mentions: 14, percentage: 58 }
//   ],
//   sentimentOverview: 'exceptional', // exceptional|very-positive|positive|mixed|needs-improvement
//   commonPraise: ['amazing', 'beautiful', 'perfect']
// }
```

## Section Visibility Control

Hidden sections (visibility = false) are:
- Excluded from `extractVenueHighlights()`
- Marked in Aura's knowledge layer as unavailable
- Filtered out in public rendering via `sectionVisibility?.[name] !== false` checks

**Use Case:** If a venue has no golf course or art collection, admins can hide those sections to keep the page focused and strong.

## Future Enhancements

### Phase 2: AI-Suggested Intros

```javascript
// Admin panel shows:
// [Current Intro: "..."]
// [Suggested by Aura: "..."]  [Accept] [Edit] [Discard]

// Backend would:
// 1. Fetch venue knowledge layer
// 2. Call Claude to generate suggestion
// 3. Admin accepts or customizes
// 4. Save to venue_content with updated_by tracking
```

### Phase 3: Bulk Content Intelligence

```javascript
// Dashboard shows:
// - X venues with complete editorial (all 6 sections filled)
// - Y venues approved and fact-checked
// - Z venues with stale content (>180 days)
// - Average content score across portfolio

// Admin can:
// - Filter by content quality
// - Bulk update fact-check status
// - Auto-generate suggestions for empty sections
```

### Phase 4: Content Refresh Automation

```javascript
// System could:
// - Flag venues for re-review based on age
// - Auto-generate content refresh suggestions
// - Track review completion rates
// - Notify admins of stale listings
```

## Migration Notes

**Before Running Schema Update:**
- Ensure Supabase project has latest migrations applied
- Run: `supabase db push` to apply `20260315_create_venue_content.sql`
- This creates the `venue_content` table with all required columns

**After Migration:**
- Venue content is optional - listings work fine without it
- If `venue_content` doesn't exist for a venue, defaults apply
- New records auto-populate with `content_score` calculated on insert/update
- Old venues can be gradually enriched with editorial content

## Testing Checklist

- [ ] Create venue, verify default venue_content record created
- [ ] Edit section intros, verify debounced save works
- [ ] Toggle section visibility, verify immediate save
- [ ] Mark as fact-checked, verify content_score increases
- [ ] Approve content, verify last_reviewed_at updates
- [ ] Fetch venue knowledge layer, verify merged data structure
- [ ] Generate summary from knowledge layer, verify approved intro used
- [ ] Extract highlights, verify includes editorial + review themes
- [ ] Analyze themes, verify sentiment calculation correct
- [ ] Build Aura prompt context, verify all data formatted properly
- [ ] Test with content_score < 50 and > 90, verify quality levels
- [ ] Verify updated_by tracked when admin saves content

## Performance Notes

- `fetchVenueKnowledgeLayer()` does parallel fetches of 3 tables - O(1) with indexes
- `calculateContentScore()` is pure function - no DB calls, runs instantly
- `getContentQualityStats()` scans all venue_content - useful for caching
- Consider caching knowledge layers for popular venues (SWR, React Query)

## Files Modified/Created

**New Files:**
- `src/services/auraKnowledgeLayerService.js` (400 lines)

**Modified Files:**
- `src/services/venueContentService.js` (added content scoring, updated_by tracking, new utility functions)
- `src/pages/ListingStudio/sections/VenueContentEditorSection.jsx` (added admin user tracking)
- `supabase/migrations/20260315_create_venue_content.sql` (added content_score and updated_by columns)

**Documentation:**
- `AURA_AI_KNOWLEDGE_LAYER.md` (this file)
