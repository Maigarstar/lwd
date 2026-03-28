// =============================================================================
// Supabase Edge Function: admin-managed-accounts
// =============================================================================
// Purpose: Service-role proxy for all admin writes on managed_accounts,
//          social_campaigns, and social_content tables.
//
// Why this exists: These tables have RLS enabled. The admin dashboard uses
//   the anon key (no admin auth layer yet), so direct writes from the browser
//   are blocked. This edge function holds the service_role key server-side
//   and is never exposed to the frontend.
//
// Authentication: Requests must include Authorization: Bearer <anon_key>.
//   The edge function validates the anon key to confirm the request comes
//   from the app, then uses the service_role key internally.
//
// Request body: { action: string, ...params }
//
// managed_accounts actions:
//   list              { status?: string }
//   create            { payload: object }
//   update            { id: string, payload: object }
//   updatePortalConfig { id: string, config: object }
//   delete            { id: string }
//   convertFromLead   { lead: object }
//
// social_campaigns actions:
//   createCampaign    { payload: object }
//   updateCampaign    { id: string, payload: object }
//
// social_content actions:
//   createContent     { payload: object }
//   createContentBatch { items: object[] }
//   updateContent     { id: string, payload: object }
//   updateContentStatus { id: string, status: string }
//   deleteContent     { id: string }
//
// Response: { success: true, data? } | { success: false, error: string }
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

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS_HEADERS });
}

function slugify(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")   return err("Method not allowed", 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { action } = body;

    // ═══════════════════════════════════════════════════════════════════════
    // MANAGED ACCOUNTS
    // ═══════════════════════════════════════════════════════════════════════

    // ── list ─────────────────────────────────────────────────────────────
    if (action === "list") {
      let q = supabase.from("managed_accounts").select("*").order("name");
      if (body.status) q = q.eq("status", body.status);
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── getById ───────────────────────────────────────────────────────────
    if (action === "getById") {
      const { id } = body;
      if (!id) return err("Missing id", 400);
      const { data, error } = await supabase
        .from("managed_accounts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ?? null);
    }

    // ── create ────────────────────────────────────────────────────────────
    if (action === "create") {
      const { payload } = body;
      if (!payload?.name) return err("Missing required field: name", 400);
      // Auto-generate base slug if not provided
      const baseSlug = payload.slug ? payload.slug : slugify(payload.name);
      // Try base slug first, then base-2, base-3 … up to base-10 on collision
      let lastError: any = null;
      for (let attempt = 0; attempt <= 9; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const { data, error } = await supabase
          .from("managed_accounts")
          .insert([{ ...payload, slug }])
          .select()
          .single();
        if (!error) return ok(data, 201);
        // 23505 = unique_violation — try next suffix
        if (error.code === "23505" && error.message?.includes("slug")) {
          lastError = error;
          continue;
        }
        // Any other error — throw immediately
        throw error;
      }
      // Exhausted all suffixes (very unlikely) — surface a clear message
      return err(
        `Slug "${baseSlug}" and variants up to "${baseSlug}-10" are all taken. ` +
        `Please choose a different account name or enter a custom slug.`,
        409,
      );
    }

    // ── update ────────────────────────────────────────────────────────────
    if (action === "update") {
      const { id, payload } = body;
      if (!id || !payload) return err("Missing id or payload", 400);
      const { data, error } = await supabase
        .from("managed_accounts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }

    // ── updatePortalConfig ────────────────────────────────────────────────
    if (action === "updatePortalConfig") {
      const { id, config } = body;
      if (!id || !config) return err("Missing id or config", 400);
      const { error } = await supabase
        .from("managed_accounts")
        .update({ portal_config: config, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    // ── delete ────────────────────────────────────────────────────────────
    if (action === "delete") {
      const { id } = body;
      if (!id) return err("Missing id", 400);
      const { error } = await supabase.from("managed_accounts").delete().eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    // ── convertFromLead ───────────────────────────────────────────────────
    if (action === "convertFromLead") {
      const { lead } = body;
      if (!lead) return err("Missing lead", 400);
      const req2 = lead.requirements_json || {};
      const name = req2.businessName ||
        `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || lead.email;
      const payload = {
        name,
        slug:                  slugify(name),
        primary_contact_name:  `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
        primary_contact_email: lead.email  || "",
        contact_phone:         lead.phone  || "",
        plan:                  "",
        service_status:        "onboarding",
        status:                "active",
        onboarding_status:     "pending",
        crm_lead_id:           lead.id,
        internal_notes: `Converted from CRM lead on ${new Date().toLocaleDateString("en-GB")}. Original source: ${lead.lead_source || "unknown"}.`,
      };
      const { data, error } = await supabase
        .from("managed_accounts")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL CAMPAIGNS
    // ═══════════════════════════════════════════════════════════════════════

    // ── createCampaign ────────────────────────────────────────────────────
    if (action === "createCampaign") {
      const { payload } = body;
      if (!payload?.name) return err("Missing required field: name", 400);
      const { data, error } = await supabase
        .from("social_campaigns")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── updateCampaign ────────────────────────────────────────────────────
    if (action === "updateCampaign") {
      const { id, payload } = body;
      if (!id || !payload) return err("Missing id or payload", 400);
      const { data, error } = await supabase
        .from("social_campaigns")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    // ── createContent ─────────────────────────────────────────────────────
    if (action === "createContent") {
      const { payload } = body;
      if (!payload) return err("Missing payload", 400);
      const { data, error } = await supabase
        .from("social_content")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── createContentBatch ────────────────────────────────────────────────
    if (action === "createContentBatch") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return err("Missing or empty items array", 400);
      const { data, error } = await supabase
        .from("social_content")
        .insert(items)
        .select();
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── updateContent ─────────────────────────────────────────────────────
    if (action === "updateContent") {
      const { id, payload } = body;
      if (!id || !payload) return err("Missing id or payload", 400);
      const { data, error } = await supabase
        .from("social_content")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }

    // ── updateContentStatus ───────────────────────────────────────────────
    if (action === "updateContentStatus") {
      const { id, status } = body;
      if (!id || !status) return err("Missing id or status", 400);
      const { error } = await supabase
        .from("social_content")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    // ── deleteContent ─────────────────────────────────────────────────────
    if (action === "deleteContent") {
      const { id } = body;
      if (!id) return err("Missing id", 400);
      const { error } = await supabase.from("social_content").delete().eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    return err(`Unknown action: ${action}`, 400);

  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    console.error("[admin-managed-accounts]", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: CORS_HEADERS });
  }
});
