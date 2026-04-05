// supabase/functions/scheduled-publish/index.ts
// Runs on a cron schedule (every 5 minutes via pg_cron or Supabase scheduled functions).
// Finds articles whose scheduled_date has passed and publishes them.
//
// Deploy: supabase functions deploy scheduled-publish --no-verify-jwt
//
// Schedule (Supabase dashboard → Edge Functions → Schedules, or pg_cron):
//   cron: "*/5 * * * *"  (every 5 minutes)
//
// This endpoint also accepts manual POST calls from admin tooling.
// Protect with CRON_SECRET header if calling from external schedulers:
//   Authorization: Bearer <CRON_SECRET>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Allow both GET (from Supabase internal scheduler) and POST (manual trigger / external cron)
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

    // Find articles that are not yet published but whose scheduled_date has passed
    const { data: due, error: fetchErr } = await sb
      .from("magazine_posts")
      .select("id, slug, title, scheduled_date")
      .eq("published", false)
      .not("scheduled_date", "is", null)
      .lte("scheduled_date", now);

    if (fetchErr) throw fetchErr;

    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ published: 0, message: "Nothing due" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ids = due.map((p: { id: string }) => p.id);

    // Bulk-publish all due articles
    const { error: updateErr } = await sb
      .from("magazine_posts")
      .update({
        published:    true,
        published_at: now,
        updated_at:   now,
      })
      .in("id", ids);

    if (updateErr) throw updateErr;

    console.log(`[scheduled-publish] Published ${due.length} article(s):`, due.map((p: { slug: string }) => p.slug));

    return new Response(
      JSON.stringify({
        published: due.length,
        articles: due.map((p: { id: string; slug: string; title: string }) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[scheduled-publish] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
