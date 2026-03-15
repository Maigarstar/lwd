// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Extract & Populate Listing
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Extract facts from uploaded source materials (PDF, images, text)
//          and write polished luxury editorial copy for all listing fields.
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
//     videoLinks?: string[],
//     files?: Array<{
//       name: string,
//       type: 'pdf' | 'image' | 'text',
//       mediaType: string,
//       data?: string,          // base64 (PDFs and images)
//       extractedText?: string, // plain text (text files)
//     }>
//   }
//
// Response:
//   {
//     result: { ...listing fields... },
//     _meta: { sources_used, missing_fields }
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
  data?: string;          // base64 for PDFs and images
  extractedText?: string; // plain text for text files
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
  "rooms_description": "",
  "dining_style": "",
  "dining_chef_name": "",
  "dining_in_house": false,
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
    "missing_fields": []
  }
}`;

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert content strategist for Luxury Wedding Directory — a premium venue and vendor discovery platform for high-net-worth couples planning destination weddings.

Your role is to:
1. EXTRACT real facts from source materials (PDFs, brochures, website content, images, text) — transcribing them exactly as found
2. WRITE polished luxury editorial copy for specific fields — using ONLY facts you extracted, never inventing

CRITICAL RULES:
1. NEVER hallucinate or invent facts. If not found in source materials, leave field as "" or null or [].
2. Factual fields (venue_name, address, postcode, phone, email, website, capacity, prices, room counts, chef name, dining_in_house, video_urls, etc.) — copy EXACTLY as found. Do not rephrase or embellish.
3. Editorial fields (summary, description, rooms_description, dining_description, seo_*, etc.) — write in elegant, aspirational tone.
4. HTML fields (description, rooms_description, dining_description, exclusive_use_description) use ONLY <p> tags — no other HTML elements.
5. Keep lengths within limits: summary ≤240 chars, seo_title ≤60 chars, seo_description 150–160 chars.
6. Return ONLY valid JSON. No markdown fences, no prose outside the JSON object.
7. For spaces[], only include spaces explicitly mentioned in the source materials.
8. For faq_categories[], only create categories if FAQ-style content exists in the source.
9. For nearby_items[], icon must be one of: "nature", "dining", "wine", "spa", "tour", "cooking", "check", "truffle".
10. spaces[].type must be one of: "ballroom", "chapel", "garden", "terrace", "pool", "drawing_room", "library", "cellar", "barn", "marquee", "beach", "rooftop", "other".`;

// ── Build user prompt ────────────────────────────────────────────────────────
function buildUserPrompt(body: ExtractRequest, fetchedWebContent?: string): string {
  const { venueName, listingType, pastedText, websiteUrl, videoLinks, files } = body;

  const sourcesList: string[] = [];
  if (files?.some(f => f.type === "pdf"))                    sourcesList.push("PDF documents (attached)");
  if (files?.some(f => f.type === "image"))                  sourcesList.push("images (attached)");
  if (files?.some(f => f.type === "text" && f.extractedText && !f.name?.toLowerCase().endsWith(".docx"))) sourcesList.push("text documents");
  if (files?.some(f => f.name?.toLowerCase().endsWith(".docx") && f.extractedText)) sourcesList.push("Word documents");
  if (pastedText)                                             sourcesList.push("pasted text");
  if (fetchedWebContent)                                      sourcesList.push(`website: ${websiteUrl}`);
  else if (websiteUrl)                                        sourcesList.push(`website URL: ${websiteUrl}`);
  if (videoLinks?.length)                                     sourcesList.push(`${videoLinks.length} video link(s)`);
  if (body.socialLinks?.length)                               sourcesList.push(`${body.socialLinks.length} social profile(s)`);

  // Source priority: PDF/paste (highest) → website → images/video
  const textBlocks: string[] = [];

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
    // Can't fetch content, but store the URL
    textBlocks.push(`--- VENUE WEBSITE URL ---\n${websiteUrl}\n(Store this as contact_profile.website)`);
  }

  if (videoLinks?.length) {
    textBlocks.push(`--- VIDEO / MEDIA LINKS ---\n${videoLinks.join("\n")}`);
  }

  if (body.socialLinks?.length) {
    textBlocks.push(`--- SOCIAL PROFILE LINKS ---\n${body.socialLinks.join("\n")}\n(Store Instagram handle in contact_profile.instagram)`);
  }

  const contextBlock = textBlocks.length > 0
    ? `\n\nSOURCE MATERIALS (text content):\n\n${textBlocks.join("\n\n")}`
    : "";

  const venueContext = [
    venueName   ? `Name: ${venueName}`     : "",
    listingType ? `Type: ${listingType}`   : "",
  ].filter(Boolean).join("\n");

  return `PHASE 1 — EXTRACT FACTS (transcribe exactly from source materials, do not rephrase)

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
- Dining: style, whether catering is in-house (yes/no), chef name
- Amenities and features listed in source
- FAQ questions and answers if explicitly present
- Nearby activities or experiences mentioned
- Video or media URLs found in source

PHASE 2 — WRITE EDITORIAL COPY (using ONLY facts from Phase 1, no invention)

Write polished luxury editorial content in an elegant, aspirational tone for high-net-worth couples planning destination weddings.

Compose these editorial fields ONLY (all other fields should be the exact values from Phase 1):
- summary: 1–2 elegant sentences, max 240 chars, no quotation marks
- description: 3–4 paragraphs in <p> tags, evocative and aspirational
- rooms_description: elegant accommodation narrative (only if rooms found)
- dining_description: aspirational dining narrative (only if dining found)
- exclusive_use_title, exclusive_use_subline, exclusive_use_description (only if exclusive use pricing/info found)
- spaces[].description: one short evocative sentence per space (only if space is mentioned)
- faq_categories[].questions[].a — helpful, editorial-quality answers (only if Q&A content found in source)
- contact_profile.bio: one elegant sentence (only if contact person details found)
- amenities: comma-separated list of features found in source
- seo_title: max 60 chars, natural language, includes venue name and location
- seo_description: 150–160 chars, compelling with soft call to action
- seo_keywords: JSON array of 6–8 keyword phrases
- nearby_items[]: experiences found in source, with appropriate icon
- exclusive_use_includes[]: specific inclusions mentioned in source

${venueContext ? `KNOWN VENUE CONTEXT:\n${venueContext}\n` : ""}
Sources being analysed: ${sourcesList.join(", ") || "none specified"}
${contextBlock}

Return the populated version of this exact JSON structure. Fill every field you can from the source materials. Leave empty string, null, false, or [] for anything not found — never invent:

${JSON_SCHEMA}`;
}

