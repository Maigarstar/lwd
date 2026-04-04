// ─── src/components/vendor/VendorAnalyticsPanel.jsx ─────────────────────────
// Vendor intelligence panel — all 9 features + interpretation layer.
// Gated behind vendor.analytics_enabled (admin-toggled paid feature).
//
// Priority layers built here:
//  1. Interpretation + benchmark (contextual headline above KPIs)
//  2. Live interest — emotional centrepiece, redesigned
//  3. Source breakdown — count + %
//  4. Trend chart — metric selector (Views / Shortlists / Enquiries)
//  5. Skeleton loading + immediate state clear on range change
//  6. Micro polish — "Mar 6" dates, compare peer links, "Updated X ago"
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.3)";

// ── Tier annual costs (used for ROI multiple calculation) ────────────────────
const TIER_ANNUAL_COSTS = { standard: 1490, featured: 3490, showcase: 6990 };

// Luxury wedding category benchmarks (used for interpretation layer)
const BENCH = {
  conversionPct: 4.0,  // view → enquiry %
  shortlistRate: 8.0,  // shortlists / views %
  viewsPer7d:   25,    // typical views per 7-day window
};

// ── CSV export helpers ────────────────────────────────────────────────────────

function csvCell(val) {
  const s = String(val ?? "");
  return (s.includes(",") || s.includes('"') || s.includes("\n"))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(...cells) { return cells.map(csvCell).join(","); }

function deltaStr(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return "—";
  const pct = Math.round(((curr - prev) / prev) * 100);
  return (pct >= 0 ? "+" : "") + pct + "%";
}

function buildCSV({ vendorName, rangeLabel, stats, prevStats, sources, countries, compareList, dailyViews, interpretation,
  touchPointsTotal, touchPointsPerEnquiry, estBookingsHigh, estRevenueHigh, mediaValueLow, mediaValueHigh, effectiveBookingValue, effectiveCloseRate, season, bookingTarget }) {
  const s  = stats    || {};
  const p  = prevStats || {};
  const d  = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });

  const lines = [
    csvRow("LUXURY WEDDING DIRECTORY — PERFORMANCE REPORT"),
    csvRow("Venue", vendorName || "—"),
    csvRow("Period", rangeLabel),
    csvRow("Generated", d),
    "",
    csvRow("EXECUTIVE SUMMARY"),
    csvRow(interpretation?.headline || "—"),
    csvRow(interpretation?.subline  || ""),
    interpretation?.benchmark ? csvRow(interpretation.benchmark.text) : "",
    "",
    csvRow("PERFORMANCE METRICS"),
    csvRow("Metric", "This Period", "Prior Period", "Change"),
    csvRow("Profile Views",       s.views,            p.views,            deltaStr(s.views,            p.views)),
    csvRow("Unique Visitors",     s.uniqueSessions,   p.uniqueSessions,   deltaStr(s.uniqueSessions,   p.uniqueSessions)),
    csvRow("Shortlisted",         s.shortlists,       p.shortlists,       deltaStr(s.shortlists,       p.shortlists)),
    csvRow("Enquiry Started",     s.enquiryStarted,   p.enquiryStarted,   deltaStr(s.enquiryStarted,   p.enquiryStarted)),
    csvRow("Enquiry Submitted",   s.enquirySubmitted, p.enquirySubmitted, deltaStr(s.enquirySubmitted, p.enquirySubmitted)),
    csvRow("Conversion Rate (%)", s.viewToEnquiry,    p.viewToEnquiry,    deltaStr(s.viewToEnquiry,    p.viewToEnquiry)),
    csvRow("Compared",            s.compares,         p.compares,         deltaStr(s.compares,         p.compares)),
    csvRow("Enquiry Completion (%)", s.enquiryCompletion, p.enquiryCompletion, deltaStr(s.enquiryCompletion, p.enquiryCompletion)),
    csvRow("Website Clicks",      s.outbound,         p.outbound,         deltaStr(s.outbound,         p.outbound)),
    "",
    csvRow("TRAFFIC SOURCES"),
    csvRow("Source", "Visits", "Share"),
    ...sources.map(src => csvRow(src.label, src.count, src.pct + "%")),
    "",
    csvRow("AUDIENCE COUNTRIES"),
    csvRow("Country", "Sessions", "Share"),
    ...(countries || []).map(c => csvRow(c.name, c.sessions, c.pct + "%")),
    "",
    csvRow("TOUCH POINTS"),
    csvRow("Total interactions", touchPointsTotal || 0),
    csvRow("Avg per enquiry", touchPointsPerEnquiry || "—"),
    "",
    csvRow("REVENUE IMPACT"),
    csvRow("Est. bookings", `0–${estBookingsHigh || 0}`),
    csvRow("Est. revenue", `£0–£${estRevenueHigh || 0}`),
    csvRow("Assumptions", `£${effectiveBookingValue || 0} avg booking · ${effectiveCloseRate || 0}% close rate`),
    "",
    csvRow("MEDIA VALUE"),
    csvRow("Equivalent ad spend (low)", `£${mediaValueLow || 0}`),
    csvRow("Equivalent ad spend (high)", `£${mediaValueHigh || 0}`),
    "",
    csvRow("SEASONAL CONTEXT"),
    csvRow("Current phase", season?.phase || "—"),
    csvRow("Context", season?.context || "—"),
    csvRow("Booking target", bookingTarget || "—"),
    "",
    csvRow("COMPARE INTELLIGENCE (last 30 days)"),
    csvRow("Listing", "Type", "Sessions"),
    ...compareList.map(c => csvRow(
      c.slug ? c.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—",
      c.type || "—",
      c.count,
    )),
  ];

  if (dailyViews?.length) {
    lines.push("", csvRow("30-DAY TREND (daily profile views)"), csvRow("Date", "Views"));
    dailyViews.forEach(d => lines.push(csvRow(fmtDay(d.label), d.count)));
  }

  return lines.join("\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtNum(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function fmtDay(isoStr) {
  // "2026-03-06" → "Mar 6"
  const d = new Date(isoStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRefreshed(date) {
  if (!date) return null;
  const secs = Math.round((Date.now() - date) / 1000);
  if (secs < 10)   return "Updated just now";
  if (secs < 60)   return `Updated ${secs}s ago`;
  if (secs < 3600) return `Updated ${Math.round(secs / 60)}m ago`;
  return null;
}

function deltaColor(v) {
  if (v > 0) return "#4ade80";
  if (v < 0) return "#f87171";
  return "#888";
}

function deltaLabel(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return null;
  const pct = ((curr - prev) / prev) * 100;
  return { pct: Math.abs(pct).toFixed(0), sign: pct >= 0 ? "↑" : "↓", positive: pct >= 0 };
}

// ── Source classification ─────────────────────────────────────────────────────

function classifySource(row) {
  const src = (row.utm_source || "").toLowerCase();
  const ref = (row.referrer  || "").toLowerCase();
  if (src === "google"    || ref.includes("google"))    return "Google";
  if (src === "instagram" || ref.includes("instagram")) return "Instagram";
  if (src === "facebook"  || ref.includes("facebook"))  return "Facebook";
  if (src === "pinterest" || ref.includes("pinterest")) return "Pinterest";
  if (src === "tiktok"    || ref.includes("tiktok"))    return "TikTok";
  if (src === "twitter"   || ref.includes("twitter"))   return "Twitter";
  if (ref.includes("luxuryweddingdirectory") || ref.includes("localhost")) return "Internal";
  if (ref) return "Other";
  return "Direct";
}

const SOURCE_ICONS = {
  Google: "G", Instagram: "◎", Facebook: "f", Pinterest: "P",
  TikTok: "♩", Twitter: "𝕏", Direct: "→", Internal: "↺", Other: "◇",
};

// ── Country flag emoji ────────────────────────────────────────────────────────

function countryFlag(code) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

// ── Media value benchmarks (£ equivalent paid media per event) ────────────────

const MEDIA_CPCs = {
  page_view:         { low: 8,   high: 15  },
  shortlist_add:     { low: 45,  high: 80  },
  compare_add:       { low: 60,  high: 100 },
  enquiry_submitted: { low: 180, high: 350 },
  outbound_click:    { low: 12,  high: 25  },
};

// ── Category / country ROI defaults (pre-fill before vendor sets their own) ───

const CATEGORY_DEFAULTS = {
  venue: {
    GB: { value: 18000, rate: 20 },
    IT: { value: 35000, rate: 18 },
    AE: { value: 45000, rate: 15 },
    FR: { value: 28000, rate: 18 },
    US: { value: 22000, rate: 22 },
    default: { value: 20000, rate: 20 },
  },
  photographer: { default: { value: 3500,  rate: 30 } },
  planner:      { default: { value: 8000,  rate: 25 } },
  florist:      { default: { value: 2500,  rate: 35 } },
  caterer:      { default: { value: 6000,  rate: 28 } },
  default:      { default: { value: 15000, rate: 20 } },
};

function getROIDefaults(entityType, countryCode) {
  const cat = CATEGORY_DEFAULTS[entityType] || CATEGORY_DEFAULTS.default;
  return cat[countryCode] || cat.default || { value: 15000, rate: 20 };
}

// ── Wedding seasonality — region-aware phase map ──────────────────────────────

const WEDDING_SEASONALITY = {
  GB: {
    1:  { phase: "Quiet",  colour: "#6b7280", label: "Post-Christmas quiet period.",       context: "Typical for January — demand starts rising from March.",          deal: "Now is the time to refresh your listing ahead of spring." },
    2:  { phase: "Rising", colour: "#3b82f6", label: "Engagement season underway.",        context: "Valentine's engagements drive early venue research.",             deal: "Couples shortlisting now will enquire in March–April." },
    3:  { phase: "Rising", colour: "#3b82f6", label: "Discovery season in full swing.",    context: "Shortlist and compare activity rising sharply.",                  deal: "Peak booking season begins next month — high intent traffic." },
    4:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Enquiry volume is at its highest — couples are deciding now.",    deal: "This is when venues fill their calendar." },
    5:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Contracts being signed. High conversion expected.",               deal: "Strong conversion period — follow up enquiries quickly." },
    6:  { phase: "Peak",   colour: "#22c55e", label: "Summer weddings + autumn bookings.", context: "Weddings executing while next year's bookings open.",             deal: "Dual season — current weddings and forward bookings." },
    7:  { phase: "Busy",   colour: "#C9A84C", label: "High execution season.",             context: "Vendors focused on live weddings. Autumn bookings opening.",      deal: "Enquiries now are typically booking 12–18 months ahead." },
    8:  { phase: "Busy",   colour: "#C9A84C", label: "Summer peak executing.",             context: "Early interest for next year beginning to build.",                deal: "Couples enquiring now are planning Summer next year." },
    9:  { phase: "Rising", colour: "#3b82f6", label: "Post-summer planning season.",       context: "Vendors reviewing performance. Second engagement spike ahead.",   deal: "Strong window for upgrades and renewals." },
    10: { phase: "Rising", colour: "#3b82f6", label: "Autumn planning season.",            context: "Second engagement wave building toward Christmas.",               deal: "Position yourself now ahead of the Christmas engagement rush." },
    11: { phase: "Quiet",  colour: "#6b7280", label: "Pre-Christmas quiet period.",        context: "Budget planning season. Engagement wave imminent.",              deal: "Prepare your listing for the January surge." },
    12: { phase: "Rising", colour: "#3b82f6", label: "Christmas engagement season.",       context: "Highest engagement rate of the year — proposals imminent.",      deal: "January will be your busiest discovery month." },
  },
  IT: {
    1:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Northern European couples researching destinations.",             deal: "Early enquiries for peak summer slots already arriving." },
    2:  { phase: "Rising", colour: "#3b82f6", label: "Early enquiry season.",              context: "Serious couples beginning venue research.",                      deal: "Summer slots book out fast — early visibility matters." },
    3:  { phase: "Rising", colour: "#3b82f6", label: "Discovery season begins.",           context: "Shortlist and compare activity rising.",                         deal: "April–September slots filling — peak demand in 4 weeks." },
    4:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Highest enquiry volume of the year.",                           deal: "Summer slots filling fast — conversion is critical now." },
    5:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Demand across all Italian regions at maximum.",                  deal: "Strong conversion window — respond to enquiries same day." },
    6:  { phase: "Peak",   colour: "#22c55e", label: "Peak execution + forward bookings.", context: "Weddings executing and next year's diary opening.",              deal: "Dual momentum — present season and next year bookings." },
    7:  { phase: "Busy",   colour: "#C9A84C", label: "High execution.",                    context: "Peak summer weddings. Next year enquiries starting.",            deal: "Forward bookings for 2027 already building." },
    8:  { phase: "Busy",   colour: "#C9A84C", label: "August weddings.",                   context: "Post-summer bookings beginning.",                                deal: "September–October is a strong second season." },
    9:  { phase: "Peak",   colour: "#22c55e", label: "Autumn wedding season.",             context: "Second peak — ideal climate, strong demand.",                   deal: "Autumn slots highly sought after — position now." },
    10: { phase: "Rising", colour: "#3b82f6", label: "Late autumn season.",                context: "Autumn weddings and early next-year bookings.",                  deal: "Early 2026 enquiries starting to arrive." },
    11: { phase: "Quiet",  colour: "#6b7280", label: "Off-season begins.",                 context: "Season closing. Plan marketing for spring.",                     deal: "Refresh your listing content in preparation for January." },
    12: { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Research activity from international couples continues.",        deal: "Engaged couples from Christmas will research in January." },
  },
  AE: {
    1:  { phase: "Peak",   colour: "#22c55e", label: "Peak wedding season.",               context: "Ideal climate. Highest venue demand of the year.",               deal: "Top conversion window — couples deciding quickly." },
    2:  { phase: "Peak",   colour: "#22c55e", label: "Peak wedding season.",               context: "High demand across all UAE venues.",                             deal: "Strong enquiry volume — respond fast." },
    3:  { phase: "Rising", colour: "#3b82f6", label: "Late peak season.",                  context: "Season closing as temperatures rise.",                           deal: "Last high-conversion window before off-season." },
    4:  { phase: "Quiet",  colour: "#6b7280", label: "Heat season begins.",                context: "Reduced wedding activity due to climate.",                       deal: "Forward bookings for autumn/winter now being made." },
    5:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Low domestic activity. International research continues.",       deal: "Ideal time to refresh listing content." },
    6:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Peak heat. Minimal local activity.",                             deal: "Target international couples planning UAE destination weddings." },
    7:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season. Peak heat.",             context: "Lowest activity period of the year.",                            deal: "Prepare listing and imagery for autumn relaunch." },
    8:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Season preparation underway.",                                   deal: "October season approach — forward bookings opening." },
    9:  { phase: "Rising", colour: "#3b82f6", label: "Season approaching.",                context: "Forward bookings for winter season arriving.",                   deal: "High intent couples planning November–February weddings." },
    10: { phase: "Rising", colour: "#3b82f6", label: "Season beginning.",                  context: "Enquiry volume rising strongly.",                                deal: "Peak season 6 weeks away — strong discovery period." },
    11: { phase: "Peak",   colour: "#22c55e", label: "Peak season starting.",              context: "Climate ideal. Demand at near-peak levels.",                     deal: "Top conversion window — couples ready to commit." },
    12: { phase: "Peak",   colour: "#22c55e", label: "Peak wedding season.",               context: "Highest demand of the year.",                                    deal: "Maximum conversion opportunity." },
  },
  AU: {
    1:  { phase: "Peak",   colour: "#22c55e", label: "Summer wedding season.",             context: "Peak Australian wedding season — outdoor venues in high demand.", deal: "Strong conversion — couples booking summer dates." },
    2:  { phase: "Peak",   colour: "#22c55e", label: "Peak summer season.",                context: "Autumn weddings being planned alongside current summer dates.",   deal: "High dual-season activity." },
    3:  { phase: "Rising", colour: "#3b82f6", label: "Autumn season begins.",              context: "Autumn weddings — mild climate, rising demand.",                 deal: "Forward bookings for next summer starting." },
    4:  { phase: "Busy",   colour: "#C9A84C", label: "Autumn wedding season.",             context: "Popular season for outdoor and garden venues.",                  deal: "Strong conversion window." },
    5:  { phase: "Quiet",  colour: "#6b7280", label: "Winter season begins.",              context: "Lower activity in southern states.",                             deal: "Queensland and WA maintain stronger demand." },
    6:  { phase: "Quiet",  colour: "#6b7280", label: "Winter off-season.",                 context: "Engagement research building for spring.",                       deal: "Spring venues shortlisted now." },
    7:  { phase: "Rising", colour: "#3b82f6", label: "Spring planning season.",            context: "Couples planning spring and summer weddings.",                   deal: "Spring slots filling fast — strong discovery period." },
    8:  { phase: "Rising", colour: "#3b82f6", label: "Spring enquiry season.",             context: "High discovery and shortlist activity.",                         deal: "Spring and summer slots in high demand." },
    9:  { phase: "Peak",   colour: "#22c55e", label: "Spring wedding season.",             context: "Peak spring demand. Strong conversion.",                         deal: "Top conversion window." },
    10: { phase: "Peak",   colour: "#22c55e", label: "Spring peak.",                       context: "Highest enquiry volume building toward summer.",                 deal: "Spring and summer slots almost full." },
    11: { phase: "Busy",   colour: "#C9A84C", label: "Early summer season.",               context: "Summer bookings executing and forward planning.",               deal: "Next year's prime dates being reserved." },
    12: { phase: "Busy",   colour: "#C9A84C", label: "Summer season.",                     context: "Peak execution. New year engagements imminent.",                 deal: "January engagement spike — prepare for discovery surge." },
  },
  FR: {
    1:  { phase: "Quiet",  colour: "#6b7280", label: "Off-season.",                        context: "Research phase for spring and summer dates.",                    deal: "Early enquiries for June–September slots arriving." },
    2:  { phase: "Rising", colour: "#3b82f6", label: "Early discovery season.",            context: "Valentine's engagements driving early research.",                deal: "Spring and summer slots booking now." },
    3:  { phase: "Rising", colour: "#3b82f6", label: "Discovery season.",                  context: "Couples actively comparing French venues.",                      deal: "April peak 4 weeks away." },
    4:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Highest enquiry and conversion rates of the year.",              deal: "Top conversion window — act on all enquiries." },
    5:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Summer slots filling rapidly.",                                  deal: "June–September dates almost fully booked by now." },
    6:  { phase: "Peak",   colour: "#22c55e", label: "Summer season peak.",                context: "Weddings executing and autumn bookings opening.",                 deal: "Autumn availability attracting attention." },
    7:  { phase: "Busy",   colour: "#C9A84C", label: "High summer season.",                context: "Peak execution. Forward bookings for next year opening.",        deal: "2027 prime dates being reserved." },
    8:  { phase: "Quiet",  colour: "#6b7280", label: "August slowdown.",                   context: "French holiday season — reduced business activity.",             deal: "Prepare for strong September bounce." },
    9:  { phase: "Rising", colour: "#3b82f6", label: "Autumn planning season.",            context: "Post-summer reflection and next year planning.",                 deal: "Strong second window for upgrades and visibility." },
    10: { phase: "Rising", colour: "#3b82f6", label: "Autumn planning.",                   context: "Next year bookings building.",                                   deal: "Early 2027 slots being considered." },
    11: { phase: "Quiet",  colour: "#6b7280", label: "Pre-Christmas quiet.",               context: "Budget planning and list preparation.",                          deal: "Position for Christmas engagement surge." },
    12: { phase: "Rising", colour: "#3b82f6", label: "Christmas engagement season.",       context: "Highest proposal rate of the year.",                             deal: "January discovery surge incoming — refresh your listing now." },
  },
  US: {
    1:  { phase: "Rising", colour: "#3b82f6", label: "Engagement season.",                 context: "Post-New Year engagements driving venue research.",              deal: "Spring and summer slots filling fast." },
    2:  { phase: "Rising", colour: "#3b82f6", label: "Valentine's engagement peak.",       context: "Highest engagement rate of the year.",                          deal: "Couples enquiring now are booking for next autumn." },
    3:  { phase: "Peak",   colour: "#22c55e", label: "Spring booking season.",             context: "Peak enquiry volume for spring and summer dates.",               deal: "Top conversion window — respond same day." },
    4:  { phase: "Peak",   colour: "#22c55e", label: "Peak booking season.",               context: "Summer dates almost fully booked.",                              deal: "Urgency is high — couples know slots are limited." },
    5:  { phase: "Busy",   colour: "#C9A84C", label: "Pre-summer season.",                 context: "Weddings executing. Late summer bookings closing.",              deal: "Autumn dates still available — promote now." },
    6:  { phase: "Peak",   colour: "#22c55e", label: "Peak summer wedding season.",        context: "Highest wedding volume of the year.",                           deal: "Strong forward bookings for next year." },
    7:  { phase: "Busy",   colour: "#C9A84C", label: "Summer season.",                     context: "High execution. Next year early bookings.",                     deal: "Next June/July filling up — advertise availability." },
    8:  { phase: "Busy",   colour: "#C9A84C", label: "Late summer season.",                context: "Autumn weddings the next priority.",                             deal: "Autumn conversion window strong." },
    9:  { phase: "Peak",   colour: "#22c55e", label: "Fall wedding season.",               context: "Second peak — foliage season highly sought after.",             deal: "Top conversion window for autumn dates." },
    10: { phase: "Peak",   colour: "#22c55e", label: "Fall peak.",                         context: "Highest demand for autumn dates.",                               deal: "Strong conversion — act quickly on all enquiries." },
    11: { phase: "Rising", colour: "#3b82f6", label: "Holiday engagement season.",         context: "Thanksgiving and Christmas proposals ahead.",                    deal: "January will be your busiest discovery month." },
    12: { phase: "Rising", colour: "#3b82f6", label: "Christmas engagement peak.",         context: "Highest engagement rate of the year.",                          deal: "Prepare your listing for the January surge." },
  },
};

// Booking window by category (months ahead)
const BOOKING_WINDOW = {
  venue:        { min: 12, max: 24 },
  photographer: { min: 6,  max: 18 },
  planner:      { min: 12, max: 18 },
  florist:      { min: 3,  max: 12 },
  caterer:      { min: 6,  max: 12 },
  default:      { min: 9,  max: 18 },
};

function getSeasonality(countryCode, month) {
  const map = WEDDING_SEASONALITY[countryCode] || WEDDING_SEASONALITY.GB;
  return map[month] || map[1];
}

function getBookingTargetYear(entityType) {
  const window = BOOKING_WINDOW[entityType] || BOOKING_WINDOW.default;
  const now = new Date();
  const midMonthsAhead = Math.round((window.min + window.max) / 2);
  const targetDate = new Date(now.getFullYear(), now.getMonth() + midMonthsAhead, 1);
  const season =
    targetDate.getMonth() >= 2 && targetDate.getMonth() <= 4 ? "Spring" :
    targetDate.getMonth() >= 5 && targetDate.getMonth() <= 7 ? "Summer" :
    targetDate.getMonth() >= 8 && targetDate.getMonth() <= 10 ? "Autumn" : "Winter";
  return `${season} ${targetDate.getFullYear()}`;
}

// ── Chart bucketing — scales with date range ──────────────────────────────────

function getBucketSize(fromISO, toISO) {
  const days = (new Date(toISO) - new Date(fromISO)) / 86_400_000;
  if (days <= 35)  return "day";
  if (days <= 95)  return "week";
  return "month";
}

function fillTimeBuckets(data, fromISO, toISO, dayKey = "day", countKey = "views") {
  const bucketSize = getBucketSize(fromISO, toISO);
  const from = new Date(fromISO);
  const to   = new Date(toISO);

  // Build bucket keys
  const buckets = {};
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= to) {
    let key;
    if (bucketSize === "day") {
      key = cursor.toISOString().slice(0, 10);
    } else if (bucketSize === "week") {
      // ISO week start (Monday)
      const d = new Date(cursor);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      key = d.toISOString().slice(0, 10);
    } else {
      key = cursor.toISOString().slice(0, 7); // "YYYY-MM"
    }
    buckets[key] = (buckets[key] || 0); // initialise
    if (bucketSize === "day")   cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (bucketSize === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  // Fill from data
  for (const r of (data || [])) {
    const raw = (r[dayKey] || "").slice(0, 10);
    if (!raw) continue;
    const d = new Date(raw + "T12:00:00Z");
    let key;
    if (bucketSize === "day") {
      key = raw;
    } else if (bucketSize === "week") {
      const wd = new Date(d);
      wd.setUTCDate(wd.getUTCDate() - ((wd.getUTCDay() + 6) % 7));
      key = wd.toISOString().slice(0, 10);
    } else {
      key = raw.slice(0, 7);
    }
    if (key in buckets) buckets[key] += Number(r[countKey]) || 0;
  }

  return Object.entries(buckets).map(([label, count]) => ({ label, count, bucketSize }));
}

function fmtBucketLabel(label, bucketSize) {
  if (bucketSize === "month") {
    const d = new Date(label + "-01T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  if (bucketSize === "week") {
    const d = new Date(label + "T12:00:00Z");
    return "W" + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return fmtDay(label);
}

// ── Interpretation engine ─────────────────────────────────────────────────────

function buildInterpretation(stats, prevStats) {
  if (!stats) return null;
  const { views = 0, shortlists = 0, enquirySubmitted = 0, viewToEnquiry = 0 } = stats;
  const prevViews = prevStats?.views ?? 0;

  if (views === 0) {
    return {
      headline:  "Your analytics are live",
      subline:   "Data will appear as couples visit your listing.",
      sentiment: "neutral",
      benchmark: null,
    };
  }

  const viewsDelta    = prevViews > 0 ? ((views - prevViews) / prevViews) * 100 : null;
  const shortlistRate = (shortlists / views) * 100;
  const convRate      = viewToEnquiry;

  let headline, subline, sentiment;

  if (viewsDelta !== null && viewsDelta >= 50 && convRate >= BENCH.conversionPct) {
    headline  = "Strong performance this period";
    subline   = `Views are up ${Math.round(viewsDelta)}%, with ${enquirySubmitted} enqu${enquirySubmitted === 1 ? "iry" : "iries"} received — momentum is building.`;
    sentiment = "positive";
  } else if (viewsDelta !== null && viewsDelta >= 20) {
    headline  = "Growing momentum";
    subline   = `Profile views are up ${Math.round(viewsDelta)}%${shortlists > 0 ? ` — ${shortlists} couple${shortlists > 1 ? "s" : ""} saved your listing` : ""}.`;
    sentiment = "positive";
  } else if (convRate >= BENCH.conversionPct * 1.5) {
    headline  = "High-quality interest";
    subline   = `Your ${convRate.toFixed(1)}% conversion rate is above average — couples who find you are taking action.`;
    sentiment = "positive";
  } else if (shortlistRate >= BENCH.shortlistRate) {
    headline  = "Strong shortlist engagement";
    subline   = `${shortlistRate.toFixed(0)}% of visitors saved your listing — a high-intent audience.`;
    sentiment = "positive";
  } else if (viewsDelta !== null && viewsDelta <= -20) {
    headline  = "Views dipped this period";
    subline   = `Down ${Math.abs(Math.round(viewsDelta))}% vs prior period. Refreshing your listing images or headline may help.`;
    sentiment = "warning";
  } else if (views >= 10 && enquirySubmitted === 0) {
    headline  = "Good visibility, low conversion";
    subline   = `${views} views so far but no enquiries yet — simplifying your enquiry form could improve results.`;
    sentiment = "warning";
  } else {
    headline  = "Steady performance";
    subline   = `${views} view${views === 1 ? "" : "s"} and ${shortlists} save${shortlists === 1 ? "" : "s"} this period${enquirySubmitted > 0 ? `, with ${enquirySubmitted} enqu${enquirySubmitted === 1 ? "iry" : "iries"} received` : ""}.`;
    sentiment = "neutral";
  }

  let benchmark = null;
  if (convRate >= BENCH.conversionPct * 1.3) {
    benchmark = { text: "Above average conversion for your category", positive: true };
  } else if (convRate >= BENCH.conversionPct * 0.7) {
    benchmark = { text: "In line with similar venues", positive: null };
  } else if (convRate > 0) {
    benchmark = { text: "Below average conversion — small improvements could make a significant difference", positive: false };
  }

  return { headline, subline, sentiment, benchmark, seasonal: null };
}

// ── Compare peer URL helper ───────────────────────────────────────────────────

function peerUrl(slug, type) {
  if (!slug) return null;
  if (type === "venue")   return `/venues/${slug}`;
  if (type === "vendor")  return `/vendor/${slug}`;
  if (type === "planner") return `/planners/${slug}`;
  return null;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = GOLD, height = 64 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w   = 100 / data.length;
  const pts = data
    .map((v, i) => {
      const x = i * w + w / 2;
      const y = height - (v / max) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} 100,${height}`} fill="url(#spark-grad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── StatKPI ───────────────────────────────────────────────────────────────────

function StatKPI({ label, value, prevValue, unit = "", color,
  loading, isMobile, cardBg, border, textPrimary, textMuted }) {
  const dl = (!loading && prevValue != null && value != null) ? deltaLabel(value, prevValue) : null;

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`,
      borderRadius: "var(--lwd-radius-card)",
      padding: isMobile ? "14px 16px" : "20px 22px",
      display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
        textTransform: "uppercase", color: textMuted }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {loading ? (
          <div style={{ width: 52, height: 32, borderRadius: 4,
            background: "rgba(128,128,128,0.1)", animation: "shimmer 1.4s ease infinite" }} />
        ) : (
          <div style={{ fontFamily: GD, fontSize: isMobile ? 24 : 30, fontWeight: 700,
            color: color || textPrimary, lineHeight: 1 }}>
            {fmtNum(value)}
          </div>
        )}
        {!loading && unit && (
          <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginBottom: 3 }}>{unit}</div>
        )}
      </div>
      {dl ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: deltaColor(dl.positive ? 1 : -1),
          display: "flex", alignItems: "center", gap: 3 }}>
          <span>{dl.sign} {dl.pct}%</span>
          <span style={{ color: textMuted, fontWeight: 300 }}>vs prior period</span>
        </div>
      ) : (!loading && prevValue != null && value === prevValue && prevValue > 0) ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>Stable</div>
      ) : null}
    </div>
  );
}

