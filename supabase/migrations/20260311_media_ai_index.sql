-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: media_ai_index table
-- Created:   2026-03-11
-- Purpose:   AI knowledge index for every media item across all listings.
--
-- This table is the backbone of the platform's media intelligence layer:
--   • Full-text search via tsvector on ai_text_body
--   • Faceted filtering via indexed columns (country, region, image_type, tags)
--   • Future vector similarity search via pgvector embedding column
--
-- Populated by: sync-media-ai-index Edge Function (called on every listing save)
-- Consumed by:  AI search, editorial recommendations, photographer attribution
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── pgvector extension ────────────────────────────────────────────────────
-- Enables the `vector` type for future semantic search.
-- Safe to run even if already installed (idempotent).
-- Note: Requires Supabase Pro plan or manual enabling in Supabase dashboard.
-- Comment out if not yet available on your project.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Core table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_ai_index (

  -- ── Identity ──────────────────────────────────────────────────────────
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    text NOT NULL,                                 -- item.id (from media_items[])
  listing_id  uuid REFERENCES listings(id) ON DELETE CASCADE, -- parent listing

  -- ── Entity context ────────────────────────────────────────────────────
  listing_name  text NOT NULL DEFAULT '',
  category      text NOT NULL DEFAULT '',   -- venue | planner | photographer…
  listing_type  text NOT NULL DEFAULT '',   -- Historic Villa | Estate | Chapel…

  -- ── Geography — destination intelligence ─────────────────────────────
  country       text NOT NULL DEFAULT '',   -- "Italy"
  region        text NOT NULL DEFAULT '',   -- "Tuscany"
  destination   text NOT NULL DEFAULT '',   -- "Lake Como" / "Amalfi Coast"
  location      text NOT NULL DEFAULT '',   -- free-text from the image editor

  -- ── Editorial content ─────────────────────────────────────────────────
  title         text NOT NULL DEFAULT '',
  caption       text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  alt_text      text NOT NULL DEFAULT '',

  -- ── Classification ────────────────────────────────────────────────────
  media_type    text NOT NULL DEFAULT 'image',  -- image | video | virtual_tour
  image_type    text NOT NULL DEFAULT '',        -- ceremony | reception | detail_shot…
  tags          text[]       NOT NULL DEFAULT '{}',

  -- ── Photographer / supplier ───────────────────────────────────────────
  credit_name       text NOT NULL DEFAULT '',
  credit_instagram  text NOT NULL DEFAULT '',
  credit_website    text NOT NULL DEFAULT '',
  credit_camera     text NOT NULL DEFAULT '',
  copyright         text NOT NULL DEFAULT '',

  -- ── Display / access control ─────────────────────────────────────────
  is_featured   boolean NOT NULL DEFAULT false,
  visibility    text    NOT NULL DEFAULT 'public',  -- public | private
  show_credit   boolean NOT NULL DEFAULT false,

  -- ── Media URL (for future vision AI / image embedding) ───────────────
  url           text NOT NULL DEFAULT '',

  -- ── AI text corpus ────────────────────────────────────────────────────
  -- Single joined string: all text signals concatenated with ' · ' separator.
  -- This is the input for text-embedding-3-small or tsvector full-text search.
  -- Example: "Villa Cimbrone · Italy · Campania · Amalfi Coast · ceremony · outdoor"
  ai_text_body  text NOT NULL DEFAULT '',

  -- ── Future: semantic embedding ────────────────────────────────────────
  -- Uncomment once pgvector is enabled on your Supabase project and you have
  -- an embedding pipeline (see: sync-media-ai-index edge function Phase 3).
  -- 1536 dimensions = OpenAI text-embedding-3-small / ada-002
  -- embedding     vector(1536),

  -- ── Timestamps ───────────────────────────────────────────────────────
  indexed_at    timestamptz NOT NULL DEFAULT now()

);

-- ─── Indexes ──────────────────────────────────────────────────────────────

-- Primary lookup: all media for a listing
CREATE INDEX IF NOT EXISTS idx_media_ai_listing_id
  ON media_ai_index(listing_id);

-- Geography indexes — powers "best venues in Italy / Tuscany / Lake Como"
CREATE INDEX IF NOT EXISTS idx_media_ai_country
  ON media_ai_index(country);
CREATE INDEX IF NOT EXISTS idx_media_ai_region
  ON media_ai_index(region);
CREATE INDEX IF NOT EXISTS idx_media_ai_destination
  ON media_ai_index(destination);

-- Classification indexes — faceted filtering
CREATE INDEX IF NOT EXISTS idx_media_ai_category
  ON media_ai_index(category);
CREATE INDEX IF NOT EXISTS idx_media_ai_image_type
  ON media_ai_index(image_type);
CREATE INDEX IF NOT EXISTS idx_media_ai_media_type
  ON media_ai_index(media_type);

-- Access control — always filter private out of public queries
CREATE INDEX IF NOT EXISTS idx_media_ai_visibility
  ON media_ai_index(visibility);

-- Photographer index — "all images by @luigiphoto"
CREATE INDEX IF NOT EXISTS idx_media_ai_credit_name
  ON media_ai_index(credit_name);

-- ── Array tag search: WHERE tags @> '{ceremony, outdoor}' ─────────────────
-- GIN is required for array containment operators (@>, &&, <@)
CREATE INDEX IF NOT EXISTS idx_media_ai_tags
  ON media_ai_index USING GIN(tags);

-- ── Full-text search on the AI corpus ─────────────────────────────────────
-- Enables: to_tsquery('english', 'ceremony | outdoor | Tuscany')
-- Uses GIN so queries are fast even on large tables
CREATE INDEX IF NOT EXISTS idx_media_ai_fts
  ON media_ai_index USING GIN(to_tsvector('english', ai_text_body));

-- ── Unique constraint: one row per (media_id, listing_id) ─────────────────
-- Prevents duplicate rows when sync runs multiple times.
-- Also used as the conflict target for upserts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_ai_unique
  ON media_ai_index(media_id, listing_id);

-- ── Future: vector search index ───────────────────────────────────────────
-- Uncomment after embedding column is added and populated.
-- ivfflat is the recommended index type for Supabase pgvector.
-- CREATE INDEX IF NOT EXISTS idx_media_ai_embedding
--   ON media_ai_index USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Row-level security ───────────────────────────────────────────────────
-- Public can read public media; only service role can write.
ALTER TABLE media_ai_index ENABLE ROW LEVEL SECURITY;

-- Anon / authenticated users can SELECT public rows
CREATE POLICY IF NOT EXISTS "media_ai_index_public_read"
  ON media_ai_index
  FOR SELECT
  USING (visibility = 'public');

-- Service role (edge functions) can do everything
-- Note: service role bypasses RLS by default — no policy needed for writes.
-- This comment documents the intent.
