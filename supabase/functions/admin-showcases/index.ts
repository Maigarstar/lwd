// =============================================================================
// Supabase Edge Function: admin-showcases
// =============================================================================
// Purpose: Service-role proxy for all admin CRUD on venue_showcases.
//          Replaces the non-existent create-showcase and update-showcase stubs
//          and covers all remaining admin showcase operations.
//
// Called by: src/services/showcaseService.js (all admin functions)
//
// Request body: { action: string, ...params }
//
// Actions:
//   list           { type?: 'venue'|'planner' }
//   getBySlugCard  { slug: string }
//   saveDraft      { id: string, updates: object }
//   publish        { id: string, sections: array }
//   duplicate      { id: string }
//   listTemplates  { type?: string }
//   cloneTemplate  { templateId: string, title: string, slug: string }
//   create         { payload: object }   ← DB-shaped (from formToDb)
//   update         { id: string, payload: object }
//   delete         { id: string }
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
      let q = supabase
        .from("venue_showcases")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at",  { ascending: false });
      if (body.type) q = q.eq("type", body.type);
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── getBySlugCard ─────────────────────────────────────────────────────────
    if (action === "getBySlugCard") {
      const { slug } = body;
      if (!slug) return fail("Missing slug", 400);
      const { data, error } = await supabase
        .from("venue_showcases").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return ok(data ?? null);
    }

    // ── saveDraft ─────────────────────────────────────────────────────────────
    if (action === "saveDraft") {
      const { id, updates } = body;
      if (!id) return fail("Missing id", 400);
      const { error } = await supabase
        .from("venue_showcases")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    // ── publish ───────────────────────────────────────────────────────────────
    if (action === "publish") {
      const { id, sections } = body;
      if (!id) return fail("Missing id", 400);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("venue_showcases")
        .update({
          status:             "published",
          sections,
          published_sections: sections,
          published_at:       now,
          updated_at:         now,
        })
        .eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    // ── duplicate ─────────────────────────────────────────────────────────────
    if (action === "duplicate") {
      const { id } = body;
      if (!id) return fail("Missing id", 400);
      const { data: source, error: fetchErr } = await supabase
        .from("venue_showcases").select("*").eq("id", id).single();
      if (fetchErr) throw fetchErr;

      const now     = new Date().toISOString();
      const newSlug = `${source.slug}-copy-${Date.now()}`;
      const { data, error } = await supabase
        .from("venue_showcases")
        .insert({
          type:               source.type,
          title:              `${source.title} (Copy)`,
          slug:               newSlug,
          location:           source.location,
          excerpt:            source.excerpt,
          hero_image_url:     source.hero_image_url,
          logo_url:           source.logo_url,
          listing_id:         source.listing_id,
          status:             "draft",
          sections:           source.sections,
          published_sections: [],
          key_stats:          source.key_stats,
          template_key:       source.template_key,
          theme:              source.theme,
          seo_title:          source.seo_title,
          seo_description:    source.seo_description,
          og_image:           source.og_image,
          sort_order:         0,
          created_at:         now,
          updated_at:         now,
        })
        .select().single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── listTemplates ─────────────────────────────────────────────────────────
    if (action === "listTemplates") {
      let q = supabase
        .from("venue_showcases")
        .select("id, title, slug, type, template_key, hero_image_url, sections, key_stats, location, excerpt")
        .eq("is_template", true)
        .order("sort_order", { ascending: true });
      if (body.type) q = q.eq("type", body.type);
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    }

    // ── cloneTemplate ─────────────────────────────────────────────────────────
    if (action === "cloneTemplate") {
      const { templateId, title, slug } = body;
      if (!templateId) return fail("Missing templateId", 400);
      const { data: source, error: fetchErr } = await supabase
        .from("venue_showcases").select("*").eq("id", templateId).single();
      if (fetchErr) throw fetchErr;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("venue_showcases")
        .insert({
          type:               source.type,
          title:              title || `${source.title} (Copy)`,
          slug:               slug || `${source.slug}-${Date.now()}`,
          location:           source.location,
          excerpt:            source.excerpt,
          hero_image_url:     source.hero_image_url,
          logo_url:           source.logo_url,
          status:             "draft",
          is_template:        false,
          sections:           source.sections,
          published_sections: [],
          key_stats:          source.key_stats,
          template_key:       source.template_key,
          theme:              source.theme,
          sort_order:         0,
          created_at:         now,
          updated_at:         now,
        })
        .select().single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── create ────────────────────────────────────────────────────────────────
    if (action === "create") {
      const { payload } = body;
      if (!payload) return fail("Missing payload", 400);
      const { data, error } = await supabase
        .from("venue_showcases").insert(payload).select().single();
      if (error) throw error;
      return ok(data, 201);
    }

    // ── update ────────────────────────────────────────────────────────────────
    if (action === "update") {
      const { id, payload } = body;
      if (!id || !payload) return fail("Missing id or payload", 400);
      const { data, error } = await supabase
        .from("venue_showcases")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select().single();
      if (error) throw error;
      return ok(data);
    }

    // ── delete ────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const { id } = body;
      if (!id) return fail("Missing id", 400);
      const { error } = await supabase.from("venue_showcases").delete().eq("id", id);
      if (error) throw error;
      return ok(null);
    }

    return fail(`Unknown action: ${action}`, 400);

  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    console.error("[admin-showcases]", msg);
    return fail(msg, 500);
  }
});
