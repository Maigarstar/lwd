# Phase 4 Test & Deployment Plan

**Status:** Ready for QA Testing
**Scope:** Editorial Curation Visibility & Discovery Integration (Phases 4a-4f)
**Date:** March 15, 2026

---

## Test Execution Checklist

### Phase 4a: Quality Tier System

- [ ] **Tier Calculation Logic**
  - [ ] Platinum tier displays for scores 90-100 (◆ icon, bright gold)
  - [ ] Signature tier displays for scores 70-89 (★ icon, muted gold)
  - [ ] Approved tier displays for scores 50-69 (✓ icon, green)
  - [ ] Standard tier (no badge) for scores < 50
  - [ ] Tier calculation is deterministic (same score = same tier)

- [ ] **TierBadge Component**
  - [ ] Badge displays on LuxuryVenueCard (top-left, below tag)
  - [ ] Badge displays on GCard (bottom-left corner)
  - [ ] Badge displays on HCard (horizontal badge row)
  - [ ] Size variants work: sm/md/lg scale icon and text appropriately
  - [ ] showLabel prop toggles label display
  - [ ] Badge hidden when editorial curation toggle is OFF
  - [ ] Badge hidden for Standard tier venues

- [ ] **TierStrip Component (Venue Pages)**
  - [ ] Strip displays below hero section on venue pages
  - [ ] Strip shows full description when fullText={true}
  - [ ] Proper color/icon for Platinum/Signature/Approved
  - [ ] Hidden for Standard tier
  - [ ] Hidden when editorial curation toggle is OFF

### Phase 4b: Editorial Indicators

- [ ] **ApprovalIndicators Component**
  - [ ] ★ Editor Approved badge shows when editorial_approved=true
  - [ ] ✓ Fact Checked badge shows when editorial_fact_checked=true
  - [ ] Both badges show when both flags are true
  - [ ] No badge displays when both flags are false
  - [ ] Horizontal layout (default) displays badges in flex row
  - [ ] Vertical layout displays badges in flex column with gap
  - [ ] Hidden when editorial curation toggle is OFF

- [ ] **FreshnessText Component**
  - [ ] "Updated today" displays for 0-day-old reviews
  - [ ] "Updated yesterday" displays for 1-day-old reviews
  - [ ] "Updated X days ago" displays for 2-6 day old reviews
  - [ ] "Updated X weeks ago" displays for 7-29 day old reviews
  - [ ] "Updated X months ago" displays for 30-364 day old reviews
  - [ ] "Updated X years ago" displays for 365+ day old reviews
  - [ ] Size variants work: xs/sm/md/lg adjust font size
  - [ ] Hidden when no lastReviewedAt date provided
  - [ ] Hidden when editorial curation toggle is OFF

- [ ] **Integration on Cards**
  - [ ] All indicators display on LuxuryVenueCard (before footer)
  - [ ] All indicators display on GCard (before footer)
  - [ ] All indicators display on HCard (before footer)
  - [ ] Indicators respect luxe aesthetic (gold/green colors)
  - [ ] No layout shift or clipping

### Phase 4c: Aura Prioritization

- [ ] **Editorial Boost Calculation**
  - [ ] editorial_enabled=false venues get 1.0x multiplier (no boost)
  - [ ] editorial_approved=true adds 30 points
  - [ ] editorial_fact_checked=true adds 20 points
  - [ ] contentQualityScore maps 0-100 to 0-40 points
  - [ ] Freshness: 0-90 days = 10pt, 91-180 = 5pt, 180+ = 0pt
  - [ ] Final multiplier ranges 1.0-1.5 correctly

- [ ] **Aura Recommendation Ranking**
  - [ ] Approved venues rank higher than unapproved venues (test with mixed data)
  - [ ] Higher quality scores rank higher than lower scores (same approval status)
  - [ ] Recently reviewed venues rank higher than stale reviews
  - [ ] Top 3 recommendations marked with aura_recommended=true
  - [ ] Default venues (empty query) show editorial boost applied
  - [ ] Regional filter + editorial boost work together

- [ ] **Benchmark Test**
  - [ ] Palazzo Vendramin (approved, 97 quality, recent) ranks #1
  - [ ] Villa Rosanova (approved, 94 quality, recent) ranks #2
  - [ ] Villa d'Este (NOT approved, 96 quality) ranks #3
  - [ ] Score differences: 144.9 > 139.9 > 128.8 ✓

### Phase 4d: Global Editorial Curation Toggle

