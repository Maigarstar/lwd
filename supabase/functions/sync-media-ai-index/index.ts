// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: sync-media-ai-index
// ═══════════════════════════════════════════════════════════════════════════
// Purpose:
//   Syncs a listing's media metadata into the media_ai_index table after
//   every listing save. Creates a structured, searchable knowledge record
//   for each public image, video, and virtual tour.
//
// Called by: src/services/listings.ts (fire-and-forget after save)
//
// Request body:
//   {
//     listing_id:   string (uuid)                    — required
//     listing_meta: {                                 — required
//       id:          string,
//       name:        string,   // venue / vendor name
//       category:    string,   // 'wedding-venues', 'photographers', etc.
//       country:     string,   // 'Italy'
//       region:      string,   // 'Tuscany'
//       destination: string,   // 'Lake Como'
//       type:        string,   // 'venue' | 'vendor' | etc.
//     },
//     media_items:  MediaItem[]  — the full media_items[] array from Listing Studio
//   }
//
// Response:
//   { success: true, count: number }   — number of rows upserted
//   { error: string }                  — on failure
//
// Sync strategy:
//   1. DELETE all existing rows for this listing_id
//   2. Build AI records for all public, URL-backed items
//   3. INSERT new batch
//
// This approach guarantees clean state on every save (handles deletions,
// visibility changes, and field updates without complex diffing).
//
// Phase 3 extension (not yet implemented):
//   After insert, call OpenAI text-embedding-3-small on ai_text_body,
//   store the 1536-dim vector in the `embedding` column, and enable
//   ivfflat cosine similarity search.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")             || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Service role client — can bypass RLS to write to media_ai_index
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

// ─── Type definitions ─────────────────────────────────────────────────────

interface MediaItem {
  id:               string;
  type?:            string;       // 'image' | 'video' | 'virtual_tour'
  url?:             string;
  title?:           string;
  caption?:         string;
  description?:     string;
  alt_text?:        string;
  image_type?:      string;
  tags?:            string[];
  location?:        string;
  credit_name?:     string;
  credit_instagram?: string;
  credit_website?:  string;
  credit_camera?:   string;
  copyright?:       string;
  is_featured?:     boolean;
  visibility?:      string;       // 'public' | 'private'
  show_credit?:     boolean;
  sort_order?:      number;
}

interface ListingMeta {
  id?:          string;
  name?:        string;
  category?:    string;
  country?:     string;
  region?:      string;
  destination?: string;
  type?:        string;
}

interface SyncRequest {
  listing_id:   string;
  listing_meta: ListingMeta;
  media_items:  MediaItem[];
}

// ─── AI text body builder ─────────────────────────────────────────────────

/**
 * Concatenate all text signals for a single media item into one corpus string.
 * This is the input used for full-text search (tsvector) and future embedding.
 *
 * Example output:
 *   "Villa Cimbrone · Italy · Campania · Amalfi Coast · venue · Historic Villa ·
 *    Ceremony Arch · Lush floral ceremony arch · A stunning arch on the terrace ·
 *    ceremony · outdoor · romantic · @luigiphoto"
 */
function buildAiTextBody(item: MediaItem, meta: ListingMeta): string {
  const parts = [
    meta.name,
    meta.country,
    meta.region,
    meta.destination,
    meta.type,
    meta.category,
    item.title,
    item.caption,
    item.description,
    item.alt_text,
    item.image_type,
    item.location,
    item.credit_name,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ];
  return parts.filter(Boolean).join(" · ");
}

// ─── Record builder ───────────────────────────────────────────────────────

function buildRecord(item: MediaItem, listingId: string, meta: ListingMeta): object {
  return {
    media_id:         item.id,
    listing_id:       listingId,

    // Entity context
    listing_name:     meta.name        || "",
    category:         meta.category    || "",
    listing_type:     meta.type        || "",

    // Geography
    country:          meta.country     || "",
    region:           meta.region      || "",
    destination:      meta.destination || "",
    location:         item.location    || "",

    // Editorial
    title:            item.title       || "",
    caption:          item.caption     || "",
    description:      item.description || "",
    alt_text:         item.alt_text    || "",

    // Classification
    media_type:       item.type        || "image",
    image_type:       item.image_type  || "",
    tags:             Array.isArray(item.tags) ? item.tags : [],

    // Photographer / supplier
    credit_name:      item.credit_name      || "",
    credit_instagram: item.credit_instagram || "",
    credit_website:   item.credit_website   || "",
    credit_camera:    item.credit_camera    || "",
    copyright:        item.copyright        || "",

    // Display
    is_featured:      item.is_featured  ?? false,
    visibility:       item.visibility   || "public",
    show_credit:      item.show_credit  ?? false,

    // Source URL
    url:              item.url || "",

    // AI corpus
    ai_text_body:     buildAiTextBody(item, meta),

    indexed_at:       new Date().toISOString(),
  };
}

// ─── JSON response helper ─────────────────────────────────────────────────

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: SyncRequest = await req.json();
    const { listing_id, listing_meta, media_items } = body;

    // ── Validate ────────────────────────────────────────────────────────
    if (!listing_id) {
      return jsonResponse({ error: "listing_id is required" }, 400);
    }

    const items: MediaItem[]  = Array.isArray(media_items) ? media_items : [];
    const meta:  ListingMeta  = listing_meta || {};

    // ── Filter: public items with a URL only ────────────────────────────
    // Excludes: private items, File-only items (no URL yet), hero-only blobs
    const indexableItems = items.filter(
      (item) =>
        item.visibility !== "private" &&
        item.url &&
        item.url.startsWith("http")
    );

    console.log(
      `[sync-media-ai-index] listing=${listing_id} | total=${items.length} | indexable=${indexableItems.length}`
    );

    // ── Step 1: Delete existing rows for this listing ───────────────────
    const { error: deleteError } = await supabase
      .from("media_ai_index")
      .delete()
      .eq("listing_id", listing_id);

    if (deleteError) {
      console.error("[sync-media-ai-index] DELETE error:", deleteError);
      return jsonResponse({ error: deleteError.message }, 500);
    }

    // ── Step 2: Nothing to index? Return early ──────────────────────────
    if (indexableItems.length === 0) {
      console.log("[sync-media-ai-index] No indexable items — done.");
      return jsonResponse({ success: true, count: 0 });
    }

    // ── Step 3: Build and insert new records ────────────────────────────
    const records = indexableItems.map((item) =>
      buildRecord(item, listing_id, meta)
    );

    const { error: insertError } = await supabase
      .from("media_ai_index")
      .insert(records);

    if (insertError) {
      console.error("[sync-media-ai-index] INSERT error:", insertError);
      return jsonResponse({ error: insertError.message }, 500);
    }

    console.log(
      `[sync-media-ai-index] ✓ Synced ${records.length} records for listing=${listing_id}`
    );

    return jsonResponse({ success: true, count: records.length });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-media-ai-index] Unhandled error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
