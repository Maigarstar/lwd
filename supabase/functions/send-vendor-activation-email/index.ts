// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: Send Vendor Activation Email
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Send professional onboarding email with activation link to vendors
// Called by: create-vendor-account function
// Uses: Resend API (same provider as send-email — single verified domain)
//
// Request body:
//   { email: string, vendorName: string, activationToken: string }
//
// Response: { success: true } or { error: string }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL     = "noreply@luxuryweddingdirectory.com";
const FROM_NAME      = "Luxury Wedding Directory";
const SITE_URL       = Deno.env.get("SITE_URL") || "https://luxuryweddingdirectory.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

interface ActivationEmailRequest {
  email: string;
  vendorName: string;
  activationToken: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")   return json({ error: "Method not allowed" }, 405);

  try {
    const { email, vendorName, activationToken }: ActivationEmailRequest = await req.json();

    if (!email || !vendorName || !activationToken) {
      return json({ error: "Missing required fields: email, vendorName, activationToken" }, 400);
    }

    if (!RESEND_API_KEY) {
      console.error("[send-vendor-activation-email] RESEND_API_KEY not configured");
      return json({ error: "Email service not configured" }, 500);
    }

    const activationLink = `${SITE_URL}/vendor/activate?token=${encodeURIComponent(activationToken)}`;
    const html = buildActivationEmailHTML(vendorName, activationLink, email);

    console.log("[send-vendor-activation-email] sending to:", email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:     `${FROM_NAME} <${FROM_EMAIL}>`,
        to:       [email],
        reply_to: "support@luxuryweddingdirectory.com",
        subject:  "Welcome to Luxury Wedding Directory — Set Your Password",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[send-vendor-activation-email] Resend error (${res.status}):`, err);
      throw new Error(`Resend error: ${res.status} — ${err.substring(0, 200)}`);
    }

    const result = await res.json();
    console.log("[send-vendor-activation-email] sent, id:", result?.id);

    return json({ success: true, message: "Activation email sent successfully" });

  } catch (error) {
    console.error("[send-vendor-activation-email] unhandled error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// ── Email template ────────────────────────────────────────────────────────────

function buildActivationEmailHTML(
  vendorName: string,
  activationLink: string,
  email: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a0a00, #2a1200); color: #c9a84c; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; }
    .content { background: #f9f9f9; padding: 40px; }
    .content p { margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background: #c9a84c; color: #1a0a00; padding: 16px 40px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 30px 0; }
    .link-text { color: #c9a84c; font-weight: 600; word-break: break-all; }
    .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    .divider { border-top: 1px solid #ddd; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Luxury Wedding Directory</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${escapeHtml(vendorName)}</strong>,</p>
      <p>Thank you for joining Luxury Wedding Directory! We're delighted to have your venue on our platform.</p>
      <p>To complete your account setup and access your vendor dashboard, please click the button below to set your password:</p>
      <div style="text-align: center;">
        <a href="${escapeHtml(activationLink)}" class="cta-button">Set Your Password</a>
      </div>
      <p style="color: #666; font-size: 13px;">
        Or copy and paste this link into your browser:<br>
        <span class="link-text">${escapeHtml(activationLink)}</span>
      </p>
      <div class="divider"></div>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Set your secure password</li>
        <li>Log in to your vendor dashboard</li>
        <li>Complete your venue profile</li>
        <li>Start receiving couple enquiries</li>
      </ul>
      <p><strong>Account activation link expires in 7 days.</strong> If you don't activate within this period, you can request a new invitation link.</p>
      <p>If you have any questions, contact us at <a href="mailto:support@luxuryweddingdirectory.com">support@luxuryweddingdirectory.com</a></p>
      <p>Best regards,<br><strong>The Luxury Wedding Directory Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2026 Luxury Wedding Directory. All rights reserved.</p>
      <p>This email was sent to <strong>${escapeHtml(email)}</strong> as part of your vendor account registration.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