- [ ] **platformSettingsService Functions**
  - [ ] getPlatformSettings() returns object with editorial_curation_enabled
  - [ ] getPlatformSetting(key) returns boolean for specific key
  - [ ] setPlatformSettings(updates) persists to localStorage
  - [ ] setPlatformSetting(key, value) updates specific setting
  - [ ] isEditorialCurationEnabled() returns true by default
  - [ ] toggleEditorialCuration() flips boolean value

- [ ] **Toggle Behavior**
  - [ ] When enabled (true):
    - [ ] Editorial boost applies to Aura rankings
    - [ ] TierBadge, ApprovalIndicators, FreshnessText all display
    - [ ] aura_recommended flag set on top 3 recommendations
  - [ ] When disabled (false):
    - [ ] Editorial boost does NOT apply (standard ranking)
    - [ ] TierBadge returns null (not displayed)
    - [ ] ApprovalIndicators returns null (not displayed)
    - [ ] FreshnessText returns null (not displayed)
    - [ ] aura_recommended flag NOT set
    - [ ] Aura ranking uses lwdScore only

- [ ] **Browser Console Testing**
  - [ ] Read current setting: `localStorage.getItem('lwd_platform_settings')`
  - [ ] Toggle off: `localStorage.setItem('lwd_platform_settings', JSON.stringify({editorial_curation_enabled: false}))`
  - [ ] Refresh page → badges disappear, Aura uses standard ranking
  - [ ] Toggle on: `localStorage.setItem('lwd_platform_settings', JSON.stringify({editorial_curation_enabled: true}))`
  - [ ] Refresh page → badges reappear, Aura applies editorial boost

### Phase 4e: Collection Badges

- [ ] **CollectionBadge Component**
  - [ ] Badge displays with correct collection object (label, icon, color)
  - [ ] Size variants work: sm/md/lg scale icon and text
  - [ ] Styled with semi-transparent background matching collection color
  - [ ] Border uses collection color at 40% opacity

