# MAGAZINE STUDIO REBUILD — LOCKED DESIGN BRIEF

**Date:** March 12, 2026
**Status:** LOCKED — Approved for implementation
**Primary Goal:** Fix magazine studio colors, layout, and gallery experience to match luxury platform standard

---

## PART 1: GALLERY EXPERIENCE AUDIT

### Existing Gallery Implementations Found

#### 1. LuxuryVenueCard & LuxuryVendorCard Gallery (Production-Ready)

**Location:** `/Users/taiwoadedayo/LDW-01/src/components/cards/LuxuryVenueCard.jsx` (532 lines)
**Complexity:** Advanced, production-ready carousel

**Features:**
- Full-bleed swipeable media carousel (images + video)
- Touch swipe support (min 40px threshold)
- Mouse drag support (grab cursor feedback)
- Keyboard navigation (arrows within lightbox)
- Video support with mute toggle
- Auto-play on visibility (IntersectionObserver)
- Multi-media mixing (images first, video last)
- Photography credit display (optional per-image)
- Photographer Instagram handle support
- Dynamic media count tracking
- Smooth 0.45s cubic-bezier transitions
- Cinematic gradient overlay
- Slide indicator bars (max 3, clickable, proportional navigation)
- Responsive heights (560px desktop, 100dvh mobile)

**Styling Approach:**
- Inline CSS styles (no CSS files)
- CSS variables: `--font-heading-primary`, `--font-body`, `--lwd-radius-card`, `--lwd-radius-input`
- Gold accent: `#C9A84C`
- Dark backgrounds: `rgba(0,0,0,0.x)` with backdropFilter blur
- Smooth transitions: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

**Mobile Behavior:**
- Full viewport height (`calc(100dvh - 10px)`)
- Touch swipe primary interaction
- Reduced button sizes (mute: 34px, arrows: 40px)
- Vertical scroll snap alignment
- No rounded corners on mobile

**Reusability Score:** HIGH
- Self-contained component
- No external dependencies beyond React
- Image/video data structure is flexible
- Can be extracted and adapted easily

**Data Structure:**
```javascript
// Accepted format:
{
  type: "image",
  src: "url.jpg",
  alt_text: "description",
  creditName: "photographer name",
  creditIG: "@handle",
  showCredit: boolean
}
```

---

#### 2. MediaGalleryModal (Full-Screen Lightbox)

**Location:** `/Users/taiwoadedayo/LDW-01/src/components/ui/MediaGalleryModal.jsx` (290 lines)
**Complexity:** Full-screen gallery lightbox

**Features:**
- Fixed position full-screen overlay
- Dark background with blur: `rgba(0,0,0,0.92)`
- Left/right arrow navigation
- Keyboard support (arrows, Escape)
- Touch swipe support (50px threshold)
- Dot indicators (expandable on current)
- Numbered counter (01/12 format)
- Video support (HTML5 video with controls)
- Auto-play video when navigated to
- Planner name header (optional)
- Close button (top-right)
- Video badge overlay

**Styling Approach:**
- Inline styles only
- Gold accents: `#C9A84C`
- Responsive sizing (isMobile detection)
- Backdrop blur: 8px
- Mobile optimized: 40px buttons, 8px spacing

**Mobile Behavior:**
- Smaller arrow buttons (40px vs 48px)
- Tighter spacing (12px vs 20px)
- Touch swipe primary navigation
- Keyboard still works

**Reusability Score:** HIGH
- Pure functional component
- No external state management
- Self-contained lightbox
- Can be composed with other components

---

#### 3. LightboxModal (Generic Modal)

**Location:** `/Users/taiwoadedayo/LDW-01/src/components/ui/LightboxModal.jsx` (130 lines)
**Complexity:** Simple overlay wrapper

**Features:**
- Flexible container for any content
- Scroll lock on body
- Escape key support
- Click-outside to close
- Video playback stop on close
- Smooth animations (`fadeUp 0.2s`)
- Dark overlay with blur
- Close button (36px circle)

