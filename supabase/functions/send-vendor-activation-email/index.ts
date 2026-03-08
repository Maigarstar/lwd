// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: Send Vendor Activation Email
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Send professional onboarding email with activation link to vendors
// Called by: create-vendor-account function
// Uses: SendGrid API for email delivery
//
// Request body:
//   {
//     email: string,
//     vendorName: string,
//     activationToken: string
//   }
//
// Response: { success: true } or { error: string }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL =
  Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@luxuryweddingdirectory.com";
const SITE_URL = Deno.env.get("SITE_URL") || "https://luxuryweddingdirectory.com";

// CORS headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface ActivationEmailRequest {
  email: string;
  vendorName: string;
  activationToken: string;
}

// Helper function to create JSON responses with CORS headers
function corsResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Parse request body
    const { email, vendorName, activationToken }: ActivationEmailRequest =
      await req.json();

    // Validate required fields
    if (!email || !vendorName || !activationToken) {
      return corsResponse(
        { error: "Missing required fields: email, vendorName, activationToken" },
        400
      );
    }

    // Validate SendGrid configuration
    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not configured");
      return corsResponse({ error: "Email service not configured" }, 500);
    }

    // Build activation link
    const activationLink = `${SITE_URL}/vendor/activate?token=${encodeURIComponent(activationToken)}`;

    // Build professional HTML email template
    const htmlContent = buildActivationEmailHTML(vendorName, activationLink);

    // Send via SendGrid
    const sendgridResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email }],
              subject: "Welcome to Luxury Wedding Directory - Set Your Password",
            },
          ],
          from: {
            email: SENDGRID_FROM_EMAIL,
            name: "Luxury Wedding Directory",
          },
          content: [
            {
              type: "text/html",
              value: htmlContent,
            },
          ],
          reply_to: {
            email: "support@luxuryweddingdirectory.com",
            name: "Support",
          },
        }),
      }
    );

    // Check for SendGrid errors
    if (!sendgridResponse.ok) {
      const error = await sendgridResponse.text();
      console.error(`SendGrid error (${sendgridResponse.status}):`, error);
      throw new Error(
        `SendGrid error: ${sendgridResponse.status} - ${error.substring(0, 200)}`
      );
    }

    // Success response
    return corsResponse({
      success: true,
      message: "Activation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending vendor activation email:", error);
    return corsResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Build professional HTML email template for vendor activation
 */
function buildActivationEmailHTML(
  vendorName: string,
  activationLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a0a00, #2a1200); color: #c9a84c; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; }
    .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 8px 8px; }
    .content p { margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background: #c9a84c; color: #1a0a00; padding: 16px 40px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 30px 0; }
    .cta-button:hover { background: #d4b35a; }
    .link-text { color: #c9a84c; font-weight: 600; word-break: break-all; }
    .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    .divider { border-top: 1px solid #ddd; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Welcome to Luxury Wedding Directory</h1>
    </div>

    <!-- Main Content -->
    <div class="content">
      <p>Dear <strong>${escapeHtml(vendorName)}</strong>,</p>

      <p>Thank you for joining Luxury Wedding Directory! We're delighted to have your venue on our platform.</p>

      <p>To complete your account setup and access your vendor dashboard, please click the button below to set your password:</p>

      <div style="text-align: center;">
        <a href="${escapeHtml(activationLink)}" class="cta-button">Set Your Password</a>
      </div>

      <p style="color: #666; font-size: 13px;">
        Or copy and paste this link in your browser:<br>
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

      <p>
        <strong>Account activation link expires in 7 days.</strong>
        If you don't activate within this period, you can request a new invitation link.
      </p>

      <p>
        If you have any questions or need assistance, please contact our support team at
        <a href="mailto:support@luxuryweddingdirectory.com">support@luxuryweddingdirectory.com</a>
      </p>

      <p>Best regards,<br><strong>The Luxury Wedding Directory Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2026 Luxury Wedding Directory. All rights reserved.</p>
      <p>This email was sent to <strong>${escapeHtml(email)}</strong> as part of your vendor account registration.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Simple HTML escape function for security
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