// ── Build Claude multimodal message content ──────────────────────────────────
function buildMessageContent(body: ExtractRequest, userPrompt: string): unknown[] {
  const content: unknown[] = [];

  // Add PDF documents
  for (const f of (body.files || [])) {
    if (f.type === "pdf" && f.data) {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: f.data,
        },
      });
    }
  }

  // Add images
  for (const f of (body.files || [])) {
    if (f.type === "image" && f.data) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: f.mediaType,
          data: f.data,
        },
      });
    }
  }

  // Add text prompt last
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

    // Validate — at least some source material required
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

    // Get active AI settings (Claude required for multimodal)
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("id, provider, api_key, model, max_tokens")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "No active AI provider configured", status: "not_configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For multimodal (PDFs + images), Claude is required
    const hasBinaryFiles = (body.files || []).some(f => f.type === "pdf" || f.type === "image");
    if (hasBinaryFiles && settings.provider !== "claude") {
      return new Response(
        JSON.stringify({
          error: "PDF and image processing requires Claude as the active AI provider. Please update your AI settings.",
          status: "provider_mismatch"
        }),
        { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch website content via Jina Reader (handles JS-heavy/SPA sites, returns clean markdown)
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

    // Extract text from DOCX files server-side (before building prompt)
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

    // Website-only failure guard: abort early if website was the only source and fetch failed
    const hasSubstantiveContent =
      fetchedWebContent ||
      body.pastedText?.trim() ||
      (body.files || []).some(f => f.extractedText || (f.type !== "docx" && f.data)) ||
      (body.videoLinks?.length ?? 0) > 0 ||
      (body.socialLinks?.length ?? 0) > 0;

    if (!hasSubstantiveContent && body.websiteUrl) {
      return new Response(
        JSON.stringify({
          error: `Website content could not be fetched (${websiteFetchStatus}). Please paste the venue content manually, add PDF or Word files, or try a different URL.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build prompt
    const userPrompt = buildUserPrompt(body, fetchedWebContent);
    let rawText = "";
    let tokensUsed = 0;
    let estimatedCost = 0;

    if (settings.provider === "claude") {
      const messageContent = buildMessageContent(body, userPrompt);
      const hasPdfFiles = (body.files || []).some(f => f.type === "pdf");

      // Extraction + writing needs generous tokens regardless of the ai_settings value
      const maxTokens = Math.max(settings.max_tokens || 4096, 8000);

      const claudeHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": settings.api_key,
        "anthropic-version": "2023-06-01",
      };
      // Only add PDF beta header when actual PDF files are present
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
      // Claude Sonnet pricing estimate
      estimatedCost = (data.usage.input_tokens * 0.000003) + (data.usage.output_tokens * 0.000015);

    } else {
      // Text-only path for OpenAI / Gemini (no binary file support in Phase 1)
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
            max_tokens: settings.max_tokens || 4096,
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
              generationConfig: { temperature: 0.6, maxOutputTokens: settings.max_tokens || 4096 },
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

    // Parse JSON from response
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(extractJSON(rawText));
    } catch {
      // Log the raw response to help diagnose future issues
      console.error("JSON parse failed. Raw response (first 500 chars):", rawText?.slice(0, 500));
      throw new Error(`AI returned malformed JSON. The response may have been cut short — try with less source material, or regenerate. (Output tokens used: ${tokensUsed})`);
    }

    // Inject website fetch status into _meta so the panel can show a warning
    if (result._meta && typeof result._meta === "object") {
      (result._meta as Record<string, unknown>).website_fetch_status = websiteFetchStatus;
    } else {
      result._meta = { website_fetch_status: websiteFetchStatus };
    }

    const duration = Date.now() - startTime;

    // Log usage
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

    // Update last_used_at
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

    // Log error
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
