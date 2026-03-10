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
async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return false;

  // Check if user is admin (requires is_admin claim in JWT or admin_users table)
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return !!adminCheck;
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
          headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Settings GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If activating this provider, deactivate others
    if (body.active) {
      await supabase
        .from("ai_settings")
        .update({ active: false })
        .neq("provider", body.provider);
    }

    // Update settings (stores full api_key in database)
    const { data, error } = await supabase
      .from("ai_settings")
      .update({
        api_key: body.api_key,
        model: body.model,
        active: body.active,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", body.provider)
      .select(
        "id, provider, provider_display_name, model, active, api_key, rate_limit, max_tokens, temperature"
      )
      .single();

    if (error || !data) {
      console.error("Update error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update settings" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Settings POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Route requests
  if (req.method === "GET") {
    return handleGet(req);
  } else if (req.method === "POST") {
    return handlePost(req);
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
});
