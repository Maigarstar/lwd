# MAGAZINE STUDIO REBUILD — LOCKED BRIEF ADDENDUM

## Three Additional Architectural Locks (Future-Proofing)

### 1. ARTICLE STATUS SYSTEM

**States:**
- `draft` — Initial state, visible only to article owner + admins
- `review` — Submitted for review, editorial team sees in queue
- `published` — Live on site, visible to readers
- `archived` — Removed from circulation, kept for reference

**Database:**
- Add `status` column to `posts` table (enum: draft | review | published | archived)
- Default new articles to `draft`
- Add `status_changed_at` timestamp (audit trail)
- Add `reviewed_by` UUID (null until review, links to admin user)

**UI in Editor:**
- Status badge in toolbar (top right, next to Publish button)
- Badge colors: gray (draft) | amber (review) | green (published) | slate (archived)
- Click badge to open status modal with state machine:
  - Draft → Review (submit for approval)
  - Review → Published (approve + publish) or Draft (reject + return)
  - Published → Archived (retire)
  - Archived → Draft (restore if needed)
- Add status reason/notes field (modal) — optional note explaining state change

**Editorial Workflow:**
- Admins see "Articles in Review" count on studio home
- Review queue shows articles waiting for approval
- Publish button disabled if status !== draft (only draft articles can publish directly)

**Phase 1 (this pass):**
- Add status column to schema
- Add status badge to editor toolbar (UI only, no logic yet)
- Status defaults to draft, UI shows it but doesn't allow state changes yet
- Status selector hidden or disabled (will implement logic in Phase 2)

**Phase 2 (future):**
- Implement full state machine logic
- Review queue dashboard
- Approval notifications
- Audit trail

---

### 2. FEATURE FLAGS (Placement & Discovery)

**Flags:**
- `is_featured` (boolean) — article is featured (top of homepage)
- `homepage_feature` (boolean) — article appears in "Featured Stories" section
- `category_feature` (boolean) — article featured in its category page
- `editors_pick` (boolean) — marked as Editor's Pick (curated collection)

**Database:**
- Add these 4 boolean columns to `posts` table
- Add `featured_until` date (optional, feature expires)
- Default all to `false`

**UI in Editor:**
- New tab or section: "Placement & Discovery"
- 4 checkboxes for each flag
- Optional date picker for `featured_until` (if is_featured = true, show date field)
- Help text explaining what each flag does:
  - "Featured" → appears at very top of homepage
  - "Homepage Feature" → included in featured stories section (grid)
  - "Category Feature" → pinned to top of its category page
  - "Editor's Pick" → included in editor's curated list

**Frontend Usage:**
- Homepage query filters for `is_featured = true` (first item, hero treatment)
- Featured stories section filters for `homepage_feature = true`
- Category page query filters for `category_feature = true` at top
- Sidebar/special section filters for `editors_pick = true`

**Phase 1 (this pass):**
- Add checkboxes to editor UI (Placement tab)
- Add columns to schema
- No frontend logic yet, flags are set but not used

**Phase 2 (future):**
- Update homepage query to use flags
- Create featured stories section
- Category page querying
- Editors Pick display

---

### 3. AI WRITER TAB (Architecture Ready, Implementation Later)

**Tab in Editor (new):**
- Position: Tab 7 (after LINKS tab)
- Label: "✦ AI Writer" (or "AI Assistant" with wand icon)
- Visible to all users but UI clearly indicates "Coming Soon" or "Beta"

**UI Structure (placeholder layout):**
```
┌─────────────────────────────────────┐
│ ✦ AI Writer — Coming Soon           │
├─────────────────────────────────────┤
│                                     │
│ Topic Input                         │
│ [_______________________________]   │
│ e.g., "luxury wedding destinations"│
│                                     │
│ Tone Settings                       │
│ [Dropdown: Editorial / Luxury / ...] │
│                                     │
│ Word Count Target                   │
│ [____] words (or [Dropdown])        │
│                                     │
│ Content Generation                  │
│ ┌─────────────────────────────────┐ │
│ │ □ Generate Outline              │ │
│ │   (shows bullet points)          │ │
│ │                                 │ │
│ │ □ Generate Full Article         │ │
│ │   (generates blocks from outline)│ │
│ │                                 │ │
│ │ □ Improve Existing Text         │ │
│ │   (selected blocks only)         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Disabled: Beta Features Coming]   │
│                                     │
│ Save to Draft  (when working)       │
│                                     │
└─────────────────────────────────────┘
```

