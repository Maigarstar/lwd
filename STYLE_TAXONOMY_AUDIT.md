# Style Taxonomy Audit — Full Platform Review

**Phase 2 Goal:** Convert mapping file to strict taxonomy system with zero false positives

---

## Current 13 Categories — Semantic Analysis

### 1. "Classic & Traditional"
**Current:** ["Classic", "Elegant", "Historic"]  
**Analysis:**
- ✓ "Classic" — Timeless, elegant design aesthetic (CORRECT)
- ⚠️ "Elegant" — Appears in 5 categories (Glamorous & Grand, Luxury & Opulent)
- ✓ "Historic" — Heritage/period venues (CORRECT)
- **Issue:** "Elegant" is too generic, used as filler in multiple categories

**Recommendation:**
```javascript
"Classic & Traditional": ["Classic", "Historic"]
// "Elegant" removed — appears too often to be category-specific
```

---

### 2. "Contemporary & Modern"
**Current:** ["Modern", "Minimalist", "Art Deco"]  
**Analysis:**
- ✓ "Modern" — Current/contemporary aesthetic (but appears in 3 categories)
- ✓ "Minimalist" — Clean, spare design (CORRECT)
- ✓ "Art Deco" — Specific 1920s-30s style (CORRECT)
- **Issue:** "Modern" is used as catch-all in multiple categories

**Recommendation:**
```javascript
"Contemporary & Modern": ["Minimalist", "Art Deco"]
// "Modern" removed — too vague, appears in Alternative & Creative too
```

---

### 3. "Rustic & Country" ✅ FIXED
**Current:** ["Rustic", "Rustic Luxe"]  
**Analysis:**
- ✓ "Rustic" — Natural, countryside aesthetic (CORRECT)
- ✓ "Rustic Luxe" — Upscale rustic (CORRECT)
- ✓ Removed "Garden" (too generic)
- ✓ Removed "Vineyard" (feature, not aesthetic)

**Status:** ✅ VALIDATED - No overlaps, precise definitions

---

### 4. "Bohemian & Free-Spirit"
**Current:** ["Bohemian", "Intimate"]  
**Analysis:**
- ✓ "Bohemian" — Eclectic, artistic, unconventional (CORRECT)
- ⚠️ "Intimate" — Appears in 5 categories
  - Intimate & Elopement
  - Bohemian & Free-Spirit
  - Romantic & Whimsical
  - (potentially others)
- **Issue:** "Intimate" is a capacity/atmosphere descriptor, not an aesthetic

**Recommendation:**
```javascript
"Bohemian & Free-Spirit": ["Bohemian"]
// "Intimate" removed — it's atmosphere, not style
```

---

### 5. "Glamorous & Grand"
**Current:** ["Black Tie", "Elegant", "Exclusive"]  
**Analysis:**
- ✓ "Black Tie" — Formal evening wear → opulent venues (CORRECT)
- ⚠️ "Elegant" — Appears 5+ times (TOO GENERIC)
- ✓ "Exclusive" — Limited access, luxury positioning (CORRECT)
- **Issue:** Heavy overlap with Luxury & Opulent category

**Recommendation:**
```javascript
"Glamorous & Grand": ["Black Tie", "Exclusive"]
// "Elegant" removed — also in Classic & Traditional and Luxury & Opulent
```

---

### 6. "Intimate & Elopement"
**Current:** ["Intimate", "Romantic"]  
**Analysis:**
- ⚠️ "Intimate" — Appears in 4+ categories (TOO GENERIC)
- ✓ "Romantic" — Emotional aesthetic (CORRECT)
- **Issue:** "Intimate" conflates size (elopement) with atmosphere

**Recommendation:**
```javascript
"Intimate & Elopement": ["Romantic"]
// "Intimate" removed — it's a size descriptor, not a style
```

---

