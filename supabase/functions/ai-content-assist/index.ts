// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Content Assist
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: AI-assisted content editing for the CMS editor (luxury tone)
// Security: Reads API key from ai_settings table (server-side only)
//
// Request body:
//   {
//     action: 'improve'|'clarity'|'expand'|'shorten'|'formal'|'friendly'|'grammar'|'generate',
//     content: string,        // full HTML content
//     selection: string,      // selected text (if any — use this over full content)
//     customPrompt: string,   // for 'generate' action only
//     page_key: string,       // for usage logging
//   }
//
// Response:
//   { result: string }   // HTML string, never auto-applied by client
//
// Error:
//   { error: string, status: string }
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

// ── Luxury brand system prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior content director for Luxury Wedding Directory — a world-class, award-winning wedding platform serving high-net-worth couples and elite vendors globally. The platform is operated by 5 Star Weddings Ltd, a premium UK wedding media company.

Brand tone: refined, warm, authoritative and confident. Never corporate, never generic. Language should feel like it belongs in Condé Nast Traveller or a five-star hotel communication.

When editing legal or policy content: maintain precision and legal clarity while preserving an elevated, reassuring tone. Never sound bureaucratic.

When editing support content: be warm, clear and direct. Anticipate the reader's need. Sound like a knowledgeable friend, not a helpdesk script.

IMPORTANT RULES:
- Return clean, valid HTML only
- Use appropriate heading tags (h2, h3), paragraph tags, lists (ul/li, ol/li), strong, em, a, hr
- No markdown, no code fences, no commentary
- Do not add wrapper divs or extra HTML structure
- Preserve all links and contact details exactly
- Never invent or modify factual details (addresses, phone numbers, company names)`;

// ── Action → user prompt mapping ─────────────────────────────────────────────
function buildUserPrompt(action: string, content: string, customPrompt?: string): string {
  const subject = content.length > 50
    ? `the following content:\n\n${content}`
    : "the content provided";

  switch (action) {
    case "improve":
      return `Improve the writing quality, flow and elegance of ${subject}. Elevate the language to feel more premium and polished. Return the improved HTML only.`;

    case "clarity":
      return `Rewrite ${subject} for maximum clarity. Use shorter sentences and cleaner structure. Keep the refined, authoritative tone — never sacrifice sophistication for simplicity. Return the rewritten HTML only.`;

    case "expand":
      return `Expand ${subject} with greater detail, depth and authority. Add helpful context and nuance where appropriate, in the platform's luxury voice. Return the expanded HTML only.`;

    case "shorten":
      return `Condense ${subject} without losing any key information or legal precision. Be concise but never sparse — every sentence should earn its place. Return the shortened HTML only.`;

    case "formal":
      return `Rewrite ${subject} in a formal, precise tone appropriate for a premium UK-registered business. Confident, exact and authoritative — suitable for legal and policy documents. Return the rewritten HTML only.`;

    case "friendly":
      return `Rewrite ${subject} in a warm, reassuring and user-friendly tone. Approachable but still sophisticated — like expert guidance from a trusted advisor. Return the rewritten HTML only.`;

    case "grammar":
      return `Correct all grammar, spelling, punctuation and typographic errors in ${subject}. Do not change the meaning, structure or tone. Return the corrected HTML only.`;

    case "generate":
      return `Generate content for the following purpose, written in the platform's refined luxury tone:\n\n${customPrompt || "Please describe what content to generate."}\n\nReturn clean, well-structured HTML only.`;

    default:
      return `Improve the writing quality and clarity of ${subject}. Return the improved HTML only.`;
  }
}

// ── OpenAI caller ─────────────────────────────────────────────────────────────
async function callOpenAI(
  apiKey: string, model: string, maxTokens: number,
  systemPrompt: string, userPrompt: string
): Promise<{ text: string; tokens: number; cost: number }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenAI error: ${err.error?.message || "Unknown"}`);
  }
  const data = await res.json();
  const p = data.usage.prompt_tokens;
  const c = data.usage.completion_tokens;
  return {
    text: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
    cost: (p * 0.00003) + (c * 0.00006),
  };
}

// ── Gemini caller ─────────────────────────────────────────────────────────────
async function callGemini(
  apiKey: string, _model: string, maxTokens: number,
  systemPrompt: string, userPrompt: string
): Promise<{ text: string; tokens: number; cost: number }> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini error: ${err.error?.message || "Unknown"}`);
  }
  const data = await res.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || "";
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  return { text, tokens: estimatedTokens, cost: estimatedTokens * 0.000375 / 1000 };
}

// ── Claude caller ─────────────────────────────────────────────────────────────
async function callClaude(
  apiKey: string, model: string, maxTokens: number,
  systemPrompt: string, userPrompt: string
): Promise<{ text: string; tokens: number; cost: number }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Claude error: ${err.error?.message || "Unknown"}`);
  }
  const data = await res.json();
  const p = data.usage.input_tokens;
  const c = data.usage.output_tokens;
  return {
    text: data.content[0].text,
    tokens: p + c,
    cost: (p * 0.000015) + (c * 0.000075),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const { action, content, selection, customPrompt, page_key } = body;

    if (!action || (!content && action !== "generate")) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action and content" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use selection if provided, otherwise full content
    const targetContent = selection && selection.trim() ? selection.trim() : content;

    // Get active AI provider
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("id, provider, api_key, model, max_tokens")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "No active AI provider configured. Please configure an AI provider in Admin → AI Settings.", status: "not_configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userPrompt = buildUserPrompt(action, targetContent, customPrompt);
    const startTime = Date.now();
    let result: { text: string; tokens: number; cost: number };

    switch (settings.provider) {
      case "openai":
        result = await callOpenAI(settings.api_key, settings.model, settings.max_tokens, SYSTEM_PROMPT, userPrompt);
        break;
      case "gemini":
        result = await callGemini(settings.api_key, settings.model, settings.max_tokens, SYSTEM_PROMPT, userPrompt);
        break;
      case "claude":
        result = await callClaude(settings.api_key, settings.model, settings.max_tokens, SYSTEM_PROMPT, userPrompt);
        break;
      default:
        throw new Error(`Unknown AI provider: ${settings.provider}`);
    }

    const duration = Date.now() - startTime;

    // Log usage
    await supabase.from("ai_usage_log").insert({
      provider: settings.provider,
      model: settings.model,
      feature: "content-assist",
      venue_id: null,
      prompt_tokens: Math.round(result.tokens * 0.7),
      completion_tokens: Math.round(result.tokens * 0.3),
      total_tokens: result.tokens,
      estimated_cost: result.cost,
      status: "success",
      request_duration_ms: duration,
    });

    return new Response(
      JSON.stringify({ result: result.text }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (err) {
    console.error("ai-content-assist error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error", status: "error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
