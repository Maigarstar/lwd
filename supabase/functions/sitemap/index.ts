// supabase/functions/sitemap/index.ts
// Public XML sitemap edge function.
// Deploy with: supabase functions deploy sitemap --no-verify-jwt
//
// Add a rewrite in your hosting config so /sitemap.xml -> this function URL,
// OR reference the Supabase function URL directly in robots.txt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";

// Static public pages - highest priority
const STATIC_PAGES = [
  { url: "/",           changefreq: "daily",   priority: "1.0" },
  { url: "/planners",   changefreq: "weekly",  priority: "0.8" },
  { url: "/magazine",   changefreq: "weekly",  priority: "0.8" },
];

function xmlEscape(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(d: string | null | undefined): string {
  if (!d) return new Date().toISOString().split("T")[0];
  return new Date(d).toISOString().split("T")[0];
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Fetch live listings
    const { data: listings } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "live")
      .not("slug", "is", null);

    // Fetch published magazine articles
    const { data: articles } = await supabase
      .from("magazine_posts")
      .select("slug, category_slug, updated_at")
      .eq("published", true)
      .not("slug", "is", null);

    // Fetch magazine categories
    const { data: categories } = await supabase
      .from("magazine_categories")
      .select("slug, updated_at")
      .not("slug", "is", null);

    const entries: string[] = [];

    // Static pages
    const today = new Date().toISOString().split("T")[0];
    for (const p of STATIC_PAGES) {
      entries.push(urlEntry(`${SITE_URL}${p.url}`, today, p.changefreq, p.priority));
    }

    // Live venue listings
    for (const l of listings || []) {
      if (!l.slug) continue;
      entries.push(urlEntry(
        `${SITE_URL}/wedding-venues/${xmlEscape(l.slug)}`,
        toIsoDate(l.updated_at),
        "weekly",
        "0.9",
      ));
    }

    // Magazine categories
    for (const c of categories || []) {
      if (!c.slug) continue;
      entries.push(urlEntry(
        `${SITE_URL}/magazine/${xmlEscape(c.slug)}`,
        toIsoDate(c.updated_at),
        "weekly",
        "0.6",
      ));
    }

    // Published magazine articles
    for (const a of articles || []) {
      if (!a.slug || !a.category_slug) continue;
      entries.push(urlEntry(
        `${SITE_URL}/magazine/${xmlEscape(a.category_slug)}/${xmlEscape(a.slug)}`,
        toIsoDate(a.updated_at),
        "monthly",
        "0.7",
      ));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":  "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag":  "noindex",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
