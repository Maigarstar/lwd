// approve-vendor-application/index.ts
// Called by admin when approving a listing application.
// Flow:
//  1. Validate application exists + is not already approved
//  2. Create vendor record in public.vendors
//  3. Invite user via Supabase auth (generateLink type: "invite")
//  4. Send branded welcome email via Resend with magic link
//  5. Update application: status=approved, vendor_id, approved_at
//  6. Return vendor_id + invite link

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL       = Deno.env.get("RESEND_FROM_EMAIL") || "welcome@luxuryweddingdirectory.com";
const SITE_URL         = Deno.env.get("SITE_URL") || "https://luxuryweddingdirectory.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildWelcomeEmail(opts: {
  firstName: string;
  businessName: string;
  category: string;
  inviteUrl: string;
}): string {
  const { firstName, businessName, category, inviteUrl } = opts;

  const steps = [
    ["1", "Set up your account", "Click the button below to create your password and access your vendor dashboard."],
    ["2", "Complete your listing", "Add your photography, story, pricing signals, and key details."],
    ["3", "Go live", "Once your listing is complete, our team will review and publish it."],
  ];

  const stepsHtml = steps.map(([num, title, desc]) => `
    <div style="display:table;width:100%;margin-bottom:20px;">
      <div style="display:table-cell;width:44px;vertical-align:top;">
        <div style="width:28px;height:28px;border-radius:50%;background:#faf7f0;border:1px solid #e8dfc8;font-size:11px;font-weight:bold;color:#C9A84C;text-align:center;line-height:28px;">
          ${num}
        </div>
      </div>
      <div style="display:table-cell;vertical-align:top;">
        <div style="font-size:13px;font-weight:bold;color:#1a1a1a;margin-bottom:4px;">${title}</div>
        <div style="font-size:12px;color:#666;line-height:1.6;">${desc}</div>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Welcome to Luxury Wedding Directory</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Gold top border -->
  <tr><td style="background:linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C);height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- Header -->
  <tr><td style="padding:40px 48px 28px;">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;margin-bottom:12px;">
      ✦ LUXURY WEDDING DIRECTORY
    </div>
    <div style="font-size:28px;font-weight:bold;color:#1a1a1a;line-height:1.2;margin-bottom:8px;">
      You've been accepted.
    </div>
    <div style="font-size:15px;color:#666;line-height:1.6;">
      Welcome to the most discerning wedding directory in the world.
    </div>
  </td></tr>

  <!-- Personalised greeting -->
  <tr><td style="padding:0 48px 28px;">
    <div style="font-size:14px;color:#1a1a1a;line-height:1.8;">
      Dear ${firstName},
    </div>
    <br/>
    <div style="font-size:14px;color:#444;line-height:1.8;">
      We're delighted to confirm that <strong>${businessName}</strong> has been approved to join
      Luxury Wedding Directory as a listed ${category}.
    </div>
    <br/>
    <div style="font-size:14px;color:#444;line-height:1.8;">
      Your listing will connect you with couples planning exceptional weddings — couples
      who value quality, authenticity, and expertise above all else.
    </div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 48px;">
    <div style="border-top:1px solid #f0ece4;"></div>
  </td></tr>

  <!-- What happens next -->
  <tr><td style="padding:28px 48px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:16px;">
      Your next steps
    </div>
    ${stepsHtml}
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:0 48px 36px;text-align:center;">
    <a href="${inviteUrl}" style="display:inline-block;background:#C9A84C;color:#000;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px;">
      Access Your Dashboard &rarr;
    </a>
    <div style="font-size:10px;color:#aaa;margin-top:12px;">
      This link expires in 24 hours. If you have any questions, reply to this email.
    </div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 48px;">
    <div style="border-top:1px solid #f0ece4;"></div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 48px;">
    <div style="font-size:10px;letter-spacing:1px;color:#C9A84C;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">
      ✦ LUXURY WEDDING DIRECTORY
    </div>
    <div style="font-size:11px;color:#aaa;line-height:1.6;">
      The world's most discerning wedding directory.<br/>
      <a href="${SITE_URL}" style="color:#aaa;">${SITE_URL.replace("https://", "")}</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: {
    application_id: string;
    approved_by?: string;
    tier?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { application_id, approved_by = "Admin", tier = "standard" } = body;

  if (!application_id) {
    return new Response(JSON.stringify({ error: "application_id required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 1. Load application ──────────────────────────────────────────────────
  const { data: app, error: appErr } = await supabase
    .from("listing_applications")
    .select("*")
    .eq("id", application_id)
    .single();

  if (appErr || !app) {
    return new Response(JSON.stringify({ error: "Application not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (app.status === "approved") {
    return new Response(
      JSON.stringify({ error: "Already approved", vendor_id: app.vendor_id }),
      { status: 409, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── 2. Create vendor record ──────────────────────────────────────────────
  const { data: vendor, error: vendorErr } = await supabase
    .from("vendors")
    .insert({
      name:               app.business_name,
      email:              app.email,
      entity_type:        app.category?.toLowerCase() || "venue",
      application_id:     application_id,
      onboarding_status:  "invited",
      analytics_enabled:  false,
      tier,
      invited_at:         new Date().toISOString(),
    })
    .select("id")
    .single();

  if (vendorErr || !vendor) {
    return new Response(
      JSON.stringify({ error: "Failed to create vendor", detail: vendorErr?.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── 3. Generate Supabase invite link ─────────────────────────────────────
  const { data: inviteData, error: inviteErr } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: app.email,
    options: {
      redirectTo: `${SITE_URL}/vendor/dashboard`,
      data: {
        vendor_id:     vendor.id,
        business_name: app.business_name,
        role:          "vendor",
      },
    },
  });

  if (inviteErr) {
    console.error("Invite generation error:", inviteErr.message);
  }

  const inviteUrl = inviteData?.properties?.action_link || `${SITE_URL}/vendor/setup`;

  // ── 4. Send welcome email via Resend ─────────────────────────────────────
  const firstName = (app.contact_name || app.business_name).split(" ")[0];
  const emailHtml = buildWelcomeEmail({
    firstName,
    businessName: app.business_name,
    category:     app.category || "venue",
    inviteUrl,
  });

  let emailSent = false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      app.email,
        subject: `You've been accepted — Welcome to Luxury Wedding Directory`,
        html:    emailHtml,
      }),
    });
    emailSent = res.ok;
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", res.status, errBody);
    }
  } catch (e) {
    console.error("Email send exception:", e);
    // email failure is non-fatal — vendor account is still created
  }

  // ── 5. Update application ────────────────────────────────────────────────
  await supabase
    .from("listing_applications")
    .update({
      status:      "approved",
      vendor_id:   vendor.id,
      approved_at: new Date().toISOString(),
      approved_by,
    })
    .eq("id", application_id);

  return new Response(
    JSON.stringify({
      success:    true,
      vendor_id:  vendor.id,
      invite_url: inviteUrl,
      email_sent: emailSent,
    }),
    {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
});