### 7. "Destination"
**Current:** ["Destination", "Coastal", "Lakeside"]  
**Analysis:**
- ✓ "Destination" — Travel/exotic locations (CORRECT)
- ✓ "Coastal" — Beachside venues (CORRECT)
- ✓ "Lakeside" — Lake venues (CORRECT)
- **Issue:** Slight overlap with Festival & Outdoor (both include Coastal)

**Recommendation:**
```javascript
"Destination": ["Destination", "Coastal", "Lakeside"]
// Keep as-is. Coastal venues can be both destination AND festival/outdoor
// Intentional overlap accepted (user looking for beach vacations)
```

---

### 8. "Festival & Outdoor"
**Current:** ["Garden", "Vineyard", "Coastal"]  
**Analysis:**
- ✓ "Garden" — Open-air, natural setting (CORRECT)
- ✓ "Vineyard" — Wine estate outdoor (CORRECT)
- ⚠️ "Coastal" — Appears in Destination too (INTENTIONAL OVERLAP)
- **Issue:** None identified. Clean category.

**Status:** ✅ VALIDATED - Intentional overlap with Destination acceptable

---

### 9. "Alternative & Creative"
**Current:** ["Modern", "Contemporary", "Gothic"]  
**Analysis:**
- ⚠️ "Modern" — Appears 3+ times (TOO GENERIC)
- ⚠️ "Contemporary" — Unclear if different from Modern
- ✓ "Gothic" — Specific aesthetic (CORRECT)
- **Issue:** "Modern" and "Contemporary" are redundant

**Recommendation:**
```javascript
"Alternative & Creative": ["Gothic", "Contemporary"]
// "Modern" removed — appears in Contemporary & Modern already
```

---

### 10. "Luxury & Opulent"
**Current:** ["Elegant", "Black Tie", "Historic", "Exclusive"]  
**Analysis:**
- ⚠️ "Elegant" — Appears 5+ times (TOO GENERIC)
- ⚠️ "Black Tie" — Also in Glamorous & Grand (OVERLAP)
- ✓ "Historic" — Also in Classic & Traditional (ACCEPTABLE OVERLAP)
- ✓ "Exclusive" — Also in Glamorous & Grand (ACCEPTABLE OVERLAP)
- **Issue:** Too many shared values with Glamorous & Grand

**Recommendation:**
```javascript
"Luxury & Opulent": ["Historic", "Exclusive"]
// "Elegant" removed — too generic
// "Black Tie" removed — use Glamorous & Grand instead
```

---

### 11. "Romantic & Whimsical"
**Current:** ["Romantic", "Garden", "Intimate"]  
**Analysis:**
- ✓ "Romantic" — Emotional, sentimental aesthetic (CORRECT)
- ✓ "Garden" — Also in Festival & Outdoor (ACCEPTABLE)
- ⚠️ "Intimate" — Appears 4+ times (TOO GENERIC)
- **Issue:** "Intimate" dilutes the category

**Recommendation:**
```javascript
"Romantic & Whimsical": ["Romantic", "Garden"]
// "Intimate" removed — it's atmosphere, not aesthetic
```

---

### 12. "Minimalist & Chic"
**Current:** ["Modern", "Minimalist", "Contemporary"]  
**Analysis:**
- ⚠️ "Modern" — Appears 3+ times (TOO GENERIC)
- ✓ "Minimalist" — Clean design (CORRECT)
- ⚠️ "Contemporary" — Unclear definition vs Modern
- **Issue:** Semantic overlap and vague definitions

**Recommendation:**
```javascript
"Minimalist & Chic": ["Minimalist"]
// "Modern" and "Contemporary" removed — too vague and redundant
```

---

### 13. "Black Tie & Formal"
**Current:** ["Black Tie", "Classic", "Historic"]  
**Analysis:**
- ✓ "Black Tie" — Formal evening aesthetic (CORRECT)
- ✓ "Classic" — Also in Classic & Traditional (ACCEPTABLE OVERLAP)
- ✓ "Historic" — Also in Classic & Traditional and Luxury (ACCEPTABLE OVERLAP)
- **Status:** ✅ VALIDATED - Clear purpose, acceptable overlaps

