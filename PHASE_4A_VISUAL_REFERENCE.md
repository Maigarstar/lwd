# Phase 4a: Quality Tier System - Visual Reference

## Tier Badge Examples

### On RecommendationCard (Aura Chat)
```
┌─────────────────────────────────────────────────────────────┐
│ Villa Rosanova              ◆ PLATINUM                      │ <- Top-right
│ Tuscany, Italy                                              │
│ Rating: 4.9 ★ (142 reviews)                                 │
│ Rustic Luxe • Classic • Garden                              │
│                                                              │
│ An eighteenth-century Tuscan estate with panoramic views    │
│ over rolling vineyard hills...                              │
│                                                              │
│ ★ EDITOR APPROVED  ✓ FACT CHECKED                           │
│ Updated 5 days ago                                           │
└─────────────────────────────────────────────────────────────┘
```

### On LuxuryVenueCard
```
┌─────────────────────────────────────────────────────────────┐
│ [Estate of the Month] [◆ PLATINUM]  <- Badge section        │
│ Villa Rosanova                                               │
│ Tuscan Estate • 180 capacity • ££££                          │
│ [Gallery Image]                                              │
│ Rating: 4.9 ★ (142)                                         │
│ Rustic Luxe • Classic • Garden                              │
│ Includes: Exclusive Use, Private Vineyard, 12 Bedrooms...   │
│ ─────────────────────────────────────────────────────────   │
│ ★ EDITOR APPROVED  ✓ FACT CHECKED                           │
│ Updated 5 days ago                                           │
└─────────────────────────────────────────────────────────────┘
```

### On GCard (Gallery Grid)
```
┌────────────────────────┐
│  [Gallery Images]      │
│                        │
│                        │
│ Villa Rosanova         │
│ Tuscany, Italy         │
│ 4.9 ★ (142)            │
│ [◆ PLATINUM]  <- Icon  │
│ ★ EDITOR APPROVED      │
│ Updated 5 days ago     │
└────────────────────────┘
```

### On HCard (Horizontal Card)
```
┌─────────────────────────────────────────────────────────────┐
│ [◆ PLATINUM] [Estate of the Month]                          │ <- Badge row
│ Villa Rosanova                                               │
│ Tuscany • 180 capacity • ££££ • 4.9 ★ (142)                 │
│ Rustic Luxe • Classic • Garden                              │
│                                                              │
│ ★ EDITOR APPROVED  ✓ FACT CHECKED                           │
│ Updated 5 days ago                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Tier Colors & Icons

### Platinum (◆)
```
Color:     #D4AF37 (Bright Gold)
Background: rgba(212, 175, 55, 0.1)
Border:    rgba(212, 175, 55, 0.6)
Icon:      ◆ (Diamond suit)
Label:     PLATINUM
Score:     90-100
Description: "Exceptional venue with comprehensive, reviewed content"
```

### Signature (★)
```
Color:     #C9A84C (Muted Gold)
Background: rgba(201, 168, 76, 0.1)
Border:    rgba(201, 168, 76, 0.6)
Icon:      ★ (Star)
Label:     SIGNATURE
Score:     70-89
Description: "Premium venue with strong editorial standards"
```

### Approved (✓)
```
Color:     #10b981 (Green)
Background: rgba(16, 185, 129, 0.1)
Border:    rgba(16, 185, 129, 0.6)
Icon:      ✓ (Checkmark)
Label:     APPROVED
Score:     50-69
Description: "Verified and approved venue"
```

### Standard (None)
```
No badge displayed
Hidden by TierBadge component
Returned as: null
Score:     0-49
```

---

## Size Variants

### Small (sm) - Cards
```
┌──────────────────┐
│ [◆ PLATINUM]     │
└──────────────────┘
Icon: 11px
Label: 9px
Padding: 3px 8px
Font Size: 9px
Font Weight: 700
```

### Medium (md) - Larger Cards
```
┌────────────────────────┐
│ [◆ PLATINUM]           │
└────────────────────────┘
Icon: 14px
Label: 11px
Padding: 5px 12px
Font Size: 11px
Font Weight: 600
```

### Large (lg) - Page Headers
```
┌──────────────────────────────┐
│ [◆ PLATINUM]                 │
└──────────────────────────────┘
Icon: 16px
Label: 12px
Padding: 6px 14px
Font Size: 12px
Font Weight: 600
```

---

## TierStrip on Showcase Pages

### Compact (fullText={false})
```
┌─────────────────────────────────────────────────────────────┐
│ ◆ PLATINUM                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Full (fullText={true})
```
┌─────────────────────────────────────────────────────────────┐
│ ◆ PLATINUM                                                   │
│   Exceptional venue with comprehensive, reviewed content     │
└─────────────────────────────────────────────────────────────┘
```