**Styling:**
- Dark background: `rgba(4,3,2,0.88)`
- Accent border: `rgba(201,168,76,0.12)`
- Slide animation on open
- Portal rendering (document.body)

**Reusability Score:** VERY HIGH
- Completely generic
- Pure wrapper component
- Perfect for custom content
- Used as base for other modals

---

#### 4. Magazine ArticleBody Gallery Implementation

**Location:** `/Users/taiwoadedayo/LDW-01/src/pages/Magazine/components/ArticleBody.jsx` (500+ lines)

**Current Gallery Blocks (Basic Implementation):**

**Gallery Block:**
- Simple lightbox lightbox that opens images in full-screen
- Keyboard navigation (arrows, Escape)
- Click navigation (prev/next buttons)
- Image counter display
- Caption and credit display
- Responsive container

**Slider Block:**
- Carousel with prev/next arrows
- Dot indicator buttons
- Auto-play option (4s intervals)
- Max-height constraint (520px)
- Caption below image
- Basic hover states

**Masonry Block:**
- CSS columns layout (2-3 columns)
- Fallback to simple grid
- Captions below each image
- Gap between items (12px)

**Dual Image Block:**
- 50/50 or 60/40 layouts
- Flex-based side-by-side
- Optional captions
- Aspect ratio: 4/3
- Cover object-fit

**Lookbook Block:**
- 3-column grid (responsive)
- Square aspect ratio (3/4)
- Product labels below
- Minimal spacing

**Before/After Block:**
- Split layout with labels
- Label badges (top-left)
- 4/3 aspect ratio
- Label color customization

**Video Gallery Block:**
- Auto-fill grid (280px min)
- HTML5 video with controls
- Poster image support
- Title and caption below
- No click-to-lightbox

**Current Issues:**
- No click-to-lightbox on masonry (stacked view only)
- Slider is basic carousel, not gallery-quality
- No swipe support
- No professional lightbox (using simple overlay)
- Masonry doesn't connect to lightbox
- Video gallery shows controls inline (not premium)
- Missing photographer credits
- No premium feel (animations, polish)

---

### Comparison: Listing vs Magazine

| Feature | LuxuryVenueCard | ArticleBody Slider | Gap |
|---------|-----------------|-------------------|-----|
| Swipe support | Yes (40px threshold) | No | Magazine can't swipe |
| Keyboard nav | Yes (arrows, Escape) | Limited | Magazine basic |
| Touch drag | Yes (full implementation) | No | Magazine static |
| Video support | Yes (with mute) | Video block exists | Disconnected |
| Professional lightbox | Yes (MediaGalleryModal) | Basic overlay | Magazine is basic |
| Photographer credits | Yes (per-image) | No | Magazine missing |
| Smooth transitions | Yes (cubic-bezier) | Basic fade | Magazine abrupt |
| Responsive scaling | Yes (smart) | Basic % | Magazine needs work |
| Mobile optimized | Yes (IntersectionObserver, viewport height) | Limited | Magazine not optimized |
| Loading states | Implicit (lazy images) | No skeleton | Magazine needs improvement |

---

## PART 2: LOCKED DESIGN BRIEF

### 1. FINAL STUDIO LAYOUT (NON-NEGOTIABLE)

Layout structure:
```
┌─────────────────────────────────────────────────┐
│ Control Room Admin Sidebar (fixed, 220px or 56px) │
└─────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│ Magazine Studio Header (52px)                                              │
├──────────────────────┬──────────────────────┬──────────────────────────────┤
│                      │                      │                              │
│  EDITOR PANEL        │  SEPARATOR           │  PREVIEW CANVAS              │
│  (scrollable)        │  (1px border)        │  (scrollable, contained)     │
│                      │                      │                              │
│  Left Panel (40%)    │                      │  Right Panel (60%)           │
│  - Content Tabs      │                      │  - Live preview              │
│  - Block List        │                      │  - Viewport modes            │
│  - Block Editors     │                      │  - Theme toggles             │
│                      │                      │                              │
└──────────────────────┴──────────────────────┴──────────────────────────────┘
```

