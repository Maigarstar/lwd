// supabase/functions/magazine-og-image/index.ts
// Dynamic OG image redirect for magazine issues + pages.
// When someone shares /publications/[slug]?page=5, social crawlers
// hit this function and are redirected to the page's thumbnail.
//
// Deploy: supabase functions deploy magazine-og-image --no-verify-jwt
//
// Usage:
//   GET /functions/v1/magazine-og-image?slug=issue-01-spring-2026
//   GET /functions/v1/magazine-og-image?slug=issue-01-spring-2026&page=5
//
// Response: 301 redirect → image URL
//           302 redirect → /og-default.jpg if issue not found

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FALLBACK_OG = "https://luxuryweddingdirectory.com/og-default.jpg";

Deno.serve(async (req) => {
  const url     = new URL(req.url);
  const slug    = url.searchParams.get("slug");
  const pageNum = parseInt(url.searchParams.get("page") || "0", 10);

  // No slug → immediate fallback
  if (!slug) {
    return Response.redirect(FALLBACK_OG, 302);
  }

  // ── Supabase client (service role for published-only data) ─────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")    ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // ── Fetch published issue by slug ──────────────────────────────────────────
  const { data: issue, error: issErr } = await supabase
    .from("magazine_issues")
    .select("id, slug, cover_image, og_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (issErr || !issue) {
    return Response.redirect(FALLBACK_OG, 302);
  }

  // ── If page param, try to get that page's thumbnail ────────────────────────
  if (pageNum > 0) {
    const { data: page } = await supabase
      .from("magazine_issue_pages")
      .select("thumbnail_url, image_url")
      .eq("issue_id", issue.id)
      .eq("page_number", pageNum)
      .single();

    if (page) {
      const pageImage = page.thumbnail_url || page.image_url;
      if (pageImage) {
        return Response.redirect(pageImage, 301);
      }
    }
  }

  // ── Fallback: issue-level OG image or cover ────────────────────────────────
  const issueImage = issue.og_image_url || issue.cover_image;
  if (issueImage) {
    return Response.redirect(issueImage, 301);
  }

  // ── Nothing found → default OG ────────────────────────────────────────────
  return Response.redirect(FALLBACK_OG, 302);
});
