// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: search-media
// ═══════════════════════════════════════════════════════════════════════════
// Purpose:
//   Semantic (vector) search over media_ai_index using natural language.
//   Embeds the query with text-embedding-3-small, then finds the most
//   similar media items using cosine distance (pgvector).
//
// Called by:
//   • Frontend search UI (couples searching inspiration)
//   • AI recommendation engine (matching venues/vendors to couple brief)
//   • Editorial tools (finding images for a given theme)
//
// Request body:
//   {
//     query:          string   — natural language search ("romantic Tuscan ceremony")
//     filters?: {
//       country?:     string   — "Italy"
//       region?:      string   — "Tuscany"
//       destination?: string   — "Lake Como"
//       category?:    string   — "wedding-venues"
//       image_type?:  string   — "ceremony" | "reception" | "detail_shot" | …
//     }
//     match_count?:   number   — max results (default 20, max 50)
//     min_similarity?: number  — 0–1, lower = more results (default 0.3)
//   }
//
// Response:
//   {
//     results: SearchResult[],
//     query_embedding_ms: number,   — time to embed query
//     search_ms: number,            — time to run vector search
//     total: number
//   }
//
// SearchResult shape:
//   {
//     id, media_id, listing_id, listing_name,
//     country, region, destination, image_type,
//     title, caption, alt_text, url,
//     credit_name, credit_instagram, tags, is_featured,
//     similarity   ← 0–1, higher = more relevant
//   }
//
// Hybrid mode (bonus):
//   If no embedding results are found above min_similarity, falls back
//   to full-text search on ai_text_body using plainto_tsquery.
// ═══════════════════════════════════════════════════════════════════════════

import { serve }        from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")              || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMS  = 1536;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Get OpenAI API key ───────────────────────────────────────────────────

async function getOpenAIKey(): Promise<string | null> {
  const { data: active } = await supabase
    .from("ai_settings")
    .select("api_key, provider")
    .eq("active", true)
    .single();
  if (active?.provider === "openai" && active.api_key) return active.api_key;

  const { data: any } = await supabase
    .from("ai_settings")
    .select("api_key")
    .eq("provider", "openai")
    .limit(1)
    .single();
  if (any?.api_key) return any.api_key;

  return Deno.env.get("OPENAI_API_KEY") || null;
}

// ─── Embed a single query string ─────────────────────────────────────────

async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      EMBED_MODEL,
      input:      text,
      dimensions: EMBED_DIMS,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI embeddings error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

// ─── Full-text fallback ───────────────────────────────────────────────────

async function fullTextSearch(
  query: string,
  filters: Record<string, string | undefined>,
  matchCount: number
): Promise<any[]> {
  let q = supabase
    .from("media_ai_index")
    .select(
      "id, media_id, listing_id, listing_name, country, region, destination, " +
      "image_type, title, caption, alt_text, url, credit_name, credit_instagram, " +
      "tags, is_featured"
    )
    .eq("visibility", "public")
    .textSearch("ai_text_body", query, { type: "plain", config: "english" })
    .limit(matchCount);

  if (filters.country)    q = q.eq("country",    filters.country);
  if (filters.category)   q = q.eq("category",   filters.category);
  if (filters.image_type) q = q.eq("image_type", filters.image_type);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({ ...row, similarity: null, source: "fulltext" }));
}

// ─── Main handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const {
      query,
      filters = {},
      match_count   = 20,
      min_similarity = 0.3,
    } = body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return jsonResponse({ error: "query must be a non-empty string (min 2 chars)" }, 400);
    }

    const matchCount    = Math.min(Number(match_count)    || 20,  50);
    const minSimilarity = Math.max(Math.min(Number(min_similarity) || 0.3, 1), 0);

    console.log(`[search-media] query="${query}" filters=${JSON.stringify(filters)}`);

    // ── Get OpenAI key ───────────────────────────────────────────────────
    const apiKey = await getOpenAIKey();

    if (!apiKey) {
      // No embedding key — fall back to full-text search only
      console.warn("[search-media] No OpenAI key found — using full-text fallback");
      const results = await fullTextSearch(query, filters, matchCount);
      return jsonResponse({ results, total: results.length, mode: "fulltext_only" });
    }

    // ── Embed the query ──────────────────────────────────────────────────
    const embedStart = Date.now();
    let queryEmbedding: number[];

    try {
      queryEmbedding = await embedQuery(query.trim(), apiKey);
    } catch (e: any) {
      console.warn("[search-media] Embedding failed, falling back to full-text:", e.message);
      const results = await fullTextSearch(query, filters, matchCount);
      return jsonResponse({ results, total: results.length, mode: "fulltext_fallback", error: e.message });
    }

    const embedMs = Date.now() - embedStart;

    // ── Vector search via match_media_ai RPC ─────────────────────────────
    const searchStart = Date.now();

    const { data: results, error: rpcError } = await supabase.rpc("match_media_ai", {
      query_embedding:    `[${queryEmbedding.join(",")}]`,
      match_count:        matchCount,
      filter_country:     filters.country    ?? null,
      filter_category:    filters.category   ?? null,
      filter_image_type:  filters.image_type ?? null,
      min_similarity:     minSimilarity,
    });

    const searchMs = Date.now() - searchStart;

    if (rpcError) {
      console.error("[search-media] RPC error:", rpcError.message);
      // Fallback to full-text
      const ftResults = await fullTextSearch(query, filters, matchCount);
      return jsonResponse({
        results:  ftResults,
        total:    ftResults.length,
        mode:     "fulltext_fallback",
        rpc_error: rpcError.message,
      });
    }

    const vectorResults = results || [];

    // ── Hybrid fallback: if vector finds < 3 results, augment with FTS ───
    let finalResults = vectorResults;
    let mode         = "vector";

    if (vectorResults.length < 3) {
      console.log("[search-media] Sparse vector results — augmenting with full-text");
      try {
        const ftResults = await fullTextSearch(query, filters, matchCount);
        // Deduplicate: prefer vector results
        const seenIds   = new Set(vectorResults.map((r: any) => r.id));
        const newFt     = ftResults.filter((r) => !seenIds.has(r.id));
        finalResults    = [...vectorResults, ...newFt].slice(0, matchCount);
        mode            = "hybrid";
      } catch (_) { /* full-text fallback failed silently */ }
    }

    console.log(
      `[search-media] ✓ ${finalResults.length} results | embed=${embedMs}ms | search=${searchMs}ms`
    );

    return jsonResponse({
      results:             finalResults,
      total:               finalResults.length,
      mode,
      query_embedding_ms:  embedMs,
      search_ms:           searchMs,
    });

  } catch (err: any) {
    console.error("[search-media] Unhandled error:", err.message);
    return jsonResponse({ error: err.message }, 500);
  }
});
