// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: create-showcase
// ═══════════════════════════════════════════════════════════════════════════
// Creates a new venue or planner showcase using service role to bypass RLS.
// Anon clients call this instead of inserting directly to venue_showcases.
//
// Deploy:
//   supabase functions deploy create-showcase
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, headers: { "Content-Type": "application/json", ...cors },
  });
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return err("Method not allowed", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON"); }

  const showcaseRow = {
    type:            body.type || "venue",
    title:           body.title || body.name || "",
    slug:            body.slug || "",
    location:        body.location || null,
    excerpt:         body.excerpt || null,
    hero_image_url:  body.heroImage || body.hero_image_url || null,
    logo_url:        body.logo || body.logo_url || null,
    preview_url:     body.previewUrl || body.preview_url || null,
    listing_id:      body.listingId || null,
    status:          body.status || "draft",
    sections:        body.sections || [],
    key_stats:       body.stats || body.key_stats || [],
    sort_order:      Number(body.sortOrder || 0),
    published_at:    null,
    template_key:    body.templateKey || null,
    theme:           body.theme || null,
    seo_title:       body.seoTitle || null,
    seo_description: body.seoDescription || null,
    og_image:        body.ogImage || null,
  };

  // Insert showcase
  const { data: showcase, error: insertError } = await supabase
    .from("venue_showcases")
    .insert(showcaseRow)
    .select("*")
    .single();

  if (insertError) {
    console.error("create-showcase: insert failed:", insertError);
    return err(insertError.message, 500);
  }

  return ok(showcase);
});
