// ─── supabase/functions/audit-website/index.ts ───────────────────────────────
// Fetches a URL and extracts real SEO signals from the raw HTML.
// Computes a weighted authority score 0-100.
// Deploy: supabase functions deploy audit-website --no-verify-jwt
//
// Request body: { url: string }
// Response:     { score, findings, url } | { error, score: 0 }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth",
};

// ── Score weights (must total 100) ───────────────────────────────────────────
const WEIGHTS: Record<string, number> = {
  title:       15,
  description: 15,
  schema:      15,
  h1:          10,
  og:          10,
  https:       10,
  viewport:     5,
  canonical:    5,
  sitemap:      5,
  robots:       5,
  images:       5,
};

// ── HTML extraction helpers ──────────────────────────────────────────────────

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractOg(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? "";
}

function extractH1s(html: string): string[] {
  const matches = [...html.matchAll(/<h1[^>]*>([^<]*(?:<(?!\/h1>)[^<]*)*)<\/h1>/gi)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
}

function extractCanonical(html: string): string {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
         ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m?.[1]?.trim() ?? "";
}

function hasViewport(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

function extractRobots(html: string): string {
  return extractMeta(html, "robots");
}

function extractJsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const obj = JSON.parse(s[1]);
      const arr = Array.isArray(obj) ? obj : [obj];
      for (const item of arr) {
        if (item["@type"]) types.push(String(item["@type"]));
      }
    } catch { /* ignore malformed JSON-LD */ }
  }
  return types;
}

function extractImages(html: string): { total: number; withAlt: number } {
  const imgs = [...html.matchAll(/<img[^>]+>/gi)];
  const total = imgs.length;
  const withAlt = imgs.filter(m => /alt=["'][^"']+["']/i.test(m[0])).length;
  return { total, withAlt };
}

// ── Score computation ────────────────────────────────────────────────────────

interface Findings {
  title:       { value: string; length: number; ok: boolean };
  description: { value: string; length: number; ok: boolean };
  h1:          { count: number; firstValue: string; ok: boolean };
  canonical:   { value: string; present: boolean };
  robots:      { value: string; noindex: boolean; ok: boolean };
  viewport:    { present: boolean };
  schema:      { present: boolean; types: string[] };
  og:          { title: string; description: string; image: string; complete: boolean };
  https:       { ok: boolean };
  images:      { total: number; withAlt: number; ratio: number; ok: boolean };
  sitemap:     { found: boolean };
}

function computeScore(findings: Findings): number {
  let score = 0;

  if (findings.title.ok)       score += WEIGHTS.title;
  if (findings.description.ok) score += WEIGHTS.description;
  if (findings.schema.present) score += WEIGHTS.schema;
  if (findings.h1.ok)          score += WEIGHTS.h1;
  if (findings.og.complete)    score += WEIGHTS.og;
  if (findings.https.ok)       score += WEIGHTS.https;
  if (findings.viewport.present) score += WEIGHTS.viewport;
  if (findings.canonical.present) score += WEIGHTS.canonical;
  if (findings.sitemap.found)  score += WEIGHTS.sitemap;
  if (findings.robots.ok)      score += WEIGHTS.robots;
  if (findings.images.ok)      score += WEIGHTS.images;

  return Math.min(100, Math.max(0, score));
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "url is required", score: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Normalise URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;
    const origin = new URL(targetUrl).origin;
    const isHttps = targetUrl.startsWith("https://");

    // ── Fetch page HTML ──────────────────────────────────────────────────────
    let html = "";
    let fetchError: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":      "LWD-Bot/1.0 (+https://www.luxuryweddingdirectory.co.uk)",
          "Accept":          "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);
      html = await res.text();
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
    }

    if (fetchError || !html) {
      return new Response(
        JSON.stringify({ error: fetchError ?? "Empty response", score: 0, url: targetUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Extract sitemap (parallel, short timeout) ────────────────────────────
    let sitemapFound = false;
    const sitemapUrls = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
    ];
    try {
      for (const sitemapUrl of sitemapUrls) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const sRes = await fetch(sitemapUrl, { signal: ctrl.signal, method: "HEAD" });
        clearTimeout(t);
        if (sRes.ok) { sitemapFound = true; break; }
      }
    } catch { /* sitemap check is best-effort */ }

    // ── Build findings ───────────────────────────────────────────────────────
    const titleVal   = extractTitle(html);
    const descVal    = extractMeta(html, "description");
    const h1s        = extractH1s(html);
    const robotsVal  = extractRobots(html);
    const schemaTypes = extractJsonLdTypes(html);
    const imgs       = extractImages(html);
    const imgRatio   = imgs.total > 0 ? imgs.withAlt / imgs.total : 1;

    const ogTitle = extractOg(html, "title");
    const ogDesc  = extractOg(html, "description");
    const ogImage = extractOg(html, "image");

    const findings: Findings = {
      title: {
        value:  titleVal,
        length: titleVal.length,
        ok:     titleVal.length >= 40 && titleVal.length <= 65,
      },
      description: {
        value:  descVal,
        length: descVal.length,
        ok:     descVal.length >= 120 && descVal.length <= 160,
      },
      h1: {
        count:      h1s.length,
        firstValue: h1s[0] ?? "",
        ok:         h1s.length === 1,
      },
      canonical: {
        value:   extractCanonical(html),
        present: !!extractCanonical(html),
      },
      robots: {
        value:   robotsVal,
        noindex: /noindex/i.test(robotsVal),
        ok:      !/noindex/i.test(robotsVal),
      },
      viewport: {
        present: hasViewport(html),
      },
      schema: {
        present: schemaTypes.length > 0,
        types:   schemaTypes,
      },
      og: {
        title:       ogTitle,
        description: ogDesc,
        image:       ogImage,
        complete:    !!(ogTitle && ogDesc && ogImage),
      },
      https: {
        ok: isHttps,
      },
      images: {
        total:   imgs.total,
        withAlt: imgs.withAlt,
        ratio:   Math.round(imgRatio * 100) / 100,
        ok:      imgRatio >= 0.8 || imgs.total === 0,
      },
      sitemap: {
        found: sitemapFound,
      },
    };

    const score = computeScore(findings);

    return new Response(
      JSON.stringify({ score, findings, url: targetUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, score: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