// ── PrintReport — board-ready one-page PDF ────────────────────────────────────

function PrintReport({ vendor, rangeLabel, stats, prevStats, sources, countries, compareList, dailyViews, interpretation, liveCount,
  touchPointsTotal, touchPointsPerEnquiry, mediaValueLow, mediaValueHigh, estBookingsHigh, estRevenueHigh, effectiveBookingValue, effectiveCloseRate,
  season, bookingTarget }) {
  const s = stats    || {};
  const p = prevStats || {};
  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const METRICS = [
    { label: "Profile Views",         value: s.views,             prev: p.views            },
    { label: "Unique Visitors",        value: s.uniqueSessions,    prev: p.uniqueSessions   },
    { label: "Shortlisted",            value: s.shortlists,        prev: p.shortlists       },
    { label: "Enquiry Started",        value: s.enquiryStarted,    prev: p.enquiryStarted   },
    { label: "Enquiry Submitted",      value: s.enquirySubmitted,  prev: p.enquirySubmitted },
    { label: "Conversion Rate",        value: s.viewToEnquiry,     prev: p.viewToEnquiry,   unit: "%" },
    { label: "Compared",               value: s.compares,          prev: p.compares         },
    { label: "Enquiry Completion",     value: s.enquiryCompletion, prev: p.enquiryCompletion, unit: "%" },
    { label: "Website Clicks",         value: s.outbound,          prev: p.outbound         },
  ];

  const PR = {
    page:    { fontFamily: "Georgia, serif", padding: "48px 56px 40px", background: "#fff",
                color: "#1a1a1a", fontSize: 11, lineHeight: 1.5, maxWidth: 900, margin: "0 auto" },
    rule:    { border: "none", borderTop: "2px solid #C9A84C", margin: "20px 0" },
    thinRule:{ border: "none", borderTop: "1px solid #e0d8cc", margin: "12px 0" },
    label:   { fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#888", marginBottom: 4 },
    heading: { fontSize: 20, fontWeight: "bold", marginBottom: 6, color: "#1a1a1a" },
    muted:   { color: "#666", fontSize: 10 },
    gold:    { color: "#B8902A" },
    green:   { color: "#2e7d52" },
    red:     { color: "#b03a2e" },
    grid2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 },
  };

  function DeltaBadge({ curr, prev: prv }) {
    if (prv == null || prv === 0 || curr == null) return null;
    const pct = Math.round(((curr - prv) / prv) * 100);
    const col = pct > 0 ? PR.green : pct < 0 ? PR.red : PR.muted;
    return <span style={{ ...col, fontWeight: "bold", marginLeft: 6, fontSize: 10 }}>
      {pct >= 0 ? "↑" : "↓"} {Math.abs(pct)}%
    </span>;
  }

  // Trend: show last 14 days max for readability in print
  const trendSlice = (dailyViews || []).slice(-14);
  const maxViews   = Math.max(...trendSlice.map(d => d.count), 1);

  return (
    <div style={PR.page}>

      {/* ── Letterhead ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 13, letterSpacing: "3px", textTransform: "uppercase",
            color: "#B8902A", fontWeight: "bold", marginBottom: 4 }}>
            ✦ LUXURY WEDDING DIRECTORY
          </div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#1a1a1a" }}>
            Performance Report
          </div>
        </div>
        <div style={{ textAlign: "right", ...PR.muted }}>
          <div style={{ fontWeight: "bold", fontSize: 12, color: "#1a1a1a", marginBottom: 2 }}>
            {vendor?.name || "Venue Report"}
          </div>
          <div>{rangeLabel}</div>
          <div>Generated {generatedOn}</div>
          {liveCount > 0 && (
            <div style={{ ...PR.green, marginTop: 4, fontWeight: "bold" }}>
              ● {liveCount} viewing right now
            </div>
          )}
        </div>
      </div>
      <hr style={PR.rule} />

      {/* ── Executive summary ─────────────────────────────────────────── */}
      {interpretation && (
        <div style={{ marginBottom: 20 }}>
          <div style={PR.label}>Executive Summary</div>
          <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 5 }}>
            {interpretation.headline}
          </div>
          <div style={{ ...PR.muted, fontSize: 11, marginBottom: 8 }}>
            {interpretation.subline}
          </div>
          {interpretation.benchmark && (
            <div style={{
              display: "inline-block",
              padding: "3px 10px",
              border: `1px solid ${interpretation.benchmark.positive === true ? "#2e7d52" : interpretation.benchmark.positive === false ? "#b03a2e" : "#B8902A"}`,
              borderRadius: 12, fontSize: 9, letterSpacing: "0.5px",
              color: interpretation.benchmark.positive === true ? "#2e7d52" : interpretation.benchmark.positive === false ? "#b03a2e" : "#B8902A",
            }}>
              {interpretation.benchmark.positive === true ? "▲ " : interpretation.benchmark.positive === false ? "▼ " : "◆ "}
              {interpretation.benchmark.text}
            </div>
          )}
        </div>
      )}
      <hr style={PR.thinRule} />

      {/* ── Metrics table ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...PR.label, marginBottom: 10 }}>Performance Metrics</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e0d8cc" }}>
              <th style={{ textAlign: "left", padding: "4px 0", ...PR.muted, fontWeight: "normal", width: "40%" }}>Metric</th>
              <th style={{ textAlign: "right", padding: "4px 8px", ...PR.muted, fontWeight: "normal" }}>This Period</th>
              <th style={{ textAlign: "right", padding: "4px 8px", ...PR.muted, fontWeight: "normal" }}>Prior Period</th>
              <th style={{ textAlign: "right", padding: "4px 0", ...PR.muted, fontWeight: "normal" }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => (
              <tr key={m.label} style={{ borderBottom: "1px solid #f0ece4",
                background: i % 2 === 0 ? "#fafaf8" : "#fff" }}>
                <td style={{ padding: "5px 0", fontWeight: i < 3 ? "bold" : "normal" }}>{m.label}</td>
                <td style={{ textAlign: "right", padding: "5px 8px", fontWeight: "bold" }}>
                  {m.value ?? "—"}{m.unit || ""}
                </td>
                <td style={{ textAlign: "right", padding: "5px 8px", ...PR.muted }}>
                  {m.prev ?? "—"}{m.unit || ""}
                </td>
                <td style={{ textAlign: "right", padding: "5px 0" }}>
                  <DeltaBadge curr={m.value} prev={m.prev} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <hr style={PR.thinRule} />

      {/* ── Sources + Countries (2-col) ───────────────────────────────── */}
      <div style={PR.grid2}>
        {/* Traffic sources */}
        <div>
          <div style={PR.label}>Traffic Origins</div>
          {sources.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 8 }}>
              <tbody>
                {sources.map(src => (
                  <tr key={src.label} style={{ borderBottom: "1px solid #f0ece4" }}>
                    <td style={{ padding: "4px 0" }}>{src.label}</td>
                    <td style={{ textAlign: "right", ...PR.muted }}>{src.count} visit{src.count === 1 ? "" : "s"}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", paddingLeft: 8, width: 36 }}>{src.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={PR.muted}>No source data for this period.</div>}
        </div>

        {/* Audience countries */}
        <div>
          <div style={PR.label}>Audience Countries</div>
          {(countries || []).length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 8 }}>
              <tbody>
                {(countries || []).slice(0, 8).map(c => (
                  <tr key={c.code} style={{ borderBottom: "1px solid #f0ece4" }}>
                    <td style={{ padding: "4px 0", fontSize: 14, width: 24 }}>{countryFlag(c.code)}</td>
                    <td style={{ padding: "4px 4px" }}>{c.name}</td>
                    <td style={{ textAlign: "right", ...PR.muted }}>{c.sessions} session{c.sessions === 1 ? "" : "s"}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", paddingLeft: 8, width: 36 }}>{c.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={PR.muted}>No country data for this period.</div>}
        </div>
      </div>
      <hr style={PR.thinRule} />

      {/* ── Compare intelligence ───────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={PR.label}>Compare Intelligence · last 30 days</div>
        <div style={{ ...PR.muted, fontSize: 9, marginBottom: 8 }}>
          Venues couples compared you against
        </div>
        {compareList.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <tbody>
              {compareList.slice(0, 5).map((c, i) => (
                <tr key={c.slug || i} style={{ borderBottom: "1px solid #f0ece4" }}>
                  <td style={{ padding: "4px 0", ...PR.muted, width: 20 }}>{i + 1}.</td>
                  <td style={{ padding: "4px 4px", fontWeight: "bold" }}>
                    {c.slug ? c.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—"}
                  </td>
                  <td style={{ textAlign: "right", ...PR.muted, textTransform: "capitalize" }}>{c.type}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold", paddingLeft: 8, ...PR.gold }}>
                    {c.count}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={PR.muted}>No comparison data yet.</div>}
      </div>
      <hr style={PR.thinRule} />

      {/* ── Media value + ROI ─────────────────────────────────────────── */}
      <hr style={PR.thinRule} />
      <div style={PR.grid2}>
        <div>
          <div style={PR.label}>Equivalent Media Value</div>
          <div style={{ fontSize: 18, fontWeight: "bold", ...PR.gold, marginTop: 8 }}>
            £{(mediaValueLow || 0).toLocaleString()}–£{(mediaValueHigh || 0).toLocaleString()}
          </div>
          <div style={{ ...PR.muted, marginTop: 4 }}>
            What this traffic would cost in paid ads
          </div>
          {touchPointsTotal > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={PR.label}>Touch Points</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a1a1a", marginTop: 4 }}>
                {touchPointsTotal}
              </div>
              <div style={{ ...PR.muted }}>
                total couple interactions
                {touchPointsPerEnquiry ? ` · avg ${touchPointsPerEnquiry}× per enquiry` : ""}
              </div>
            </div>
          )}
        </div>
        <div>
          <div style={PR.label}>Revenue Impact (Estimated)</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a1a1a", marginTop: 8 }}>
            £0–£{(estRevenueHigh || 0).toLocaleString()}
          </div>
          <div style={{ ...PR.muted, marginTop: 4 }}>
            0–{estBookingsHigh || 0} booking{estBookingsHigh === 1 ? "" : "s"} estimated
          </div>
          <div style={{ ...PR.muted, marginTop: 4 }}>
            £{(effectiveBookingValue || 0).toLocaleString()} avg · {effectiveCloseRate || 0}% close rate
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px",
            background: "#faf7f0", border: "1px solid #e8dfc8", borderRadius: 4,
            fontSize: 10, color: "#666" }}>
            You only need one booking. One wedding covers your investment many times over.
          </div>
        </div>
      </div>

      {/* ── Seasonal context ──────────────────────────────────────────────── */}
      {season && (
        <>
          <hr style={PR.thinRule} />
          <div style={{ marginBottom: 16 }}>
            <div style={PR.label}>Seasonal Context</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 6 }}>
              <span style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 10,
                fontSize: 9, fontWeight: "bold", letterSpacing: "1px",
                textTransform: "uppercase",
                color: season.colour, background: season.colour + "18",
                border: `1px solid ${season.colour}44`,
              }}>
                {season.phase} Season
              </span>
              <span style={{ ...PR.muted, fontSize: 10 }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#1a1a1a", marginBottom: 4 }}>{season.label}</div>
            <div style={{ ...PR.muted }}>{season.context}</div>
            {bookingTarget && (
              <div style={{ marginTop: 8, ...PR.gold, fontSize: 10, fontStyle: "italic" }}>
                ✦ Couples enquiring now are typically booking for {bookingTarget}.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 30-day trend (bar chart) ───────────────────────────────────── */}
      {trendSlice.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...PR.label, marginBottom: 10 }}>
            30-day trend — profile views (last {trendSlice.length} days shown)
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
            {trendSlice.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2 }}>
                <div style={{
                  width: "100%",
                  height: Math.max(2, Math.round((d.count / maxViews) * 40)),
                  background: "#C9A84C",
                  borderRadius: "2px 2px 0 0",
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, ...PR.muted }}>
            <span>{fmtDay(trendSlice[0]?.label)}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <hr style={PR.rule} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...PR.muted }}>
        <div>
          <span style={{ ...PR.gold, fontWeight: "bold", fontSize: 10, letterSpacing: "1px" }}>
            ✦ LUXURY WEDDING DIRECTORY
          </span>
          <span style={{ marginLeft: 12 }}>luxuryweddingdirectory.com</span>
        </div>
        <div>Confidential · {generatedOn}</div>
      </div>
    </div>
  );
}

