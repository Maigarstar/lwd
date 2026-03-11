// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: embed-media-ai-index
// ═══════════════════════════════════════════════════════════════════════════
// Purpose:
//   Generates OpenAI text-embedding-3-small vectors for media_ai_index rows
//   and stores them in the `embedding` column. Enables semantic vector search.
//
// Called by:
//   • sync-media-ai-index (fire-and-forget after each listing save)
//   • Manually for backfill: POST with {} or { media_ids: [...] }
//
// Request body:
//   {
//     media_ids?: string[]   — if provided, only embed these rows;
//                              if omitted, embeds ALL rows where embedding IS NULL
//     batch_size?: number    — rows per OpenAI API call (default 100, max 2048)
//   }
//
// Response:
//   { success: true, embedded: number, skipped: number }
//   { error: string }
//
// Cost: text-embedding-3-small = $0.02 / 1M tokens
//   ~75 tokens per ai_text_body → 1000 images ≈ $0.0015
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

// ─── Get OpenAI API key from ai_settings ──────────────────────────────────

async function getOpenAIKey(): Promise<string | null> {
  // 1. Try the active OpenAI provider first
  const { data: active } = await supabase
    .from("ai_settings")
    .select("api_key, provider")
    .eq("active", true)
    .single();

  if (active?.provider === "openai" && active.api_key) return active.api_key;

  // 2. Fall back to any configured OpenAI provider (even if not active)
  const { data: any } = await supabase
    .from("ai_settings")
    .select("api_key")
    .eq("provider", "openai")
    .limit(1)
    .single();

  if (any?.api_key) return any.api_key;

  // 3. Fall back to environment variable
  return Deno.env.get("OPENAI_API_KEY") || null;
}

// ─── OpenAI Embeddings API ────────────────────────────────────────────────

async function embedBatch(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      dimensions: EMBED_DIMS,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`OpenAI embeddings error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  // Sort by index to ensure order matches input
  return data.data
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => d.embedding);
}

// ─── Main handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mediaIds:  string[] | undefined = body.media_ids;
    const batchSize: number               = Math.min(body.batch_size ?? 100, 2048);

    // ── Get OpenAI key ───────────────────────────────────────────────────
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No OpenAI API key found in ai_settings or env" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch unembedded rows ────────────────────────────────────────────
    let query = supabase
      .from("media_ai_index")
      .select("id, ai_text_body")
      .is("embedding", null)
      .neq("ai_text_body", "")
      .order("indexed_at", { ascending: true })
      .limit(2000); // safety cap per invocation

    if (mediaIds && mediaIds.length > 0) {
      query = supabase
        .from("media_ai_index")
        .select("id, ai_text_body")
        .in("media_id", mediaIds)
        .is("embedding", null)
        .neq("ai_text_body", "");
    }

    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, embedded: 0, skipped: 0, message: "Nothing to embed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[embed] ${rows.length} rows to embed in batches of ${batchSize}`);

    let embedded = 0;
    let skipped  = 0;

    // ── Process in batches ───────────────────────────────────────────────
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const texts = batch.map((r: any) => r.ai_text_body);

      let vectors: number[][];
      try {
        vectors = await embedBatch(texts, apiKey);
      } catch (e: any) {
        console.error(`[embed] Batch ${i}–${i + batch.length} failed:`, e.message);
        skipped += batch.length;
        continue;
      }

      // Update each row individually (Supabase JS doesn't support bulk vector updates)
      const updates = batch.map((row: any, idx: number) =>
        supabase
          .from("media_ai_index")
          .update({ embedding: `[${vectors[idx].join(",")}]` })
          .eq("id", row.id)
      );

      const results = await Promise.allSettled(updates);
      results.forEach((r) => {
        if (r.status === "fulfilled" && !r.value.error) embedded++;
        else skipped++;
      });

      console.log(`[embed] Batch ${i / batchSize + 1}: ${batch.length} embedded`);
    }

    return new Response(
      JSON.stringify({ success: true, embedded, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[embed] Unhandled error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
