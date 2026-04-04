// supabase/functions/generate-monthly-reports/index.ts
// Triggered: 1st of every month at 08:00 UTC via Supabase cron
// Purpose:
//   1. Loop all vendors with analytics_enabled = true
//   2. Query last month's stats via get_listing_stats RPC
//   3. Calculate touch points + media value + ROI estimate
//   4. Write row to vendor_monthly_snapshots
//   5. Build and send branded HTML email via Resend
//   6. Log send in vendor_report_sends

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL      = Deno.env.get("RESEND_FROM_EMAIL") || "reports@luxuryweddingdirectory.com";
const SITE_URL        = Deno.env.get("SITE_URL") || "https://luxuryweddingdirectory.com";

// Media value benchmarks (£ equivalent Google/Meta CPC per event)
const MEDIA_CPCs = {
  page_view:         { low: 8,   high: 15  },
  shortlist_add:     { low: 45,  high: 80  },
  compare_add:       { low: 60,  high: 100 },
  enquiry_submitted: { low: 180, high: 350 },
  outbound_click:    { low: 12,  high: 25  },
};

// Category/country default ROI assumptions (used if vendor hasn't set their own)
const CATEGORY_DEFAULTS: Record<string, Record<string, { value: number; rate: number }>> = {
  venue: {
    GB: { value: 18000, rate: 20 },
    IT: { value: 35000, rate: 18 },
    AE: { value: 45000, rate: 15 },
    FR: { value: 28000, rate: 18 },
    US: { value: 22000, rate: 22 },
    default: { value: 20000, rate: 20 },
  },
  photographer: { default: { value: 3500, rate: 30 } },
  planner:      { default: { value: 8000, rate: 25 } },
  florist:      { default: { value: 2500, rate: 35 } },
  caterer:      { default: { value: 6000, rate: 28 } },
  default:      { default: { value: 15000, rate: 20 } },
};

function getDefaults(entityType: string, countryCode: string) {
  const cat = CATEGORY_DEFAULTS[entityType] || CATEGORY_DEFAULTS.default;
  return cat[countryCode] || cat.default || { value: 15000, rate: 20 };
}

function calcMediaValue(stats: Record<string, number>) {
  const low =
    (stats.views || 0)             * MEDIA_CPCs.page_view.low +
    (stats.shortlists || 0)        * MEDIA_CPCs.shortlist_add.low +
    (stats.compares || 0)          * MEDIA_CPCs.compare_add.low +
    (stats.enquiry_submitted || 0) * MEDIA_CPCs.enquiry_submitted.low +
    (stats.outbound || 0)          * MEDIA_CPCs.outbound_click.low;

  const high =
    (stats.views || 0)             * MEDIA_CPCs.page_view.high +
    (stats.shortlists || 0)        * MEDIA_CPCs.shortlist_add.high +
    (stats.compares || 0)          * MEDIA_CPCs.compare_add.high +
    (stats.enquiry_submitted || 0) * MEDIA_CPCs.enquiry_submitted.high +
    (stats.outbound || 0)          * MEDIA_CPCs.outbound_click.high;

  return { low: Math.round(low), high: Math.round(high) };
}

function fmtGBP(n: number): string {
  if (n >= 1000) return `£${(n / 1000).toFixed(0)}k`;
  return `£${n.toLocaleString()}`;
}

