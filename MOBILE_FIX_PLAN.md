# MOBILE-FIRST FIX IMPLEMENTATION PLAN
## Quick Start: Phase 1 (Critical Path)

---

## PHASE 1: CRITICAL FIXES (April 6-10)

### FIX 1: Global Mobile Stylesheet
**Effort:** 2-3 hours
**Impact:** Fixes navigation and spacing consistency across all pages

```
Create: src/mobile.css

Content to include:
- Global @media (max-width: 768px) rules
- HomeNav mobile display (move from category.css)
- Global spacing tokens
- Default mobile text sizing
- Button sizing standards
- Form field heights

Files to update:
- main.jsx: import src/mobile.css after category.css
- category.css: remove duplicate HomeNav rules (keep category-specific overrides)
```

**Checklist:**
- [ ] Create src/mobile.css
- [ ] Extract HomeNav rules from category.css to mobile.css
- [ ] Test hamburger menu on /advertise (non-category page)
- [ ] Test hamburger menu on /artistry-awards (non-category page)
- [ ] Verify spacing consistent across pages
- [ ] Update main.jsx import order

### FIX 2: HomeNav Drawer Mobile Optimization
**Effort:** 1 hour
**Impact:** Better mobile navigation experience

**Changes to src/components/nav/HomeNav.jsx:**
- [ ] Increase dark mode toggle to min 44x44px (currently may be small)
- [ ] Add touch feedback to drawer items
- [ ] Test drawer animation performance
- [ ] Verify "List Your Business" CTA visibility on all resolutions

### FIX 3: Form Mobile Optimization (AdvertisePage)
**Effort:** 3-4 hours
**Impact:** Main conversion page works on mobile

**Files to update:**
- src/pages/AdvertisePage.jsx
- src/components/enquiry/PartnerEnquiryForm.jsx

**Checklist:**
- [ ] Input fields min 44px height on mobile
- [ ] Single column layout on mobile
- [ ] Labels clearly visible (not placeholder-only)
- [ ] Form padding/spacing adjusted
- [ ] Submit button full-width on mobile
- [ ] Validation messages clear on mobile
- [ ] Test form submission flow
- [ ] Test with mobile keyboard

### FIX 4: Button Sizing Audit & Fixes
**Effort:** 2-3 hours
**Impact:** Accessibility, tap target standards

**Systematic review:**
1. Homepage CTA buttons
2. AdvertisePage buttons
3. ArtistryPage buttons
4. All modal CTA buttons

**Definition:**
- Primary CTAs: 48px height minimum on mobile
- Secondary buttons: 44px height minimum
- Padding: `12px 24px` minimum on mobile

**Checklist:**
- [ ] Audit "List Your Venue" button sizing
- [ ] Audit "Ask Aura" button sizing
- [ ] Audit form submit buttons
- [ ] Audit modal CTAs
- [ ] Fix undersized buttons

---

## PHASE 2: HERO & TYPOGRAPHY (Week 2)

### FIX 5: Hero Section Mobile Optimization
**Effort:** 2-3 hours
**Impact:** Better hero appearance on mobile

**Per page:**
- Homepage: SlimHero responsive scaling
- AdvertisePage: Hero text sizing
- ArtistryPage: ArtistryHero positioning

**Implementation:**
- Use `clamp()` for font-size: `font-size: clamp(24px, 6vw, 48px)`
- Adjust padding: `padding: clamp(20px, 4vw, 48px)`
- Hero height: `min-height: 380px` on mobile, `min-height: 520px` on desktop

**Checklist:**
- [ ] Define mobile hero heights per page
- [ ] Scale text with clamp()
- [ ] Test text readability over images
- [ ] Verify CTAs visible and tappable

### FIX 6: Typography Scale Implementation
**Effort:** 2-3 hours
**Impact:** Consistent heading hierarchy on mobile

**Create typography scale:**
```
Mobile (375px)    | Desktop
h1: 24-28px       | 42px
h2: 20-24px       | 36px
h3: 18-20px       | 28px
body: 15px        | 16px (or 15px)
small: 13px       | 14px
```

**Implementation:**
- Add CSS custom properties
- Use clamp() for responsive sizing
- Update component font-size rules

**Checklist:**
- [ ] Define scale in global CSS
- [ ] Test all headings on 375px width
- [ ] No awkward wrapping
- [ ] Line-height ≥ 1.3 for headings, ≥ 1.5 for body

---

## PHASE 3: CARDS & INTERACTIONS (Week 3)

### FIX 7: Card Mobile Testing & Optimization
**Effort:** 3-4 hours
**Impact:** Better card appearance on mobile

