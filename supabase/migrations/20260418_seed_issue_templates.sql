-- ─────────────────────────────────────────────────────────────────────────────
-- Seed starter issue templates for the "Start from Template" dropdown
-- Run this ONCE in Supabase SQL Editor (safe to re-run — uses INSERT ... WHERE
-- NOT EXISTS to avoid duplicates).
--
-- These are STRUCTURE templates — blank pages with correct naming and page count.
-- Open the issue in the designer and use:
--   • AI Build  (⊕ AI Build) to populate pages automatically
--   • Template library to apply layouts page by page
--   • Fill Slots (⬡) to assign images across the issue
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO magazine_issue_templates (name, description, page_count, pages_data)
SELECT * FROM (VALUES

  -- ── 1. Luxury Editorial — 8 pages ─────────────────────────────────────────
  -- Full-scale editorial issue: cover, editor's note, two features, gallery,
  -- vendor credits, advertorial, back cover.
  (
    'Luxury Editorial — 8 Pages',
    'Cover · Editor''s Letter · Feature (2pp) · Styled Shoot (2pp) · Supplier Credits · Back Cover',
    8,
    '[
      {"pageNumber":1,"templateName":"cover-split",        "slot":"cover",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":2,"templateName":"editors-letter",     "slot":"editors-letter",   "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":3,"templateName":"feature-cinematic",  "slot":"feature-open",     "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":4,"templateName":"venue-essay",        "slot":"feature-body",     "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":5,"templateName":"styled-shoot",       "slot":"styled-shoot",     "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":6,"templateName":"wedding-gallery",    "slot":"gallery",          "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":7,"templateName":"supplier-credits",   "slot":"credits",          "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":8,"templateName":"back-cover",         "slot":"back-cover",       "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}}
    ]'::jsonb
  ),

  -- ── 2. Venue Feature — 6 pages ────────────────────────────────────────────
  -- Deep-dive into a single venue: cinematic opener, venue essay,
  -- couple gallery, behind-the-scenes, regional context, back cover.
  (
    'Venue Feature — 6 Pages',
    'Cover · Cinematic Opener · Venue Essay · Couple Gallery · Behind the Scenes · Back Cover',
    6,
    '[
      {"pageNumber":1,"templateName":"cover-split",        "slot":"cover",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":2,"templateName":"feature-cinematic",  "slot":"feature-open",     "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":3,"templateName":"venue-essay",        "slot":"venue-story",      "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":4,"templateName":"couple-gallery",     "slot":"gallery",          "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":5,"templateName":"behind-scenes",      "slot":"behind-scenes",    "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":6,"templateName":"back-cover",         "slot":"back-cover",       "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}}
    ]'::jsonb
  ),

  -- ── 3. Vendor Showcase — 4 pages ─────────────────────────────────────────
  -- Focused vendor/planner profile: cover, profile article, product showcase,
  -- back with contact + credits.
  (
    'Vendor Showcase — 4 Pages',
    'Cover · Planning Edit · Product Showcase · Back Cover',
    4,
    '[
      {"pageNumber":1,"templateName":"cover-typographic",  "slot":"cover",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":2,"templateName":"planning-edit",      "slot":"profile",          "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":3,"templateName":"product-showcase-ad","slot":"showcase",         "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":4,"templateName":"back-cover",         "slot":"back-cover",       "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}}
    ]'::jsonb
  ),

  -- ── 4. Destination Wedding — 6 pages ─────────────────────────────────────
  -- Travel-led issue: regional opener, honeymoon diary, venue skyline,
  -- styled shoot, story chapter, back cover.
  (
    'Destination Wedding — 6 Pages',
    'Regional Opener · Honeymoon Diary · Venue Skyline · Styled Shoot · Story · Back Cover',
    6,
    '[
      {"pageNumber":1,"templateName":"regional-opener",    "slot":"opener",           "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":2,"templateName":"honeymoon-diary",    "slot":"diary",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":3,"templateName":"venue-skyline",      "slot":"venue",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":4,"templateName":"styled-shoot",       "slot":"styled-shoot",     "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":5,"templateName":"story-chapter",      "slot":"story",            "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}},
      {"pageNumber":6,"templateName":"back-cover",         "slot":"back-cover",       "canvasJSON":{"version":"6.0.0-rc4","objects":[],"background":"#ffffff"}}
    ]'::jsonb
  )

) AS t(name, description, page_count, pages_data)
WHERE NOT EXISTS (
  SELECT 1 FROM magazine_issue_templates WHERE magazine_issue_templates.name = t.name
);