---

## Real Data Examples

### Palazzo Vendramin
```
contentQualityScore: 97
editorial_approved: true
editorial_fact_checked: true
editorial_last_reviewed_at: "2026-03-12T14:45:00Z"
Calculated Tier: PLATINUM (97 >= 90)
Display: ◆ PLATINUM badge + ★ Editor Approved + ✓ Fact Checked
```

### Villa Rosanova
```
contentQualityScore: 94
editorial_approved: true
editorial_fact_checked: true
editorial_last_reviewed_at: "2026-03-10T10:30:00Z"
Calculated Tier: PLATINUM (94 >= 90)
Display: ◆ PLATINUM badge + ★ Editor Approved + ✓ Fact Checked
```

### Villa d'Este Estate
```
contentQualityScore: 96
editorial_approved: false
editorial_fact_checked: true
editorial_last_reviewed_at: "2026-03-08T09:15:00Z"
Calculated Tier: PLATINUM (96 >= 90)
Display: ◆ PLATINUM badge + ✓ Fact Checked (no approved badge)
```

### Masseria Torre Coccaro
```
contentQualityScore: 88
editorial_approved: (undefined/false)
editorial_fact_checked: (undefined/false)
Calculated Tier: SIGNATURE (88 >= 70)
Display: ★ SIGNATURE badge (no approval badges)
```

---

## Light Mode vs Dark Mode

### Light Background
```
Tier Badge:
├─ Background: Subtle tint (10% opacity)
├─ Border: 60% opacity tier color
├─ Icon/Text: Full tier color (100%)
└─ Result: Gold or green on white background
```

### Dark Background
```
Tier Badge:
├─ Background: Subtle tint (10% opacity)
├─ Border: 60% opacity tier color
├─ Icon/Text: Full tier color (100%)
└─ Result: Gold or green on dark background
     Contrast verified WCAG AA (4.5:1)
```

---

## Responsive Behavior

### Mobile (375px)
```
- TierBadge: size="sm"
- Position: Maintained
- Font size: 9px
- Readable: ✅
- No truncation: ✅
```

### Tablet (768px)
```
- TierBadge: size="sm" or "md"
- Position: Adjusted for layout
- Font size: 10-11px
- Readable: ✅
```

### Desktop (1280px+)
```
- TierBadge: size="md" or "lg"
- Position: Full spacing
- Font size: 11-12px
- Readable: ✅
```

---

## Accessibility

### WCAG Compliance
- Color contrast: 4.5:1 (AA standard) ✅
- Text size: Minimum 9px ✅
- Focus states: Title attribute shows on hover ✅
- Keyboard: Not interactive (display only) ✅

### Semantic HTML
```javascript
<div
  style={{...}}
  title={tierProps.description}  // Screen reader accessible
>
  {tierProps.icon} {tierProps.label}
</div>
```

### Screen Reader
- Title attribute: "Exceptional venue with comprehensive, reviewed content"
- Icon: Read as Unicode character (◆★✓)
- Label: "PLATINUM" or "SIGNATURE" or "APPROVED"

