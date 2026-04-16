// =============================================================================
// Supabase Edge Function: admin-listings
// =============================================================================
// Purpose: Service-role proxy for all admin CRUD on the listings table.
//          Called by src/services/listings.ts and other admin services.
//
// Why this exists: When Phase 3B enables RLS on listings with
//   anon SELECT WHERE status = 'published', admin reads (all statuses,
//   including draft) and admin writes must bypass RLS via service_role.
//
// Request body: { action: string, ...params }
//
// Actions:
//   list                 { filters?: { status, category_slug, region_slug, country_slug, listing_type }, limit?: number }
//   getById              { id: string }
//   getBySlug            { slug: string }
//   getByIds             { ids: string[] }                         ← batch fetch by ID
//   getByVendorAccountId { vendorAccountId: string }              ← Client Portal vendor listing lookup
//   search               { nameQuery?: string, locationQuery?: string, status?: string, limit?: number }
//   create               { payload: object }   ← pre-transformed DB payload
//   update               { id: string, payload: object }
//   delete               { id: string }
//
// Response: { success: true, data? } | { error: string }
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@^2.42.0";

const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
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

function err(message: string, status = 500) {
  return new Response(JSON.stringify({ success: false, error: message }), { status, headers: CORS_HEADERS });
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

    // ── list ─────────────────────────────────────────────────────────────────
    if (action === "list") {
      const f     = body.filters ?? {};
      const limit = body.limit ? Number(body.limit) : null;
      let q = supabase.from("listings").select("*");
      if (f.status)        q = q.eq("status",        f.status);
      if (f.category_slug) q = q.eq("category_slug", f.category_slug);
      if (f.region_slug)   q = q.eq("region_slug",   f.region_slug);
      if (f.country_slug)  q = q.eq("country_slug",  f.country_slug);
      if (f.listing_type)  q = q.eq("listing_type",  f.listing_type);
      q = q.order("updated_at", { ascending: false, nullsFirst: false })
           .order("published_at", { ascending: false, nullsFirst: false })
           .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── getById ───────────────────────────────────────────────────────────────
    if (action === "getById") {
      const { id } = body;
      if (!id) return err("Missing id", 400);
      const { data, error } = await supabase
        .from("listings").select("*").eq("id", id).single();
      if (error) throw error;
      return ok(data);
    }

    // ── getBySlug ─────────────────────────────────────────────────────────────
    if (action === "getBySlug") {
      const { slug } = body;
      if (!slug) return err("Missing slug", 400);
      const { data, error } = await supabase
        .from("listings").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return ok(data ?? null);
    }

    // ── getByIds ──────────────────────────────────────────────────────────────
    // Batch fetch by ID array. Returns rows in arbitrary order.
    // Used by reviewThemeService and any batch ID resolution.
    if (action === "getByIds") {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) return ok([]);
      const { data, error } = await supabase
        .from("listings").select("*").in("id", ids);
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── getByVendorAccountId ──────────────────────────────────────────────────
    // Client Portal: fetch the listing associated with a vendor account.
    // Returns the first match (vendors typically have one listing).
    // No status filter — service_role sees all rows; portal decides what to display.
    if (action === "getByVendorAccountId") {
      const { vendorAccountId } = body;
      if (!vendorAccountId) return err("Missing vendorAccountId", 400);
      const { data, error } = await supabase
        .from("listings")
        .select("id, name, slug, website, city, region, country, status")
        .eq("vendor_account_id", vendorAccountId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return ok(data ?? null);
    }

    // ── search ────────────────────────────────────────────────────────────────
    // Flexible ilike search. At least one of nameQuery or locationQuery required.
    //   nameQuery     → ilike match on the name column
    //   locationQuery → ilike match on the location column
    //   status        → optional exact filter
    //   limit         → default 10
    if (action === "search") {
      const { nameQuery, locationQuery, status, limit = 10 } = body;
      if (!nameQuery && !locationQuery) return ok([]);
      let q = supabase.from("listings").select("*").limit(Number(limit));
      if (nameQuery)     q = q.ilike("name",     `%${nameQuery}%`);
      if (locationQuery) q = q.ilike("location", `%${locationQuery}%`);
      if (status)        q = q.eq("status",      status);
      q = q.order("name", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── create ────────────────────────────────────────────────────────────────
    if (action === "create") {
      const { payload } = body;
      if (!payload) return err("Missing payload", 400);
      const { data, error } = await supabase
        .from("listings").insert([payload]).select().single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── update ────────────────────────────────────────────────────────────────
    if (action === "update") {
      const { id, payload } = body;
      if (!id || !payload) return err("Missing id or payload", 400);
      const { data, error } = await supabase
        .from("listings")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select().single();
      if (error) throw error;
      return ok(data);
    }

    // ── delete ────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const { id } = body;
      if (!id) return err("Missing id", 400);
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    return err(`Unknown action: ${action}`, 400);

  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    console.error("[admin-listings]", msg);
    return err(msg, 500);
  }
});
