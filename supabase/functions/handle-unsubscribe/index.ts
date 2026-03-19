// =========================================================================
// Supabase Edge Function: handle-unsubscribe
// =========================================================================
//
// GET ?e={base64(email)} - Unsubscribes the email and returns an HTML page.
// Adds to email_suppressions table so future campaigns skip this email.
// Also marks newsletter_subscribers status as 'unsubscribed' if present.
//
// =========================================================================

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const htmlPage = (email: string, success: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Unsubscribed" : "Already unsubscribed"} - Luxury Wedding Directory</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #fafaf8; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border: 1px solid #ede8de; border-radius: 12px; padding: 48px; max-width: 480px; width: 100%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; color: #171717; margin-bottom: 12px; font-weight: 600; }
    p { font-size: 15px; color: #666; line-height: 1.7; margin-bottom: 8px; }
    .email { font-weight: 600; color: #171717; }
    .back { display: inline-block; margin-top: 28px; color: #8f7420; text-decoration: none; font-size: 14px; border-bottom: 1px solid rgba(143,116,32,0.3); padding-bottom: 2px; }
    .back:hover { color: #6b5618; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✓" : "ℹ"}</div>
    <h1>${success ? "You have been unsubscribed" : "Already unsubscribed"}</h1>
    <p>The email address <span class="email">${email}</span> has been removed from our outreach list.</p>
    <p>You will no longer receive sales or marketing emails from Luxury Wedding Directory.</p>
    <a href="https://luxuryweddingdirectory.co.uk" class="back">Return to Luxury Wedding Directory</a>
  </div>
</body>
</html>`;

Deno.serve(async (req: Request) => {
  const url      = new URL(req.url);
  const encoded  = url.searchParams.get("e") || "";

  let email = "";
  try {
    email = atob(encoded).toLowerCase().trim();
  } catch {
    return new Response("Invalid unsubscribe link.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  if (!email || !email.includes("@")) {
    return new Response("Invalid unsubscribe link.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  let success = false;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const headers = {
      "Content-Type":  "application/json",
      "apikey":         SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer":        "resolution=merge-duplicates",
    };

    // Add to suppression list (upsert - idempotent)
    await fetch(`${SUPABASE_URL}/rest/v1/email_suppressions`, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ email, reason: "unsubscribed", source: "email_link" }),
    }).catch(() => {});

    // Update newsletter_subscribers if present
    await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, {
      method:  "PATCH",
      headers,
      body:    JSON.stringify({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }),
    }).catch(() => {});

    success = true;
  }

  return new Response(htmlPage(email, success), {
    status: 200,
    headers: {
      "Content-Type":  "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});
