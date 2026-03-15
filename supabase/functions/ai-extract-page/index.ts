// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Extract & Populate Page
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Extract content from uploaded source materials (PDF, images, text,
//          website URL) and write polished editorial copy for Page Studio fields.
//
// Two-step reasoning in a single Claude call:
//   Step 1 — EXTRACT: Pull real facts/content from source materials
//   Step 2 — WRITE:   Turn content into editorial copy for page sections
//
// Shares the same source-material handling as ai-extract-listing
// (Jina Reader, DOCX/fflate, PDF/image multimodal, website guard).
// Output schema is page-specific: title, hero, intro, body, CTA, FAQ, SEO.
//
// Request body:
//   {
//     pageName?: string,       // page title hint
//     pageType?: string,       // 'destination', 'venue_profile', 'blog', 'custom', etc.
//     pageId?: string,         // for usage logging
//     pastedText?: string,
//     websiteUrl?: string,
//     videoLinks?: string[],
//     files?: FileInput[]
//   }
//
// Response: { result: PageExtractResult }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL             = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

interface FileInput {
  name: string;
  type: "pdf" | "image" | "text" | "docx";
  mediaType: string;
  data?: string;
  extractedText?: string;
}

interface ExtractPageRequest {
  pageName?: string;
  pageType?: string;
  pageId?: string;
  pastedText?: string;
  websiteUrl?: string;
  videoLinks?: string[];
  socialLinks?: string[];
  files?: FileInput[];
}

// ── JSON Schema the AI must return ──────────────────────────────────────────
const JSON_SCHEMA = `{
  "title": "",
  "excerpt": "",

  "hero_heading": "",
  "hero_subheading": "",
  "hero_cta_text": "",
  "hero_cta_url": "",

  "intro_heading": "",
  "intro_body": "",

  "body_sections": [
    { "heading": "", "body": "" }
  ],

  "cta_heading": "",
  "cta_subheading": "",
  "cta_text": "",
  "cta_url": "",

  "faq_items": [
    { "question": "", "answer": "" }
  ],

  "seo_title": "",
  "seo_description": "",
  "seo_keywords": [],

  "_meta": {
    "sources_used": [],
    "extraction_confidence": "high",
    "missing_fields": []
  }
}`;

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert content writer for Luxury Wedding Directory — a premium venue and vendor discovery platform.

Your role is to:
1. EXTRACT real content from source materials (PDFs, website, images, text)
2. WRITE polished editorial copy for web page sections — using ONLY facts you extracted, never inventing

CRITICAL RULES:
1. NEVER hallucinate or invent facts. If not found in source materials, leave field as "" or [].
2. Write in an elegant, aspirational tone for high-net-worth couples planning destination weddings.
3. title ≤ 70 chars. excerpt ≤ 200 chars. hero_heading ≤ 80 chars. hero_subheading ≤ 160 chars.
4. seo_title ≤ 60 chars. seo_description 150–160 chars.
5. intro_body and body_sections[].body use only <p> tags — no other HTML.
6. Return ONLY valid JSON. No markdown fences, no prose outside the JSON object.
7. cta_url should be a relative path (e.g. /venues/tuscany) if not explicitly found in source.
8. body_sections[] — include only if source has enough content to fill 2+ distinct sections.
9. faq_items[] — only include if FAQ-style Q&A content exists in the source.`;

// ── Build user prompt ────────────────────────────────────────────────────────
function buildUserPrompt(body: ExtractPageRequest, fetchedWebContent?: string): string {
  const { pageName, pageType, pastedText, websiteUrl, videoLinks, files } = body;

  const sourcesList: string[] = [];
  if (files?.some(f => f.type === "pdf"))  sourcesList.push("PDF documents (attached)");
  if (files?.some(f => f.type === "image")) sourcesList.push("images (attached)");
  if (files?.some(f => f.type === "text" && f.extractedText && !f.name?.toLowerCase().endsWith(".docx"))) sourcesList.push("text documents");
  if (files?.some(f => f.name?.toLowerCase().endsWith(".docx") && f.extractedText)) sourcesList.push("Word documents");
  if (pastedText)        sourcesList.push("pasted text");
  if (fetchedWebContent) sourcesList.push(`website: ${websiteUrl}`);
  else if (websiteUrl)   sourcesList.push(`website URL: ${websiteUrl}`);
  if (videoLinks?.length) sourcesList.push(`${videoLinks.length} video link(s)`);

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
    textBlocks.push(`--- VENUE WEBSITE URL ---\n${websiteUrl}\n(Use this as hero_cta_url if no better URL found)`);
  }

  if (videoLinks?.length) {
    textBlocks.push(`--- VIDEO / MEDIA LINKS ---\n${videoLinks.join("\n")}`);
  }

  const contextBlock = textBlocks.length > 0
    ? `\n\nSOURCE MATERIALS (text content):\n\n${textBlocks.join("\n\n")}`
    : "";

  const pageContext = [
    pageName  ? `Page name: ${pageName}`   : "",
    pageType  ? `Page type: ${pageType}`   : "",
  ].filter(Boolean).join("\n");

  return `PHASE 1 — EXTRACT CONTENT (transcribe exactly from source materials, do not rephrase)

Extract these values precisely as found:

PAGE BASICS:
- Page title and one-sentence description/excerpt

HERO SECTION:
- Main headline (hero_heading) — big, punchy, ≤80 chars
- Supporting line (hero_subheading) — 1–2 sentences expanding on the headline
- Primary CTA button text and destination URL

INTRO SECTION:
- Section heading for the intro/overview content
- Full intro body text (2–3 paragraphs describing the subject)

BODY SECTIONS:
- Any additional content sections with headings and body text
- Include only if source has distinct sections of content (not just repetition)

CTA BAND:
- Final call-to-action heading, subheading, button text, and URL

FAQ:
- Any question-and-answer style content found in the source

SEO:
- Meta title (≤60 chars, natural language, includes page topic and location)
- Meta description (150–160 chars, compelling with soft call to action)
- 4–6 keyword phrases as a JSON array

PHASE 2 — WRITE EDITORIAL COPY (using ONLY facts from Phase 1, no invention)

Write all fields in elegant, aspirational tone for high-net-worth couples.
${pageContext ? `\nKNOWN PAGE CONTEXT:\n${pageContext}\n` : ""}
Sources being analysed: ${sourcesList.join(", ") || "none specified"}
${contextBlock}

Return the populated version of this exact JSON structure. Leave "" or [] for anything not found — never invent:

${JSON_SCHEMA}`;
}

// ── Build Claude multimodal message ──────────────────────────────────────────
function buildMessageContent(body: ExtractPageRequest, userPrompt: string): unknown[] {
  const content: unknown[] = [];

  for (const f of (body.files || [])) {
    if (f.type === "pdf" && f.data) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    }
  }
  for (const f of (body.files || [])) {
    if (f.type === "image" && f.data) {
      content.push({ type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
    }
  }

  content.push({ type: "text", text: userPrompt });
  return content;
}

// ── Strip JSON from code fences ──────────────────────────────────────────────
function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end   = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1) return trimmed.slice(start, end + 1);
  return trimmed;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const startTime = Date.now();

  try {
    const body: ExtractPageRequest = await req.json();

    const hasFiles   = (body.files?.length ?? 0) > 0;
    const hasPaste   = !!body.pastedText?.trim();
    const hasVideos  = (body.videoLinks?.length ?? 0) > 0;
    const hasName    = !!body.pageName?.trim();
    const hasWebsite = !!body.websiteUrl?.trim();

    if (!hasFiles && !hasPaste && !hasVideos && !hasName && !hasWebsite) {
      return new Response(
        JSON.stringify({ error: "Provide at least one source: files, pasted text, website URL, or page name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    const hasBinaryFiles = (body.files || []).some(f => f.type === "pdf" || f.type === "image");
    if (hasBinaryFiles && settings.provider !== "claude") {
      return new Response(
        JSON.stringify({ error: "PDF and image processing requires Claude as the active AI provider.", status: "provider_mismatch" }),
        { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Jina Reader ──────────────────────────────────────────────────────────
    let fetchedWebContent   = "";
    let websiteFetchStatus  = body.websiteUrl ? "failed" : "not_provided";
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
          fetchedWebContent  = content.replace(/\s+/g, " ").trim().slice(0, 12000);
          websiteFetchStatus = fetchedWebContent ? "success" : "empty_response";
        } else {
          websiteFetchStatus = `blocked_${webResp.status}`;
          console.warn("Jina Reader failed:", webResp.status);
        }
      } catch (e) {
        websiteFetchStatus = "connection_failed";
        console.warn("Jina Reader failed:", (e as Error).message);
      }
    }

    // ── DOCX extraction ──────────────────────────────────────────────────────
    const docxFiles = (body.files || []).filter(f => f.type === "docx" && f.data);
    if (docxFiles.length > 0) {
      try {
        const { unzipSync } = await import("https://esm.sh/fflate@0.8.2");
        for (const f of docxFiles) {
          try {
            const buffer  = Uint8Array.from(atob(f.data!), c => c.charCodeAt(0));
            const unzipped = unzipSync(buffer);
            const docXml  = unzipped["word/document.xml"];
            if (docXml) {
              const xmlText = new TextDecoder("utf-8").decode(docXml);
              f.extractedText = xmlText
                .replace(/<\/w:p>/g, "\n")
                .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1")
                .replace(/<[^>]+>/g, "")
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
                .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
                .trim().slice(0, 10000);
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

    // ── Website-only failure guard ───────────────────────────────────────────
    const hasSubstantiveContent =
      fetchedWebContent ||
      body.pastedText?.trim() ||
      (body.files || []).some(f => f.extractedText || (f.type !== "docx" && f.data)) ||
      (body.videoLinks?.length ?? 0) > 0;

    if (!hasSubstantiveContent && body.websiteUrl) {
      return new Response(
        JSON.stringify({
          error: `Website content could not be fetched (${websiteFetchStatus}). Please paste the page content manually or add files.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Call Claude ──────────────────────────────────────────────────────────
    const userPrompt = buildUserPrompt(body, fetchedWebContent);
    let rawText = "";
    let tokensUsed = 0;
    let estimatedCost = 0;

    if (settings.provider === "claude") {
      const messageContent = buildMessageContent(body, userPrompt);
      const hasPdfFiles    = (body.files || []).some(f => f.type === "pdf");
      const maxTokens      = Math.max(settings.max_tokens || 4096, 6000);

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
      rawText       = data.content[0].text;
      tokensUsed    = (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
      estimatedCost = (data.usage.input_tokens * 0.000003) + (data.usage.output_tokens * 0.000015);

    } else if (settings.provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.api_key}` },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
          temperature: 0.6,
          max_tokens: settings.max_tokens || 4096,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI API error: ${err.error?.message || "Unknown error"}`);
      }
      const data = await response.json();
      rawText       = data.choices[0].message.content;
      tokensUsed    = data.usage.total_tokens;
      estimatedCost = (data.usage.prompt_tokens * 0.00003) + (data.usage.completion_tokens * 0.00006);

    } else if (settings.provider === "gemini") {
      const textOnlyPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.api_key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: textOnlyPrompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: settings.max_tokens || 4096 } }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini API error: ${err.error?.message || "Unknown error"}`);
      }
      const data = await response.json();
      rawText       = data.candidates[0]?.content?.parts[0]?.text || "";
      tokensUsed    = Math.ceil(textOnlyPrompt.length / 4);
      estimatedCost = tokensUsed * 0.000000375;
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(extractJSON(rawText));
    } catch {
      console.error("JSON parse failed. Raw response (first 500 chars):", rawText?.slice(0, 500));
      throw new Error(`AI returned malformed JSON. Try with less source material or regenerate. (Tokens used: ${tokensUsed})`);
    }

    if (result._meta && typeof result._meta === "object") {
      (result._meta as Record<string, unknown>).website_fetch_status = websiteFetchStatus;
    } else {
      result._meta = { website_fetch_status: websiteFetchStatus };
    }

    const duration = Date.now() - startTime;

    await supabase.from("ai_usage_log").insert({
      provider: settings.provider,
      model: settings.model,
      api_setting_id: settings.id,
      feature: "page_import",
      venue_id: null,
      total_tokens: tokensUsed,
      estimated_cost: estimatedCost,
      status: "success",
      request_duration_ms: duration,
    });

    await supabase.from("ai_settings").update({ last_used_at: new Date().toISOString() }).eq("id", settings.id);

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("AI extract-page error:", error);
    try {
      await supabase.from("ai_usage_log").insert({
        feature: "page_import", status: "error",
        error_message: error.message,
        request_duration_ms: Date.now() - startTime,
      });
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
