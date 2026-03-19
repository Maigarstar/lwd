// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Extract & Populate Listing
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Extract facts from source materials and write luxury editorial copy.
//
// LEARNING MODE: When a listing already exists (venue_id matches a listing),
// the function loads the current listing state and injects it as prior context.
// The AI then ENHANCES and FILLS GAPS rather than starting from scratch.
// Run repeatedly as new sources are added — the listing keeps improving.
//
// Two-step reasoning in a single Claude call:
//   Step 1 — EXTRACT: Pull real facts from source materials
//   Step 2 — WRITE:   Turn facts into luxury editorial copy
//
// Request body:
//   {
//     venueName?: string,
//     listingType?: string,
//     pastedText?: string,
//     websiteUrl?: string,
//     videoLinks?: string[],
//     socialLinks?: string[],
//     files?: Array<{
//       name: string,
//       type: 'pdf' | 'image' | 'text' | 'docx',
//       mediaType: string,
//       data?: string,          // base64 (PDFs and images)
//       extractedText?: string, // plain text (text files)
//     }>,
//     venue_id?: string,        // intake_job id — used to load existing listing
//     listing_id?: string,      // direct listing id — used for re-extraction passes
//   }
//
// Response:
//   {
//     result: { ...listing fields... },
//     _meta: { sources_used, missing_fields, mode: 'create' | 'enhance' }
//   }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

interface FileInput {
  name: string;
  type: "pdf" | "image" | "text" | "docx";
  mediaType: string;
  data?: string;
  extractedText?: string;
}

interface ExtractRequest {
  venueName?: string;
  listingType?: string;
  pastedText?: string;
  websiteUrl?: string;
  videoLinks?: string[];
  socialLinks?: string[];
  files?: FileInput[];
  venue_id?: string;
  listing_id?: string;
}

// ── JSON Schema the AI must return ──────────────────────────────────────────
const JSON_SCHEMA = `{
  "venue_name": "",
  "address": "",
  "address_line2": "",
  "postcode": "",
  "city": "",
  "region": "",
  "country": "",
  "summary": "",
  "description": "",
  "amenities": "",
  "capacity": "",
  "price_range": "",
  "exclusive_use_enabled": false,
  "exclusive_use_title": "",
  "exclusive_use_price": "",
  "exclusive_use_subline": "",
  "exclusive_use_description": "",
  "exclusive_use_includes": [],
  "spaces": [
    {
      "name": "",
      "type": "",
      "description": "",
      "capacityCeremony": null,
      "capacityReception": null,
      "capacityDining": null,
      "capacityStanding": null,
      "indoor": null,
      "covered": null
    }
  ],
  "rooms_total": "",
  "rooms_suites": "",
  "rooms_max_guests": "",
  "rooms_accommodation_type": "",
  "rooms_min_stay": "",
  "rooms_exclusive_use": false,
  "rooms_description": "",
  "dining_style": "",
  "dining_chef_name": "",
  "dining_in_house": false,
  "dining_external": false,
  "dining_menu_styles": [],
  "dining_dietary": [],
  "dining_drinks": [],
  "dining_description": "",
  "faq_enabled": false,
  "faq_categories": [
    {
      "category": "",
      "questions": [
        { "q": "", "a": "" }
      ]
    }
  ],
  "seo_title": "",
  "seo_description": "",
  "seo_keywords": [],
  "contact_profile": {
    "name": "",
    "title": "",
    "bio": "",
    "email": "",
    "phone": "",
    "whatsapp": "",
    "website": "",
    "instagram": ""
  },
  "nearby_enabled": false,
  "nearby_items": [
    { "title": "", "icon": "nature", "status": "" }
  ],
  "video_urls": [],
  "_meta": {
    "sources_used": [],
    "extraction_confidence": "high",
    "missing_fields": [],
    "mode": "create"
  }
}`;

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert content strategist for Luxury Wedding Directory — a premium venue and vendor discovery platform for high-net-worth couples planning destination weddings.

Your role is to:
1. EXTRACT real facts from source materials (PDFs, brochures, website content, images, text) — transcribing them exactly as found
2. WRITE polished luxury editorial copy for specific fields — using ONLY facts you extracted, never inventing
3. ENHANCE existing listings — when prior listing data is provided, keep what is already good and fill gaps or improve with new information

