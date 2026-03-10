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
  type: "pdf" | "image" | "text";
  mediaType: string;
  data?: string;          // base64 for PDFs and images
  extractedText?: string; // plain text for text files
}

interface ExtractRequest {
  venueName?: string;
  listingType?: string;
  pastedText?: string;
  videoLinks?: string[];
  files?: FileInput[];
  venue_id?: string;
}

// ── JSON Schema the AI must return ──────────────────────────────────────────
const JSON_SCHEMA = `{
  "venue_name": "",
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

Your role is to extract real facts from uploaded source materials (PDFs, brochures, images, web copy, text files) and then write polished luxury editorial content for the platform.

CRITICAL RULES:
1. NEVER hallucinate or invent facts. Only use information explicitly found in the source materials.
2. If a fact is not present in the source materials, leave that field as "" or null or [].
3. For writing fields (summary, description, rooms_description, etc.), write in an elegant, aspirational tone.
4. HTML fields (description, rooms_description, dining_description, exclusive_use_description) use only <p> tags — no other HTML.
5. Keep lengths within limits: summary ≤240 chars, seo_title ≤60 chars, seo_description 150–160 chars.
6. Return ONLY valid JSON. No markdown fences, no prose outside the JSON object.
7. For spaces[], only include spaces explicitly mentioned in the source materials.
8. For faq_categories[], only create categories if FAQ-style content exists in the source.
9. For nearby_items[], icon must be one of: "nature", "dining", "wine", "spa", "tour", "cooking", "check", "truffle".
10. Spaces.type must be one of: "ballroom", "chapel", "garden", "terrace", "pool", "drawing_room", "library", "cellar", "barn", "marquee", "beach", "rooftop", "other".`;

// ── Build user prompt ────────────────────────────────────────────────────────
function buildUserPrompt(body: ExtractRequest): string {
  const { venueName, listingType, pastedText, videoLinks, files } = body;

  const sourcesList: string[] = [];
  if (files?.some(f => f.type === "pdf")) sourcesList.push("PDF brochures/documents (attached above)");
  if (files?.some(f => f.type === "image")) sourcesList.push("images (attached above)");
  if (files?.some(f => f.type === "text" && f.extractedText)) sourcesList.push("text documents");
  if (pastedText) sourcesList.push("pasted web copy/text");
  if (videoLinks?.length) sourcesList.push(`${videoLinks.length} video link(s)`);

  const textBlocks: string[] = [];

  // Add pasted text
  if (pastedText?.trim()) {
    textBlocks.push(`--- PASTED TEXT ---\n${pastedText.slice(0, 8000)}`);
  }

  // Add extracted text from text files
  for (const f of (files || [])) {
    if (f.type === "text" && f.extractedText) {
      textBlocks.push(`--- DOCUMENT: ${f.name} ---\n${f.extractedText.slice(0, 6000)}`);
    }
  }

  // Add video links
  if (videoLinks?.length) {
    textBlocks.push(`--- VIDEO / MEDIA LINKS ---\n${videoLinks.join("\n")}`);
  }

  const contextBlock = textBlocks.length > 0
    ? `\n\nSOURCE MATERIALS (text):\n\n${textBlocks.join("\n\n")}`
    : "";

  const venueContext = [
    venueName ? `Name: ${venueName}` : "",
    listingType ? `Type: ${listingType}` : "",
  ].filter(Boolean).join("\n");

  return `STEP 1 — EXTRACT FACTS
Read all source materials (attached PDFs, images, and text below) carefully.
Note every factual detail: venue name, location, capacity, room count, suite count, space names and capacities, dining style, chef name, exclusive use pricing, nearby experiences, FAQ items, contact details, pricing, video links.

STEP 2 — WRITE EDITORIAL COPY
Using ONLY the facts you extracted (no invention), write polished luxury editorial copy for the Luxury Wedding Directory platform.
Tone: sophisticated, elegant, aspirational. Audience: high-net-worth couples.

${venueContext ? `KNOWN VENUE CONTEXT:\n${venueContext}\n` : ""}
Sources being analysed: ${sourcesList.join(", ") || "none specified"}
${contextBlock}

Return the populated version of this exact JSON structure (fill in every field you can from the source materials, leave empty string or null/false/[] for anything not found):

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
    const hasFiles    = (body.files?.length ?? 0) > 0;
    const hasPaste    = !!body.pastedText?.trim();
    const hasVideos   = (body.videoLinks?.length ?? 0) > 0;
    const hasVenueName = !!body.venueName?.trim();

    if (!hasFiles && !hasPaste && !hasVideos && !hasVenueName) {
      return new Response(
        JSON.stringify({ error: "Provide at least one source: files, pasted text, video links, or venue name" }),
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

    // Build prompt
    const userPrompt = buildUserPrompt(body);
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
