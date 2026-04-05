// supabase/functions/sitemap-video/index.ts
// Google Video Sitemap — magazine articles with embedded video content.
// Deploy: supabase functions deploy sitemap-video --no-verify-jwt
//
// Sitemap spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
// Add to your sitemap index: <sitemap><loc>https://.../sitemap-video.xml</loc></sitemap>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";

function xe(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toIsoDate(d: string | null | undefined): string {
  if (!d) return new Date().toISOString();
  return new Date(d).toISOString();
}

// ── Resolve YouTube/Vimeo URLs into embed + thumbnail ─────────────────────────
function resolveVideo(url: string): { playerLoc: string; thumbnailLoc: string; platform: string } | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      platform: "youtube",
      playerLoc: `https://www.youtube.com/embed/${id}`,
      thumbnailLoc: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      platform: "vimeo",
      playerLoc: `https://player.vimeo.com/video/${id}`,
      thumbnailLoc: `https://vumbnail.com/${id}.jpg`, // Vumbnail proxy — works without API key
    };
  }

  return null;
}

// Extract all video embeds from article content JSON
function extractVideos(
  content: any[],
  heroVideoUrl: string | null,
  coverImage: string | null,
  title: string,
  description: string,
  slug: string,
  categorySlug: string,
  updatedAt: string,
): string[] {
  const entries: string[] = [];
  const pageUrl = `${SITE_URL}/magazine/${xe(categorySlug)}/${xe(slug)}`;
  const thumbnail = coverImage || "";

  function makeEntry(resolved: { playerLoc: string; thumbnailLoc: string }, extraTitle?: string): string {
    const t = xe(extraTitle || title);
    const d = xe(description || title);
    const thumb = xe(resolved.thumbnailLoc || thumbnail);
    return `  <url>
    <loc>${xe(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
      <video:title>${t}</video:title>
      <video:description>${d}</video:description>
      <video:player_loc>${xe(resolved.playerLoc)}</video:player_loc>
      <video:publication_date>${xe(toIsoDate(updatedAt))}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
  }

  // Hero video
  if (heroVideoUrl) {
    const r = resolveVideo(heroVideoUrl);
    if (r) entries.push(makeEntry(r, title));
  }

  // Content video blocks
  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block) continue;
      // video_embed or video block
      const src = block.src || block.url || block.videoUrl;
      if ((block.type === "video" || block.type === "video_embed") && src) {
        const r = resolveVideo(src);
        if (r) entries.push(makeEntry(r, block.caption || block.title || title));
      }
    }
  }

  return entries;
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
      .select("slug, category_slug, title, excerpt, cover_image, hero_video_url, content, updated_at")
      .eq("status", "published")
      .not("slug", "is", null);

    const urlEntries: string[] = [];

    for (const a of articles || []) {
      if (!a.slug || !a.category_slug) continue;

      const videoEntries = extractVideos(
        a.content || [],
        a.hero_video_url || null,
        a.cover_image || null,
        a.title || "",
        a.excerpt || a.title || "",
        a.slug,
        a.category_slug,
        a.updated_at,
      );

      urlEntries.push(...videoEntries);
    }

    if (urlEntries.length === 0) {
      // Return minimal valid sitemap if no videos found
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
</urlset>`;
      return new Response(xml, {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlEntries.join("\n")}
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
    console.error("Video sitemap error:", err);
    return new Response("Error generating video sitemap", { status: 500 });
  }
});
