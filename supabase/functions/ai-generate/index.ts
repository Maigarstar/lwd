// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Content Generation
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Generate luxury editorial content using configured AI provider
// Security: Reads API key from database (server-side only), never exposed to client
//
// Called by: ListingStudio (frontend) when requesting generated content
//
// Request body:
//   {
//     feature: string,              // 'about_description', 'seo_title', etc.
//     systemPrompt: string,         // System context for the AI
//     userPrompt: string,           // User request for content
//     venue_id: string (optional),  // Venue being edited
//   }
//
// Response:
//   {
//     text: string,                 // Generated content
//     provider: string,             // Which AI provider was used
//     model: string,                // Model version
//     tokens_used: number,          // Total tokens
//     estimated_cost: number,       // USD cost estimation
//   }
//
// Error Response:
//   {
//     error: string,                // Error message
//     status: string,               // 'error', 'not_configured', 'rate_limited'
//   }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for frontend requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

interface AIGenerateRequest {
  feature: string;
  systemPrompt: string;
  userPrompt: string;
  venue_id?: string;
}

interface AIGenerateResponse {
  text: string;
  provider: string;
  model: string;
  tokens_used: number;
  estimated_cost: number;
}

// OpenAI API caller
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<{
  text: string;
  tokens: number;
  cost: number;
  duration: number;
}> {
  const startTime = Date.now();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;

  // Estimate cost (rough approximation for gpt-4.1)
  // gpt-4.1: $0.03/1K prompt tokens, $0.06/1K completion tokens
  const promptTokens = data.usage.prompt_tokens;
  const completionTokens = data.usage.completion_tokens;
  const cost = (promptTokens * 0.00003) + (completionTokens * 0.00006);

  return {
    text: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
    cost,
    duration,
  };
}

// Gemini API caller
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  _model: string,
  maxTokens: number
): Promise<{
  text: string;
  tokens: number;
  cost: number;
  duration: number;
}> {
  const startTime = Date.now();

  // Gemini doesn't have separate system prompts, combine them
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;

  const text = data.candidates[0]?.content?.parts[0]?.text || "";
  // Gemini cost estimation (rough - $0.00025/1K input, $0.0005/1K output)
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  const cost = estimatedTokens * 0.000375 / 1000;

  return {
    text,
    tokens: estimatedTokens,
    cost,
    duration,
  };
}

// Claude API caller
async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<{
  text: string;
  tokens: number;
  cost: number;
  duration: number;
}> {
  const startTime = Date.now();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages: [
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;

  // Claude cost estimation
  const promptTokens = data.usage.input_tokens;
  const completionTokens = data.usage.output_tokens;
  // Claude 3 Opus: $0.015/1K input, $0.075/1K output
  const cost = (promptTokens * 0.000015) + (completionTokens * 0.000075);

  return {
    text: data.content[0].text,
    tokens: data.usage.input_tokens + data.usage.output_tokens,
    cost,
    duration,
  };
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: AIGenerateRequest = await req.json();

    // Validate request
    if (!body.feature || !body.systemPrompt || !body.userPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get active AI provider with real API key (server-side only)
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("id, provider, api_key, model, max_tokens")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({
          error: "No active AI provider configured",
          status: "not_configured",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Call appropriate AI provider (server-side only)
    let result;
    const startTime = Date.now();

    try {
      switch (settings.provider) {
        case "openai":
          result = await callOpenAI(
            settings.api_key,
            body.systemPrompt,
            body.userPrompt,
            settings.model,
            settings.max_tokens
          );
          break;
        case "gemini":
          result = await callGemini(
            settings.api_key,
            body.systemPrompt,
            body.userPrompt,
            settings.model,
            settings.max_tokens
          );
          break;
        case "claude":
          result = await callClaude(
            settings.api_key,
            body.systemPrompt,
            body.userPrompt,
            settings.model,
            settings.max_tokens
          );
          break;
        default:
          throw new Error(`Unknown provider: ${settings.provider}`);
      }
    } catch (error) {
      // Log error to usage log
      await supabase.from("ai_usage_log").insert({
        provider: settings.provider,
        model: settings.model,
        api_setting_id: settings.id,
        feature: body.feature,
        venue_id: body.venue_id || null,
        status: "error",
        error_message: error.message,
        request_duration_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          error: error.message,
          status: "error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update last_used_at timestamp
    await supabase
      .from("ai_settings")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", settings.id);

    // Log successful request to usage log
    await supabase.from("ai_usage_log").insert({
      provider: settings.provider,
      model: settings.model,
      api_setting_id: settings.id,
      feature: body.feature,
      venue_id: body.venue_id || null,
      total_tokens: result.tokens,
      estimated_cost: result.cost,
      status: "success",
      request_duration_ms: result.duration,
    });

    // Return result (NO API KEY exposed)
    const response: AIGenerateResponse = {
      text: result.text,
      provider: settings.provider,
      model: settings.model,
      tokens_used: result.tokens,
      estimated_cost: result.cost,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("AI Generate error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
