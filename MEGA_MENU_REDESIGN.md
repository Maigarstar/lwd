# Luxury Mega Menu Redesign Spec

## Vision
Transform mega menu from flat text list → **immersive editorial experience** with premium imagery, sophisticated typography, and cinematic interactions.

---

## Layout Structure

### Hero Section (Top)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Large Hero Image - Browse Venues category featured image] │
│                                                             │
│                  ✦ FEATURED DESTINATION                    │
│              Curated venues in Italy                        │
│                                                             │
│              [EXPLORE ALL VENUES →] button                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: 280px (full width)
- Background: Atmospheric hero image (Italian venue landscape)
- Overlay: Dark gradient (top to bottom, 0% → 60% opacity)
- Positioning: Image fills, object-fit: cover
- Subtle zoom effect on hover (scale 1.02, 0.5s ease)

---

## Content Grid (Below Hero)

### 2-Column Layout
```
┌─────────────────────┬─────────────────────┐
│  Category Cards     │  Featured Article   │
│  (Left)            │  (Right - Sticky)   │
│                     │                     │
│  • Italy card      │  ┌─────────────────┐│
│  • France card     │  │ Featured Story  ││
│  • Greece card     │  │ [Hero Image]    ││
│  • UK & Ireland    │  │                 ││
│  • Spain card      │  │ Title + excerpt ││
│  • Maldives card   │  │ Read time       ││
│  • Portugal card   │  └─────────────────┘│
│  • Caribbean card  │                     │
│  • USA card        │                     │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

**Left Column (Category Cards):**
- Width: 55%
- Display: Grid of 3 columns (responsive)
- Gap: 24px

**Right Column (Featured Article):**
- Width: 40%
- Position: sticky (stays visible while scrolling left)
- Offset: 20px from top

---

## Category Card Design

### Visual Structure
```
┌──────────────────────────────────────┐
│                                      │
│    [Card Image - 340x240]           │
│                                      │
│    Italy                             │
│    Wedding Venues & Estates          │
│                                      │
│    ✦ 340+ Venues curated             │
│    🏛️  Renaissance estates            │
│    📍 Venice, Rome, Florence          │
│                                      │
│    [EXPLORE ITALY →]                │
│                                      │
└──────────────────────────────────────┘
```

### Specs:
- **Container:**
  - Background: #ffffff (white) or rgba(245,240,232,0.95)
  - Border: 1px solid rgba(201,168,76,0.15)
  - Border-radius: 12px
  - Box-shadow: 0 8px 32px rgba(0,0,0,0.08)
  - Transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ← premium easing
  - Hover:
    - Box-shadow: 0 16px 48px rgba(0,0,0,0.15)
    - Transform: translateY(-6px)

- **Image:**
  - Aspect ratio: 4:3 (340x255px)
  - Border-radius: 12px 12px 0 0
  - Object-fit: cover
  - Overflow: hidden
  - Hover: scale(1.04), filter: brightness(0.85)
  - Transition: 0.6s ease (cinematic)

- **Content (Padding: 24px):**
  - Title: 18px, fontWeight 600, serif font (Cormorant Garamond), #0b0906
  - Subtitle: 12px, fontWeight 400, sans-serif, #8a7d6a, opacity 0.7
  - Meta line: 13px, sans-serif, #c9a84c, icon + text
  - Description: 12px, sans-serif, #5a5045, opacity 0.6, line-height 1.5

- **CTA Button:**
  - Text: "EXPLORE [Country] →"
  - Color: #c9a84c (gold)
  - Font: 11px, uppercase, fontWeight 700, sans-serif, letter-spacing 1px
  - Background: transparent
  - Border: 1px solid #c9a84c
  - Padding: 10px 18px
  - Border-radius: 6px
  - Margin-top: 12px
  - Hover:
    - Background: rgba(201,168,76,0.1)
    - Color: #e8c96a (lighter gold)

---

## Featured Article Section (Right)

### Visual Structure
```
┌────────────────────────────────┐
│                                │
│   [Featured Image - 300x200]   │
│                                │
│   LATEST STORY                 │
│                                │
│   The Art of Italian           │
│   Destination Weddings         │
│                                │
│   Explore emerging venues      │
│   and bespoke experiences      │
│   in Tuscany's wine country.   │
│                                │
│   12 min read                  │
│                                │
│   [READ MORE →]                │
│                                │
└────────────────────────────────┘
```

### Specs:
- **Container:**
  - Background: linear-gradient(135deg, rgba(11,9,6,0.4), rgba(201,168,76,0.08))
  - Border: 1px solid rgba(201,168,76,0.2)
  - Border-radius: 12px
  - Padding: 28px
  - Position: sticky
  - top: 20px

- **Label:**
  - Text: "LATEST STORY"
  - Font: 10px, uppercase, fontWeight 700, sans-serif, letter-spacing 0.12em
  - Color: #c9a84c
  - Margin-bottom: 16px
  - Prefix: ✦ icon

- **Title:**
  - Font: 22px, fontWeight 500, serif (Cormorant Garamond)
  - Color: #f5efe4
  - Line-height: 1.3
  - Margin-bottom: 12px

- **Description:**
  - Font: 13px, sans-serif, line-height 1.6
  - Color: rgba(245,240,232,0.7)
  - Margin-bottom: 16px

- **Meta:**
  - Font: 12px, sans-serif
  - Color: rgba(245,240,232,0.5)
  - Icon + text: "⏱️ X min read"

- **Read More Link:**
  - Same as CTA but subtle
  - Text: "READ MORE →"
  - Color: #c9a84c
  - Border: 1px solid #c9a84c
  - Hover: Background gold, text white

---

## Overall Panel Container

### Specs:
- **Background:**
  - Base: #f5efe4 (luxury cream)
  - Subtle pattern: Radial gradient at corners (rgba(201,168,76,0.03))
  - Or: Minimal geometric pattern (SVG, very subtle)

- **Padding:**
  - Top/Bottom: clamp(40px, 5vw, 56px)
  - Left/Right: clamp(40px, 8vw, 60px)

- **Shadow:**
  - Box-shadow: 0 20px 60px rgba(0,0,0,0.28) (luxury preset)

- **Border:**
  - Top: 1px solid #e0d8c8
  - Bottom: 1px solid #e0d8c8
  - Left/Right: none

- **Responsive:**
  - Desktop (>1024px): 2 columns shown
  - Tablet (768-1024px): Stack with featured article below cards
  - Mobile (<768px): Single column, cards stack, featured article at end

---

## Typography Hierarchy

| Element | Font | Size | Weight | Color | Letter-spacing |
|---------|------|------|--------|-------|-----------------|
| Panel section heading | Cormorant (serif) | 24px | 500 | #0b0906 | 0.3px |
| Category title | Cormorant (serif) | 18px | 600 | #0b0906 | 0.2px |
| Featured article title | Cormorant (serif) | 22px | 500 | #f5efe4 | 0.2px |
| Subtitle/Meta | Inter (sans) | 12px | 400 | #8a7d6a | 0.5px |
| CTA text | Inter (sans) | 11px | 700 | #c9a84c | 1px |
| Description | Inter (sans) | 13px | 400 | #5a5045 | 0.3px |

---

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary accent | #c9a84c | Gold buttons, borders, hover states |
| Primary accent (light) | #e8c96a | Hover brighten |
| Background | #f5efe4 | Panel background (luxury cream) |
| Text primary | #0b0906 | Headings, card titles |
| Text secondary | #5a5045 | Body text, descriptions |
| Text tertiary | #8a7d6a | Metadata, subtle text |
| Border | #e0d8c8 | Card borders, dividers |
| Accent subtle | rgba(201,168,76,0.1) | Hover backgrounds |

---

## Micro-interactions & Animations

### 1. Card Hover
```
On hover:
  - Scale: 1.00 → 1.02 (card body)
  - Image: scale(1.00) → 1.04
  - Image brightness: 100% → 85%
  - Box shadow: 0 8px 32px → 0 16px 48px
  - Transform: translateY(0) → translateY(-6px)
  - Duration: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
