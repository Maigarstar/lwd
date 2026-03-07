# Phase 2: Premium Region Pages - Implementation Guide

## Overview

Phase 2 implements a premium, customizable region page system for the Luxury Wedding Directory. This allows administrators to configure region-specific content through an admin panel, which is then rendered dynamically on the frontend.

**Completed Features:**
- ✅ Premium Hero Section (customizable title, intro, images, stats)
- ✅ SEO-optimized About Section
- ✅ Featured Venues Gallery (carousel/grid toggle, sticky controls)
- ✅ Real Weddings Gallery (inspirational content with vendor credits)
- ✅ Responsive Layout Controls (view mode, items per page)
- ✅ Admin Configuration Panel (grouped settings, WYSIWYG editor)
- ✅ Email Notifications (SendGrid integration)
- ✅ Real-time Database Integration (Supabase)

---

## Architecture

### Two-Layer Configuration System

The system separates **immutable base data** from **editable premium configuration**:

```
LAYER 1: Base Region Data (geo.js)
├── name, slug, country
├── coordinates, timezone
├── trustSignals, categories
└── Read-only, shared across all views

LAYER 2: Premium Page Config (regionPageConfig.js)
├── Hero section (title, intro, image, stats)
├── About section (SEO-optimized content)
├── Featured venues (selection, carousel/grid, title)
├── Real weddings (enabled, title, source mode)
├── Layout (default view mode, items per page)
└── Editable via admin panel, persisted in storage
```

### Data Flow

```
Admin Panel
    ↓
RegionsModule (form with grouped panels)
    ↓
regionPageConfig.savePageConfig()
    ↓
Storage (in-memory for Phase 2, Supabase in Phase 3)
    ↓
RegionPage.jsx
    ↓
getRegionPageConfig() loads config
    ↓
Individual Section Components render config
    ↓
Frontend Display
```

---

## File Structure

### Core Services

#### `src/services/regionPageConfig.js`
Manages region page configuration with in-memory storage.

**Key Functions:**
- `getRegionPageConfig(regionSlug)` - Load config for region
- `savePageConfig(slug, config)` - Save changes
- `PUGLIA_PAGE_CONFIG` - Example configuration for Puglia region

**Config Structure:**
```javascript
{
  about: { title: "About Puglia", content: "..." },
  hero: { title: "...", intro: "...", image: "...", stats: [...] },
  featured: { enabled: true, itemIds: [], count: 6, displayType: "carousel", title: "..." },
  realWeddings: { enabled: true, title: "...", source: "auto", selectedIds: [] },
  layout: { defaultViewMode: "grid", itemsPerPage: 12 }
}
```

#### `src/services/realWeddingService.js`
Fetches real wedding data from Supabase.

**Key Functions:**
- `getAllRealWeddings(filters)` - Get published weddings with optional filters
- `getRealWeddingBySlug(slug)` - Get single wedding with vendor credits
- `searchRealWeddings(query)` - Full-text search
- `getPaginatedRealWeddings()` - Pagination support
- `getFeaturedRealWeddings()` - Get featured weddings only

### Admin Components

#### `src/pages/admin/RegionsModule.jsx`
Admin interface for managing region configurations.

**Features:**
- Regions selector (dropdown)
- Grouped configuration panels:
  - **Hero Panel**: Title, intro, image upload, stats editing
  - **Featured Panel**: Enabled toggle, item selector, display mode, title
  - **Real Weddings Panel**: Enabled toggle, title, source selector
  - **Layout Panel**: View mode defaults, items per page
- Save/Load functionality
- Configuration preview
- WYSIWYG editor for rich text (About section)

**Key Lines:**
- Panel rendering: Lines 700-900
- Form state management: Lines 150-200
- Save button logic: Lines 1050-1080

#### `src/pages/AdminDashboard.jsx`
Main admin dashboard with tabs for different modules.

**Tabs:**
- Vendor Management
- Categories (existing)
- **Regions** (new - Phase 2)

