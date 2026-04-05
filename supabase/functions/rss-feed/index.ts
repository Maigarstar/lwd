// supabase/functions/rss-feed/index.ts
// Main RSS 2.0 feed — all published magazine articles, newest first.
// Deploy: supabase functions deploy rss-feed --no-verify-jwt
//
// Wire: /feed.xml → this function in hosting rewrites.
// Reference in <head>: <link rel="alternate" type="application/rss+xml" title="LWD Magazine" href="/feed.xml" />
//
// Spec: https://www.rssboard.org/rss-specification
// Media RSS: https://www.rssboard.org/media-rss
//
// Cache: 30 minutes (fresh enough for discovery, light on DB).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL    = "https://www.luxuryweddingdirectory.co.uk";
const FEED_TITLE  = "Luxury Wedding Directory — The Magazine";
const FEED_DESC   = "Editorial inspiration, destination guides, real weddings, and planning intelligence for couples planning exceptional celebrations.";
const FEED_LANG   = "en-gb";
const FEED_LIMIT  = 100;
const EDITOR_EMAIL = "editorial@luxuryweddingdirectory.co.uk";

function xe(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function rfcDate(iso: string): string {
  // RSS 2.0 requires RFC 822 date
  try { return new Date(iso).toUTCString(); } catch { return new Date().toUTCString(); }
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
  const cat     = xe(a.category_label || a.category_slug || "");

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
    <category>${cat}</category>
${categoryTags}
${mediaImage}
  </item>`;
}

Deno.serve(async () => {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: articles } = await sb
      .from("magazine_posts")
      .select("slug, category_slug, title, excerpt, cover_image, published_at, author_name, tags, category_label")
      .eq("status", "published")
      .not("slug", "is", null)
      .not("category_slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(FEED_LIMIT);

    const items = (articles || [])
      .filter(a => a.slug && a.category_slug && a.title)
      .map(buildItem);

    const lastBuildDate = articles?.[0]?.published_at
      ? rfcDate(articles[0].published_at)
      : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xe(FEED_TITLE)}</title>
    <link>${SITE_URL}/magazine</link>
    <description>${xe(FEED_DESC)}</description>
    <language>${FEED_LANG}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>${EDITOR_EMAIL}</managingEditor>
    <ttl>30</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/og-default.jpg</url>
      <title>${xe(FEED_TITLE)}</title>
      <link>${SITE_URL}/magazine</link>
    </image>
${items.join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":  "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800", // 30 min
      },
    });
  } catch (err) {
    console.error("RSS feed error:", err);
    return new Response("Error generating RSS feed", { status: 500 });
  }
});