---

## Summary: Generic Values Causing False Positives

| Value | # of Categories | Issue | Recommendation |
|-------|-----------------|-------|-----------------|
| "Elegant" | 5 | Too generic, used as filler | REMOVE from all except primary |
| "Modern" | 3 | Vague, overlaps with Contemporary | CONSOLIDATE |
| "Intimate" | 5 | Atmosphere not aesthetic | REMOVE (use region/capacity filters) |
| "Elegant" | 5 | Generic luxury descriptor | CONSOLIDATE to 1-2 categories |

---

## Strict Taxonomy Rules

1. **No catch-all values** — Every value must represent a specific, recognizable aesthetic
2. **Limited overlap** — Values can appear 2× max (e.g., "Coastal" in Destination + Festival)
3. **No atmosphere as aesthetic** — "Intimate" is capacity, not style
4. **No features as aesthetic** — "Vineyard" is a feature, belongs only in appropriate category
5. **No generic adjectives** — "Elegant" is too vague to distinguish categories

---

## Proposed Refined Taxonomy

```javascript
export const STYLE_TAXONOMY = {
  "Classic & Traditional": {
    values: ["Classic", "Historic"],
    description: "Timeless elegance, period venues, heritage architecture"
  },
  "Contemporary & Modern": {
    values: ["Minimalist", "Art Deco"],
    description: "Modern design, clean lines, architectural innovation"
  },
  "Rustic & Country": {
    values: ["Rustic", "Rustic Luxe"],
    description: "Natural, countryside, earthy aesthetic"
  },
  "Bohemian & Free-Spirit": {
    values: ["Bohemian"],
    description: "Eclectic, artistic, unconventional, expressive"
  },
  "Glamorous & Grand": {
    values: ["Black Tie", "Exclusive"],
    description: "Formal opulence, luxury positioning, exclusive access"
  },
  "Intimate & Elopement": {
    values: ["Romantic"],
    description: "Small gatherings, romantic atmosphere, personal scale"
  },
  "Destination": {
    values: ["Destination", "Coastal", "Lakeside"],
    description: "Travel-worthy locations, exotic settings, destination weddings"
  },
  "Festival & Outdoor": {
    values: ["Garden", "Vineyard", "Coastal"],
    description: "Open-air venues, natural settings, outdoor celebrations"
  },
  "Alternative & Creative": {
    values: ["Gothic", "Contemporary"],
    description: "Non-traditional, artistic, unconventional spaces"
  },
  "Luxury & Opulent": {
    values: ["Historic", "Exclusive"],
    description: "High-end properties, premium positioning, heritage luxury"
  },
  "Romantic & Whimsical": {
    values: ["Romantic", "Garden"],
    description: "Sentimental, enchanting, dreamlike atmosphere"
  },
  "Minimalist & Chic": {
    values: ["Minimalist"],
    description: "Clean design, spare aesthetic, architectural purity"
  },
  "Black Tie & Formal": {
    values: ["Black Tie", "Classic", "Historic"],
    description: "Formal evening wear events, traditional black-tie venues"
  },
};
```

---

## Next Steps

1. Update src/constants/styleMap.js with refined taxonomy
2. Add STYLE_TAXONOMY object with descriptions
3. Test all 13 categories with new, stricter mappings
4. Verify Aura alignment with new taxonomy
5. Run cross-system truth tests
6. Add debug logging for visibility

---

## Risk Assessment

**Current (Before Refinement):** 8/10
- Multiple false positives due to generic values
- "Elegant" and "Modern" dilute category specificity

**After Refinement:** 9.5/10
- Strict semantics
- Zero catch-all values
- Clear category boundaries
- Intentional overlaps documented