**Cards to audit:**
- LuxuryVenueCard (gallery)
- LuxuryVendorCard
- HCard (already good)
- GCard/GCardMobile
- PlannerCard

**Checklist:**
- [ ] Test image cycling/swipe on mobile
- [ ] Verify CTA buttons min 44x44px
- [ ] Test card tap targets
- [ ] Ensure images load quickly
- [ ] No text overflow

### FIX 8: Search & Aura Input Mobile Optimization
**Effort:** 1-2 hours
**Impact:** Primary interaction feels native on mobile

**Files:**
- src/components/search/ImmersiveSearch.jsx
- src/chat/AuraLauncher.jsx

**Checklist:**
- [ ] Search input min 44px height
- [ ] Aura launcher button min 44x44px
- [ ] Test keyboard interaction
- [ ] Placeholder text visible
- [ ] Mobile keyboard doesn't cover input

---

## PHASE 4: PERFORMANCE & POLISH (Week 4+)

### FIX 9: Image Optimization for Mobile
**Effort:** 4-5 hours
**Impact:** Faster loads on mobile, better performance metrics

**Implementation:**
- Implement responsive images with srcset
- Add lazy loading to images
- Test on 3G network simulation
- Optimize hero images specifically

**Checklist:**
- [ ] Create srcset variants (1x, 2x, 3x or width-based)
- [ ] Add loading="lazy" to non-critical images
- [ ] Test with DevTools throttling
- [ ] Core Web Vitals check

### FIX 10: Scroll Performance & Animation Polish
**Effort:** 2-3 hours
**Impact:** Smooth, premium feel on mobile

**Checklist:**
- [ ] Test scroll smoothness on budget Android phone
- [ ] Profile animation performance
- [ ] Disable heavy animations on mobile if needed
- [ ] Test parallax effects
- [ ] Verify watermarks don't interfere

---

## TESTING CHECKLIST

### Manual Testing (Required)
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro (430px)
- [ ] Samsung Galaxy S21 (360px)
- [ ] iPad Mini (768px)

### Pages to Test
- [ ] / (Homepage)
- [ ] /venue (Browse Venues)
- [ ] /[region]/[category] (Category Page)
- [ ] /advertise
- [ ] /artistry-awards
- [ ] /real-weddings
- [ ] /magazine
- [ ] /join

### User Flows to Test
- [ ] Browse venues (tap cards, scrolling)
- [ ] Search with AI bar
- [ ] Ask Aura (launch, interact)
- [ ] Form submission (on advertise page)
- [ ] Mobile navigation (hamburger menu)
- [ ] Video playback (if present)
- [ ] Image carousel (if present)

### Performance Testing
- [ ] Page load time (<3s on 3G)
- [ ] Time to Interactive (TTI) <5s
- [ ] Largest Contentful Paint (LCP) <2.5s
- [ ] Scroll FPS (target 60fps)

---

## FILE DEPENDENCIES

### Files to Create
- `src/mobile.css` — Global mobile stylesheet

### Files to Modify
- `src/main.jsx` — Import mobile.css
- `src/category.css` — Remove duplicate HomeNav rules (optional)
- `src/components/nav/HomeNav.jsx` — Possibly adjust toggle size
- `src/pages/AdvertisePage.jsx` — Form optimization
- Various component files — Button sizing, padding adjustments

### Files to Review (No changes expected)
- `src/components/cards/*.jsx` — Already responsive
- `src/pages/Artistry/*.jsx` — Check hero sizing
- `src/components/sections/*.jsx` — Verify responsive design

---

## SUCCESS METRICS

After implementing Phase 1:
- ✅ Hamburger menu visible on ALL pages
- ✅ Mobile spacing consistent across pages
- ✅ Forms functional on mobile
- ✅ All buttons min 44x44px

After completing all phases:
- ✅ 90+ Lighthouse score on mobile
- ✅ Core Web Vitals passing on mobile
- ✅ Consistent mobile experience across all pages
- ✅ Premium feel comparable to listings page

---

## PRIORITY OVERRIDE

If time is limited, do in this order:
1. Fix 1 (Global mobile.css) — Unblocks everything
2. Fix 2 (HomeNav drawer) — Navigation critical
3. Fix 3 (Forms) — Revenue impact
4. Fix 4 (Button sizing) — Accessibility

All of Phase 1 should take <10 hours total.

---

**Estimated Total Time:**
- Phase 1: 8-10 hours
- Phase 2: 4-6 hours
- Phase 3: 4-6 hours
- Phase 4: 6-8 hours
- **Total: 22-30 hours** (~1 week with other work)

---

**Start Date:** April 6, 2026
**Recommended Completion:** April 13, 2026
**Status:** Ready to implement
