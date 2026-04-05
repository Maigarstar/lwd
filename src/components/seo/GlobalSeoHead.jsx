// src/components/seo/GlobalSeoHead.jsx
// Injects site-wide <head> tags that don't belong to any single page:
//   • RSS <link rel="alternate"> tags (main feed + per-category)
//   • Google Search Console verification meta
//   • Bing Webmaster Tools verification meta
//
// Mounts once at the App root level. Uses react-helmet-async.
// Verification codes are loaded from platform_settings on first mount.

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../lib/supabaseClient";

const SITE_URL = "https://www.luxuryweddingdirectory.co.uk";

// RSS feeds — hardcoded (stable, no DB lookup needed)
const RSS_FEEDS = [
  { title: "LWD Magazine",               href: `${SITE_URL}/feed.xml` },
  { title: "LWD — Destinations",         href: `${SITE_URL}/magazine/destinations/feed.xml` },
  { title: "LWD — Real Weddings",        href: `${SITE_URL}/magazine/real-weddings/feed.xml` },
  { title: "LWD — Venues",               href: `${SITE_URL}/magazine/venues/feed.xml` },
  { title: "LWD — Style & Beauty",       href: `${SITE_URL}/magazine/style-beauty/feed.xml` },
  { title: "LWD — Planning Intelligence",href: `${SITE_URL}/magazine/planning/feed.xml` },
  { title: "LWD — Food & Drink",         href: `${SITE_URL}/magazine/food-drink/feed.xml` },
];

export default function GlobalSeoHead() {
  const [googleCode, setGoogleCode] = useState("");
  const [bingCode,   setBingCode]   = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["seo_google_verification", "seo_bing_verification"]);

      (data || []).forEach(row => {
        if (row.key === "seo_google_verification") setGoogleCode(row.value || "");
        if (row.key === "seo_bing_verification")   setBingCode(row.value || "");
      });
    }
    load();
  }, []);

  return (
    <Helmet>
      {/* ── RSS auto-discovery ─────────────────────────────────────────── */}
      {RSS_FEEDS.map(feed => (
        <link
          key={feed.href}
          rel="alternate"
          type="application/rss+xml"
          title={feed.title}
          href={feed.href}
        />
      ))}

      {/* ── Search console verification ───────────────────────────────── */}
      {googleCode && (
        <meta name="google-site-verification" content={googleCode} />
      )}
      {bingCode && (
        <meta name="msvalidate.01" content={bingCode} />
      )}
    </Helmet>
  );
}