**Fixed elements:**
- Control Room sidebar always visible (not hidden for magazine-studio)
- Studio header (52px) with nav, theme toggle, publish button
- Split panel layout with 1px separator
- Both panels independently scrollable
- Preview canvas fully contained within right panel bounds
- No overflow or bleed outside panel

**Responsive approach:**
- Desktop (1440px+): full split view (40/60)
- Tablet (1024px): split view, narrower panels
- iPad (768px): split view still works, touch-friendly
- Phone (375px): editor-only or switcher mode (not split)

---

### 2. WRITING EXPERIENCE (CORE BLOCKS ARE SACRED)

**First two blocks must always be:**

1. **Intro/Lead Block** (using `intro` block type)
   - Short paragraph summarizing article (1-3 sentences)
   - Used in homepage card, category listings
   - Serif font, italic, larger size
   - Gold accent border on left
   - Should open/expand by default on new article

2. **Main Body Block** (WYSIWYG rich text)
   - Primary article content where most writing happens
   - Supports h2, h3, h4 headings
   - Paragraph, lists, blockquote, code formatting
   - Should open/expand by default on new article

**These blocks must:**
- Be expanded by default (not collapsed when article loads)
- Always appear at the top of the block list
- Be visually distinct (different background, special icon)
- Be impossible to delete (button disabled, tooltip "Core block")
- Stay locked at position 0 and 1 (drag-locked)
- Have longer default height in editor (150px min each)
- Show help text on hover: "This block is protected"

**Additional blocks (18 types):**
- All other blocks come after intro + body
- Optional, user can add any combination
- Can be reordered, deleted, duplicated
- Should have consistent editor patterns

---

### 3. SEO TAB (SEPARATE, NOT MIXED)

**Tab structure in editor:**

| Tab | Name | Contents |
|-----|------|----------|
| 1 | CONTENT | Blocks, core blocks, block list |
| 2 | HERO | Hero image, video, style, overlay |
| 3 | METADATA | Title, slug, category, excerpt, author, tags, reading time |
| 4 | SEO | seoTitle, metaDescription, ogTitle, ogDescription, ogImage |
| 5 | AI | Tone, generation buttons, settings |
| 6 | LINKS | Related articles, category links |

**SEO tab must:**
- Have its own dedicated tab (not collapsed into Metadata)
- Show all 5 SEO fields clearly visible
- Display field requirements:
  - seoTitle: max 60 characters (show counter)
  - metaDescription: max 155 characters (show counter)
  - ogTitle: recommended max 60 (show counter)
  - ogDescription: recommended max 155 (show counter)
  - ogImage: preview thumbnail of selected image
- Have help text explaining each field:
  - seoTitle: "What search engines display in results"
  - metaDescription: "The snippet shown under your title"
  - ogImage: "Shared when linked on social media"
- Show real-time character count with color feedback:
  - Green: within limit
  - Amber: approaching limit (>90% of max)
  - Red: over limit

---

### 4. BLOCK EDITOR SIMPLIFICATION (UI CLEANUP)

**Problem:** Block editors show too many options at once, feels overwhelming and cluttered.

**Solution:** Use accordion/expandable sections pattern to hide advanced options by default.

**Example for brand_spotlight block:**
```
┌────────────────────────────────────────┐
│ Brand Spotlight Editor                 │
├────────────────────────────────────────┤
│ [▼] Basic Info (always expanded)       │
│     └─ Brand name * (required)         │
│     └─ Brand logo URL                  │
│                                        │
│ [▶] Advanced Options (collapsed)       │
│     └─ Tagline                         │
│     └─ Link URL                        │
│     └─ Link text                       │
│     └─ Description                     │
│     └─ Background color                │
│                                        │
│ [▶] Additional Links (collapsed)       │
│     └─ Related brand link 1            │
│     └─ Related brand link 2            │
│     └─ CTA button text                 │
└────────────────────────────────────────┘
```

