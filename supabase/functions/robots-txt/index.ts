// supabase/functions/robots-txt/index.ts
// Serves /robots.txt dynamically from platform_settings (key: seo_robots_txt).
// Falls back to a safe default if no DB row found.
//
// Deploy: supabase functions deploy robots-txt --no-verify-jwt
//
// Nginx rewrite (VPS):
//   location = /robots.txt {
//     proxy_pass https://qpkggfibwreznussudfh.supabase.co/functions/v1/robots-txt;
//     proxy_ssl_server_name on;
//     proxy_set_header Host qpkggfibwreznussudfh.supabase.co;
//     proxy_set_header Authorization "Bearer <ANON_KEY>";
//   }
//
// Cache: 1 hour.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Allow: /vendor/
Disallow: /admin
Disallow: /vendor/dashboard
Disallow: /vendor/auth
Disallow: /listing-studio
Disallow: /magazine-studio
Disallow: /getting-married
Disallow: /api/
Disallow: /*.json$
Crawl-delay: 2

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-venues.xml
Sitemap: ${SITE_URL}/sitemap-vendors.xml
Sitemap: ${SITE_URL}/sitemap-magazine.xml
Sitemap: ${SITE_URL}/sitemap-locations.xml
`;

Deno.serve(async () => {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data } = await sb
      .from("platform_settings")
      .select("value")
      .eq("key", "seo_robots_txt")
      .maybeSingle();

    const content = (data?.value && data.value.trim())
      ? data.value
      : DEFAULT_ROBOTS;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("robots-txt function error:", err);
    // Always return valid robots.txt even on error
    return new Response(DEFAULT_ROBOTS, {
      status: 200,
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
});