---

## Page Components

### `src/pages/RegionPage.jsx`
Main template for any region (USA, Puglia, etc.).

**Key Implementation:**
```jsx
// Load config once when region changes
const pageConfig = useMemo(
  () => (region && regionSlug ? getRegionPageConfig(regionSlug) : null),
  [regionSlug, region]
);

// Render sections conditionally based on config
{pageConfig?.hero?.enabled && <RegionHero config={pageConfig.hero} ... />}
{pageConfig?.featured?.enabled && <RegionFeatured config={pageConfig.featured} ... />}
{pageConfig?.realWeddings?.enabled && <RegionRealWeddings config={pageConfig.realWeddings} ... />}
```

**Section Flow:**
1. Hero (customizable title, intro, images, stats)
2. About (SEO-optimized description)
3. Categories (vendor types)
4. Featured Venues (carousel or grid)
5. Real Weddings Gallery (inspiration section) **← NEW**
6. Map (interactive venue map)
7. Venue Grid (all venues in region)
8. Footer

### Section Components

#### `src/components/sections/RegionHero.jsx`
Renders hero section with background image, title, intro, and statistics.

**Features:**
- Full-width background image
- Configurable title and intro text
- Stats display (e.g., "150+ Luxury Venues")
- Scroll cue animation
- Responsive design

**Props:**
- `config`: Hero configuration object
- `C`: Color palette
- `isMobile`: Mobile layout flag

#### `src/components/sections/RegionFeatured.jsx`
Renders featured venues in carousel or grid layout.

**Features:**
- Display mode toggle (carousel/grid)
- Configurable count of venues
- Sticky controls on scroll
- Full-width carousel, constrained title
- Responsive card layout

**Props:**
- `config`: Featured configuration
- `region`, `venues`: Data
- `C`: Colors
- `isMobile`: Responsive flag
- `onViewVenue`, `savedIds`, `onToggleSave`: Callbacks

#### `src/components/sections/RegionRealWeddings.jsx` **(NEW)**
Renders inspirational wedding galleries with vendor credits.

**Features:**
- Auto-fetches weddings filtered by region location
- Responsive grid (3 cols desktop, 1 mobile)
- Beautiful card design:
  - Featured image with lazy-loading
  - Wedding title (serif, italic)
  - Couple names
  - Location
  - "View Story ›" CTA
- Loading state with spinner
- Error handling
- Graceful empty state (returns null if no data)

**Props:**
- `config`: Real weddings configuration
- `region`: Region object
- `C`: Color palette
- `isMobile`: Mobile layout flag

**JSDoc:**
```javascript
/**
 * RegionRealWeddings - Real Weddings Gallery Section
 * @param {Object} config - enabled, title, source, selectedIds
 * @param {Object} region - Region data with name for filtering
 * @param {Object} C - Color palette
 * @param {Boolean} isMobile - Mobile layout flag
 * @returns {React.ReactElement|null}
 */
```

---

## Configuration Examples

### Puglia Example

```javascript
export const PUGLIA_PAGE_CONFIG = {
  about: {
    title: "About Puglia",
    content: "Puglia (Apulia) — Southern Italy's fastest-growing luxury wedding destination...",
  },
  hero: {
    title: "Discover Puglia's Finest Wedding Venues",
    intro: "Experience the rustic charm and Mediterranean beauty...",
    image: "/images/puglia-hero.jpg",
    stats: [
      { label: "Luxury Venues", value: "150+" },
      { label: "Coastal Towns", value: "25+" },
      { label: "Wedding Planners", value: "80+" },
    ],
  },
  featured: {
    enabled: true,
    itemIds: [],
    count: 6,
    displayType: "carousel",
    title: "Signature Puglia Wedding Venues",
  },
  realWeddings: {
    enabled: true,
    title: "Real Puglia Weddings",
    source: "auto",
    selectedIds: [],
  },
  layout: {
    defaultViewMode: "grid",
    itemsPerPage: 12,
  },
};
```

