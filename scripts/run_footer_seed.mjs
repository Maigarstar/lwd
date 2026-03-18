// scripts/run_footer_seed.mjs
// Run once: node scripts/run_footer_seed.mjs
// Seeds footer_config + footer_items with curated 6-column content.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qpkggfibwreznussudfh.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2dnZmlid3Jlem51c3N1ZGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc5NDk5NSwiZXhwIjoyMDg4MzcwOTk1fQ.lqs3nLD_7-Dv8IyXAJ_mLkc6GDAXQlOL4P3jaEIpfp0";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log("Seeding footer...");

  // ── 1. Upsert footer_config ───────────────────────────────────────────
  const { error: cfgErr } = await sb.from("footer_config").upsert({
    id: "homepage",
    layout_columns: 6,
    layout_type: "columns",
    pad_x: 64,
    pad_y: 72,
    bg_color: "#0b0906",
    bg_opacity: 1.0,
    text_color: "#d4c8b0",
    accent_color: "#c9a84c",
    border_top: true,
    border_color: "#2a2218",
    show_logo: true,
    logo_size: 28,
    show_tagline: true,
    tagline_text: "The world's most trusted luxury wedding directory. Connecting discerning couples with exceptional venues and professionals across 62 countries.",
    show_social: true,
    social_instagram: "",
    social_pinterest: "",
    social_tiktok: "",
    show_newsletter: true,
    newsletter_heading: "The LWD Edit",
    newsletter_subtext: "Monthly inspiration for modern luxury couples",
    newsletter_btn_label: "Subscribe",
    show_bottom_bar: true,
    bottom_bar_bg: "#080604",
    bottom_bar_text: "#5a5045",
    copyright_text: "2026 LuxuryWeddingDirectory.com · Est. 2006 · All rights reserved",
    strip_label: "Iconic Venues",
    visibility_mode: "all",
  }, { onConflict: "id" });
  if (cfgErr) { console.error("footer_config error:", cfgErr.message); process.exit(1); }
  console.log("  footer_config upserted");

  // ── 2. Clear existing items ───────────────────────────────────────────
  const { error: delErr } = await sb.from("footer_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) { console.error("delete error:", delErr.message); process.exit(1); }
  console.log("  footer_items cleared");

  // ── 3. Build all items ────────────────────────────────────────────────
  const items = [

    // col 0 — Iconic Venues strip
    {
      label: "Iconic Venues Strip", block_type: "iconic_venues",
      column_id: 0, position: 1, visible: true, link_type: "manual",
      iconic_venues: [
        { name: "The Peninsula Hotels", url: "" },
        { name: "Raffles",              url: "" },
        { name: "One and Only",         url: "" },
        { name: "Auberge Resorts",      url: "" },
        { name: "The Dorchester",       url: "" },
        { name: "Waldorf Astoria",      url: "" },
        { name: "Conrad",               url: "" },
        { name: "Park Hyatt",           url: "" },
        { name: "Banyan Tree",          url: "" },
        { name: "Jumeirah",             url: "" },
      ],
    },

    // col 2 — Couples (6 editorial links)
    { label: "COUPLES",            block_type: "heading", column_id: 2, position:  1, visible: true, link_type: "manual", url: "" },
    { label: "Browse Venues",      block_type: "link",    column_id: 2, position:  2, visible: true, link_type: "manual", url: "/venues" },
    { label: "Find Photographers", block_type: "link",    column_id: 2, position:  3, visible: true, link_type: "manual", url: "/vendors/photographers" },
    { label: "Wedding Planners",   block_type: "link",    column_id: 2, position:  4, visible: true, link_type: "manual", url: "/vendors/wedding-planners" },
    { label: "Real Weddings",      block_type: "link",    column_id: 2, position:  5, visible: true, link_type: "manual", url: "/real-weddings" },
    { label: "The Magazine",       block_type: "link",    column_id: 2, position:  6, visible: true, link_type: "manual", url: "/magazine" },
    { label: "Planning Checklist", block_type: "link",    column_id: 2, position:  7, visible: true, link_type: "manual", url: "/planning-checklist" },

    // col 3 — Vendors (with Success Stories)
    { label: "VENDORS",            block_type: "heading", column_id: 3, position:  1, visible: true, link_type: "manual", url: "" },
    { label: "List Your Business", block_type: "link",    column_id: 3, position:  2, visible: true, link_type: "manual", url: "/list-your-business" },
    { label: "Advertise",          block_type: "link",    column_id: 3, position:  3, visible: true, link_type: "manual", url: "/advertise" },
    { label: "Pricing Plans",      block_type: "link",    column_id: 3, position:  4, visible: true, link_type: "manual", url: "/pricing" },
    { label: "Success Stories",    block_type: "link",    column_id: 3, position:  5, visible: true, link_type: "manual", url: "/success-stories" },
    { label: "Vendor Dashboard",   block_type: "link",    column_id: 3, position:  6, visible: true, link_type: "manual", url: "/vendor-dashboard" },
    { label: "Vendor Blog",        block_type: "link",    column_id: 3, position:  7, visible: true, link_type: "manual", url: "/vendor-blog" },

    // col 4 — Destinations (curated locations)
    { label: "DESTINATIONS",    block_type: "heading", column_id: 4, position:  1, visible: true, link_type: "manual", url: "" },
    { label: "Lake Como",       block_type: "link",    column_id: 4, position:  2, visible: true, link_type: "manual", url: "/destinations/lake-como" },
    { label: "Amalfi Coast",    block_type: "link",    column_id: 4, position:  3, visible: true, link_type: "manual", url: "/destinations/amalfi-coast" },
    { label: "French Riviera",  block_type: "link",    column_id: 4, position:  4, visible: true, link_type: "manual", url: "/destinations/french-riviera" },
    { label: "Tuscany",         block_type: "link",    column_id: 4, position:  5, visible: true, link_type: "manual", url: "/destinations/tuscany" },
    { label: "Mykonos",         block_type: "link",    column_id: 4, position:  6, visible: true, link_type: "manual", url: "/destinations/mykonos" },
    { label: "Dubai",           block_type: "link",    column_id: 4, position:  7, visible: true, link_type: "manual", url: "/destinations/dubai" },
    { label: "All Destinations",block_type: "link",    column_id: 4, position:  8, visible: true, link_type: "manual", url: "/destinations" },

    // col 5 — Our Brands
    { label: "OUR BRANDS",       block_type: "heading", column_id: 5, position:  1, visible: true, link_type: "manual", url: "" },
    { label: "LWD Magazine",     block_type: "link",    column_id: 5, position:  2, visible: true, link_type: "manual", url: "/magazine" },
    { label: "Artistry Awards",  block_type: "link",    column_id: 5, position:  3, visible: true, link_type: "manual", url: "/artistry-awards" },
    { label: "The LWD Standard", block_type: "link",    column_id: 5, position:  4, visible: true, link_type: "manual", url: "/the-lwd-standard" },
    { label: "Getting Married",  block_type: "link",    column_id: 5, position:  5, visible: true, link_type: "manual", url: "/getting-married" },
    { label: "Real Weddings",    block_type: "link",    column_id: 5, position:  6, visible: true, link_type: "manual", url: "/real-weddings" },
    { label: "LWD Awards",       block_type: "link",    column_id: 5, position:  7, visible: true, link_type: "manual", url: "/lwd-awards" },

    // col 6 — Company
    { label: "COMPANY",              block_type: "heading", column_id: 6, position:  1, visible: true, link_type: "manual", url: "" },
    { label: "About Us",             block_type: "link",    column_id: 6, position:  2, visible: true, link_type: "manual", url: "/about" },
    { label: "Editorial Standards",  block_type: "link",    column_id: 6, position:  3, visible: true, link_type: "manual", url: "/editorial-standards" },
    { label: "Press & Media",        block_type: "link",    column_id: 6, position:  4, visible: true, link_type: "manual", url: "/press" },
    { label: "Careers",              block_type: "link",    column_id: 6, position:  5, visible: true, link_type: "manual", url: "/careers" },
    { label: "Contact",              block_type: "link",    column_id: 6, position:  6, visible: true, link_type: "manual", url: "/contact" },
    { label: "Privacy Policy",       block_type: "link",    column_id: 6, position:  7, visible: true, link_type: "manual", url: "/privacy-policy" },

    // col 99 — Bottom bar
    { label: "Privacy", block_type: "link", column_id: 99, position: 1, visible: true, link_type: "manual", url: "/privacy" },
    { label: "Terms",   block_type: "link", column_id: 99, position: 2, visible: true, link_type: "manual", url: "/terms" },
    { label: "Cookies", block_type: "link", column_id: 99, position: 3, visible: true, link_type: "manual", url: "/cookies" },
    { label: "Sitemap", block_type: "link", column_id: 99, position: 4, visible: true, link_type: "manual", url: "/sitemap" },
    { label: "Admin",   block_type: "link", column_id: 99, position: 5, visible: true, link_type: "manual", url: "/admin" },
  ];

  // ── 4. Insert in batches ──────────────────────────────────────────────
  const batchSize = 20;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error } = await sb.from("footer_items").insert(batch);
    if (error) { console.error(`insert error (batch ${i}):`, error.message); process.exit(1); }
  }

  console.log(`  ${items.length} footer_items inserted`);
  console.log("Done.");
}

run().catch(e => { console.error(e); process.exit(1); });