CRITICAL RULES:
1. NEVER hallucinate or invent facts. If not found in source materials OR prior data, leave field as "" or null or [].
2. Factual fields (venue_name, address, postcode, phone, email, website, capacity, prices, room counts, chef name, dining_in_house, video_urls, etc.) — copy EXACTLY as found. Do not rephrase or embellish.
3. Editorial fields (summary, description, rooms_description, dining_description, seo_*, etc.) — write in elegant, aspirational tone.
4. HTML fields (description, rooms_description, dining_description) use ONLY <p> tags — no other HTML elements. exclusive_use_description is plain text only — no HTML tags.
5. Keep lengths within limits: summary ≤240 chars, seo_title ≤60 chars, seo_description 150–160 chars.
6. Return ONLY valid JSON. No markdown fences, no prose outside the JSON object.
7. For spaces[], only include spaces explicitly mentioned in the source materials or prior data.
8. For faq_categories[], only create categories if FAQ-style content exists in the source or prior data.
9. For nearby_items[], icon must be one of: "nature", "dining", "wine", "spa", "tour", "cooking", "check", "truffle".
10. spaces[].type must be one of: "ballroom", "chapel", "garden", "terrace", "pool", "drawing_room", "library", "cellar", "barn", "marquee", "beach", "rooftop", "other".
11. ENHANCE MODE: When prior listing data is provided, treat it as your baseline. Keep existing good values. Only overwrite a prior value if the new source material provides a better, more complete, or corrected version. Merge arrays (spaces[], faq_categories[], nearby_items[]) by combining unique entries.`;

// ── Load existing listing data to enable enhance/learning mode ───────────────
async function loadExistingListing(body: ExtractRequest): Promise<Record<string, unknown> | null> {
  // Try listing_id first (direct), then try finding listing via intake_job venue_id
  if (body.listing_id) {
    const { data } = await supabase
      .from("listings")
      .select(`
        name, address, address_line2, postcode, city, region, country,
        summary, description, amenities, capacity, price_range,
        exclusive_use_enabled, exclusive_use_title, exclusive_use_price,
        exclusive_use_subline, exclusive_use_description, exclusive_use_includes,
        spaces,
        rooms_total, rooms_suites, rooms_max_guests, rooms_accommodation_type,
        rooms_min_stay, rooms_exclusive_use, rooms_description,
        dining_style, dining_chef_name, dining_in_house, dining_external,
        dining_menu_styles, dining_dietary, dining_drinks, dining_description,
        faq_enabled, faq_categories,
        seo_title, seo_description, seo_keywords,
        contact_profile,
        nearby_enabled, nearby_items,
        videos
      `)
      .eq("id", body.listing_id)
      .maybeSingle();
    return data || null;
  }

  if (body.venue_id) {
    // venue_id is the intake_job id — find the listing created from this job
    // Listings created by intake have a slug starting with the slugified venue name
    // but there's no direct FK. Try matching via intake_jobs.listing_id if it exists.
    const { data: job } = await supabase
      .from("intake_jobs")
      .select("listing_id")
      .eq("id", body.venue_id)
      .maybeSingle();

    if (job?.listing_id) {
      const { data } = await supabase
        .from("listings")
        .select(`
          name, address, address_line2, postcode, city, region, country,
          summary, description, amenities, capacity, price_range,
          exclusive_use_enabled, exclusive_use_title, exclusive_use_price,
          exclusive_use_subline, exclusive_use_description, exclusive_use_includes,
          spaces,
          rooms_total, rooms_suites, rooms_max_guests, rooms_accommodation_type,
          rooms_min_stay, rooms_exclusive_use, rooms_description,
          dining_style, dining_chef_name, dining_in_house, dining_external,
          dining_menu_styles, dining_dietary, dining_drinks, dining_description,
          faq_enabled, faq_categories,
          seo_title, seo_description, seo_keywords,
          contact_profile,
          nearby_enabled, nearby_items,
          videos
        `)
        .eq("id", job.listing_id)
        .maybeSingle();
      return data || null;
    }
  }

  return null;
}

// ── Serialise existing listing into a readable context block for the AI ──────
function buildPriorDataBlock(existing: Record<string, unknown>): string {
  // Only include fields that have meaningful values
  const lines: string[] = [];

  const str = (v: unknown) => (v && typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => (v != null && v !== "" ? v : null);
  const arr = (v: unknown) => (Array.isArray(v) && v.length > 0 ? v : null);

  if (str(existing.name))        lines.push(`venue_name: ${existing.name}`);
  if (str(existing.address))     lines.push(`address: ${existing.address}`);
  if (str(existing.city))        lines.push(`city: ${existing.city}`);
  if (str(existing.region))      lines.push(`region: ${existing.region}`);
  if (str(existing.country))     lines.push(`country: ${existing.country}`);
  if (str(existing.postcode))    lines.push(`postcode: ${existing.postcode}`);
  if (str(existing.summary))     lines.push(`summary: ${existing.summary}`);
  if (str(existing.amenities))   lines.push(`amenities: ${existing.amenities}`);
  if (str(existing.capacity))    lines.push(`capacity: ${existing.capacity}`);
  if (str(existing.price_range)) lines.push(`price_range: ${existing.price_range}`);
  if (num(existing.rooms_total)) lines.push(`rooms_total: ${existing.rooms_total}`);
  if (num(existing.rooms_suites)) lines.push(`rooms_suites: ${existing.rooms_suites}`);
  if (num(existing.rooms_max_guests)) lines.push(`rooms_max_guests: ${existing.rooms_max_guests}`);
  if (str(existing.rooms_accommodation_type)) lines.push(`rooms_accommodation_type: ${existing.rooms_accommodation_type}`);
  if (str(existing.rooms_min_stay)) lines.push(`rooms_min_stay: ${existing.rooms_min_stay}`);
  if (existing.rooms_exclusive_use) lines.push(`rooms_exclusive_use: true`);
  if (str(existing.dining_style)) lines.push(`dining_style: ${existing.dining_style}`);
  if (str(existing.dining_chef_name)) lines.push(`dining_chef_name: ${existing.dining_chef_name}`);
  if (existing.dining_in_house)  lines.push(`dining_in_house: true`);
  if (existing.dining_external)  lines.push(`dining_external: true`);
  if (arr(existing.dining_menu_styles)) lines.push(`dining_menu_styles: ${JSON.stringify(existing.dining_menu_styles)}`);
  if (arr(existing.dining_dietary))     lines.push(`dining_dietary: ${JSON.stringify(existing.dining_dietary)}`);
  if (arr(existing.dining_drinks))      lines.push(`dining_drinks: ${JSON.stringify(existing.dining_drinks)}`);
  if (existing.exclusive_use_enabled)   lines.push(`exclusive_use_enabled: true`);
  if (str(existing.exclusive_use_title))       lines.push(`exclusive_use_title: ${existing.exclusive_use_title}`);
  if (str(existing.exclusive_use_price))       lines.push(`exclusive_use_price: ${existing.exclusive_use_price}`);
  if (str(existing.exclusive_use_subline))     lines.push(`exclusive_use_subline: ${existing.exclusive_use_subline}`);
  if (str(existing.exclusive_use_description)) lines.push(`exclusive_use_description: ${existing.exclusive_use_description}`);
  if (arr(existing.exclusive_use_includes))    lines.push(`exclusive_use_includes: ${JSON.stringify(existing.exclusive_use_includes)}`);
  if (arr(existing.spaces))      lines.push(`spaces (existing): ${JSON.stringify(existing.spaces)}`);
  if (arr(existing.faq_categories)) lines.push(`faq_categories (existing): ${JSON.stringify(existing.faq_categories)}`);
  if (arr(existing.nearby_items))   lines.push(`nearby_items (existing): ${JSON.stringify(existing.nearby_items)}`);
  if (arr(existing.seo_keywords))   lines.push(`seo_keywords: ${JSON.stringify(existing.seo_keywords)}`);

  // Contact profile
  const cp = existing.contact_profile as Record<string, unknown> | null;
  if (cp) {
    const cpLines: string[] = [];
    if (cp.name)      cpLines.push(`name: ${cp.name}`);
    if (cp.title)     cpLines.push(`title: ${cp.title}`);
    if (cp.email)     cpLines.push(`email: ${cp.email}`);
    if (cp.phone)     cpLines.push(`phone: ${cp.phone}`);
    if (cp.website)   cpLines.push(`website: ${cp.website}`);
    if (cp.instagram) cpLines.push(`instagram: ${cp.instagram}`);
    if (cpLines.length) lines.push(`contact_profile: { ${cpLines.join(", ")} }`);
  }

  if (lines.length === 0) return "";

  return `--- EXISTING LISTING DATA (prior knowledge — keep, merge, and enhance) ---
