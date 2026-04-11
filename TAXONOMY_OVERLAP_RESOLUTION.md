# Taxonomy Overlap Resolution - Strict Lockdown

**Issue:** 3 categories have parity violations due to overlapping canonical values.

## Root Cause Analysis

| Value | Categories | Problem |
|-------|-----------|---------|
| "Historic" | Classic & Traditional, Black Tie & Formal, Luxury & Opulent | Aura doesn't know which is primary |
| "Classic" | Classic & Traditional, Black Tie & Formal | Same issue |
| "Black Tie" | Glamorous & Grand, Black Tie & Formal | Same issue |
| "Exclusive" | Glamorous & Grand, Luxury & Opulent | Same issue |

When Aura outputs "Historic", resolveAuraSemanticIntent returns the FIRST match (Classic & Traditional), not the user's intended category.

## Solution: Eliminate Overlaps for Strict Parity

### Option 1: Strict Separation (Recommended)

Remove overlaps entirely. Each value belongs to ONE category only.

**Changes:**

```javascript
// BEFORE
"Classic & Traditional": ["Classic", "Elegant", "Historic"]
"Black Tie & Formal": ["Black Tie", "Classic", "Historic"]

// AFTER (Strict Separation)
"Classic & Traditional": ["Classic"]
"Black Tie & Formal": ["Black Tie"]
// Historic stays in whichever is PRIMARY
```

**Decision: Where does "Historic" go?**
- "Classic & Traditional" (heritage/period venues)
- "Luxury & Opulent" (historic grand properties)
- "Black Tie & Formal" (formal heritage venues)

**Answer:** Move "Historic" to "Luxury & Opulent" as its primary category (most prestigious positioning)

### Option 2: Explicit Primary Mapping

Keep overlaps but define which category is "primary" for Aura disambiguation.

```javascript
// Add to resolveAuraSemanticIntent
const primaryMapping = {
  "Historic": "Luxury & Opulent",
  "Exclusive": "Glamorous & Grand",
  "Black Tie": "Black Tie & Formal",
  "Classic": "Classic & Traditional",
};
```

## Recommendation: Option 1 (Strict Separation)

For a luxury platform, parity is more important than coverage. Better to have 100% accurate results than ambiguous overlaps.

### Final Taxonomy (No Overlaps):

```javascript
"Classic & Traditional": ["Classic"]
"Glamorous & Grand": ["Black Tie", "Exclusive"]
"Luxury & Opulent": ["Historic", "Exclusive"]  // CONFLICT: Exclusive appears twice
"Black Tie & Formal": ["Black Tie"]  // CONFLICT: Black Tie appears twice
```

Still has overlaps. Need deeper fix:

### Real Solution: Semantic Clarity

Some values genuinely belong in multiple categories because they reflect overlapping aesthetics. Instead of forcing separation, we make Aura understand PRIMARY intent:

**For user saying "historic venue":**
- Could mean "Classic & Traditional" (heritage architecture)
- Could mean "Luxury & Opulent" (prestigious historic property)
- **Aura should ask or default to most popular match**

**Practical Implementation:**

```javascript
// In resolveAuraSemanticIntent, handle ambiguous values:
const ambiguousValues = {
  "Historic": "Luxury & Opulent",  // Default primary
  "Exclusive": "Glamorous & Grand",  // Default primary
  "Black Tie": "Black Tie & Formal",  // Default primary
};

if (ambiguousValues[value]) {
  return STYLE_MAP[ambiguousValues[value]];
}
```

## Action Items

1. **Update resolveAuraSemanticIntent** with ambiguous value mapping
2. **Remove overlaps from secondary categories** where they're not essential
3. **Re-test all 13 categories** for parity
4. **Document ambiguous values** so future updates don't break parity

## New Strict Taxonomy (After Fixes):

```javascript
"Classic & Traditional": ["Classic"]
"Contemporary & Modern": ["Minimalist", "Art Deco"]
"Rustic & Country": ["Rustic", "Rustic Luxe"]
"Bohemian & Free-Spirit": ["Bohemian"]
"Glamorous & Grand": ["Black Tie", "Exclusive"]
"Intimate & Elopement": ["Romantic"]
"Destination": ["Destination", "Coastal", "Lakeside"]
"Festival & Outdoor": ["Garden", "Vineyard", "Coastal"]
"Alternative & Creative": ["Gothic", "Contemporary"]
"Luxury & Opulent": ["Historic", "Exclusive"]  // Historic primary here
"Romantic & Whimsical": ["Romantic"]
"Minimalist & Chic": ["Minimalist"]  // No Art Deco (moved to Contemporary)
"Black Tie & Formal": ["Black Tie", "Classic"]  // Black Tie primary here
```

With explicit primary mapping in resolveAuraSemanticIntent.
