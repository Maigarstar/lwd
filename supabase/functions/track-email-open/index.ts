// =========================================================================
// Supabase Edge Function: track-email-open
// =========================================================================
//
// Purpose: Email open tracking pixel.
//   GET ?id={outreach_email_id}
//   - Sets opened_at (first open only) and increments open_count via RPC
//   - Returns 1x1 transparent GIF immediately; DB update is best-effort
//
// Note: Open tracking is approximate. Some clients preload or block pixels.
// open_count and opened_at are directional signals only.
// reply_rate remains the primary hard engagement metric.
//
// =========================================================================

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// 1x1 transparent GIF (base64)
const PIXEL_B64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const GIF = b64ToBytes(PIXEL_B64);

const PIXEL_HEADERS = {
  "Content-Type":  "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma":        "no-cache",
  "Access-Control-Allow-Origin": "*",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const id = new URL(req.url).searchParams.get("id");

  // Best-effort DB update - use fetch directly to avoid heavy supabase-js import
  if (id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/track_email_open`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email_id: id }),
    }).catch(() => {
      // Silently ignore - pixel delivery must never fail
    });
  }

  return new Response(GIF, { status: 200, headers: PIXEL_HEADERS });
});