function fmtMonthName(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function buildEmailHTML(opts: {
  vendorName: string;
  month: string;
  stats: Record<string, number>;
  touchPoints: number;
  mediaLow: number;
  mediaHigh: number;
  estRevLow: number;
  estRevHigh: number;
  roiMultiple: number | null;
  interpretation: string;
  dashboardUrl: string;
  outcomeUrlYes1: string;
  outcomeUrlYes2: string;
  outcomeUrlNo: string;
  trackingPixelUrl: string;
}): string {
  const {
    vendorName, month, stats, touchPoints,
    mediaLow, mediaHigh, estRevLow, estRevHigh, roiMultiple,
    interpretation, dashboardUrl,
    outcomeUrlYes1, outcomeUrlYes2, outcomeUrlNo,
    trackingPixelUrl,
  } = opts;

  const enquiries = stats.enquiry_submitted || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${month} Performance Report — ${vendorName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Gold top border -->
  <tr><td style="background:linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C);height:4px;"></td></tr>

  <!-- Header -->
  <tr><td style="padding:36px 40px 24px;">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;margin-bottom:8px;">
      ✦ LUXURY WEDDING DIRECTORY
    </div>
    <div style="font-size:26px;font-weight:bold;color:#1a1a1a;margin-bottom:4px;">
      ${month} Performance Report
    </div>
    <div style="font-size:14px;color:#888;">${vendorName}</div>
  </td></tr>

  <!-- Touch points headline -->
  <tr><td style="padding:0 40px 28px;">
    <div style="background:#faf7f0;border:1px solid #e8dfc8;border-radius:4px;padding:24px 28px;text-align:center;">
      <div style="font-size:48px;font-weight:bold;color:#C9A84C;line-height:1;">${touchPoints}</div>
      <div style="font-size:14px;color:#888;margin-top:6px;letter-spacing:0.5px;">
        total touch points with couples this month
      </div>
    </div>
  </td></tr>

  <!-- Key stats row -->
  <tr><td style="padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:0 8px;">
        <div style="font-size:28px;font-weight:bold;color:#1a1a1a;">${stats.views || 0}</div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-top:4px;">Profile Views</div>
      </td>
      <td align="center" style="padding:0 8px;border-left:1px solid #f0ece4;">
        <div style="font-size:28px;font-weight:bold;color:#C9A84C;">${stats.shortlists || 0}</div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-top:4px;">Shortlisted</div>
      </td>
      <td align="center" style="padding:0 8px;border-left:1px solid #f0ece4;">
        <div style="font-size:28px;font-weight:bold;color:#4ade80;">${enquiries}</div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-top:4px;">Enquiries</div>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid #f0ece4;"></div></td></tr>

  <!-- Interpretation line -->
  <tr><td style="padding:20px 40px;">
    <div style="border-left:3px solid #C9A84C;padding-left:16px;">
      <div style="font-size:15px;font-weight:bold;color:#1a1a1a;margin-bottom:4px;">${interpretation}</div>
    </div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid #f0ece4;"></div></td></tr>

  <!-- Media value + ROI -->
  <tr><td style="padding:24px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-right:20px;">
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:8px;">
          Equivalent Media Value
        </div>
        <div style="font-size:22px;font-weight:bold;color:#1a1a1a;">
          ${fmtGBP(mediaLow)}–${fmtGBP(mediaHigh)}
        </div>
        <div style="font-size:10px;color:#aaa;margin-top:4px;">
          What this traffic would cost in paid ads
        </div>
      </td>
      ${roiMultiple !== null && estRevHigh > 0 ? `
      <td style="padding-left:20px;border-left:1px solid #f0ece4;">
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:8px;">
          Estimated Revenue Impact
        </div>
        <div style="font-size:22px;font-weight:bold;color:#1a1a1a;">
          ${fmtGBP(estRevLow)}–${fmtGBP(estRevHigh)}
        </div>
        <div style="font-size:10px;color:#aaa;margin-top:4px;">
          Up to ${roiMultiple}× ROI · estimated range
        </div>
      </td>` : ""}
    </tr>
    </table>
  </td></tr>

  <!-- CTA: View report -->
  <tr><td style="padding:8px 40px 24px;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#C9A84C;color:#000;font-size:13px;font-weight:bold;letter-spacing:1px;text-decoration:none;padding:12px 28px;border-radius:2px;">
      VIEW FULL REPORT →
    </a>
  </td></tr>

  ${enquiries > 0 ? `
  <!-- Did this convert? -->
  <tr><td style="padding:0 40px 32px;">
    <div style="background:#faf7f0;border:1px solid #e8dfc8;border-radius:4px;padding:20px 24px;">
      <div style="font-size:13px;font-weight:bold;color:#1a1a1a;margin-bottom:6px;">
        Did any of your ${month} enquiries convert to bookings?
      </div>
      <div style="font-size:12px;color:#888;margin-bottom:16px;">
        Your answer helps us improve your ROI estimate over time.
      </div>
      <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:8px;">
          <a href="${outcomeUrlYes1}" style="display:inline-block;border:1px solid #4ade80;color:#2e7d52;font-size:11px;font-weight:bold;text-decoration:none;padding:8px 16px;border-radius:2px;">
            ✓ Yes — 1 booking
          </a>
        </td>
        <td style="padding-right:8px;">
          <a href="${outcomeUrlYes2}" style="display:inline-block;border:1px solid #4ade80;color:#2e7d52;font-size:11px;font-weight:bold;text-decoration:none;padding:8px 16px;border-radius:2px;">
            ✓ Yes — 2+ bookings
          </a>
        </td>
        <td>
          <a href="${outcomeUrlNo}" style="display:inline-block;border:1px solid #e0d8cc;color:#888;font-size:11px;font-weight:bold;text-decoration:none;padding:8px 16px;border-radius:2px;">
            Not yet
          </a>
        </td>
      </tr>
      </table>
    </div>
  </td></tr>` : ""}

  <!-- Footer -->
  <tr><td style="padding:24px 40px;border-top:1px solid #f0ece4;">
    <div style="display:flex;justify-content:space-between;">
      <div style="font-size:10px;letter-spacing:1px;color:#C9A84C;text-transform:uppercase;font-weight:bold;">
        ✦ LUXURY WEDDING DIRECTORY
      </div>
      <div style="font-size:10px;color:#aaa;">
        luxuryweddingdirectory.com
      </div>
    </div>
    <div style="font-size:10px;color:#aaa;margin-top:8px;">
      You're receiving this because you have an active listing on Luxury Wedding Directory.
      <a href="${SITE_URL}/vendor/dashboard" style="color:#aaa;">Manage preferences →</a>
    </div>
  </td></tr>

  <!-- Tracking pixel (1×1, records email open) -->
  <tr><td><img src="${trackingPixelUrl}" width="1" height="1" style="display:block;" /></td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  const data = await res.json();
  return data.id || null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  // Allow manual POST trigger or cron GET
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // Last month's date range
  const now       = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey   = monthStart.toISOString().slice(0, 10); // "2026-03-01"
  const monthName  = fmtMonthName(monthStart);

  // Get all analytics-enabled vendors
  const { data: vendors, error: vendorErr } = await supabase
    .from("vendors")
    .select("id, name, email, entity_type, country_code, avg_booking_value, est_close_rate, analytics_enabled")
    .eq("analytics_enabled", true);

  if (vendorErr || !vendors?.length) {
    return new Response(JSON.stringify({ error: vendorErr?.message || "no vendors" }), { status: 500 });
  }

  const results: { vendor_id: string; status: string; error?: string }[] = [];

  for (const vendor of vendors) {
    try {
      // ── 1. Fetch last month's stats ──────────────────────────────────────
      const { data: statsRaw } = await supabase.rpc("get_listing_stats", {
        p_listing_id: vendor.id,
        p_from: monthStart.toISOString(),
        p_to:   monthEnd.toISOString(),
      });
      const d = statsRaw || {};
      const stats = {
        views:             d.views              || 0,
        unique_sessions:   d.unique_sessions    || 0,
        shortlists:        d.shortlists         || 0,
        compares:          d.compares           || 0,
        enquiry_started:   d.enquiry_started    || 0,
        enquiry_submitted: d.enquiry_submitted  || 0,
        outbound:          d.outbound           || 0,
        view_to_enquiry:   parseFloat(d.view_to_enquiry    || 0),
        enquiry_completion:parseFloat(d.enquiry_completion || 0),
      };

      // ── 2. Calculated values ─────────────────────────────────────────────
      const touchPoints =
        stats.views + stats.shortlists + stats.compares +
        stats.enquiry_started + stats.enquiry_submitted + stats.outbound;

      const { low: mediaLow, high: mediaHigh } = calcMediaValue({
        views:             stats.views,
        shortlists:        stats.shortlists,
        compares:          stats.compares,
        enquiry_submitted: stats.enquiry_submitted,
        outbound:          stats.outbound,
      });

      // ROI estimate
      const defaults = getDefaults(vendor.entity_type || "default", vendor.country_code || "");
      const bookingValue = vendor.avg_booking_value || defaults.value;
      const closeRate    = vendor.est_close_rate    || defaults.rate;
      const estBookings  = (stats.enquiry_submitted * closeRate) / 100;
      const estRevHigh   = Math.round(estBookings * bookingValue);
      const estRevLow    = 0;
      const roiMultiple  = estRevHigh > 0 ? Math.round(estRevHigh / (bookingValue * 0.05)) : null;

      // ── 3. Write snapshot ────────────────────────────────────────────────
      await supabase
        .from("vendor_monthly_snapshots")
        .upsert({
          vendor_id:            vendor.id,
          month:                monthKey,
          views:                stats.views,
          unique_sessions:      stats.unique_sessions,
          shortlists:           stats.shortlists,
          compares:             stats.compares,
          enquiry_started:      stats.enquiry_started,
          enquiry_submitted:    stats.enquiry_submitted,
          outbound_clicks:      stats.outbound,
          touch_points:         touchPoints,
          view_to_enquiry:      stats.view_to_enquiry,
          enquiry_completion:   stats.enquiry_completion,
          media_value_low:      mediaLow,
          media_value_high:     mediaHigh,
          est_revenue_low:      estRevLow,
          est_revenue_high:     estRevHigh,
          roi_multiple:         roiMultiple,
          snapshot_generated_at: new Date().toISOString(),
        }, { onConflict: "vendor_id,month" });

      // ── 4. Skip email if zero activity ───────────────────────────────────
      if (touchPoints === 0) {
        results.push({ vendor_id: vendor.id, status: "skipped_no_activity" });
        continue;
      }

      // ── 5. Build URLs ────────────────────────────────────────────────────
      const dashboardUrl    = `${SITE_URL}/vendor/dashboard?tab=analytics`;
      const outcomeBase     = `${SITE_URL}/api/report-outcome?vendor=${vendor.id}&month=${monthKey}&source=email`;
      const outcomeUrlYes1  = `${outcomeBase}&result=yes1`;
      const outcomeUrlYes2  = `${outcomeBase}&result=yes2`;
      const outcomeUrlNo    = `${outcomeBase}&result=no`;
      const trackingPixelUrl = `${SUPABASE_URL}/functions/v1/track-report-open?vendor=${vendor.id}&month=${monthKey}`;

      // ── 6. Interpretation line ───────────────────────────────────────────
      let interpretation = "Your listing had activity this month";
      if (stats.enquiry_submitted > 0) {
        interpretation = `${stats.enquiry_submitted} enqu${stats.enquiry_submitted === 1 ? "iry" : "iries"} received — couples are reaching out`;
      } else if (stats.shortlists > 0) {
        interpretation = `${stats.shortlists} couple${stats.shortlists === 1 ? "" : "s"} saved your listing this month`;
      } else if (stats.views > 0) {
        interpretation = `${stats.views} views — your listing is being discovered`;
      }

      // ── 7. Send email ────────────────────────────────────────────────────
      const html = buildEmailHTML({
        vendorName: vendor.name,
        month: monthName,
        stats: {
          views: stats.views, shortlists: stats.shortlists,
          enquiry_submitted: stats.enquiry_submitted,
        },
        touchPoints, mediaLow, mediaHigh,
        estRevLow, estRevHigh, roiMultiple,
        interpretation, dashboardUrl,
        outcomeUrlYes1, outcomeUrlYes2, outcomeUrlNo,
        trackingPixelUrl,
      });

      const messageId = await sendEmail(
        vendor.email,
        `Your ${monthName} report is ready — ${vendor.name}`,
        html,
      );

      // ── 8. Log send ──────────────────────────────────────────────────────
      await supabase
        .from("vendor_report_sends")
        .upsert({
          vendor_id:        vendor.id,
          month:            monthKey,
          email_address:    vendor.email,
          sent_at:          new Date().toISOString(),
          resend_message_id: messageId,
        }, { onConflict: "vendor_id,month" });

      results.push({ vendor_id: vendor.id, status: "sent" });

    } catch (err) {
      results.push({ vendor_id: vendor.id, status: "error", error: String(err) });
    }
  }

  const sent    = results.filter(r => r.status === "sent").length;
  const skipped = results.filter(r => r.status === "skipped_no_activity").length;
  const errors  = results.filter(r => r.status === "error").length;

  return new Response(
    JSON.stringify({ month: monthKey, sent, skipped, errors, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
