// =============================================================================
// Supabase Edge Function: admin-managed-accounts
// =============================================================================
// Purpose: Service-role proxy for all admin CRUD on managed_accounts.
//          Bypasses RLS using service_role key so admin writes always succeed.
//
// Called by: src/services/managedAccountsService.js
//
// Request body: { action: string, ...params }
//
// Actions:
//   list    {}                             → data: Account[]
//   get     { id: string }                → data: Account
//   create  { payload: object }           → data: Account
//   update  { id: string, payload: object } → data: Account
//   delete  { id: string }               → data: null
//
// Response: { success: true, data } | { success: false, error: string }
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@^2.42.0";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type":                 "application/json",
};

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), { status, headers: CORS_HEADERS });
}

function fail(message: string, status = 500) {
  return new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS_HEADERS });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")   return fail("Method not allowed", 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body   = await req.json();
    const action = body.action as string;

    // ── list ─────────────────────────────────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabase
        .from("managed_accounts")
        .select("*")
        .order("name");
      if (error) return fail(error.message);
      return ok(data ?? []);
    }

    // ── get ──────────────────────────────────────────────────────────────────
    if (action === "get") {
      const { id } = body as { id: string };
      if (!id) return fail("id is required");
      const { data, error } = await supabase
        .from("managed_accounts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Account not found", 404);
      return ok(data);
    }

    // ── create ───────────────────────────────────────────────────────────────
    if (action === "create") {
      const { payload } = body as { payload: Record<string, unknown> };
      if (!payload?.name) return fail("name is required");

      // Auto-generate slug if missing
      if (!payload.slug) {
        payload.slug = String(payload.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }

      const { data, error } = await supabase
        .from("managed_accounts")
        .insert([payload])
        .select()
        .single();
      if (error) return fail(error.message);
      return ok(data);
    }

    // ── update ───────────────────────────────────────────────────────────────
    if (action === "update") {
      const { id, payload } = body as { id: string; payload: Record<string, unknown> };
      if (!id) return fail("id is required");
      if (!payload) return fail("payload is required");

      const { data, error } = await supabase
        .from("managed_accounts")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) return fail(error.message);
      return ok(data);
    }

    // ── delete ───────────────────────────────────────────────────────────────
    if (action === "delete") {
      const { id } = body as { id: string };
      if (!id) return fail("id is required");
      const { error } = await supabase
        .from("managed_accounts")
        .delete()
        .eq("id", id);
      if (error) return fail(error.message);
      return ok(null);
    }

    return fail(`Unknown action: ${action}`, 400);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin-managed-accounts] unhandled error:", msg);
    return fail(msg, 500);
  }
});
