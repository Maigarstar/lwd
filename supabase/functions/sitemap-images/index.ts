// supabase/functions/sitemap-images/index.ts
// Google Image Sitemap — magazine articles + listing cover images.
// Deploy: supabase functions deploy sitemap-images --no-verify-jwt
//
// Sitemap spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
// Add to your sitemap index: <sitemap><loc>https://.../sitemap-images.xml</loc></sitemap>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";
const MAX_IMAGES_PER_URL = 1000; // Google limit

function xe(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try { new URL(url); return true; } catch { return false; }
}

// Extract all image URLs + metadata from a magazine article's content JSON
function extractImages(content: any[], title: string): { loc: string; title: string; caption?: string }[] {
  const images: { loc: string; title: string; caption?: string }[] = [];
  if (!Array.isArray(content)) return images;

  for (const block of content) {
    if (!block) continue;

    // Single image block
    if (block.type === "image" && isValidImageUrl(block.src)) {
      images.push({
        loc: block.src,
        title: block.alt || title,
        ...(block.caption ? { caption: block.caption } : {}),
      });
    }

    // Gallery block
    if ((block.type === "gallery" || block.type === "gallery_grid" || block.type === "masonry_grid") && Array.isArray(block.images)) {
      for (const img of block.images) {
        if (isValidImageUrl(img.src || img.url)) {
          images.push({
            loc: img.src || img.url,
            title: img.alt || img.caption || title,
            ...(img.caption ? { caption: img.caption } : {}),
          });
        }
      }
    }

    // Mood board
    if (block.type === "mood_board" && Array.isArray(block.images)) {
      for (const url of block.images) {
        if (isValidImageUrl(url)) images.push({ loc: url, title: block.title || title });
      }
    }

    // Lookbook
    if (block.type === "lookbook" && Array.isArray(block.slides)) {
      for (const slide of block.slides) {
        if (isValidImageUrl(slide.src || slide.image)) {
          images.push({ loc: slide.src || slide.image, title: slide.caption || title });
        }
      }
    }
  }
  return images;
}

function imageEntry(loc: string, imageTitle: string, caption?: string): string {
  return `    <image:image>
      <image:loc>${xe(loc)}</image:loc>
      <image:title>${xe(imageTitle)}</image:title>${caption ? `\n      <image:caption>${xe(caption)}</image:caption>` : ""}
    </image:image>`;
}

Deno.serve(async () => {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // ── Magazine articles ─────────────────────────────────────────────────────
    const { data: articles } = await sb
      .from("magazine_posts")
      .select("slug, category_slug, title, cover_image, cover_image_alt, content, updated_at")
      .eq("status", "published")
      .not("slug", "is", null);

    // ── Listing cover images ──────────────────────────────────────────────────
    const { data: listings } = await sb
      .from("listings")
      .select("slug, name, cover_image, gallery_images, updated_at")
      .eq("status", "live")
      .not("slug", "is", null);

    const urlEntries: string[] = [];

    // Magazine articles — cover image + content images
    for (const a of articles || []) {
      if (!a.slug || !a.category_slug) continue;
      const pageUrl = `${SITE_URL}/magazine/${xe(a.category_slug)}/${xe(a.slug)}`;
      const images: { loc: string; title: string; caption?: string }[] = [];

      if (isValidImageUrl(a.cover_image)) {
        images.push({ loc: a.cover_image, title: a.cover_image_alt || a.title || "" });
      }

      const contentImages = extractImages(a.content || [], a.title || "");
      images.push(...contentImages);

      // Deduplicate by URL
      const seen = new Set<string>();
      const unique = images.filter(i => { if (seen.has(i.loc)) return false; seen.add(i.loc); return true; });

      if (unique.length === 0) continue;

      urlEntries.push(
        `  <url>\n    <loc>${xe(pageUrl)}</loc>\n${unique.slice(0, MAX_IMAGES_PER_URL).map(i => imageEntry(i.loc, i.title, i.caption)).join("\n")}\n  </url>`
      );
    }

    // Listing pages — cover + gallery
    for (const l of listings || []) {
      if (!l.slug) continue;
      const pageUrl = `${SITE_URL}/wedding-venues/${xe(l.slug)}`;
      const images: { loc: string; title: string }[] = [];

      if (isValidImageUrl(l.cover_image)) images.push({ loc: l.cover_image, title: l.name || "" });

      const gallery = Array.isArray(l.gallery_images) ? l.gallery_images : [];
      for (const img of gallery) {
        const url = typeof img === "string" ? img : img?.src || img?.url;
        if (isValidImageUrl(url)) images.push({ loc: url, title: l.name || "" });
      }

      if (images.length === 0) continue;
      const seen = new Set<string>();
      const unique = images.filter(i => { if (seen.has(i.loc)) return false; seen.add(i.loc); return true; });

      urlEntries.push(
        `  <url>\n    <loc>${xe(pageUrl)}</loc>\n${unique.slice(0, MAX_IMAGES_PER_URL).map(i => imageEntry(i.loc, i.title)).join("\n")}\n  </url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
    console.error("Image sitemap error:", err);
    return new Response("Error generating image sitemap", { status: 500 });
  }
});
