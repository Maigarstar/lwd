// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: parse-venue-query
// ═══════════════════════════════════════════════════════════════════════════
// Converts a natural language venue/vendor search query into structured
// filter dimensions that the client-side filter bar understands.
//
// Uses the same ai_settings provider pattern as ai-generate.
//
// Request body:
//   {
//     query:            string,   // e.g. "romantic Tuscany villa for 80 guests"
//     countrySlug:      string,   // e.g. "italy"
//     countryName:      string,   // e.g. "Italy"
//     regionSlug?:      string,   // e.g. "tuscany"
//     regionName?:      string,   // e.g. "Tuscany"
//     categorySlug?:    string,   // e.g. "wedding-venues"
//     entityType?:      string,   // "venue" | "vendor"
//     availableRegions: [{name, slug}],
//   }
//
// Response:
//   {
//     region?:   string,   // region slug from availableRegions, or null
//     style?:    string,   // one of the STYLES enum values
//     capacity?: string,   // one of the CAPS enum values
//     price?:    string,   // one of the PRICES enum values
//     services?: string,   // free-text service descriptor
//     summary:   string,   // human-readable "Showing X for Y..." line
//   }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

// ── Valid filter values (mirrors src/data/italyVenues.js) ─────────────────
const STYLES   = ["Rustic Luxe","Black Tie","Romantic","Garden","Historic","Vineyard","Intimate","Coastal"];
const CAPS     = ["Up to 50","51–100","101–200","200+"];
const PRICES   = ["£££","££££"];

// ── Build the system + user prompt ───────────────────────────────────────
function buildPrompt(body: {
  query: string;
  countryName: string;
  regionName?: string;
  categorySlug?: string;
  entityType?: string;
  availableRegions: { name: string; slug: string }[];
}) {
  const { query, countryName, regionName, categorySlug, entityType, availableRegions } = body;

  const regionList = availableRegions.length
    ? availableRegions.map(r => `"${r.name}" (slug: ${r.slug})`).join(", ")
    : "none";

  const context = regionName
    ? `${regionName}, ${countryName}`
    : countryName;

  const entityDesc = entityType === "vendor" ? "wedding vendor" : "wedding venue";

  const systemPrompt = `You are a luxury wedding search assistant for Luxury Wedding Directory (LWD).
Your job is to parse a natural language search query into structured filter dimensions.
Return ONLY a valid JSON object — no explanation, no markdown, no extra text.

Context:
- Searching for: ${entityDesc}s in ${context}
- Category: ${categorySlug || "wedding-venues"}
- Available sub-regions: ${regionList}

Valid filter values:
- style: ${STYLES.map(s => `"${s}"`).join(", ")} — or null if not mentioned
- capacity: ${CAPS.map(c => `"${c}"`).join(", ")} — or null if not mentioned
- price: ${PRICES.map(p => `"${p}"`).join(", ")} — use "£££" for budget-conscious, "££££" for ultra-luxury. Null if not mentioned.
- region: one of the available sub-region slugs above, or null if not mentioned
- services: a short descriptor for any specific services mentioned (e.g. "outdoor ceremony", "Michelin dining") — or null

Capacity mapping guide:
- "intimate", "small", "elopement", "just us", "micro" → "Up to 50"
- "50–100", "around 80", "70 guests", "100" → "51–100"
- "150 guests", "medium", "100–200" → "101–200"
- "large", "200+", "250 guests", "big wedding" → "200+"

Style mapping guide:
- "rustic", "barn", "countryside farmhouse" → "Rustic Luxe"
- "formal", "black tie", "gala", "grand ball" → "Black Tie"
- "romantic", "intimate", "candlelit", "fairy tale" → "Romantic"
- "garden", "floral", "outdoor", "boho" → "Garden"
- "historic", "castle", "palazzo", "manor", "stately" → "Historic"
- "vineyard", "winery", "wine estate" → "Vineyard"
- "small", "cosy", "private" → "Intimate"
- "coastal", "beach", "seafront", "cliffside" → "Coastal"

Return this exact JSON shape:
{
  "region":   "<slug or null>",
  "style":    "<style or null>",
  "capacity": "<capacity or null>",
  "price":    "<price or null>",
  "services": "<services or null>",
  "summary":  "<one concise sentence describing what was found, e.g. 'Romantic venues in Tuscany for up to 100 guests'>"
}`;

  const userPrompt = `Parse this search query: "${query}"`;

  return { systemPrompt, userPrompt };
}

// ── AI callers (same pattern as ai-generate) ──────────────────────────────
async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string, model: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: 0.1,
      max_tokens:  300,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "OpenAI error"); }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, model: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.1,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Claude error"); }
  const data = await res.json();
  return data.content[0].text;
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      }),
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Gemini error"); }
  const data = await res.json();
  return data.candidates[0]?.content?.parts[0]?.text || "";
}

// ── Parse JSON safely ─────────────────────────────────────────────────────
function parseJSON(raw: string) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Fuzzy match helpers ───────────────────────────────────────────────────
function normalise(s: string) {
  return s.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}
function fuzzyFind<T extends string>(value: string | null | undefined, list: T[]): T | null {
  if (!value) return null;
  const n = normalise(value);
  return list.find(item => normalise(item) === n) ?? null;
}

// ── Validate + sanitise parsed result ────────────────────────────────────
function sanitise(parsed: Record<string, string | null>, availableRegions: { slug: string }[]) {
  const validRegionSlugs = availableRegions.map(r => r.slug);
  return {
    region:   validRegionSlugs.includes(parsed.region ?? "")  ? parsed.region  : null,
    style:    fuzzyFind(parsed.style,    STYLES),
    capacity: fuzzyFind(parsed.capacity, CAPS),
    price:    fuzzyFind(parsed.price,    PRICES),
    services: parsed.services && typeof parsed.services === "string" ? parsed.services.slice(0, 80) : null,
    summary:  parsed.summary  || "",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();

    if (!body.query || body.query.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Query too short" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get active AI provider
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ status: "not_configured", error: "No AI provider configured" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { systemPrompt, userPrompt } = buildPrompt({
      query:            body.query,
      countryName:      body.countryName  || "",
      regionName:       body.regionName   || null,
      categorySlug:     body.categorySlug || "wedding-venues",
      entityType:       body.entityType   || "venue",
      availableRegions: body.availableRegions || [],
    });

    let rawText: string;
    switch (settings.provider) {
      case "openai":  rawText = await callOpenAI(settings.api_key, systemPrompt, userPrompt, settings.model); break;
      case "claude":  rawText = await callClaude(settings.api_key, systemPrompt, userPrompt, settings.model); break;
      case "gemini":  rawText = await callGemini(settings.api_key, systemPrompt, userPrompt); break;
      default:        throw new Error(`Unknown provider: ${settings.provider}`);
    }

    let parsed: Record<string, string | null>;
    try {
      parsed = parseJSON(rawText);
    } catch {
      return new Response(JSON.stringify({ status: "parse_failed", error: "AI returned malformed JSON" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = sanitise(parsed, body.availableRegions || []);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    console.error("parse-venue-query error:", err);
    return new Response(JSON.stringify({ status: "error", error: err.message || "Internal error" }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