This listing has already been partially populated. RETAIN these values unless new source materials provide better information. FILL IN any gaps. MERGE arrays rather than replacing them.

${lines.join("\n")}

--- END OF EXISTING DATA ---`;
}

// ── Build user prompt ────────────────────────────────────────────────────────
function buildUserPrompt(
  body: ExtractRequest,
  fetchedWebContent?: string,
  existingListing?: Record<string, unknown> | null
): string {
  const { venueName, listingType, pastedText, websiteUrl, videoLinks, files } = body;
  const isEnhanceMode = !!existingListing;

  const sourcesList: string[] = [];
  if (isEnhanceMode)                                                          sourcesList.push("existing listing data (prior knowledge)");
  if (files?.some(f => f.type === "pdf"))                                     sourcesList.push("PDF documents (attached)");
  if (files?.some(f => f.type === "image"))                                   sourcesList.push("images (attached)");
  if (files?.some(f => f.type === "text" && f.extractedText && !f.name?.toLowerCase().endsWith(".docx"))) sourcesList.push("text documents");
  if (files?.some(f => f.name?.toLowerCase().endsWith(".docx") && f.extractedText)) sourcesList.push("Word documents");
  if (pastedText)                                                              sourcesList.push("pasted text");
  if (fetchedWebContent)                                                       sourcesList.push(`website: ${websiteUrl}`);
  else if (websiteUrl)                                                         sourcesList.push(`website URL: ${websiteUrl}`);
  if (videoLinks?.length)                                                      sourcesList.push(`${videoLinks.length} video link(s)`);
  if (body.socialLinks?.length)                                                sourcesList.push(`${body.socialLinks.length} social profile(s)`);

  const textBlocks: string[] = [];

  // Inject prior listing data first (highest priority baseline)
  if (isEnhanceMode && existingListing) {
    const priorBlock = buildPriorDataBlock(existingListing);
    if (priorBlock) textBlocks.push(priorBlock);
  }

  if (pastedText?.trim()) {
    textBlocks.push(`--- PASTED TEXT (priority source) ---\n${pastedText.slice(0, 8000)}`);
  }

  for (const f of (files || [])) {
    if (f.type === "text" && f.extractedText) {
      textBlocks.push(`--- DOCUMENT: ${f.name} ---\n${f.extractedText.slice(0, 6000)}`);
    }
  }

  if (fetchedWebContent) {
    textBlocks.push(`--- WEBSITE CONTENT: ${websiteUrl} ---\n${fetchedWebContent.slice(0, 10000)}`);
  } else if (websiteUrl) {
    textBlocks.push(`--- VENUE WEBSITE URL ---\n${websiteUrl}\n(Store this as contact_profile.website)`);
  }

  if (videoLinks?.length) {
    textBlocks.push(`--- VIDEO / MEDIA LINKS ---\n${videoLinks.join("\n")}`);
  }

  if (body.socialLinks?.length) {
    textBlocks.push(`--- SOCIAL PROFILE LINKS ---\n${body.socialLinks.join("\n")}\n(Store Instagram handle in contact_profile.instagram)`);
  }

  const contextBlock = textBlocks.length > 0
    ? `\n\nSOURCE MATERIALS:\n\n${textBlocks.join("\n\n")}`
    : "";

  const venueContext = [
    venueName   ? `Name: ${venueName}`   : "",
    listingType ? `Type: ${listingType}` : "",
  ].filter(Boolean).join("\n");

  const modeHeader = isEnhanceMode
    ? `ENHANCE MODE — You have prior listing data AND new source materials.
