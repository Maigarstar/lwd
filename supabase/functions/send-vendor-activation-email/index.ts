// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: send-vendor-activation-email
// ═══════════════════════════════════════════════════════════════════════════
// Sends onboarding email with activation link to new vendor accounts.
// Called by: create-vendor-account edge function.
// Uses: Resend API (consistent with the rest of the platform).
//
// MIGRATED from SendGrid → Resend (March 2026).
// SendGrid had unverified sender domain + wrong key format.
// Resend is already set up for event booking confirmations + notifications.
//
// Request body: { email, vendorName, activationToken }
// Response:     { success: true } | { error: string }
//
// Env secrets (Supabase dashboard → Project Settings → Edge Functions):
//   RESEND_API_KEY       — Resend API key (re_*)
//   RESEND_FROM_EMAIL    — verified sender (default: noreply@luxuryweddingdirectory.com)
//   SITE_URL             — base URL (default: https://luxuryweddingdirectory.com)
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] || c)
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405);

  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@luxuryweddingdirectory.com';
    const SITE_URL   = Deno.env.get('SITE_URL')          || 'https://luxuryweddingdirectory.com';

    if (!RESEND_KEY) {
      console.error('[activation-email] RESEND_API_KEY not configured');
      return json({ error: 'Email service not configured' }, 500);
    }

    const { email, vendorName, activationToken } = await req.json();

    if (!email || !vendorName || !activationToken) {
      return json({ error: 'Missing required fields: email, vendorName, activationToken' }, 400);
    }

    const activationLink = `${SITE_URL}/vendor/activate?token=${encodeURIComponent(activationToken)}`;
    const html = buildEmailHTML(vendorName, activationLink, email);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `Luxury Wedding Directory <${FROM_EMAIL}>`,
        to:      [email],
        subject: 'Welcome to Luxury Wedding Directory — Set Your Password',
        html,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[activation-email] Resend error (${res.status}):`, errorBody);
      throw new Error(`Email delivery failed: ${res.status}`);
    }

    return json({ success: true, message: 'Activation email sent successfully' });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[activation-email] fatal:', message);
    return json({ error: message }, 500);
  }
});

function buildEmailHTML(vendorName: string, activationLink: string, email: string): string {
  const name = escapeHtml(vendorName);
  const link = escapeHtml(activationLink);
  const addr = escapeHtml(email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a00,#2a1200);padding:40px 40px 36px;border-radius:8px 8px 0 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;">Luxury Wedding Directory</p>
            <h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:1px;color:#f5f0e8;">Welcome to the platform</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">Dear <strong>${name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;">
              Thank you for joining Luxury Wedding Directory. Your venue account has been created and is ready to go.
              Click the button below to set your password and access your dashboard.
            </p>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:32px auto;">
              <tr>
                <td style="background:#c9a96e;border-radius:4px;">
                  <a href="${link}"
                     style="display:inline-block;padding:16px 40px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a0a00;text-decoration:none;">
                    Set Your Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#888;">Or paste this link directly into your browser:</p>
            <p style="margin:0 0 32px;font-size:12px;color:#c9a96e;word-break:break-all;">${link}</p>

            <hr style="border:none;border-top:1px solid #e8e4dd;margin:32px 0;">

            <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1a1a1a;">What happens next:</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#555;font-size:14px;line-height:2;">
              <li>Set your secure password</li>
              <li>Log in to your venue dashboard</li>
              <li>Complete your profile to start receiving enquiries</li>
            </ul>

            <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.6;">
              This link expires in <strong>7 days</strong>. After that, contact your account manager for a new invitation.
            </p>

            <p style="margin:0 0 0;font-size:14px;color:#555;">
              Questions? Contact us at
              <a href="mailto:support@luxuryweddingdirectory.com" style="color:#c9a96e;text-decoration:none;">support@luxuryweddingdirectory.com</a>
            </p>

            <p style="margin:32px 0 0;font-size:14px;color:#1a1a1a;">
              Best regards,<br>
              <strong>The Luxury Wedding Directory Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f0ece5;padding:20px 40px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#999;line-height:1.7;">
              © 2026 Luxury Wedding Directory · All rights reserved<br>
              This email was sent to <strong>${addr}</strong> as part of your vendor account registration.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
