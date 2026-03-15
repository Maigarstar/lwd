# Aura Discovery - Integration Guide

## What You've Got

A complete venue discovery interface powered by the Aura AI Knowledge Layer. This demonstrates the full potential of combining editorial quality, guest feedback, and intelligent curation.

### Components

**1. AuraVenueCard.jsx** (individual venue card)
```jsx
<AuraVenueCard
  venueId="uuid-here"
  slug="domaine-des-etangs"
  onDetailsClick={(slug) => navigate(`/showcase/${slug}`)}
/>
```

**2. AuraDiscoveryGrid.jsx** (multi-venue grid with filtering)
```jsx
<AuraDiscoveryGrid
  minContentScore={0}      // Filter by minimum score
  onVenueClick={(slug) => navigate(`/showcase/${slug}`)}
  limit={20}               // Max venues to load
/>
```

**3. AuraDiscoveryDemoPage.jsx** (full-page demo)
- Complete demo page at route `/discovery/aura`
- Includes hero, education sections, score explanations
- Embeds AuraDiscoveryGrid

## How It Works

### Data Flow

```
User visits /discovery/aura
  ↓
AuraDiscoveryGrid loads all listings from Supabase
  ↓
For each listing, calls fetchVenueKnowledgeLayer(venueId)
  ↓
Knowledge layer merges:
  - Listing data (name, location, etc.)
  - Venue content (editorial score, approval status)
  - Reviews (ratings, themes, sentiment)
  ↓
AuraVenueCard renders each venue with:
  - Editorial summary (from approved intros)
  - Content quality score (0-100 badge)
  - Approval badges (fact-checked, approved)
  - Key highlights (editorial + review themes)
  - Guest praise themes with percentages
  ↓
User filters by: All / Best Editorial / Approved Only / Highest Rated
  ↓
Grid re-sorts venues based on filter
  ↓
User clicks venue → navigates to /showcase/{slug} for details
```

### What's Being Scored

**Content Quality Score (0-100):**
- Sections with intros: 40 points (filled sections out of 6)
- Fact-checked: 30 points (boolean, all-or-nothing)
- Approved: 30 points (boolean, all-or-nothing)

**Example:**
- Venue A: 4 sections filled (26pts) + fact-checked (30pts) + approved (30pts) = 86/100 → "High Quality"
- Venue B: 2 sections filled (13pts) + not checked = 13/100 → "Needs Work"

### Filtering Logic

**All Venues**: Show all, sort by content score DESC
**Best Editorial**: Sort by content score DESC (shows venues with most complete editorial)
**Approved Only**: Filter to approved=true, sort by content score DESC
**Highest Rated**: Sort by average_rating DESC (from guest reviews)

## Installation & Setup

### Step 1: Add Route to Router

In your main router file (likely `src/main.jsx` or `src/App.jsx`):

```javascript
import AuraDiscoveryDemoPage from './pages/AuraDiscoveryDemoPage';

// Add to route config:
{
  path: '/discovery/aura',
  element: <AuraDiscoveryDemoPage />
}

// Optional: Also add individual components to other pages
// E.g., homepage, search results, recommendations sections
```

### Step 2: Add Navigation Link

Add link to your navigation/menu:

```jsx
<Link to="/discovery/aura">Aura Discovery</Link>
```

Or add to admin dashboard for testing.

### Step 3: Verify Database

Ensure your Supabase project has the `venue_content` table with required columns:

```sql
-- Check if migration was applied
SELECT column_name FROM information_schema.columns
WHERE table_name='venue_content'
AND column_name IN ('content_score', 'updated_by');
```

If missing, run:
```bash
supabase db push
```

### Step 4: Test with Real Data

1. Create/edit a venue in your system
2. Add section intros to its `venue_content` record
3. Mark as fact-checked and approved
4. Visit `/discovery/aura`
5. Verify the venue appears with correct score and badges

## Customization Guide

### Changing the Grid Layout

**AuraDiscoveryGrid.jsx**, line ~260:
```jsx
// Change from 3-column to 4-column (or any size)
gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
//                                         ↑ Change minmax value (smaller = more columns)
```

### Changing the Card Styling