---

## Supabase Integration

### Tables Required

#### `real_weddings`
```sql
CREATE TABLE real_weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  couple_names TEXT,
  wedding_date DATE,
  location TEXT,
  featured_image TEXT,
  gallery_images JSONB,
  couple_story TEXT,
  featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft', -- 'draft'|'published'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `real_wedding_vendors`
```sql
CREATE TABLE real_wedding_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_wedding_id UUID REFERENCES real_weddings(id) ON DELETE CASCADE,
  vendor_id TEXT,
  vendor_name TEXT NOT NULL,
  vendor_category TEXT, -- 'venue'|'catering'|'photography'|etc
  vendor_slug TEXT,
  role_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Seeding

Mock data for Puglia region:
```bash
node scripts/seed-real-weddings.js
```

Provides 6 sample weddings:
1. Isabella & Marco's Masseria Romance
2. Sophia & Luca's Trulli Tale
3. Elena & Giovanni's Coastal Celebration
4. Valentina & Francesco's Salento Secret
5. Giulia & Alessandro's Garden Bliss
6. Chiara & Matteo's Baroque Beauty

---

## Email Notifications

### SendGrid Integration

#### `src/utils/emailService.js`
Handles email templates and API calls.

**Functions:**
- `sendInquiryNotificationToVendor()` - Alert vendor of new inquiry
- `sendInquiryReceivedToCouple()` - Confirm receipt to couple
- `sendVendorReplyToCouple()` - Forward vendor response

**Templates:**
- HTML emails with design system colors
- Responsive design
- Brand-consistent styling
- Clear call-to-action buttons

### Configuration

Add to `.env.local`:
```
VITE_SENDGRID_API_KEY=your_api_key_here
```

---

## Admin Panel Usage

### Editing a Region

1. **Navigate to Admin → Regions tab**
2. **Select region from dropdown** (e.g., "Puglia")
3. **Edit each section:**
   - **Hero**: Customize heading, subheading, image, stats
   - **Featured**: Enable/disable, choose venues, set display mode
   - **About**: Rich text editor for SEO-optimized description
   - **Real Weddings**: Enable/disable, set title, choose auto/manual source
   - **Layout**: Set default view mode and items per page
4. **Click Save** to persist changes
5. **Visit region page** to see changes live

### Customization Guidelines

- **Hero Title**: Keep under 10 words for impact
- **About Content**: 150-250 words optimized for SEO and AI search
- **Featured Count**: 6-12 venues for best gallery experience
- **Real Weddings Title**: e.g., "Real Puglia Weddings" or "Destination Inspiration"
- **Stats**: Use round numbers (150+, 25+, 80+) for credibility

---

## Performance Considerations

### Optimizations

1. **Lazy Image Loading**: All images use `loading="lazy"`
2. **Memoization**: Section configs cached with `useMemo`
3. **Conditional Rendering**: Sections only render if enabled
4. **Responsive Images**: `clamp()` for fluid typography
5. **Data Pagination**: Real weddings limited to 6 by default

### Caching Strategy

- **Config**: Cached in `useMemo` per region
- **Weddings**: Fresh fetch on component mount
- **Images**: Browser cache via HTTP headers
- **CSS**: Design tokens centralized in theme context

---

## Testing Checklist

### End-to-End Flow
- [ ] Admin panel: Edit Puglia region config
- [ ] Save changes: Data persists
- [ ] Frontend: Navigate to /italy/puglia
- [ ] Hero section: Title, intro, image, stats render
- [ ] About section: SEO content displays
- [ ] Featured: Carousel/grid toggle works
- [ ] Real Weddings: Section appears (with data)
- [ ] Layout: View mode and items per page respected

### Responsive Testing
- [ ] Desktop (1920px): All sections full-width, 3-col grid
- [ ] Tablet (768px): Adjusted spacing, responsive text
- [ ] Mobile (375px): Single-column layout, touch-friendly

