// supabase/functions/sitemap-index/index.ts
// Master XML Sitemap Index — points Google to all child sitemaps.
// Deploy: supabase functions deploy sitemap-index --no-verify-jwt
//
// Wire up /sitemap-index.xml → this function in your hosting rewrites.
// Reference in robots.txt: Sitemap: https://www.luxuryweddingdirectory.co.uk/sitemap-index.xml
//
// Google limit: 2,500 sitemaps per index, 50,000 URLs per child sitemap.

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";

// Child sitemaps — each must be deployed as its own edge function with a hosting rewrite
const CHILD_SITEMAPS = [
  { path: "/sitemap.xml",        label: "Main URL sitemap (venues, showcases, vendors, magazine)" },
  { path: "/sitemap-images.xml", label: "Image sitemap (article images, venue galleries, OG images)" },
  { path: "/sitemap-video.xml",  label: "Video sitemap (hero videos, embedded content)" },
  { path: "/sitemap-news.xml",   label: "Google News sitemap (last 48 hours — magazine articles)" },
];

Deno.serve(() => {
  const today = new Date().toISOString();

  const entries = CHILD_SITEMAPS.map(s => `  <sitemap>
    <!-- ${s.label} -->
    <loc>${SITE_URL}${s.path}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type":  "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