**Backend Structure (fields only, no logic):**
- `ai_topic` (text) — what the article is about
- `ai_tone` (enum) — target tone
- `ai_word_count` (integer) — target length
- `ai_outline` (JSON) — generated outline (array of bullet points)
- `ai_generated` (boolean) — whether any content was AI-generated
- `ai_metadata` (JSON) — model used, parameters, generation time (audit)

**Database:**
- Add these fields to `posts` table (all nullable, defaults to null)
- Add `ai_last_generated_at` timestamp (audit trail)

**Tone Options (predefined):**
- Editorial (luxury magazine tone)
- Inspirational (aspirational, dreamy)
- Practical (how-to, guides)
- Narrative (storytelling)
- Professional (business, industry)

**Phase 1 (this pass):**
- Add AI Writer tab to editor UI
- Add input fields (topic, tone, word count)
- Add placeholders for outline/generation buttons (disabled, "Coming Soon")
- Add database fields (schema only, no logic)
- UI reads/writes these fields but generation is disabled

**Phase 2 (future):**
- Connect to AI service (Claude API for outline generation)
- Implement outline generation logic
- Implement full article generation (converts outline → blocks)
- Add "Improve existing text" feature (rewrite selected blocks)
- Implement feedback loop (user refines generated content)

**AI Service Integration (when ready):**
```
User input:
- Topic: "Italian wedding planning"
- Tone: "Luxury Editorial"
- Word count: 2500

AI generates:
1. Outline (bullet points)
2. Full article (structured as blocks)
3. Suggests hero image/media

Result:
- Populate blocks in editor
- User can edit/refine
- Save as draft or publish
```

---

## Schema Updates (Before Phase 1 Starts)

Add these columns to `posts` table:

```sql
-- Editorial Workflow
ALTER TABLE posts ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived'));
ALTER TABLE posts ADD COLUMN status_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE posts ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Feature Flags
ALTER TABLE posts ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN featured_until TIMESTAMP;
ALTER TABLE posts ADD COLUMN homepage_feature BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN category_feature BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN editors_pick BOOLEAN DEFAULT FALSE;

-- AI Writer
ALTER TABLE posts ADD COLUMN ai_topic TEXT;
ALTER TABLE posts ADD COLUMN ai_tone VARCHAR(50);
ALTER TABLE posts ADD COLUMN ai_word_count INTEGER;
ALTER TABLE posts ADD COLUMN ai_outline JSONB;
ALTER TABLE posts ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN ai_last_generated_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN ai_metadata JSONB;
```

Create migration file: `supabase/migrations/[timestamp]_add_editorial_ai_fields.sql`

---

## UI Tab Layout (Updated)

ArticleEditor tabs now 8 tabs (was 6):
1. **CONTENT** — blocks (intro + body core)
2. **HERO** — hero image, video, style
3. **METADATA** — title, slug, category, excerpt, author, tags
4. **SEO** — seoTitle, metaDescription, ogTitle, ogDescription, ogImage
5. **PLACEMENT** — (new) status badge, feature flags (is_featured, homepage_feature, category_feature, editors_pick, featured_until date)
6. **AI WRITER** — (new, placeholder) topic, tone, word count, outline generation, full article generation
7. **AI ASSISTANT** — (existing, renamed from "AI") tone settings, content generation buttons
8. **LINKS** — related articles, category links

Actually, rethink this — too many tabs now (8 is a lot). Better organization:

**Option A: Keep at 6 tabs, consolidate**
1. CONTENT
2. HERO
3. METADATA (includes placement flags)
4. SEO
5. AI (includes both assistant + writer features)
6. LINKS

**Option B: Keep tabs at 6, move Placement to separate section within METADATA**
Same as current but add "Placement & Discovery" accordion within METADATA tab

**Recommendation: Option B** — Keep tab count manageable, placement flags are metadata adjacent.

---

## Integration with Phase 1

**No code changes needed for Phase 1** — these are schema additions only. Schema migrations can run independently.

**Do during Phase 1:**
1. Create migration file for schema additions
2. Add UI fields for status badge, placement flags, AI tab (disabled/placeholder)
3. Verify POST_FIELD_MAP in magazineService includes these fields
4. No logic implementation, just UI + schema

---

## Future Phases (Roadmap)

- **Phase 1.5:** Migrate schema, add UI placeholders ✓ (schema + UI, no logic)
- **Phase 2:** Status machine logic + review queue
- **Phase 3:** Feature flags integration (homepage, category pages)
- **Phase 4:** AI Writer outline generation
- **Phase 5:** AI Writer full article generation
- **Phase 6:** AI Writer feedback + refinement

---

END OF ADDENDUM