```

### 2. Hero Image Zoom
```
On panel open:
  - Initial: scale(1.0) opacity(0)
  - Final: scale(1.0) opacity(1)
  - Duration: 0.5s ease-out

On card hover:
  - Image scale: 1.0 → 1.04
  - Duration: 0.6s ease
```

### 3. Text Reveal
```
On panel open:
  - Cards fade in + slide up
  - Stagger: 50ms between each card
  - Duration: 0.4s ease-out
```

### 4. Featured Article Entrance
```
On panel open:
  - Slide in from right
  - Start: translateX(20px), opacity(0)
  - End: translateX(0), opacity(1)
  - Duration: 0.5s ease-out
  - Delay: 100ms
```

### 5. Button States
```
Idle:
  - Border: 1px solid #c9a84c
  - Color: #c9a84c
  - Background: transparent

Hover:
  - Background: rgba(201,168,76,0.1)
  - Color: #e8c96a
  - Box-shadow: inset 0 0 20px rgba(201,168,76,0.1)
  - Duration: 0.2s ease

Active:
  - Background: #c9a84c
  - Color: #0b0906
  - Duration: 0.1s ease
```

---

## Imagery Strategy

### Hero Section Image
- **Source:** High-res atmospheric venue photo (Italian villa, sunset, couples, elegance)
- **Size:** 1400px wide × 280px height (5:1 aspect)
- **Treatment:**
  - Overlay gradient: radial-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4))
  - Slight vignette effect
  - Subtle blur on load, sharp on display

### Category Cards
- **Source:** Featured venue image per destination
- **Size:** 340px × 255px (4:3 aspect)
- **Treatment:**
  - Sharp, well-lit venue photos
  - Lifestyle/couples photography when possible
  - Consistent color tone (warm, golden hour preferred)

### Featured Article Image
- **Source:** Article feature image or default venue image
- **Size:** 300px × 200px (3:2 aspect)
- **Treatment:**
  - High contrast, magazine-quality
  - Cropped to show elegant details

---

## Responsive Behavior

### Desktop (>1024px)
- 2-column layout (cards + featured article side-by-side)
- Hero image: 280px height
- Cards: 3-column grid within left section
- Featured article: sticky positioning

### Tablet (768-1024px)
- Hero image: 240px height
- Cards: 2-column grid
- Featured article: moves below cards, no longer sticky
- Padding: reduced from 60px to 40px

### Mobile (<768px)
- Hero image: 200px height (or full-width background)
- Cards: 1-column stack
- Featured article: below all cards
- Padding: 24px
- CTA buttons: full width
- Text: slightly smaller (16px titles instead of 18px)

---

## Implementation Notes

1. **Images should lazy-load** with placeholder (solid color or blur-up)
2. **Premium easing functions** throughout: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy feel
3. **Ambient motion** - subtle, not distracting
4. **Accessibility** - all hover states available via keyboard, proper ARIA labels
5. **Performance** - GPU-accelerated transforms, optimized images
6. **Luxury principle** - generous whitespace, premium spacing, breathing room

---

## Before/After Comparison

### Current
- Flat 2-column text list
- No imagery
- Basic borders, minimal styling
- Minimal hover effects
- Feels utilitarian

### Redesigned
- Hero image + curated cards + featured article
- Rich imagery throughout
- Premium spacing, typography, shadows
- Cinematic micro-interactions
- Feels luxurious, editorial, aspirational

---

## Next Steps
1. Implement hero section with image
2. Convert category text items → rich cards with images
3. Add micro-interactions & animations
4. Test responsive behavior
5. Optimize image loading
6. A/B test with users

