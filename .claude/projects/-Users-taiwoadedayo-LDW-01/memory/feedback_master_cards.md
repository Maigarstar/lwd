---
name: Master card components — do not modify
description: GCard and GCardMobile are locked master components for luxury venues and vendors
type: feedback
---

Never modify GCard or GCardMobile. These are the canonical "master" display components for luxury venues and luxury vendors respectively.

**Why:** User explicitly locked them as masters — any changes to card layout/design must go through new components, not these.

**How to apply:** When upgrading city cards, region cards, or any listing display, build new card variants rather than altering GCard/GCardMobile. Pass the correct props (v, saved, onSave, onView, onQuickView) but never edit the components themselves.
