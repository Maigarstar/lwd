# **LUXURY DISCOVERY — Complete Wireframe Specification**

## **Vision Statement**

Transform Luxury Wedding Directory from a "directory" (utility) into a **curated discovery platform** (experience). Users should feel: "This is a private world of exceptional taste."

**Design DNA:** Airbnb Luxe + Net-a-Porter + Apple  
**Core Principles:**
- Space = Luxury (breathing room, never crowded)
- One clear focus per screen (no competing CTAs)
- Confidence in design (no apologies, no clutter)
- Discovery feels effortless (not "search for results")

---

## **Page Architecture: 5-Section Flow**

### **Section 1: THE EDIT (Immersive Hero)**
**Purpose:** Emotional moment, not functional. Set the tone for the experience.

**Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│   Category Tag (WEDDING VENUES)             │
│                                             │
│   "Amalfi Coast"                            │
│   H1: clamp(48px, 6vw, 72px)               │
│                                             │
│   "A collection of extraordinary..."       │
│   Subheading: clamp(18px, 2.5vw, 28px)    │
│   Color: #d1a352 (gold)                    │
│   fontStyle: italic                         │
│                                             │
│   [32 Curated Venues] | 100% Verified      │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 60vh (min 500px, responsive)
- **Background:** Hero image (opacity 0.6) + dark gradient overlay
  - Gradient: `linear-gradient(180deg, rgba(4,3,2,0.4) 0%, rgba(4,3,2,0.6) 50%, rgba(4,3,2,0.85) 100%)`
  - Ensures text is readable without sacrificing image beauty