// ── LockedState ────────────────────────────────────────────────────────────────

function LockedState({ C }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 32px", textAlign: "center", gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 28, marginBottom: 8 }}>
        ◎
      </div>
      <div>
        <div style={{ fontFamily: GD, fontSize: 22, color: C.white, fontWeight: 500, marginBottom: 8 }}>
          Analytics & Intelligence
        </div>
        <div style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.7, maxWidth: 380 }}>
          See exactly who is viewing your listing, where they&rsquo;re coming from,
          and how you compare — available on Featured and Elite plans.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 24px",
        maxWidth: 360, width: "100%" }}>
        {[
          "Profile views with week-on-week delta",
          "Live interest — couples viewing right now",
          "Source breakdown (Google, Instagram, Direct)",
          "Compare intelligence — who you're shortlisted against",
          "30-day trend chart",
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.grey, fontSize: 12, marginTop: 1 }}>◇</span>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>
        Contact your account manager to upgrade
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VendorAnalyticsPanel({ vendor, C, isMobile }) {
  const analyticsEnabled = vendor?.analytics_enabled === true;
  const listingCost = TIER_ANNUAL_COSTS[vendor?.tier] ?? 1490;

  // ── State ──────────────────────────────────────────────────────────────────
  const [range,       setRange]       = useState("30d");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");

  const [stats,       setStats]       = useState(null);
  const [prevStats,   setPrevStats]   = useState(null);
  const [liveCount,   setLiveCount]   = useState(0);
  const [sources,     setSources]     = useState([]);
  const [compareList, setCompareList] = useState([]);

  // Trend chart — all three daily series loaded at once
  const [dailyViews,      setDailyViews]      = useState([]);
  const [dailyShortlists, setDailyShortlists] = useState([]);
  const [dailyEnquiries,  setDailyEnquiries]  = useState([]);
  const [trendMetric,     setTrendMetric]     = useState("views");

  const [loading,       setLoading]       = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [tick,          setTick]          = useState(0); // drives "Updated X ago" re-render
  const [notifications, setNotifications] = useState([]);
  const [showExport,    setShowExport]    = useState(false);
  const [countries,     setCountries]     = useState([]);
  const [trafficView,   setTrafficView]   = useState("sources"); // "sources" | "countries"

  // Confirmed bookings
  const [confirmedBookings, setConfirmedBookings] = useState(0);
  const [confirmedRevenue,  setConfirmedRevenue]  = useState(0);
  const [showBookingModal,  setShowBookingModal]  = useState(false);
  const [bookingInput,      setBookingInput]      = useState("");
  const [bookingDateInput,  setBookingDateInput]  = useState(() => new Date().toISOString().split("T")[0]);
  const [savingBooking,     setSavingBooking]     = useState(false);

  // ROI settings
  const [avgBookingValue, setAvgBookingValue] = useState(null);
  const [estCloseRate,    setEstCloseRate]    = useState(null);
  const [roiSettingsSet,  setRoiSettingsSet]  = useState(false);
  const [editingROI,      setEditingROI]      = useState(false);
  const [roiInputValue,   setRoiInputValue]   = useState("");
  const [roiInputRate,    setRoiInputRate]    = useState("");
  const [savingROI,       setSavingROI]       = useState(false);

  const notifIdRef  = useRef(0);
  const realtimeRef = useRef(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const isLight    = C.bg === "#F2EFE9" || C.bg?.startsWith("#F");
  const cardBg     = isLight ? "#FFFFFF" : C.card;
  const border     = isLight ? "rgba(0,0,0,0.08)" : C.border;
  const textPrimary = isLight ? "#1a1a1a" : C.white;
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : C.grey;

  // ── Date range helpers ─────────────────────────────────────────────────────
  const getRangeISO = useCallback(() => {
    const now = Date.now();
    if (range === "30d") return { from: new Date(now - 30  * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "90d") return { from: new Date(now - 90  * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "12m") return { from: new Date(now - 365 * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "custom" && customFrom && customTo)
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo + "T23:59:59").toISOString() };
    return { from: new Date(now - 30 * 86400_000).toISOString(), to: new Date(now).toISOString() };
  }, [range, customFrom, customTo]);

  const getPrevRangeISO = useCallback(() => {
    const { from, to } = getRangeISO();
    const span = new Date(to) - new Date(from);
    return { from: new Date(new Date(from) - span).toISOString(), to: from };
  }, [getRangeISO]);

  // ── Fill a 30-day bucket map ───────────────────────────────────────────────
  function fillDailyMap(data, dayKey = "day", countKey = "count") {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      map[new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10)] = 0;
    }
    for (const r of (data || [])) {
      const key = (r[dayKey] || "").slice(0, 10);
      if (key in map) map[key] = Number(r[countKey]) || 0;
    }
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  }

  // ── Load functions ─────────────────────────────────────────────────────────

  async function loadStats(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_stats", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error) return;
      const d = data || {};
      setStats({
        views:             d.views              || 0,
        uniqueSessions:    d.unique_sessions    || 0,
        shortlists:        d.shortlists         || 0,
        compares:          d.compares           || 0,
        enquiryStarted:    d.enquiry_started    || 0,
        enquirySubmitted:  d.enquiry_submitted  || 0,
        outbound:          d.outbound           || 0,
        viewToEnquiry:     parseFloat(d.view_to_enquiry    || 0),
        enquiryCompletion: parseFloat(d.enquiry_completion || 0),
      });
    } catch { /* silent */ }
  }

  async function loadPrevStats(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_stats", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error) return;
      const d = data || {};
      setPrevStats({
        views:             d.views              || 0,
        uniqueSessions:    d.unique_sessions    || 0,
        shortlists:        d.shortlists         || 0,
        compares:          d.compares           || 0,
        enquiryStarted:    d.enquiry_started    || 0,
        enquirySubmitted:  d.enquiry_submitted  || 0,
        outbound:          d.outbound           || 0,
        viewToEnquiry:     parseFloat(d.view_to_enquiry    || 0),
        enquiryCompletion: parseFloat(d.enquiry_completion || 0),
      });
    } catch { /* silent */ }
  }

  async function loadLiveCount() {
    try {
      const { data, error } = await supabase.rpc("get_listing_live_count", { p_listing_id: vendor.id });
      if (!error) setLiveCount(Number(data) || 0);
    } catch { /* silent */ }
  }

  async function loadSources(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_sources", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error || !data?.length) { setSources([]); return; }
      const counts = {};
      for (const row of data) {
        const src = classifySource({ utm_source: row.utm_source, referrer: row.referrer });
        counts[src] = (counts[src] || 0) + 1;
      }
      const total  = data.length;
      const sorted = Object.entries(counts)
        .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setSources(sorted);
    } catch { setSources([]); }
  }

  async function loadCompareList() {
    try {
      const { data, error } = await supabase.rpc("get_listing_compare_peers", { p_listing_id: vendor.id });
      if (error || !data?.length) { setCompareList([]); return; }
      setCompareList(data.map(r => ({ slug: r.listing_slug, type: r.entity_type, count: Number(r.sessions) })));
    } catch { setCompareList([]); }
  }

  async function loadDailyViews(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_views", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error) { setDailyViews([]); return; }
      setDailyViews(fillTimeBuckets(data, from, to, "day", "views"));
    } catch { setDailyViews([]); }
  }

  async function loadDailyShortlists(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_events", {
        p_listing_id: vendor.id, p_event_type: "shortlist_add", p_from: from, p_to: to,
      });
      if (error) { setDailyShortlists([]); return; }
      setDailyShortlists(fillTimeBuckets(data, from, to, "day", "count"));
    } catch { setDailyShortlists([]); }
  }

  async function loadDailyEnquiries(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_events", {
        p_listing_id: vendor.id, p_event_type: "enquiry_submitted", p_from: from, p_to: to,
      });
      if (error) { setDailyEnquiries([]); return; }
      setDailyEnquiries(fillTimeBuckets(data, from, to, "day", "count"));
    } catch { setDailyEnquiries([]); }
  }

  async function loadCountries(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_countries", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error || !data?.length) { setCountries([]); return; }
      const total = data.reduce((sum, r) => sum + Number(r.sessions), 0);
      setCountries(data.map(r => ({
        code:     r.country_code,
        name:     r.country_name || r.country_code,
        sessions: Number(r.sessions),
        pct:      Math.round((Number(r.sessions) / total) * 100),
      })));
    } catch { setCountries([]); }
  }

  async function loadROISettings() {
    try {
      const { data, error } = await supabase.rpc("get_vendor_roi_settings", {
        p_vendor_id: vendor.id,
      });
      if (error || !data?.[0]) return;
      const row = data[0];
      if (row.avg_booking_value) {
        setAvgBookingValue(Number(row.avg_booking_value));
        setEstCloseRate(Number(row.est_close_rate));
        setRoiSettingsSet(true);
      }
    } catch { /* silent */ }
  }

  async function saveROISettings() {
    const val  = parseFloat(roiInputValue);
    const rate = parseFloat(roiInputRate);
    if (!val || !rate || rate < 1 || rate > 100) return;
    setSavingROI(true);
    try {
      await supabase.rpc("save_vendor_roi_settings", {
        p_vendor_id:     vendor.id,
        p_booking_value: val,
        p_close_rate:    rate,
      });
      setAvgBookingValue(val);
      setEstCloseRate(rate);
      setRoiSettingsSet(true);
      setEditingROI(false);
    } catch { /* silent */ }
    setSavingROI(false);
  }

  async function loadBookingTotals() {
    try {
      const { from, to } = getRangeISO();
      const { data } = await supabase.rpc("get_vendor_booking_totals", {
        p_vendor_id: vendor.id,
        p_from: from,
        p_to:   to,
      });
      if (data?.[0]) {
        setConfirmedBookings(Number(data[0].total_bookings) || 0);
        setConfirmedRevenue(Number(data[0].total_revenue)   || 0);
      }
    } catch { /* silent */ }
  }

  async function saveBooking() {
    const val = parseFloat(bookingInput);
    if (!val || val <= 0) return;
    setSavingBooking(true);
    try {
      await supabase.from("vendor_bookings").insert({
        vendor_id:     vendor.id,
        booking_value: val,
        booking_date:  bookingDateInput || new Date().toISOString().split("T")[0],
        source:        "lwd",
      });
      setShowBookingModal(false);
      setBookingInput("");
      await loadBookingTotals();
    } catch { /* silent */ }
    setSavingBooking(false);
  }

  // ── loadAll — clears state immediately, then fetches ───────────────────────
  const loadAll = useCallback(async () => {
    if (!vendor?.id || !analyticsEnabled) { setLoading(false); return; }

    // Clear stale data immediately so range switches don't flash old numbers
    setStats(null);
    setPrevStats(null);
    setSources([]);
    setCountries([]);
    setLoading(true);

    const { from, to }           = getRangeISO();
    const { from: pFrom, to: pTo } = getPrevRangeISO();

    await Promise.allSettled([
      loadStats(from, to),
      loadPrevStats(pFrom, pTo),
      loadLiveCount(),
      loadSources(from, to),
      loadCountries(from, to),
      loadCompareList(),
      loadDailyViews(from, to),
      loadDailyShortlists(from, to),
      loadDailyEnquiries(from, to),
    ]);

    setLoading(false);
    setLastRefreshed(new Date());
  }, [vendor?.id, analyticsEnabled, getRangeISO, getPrevRangeISO]);

  // ── Realtime: live count polling + shortlist/compare notifications ─────────
  useEffect(() => {
    if (!vendor?.id || !analyticsEnabled) return;

    loadLiveCount();
    const liveTimer = setInterval(() => {
      loadLiveCount();
      setTick(n => n + 1); // re-render "Updated X ago"
    }, 30_000);

    const channel = supabase
      .channel(`vendor-analytics-${vendor.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "page_events",
        filter: `listing_id=eq.${vendor.id}`,
      }, (payload) => {
        const type = payload.new?.event_type;
        if (type === "shortlist_add" || type === "compare_add") {
          const id = ++notifIdRef.current;
          setNotifications(prev => [{ id, type, at: new Date() }, ...prev.slice(0, 4)]);
          setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
          loadLiveCount();
        }
        if (type === "page_view") {
          setLiveCount(c => c + 1);
          setTimeout(loadLiveCount, 5000);
        }
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => { clearInterval(liveTimer); supabase.removeChannel(channel); };
  }, [vendor?.id, analyticsEnabled]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Load ROI settings + booking totals once on mount (independent of range changes)
  useEffect(() => {
    if (vendor?.id && analyticsEnabled) {
      loadROISettings();
      loadBookingTotals();
    }
  }, [vendor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!analyticsEnabled) return <LockedState C={C} />;

  // ── No-data detection ──────────────────────────────────────────────────────
  // True when loading finished but all stats are zero (no events yet or RPCs
  // haven't been created in Supabase yet)
  const noDataYet = !loading && stats !== null && (stats.views || 0) === 0 &&
    (stats.shortlists || 0) === 0 && (stats.enquirySubmitted || 0) === 0;

  // ── Computed values ────────────────────────────────────────────────────────
  const cs   = stats    || {};
  const prev = prevStats || {};

  const interpretation = buildInterpretation(stats, prevStats);

  // ── Touch points ────────────────────────────────────────────────────────────
  const touchPointsTotal = (cs.views || 0) + (cs.shortlists || 0) + (cs.compares || 0) +
    (cs.enquiryStarted || 0) + (cs.enquirySubmitted || 0) + (cs.outbound || 0);

  const touchPointsPerEnquiry = cs.enquirySubmitted > 0
    ? (touchPointsTotal / cs.enquirySubmitted).toFixed(1)
    : null;

  // Funnel drop-off rates
  const shortlistRate  = cs.views > 0      ? ((cs.shortlists      / cs.views)      * 100).toFixed(1) : null;
  const compareRate    = cs.shortlists > 0 ? ((cs.compares        / cs.shortlists) * 100).toFixed(1) : null;
  const enquiryRate    = cs.compares > 0   ? ((cs.enquirySubmitted / cs.compares)   * 100).toFixed(1) : null;

  // ── Media value ─────────────────────────────────────────────────────────────
  const mediaValueLow = Math.round(
    (cs.views || 0)             * MEDIA_CPCs.page_view.low +
    (cs.shortlists || 0)        * MEDIA_CPCs.shortlist_add.low +
    (cs.compares || 0)          * MEDIA_CPCs.compare_add.low +
    (cs.enquirySubmitted || 0)  * MEDIA_CPCs.enquiry_submitted.low +
    (cs.outbound || 0)          * MEDIA_CPCs.outbound_click.low
  );
  const mediaValueHigh = Math.round(
    (cs.views || 0)             * MEDIA_CPCs.page_view.high +
    (cs.shortlists || 0)        * MEDIA_CPCs.shortlist_add.high +
    (cs.compares || 0)          * MEDIA_CPCs.compare_add.high +
    (cs.enquirySubmitted || 0)  * MEDIA_CPCs.enquiry_submitted.high +
    (cs.outbound || 0)          * MEDIA_CPCs.outbound_click.high
  );

  // ── Revenue ROI ─────────────────────────────────────────────────────────────
  const roiDefaults = getROIDefaults(vendor?.entity_type, vendor?.country_code);
  const effectiveBookingValue = avgBookingValue ?? roiDefaults.value;
  const effectiveCloseRate    = estCloseRate    ?? roiDefaults.rate;
  const estBookingsHigh = Math.ceil((cs.enquirySubmitted || 0) * (effectiveCloseRate / 100));
  const estRevenueHigh  = estBookingsHigh * effectiveBookingValue;

  function fmtGBP(n) {
    if (!n && n !== 0) return "—";
    if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}m`;
    if (n >= 1000)    return `£${(n / 1000).toFixed(0)}k`;
    return `£${n.toLocaleString()}`;
  }

  const trendData =
    trendMetric === "shortlists" ? dailyShortlists :
    trendMetric === "enquiries"  ? dailyEnquiries  :
    dailyViews;

  const rangeLabel =
    range === "30d"  ? "Last 30 days" :
    range === "90d"  ? "Last 90 days" :
    range === "12m"  ? "Last 12 months" :
    range === "custom" && customFrom ? `${customFrom} → ${customTo || "today"}` :
    "Last 30 days";

  const refreshLabel = fmtRefreshed(lastRefreshed);

  // ── Seasonality ─────────────────────────────────────────────────────────────
  const currentMonth  = new Date().getMonth() + 1; // 1–12
  const countryCode   = vendor?.country_code || "GB";
  const season        = getSeasonality(countryCode, currentMonth);
  const bookingTarget = getBookingTargetYear(vendor?.entity_type);

  // Shared props for StatKPI
  const kpi = { loading, isMobile, cardBg, border, textPrimary, textMuted };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── No-data banner ────────────────────────────────────────────── */}
      {noDataYet && (
        <div style={{
          background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
          borderLeft: `3px solid ${GOLD}`, borderRadius: 8,
          padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>✦</span>
          <div>
            <div style={{ fontFamily: NU, fontSize: 13, color: GOLD, fontWeight: 600, marginBottom: 4 }}>
              No tracking data for this period yet
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
              Events will appear here as couples view this profile. If you've just gone live, check back in 24–48 hours.
              {vendor?.isAdminPreview && (
                <span style={{ display: "block", marginTop: 6, color: "#f97316", fontWeight: 600 }}>
                  Admin: run the analytics seed SQL in Supabase to populate demo data.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px",
            textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
            Performance Analytics
          </div>
          <h2 style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28,
            color: textPrimary, fontWeight: 600, margin: 0 }}>
            Your Numbers
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>{rangeLabel}</span>
            {refreshLabel && (
              <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, opacity: 0.6 }}>
                · {refreshLabel}
              </span>
            )}
            {!loading && season && (
              <span style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase",
                color: season.colour,
                background: season.colour + "18",
                border: `1px solid ${season.colour}44`,
                borderRadius: 20, padding: "2px 10px",
              }}>
                {season.phase} Season
              </span>
            )}
          </div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { key: "30d", label: "30 days" },
            { key: "90d", label: "90 days" },
            { key: "12m", label: "12 months" },
            { key: "custom", label: "Custom" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setRange(key)} style={{
              fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
              padding: "5px 12px", borderRadius: "var(--lwd-radius-input)",
              border: `1px solid ${range === key ? GOLD : border}`,
              background: range === key ? GOLD_DIM : "transparent",
              color: range === key ? GOLD : textMuted,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date inputs */}
      {range === "custom" && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          {[["From", customFrom, setCustomFrom], ["To", customTo, setCustomTo]].map(([lbl, val, set]) => (
            <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                letterSpacing: "1.5px", textTransform: "uppercase" }}>{lbl}</label>
              <input type="date" value={val} onChange={e => set(e.target.value)} style={{
                fontFamily: NU, fontSize: 13, padding: "7px 12px",
                border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                background: cardBg, color: textPrimary, outline: "none",
              }} />
            </div>
          ))}
          {customFrom && customTo && (
            <button onClick={loadAll} style={{
              fontFamily: NU, fontSize: 12, fontWeight: 700, padding: "8px 18px",
              background: GOLD, color: "#000", border: "none",
              borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
            }}>Apply</button>
          )}
        </div>
      )}

      {/* ── Live notifications ───────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-card)", animation: "fadeIn 0.3s ease",
            }}>
              <span style={{ fontSize: 14 }}>{n.type === "shortlist_add" ? "♡" : "⊞"}</span>
              <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                {n.type === "shortlist_add"
                  ? "A couple just saved your listing to their shortlist"
                  : "A couple added your listing to a comparison"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginLeft: "auto" }}>
                Just now
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Live interest — emotional centrepiece ────────────────────────── */}
      <div style={{
        background: liveCount > 0 ? (isLight ? "#fdfcf8" : "rgba(201,168,76,0.05)") : cardBg,
        border: `1px solid ${liveCount > 0 ? "rgba(201,168,76,0.5)" : border}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: isMobile ? "20px" : "24px 28px",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: liveCount > 0 ? `0 0 0 1px rgba(201,168,76,0.1), 0 8px 32px rgba(201,168,76,0.08)` : "none",
        transition: "all 0.5s ease",
      }}>
        {/* Pulse dot */}
        <div style={{ flexShrink: 0, position: "relative", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {liveCount === 0 && (
            <div style={{
              position: "absolute",
              width: 16, height: 16,
              borderRadius: "50%",
              border: `1px solid rgba(201,168,76,0.25)`,
              animation: "breathe 3s ease infinite",
            }} />
          )}
          <div style={{
            width: liveCount > 0 ? 12 : 7,
            height: liveCount > 0 ? 12 : 7,
            borderRadius: "50%",
            background: liveCount > 0 ? "#4ade80" : "rgba(201,168,76,0.35)",
            animation: liveCount > 0 ? "livePulse 1.6s ease infinite" : "breathe 3s ease infinite",
            transition: "all 0.4s ease",
          }} />
        </div>

        <div style={{ flex: 1 }}>
          {liveCount > 0 ? (
            <>
              <div style={{ fontFamily: GD, fontSize: isMobile ? 20 : 26,
                color: textPrimary, fontWeight: 600, lineHeight: 1.2 }}>
                {liveCount === 1
                  ? "1 couple viewing your listing right now"
                  : `${liveCount} couples viewing your listing right now`}
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 4 }}>
                Updated every 30 seconds · last 5 minutes of activity
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: GD, fontSize: isMobile ? 17 : 20,
                fontStyle: "italic", color: textPrimary, lineHeight: 1.3, opacity: 0.72 }}>
                Monitoring live interest — next visitor will appear here
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, opacity: 0.55, marginTop: 5 }}>
                System is watching · updates every 30 seconds
              </div>
            </>
          )}
        </div>

        {liveCount > 0 && (
          <div style={{ fontFamily: GD, fontSize: isMobile ? 42 : 52,
            fontWeight: 700, color: GOLD, lineHeight: 1, flexShrink: 0,
            filter: "drop-shadow(0 0 12px rgba(201,168,76,0.3))" }}>
            {liveCount}
          </div>
        )}
      </div>

      {/* ── Interpretation block ─────────────────────────────────────────── */}
      {interpretation && !loading && (
        <div style={{
          borderLeft: `3px solid ${
            interpretation.sentiment === "positive" ? GOLD :
            interpretation.sentiment === "warning"  ? "#f59e0b" :
            "rgba(128,128,128,0.3)"
          }`,
          paddingLeft: 18,
          paddingTop: 2,
          paddingBottom: 2,
        }}>
          <div style={{ fontFamily: GD, fontSize: isMobile ? 16 : 18,
            color: textPrimary, fontWeight: 600, marginBottom: 4 }}>
            {interpretation.headline}
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: textMuted,
            lineHeight: 1.6, marginBottom: interpretation.benchmark ? 10 : 0 }}>
            {interpretation.subline}
          </div>
          {interpretation.benchmark && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 20,
              background: interpretation.benchmark.positive === true  ? "rgba(74,222,128,0.1)" :
                          interpretation.benchmark.positive === false ? "rgba(248,113,113,0.1)" :
                          GOLD_DIM,
              border: `1px solid ${
                interpretation.benchmark.positive === true  ? "rgba(74,222,128,0.25)" :
                interpretation.benchmark.positive === false ? "rgba(248,113,113,0.25)" :
                GOLD_BORDER
              }`,
            }}>
              <span style={{ fontSize: 9 }}>
                {interpretation.benchmark.positive === true  ? "▲" :
                 interpretation.benchmark.positive === false ? "▼" : "◆"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11,
                color: interpretation.benchmark.positive === true  ? "#4ade80" :
                       interpretation.benchmark.positive === false ? "#f87171" :
                       GOLD }}>
                {interpretation.benchmark.text}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Seasonal context ─────────────────────────────────────────────── */}
      {!loading && season && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "14px 18px",
          background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${season.colour}33`,
          borderRadius: "var(--lwd-radius-card)",
        }}>
          {/* Phase dot */}
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: season.colour, flexShrink: 0, marginTop: 5,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: "1.5px", textTransform: "uppercase",
                color: season.colour,
              }}>
                {season.phase} · {new Date().toLocaleDateString("en-US", { month: "long" })}
              </span>
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: textPrimary, marginBottom: 3, lineHeight: 1.5 }}>
              {season.label}
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, lineHeight: 1.5 }}>
              {season.context}
            </div>
            {season.deal && (
              <div style={{
                fontFamily: NU, fontSize: 11, color: season.colour,
                marginTop: 6, fontStyle: "italic",
              }}>
                ✦ {season.deal}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Touch Point Funnel ──────────────────────────────────────────── */}
      {!loading && touchPointsTotal > 0 && (
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Couple engagement
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                Touch Point Journey
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {touchPointsTotal}
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, marginTop: 2 }}>
                total interactions
              </div>
              {touchPointsPerEnquiry && (
                <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, marginTop: 1 }}>
                  avg {touchPointsPerEnquiry}× per enquiry
                </div>
              )}
            </div>
          </div>

          {/* Funnel steps */}
          {[
            {
              label: "Profile Views",
              value: cs.views,
              rate: null,
              color: textPrimary,
              icon: "◎",
            },
            {
              label: "Shortlisted",
              value: cs.shortlists,
              rate: shortlistRate,
              rateLabel: "of views",
              color: GOLD,
              icon: "♡",
            },
            {
              label: "Compared",
              value: cs.compares,
              rate: compareRate,
              rateLabel: "of shortlists",
              color: GOLD,
              icon: "⊞",
            },
            {
              label: "Enquiries",
              value: cs.enquirySubmitted,
              rate: enquiryRate,
              rateLabel: "of compares",
              color: "#4ade80",
              icon: "✉",
            },
          ].map((step, i) => (
            <div key={step.label}>
              {i > 0 && (
                <div style={{ display: "flex", alignItems: "center",
                  paddingLeft: 10, margin: "4px 0" }}>
                  <div style={{ width: 2, height: 16,
                    background: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
                    marginLeft: 11 }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "10px 14px",
                background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                borderRadius: "var(--lwd-radius-input)",
                border: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, color: step.color }}>{step.icon}</span>
                  <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                    {step.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {step.rate !== null && step.rate !== undefined && (
                    <span style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>
                      {step.rate}% {step.rateLabel}
                    </span>
                  )}
                  <span style={{ fontFamily: GD, fontSize: 20, fontWeight: 700,
                    color: step.color, minWidth: 32, textAlign: "right" }}>
                    {fmtNum(step.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Bookings row — locked/placeholder */}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 10, margin: "4px 0" }}>
            <div style={{ width: 2, height: 16,
              background: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
              marginLeft: 11 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "10px 14px",
            borderRadius: "var(--lwd-radius-input)",
            border: `1px dashed ${border}`, opacity: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: textMuted }}>◈</span>
              <span style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
                Bookings
              </span>
            </div>
            <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, fontStyle: "italic" }}>
              Track via Revenue Impact →
            </span>
          </div>
        </div>
      )}

      {/* ── Primary KPI grid ─────────────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 12 }}>
        <StatKPI label="Profile Views"   value={cs.views}            prevValue={prev.views}            {...kpi} />
        <StatKPI label="Unique Visitors" value={cs.uniqueSessions}   prevValue={prev.uniqueSessions}   {...kpi} />
        <StatKPI label="Shortlisted"     value={cs.shortlists}       prevValue={prev.shortlists}       color={GOLD} {...kpi} />
        <StatKPI label="Enquiries"       value={cs.enquirySubmitted} prevValue={prev.enquirySubmitted} color="#4ade80" {...kpi} />
        <StatKPI label="Conversion"      value={cs.viewToEnquiry}    prevValue={prev.viewToEnquiry}    unit="%" {...kpi}
          style={{ gridColumn: isMobile ? "1 / -1" : undefined }} />
      </div>

      {/* ── Trend chart + Source breakdown ───────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>

        {/* Trend chart with metric selector */}
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                30-day trend
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                {trendMetric === "views"      ? "Profile Views" :
                 trendMetric === "shortlists" ? "Shortlists"    : "Enquiries"}
              </div>
            </div>
            {/* Metric selector */}
            <div style={{ display: "flex", gap: 3 }}>
              {[
                { key: "views",      label: "Views" },
                { key: "shortlists", label: "Saves" },
                { key: "enquiries",  label: "Enquiries" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTrendMetric(key)} style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.3px",
                  padding: "3px 9px", borderRadius: "var(--lwd-radius-input)",
                  border: `1px solid ${trendMetric === key ? GOLD : border}`,
                  background: trendMetric === key ? GOLD_DIM : "transparent",
                  color: trendMetric === key ? GOLD : textMuted,
                  cursor: "pointer", transition: "all 0.12s",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ height: 64, borderRadius: 4,
              background: "rgba(128,128,128,0.08)", animation: "shimmer 1.4s ease infinite" }} />
          ) : trendData.length > 0 && trendData.some(d => d.count > 0) ? (
            <>
              {/* Peak season label */}
              {season.phase === "Peak" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontFamily: NU, fontSize: 10, color: "#22c55e", letterSpacing: "0.5px" }}>
                    Peak season — higher enquiry volume expected
                  </span>
                </div>
              )}
              {season.phase === "Quiet" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6b7280" }} />
                  <span style={{ fontFamily: NU, fontSize: 10, color: "#6b7280", letterSpacing: "0.5px" }}>
                    Quiet period — typical seasonal pattern
                  </span>
                </div>
              )}
              <Sparkline data={trendData.map(d => d.count)} color={GOLD} height={64} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                  {trendData[0]?.label ? fmtBucketLabel(trendData[0].label, trendData[0]?.bucketSize || "day") : ""}
                </span>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>Today</span>
              </div>
            </>
          ) : (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                No data for this metric yet
              </span>
            </div>
          )}
        </div>

        {/* Traffic origins — Sources + Countries toggle */}
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>

          {/* Header row: title + toggle */}
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Traffic origins
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                {trafficView === "sources" ? "Where Couples Find You" : "Where Couples Come From"}
              </div>
            </div>
            {/* Sources | Countries toggle */}
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {[
                { key: "sources",   label: "Sources"   },
                { key: "countries", label: "Countries" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTrafficView(key)} style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.3px",
                  padding: "3px 9px", borderRadius: "var(--lwd-radius-input)",
                  border: `1px solid ${trafficView === key ? GOLD : border}`,
                  background: trafficView === key ? GOLD_DIM : "transparent",
                  color: trafficView === key ? GOLD : textMuted,
                  cursor: "pointer", transition: "all 0.12s",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[80, 55, 35, 20].map((w, i) => (
                <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 4,
                  background: "rgba(128,128,128,0.08)", animation: "shimmer 1.4s ease infinite" }} />
              ))}
            </div>
          ) : trafficView === "sources" ? (
            sources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sources.map(s => (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: NU, fontSize: 11, color: textMuted,
                          width: 14, textAlign: "center" }}>
                          {SOURCE_ICONS[s.label] || "◇"}
                        </span>
                        <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>
                          {s.count} visit{s.count === 1 ? "" : "s"}
                        </span>
                        <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
                          color: textPrimary, minWidth: 32, textAlign: "right" }}>
                          {s.pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                      borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${s.pct}%`, height: "100%",
                        background: `linear-gradient(90deg, ${GOLD}, ${GOLD}99)`,
                        borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                  Source data will appear once views are tracked
                </span>
              </div>
            )
          ) : (
            /* Countries view */
            countries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {countries.map(c => (
                  <div key={c.code}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{countryFlag(c.code)}</span>
                        <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                          {c.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>
                          {c.sessions} session{c.sessions === 1 ? "" : "s"}
                        </span>
                        <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
                          color: textPrimary, minWidth: 32, textAlign: "right" }}>
                          {c.pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                      borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${c.pct}%`, height: "100%",
                        background: `linear-gradient(90deg, ${GOLD}, ${GOLD}99)`,
                        borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                  Country data will appear as couples visit your listing
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Secondary KPI grid ───────────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <StatKPI label="Compared"               value={cs.compares}           prevValue={prev.compares}           {...kpi} />
        <StatKPI label="Enquiry Started"         value={cs.enquiryStarted}     prevValue={prev.enquiryStarted}     {...kpi} />
        <StatKPI label="Enquiry Completion"      value={cs.enquiryCompletion}  prevValue={prev.enquiryCompletion}  unit="%" {...kpi} />
        <StatKPI label="Website Clicks"          value={cs.outbound}           prevValue={prev.outbound}           {...kpi} />
      </div>

      {/* ── Compare intelligence ─────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
          textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
          Compare intelligence · last 30 days
        </div>
        <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
          color: textPrimary, marginBottom: 4 }}>
          Who Couples Compare You Against
        </div>
        <div style={{ fontFamily: NU, fontSize: 12, color: textMuted,
          marginBottom: 16, lineHeight: 1.5 }}>
          Listings that appear in the same comparison sessions as yours.
          No other directory surfaces this.
        </div>

        {loading ? (
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 52, borderRadius: "var(--lwd-radius-input)",
                background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
            ))}
          </div>
        ) : compareList.length > 0 ? (
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {compareList.map((item, i) => {
              const url = peerUrl(item.slug, item.type);
              const WrapEl = url ? "a" : "div";
              return (
                <WrapEl key={item.slug || i} href={url || undefined}
                  target={url ? "_blank" : undefined}
                  rel={url ? "noopener noreferrer" : undefined}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "12px 16px",
                    background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${border}`,
                    borderRadius: "var(--lwd-radius-input)",
                    textDecoration: "none", cursor: url ? "pointer" : "default",
                    transition: "background 0.15s, border-color 0.15s",
                    ...(url ? { ":hover": { background: GOLD_DIM } } : {}),
                  }}
                  onMouseEnter={url ? e => {
                    e.currentTarget.style.background = GOLD_DIM;
                    e.currentTarget.style.borderColor = GOLD_BORDER;
                  } : undefined}
                  onMouseLeave={url ? e => {
                    e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = border;
                  } : undefined}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                      width: 18, textAlign: "right" }}>
                      {i + 1}.
                    </span>
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 13,
                        color: url ? GOLD : textPrimary, fontWeight: 600 }}>
                        {item.slug
                          ? item.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                          : "Unknown listing"}
                      </div>
                      {item.type && (
                        <div style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                          textTransform: "capitalize", marginTop: 1 }}>
                          {item.type}{url ? " ↗" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: GOLD }}>
                      {item.count}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                      {item.count === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                </WrapEl>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: "20px 18px",
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "var(--lwd-radius-input)",
          }}>
            <div style={{ fontFamily: NU, fontSize: 13, color: textPrimary, lineHeight: 1.65 }}>
              <span style={{ color: GOLD }}>✦</span>{" "}
              <strong>Early advantage.</strong>{" "}
              Couples haven't compared you yet — listings with strong imagery and complete profiles
              are the first to appear in comparison sessions.
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginTop: 8, lineHeight: 1.5 }}>
              Once comparisons begin, you'll see exactly which venues couples are weighing you against — intelligence no other directory surfaces.
            </div>
          </div>
        )}
      </div>

      {/* ── Media Value ─────────────────────────────────────────────────── */}
      {!loading && touchPointsTotal > 0 && (
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Equivalent advertising value
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                What This Traffic Would Cost in Paid Ads
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 4, lineHeight: 1.5 }}>
                Based on Google Ads benchmark CPCs for luxury wedding searches.
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: GD, fontSize: isMobile ? 26 : 32,
                fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {fmtGBP(mediaValueLow)}–{fmtGBP(mediaValueHigh)}
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, marginTop: 4 }}>
                estimated media value · {rangeLabel.toLowerCase()}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10, marginTop: 8 }}>
            {[
              { label: "Views",       count: cs.views,            low: MEDIA_CPCs.page_view.low,         high: MEDIA_CPCs.page_view.high         },
              { label: "Shortlists",  count: cs.shortlists,       low: MEDIA_CPCs.shortlist_add.low,     high: MEDIA_CPCs.shortlist_add.high     },
              { label: "Compares",    count: cs.compares,         low: MEDIA_CPCs.compare_add.low,       high: MEDIA_CPCs.compare_add.high       },
              { label: "Enquiries",   count: cs.enquirySubmitted, low: MEDIA_CPCs.enquiry_submitted.low, high: MEDIA_CPCs.enquiry_submitted.high },
              { label: "Site Clicks", count: cs.outbound,         low: MEDIA_CPCs.outbound_click.low,    high: MEDIA_CPCs.outbound_click.high    },
            ].map(item => (
              <div key={item.label} style={{
                padding: "12px 14px",
                background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${border}`,
                borderRadius: "var(--lwd-radius-input)",
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                  textTransform: "uppercase", color: textMuted, marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: GD, fontSize: 16, fontWeight: 700, color: textPrimary }}>
                  {fmtGBP(Math.round((item.count || 0) * item.low))}
                  <span style={{ fontSize: 11, fontWeight: 400, color: textMuted }}>–{fmtGBP(Math.round((item.count || 0) * item.high))}</span>
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, marginTop: 2 }}>
                  {item.count || 0} × £{item.low}–{item.high}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Revenue Impact ───────────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
              textTransform: "uppercase", color: GOLD, marginBottom: 4 }}>
              Revenue impact · {rangeLabel.toLowerCase()}
            </div>
            <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
              Return on Investment
            </div>
          </div>
          {!editingROI && (
            <button onClick={() => {
              setRoiInputValue(String(effectiveBookingValue));
              setRoiInputRate(String(effectiveCloseRate));
              setEditingROI(true);
            }} style={{
              fontFamily: NU, fontSize: 11, color: textMuted, background: "transparent",
              border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
              padding: "4px 10px", cursor: "pointer",
            }}>
              {roiSettingsSet ? "✎ Edit assumptions" : "✎ Set your numbers"}
            </button>
          )}
        </div>

        {/* Tier + listing cost label */}
        <div style={{ fontSize: 11, color: GOLD + "99", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontFamily: NU }}>
          {vendor?.tier ? `${vendor.tier.charAt(0).toUpperCase() + vendor.tier.slice(1)} Plan — £${listingCost.toLocaleString()}/yr` : "Standard Plan — £1,490/yr"}
        </div>

        {editingROI ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
              Tell us your average booking value and typical close rate to personalise your ROI estimate.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                  letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Avg booking value (£)
                </label>
                <input
                  type="number"
                  value={roiInputValue}
                  onChange={e => setRoiInputValue(e.target.value)}
                  placeholder="e.g. 18000"
                  style={{
                    fontFamily: NU, fontSize: 13, padding: "7px 12px", width: 140,
                    border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                    background: cardBg, color: textPrimary, outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                  letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Close rate (%)
                </label>
                <input
                  type="number"
                  value={roiInputRate}
                  onChange={e => setRoiInputRate(e.target.value)}
                  placeholder="e.g. 20"
                  min="1" max="100"
                  style={{
                    fontFamily: NU, fontSize: 13, padding: "7px 12px", width: 100,
                    border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                    background: cardBg, color: textPrimary, outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <button onClick={saveROISettings} disabled={savingROI} style={{
                  fontFamily: NU, fontSize: 12, fontWeight: 700, padding: "8px 18px",
                  background: GOLD, color: "#000", border: "none",
                  borderRadius: "var(--lwd-radius-input)",
                  cursor: savingROI ? "default" : "pointer", opacity: savingROI ? 0.6 : 1,
                }}>
                  {savingROI ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditingROI(false)} style={{
                  fontFamily: NU, fontSize: 12, padding: "8px 12px",
                  background: "transparent", color: textMuted,
                  border: `1px solid ${border}`,
                  borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ROI numbers */}
            <div style={{ display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                {
                  label: "Enquiries",
                  value: fmtNum(cs.enquirySubmitted),
                  sub: "received this period",
                  color: "#4ade80",
                },
                {
                  label: "Est. Bookings",
                  value: `0–${estBookingsHigh || 0}`,
                  sub: `at ${effectiveCloseRate}% close rate`,
                  color: GOLD,
                },
                {
                  label: "Est. Revenue",
                  value: estRevenueHigh > 0 ? `£0–${fmtGBP(estRevenueHigh)}` : "£0",
                  sub: `at ${fmtGBP(effectiveBookingValue)} avg value`,
                  color: GOLD,
                },
                {
                  label: "ROI Multiple",
                  value: estRevenueHigh > 0 ? `up to ${Math.round(estRevenueHigh / listingCost)}×` : "—",
                  sub: `vs £${listingCost.toLocaleString()}/yr listing cost`,
                  color: estRevenueHigh > 0 ? GOLD : textMuted,
                  highlight: estRevenueHigh > 0,
                },
              ].map(item => (
                <div key={item.label} style={{
                  padding: "14px 16px",
                  background: item.highlight
                    ? `rgba(201,168,76,0.07)`
                    : isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.highlight ? GOLD_BORDER : border}`,
                  borderRadius: "var(--lwd-radius-input)",
                  boxShadow: item.highlight ? `0 0 20px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.12)` : "none",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: item.highlight ? GOLD + "aa" : textMuted, marginBottom: 6 }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: GD, fontSize: isMobile ? 18 : 22,
                    fontWeight: 700, color: item.color, lineHeight: 1, marginBottom: 4,
                    ...(item.highlight ? { filter: "drop-shadow(0 0 8px rgba(201,168,76,0.4))" } : {}),
                  }}>
                    {item.value}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Assumptions footer */}
            <div style={{ fontFamily: NU, fontSize: 11, color: textMuted,
              borderTop: `1px solid ${border}`, paddingTop: 12, lineHeight: 1.6 }}>
              <span style={{ opacity: 0.7 }}>
                Based on {fmtGBP(effectiveBookingValue)} avg booking · {effectiveCloseRate}% close rate
                {!roiSettingsSet && " · category defaults — refine with your actual numbers above"}
              </span>
              {roiSettingsSet && (
                <span style={{ color: GOLD, marginLeft: 8 }}>
                  · personalised ✓
                </span>
              )}
            </div>

            {/* One booking argument */}
            <div style={{
              marginTop: 12,
              padding: "12px 16px",
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-input)",
            }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textPrimary, lineHeight: 1.6 }}>
                <strong>You only need one booking.</strong>{" "}
                One {effectiveBookingValue >= 1000 ? fmtGBP(effectiveBookingValue) : "booking"} wedding covers your
                listing investment many times over — and your listing is already generating interest.
              </span>
            </div>

            {/* Booking window insight */}
            <div style={{
              marginTop: 10,
              fontFamily: NU, fontSize: 11, color: textMuted,
              lineHeight: 1.6,
            }}>
              <span style={{ color: GOLD }}>✦</span>{" "}
              Couples enquiring <strong>right now</strong> are typically booking for{" "}
              <strong style={{ color: textPrimary }}>{bookingTarget}</strong>.
              {" "}Current activity = future revenue.
            </div>

            {/* ── Confirmed bookings strip ─────────────────────────────── */}
            <div style={{
              marginTop: 16,
              borderTop: `1px solid ${border}`,
              paddingTop: 16,
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div>
                {confirmedBookings > 0 ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                        textTransform: "uppercase", color: "#4ade80", marginBottom: 3 }}>
                        Confirmed this period
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28,
                          fontWeight: 700, color: "#4ade80", lineHeight: 1 }}>
                          {confirmedBookings} {confirmedBookings === 1 ? "booking" : "bookings"}
                        </span>
                        {confirmedRevenue > 0 && (
                          <span style={{ fontFamily: GD, fontSize: isMobile ? 16 : 20,
                            color: GOLD, fontWeight: 600 }}>
                            · {fmtGBP(confirmedRevenue)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, marginTop: 2 }}>
                        {confirmedRevenue > 0
                          ? `${Math.round((confirmedRevenue / listingCost) * 10) / 10}× ROI · confirmed`
                          : "marked from LWD enquiries"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                    Got a booking from an LWD enquiry? Mark it here — turns projection into proof.
                  </div>
                )}
              </div>

              {/* Mark as booked button */}
              {!showBookingModal && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 700,
                    padding: "9px 18px",
                    background: confirmedBookings > 0 ? GOLD_DIM : GOLD,
                    color: confirmedBookings > 0 ? GOLD : "#000",
                    border: `1px solid ${GOLD}`,
                    borderRadius: "var(--lwd-radius-input)",
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = GOLD;
                    e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = confirmedBookings > 0 ? GOLD_DIM : GOLD;
                    e.currentTarget.style.color = confirmedBookings > 0 ? GOLD : "#000";
                  }}
                >
                  {confirmedBookings > 0 ? "✓ Add another" : "✓ Mark a Booking"}
                </button>
              )}
            </div>

            {/* Booking input form */}
            {showBookingModal && (
              <div style={{
                marginTop: 12,
                padding: "16px 18px",
                background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "var(--lwd-radius-input)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
                  Record a confirmed booking from an LWD enquiry — this updates your verified ROI.
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontFamily: NU, fontSize: 9, color: textMuted,
                      letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      Booking value (£)
                    </label>
                    <input
                      type="number"
                      value={bookingInput}
                      onChange={e => setBookingInput(e.target.value)}
                      placeholder={`e.g. ${effectiveBookingValue}`}
                      autoFocus
                      style={{
                        fontFamily: NU, fontSize: 14, fontWeight: 600,
                        padding: "8px 12px", width: 140,
                        border: `1px solid ${border}`,
                        borderRadius: "var(--lwd-radius-input)",
                        background: cardBg, color: textPrimary, outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontFamily: NU, fontSize: 9, color: textMuted,
                      letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      Booking date
                    </label>
                    <input
                      type="date"
                      value={bookingDateInput}
                      onChange={e => setBookingDateInput(e.target.value)}
                      style={{
                        fontFamily: NU, fontSize: 13,
                        padding: "8px 12px", width: 150,
                        border: `1px solid ${border}`,
                        borderRadius: "var(--lwd-radius-input)",
                        background: cardBg, color: textPrimary, outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={saveBooking}
                      disabled={savingBooking || !bookingInput}
                      style={{
                        fontFamily: NU, fontSize: 12, fontWeight: 700,
                        padding: "9px 20px",
                        background: GOLD, color: "#000", border: "none",
                        borderRadius: "var(--lwd-radius-input)",
                        cursor: savingBooking || !bookingInput ? "default" : "pointer",
                        opacity: savingBooking || !bookingInput ? 0.5 : 1,
                      }}
                    >
                      {savingBooking ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => { setShowBookingModal(false); setBookingInput(""); }}
                      style={{
                        fontFamily: NU, fontSize: 12, padding: "9px 14px",
                        background: "transparent", color: textMuted,
                        border: `1px solid ${border}`,
                        borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Export section ──────────────────────────────────────────────── */}
      {!loading && stats && (
        <div style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)",
          padding: "20px 24px",
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 11, letterSpacing: "2px",
              textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
              Export this report
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
              For board presentations, owner updates, and quarterly reviews.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* CSV */}
            <button
              onClick={() => {
                const csv = buildCSV({
                  vendorName: vendor?.name,
                  rangeLabel,
                  stats: cs,
                  prevStats: prev,
                  sources,
                  countries,
                  compareList,
                  dailyViews,
                  interpretation,
                  touchPointsTotal,
                  touchPointsPerEnquiry,
                  estBookingsHigh,
                  estRevenueHigh,
                  mediaValueLow,
                  mediaValueHigh,
                  effectiveBookingValue,
                  effectiveCloseRate,
                  season,
                  bookingTarget,
                });
                const slug = (vendor?.name || "report")
                  .toLowerCase().replace(/[^a-z0-9]+/g, "-");
                downloadCSV(csv, `lwd-${slug}-${rangeLabel.toLowerCase().replace(/\s/g, "-")}.csv`);
              }}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 600,
                padding: "8px 16px", borderRadius: "var(--lwd-radius-input)",
                border: `1px solid ${border}`, background: "transparent",
                color: textPrimary, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textPrimary; }}
            >
              <span style={{ fontSize: 13 }}>↓</span> Download CSV
            </button>

            {/* Print / PDF */}
            <button
              onClick={() => {
                document.body.classList.add("lwd-printing");
                setTimeout(() => {
                  window.print();
                  document.body.classList.remove("lwd-printing");
                }, 80);
              }}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 600,
                padding: "8px 16px", borderRadius: "var(--lwd-radius-input)",
                border: `1px solid ${GOLD}`, background: GOLD_DIM,
                color: GOLD, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(201,168,76,0.22)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = GOLD_DIM; }}
            >
              <span style={{ fontSize: 13 }}>⎙</span> Save as PDF
            </button>
          </div>
        </div>
      )}

      {/* ── Print report (hidden; appears only on print / Save as PDF) ────── */}
      <div id="lwd-board-report" aria-hidden="true" style={{ display: "none" }}>
        <PrintReport
          vendor={vendor}
          rangeLabel={rangeLabel}
          stats={cs}
          prevStats={prev}
          sources={sources}
          countries={countries}
          compareList={compareList}
          dailyViews={dailyViews}
          interpretation={interpretation}
          liveCount={liveCount}
          touchPointsTotal={touchPointsTotal}
          touchPointsPerEnquiry={touchPointsPerEnquiry}
          mediaValueLow={mediaValueLow}
          mediaValueHigh={mediaValueHigh}
          estBookingsHigh={estBookingsHigh}
          estRevenueHigh={estRevenueHigh}
          effectiveBookingValue={effectiveBookingValue}
          effectiveCloseRate={effectiveCloseRate}
          season={season}
          bookingTarget={bookingTarget}
        />
      </div>

      {/* ── CSS ──────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.75; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Print / Save as PDF ── */
        @media print {
          body > * { visibility: hidden !important; }
          #lwd-board-report,
          #lwd-board-report * { visibility: visible !important; }
          #lwd-board-report {
            display: block !important;
            position: fixed !important;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            background: #fff !important;
            z-index: 99999;
            padding: 0; margin: 0;
          }
        }
        body.lwd-printing > * { visibility: hidden !important; }
        body.lwd-printing #lwd-board-report,
        body.lwd-printing #lwd-board-report * { visibility: visible !important; }
        body.lwd-printing #lwd-board-report {
          display: block !important;
          position: fixed !important;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #fff !important;
          z-index: 99999;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}
