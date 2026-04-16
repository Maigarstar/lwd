// supabase/functions/scheduled-publish/index.ts
// Runs on a cron schedule (every 5 minutes via Supabase scheduled functions).
// Handles two separate publish pipelines:
//   1. magazine_posts (articles) — scheduled_date field
//   2. magazine_issues (PDF magazine issues) — scheduled_publish_at field
//
// Deploy: supabase functions deploy scheduled-publish --no-verify-jwt
//
// Schedule (Supabase dashboard → Edge Functions → Schedules):
//   cron: "*/5 * * * *"  (every 5 minutes)
//
// Optional: protect external POST calls with CRON_SECRET env var.
//   Authorization: Bearer <CRON_SECRET>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Optional bearer token protection for external callers
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("Authorization") || "";
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const now = new Date().toISOString();

    // ── 1. Publish due articles (magazine_posts) ─────────────────────────────
    let articlesPublished = 0;
    let articlesData: { id: string; slug: string; title: string }[] = [];

    const { data: dueArticles, error: articleFetchErr } = await sb
      .from("magazine_posts")
      .select("id, slug, title, scheduled_date")
      .eq("published", false)
      .not("scheduled_date", "is", null)
      .lte("scheduled_date", now);

    if (articleFetchErr) {
      console.error("[scheduled-publish] articles fetch error:", articleFetchErr);
    } else if (dueArticles && dueArticles.length > 0) {
      const ids = dueArticles.map((p: { id: string }) => p.id);
      const { error: articleUpdateErr } = await sb
        .from("magazine_posts")
        .update({
          published:    true,
          published_at: now,
          updated_at:   now,
        })
        .in("id", ids);

      if (articleUpdateErr) {
        console.error("[scheduled-publish] articles update error:", articleUpdateErr);
      } else {
        articlesPublished = dueArticles.length;
        articlesData = dueArticles.map((p: { id: string; slug: string; title: string }) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
        }));
        console.log(`[scheduled-publish] Published ${articlesPublished} article(s):`, articlesData.map(a => a.slug));
      }
    }

    // ── 2. Publish due magazine issues ───────────────────────────────────────
    let issuesPublished = 0;
    let issuesData: { id: string; slug: string; title: string }[] = [];

    const { data: dueIssues, error: issueFetchErr } = await sb
      .from("magazine_issues")
      .select("id, slug, title, scheduled_publish_at")
      .eq("status", "draft")
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", now);

    if (issueFetchErr) {
      console.error("[scheduled-publish] issues fetch error:", issueFetchErr);
    } else if (dueIssues && dueIssues.length > 0) {
      const ids = dueIssues.map((i: { id: string }) => i.id);

      const { error: issueUpdateErr } = await sb
        .from("magazine_issues")
        .update({
          status:               "published",
          published_at:         now,
          slug_locked:          true,           // Lock slug on first publish
          scheduled_publish_at: null,           // Clear the schedule
          updated_at:           now,
        })
        .in("id", ids);

      if (issueUpdateErr) {
        console.error("[scheduled-publish] issues update error:", issueUpdateErr);
      } else {
        issuesPublished = dueIssues.length;
        issuesData = dueIssues.map((i: { id: string; slug: string; title: string }) => ({
          id: i.id,
          slug: i.slug,
          title: i.title,
        }));
        console.log(`[scheduled-publish] Published ${issuesPublished} magazine issue(s):`, issuesData.map(i => i.slug));
      }
    }

    // ── Response ─────────────────────────────────────────────────────────────
    const totalPublished = articlesPublished + issuesPublished;

    if (totalPublished === 0) {
      return new Response(
        JSON.stringify({ published: 0, message: "Nothing due" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        published: totalPublished,
        articles:  { count: articlesPublished, items: articlesData },
        issues:    { count: issuesPublished,   items: issuesData   },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[scheduled-publish] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