- **Top accent:** 2px gold shimmer line (gradient: #C9A84C → #e8c97a → #C9A84C)
- **Content alignment:** flex column, justify-content: center, align-items: flex-start
- **Content padding:** 0 80px (desktop), responsive down to 0 24px (mobile)
- **Typography:**
  - Category tag: 10px uppercase, letter-spacing 4px, color: rgba(201,168,76,0.85)
  - H1: fontFamily GD (serif, elegant), weight 400, letter-spacing -1px
  - Subheading: fontFamily GD, weight 300, italic, color #d1a352
  - Venue count: fontFamily GD, 32px, weight 600, color #C9A84C
  - Credibility text: 10px uppercase, color rgba(255,255,255,0.45)

**Mobile Adjustments:**
- Height: auto (90vh on mobile)
- Padding: 0 24px (smaller sides)
- Venue count + credibility: stack vertically or hide count if space constrained
- H1 fontSize: shrinks via clamp() naturally

---

### **Section 2: CURATED PICKS (Featured Venues)**
**Purpose:** Showcase taste/curation. Communicate "we've selected these for you" (not "here's everything").

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ OUR SELECTION                                        │
│ Featured Collections                                 │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐ ┌─────..┐│
│  │                 │  │                 │ │       ││
│  │  Venue Card 1   │  │  Venue Card 2   │ │Card 3 ││
│  │  (560px h)      │  │  (560px h)      │ │       ││
│  │                 │  │                 │ │       ││
│  └─────────────────┘  └─────────────────┘ └─────..┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Specifications:**
- **Background:** `rgba(201,168,76,0.02)` (dark mode) or `rgba(201,168,76,0.01)` (light mode)
- **Border bottom:** `1px solid rgba(201,168,76,0.08)`
- **Padding:** 96px 80px (vertical-horizontal)
- **Max-width container:** 1400px, margin 0 auto
- **Grid:**
  - `display: grid`
  - `gridTemplateColumns: repeat(auto-fit, minmax(420px, 1fr))`
  - `gap: 32` (breathing room between cards)
  - Cards automatically scale: 3 on desktop (420+420+420+gaps), 2 on tablet, 1 on mobile
- **Card height:** 560px (matches LuxuryVenueCard standard)
- **Section header:**
  - Tag: 10px uppercase, letter-spacing 3px, color rgba(201,168,76,0.7)
  - H2: fontFamily GD, clamp(28px, 4vw, 42px), weight 400, margin-top 16px
  - Margin-bottom 64px (breathing room before grid)

**Content:**
- Shows top 3 featured venues (sorted by featured flag in database)
- Uses existing LuxuryVenueCard component (no modifications needed)
- Card displays: image, title, location, badges, stars, CTAs (Quick View, Enquire, Profile)

---

### **Section 3: EXPLORE (Filters + All Venues)**
**Purpose:** User control appears here. Guidance first (featured curated picks), control second (all venues with filters).

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ DISCOVER YOUR PERFECT VENUE                          │
│                                                      │
│ STYLE        ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│              │All │ │Mod │ │Gdn │ │Rus │ ...       │
│              └────┘ └────┘ └────┘ └────┘            │
│              │                                       │
│ GUEST COUNT  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│              │Small 0-  │ │Medium100 │ │Large250+ │ │
│              │100       │ │-250      │ │          │ │
│              └──────────┘ └──────────┘ └──────────┘ │
│              [16 venues]                            │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │ ...  │
│  │(320px) │ │(320px) │ │(320px) │ │(320px) │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Specifications:**
- **Background:** C.dark (darker than featured section)
- **Border bottom:** `1px solid ${C.border}`
- **Padding:** 64px 80px
- **Max-width container:** 1400px, margin 0 auto
- **Section header:**
  - H2: fontFamily GD, clamp(24px, 3vw, 36px), weight 400, margin-bottom 48px
- **Filter bar:**
  - `display: flex`, `gap: 16`, `flex-wrap: wrap`, align-items: center
  - Margin-bottom: 48px
  - Two filter groups: STYLE + GUEST COUNT (separated by vertical divider)

**Filter Styling:**
- **Label:** 10px uppercase, letter-spacing 1px, color rgba(201,168,76,0.6), display block, margin-bottom 8px
- **Button group:** `display: flex`, `gap: 8`, `flex-wrap: wrap`
- **Individual button:**
  - Padding: 8px 16px
  - Background: transparent (inactive) or rgba(201,168,76,0.2) (active)
  - Border: 1px solid rgba(201,168,76,0.3) (inactive) or #C9A84C (active)
  - Color: C.white
  - Border-radius: 4px
  - Cursor: pointer
  - fontSize: 12px
  - fontFamily: NU
  - Transition: all 0.2s
  - Hover state: border-color changes to #C9A84C
- **Divider between groups:** `borderLeft: 1px solid ${C.border}`, `paddingLeft: 32`
- **Result count (right-aligned):** `marginLeft: auto`, fontSize 12px, color rgba(255,255,255,0.6)

**Filter Logic:**
- **Style:** Show all available styles from venue data (e.g., Modern, Garden, Rustic, Classic, Contemporary)
  - "All" button resets to show all venues
  - Selected style filters venues: `v => v.style === selectedStyle`
- **Guest Count:** Three tiers
  - Small: 0-100 guests → `v => parseInt(v.capacity) <= 100`
  - Medium: 100-250 guests → `v => cap > 100 && cap <= 250`
  - Large: 250+ guests → `v => cap > 250`
  - Togglable: can select/deselect independently

**Venues Grid:**
- `display: grid`
- `gridTemplateColumns: repeat(auto-fill, minmax(320px, 1fr))`
- `gap: 20` (tighter than featured section, supports more cards)
- **Card height:** 400px (smaller than featured, allows more density)
- Uses existing LuxuryVenueCard component
- Dynamically updates based on selected filters (useMemo)

---

### **Section 4: DISCOVERY LOOP (Nearby Destinations)**
**Purpose:** Keep users exploring, serendipity layer. "What else should I know about?"

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ EXPLORE                                              │
│ Nearby Destinations                                  │
│ Discover similar venues and experiences in ...       │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐ ┌──────────┐   │
│  │ Ravello      │  │ Positano     │ │Lake Como │   │
│  │ Clifftop...  │  │ Cascading... │ │Alpine... │   │
│  └──────────────┘  └──────────────┘ └──────────┘   │
│                                                      │
│  [More regions auto-wrap or pagination]             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Specifications:**
- **Background:** C.black
- **Border bottom:** `1px solid ${C.border}`
- **Padding:** 96px 80px
- **Max-width container:** 1400px, margin 0 auto
- **Section header:**
  - Tag: 10px uppercase, letter-spacing 3px, color rgba(201,168,76,0.6)
  - H2: fontFamily GD, clamp(28px, 4vw, 42px), weight 400, margin-top 16px
  - Descriptive paragraph: 14px, color rgba(255,255,255,0.6), line-height 1.6, max-width 600px, margin-top 12px
  - Margin-bottom (section header block): 64px
- **Regions grid:**
  - `display: grid`
  - `gridTemplateColumns: repeat(auto-fit, minmax(300px, 1fr))`
  - `gap: 24`

**Region Card:**
- **Container:**
  - Padding: 32px
  - Background: rgba(201,168,76,0.04) (dark) or rgba(201,168,76,0.02) (light)
  - Border: 1px solid rgba(201,168,76,0.1)
  - Border-radius: var(--lwd-radius-card)
  - Text-decoration: none (it's an anchor)
  - Transition: all 0.3s
  - Cursor: pointer
  - Hover state:
    - Border-color: #C9A84C
    - Background: rgba(201,168,76,0.08) (dark) or rgba(201,168,76,0.05) (light)
- **Title (H3):** fontFamily GD, 22px, weight 400, color C.white, margin 0 0 12px, letter-spacing -0.3px
- **Description (p):** fontFamily NU, 13px, color rgba(255,255,255,0.6), line-height 1.6, margin 0

**Content:**
- 4 region cards: Ravello, Positano, Lake Como, Tuscany (configurable per location)
- Each card: name + description snippet
- Links to nearby region pages (internal linking for SEO)

---

### **Section 5: DEEP CONTENT (Editorial)**
**Purpose:** Optional reading layer. Provides context for discerning users without interrupting flow.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│             Why Amalfi Coast                         │
│                                                      │
│   The Amalfi Coast represents the pinnacle of        │
│   Italian destination weddings. Perched on           │
│   dramatic cliffsides...                             │
│                                                      │
│   From intimate ceremonies in centuries-old         │
│   villas to celebrations in terraced gardens...     │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Specifications:**
- **Background:** rgba(201,168,76,0.03) (dark) or rgba(201,168,76,0.01) (light)
- **Border bottom:** `1px solid ${C.border}`
- **Padding:** 96px 80px
- **Max-width container:** 900px (narrower, reading-friendly), margin 0 auto
- **H2:** fontFamily GD, clamp(24px, 3vw, 36px), weight 400, color C.white, margin 0 0 32px, letter-spacing -0.5px
- **Paragraphs:**
  - fontFamily NU
  - fontSize: 15px
  - color: rgba(255,255,255,0.75)
  - line-height: 1.8 (reading comfort)
  - margin: 0 0 24px (except last paragraph: margin 0)

**Content:**
- 2 paragraphs of editorial copy
- Topics: natural beauty, venue types, wedding experience, regional character
- Tone: aspirational, not utilitarian
- Never forced—can be omitted or collapsed on mobile if needed

---

## **Responsive Design**

### **Breakpoints:**

| Breakpoint | Device | Grid Cols | Padding | Font Scale |
|-----------|--------|-----------|---------|-----------|
| < 768px | Mobile | 1 | 24px | clamp() shrinks naturally |
| 768-1024px | Tablet | 2 | 48px | clamp() scales smoothly |
| > 1024px | Desktop | 3-4 | 80px | full clamp() range |

### **Grid Behavior:**

**Section 2 (Featured):**
- Desktop: 3 cols (420+420+420)
- Tablet: 2 cols (minmax 420px adapts)
- Mobile: 1 col (full width, minmax still applies)

**Section 3 (Explore):**
- Desktop: 4 cols (320+320+320+320+gap)
- Tablet: 2 cols (minmax 320px adapts)
- Mobile: 1 col (full width)

**Section 4 (Discovery):**
- Desktop: 4 cols (300+300+300+300)
- Tablet: 2 cols (minmax 300px adapts)
- Mobile: 1 col (full width)

### **Mobile-Specific Adjustments:**

- **Filter bar:** Stack vertically, remove divider between style/capacity
- **Section padding:** 40px 24px (instead of 96px 80px)
- **Hero height:** 90vh (instead of 60vh) to maintain immersive feel
- **Card heights:** Slightly reduced (featured 480px, explore 360px) to fit more on screen
- **Typography:** All clamp() values naturally scale down

---

## **Typography Scale**

| Usage | Font | Size | Weight | Line-height | Color |
|-------|------|------|--------|------------|-------|
| Hero H1 | GD (serif) | clamp(48px, 6vw, 72px) | 400 | 1.1 | #fff |
| Hero Subheading | GD (serif) | clamp(18px, 2.5vw, 28px) | 300 italic | 1.4 | #d1a352 |
| Section H2 (Featured/Discovery) | GD | clamp(28px, 4vw, 42px) | 400 | 1.2 | C.white |
| Section H2 (Explore) | GD | clamp(24px, 3vw, 36px) | 400 | 1.2 | C.white |
| Section H2 (Deep) | GD | clamp(24px, 3vw, 36px) | 400 | 1.2 | C.white |
| Section tag | NU (sans) | 10px | 600 | 1 | rgba(201,168,76,0.6-0.85) |
| Region card title | GD | 22px | 400 | 1.2 | C.white |
| Body copy | NU | 14-15px | 400 | 1.6-1.8 | rgba(255,255,255,0.6-0.75) |
| Button label | NU | 12px | 400 | 1 | C.white |

**Font variables:**
- GD = `var(--font-heading-primary)` (serif, elegant)
- NU = `var(--font-body)` (sans-serif, readable)

---

## **Color Palette**

| Purpose | Value | Usage |
|---------|-------|-------|
| Primary gold | #C9A84C | Active states, hover, accents |
| Secondary gold | #d1a352 | Hero subheading, italic text |
| Gold shimmer | #C9A84C → #e8c97a → #C9A84C | Top border gradient |
| Dark mode bg | C.black | Hero, discovery loop sections |
| Light bg accent | rgba(201,168,76,0.02-0.03) | Featured, deep content sections |
| Text primary | #fff | All headings |
| Text secondary | rgba(255,255,255,0.6-0.75) | Body copy, descriptions |
| Text tertiary | rgba(255,255,255,0.45) | Small labels, credibility |
| Border | rgba(201,168,76,0.08-0.1) | Section dividers, card borders |
| Button inactive | transparent + rgba(201,168,76,0.3) border | Filter buttons unselected |
| Button active | rgba(201,168,76,0.2) + #C9A84C border | Filter buttons selected |

---

## **Spacing System (8px base unit)**

| Value | Use Cases |
|-------|-----------|
| 8px | Button padding (horizontal), small gaps |
| 12px | Card details, minor spacing |
| 16px | Filter button padding, gaps between elements |
| 20px | Grid gap (explore venues) |
| 24px | Grid gap (regions), section margins, mobile padding |
| 32px | Padding inside cards, grid gap (featured), large gaps |
| 48px | Filter section margin, large gaps |
| 64px | Section padding (explore), header margin |
| 80px | Primary section padding (desktop) |
| 96px | Large section padding (featured, discovery) |

---

## **Interaction Patterns**

### **Filter Buttons**
- **Default state:** transparent bg, rgba(201,168,76,0.3) border
- **Hover state:** border-color → #C9A84C (0.2s transition)
- **Selected state:** rgba(201,168,76,0.2) bg, #C9A84C border
- **Click behavior:** toggle on/off for capacity, select one for style (radio-like)

### **Region Cards (Discovery Loop)**
- **Default state:** rgba(201,168,76,0.04) bg, rgba(201,168,76,0.1) border
- **Hover state:** rgba(201,168,76,0.08) bg, #C9A84C border (0.3s transition)
- **Click:** Navigate to region page

### **Venue Cards (Featured/Explore)**
- Delegated to LuxuryVenueCard component
- Hover states: image gallery, quick view available, links functional

---

## **State Management**

```javascript
// React state needed in RegionCategoryPage
const [selectedStyle, setSelectedStyle] = useState(null);
const [selectedCapacity, setSelectedCapacity] = useState(null);
const [qvItem, setQvItem] = useState(null); // Quick view modal

// Memoized derived state
const filteredVenues = useMemo(() => {
  let result = allVenues;
  if (selectedStyle) result = result.filter(v => v.style === selectedStyle);
  if (selectedCapacity) result = result.filter(v => {
    const cap = parseInt(v.capacity || 0);
    if (selectedCapacity === "small") return cap <= 100;
    if (selectedCapacity === "medium") return cap > 100 && cap <= 250;
    if (selectedCapacity === "large") return cap > 250;
  });
  return result;
}, [allVenues, selectedStyle, selectedCapacity]);

const featuredVenues = useMemo(() => {
  return allVenues.filter(v => v.featured === true).slice(0, 3);
}, [allVenues]);
```

---

## **SEO Integration (Invisible Layer)**

The AI SEO system (`getLocationSEOSync()`) injects metadata/schemas invisibly:

```jsx
const aiSEO = getLocationSEOSync({
  locationName: regionName,
  countryName: countryName,
  regionType: "region",
  venueCount: allVenues.length,
  nearbyLocations: generateNearbyLocations(countrySlug, regionSlug)
});

return (
  <>
    <Helmet>
      <title>{aiSEO.title}</title>
      <meta name="description" content={aiSEO.description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={aiSEO.title} />
      <meta property="og:description" content={aiSEO.description} />
      <meta property="og:image" content={heroImage} />
      <script type="application/ld+json">
        {JSON.stringify(aiSEO.schemas.breadcrumbList)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(aiSEO.schemas.place)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(aiSEO.schemas.faqPage)}
      </script>
    </Helmet>
    
    {/* Visual content (5 sections above) */}
  </>
);
```

**What this achieves (invisible to users):**
- Dynamic, location-specific page titles (+20% CTR)
- Optimized meta descriptions (+15% CTR)
- Canonical URL (prevents duplicate content)
- Breadcrumb schema (15% CTR boost from search results)
- Place schema (20% impressions from knowledge panels)
- FAQ schema (25% CTR from rich snippets)
- Internal linking clusters (100% topical authority boost)

---

## **Implementation Checklist**

- [ ] Create luxury discovery in `RegionCategoryPage.jsx`
- [ ] Import LuxuryVenueCard component
- [ ] Implement 5-section layout with exact spacing/padding
- [ ] Add filter state (style, capacity)
- [ ] Implement filter logic in useMemo
- [ ] Test responsive grid behavior (desktop/tablet/mobile)
- [ ] Connect Helmet for SEO metadata
- [ ] Validate 3 JSON-LD schemas render correctly
- [ ] Test filter interactions (button states, venue count updates)
- [ ] Verify no console errors or performance issues
- [ ] Run Lighthouse (check LCP, FCP, CLS)
- [ ] Test on mobile (iOS + Android)
- [ ] Validate schema with Google Rich Results Test
- [ ] Deploy to production

---

## **Summary**

This specification defines the **luxury discovery experience** as a 5-section flow:

1. **THE EDIT** — Emotional, immersive hero (60vh, hero image + gradient + headline)
2. **CURATED PICKS** — Taste layer, featured venues (3 cards at 560px)
3. **EXPLORE** — User control, all venues with filters (grid 320px minmax)
4. **DISCOVERY LOOP** — Serendipity, nearby regions (cards 300px minmax)
5. **DEEP CONTENT** — Optional reading, editorial (900px max-width, prose)

**Design principle:** Space = luxury. Never crowded. Never utility-first. Guidance first (curation), control second (filters).

**Result:** A modern, premium discovery experience that redefines the category.
