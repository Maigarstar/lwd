// supabase/functions/rss-magazine/index.ts
// RSS 2.0 feed for published magazine issues (print editions).
// Designed for Google Discover and Apple News indexing.
//
// Deploy: supabase functions deploy rss-magazine --no-verify-jwt
//
// Wire: /magazine-feed.xml → this function in hosting rewrites.
// Reference in <head>:
//   <link rel="alternate" type="application/rss+xml"
//         title="LWD — The Magazine" href="/magazine-feed.xml" />
//
// Cache: 1 hour (issues publish infrequently)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL    = "https://luxuryweddingdirectory.com";
const FEED_TITLE  = "Luxury Wedding Directory — The Magazine";
const FEED_DESC   = "Luxury editorial magazine for discerning couples planning exceptional weddings";
const FEED_LANG   = "en-GB";
const FEED_LIMIT  = 20;

// ── XML escape ─────────────────────────────────────────────────────────────────
function xe(s: string | number | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── RFC 822 date ───────────────────────────────────────────────────────────────
function rfcDate(iso: string | null | undefined): string {
  try {
    return new Date(iso || "").toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

// ── Build a single <item> ──────────────────────────────────────────────────────
interface Issue {
  id: string;
  slug: string;
  title: string;
  issue_number?: number | null;
  season?: string | null;
  year?: number | null;
  cover_image?: string | null;
  og_image_url?: string | null;
  pdf_url?: string | null;
  seo_description?: string | null;
  intro?: string | null;
  published_at?: string | null;
}

function buildItem(issue: Issue): string {
  const issueUrl  = `${SITE_URL}/publications/${xe(issue.slug)}`;
  const pubDate   = rfcDate(issue.published_at);
  const coverUrl  = issue.og_image_url || issue.cover_image;

  // Title: "Issue 01 — Spring 2026" or just the title if no issue_number
  const parts: string[] = [];
  if (issue.issue_number) parts.push(`Issue ${String(issue.issue_number).padStart(2, "0")}`);
  if (issue.season)       parts.push(issue.season);
  if (issue.year)         parts.push(String(issue.year));
  const displayTitle = issue.title || (parts.length ? parts.join(" — ") : "Untitled Issue");

  const description = xe(issue.seo_description || issue.intro || displayTitle);

  const mediaLine = coverUrl
    ? `      <media:content url="${xe(coverUrl)}" medium="image" />`
    : "";

  const enclosureLine = issue.pdf_url
    ? `      <enclosure url="${xe(issue.pdf_url)}" type="application/pdf" />`
    : "";

  return `
    <item>
      <title>${xe(displayTitle)}</title>
      <link>${issueUrl}</link>
      <guid isPermaLink="true">${issueUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
${mediaLine}
${enclosureLine}
    </item>`.replace(/\n{3,}/g, "\n");
}

// ── Main handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Handle OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")    ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // ── Fetch last N published issues ──────────────────────────────────────────
  const { data: issues, error } = await supabase
    .from("magazine_issues")
    .select("id, slug, title, issue_number, season, year, cover_image, og_image_url, pdf_url, seo_description, intro, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    return new Response("Error fetching issues", { status: 500 });
  }

  const items = (issues ?? []).map(buildItem).join("\n");

  const now = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xe(FEED_TITLE)}</title>
    <link>${SITE_URL}/publications</link>
    <description>${xe(FEED_DESC)}</description>
    <language>${FEED_LANG}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/magazine-feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>Luxury Wedding Directory</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type":                "application/rss+xml; charset=utf-8",
      "Cache-Control":               "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