**Apply accordion pattern to blocks with >4 input fields:**
- `brand_spotlight` (6 fields → Basic + Advanced)
- `shop_the_story` (unlimited categories → collapsible list)
- `mood_board` (multiple fields → organized sections)
- `designer_spotlight` (if has >4 fields)
- Any future block with more than 4 inputs

**Section styling:**
- Header: 40px height, padding 12px 14px
- Toggle arrow: 16px, rotate on click
- Content: padding 12px 14px, smooth expand (250ms)
- Divider: 1px border-top between sections
- Background: hover effect `rgba(201,168,76,0.04)`

**Field visibility rules:**
- Basic section: always expanded on load
- Advanced: collapsed, expand on demand
- Help icons next to complex field names
- Required field indicators (*) in all sections
- Validation works for hidden fields (warn if required field empty)

---

### 5. MOBILE EDITING TARGET

**Primary editing target:** Desktop (1440px+)
**Secondary support:** iPad (768px+)
**Limited support:** Phone (375px)

**Desktop editing (optimal):**
- 40/60 split view (editor/preview)
- Full feature set available
- Split scrolling works smoothly
- All UI fully visible

**iPad editing (should work well):**
- 35/65 or 40/60 split view (smaller editor)
- Touch-friendly button sizes (44px minimum)
- Block list scrolls independently
- Tab bar accessible without horizontal scroll
- Pinch-to-zoom on preview works and doesn't break layout
- Editor panels must not overflow off-screen

**Phone editing (basic, low priority):**
- Full-screen editor mode OR full-screen preview (toggle button)
- Cannot use split view (too cramped)
- Block list takes full width
- Tab bar takes full width
- Save/publish buttons always visible at top
- Touch-friendly spacing (14px+ gaps)

---

### 6. MEDIA WORKFLOW (INDIVIDUAL UPLOADS, READY FOR FUTURE)

**Current approach (this pass):**
- Block-level uploads (each block handles its own images)
- Multi-file selectors where needed (gallery, masonry)
- Drag-drop reordering within block editor
- Per-image alt text editing
- Per-image caption editing
- Per-image credit editing

**Architecture prepared for (Phase 2, do NOT implement yet):**
- Central media library table (`magazine_media`) already exists in DB
- Service layer ready: `fetchMediaLibrary()`, `uploadToLibrary()`
- Blocks can reference library assets by ID (later)
- Image metadata schema supports future integration

**In this pass, ensure:**
- [ ] Upload flows work block-by-block
- [ ] Multi-file inputs support gallery blocks
- [ ] Alt text persists per image
- [ ] Captions persist per image
- [ ] Credits persist per image
- [ ] Image order persists in block data
- [ ] DO NOT build media library UI yet
- [ ] DO NOT add "Browse Library" button
- [ ] DO NOT create media.jsx component

---

### 7. PREVIEW BEHAVIOUR (STABLE, CONTAINED)

**Preview rendering:**
- Contained within right panel bounds (no bleed, no overflow)
- Desktop: 100% width of right panel, max 60% of screen
- Tablet: scales appropriately, always contained
- Mobile (375px): full width, separate mode

**Viewport preview modes:**
- Desktop (1280px): shows full article width
- Tablet (768px): shows constrained width
- Mobile (375px): shows mobile layout
- All modes show realistic article rendering
- Smooth transitions between modes (300ms CSS)

**Scaling approach:**
- Use CSS `transform: scale()` (NOT layout shift)
- Center preview with padding/flex
- Smooth transitions between viewport modes
- No jarring visual jumps when switching

**Live update behavior:**
- As user types in editor, preview updates instantly
- Block changes appear in real-time (no lag)
- Block addition/deletion shows immediately
- Theme toggle affects preview immediately
- Scroll position preserved on update

**Container sizing:**
- Max-width for preview: 720px (matches article width)
- Padding around preview: 20px (breathing room)
- Preview container height: fill available space
- Vertical scroll within preview (not page scroll)

