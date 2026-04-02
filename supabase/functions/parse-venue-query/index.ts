// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: parse-venue-query
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Translate a natural language venue search query into structured
//          filter dimensions that map directly onto the LocationPage filter state.
//
// Called by: AICommandBar (frontend) on input submit
//
// Request body:
//   {
//     query:            string,              // "romantic château Loire Valley 80 guests"
//     countrySlug:      string,              // "france" — for context
//     countryName:      string,              // "France"
//     availableRegions: {name,slug}[],       // regions for this country
//   }
//
// Response (success):
//   {
//     region:   string | null,   // region slug matching availableRegions
//     style:    string | null,   // exact STYLES value
//     capacity: string | null,   // exact CAPS value
//     price:    string | null,   // exact BUDGETS value
//     services: string | null,   // exact SERVICES value
//     summary:  string,          // "Romantic château in Loire Valley · 51–100 guests"
//     raw:      object,          // full Claude response for debugging
//   }
//
// Response (error):
//   { error: string, status: "not_configured" | "parse_failed" | "error" }
// ═══════════════════════════════════════════════════════════════════════════

import { serve }        from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")              || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

// ── Filter value constants — must stay in sync with frontend ─────────────────
const STYLES = [
  "Classic & Traditional", "Contemporary & Modern", "Rustic & Country",
  "Bohemian & Free-Spirit", "Glamorous & Grand", "Intimate & Elopement",
  "Destination", "Festival & Outdoor", "Alternative & Creative",
  "Luxury & Opulent", "Romantic & Whimsical", "Minimalist & Chic",
  "Black Tie & Formal",
];

const CAPS = ["Up to 50", "51–100", "101–200", "200+"];

const BUDGETS = [
  "£1,000–£5,000", "£5,000–£10,000", "£10,000–£25,000",
  "£25,000–£50,000", "£50,000–£100,000", "£100,000+",
];

const SERVICES = [
  "Exclusive Estate Hire", "Dedicated Concierge", "Michelin-Star Dining",
  "Private Ceremonies", "Luxury Transport",
];

// ── Build the Claude prompt ──────────────────────────────────────────────────
function buildPrompt(
  query: string,
  countryName: string,
  availableRegions: Array<{ name: string; slug: string }>,
): string {
  const regionList = availableRegions.map(r => `  - "${r.name}" (slug: "${r.slug}")`).join("\n");

  return `You are a luxury wedding venue search assistant for a premium wedding directory.

Your task: parse a natural language search query into structured filter values.

Country context: ${countryName}

Available regions for this country:
${regionList || "  (no specific regions available)"}

Available styles (pick the single best match or null):
${STYLES.map(s => `  - "${s}"`).join("\n")}

Available capacity options (pick one or null):
${CAPS.map(c => `  - "${c}"`).join("\n")}

Available price/budget options (pick one or null):
${BUDGETS.map(b => `  - "${b}"`).join("\n")}

Available services (pick the single most relevant or null):
${SERVICES.map(s => `  - "${s}"`).join("\n")}

User query: "${query}"

Rules:
1. Return ONLY valid JSON — no explanation, no markdown, no code fences
2. Use EXACT strings from the lists above, or null
3. For region: match by name similarity and return the slug value; return null if not clearly specified
4. For capacity: "120 guests" → "101–200", "80 guests" → "51–100", "30 guests" → "Up to 50", "300 guests" → "200+"
5. For price: "under £30k" → "£25,000–£50,000", "under £80k" → "£50,000–£100,000", "under £10k" → "£5,000–£10,000"
6. Be conservative — only set a filter when clearly indicated, not by assumption
7. summary: a short human-readable phrase (max 8 words) describing what was understood

Return this exact JSON shape:
{
  "region":   null,
  "style":    null,
  "capacity": null,
  "price":    null,
  "services": null,
  "summary":  ""
}`;
}

// ── Parse Claude's text response as JSON safely ──────────────────────────────
function parseJSON(text: string): Record<string, string | null> | null {
  // Strip any accidental markdown fences
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract just the JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, countrySlug, countryName, availableRegions = [] } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Query too short", status: "error" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Fetch active AI provider + key from ai_settings table ──────────────
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "No active AI provider configured", status: "not_configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const prompt = buildPrompt(query.trim(), countryName || countrySlug || "this country", availableRegions);

    // ── Call AI provider ────────────────────────────────────────────────────
    let rawText = "";

    if (settings.provider === "claude" || settings.provider === "anthropic") {
      // Use a fast/cheap model for query parsing regardless of the default model
      const parseModel = "claude-3-5-haiku-20241022";

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":     "application/json",
          "x-api-key":        settings.api_key,
          "anthropic-version":"2023-06-01",
        },
        body: JSON.stringify({
          model:      parseModel,
          max_tokens: 256,   // JSON response is tiny
          system:     "You are a structured data extraction assistant. Return only valid JSON.",
          messages:   [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(`Claude API error: ${err.error?.message || resp.status}`);
      }

      const data = await resp.json();
      rawText = data.content?.[0]?.text || "";

    } else if (settings.provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${settings.api_key}`,
        },
        body: JSON.stringify({
          model:      "gpt-4o-mini",
          max_tokens: 256,
          messages: [
            { role: "system", content: "You are a structured data extraction assistant. Return only valid JSON." },
            { role: "user",   content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const data = await resp.json();
      rawText = data.choices?.[0]?.message?.content || "";
    } else {
      throw new Error(`Unsupported AI provider: ${settings.provider}`);
    }

    // ── Parse and validate the response ────────────────────────────────────
    const parsed = parseJSON(rawText);

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Could not parse AI response", status: "parse_failed", raw: rawText }),
        { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate each field against allowed values — reject anything not in the lists
    const validatedRegion   = availableRegions.find(r => r.slug === parsed.region)?.slug || null;
    const validatedStyle    = STYLES.find(s   => s === parsed.style)    || null;
    const validatedCapacity = CAPS.find(c     => c === parsed.capacity) || null;
    const validatedPrice    = BUDGETS.find(b  => b === parsed.price)    || null;
    const validatedServices = SERVICES.find(s => s === parsed.services) || null;

    return new Response(
      JSON.stringify({
        region:   validatedRegion,
        style:    validatedStyle,
        capacity: validatedCapacity,
        price:    validatedPrice,
        services: validatedServices,
        summary:  typeof parsed.summary === "string" ? parsed.summary.slice(0, 80) : "",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (err) {
    console.error("[parse-venue-query]", err);
    return new Response(
      JSON.stringify({ error: String(err), status: "error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