Your task: Produce a COMPLETE, IMPROVED version of the listing JSON by:
1. Starting from the existing data as your baseline
2. Extracting any NEW facts from the new source materials
3. IMPROVING editorial copy where new sources give richer detail
4. FILLING IN any fields that were previously empty
5. MERGING arrays (spaces, faq_categories, nearby_items) — add new unique entries, keep existing ones
6. NEVER deleting or downgrading data that was already there unless the new source clearly corrects it

`
    : `CREATE MODE — No prior listing data exists. Extract everything from scratch.

`;

  return `${modeHeader}PHASE 1 — EXTRACT FACTS (transcribe exactly from source materials, do not rephrase)

Extract these values precisely as found:

LOCATION & CONTACT:
- Full street address, address line 2, city, region/county, country, postcode
- Phone number, email address, website URL, WhatsApp number, Instagram handle
- Contact person: full name and job title

CAPACITY & PRICING:
- Total guest capacity, ceremony capacity, dining/seated capacity
- Total accommodation rooms, suites, max guests accommodated
- Price range or starting price; exclusive use price

VENUE SPECIFICS:
- Event spaces: name, type (ballroom/garden/chapel/etc), indoor/outdoor, individual capacity figures
- Dining: style, whether catering is in-house (yes/no), external caterers allowed (yes/no), chef name
- Dining menu styles (e.g. Plated Dinner, Family Style, Buffet, Sharing Plates, Set Menu) → dining_menu_styles[]
- Dietary options (e.g. Vegan, Vegetarian, Gluten-Free, Halal, Kosher) → dining_dietary[]
- Drinks options (e.g. Open Bar, Signature Cocktails, Wine Pairing, Corkage Available) → dining_drinks[]
- Accommodation type (e.g. Hotel Rooms, Suites, Villas, Cottages), minimum night stay → rooms_accommodation_type, rooms_min_stay
- Whether accommodation is available for exclusive use → rooms_exclusive_use
- Amenities and features listed in source
- FAQ questions and answers if explicitly present
- Nearby activities or experiences mentioned
- Video or media URLs found in source