---

### 8. GALLERY EXPERIENCE (CRITICAL FOR VISUAL PLATFORM)

### Current Audit Findings:

**Listing galleries (Production-Ready):**
- LuxuryVenueCard: Advanced carousel, touch/keyboard/mouse support
- MediaGalleryModal: Professional full-screen lightbox
- Features: swipe, drag, video, photography credits, smooth transitions
- Styling: inline CSS, gold accents, blur effects, responsive

**Magazine galleries (Basic Implementation):**
- ArticleBody has 6 gallery blocks (Slider, Masonry, Lookbook, etc.)
- No click-to-lightbox on masonry/dual/lookbook blocks
- No swipe support
- No professional lightbox (uses basic overlay)
- Video gallery is separate, not integrated
- Missing photographer credits
- Limited mobile optimization

### Front-end gallery requirements (Magazine Articles):

**Grid/Layout:**
- Clean masonry or grid matching listing component quality
- Responsive columns (3 desktop, 2 tablet, 1 mobile)
- Equal aspect ratios or smart masonry
- Subtle gap spacing (12px)

**Interaction:**
- Click image → professional lightbox opens
- Keyboard: arrow navigation, Escape to close
- Touch: swipe left/right in lightbox
- Mouse: drag to navigate (optional enhancement)

**Lightbox:**
- Next/previous arrows (50px buttons with icons)
- Numbered counter (01/12 format)
- Dot indicators (expandable active dot)
- Smooth image transitions (cubic-bezier)
- Dark overlay with blur
- Photography credit display
- Caption/alt text below image

**Mobile:**
- Touch swipe primary interaction
- Smaller buttons (40px)
- Responsive sizing
- Works in portrait and landscape

**Premium feel:**
- Smooth animations (cubic-bezier, 0.3-0.5s)
- Proper spacing and padding
- Professional colors (gold accents, dark backgrounds)
- Loading states (skeleton, blur placeholders)
- Hover effects (opacity, scale)

### Blocks requiring gallery experience:

1. **Gallery block** — grid of images, click opens lightbox
2. **Slider block** — carousel with swipe, auto-play
3. **Masonry block** — Pinterest-style grid, click opens lightbox
4. **Lookbook block** — image grid with labels, click opens lightbox
5. **Before/After block** — split layout, click each side opens lightbox
6. **Dual Image block** — side-by-side, click opens lightbox
7. **Video Gallery block** — grid of video thumbnails, click to play in lightbox

### Studio-side image management (Editor):

- [ ] Upload multiple images (drag-drop file input)
- [ ] Reorder images (drag handles or arrow buttons)
- [ ] Remove individual images (delete icon per image)
- [ ] Edit per-image alt text (text input)
- [ ] Edit per-image caption (text input)
- [ ] Edit per-image credit (text input + Instagram handle)
- [ ] Designate lead/featured image (radio button, used in card preview)
- [ ] Image preview thumbnails (80x80 px)
- [ ] Completeness indicator (✓ if alt + caption filled)

### Reusable component strategy:

**Option 1: Extract from listing (RECOMMENDED)**
- LuxuryVenueCard has advanced carousel logic
- Use as foundation for magazine gallery
- Adapt styling to match magazine aesthetic
- Create `MagazineGallery` wrapper component
- Compose with `MediaGalleryModal` for lightbox

**Option 2: Extend existing ArticleBody blocks**
- Keep simple gallery blocks as-is
- Add click handler to open lightbox
- Upgrade to professional lightbox component
- Enhance with swipe support

**Approach: Hybrid (BEST)**
1. Create `MagazineGallery.jsx` component
   - Wraps LuxuryVenueCard carousel logic
   - Adapts colors to magazine theme
   - Handles click → lightbox trigger
2. Create `MagazineGalleryLightbox.jsx` component
   - Extends MediaGalleryModal
   - Adds magazine-specific styling
   - Shows credits and captions
