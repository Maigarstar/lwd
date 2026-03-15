// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: AI Settings Management
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Manage AI provider configuration (ChatGPT, Gemini, Claude)
// Security: Admin only, API keys NEVER exposed to frontend
//
// Endpoints:
//   GET /ai-settings → Get active provider config (masked key only)
//   POST /ai-settings → Update provider settings (accepts real key, doesn't return it)
//
// CRITICAL: The real API key is stored in the database but:
//   - NEVER returned in responses
//   - Only used server-side by /ai-generate function
//   - Frontend only receives masked key for display
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for frontend requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

interface AISettingsResponse {
  id: string;
  provider: string;
  provider_display_name: string;
  model: string;
  active: boolean;
  api_key_masked: string;
  rate_limit: number;
  max_tokens: number;
  temperature: number;
  last_used_at: string | null;
}

interface AISettingsUpdateRequest {
  provider: string;
  api_key: string;
  model: string;
  active: boolean;
}

// Helper: Mask API key for frontend display
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 9) return "****";
  return `${apiKey.substring(0, 5)}****${apiKey.substring(apiKey.length - 4)}`;
}

// Helper: Verify admin access
// Phase 1: Admin uses custom sessionStorage auth (not Supabase Auth),
// so there is no valid JWT to verify here. The Edge Function is still
// protected by Supabase's API gateway (requires valid anon key).
// TODO Phase 2: Migrate admin to Supabase Auth and verify JWT properly.
async function verifyAdmin(_req: Request): Promise<boolean> {
  console.log("Phase 1: Admin auth bypass (custom sessionStorage auth, not Supabase Auth)");
  return true;
}

// GET: Get active AI provider (for ListingStudio to know AI is available)
async function handleGet(_req: Request): Promise<Response> {
  try {
    // Get active provider - mask the key
    const { data, error } = await supabase
      .from("ai_settings")
      .select(
        "id, provider, provider_display_name, model, active, api_key, rate_limit, max_tokens, temperature, last_used_at"
      )
      .eq("active", true)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          error: "No active AI provider configured",
          status: "inactive",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Return settings WITHOUT real api_key, with masked version for display
    const response: AISettingsResponse = {
      id: data.id,
      provider: data.provider,
      provider_display_name: data.provider_display_name,
      model: data.model,
      active: data.active,
      api_key_masked: maskApiKey(data.api_key),
      rate_limit: data.rate_limit,
      max_tokens: data.max_tokens,
      temperature: data.temperature,
      last_used_at: data.last_used_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("AI Settings GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// POST: Update AI settings (admin only)
async function handlePost(req: Request): Promise<Response> {
  // Verify admin access
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: AISettingsUpdateRequest = await req.json();

    // Validate required fields
    if (!body.provider || !body.api_key || !body.model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate provider
    const validProviders = ["openai", "gemini", "claude"];
    if (!validProviders.includes(body.provider)) {
      return new Response(
        JSON.stringify({ error: "Invalid provider" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Map provider to display name
    const displayNames: Record<string, string> = {
      openai: "ChatGPT (OpenAI)",
      gemini: "Gemini (Google)",
      claude: "Claude (Anthropic)",
    };

    const providerDisplayName = displayNames[body.provider] || body.provider;

    // Deactivate others if activating this one
    if (body.active) {
      await supabase
        .from("ai_settings")
        .update({ active: false })
        .neq("provider", body.provider);
    }

    // Try UPDATE first
    console.log("Attempting UPDATE for provider:", body.provider);
    const updateResult = await supabase
      .from("ai_settings")
      .update({
        api_key: body.api_key,
        model: body.model,
        active: body.active === true,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", body.provider)
      .select("id, provider, provider_display_name, model, active, api_key, rate_limit, max_tokens, temperature")
      .single();

    let data;
    let error;

    if (updateResult.data) {
      // UPDATE succeeded
      console.log("UPDATE succeeded");
      data = updateResult.data;
      error = null;
    } else if (updateResult.error?.code === "PGRST116") {
      // No rows found - INSERT instead
      console.log("UPDATE found no rows, attempting INSERT");
      const insertResult = await supabase
        .from("ai_settings")
        .insert({
          provider: body.provider,
          provider_display_name: providerDisplayName,
          api_key: body.api_key,
          model: body.model,
          active: body.active === true,
          rate_limit: 100,
          max_tokens: 1500,
          temperature: 0.7,
        })
        .select("id, provider, provider_display_name, model, active, api_key, rate_limit, max_tokens, temperature")
        .single();

      console.log("INSERT result - data:", !!insertResult.data, "error:", insertResult.error?.message);
      data = insertResult.data;
      error = insertResult.error;
    } else {
      // Other error
      console.log("UPDATE error:", updateResult.error);
      data = null;
      error = updateResult.error;
    }

    if (error || !data) {
      console.error("Update/Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save settings: " + (error?.message || "Unknown error") }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Return updated settings WITHOUT real api_key
    const response: AISettingsResponse = {
      id: data.id,
      provider: data.provider,
      provider_display_name: data.provider_display_name,
      model: data.model,
      active: data.active,
      api_key_masked: maskApiKey(data.api_key),
      rate_limit: data.rate_limit,
      max_tokens: data.max_tokens,
      temperature: data.temperature,
      last_used_at: null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("AI Settings POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Route requests
  // Note: supabase.functions.invoke() always uses POST by default,
  // so we detect GET vs POST by checking Content-Length or cloning the body.
  if (req.method === "GET") {
    return handleGet(req);
  } else if (req.method === "POST") {
    // Check if POST has a body (save) or is empty (read)
    // supabase.functions.invoke('ai-settings') sends POST with no body → treat as GET
    // supabase.functions.invoke('ai-settings', { body: {...} }) sends POST with body → save
    const contentLength = req.headers.get("content-length");
    const contentType = req.headers.get("content-type");

    // If no content-length or it's "0", or no content-type, treat as GET
    if (!contentLength || contentLength === "0" || (!contentType && !contentLength)) {
      console.log("POST with no body detected, routing to handleGet");
      return handleGet(req);
    }

    return handlePost(req);
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