### Error Handling
- [ ] Missing config: Falls back to defaults gracefully
- [ ] No weddings data: Section hidden (doesn't break page)
- [ ] API error: Error logged, page still functional
- [ ] Network latency: Loading state shows during fetch

---

## Future Enhancements

### Phase 3 (High Priority)
- Migrate config from in-memory to Supabase
- Add image upload to admin (instead of URL only)
- Implement manual real weddings selection
- Add email log tracking table
- Vendor response workflow

### Phase 4 (Nice to Have)
- Real weddings with full photo galleries
- Vendor profile links from wedding credits
- Guest count and budget filters
- Season/style tags for weddings
- AI-powered wedding recommendations
- Real weddings comparison tool

### Phase 5 (Future Vision)
- User accounts for couples
- Save/shortlist favorite weddings
- Wedding planning timeline
- Budget calculator
- AI concierge assistant
- Vendor marketplace integration

---

## Troubleshooting

### Real Weddings section not showing

1. **Check config enabled status:**
   ```javascript
   pageConfig?.realWeddings?.enabled === true
   ```

2. **Verify Supabase table exists and has data:**
   ```sql
   SELECT COUNT(*) FROM real_weddings WHERE status = 'published';
   ```

3. **Check location filter matches:**
   Real weddings must have `location` = "Puglia, Italy" (exact match)

4. **Review console for errors:**
   - Network error fetching from Supabase
   - Missing Supabase environment variables
   - Component render errors

### Admin changes not persisting

1. **Verify save button clicked:** Check network tab for PUT/POST request
2. **Check localStorage:** Open DevTools → Application → localStorage
3. **Verify config structure:** Ensure all required fields present
4. **Clear cache:** Browser cache may be outdated config

### Images not loading

1. **Check featured_image URL valid:** Image URL must be publicly accessible
2. **Verify lazy-load attribute:** Should work with all modern browsers
3. **Check CORS headers:** CDN should allow cross-origin requests
4. **Use fallback:** Component provides default image if URL broken

---

## Code Style Guide

### Component Structure
```javascript
/**
 * JSDoc documentation block
 * Describes purpose, props, returns, and usage example
 */
export default function ComponentName({ prop1, prop2, C, isMobile }) {
  // State and effects
  const [state, setState] = useState(initialValue);
  useEffect(() => { ... }, [dependencies]);

  // Derived values
  const computed = useMemo(() => { ... }, [deps]);

  // Event handlers
  const handleEvent = useCallback(() => { ... }, [deps]);

  // Conditional rendering guards
  if (!props || !props.enabled) return null;

  // Main render
  return (
    <section aria-label="descriptive label">
      {/* Content with semantic HTML */}
    </section>
  );
}
```

### Styling Patterns
- Use color tokens from theme: `C.dark`, `C.gold`, `C.border`
- Font tokens: `GD` (heading), `NU` (body)
- Responsive: `clamp()` for fluid sizing
- Transitions: `transition: "property 0.3s ease"`
- Mobile-first: Default mobile, override for larger screens

### Comments
- Line comments for WHY, not WHAT
- JSDoc for public APIs and complex functions
- Avoid obvious comments ("set state", "render component")

---

## Links & Resources

### Supabase
- [Official Documentation](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### SendGrid
- [Email API Docs](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Template Builder](https://mc.sendgrid.com/dynamic-templates)

### React
- [Hooks Documentation](https://react.dev/reference/react)
- [Performance Optimization](https://react.dev/reference/react/useMemo)

### Accessibility
- [ARIA Labels](https://www.w3.org/TR/wai-aria-1.2/)
- [Semantic HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

---

## Version History

- **v2.0** (March 2026): Real Weddings gallery, responsive layouts, admin configuration
- **v1.0** (February 2026): Hero, Featured, About sections with basic admin panel

---

**Last Updated:** March 7, 2026
**Maintained by:** Development Team
**Status:** Production Ready
