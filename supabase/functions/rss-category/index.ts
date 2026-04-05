// supabase/functions/rss-category/index.ts
// Per-category RSS 2.0 feed for magazine editorial lanes.
// Deploy: supabase functions deploy rss-category --no-verify-jwt
//
// Wire: /magazine/:category/feed.xml → this function?category=:category in hosting rewrites.
// Example: /magazine/destinations/feed.xml → ?category=destinations
//
// Returns 400 if no category param supplied.
// Cache: 30 minutes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL     = "https://www.luxuryweddingdirectory.co.uk";
const FEED_LIMIT   = 50;
const EDITOR_EMAIL = "editorial@luxuryweddingdirectory.co.uk";

function xe(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function rfcDate(iso: string): string {
  try { return new Date(iso).toUTCString(); } catch { return new Date().toUTCString(); }
}

// Human-readable label from slug
function labelFromSlug(slug: string): string {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function buildItem(a: {
  slug: string; category_slug: string; title: string; excerpt?: string;
  cover_image?: string; published_at: string; author_name?: string;
  tags?: string[] | string; category_label?: string;
}): string {
  const url     = `${SITE_URL}/magazine/${xe(a.category_slug)}/${xe(a.slug)}`;
  const pubDate = rfcDate(a.published_at);
  const desc    = xe(a.excerpt || a.title);
  const author  = xe(a.author_name || "LWD Editorial");

  const tags = Array.isArray(a.tags)
    ? a.tags : typeof a.tags === "string" ? a.tags.split(",").map(t => t.trim()) : [];
  const categoryTags = tags.filter(Boolean).map(t => `    <category>${xe(t)}</category>`).join("\n");

  const mediaImage = a.cover_image
    ? `    <media:content url="${xe(a.cover_image)}" medium="image" />\n    <media:thumbnail url="${xe(a.cover_image)}" />`
    : "";

  return `  <item>
    <title>${xe(a.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${desc}</description>
    <pubDate>${pubDate}</pubDate>
    <dc:creator>${author}</dc:creator>
${categoryTags}
${mediaImage}
  </item>`;
}

Deno.serve(async (req) => {
  const url      = new URL(req.url);
  const category = url.searchParams.get("category")?.toLowerCase().trim();

  if (!category) {
    return new Response("Missing ?category= parameter", { status: 400 });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Fetch category metadata (for label)
    const { data: catRow } = await sb
      .from("magazine_categories")
      .select("slug, label, description")
      .eq("slug", category)
      .maybeSingle();

    const catLabel = catRow?.label || labelFromSlug(category);
    const catDesc  = catRow?.description || `${catLabel} articles from Luxury Wedding Directory Magazine.`;

    const { data: articles } = await sb
      .from("magazine_posts")
      .select("slug, category_slug, title, excerpt, cover_image, published_at, author_name, tags, category_label")
      .eq("status", "published")
      .eq("category_slug", category)
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(FEED_LIMIT);

    if (!articles || articles.length === 0) {
      // Return valid empty feed rather than 404
    }

    const items = (articles || [])
      .filter(a => a.slug && a.title)
      .map(buildItem);

    const lastBuildDate = articles?.[0]?.published_at
      ? rfcDate(articles[0].published_at)
      : new Date().toUTCString();

    const feedTitle = `LWD Magazine — ${xe(catLabel)}`;
    const feedUrl   = `${SITE_URL}/magazine/${category}/feed.xml`;
    const feedLink  = `${SITE_URL}/magazine/${category}`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xe(feedTitle)}</title>
    <link>${feedLink}</link>
    <description>${xe(catDesc)}</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>${EDITOR_EMAIL}</managingEditor>
    <ttl>30</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/og-default.jpg</url>
      <title>${xe(feedTitle)}</title>
      <link>${feedLink}</link>
    </image>
${items.join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":  "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err) {
    console.error(`RSS category feed error [${category}]:`, err);
    return new Response("Error generating category RSS feed", { status: 500 });
  }
});