**AuraVenueCard.jsx** - All styling is inline, easy to customize:
- Card background/border: Line 70-75
- Header section: Line 82-119
- Content quality badge: Line 120-140
- Highlights grid: Line 170-185
- etc.

### Adding More Filters

**AuraDiscoveryGrid.jsx**, line ~290:
```jsx
// Add new filter option
{ id: 'custom-filter', label: 'My Filter' },

// Add sorting logic in useEffect
if (filter === 'custom-filter') {
  // Your sort logic
  sorted = filtered.sort((a, b) => { /* ... */ });
}
```

### Changing Content Score Tiers

**AuraDiscoveryDemoPage.jsx**, line ~285:
```jsx
{[
  { score: '90-100', label: 'Premium', color: '#15803d', /* ... */ },
  // Edit these ranges to match your editorial philosophy
]}
```

**AuraVenueCard.jsx**, line ~65:
```jsx
const contentQuality = content.contentScore >= 90 ? 'premium' :
                       content.contentScore >= 70 ? 'high' :
                       // Edit thresholds here
```

## Real-World Examples

### Example 1: Homepage Feature Section

Add to homepage to showcase best venues:

```jsx
import AuraDiscoveryGrid from './components/discovery/AuraDiscoveryGrid';

export function HomepageVenueFeature() {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '64px 24px' }}>
      <h2>Curated by Aura</h2>
      <AuraDiscoveryGrid minContentScore={80} limit={6} />
    </div>
  );
}
```

This shows only venues with content score >= 80 (high quality).

### Example 2: Search Results Integration

In your search results component:

```jsx
import AuraVenueCard from './components/discovery/AuraVenueCard';

// In search results rendering:
searchResults.map(venue => (
  <AuraVenueCard
    key={venue.id}
    venueId={venue.id}
    slug={venue.slug}
    onDetailsClick={handleVenueClick}
  />
))
```

### Example 3: Admin Dashboard Quality Monitoring

```jsx
import { getContentQualityStats } from './services/venueContentService';

async function renderQualityDashboard() {
  const stats = await getContentQualityStats();

  console.log(`
    Total venues: ${stats.totalVenues}
    Approved: ${stats.approvedCount} (${stats.approvedPercentage}%)
    Fact-checked: ${stats.factCheckedCount} (${stats.factCheckedPercentage}%)
    Avg score: ${stats.averageContentScore}/100
    Range: ${stats.minContentScore}-${stats.maxContentScore}
  `);
}
```

## Design Philosophy Behind Aura Discovery

### Luxury Through Curation

Traditional venue directories show everything:
- All 100 venues, even if 20 have minimal info
- All sections for all venues, even if some are empty
- All reviews, even mixed sentiment

**Aura Discovery is different:**
- Show only venues with strong editorial (score 70+)
- Hide sections that are incomplete or weak
- Highlight what guests genuinely love
- Emphasize approval status and editorial ownership
- Rank by quality, not arbitrarily

### What the Badges Mean

**✓ Fact-Checked** (internal signal)
- Our editorial team verified this content against sources
- Doesn't guarantee perfection, but confirms diligence
- Internal-only, shows editorial professionalism

**★ Approved** (final signal)
- Content is complete, verified, and ready for public
- Approval badge shows couples this venue is editorially vetted
- Only show when `approved=true`

### Content Score Tiers

- **0-39 (Needs Work):** Placeholder content, minimal editorial. Don't show in premium discovery.
- **40-69 (In Progress):** Some sections filled, undergoing fact-check. Useful for admin workflow.
- **70-89 (High Quality):** Most sections complete, fact-checked. Good for featured sections.
- **90-100 (Premium):** All sections complete, fact-checked, approved. Featured in curated discovery.

## Performance Considerations

### Database Queries

AuraDiscoveryGrid makes:
- 1 query to fetch all listings (SELECT id, name, slug, location FROM listings LIMIT 20)
- N queries (one per venue) to fetch venue_content + reviews

**Optimization Tip:** If performance is a concern, batch the knowledge layer fetches:

```javascript
// Instead of: await Promise.all(listings.map(fetch))
// Consider: Fetch in chunks of 5, parallelize but don't overwhelm DB

const chunkSize = 5;
for (let i = 0; i < listings.length; i += chunkSize) {
  const chunk = listings.slice(i, i + chunkSize);
  await Promise.all(chunk.map(l => fetchVenueKnowledgeLayer(l.id)));
}
```

### Caching Strategy

Consider caching knowledge layers:

```javascript
// Using React Query (recommended)
import { useQuery } from '@tanstack/react-query';

function useVenueKnowledge(venueId) {
  return useQuery({
    queryKey: ['venue-knowledge', venueId],
    queryFn: () => fetchVenueKnowledgeLayer(venueId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Future Enhancements

### 1. AI-Generated Summaries

Instead of just pulling approved intros, ask Claude to summarize:

```javascript
const summary = await generateVenueSummary(knowledge);
// Claude could enhance with additional context
```

### 2. Smart Recommendations

Show "Similar Venues" or "You Might Also Like":

```javascript
async function getRecommendations(venueId) {
  const knowledge = await fetchVenueKnowledgeLayer(venueId);
  // Find venues with similar themes, location, price range
  // Score by similarity
  // Return top 3
}
```

### 3. Trending Venues

Track which venues are getting edited most, fact-checked most:

```javascript
// Track updates over time
// Show "Recently Updated" or "Trending in {Region}"
```

### 4. Editorial Leaderboards

Show top venues by various metrics:

```javascript
// Top by content score
// Top by guest rating
// Top by editorial velocity (recent improvements)
// Top by editorial completeness
```

## Testing

### Manual Testing Checklist

- [ ] Visit `/discovery/aura`
- [ ] Verify hero section and education content loads
- [ ] Verify content score tiers display correctly
- [ ] Verify venue grid loads (check console for errors)
- [ ] Click each filter button, verify grid re-sorts
- [ ] Click a venue card, verify navigation works
- [ ] Check responsive design on mobile/tablet
- [ ] Verify cards display approved badges correctly
- [ ] Verify highlights are populated from knowledge layer
- [ ] Check guest praise themes display with percentages
- [ ] Verify empty state if no venues found

### Debugging

**If grid doesn't load:**
```javascript
// Check browser console for errors
// Verify supabase.from('listings').select() works
// Verify venue_content table exists
// Check if any venues have knowledge layer data
```

**If cards look wrong:**
```javascript
// Check font variables are defined
// Check color hex codes are correct
// Verify no CSS conflicts with global styles
```

**If performance is slow:**
```javascript
// Monitor number of database queries
// Consider pagination or lazy-loading
// Check if venue_content queries have proper indexes
```

## Integration Points

### Homepage
```jsx
<HomepageFeature>
  <AuraDiscoveryGrid minContentScore={85} limit={4} />
</HomepageFeature>
```

### Search Results
```jsx
searchResults.map(v => <AuraVenueCard venueId={v.id} />)
```

### Category Pages (Italy, France, etc.)
```jsx
<LocationFeature country="france">
  <AuraDiscoveryGrid minContentScore={70} limit={8} />
</LocationFeature>
```

### Venue Profile (Similar Venues)
```jsx
<SimilarVenues>
  {similarVenues.map(v => <AuraVenueCard venueId={v.id} />)}
</SimilarVenues>
```

### Admin Dashboard
```jsx
<QualityMetrics stats={getContentQualityStats()} />
<VenuesByScore venues={fetchVenuesByContentScore(80)} />
```

## Summary

You now have a complete, beautiful, intelligent venue discovery interface that:

1. **Showcases Editorial Quality** - Content scores make quality visible and tangible
2. **Builds Trust** - Approval badges show editorial oversight
3. **Respects Curation** - Hidden weak sections keep pages strong
4. **Analyzes Feedback** - Guest themes inform what's truly valuable
5. **Sorts Intelligently** - Not arbitrary, but data-driven ranking
6. **Scales Beautifully** - Responsive design, luxury aesthetic

This is the bridge between your content management system and your users.
It makes the invisible work (editing, fact-checking, approval) visible and valuable.

Couples see: "These venues are vetted. These intros are written with care. These highlights are what guests actually love."

That's the power of editorial intelligence.
