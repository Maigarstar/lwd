// supabase/functions/sitemap-news/index.ts
// Google News Sitemap — articles published in the last 48 hours.
// Deploy: supabase functions deploy sitemap-news --no-verify-jwt
//
// Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
// Wire: /sitemap-news.xml → this function in hosting rewrites.
//
// Google crawls this frequently — cache for 15 minutes max.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";
const PUBLICATION_NAME = "Luxury Wedding Directory";
const PUBLICATION_LANG = "en";
const WINDOW_HOURS = 48; // Google News only indexes articles < 48h old

function xe(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const { data: articles } = await sb
      .from("magazine_posts")
      .select("slug, category_slug, title, published_at, tags")
      .eq("status", "published")
      .gte("published_at", cutoff)
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(1000);

    const entries = (articles || [])
      .filter(a => a.slug && a.category_slug && a.title)
      .map(a => {
        const url = `${SITE_URL}/magazine/${xe(a.category_slug)}/${xe(a.slug)}`;
        const pubDate = new Date(a.published_at).toISOString();
        // Google News requires comma-separated keywords (max 10)
        const keywords = Array.isArray(a.tags)
          ? a.tags.slice(0, 10).join(", ")
          : (a.tags || "").split(",").slice(0, 10).join(", ");
        return `  <url>
    <loc>${xe(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xe(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${xe(pubDate)}</news:publication_date>
      <news:title>${xe(a.title)}</news:title>${keywords ? `\n      <news:keywords>${xe(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":  "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900", // 15 min — fresher for news crawler
      },
    });
  } catch (err) {
    console.error("News sitemap error:", err);
    return new Response("Error generating news sitemap", { status: 500 });
  }
});