- [ ] **Aura Recommended Collection Badge**
  - [ ] Displays when aura_recommended=true on RecommendationCard
  - [ ] Shows ✓ icon with green color (#10b981)
  - [ ] Label reads "Aura Recommended"
  - [ ] Positioned before footer divider on card
  - [ ] Appears on top 3 recommendations in Aura chat

- [ ] **Manual Collection Badges (Future)**
  - [ ] Structure ready for Signature Venue (★)
  - [ ] Structure ready for Editor's Choice (✨)
  - [ ] Structure ready for Iconic Venue (◆)
  - [ ] Ready for Listing Studio assignment

---

## Visual & UX Testing

### Card Display Across All Types

- [ ] **LuxuryVenueCard**
  - [ ] Tier badge displays top-left below tag badge
  - [ ] Approval indicators display before footer
  - [ ] Freshness text displays under approval indicators
  - [ ] No layout shift or clipping
  - [ ] Badges visible on dark background

- [ ] **GCard**
  - [ ] Tier badge displays bottom-left corner
  - [ ] Approval indicators display before footer
  - [ ] Freshness text displays under approval indicators
  - [ ] Gallery overlay doesn't obscure badges

- [ ] **HCard**
  - [ ] Tier badge integrates into horizontal badge row
  - [ ] Approval indicators display vertically before footer
  - [ ] Freshness text displays inline with indicators
  - [ ] Horizontal layout maintains alignment

### Responsive Design

- [ ] **Mobile (375x812)**
  - [ ] Badges visible and readable
  - [ ] Text doesn't overflow or truncate
  - [ ] Spacing preserved
  - [ ] No horizontal scroll
  - [ ] Touch targets adequate (badges clickable if interactive)

- [ ] **Tablet (768x1024)**
  - [ ] Badges display correctly
  - [ ] Grid layouts adapt
  - [ ] Card widths appropriate
  - [ ] Content doesn't overflow

- [ ] **Desktop (1280x800+)**
  - [ ] Badges display with full styling
  - [ ] Cards render at proper widths
  - [ ] Badges align correctly
  - [ ] Hover states work (if interactive)

### Dark Mode

- [ ] **Dark Mode Support**
  - [ ] Gold badges visible on dark backgrounds
  - [ ] Green badges visible on dark backgrounds
  - [ ] Text contrast meets WCAG AA standards
  - [ ] No color bleeding or transparency issues
  - [ ] All components have dark mode support

---

## Performance Testing

- [ ] **Bundle Size**
  - [ ] CollectionBadge.jsx adds < 1KB gzipped
  - [ ] platformSettingsService.ts adds < 2KB gzipped
  - [ ] No unused imports or dead code

- [ ] **Aura Recommendation Time**
  - [ ] Editorial boost calculation < 50ms for 100 venues
  - [ ] rankByCuratedIndex with boost < 100ms for 100 venues
  - [ ] No noticeable slowdown in Aura chat

- [ ] **Storage**
  - [ ] localStorage entry for settings < 1KB
  - [ ] No memory leaks from repeated toggle calls

---

## Browser Compatibility

- [ ] **Chrome/Chromium (Latest)**
  - [ ] All badges display correctly
  - [ ] localStorage works
  - [ ] Dates parse correctly

- [ ] **Firefox (Latest)**
  - [ ] All badges display correctly
  - [ ] localStorage works
  - [ ] Dates parse correctly

- [ ] **Safari (Latest)**
  - [ ] All badges display correctly
  - [ ] localStorage works
  - [ ] Dates parse correctly (important for localDate parsing)

---

## Accessibility Testing

- [ ] **ARIA Labels**
  - [ ] CollectionBadge has title attribute
  - [ ] TierBadge has title attribute with description
  - [ ] ApprovalIndicators badges have title attributes
  - [ ] FreshnessText has title with full date

- [ ] **Color Contrast**
  - [ ] Gold text on gold background readable
  - [ ] Green text on green background readable
  - [ ] All badges meet WCAG AA (4.5:1 ratio)

- [ ] **Keyboard Navigation**
  - [ ] Badges don't interfere with tab order
  - [ ] No focus trap or loss

---

## Integration Testing

- [ ] **Full Editorial Flow**
  - [ ] Venue with editorial_approved=true, contentQualityScore=95:
    - [ ] Shows Platinum tier badge
    - [ ] Shows ★ Editor Approved and ✓ Fact Checked
    - [ ] Shows "Updated X days ago"
    - [ ] Ranks high in Aura (multiplier ~1.45)
    - [ ] Top 3 get aura_recommended=true
    - [ ] Displays Aura Recommended collection badge

  - [ ] Venue with editorial_approved=false, contentQualityScore=90:
    - [ ] Shows Signature tier badge (70-89 range? No, 90 is Platinum)
    - [ ] Actually: shows Platinum tier badge
    - [ ] Does NOT show ★ Editor Approved (only fact-checked)
    - [ ] Shows freshness if applicable
    - [ ] Ranks lower than approved venue (multiplier ~1.32)
    - [ ] May not be in top 3 (no aura_recommended badge)

  - [ ] Venue with editorial_enabled=false:
    - [ ] Even if approved, gets 1.0x multiplier (no boost)
    - [ ] Tiers/badges hidden
    - [ ] Standard ranking applies

---

## Deployment Checklist

- [ ] Code Review
  - [ ] All Phase 4 commits reviewed
  - [ ] No console errors or warnings
  - [ ] ESLint passes
  - [ ] TypeScript compiles without errors

- [ ] Git Status
  - [ ] All changes committed (git status clean)
  - [ ] Branch ready for merge
  - [ ] Commit messages clear and descriptive

- [ ] Staging Deployment
  - [ ] Merge branch to staging
  - [ ] Run build: `npm run build`
  - [ ] Deploy to staging environment
  - [ ] Verify all assets load correctly

- [ ] Staging QA
  - [ ] Run all tests from this checklist on staging
  - [ ] Performance benchmarks on staging
  - [ ] Full user flow testing
  - [ ] No regressions in existing features

- [ ] Production Deployment
  - [ ] Create git tag: `v4.0.0-editorial-curation`
  - [ ] Merge to main/master branch
  - [ ] Deploy to production
  - [ ] Monitor error logs for first 30 minutes
  - [ ] Verify Aura chat working correctly

- [ ] Post-Deployment
  - [ ] Monitor performance metrics
  - [ ] Check editorial boost effectiveness (ranking data)
  - [ ] Document any issues
  - [ ] Plan post-mortem if needed

---

## Rollback Plan (If Needed)

If critical issues found after production deployment:

1. Revert to previous production commit
2. Deploy previous version
3. Disable editorial curation toggle via admin panel
4. Investigate root cause
5. Plan remediation

---

## Sign-Off

Testing completed by: _________________
QA Lead approval: _____________________
Production deployment date: ___________

---

**End of Phase 4 Test Plan**

All tests must PASS before proceeding to production deployment.