3. Update ArticleBody blocks:
   - Gallery, Masonry, Lookbook → use MagazineGallery
   - Before/After, Dual → click opens MagazineGalleryLightbox
   - Slider → keep as carousel (no separate lightbox)
   - Video Gallery → upgrade player styling

**Styling consistency:**
- Match magazine article fonts (Georgia serif, Montserrat UI)
- Use magazine color scheme (dark text, gold accents)
- Maintain magazine spacing and padding rules
- Ensure light/dark mode support
- Match border radius (2-4px, consistent with article)

---

## REBUILD PHASE BREAKDOWN

### Phase 1: Stabilize Foundation (Color, Cascade, Persistence) — 2-3 hours

**Outcome:** UI feels coherent, no false saved states, SEO persists

**Tasks:**
1. Replace all hardcoded colors in ArticleEditor/ArticleBody with theme tokens
2. Verify CSS var cascade from root → components (check --lwd-* and magazine colors)
3. Add missing SEO fields to database persistence (seoTitle, metaDescription, ogTitle, ogDescription, ogImage)
4. Fix autosave error handling (keep dirty flag on failure, don't hide indicator)
5. Add required field validation (block title, article category, article slug)
6. Test light/dark mode end-to-end (toggle affects editor AND preview)
7. Verify theme tokens are consistent (no hardcoded `#2a2620` or `#f5f0e8`)

**Definition of done:**
- [ ] Light mode: all text readable, contrast WCAG AA
- [ ] Dark mode: fully opaque, no light text on light bg
- [ ] Toggling light/dark affects entire editor instantly
- [ ] SEO fields persist across refresh
- [ ] Autosave error doesn't hide dirty indicator
- [ ] Cannot save article without category + slug
- [ ] All colors use theme tokens (zero hardcoded colors)

---

### Phase 2: Layout Cleanup (Remove Scale Quirks, Stabilize Containment) — 1-1.5 hours

**Outcome:** Preview feels stable, no jarring shifts, iPad works well

**Tasks:**
1. Replace viewport scaling with CSS `transform: scale()` (no layout shift)
2. Add responsive padding to preview canvas (20px desktop, 12px tablet)
3. Fix hero preview height (maxHeight constraint, maintain aspect ratio)
4. Ensure editor panel stays within parent bounds (no overflow)
5. Test on iPad (768px) — split view should work smoothly
6. Test on phone (375px) — graceful fallback (editor-only or switcher)
7. Add media queries for tablet/phone breakpoints

**Definition of done:**
- [ ] No visual shift between viewport modes
- [ ] Preview scales smoothly (CSS transform, not layout)
- [ ] iPad editing is usable (split view, 44px+ touch targets)
- [ ] Phone editing works (editor-only mode)
- [ ] Hero preview doesn't take excessive space
- [ ] No horizontal scroll on any device
- [ ] Left panel scrolls independently of right panel

---

### Phase 3: Block Editor Simplification (Hide Advanced Options) — 1-2 hours

**Outcome:** Editor UI feels clean, not overwhelming

**Tasks:**
1. Identify blocks with >4 fields (brand_spotlight, shop_the_story, mood_board, designer_spotlight)
2. Create accordion/expandable component (header, toggle arrow, content)
3. Move advanced fields into collapsed sections (default closed)
4. Add helper text to complex fields (hover tooltips)
5. Move validation to section level (warn if required field in hidden section)
6. Ensure block data still saves correctly with hidden fields
7. Test expand/collapse multiple times (no data loss)

**Definition of done:**
- [ ] brand_spotlight shows only 3 fields by default
- [ ] Advanced Options accordion reveals 3+ hidden fields
- [ ] Editor feels less crowded visually
- [ ] Validation works for hidden fields
- [ ] Data integrity after collapse/expand (no empty values)
- [ ] Smooth expand/collapse animation (250ms)

---

### Phase 4: Gallery Experience Integration (Reuse Listing Gallery) — 2-3 hours

**Outcome:** Magazine galleries match listing quality, consistent platform feel

**Studio-side tasks:**
- [ ] Verify gallery block multi-file upload works
- [ ] Verify image reorder, remove, alt text editing works
- [ ] Verify lead image selection works
- [ ] Verify images persist to database (check magazine_articles.content JSONB)

**Front-end tasks:**
1. Create `MagazineGallery.jsx` wrapper
   - Adapts LuxuryVenueCard carousel logic
   - Handles image/video mixing
   - Supports alt text, captions, credits
   - Emits click event to open lightbox
2. Create `MagazineGalleryLightbox.jsx`
   - Adapts MediaGalleryModal styling
   - Shows magazine theme colors
   - Displays photographer credits
   - Supports swipe, keyboard, arrows
3. Update ArticleBody blocks:
   - Gallery: render grid, click → lightbox
   - Masonry: render grid, click → lightbox
   - Lookbook: render grid, click → lightbox
   - Before/After: split layout, click each → lightbox
   - Dual Image: side-by-side, click → lightbox
   - Slider: keep as carousel (don't add separate lightbox)
   - Video Gallery: upgrade player, responsive grid
4. Test on desktop, tablet, mobile
5. Test swipe in lightbox on touch devices

**Definition of done:**
- [ ] Magazine gallery looks as good as listing gallery
- [ ] No "stacked images" output (only grids/carousels)
- [ ] Click image opens professional lightbox
- [ ] Lightbox has next/prev arrows, counter, dots
- [ ] Swipe works in lightbox on mobile
- [ ] Credits display if provided
- [ ] Captions/alt text display in lightbox
- [ ] Premium feel maintained (animations, spacing, colors)

---

### Phase 5: Preview Improvements (Color Tokens, Responsive Media) — 1-1.5 hours

**Outcome:** Preview accurately represents live article

**Tasks:**
1. Replace hardcoded preview colors with LIGHT_S/DARK_S tokens from theme
2. Apply focal point in image rendering (CSS `objectPosition` based on focal value)
3. Add responsive max-widths to media blocks (720px max for article)
4. Add loading states to video embeds (skeleton, placeholder, loading spinner)
5. Ensure preview refreshes instantly when theme toggles
6. Test that block updates trigger preview re-render (no stale state)
7. Verify images use lazy loading (loading="lazy")

**Definition of done:**
- [ ] Light mode preview matches light theme colors
- [ ] Dark mode preview is true dark (no gray)
- [ ] Image focal points respected in preview
- [ ] Media blocks have proper max-width constraint
- [ ] Video embeds show loading state before render
- [ ] Theme toggle updates preview instantly
- [ ] No console errors on theme toggle

---

### Phase 6: Core Blocks Prominence (Intro + Body Always Open) — 30 minutes

**Outcome:** New articles guide writers to core blocks first

**Tasks:**
1. On article load, auto-expand intro and body blocks (if collapsed)
2. Add visual distinction: highlight border, icon, badge saying "Core"
3. Disable delete button on core blocks (opacity: 0.5, cursor: not-allowed)
4. Add tooltip on hover: "Core block — cannot be deleted"
5. Lock core blocks at position 0 and 1 (prevent drag reordering to other positions)
6. Ensure expand state persists (save to localStorage or session state)
7. Test new article creation (both blocks open by default)

**Definition of done:**
- [ ] New articles show intro + body expanded
- [ ] Core blocks have visual indicator (badge or border)
- [ ] Delete buttons disabled on core blocks
- [ ] Drag-reordering locked (can't move core blocks below position 1)
- [ ] Experienced users can still edit content within core blocks
- [ ] Expand/collapse state saved across session

---

## NOT IN THIS PASS (Deferred to Phase 2)

- [ ] Central media library UI (backend ready, UI in Phase 2)
- [ ] Drag-and-drop block reordering (buttons work, drag UI later)
- [ ] Concurrent edit detection (versioning, Phase 2)
- [ ] Block templates (nice-to-have, later)
- [ ] Advanced SEO features (sitemap, structured data, Phase 2)
- [ ] AI content generation buttons (may add hooks, full UI Phase 2)

---

## SUCCESS CRITERIA (Magazine Feels Fixed)

After this rebuild, the magazine should feel:
- ✅ **Clean** — hardcoded colors gone, theme consistent throughout
- ✅ **Contained** — preview in bounds, no overflow, layout stable
- ✅ **Readable** — light mode works, dark mode works, high contrast
- ✅ **Coherent** — UI patterns consistent, no conflicting styles
- ✅ **Trustworthy** — no false "saved" states, SEO persists, validation prevents errors
- ✅ **Premium** — gallery looks good, animations smooth, polish evident
- ✅ **Usable on iPad** — split view works, 44px+ touch targets, scrolling smooth
- ✅ **Professional** — ready for production content creation

If any of these feel incomplete after the rebuild, we iterate. But the goal is: **magazine feels like a luxury editorial platform again, not a work-in-progress.**

---

## FILES TO MODIFY (Priority Order)

### Critical (Phase 1-3):
1. **ArticleEditor.jsx** — colors, cascade, advanced options, core blocks, SEO tab
2. **ArticleBody.jsx** — colors, theme tokens, responsive media, preview behavior
3. **magazineTheme.js** — verify all tokens exported and used correctly
4. **magazineService.js** — verify SEO field persistence in CRUD

### Medium (Phase 4-5):
5. **Create MagazineGallery.jsx** — new carousel wrapper component
6. **Create MagazineGalleryLightbox.jsx** — new lightbox component
7. **ArticleBody.jsx** — update block renderers to use new gallery components

### Lower Priority:
8. **MagazineStudio/index.jsx** — layout fixes (may be minimal)
9. **AdminDashboard.jsx** — verify layout (likely no changes)
10. **CSS files** (if any) — consolidate hardcoded styles to theme tokens

---

## TIMELINE ESTIMATE

- **Phase 1 (Foundation):** 2-3 hours
- **Phase 2 (Layout):** 1-1.5 hours
- **Phase 3 (Block UI):** 1-2 hours
- **Phase 4 (Gallery):** 2-3 hours
- **Phase 5 (Preview):** 1-1.5 hours
- **Phase 6 (Core blocks):** 30 minutes

**Total: 8-12 hours realistic (10 hours average)**

Can be split across 2-3 days if needed, or focused into single intensive day.

---

## IMPLEMENTATION NOTES

### Color Tokens to Use:
```javascript
// Light mode (LIGHT_S)
text: '#2a2620',
muted: 'rgba(150,140,130,0.65)',
border: 'rgba(150,140,130,0.2)',
bg: '#f9f7f3',

// Dark mode (DARK_S)
text: 'rgba(245,240,232,0.85)',
muted: 'rgba(150,140,130,0.65)',
border: 'rgba(201,168,76,0.12)',
bg: '#0f0d0a',

// Gold accent (both modes)
gold: '#C9A84C'
```

### CSS Variables to Use:
```css
--font-heading-primary: "Playfair Display", serif
--font-body: "Montserrat", sans-serif
--lwd-radius-card: 4px
--lwd-radius-input: 4px
```

### Key Transitions to Use:
```javascript
// Smooth animations
transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
transition: 'opacity 0.2s ease'
transition: 'transform 0.3s ease'
```

---

## COMMIT MESSAGE TEMPLATE

When committing changes, use:
```
fix: Magazine studio colors, theme tokens, gallery experience

- Replace hardcoded colors with theme tokens (Phase 1)
- Stabilize preview layout, fix containment (Phase 2)
- Simplify block editors with accordions (Phase 3)
- Integrate listing gallery into ArticleBody (Phase 4)
- Improve preview rendering, focal points (Phase 5)
- Lock core blocks (intro + body) (Phase 6)

Fixes magazine feeling incomplete, improves professional polish.
```

---

**LOCKED** ✓
Ready for implementation.
No further changes to scope without approval.