PHASE 2 — WRITE EDITORIAL COPY (using ONLY facts from Phase 1 and prior data, no invention)

Write polished luxury editorial content in an elegant, aspirational tone for high-net-worth couples planning destination weddings.

Compose these editorial fields ONLY (all other fields should be exact values from Phase 1 or prior data):
- summary: 1–2 elegant sentences, max 240 chars, no quotation marks
- description: 3–4 paragraphs in <p> tags, evocative and aspirational
- rooms_description: elegant accommodation narrative in <p> tags (only if rooms data found)
- dining_description: aspirational dining narrative in <p> tags (only if dining found)
- exclusive_use_title, exclusive_use_subline (only if exclusive use pricing/info found)
- exclusive_use_description: 2–3 sentences of PLAIN TEXT only — no HTML tags. Describes the intimacy and appeal of hiring the entire estate privately.
- spaces[].description: one short evocative sentence per space (only if space is mentioned)
- faq_categories[].questions[].a — helpful, editorial-quality answers (only if Q&A content found)
- contact_profile.bio: one elegant sentence (only if contact person details found)
- amenities: comma-separated list of features found in source or prior data
- seo_title: max 60 chars, natural language, includes venue name and location
- seo_description: 150–160 chars, compelling with soft call to action
- seo_keywords: JSON array of 6–8 keyword phrases
- nearby_items[]: experiences found in source or prior data, with appropriate icon
- exclusive_use_includes[]: specific inclusions mentioned in source or prior data

Set _meta.mode to "${isEnhanceMode ? "enhance" : "create"}".

${venueContext ? `KNOWN VENUE CONTEXT:\n${venueContext}\n` : ""}Sources being analysed: ${sourcesList.join(", ") || "none specified"}
${contextBlock}

Return the populated version of this exact JSON structure. Fill every field you can from ALL sources. Leave empty string, null, false, or [] for anything genuinely not found — never invent:

${JSON_SCHEMA}`;
}

// ── Build Claude multimodal message content ──────────────────────────────────
function buildMessageContent(body: ExtractRequest, userPrompt: string): unknown[] {
  const content: unknown[] = [];

  for (const f of (body.files || [])) {
    if (f.type === "pdf" && f.data) {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: f.data },
      });
    }
  }

  for (const f of (body.files || [])) {
    if (f.type === "image" && f.data) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: f.mediaType, data: f.data },
      });
    }
  }

  content.push({ type: "text", text: userPrompt });
  return content;
}

// ── Strip JSON from code fences if model wraps it ───────────────────────────
function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1) return trimmed.slice(start, end + 1);
  return trimmed;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const startTime = Date.now();

  try {
    const body: ExtractRequest = await req.json();

    const hasFiles     = (body.files?.length ?? 0) > 0;
    const hasPaste     = !!body.pastedText?.trim();
    const hasVideos    = (body.videoLinks?.length ?? 0) > 0;
    const hasVenueName = !!body.venueName?.trim();
    const hasWebsite   = !!body.websiteUrl?.trim();

    if (!hasFiles && !hasPaste && !hasVideos && !hasVenueName && !hasWebsite) {
      return new Response(
        JSON.stringify({ error: "Provide at least one source: files, pasted text, website URL, video links, or venue name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── LEARNING MODE: load existing listing if one exists ──────────────────
    const existingListing = await loadExistingListing(body);
    const isEnhanceMode = !!existingListing;
    console.log(`[ai-extract-listing] mode=${isEnhanceMode ? "enhance" : "create"}, venue_id=${body.venue_id || "none"}, listing_id=${body.listing_id || "none"}`);

    // ── Provider selection ──────────────────────────────────────────────────
    const hasBinaryFiles = (body.files || []).some(f => f.type === "pdf" || f.type === "image");
    let settings: { id: string; provider: string; api_key: string; model: string; max_tokens: number } | null = null;

    if (hasBinaryFiles) {
      const { data: claudeSettings } = await supabase
        .from("ai_settings")
        .select("id, provider, api_key, model, max_tokens")
        .eq("provider", "claude")
        .order("active", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!claudeSettings) {
        return new Response(
          JSON.stringify({
            error: "PDF and image processing requires a Claude (Anthropic) API key. Add one in AI Settings — it doesn't need to be the active provider.",
            status: "no_claude_key"
          }),
          { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      settings = claudeSettings;
    } else {
      const { data: activeSettings, error: settingsError } = await supabase
        .from("ai_settings")
        .select("id, provider, api_key, model, max_tokens")
        .eq("active", true)
        .single();

      if (settingsError || !activeSettings) {
        return new Response(
          JSON.stringify({ error: "No active AI provider configured", status: "not_configured" }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      settings = activeSettings;
    }

    // ── Fetch website content via Jina Reader ───────────────────────────────
    let fetchedWebContent = "";
    let websiteFetchStatus = body.websiteUrl ? "failed" : "not_provided";
    if (body.websiteUrl) {
      try {
        const jinaApiKey = Deno.env.get("JINA_API_KEY");
        const jinaHeaders: Record<string, string> = {
          "Accept": "text/plain",
          "X-Return-Format": "markdown",
        };
        if (jinaApiKey) jinaHeaders["Authorization"] = `Bearer ${jinaApiKey}`;
        const webResp = await fetch(`https://r.jina.ai/${body.websiteUrl}`, {
          headers: jinaHeaders,
          signal: AbortSignal.timeout(20000),
        });
        if (webResp.ok) {
          const content = await webResp.text();
          fetchedWebContent = content.replace(/\s+/g, " ").trim().slice(0, 12000);
          websiteFetchStatus = fetchedWebContent ? "success" : "empty_response";
        } else {
          websiteFetchStatus = `blocked_${webResp.status}`;
          console.warn("Jina Reader failed with status:", webResp.status);
        }
      } catch (e) {
        websiteFetchStatus = "connection_failed";
        console.warn("Jina Reader failed:", (e as Error).message);
      }
    }

    // ── DOCX extraction ─────────────────────────────────────────────────────
    const docxFiles = (body.files || []).filter(f => f.type === "docx" && f.data);
    if (docxFiles.length > 0) {
      try {
        const { unzipSync } = await import("https://esm.sh/fflate@0.8.2");
        for (const f of docxFiles) {
          try {
            const buffer = Uint8Array.from(atob(f.data!), c => c.charCodeAt(0));
            const unzipped = unzipSync(buffer);
            const docXml = unzipped["word/document.xml"];
            if (docXml) {
              const xmlText = new TextDecoder("utf-8").decode(docXml);
              f.extractedText = xmlText
                .replace(/<\/w:p>/g, "\n")
                .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1")
                .replace(/<[^>]+>/g, "")
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
                .replace(/[ \t]+/g, " ")
                .replace(/\n{3,}/g, "\n\n")
                .trim()
                .slice(0, 10000);
              (f as Record<string, unknown>).type = "text";
            }
          } catch (docErr) {
            console.warn(`DOCX extraction failed for ${f.name}:`, (docErr as Error).message);
          }
        }
      } catch (fflateErr) {
        console.warn("fflate import failed:", (fflateErr as Error).message);
      }
    }

    // ── Website-only failure guard ──────────────────────────────────────────
    const hasSubstantiveContent =
      fetchedWebContent ||
      body.pastedText?.trim() ||
      (body.files || []).some(f => f.extractedText || (f.type !== "docx" && f.data)) ||
      (body.videoLinks?.length ?? 0) > 0 ||
      (body.socialLinks?.length ?? 0) > 0 ||
      isEnhanceMode; // enhance mode is always valid — we have prior data

    if (!hasSubstantiveContent && body.websiteUrl) {
      return new Response(
        JSON.stringify({
          error: `Website content could not be fetched (${websiteFetchStatus}). Please paste the venue content manually, add PDF or Word files, or try a different URL.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Build prompt ────────────────────────────────────────────────────────
    const userPrompt = buildUserPrompt(body, fetchedWebContent, existingListing);
    let rawText = "";
    let tokensUsed = 0;
    let estimatedCost = 0;

    if (settings.provider === "claude") {
      const messageContent = buildMessageContent(body, userPrompt);
      const hasPdfFiles = (body.files || []).some(f => f.type === "pdf");

      // Generous token budget: extraction + writing + enhance context all need room
      const maxTokens = Math.max(settings.max_tokens || 4096, 16000);

      const claudeHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": settings.api_key,
        "anthropic-version": "2023-06-01",
      };
      if (hasPdfFiles) claudeHeaders["anthropic-beta"] = "pdfs-2024-09-25";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: claudeHeaders,
        body: JSON.stringify({
          model: settings.model,
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: messageContent }],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Claude API error: ${err.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      rawText = data.content[0].text;
      tokensUsed = (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
      estimatedCost = (data.usage.input_tokens * 0.000003) + (data.usage.output_tokens * 0.000015);

    } else {
      const textOnlyPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

      if (settings.provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.api_key}`,
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user",   content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: Math.max(settings.max_tokens || 4096, 16000),
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(`OpenAI API error: ${err.error?.message || "Unknown error"}`);
        }
        const data = await response.json();
        rawText = data.choices[0].message.content;
        tokensUsed = data.usage.total_tokens;
        estimatedCost = (data.usage.prompt_tokens * 0.00003) + (data.usage.completion_tokens * 0.00006);

      } else if (settings.provider === "gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.api_key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: textOnlyPrompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: Math.max(settings.max_tokens || 4096, 16000) },
            }),
          }
        );
        if (!response.ok) {
          const err = await response.json();
          throw new Error(`Gemini API error: ${err.error?.message || "Unknown error"}`);
        }
        const data = await response.json();
        rawText = data.candidates[0]?.content?.parts[0]?.text || "";
        tokensUsed = Math.ceil(textOnlyPrompt.length / 4);
        estimatedCost = tokensUsed * 0.000000375;
      }
    }

    // ── Parse response ──────────────────────────────────────────────────────
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(extractJSON(rawText));
    } catch {
      console.error("JSON parse failed. Raw response (first 500 chars):", rawText?.slice(0, 500));
      throw new Error(`AI returned malformed JSON. The response may have been cut short — try with less source material, or regenerate. (Output tokens used: ${tokensUsed})`);
    }

    // Inject metadata
    if (result._meta && typeof result._meta === "object") {
      (result._meta as Record<string, unknown>).website_fetch_status = websiteFetchStatus;
      (result._meta as Record<string, unknown>).mode = isEnhanceMode ? "enhance" : "create";
    } else {
      result._meta = { website_fetch_status: websiteFetchStatus, mode: isEnhanceMode ? "enhance" : "create" };
    }

    const duration = Date.now() - startTime;

    // ── Log usage ───────────────────────────────────────────────────────────
    await supabase.from("ai_usage_log").insert({
      provider: settings.provider,
      model: settings.model,
      api_setting_id: settings.id,
      feature: "listing_import",
      venue_id: body.venue_id || null,
      total_tokens: tokensUsed,
      estimated_cost: estimatedCost,
      status: "success",
      request_duration_ms: duration,
    });

    await supabase
      .from("ai_settings")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", settings.id);

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("AI extract-listing error:", error);

    try {
      await supabase.from("ai_usage_log").insert({
        feature: "listing_import",
        status: "error",
        error_message: error.message,
        request_duration_ms: Date.now() - startTime,
      });
    } catch { /* ignore logging failures */ }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
