// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: update-showcase
// ═══════════════════════════════════════════════════════════════════════════
// Updates an existing venue or planner showcase using service role to bypass RLS.
// Anon clients call this instead of updating directly to venue_showcases.
//
// Deploy:
//   supabase functions deploy update-showcase
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

  const id = body.id as string;
  if (!id) return err("Missing showcase id");

  const updates = {
    ...(body.title !== undefined && { title: body.title || body.name || "" }),
    ...(body.slug !== undefined && { slug: body.slug || "" }),
    ...(body.location !== undefined && { location: body.location || null }),
    ...(body.excerpt !== undefined && { excerpt: body.excerpt || null }),
    ...(body.heroImage !== undefined && { hero_image_url: body.heroImage || body.hero_image_url || null }),
    ...(body.logo !== undefined && { logo_url: body.logo || body.logo_url || null }),
    ...(body.previewUrl !== undefined && { preview_url: body.previewUrl || body.preview_url || null }),
    ...(body.listingId !== undefined && { listing_id: body.listingId || null }),
    // Map 'live' → 'published' (DB constraint: 'draft' | 'published' | 'archived')
    ...(body.status !== undefined && { status: body.status === "live" ? "published" : (body.status || "draft") }),
    ...(body.sections !== undefined && { sections: body.sections || [] }),
    ...(body.stats !== undefined && { key_stats: body.stats || body.key_stats || [] }),
    ...(body.sortOrder !== undefined && { sort_order: Number(body.sortOrder || 0) }),
    ...((body.status === "live" || body.status === "published") && !body.publishedAt && { published_at: new Date().toISOString() }),
    ...(body.templateKey !== undefined && { template_key: body.templateKey || null }),
    ...(body.theme !== undefined && { theme: body.theme || null }),
    ...(body.seoTitle !== undefined && { seo_title: body.seoTitle || null }),
    ...(body.seoDescription !== undefined && { seo_description: body.seoDescription || null }),
    ...(body.ogImage !== undefined && { og_image: body.ogImage || null }),
  };

  // Update showcase
  const { data: showcase, error: updateError } = await supabase
    .from("venue_showcases")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("update-showcase: update failed:", updateError);
    return err(updateError.message, 500);
  }

  return ok(showcase);
});
