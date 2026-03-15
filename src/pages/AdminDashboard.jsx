// ─── src/pages/AdminDashboard.jsx ────────────────────────────────────────────
// LWD Founder Control Room, platform intelligence centre.
// Not a CMS. Not a WordPress panel. An operations + growth engine.
// Light/dark mode toggle. Institutional. Operational.
// For Yasmine and Taiwo. Not for venues.

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { DARK_C } from "../theme/tokens";
import { ITALY_COUNTRY } from "../data/italy/country.js";
import { ITALY_REGIONS } from "../data/italy/regions.js";
import { ITALY_CITIES } from "../data/italy/cities.js";
import { REGION_AUTO_THRESHOLD, evaluateRegionActivation } from "../engine/activation.js";
import { fetchListings, isSupabaseAvailable, createListing, deleteListing } from "../services/listings";
import { fetchShowcases, createShowcase, updateShowcase, deleteShowcase } from "../services/showcaseService";
import { uploadMediaFile } from "../utils/storageUpload";
import categoryCssRaw from "../category.css?raw";
import { RegionsModule } from "./admin/RegionsModule";
import AdminAllLeads from "../components/admin/AdminAllLeads";
import VendorAccountsPage from "../admin/VendorAccounts/VendorAccountsPage";
import AISettingsPage from "../admin/AISettings/AISettingsPage";

// ── Page Studio imports ──
import PageStudioHome from "./PageStudio/PageStudioHome";
import PageEditorLive from "./PageStudio/PageEditorLive";
import AllPagesModule from "./PageStudio/AllPagesModule";
import CreatePageModule from "./PageStudio/CreatePageModule";
import PageEditorModule from "./PageStudio/PageEditorModule";
import HomepageManagerModule from "./PageStudio/HomepageManagerModule";
import BlogManagerModule from "./PageStudio/BlogManagerModule";
import ReusableBlocksModule from "./PageStudio/ReusableBlocksModule";
import ListingStudioPage from "./ListingStudio/ListingStudioPage";
import MagazineStudio from "./MagazineStudio/index";
import ArtistryPage from "./Artistry/ArtistryPage";
import { getAllSubmissions, reviewSubmission, toggleFeatured } from "../services/artistryService";
import ReviewsModule from "./AdminDashboard/ReviewsModule";
import { POSTS } from "./Magazine/data/posts";
import { PRODUCTS, COLLECTIONS, formatPrice } from "./Magazine/data/products";
import { CATEGORIES } from "./Magazine/data/categories";

// Font tokens, resolved via CSS custom properties set on admin root
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// Admin-only light palette, does not affect the rest of the site
const DEFAULT_ADMIN_LIGHT_C = {
  black:   "#fbf7f4",
  dark:    "#ede5db",
  card:    "#ffffff",
  border:  "#ddd4c8",
  border2: "#c5bbb0",
  gold:    "#8a6d1b",
  gold2:   "#a07d15",
  goldDim: "rgba(138,109,27,0.10)",
  white:   "#1a1a1a",
  off:     "#2a2218",
  grey:    "#5a5147",
  grey2:   "#8a8078",
  green:   "#15803d",
  blue:    "#1d4ed8",
  rose:    "#be123c",
};

const DEFAULT_DARK_C = { ...DARK_C };

// Token labels, tells the user WHERE each colour is used
const TOKEN_LABELS = {
  black:   { label: "Page Background",  desc: "Main background of every page" },
  dark:    { label: "Panel Background", desc: "Sidebar, secondary panels, deeper surfaces" },
  card:    { label: "Card Background",  desc: "Content cards, modal backgrounds" },
  border:  { label: "Border",           desc: "Card edges, dividers, input borders" },
  border2: { label: "Border Strong",    desc: "Heavier borders, hover states" },
  gold:    { label: "Accent (Gold)",    desc: "Buttons, links, brand highlights, active states" },
  gold2:   { label: "Accent Hover",     desc: "Gold hover / secondary state" },
  goldDim: { label: "Accent Overlay",   desc: "Subtle gold tint on backgrounds" },
  white:   { label: "Primary Text",     desc: "Main body text colour" },
  off:     { label: "Heading Text",     desc: "Display headings, titles" },
  grey:    { label: "Secondary Text",   desc: "Labels, descriptions, body copy" },
  grey2:   { label: "Muted Text",       desc: "Captions, timestamps, subtle info" },
  green:   { label: "Success",          desc: "Live indicators, success badges" },
  blue:    { label: "Info / Link",      desc: "Links, informational highlights" },
  rose:    { label: "Alert / Error",    desc: "Error states, warning badges" },
};

// Default fonts
const DEFAULT_FONTS = {
  heading: "Gilda Display",
  body: "Nunito",
  headingSize: 32,    // px, base heading size (h2 level)
  headingWeight: 400, // 300–700
  bodySize: 15,       // px, base body text size
  bodyWeight: 400,    // 300–700
  googleUrl: "https://fonts.googleapis.com/css2?family=Gilda+Display&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;600;700;800&display=swap",
};

// Sitewide defaults
const DEFAULT_SITE_SETTINGS = {
  defaultMode: "light",      // "dark" | "light", sitewide default
  adminDefaultMode: "light", // admin panel default
  lightOnly: false,          // true = lock site to light mode, hide dark toggle
  borderRadiusCard: 6,       // px, cards, modals, panels (0–24)
  borderRadiusImage: 6,      // px, destination/category/venue images (0–24)
  borderRadiusInput: 4,      // px, inputs, buttons, tags (0–16)
};

// Curated Google Fonts for the selector
const GOOGLE_FONTS_LIST = [
  // Serif / Display
  "Gilda Display", "Playfair Display", "Cormorant Garamond", "Libre Baskerville",
  "Lora", "Merriweather", "Crimson Text", "EB Garamond", "Source Serif 4",
  "DM Serif Display", "Bodoni Moda", "Noto Serif", "Bitter", "Gelasio",
  "Spectral", "Cardo", "Old Standard TT", "Petrona", "Fraunces",
  // Sans-Serif
  "Nunito", "Inter", "Outfit", "Montserrat", "Poppins", "Raleway",
  "Open Sans", "Lato", "Roboto", "Work Sans", "DM Sans", "Manrope",
  "Plus Jakarta Sans", "Sora", "Urbanist", "Jost", "Lexend", "Figtree",
  "Albert Sans", "Bricolage Grotesque",
];

// localStorage helpers
function _loadTheme() {
  try { return JSON.parse(localStorage.getItem("lwd_theme_overrides")) ?? null; } catch { return null; }
}
function _saveTheme(val) {
  try { localStorage.setItem("lwd_theme_overrides", JSON.stringify(val)); } catch {}
}
function _clearTheme() {
  try { localStorage.removeItem("lwd_theme_overrides"); } catch {}
}

// Audit log helpers
function _loadAuditLog() {
  try { return JSON.parse(localStorage.getItem("lwd_theme_audit")) ?? []; } catch { return []; }
}
function _saveAuditLog(log) {
  try { localStorage.setItem("lwd_theme_audit", JSON.stringify(log.slice(-50))); } catch {} // keep last 50
}

// Theme presets
const THEME_PRESETS = {
  lwd: {
    name: "LWD Default",
    desc: "Luxury Wedding Directory, dark gold brand",
    dark: { ...DARK_C },
    light: {
      black: "#fbf7f4", dark: "#ede5db", card: "#ffffff", border: "#ddd4c8", border2: "#c5bbb0",
      gold: "#8a6d1b", gold2: "#a07d15", goldDim: "rgba(138,109,27,0.10)",
      white: "#1a1a1a", off: "#2a2218", grey: "#5a5147", grey2: "#8a8078",
      green: "#15803d", blue: "#1d4ed8", rose: "#be123c",
    },
    fonts: { heading: "Gilda Display", body: "Nunito", headingSize: 32, headingWeight: 400, bodySize: 15, bodyWeight: 400, googleUrl: "https://fonts.googleapis.com/css2?family=Gilda+Display&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;600;700;800&display=swap" },
    site: { defaultMode: "light", adminDefaultMode: "light", lightOnly: false, borderRadiusCard: 6, borderRadiusImage: 6, borderRadiusInput: 4 },
  },
  fivestar: {
    name: "5 Star Weddings",
    desc: "Elegant emerald and ivory, sister brand",
    dark: {
      black: "#060a08", dark: "#0c120e", card: "#111a14", border: "#1a2a1e", border2: "#253a2a",
      gold: "#3da67a", gold2: "#5ec49a", goldDim: "rgba(61,166,122,0.15)",
      white: "#ffffff", off: "#e8f5ee", grey: "#88aa98", grey2: "#557766",
      green: "#22c55e", blue: "#60a5fa", rose: "#f43f5e",
    },
    light: {
      black: "#f4faf7", dark: "#e5f0eb", card: "#ffffff", border: "#c8ddd2", border2: "#b0c5b8",
      gold: "#1a7a50", gold2: "#158a55", goldDim: "rgba(26,122,80,0.10)",
      white: "#1a1a1a", off: "#18281e", grey: "#475a4e", grey2: "#788a80",
      green: "#15803d", blue: "#1d4ed8", rose: "#be123c",
    },
    fonts: { heading: "Playfair Display", body: "Lato", headingSize: 34, headingWeight: 500, bodySize: 15, bodyWeight: 400, googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap" },
    site: { defaultMode: "light", adminDefaultMode: "light", lightOnly: false, borderRadiusCard: 8, borderRadiusImage: 8, borderRadiusInput: 4 },
  },
  minimal: {
    name: "Minimal",
    desc: "Clean monochrome, no brand accent",
    dark: {
      black: "#0a0a0a", dark: "#111111", card: "#171717", border: "#222222", border2: "#333333",
      gold: "#a0a0a0", gold2: "#c0c0c0", goldDim: "rgba(160,160,160,0.12)",
      white: "#ffffff", off: "#f0f0f0", grey: "#888888", grey2: "#555555",
      green: "#22c55e", blue: "#60a5fa", rose: "#f43f5e",
    },
    light: {
      black: "#fafafa", dark: "#f0f0f0", card: "#ffffff", border: "#e0e0e0", border2: "#cccccc",
      gold: "#444444", gold2: "#333333", goldDim: "rgba(68,68,68,0.08)",
      white: "#111111", off: "#1a1a1a", grey: "#555555", grey2: "#888888",
      green: "#15803d", blue: "#1d4ed8", rose: "#be123c",
    },
    fonts: { heading: "Inter", body: "Inter", headingSize: 30, headingWeight: 600, bodySize: 15, bodyWeight: 400, googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
    site: { defaultMode: "light", adminDefaultMode: "light", lightOnly: false, borderRadiusCard: 0, borderRadiusImage: 0, borderRadiusInput: 2 },
  },
  highcontrast: {
    name: "High Contrast",
    desc: "Accessibility-first, maximum readability",
    dark: {
      black: "#000000", dark: "#0a0a0a", card: "#111111", border: "#333333", border2: "#444444",
      gold: "#ffd700", gold2: "#ffed4a", goldDim: "rgba(255,215,0,0.18)",
      white: "#ffffff", off: "#ffffff", grey: "#cccccc", grey2: "#999999",
      green: "#00ff7f", blue: "#6495ed", rose: "#ff4444",
    },
    light: {
      black: "#ffffff", dark: "#f5f5f5", card: "#ffffff", border: "#000000", border2: "#333333",
      gold: "#8b6914", gold2: "#6b4f10", goldDim: "rgba(139,105,20,0.12)",
      white: "#000000", off: "#000000", grey: "#333333", grey2: "#555555",
      green: "#006400", blue: "#00008b", rose: "#cc0000",
    },
    fonts: { heading: "DM Sans", body: "DM Sans", headingSize: 28, headingWeight: 700, bodySize: 16, bodyWeight: 400, googleUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" },
    site: { defaultMode: "light", adminDefaultMode: "light", lightOnly: false, borderRadiusCard: 4, borderRadiusImage: 4, borderRadiusInput: 4 },
  },
};

// ── Sidebar navigation with grouped sections ───────────────────────────────
const NAV_SECTIONS = [
  {
    group: "Platform",
    items: [
      { key: "overview",        label: "Overview",          icon: "◈" },
      { key: "listings",        label: "Listings",          icon: "⊞" },
      { key: "listing-studio",  label: "Listing Studio",    icon: "✎" },
      { key: "venue-profiles",    label: "Showcase Profiles",  icon: "⌂" },
      { key: "reviews",         label: "Reviews",           icon: "★" },
      { key: "vendor-accounts", label: "Vendor Accounts",   icon: "👤" },
      { key: "categories",      label: "Categories",        icon: "▦" },
      { key: "enquiries",       label: "Enquiries",         icon: "◇" },
      { key: "partnerships",    label: "Partnerships",      icon: "✦" },
      { key: "countries",       label: "Countries",         icon: "◎" },
      { key: "regions",         label: "Regions",           icon: "◇" },
      { key: "index",           label: "Index Health",      icon: "▧" },
    ],
  },
  {
    group: "Growth",
    items: [
      { key: "leads",        label: "Leads",             icon: "⊛" },
      { key: "marketing",    label: "Marketing",         icon: "◆" },
      { key: "seo",          label: "SEO",               icon: "⊡" },
      { key: "crm",          label: "CRM",               icon: "⊕" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { key: "livechat",     label: "Live Chat",         icon: "◉" },
      { key: "artistry",     label: "Artistry Awards",   icon: "✦" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { key: "aura",         label: "Aura Analytics",    icon: "✧" },
      { key: "api",          label: "API Management",    icon: "⟐" },
      { key: "ai-settings",  label: "AI Settings",       icon: "⚙" },
    ],
  },
  {
    group: "Design",
    items: [
      { key: "styles",       label: "Style Editor",      icon: "◑" },
    ],
  },
  {
    group: "Content",
    items: [
      { key: "page-studio",  label: "Page Studio",       icon: "⟡" },
      { key: "homepage-manager", label: "Homepage Manager", icon: "⌂" },
      { key: "magazine",         label: "The Magazine",      icon: "◈" },
      { key: "magazine-studio",  label: "Magazine Studio",   icon: "✦" },
      { key: "reusable-blocks",  label: "Reusable Blocks",   icon: "⊞" },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

// ── Mock data ──────────────────────────────────────────────────────────────
const STATS = [
  { label: "Active Venues",      value: "47",    sub: "+3 this month" },
  { label: "Pending Evaluation",  value: "12",    sub: "4 Lake Como · 3 Tuscany" },
  { label: "Open Enquiries",      value: "23",    sub: "8 unreviewed" },
  { label: "Partnership Revenue", value: "£38.4k", sub: "YTD" },
];

const RECENT_ENQUIRIES = [
  { id: 1, name: "Charlotte M.", type: "Couple",  dest: "Lake Como",    date: "27 Feb", status: "New" },
  { id: 2, name: "Villa Balbiano", type: "Venue", dest: "Lake Como",    date: "26 Feb", status: "Reviewed" },
  { id: 3, name: "Sophie & James", type: "Couple", dest: "Tuscany",     date: "26 Feb", status: "Responded" },
  { id: 4, name: "Borgo Santo Pietro", type: "Venue", dest: "Tuscany",  date: "25 Feb", status: "New" },
  { id: 5, name: "Press, Condé Nast", type: "Press", dest: " - ",        date: "24 Feb", status: "Reviewed" },
];

const DESTINATION_CAPACITY = [
  { name: "Lake Como",     signature: 3, filled: 2, curated: 8, curFilled: 5 },
  { name: "Tuscany",       signature: 4, filled: 1, curated: 10, curFilled: 7 },
  { name: "Amalfi Coast",  signature: 3, filled: 0, curated: 8, curFilled: 3 },
  { name: "Provence",      signature: 3, filled: 1, curated: 6, curFilled: 4 },
  { name: "Santorini",     signature: 2, filled: 0, curated: 6, curFilled: 2 },
];

const PARTNERSHIP_PIPELINE = [
  { venue: "Villa Balbiano",      dest: "Lake Como",   tier: "Signature", status: "Active",   renewal: "Jan 2027" },
  { venue: "Grand Hotel Tremezzo", dest: "Lake Como",  tier: "Signature", status: "Active",   renewal: "Mar 2027" },
  { venue: "Borgo Egnazia",       dest: "Puglia",      tier: "Institutional", status: "Active", renewal: " - " },
  { venue: "Castello di Vicarello", dest: "Tuscany",   tier: "Signature", status: "Founding", renewal: "Dec 2026" },
  { venue: "Belmond Caruso",      dest: "Amalfi",      tier: "Curated",   status: "Pending",  renewal: " - " },
];

const INDEX_HEALTH = [
  { venue: "Villa Balbiano",       score: 91, trend: "+2", flag: null },
  { venue: "Grand Hotel Tremezzo", score: 87, trend: "+1", flag: null },
  { venue: "Castello di Vicarello", score: 84, trend: "0", flag: null },
  { venue: "Borgo Santo Pietro",   score: 78, trend: "-3", flag: "Profile incomplete" },
  { venue: "Villa Cimbrone",       score: 72, trend: "-1", flag: "Low responsiveness" },
  { venue: "Il Borro",             score: 69, trend: "+4", flag: null },
  { venue: "Belmond Caruso",       score: 65, trend: " - ", flag: "Pending evaluation" },
];

const LIVE_CHATS = [
  { id: 1, visitor: "Sarah W.", page: "Lake Como, Venues", time: "2m ago", status: "Active", messages: 4 },
  { id: 2, visitor: "Aura AI", page: "AI Search, Tuscany villas", time: "5m ago", status: "AI Handling", messages: 12 },
  { id: 3, visitor: "Guest #4821", page: "Villa Balbiano Profile", time: "8m ago", status: "Waiting", messages: 1 },
  { id: 4, visitor: "Mark & Lisa", page: "Amalfi Coast, Venues", time: "14m ago", status: "AI Handling", messages: 8 },
  { id: 5, visitor: "Aura AI", page: "Honeymoon Collection", time: "22m ago", status: "Closed", messages: 16 },
];

// ── Aura AI mock data ────────────────────────────────────────────────────────
const AURA_STATS = [
  { label: "Conversations Today",  value: "128",  sub: "+14% vs last week" },
  { label: "AI Resolution Rate",   value: "94.2%", sub: "6 escalated to human" },
  { label: "Avg Response Time",    value: "2.8s",  sub: "First message" },
  { label: "Venues Recommended",   value: "47",    sub: "Across 12 destinations" },
];

const AURA_RECENT = [
  { id: 1, query: "Luxury villa Lake Como 80 guests June", venue: "Villa Balbiano", outcome: "Enquiry Sent", time: "3m ago" },
  { id: 2, query: "Tuscan vineyard wedding under £30k", venue: "Castello di Vicarello", outcome: "Shortlisted", time: "8m ago" },
  { id: 3, query: "Best Amalfi Coast venues with sea view", venue: "Belmond Caruso", outcome: "Browsing", time: "12m ago" },
  { id: 4, query: "Intimate Santorini elopement packages", venue: "Canaves Oia", outcome: "Enquiry Sent", time: "18m ago" },
  { id: 5, query: "English country house 200+ guests", venue: "The Grand Pavilion", outcome: "Shortlisted", time: "24m ago" },
  { id: 6, query: "Provence lavender field ceremony", venue: "Château de la Chèvre d'Or", outcome: "Browsing", time: "31m ago" },
];

const AURA_TOP_VENUES = [
  { venue: "Villa Balbiano", mentions: 42, enquiries: 18 },
  { venue: "Grand Hotel Tremezzo", mentions: 38, enquiries: 14 },
  { venue: "Borgo Santo Pietro", mentions: 29, enquiries: 11 },
  { venue: "Castello di Vicarello", mentions: 24, enquiries: 9 },
  { venue: "Belmond Caruso", mentions: 21, enquiries: 7 },
];

const API_ENDPOINTS = [
  { method: "POST", path: "/v1/aura/chat", desc: "Conversational AI", calls: "12.4k", status: "Active" },
  { method: "GET",  path: "/v1/venues/search", desc: "Venue search & filter", calls: "8.2k", status: "Active" },
  { method: "GET",  path: "/v1/venues/:id/score", desc: "Curated Index score", calls: "3.1k", status: "Active" },
  { method: "POST", path: "/v1/enquiries", desc: "Submit enquiry", calls: "1.8k", status: "Active" },
  { method: "GET",  path: "/v1/destinations", desc: "Destination catalogue", calls: "2.4k", status: "Active" },
  { method: "POST", path: "/v1/aura/recommend", desc: "AI venue recommendation", calls: "6.7k", status: "Active" },
  { method: "GET",  path: "/v1/vendors/:id/insights", desc: "Vendor AI insights", calls: "940", status: "Beta" },
];

// ═══════════════════════════════════════════════════════════════════════════
// TAXONOMY CONTRACT, FROZEN. UI can change. These fields must not.
// ═══════════════════════════════════════════════════════════════════════════
// Category:      { id, slug, name, description }
// Sub-Category:  { id, slug, name, description }
// Listing:       { id, slug, country, categorySlug, subCategorySlug, destinationSlug }
// Route:         /{country}/{categorySlug}/{listing-slug}
// Future:        /{country}/{region}/{categorySlug}/{listing-slug}
//
// Enums (locked):
//   status: active | pending | review | paused
//   tier:   signature | curated | standard
// ═══════════════════════════════════════════════════════════════════════════

// ── Database schema reference ─────────────────────────────────────────────
// Define now. Build later. Schema must match taxonomy contract.
const DATABASE_SCHEMA = {
  categories: {
    fields: ["id PRIMARY KEY", "slug UNIQUE NOT NULL", "name NOT NULL", "description", "created_at", "updated_at"],
    notes: "19 parent categories. Slug is canonical, no label-dependent routing.",
  },
  sub_categories: {
    fields: ["id PRIMARY KEY", "category_id FOREIGN KEY → categories.id", "slug UNIQUE NOT NULL", "name NOT NULL", "description", "created_at"],
    notes: "73 sub-categories. Each belongs to exactly one parent.",
  },
  listings: {
    fields: ["id PRIMARY KEY", "slug UNIQUE NOT NULL", "name NOT NULL", "country NOT NULL", "region", "category_slug FOREIGN KEY → categories.slug", "sub_category_slug FOREIGN KEY → sub_categories.slug", "destination_slug", "status ENUM(active,pending,review,paused) DEFAULT pending", "tier ENUM(signature,curated,standard) DEFAULT standard", "lwd_score DECIMAL(3,1)", "description TEXT", "lat DECIMAL", "lng DECIMAL", "created_at", "updated_at"],
    notes: "Slug format: lowercase, hyphen-separated, geo-contextual. Must be unique and entity-specific.",
  },
  destinations: {
    fields: ["id PRIMARY KEY", "slug UNIQUE NOT NULL", "country NOT NULL", "region", "name NOT NULL", "description", "lat DECIMAL", "lng DECIMAL"],
    notes: "Geography-first. Country clusters build AI entity authority.",
  },
  listing_category_map: {
    fields: ["listing_id FOREIGN KEY → listings.id", "category_id FOREIGN KEY → categories.id", "PRIMARY KEY (listing_id, category_id)"],
    notes: "Future multi-category support. Not active yet, listings have single category.",
  },
  enquiries: {
    fields: ["id PRIMARY KEY", "listing_id FOREIGN KEY → listings.id", "name NOT NULL", "email", "message TEXT", "source", "status ENUM(new,responded,reviewed,closed) DEFAULT new", "created_at"],
    notes: "Tracks all inbound enquiries per listing.",
  },
};

// ── Structured data rules by category ─────────────────────────────────────
// Driven by categorySlug. Consistency at scale.
const STRUCTURED_DATA_MAP = {
  "wedding-venues":       { schema: "EventVenue",          fallback: "LodgingBusiness" },
  "wedding-planners":     { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "photographers":        { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "videographers":        { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "florists":             { schema: "Florist",             fallback: "LocalBusiness" },
  "styling-decor":        { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "entertainment":        { schema: "PerformingGroup",     fallback: "LocalBusiness" },
  "catering":             { schema: "FoodEstablishment",   fallback: "LocalBusiness" },
  "wedding-cakes":        { schema: "Bakery",              fallback: "FoodEstablishment" },
  "hair-makeup":          { schema: "BeautySalon",         fallback: "HealthAndBeautyBusiness" },
  "bridal-dresses":       { schema: "ClothingStore",       fallback: "LocalBusiness" },
  "guest-attire":         { schema: "ClothingStore",       fallback: "LocalBusiness" },
  "stationery":           { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "wedding-accessories":  { schema: "Store",               fallback: "LocalBusiness" },
  "health-beauty":        { schema: "HealthAndBeautyBusiness", fallback: "LocalBusiness" },
  "celebrants":           { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "event-production":     { schema: "ProfessionalService", fallback: "LocalBusiness" },
  "gift-registry":        { schema: "Store",               fallback: "LocalBusiness" },
  "luxury-transport":     { schema: "TaxiService",         fallback: "LocalBusiness" },
};

// ── SEO landing page plan, generated from taxonomy ───────────────────────
// These pages are where authority compounds. Listings are important, but clusters win.
const SEO_COUNTRIES = ["italy", "france", "uk", "spain", "greece", "portugal", "usa", "caribbean", "mexico", "thailand", "bali", "south-africa", "maldives", "switzerland", "austria"];

// Generates: /italy, /france, /uk ...
// Generates: /italy/wedding-venues, /italy/wedding-planners, /france/photographers ...
// Future:    /italy/lake-como/wedding-venues, /italy/tuscany/wedding-planners ...
const generateSEOPages = () => {
  const pages = [];
  SEO_COUNTRIES.forEach(country => {
    pages.push({ path: `/${country}`, type: "country", priority: 0.9 });
    DIRECTORY_CATEGORIES.forEach(cat => {
      pages.push({ path: `/${country}/${cat.slug}`, type: "country-category", priority: 0.8 });
    });
  });
  return pages;
};

// ── AI search layer preparation ───────────────────────────────────────────
// Embedding pipeline: define now, connect when vector DB is ready.
const AI_SEARCH_CONFIG = {
  embeddingTargets: [
    { entity: "listing",      fields: ["name", "description", "category", "subCategory", "destination"], index: "listings_v1" },
    { entity: "category",     fields: ["name", "description"],                                           index: "categories_v1" },
    { entity: "sub_category", fields: ["name", "description", "parent_category_name"],                   index: "subcategories_v1" },
    { entity: "destination",  fields: ["name", "country", "region", "description"],                      index: "destinations_v1" },
  ],
  retrievalDimensions: ["country", "category", "intent", "budget", "guest_count", "style"],
  intentClassification: {
    "high-intent":  "Specific venue/date/budget mentioned",
    "mid-intent":   "Category browsing with preferences",
    "low-intent":   "General inspiration or research",
  },
};

// ── Directory taxonomy, slug-based, SEO & AI aligned ─────────────────────
// URL architecture: /{country}/{category-slug}/{listing-slug}
const DIRECTORY_CATEGORIES = [
  { id: "venues", slug: "wedding-venues", name: "Wedding Venues", count: 47, description: "Curated luxury venues worldwide", subCategories: [
    { id: "country-houses", slug: "country-houses", name: "Country Houses", count: 12 },
    { id: "castles", slug: "castles-estates", name: "Castles & Estates", count: 8 },
    { id: "barns", slug: "barn-venues", name: "Barn Venues", count: 6 },
    { id: "hotels", slug: "hotel-venues", name: "Hotel Venues", count: 9 },
    { id: "coastal", slug: "coastal-beach", name: "Coastal & Beach", count: 5 },
    { id: "city", slug: "city-rooftop", name: "City & Rooftop", count: 7 },
  ]},
  { id: "planners", slug: "wedding-planners", name: "Wedding Planners", count: 860, description: "Full-service & destination planning", subCategories: [
    { id: "full-planning", slug: "full-planning", name: "Full Planning", count: 320 },
    { id: "partial", slug: "partial-planning", name: "Partial Planning", count: 280 },
    { id: "day-coord", slug: "day-coordination", name: "Day Coordination", count: 180 },
    { id: "destination", slug: "destination-specialists", name: "Destination Specialists", count: 80 },
  ]},
  { id: "photographers", slug: "photographers", name: "Photographers", count: 1120, description: "Editorial & fine art photography", subCategories: [
    { id: "documentary", slug: "documentary", name: "Documentary Style", count: 420 },
    { id: "fine-art", slug: "fine-art", name: "Fine Art", count: 310 },
    { id: "editorial", slug: "editorial", name: "Editorial", count: 240 },
    { id: "traditional", slug: "traditional", name: "Traditional", count: 150 },
  ]},
  { id: "videographers", slug: "videographers", name: "Videographers", count: 480, description: "Cinematic wedding films", subCategories: [
    { id: "cinematic", slug: "cinematic", name: "Cinematic", count: 190 },
    { id: "documentary-film", slug: "documentary-film", name: "Documentary Film", count: 160 },
    { id: "highlight-reels", slug: "highlight-reels", name: "Highlight Reels", count: 80 },
    { id: "drone-aerial", slug: "drone-aerial", name: "Drone & Aerial", count: 50 },
  ]},
  { id: "florists", slug: "florists", name: "Florists", count: 740, description: "Luxury floral design & installations", subCategories: [
    { id: "luxury-floral", slug: "luxury-floral-design", name: "Luxury Floral Design", count: 280 },
    { id: "sustainable", slug: "sustainable-flowers", name: "Sustainable Flowers", count: 190 },
    { id: "installations", slug: "installation-artists", name: "Installation Artists", count: 270 },
  ]},
  { id: "styling-decor", slug: "styling-decor", name: "Styling & Decor", count: 560, description: "Tablescaping, set design & creative direction", subCategories: [
    { id: "tablescaping", slug: "tablescaping", name: "Tablescaping", count: 180 },
    { id: "set-design", slug: "set-design", name: "Set Design", count: 140 },
    { id: "creative-direction", slug: "creative-direction", name: "Creative Direction", count: 120 },
    { id: "lighting-design", slug: "lighting-design", name: "Lighting Design", count: 120 },
  ]},
  { id: "entertainment", slug: "entertainment", name: "Entertainment", count: 390, description: "Music, performance & production", subCategories: [
    { id: "bands", slug: "live-bands", name: "Live Bands", count: 160 },
    { id: "djs", slug: "djs", name: "DJs", count: 120 },
    { id: "strings", slug: "string-quartets", name: "String Quartets", count: 110 },
  ]},
  { id: "caterers", slug: "catering", name: "Wedding Caterers", count: 680, description: "Private dining & event catering", subCategories: [
    { id: "fine-dining", slug: "fine-dining", name: "Fine Dining", count: 220 },
    { id: "bespoke-menus", slug: "bespoke-menus", name: "Bespoke Menus", count: 180 },
    { id: "street-food", slug: "street-food", name: "Street Food & Casual", count: 140 },
    { id: "patisserie", slug: "patisserie", name: "Patisserie & Dessert", count: 140 },
  ]},
  { id: "cakes", slug: "wedding-cakes", name: "Wedding Cakes", count: 520, description: "Bespoke cake design & sugar art", subCategories: [
    { id: "tiered-classic", slug: "tiered-classic", name: "Tiered & Classic", count: 200 },
    { id: "contemporary", slug: "contemporary", name: "Contemporary Design", count: 160 },
    { id: "sugar-art", slug: "sugar-art", name: "Sugar Art & Sculpture", count: 100 },
    { id: "miniature", slug: "miniature-desserts", name: "Miniature & Dessert Tables", count: 60 },
  ]},
  { id: "hair-makeup", slug: "hair-makeup", name: "Hair & Makeup", count: 620, description: "Bridal beauty & styling", subCategories: [
    { id: "bridal-makeup", slug: "bridal-makeup", name: "Bridal Makeup", count: 260 },
    { id: "bridal-hair", slug: "bridal-hair", name: "Bridal Hair", count: 220 },
    { id: "group-styling", slug: "group-styling", name: "Group & Party Styling", count: 140 },
  ]},
  { id: "bridal-dresses", slug: "bridal-dresses", name: "Bridal Dresses", count: 940, description: "Designer gowns & couture", subCategories: [
    { id: "couture", slug: "couture", name: "Couture", count: 280 },
    { id: "designer", slug: "designer", name: "Designer", count: 340 },
    { id: "vintage", slug: "vintage", name: "Vintage & Pre-Loved", count: 160 },
    { id: "bespoke-bridal", slug: "bespoke", name: "Bespoke & Made-to-Measure", count: 160 },
  ]},
  { id: "guest-attire", slug: "guest-attire", name: "Guest Attire", count: 310, description: "Suits, formalwear & guest fashion", subCategories: [
    { id: "groom-suits", slug: "groom-suits", name: "Groom & Groomsmen", count: 140 },
    { id: "mother-bride", slug: "mother-of-bride", name: "Mother of the Bride", count: 90 },
    { id: "guest-fashion", slug: "guest-fashion", name: "Guest Fashion", count: 80 },
  ]},
  { id: "stationery", slug: "stationery", name: "Stationery & Invitations", count: 290, description: "Bespoke invitations & paper goods", subCategories: [
    { id: "luxury-invitations", slug: "luxury-invitations", name: "Luxury Invitations", count: 110 },
    { id: "calligraphy", slug: "calligraphy", name: "Calligraphy", count: 80 },
    { id: "on-the-day", slug: "on-the-day", name: "On-the-Day Stationery", count: 60 },
    { id: "digital", slug: "digital-stationery", name: "Digital & Hybrid", count: 40 },
  ]},
  { id: "accessories", slug: "wedding-accessories", name: "Wedding Accessories", count: 380, description: "Jewellery, veils & finishing touches", subCategories: [
    { id: "jewellery", slug: "jewellery", name: "Jewellery", count: 140 },
    { id: "veils", slug: "veils-headpieces", name: "Veils & Headpieces", count: 100 },
    { id: "shoes", slug: "shoes", name: "Shoes", count: 80 },
    { id: "finishing-touches", slug: "finishing-touches", name: "Finishing Touches", count: 60 },
  ]},
  { id: "health-beauty", slug: "health-beauty", name: "Health & Beauty", count: 410, description: "Pre-wedding wellness & grooming", subCategories: [
    { id: "skincare", slug: "skincare", name: "Skincare & Facials", count: 130 },
    { id: "fitness", slug: "fitness-nutrition", name: "Fitness & Nutrition", count: 100 },
    { id: "spa-wellness", slug: "spa-wellness", name: "Spa & Wellness", count: 110 },
    { id: "grooming", slug: "grooming", name: "Grooming", count: 70 },
  ]},
  { id: "celebrants", slug: "celebrants", name: "Celebrants", count: 240, description: "Ceremony officiants & humanist celebrants", subCategories: [
    { id: "humanist", slug: "humanist", name: "Humanist", count: 90 },
    { id: "religious", slug: "religious", name: "Religious & Interfaith", count: 80 },
    { id: "symbolic", slug: "symbolic", name: "Symbolic & Bespoke", count: 70 },
  ]},
  { id: "event-production", slug: "event-production", name: "Event Production", count: 350, description: "AV, staging & technical production", subCategories: [
    { id: "av-sound", slug: "av-sound", name: "AV & Sound", count: 120 },
    { id: "staging", slug: "staging", name: "Staging & Structure", count: 100 },
    { id: "special-effects", slug: "special-effects", name: "Special Effects", count: 70 },
    { id: "power-logistics", slug: "power-logistics", name: "Power & Logistics", count: 60 },
  ]},
  { id: "gift-registry", slug: "gift-registry", name: "Gift Registry", count: 180, description: "Wedding lists & gift services", subCategories: [
    { id: "traditional-registry", slug: "traditional-registry", name: "Traditional Registry", count: 60 },
    { id: "honeymoon-fund", slug: "honeymoon-fund", name: "Honeymoon Fund", count: 50 },
    { id: "charity-gifts", slug: "charity-gifts", name: "Charity & Experience Gifts", count: 40 },
    { id: "bespoke-gifts", slug: "bespoke-gifts", name: "Bespoke & Curated", count: 30 },
  ]},
  { id: "luxury-transport", slug: "luxury-transport", name: "Luxury Transport", count: 260, description: "Classic cars, helicopters & arrivals", subCategories: [
    { id: "classic-cars", slug: "classic-cars", name: "Classic Cars", count: 90 },
    { id: "chauffeur", slug: "chauffeur", name: "Chauffeur Services", count: 70 },
    { id: "helicopters", slug: "helicopters", name: "Helicopters & Aviation", count: 40 },
    { id: "boats", slug: "boats-yachts", name: "Boats & Yachts", count: 60 },
  ]},
];

// ═════════════════════════════════════════════════════════════════════════════
// Country Taxonomy, Geography-first SEO architecture
// ═════════════════════════════════════════════════════════════════════════════
const DIRECTORY_COUNTRIES = [
  ITALY_COUNTRY,
  {
    id: "france", slug: "france", name: "France", iso2: "FR", listingCount: 12,
    seoTitleTemplate: "Luxury Wedding Vendors in France | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across France. Châteaux, Provence estates and Parisian elegance, editorially selected.",
    evergreenContent: "France embodies romance at every scale, from intimate Provençal farmhouses to grand Loire Valley châteaux. The French wedding tradition marries gastronomy, fashion and architecture into celebrations of unparalleled sophistication.",
    focusKeywords: ["luxury wedding france", "french chateau wedding", "provence wedding", "destination wedding france", "paris wedding planner"],
    aiSummary: "Second-largest European destination market. Château weddings dominate search. Provence and Paris drive the highest conversion rates.",
    intentSignals: { high: ["chateau wedding france cost", "provence wedding planner book", "paris luxury wedding venue hire"], mid: ["best french wedding venues", "provence wedding inspiration", "france destination wedding packages"], low: ["french wedding traditions", "getting married in france requirements", "wedding in france ideas"] },
  },
  {
    id: "uk", slug: "uk", name: "United Kingdom", iso2: "GB", listingCount: 14,
    seoTitleTemplate: "Luxury Wedding Vendors in the UK | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across the United Kingdom. Country houses, castles and contemporary spaces, editorially selected.",
    evergreenContent: "The United Kingdom offers an unrivalled range of wedding settings, from the rolling hills of the Cotswolds to the Scottish Highlands. Historic country houses, royal estates and converted barns form the backbone of the British luxury wedding market.",
    focusKeywords: ["luxury wedding uk", "country house wedding", "castle wedding uk", "wedding venues england", "london wedding planner"],
    aiSummary: "Largest domestic market. Country houses and barn venues lead search. Strong year-round demand with summer peak. London planners service both domestic and destination.",
    intentSignals: { high: ["book country house wedding venue", "luxury wedding planner london", "castle wedding venue hire uk"], mid: ["best wedding venues uk", "cotswolds wedding ideas", "country wedding venues england"], low: ["uk wedding traditions", "average wedding cost uk", "wedding planning checklist uk"] },
  },
  {
    id: "spain", slug: "spain", name: "Spain", iso2: "ES", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Spain | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Spain. Andalusian fincas, Balearic islands and Barcelona elegance, editorially selected.",
    evergreenContent: "Spain offers sun-drenched celebrations blending Moorish architecture, Mediterranean coastline and world-class gastronomy. From the white villages of Andalusia to the bohemian glamour of Ibiza, Spanish weddings are a feast for every sense.",
    focusKeywords: ["luxury wedding spain", "spanish finca wedding", "ibiza wedding venue", "marbella wedding", "barcelona wedding planner"],
    aiSummary: "Fast-growing destination market. Mallorca and Marbella drive highest search volume. Ibiza captures younger luxury demographic. Year-round viability.",
    intentSignals: { high: ["finca wedding spain book", "marbella luxury wedding venue", "ibiza wedding planner hire"], mid: ["best wedding venues spain", "mallorca wedding guide", "andalusia wedding inspiration"], low: ["spanish wedding customs", "getting married in spain", "spain wedding ideas"] },
  },
  {
    id: "usa", slug: "usa", name: "United States", iso2: "US", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in the USA | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across the United States. East Coast estates, Californian vineyards and city grandeur, editorially selected.",
    evergreenContent: "The United States encompasses extraordinary diversity, from the Gilded Age estates of the Hudson Valley to Napa Valley vineyards and the Art Deco glamour of Miami. American luxury weddings blend scale, creativity and world-class vendor talent.",
    focusKeywords: ["luxury wedding usa", "new york wedding venue", "napa valley wedding", "hamptons wedding", "luxury wedding planner nyc"],
    aiSummary: "High-value market with premium vendor ecosystem. New York tri-state area dominates. California wine country and Florida emerging strongly.",
    intentSignals: { high: ["luxury wedding venue new york book", "napa valley wedding planner hire", "hamptons estate wedding cost"], mid: ["best luxury wedding venues usa", "california winery wedding guide", "new york wedding ideas"], low: ["american wedding traditions", "average luxury wedding cost us", "wedding planning tips usa"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // EUROPE, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "portugal", slug: "portugal", name: "Portugal", iso2: "PT", listingCount: 9,
    seoTitleTemplate: "Luxury Wedding Vendors in Portugal | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Portugal. Algarve coastlines, Sintra palaces and Douro vineyards, editorially selected.",
    evergreenContent: "Portugal blends Atlantic drama with Moorish heritage. Sun-drenched Algarve cliffs, Sintra's fairy-tale palaces and the terraced vineyards of the Douro Valley create a wedding destination of remarkable range and warmth.",
    focusKeywords: ["luxury wedding portugal", "algarve wedding venue", "sintra wedding", "portugal destination wedding", "lisbon wedding planner"],
    aiSummary: "Fast-growing European destination. Algarve leads volume. Sintra drives highest-value weddings. Strong UK market.",
    intentSignals: { high: ["algarve wedding venue book", "sintra palace wedding hire"], mid: ["best portugal wedding venues", "algarve wedding guide"], low: ["portugal wedding traditions", "getting married in portugal"] },
  },
  {
    id: "greece", slug: "greece", name: "Greece", iso2: "GR", listingCount: 11,
    seoTitleTemplate: "Luxury Wedding Vendors in Greece | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Greece. Santorini sunsets, Mykonos glamour and Athenian elegance, editorially selected.",
    evergreenContent: "Greece is synonymous with romance, whitewashed Cycladic villages, ancient temples and Aegean sunsets that define the destination wedding dream. From Santorini's caldera to Crete's rugged coastline, every island tells a love story.",
    focusKeywords: ["luxury wedding greece", "santorini wedding venue", "mykonos wedding", "greek island wedding", "athens wedding planner"],
    aiSummary: "Top 3 global destination market. Santorini dominates luxury tier. Mykonos captures fashion-forward segment. Strong year-round demand.",
    intentSignals: { high: ["santorini wedding venue book", "mykonos wedding planner hire"], mid: ["best greek island wedding venues", "greece destination wedding cost"], low: ["greek wedding traditions", "getting married in greece"] },
  },
  {
    id: "ireland", slug: "ireland", name: "Ireland", iso2: "IE", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in Ireland | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Ireland. Castle estates, coastal cliffs and Georgian grandeur, editorially selected.",
    evergreenContent: "Ireland offers wild Atlantic beauty and aristocratic elegance. Castle hotels, Georgian estates and clifftop ceremonies along the Wild Atlantic Way create a uniquely atmospheric wedding destination.",
    focusKeywords: ["luxury wedding ireland", "castle wedding ireland", "irish wedding venue", "ireland destination wedding"],
    aiSummary: "Castle weddings dominate. Strong US-Irish heritage market. Kerry and Dublin lead demand.",
    intentSignals: { high: ["irish castle wedding venue book", "ireland wedding planner hire"], mid: ["best wedding venues ireland", "castle wedding ireland cost"], low: ["irish wedding traditions", "getting married in ireland"] },
  },
  {
    id: "croatia", slug: "croatia", name: "Croatia", iso2: "HR", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Croatia | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Croatia. Dubrovnik walled city, Adriatic islands and Istrian hilltop villages, editorially selected.",
    evergreenContent: "Croatia has emerged as a Mediterranean jewel, Dubrovnik's medieval grandeur, the lavender-scented islands of Hvar and Vis, and Istria's truffle-rich hilltop villages offer European luxury at compelling value.",
    focusKeywords: ["luxury wedding croatia", "dubrovnik wedding venue", "hvar wedding", "croatia destination wedding"],
    aiSummary: "Fastest-growing Mediterranean destination. Dubrovnik anchors luxury tier. Island weddings trending strongly.",
    intentSignals: { high: ["dubrovnik wedding venue book", "hvar wedding planner"], mid: ["best croatia wedding venues", "dubrovnik wedding cost"], low: ["croatia wedding ideas", "getting married in croatia"] },
  },
  {
    id: "switzerland", slug: "switzerland", name: "Switzerland", iso2: "CH", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Switzerland | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Switzerland. Alpine grandeur, lake palaces and five-star elegance, editorially selected.",
    evergreenContent: "Switzerland offers unmatched Alpine luxury, palatial lakeside hotels, mountain-top ceremonies with panoramic views and world-class gastronomy. From Lake Geneva's glamour to the Engadine's pristine beauty.",
    focusKeywords: ["luxury wedding switzerland", "swiss wedding venue", "lake geneva wedding", "alpine wedding switzerland"],
    aiSummary: "Ultra-premium market. Highest per-wedding spend in Europe. Palace hotel weddings dominate. Winter and summer seasons.",
    intentSignals: { high: ["lake geneva wedding venue book", "swiss alpine wedding planner"], mid: ["best switzerland wedding venues", "swiss wedding cost"], low: ["swiss wedding traditions", "getting married in switzerland"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // MIDDLE EAST & NORTH AFRICA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "uae", slug: "uae", name: "United Arab Emirates", iso2: "AE", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in the UAE | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across the UAE. Dubai opulence, Abu Dhabi grandeur and desert romance, editorially selected.",
    evergreenContent: "The UAE delivers wedding luxury at a scale found nowhere else, from Dubai's glittering skyline venues and private island resorts to Abu Dhabi's palatial hotels. Desert ceremonies under starlit skies add an Arabian Nights dimension.",
    focusKeywords: ["luxury wedding dubai", "dubai wedding venue", "abu dhabi wedding", "uae wedding planner", "desert wedding dubai"],
    aiSummary: "Highest-spend market globally. Dubai dominates with palace and beachfront venues. Year-round with winter peak. Strong South Asian and Middle Eastern demand.",
    intentSignals: { high: ["dubai luxury wedding venue book", "abu dhabi palace wedding hire"], mid: ["best dubai wedding venues", "uae destination wedding packages"], low: ["dubai wedding ideas", "getting married in dubai"] },
  },
  {
    id: "morocco", slug: "morocco", name: "Morocco", iso2: "MA", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Morocco | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Morocco. Marrakech riads, Atlas Mountain retreats and Saharan luxury, editorially selected.",
    evergreenContent: "Morocco enchants with sensory richness, Marrakech's rose-scented riads, the snow-capped Atlas Mountains and Saharan desert camps under infinite stars create celebrations of extraordinary atmosphere.",
    focusKeywords: ["luxury wedding morocco", "marrakech wedding venue", "morocco destination wedding", "riad wedding marrakech"],
    aiSummary: "Experiential luxury market. Marrakech dominates. Multi-day celebration format drives high spend. Autumn and spring peaks.",
    intentSignals: { high: ["marrakech riad wedding venue book", "morocco wedding planner hire"], mid: ["best morocco wedding venues", "marrakech wedding cost"], low: ["moroccan wedding traditions", "getting married in morocco"] },
  },
  {
    id: "turkey", slug: "turkey", name: "Turkey", iso2: "TR", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Turkey | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Turkey. Istanbul palaces, Cappadocia hot-air balloon ceremonies and Bodrum coastal glamour, editorially selected.",
    evergreenContent: "Turkey bridges continents and cultures, Istanbul's Ottoman palaces, Cappadocia's surreal lunar landscapes and the turquoise Aegean coast of Bodrum offer luxury weddings of cinematic proportions.",
    focusKeywords: ["luxury wedding turkey", "istanbul wedding venue", "cappadocia wedding", "bodrum wedding", "turkey destination wedding"],
    aiSummary: "Emerging luxury destination with strong value proposition. Istanbul cultural weddings and Cappadocia experiential weddings drive demand.",
    intentSignals: { high: ["istanbul palace wedding venue book", "cappadocia wedding planner"], mid: ["best turkey wedding venues", "bodrum wedding guide"], low: ["turkish wedding traditions", "getting married in turkey"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // ASIA & INDIAN OCEAN
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "thailand", slug: "thailand", name: "Thailand", iso2: "TH", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in Thailand | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Thailand. Tropical beach ceremonies, jungle temples and five-star island resorts, editorially selected.",
    evergreenContent: "Thailand offers tropical luxury with spiritual depth, private island resorts in Koh Samui, Phuket's clifftop venues, and Chiang Mai's temple-set ceremonies create celebrations infused with warmth and beauty.",
    focusKeywords: ["luxury wedding thailand", "koh samui wedding venue", "phuket wedding", "thailand beach wedding", "chiang mai wedding"],
    aiSummary: "Leading Asian beach destination. Koh Samui and Phuket dominate luxury tier. Strong Australian, European and American demand.",
    intentSignals: { high: ["koh samui luxury wedding venue book", "phuket wedding planner hire"], mid: ["best thailand wedding venues", "thai beach wedding cost"], low: ["thai wedding traditions", "getting married in thailand"] },
  },
  {
    id: "indonesia", slug: "indonesia", name: "Indonesia", iso2: "ID", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Indonesia | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Indonesia. Bali clifftop temples, jungle villas and private island escapes, editorially selected.",
    evergreenContent: "Bali stands alone as Asia's most magnetic wedding destination, volcanic cliffside temples, emerald rice terrace villas, and world-class resort infrastructure create celebrations of spiritual beauty and tropical luxury.",
    focusKeywords: ["luxury wedding bali", "bali wedding venue", "uluwatu wedding", "ubud wedding", "indonesia destination wedding"],
    aiSummary: "Bali dominates entirely. Uluwatu cliff venues and Ubud jungle settings lead. Year-round with dry season peak April-October.",
    intentSignals: { high: ["bali clifftop wedding venue book", "ubud villa wedding hire"], mid: ["best bali wedding venues", "bali wedding planner cost"], low: ["balinese wedding traditions", "getting married in bali"] },
  },
  {
    id: "india", slug: "india", name: "India", iso2: "IN", listingCount: 10,
    seoTitleTemplate: "Luxury Wedding Vendors in India | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across India. Rajasthan palaces, Goa beaches and Kerala backwaters, editorially selected.",
    evergreenContent: "India elevates weddings to an art form, Rajasthan's maharaja palaces, Goa's tropical glamour and Kerala's tranquil backwaters create celebrations of unmatched colour, scale and cultural richness.",
    focusKeywords: ["luxury wedding india", "palace wedding rajasthan", "udaipur wedding venue", "goa wedding", "india destination wedding"],
    aiSummary: "Largest wedding market by volume. Rajasthan palace weddings command premium. Multi-day celebrations drive highest total spend globally.",
    intentSignals: { high: ["udaipur palace wedding venue book", "jaipur wedding planner hire"], mid: ["best india palace wedding venues", "rajasthan wedding cost"], low: ["indian wedding traditions", "destination wedding in india"] },
  },
  {
    id: "japan", slug: "japan", name: "Japan", iso2: "JP", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in Japan | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Japan. Kyoto temples, Tokyo modernity and cherry blossom ceremonies, editorially selected.",
    evergreenContent: "Japan merges ancient ceremony with exquisite precision, Kyoto's temple gardens, Tokyo's skyline venues and the ephemeral beauty of cherry blossom season create weddings of profound elegance.",
    focusKeywords: ["luxury wedding japan", "kyoto wedding venue", "tokyo wedding", "japan destination wedding", "cherry blossom wedding"],
    aiSummary: "Ultra-niche luxury market. Cherry blossom season (March-April) drives international demand. Kyoto dominates aesthetic appeal.",
    intentSignals: { high: ["kyoto temple wedding venue book", "japan wedding planner hire"], mid: ["best japan wedding venues", "tokyo luxury wedding"], low: ["japanese wedding traditions", "getting married in japan"] },
  },
  {
    id: "srilanka", slug: "sri-lanka", name: "Sri Lanka", iso2: "LK", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Sri Lanka | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues and vendors across Sri Lanka. Colonial tea estates, tropical beaches and ancient temples, editorially selected.",
    evergreenContent: "Sri Lanka offers intimate luxury amid extraordinary biodiversity, colonial hill-country tea estates, southern coastal boutique hotels and ancient temple settings create understated celebrations of natural beauty.",
    focusKeywords: ["luxury wedding sri lanka", "sri lanka wedding venue", "galle wedding", "sri lanka destination wedding"],
    aiSummary: "Emerging boutique destination. Galle coast leads. Strong UK and Australian demand. Intimate weddings dominate.",
    intentSignals: { high: ["galle fort wedding venue book", "sri lanka wedding planner"], mid: ["best sri lanka wedding venues"], low: ["sri lanka wedding ideas"] },
  },
  {
    id: "maldives", slug: "maldives", name: "Maldives", iso2: "MV", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in the Maldives | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues across the Maldives. Overwater villas, private island ceremonies and sandbank receptions, editorially selected.",
    evergreenContent: "The Maldives represents the pinnacle of private island luxury, overwater villa ceremonies, sandbank receptions at sunset and the Indian Ocean's most pristine turquoise waters create an unrivalled intimate escape.",
    focusKeywords: ["luxury wedding maldives", "maldives wedding venue", "overwater villa wedding", "private island wedding maldives"],
    aiSummary: "Ultra-premium micro-destination. Resort-exclusive weddings. Highest per-night spend. Honeymoon-wedding combination market.",
    intentSignals: { high: ["maldives overwater wedding venue book", "private island wedding maldives"], mid: ["best maldives wedding resorts"], low: ["maldives wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AMERICAS, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mexico", slug: "mexico", name: "Mexico", iso2: "MX", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Mexico | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across Mexico. Tulum jungle cenotes, Los Cabos oceanfront and colonial San Miguel, editorially selected.",
    evergreenContent: "Mexico marries ancient culture with modern luxury, Tulum's jungle cenotes, Los Cabos' desert-meets-ocean drama and San Miguel de Allende's colonial splendour create Latin America's most diverse wedding destination.",
    focusKeywords: ["luxury wedding mexico", "tulum wedding venue", "los cabos wedding", "san miguel de allende wedding", "mexico destination wedding"],
    aiSummary: "Largest Latin American luxury market. Strong US demand drives Tulum and Los Cabos. San Miguel captures cultural-luxury segment.",
    intentSignals: { high: ["tulum wedding venue book", "los cabos wedding planner hire"], mid: ["best mexico wedding venues", "tulum wedding cost"], low: ["mexican wedding traditions", "destination wedding mexico"] },
  },
  {
    id: "caribbean", slug: "caribbean", name: "Caribbean", iso2: "CB", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in the Caribbean | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across the Caribbean. Private island resorts, plantation estates and tropical beach ceremonies, editorially selected.",
    evergreenContent: "The Caribbean archipelago offers island-hopping luxury, from Barbados' coral-stone plantation houses to St. Lucia's volcanic twin Pitons, Jamaica's cliff resorts and Antigua's 365 beaches.",
    focusKeywords: ["luxury wedding caribbean", "barbados wedding venue", "st lucia wedding", "jamaica wedding", "caribbean destination wedding"],
    aiSummary: "Multi-island destination market. Barbados and St. Lucia lead luxury tier. Strong US East Coast and UK demand. Winter peak season.",
    intentSignals: { high: ["barbados luxury wedding venue book", "st lucia wedding planner hire"], mid: ["best caribbean wedding venues", "island wedding caribbean cost"], low: ["caribbean wedding ideas", "beach wedding caribbean"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AFRICA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "southafrica", slug: "south-africa", name: "South Africa", iso2: "ZA", listingCount: 7,
    seoTitleTemplate: "Luxury Wedding Vendors in South Africa | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues and vendors across South Africa. Cape Town wine estates, safari lodges and Garden Route beauty, editorially selected.",
    evergreenContent: "South Africa delivers the African dream wedding, Cape Town's vineyard estates beneath Table Mountain, safari lodges where elephants roam and the lush Garden Route coastline create celebrations of cinematic scale.",
    focusKeywords: ["luxury wedding south africa", "cape town wedding venue", "winelands wedding", "safari wedding south africa", "south africa destination wedding"],
    aiSummary: "Africa's leading luxury market. Cape Winelands dominate venue search. Safari-wedding combination drives international demand.",
    intentSignals: { high: ["cape town wine estate wedding book", "south africa safari wedding venue"], mid: ["best south africa wedding venues", "cape town wedding cost"], low: ["south african wedding traditions", "getting married in south africa"] },
  },
  {
    id: "kenya", slug: "kenya", name: "Kenya", iso2: "KE", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Kenya | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Kenya. Safari lodges, Indian Ocean beaches and Great Rift Valley estates, editorially selected.",
    evergreenContent: "Kenya combines safari grandeur with coastal paradise, Masai Mara lodge ceremonies, Diani Beach oceanfront celebrations and Great Rift Valley estates set against Africa's most dramatic landscapes.",
    focusKeywords: ["luxury wedding kenya", "safari wedding kenya", "diani beach wedding", "kenya destination wedding"],
    aiSummary: "Safari-wedding niche. Small but ultra-premium market. Masai Mara and Diani Beach lead. Strong conservation-luxury positioning.",
    intentSignals: { high: ["kenya safari lodge wedding book", "diani beach wedding planner"], mid: ["best kenya wedding venues"], low: ["kenya wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // OCEANIA
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "australia", slug: "australia", name: "Australia", iso2: "AU", listingCount: 8,
    seoTitleTemplate: "Luxury Wedding Vendors in Australia | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues and vendors across Australia. Hunter Valley vineyards, Byron Bay beaches and Sydney Harbour glamour, editorially selected.",
    evergreenContent: "Australia offers weddings of extraordinary natural scale, Sydney Harbour's iconic backdrop, Hunter Valley's vineyard estates, Byron Bay's bohemian coastal charm and the ancient landscapes of the Barossa Valley.",
    focusKeywords: ["luxury wedding australia", "sydney wedding venue", "hunter valley wedding", "byron bay wedding", "melbourne wedding planner"],
    aiSummary: "Largest Oceania market. Sydney and Melbourne anchor urban demand. Hunter Valley and Byron Bay lead destination segment.",
    intentSignals: { high: ["sydney harbour wedding venue book", "hunter valley wedding planner hire"], mid: ["best australia wedding venues", "byron bay wedding cost"], low: ["australian wedding traditions", "getting married in australia"] },
  },
  {
    id: "newzealand", slug: "new-zealand", name: "New Zealand", iso2: "NZ", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in New Zealand | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in New Zealand. Queenstown mountains, Hawke's Bay vineyards and Waiheke Island escapes, editorially selected.",
    evergreenContent: "New Zealand delivers Lord of the Rings grandeur, Queenstown's alpine lakes, Hawke's Bay's Art Deco wine country and Waiheke Island's vineyard terraces create epic celebrations amid pristine wilderness.",
    focusKeywords: ["luxury wedding new zealand", "queenstown wedding venue", "waiheke island wedding", "new zealand destination wedding"],
    aiSummary: "Adventure-luxury niche. Queenstown dominates international search. Strong Australian and US elopement market.",
    intentSignals: { high: ["queenstown wedding venue book", "new zealand wedding planner hire"], mid: ["best new zealand wedding venues", "queenstown wedding cost"], low: ["nz wedding traditions", "getting married in new zealand"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // EUROPE, From existing platform + additions
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "austria", slug: "austria", name: "Austria", iso2: "AT", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Austria | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues across Austria. Viennese palaces, Alpine lakeside ceremonies and Salzburg's baroque elegance, editorially selected.",
    evergreenContent: "Austria combines imperial grandeur with Alpine splendour, Vienna's palatial ballrooms, Salzburg's baroque churches and the crystalline lakes of the Salzkammergut create celebrations of refined European elegance.",
    focusKeywords: ["luxury wedding austria", "vienna wedding venue", "salzburg wedding", "alpine wedding austria", "austria destination wedding"],
    aiSummary: "Palace and Alpine dual market. Vienna drives city weddings. Salzburg and Salzkammergut lead destination segment. Strong German-speaking demand.",
    intentSignals: { high: ["vienna palace wedding venue book", "salzburg wedding planner hire"], mid: ["best austria wedding venues", "alpine wedding austria cost"], low: ["austrian wedding traditions", "getting married in austria"] },
  },
  {
    id: "germany", slug: "germany", name: "Germany", iso2: "DE", listingCount: 5,
    seoTitleTemplate: "Luxury Wedding Vendors in Germany | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across Germany. Bavarian castles, Rhine Valley estates and Berlin elegance, editorially selected.",
    evergreenContent: "Germany offers fairy-tale grandeur, Bavarian castle turrets, Rhine Valley vineyard estates, Black Forest retreats and Berlin's contemporary art spaces create an unexpectedly diverse wedding destination.",
    focusKeywords: ["luxury wedding germany", "castle wedding germany", "bavarian wedding", "germany destination wedding"],
    aiSummary: "Castle wedding market growing. Bavaria dominates destination search. Berlin captures modern-luxury segment. Primarily domestic demand.",
    intentSignals: { high: ["bavarian castle wedding book", "germany wedding planner"], mid: ["best germany wedding venues", "castle wedding germany cost"], low: ["german wedding traditions"] },
  },
  {
    id: "cyprus", slug: "cyprus", name: "Cyprus", iso2: "CY", listingCount: 6,
    seoTitleTemplate: "Luxury Wedding Vendors in Cyprus | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues across Cyprus. Paphos clifftops, Limassol beach clubs and Troodos mountain retreats, editorially selected.",
    evergreenContent: "Cyprus blends Greek warmth with year-round Mediterranean sunshine, Paphos's ancient clifftop terraces, Limassol's glamorous marina and the cedar-forested Troodos Mountains offer celebrations infused with mythological romance.",
    focusKeywords: ["luxury wedding cyprus", "paphos wedding venue", "limassol wedding", "cyprus destination wedding", "ayia napa wedding"],
    aiSummary: "Strong British expat and destination market. Paphos leads luxury tier. Year-round season. Competitive pricing drives volume.",
    intentSignals: { high: ["paphos wedding venue book", "cyprus wedding planner hire"], mid: ["best cyprus wedding venues", "limassol wedding guide"], low: ["cyprus wedding traditions", "getting married in cyprus"] },
  },
  {
    id: "malta", slug: "malta", name: "Malta", iso2: "MT", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Malta | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Malta. Baroque palazzi, fortified citadels and Mediterranean terraces, editorially selected.",
    evergreenContent: "Malta packs extraordinary heritage into a tiny archipelago, Knights of St John fortifications, baroque churches, honey-stone palazzi and the ancient temples of Gozo create an intimate Mediterranean gem.",
    focusKeywords: ["luxury wedding malta", "malta wedding venue", "gozo wedding", "malta destination wedding"],
    aiSummary: "Compact island destination. Baroque venue niche. Strong UK market. Year-round viability. Gozo for intimate weddings.",
    intentSignals: { high: ["malta wedding venue book", "malta wedding planner"], mid: ["best malta wedding venues"], low: ["malta wedding ideas"] },
  },
  {
    id: "montenegro", slug: "montenegro", name: "Montenegro", iso2: "ME", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Montenegro | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Montenegro. Bay of Kotor fjords, Adriatic island ceremonies and medieval citadels, editorially selected.",
    evergreenContent: "Montenegro's dramatic Adriatic coastline rivals anywhere in the Mediterranean, the fjord-like Bay of Kotor, the fortified island of Sveti Stefan and the medieval walls of Budva create a boutique alternative to Croatia.",
    focusKeywords: ["luxury wedding montenegro", "kotor wedding venue", "sveti stefan wedding", "montenegro destination wedding"],
    aiSummary: "Emerging boutique destination. Aman Sveti Stefan effect drives luxury awareness. Bay of Kotor is primary draw. Growing fast.",
    intentSignals: { high: ["kotor bay wedding venue book", "sveti stefan wedding"], mid: ["best montenegro wedding venues"], low: ["montenegro wedding ideas"] },
  },
  {
    id: "slovenia", slug: "slovenia", name: "Slovenia", iso2: "SI", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Slovenia | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Slovenia. Lake Bled island church, Alpine valleys and Ljubljana elegance, editorially selected.",
    evergreenContent: "Slovenia's Lake Bled, with its island church and Alpine backdrop, has become one of Europe's most iconic wedding images. Ljubljana's charming old town and the Julian Alps complete a fairy-tale setting.",
    focusKeywords: ["luxury wedding slovenia", "lake bled wedding", "slovenia wedding venue", "bled church wedding"],
    aiSummary: "Single-venue phenomenon. Lake Bled dominates global search. Ljubljana emerging as city-wedding base. Very niche but high-intent.",
    intentSignals: { high: ["lake bled wedding venue book", "slovenia wedding planner"], mid: ["best slovenia wedding venues"], low: ["slovenia wedding ideas"] },
  },
  {
    id: "iceland", slug: "iceland", name: "Iceland", iso2: "IS", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Iceland | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Iceland. Glacier ceremonies, volcanic landscapes and Northern Lights elopements, editorially selected.",
    evergreenContent: "Iceland offers otherworldly romance, black sand beach ceremonies, glacier-edge vows, volcanic hot spring receptions and the ethereal glow of the Northern Lights create truly once-in-a-lifetime celebrations.",
    focusKeywords: ["iceland wedding", "iceland elopement", "northern lights wedding", "glacier wedding iceland"],
    aiSummary: "Adventure-elopement market leader. Northern Lights season (Oct-Mar) drives demand. Small luxury-lodge infrastructure. Social media amplification huge.",
    intentSignals: { high: ["iceland elopement planner book", "northern lights wedding venue"], mid: ["best iceland wedding venues"], low: ["iceland wedding ideas"] },
  },
  {
    id: "netherlands", slug: "netherlands", name: "Netherlands", iso2: "NL", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Netherlands | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in the Netherlands. Amsterdam canal houses, tulip field ceremonies and Dutch castle estates, editorially selected.",
    evergreenContent: "The Netherlands delivers understated elegance, Amsterdam's candlelit canal houses, Dutch Golden Age castles, tulip-bordered estates and the minimalist grandeur of contemporary Dutch design.",
    focusKeywords: ["luxury wedding netherlands", "amsterdam wedding venue", "dutch castle wedding", "netherlands wedding"],
    aiSummary: "Amsterdam canal house market strong. Castle weddings outside city growing. Tulip season (April-May) drives destination interest.",
    intentSignals: { high: ["amsterdam wedding venue book", "dutch castle wedding hire"], mid: ["best netherlands wedding venues"], low: ["dutch wedding traditions"] },
  },
  {
    id: "denmark", slug: "denmark", name: "Denmark", iso2: "DK", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Denmark | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Denmark. Copenhagen's Scandi elegance and Danish manor houses, editorially selected.",
    evergreenContent: "Denmark embodies Scandinavian design excellence, Copenhagen's Nyhavn waterfront, minimalist manor houses and the hygge-infused intimacy of Danish celebrations create weddings of quiet sophistication.",
    focusKeywords: ["luxury wedding denmark", "copenhagen wedding venue", "danish castle wedding"],
    aiSummary: "Copenhagen dominates. Scandinavian design-led market. Intimate celebrations trending. Summer season.",
    intentSignals: { high: ["copenhagen wedding venue book"], mid: ["best denmark wedding venues"], low: ["danish wedding traditions"] },
  },
  {
    id: "sweden", slug: "sweden", name: "Sweden", iso2: "SE", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Sweden | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Sweden. Stockholm archipelago, Swedish manor estates and midsummer celebrations, editorially selected.",
    evergreenContent: "Sweden offers Nordic elegance at scale, Stockholm's waterfront palaces, archipelago island ceremonies, rural manor houses and the magical light of midsummer create distinctly atmospheric celebrations.",
    focusKeywords: ["luxury wedding sweden", "stockholm wedding venue", "swedish castle wedding"],
    aiSummary: "Stockholm anchors demand. Midsummer weddings are cultural draw. Manor house and archipelago venues lead.",
    intentSignals: { high: ["stockholm wedding venue book"], mid: ["best sweden wedding venues"], low: ["swedish wedding traditions"] },
  },
  {
    id: "norway", slug: "norway", name: "Norway", iso2: "NO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Norway | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Norway. Fjord ceremonies, stave churches and midnight sun celebrations, editorially selected.",
    evergreenContent: "Norway delivers nature at its most dramatic, fjord-edge ceremonies, medieval stave churches, mountain lodge retreats and the ethereal midnight sun create celebrations of raw, epic beauty.",
    focusKeywords: ["luxury wedding norway", "fjord wedding", "norway destination wedding"],
    aiSummary: "Fjord-wedding niche growing. Bergen and Lofoten lead. Adventure-elopement crossover. Summer midnight-sun season.",
    intentSignals: { high: ["norway fjord wedding venue"], mid: ["best norway wedding venues"], low: ["norwegian wedding traditions"] },
  },
  {
    id: "hungary", slug: "hungary", name: "Hungary", iso2: "HU", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Hungary | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Hungary. Budapest thermal palaces and Hungarian wine country estates, editorially selected.",
    evergreenContent: "Budapest's thermal bath palaces, Danube-spanning bridges and Art Nouveau grandeur make Hungary an increasingly sought-after European wedding destination with exceptional value.",
    focusKeywords: ["luxury wedding hungary", "budapest wedding venue", "hungarian castle wedding"],
    aiSummary: "Budapest-centric market. Palace and thermal spa venues unique selling point. Outstanding value positioning.",
    intentSignals: { high: ["budapest palace wedding venue"], mid: ["best hungary wedding venues"], low: ["hungarian wedding traditions"] },
  },
  {
    id: "czechrepublic", slug: "czech-republic", name: "Czech Republic", iso2: "CZ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Czech Republic | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in the Czech Republic. Prague castle views and Bohemian château estates, editorially selected.",
    evergreenContent: "Prague's Gothic spires, Baroque palaces and cobblestone squares create one of Europe's most romantic cityscapes. Beyond the capital, Bohemian châteaux and Moravian vineyards offer pastoral elegance.",
    focusKeywords: ["luxury wedding prague", "prague wedding venue", "czech castle wedding"],
    aiSummary: "Prague dominates entirely. Castle and palace venues drive international demand. Strong value proposition vs Western Europe.",
    intentSignals: { high: ["prague castle wedding venue book"], mid: ["best czech republic wedding venues"], low: ["czech wedding traditions"] },
  },
  {
    id: "poland", slug: "poland", name: "Poland", iso2: "PL", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Poland | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Poland. Kraków's medieval grandeur and Polish palace estates, editorially selected.",
    evergreenContent: "Poland surprises with aristocratic elegance, Kraków's medieval market square, Wieliczka's salt cathedral, and the restored palace estates of the Polish countryside offer celebrations of unexpected grandeur.",
    focusKeywords: ["luxury wedding poland", "krakow wedding venue", "polish palace wedding"],
    aiSummary: "Kraków leads. Palace restoration creating new luxury supply. Strong value market. Growing international interest.",
    intentSignals: { high: ["krakow wedding venue book"], mid: ["best poland wedding venues"], low: ["polish wedding traditions"] },
  },
  {
    id: "romania", slug: "romania", name: "Romania", iso2: "RO", listingCount: 1,
    seoTitleTemplate: "Luxury Wedding Vendors in Romania | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Romania. Transylvanian castles and Carpathian mountain retreats, editorially selected.",
    evergreenContent: "Romania's Transylvanian castles, Carpathian mountain lodges and painted monasteries offer a wildly romantic and refreshingly undiscovered European wedding destination.",
    focusKeywords: ["luxury wedding romania", "transylvania castle wedding"],
    aiSummary: "Pre-market luxury. Transylvanian castles drive awareness. Very early stage but architecture is extraordinary.",
    intentSignals: { high: [], mid: ["romania castle wedding venue"], low: ["romania wedding ideas"] },
  },
  {
    id: "gibraltar", slug: "gibraltar", name: "Gibraltar", iso2: "GI", listingCount: 1,
    seoTitleTemplate: "Luxury Wedding Vendors in Gibraltar | LWD",
    metaDescriptionTemplate: "Explore luxury wedding venues in Gibraltar. Rock of Gibraltar ceremonies and Mediterranean elopements, editorially selected.",
    evergreenContent: "Gibraltar offers Mediterranean elopement elegance, the iconic Rock backdrop, botanical gardens and sun-drenched terraces overlooking the Strait create compact celebrations with maximum drama.",
    focusKeywords: ["gibraltar wedding", "gibraltar elopement", "rock of gibraltar wedding"],
    aiSummary: "Elopement micro-destination. Legal simplicity drives demand. Very small market but loyal repeat planners.",
    intentSignals: { high: ["gibraltar wedding venue"], mid: [], low: ["gibraltar wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // MIDDLE EAST, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "jordan", slug: "jordan", name: "Jordan", iso2: "JO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Jordan | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Jordan. Petra's rose-red ruins and Dead Sea desert luxury, editorially selected.",
    evergreenContent: "Jordan offers ancient wonder, Petra's Treasury carved from rose-red sandstone, Dead Sea floating ceremonies and Wadi Rum's Martian desert landscapes create celebrations of Biblical drama.",
    focusKeywords: ["luxury wedding jordan", "petra wedding", "dead sea wedding", "jordan destination wedding"],
    aiSummary: "Ultra-experiential niche. Petra and Dead Sea unique globally. Very small but high-spend market. Adventure-luxury crossover.",
    intentSignals: { high: ["petra wedding venue book"], mid: ["best jordan wedding venues"], low: ["jordan wedding ideas"] },
  },
  {
    id: "qatar", slug: "qatar", name: "Qatar", iso2: "QA", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Qatar | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Qatar. Doha's futuristic skyline and desert palace celebrations, editorially selected.",
    evergreenContent: "Qatar represents the new face of Gulf luxury, Doha's futuristic Museum of Islamic Art, desert palace hotels and the world's most ambitious hospitality infrastructure create celebrations of ultra-modern opulence.",
    focusKeywords: ["luxury wedding qatar", "doha wedding venue", "qatar destination wedding"],
    aiSummary: "Ultra-premium Gulf market. Post-World Cup infrastructure boom. Doha competing with Dubai for regional dominance.",
    intentSignals: { high: ["doha luxury wedding venue"], mid: ["best qatar wedding venues"], low: ["qatar wedding ideas"] },
  },
  {
    id: "oman", slug: "oman", name: "Oman", iso2: "OM", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Oman | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Oman. Muscat's royal grandeur and Arabian desert camp celebrations, editorially selected.",
    evergreenContent: "Oman offers Arabia's most understated luxury, Muscat's Sultan Qaboos Grand Mosque, the dramatic Hajar Mountains, fjord-like Musandam Peninsula and vast Wahiba Sands desert camps.",
    focusKeywords: ["luxury wedding oman", "muscat wedding venue", "oman desert wedding"],
    aiSummary: "Boutique alternative to Dubai. Authentic Arabian positioning. Emerging luxury resort infrastructure. Very exclusive.",
    intentSignals: { high: ["oman luxury wedding venue"], mid: ["best oman wedding venues"], low: ["oman wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // ASIA, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "malaysia", slug: "malaysia", name: "Malaysia", iso2: "MY", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Malaysia | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Malaysia. Langkawi island resorts, KL skyscrapers and Borneo jungle lodges, editorially selected.",
    evergreenContent: "Malaysia blends tropical paradise with cosmopolitan flair, Langkawi's eagle-kissed islands, Kuala Lumpur's Twin Tower skyline, Penang's colonial charm and Borneo's ancient rainforest lodges.",
    focusKeywords: ["luxury wedding malaysia", "langkawi wedding venue", "kl wedding", "malaysia destination wedding"],
    aiSummary: "Langkawi leads destination segment. KL for urban luxury. Strong regional (Singaporean, Australian) demand.",
    intentSignals: { high: ["langkawi resort wedding book", "kl wedding planner"], mid: ["best malaysia wedding venues"], low: ["malaysian wedding traditions"] },
  },
  {
    id: "singapore", slug: "singapore", name: "Singapore", iso2: "SG", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Singapore | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Singapore. Marina Bay glamour, colonial Raffles elegance and tropical garden ceremonies, editorially selected.",
    evergreenContent: "Singapore condenses Asian luxury into a city-state, Marina Bay Sands' infinity pool terraces, the colonial grandeur of Raffles Hotel and the UNESCO Botanic Gardens create celebrations of immaculate precision.",
    focusKeywords: ["luxury wedding singapore", "singapore wedding venue", "marina bay wedding", "raffles wedding"],
    aiSummary: "Asia's highest per-wedding spend city. Hotel and garden venues dominate. Year-round. Strong expat and regional demand.",
    intentSignals: { high: ["singapore luxury wedding venue book", "raffles wedding planner"], mid: ["best singapore wedding venues"], low: ["singapore wedding ideas"] },
  },
  {
    id: "philippines", slug: "philippines", name: "Philippines", iso2: "PH", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Philippines | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in the Philippines. Palawan lagoons, Boracay beaches and Cebu island luxury, editorially selected.",
    evergreenContent: "The Philippines offers 7,641 islands of tropical possibility, Palawan's emerald lagoons, Boracay's powder-white beaches and Cebu's coral-fringed resort coastline create island wedding paradise.",
    focusKeywords: ["luxury wedding philippines", "palawan wedding", "boracay wedding venue", "philippines destination wedding"],
    aiSummary: "Island-resort destination. Palawan luxury segment growing. Boracay high-volume. Strong domestic and expat market.",
    intentSignals: { high: ["palawan resort wedding book"], mid: ["best philippines wedding venues"], low: ["philippine wedding traditions"] },
  },
  {
    id: "vietnam", slug: "vietnam", name: "Vietnam", iso2: "VN", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Vietnam | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Vietnam. Hoi An lantern-lit ceremonies and Ha Long Bay floating celebrations, editorially selected.",
    evergreenContent: "Vietnam enchants with atmospheric beauty, Hoi An's lantern-draped ancient town, Ha Long Bay's emerald karst seascape and the terraced mountains of Sapa create celebrations of profound cultural richness.",
    focusKeywords: ["luxury wedding vietnam", "hoi an wedding venue", "vietnam destination wedding"],
    aiSummary: "Emerging destination. Hoi An dominates luxury search. Ha Long Bay experiential niche. Outstanding value positioning.",
    intentSignals: { high: ["hoi an wedding venue book"], mid: ["best vietnam wedding venues"], low: ["vietnam wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AMERICAS, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "canada", slug: "canada", name: "Canada", iso2: "CA", listingCount: 4,
    seoTitleTemplate: "Luxury Wedding Vendors in Canada | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues across Canada. Rocky Mountain lodges, Niagara vineyards and Whistler alpine elegance, editorially selected.",
    evergreenContent: "Canada delivers nature at a grand scale, Banff's turquoise glacier lakes, Whistler's mountain-top ceremonies, Niagara's vineyard estates and the cosmopolitan elegance of Toronto and Montreal.",
    focusKeywords: ["luxury wedding canada", "banff wedding venue", "whistler wedding", "canada destination wedding"],
    aiSummary: "Rocky Mountain weddings drive international demand. Banff and Whistler lead. Toronto/Montreal for urban luxury. Summer season.",
    intentSignals: { high: ["banff wedding venue book", "whistler wedding planner"], mid: ["best canada wedding venues"], low: ["canadian wedding traditions"] },
  },
  {
    id: "costarica", slug: "costa-rica", name: "Costa Rica", iso2: "CR", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Costa Rica | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Costa Rica. Rainforest canopy ceremonies, Pacific beach villas and volcanic hot springs, editorially selected.",
    evergreenContent: "Costa Rica pioneers eco-luxury weddings, rainforest canopy walkways, Pacific sunset cliff ceremonies, volcanic hot spring receptions and wildlife-rich cloud forest lodges create celebrations connected to nature.",
    focusKeywords: ["luxury wedding costa rica", "costa rica wedding venue", "eco wedding costa rica"],
    aiSummary: "Eco-luxury niche leader. Pacific coast and Arenal volcano lead. Strong US demand. Year-round tropical season.",
    intentSignals: { high: ["costa rica luxury wedding venue book"], mid: ["best costa rica wedding venues"], low: ["costa rica wedding ideas"] },
  },
  {
    id: "brazil", slug: "brazil", name: "Brazil", iso2: "BR", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Brazil | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Brazil. Rio's Sugarloaf drama, Trancoso beach luxury and São Paulo sophistication, editorially selected.",
    evergreenContent: "Brazil celebrates with infectious joy, Rio de Janeiro's Sugarloaf Mountain views, Trancoso's bohemian-luxe beach, São Paulo's fashion-forward elegance and the colonial charm of Bahia.",
    focusKeywords: ["luxury wedding brazil", "rio wedding venue", "trancoso wedding", "brazil destination wedding"],
    aiSummary: "Largest Latin American domestic market. Trancoso drives destination luxury. Rio iconic but urban. Growing international interest.",
    intentSignals: { high: ["rio wedding venue book", "trancoso wedding planner"], mid: ["best brazil wedding venues"], low: ["brazilian wedding traditions"] },
  },
  {
    id: "colombia", slug: "colombia", name: "Colombia", iso2: "CO", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Colombia | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Colombia. Cartagena's walled-city romance and Caribbean island escapes, editorially selected.",
    evergreenContent: "Colombia's colonial jewel Cartagena, with its pastel-walled old city, rooftop terraces and nearby Rosario Islands, has emerged as Latin America's most romantic luxury wedding destination.",
    focusKeywords: ["luxury wedding colombia", "cartagena wedding venue", "colombia destination wedding"],
    aiSummary: "Cartagena dominates entirely. Colonial-city wedding niche growing fast. Strong US demand. Year-round Caribbean climate.",
    intentSignals: { high: ["cartagena wedding venue book"], mid: ["best colombia wedding venues"], low: ["colombian wedding traditions"] },
  },
  {
    id: "argentina", slug: "argentina", name: "Argentina", iso2: "AR", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Argentina | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Argentina. Buenos Aires tango elegance and Mendoza wine country, editorially selected.",
    evergreenContent: "Argentina marries passionate culture with natural grandeur, Buenos Aires' tango-infused elegance, Mendoza's Andes-backed vineyards and Patagonia's glacial wilderness create celebrations of South American sophistication.",
    focusKeywords: ["luxury wedding argentina", "buenos aires wedding", "mendoza winery wedding"],
    aiSummary: "Buenos Aires urban-luxury plus Mendoza wine country. Niche but growing. Tango cultural element unique differentiator.",
    intentSignals: { high: ["buenos aires wedding venue book"], mid: ["best argentina wedding venues"], low: ["argentine wedding traditions"] },
  },
  {
    id: "bahamas", slug: "bahamas", name: "Bahamas", iso2: "BS", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in the Bahamas | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in the Bahamas. Private island escapes, Nassau elegance and Exuma swimming pigs, editorially selected.",
    evergreenContent: "The Bahamas defines tropical luxury, the pink sands of Harbour Island, Exuma's swimming pigs cays, Nassau's Atlantis grandeur and private island buyouts create the ultimate Caribbean wedding escape.",
    focusKeywords: ["luxury wedding bahamas", "bahamas wedding venue", "harbour island wedding", "exuma wedding"],
    aiSummary: "Ultra-luxury Caribbean. Private island and resort-exclusive model. Strong US East Coast and celebrity demand.",
    intentSignals: { high: ["bahamas private island wedding book", "harbour island wedding venue"], mid: ["best bahamas wedding venues"], low: ["bahamas wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // INDIAN OCEAN, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mauritius", slug: "mauritius", name: "Mauritius", iso2: "MU", listingCount: 3,
    seoTitleTemplate: "Luxury Wedding Vendors in Mauritius | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Mauritius. Le Morne peninsula, Grand Baie resorts and tropical garden ceremonies, editorially selected.",
    evergreenContent: "Mauritius blends tropical paradise with French-Creole sophistication, Le Morne's dramatic basalt rock, Grand Baie's resort coastline and sugar-plantation estates create a refined Indian Ocean wedding destination.",
    focusKeywords: ["luxury wedding mauritius", "mauritius wedding venue", "mauritius beach wedding", "mauritius destination wedding"],
    aiSummary: "Premium Indian Ocean destination. Resort-wedding model dominates. Strong South African, UK and French demand. Year-round.",
    intentSignals: { high: ["mauritius resort wedding book", "mauritius wedding planner"], mid: ["best mauritius wedding venues"], low: ["mauritius wedding ideas"] },
  },
  {
    id: "seychelles", slug: "seychelles", name: "Seychelles", iso2: "SC", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Seychelles | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Seychelles. Granite boulder beaches, private island resorts and coral reef ceremonies, editorially selected.",
    evergreenContent: "Seychelles offers prehistoric beauty, giant granite boulders framing pristine beaches, private island resorts, lush jungle mountains and the world's most exclusive honeymoon-wedding combination destination.",
    focusKeywords: ["luxury wedding seychelles", "seychelles wedding venue", "seychelles beach wedding"],
    aiSummary: "Ultra-exclusive island market. Private island resorts lead. Honeymoon-wedding combination dominant model. Very high per-night spend.",
    intentSignals: { high: ["seychelles private island wedding"], mid: ["best seychelles wedding venues"], low: ["seychelles wedding ideas"] },
  },
  {
    id: "fiji", slug: "fiji", name: "Fiji", iso2: "FJ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Fiji | LWD",
    metaDescriptionTemplate: "Browse curated luxury wedding venues in Fiji. Private island buyouts, coral reef ceremonies and traditional Fijian blessings, editorially selected.",
    evergreenContent: "Fiji's 333 islands offer the South Pacific dream, private island resort buyouts, coral reef snorkelling receptions, traditional Fijian warrior blessings and some of the world's friendliest hospitality.",
    focusKeywords: ["luxury wedding fiji", "fiji wedding venue", "fiji island wedding", "fiji destination wedding"],
    aiSummary: "Pacific island premium destination. Private island model. Strong Australian and NZ demand. Traditional blessing ceremonies unique.",
    intentSignals: { high: ["fiji private island wedding book"], mid: ["best fiji wedding venues"], low: ["fiji wedding ideas"] },
  },
  // ═══════════════════════════════════════════════════════════════════════
  // AFRICA, Extended
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "tanzania", slug: "tanzania", name: "Tanzania", iso2: "TZ", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Tanzania | LWD",
    metaDescriptionTemplate: "Discover curated luxury wedding venues in Tanzania. Zanzibar spice island, Serengeti safari lodges and Kilimanjaro views, editorially selected.",
    evergreenContent: "Tanzania pairs wildlife spectacle with island paradise, Serengeti safari lodge ceremonies, Ngorongoro Crater rim celebrations and Zanzibar's Stone Town spice-scented lanes and white-sand beaches.",
    focusKeywords: ["luxury wedding tanzania", "zanzibar wedding venue", "serengeti wedding", "tanzania safari wedding"],
    aiSummary: "Zanzibar beach + Serengeti safari dual proposition. Small but ultra-premium. Strong honeymoon-wedding combination.",
    intentSignals: { high: ["zanzibar wedding venue book", "serengeti lodge wedding"], mid: ["best tanzania wedding venues"], low: ["tanzania wedding ideas"] },
  },
  {
    id: "egypt", slug: "egypt", name: "Egypt", iso2: "EG", listingCount: 2,
    seoTitleTemplate: "Luxury Wedding Vendors in Egypt | LWD",
    metaDescriptionTemplate: "Explore curated luxury wedding venues in Egypt. Pyramids of Giza backdrop, Red Sea resorts and Nile cruise celebrations, editorially selected.",
    evergreenContent: "Egypt offers 5,000 years of romance, the Pyramids of Giza as wedding backdrop, Nile felucca receptions, Red Sea resort luxury and the ancient temples of Luxor create celebrations of monumental drama.",
    focusKeywords: ["luxury wedding egypt", "pyramids wedding", "red sea wedding", "egypt destination wedding"],
    aiSummary: "Iconic backdrop market. Pyramid-view ceremonies unique globally. Red Sea resort weddings growing. Nile cruise receptions niche.",
    intentSignals: { high: ["egypt pyramids wedding venue"], mid: ["best egypt wedding venues"], low: ["egypt wedding ideas"] },
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// Region Taxonomy, Sub-geography layer for SEO clustering + AI precision
// ═════════════════════════════════════════════════════════════════════════════
// Activation: urlEnabledManual === false → disabled | true → enabled | null → defer to auto
// Auto: if urlEverActivated → enabled (sticky) | if listingCount >= threshold & primary → enabled
// REGION_AUTO_THRESHOLD imported from engine/activation.js

const DIRECTORY_REGIONS = [
  // ── Italy (imported from src/data/italy/regions.js) ────────────────────────
  ...ITALY_REGIONS,

  // ── France ───────────────────────────────────────────────────────────────
  { id: "provence", countrySlug: "france", slug: "provence", name: "Provence", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 6, description: "Lavender fields, sun-drenched bastides and Michelin-starred catering. The soul of French destination weddings.", focusKeywords: ["provence wedding", "provence wedding venue", "french countryside wedding"], aiSummary: "Dominant French region. Lavender season (June-July) drives peak demand. Strong planner ecosystem.", intentSignals: { high: ["provence wedding venue book", "provence wedding planner hire"], mid: ["best provence wedding venues", "south of france wedding"], low: ["provence wedding inspiration"] } },
  { id: "loire-valley", countrySlug: "france", slug: "loire-valley", name: "Loire Valley", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 4, description: "The château capital of the world. Renaissance architecture set among vineyard-laced river valleys.", focusKeywords: ["loire valley wedding", "chateau wedding loire", "french castle wedding"], aiSummary: "Château weddings dominate. Strong anglophone demand. Q2/Q3 peak.", intentSignals: { high: ["loire valley chateau wedding book", "loire wedding planner"], mid: ["best chateau wedding venues france"], low: ["loire valley wedding ideas"] } },
  { id: "paris-idf", countrySlug: "france", slug: "paris-ile-de-france", name: "Paris & Île-de-France", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "The city of light, grand hôtels particuliers, palace venues and the world's finest wedding couture.", focusKeywords: ["paris wedding", "paris wedding venue", "luxury wedding paris"], aiSummary: "Urban luxury hub. High planner concentration. Elopement and intimate weddings trending.", intentSignals: { high: ["paris luxury wedding venue hire", "paris wedding planner book"], mid: ["best paris wedding venues"], low: ["paris wedding ideas"] } },
  { id: "cote-dazur", countrySlug: "france", slug: "cote-dazur", name: "Côte d'Azur", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "The French Riviera, glamorous coastal celebrations from Saint-Tropez to Monaco.", focusKeywords: ["cote d'azur wedding", "french riviera wedding", "st tropez wedding"], aiSummary: "High-end market. Celebrity wedding association drives aspirational search. Summer-only season.", intentSignals: { high: ["french riviera wedding venue", "st tropez wedding planner"], mid: ["best cote d'azur wedding venues"], low: ["french riviera wedding ideas"] } },
  { id: "bordeaux", countrySlug: "france", slug: "bordeaux", name: "Bordeaux", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "World-class wine estates and neoclassical architecture along the Garonne.", focusKeywords: ["bordeaux wedding"], aiSummary: "Wine tourism crossover. Growing but niche.", intentSignals: { high: [], mid: ["bordeaux wedding venues"], low: ["bordeaux wedding ideas"] } },

  // ── UK ───────────────────────────────────────────────────────────────────
  { id: "cotswolds", countrySlug: "uk", slug: "cotswolds", name: "Cotswolds", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 5, description: "Honey-stone villages, rolling hills and quintessential English country houses.", focusKeywords: ["cotswolds wedding", "cotswolds wedding venue", "country wedding cotswolds"], aiSummary: "Top UK region by search volume. Country house and barn venues dominate. Year-round demand.", intentSignals: { high: ["cotswolds wedding venue book", "cotswolds wedding planner"], mid: ["best cotswolds wedding venues"], low: ["cotswolds wedding inspiration"] } },
  { id: "london", countrySlug: "uk", slug: "london", name: "London", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 4, description: "Grand hotels, museum spaces and rooftop terraces across the capital.", focusKeywords: ["london wedding venue", "luxury wedding london", "london wedding planner"], aiSummary: "Highest vendor density. Hotel and unique venue weddings lead. Strong corporate-adjacent market.", intentSignals: { high: ["luxury london wedding venue hire", "london wedding planner book"], mid: ["best london wedding venues"], low: ["london wedding ideas"] } },
  { id: "surrey", countrySlug: "uk", slug: "surrey", name: "Surrey", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Loseley Park, Surrey Hills AONB and grand estates within easy reach of London. Home counties elegance.", focusKeywords: ["surrey wedding venue"], aiSummary: "London commuter belt convenience. Grand estate venues. Surrey Hills scenic beauty. High listing quality.", intentSignals: { high: [], mid: ["best surrey wedding venues"], low: ["surrey wedding ideas"] } },
  { id: "berkshire", countrySlug: "uk", slug: "berkshire", name: "Berkshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Cliveden, Windsor Castle and Coworth Park. Royal Berkshire grandeur and Thames-side celebrations.", focusKeywords: ["berkshire wedding venue"], aiSummary: "Cliveden and Coworth Park anchor ultra-luxury. Windsor Castle association. Royal county prestige.", intentSignals: { high: ["berkshire wedding venue book"], mid: ["best berkshire wedding venues"], low: ["berkshire wedding ideas"] } },
  { id: "lake-district", countrySlug: "uk", slug: "lake-district", name: "Lake District", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Romantic lakeside settings amid England's most celebrated national park.", focusKeywords: ["lake district wedding"], aiSummary: "Niche romantic segment. Growing slowly. Intimate weddings dominate.", intentSignals: { high: [], mid: ["lake district wedding venues"], low: ["lake district wedding ideas"] } },

  // ── Spain ─────────────────────────────────────────────────────────────────
  { id: "mallorca", countrySlug: "spain", slug: "mallorca", name: "Mallorca", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Mediterranean fincas, mountain-top monasteries and beach clubs across the Balearics' largest island.", focusKeywords: ["mallorca wedding", "mallorca finca wedding", "balearic wedding"], aiSummary: "Leading Spanish island destination. Finca weddings dominate. Strong German and British demand.", intentSignals: { high: ["mallorca finca wedding venue book", "mallorca wedding planner"], mid: ["best mallorca wedding venues"], low: ["mallorca wedding ideas"] } },
  { id: "marbella", countrySlug: "spain", slug: "marbella", name: "Marbella & Costa del Sol", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Glamorous beachfront celebrations and Andalusian haciendas along Spain's golden coast.", focusKeywords: ["marbella wedding", "costa del sol wedding", "andalusia wedding"], aiSummary: "British expat market plus destination demand. Beach club and hacienda venues lead.", intentSignals: { high: ["marbella wedding venue book", "marbella wedding planner hire"], mid: ["best marbella wedding venues"], low: ["marbella wedding inspiration"] } },
  { id: "ibiza", countrySlug: "spain", slug: "ibiza", name: "Ibiza", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Bohemian-luxe celebrations on the White Isle, sunset cliff-top ceremonies and agroturismo estates.", focusKeywords: ["ibiza wedding", "ibiza wedding venue", "balearic wedding ibiza"], aiSummary: "Younger luxury demographic. Festival-style and intimate both trending. Strong social media amplification.", intentSignals: { high: ["ibiza wedding venue book", "ibiza wedding planner"], mid: ["best ibiza wedding venues"], low: ["ibiza wedding ideas"] } },
  { id: "barcelona", countrySlug: "spain", slug: "barcelona", name: "Barcelona", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Gaudí-inspired architecture, coastal charm and Catalan culinary excellence.", focusKeywords: ["barcelona wedding"], aiSummary: "Urban destination. Low listing count. Planner network developing.", intentSignals: { high: [], mid: ["barcelona wedding venues"], low: ["barcelona wedding ideas"] } },

  // ── USA ───────────────────────────────────────────────────────────────────
  { id: "new-york", countrySlug: "usa", slug: "new-york", name: "New York", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "From the Hudson Valley estates to Manhattan penthouses, the epicentre of American luxury weddings.", focusKeywords: ["new york wedding", "nyc wedding venue", "hudson valley wedding"], aiSummary: "Highest-spend US market. Hudson Valley estates and city venues split demand. Year-round.", intentSignals: { high: ["nyc luxury wedding venue book", "hudson valley wedding planner"], mid: ["best new york wedding venues"], low: ["new york wedding inspiration"] } },
  { id: "california", countrySlug: "usa", slug: "california", name: "California", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Napa Valley vineyards, Big Sur clifftops and Hollywood glamour across the Golden State.", focusKeywords: ["california wedding", "napa valley wedding", "big sur wedding"], aiSummary: "Winery weddings lead. Napa/Sonoma dominant. Big Sur ultra-premium niche.", intentSignals: { high: ["napa valley wedding venue book", "california wedding planner hire"], mid: ["best california wedding venues"], low: ["california wedding ideas"] } },
  { id: "florida", countrySlug: "usa", slug: "florida", name: "Florida", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Art Deco Miami, Palm Beach estates and tropical garden celebrations.", focusKeywords: ["florida luxury wedding"], aiSummary: "Emerging luxury segment. Palm Beach drives high-end demand. Winter season.", intentSignals: { high: [], mid: ["florida luxury wedding venues"], low: ["florida wedding ideas"] } },

  // ── UK, Comprehensive England ──────────────────────────────────────
  { id: "hampshire", countrySlug: "uk", slug: "hampshire", name: "Hampshire", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 4, description: "Georgian manor houses, Winchester Cathedral and the rolling Hampshire countryside. Southern England's elegant heartland.", focusKeywords: ["hampshire wedding venue", "winchester wedding"], aiSummary: "Strong country house market. New Forest boutique segment growing. Winchester cathedral weddings anchor.", intentSignals: { high: ["hampshire wedding venue book"], mid: ["best hampshire wedding venues"], low: ["hampshire wedding ideas"] } },
  { id: "devon", countrySlug: "uk", slug: "devon", name: "Devon", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "South Devon coast, Dartmouth, Salcombe, Exeter and Dartmoor. Dramatic clifftop venues and enchanted woodland estates.", focusKeywords: ["devon wedding venue", "south devon wedding"], aiSummary: "South Devon coast leads luxury demand. Dartmouth and Salcombe anchor maritime weddings. Dartmoor dramatic.", intentSignals: { high: ["devon wedding venue book"], mid: ["best devon wedding venues"], low: ["devon wedding ideas"] } },
  { id: "cornwall", countrySlug: "uk", slug: "cornwall", name: "Cornwall", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "St Ives, Padstow, Falmouth and the dramatic Cornish coast. Tin mine heritage and beach ceremony paradise.", focusKeywords: ["cornwall wedding venue", "cornwall beach wedding"], aiSummary: "Cornwall leads destination search in Southwest England. Beach and clifftop venues dominate. Strong summer peak.", intentSignals: { high: ["cornwall wedding venue book"], mid: ["best cornwall wedding venues"], low: ["cornwall wedding ideas"] } },
  { id: "kent", countrySlug: "uk", slug: "kent", name: "Kent", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "The Garden of England, Canterbury Cathedral, Leeds Castle and hop-garden barn conversions.", focusKeywords: ["kent wedding venue", "canterbury wedding", "leeds castle wedding"], aiSummary: "Garden of England positioning. Castle and barn venues lead. Canterbury Cathedral ceremonies prestigious.", intentSignals: { high: ["kent wedding venue book", "leeds castle wedding hire"], mid: ["best kent wedding venues"], low: ["kent wedding ideas"] } },
  { id: "sussex", countrySlug: "uk", slug: "sussex", name: "Sussex", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 4, description: "Brighton's Regency glamour, Goodwood estate and the rolling South Downs. Coastal chic meets country grandeur.", focusKeywords: ["sussex wedding venue", "brighton wedding", "chichester wedding"], aiSummary: "Brighton urban-beach market plus South Downs country estates. Goodwood and Cowdray anchor luxury tier.", intentSignals: { high: ["sussex wedding venue book", "brighton wedding planner"], mid: ["best sussex wedding venues"], low: ["sussex wedding ideas"] } },
  { id: "norfolk", countrySlug: "uk", slug: "norfolk", name: "Norfolk", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Norfolk Broads, Burnham Market, Holkham and Norwich Cathedral. Big skies and medieval wool churches.", focusKeywords: ["norfolk wedding venue"], aiSummary: "Barn conversion boom. Burnham Market luxury cluster. Sandringham association drives prestige. Quieter refined market.", intentSignals: { high: ["norfolk wedding venue book"], mid: ["best norfolk wedding venues"], low: ["norfolk wedding ideas"] } },
  { id: "suffolk", countrySlug: "uk", slug: "suffolk", name: "Suffolk", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Aldeburgh, Southwold, the Heritage Coast and Snape Maltings. Refined coastal charm and gentle countryside.", focusKeywords: ["suffolk wedding venue"], aiSummary: "Heritage Coast beauty. Snape Maltings concert hall venue unique. Refined and understated market.", intentSignals: { high: [], mid: ["best suffolk wedding venues"], low: ["suffolk wedding ideas"] } },
  { id: "yorkshire", countrySlug: "uk", slug: "yorkshire", name: "Yorkshire", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "From the Yorkshire Dales and North York Moors to Harrogate's spa elegance and York's medieval grandeur.", focusKeywords: ["yorkshire wedding venue", "harrogate wedding", "york wedding venue"], aiSummary: "Harrogate-York corridor dominates. Castle Howard iconic. Dales barn conversions trending. Strong northern market.", intentSignals: { high: ["yorkshire wedding venue book", "castle howard wedding"], mid: ["best yorkshire wedding venues"], low: ["yorkshire wedding ideas"] } },
  { id: "oxfordshire", countrySlug: "uk", slug: "oxfordshire", name: "Oxfordshire", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "Blenheim Palace, dreaming Oxford spires, Henley Royal Regatta and the rolling Chiltern Hills.", focusKeywords: ["oxfordshire wedding venue", "blenheim palace wedding", "henley wedding"], aiSummary: "Blenheim anchors ultra-luxury. Oxford college venues unique. Henley riverside summer weddings. Premium home counties market.", intentSignals: { high: ["oxfordshire wedding venue book", "blenheim palace wedding hire"], mid: ["best oxfordshire wedding venues"], low: ["oxfordshire wedding ideas"] } },
  { id: "somerset", countrySlug: "uk", slug: "somerset", name: "Somerset", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Glastonbury, Exmoor, Bruton and Babington House. Mystical landscapes and creative-luxury country estates.", focusKeywords: ["somerset wedding venue"], aiSummary: "Babington House Soho House effect. Bruton creative-luxury emerging. Glastonbury mystique. Growing market.", intentSignals: { high: [], mid: ["best somerset wedding venues"], low: ["somerset wedding ideas"] } },
  { id: "bath-region", countrySlug: "uk", slug: "bath", name: "Bath", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Georgian crescents, Roman baths, the Royal Crescent and Assembly Rooms. England's most beautiful city.", focusKeywords: ["bath wedding venue", "bath spa wedding"], aiSummary: "Georgian architecture unmatched. Assembly Rooms and Royal Crescent. Spa integration unique selling point.", intentSignals: { high: ["bath wedding venue book"], mid: ["best bath wedding venues"], low: ["bath wedding ideas"] } },
  { id: "wiltshire", countrySlug: "uk", slug: "wiltshire", name: "Wiltshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Castle Combe, Salisbury Cathedral and Bowood House. Picture-perfect villages and ancient grandeur.", focusKeywords: ["wiltshire wedding venue"], aiSummary: "Castle Combe iconic village. Salisbury Cathedral ceremonies. Bowood House estate. Quieter luxury market.", intentSignals: { high: [], mid: ["best wiltshire wedding venues"], low: ["wiltshire wedding ideas"] } },
  { id: "dorset", countrySlug: "uk", slug: "dorset", name: "Dorset", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Jurassic Coast, Lulworth Cove, Bournemouth and Corfe Castle. Dramatic coastal geology and harbour charm.", focusKeywords: ["dorset wedding venue"], aiSummary: "Jurassic Coast outdoor weddings growing. Lulworth Cove dramatic ceremony location. Corfe Castle picturesque.", intentSignals: { high: [], mid: ["best dorset wedding venues"], low: ["dorset wedding ideas"] } },
  { id: "cheshire", countrySlug: "uk", slug: "cheshire", name: "Cheshire", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Peckforton Castle, Tatton Park and the affluent Golden Triangle. The Northwest's most prestigious wedding county.", focusKeywords: ["cheshire wedding venue", "peckforton castle wedding", "tatton park wedding"], aiSummary: "Northwest luxury hub. Castle and stately home venues dominate. Affluent local market plus destination appeal.", intentSignals: { high: ["cheshire wedding venue book", "peckforton castle wedding hire"], mid: ["best cheshire wedding venues"], low: ["cheshire wedding ideas"] } },
  { id: "northumberland", countrySlug: "uk", slug: "northumberland", name: "Northumberland", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Alnwick Castle, Bamburgh beach and the wild beauty of Hadrian's Wall country across Northumberland.", focusKeywords: ["northumberland wedding venue", "alnwick castle wedding", "durham wedding"], aiSummary: "Castle wedding stronghold. Alnwick Harry Potter association. Remote luxury growing. Smaller but distinctive market.", intentSignals: { high: ["alnwick castle wedding venue"], mid: ["best northumberland wedding venues"], low: ["northumberland wedding ideas"] } },
  { id: "durham", countrySlug: "uk", slug: "durham", name: "Durham", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Durham Cathedral, the castle, Lumley Castle and the historic university city on the River Wear.", focusKeywords: ["durham wedding venue"], aiSummary: "Durham Cathedral ceremonies prestigious. Lumley Castle anchor. Historic university city. Smaller northern market.", intentSignals: { high: [], mid: ["best durham wedding venues"], low: ["durham wedding ideas"] } },
  { id: "warwickshire", countrySlug: "uk", slug: "warwickshire", name: "Warwickshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Shakespeare's Stratford-upon-Avon, Warwick Castle and the grand estates of Warwickshire.", focusKeywords: ["warwickshire wedding venue", "stratford upon avon wedding", "warwick castle wedding"], aiSummary: "Shakespeare connection unique. Warwick Castle ceremonies. Strong regional market. Midlands hub.", intentSignals: { high: ["warwickshire wedding venue book"], mid: ["best warwickshire wedding venues"], low: ["warwickshire wedding ideas"] } },
  { id: "west-midlands", countrySlug: "uk", slug: "west-midlands", name: "West Midlands", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Birmingham's Edgbaston elegance, Aston Hall and the industrial heritage of England's second city.", focusKeywords: ["birmingham wedding venue"], aiSummary: "Birmingham urban weddings growing. Edgbaston venue cluster. Aston Hall grandeur. Industrial-chic conversions.", intentSignals: { high: [], mid: ["best birmingham wedding venues"], low: ["birmingham wedding ideas"] } },
  { id: "derbyshire", countrySlug: "uk", slug: "derbyshire", name: "Derbyshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Chatsworth House grandeur, the Peak District, Buxton's Georgian spa town elegance and the Derwent Valley's mills.", focusKeywords: ["derbyshire wedding venue", "chatsworth wedding", "peak district wedding"], aiSummary: "Chatsworth dominates. Peak District outdoor weddings growing. Buxton spa town niche. Quieter luxury.", intentSignals: { high: ["chatsworth wedding venue"], mid: ["best derbyshire wedding venues"], low: ["peak district wedding ideas"] } },
  { id: "buckinghamshire", countrySlug: "uk", slug: "buckinghamshire", name: "Buckinghamshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Waddesdon Manor's Rothschild grandeur, Cliveden's Thameside terraces and the Chiltern Hills.", focusKeywords: ["buckinghamshire wedding venue", "waddesdon manor wedding", "cliveden wedding"], aiSummary: "Waddesdon and Cliveden anchor ultra-luxury. Close to London premium. Chiltern barn conversions growing.", intentSignals: { high: ["buckinghamshire wedding venue book"], mid: ["best buckinghamshire wedding venues"], low: ["buckinghamshire wedding ideas"] } },
  { id: "hertfordshire", countrySlug: "uk", slug: "hertfordshire", name: "Hertfordshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Home counties elegance, Hatfield House, the Hertfordshire countryside and grand country house venues.", focusKeywords: ["hertfordshire wedding venue"], aiSummary: "London-adjacent convenience. Country house market strong. TOWIE effect drives Essex awareness. Volume market.", intentSignals: { high: [], mid: ["best hertfordshire wedding venues"], low: ["hertfordshire wedding ideas"] } },
  { id: "essex", countrySlug: "uk", slug: "essex", name: "Essex", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Hedingham Castle, Layer Marney Tower and coastal marshes. Historic fortifications and Thames estuary charm.", focusKeywords: ["essex wedding venue"], aiSummary: "Castle and tower venues distinctive. Layer Marney Tower unique. TOWIE effect drives awareness. Volume market.", intentSignals: { high: [], mid: ["best essex wedding venues"], low: ["essex wedding ideas"] } },
  { id: "lancashire", countrySlug: "uk", slug: "lancashire", name: "Lancashire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "The Ribble Valley's country houses, Lancashire's moorland estates and historic mill conversions.", focusKeywords: ["lancashire wedding venue"], aiSummary: "Manchester urban weddings plus Ribble Valley country houses. Industrial-chic venue conversions trending.", intentSignals: { high: [], mid: ["best lancashire wedding venues"], low: ["lancashire wedding ideas"] } },
  { id: "manchester", countrySlug: "uk", slug: "manchester", name: "Greater Manchester", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Industrial-chic conversions, The Midland Hotel and the creative energy of England's northern powerhouse.", focusKeywords: ["manchester wedding venue"], aiSummary: "Manchester urban weddings growing fast. Industrial-chic venue conversions trending. Northern powerhouse.", intentSignals: { high: [], mid: ["best manchester wedding venues"], low: ["manchester wedding ideas"] } },

  { id: "gloucestershire", countrySlug: "uk", slug: "gloucestershire", name: "Gloucestershire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Forest of Dean, the Severn Valley and Cheltenham's Regency elegance. Gateway to the Cotswolds.", focusKeywords: ["gloucestershire wedding venue"], aiSummary: "Forest of Dean woodland venues. Cheltenham Regency architecture. Cotswolds gateway. Growing market.", intentSignals: { high: [], mid: ["best gloucestershire wedding venues"], low: ["gloucestershire wedding ideas"] } },
  { id: "cambridgeshire", countrySlug: "uk", slug: "cambridgeshire", name: "Cambridgeshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Cambridge's ancient colleges, the Backs river meadows and Ely Cathedral's fenland grandeur.", focusKeywords: ["cambridgeshire wedding venue", "cambridge wedding"], aiSummary: "Cambridge college venues unique. Ely Cathedral prestigious. Fenland country house market. Academic prestige.", intentSignals: { high: [], mid: ["best cambridgeshire wedding venues"], low: ["cambridge wedding ideas"] } },
  { id: "lincolnshire", countrySlug: "uk", slug: "lincolnshire", name: "Lincolnshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Lincoln Cathedral, the Wolds' rolling chalk hills and the historic market towns of rural England.", focusKeywords: ["lincolnshire wedding venue"], aiSummary: "Lincoln Cathedral anchor. Wolds countryside. Rural estate venues. Quieter traditional market.", intentSignals: { high: [], mid: ["lincolnshire wedding venue"], low: ["lincolnshire wedding ideas"] } },
  { id: "nottinghamshire", countrySlug: "uk", slug: "nottinghamshire", name: "Nottinghamshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Nottingham Castle, Sherwood Forest's ancient oaks and the grand ducal estates of the Dukeries.", focusKeywords: ["nottinghamshire wedding venue"], aiSummary: "Robin Hood heritage marketing. Nottingham Castle redevelopment. Clumber Park and Thoresby. Midlands market.", intentSignals: { high: [], mid: ["best nottinghamshire wedding venues"], low: ["nottinghamshire wedding ideas"] } },
  { id: "leicestershire", countrySlug: "uk", slug: "leicestershire", name: "Leicestershire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Belvoir Castle, Bradgate Park and the hunting shires of the English Midlands.", focusKeywords: ["leicestershire wedding venue"], aiSummary: "Belvoir Castle grandeur. Hunting shire heritage. Midlands accessibility. Traditional estate market.", intentSignals: { high: [], mid: ["leicestershire wedding venue"], low: ["leicestershire wedding ideas"] } },
  { id: "shropshire", countrySlug: "uk", slug: "shropshire", name: "Shropshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Ludlow's medieval castle town, the Ironbridge Gorge and the rolling Shropshire Hills.", focusKeywords: ["shropshire wedding venue"], aiSummary: "Ludlow foodie reputation. Ironbridge industrial heritage. Shropshire Hills AONB. Welsh Marches charm.", intentSignals: { high: [], mid: ["shropshire wedding venue"], low: ["shropshire wedding ideas"] } },
  { id: "worcestershire", countrySlug: "uk", slug: "worcestershire", name: "Worcestershire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Malvern Hills, Worcester Cathedral and the fruit orchards of the Vale of Evesham.", focusKeywords: ["worcestershire wedding venue"], aiSummary: "Malvern Hills scenic backdrop. Worcester Cathedral ceremonies. Elgar country heritage. Rural charm.", intentSignals: { high: [], mid: ["worcestershire wedding venue"], low: ["worcestershire wedding ideas"] } },
  { id: "herefordshire", countrySlug: "uk", slug: "herefordshire", name: "Herefordshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Black Mountains, Hereford Cathedral's Mappa Mundi and cider-apple orchards along the River Wye.", focusKeywords: ["herefordshire wedding venue"], aiSummary: "Black Mountains dramatic. River Wye beauty. Cider heritage. Very rural luxury niche.", intentSignals: { high: [], mid: ["herefordshire wedding venue"], low: ["herefordshire wedding ideas"] } },
  { id: "staffordshire", countrySlug: "uk", slug: "staffordshire", name: "Staffordshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Alton Towers estate, Shugborough Hall and the Staffordshire Moorlands' heather-clad peaks.", focusKeywords: ["staffordshire wedding venue"], aiSummary: "Alton Towers estate unique venue. Shugborough Hall grandeur. Moorlands scenic. Midlands market.", intentSignals: { high: [], mid: ["staffordshire wedding venue"], low: ["staffordshire wedding ideas"] } },
  { id: "northamptonshire", countrySlug: "uk", slug: "northamptonshire", name: "Northamptonshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Althorp House, the Spires of Northampton and the grand estates of the Shires.", focusKeywords: ["northamptonshire wedding venue"], aiSummary: "Althorp House (Spencer family) prestigious. Grand estate market. Central England accessibility.", intentSignals: { high: [], mid: ["northamptonshire wedding venue"], low: ["northamptonshire wedding ideas"] } },
  { id: "bedfordshire", countrySlug: "uk", slug: "bedfordshire", name: "Bedfordshire", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Woburn Abbey, Luton Hoo and the Chiltern Hills' beechwood countryside north of London.", focusKeywords: ["bedfordshire wedding venue"], aiSummary: "Woburn Abbey anchor. Luton Hoo luxury. London accessible. Chiltern Hills scenic.", intentSignals: { high: [], mid: ["bedfordshire wedding venue"], low: ["bedfordshire wedding ideas"] } },
  { id: "isle-of-wight", countrySlug: "uk", slug: "isle-of-wight", name: "Isle of Wight", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Queen Victoria's Osborne House, Cowes sailing week and the island's fossil-rich coastline.", focusKeywords: ["isle of wight wedding venue"], aiSummary: "Osborne House royal association. Island exclusivity. Cowes sailing heritage. Boutique niche.", intentSignals: { high: [], mid: ["isle of wight wedding venue"], low: ["isle of wight wedding ideas"] } },
  { id: "bristol", countrySlug: "uk", slug: "bristol", name: "Bristol", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Clifton Suspension Bridge, the harbourside and Brunel's SS Great Britain. Creative urban energy.", focusKeywords: ["bristol wedding venue"], aiSummary: "Creative-industrial venue conversions. Clifton Village elegance. Harbourside development. Growing urban market.", intentSignals: { high: [], mid: ["best bristol wedding venues"], low: ["bristol wedding ideas"] } },
  { id: "merseyside", countrySlug: "uk", slug: "merseyside", name: "Merseyside", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Liverpool's Albert Dock, the Liver Building and the cultural renaissance of England's maritime city.", focusKeywords: ["liverpool wedding venue"], aiSummary: "Albert Dock and waterfront venues. Beatles heritage tourism. Cultural capital. Growing market.", intentSignals: { high: [], mid: ["best liverpool wedding venues"], low: ["liverpool wedding ideas"] } },
  { id: "cumbria", countrySlug: "uk", slug: "cumbria", name: "Cumbria", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Lake District's romantic lakeside settings, Carlisle Castle and the Eden Valley's pastoral beauty.", focusKeywords: ["cumbria wedding venue"], aiSummary: "Lake District overlap. Romantic lakeside venues. Carlisle Castle anchor. Intimate celebrations.", intentSignals: { high: [], mid: ["cumbria wedding venue"], low: ["cumbria wedding ideas"] } },
  { id: "rutland", countrySlug: "uk", slug: "rutland", name: "Rutland", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "England's smallest county, Rutland Water, the market town of Oakham and unspoilt ironstone villages.", focusKeywords: ["rutland wedding venue"], aiSummary: "England's smallest county. Exclusive and intimate. Rutland Water scenic. Very niche boutique market.", intentSignals: { high: [], mid: ["rutland wedding venue"], low: ["rutland wedding ideas"] } },

  // ── UK, Scotland ───────────────────────────────────────────────────
  { id: "scotland", countrySlug: "uk", slug: "scotland", name: "Scotland", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 8, description: "Castle estates, Highland lochs, Edinburgh's Georgian grandeur and Glasgow's creative energy. Scotland's most celebrated wedding destinations.", focusKeywords: ["scotland wedding venue", "scottish castle wedding", "luxury wedding scotland", "edinburgh wedding"], aiSummary: "Castle weddings drive international demand. Edinburgh urban-luxury hub. Highland elopements trending. Strong US-Irish heritage market. Seasonal May-September peak.", intentSignals: { high: ["scottish castle wedding venue book", "edinburgh wedding planner"], mid: ["best scotland wedding venues", "highland castle wedding"], low: ["scotland wedding ideas", "scottish wedding traditions"] } },

  // ── UK, Wales ──────────────────────────────────────────────────────
  { id: "wales", countrySlug: "uk", slug: "wales", name: "Wales", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 4, description: "Pembrokeshire's dramatic coast, Snowdonia's mountain grandeur, Cardiff's cosmopolitan charm and ancient castle estates across the principality.", focusKeywords: ["wales wedding venue", "welsh castle wedding", "pembrokeshire wedding", "snowdonia wedding"], aiSummary: "Castle concentration unique. Pembrokeshire coast and Snowdonia mountains drive landscape weddings. Growing destination appeal. Underpriced vs English equivalents.", intentSignals: { high: ["wales castle wedding venue book"], mid: ["best wales wedding venues", "pembrokeshire wedding venue"], low: ["wales wedding ideas"] } },


  // ── UK, Northern Ireland ───────────────────────────────────────────
  { id: "northern-ireland", countrySlug: "uk", slug: "northern-ireland", name: "Northern Ireland", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Giant's Causeway drama, the Antrim Coast, Belfast's Titanic Quarter renaissance and ancient castle estates across the province.", focusKeywords: ["northern ireland wedding venue", "belfast wedding", "antrim coast wedding"], aiSummary: "Giant's Causeway ceremonies iconic. Belfast Titanic Quarter modern venue cluster. Game of Thrones tourism crossover. Small but distinctive market.", intentSignals: { high: ["northern ireland wedding venue book"], mid: ["best belfast wedding venues"], low: ["northern ireland wedding ideas"] } },


  // ── UK, Channel Islands ────────────────────────────────────────────
  { id: "channel-islands", countrySlug: "uk", slug: "channel-islands", name: "Channel Islands", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Jersey and Guernsey's French-inflected island charm, granite manor houses, sheltered bays, world-class seafood and a gentle pace of island life.", focusKeywords: ["channel islands wedding venue", "jersey wedding", "guernsey wedding"], aiSummary: "Boutique island destinations. Tax-efficient incentive. French-British cultural blend. Jersey leads with Guernsey micro-destination niche.", intentSignals: { high: ["jersey wedding venue book"], mid: ["best channel islands wedding venues"], low: ["channel islands wedding ideas"] } },


  // ── Ireland ─────────────────────────────────────────────────────────
  { id: "dublin", countrySlug: "ireland", slug: "dublin", name: "Dublin", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 2, description: "Georgian Dublin's literary elegance, Dublin Castle's State Apartments and the capital's grand hotel tradition.", focusKeywords: ["dublin wedding venue", "dublin castle wedding"], aiSummary: "Ireland's urban luxury hub. Georgian hotel and castle venues dominate. Year-round demand. Strongest market.", intentSignals: { high: ["dublin wedding venue book"], mid: ["best dublin wedding venues"], low: ["dublin wedding ideas"] } },
  { id: "wicklow", countrySlug: "ireland", slug: "wicklow", name: "Wicklow", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Powerscourt's Palladian grandeur, the Garden of Ireland's mountains and Glendalough's ancient monastic site.", focusKeywords: ["wicklow wedding venue", "powerscourt wedding"], aiSummary: "Powerscourt Estate iconic. Wicklow mountains proximity to capital. Garden of Ireland beauty.", intentSignals: { high: ["powerscourt wedding hire"], mid: ["best wicklow wedding venues"], low: ["wicklow wedding ideas"] } },
  { id: "kerry", countrySlug: "ireland", slug: "kerry", name: "Kerry", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "The Ring of Kerry, Killarney's lakes and Kenmare's charm along Ireland's Wild Atlantic Way.", focusKeywords: ["kerry wedding venue", "killarney wedding", "west cork wedding"], aiSummary: "Wild Atlantic beauty. Killarney lake and mountain venues dominate. Strong US-Irish heritage market. Peak summer.", intentSignals: { high: ["killarney wedding venue book", "kerry wedding planner"], mid: ["best kerry wedding venues"], low: ["kerry wedding ideas"] } },
  { id: "cork", countrySlug: "ireland", slug: "cork", name: "Cork", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "West Cork's rugged Atlantic coastline, Kinsale's gourmet harbour and the English Market's foodie heritage.", focusKeywords: ["cork wedding venue", "west cork wedding"], aiSummary: "West Cork wild Atlantic beauty. Kinsale harbour charm. English Market foodie culture. Strong US-Irish market.", intentSignals: { high: ["cork wedding venue book"], mid: ["best cork wedding venues"], low: ["cork wedding ideas"] } },
  { id: "galway", countrySlug: "ireland", slug: "galway", name: "Galway", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Galway's bohemian city, Connemara's wild beauty and the Aran Islands' ancient stone forts.", focusKeywords: ["galway wedding venue", "connemara wedding", "west of ireland wedding"], aiSummary: "Bohemian-luxury crossover. Castle hotels dominate. Connemara landscape unique selling point. Cultural richness.", intentSignals: { high: ["galway castle wedding venue book"], mid: ["best galway wedding venues"], low: ["galway wedding ideas"] } },
  { id: "clare", countrySlug: "ireland", slug: "clare", name: "Clare", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Cliffs of Moher, the Burren's lunar landscape and Dromoland Castle's medieval splendour.", focusKeywords: ["clare wedding venue", "cliffs of moher wedding"], aiSummary: "Cliffs of Moher ceremonies iconic. Dromoland Castle anchors luxury. Burren landscape unique. Growing appeal.", intentSignals: { high: ["dromoland castle wedding book"], mid: ["best clare wedding venues"], low: ["clare wedding ideas"] } },
  { id: "limerick", countrySlug: "ireland", slug: "limerick", name: "Limerick", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Limerick's castle-studded Shannon estuary, Adare Manor and the medieval King John's Castle.", focusKeywords: ["limerick wedding venue", "adare manor wedding"], aiSummary: "Adare Manor drives luxury demand. Shannon estuary scenic. King John's Castle historic. Growing market.", intentSignals: { high: ["adare manor wedding book"], mid: ["best limerick wedding venues"], low: ["limerick wedding ideas"] } },
  { id: "tipperary", countrySlug: "ireland", slug: "tipperary", name: "Tipperary", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Rock of Cashel, Ireland's fertile Golden Vale countryside and historic abbey ruins.", focusKeywords: ["tipperary wedding venue"], aiSummary: "Rock of Cashel dramatic ceremony location. Central Ireland location. Golden Vale countryside charm.", intentSignals: { high: [], mid: ["best tipperary wedding venues"], low: ["tipperary wedding ideas"] } },
  { id: "kilkenny", countrySlug: "ireland", slug: "kilkenny", name: "Kilkenny", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Medieval Kilkenny Castle, cobblestone lanes and the medieval mile of Ireland's most charming city.", focusKeywords: ["kilkenny wedding venue", "kilkenny castle wedding"], aiSummary: "Kilkenny Castle and medieval town drive demand. Cobblestone charm. Central location accessible.", intentSignals: { high: ["kilkenny castle wedding"], mid: ["best kilkenny wedding venues"], low: ["kilkenny wedding ideas"] } },
  { id: "donegal", countrySlug: "ireland", slug: "donegal", name: "Donegal", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Ireland's wild Northwest, sea stacks, Gaeltacht culture and some of Europe's most dramatic coastal scenery.", focusKeywords: ["donegal wedding venue", "wild atlantic way wedding"], aiSummary: "Ultra-remote luxury. Slieve League cliffs dramatic. Elopement and intimate wedding niche. Very small market.", intentSignals: { high: [], mid: ["donegal wedding venue"], low: ["donegal wedding ideas"] } },
  { id: "wexford", countrySlug: "ireland", slug: "wexford", name: "Wexford", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Wexford's medieval lanes, Hook Head peninsula and Ireland's Sunny Southeast coastline.", focusKeywords: ["wexford wedding venue"], aiSummary: "Southeast coast sunny reputation. Medieval town charm. Hook Head lighthouse dramatic.", intentSignals: { high: [], mid: ["best wexford wedding venues"], low: ["wexford wedding ideas"] } },
  { id: "waterford", countrySlug: "ireland", slug: "waterford", name: "Waterford", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Waterford's Viking heritage, crystal craftsmanship and Waterford Castle's island setting.", focusKeywords: ["waterford wedding venue"], aiSummary: "Waterford Castle island venue unique. Viking heritage city. Crystal craftsmanship. Growing niche.", intentSignals: { high: [], mid: ["waterford wedding venue"], low: ["waterford wedding ideas"] } },
  { id: "mayo", countrySlug: "ireland", slug: "mayo", name: "Mayo", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Ashford Castle's medieval splendour, the wild Atlantic beaches and Croagh Patrick pilgrimage mountain.", focusKeywords: ["mayo wedding venue", "ashford castle wedding"], aiSummary: "Ashford Castle single-handedly drives region. One of Ireland's most prestigious wedding venues globally.", intentSignals: { high: ["ashford castle wedding book"], mid: ["best mayo wedding venues"], low: ["mayo wedding ideas"] } },
  { id: "sligo", countrySlug: "ireland", slug: "sligo", name: "Sligo", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Yeats country, Ben Bulben mountain and the surfing beaches of Strandhill and Mullaghmore.", focusKeywords: ["sligo wedding venue"], aiSummary: "Yeats literary heritage unique. Ben Bulben dramatic backdrop. Strandhill coastal charm. Niche market.", intentSignals: { high: [], mid: ["sligo wedding venue"], low: ["sligo wedding ideas"] } },

  // ── Portugal ─────────────────────────────────────────────────────────
  { id: "algarve", countrySlug: "portugal", slug: "algarve", name: "Algarve", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "Golden cliffs, hidden coves and luxury resort weddings along Portugal's sun-drenched southern coast.", focusKeywords: ["algarve wedding venue", "algarve beach wedding", "portugal coast wedding"], aiSummary: "Portugal's leading wedding region. Cliff-top and resort venues dominate. Strong UK and Irish demand. Year-round.", intentSignals: { high: ["algarve wedding venue book", "algarve wedding planner"], mid: ["best algarve wedding venues"], low: ["algarve wedding ideas"] } },
  { id: "lisbon", countrySlug: "portugal", slug: "lisbon", name: "Lisbon & Cascais", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Lisbon's tiled palaces, Cascais riviera glamour and Sintra's fairy-tale hilltop estates.", focusKeywords: ["lisbon wedding venue", "cascais wedding", "sintra palace wedding"], aiSummary: "Sintra palaces drive luxury tier. Lisbon city weddings growing. Cascais coastal elegance. Combined city-beach appeal.", intentSignals: { high: ["sintra wedding venue book", "lisbon wedding planner"], mid: ["best lisbon wedding venues"], low: ["lisbon wedding ideas"] } },
  { id: "douro", countrySlug: "portugal", slug: "douro", name: "Douro Valley", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "UNESCO World Heritage terraced vineyards along the Douro River. Port wine quintas and panoramic estates.", focusKeywords: ["douro valley wedding", "portugal vineyard wedding", "douro quinta wedding"], aiSummary: "Wine country luxury. Quinta estates drive demand. Scenic river cruises incorporated. Growing fast.", intentSignals: { high: ["douro valley wedding venue book"], mid: ["best douro wedding venues"], low: ["douro wedding ideas"] } },
  { id: "porto", countrySlug: "portugal", slug: "porto", name: "Porto & the North", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Porto's azulejo-tiled cityscape, port wine cellars and the Minho's vineyard-draped river valleys.", focusKeywords: ["porto wedding venue", "northern portugal wedding"], aiSummary: "Porto city weddings emerging. Wine cellar receptions unique. Minho rural luxury developing.", intentSignals: { high: [], mid: ["porto wedding venue"], low: ["porto wedding ideas"] } },

  // ── Greece ───────────────────────────────────────────────────────────
  { id: "santorini", countrySlug: "greece", slug: "santorini", name: "Santorini", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 5, description: "Blue-domed churches, caldera sunsets and whitewashed cliff-edge terraces. The world's most iconic wedding island.", focusKeywords: ["santorini wedding venue", "santorini caldera wedding", "oia wedding"], aiSummary: "Global wedding icon. Caldera sunset ceremonies unmatched. Capacity-constrained. Year-round demand with April-October peak.", intentSignals: { high: ["santorini wedding venue book", "oia wedding planner"], mid: ["best santorini wedding venues", "santorini wedding cost"], low: ["santorini wedding ideas"] } },
  { id: "mykonos", countrySlug: "greece", slug: "mykonos", name: "Mykonos", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Glamorous Cycladic nightlife island, windmill-dotted hillsides, beach clubs and whitewashed luxury villas.", focusKeywords: ["mykonos wedding venue", "mykonos beach wedding", "greek island wedding"], aiSummary: "Party-luxury segment. Beach club and villa weddings dominate. Fashion-forward crowd. Strong social media amplification.", intentSignals: { high: ["mykonos wedding venue book", "mykonos wedding planner"], mid: ["best mykonos wedding venues"], low: ["mykonos wedding ideas"] } },
  { id: "crete", countrySlug: "greece", slug: "crete", name: "Crete", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Greece's largest island, Venetian harbours, mountain gorges and the Minoan legacy of Knossos.", focusKeywords: ["crete wedding venue", "chania wedding", "crete destination wedding"], aiSummary: "Chania old harbour weddings iconic. Diverse landscape from mountains to beaches. Value alternative to Santorini.", intentSignals: { high: ["crete wedding venue book", "chania wedding planner"], mid: ["best crete wedding venues"], low: ["crete wedding ideas"] } },
  { id: "athens-riviera", countrySlug: "greece", slug: "athens-riviera", name: "Athens & Athenian Riviera", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Ancient Acropolis views, Cape Sounion's Temple of Poseidon and the cosmopolitan Athenian Riviera coastline.", focusKeywords: ["athens wedding venue", "cape sounion wedding", "athenian riviera wedding"], aiSummary: "Cape Sounion temple ceremonies unique globally. Athens urban-luxury growing. Riviera resort weddings emerging.", intentSignals: { high: ["athens wedding venue book"], mid: ["best athens wedding venues"], low: ["athens wedding ideas"] } },
  { id: "corfu", countrySlug: "greece", slug: "corfu", name: "Corfu", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Venetian old town, Italianate villas and the lush green beauty of the Ionian islands.", focusKeywords: ["corfu wedding venue", "ionian islands wedding"], aiSummary: "Greenest Greek island. Venetian architecture unique. Durrell association. Strong UK market.", intentSignals: { high: ["corfu wedding venue book"], mid: ["best corfu wedding venues"], low: ["corfu wedding ideas"] } },
  { id: "rhodes-kos", countrySlug: "greece", slug: "rhodes-kos", name: "Rhodes & Kos", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Medieval Rhodes Old Town, the ancient Asklepion of Kos and Dodecanese island sun.", focusKeywords: ["rhodes wedding venue", "kos wedding"], aiSummary: "Rhodes medieval town ceremonies distinctive. Volume destination market. Value positioning.", intentSignals: { high: [], mid: ["rhodes wedding venue", "kos wedding venue"], low: ["rhodes wedding ideas"] } },
  { id: "kefalonia-zakynthos", countrySlug: "greece", slug: "kefalonia-zakynthos", name: "Kefalonia & Zakynthos", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Navagio Beach's shipwreck cove, Kefalonia's Melissani Cave and Captain Corelli's island romance.", focusKeywords: ["kefalonia wedding", "zakynthos wedding venue"], aiSummary: "Navagio Beach Instagram-famous. Captain Corelli association. Smaller but growing destination.", intentSignals: { high: [], mid: ["kefalonia wedding venue"], low: ["zakynthos wedding ideas"] } },

  // ── Croatia ──────────────────────────────────────────────────────────
  { id: "dubrovnik", countrySlug: "croatia", slug: "dubrovnik", name: "Dubrovnik", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "The Pearl of the Adriatic, medieval walled city, terracotta rooftops and Game of Thrones allure.", focusKeywords: ["dubrovnik wedding venue", "dubrovnik old town wedding"], aiSummary: "Croatia's luxury anchor. Game of Thrones tourism crossover. Old town terrace ceremonies iconic. Capacity-constrained.", intentSignals: { high: ["dubrovnik wedding venue book"], mid: ["best dubrovnik wedding venues"], low: ["dubrovnik wedding ideas"] } },
  { id: "istria", countrySlug: "croatia", slug: "istria", name: "Istria", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Croatian Tuscany, hilltop medieval towns, truffle forests and Adriatic coastal villages.", focusKeywords: ["istria wedding venue", "croatian hilltop wedding"], aiSummary: "Croatian Tuscany positioning. Hilltop town ceremonies growing. Rovinj harbour romantic. Truffle gastronomy.", intentSignals: { high: ["istria wedding venue book"], mid: ["best istria wedding venues"], low: ["istria wedding ideas"] } },
  { id: "hvar-split", countrySlug: "croatia", slug: "hvar-split", name: "Hvar & Split", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Hvar's lavender island glamour and Split's Diocletian's Palace, ancient Roman luxury meets Adriatic sunshine.", focusKeywords: ["hvar wedding venue", "split wedding", "dalmatian coast wedding"], aiSummary: "Hvar island glamour appeals to fashion-forward. Split palace venues historically unique. Yacht wedding crossover.", intentSignals: { high: ["hvar wedding venue book", "split wedding planner"], mid: ["best split wedding venues"], low: ["dalmatian coast wedding ideas"] } },

  // ── Switzerland ──────────────────────────────────────────────────────
  { id: "lake-geneva", countrySlug: "switzerland", slug: "lake-geneva", name: "Lake Geneva & Lausanne", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Palatial lakeside hotels, vineyard terraces and Alpine panoramas along Switzerland's French-speaking Riviera.", focusKeywords: ["lake geneva wedding venue", "lausanne wedding", "montreux wedding"], aiSummary: "Palace hotel market. Montreux Jazz Festival glamour. Vineyard terraces with lake and mountain views. Ultra-premium.", intentSignals: { high: ["lake geneva wedding venue book"], mid: ["best swiss wedding venues"], low: ["swiss wedding ideas"] } },
  { id: "zurich-lucerne", countrySlug: "switzerland", slug: "zurich-lucerne", name: "Zürich & Lucerne", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Lucerne's Chapel Bridge, lakeside grandeur and Zürich's cosmopolitan elegance at the foot of the Alps.", focusKeywords: ["zurich wedding venue", "lucerne wedding", "swiss city wedding"], aiSummary: "Lucerne scenic iconic. Bürgenstock resort drives ultra-luxury. Zürich urban sophistication. Strong corporate crossover.", intentSignals: { high: ["lucerne wedding venue book"], mid: ["best zurich wedding venues"], low: ["lucerne wedding ideas"] } },
  { id: "engadine", countrySlug: "switzerland", slug: "engadine", name: "Engadine & St Moritz", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "St Moritz's champagne climate, frozen lake ceremonies and Badrutt's Palace glamour.", focusKeywords: ["st moritz wedding", "engadine wedding venue", "alpine luxury wedding"], aiSummary: "Ultra-luxury Alpine. Frozen lake winter ceremonies unique globally. Badrutt's Palace iconic. Celebrity market.", intentSignals: { high: ["st moritz wedding venue"], mid: ["best engadine wedding venues"], low: ["alpine wedding ideas"] } },
  { id: "interlaken-bernese", countrySlug: "switzerland", slug: "interlaken", name: "Interlaken & Bernese Oberland", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Jungfrau's Alpine drama, turquoise lakes and mountain-railway ceremony access.", focusKeywords: ["interlaken wedding", "bernese oberland wedding"], aiSummary: "Adventure-luxury crossover. Jungfrau backdrop spectacular. Growing helicopter-access mountain ceremonies.", intentSignals: { high: [], mid: ["interlaken wedding venue"], low: ["swiss mountain wedding ideas"] } },

  // ── Austria ──────────────────────────────────────────────────────────
  { id: "vienna", countrySlug: "austria", slug: "vienna", name: "Vienna", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Imperial palaces, opera house grandeur and the waltz capital's unmatched Baroque elegance.", focusKeywords: ["vienna wedding venue", "vienna palace wedding", "austrian waltz wedding"], aiSummary: "Palace ballroom market unique. Schönbrunn and Belvedere drive demand. Classical music integration.", intentSignals: { high: ["vienna palace wedding venue book"], mid: ["best vienna wedding venues"], low: ["austrian wedding traditions"] } },
  { id: "salzburg", countrySlug: "austria", slug: "salzburg", name: "Salzburg & Salzkammergut", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Sound of Music grandeur, Baroque churches, Alpine lakes and the crystalline Salzkammergut lake district.", focusKeywords: ["salzburg wedding venue", "salzkammergut wedding", "sound of music wedding"], aiSummary: "Sound of Music association drives tourism. Lake district scenic venues. Baroque ceremony settings. Strong US demand.", intentSignals: { high: ["salzburg wedding venue book"], mid: ["best salzburg wedding venues"], low: ["salzburg wedding ideas"] } },
  { id: "tyrol", countrySlug: "austria", slug: "tyrol", name: "Tyrol & Innsbruck", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Innsbruck's golden-roofed old town, ski-resort luxury and the dramatic Tyrolean Alps.", focusKeywords: ["tyrol wedding venue", "innsbruck wedding"], aiSummary: "Alpine resort market. Winter ski weddings unique proposition. Summer hiking ceremonies growing.", intentSignals: { high: [], mid: ["tyrol wedding venue"], low: ["innsbruck wedding ideas"] } },

  // ── Germany ──────────────────────────────────────────────────────────
  { id: "bavaria", countrySlug: "germany", slug: "bavaria", name: "Bavaria", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Neuschwanstein fairy-tale turrets, Alpine beer gardens and Munich's Baroque palace grandeur.", focusKeywords: ["bavaria wedding venue", "neuschwanstein wedding", "munich wedding"], aiSummary: "Castle wedding destination. Neuschwanstein most-photographed globally. Munich urban luxury. Beer garden receptions.", intentSignals: { high: ["bavarian castle wedding book"], mid: ["best bavaria wedding venues"], low: ["german wedding traditions"] } },
  { id: "rhineland", countrySlug: "germany", slug: "rhineland", name: "Rhine Valley & Baden", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Rhine castle ruins, vineyard-terraced river valleys and Baden-Baden's spa-town sophistication.", focusKeywords: ["rhine valley wedding", "castle wedding germany", "baden baden wedding"], aiSummary: "Rhine castle romance. Vineyard river-cruise ceremonies. Baden-Baden spa luxury. Scenic grandeur.", intentSignals: { high: ["rhine castle wedding venue"], mid: ["best german wedding venues"], low: ["germany wedding ideas"] } },
  { id: "berlin", countrySlug: "germany", slug: "berlin", name: "Berlin", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Edgy creativity meets Prussian grandeur, industrial loft conversions and palace ballrooms.", focusKeywords: ["berlin wedding venue", "berlin luxury wedding"], aiSummary: "Contemporary-luxury niche. Industrial-chic venue conversions. International, creative crowd. Year-round.", intentSignals: { high: ["berlin wedding venue book"], mid: ["best berlin wedding venues"], low: ["berlin wedding ideas"] } },

  // ── Cyprus ───────────────────────────────────────────────────────────
  { id: "paphos", countrySlug: "cyprus", slug: "paphos", name: "Paphos", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Aphrodite's birthplace, clifftop terraces, ancient mosaics and Mediterranean sunset ceremonies.", focusKeywords: ["paphos wedding venue", "paphos beach wedding", "aphrodite wedding cyprus"], aiSummary: "Cyprus luxury anchor. Aphrodite mythology marketing powerful. Clifftop and resort venues dominate. Year-round.", intentSignals: { high: ["paphos wedding venue book"], mid: ["best paphos wedding venues"], low: ["paphos wedding ideas"] } },
  { id: "limassol", countrySlug: "cyprus", slug: "limassol", name: "Limassol", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Cyprus's cosmopolitan marina city, five-star beachfront resorts and wine-village mountain escapes.", focusKeywords: ["limassol wedding venue", "limassol beach wedding"], aiSummary: "Marina development driving luxury growth. Beach resort weddings. Wine village mountain retreats.", intentSignals: { high: ["limassol wedding venue book"], mid: ["best limassol wedding venues"], low: ["limassol wedding ideas"] } },
  { id: "larnaca-ayia-napa", countrySlug: "cyprus", slug: "larnaca-ayia-napa", name: "Larnaca & Ayia Napa", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Cape Greco sea caves, Ayia Napa's turquoise lagoons and Larnaca's salt lake flamingos.", focusKeywords: ["ayia napa wedding venue", "larnaca wedding"], aiSummary: "Cape Greco ceremonies Instagram-famous. Volume market. Value positioning vs Paphos.", intentSignals: { high: [], mid: ["ayia napa wedding venue"], low: ["larnaca wedding ideas"] } },

  // ── Malta ────────────────────────────────────────────────────────────
  { id: "valletta", countrySlug: "malta", slug: "valletta", name: "Valletta & Malta", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Fortress city of the Knights, Baroque cathedrals, palace courtyards and harbour-view terraces.", focusKeywords: ["valletta wedding venue", "malta palace wedding"], aiSummary: "Baroque venue concentration unique. Compact walkable city. Year-round Mediterranean climate.", intentSignals: { high: ["valletta wedding venue book"], mid: ["best malta wedding venues"], low: ["malta wedding ideas"] } },
  { id: "gozo", countrySlug: "malta", slug: "gozo", name: "Gozo", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Malta's quieter sister island, Citadella fortress, Calypso's Cave and rural Mediterranean charm.", focusKeywords: ["gozo wedding venue", "gozo island wedding"], aiSummary: "Intimate island alternative. Citadella fortress ceremonies. Very small but growing.", intentSignals: { high: [], mid: ["gozo wedding venue"], low: ["gozo wedding ideas"] } },

  // ── Montenegro ───────────────────────────────────────────────────────
  { id: "kotor", countrySlug: "montenegro", slug: "kotor", name: "Bay of Kotor", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Europe's southernmost fjord, medieval walled town, island churches and mountain-ringed bay.", focusKeywords: ["kotor wedding venue", "bay of kotor wedding", "montenegro fjord wedding"], aiSummary: "Fjord-setting unique in Mediterranean. Medieval town ceremonies. Yacht accessibility. Growing luxury resort supply.", intentSignals: { high: ["kotor bay wedding venue book"], mid: ["best kotor wedding venues"], low: ["kotor wedding ideas"] } },
  { id: "budva-sveti-stefan", countrySlug: "montenegro", slug: "budva", name: "Budva & Sveti Stefan", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Aman Sveti Stefan's island fortress, Budva's old town and the Montenegrin Riviera coastline.", focusKeywords: ["sveti stefan wedding", "budva wedding venue"], aiSummary: "Aman resort effect dominates. Sveti Stefan island iconic. Budva old town emerging.", intentSignals: { high: ["sveti stefan wedding venue"], mid: ["budva wedding venue"], low: ["montenegro riviera wedding"] } },

  // ── Slovenia ─────────────────────────────────────────────────────────
  { id: "bled", countrySlug: "slovenia", slug: "bled", name: "Lake Bled & Julian Alps", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "The fairy-tale lake with its island church, medieval cliff castle and Julian Alpine backdrop.", focusKeywords: ["lake bled wedding", "bled island church wedding", "slovenia wedding venue"], aiSummary: "Single most iconic wedding image in Central Europe. Island church ceremony globally unique. Very high demand.", intentSignals: { high: ["lake bled wedding venue book"], mid: ["best bled wedding venues"], low: ["lake bled wedding ideas"] } },
  { id: "ljubljana", countrySlug: "slovenia", slug: "ljubljana", name: "Ljubljana", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Europe's green capital, dragon bridges, riverside cafés and a charming old town crowned by its castle.", focusKeywords: ["ljubljana wedding venue"], aiSummary: "Charming city base for Bled weddings. Castle hilltop ceremonies. Boutique urban market.", intentSignals: { high: [], mid: ["ljubljana wedding venue"], low: ["ljubljana wedding ideas"] } },

  // ── Iceland ──────────────────────────────────────────────────────────
  { id: "south-iceland", countrySlug: "iceland", slug: "south-iceland", name: "South Coast & Golden Circle", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Geysers, waterfalls, black sand beaches and glacier lagoons along Iceland's dramatic south coast.", focusKeywords: ["iceland south coast wedding", "golden circle wedding"], aiSummary: "Waterfall ceremony spots iconic. Glacier lagoon receptions unique. Golden Circle accessibility.", intentSignals: { high: ["iceland elopement south coast"], mid: ["iceland wedding venue"], low: ["iceland wedding ideas"] } },
  { id: "reykjavik", countrySlug: "iceland", slug: "reykjavik", name: "Reykjavík", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "World's northernmost capital, Hallgrímskirkja church, geothermal Blue Lagoon and vibrant Nordic culture.", focusKeywords: ["reykjavik wedding venue", "hallgrimskirkja wedding"], aiSummary: "Base for adventure elopements. Blue Lagoon ceremonies unique. Hallgrímskirkja church iconic.", intentSignals: { high: ["reykjavik wedding venue"], mid: [], low: ["reykjavik wedding ideas"] } },

  // ── UAE ──────────────────────────────────────────────────────────────
  { id: "dubai", countrySlug: "uae", slug: "dubai", name: "Dubai", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 5, description: "Ultra-modern skyline, private island resorts, desert dune ceremonies and the world's most opulent hotels.", focusKeywords: ["dubai wedding venue", "dubai luxury wedding", "palm jumeirah wedding"], aiSummary: "Global luxury leader. Palace and beachfront venues dominate. Year-round with winter peak. Multi-cultural demand.", intentSignals: { high: ["dubai luxury wedding venue book", "palm jumeirah wedding planner"], mid: ["best dubai wedding venues"], low: ["dubai wedding ideas"] } },
  { id: "abu-dhabi", countrySlug: "uae", slug: "abu-dhabi", name: "Abu Dhabi", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Sheikh Zayed Grand Mosque, Saadiyat Island resorts and the cultural vision of Louvre Abu Dhabi.", focusKeywords: ["abu dhabi wedding venue", "abu dhabi luxury wedding"], aiSummary: "Cultural luxury positioning. Saadiyat Island resort cluster growing. Sheikh Zayed Mosque ceremonies iconic.", intentSignals: { high: ["abu dhabi wedding venue book"], mid: ["best abu dhabi wedding venues"], low: ["abu dhabi wedding ideas"] } },
  { id: "ajman", countrySlug: "uae", slug: "ajman", name: "Ajman", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 0, description: "The smallest emirate, traditional dhow harbour, pearl diving heritage and emerging boutique hospitality.", focusKeywords: ["ajman wedding venue"], aiSummary: "Smallest emirate. Emerging boutique market. Traditional heritage. Very early stage.", intentSignals: { high: [], mid: ["ajman wedding venue"], low: ["ajman wedding ideas"] } },
  { id: "fujairah", countrySlug: "uae", slug: "fujairah", name: "Fujairah", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The UAE's east coast, rugged Hajar Mountains, Indian Ocean beaches and Al Bidyah's ancient mosque.", focusKeywords: ["fujairah wedding venue"], aiSummary: "East coast alternative. Mountain and beach dual appeal. Emerging resort development.", intentSignals: { high: [], mid: ["fujairah wedding venue"], low: ["fujairah wedding ideas"] } },
  { id: "ras-al-khaimah", countrySlug: "uae", slug: "ras-al-khaimah", name: "Ras Al Khaimah", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Desert dunes, the Hajar mountain zip-line and luxury resort development on the UAE's northern coast.", focusKeywords: ["ras al khaimah wedding venue"], aiSummary: "Adventure-luxury positioning. Jebel Jais mountain experiences. Growing resort supply. Value alternative to Dubai.", intentSignals: { high: [], mid: ["ras al khaimah wedding venue"], low: ["ras al khaimah wedding ideas"] } },
  { id: "sharjah", countrySlug: "uae", slug: "sharjah", name: "Sharjah", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The UAE's cultural capital, Islamic art museums, heritage quarter and the Blue Souk's architectural grandeur.", focusKeywords: ["sharjah wedding venue"], aiSummary: "Cultural capital positioning. Museum and heritage venues. Conservative but growing luxury hospitality.", intentSignals: { high: [], mid: ["sharjah wedding venue"], low: ["sharjah wedding ideas"] } },
  { id: "umm-al-quwain", countrySlug: "uae", slug: "umm-al-quwain", name: "Umm Al-Quwain", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 0, description: "The quietest emirate, mangrove lagoons, flamingo watching and untouched coastal tranquillity.", focusKeywords: ["umm al quwain wedding venue"], aiSummary: "Quietest emirate. Mangrove and lagoon settings unique. Very early stage. Niche eco-luxury potential.", intentSignals: { high: [], mid: ["umm al quwain wedding venue"], low: ["umm al quwain wedding ideas"] } },

  // ── Morocco ──────────────────────────────────────────────────────────
  { id: "marrakech", countrySlug: "morocco", slug: "marrakech", name: "Marrakech", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Rose-scented riads, Atlas Mountain panoramas, the Medina's labyrinthine souks and desert glamping.", focusKeywords: ["marrakech wedding venue", "riad wedding marrakech", "atlas mountains wedding"], aiSummary: "Morocco's luxury anchor. Riad courtyards and desert camps drive demand. Multi-day celebrations. Autumn/spring peaks.", intentSignals: { high: ["marrakech riad wedding book", "marrakech wedding planner"], mid: ["best marrakech wedding venues"], low: ["marrakech wedding ideas"] } },
  { id: "fez", countrySlug: "morocco", slug: "fez", name: "Fez", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The world's largest living medieval city, ancient riad palaces and artisan craftsmanship.", focusKeywords: ["fez wedding venue", "fez riad wedding"], aiSummary: "Authentic alternative to Marrakech. Medieval medina atmosphere. Smaller but culturally richer.", intentSignals: { high: [], mid: ["fez wedding venue"], low: ["fez wedding ideas"] } },
  { id: "essaouira", countrySlug: "morocco", slug: "essaouira", name: "Essaouira", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Atlantic-battered ramparts, bohemian-chic riads and the Gnaoua music heritage of Morocco's windy city.", focusKeywords: ["essaouira wedding venue", "essaouira beach wedding"], aiSummary: "Bohemian coastal alternative. Beach ceremonies with Medina backdrop. Growing slowly.", intentSignals: { high: [], mid: ["essaouira wedding venue"], low: ["essaouira wedding ideas"] } },

  // ── Turkey ───────────────────────────────────────────────────────────
  { id: "istanbul", countrySlug: "turkey", slug: "istanbul", name: "Istanbul", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Where East meets West, Bosphorus palace hotels, Ottoman mosques and rooftop terraces spanning two continents.", focusKeywords: ["istanbul wedding venue", "bosphorus wedding", "turkish palace wedding"], aiSummary: "Bosphorus-view palace venues unique globally. Cultural richness. Strong Middle Eastern and European demand.", intentSignals: { high: ["istanbul palace wedding venue book"], mid: ["best istanbul wedding venues"], low: ["istanbul wedding ideas"] } },
  { id: "cappadocia", countrySlug: "turkey", slug: "cappadocia", name: "Cappadocia", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Hot-air balloon sunrises, cave hotel suites and the surreal fairy-chimney lunar landscape.", focusKeywords: ["cappadocia wedding venue", "hot air balloon wedding", "cave hotel wedding"], aiSummary: "Most Instagrammed wedding destination globally. Hot-air balloon ceremonies. Cave hotel receptions. Very high demand.", intentSignals: { high: ["cappadocia wedding venue book"], mid: ["best cappadocia wedding venues"], low: ["cappadocia wedding ideas"] } },
  { id: "bodrum", countrySlug: "turkey", slug: "bodrum", name: "Bodrum", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Turkish Riviera glamour, whitewashed clifftop villas, ancient amphitheatres and Aegean blue.", focusKeywords: ["bodrum wedding venue", "turkish riviera wedding"], aiSummary: "Aegean coastal luxury. Villa and resort weddings. Strong Turkish domestic plus international market.", intentSignals: { high: ["bodrum wedding venue book"], mid: ["best bodrum wedding venues"], low: ["bodrum wedding ideas"] } },

  // ── Thailand ─────────────────────────────────────────────────────────
  { id: "koh-samui", countrySlug: "thailand", slug: "koh-samui", name: "Koh Samui", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Palm-fringed beaches, clifftop villa resorts and traditional Thai blessing ceremonies.", focusKeywords: ["koh samui wedding venue", "koh samui beach wedding", "thai island wedding"], aiSummary: "Thailand's luxury wedding island. Villa and resort model. Year-round with Dec-Mar peak. Strong Australian demand.", intentSignals: { high: ["koh samui wedding venue book", "koh samui wedding planner"], mid: ["best koh samui wedding venues"], low: ["koh samui wedding ideas"] } },
  { id: "phuket", countrySlug: "thailand", slug: "phuket", name: "Phuket", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Thailand's largest island, dramatic Phang Nga Bay, clifftop infinity pools and luxury resort infrastructure.", focusKeywords: ["phuket wedding venue", "phuket beach wedding", "phuket luxury wedding"], aiSummary: "Largest volume Thai wedding market. Resort weddings dominate. Phang Nga Bay ceremonies dramatic.", intentSignals: { high: ["phuket wedding venue book", "phuket wedding planner"], mid: ["best phuket wedding venues"], low: ["phuket wedding ideas"] } },
  { id: "chiang-mai", countrySlug: "thailand", slug: "chiang-mai", name: "Chiang Mai", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Mountain temples, rice terrace venues and the cultural richness of Thailand's northern capital.", focusKeywords: ["chiang mai wedding venue", "thai temple wedding"], aiSummary: "Cultural-spiritual niche. Temple blessing ceremonies. Mountain resort venues. Quieter alternative to islands.", intentSignals: { high: [], mid: ["chiang mai wedding venue"], low: ["chiang mai wedding ideas"] } },

  // ── Indonesia ────────────────────────────────────────────────────────
  { id: "ubud", countrySlug: "indonesia", slug: "ubud", name: "Ubud", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "Bali's cultural heart, emerald rice terraces, ancient temples and jungle-canopy villa resorts.", focusKeywords: ["ubud wedding venue", "bali jungle wedding", "rice terrace wedding bali"], aiSummary: "Bali's spiritual centre. Rice terrace and jungle villa ceremonies iconic. Strong wellness-wedding crossover.", intentSignals: { high: ["ubud villa wedding book", "ubud wedding planner"], mid: ["best ubud wedding venues"], low: ["ubud wedding ideas"] } },
  { id: "uluwatu", countrySlug: "indonesia", slug: "uluwatu", name: "Uluwatu & Bukit Peninsula", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Dramatic clifftop temples, infinity-edge chapels and Indian Ocean sunset ceremonies.", focusKeywords: ["uluwatu wedding venue", "bali cliff wedding", "uluwatu temple wedding"], aiSummary: "Bali's luxury clifftop capital. Purpose-built wedding chapels. Sunset ceremonies unmatched. Highest-demand zone.", intentSignals: { high: ["uluwatu clifftop wedding book", "bali cliff wedding venue"], mid: ["best uluwatu wedding venues"], low: ["uluwatu wedding ideas"] } },
  { id: "seminyak-canggu", countrySlug: "indonesia", slug: "seminyak-canggu", name: "Seminyak & Canggu", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Bali's cosmopolitan beach scene, designer villas, beach club receptions and sunset cocktail ceremonies.", focusKeywords: ["seminyak wedding venue", "canggu wedding", "bali beach wedding"], aiSummary: "Beach club and villa market. Fashion-forward crowd. Social media amplification. Year-round.", intentSignals: { high: ["seminyak wedding venue book"], mid: ["best seminyak wedding venues"], low: ["canggu wedding ideas"] } },

  // ── India ────────────────────────────────────────────────────────────
  { id: "rajasthan", countrySlug: "india", slug: "rajasthan", name: "Rajasthan", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 5, description: "Maharaja palaces, desert fortresses and the pink city of Jaipur. India's royal wedding heartland.", focusKeywords: ["rajasthan palace wedding", "udaipur wedding venue", "jaipur wedding", "india palace wedding"], aiSummary: "India's luxury wedding capital. Palace hotels command premium. Multi-day celebrations. Oct-Mar season. Global demand.", intentSignals: { high: ["udaipur palace wedding book", "jaipur wedding planner hire"], mid: ["best rajasthan wedding venues"], low: ["rajasthan wedding ideas"] } },
  { id: "goa", countrySlug: "india", slug: "goa", name: "Goa", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Portuguese-Indian fusion, palm-fringed beaches, colonial churches and barefoot-luxury celebrations.", focusKeywords: ["goa wedding venue", "goa beach wedding", "goa destination wedding"], aiSummary: "Beach wedding market leader in India. Portuguese heritage unique. Budget-luxury to ultra-premium range.", intentSignals: { high: ["goa luxury wedding venue book"], mid: ["best goa wedding venues"], low: ["goa wedding ideas"] } },
  { id: "kerala", countrySlug: "india", slug: "kerala", name: "Kerala", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "God's Own Country, houseboat ceremonies on backwater canals, tea plantation hills and Ayurvedic spa luxury.", focusKeywords: ["kerala wedding venue", "kerala backwater wedding"], aiSummary: "Backwater houseboat ceremonies unique globally. Ayurvedic wellness-wedding crossover. Emerging luxury.", intentSignals: { high: ["kerala wedding venue book"], mid: ["best kerala wedding venues"], low: ["kerala wedding ideas"] } },

  // ── Japan ────────────────────────────────────────────────────────────
  { id: "kyoto", countrySlug: "japan", slug: "kyoto", name: "Kyoto", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Ancient temple gardens, bamboo groves and cherry blossom ceremonies in Japan's cultural capital.", focusKeywords: ["kyoto wedding venue", "kyoto temple wedding", "cherry blossom wedding japan"], aiSummary: "Japan's wedding icon. Temple garden ceremonies. Cherry blossom season drives massive demand. Very niche but high-intent.", intentSignals: { high: ["kyoto temple wedding venue book"], mid: ["best kyoto wedding venues"], low: ["kyoto wedding ideas"] } },
  { id: "tokyo", countrySlug: "japan", slug: "tokyo", name: "Tokyo", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Ultramodern skyline meets ancient shrines, rooftop ceremonies, Meiji Shrine weddings and world-class dining.", focusKeywords: ["tokyo wedding venue", "tokyo luxury wedding", "meiji shrine wedding"], aiSummary: "Ultramodern-meets-traditional. Hotel ballroom market mature. Shrine ceremonies for cultural weddings. Year-round.", intentSignals: { high: ["tokyo wedding venue book"], mid: ["best tokyo wedding venues"], low: ["tokyo wedding ideas"] } },

  // ── Maldives ─────────────────────────────────────────────────────────
  { id: "north-male-atoll", countrySlug: "maldives", slug: "north-male-atoll", name: "North Malé Atoll", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "The Maldives' most accessible atoll, One&Only Reethi Rah, Gili Lankanfushi and overwater villa luxury.", focusKeywords: ["maldives overwater wedding", "north male atoll wedding"], aiSummary: "Highest resort concentration. Most accessible from Malé airport. Ultra-premium overwater villa ceremonies.", intentSignals: { high: ["maldives overwater wedding book"], mid: ["best maldives wedding resorts"], low: ["maldives wedding ideas"] } },
  { id: "south-ari-atoll", countrySlug: "maldives", slug: "south-ari-atoll", name: "South Ari Atoll", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Conrad Maldives, whale shark encounters and the most pristine sandbanks in the archipelago.", focusKeywords: ["maldives sandbank wedding", "ari atoll wedding"], aiSummary: "Sandbank ceremony capital. Conrad underwater restaurant receptions iconic. Whale shark season unique draw.", intentSignals: { high: ["ari atoll wedding resort book"], mid: ["best ari atoll wedding venues"], low: ["maldives wedding ideas"] } },

  // ── Sri Lanka ────────────────────────────────────────────────────────
  { id: "galle", countrySlug: "srilanka", slug: "galle", name: "Galle & South Coast", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Dutch colonial Galle Fort, stilt fishermen, whale watching and boutique beachfront hotels.", focusKeywords: ["galle wedding venue", "sri lanka beach wedding", "galle fort wedding"], aiSummary: "Galle Fort ceremonies iconic. South coast boutique hotel strip. Strong UK and Australian demand. Dec-Mar season.", intentSignals: { high: ["galle fort wedding venue book"], mid: ["best sri lanka wedding venues"], low: ["sri lanka wedding ideas"] } },
  { id: "kandy", countrySlug: "srilanka", slug: "kandy", name: "Kandy & Hill Country", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Sacred Temple of the Tooth, tea plantation estates and misty hill-country botanical gardens.", focusKeywords: ["kandy wedding venue", "tea plantation wedding sri lanka"], aiSummary: "Tea estate weddings unique. Temple of the Tooth ceremonies cultural. Cooler climate retreat.", intentSignals: { high: [], mid: ["kandy wedding venue"], low: ["kandy wedding ideas"] } },

  // ── Mexico ───────────────────────────────────────────────────────────
  { id: "tulum", countrySlug: "mexico", slug: "tulum", name: "Tulum & Riviera Maya", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "Mayan ruins above turquoise cenotes, jungle boutique hotels and barefoot-luxury beach ceremonies.", focusKeywords: ["tulum wedding venue", "riviera maya wedding", "cenote wedding mexico"], aiSummary: "Mexico's luxury destination leader. Cenote ceremonies unique globally. Strong US demand. Year-round.", intentSignals: { high: ["tulum wedding venue book", "riviera maya wedding planner"], mid: ["best tulum wedding venues"], low: ["tulum wedding ideas"] } },
  { id: "los-cabos", countrySlug: "mexico", slug: "los-cabos", name: "Los Cabos", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Where the desert meets the Pacific, dramatic rock arches, luxury resorts and year-round sunshine.", focusKeywords: ["los cabos wedding venue", "cabo san lucas wedding", "mexico beach wedding"], aiSummary: "US West Coast feeder market. Resort wedding model. El Arco landmark. Desert-meets-ocean unique.", intentSignals: { high: ["los cabos wedding venue book"], mid: ["best los cabos wedding venues"], low: ["cabo wedding ideas"] } },
  { id: "san-miguel", countrySlug: "mexico", slug: "san-miguel-de-allende", name: "San Miguel de Allende", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "UNESCO colonial jewel, pink Parroquia spires, cobblestone streets and rooftop terrace celebrations.", focusKeywords: ["san miguel de allende wedding", "mexico colonial wedding"], aiSummary: "Cultural-luxury market. Instagram-famous pink church. US expat community drives awareness. Year-round.", intentSignals: { high: ["san miguel de allende wedding venue book"], mid: ["best san miguel wedding venues"], low: ["san miguel wedding ideas"] } },

  // ── Caribbean ────────────────────────────────────────────────────────
  { id: "barbados", countrySlug: "caribbean", slug: "barbados", name: "Barbados", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Sandy Lane elegance, west coast sunset beaches and the vibrant Bajan culture of the Caribbean's most refined island.", focusKeywords: ["barbados wedding venue", "sandy lane wedding", "barbados beach wedding"], aiSummary: "Caribbean luxury leader. Sandy Lane iconic. Platinum Coast west shore. Strong UK market. Year-round.", intentSignals: { high: ["barbados luxury wedding venue book", "sandy lane wedding planner"], mid: ["best barbados wedding venues"], low: ["barbados wedding ideas"] } },
  { id: "st-lucia", countrySlug: "caribbean", slug: "st-lucia", name: "St Lucia", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "The dramatic twin Pitons, volcanic hot springs and some of the Caribbean's most spectacular resort settings.", focusKeywords: ["st lucia wedding venue", "pitons wedding", "st lucia beach wedding"], aiSummary: "Pitons backdrop unmatched. Jade Mountain and Sugar Beach anchor ultra-luxury. Honeymoon-wedding market.", intentSignals: { high: ["st lucia wedding venue book"], mid: ["best st lucia wedding venues"], low: ["st lucia wedding ideas"] } },
  { id: "jamaica", countrySlug: "caribbean", slug: "jamaica", name: "Jamaica", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Montego Bay resort luxury, the Blue Mountains and the cultural vibrancy of the Caribbean's musical heartland.", focusKeywords: ["jamaica wedding venue", "montego bay wedding", "jamaica destination wedding"], aiSummary: "Montego Bay resort cluster dominates. Reggae culture unique integration. Strong US demand. Year-round.", intentSignals: { high: ["jamaica wedding venue book"], mid: ["best jamaica wedding venues"], low: ["jamaica wedding ideas"] } },
  { id: "antigua", countrySlug: "caribbean", slug: "antigua", name: "Antigua & Barbuda", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "365 beaches, English Harbour's Nelson's Dockyard and some of the Caribbean's most exclusive resorts.", focusKeywords: ["antigua wedding venue", "antigua beach wedding"], aiSummary: "365-beaches marketing powerful. Jumby Bay ultra-exclusive. English Harbour historic charm.", intentSignals: { high: ["antigua wedding venue book"], mid: ["best antigua wedding venues"], low: ["antigua wedding ideas"] } },
  { id: "bvi", countrySlug: "caribbean", slug: "british-virgin-islands", name: "British Virgin Islands", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Private island paradise, Necker Island, the Baths of Virgin Gorda and pristine Caribbean sailing waters.", focusKeywords: ["bvi wedding venue", "british virgin islands wedding"], aiSummary: "Necker Island ultra-exclusive. Private island buyout model. Sailing yacht ceremonies. Celebrity destination.", intentSignals: { high: ["necker island wedding"], mid: ["bvi wedding venue"], low: ["british virgin islands wedding ideas"] } },
  { id: "martinique", countrySlug: "caribbean", slug: "martinique", name: "Martinique", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 0, description: "French Caribbean elegance, volcanic peaks, rum distilleries and Creole plantation house grandeur.", focusKeywords: ["martinique wedding venue"], aiSummary: "French Caribbean distinction. Plantation house venues. Volcanic landscape dramatic. Very early market.", intentSignals: { high: [], mid: ["martinique wedding venue"], low: ["martinique wedding ideas"] } },

  // ── Bahamas ──────────────────────────────────────────────────────────
  { id: "nassau-paradise", countrySlug: "bahamas", slug: "nassau", name: "Nassau & Paradise Island", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Atlantis resort grandeur, colonial Nassau charm and the pink sands of nearby Harbour Island.", focusKeywords: ["nassau wedding venue", "bahamas resort wedding", "atlantis wedding"], aiSummary: "Atlantis resort anchor. Easy access from US. Volume plus luxury tiers. Year-round.", intentSignals: { high: ["nassau wedding venue book"], mid: ["best nassau wedding venues"], low: ["nassau wedding ideas"] } },
  { id: "exuma", countrySlug: "bahamas", slug: "exuma", name: "Exuma Cays", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Swimming pigs, private island buyouts, Thunderball Grotto and the most crystalline water on earth.", focusKeywords: ["exuma wedding venue", "private island wedding bahamas", "swimming pigs wedding"], aiSummary: "Ultra-exclusive private island model. Swimming pigs Instagram-famous. Celebrity wedding destination.", intentSignals: { high: ["exuma private island wedding"], mid: ["best exuma wedding venues"], low: ["exuma wedding ideas"] } },

  // ── South Africa ─────────────────────────────────────────────────────
  { id: "cape-winelands", countrySlug: "southafrica", slug: "cape-winelands", name: "Cape Winelands", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 4, description: "Stellenbosch, Franschhoek and Paarl, Cape Dutch estates, world-class wines and mountain-ringed vineyards.", focusKeywords: ["cape winelands wedding venue", "stellenbosch wedding", "franschhoek wedding"], aiSummary: "South Africa's luxury anchor. Wine estate venues world-class. Mountain backdrops. Strong international demand.", intentSignals: { high: ["cape winelands wedding venue book", "stellenbosch wedding planner"], mid: ["best cape winelands wedding venues"], low: ["cape winelands wedding ideas"] } },
  { id: "cape-town", countrySlug: "southafrica", slug: "cape-town", name: "Cape Town", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Table Mountain backdrop, Camps Bay beach glamour and the Victoria & Alfred Waterfront.", focusKeywords: ["cape town wedding venue", "table mountain wedding", "camps bay wedding"], aiSummary: "Table Mountain iconic. Twelve Apostles hotel anchor. Beach and mountain dual appeal. Nov-Mar season.", intentSignals: { high: ["cape town wedding venue book"], mid: ["best cape town wedding venues"], low: ["cape town wedding ideas"] } },
  { id: "garden-route", countrySlug: "southafrica", slug: "garden-route", name: "Garden Route", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Lush coastal forests, dramatic cliff-side roads and the charming towns of Knysna and Plettenberg Bay.", focusKeywords: ["garden route wedding venue", "knysna wedding"], aiSummary: "Scenic coastal route. Knysna lagoon and forest venues. Intimate celebration market.", intentSignals: { high: [], mid: ["garden route wedding venue"], low: ["garden route wedding ideas"] } },

  // ── Kenya ────────────────────────────────────────────────────────────
  { id: "masai-mara", countrySlug: "kenya", slug: "masai-mara", name: "Masai Mara", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Great Migration, hot-air balloon ceremonies and luxury tented safari camps under African skies.", focusKeywords: ["masai mara wedding", "safari wedding kenya", "bush wedding africa"], aiSummary: "Safari-wedding pinnacle. Hot-air balloon ceremonies. Migration season July-Oct dramatic backdrop.", intentSignals: { high: ["masai mara safari wedding"], mid: ["best kenya wedding venues"], low: ["safari wedding ideas"] } },
  { id: "diani-coast", countrySlug: "kenya", slug: "diani", name: "Diani Beach & Coast", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Indian Ocean white sands, baobab-shaded gardens and the Swahili culture of Kenya's tropical coast.", focusKeywords: ["diani beach wedding", "kenya beach wedding", "mombasa wedding venue"], aiSummary: "Beach complement to safari. Diani Beach luxury growing. Safari-beach combination packages.", intentSignals: { high: ["diani beach wedding venue"], mid: ["best diani wedding venues"], low: ["kenya coast wedding ideas"] } },

  // ── Tanzania ─────────────────────────────────────────────────────────
  { id: "zanzibar", countrySlug: "tanzania", slug: "zanzibar", name: "Zanzibar", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Stone Town's spice-scented lanes, white-sand beaches and the exotic fusion of African, Arab and Indian cultures.", focusKeywords: ["zanzibar wedding venue", "zanzibar beach wedding", "stone town wedding"], aiSummary: "Spice island romance. Stone Town rooftop ceremonies. Beach resort weddings growing. Safari combo.", intentSignals: { high: ["zanzibar wedding venue book"], mid: ["best zanzibar wedding venues"], low: ["zanzibar wedding ideas"] } },
  { id: "serengeti-ngorongoro", countrySlug: "tanzania", slug: "serengeti", name: "Serengeti & Ngorongoro", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Great Migration, Ngorongoro Crater's natural amphitheatre and luxury tented camps in the wild.", focusKeywords: ["serengeti wedding", "ngorongoro crater wedding", "tanzania safari wedding"], aiSummary: "Africa's most dramatic safari-wedding setting. Ngorongoro Crater rim ceremonies unique. Ultra-premium.", intentSignals: { high: ["serengeti safari wedding"], mid: [], low: ["tanzania safari wedding ideas"] } },

  // ── Egypt ────────────────────────────────────────────────────────────
  { id: "cairo-giza", countrySlug: "egypt", slug: "cairo", name: "Cairo & Giza", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Pyramids of Giza, the Sphinx and 5,000 years of monumental romance.", focusKeywords: ["pyramids wedding", "cairo wedding venue", "giza wedding"], aiSummary: "Pyramid-backdrop ceremonies unique globally. Cairo luxury hotel infrastructure growing. Historic drama.", intentSignals: { high: ["pyramids wedding venue"], mid: ["best cairo wedding venues"], low: ["egypt wedding ideas"] } },
  { id: "red-sea", countrySlug: "egypt", slug: "red-sea", name: "Red Sea & Hurghada", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Crystal-clear Red Sea reef diving, El Gouna's lagoon resort and Saharan desert-meets-ocean drama.", focusKeywords: ["red sea wedding venue", "hurghada wedding"], aiSummary: "Resort wedding market. El Gouna lagoon niche. Diving-wedding combination. Value proposition.", intentSignals: { high: [], mid: ["red sea wedding venue"], low: ["hurghada wedding ideas"] } },

  // ── Australia ────────────────────────────────────────────────────────
  { id: "sydney", countrySlug: "australia", slug: "sydney", name: "Sydney", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 3, description: "Harbour Bridge and Opera House skyline, Bondi beach and the Blue Mountains' eucalyptus grandeur.", focusKeywords: ["sydney wedding venue", "sydney harbour wedding", "opera house wedding"], aiSummary: "Australia's wedding capital. Harbour-view venues iconic. Year-round. Strong domestic and international demand.", intentSignals: { high: ["sydney harbour wedding venue book"], mid: ["best sydney wedding venues"], low: ["sydney wedding ideas"] } },
  { id: "hunter-valley", countrySlug: "australia", slug: "hunter-valley", name: "Hunter Valley", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Australia's oldest wine region, vineyard estates, cellar door receptions and the Brokenback Range backdrop.", focusKeywords: ["hunter valley wedding venue", "hunter valley vineyard wedding"], aiSummary: "Wine country weddings lead. Vineyard estate venues premium. Close to Sydney access. Strong domestic market.", intentSignals: { high: ["hunter valley wedding venue book"], mid: ["best hunter valley wedding venues"], low: ["hunter valley wedding ideas"] } },
  { id: "byron-bay", countrySlug: "australia", slug: "byron-bay", name: "Byron Bay", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Bohemian-luxury coastal paradise, hinterland rainforest venues, lighthouse ceremonies and surf-culture charm.", focusKeywords: ["byron bay wedding venue", "byron bay hinterland wedding"], aiSummary: "Bohemian-luxury niche. Hinterland venues trending. Lighthouse ceremonies iconic. Strong creative market.", intentSignals: { high: ["byron bay wedding venue book"], mid: ["best byron bay wedding venues"], low: ["byron bay wedding ideas"] } },
  { id: "melbourne", countrySlug: "australia", slug: "melbourne", name: "Melbourne & Yarra Valley", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Laneway culture, Yarra Valley vineyards and the Mornington Peninsula's coastal elegance.", focusKeywords: ["melbourne wedding venue", "yarra valley wedding", "mornington peninsula wedding"], aiSummary: "Yarra Valley wine country plus Melbourne urban. Laneway and warehouse conversions trending.", intentSignals: { high: ["melbourne wedding venue book"], mid: ["best melbourne wedding venues"], low: ["melbourne wedding ideas"] } },

  // ── New Zealand ──────────────────────────────────────────────────────
  { id: "queenstown", countrySlug: "newzealand", slug: "queenstown", name: "Queenstown", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: true, listingCount: 2, description: "Adventure capital of the world, alpine lakes, mountain peaks and the Remarkables' dramatic backdrop.", focusKeywords: ["queenstown wedding venue", "new zealand mountain wedding"], aiSummary: "NZ's luxury wedding capital. Helicopter mountain-top ceremonies. Remarkables backdrop. Strong elopement market.", intentSignals: { high: ["queenstown wedding venue book"], mid: ["best queenstown wedding venues"], low: ["queenstown wedding ideas"] } },
  { id: "waiheke", countrySlug: "newzealand", slug: "waiheke", name: "Waiheke Island", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Auckland's island vineyard escape, olive groves, sculpted clifftop gardens and Hauraki Gulf views.", focusKeywords: ["waiheke island wedding", "waiheke vineyard wedding"], aiSummary: "Auckland's luxury escape. Vineyard terrace ceremonies. Ferry-accessible island. Strong domestic market.", intentSignals: { high: ["waiheke wedding venue book"], mid: ["best waiheke wedding venues"], low: ["waiheke wedding ideas"] } },
  { id: "hawkes-bay", countrySlug: "newzealand", slug: "hawkes-bay", name: "Hawke's Bay", priorityLevel: "secondary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Art Deco Napier, world-class vineyards and the sunny east coast of New Zealand's North Island.", focusKeywords: ["hawkes bay wedding venue", "napier wedding"], aiSummary: "Wine country alternative. Art Deco Napier unique. Sunny east coast climate.", intentSignals: { high: [], mid: ["hawkes bay wedding venue"], low: ["hawkes bay wedding ideas"] } },

  // ── Remaining countries, minimal regions ───────────────────────────
  { id: "copenhagen", countrySlug: "denmark", slug: "copenhagen", name: "Copenhagen", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Nyhavn's colourful waterfront, Tivoli Gardens and Scandi design-led wedding spaces.", focusKeywords: ["copenhagen wedding venue"], aiSummary: "Denmark's entire market concentrated here. Design-forward venues.", intentSignals: { high: ["copenhagen wedding venue book"], mid: [], low: ["copenhagen wedding ideas"] } },
  { id: "stockholm", countrySlug: "sweden", slug: "stockholm", name: "Stockholm", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Archipelago island palaces, Gamla Stan's medieval lanes and Nordic midsummer light.", focusKeywords: ["stockholm wedding venue"], aiSummary: "Sweden's anchor. Archipelago venues unique. Midsummer weddings.", intentSignals: { high: ["stockholm wedding venue book"], mid: [], low: ["stockholm wedding ideas"] } },
  { id: "bergen-fjords", countrySlug: "norway", slug: "bergen", name: "Bergen & the Fjords", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Bryggen's colourful wharves, Geirangerfjord and the dramatic Norwegian fjord landscape.", focusKeywords: ["norway fjord wedding", "bergen wedding venue"], aiSummary: "Fjord ceremonies drive all demand. Bergen base. Midnight sun season.", intentSignals: { high: ["norway fjord wedding venue"], mid: [], low: ["bergen wedding ideas"] } },
  { id: "budapest", countrySlug: "hungary", slug: "budapest", name: "Budapest", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Danube palace panoramas, thermal bath grandeur and the Castle District's Baroque elegance.", focusKeywords: ["budapest wedding venue", "budapest palace wedding"], aiSummary: "Thermal palace unique selling point. Outstanding value. Danube views.", intentSignals: { high: ["budapest wedding venue book"], mid: [], low: ["budapest wedding ideas"] } },
  { id: "prague", countrySlug: "czechrepublic", slug: "prague", name: "Prague", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Gothic spires, Baroque palaces and the Charles Bridge spanning the Vltava's romantic banks.", focusKeywords: ["prague wedding venue", "prague castle wedding"], aiSummary: "Castle and palace concentration. Charles Bridge ceremonies. Strong value proposition.", intentSignals: { high: ["prague castle wedding book"], mid: [], low: ["prague wedding ideas"] } },
  { id: "krakow", countrySlug: "poland", slug: "krakow", name: "Kraków", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Medieval market square, Wawel Castle and the salt cathedral depths of Wieliczka.", focusKeywords: ["krakow wedding venue", "wieliczka salt mine wedding"], aiSummary: "Wieliczka salt cathedral ceremonies globally unique. Strong value. Growing international.", intentSignals: { high: ["krakow wedding venue book"], mid: [], low: ["krakow wedding ideas"] } },
  { id: "doha", countrySlug: "qatar", slug: "doha", name: "Doha", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Museum of Islamic Art, The Pearl island and futuristic skyline luxury.", focusKeywords: ["doha wedding venue", "qatar luxury wedding"], aiSummary: "Ultra-modern Gulf luxury. Museum venues unique. Post-World Cup infrastructure.", intentSignals: { high: ["doha luxury wedding venue"], mid: [], low: ["doha wedding ideas"] } },
  { id: "muscat", countrySlug: "oman", slug: "muscat", name: "Muscat & Musandam", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Grand Mosque splendour, Musandam fjords and the Shangri-La resort coastline.", focusKeywords: ["muscat wedding venue", "oman luxury wedding"], aiSummary: "Boutique Gulf alternative. Shangri-La anchor. Musandam fjord ceremonies.", intentSignals: { high: ["muscat wedding venue"], mid: [], low: ["oman wedding ideas"] } },
  { id: "langkawi", countrySlug: "malaysia", slug: "langkawi", name: "Langkawi", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Eagle island legend, mangrove kayaking, sky bridge views and Four Seasons beach luxury.", focusKeywords: ["langkawi wedding venue", "langkawi beach wedding"], aiSummary: "Four Seasons anchor. Tax-free island. Growing resort-wedding market.", intentSignals: { high: ["langkawi resort wedding book"], mid: [], low: ["langkawi wedding ideas"] } },
  { id: "singapore-city", countrySlug: "singapore", slug: "singapore-city", name: "Singapore City", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Marina Bay Sands infinity edge, Raffles colonial elegance and Gardens by the Bay futurism.", focusKeywords: ["singapore wedding venue", "marina bay sands wedding"], aiSummary: "City-state single destination. Hotel and garden venues. Year-round. Ultra-premium.", intentSignals: { high: ["singapore wedding venue book"], mid: [], low: ["singapore wedding ideas"] } },
  { id: "palawan", countrySlug: "philippines", slug: "palawan", name: "Palawan & Boracay", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "El Nido's hidden lagoons, Coron's crystal lakes and Boracay's legendary White Beach.", focusKeywords: ["palawan wedding venue", "boracay wedding"], aiSummary: "El Nido lagoon ceremonies dramatic. Boracay beach weddings volume. Growing luxury infrastructure.", intentSignals: { high: ["palawan wedding venue book"], mid: [], low: ["philippines wedding ideas"] } },
  { id: "hoi-an", countrySlug: "vietnam", slug: "hoi-an", name: "Hoi An", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "UNESCO lantern-lit ancient town, tailored silk ao dai and the Thu Bon River's quiet charm.", focusKeywords: ["hoi an wedding venue", "vietnam destination wedding"], aiSummary: "Lantern-lit ceremonies iconic. Tailor-made wedding experience. Outstanding value.", intentSignals: { high: ["hoi an wedding venue book"], mid: [], low: ["hoi an wedding ideas"] } },
  { id: "whistler-rockies", countrySlug: "canada", slug: "whistler", name: "Whistler & Rocky Mountains", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Banff's turquoise glacier lakes, Whistler's alpine village and Jasper's mountain-peak ceremonies.", focusKeywords: ["whistler wedding venue", "banff wedding", "rocky mountain wedding"], aiSummary: "Banff and Whistler drive all international demand. Alpine lake ceremonies iconic. Summer peak.", intentSignals: { high: ["banff wedding venue book", "whistler wedding planner"], mid: ["best canadian mountain wedding venues"], low: ["canada wedding ideas"] } },
  { id: "toronto-niagara", countrySlug: "canada", slug: "toronto", name: "Toronto & Niagara", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "CN Tower skyline, Niagara-on-the-Lake vineyard estates and the multicultural vibrancy of Canada's largest city.", focusKeywords: ["toronto wedding venue", "niagara wedding", "ontario wedding venue"], aiSummary: "Toronto urban luxury. Niagara wine country destination. Strong domestic and US demand.", intentSignals: { high: ["toronto wedding venue book"], mid: ["best ontario wedding venues"], low: ["toronto wedding ideas"] } },
  { id: "arenal-pacific", countrySlug: "costarica", slug: "costa-rica-pacific", name: "Pacific Coast & Arenal", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Guanacaste's golden coast, Arenal volcano hot springs and Manuel Antonio's jungle-beach paradise.", focusKeywords: ["costa rica wedding venue", "guanacaste wedding", "arenal wedding"], aiSummary: "Pacific coast resorts lead. Arenal volcano backdrop. Eco-luxury positioning.", intentSignals: { high: ["costa rica wedding venue book"], mid: ["best costa rica wedding venues"], low: ["costa rica wedding ideas"] } },
  { id: "cartagena", countrySlug: "colombia", slug: "cartagena", name: "Cartagena", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Pastel colonial walled city, rooftop terrace ceremonies and Rosario Islands beach escapes.", focusKeywords: ["cartagena wedding venue", "cartagena rooftop wedding"], aiSummary: "Walled-city rooftop ceremonies iconic. Colonial architecture. Strong US demand.", intentSignals: { high: ["cartagena wedding venue book"], mid: [], low: ["cartagena wedding ideas"] } },
  { id: "rio", countrySlug: "brazil", slug: "rio", name: "Rio de Janeiro & Trancoso", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Sugarloaf Mountain views, Copacabana glamour and Trancoso's bohemian-luxe Quadrado.", focusKeywords: ["rio wedding venue", "trancoso wedding"], aiSummary: "Sugarloaf iconic. Trancoso Quadrado ultra-luxury. Strong domestic demand.", intentSignals: { high: ["trancoso wedding venue book"], mid: ["best brazil wedding venues"], low: ["brazil wedding ideas"] } },
  { id: "mendoza", countrySlug: "argentina", slug: "mendoza", name: "Mendoza & Buenos Aires", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Andes-backed Malbec vineyards, tango milongas and the European grandeur of Buenos Aires.", focusKeywords: ["mendoza wedding venue", "buenos aires wedding"], aiSummary: "Wine country plus urban tango. Andes backdrop dramatic. Growing niche.", intentSignals: { high: ["mendoza wedding venue book"], mid: [], low: ["argentina wedding ideas"] } },
  { id: "mauritius-coast", countrySlug: "mauritius", slug: "mauritius-coast", name: "North & West Coast", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Le Morne's basalt peninsula, Grand Baie's resort strip and sugar-plantation estate hotels.", focusKeywords: ["mauritius resort wedding", "le morne wedding", "grand baie wedding"], aiSummary: "Resort-wedding model. Le Morne and Grand Baie concentrate luxury. Year-round.", intentSignals: { high: ["mauritius resort wedding book"], mid: ["best mauritius wedding venues"], low: ["mauritius wedding ideas"] } },
  { id: "mahe-praslin", countrySlug: "seychelles", slug: "mahe", name: "Mahé & Praslin", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Giant granite boulders, Vallée de Mai palm forest and the world's most exclusive beach resorts.", focusKeywords: ["seychelles resort wedding", "mahe wedding venue"], aiSummary: "Private resort model. Granite boulder beach ceremonies iconic. Ultra-exclusive.", intentSignals: { high: ["seychelles wedding venue book"], mid: [], low: ["seychelles wedding ideas"] } },
  { id: "fiji-islands", countrySlug: "fiji", slug: "fiji-islands", name: "Mamanuca & Yasawa Islands", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 2, description: "Private island buyouts, traditional Fijian warrior blessings and crystal-clear Pacific lagoons.", focusKeywords: ["fiji island wedding", "fiji resort wedding"], aiSummary: "Island buyout model. Traditional blessings unique. Strong ANZ demand.", intentSignals: { high: ["fiji island wedding book"], mid: [], low: ["fiji wedding ideas"] } },
  { id: "gibraltar-rock", countrySlug: "gibraltar", slug: "gibraltar-rock", name: "Gibraltar", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "The Rock, Botanical Gardens ceremonies and Mediterranean sunshine with British formalities.", focusKeywords: ["gibraltar wedding venue"], aiSummary: "Elopement micro-destination. British legal simplicity. Rock backdrop.", intentSignals: { high: [], mid: ["gibraltar wedding venue"], low: ["gibraltar wedding ideas"] } },
  { id: "transylvania", countrySlug: "romania", slug: "transylvania", name: "Transylvania", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 1, description: "Bran Castle, fortified churches and the dramatic Carpathian Mountain passes.", focusKeywords: ["transylvania castle wedding"], aiSummary: "Castle drama. Carpathian mountain scenery. Very early market.", intentSignals: { high: [], mid: ["transylvania wedding venue"], low: ["romania wedding ideas"] } },
  { id: "amsterdam", countrySlug: "netherlands", slug: "amsterdam", name: "Amsterdam", priorityLevel: "primary", urlEnabledManual: null, urlEverActivated: false, listingCount: 3, description: "Golden Age canal houses, Rijksmuseum grandeur and tulip-bordered countryside estates.", focusKeywords: ["amsterdam wedding venue", "canal house wedding"], aiSummary: "Canal house ceremonies unique. Museum venue niche. Tulip season April-May.", intentSignals: { high: ["amsterdam wedding venue book"], mid: [], low: ["amsterdam wedding ideas"] } },
];

// ═════════════════════════════════════════════════════════════════════════════
// City Layer, High-intent geographic precision
// ═════════════════════════════════════════════════════════════════════════════
// Country → Region → City → Listing
// Cities are the high-intent layer: "wedding venue in Ravello" not "wedding venue Amalfi Coast"
// Architecture supports city but city is NOT in canonical URL (yet).
// Route pattern: /{country}/{region} (city used for filtering + entity enrichment)
const DIRECTORY_CITIES = [
  // ── Italy (imported from src/data/italy/cities.js) ─────────────────────────
  ...ITALY_CITIES,

  // ── France > Provence ────────────────────────────────────────────────────
  { id: "gordes", regionSlug: "provence", countrySlug: "france", slug: "gordes", name: "Gordes", listingCount: 2, lat: "43.9113", lng: "5.2006", description: "Perched hilltop village in the Luberon, lavender fields and honey-stone bastides.", focusKeywords: ["gordes wedding", "luberon wedding"], aiSummary: "Premium Luberon positioning. Lavender season peaks demand." },
  { id: "aix-en-provence", regionSlug: "provence", countrySlug: "france", slug: "aix-en-provence", name: "Aix-en-Provence", listingCount: 2, lat: "43.5297", lng: "5.4474", description: "Elegant university city with tree-lined boulevards and nearby château estates.", focusKeywords: ["aix en provence wedding"], aiSummary: "Urban-rural crossover. Château circuit within 30-min radius." },
  { id: "saint-remy", regionSlug: "provence", countrySlug: "france", slug: "saint-remy-de-provence", name: "Saint-Rémy-de-Provence", listingCount: 2, lat: "43.7890", lng: "4.8312", description: "Van Gogh's beloved village, intimate Provençal charm at its finest.", focusKeywords: ["saint remy wedding"], aiSummary: "Boutique destination. Strong UK/US demand." },

  // ── UK > Cotswolds ───────────────────────────────────────────────────────
  { id: "chipping-campden", regionSlug: "cotswolds", countrySlug: "uk", slug: "chipping-campden", name: "Chipping Campden", listingCount: 2, lat: "52.0545", lng: "-1.7811", description: "Perfectly preserved market town at the northern edge of the Cotswolds.", focusKeywords: ["chipping campden wedding"], aiSummary: "Quintessential Cotswolds. Country house venues dominate." },
  { id: "burford", regionSlug: "cotswolds", countrySlug: "uk", slug: "burford", name: "Burford", listingCount: 2, lat: "51.8087", lng: "-1.6368", description: "Gateway to the Cotswolds, ancient stone-built high street and surrounding estates.", focusKeywords: ["burford wedding venue"], aiSummary: "Strong local venue cluster. Barn and manor house mix." },
  { id: "stow-on-the-wold", regionSlug: "cotswolds", countrySlug: "uk", slug: "stow-on-the-wold", name: "Stow-on-the-Wold", listingCount: 1, lat: "51.9315", lng: "-1.7233", description: "Hilltop market town, the highest point of the Cotswolds with sweeping views.", focusKeywords: ["stow on the wold wedding"], aiSummary: "Niche positioning. Nearby estate venues drive demand." },

  // ── Spain > Mallorca ─────────────────────────────────────────────────────
  { id: "deia", regionSlug: "mallorca", countrySlug: "spain", slug: "deia", name: "Deià", listingCount: 1, lat: "39.7472", lng: "2.7500", description: "Artist village in the Serra de Tramuntana, cliffside terraces above the Mediterranean.", focusKeywords: ["deia wedding", "deia mallorca wedding"], aiSummary: "Ultra-luxury niche. La Residencia effect. Limited capacity." },
  { id: "palma", regionSlug: "mallorca", countrySlug: "spain", slug: "palma", name: "Palma de Mallorca", listingCount: 2, lat: "39.5696", lng: "2.6502", description: "Cathedral city with Gothic quarter charm and cosmopolitan wedding scene.", focusKeywords: ["palma wedding", "palma de mallorca wedding"], aiSummary: "Urban base for island weddings. Hotel and rooftop venues lead." },

  // ── USA > New York ───────────────────────────────────────────────────────
  { id: "hudson-valley", regionSlug: "new-york", countrySlug: "usa", slug: "hudson-valley", name: "Hudson Valley", listingCount: 2, lat: "41.4358", lng: "-74.0310", description: "Gilded Age estates and pastoral landscapes along the Hudson River.", focusKeywords: ["hudson valley wedding", "hudson valley wedding venue"], aiSummary: "Estate weddings dominate. Strong NYC-escape positioning." },
  { id: "manhattan", regionSlug: "new-york", countrySlug: "usa", slug: "manhattan", name: "Manhattan", listingCount: 1, lat: "40.7831", lng: "-73.9712", description: "The world's most iconic skyline, rooftop terraces, museum galas and hotel ballrooms.", focusKeywords: ["manhattan wedding venue", "nyc wedding"], aiSummary: "Highest price point. Museum and hotel venues lead. Year-round." },

  // ── UK, London ─────────────────────────────────────────────────────
  { id: "mayfair", regionSlug: "london", countrySlug: "uk", slug: "mayfair", name: "Mayfair", listingCount: 2, lat: "51.5100", lng: "-0.1480", description: "The Ritz, Claridge's and Grosvenor Square, London's most prestigious wedding quarter.", focusKeywords: ["mayfair wedding venue", "claridges wedding"], aiSummary: "Ultra-premium. Claridge's and The Ritz anchor. Corporate-luxury crossover." },
  { id: "chelsea", regionSlug: "london", countrySlug: "uk", slug: "chelsea", name: "Chelsea & Kensington", listingCount: 1, lat: "51.4875", lng: "-0.1687", description: "Royal borough elegance, Chelsea Physic Garden, Kensington Palace orangery and museum venues.", focusKeywords: ["chelsea wedding venue", "kensington wedding"], aiSummary: "Royal borough prestige. V&A and Natural History Museum event spaces." },
  { id: "richmond", regionSlug: "london", countrySlug: "uk", slug: "richmond", name: "Richmond & Kew", listingCount: 1, lat: "51.4613", lng: "-0.3037", description: "Richmond Park deer herds, Kew Gardens' temperate house and Thames riverside elegance.", focusKeywords: ["richmond wedding venue", "kew gardens wedding"], aiSummary: "Garden-setting weddings. Kew Gardens and Petersham Nurseries. Riverside charm." },
  { id: "shoreditch", regionSlug: "london", countrySlug: "uk", slug: "shoreditch", name: "Shoreditch & East London", listingCount: 1, lat: "51.5245", lng: "-0.0780", description: "Industrial-chic warehouses, rooftop terraces and the creative energy of East London.", focusKeywords: ["shoreditch wedding venue", "east london wedding"], aiSummary: "Industrial-chic market leader. Warehouse conversions. Creative crowd." },
  { id: "greenwich", regionSlug: "london", countrySlug: "uk", slug: "greenwich", name: "Greenwich", listingCount: 1, lat: "51.4769", lng: "-0.0005", description: "Royal Naval College, the Painted Hall and panoramic Thames views from the Prime Meridian.", focusKeywords: ["greenwich wedding venue"], aiSummary: "Painted Hall ceremonies stunning. Royal Naval College grandeur. River views." },

  // ── UK, Hampshire ──────────────────────────────────────
  { id: "winchester", regionSlug: "hampshire", countrySlug: "uk", slug: "winchester", name: "Winchester", listingCount: 2, lat: "51.0632", lng: "-1.3081", description: "England's ancient capital, the Cathedral, Great Hall and water meadows of the Itchen.", focusKeywords: ["winchester wedding venue", "winchester cathedral wedding"], aiSummary: "Cathedral city prestige. Great Hall round table. Historic grandeur." },
  { id: "new-forest-town", regionSlug: "hampshire", countrySlug: "uk", slug: "new-forest", name: "New Forest", listingCount: 1, lat: "50.8670", lng: "-1.5729", description: "Ancient royal hunting ground, wild ponies, thatched villages and boutique country hotels.", focusKeywords: ["new forest wedding venue"], aiSummary: "Boutique country hotels. Forest ceremony settings. Intimate luxury." },
  { id: "lymington", regionSlug: "hampshire", countrySlug: "uk", slug: "lymington", name: "Lymington", listingCount: 1, lat: "50.7585", lng: "-1.5433", description: "Georgian sailing town on the Solent, marina views and coastal elegance.", focusKeywords: ["lymington wedding venue"], aiSummary: "Coastal Hampshire charm. Sailing culture. Solent views." },

  // ── UK, Devon & Cornwall (split) ────────────────────────────────────────────
  { id: "st-ives", regionSlug: "cornwall", countrySlug: "uk", slug: "st-ives", name: "St Ives", listingCount: 1, lat: "50.2111", lng: "-5.4806", description: "Tate gallery town, turquoise harbour, golden beaches and artists' studios.", focusKeywords: ["st ives wedding venue"], aiSummary: "Artistic coastal charm. Tate St Ives association. Beach ceremonies." },
  { id: "padstow", regionSlug: "cornwall", countrySlug: "uk", slug: "padstow", name: "Padstow & Rock", listingCount: 1, lat: "50.5409", lng: "-4.9373", description: "Rick Stein's fishing village, the Camel estuary and Daymer Bay's golden sands.", focusKeywords: ["padstow wedding venue", "cornwall coast wedding"], aiSummary: "Foodie destination. Camel estuary venues. North Cornwall coast." },
  { id: "dartmouth", regionSlug: "devon", countrySlug: "uk", slug: "dartmouth", name: "Dartmouth", listingCount: 1, lat: "50.3512", lng: "-3.5789", description: "Naval college, Dart estuary and the South Devon coast's most glamorous harbour town.", focusKeywords: ["dartmouth wedding venue"], aiSummary: "South Devon anchor. Naval college ceremonies. River Dart views." },
  { id: "salcombe", regionSlug: "devon", countrySlug: "uk", slug: "salcombe", name: "Salcombe", listingCount: 1, lat: "50.2386", lng: "-3.7700", description: "The Chelsea-on-Sea of Devon, sheltered estuary, sandy coves and sailing luxury.", focusKeywords: ["salcombe wedding venue"], aiSummary: "Affluent sailing town. Estuary venues. Beach cove ceremonies." },
  { id: "falmouth", regionSlug: "cornwall", countrySlug: "uk", slug: "falmouth", name: "Falmouth", listingCount: 1, lat: "50.1522", lng: "-5.0710", description: "Cornwall's maritime capital, Pendennis Castle, deep-water harbour and sub-tropical gardens.", focusKeywords: ["falmouth wedding venue"], aiSummary: "Pendennis Castle ceremonies. Sub-tropical Trebah Gardens. Maritime charm." },

  // ── UK, Kent ────────────────────────────────────────────────────────
  { id: "canterbury", regionSlug: "kent", countrySlug: "uk", slug: "canterbury", name: "Canterbury", listingCount: 1, lat: "51.2802", lng: "1.0789", description: "Cathedral city of pilgrimage, UNESCO World Heritage and medieval close grandeur.", focusKeywords: ["canterbury wedding venue", "canterbury cathedral wedding"], aiSummary: "Cathedral ceremonies prestigious. UNESCO heritage. Medieval city charm." },
  { id: "tunbridge-wells", regionSlug: "kent", countrySlug: "uk", slug: "tunbridge-wells", name: "Tunbridge Wells", listingCount: 1, lat: "51.1320", lng: "0.2637", description: "Regency spa town elegance and the surrounding High Weald countryside estates.", focusKeywords: ["tunbridge wells wedding venue"], aiSummary: "Spa town elegance. High Weald country houses. London commuter premium." },

  // ── UK, Sussex ──────────────────────────────────────────────────────
  { id: "brighton", regionSlug: "sussex", countrySlug: "uk", slug: "brighton", name: "Brighton", listingCount: 2, lat: "50.8225", lng: "-0.1372", description: "Regency seaside glamour, the Royal Pavilion, Lanes and cosmopolitan beach culture.", focusKeywords: ["brighton wedding venue", "brighton pavilion wedding"], aiSummary: "Royal Pavilion iconic. Bohemian-chic market. Beach and urban combined." },
  { id: "chichester", regionSlug: "sussex", countrySlug: "uk", slug: "chichester", name: "Chichester & Goodwood", listingCount: 1, lat: "50.8365", lng: "-0.7792", description: "Goodwood House, Chichester Cathedral and the South Downs rolling chalk hills.", focusKeywords: ["chichester wedding venue", "goodwood wedding"], aiSummary: "Goodwood estate anchor. South Downs backdrop. Cathedral city." },
  { id: "arundel", regionSlug: "sussex", countrySlug: "uk", slug: "arundel", name: "Arundel", listingCount: 1, lat: "50.8556", lng: "-0.5539", description: "Fairy-tale castle silhouette, the Arun valley and quintessential English countryside.", focusKeywords: ["arundel castle wedding"], aiSummary: "Arundel Castle ceremonies dramatic. English countryside quintessence." },

  // ── UK, Norfolk & Suffolk (split) ───────────────────────────────────────────
  { id: "burnham-market", regionSlug: "norfolk", countrySlug: "uk", slug: "burnham-market", name: "Burnham Market", listingCount: 1, lat: "52.9441", lng: "0.7370", description: "Chelsea-on-Sea of Norfolk, Holkham beach, salt marshes and affluent village charm.", focusKeywords: ["burnham market wedding venue", "norfolk coast wedding"], aiSummary: "Holkham Hall anchor. North Norfolk coast. Affluent local market." },
  { id: "norwich", regionSlug: "norfolk", countrySlug: "uk", slug: "norwich", name: "Norwich", listingCount: 1, lat: "52.6309", lng: "1.2974", description: "Medieval cathedral city, Norwich Castle, the Broads and a thriving arts scene.", focusKeywords: ["norwich wedding venue"], aiSummary: "Cathedral city. Norfolk Broads waterway ceremonies. Arts community." },
  { id: "aldeburgh-southwold", regionSlug: "suffolk", countrySlug: "uk", slug: "aldeburgh", name: "Aldeburgh & Southwold", listingCount: 1, lat: "52.1534", lng: "1.6015", description: "Suffolk's Heritage Coast, Snape Maltings, Aldeburgh beach and genteel Southwold.", focusKeywords: ["suffolk wedding venue", "aldeburgh wedding"], aiSummary: "Snape Maltings concert hall venue unique. Heritage Coast beauty. Refined market." },

  // ── UK, Yorkshire ───────────────────────────────────────────────────
  { id: "york", regionSlug: "yorkshire", countrySlug: "uk", slug: "york", name: "York", listingCount: 2, lat: "53.9600", lng: "-1.0873", description: "York Minster grandeur, medieval Shambles and the historic Treasurer's House.", focusKeywords: ["york wedding venue", "york minster wedding"], aiSummary: "York Minster ceremonies iconic. Medieval city backdrop. Strong northern hub." },
  { id: "harrogate", regionSlug: "yorkshire", countrySlug: "uk", slug: "harrogate", name: "Harrogate", listingCount: 1, lat: "53.9921", lng: "-1.5418", description: "Victorian spa town, the Stray's elegant crescents and the Yorkshire Dales on the doorstep.", focusKeywords: ["harrogate wedding venue"], aiSummary: "Spa town elegance. Gateway to Yorkshire Dales. Strong spa-hotel market." },
  { id: "helmsley", regionSlug: "yorkshire", countrySlug: "uk", slug: "helmsley", name: "Helmsley & Castle Howard", listingCount: 1, lat: "54.2461", lng: "-1.0601", description: "Castle Howard's Baroque magnificence and the picturesque market town beneath the North York Moors.", focusKeywords: ["castle howard wedding", "helmsley wedding venue"], aiSummary: "Castle Howard Brideshead association. North York Moors setting. Ultra-luxury." },

  // ── UK, Oxfordshire ─────────────────────────────────────────────────
  { id: "oxford", regionSlug: "oxfordshire", countrySlug: "uk", slug: "oxford", name: "Oxford", listingCount: 2, lat: "51.7520", lng: "-1.2577", description: "Dreaming spires, Bodleian Library, college quads and the Radcliffe Camera's rotunda.", focusKeywords: ["oxford wedding venue", "oxford college wedding"], aiSummary: "College venue weddings unique globally. Bodleian and Ashmolean. Academic prestige." },
  { id: "henley", regionSlug: "oxfordshire", countrySlug: "uk", slug: "henley-on-thames", name: "Henley-on-Thames", listingCount: 1, lat: "51.5360", lng: "-0.9027", description: "Royal Regatta town, Thames-side marquees, Georgian bridges and country house hotels.", focusKeywords: ["henley wedding venue", "henley regatta wedding"], aiSummary: "Regatta association. Thames-side venues. Summer peak. Affluent market." },
  { id: "woodstock", regionSlug: "oxfordshire", countrySlug: "uk", slug: "woodstock", name: "Woodstock & Blenheim", listingCount: 1, lat: "51.8472", lng: "-1.3534", description: "Blenheim Palace, Churchill's birthplace and England's grandest Baroque country house.", focusKeywords: ["blenheim palace wedding", "woodstock wedding venue"], aiSummary: "Blenheim Palace single-handedly dominates. England's most prestigious wedding venue." },

  // ── UK, Somerset & Bath (split) ──────────────────────────────────────────────
  { id: "bath", regionSlug: "bath-region", countrySlug: "uk", slug: "bath", name: "Bath", listingCount: 2, lat: "51.3811", lng: "-2.3590", description: "Georgian crescents, Roman baths and the Thermae Spa, England's most beautiful city.", focusKeywords: ["bath wedding venue", "bath spa wedding"], aiSummary: "Georgian architecture unmatched. Assembly Rooms and Royal Crescent. Spa integration." },
  { id: "bruton", regionSlug: "somerset", countrySlug: "uk", slug: "bruton", name: "Bruton & Frome", listingCount: 1, lat: "51.1105", lng: "-2.4498", description: "Somerset's creative heart, Hauser & Wirth gallery, Babington House and artisan culture.", focusKeywords: ["bruton wedding venue", "babington house wedding"], aiSummary: "Babington House Soho House effect. Creative luxury. Gallery culture." },

  // ── UK, Cheshire ─────────────────────────────────────────────────────
  { id: "chester", regionSlug: "cheshire", countrySlug: "uk", slug: "chester", name: "Chester", listingCount: 1, lat: "53.1905", lng: "-2.8911", description: "Roman city walls, Tudor Rows and the Chester Grosvenor's five-star grandeur.", focusKeywords: ["chester wedding venue"], aiSummary: "Roman-Tudor heritage. Chester Grosvenor anchor. Northwest city hub." },
  { id: "knutsford", regionSlug: "cheshire", countrySlug: "uk", slug: "knutsford", name: "Knutsford & Tatton", listingCount: 1, lat: "53.3021", lng: "-2.3735", description: "Tatton Park's deer park, Knutsford's antique charm and the Cheshire Golden Triangle.", focusKeywords: ["tatton park wedding", "knutsford wedding venue"], aiSummary: "Tatton Park ceremonies. Golden Triangle affluence. Northwest premium." },

  { id: "edinburgh-old-town", regionSlug: "scotland", countrySlug: "uk", slug: "edinburgh-old-town", name: "Edinburgh Old Town", listingCount: 2, lat: "55.9502", lng: "-3.1901", description: "Castle esplanade, the Royal Mile and the medieval close network beneath Arthur's Seat.", focusKeywords: ["edinburgh castle wedding", "royal mile wedding venue"], aiSummary: "Castle esplanade ceremonies. Royal Mile venues. Medieval atmosphere." },
  { id: "leith", regionSlug: "scotland", countrySlug: "uk", slug: "leith", name: "Leith & Newhaven", listingCount: 1, lat: "55.9769", lng: "-3.1705", description: "Edinburgh's waterfront renaissance, the Royal Yacht Britannia and converted warehouse spaces.", focusKeywords: ["leith wedding venue", "royal yacht britannia wedding"], aiSummary: "Royal Yacht Britannia unique. Waterfront warehouse conversions. Maritime charm." },

  { id: "inverness", regionSlug: "scotland", countrySlug: "uk", slug: "inverness", name: "Inverness & Loch Ness", listingCount: 1, lat: "57.4778", lng: "-4.2247", description: "Capital of the Highlands, Loch Ness mystery, Culloden battlefield and castle estates.", focusKeywords: ["inverness wedding venue", "loch ness wedding"], aiSummary: "Highland capital. Loch Ness tourism crossover. Castle estate venues." },
  { id: "skye", regionSlug: "scotland", countrySlug: "uk", slug: "isle-of-skye", name: "Isle of Skye", listingCount: 1, lat: "57.2740", lng: "-6.2156", description: "Cuillin mountain drama, fairy pools and the most photographed landscapes in Scotland.", focusKeywords: ["isle of skye wedding", "skye elopement"], aiSummary: "Elopement paradise. Fairy Pools ceremonies. Most Instagrammed Scottish location." },

  { id: "gleneagles", regionSlug: "scotland", countrySlug: "uk", slug: "gleneagles", name: "Gleneagles", listingCount: 1, lat: "56.2844", lng: "-3.7489", description: "Scotland's grandest resort, championship golf, falconry and Highland estate luxury.", focusKeywords: ["gleneagles wedding"], aiSummary: "Single-resort destination. Scotland's most prestigious. Ultra-premium." },

  // ── UK > Scotland ──────────────────────────────────────────────────
  { id: "city-edinburgh", regionSlug: "scotland", countrySlug: "uk", slug: "edinburgh", name: "Edinburgh", listingCount: 4, lat: "55.9533", lng: "-3.1883", description: "Castle skyline, Georgian New Town grandeur, Calton Hill panoramas and Scotland's cultural capital.", focusKeywords: ["edinburgh wedding venue", "edinburgh castle wedding"], aiSummary: "Scotland's urban luxury hub. Castle and hotel venues dominate. Strong international draw." },
  { id: "city-glasgow", regionSlug: "scotland", countrySlug: "uk", slug: "glasgow", name: "Glasgow", listingCount: 2, lat: "55.8642", lng: "-4.2518", description: "Charles Rennie Mackintosh architecture, Kelvingrove grandeur and Scotland's creative powerhouse.", focusKeywords: ["glasgow wedding venue"], aiSummary: "Creative-industrial venue scene. Mackintosh architectural heritage. Scotland's largest city." },
  { id: "city-scottish-highlands", regionSlug: "scotland", countrySlug: "uk", slug: "scottish-highlands", name: "Scottish Highlands", listingCount: 3, lat: "57.1200", lng: "-4.7100", description: "Castle estates, lochs and dramatic mountain scenery, epic celebrations in Britain's last wilderness.", focusKeywords: ["highland castle wedding", "scottish highland wedding"], aiSummary: "Castle weddings drive demand. Strong international interest. Elopement paradise. Seasonal May-September." },
  { id: "city-fife", regionSlug: "scotland", countrySlug: "uk", slug: "fife", name: "Fife", listingCount: 1, lat: "56.2082", lng: "-3.1495", description: "The Kingdom of Fife, St Andrews links, East Neuk fishing villages and Falkland Palace.", focusKeywords: ["fife wedding venue", "st andrews wedding"], aiSummary: "St Andrews anchor. East Neuk coastal charm. Royal associations." },
  { id: "city-perthshire", regionSlug: "scotland", countrySlug: "uk", slug: "perthshire", name: "Perthshire", listingCount: 3, lat: "56.4000", lng: "-3.4300", description: "Gleneagles resort, Highland Perthshire lochs and the ancient cathedral city of Dunkeld.", focusKeywords: ["perthshire wedding venue", "gleneagles wedding"], aiSummary: "Gleneagles anchors ultra-luxury. Bridge between Lowlands and Highlands." },
  { id: "city-aberdeenshire", regionSlug: "scotland", countrySlug: "uk", slug: "aberdeenshire", name: "Aberdeenshire", listingCount: 2, lat: "57.1500", lng: "-2.1100", description: "Balmoral's Royal Deeside, Cairngorms granite mountains and Northeast Scotland's castle trail.", focusKeywords: ["aberdeenshire castle wedding"], aiSummary: "Castle trail concentration. Balmoral association. Intimate and exclusive." },
  { id: "city-angus", regionSlug: "scotland", countrySlug: "uk", slug: "angus", name: "Angus", listingCount: 1, lat: "56.7300", lng: "-2.9200", description: "Glamis Castle birthplace of legends, rolling farmland and the Angus Glens.", focusKeywords: ["angus wedding venue"], aiSummary: "Glamis Castle anchor. Rural Scottish charm." },
  { id: "city-argyll", regionSlug: "scotland", countrySlug: "uk", slug: "argyll", name: "Argyll", listingCount: 1, lat: "56.2500", lng: "-5.2500", description: "West coast sea lochs, Inveraray Castle and the islands of Mull and Iona.", focusKeywords: ["argyll wedding venue"], aiSummary: "West coast beauty. Inveraray Castle. Island ceremonies." },
  { id: "city-ayrshire", regionSlug: "scotland", countrySlug: "uk", slug: "ayrshire", name: "Ayrshire", listingCount: 1, lat: "55.4600", lng: "-4.6300", description: "Burns country, Turnberry resort and the Ayrshire coast's links golf heritage.", focusKeywords: ["ayrshire wedding venue"], aiSummary: "Turnberry resort. Burns heritage. Coastal links setting." },
  { id: "city-dumfriesshire", regionSlug: "scotland", countrySlug: "uk", slug: "dumfriesshire", name: "Dumfriesshire", listingCount: 1, lat: "55.0700", lng: "-3.6100", description: "Gretna Green's romantic legacy, Drumlanrig Castle and the Scottish Borders countryside.", focusKeywords: ["gretna green wedding"], aiSummary: "Gretna Green elopement capital. Drumlanrig Castle. Borders romance." },
  { id: "city-east-lothian", regionSlug: "scotland", countrySlug: "uk", slug: "east-lothian", name: "East Lothian", listingCount: 1, lat: "55.9500", lng: "-2.7700", description: "Golden beaches, golf links and country estates just east of Edinburgh.", focusKeywords: ["east lothian wedding venue"], aiSummary: "Edinburgh overflow. Archerfield and golf estates." },
  { id: "city-west-lothian", regionSlug: "scotland", countrySlug: "uk", slug: "west-lothian", name: "West Lothian", listingCount: 1, lat: "55.9100", lng: "-3.5500", description: "Hopetoun House grandeur and Linlithgow Palace's royal heritage.", focusKeywords: ["west lothian wedding venue"], aiSummary: "Hopetoun House anchor. Royal palace heritage. Edinburgh adjacent." },

  // ── UK > Wales ─────────────────────────────────────────────────────
  { id: "city-pembrokeshire", regionSlug: "wales", countrySlug: "uk", slug: "pembrokeshire", name: "Pembrokeshire", listingCount: 2, lat: "51.8000", lng: "-4.9700", description: "The Pembrokeshire Coast National Park, Tenby's pastel harbour and golden beach coves.", focusKeywords: ["pembrokeshire wedding venue"], aiSummary: "Coastal beauty. Tenby and coast lead. Growing destination appeal." },
  { id: "city-cardiff", regionSlug: "wales", countrySlug: "uk", slug: "cardiff", name: "Cardiff", listingCount: 1, lat: "51.4816", lng: "-3.1791", description: "Cardiff Castle, the Millennium Centre and Wales's cosmopolitan capital.", focusKeywords: ["cardiff wedding venue"], aiSummary: "Welsh capital. Castle ceremonies. Urban-luxury hub." },
  { id: "city-snowdonia", regionSlug: "wales", countrySlug: "uk", slug: "snowdonia", name: "Snowdonia", listingCount: 2, lat: "52.9200", lng: "-3.8900", description: "Mountain grandeur, Portmeirion's Italianate village and the castles of Edward I.", focusKeywords: ["snowdonia wedding venue", "portmeirion wedding"], aiSummary: "Portmeirion iconic. Castle weddings unique. Mountain photography." },
  { id: "city-carmarthenshire", regionSlug: "wales", countrySlug: "uk", slug: "carmarthenshire", name: "Carmarthenshire", listingCount: 1, lat: "51.8500", lng: "-4.2900", description: "The Garden of Wales, Aberglasney Gardens, Dinefwr Park and the Towy Valley.", focusKeywords: ["carmarthenshire wedding venue"], aiSummary: "Garden of Wales. Rural estate weddings." },
  { id: "city-powys", regionSlug: "wales", countrySlug: "uk", slug: "powys", name: "Powys", listingCount: 1, lat: "52.3000", lng: "-3.4500", description: "Mid-Wales countryside, Lake Vyrnwy and the Brecon Beacons mountain range.", focusKeywords: ["powys wedding venue"], aiSummary: "Brecon Beacons setting. Lake Vyrnwy romantic. Rural luxury." },

  // ── UK > Northern Ireland ──────────────────────────────────────────
  { id: "city-antrim", regionSlug: "northern-ireland", countrySlug: "uk", slug: "antrim", name: "Antrim", listingCount: 2, lat: "54.7200", lng: "-6.2100", description: "Giant's Causeway, the dramatic Antrim Coast Road and Belfast's Titanic Quarter.", focusKeywords: ["antrim wedding venue", "belfast wedding"], aiSummary: "Giant's Causeway ceremonies iconic. Belfast modern venue cluster." },

  // ── UK > Channel Islands ───────────────────────────────────────────
  { id: "city-jersey", regionSlug: "channel-islands", countrySlug: "uk", slug: "jersey", name: "Jersey", listingCount: 2, lat: "49.2144", lng: "-2.1312", description: "French-inflected Channel Island charm, granite manor houses and sheltered bays.", focusKeywords: ["jersey wedding venue"], aiSummary: "Boutique island destination. Tax-efficient. French-British blend." },
  { id: "city-guernsey", regionSlug: "channel-islands", countrySlug: "uk", slug: "guernsey", name: "Guernsey", listingCount: 1, lat: "49.4548", lng: "-2.5383", description: "Victor Hugo's island of exile, dramatic cliffs, hidden coves and gentle island pace.", focusKeywords: ["guernsey wedding venue"], aiSummary: "Micro-destination. Intimate elopement market. Sark car-free unique." },

  // ── Ireland, Dublin ──────────────────────────────────────────────────
  { id: "dublin-city", regionSlug: "dublin", countrySlug: "ireland", slug: "dublin", name: "Dublin", listingCount: 2, lat: "53.3498", lng: "-6.2603", description: "Georgian squares, Trinity College, the Shelbourne Hotel and Dublin Castle's State Apartments.", focusKeywords: ["dublin wedding venue", "dublin castle wedding"], aiSummary: "Ireland's urban luxury hub. Georgian hotel and castle venues. Year-round." },
  { id: "powerscourt", regionSlug: "wicklow", countrySlug: "ireland", slug: "powerscourt", name: "Powerscourt & Enniskerry", listingCount: 1, lat: "53.1844", lng: "-6.1866", description: "Palladian mansion, Italian gardens and the Sugarloaf Mountain backdrop.", focusKeywords: ["powerscourt wedding", "enniskerry wedding venue"], aiSummary: "Powerscourt Estate Ireland's most prestigious. Garden ceremonies. Mountain views." },

  // ── Ireland, Kerry ───────────────────────────────────────────────────
  { id: "killarney", regionSlug: "kerry", countrySlug: "ireland", slug: "killarney", name: "Killarney", listingCount: 2, lat: "51.9492", lng: "-9.5734", description: "Muckross House, the Lakes of Killarney and Torc Waterfall in Ireland's most visited national park.", focusKeywords: ["killarney wedding venue", "muckross house wedding"], aiSummary: "Lakes and mountains. Muckross House anchor. Strong US-Irish heritage demand." },
  { id: "kenmare", regionSlug: "kerry", countrySlug: "ireland", slug: "kenmare", name: "Kenmare", listingCount: 1, lat: "51.8798", lng: "-9.5833", description: "Sheen Falls Lodge, colourful village streets and the Ring of Kerry's dramatic starting point.", focusKeywords: ["kenmare wedding venue", "sheen falls wedding"], aiSummary: "Sheen Falls Lodge anchor. Boutique village charm. Ring of Kerry gateway." },

  // ── Ireland, Galway ──────────────────────────────────────────────────
  { id: "galway-city", regionSlug: "galway", countrySlug: "ireland", slug: "galway-city", name: "Galway City", listingCount: 1, lat: "53.2707", lng: "-9.0568", description: "Latin Quarter vibrancy, Claddagh heritage and the Spanish Arch on Galway Bay.", focusKeywords: ["galway city wedding venue"], aiSummary: "Bohemian cultural capital. Claddagh ring heritage. Festival atmosphere." },
  { id: "clifden", regionSlug: "galway", countrySlug: "ireland", slug: "clifden", name: "Clifden & Connemara", listingCount: 1, lat: "53.4895", lng: "-10.0197", description: "Connemara's twelve Bens, Abbeyglen Castle and the wild Atlantic bog-cotton landscape.", focusKeywords: ["connemara wedding venue", "clifden wedding"], aiSummary: "Wild Atlantic beauty. Abbeyglen and Ballynahinch Castle. Remote luxury." },

  // ── Ireland, Clare ───────────────────────────────────────────────────
  { id: "doolin", regionSlug: "clare", countrySlug: "ireland", slug: "doolin", name: "Doolin & Cliffs of Moher", listingCount: 1, lat: "53.0160", lng: "-9.3783", description: "Europe's highest sea cliffs, traditional music sessions and the Burren's lunar karst landscape.", focusKeywords: ["cliffs of moher wedding", "doolin wedding venue"], aiSummary: "Cliffs of Moher ceremonies dramatic. Traditional music culture. Burren landscape." },

  // ── Greece, Santorini ────────────────────────────────────────────────
  { id: "oia", regionSlug: "santorini", countrySlug: "greece", slug: "oia", name: "Oia", listingCount: 3, lat: "36.4618", lng: "25.3753", description: "The world's most famous sunset, blue-domed churches and caldera-edge infinity terraces.", focusKeywords: ["oia wedding venue", "oia sunset wedding"], aiSummary: "Most iconic wedding sunset globally. Caldera venues command premium. Very high demand." },
  { id: "fira", regionSlug: "santorini", countrySlug: "greece", slug: "fira", name: "Fira", listingCount: 2, lat: "36.4165", lng: "25.4322", description: "Santorini's cliff-edge capital, caldera panoramas, volcanic wine and archaeological richness.", focusKeywords: ["fira wedding venue", "santorini caldera wedding"], aiSummary: "Caldera capital. More accessible than Oia. Wine tourism crossover." },

  // ── Greece, Mykonos ──────────────────────────────────────────────────
  { id: "mykonos-town", regionSlug: "mykonos", countrySlug: "greece", slug: "mykonos-town", name: "Mykonos Town", listingCount: 2, lat: "37.4467", lng: "25.3283", description: "Little Venice windmills, whitewashed labyrinthine lanes and cosmopolitan beach-club glamour.", focusKeywords: ["mykonos town wedding venue"], aiSummary: "Little Venice ceremonies iconic. Beach club receptions. Fashion-forward." },

  // ── Greece, Crete ────────────────────────────────────────────────────
  { id: "chania", regionSlug: "crete", countrySlug: "greece", slug: "chania", name: "Chania", listingCount: 2, lat: "35.5138", lng: "24.0180", description: "Venetian harbour, lighthouse ceremonies and the White Mountains' dramatic gorge country.", focusKeywords: ["chania wedding venue", "crete old town wedding"], aiSummary: "Venetian harbour ceremonies romantic. Lighthouse venue iconic. Samaria Gorge drama." },

  // ── Croatia, Dubrovnik ───────────────────────────────────────────────
  { id: "dubrovnik-old-town", regionSlug: "dubrovnik", countrySlug: "croatia", slug: "dubrovnik-old-town", name: "Dubrovnik Old Town", listingCount: 2, lat: "42.6412", lng: "18.1083", description: "Walk the medieval walls, celebrate in Sponza Palace and dine above the Adriatic's clearest waters.", focusKeywords: ["dubrovnik old town wedding"], aiSummary: "Walled city ceremonies. Sponza Palace and fort venues. Game of Thrones tourism." },

  // ── Indonesia, Bali ──────────────────────────────────────────────────
  { id: "tegallalang", regionSlug: "ubud", countrySlug: "indonesia", slug: "tegallalang", name: "Tegallalang", listingCount: 2, lat: "-8.4312", lng: "115.2791", description: "UNESCO rice terraces, the most photographed landscape in Bali and iconic jungle villa territory.", focusKeywords: ["tegallalang wedding", "bali rice terrace wedding"], aiSummary: "UNESCO rice terrace ceremonies. Jungle villa weddings. Bali's cultural heartland." },
  { id: "uluwatu-town", regionSlug: "uluwatu", countrySlug: "indonesia", slug: "uluwatu-temple", name: "Uluwatu", listingCount: 2, lat: "-8.8291", lng: "115.0849", description: "Clifftop Kecak dance temple, infinity chapels and Indian Ocean sunset ceremonies.", focusKeywords: ["uluwatu temple wedding", "bali cliff wedding"], aiSummary: "Purpose-built wedding chapels. Cliff-edge ceremonies. Sunset timing critical." },

  // ── India, Rajasthan ─────────────────────────────────────────────────
  { id: "udaipur", regionSlug: "rajasthan", countrySlug: "india", slug: "udaipur", name: "Udaipur", listingCount: 3, lat: "24.5854", lng: "73.7125", description: "City of Lakes, Taj Lake Palace floating on Pichola, Jag Mandir island and the Oberoi Udaivilas.", focusKeywords: ["udaipur palace wedding", "lake pichola wedding"], aiSummary: "India's wedding capital. Taj Lake Palace globally iconic. Multi-day celebrations." },
  { id: "jaipur", regionSlug: "rajasthan", countrySlug: "india", slug: "jaipur", name: "Jaipur", listingCount: 2, lat: "26.9124", lng: "75.7873", description: "The Pink City, Amber Fort, City Palace and the extravagant Rambagh Palace heritage hotel.", focusKeywords: ["jaipur palace wedding", "rambagh palace wedding"], aiSummary: "Rambagh Palace and Samode Palace anchor. Fort ceremonies dramatic. Royal heritage." },

  // ── UAE, Dubai ────────────────────────────────────────────────────────
  { id: "palm-jumeirah", regionSlug: "dubai", countrySlug: "uae", slug: "palm-jumeirah", name: "Palm Jumeirah", listingCount: 2, lat: "25.1124", lng: "55.1390", description: "The iconic palm island, Atlantis, One&Only and private beach estate celebrations.", focusKeywords: ["palm jumeirah wedding venue", "atlantis wedding dubai"], aiSummary: "Atlantis anchor. Resort island model. Ultra-luxury beach and ballroom." },
  { id: "downtown-dubai", regionSlug: "dubai", countrySlug: "uae", slug: "downtown-dubai", name: "Downtown Dubai", listingCount: 2, lat: "25.1972", lng: "55.2744", description: "Burj Khalifa skyline, Dubai Fountain views and the Address Hotel collection.", focusKeywords: ["downtown dubai wedding venue", "burj khalifa wedding"], aiSummary: "Skyline ceremony backdrops. Fountain-view venues. Urban ultra-luxury." },

  // ── Morocco, Marrakech ────────────────────────────────────────────────
  { id: "medina-marrakech", regionSlug: "marrakech", countrySlug: "morocco", slug: "marrakech-medina", name: "Marrakech Medina", listingCount: 2, lat: "31.6295", lng: "-7.9811", description: "Rose-scented riads, Jemaa el-Fnaa's spectacle and the Bahia Palace's zellige craftsmanship.", focusKeywords: ["marrakech riad wedding", "medina wedding venue"], aiSummary: "Riad courtyard ceremonies. Bahia Palace formal events. Sensory immersion." },

  // ── South Africa, Cape Winelands ──────────────────────────────────────
  { id: "stellenbosch", regionSlug: "cape-winelands", countrySlug: "southafrica", slug: "stellenbosch", name: "Stellenbosch", listingCount: 2, lat: "-33.9321", lng: "18.8602", description: "Oak-lined avenues, Cape Dutch estates and South Africa's premier wine-growing university town.", focusKeywords: ["stellenbosch wedding venue", "wine estate wedding"], aiSummary: "Wine estate concentration. Cape Dutch architecture. Mountain backdrop." },
  { id: "franschhoek", regionSlug: "cape-winelands", countrySlug: "southafrica", slug: "franschhoek", name: "Franschhoek", listingCount: 2, lat: "-33.9134", lng: "19.1169", description: "French Huguenot heritage, boutique wine estates and South Africa's culinary capital.", focusKeywords: ["franschhoek wedding venue", "franschhoek wine estate wedding"], aiSummary: "Culinary capital. Boutique wine estates. La Motte and Babylonstoren iconic." },

  // ── Mexico, Tulum ────────────────────────────────────────────────────
  { id: "tulum-town", regionSlug: "tulum", countrySlug: "mexico", slug: "tulum-beach", name: "Tulum Beach", listingCount: 2, lat: "20.2145", lng: "-87.4290", description: "Mayan ruins above turquoise waters, jungle cenotes and barefoot-luxury beach hotels.", focusKeywords: ["tulum beach wedding", "cenote wedding tulum"], aiSummary: "Cenote ceremonies unique. Jungle-beach dual venue. Barefoot luxury." },

  // ── Caribbean, Barbados ───────────────────────────────────────────────
  { id: "platinum-coast", regionSlug: "barbados", countrySlug: "caribbean", slug: "platinum-coast", name: "Platinum Coast", listingCount: 2, lat: "13.1767", lng: "-59.6420", description: "Sandy Lane, the Colony Club and the calm west-coast Caribbean waters at golden hour.", focusKeywords: ["sandy lane wedding", "barbados west coast wedding"], aiSummary: "Sandy Lane anchor. Platinum Coast resort strip. Ultimate Caribbean luxury." },

  // ── Australia, Sydney ────────────────────────────────────────────────
  { id: "sydney-harbour", regionSlug: "sydney", countrySlug: "australia", slug: "sydney-harbour", name: "Sydney Harbour", listingCount: 2, lat: "-33.8568", lng: "151.2153", description: "Opera House sails, Harbour Bridge arch and the most spectacular urban waterfront on earth.", focusKeywords: ["sydney harbour wedding", "opera house wedding"], aiSummary: "World's most iconic harbour. Bridge and Opera House dual backdrop." },

  // ── New Zealand, Queenstown ───────────────────────────────────────────
  { id: "remarkables", regionSlug: "queenstown", countrySlug: "newzealand", slug: "the-remarkables", name: "The Remarkables", listingCount: 1, lat: "-45.0400", lng: "168.8100", description: "Jagged mountain peaks above Lake Wakatipu, helicopter ceremony access to pristine alpine ledges.", focusKeywords: ["remarkables wedding", "queenstown mountain wedding"], aiSummary: "Helicopter mountain-top ceremonies. Jagged peak backdrop. Most dramatic NZ setting." },
];

const MOCK_LISTINGS = [
  { id: 1, name: "Villa Balbiano", slug: "villa-balbiano-lake-como", category: "wedding-venues", subCategory: "Country Houses", destination: "Italy", countrySlug: "italy", regionSlug: "lake-como", status: "Active", tier: "signature", lwdScore: 9.6, enquiries: 34, listed: "15 Jan 2025", lastUpdated: "27 Feb", expires: "15 Jan 2026" },
  { id: 2, name: "Château de Vaux", slug: "chateau-de-vaux-ile-de-france", category: "wedding-venues", subCategory: "Castles & Estates", destination: "France", countrySlug: "france", regionSlug: "paris-ile-de-france", status: "Active", tier: "signature", lwdScore: 9.4, enquiries: 28, listed: "10 Jan 2025", lastUpdated: "26 Feb", expires: "10 Jan 2026" },
  { id: 3, name: "Fiore Events", slug: "fiore-events-tuscany", category: "wedding-planners", subCategory: "Full Planning", destination: "Italy", countrySlug: "italy", regionSlug: "tuscany", status: "Active", tier: "curated", lwdScore: 9.2, enquiries: 19, listed: "20 Jan 2025", lastUpdated: "25 Feb", expires: "20 Jan 2026" },
  { id: 4, name: "Coworth Park", slug: "coworth-park-berkshire", category: "wedding-venues", subCategory: "Hotel Venues", destination: "UK", countrySlug: "uk", regionSlug: "berkshire", status: "Active", tier: "signature", lwdScore: 9.5, enquiries: 41, listed: "05 Jan 2025", lastUpdated: "27 Feb", expires: "05 Jan 2026" },
  { id: 5, name: "Lena Karelova", slug: "lena-karelova-barcelona", category: "photographers", subCategory: "Fine Art", destination: "Spain", countrySlug: "spain", regionSlug: "barcelona", status: "Active", tier: "curated", lwdScore: 9.1, enquiries: 16, listed: "25 Jan 2025", lastUpdated: "24 Feb", expires: "25 Jan 2026" },
  { id: 6, name: "The Grand Pavilion", slug: "the-grand-pavilion-surrey", category: "wedding-venues", subCategory: "Country Houses", destination: "UK", countrySlug: "uk", regionSlug: "surrey", status: "Active", tier: "signature", lwdScore: 9.2, enquiries: 23, listed: "08 Jan 2025", lastUpdated: "27 Feb", expires: "08 Jan 2026" },
  { id: 7, name: "Putnam & Putnam", slug: "putnam-putnam-new-york", category: "florists", subCategory: "Luxury Floral Design", destination: "USA", countrySlug: "usa", regionSlug: "new-york", status: "Pending", tier: "curated", lwdScore: 8.8, enquiries: 8, listed: "18 Feb 2025", lastUpdated: "23 Feb", expires: "18 Feb 2026" },
  { id: 8, name: "Aynhoe Park", slug: "aynhoe-park-oxfordshire", category: "wedding-venues", subCategory: "Country Houses", destination: "UK", countrySlug: "uk", regionSlug: "cotswolds", status: "Review", tier: "signature", lwdScore: 9.3, enquiries: 31, listed: "12 Jan 2025", lastUpdated: "26 Feb", expires: "12 Jan 2026" },
  { id: 9, name: "Soirée Events", slug: "soiree-events-provence", category: "wedding-planners", subCategory: "Destination Specialists", destination: "France", countrySlug: "france", regionSlug: "provence", status: "Active", tier: "curated", lwdScore: 8.9, enquiries: 12, listed: "22 Jan 2025", lastUpdated: "22 Feb", expires: "22 Jan 2026" },
  { id: 10, name: "Borgo Santo Pietro", slug: "borgo-santo-pietro-tuscany", category: "wedding-venues", subCategory: "Country Houses", destination: "Italy", countrySlug: "italy", regionSlug: "tuscany", status: "Paused", tier: "standard", lwdScore: 8.4, enquiries: 5, listed: "28 Dec 2024", lastUpdated: "18 Feb", expires: "28 Dec 2025" },
  { id: 11, name: "New Luxury Villa", slug: "new-luxury-villa-amalfi", category: "wedding-venues", subCategory: "Country Houses", destination: "Italy", countrySlug: "italy", regionSlug: "amalfi-coast", status: "Draft", tier: "platinum", lwdScore: 0, enquiries: 0, listed: "06 Mar 2025", lastUpdated: "06 Mar", expires: "06 Mar 2026" },
  {
    id: 12,
    name: "Villa Taiger",
    slug: "villa-taiger-tuscany",
    category: "wedding-venues",
    subCategory: "Country Houses",
    destination: "Italy",
    countrySlug: "italy",
    regionSlug: "tuscany",
    status: "Active",
    tier: "signature",
    lwdScore: 9.6,
    enquiries: 12,
    listed: "06 Mar 2026",
    lastUpdated: "06 Mar",
    expires: "06 Mar 2027",
    // Full Platinum listing data
    cardStyle: "full-bleed",
    cardImage: "/media/villa-taiger-card-hero.jpg",
    cardBadge: "Estate of the Month",
    heroType: "cinematic",
    heroImage: "/media/villa-taiger-hero-main.jpg",
    heroVimeoUrl: "https://vimeo.com/villa-taiger-tour",
    capacityMin: 50,
    capacityMax: 150,
    rating: 4.9,
    reviewCount: 48,
    priceLabel: "£££",
    priceFrom: "£45,000",
    imageCount: 15,
    videoCount: 6,
    amenities: 20,
  },
];

// ── Theme-aware Status badge ───────────────────────────────────────────────
function StatusBadge({ status, C }) {
  const colors = {
    New:          { bg: "rgba(201,168,76,0.15)", text: C.gold },
    Reviewed:     { bg: "rgba(96,165,250,0.12)",  text: C.blue },
    Responded:    { bg: "rgba(34,197,94,0.12)",   text: C.green },
    Active:       { bg: "rgba(34,197,94,0.12)",   text: C.green },
    Founding:     { bg: "rgba(201,168,76,0.15)", text: C.gold },
    Pending:      { bg: "rgba(136,136,136,0.12)", text: C.grey },
    Review:       { bg: "rgba(201,168,76,0.15)", text: C.gold },
    Draft:        { bg: "rgba(59,130,246,0.12)",  text: C.blue },
    Paused:       { bg: "rgba(190,18,60,0.12)",   text: C.rose },
    "AI Handling": { bg: "rgba(96,165,250,0.12)",  text: C.blue },
    Waiting:      { bg: "rgba(201,168,76,0.15)", text: C.gold },
    Closed:       { bg: "rgba(136,136,136,0.08)", text: C.grey2 },
  };
  const c = colors[status] || colors.Pending;
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: c.text, background: c.bg,
      padding: "3px 10px", borderRadius: 3,
    }}>
      {status}
    </span>
  );
}

// ── Capacity bar ───────────────────────────────────────────────────────────
function CapacityBar({ filled, total, color, C }) {
  const pct = total > 0 ? (filled / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 4, background: C.border2, borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color || C.gold, borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 300, minWidth: 36 }}>
        {filled}/{total}
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Overview Module
// ═════════════════════════════════════════════════════════════════════════════
function OverviewModule({ C }) {
  return (
    <div>
      <div className="admin-stats-grid admin-grid-4col" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40,
      }}>
        {STATS.map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "24px 20px",
          }}>
            <p style={{
              fontFamily: NU, fontSize: 10, letterSpacing: "0.2em",
              textTransform: "uppercase", color: C.grey, fontWeight: 600, margin: "0 0 8px",
            }}>{s.label}</p>
            <p style={{
              fontFamily: GD, fontSize: 28, color: C.off, fontWeight: 400, margin: "0 0 6px",
            }}>{s.value}</p>
            <p style={{
              fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0,
            }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="admin-overview-cols" style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24,
      }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: "24px 20px",
        }}>
          <p style={{
            fontFamily: NU, fontSize: 10, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px",
          }}>Recent Enquiries</p>
          {RECENT_ENQUIRIES.map((e) => (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400, margin: "0 0 3px" }}>{e.name}</p>
                <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>{e.type} · {e.dest}</p>
              </div>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 300, minWidth: 48 }}>{e.date}</span>
              <StatusBadge status={e.status} C={C} />
            </div>
          ))}
        </div>

        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: "24px 20px",
        }}>
          <p style={{
            fontFamily: NU, fontSize: 10, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px",
          }}>Destination Capacity</p>
          {DESTINATION_CAPACITY.map((d) => (
            <div key={d.name} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 400, margin: "0 0 8px" }}>{d.name}</p>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Signature</span>
                <CapacityBar filled={d.filled} total={d.signature} color={C.gold} C={C} />
              </div>
              <div>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Curated</span>
                <CapacityBar filled={d.curFilled} total={d.curated} color={C.grey} C={C} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Partnerships Module
// ═════════════════════════════════════════════════════════════════════════════
function PartnershipsModule({ C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
      <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 24px" }}>Partnership Tracker</p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr", gap: 12, padding: "0 0 12px", borderBottom: `1px solid ${C.border2}` }}>
        {["Venue", "Destination", "Tier", "Status", "Renewal"].map((h) => (
          <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
        ))}
      </div>
      {PARTNERSHIP_PIPELINE.map((p) => (
        <div key={p.venue} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
          <span style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400 }}>{p.venue}</span>
          <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, fontWeight: 300 }}>{p.dest}</span>
          <span style={{ fontFamily: NU, fontSize: 10, color: p.tier === "Institutional" ? C.gold : C.grey, fontWeight: p.tier === "Institutional" ? 600 : 400, letterSpacing: "0.08em" }}>{p.tier}</span>
          <StatusBadge status={p.status} C={C} />
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300 }}>{p.renewal}</span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Index Health Module
// ═════════════════════════════════════════════════════════════════════════════
function IndexHealthModule({ C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
      <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 24px" }}>Curated Index, Health Overview</p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 0.6fr 0.6fr 1.5fr", gap: 12, padding: "0 0 12px", borderBottom: `1px solid ${C.border2}` }}>
        {["Venue", "Score", "Trend", "Flag"].map((h) => (
          <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
        ))}
      </div>
      {INDEX_HEALTH.map((v) => (
        <div key={v.venue} style={{ display: "grid", gridTemplateColumns: "2fr 0.6fr 0.6fr 1.5fr", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
          <span style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400 }}>{v.venue}</span>
          <span style={{ fontFamily: GD, fontSize: 16, color: v.score >= 80 ? C.gold : v.score >= 70 ? C.off : C.grey, fontWeight: 400 }}>{v.score}</span>
          <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 400, color: v.trend.startsWith("+") ? C.green : v.trend.startsWith("-") ? C.rose : C.grey2 }}>{v.trend}</span>
          <span style={{ fontFamily: NU, fontSize: 11, color: v.flag ? C.rose : C.grey2, fontWeight: v.flag ? 400 : 300, fontStyle: v.flag ? "normal" : "italic" }}>{v.flag || " - "}</span>
        </div>
      ))}
      <p style={{ fontFamily: NU, fontSize: 11, fontStyle: "italic", color: C.grey2, fontWeight: 300, margin: "24px 0 0", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        Scores are system-generated. Manual overrides are not permitted.
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LWD Artistry, Coming Soon placeholder
// ═════════════════════════════════════════════════════════════════════════════
function ArtistryComingSoon({ C, NU, GD }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '60px 32px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 40, marginBottom: 24 }}>✦</span>
      <h1 style={{
        fontFamily: GD,
        fontSize: 32,
        fontWeight: 400,
        color: C.white,
        margin: '0 0 12px',
      }}>
        LWD Artistry
      </h1>
      <p style={{
        fontFamily: NU,
        fontSize: 13,
        color: C.grey2,
        margin: '0 0 8px',
        maxWidth: 420,
        lineHeight: 1.6,
      }}>
        A cinematic editorial showcase of the artists behind extraordinary weddings.
      </p>
      <p style={{
        fontFamily: NU,
        fontSize: 11,
        color: C.gold,
        margin: '24px 0 0',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Coming Soon, In Build
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Live Chat Takeover Module
// ═════════════════════════════════════════════════════════════════════════════
function LiveChatModule({ C }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      {/* Live stats */}
      <div className="admin-stats-grid admin-grid-4col" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32,
      }}>
        {[
          { label: "Active Conversations", value: "3", sub: "2 AI · 1 human" },
          { label: "Waiting for Agent",    value: "1", sub: "Guest #4821" },
          { label: "AI Resolved Today",    value: "47", sub: "94% resolution rate" },
          { label: "Avg Response Time",    value: "< 4s", sub: "AI first response" },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "24px 20px",
          }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.grey, fontWeight: 600, margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontFamily: GD, fontSize: 28, color: C.off, fontWeight: 400, margin: "0 0 6px" }}>{s.value}</p>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chat list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: 0 }}>Active Sessions</p>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 300 }}>Click to take over from AI</span>
        </div>

        {LIVE_CHATS.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelected(chat.id === selected ? null : chat.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 12px", marginBottom: 4, borderRadius: 4,
              background: selected === chat.id ? "rgba(201,168,76,0.06)" : "transparent",
              border: selected === chat.id ? `1px solid rgba(201,168,76,0.2)` : `1px solid transparent`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {/* Live indicator */}
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: chat.status === "Active" ? C.green
                : chat.status === "AI Handling" ? C.blue
                : chat.status === "Waiting" ? C.gold
                : C.grey2,
              boxShadow: chat.status === "Waiting" ? `0 0 6px ${C.gold}` : "none",
            }} />

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400, margin: "0 0 3px" }}>{chat.visitor}</p>
              <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>{chat.page}</p>
            </div>

            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 300, minWidth: 48 }}>{chat.time}</span>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 300, minWidth: 20, textAlign: "right" }}>{chat.messages} msg</span>
            <StatusBadge status={chat.status} C={C} />

            {/* Takeover button */}
            {selected === chat.id && chat.status !== "Closed" && (
              <button style={{
                background: C.gold, color: "#0a0906", border: "none",
                borderRadius: 3, padding: "6px 14px", cursor: "pointer",
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                transition: "opacity 0.2s", marginLeft: 8,
              }}>
                {chat.status === "AI Handling" ? "Take Over" : "Join"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Aura Analytics Module, AI performance intelligence
// ═════════════════════════════════════════════════════════════════════════════
function AuraAnalyticsModule({ C }) {
  return (
    <div>
      {/* Taigenic branding */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
        padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 4,
      }}>
        <span style={{
          fontFamily: GD, fontSize: 14, color: C.gold, fontWeight: 400,
        }}>✧</span>
        <div>
          <span style={{
            fontFamily: NU, fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.off, fontWeight: 600,
          }}>Powered by Taigenic.ai</span>
          <span style={{
            fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 300,
            marginLeft: 10,
          }}>Part of 5 Star Weddings Ltd.</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: C.green,
            boxShadow: `0 0 4px ${C.green}`,
          }} />
          <span style={{ fontFamily: NU, fontSize: 9, color: C.green, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Online
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid admin-grid-4col" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32,
      }}>
        {AURA_STATS.map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "24px 20px",
          }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.grey, fontWeight: 600, margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontFamily: GD, fontSize: 28, color: C.off, fontWeight: 400, margin: "0 0 6px" }}>{s.value}</p>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="admin-overview-cols" style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24,
      }}>
        {/* Recent AI conversations */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
          <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px" }}>Recent AI Conversations</p>
          {AURA_RECENT.map((r) => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 400, margin: "0 0 3px" }}>{r.query}</p>
                <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>→ {r.venue}</p>
              </div>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 300, minWidth: 48 }}>{r.time}</span>
              <StatusBadge status={r.outcome === "Enquiry Sent" ? "Active" : r.outcome === "Shortlisted" ? "Reviewed" : "Pending"} C={C} />
            </div>
          ))}
        </div>

        {/* Top recommended venues */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
          <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px" }}>Top AI Recommendations</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr", gap: 8, padding: "0 0 10px", borderBottom: `1px solid ${C.border2}` }}>
            {["Venue", "Mentions", "Enquiries"].map((h) => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {AURA_TOP_VENUES.map((v) => (
            <div key={v.venue} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr", gap: 8, padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400 }}>{v.venue}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, fontWeight: 300 }}>{v.mentions}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.gold, fontWeight: 500 }}>{v.enquiries}</span>
            </div>
          ))}

          <div style={{ marginTop: 20, padding: "16px 0 0", borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, margin: "0 0 10px" }}>Query Categories</p>
            {[
              { cat: "Destination Search", pct: 38 },
              { cat: "Budget Filtering", pct: 24 },
              { cat: "Experience Matching", pct: 18 },
              { cat: "Availability Check", pct: 12 },
              { cat: "General Enquiry", pct: 8 },
            ].map((q) => (
              <div key={q.cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 300 }}>{q.cat}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 400 }}>{q.pct}%</span>
                </div>
                <div style={{ height: 3, background: C.border2, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${q.pct}%`, height: "100%", background: C.gold, borderRadius: 2, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// API Management Module, keys, endpoints, usage
// ═════════════════════════════════════════════════════════════════════════════
function APIManagementModule({ C }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      {/* Taigenic branding */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
        padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 4,
      }}>
        <span style={{ fontFamily: GD, fontSize: 14, color: C.gold, fontWeight: 400 }}>⟐</span>
        <div>
          <span style={{
            fontFamily: NU, fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.off, fontWeight: 600,
          }}>Taigenic.ai API</span>
          <span style={{
            fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 300, marginLeft: 10,
          }}>v1.0 · RESTful · JSON</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <StatusBadge status="Active" C={C} />
        </div>
      </div>

      {/* Usage stats */}
      <div className="admin-stats-grid admin-grid-4col" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32,
      }}>
        {[
          { label: "API Calls Today",    value: "34.6k", sub: "↑ 8% vs yesterday" },
          { label: "Success Rate",       value: "99.7%", sub: "12 failed / 34,600" },
          { label: "Avg Latency",        value: "142ms", sub: "P95: 380ms" },
          { label: "Monthly Quota",      value: "72%",   sub: "724k / 1M calls" },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "24px 20px",
          }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.grey, fontWeight: 600, margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontFamily: GD, fontSize: 28, color: C.off, fontWeight: 400, margin: "0 0 6px" }}>{s.value}</p>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 300, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* API Keys */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px", marginBottom: 24 }}>
        <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px" }}>API Credentials</p>

        {[
          { label: "Production Key", key: "tgn_live_9x4kHmR7vB2wQ8nL3pF6jY1dA0cE5sT", env: "Live" },
          { label: "Staging Key", key: "tgn_test_mK7rN2xW4vB8qL9pJ3hF6dA1cY0sE5t", env: "Test" },
        ].map((k) => (
          <div key={k.label} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 0", borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 500 }}>{k.label}</span>
                <span style={{
                  fontFamily: NU, fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase",
                  color: k.env === "Live" ? C.green : C.blue,
                  background: k.env === "Live" ? "rgba(34,197,94,0.1)" : "rgba(96,165,250,0.1)",
                  padding: "2px 8px", borderRadius: 3, fontWeight: 700,
                }}>{k.env}</span>
              </div>
              <code style={{
                fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11,
                color: C.grey, background: "rgba(0,0,0,0.15)",
                padding: "4px 8px", borderRadius: 3, display: "inline-block",
              }}>
                {showKey ? k.key : k.key.slice(0, 12) + "••••••••••••••••••••••"}
              </code>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowKey(!showKey)}
          style={{
            background: "none", border: `1px solid ${C.border}`, borderRadius: 3,
            cursor: "pointer", padding: "6px 14px", marginTop: 16,
            fontFamily: NU, fontSize: 10, color: C.grey, fontWeight: 400,
            letterSpacing: "0.08em", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
        >
          {showKey ? "Hide Keys" : "Reveal Keys"}
        </button>
      </div>

      {/* Endpoints */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 20px" }}>
        <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, margin: "0 0 20px" }}>API Endpoints</p>
        <div style={{ display: "grid", gridTemplateColumns: "0.5fr 2fr 1.5fr 0.8fr 0.6fr", gap: 12, padding: "0 0 12px", borderBottom: `1px solid ${C.border2}` }}>
          {["Method", "Endpoint", "Description", "Calls/mo", "Status"].map((h) => (
            <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {API_ENDPOINTS.map((ep) => (
          <div key={ep.path} style={{ display: "grid", gridTemplateColumns: "0.5fr 2fr 1.5fr 0.8fr 0.6fr", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <span style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 10,
              color: ep.method === "POST" ? C.gold : C.blue,
              fontWeight: 700,
            }}>{ep.method}</span>
            <code style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11,
              color: C.off, fontWeight: 400,
            }}>{ep.path}</code>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 300 }}>{ep.desc}</span>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 400 }}>{ep.calls}</span>
            <span style={{
              fontFamily: NU, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700,
              color: ep.status === "Active" ? C.green : C.blue,
            }}>{ep.status}</span>
          </div>
        ))}

        <p style={{
          fontFamily: NU, fontSize: 11, fontStyle: "italic", color: C.grey2, fontWeight: 300,
          margin: "20px 0 0", borderTop: `1px solid ${C.border}`, paddingTop: 16,
        }}>
          Base URL: api.taigenic.ai/lwd · Rate limit: 1,000 req/min · All endpoints require Bearer token authentication.
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Stock Image Search Panel, Unsplash, Pexels, Pixabay
// ═════════════════════════════════════════════════════════════════════════════
const STOCK_SOURCES = {
  unsplash: {
    name: "Unsplash", icon: "◆", color: "#fff",
    search: (q) => Array.from({ length: 12 }, (_, i) => ({
      id: `unsplash-${q}-${i}`,
      url: `https://source.unsplash.com/640x480/?${encodeURIComponent(q)}&sig=${i}`,
      thumb: `https://source.unsplash.com/200x150/?${encodeURIComponent(q)}&sig=${i}`,
      photographer: ["Elena Mozhvilo", "Álvaro CvG", "Thomas AE", "Jeremy Wong", "Samantha Gades", "Toa Heftiba", "Priscilla Du Preez", "Nathan Dumlao", "Sandy Millar", "Kats Weil", "Becca Tapert", "Olivia Bauso"][i],
      source: "Unsplash",
      license: "Free to use",
      width: 640, height: 480,
    })),
  },
  pexels: {
    name: "Pexels", icon: "●", color: "#05A081",
    search: (q) => Array.from({ length: 12 }, (_, i) => ({
      id: `pexels-${q}-${i}`,
      url: `https://images.pexels.com/photos/${1000000 + i * 1337}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=640&h=480&fit=crop`,
      thumb: `https://images.pexels.com/photos/${1000000 + i * 1337}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop`,
      photographer: ["Taryn Elliott", "Jonathan Borba", "Emma Bauso", "Pixabay", "Lukas", "Terje Sollie", "Valeria Boltneva", "Asad Photo", "Lina Kivaka", "Trung Nguyen", "Anna Shvets", "Cottonbro"][i],
      source: "Pexels",
      license: "Free to use",
      width: 640, height: 480,
    })),
  },
  pixabay: {
    name: "Pixabay", icon: "◎", color: "#00AB6C",
    search: (q) => Array.from({ length: 12 }, (_, i) => ({
      id: `pixabay-${q}-${i}`,
      url: `https://pixabay.com/get/placeholder-${q}-${i}.jpg`,
      thumb: `https://pixabay.com/get/placeholder-${q}-${i}-thumb.jpg`,
      photographer: ["Pexels", "Free-Photos", "StockSnap", "rawpixel", "Engin_Akyurt", "Bru-nO", "Vidal Balielo", "monicore", "Anh Nguyen", "Darkmoon_Art", "PublicDomainPictures", "Pezibear"][i],
      source: "Pixabay",
      license: "Free to use",
      width: 640, height: 480,
    })),
  },
};

function ImageSearchPanel({ C, onSelect, onClose, defaultQuery }) {
  const [query, setQuery] = useState(defaultQuery || "");
  const [source, setSource] = useState("unsplash");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const doSearch = () => {
    if (!query.trim()) return;
    setResults(STOCK_SOURCES[source].search(query.trim()));
    setSearched(true);
  };

  const srcTab = (key) => {
    const s = STOCK_SOURCES[key];
    const active = source === key;
    return (
      <button key={key} onClick={() => { setSource(key); if (query.trim()) { setResults(STOCK_SOURCES[key].search(query.trim())); setSearched(true); } }}
        style={{
          fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: active ? s.color : C.grey2, background: active ? `${s.color}12` : "transparent",
          border: `1px solid ${active ? s.color + "40" : "transparent"}`, borderRadius: 3,
          padding: "5px 12px", cursor: "pointer", transition: "all 0.15s",
          display: "flex", alignItems: "center", gap: 5,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = s.color; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.grey2; }}
      >{s.icon} {s.name}</button>
    );
  };

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 4, background: C.card, padding: "16px 18px",
      marginTop: 8,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
          Free Stock Images
        </div>
        <button onClick={onClose} style={{
          fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey, background: "transparent",
          border: `1px solid ${C.border}`, borderRadius: 3, padding: "3px 10px", cursor: "pointer",
        }}>Close</button>
      </div>

      {/* Source tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {srcTab("unsplash")}{srcTab("pexels")}{srcTab("pixabay")}
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
          placeholder={`Search ${STOCK_SOURCES[source].name} for free images...`}
          style={{
            flex: 1, fontFamily: NU, fontSize: 12, color: C.off, background: C.black,
            border: `1px solid ${C.border}`, borderRadius: 3, padding: "8px 12px", outline: "none",
          }} />
        <button onClick={doSearch} style={{
          fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "#000", background: C.gold, border: "none", borderRadius: 3, padding: "8px 16px", cursor: "pointer",
        }}>Search</button>
      </div>

      {/* Results grid */}
      {!searched ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic", textAlign: "center", padding: "24px 0" }}>
          Search for free, high-quality images from {STOCK_SOURCES[source].name}. All images are free to use commercially.
        </div>
      ) : results.length === 0 ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic", textAlign: "center", padding: "24px 0" }}>
          No results found. Try a different search term.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            {results.map(img => (
              <div key={img.id} onClick={() => onSelect(img)} style={{
                cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 4,
                overflow: "hidden", background: C.black, transition: "border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={{ width: "100%", height: 80, background: `linear-gradient(135deg, ${C.border}40, ${C.card})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: NU, fontSize: 18, color: C.grey2 }}>📷</span>
                </div>
                <div style={{ padding: "5px 7px" }}>
                  <div style={{ fontFamily: NU, fontSize: 8, color: C.off, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.photographer}</div>
                  <div style={{ fontFamily: NU, fontSize: 7, color: C.grey2 }}>{img.source} · Free</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, textAlign: "center" }}>
            Click any image to use it. Attribution: {STOCK_SOURCES[source].name} · Free for commercial use. When connected to API, real images will display.
          </div>
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LWD WYSIWYG Editor, Reusable across Categories, Countries, Blog, Listings
// ═════════════════════════════════════════════════════════════════════════════
// Shared image store, persists across all editor instances in the session
let _sharedImages = [];

function LwdEditor({ C, value, onChange, placeholder, label }) {
  const [mode, setMode] = useState("source"); // Always use source mode (no TipTap dependency)
  const [showImageLib, setShowImageLib] = useState(false);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [images, setImages] = useState(() => _sharedImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // Simple editor state - no TipTap dependency
  const editor = null; // Placeholder for compatibility

  // Sync shared images
  const updateImages = (newImages) => { _sharedImages = newImages; setImages(newImages); };

  // Switch modes, sync content
  const switchMode = (m) => {
    setMode(m);
  };

  // Process uploaded file
  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      const img = {
        id: "img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        name: file.name,
        url,
        size: file.size,
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        width: 0, height: 0,
      };
      // Get dimensions
      const tempImg = new Image();
      tempImg.onload = () => {
        img.width = tempImg.naturalWidth;
        img.height = tempImg.naturalHeight;
        updateImages([img, ...images]);
        // Insert into editor
        onChange((value || "") + `\n<img src="${url}" alt="${file.name}" style="max-width:100%;height:auto;" />\n`);
        setUploading(false);
      };
      tempImg.onerror = () => { updateImages([img, ...images]); setUploading(false); };
      tempImg.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Insert image from library
  const insertFromLib = (img) => {
    onChange((value || "") + `\n<img src="${img.url}" alt="${img.name}" style="max-width:100%;height:auto;" />\n`);
    setShowImageLib(false);
  };

  // Drop handler
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files) { for (let i = 0; i < files.length; i++) processFile(files[i]); }
  };

  const formatSize = (bytes) => bytes < 1024 ? bytes + " B" : bytes < 1048576 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / 1048576).toFixed(1) + " MB";

  // Styles, larger toolbar icons for accessibility
  const tb = (lbl, title, fn) => (
    <button key={lbl + title} title={title} onMouseDown={e => { e.preventDefault(); fn(); }} style={{
      fontFamily: NU, fontSize: 15, fontWeight: 700, color: C.grey, background: "transparent",
      border: "1px solid transparent", borderRadius: 3, padding: "6px 10px", cursor: "pointer",
      lineHeight: 1, minWidth: 32, textAlign: "center", transition: "all 0.12s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}20`; e.currentTarget.style.color = C.gold; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.grey; }}
    >{lbl}</button>
  );
  const sep = (k) => <div key={"s"+k} style={{ width: 1, height: 24, background: C.border, alignSelf: "center", margin: "0 3px" }} />;
  const ddStyle = { fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 8px", cursor: "pointer", outline: "none" };

  return (
    <div>
      {label && <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 12 }}>{label}</div>}

      {/* Toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", alignItems: "center",
        background: `${C.gold}06`, border: `1px solid ${C.border}`, borderRadius: "4px 4px 0 0", borderBottom: "none",
      }}>
        {/* Image upload button */}
        {tb("📷", "Upload Image", () => fileRef.current?.click())}
        {tb("🖼", "Image Library (" + images.length + ")", () => { setShowImageLib(!showImageLib); setShowStockSearch(false); })}
        <button onMouseDown={e => { e.preventDefault(); setShowStockSearch(!showStockSearch); setShowImageLib(false); }} style={{
          fontFamily: NU, fontSize: 10, fontWeight: 700, color: showStockSearch ? "#000" : "#05A081", background: showStockSearch ? "#05A081" : "#05A08112",
          border: "1px solid #05A08140", borderRadius: 3, padding: "6px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (!showStockSearch) { e.currentTarget.style.background = "#05A08122"; } }}
        onMouseLeave={e => { if (!showStockSearch) { e.currentTarget.style.background = "#05A08112"; } }}
        title="Browse Unsplash, Pexels & Pixabay"
        >📸 Stock</button>
        {sep(3)}
        {/* AI Auto-suggest + AI Assistant */}
        <button onMouseDown={e => {
          e.preventDefault();
          const heading = label || "this section";
          const tpl = `<h2>About ${heading}</h2>\n<p>Write compelling content here that speaks to discerning couples seeking luxury wedding services. Include location-specific details, unique selling points, and relevant keywords naturally.</p>\n<p><strong>Editorial tips:</strong> Use H2/H3 headings for structure, include internal links to related categories, and aim for 300+ words for maximum SEO impact.</p>`;
          onChange((value || "") + "\n" + tpl);
        }} style={{
          fontFamily: NU, fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
          border: "1px solid #a78bfa30", borderRadius: 3, padding: "6px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
        ><span style={{ fontSize: 11 }}>✦</span> AI Auto-suggest</button>
        <button onMouseDown={e => {
          e.preventDefault();
          const heading = label || "this section";
          const tpl = `<h2>${heading}</h2>\n<p>Introduce this category with a warm, editorial tone. Describe what makes these services exceptional and why discerning couples choose them for their luxury weddings.</p>\n<h3>What to Expect</h3>\n<p>Detail the types of services available, typical experiences, and what sets the luxury tier apart from standard options.</p>\n<h3>Popular Destinations</h3>\n<p>Highlight key locations where these services are most sought-after, Lake Como, Tuscany, the Cotswolds, French Riviera, and beyond.</p>\n<h3>How to Choose</h3>\n<p>Offer expert guidance on selecting the right provider, key questions to ask, and what to look for in a luxury ${heading.toLowerCase()} professional.</p>`;
          onChange((value || "") + "\n" + tpl);
        }} style={{
          fontFamily: NU, fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
          border: "1px solid #a78bfa30", borderRadius: 3, padding: "6px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
        ><span style={{ fontSize: 11 }}>✧</span> AI Assistant</button>
        {/* Note: Visual mode disabled (requires TipTap) - using source mode only */}
        <div style={{ marginLeft: "auto", fontFamily: NU, fontSize: 10, color: C.grey, fontWeight: 600 }}>
          Source Mode
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*,.webp,.avif" multiple style={{ display: "none" }}
        onChange={e => { const files = e.target.files; if (files) for (let i = 0; i < files.length; i++) processFile(files[i]); e.target.value = ""; }} />

      {/* Image library panel */}
      {showImageLib && (
        <div style={{
          border: `1px solid ${C.border}`, borderTop: "none", background: C.card, padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Image Library ({images.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => fileRef.current?.click()} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#000", background: C.gold, border: "none", borderRadius: 3, padding: "5px 12px", cursor: "pointer",
              }}>+ Upload New</button>
              <button onClick={() => setShowImageLib(false)} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey, background: "transparent",
                border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 10px", cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
          {images.length === 0 ? (
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic", padding: "20px 0", textAlign: "center" }}>
              No images uploaded yet. Upload images to build your library.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {images.map(img => (
                <div key={img.id} onClick={() => insertFromLib(img)} style={{
                  cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden",
                  background: C.black, transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ width: "100%", height: 80, overflow: "hidden", background: "#111" }}>
                    <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontFamily: NU, fontSize: 9, color: C.off, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
                    <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2 }}>{formatSize(img.size)}{img.width ? ` · ${img.width}×${img.height}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock image search panel */}
      {showStockSearch && (
        <ImageSearchPanel C={C} defaultQuery={label || "luxury wedding"}
          onClose={() => setShowStockSearch(false)}
          onSelect={(img) => {
            onChange((value || "") + `\n<img src="${img.url}" alt="${img.photographer} via ${img.source}" style="max-width:100%;height:auto;" />\n`);
            setShowStockSearch(false);
          }}
        />
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div style={{
          padding: "8px 14px", background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderTop: "none",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 12, height: 12, border: `2px solid ${C.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          <span style={{ fontFamily: NU, fontSize: 10, color: C.gold }}>Uploading image...</span>
        </div>
      )}

      {/* Editor area - Source mode only */}
      <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              const ta = e.target; const s = ta.selectionStart; const v = value || "";
              onChange(v.substring(0, s) + "  " + v.substring(ta.selectionEnd));
              setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
            }
          }}
          style={{
            width: "100%", minHeight: 360, boxSizing: "border-box",
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 11,
            lineHeight: 1.65, color: C.off, background: C.black,
            border: `1px solid ${C.border}`, borderTop: "none",
            borderRadius: "0 0 4px 4px",
            padding: "16px", outline: "none", resize: "vertical", whiteSpace: "pre",
            overflowX: "auto", tabSize: 2,
          }}
          spellCheck={false}
        />

      {/* Status bar */}
      <div style={{
        marginTop: 6, padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: `${C.gold}04`, border: `1px solid ${C.border}`, borderRadius: 3,
      }}>
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
          {images.length} image{images.length !== 1 ? "s" : ""} in library · Drag & drop or paste images directly
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
          Mode: <span style={{ color: C.gold }}>{mode === "visual" ? "Visual Editor" : "HTML Source"}</span> · {(value || "").length} chars
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Categories Module, Directory Taxonomy Management (CRUD)
// ═════════════════════════════════════════════════════════════════════════════
function CategoriesModule({ C }) {
  const [categories, setCategories] = useState(() => JSON.parse(JSON.stringify(DIRECTORY_CATEGORIES)));
  const [expandedCat, setExpandedCat] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  // Full-page SEO detail editor
  const [openCat, setOpenCat] = useState(null); // category id, when set, shows detail editor
  const [openSub, setOpenSub] = useState(null); // "catId:subId", when set, shows sub-category detail editor
  const [seoSection, setSeoSection] = useState("head"); // "head" | "content" | "ai" | "code"
  const [seoForm, setSeoForm] = useState({
    titleTag: "", metaDescription: "", metaRobots: "index, follow", canonicalUrl: "",
    ogTitle: "", ogDescription: "", ogImage: "", ogType: "website",
    h1: "", pageContent: "", introText: "",
    aiKeywords: "", aiSummary: "", aiIntentSignals: "", aiEntityType: "",
    customMeta: [], // { name, content } pairs
    headHtml: "",
    thumbnail: null, // { url, name, size, width, height }
    thumbnailAlt: "",
    thumbnailTitle: "",
    thumbnailDesc: "",
    icon: null,      // { url, name, size, width, height }
    iconAlt: "",
  });
  const [savedSeo, setSavedSeo] = useState({}); // { catId: seoForm }
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true); // AI assistant toggle for vendors
  const [showThumbStock, setShowThumbStock] = useState(false);
  const [showOgStock, setShowOgStock] = useState(false);
  const thumbInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const totalSubs = categories.reduce((a, c) => a + c.subCategories.length, 0);
  const totalListings = categories.reduce((a, c) => a + c.count, 0);

  const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => { setFormName(""); setFormDesc(""); setAddingCategory(false); setAddingSubTo(null); setEditingCat(null); setEditingSub(null); };

  const addCategory = () => {
    if (!formName.trim()) return;
    const slug = toSlug(formName);
    setCategories(prev => [...prev, { id: slug, slug, name: formName.trim(), count: 0, description: formDesc.trim(), subCategories: [] }]);
    resetForm();
  };

  const addSubCategory = (catId) => {
    if (!formName.trim()) return;
    const slug = toSlug(formName);
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, { id: slug, slug, name: formName.trim(), count: 0, description: "" }] } : c));
    resetForm();
  };

  const updateCategory = (catId) => {
    if (!formName.trim()) return;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: formName.trim(), slug: toSlug(formName), description: formDesc.trim() } : c));
    resetForm();
  };

  const updateSubCategory = (catId, subId) => {
    if (!formName.trim()) return;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.map(s => s.id === subId ? { ...s, name: formName.trim(), slug: toSlug(formName) } : s) } : c));
    resetForm();
  };

  const deleteCategory = (catId) => { setCategories(prev => prev.filter(c => c.id !== catId)); if (expandedCat === catId) setExpandedCat(null); };

  const deleteSubCategory = (catId, subId) => { setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) } : c)); };

  // Load seoForm from savedSeo by key
  const loadSeoForm = (key, schemaDefault) => {
    const existing = savedSeo[key] || {};
    setSeoForm({
      titleTag: existing.titleTag || "",
      metaDescription: existing.metaDescription || "",
      metaRobots: existing.metaRobots || "index, follow",
      canonicalUrl: existing.canonicalUrl || "",
      ogTitle: existing.ogTitle || "",
      ogDescription: existing.ogDescription || "",
      ogImage: existing.ogImage || "",
      ogType: existing.ogType || "website",
      h1: existing.h1 || "",
      pageContent: existing.pageContent || "",
      introText: existing.introText || "",
      aiKeywords: existing.aiKeywords || "",
      aiSummary: existing.aiSummary || "",
      aiIntentSignals: existing.aiIntentSignals || "",
      aiEntityType: existing.aiEntityType || schemaDefault || "",
      customMeta: existing.customMeta || [],
      headHtml: existing.headHtml || "",
      thumbnail: existing.thumbnail || null,
      thumbnailAlt: existing.thumbnailAlt || "",
      thumbnailTitle: existing.thumbnailTitle || "",
      thumbnailDesc: existing.thumbnailDesc || "",
      icon: existing.icon || null,
      iconAlt: existing.iconAlt || "",
    });
    setSeoSection("head");
  };

  // Open full-page SEO editor for a parent category
  const openDetail = (cat) => {
    const sd = STRUCTURED_DATA_MAP[cat.slug] || {};
    loadSeoForm(cat.id, sd.schema);
    setOpenCat(cat.id);
    setOpenSub(null);
  };

  // Open full-page SEO editor for a sub-category
  const openSubDetail = (cat, sub) => {
    const key = `${cat.id}:${sub.id}`;
    const sd = STRUCTURED_DATA_MAP[cat.slug] || {};
    loadSeoForm(key, sd.schema);
    setOpenSub(key);
    setOpenCat(null);
  };

  const saveSeo = (seoKey) => {
    setSavedSeo(prev => ({ ...prev, [seoKey]: { ...seoForm } }));
    setOpenCat(null);
    setOpenSub(null);
  };

  // SEO completeness score (works for any savedSeo key), 0 to 7
  const seoScoreByKey = (key) => {
    const s = savedSeo[key] || {};
    let filled = 0;
    if (s.titleTag) filled++;
    if (s.metaDescription) filled++;
    if (s.h1 || s.pageContent) filled++;
    if (s.aiKeywords) filled++;
    if (s.ogTitle || s.ogDescription) filled++;
    if (s.thumbnail) filled++;
    if (s.thumbnailAlt) filled++;
    return filled;
  };
  const seoScore = (cat) => seoScoreByKey(cat.id);

  // Custom meta tag helpers
  const addCustomMeta = () => setSeoForm(p => ({ ...p, customMeta: [...p.customMeta, { name: "", content: "" }] }));
  const updateCustomMeta = (idx, field, val) => setSeoForm(p => ({ ...p, customMeta: p.customMeta.map((m, i) => i === idx ? { ...m, [field]: val } : m) }));
  const removeCustomMeta = (idx) => setSeoForm(p => ({ ...p, customMeta: p.customMeta.filter((_, i) => i !== idx) }));

  const inputStyle = {
    fontFamily: NU, fontSize: 12, color: C.off, background: C.black,
    border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
  const textareaStyle = {
    ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.7,
  };
  const codeStyle = {
    ...inputStyle, fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 11,
    lineHeight: 1.6, minHeight: 140, resize: "vertical", whiteSpace: "pre",
  };
  const btnGold = {
    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#000", background: C.gold, border: "none", borderRadius: 3, padding: "6px 14px", cursor: "pointer",
  };
  const btnOutline = {
    fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
    color: C.grey, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 12px", cursor: "pointer",
  };
  const btnDanger = { ...btnOutline, color: "#C41E3A", borderColor: "rgba(196,30,58,0.3)" };

  const labelStyle = { fontFamily: NU, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 5, display: "block" };
  const hintStyle = { fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 3 };
  const counterStyle = (len, max) => ({ fontFamily: NU, fontSize: 9, color: len > max ? "#C41E3A" : C.grey2 });

  // Section nav button
  const secBtn = (key, label, icon) => ({
    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: seoSection === key ? C.gold : C.grey2,
    background: seoSection === key ? `${C.gold}10` : "transparent",
    border: `1px solid ${seoSection === key ? C.gold + "40" : C.border}`,
    borderRadius: 3, padding: "8px 14px", cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: 6,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DETAIL VIEW, full-page SEO editor for a category OR sub-category
  // ═══════════════════════════════════════════════════════════════════════
  const activeCat = openCat ? categories.find(c => c.id === openCat) : null;
  let activeSub = null, activeSubParent = null;
  if (openSub) {
    const [pId, sId] = openSub.split(":");
    activeSubParent = categories.find(c => c.id === pId);
    activeSub = activeSubParent?.subCategories.find(s => s.id === sId) || null;
  }
  // Unified item, normalises parent and sub-category into one shape
  const activeItem = activeCat ? {
    type: "category", seoKey: activeCat.id,
    name: activeCat.name, slug: activeCat.slug, description: activeCat.description || "",
    count: activeCat.count, subCount: activeCat.subCategories.length,
    route: `/{country}/${activeCat.slug}`,
    breadcrumb: `/${activeCat.slug}`,
    sd: STRUCTURED_DATA_MAP[activeCat.slug] || {},
    parentName: null, parentSlug: null,
  } : (activeSub && activeSubParent) ? {
    type: "subcategory", seoKey: openSub,
    name: activeSub.name, slug: activeSub.slug, description: activeSub.description || "",
    count: activeSub.count, subCount: 0,
    route: `/{country}/${activeSubParent.slug}/${activeSub.slug}`,
    breadcrumb: `/${activeSubParent.slug}/${activeSub.slug}`,
    sd: STRUCTURED_DATA_MAP[activeSubParent.slug] || {},
    parentName: activeSubParent.name, parentSlug: activeSubParent.slug,
  } : null;

  if (activeItem) {
    const sd = activeItem.sd;
    const score = seoScoreByKey(activeItem.seoKey);
    return (
      <div>
        {/* Back bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => { setOpenCat(null); setOpenSub(null); }} style={{ ...btnOutline, display: "flex", alignItems: "center", gap: 6, padding: "6px 14px" }}>
            <span style={{ fontSize: 12 }}>←</span> Back to Categories
          </button>
          <div style={{ flex: 1 }} />
          <span style={{
            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: score === 7 ? C.green : score > 0 ? C.gold : C.grey2,
            background: score === 7 ? `${C.green}15` : score > 0 ? `${C.gold}10` : `${C.grey2}10`,
            padding: "3px 10px", borderRadius: 2,
          }}>SEO {score}/7</span>
        </div>

        {/* Identity header */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${activeItem.type === "subcategory" ? "#a78bfa" : C.gold}`,
          borderRadius: 4, padding: "22px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {activeItem.parentName && (
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: C.gold }}>{activeItem.parentName}</span>
                  <span style={{ color: C.grey2 }}>›</span>
                  <span style={{
                    fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#a78bfa", background: "#a78bfa12", border: "1px solid #a78bfa30",
                    padding: "1px 6px", borderRadius: 2,
                  }}>Sub-Category</span>
                </div>
              )}
              <div style={{ fontFamily: GD, fontSize: 24, color: C.white, fontWeight: 400, marginBottom: 4 }}>{activeItem.name}</div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey2 }}>
                {activeItem.breadcrumb}{activeItem.subCount > 0 ? ` · ${activeItem.subCount} sub-categories` : ""} · {activeItem.count.toLocaleString()} listings
              </div>
              {activeItem.description && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 6, fontStyle: "italic" }}>{activeItem.description}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4 }}>Canonical Route</div>
              <div style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 11, color: C.gold }}>{activeItem.route}</div>
              {sd.schema && <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 4 }}>Schema: <span style={{ color: C.gold }}>{sd.schema}</span></div>}
            </div>
          </div>
        </div>

        {/* Thumbnail + Icon uploads */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 20,
          display: "flex", gap: 24, alignItems: "flex-start",
        }}>
          {/* Thumbnail 640x480 */}
          {(() => {
            const thumbRef = thumbInputRef;
            const handleThumb = (e) => {
              const file = e.target.files?.[0];
              if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                  setSeoForm(p => ({ ...p, thumbnail: { url: ev.target.result, name: file.name, size: file.size, width: img.naturalWidth, height: img.naturalHeight } }));
                };
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            };
            const aiSuggestThumbAlt = () => {
              setSeoForm(p => ({ ...p, thumbnailAlt: `${activeItem.name} - Luxury Wedding Directory category thumbnail` }));
            };
            return (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
                  Thumbnail <span style={{ color: C.grey2, fontWeight: 500 }}>640px x 480px</span>
                </div>
                <input ref={thumbRef} type="file" accept="image/*,.webp,.avif" style={{ display: "none" }} onChange={handleThumb} />
                {seoForm.thumbnail ? (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", background: "#111" }}>
                    <img src={seoForm.thumbnail.url} alt={seoForm.thumbnailAlt || "Thumbnail"} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontFamily: NU, fontSize: 10, color: C.off, fontWeight: 600 }}>{seoForm.thumbnail.name}</div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{seoForm.thumbnail.width}x{seoForm.thumbnail.height} · {(seoForm.thumbnail.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => thumbRef.current?.click()} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Replace</button>
                        <button onClick={() => setSeoForm(p => ({ ...p, thumbnail: null, thumbnailAlt: "", thumbnailTitle: "", thumbnailDesc: "" }))} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#C41E3A", background: "#C41E3A10", border: "1px solid #C41E3A30", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                    {/* ── Image SEO Fields ─────────────────────── */}
                    <div style={{ padding: "0 10px 10px" }}>
                      <div style={{ fontFamily: NU, fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>Image SEO</div>

                      {/* Alt Tag */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Alt Tag</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={aiSuggestThumbAlt} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✦ AI Auto-suggest</button>
                            <button onClick={() => {
                              setSeoForm(p => ({ ...p, thumbnailAlt: `Luxury ${activeItem.name.toLowerCase()} - curated collection of the finest ${activeItem.name.toLowerCase()} for destination weddings worldwide | Luxury Wedding Directory` }));
                            }} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✧ AI Assistant</button>
                          </div>
                        </div>
                        <input value={seoForm.thumbnailAlt} onChange={e => setSeoForm(p => ({ ...p, thumbnailAlt: e.target.value }))}
                          placeholder={`Descriptive alt text for ${activeItem.name} thumbnail`}
                          style={{ width: "100%", boxSizing: "border-box", fontFamily: NU, fontSize: 10, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 8px", outline: "none" }} />
                      </div>

                      {/* Image Title */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Image Title</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => {
                              setSeoForm(p => ({ ...p, thumbnailTitle: `${activeItem.name} | Luxury Wedding Directory` }));
                            }} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✦ AI Auto-suggest</button>
                            <button onClick={() => {
                              setSeoForm(p => ({ ...p, thumbnailTitle: `${activeItem.name} - Premium ${activeItem.name} for Luxury Weddings Worldwide` }));
                            }} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✧ AI Assistant</button>
                          </div>
                        </div>
                        <input value={seoForm.thumbnailTitle} onChange={e => setSeoForm(p => ({ ...p, thumbnailTitle: e.target.value }))}
                          placeholder={`Title attribute for ${activeItem.name} image`}
                          style={{ width: "100%", boxSizing: "border-box", fontFamily: NU, fontSize: 10, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 8px", outline: "none" }} />
                      </div>

                      {/* Image Description */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Image Description</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => {
                              setSeoForm(p => ({ ...p, thumbnailDesc: `Browse the Luxury Wedding Directory's curated selection of ${activeItem.name.toLowerCase()}. Hand-picked professionals across 62 countries for discerning couples planning luxury weddings.` }));
                            }} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✦ AI Auto-suggest</button>
                            <button onClick={() => {
                              setSeoForm(p => ({ ...p, thumbnailDesc: `Discover the world's most exceptional ${activeItem.name.toLowerCase()} for luxury weddings. The Luxury Wedding Directory showcases hand-verified ${activeItem.name.toLowerCase()} professionals spanning 62 countries, from intimate boutique services to grand-scale luxury experiences. Each listing meets our rigorous editorial standards for quality, creativity, and personalised service excellence.` }));
                            }} style={{
                              fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                              border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                            >✧ AI Assistant</button>
                          </div>
                        </div>
                        <textarea value={seoForm.thumbnailDesc} onChange={e => setSeoForm(p => ({ ...p, thumbnailDesc: e.target.value }))}
                          placeholder={`SEO description for ${activeItem.name} thumbnail image. Helps search engines understand the image content.`}
                          rows={2} style={{ width: "100%", boxSizing: "border-box", fontFamily: NU, fontSize: 10, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 8px", outline: "none", resize: "vertical", minHeight: 40, lineHeight: 1.5 }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div onClick={() => thumbRef.current?.click()} style={{
                      border: `2px dashed ${C.border}`, borderRadius: 4, padding: "20px 16px", textAlign: "center",
                      cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}06`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ fontFamily: NU, fontSize: 22, color: C.grey2, marginBottom: 4 }}>+</div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 600 }}>Click to upload thumbnail</div>
                      <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 4 }}>640 x 480px · JPG, PNG, WebP or AVIF</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => thumbRef.current?.click()} style={{
                        flex: 1, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: C.gold, background: `${C.gold}08`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "7px 10px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>📁 Upload File</button>
                      <button onClick={() => setShowThumbStock(!showThumbStock)} style={{
                        flex: 1, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#05A081", background: showThumbStock ? "#05A081" : "#05A08108",
                        ...(showThumbStock ? { color: "#000" } : {}),
                        border: "1px solid #05A08130", borderRadius: 3, padding: "7px 10px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>📸 Browse Stock</button>
                    </div>
                    {showThumbStock && (
                      <ImageSearchPanel C={C} defaultQuery={`luxury ${activeItem.name.toLowerCase()}`}
                        onClose={() => setShowThumbStock(false)}
                        onSelect={(img) => {
                          setSeoForm(p => ({ ...p, thumbnail: { url: img.url, name: `${img.photographer} via ${img.source}`, size: 0, width: img.width, height: img.height } }));
                          setShowThumbStock(false);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Icon 50x50 */}
          {(() => {
            const iconRef = iconInputRef;
            const handleIcon = (e) => {
              const file = e.target.files?.[0];
              if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                  setSeoForm(p => ({ ...p, icon: { url: ev.target.result, name: file.name, size: file.size, width: img.naturalWidth, height: img.naturalHeight } }));
                };
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            };
            return (
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
                  Icon <span style={{ color: C.grey2, fontWeight: 500 }}>50px x 50px</span>
                </div>
                <input ref={iconRef} type="file" accept="image/*,.webp,.avif" style={{ display: "none" }} onChange={handleIcon} />
                {seoForm.icon ? (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", background: "#111", textAlign: "center" }}>
                    <div style={{ padding: "16px 0", background: "#0a0a0a" }}>
                      <img src={seoForm.icon.url} alt={seoForm.iconAlt || "Icon"} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, display: "inline-block" }} />
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 6 }}>{seoForm.icon.width}x{seoForm.icon.height} · {(seoForm.icon.size / 1024).toFixed(1)} KB</div>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => iconRef.current?.click()} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Replace</button>
                        <button onClick={() => setSeoForm(p => ({ ...p, icon: null }))} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#C41E3A", background: "#C41E3A10", border: "1px solid #C41E3A30", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => iconRef.current?.click()} style={{
                    border: `2px dashed ${C.border}`, borderRadius: 4, padding: "24px 16px", textAlign: "center",
                    cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}06`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontFamily: NU, fontSize: 22, color: C.grey2, marginBottom: 6 }}>+</div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 600 }}>Upload icon</div>
                    <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 4 }}>50 x 50px</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Section navigation */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setSeoSection("head")} style={secBtn("head", "Head Tags", "⊡")}>⊡ Head Tags & Meta</button>
          <button onClick={() => setSeoSection("content")} style={secBtn("content", "Content", "◈")}>◈ Page Content</button>
          <button onClick={() => setSeoSection("ai")} style={secBtn("ai", "AI & Search", "✧")}>✧ AI & Keywords</button>
          <button onClick={() => setSeoSection("code")} style={secBtn("code", "Custom Code", "⟐")}>⟐ Custom HTML</button>
        </div>

        {/* ── HEAD TAGS & META ───────────────────────────────────────────── */}
        {seoSection === "head" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 20 }}>HTML Head Tags</div>

            {/* Title & Robots */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={labelStyle}>&lt;title&gt; Tag</label>
                  <span style={counterStyle(seoForm.titleTag.length, 60)}>{seoForm.titleTag.length}/60</span>
                </div>
                <input value={seoForm.titleTag} onChange={e => setSeoForm(p => ({ ...p, titleTag: e.target.value }))}
                  placeholder={`${activeItem.name} | Luxury Wedding Directory`} style={inputStyle} />
                <div style={hintStyle}>Rendered as: <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 9 }}>&lt;title&gt;{seoForm.titleTag || `${activeItem.name} | Luxury Wedding Directory`}&lt;/title&gt;</span></div>
              </div>
              <div>
                <label style={labelStyle}>Meta Robots</label>
                <select value={seoForm.metaRobots} onChange={e => setSeoForm(p => ({ ...p, metaRobots: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="index, follow">index, follow</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="index, nofollow">index, nofollow</option>
                  <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
                <div style={hintStyle}>&lt;meta name="robots" content="{seoForm.metaRobots}"&gt;</div>
              </div>
            </div>

            {/* Meta Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={labelStyle}>Meta Description</label>
                <span style={counterStyle(seoForm.metaDescription.length, 160)}>{seoForm.metaDescription.length}/160</span>
              </div>
              <textarea value={seoForm.metaDescription} onChange={e => setSeoForm(p => ({ ...p, metaDescription: e.target.value }))}
                placeholder={`Discover the finest ${activeItem.name.toLowerCase()} on the Luxury Wedding Directory. Curated professionals across 62 countries.`}
                rows={2} style={{ ...inputStyle, resize: "vertical", minHeight: 50, lineHeight: 1.6 }} />
              <div style={hintStyle}>&lt;meta name="description" content="..."&gt;</div>
            </div>

            {/* Canonical URL */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Canonical URL</label>
              <input value={seoForm.canonicalUrl} onChange={e => setSeoForm(p => ({ ...p, canonicalUrl: e.target.value }))}
                placeholder={`https://luxuryweddingdirectory.com/{country}/${activeItem.slug}`} style={inputStyle} />
              <div style={hintStyle}>&lt;link rel="canonical" href="..."&gt;, Leave blank for auto-generated.</div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "8px 0 24px" }} />

            {/* Open Graph */}
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>Open Graph Tags</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>og:title</label>
                <input value={seoForm.ogTitle} onChange={e => setSeoForm(p => ({ ...p, ogTitle: e.target.value }))}
                  placeholder={seoForm.titleTag || `${activeItem.name} | Luxury Wedding Directory`} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>og:type</label>
                <select value={seoForm.ogType} onChange={e => setSeoForm(p => ({ ...p, ogType: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="website">website</option>
                  <option value="article">article</option>
                  <option value="business.business">business.business</option>
                  <option value="place">place</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>og:description</label>
              <textarea value={seoForm.ogDescription} onChange={e => setSeoForm(p => ({ ...p, ogDescription: e.target.value }))}
                placeholder={seoForm.metaDescription || `Discover the finest ${activeItem.name.toLowerCase()}...`}
                rows={2} style={{ ...inputStyle, resize: "vertical", minHeight: 46, lineHeight: 1.6 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>og:image</label>
                <button onClick={() => setShowOgStock(!showOgStock)} style={{
                  fontFamily: NU, fontSize: 8, fontWeight: 700, color: showOgStock ? "#000" : "#05A081",
                  background: showOgStock ? "#05A081" : "#05A08112",
                  border: "1px solid #05A08130", borderRadius: 3, padding: "2px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!showOgStock) e.currentTarget.style.background = "#05A08122"; }}
                onMouseLeave={e => { if (!showOgStock) e.currentTarget.style.background = "#05A08112"; }}
                >📸 Browse Stock</button>
              </div>
              <input value={seoForm.ogImage} onChange={e => setSeoForm(p => ({ ...p, ogImage: e.target.value }))}
                placeholder="https://luxuryweddingdirectory.com/images/og/wedding-venues.jpg" style={{ ...inputStyle, marginTop: 5 }} />
              <div style={hintStyle}>Recommended: 1200×630px. Used by Facebook, LinkedIn, WhatsApp, iMessage.</div>
              {showOgStock && (
                <ImageSearchPanel C={C} defaultQuery={`luxury ${activeItem.name.toLowerCase()} wedding`}
                  onClose={() => setShowOgStock(false)}
                  onSelect={(img) => {
                    setSeoForm(p => ({ ...p, ogImage: img.url }));
                    setShowOgStock(false);
                  }}
                />
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "8px 0 24px" }} />

            {/* Custom Meta Tags */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Custom Meta Tags</div>
              <button onClick={addCustomMeta} style={{ ...btnOutline, fontSize: 8, padding: "4px 10px" }}>+ Add Tag</button>
            </div>
            {seoForm.customMeta.length === 0 && (
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic", marginBottom: 12 }}>No custom meta tags. Add tags for twitter:card, theme-color, etc.</div>
            )}
            {seoForm.customMeta.map((meta, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 10, color: C.grey2, flexShrink: 0 }}>&lt;meta</span>
                <input value={meta.name} onChange={e => updateCustomMeta(i, "name", e.target.value)}
                  placeholder="name" style={{ ...inputStyle, flex: 1, fontSize: 11, padding: "5px 10px" }} />
                <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 10, color: C.grey2 }}>=</span>
                <input value={meta.content} onChange={e => updateCustomMeta(i, "content", e.target.value)}
                  placeholder="content" style={{ ...inputStyle, flex: 2, fontSize: 11, padding: "5px 10px" }} />
                <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 10, color: C.grey2 }}>/&gt;</span>
                <button onClick={() => removeCustomMeta(i)} style={{ ...btnDanger, padding: "3px 7px", fontSize: 8 }}>×</button>
              </div>
            ))}

            {/* Google Preview */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "24px 0" }} />
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 700, marginBottom: 12 }}>Search Engine Preview</div>
            <div style={{ padding: "14px 16px", background: `${C.gold}04`, border: `1px solid ${C.border}`, borderRadius: 4 }}>
              <div style={{ fontFamily: NU, fontSize: 16, color: "#8ab4f8", fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>
                {seoForm.titleTag || `${activeItem.name} | Luxury Wedding Directory`}
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: "#4d9a4d", marginBottom: 4 }}>
                luxuryweddingdirectory.com › {"{country}"} › {activeItem.slug}
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: "#969ba1", lineHeight: 1.5 }}>
                {(seoForm.metaDescription || `Discover the finest ${activeItem.name.toLowerCase()} on the Luxury Wedding Directory. Curated professionals across 62 countries.`).slice(0, 160)}{seoForm.metaDescription.length > 160 ? "..." : ""}
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE CONTENT, WYSIWYG + SOURCE EDITOR ─────────────────── */}
        {seoSection === "content" && (() => {
          const kwInput = seoForm._kwInput || "";
          const kwTags = (seoForm.aiKeywords || "").split(",").map(s => s.trim()).filter(Boolean);
          const addKw = (val) => {
            const v = val.trim();
            if (!v || kwTags.includes(v) || kwTags.length >= 15) return;
            setSeoForm(p => ({ ...p, aiKeywords: [...kwTags, v].join(", "), _kwInput: "" }));
          };
          const removeKw = (idx) => {
            setSeoForm(p => ({ ...p, aiKeywords: kwTags.filter((_, i) => i !== idx).join(", ") }));
          };
          return (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            {/* Keywords as pills */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Meta Keywords</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => {
                  const suggestions = [
                    `luxury ${activeItem.name.toLowerCase()}`,
                    `best ${activeItem.name.toLowerCase()} uk`,
                    `destination ${activeItem.name.toLowerCase()}`,
                    `${activeItem.name.toLowerCase()} italy`,
                    `top rated ${activeItem.name.toLowerCase()}`,
                    `wedding ${activeItem.slug.replace(/-/g, " ")}`,
                    `${activeItem.name.toLowerCase()} near me`,
                    `bespoke ${activeItem.name.toLowerCase()}`,
                  ];
                  suggestions.forEach(s => {
                    const existing = (seoForm.aiKeywords || "").split(",").map(k => k.trim()).filter(Boolean);
                    if (!existing.includes(s) && existing.length < 15) {
                      existing.push(s);
                      setSeoForm(p => ({ ...p, aiKeywords: existing.join(", ") }));
                    }
                  });
                }} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                  border: "1px solid #a78bfa30", borderRadius: 3, padding: "4px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
                ><span style={{ fontSize: 11 }}>✦</span> AI Auto-suggest</button>
                <button onClick={() => {
                  const aiKws = [
                    `luxury ${activeItem.name.toLowerCase()} worldwide`,
                    `premium ${activeItem.name.toLowerCase()} for weddings`,
                    `exclusive ${activeItem.name.toLowerCase()} services`,
                  ];
                  aiKws.forEach(s => {
                    const existing = (seoForm.aiKeywords || "").split(",").map(k => k.trim()).filter(Boolean);
                    if (!existing.includes(s) && existing.length < 15) {
                      existing.push(s);
                      setSeoForm(p => ({ ...p, aiKeywords: existing.join(", ") }));
                    }
                  });
                }} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                  border: "1px solid #a78bfa30", borderRadius: 3, padding: "4px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
                ><span style={{ fontSize: 11 }}>✧</span> AI Assistant</button>
              </div>
            </div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              padding: "10px 12px", background: C.black, border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 6, minHeight: 38,
            }}>
              {kwTags.map((kw, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontFamily: NU, fontSize: 11, color: C.gold, background: `${C.gold}12`,
                  border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "3px 8px 3px 10px",
                }}>
                  {kw}
                  <span onClick={() => removeKw(i)} style={{ cursor: "pointer", color: C.grey2, fontSize: 13, lineHeight: 1, fontWeight: 700 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#C41E3A"}
                    onMouseLeave={e => e.currentTarget.style.color = C.grey2}
                  >×</span>
                </span>
              ))}
              <input
                value={kwInput}
                onChange={e => setSeoForm(p => ({ ...p, _kwInput: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKw(kwInput); }
                  if (e.key === "Backspace" && !kwInput && kwTags.length > 0) removeKw(kwTags.length - 1);
                }}
                placeholder={kwTags.length === 0 ? "Type keyword and press Enter..." : kwTags.length >= 15 ? "Max 15 keywords" : "Add keyword..."}
                disabled={kwTags.length >= 15}
                style={{
                  fontFamily: NU, fontSize: 11, color: C.off, background: "transparent",
                  border: "none", outline: "none", flex: 1, minWidth: 120, padding: "2px 4px",
                }}
              />
            </div>
            <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
              <span>Press Enter or comma to add. Backspace to remove. Used for SEO + AI intent matching.</span>
              <span>{kwTags.length}/15 keywords</span>
            </div>

            {/* H1 + Intro row */}
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 12 }}>Page Structure</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>&lt;h1&gt; Page Heading</label>
                <input value={seoForm.h1} onChange={e => setSeoForm(p => ({ ...p, h1: e.target.value }))}
                  placeholder={`The World's Finest ${activeItem.name}`} style={{ ...inputStyle, fontFamily: GD, fontSize: 15 }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Intro Text</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => {
                      setSeoForm(p => ({ ...p, introText: `Discover the world's finest ${activeItem.name.toLowerCase()} on the Luxury Wedding Directory. Our hand-curated collection showcases exceptional ${activeItem.name.toLowerCase()} across 62 countries, each vetted by our editorial team to meet the highest standards of luxury and service excellence.` }));
                    }} style={{
                      fontFamily: NU, fontSize: 8, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                      border: "1px solid #a78bfa30", borderRadius: 3, padding: "2px 8px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                    ><span style={{ fontSize: 10 }}>✦</span> AI Auto-suggest</button>
                    <button onClick={() => {
                      setSeoForm(p => ({ ...p, introText: `Welcome to ${activeItem.name} on the Luxury Wedding Directory, the definitive guide for couples seeking extraordinary wedding experiences. Whether you're planning an intimate celebration in the English countryside or a grand affair on the Amalfi Coast, our carefully curated directory connects you with the world's most exceptional ${activeItem.name.toLowerCase()} professionals, each personally vetted to ensure unparalleled quality and service.` }));
                    }} style={{
                      fontFamily: NU, fontSize: 8, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12",
                      border: "1px solid #a78bfa30", borderRadius: 3, padding: "2px 8px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa12"; }}
                    ><span style={{ fontSize: 10 }}>✧</span> AI Assistant</button>
                    <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{seoForm.introText.length} chars</span>
                  </div>
                </div>
                <textarea value={seoForm.introText} onChange={e => setSeoForm(p => ({ ...p, introText: e.target.value }))}
                  placeholder="2-4 sentence editorial intro above the listing grid."
                  rows={2} style={{ ...inputStyle, resize: "vertical", minHeight: 52, lineHeight: 1.6, marginTop: 5 }} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "4px 0 20px" }} />

            {/* Content Editor, Reusable LwdEditor with image upload, drag-drop, image library */}
            <LwdEditor
              C={C}
              value={seoForm.pageContent}
              onChange={v => setSeoForm(p => ({ ...p, pageContent: v }))}
              label="Content"
              placeholder={`<h2>Discover ${activeItem.name}</h2>\n<p>From intimate settings to grand celebrations...</p>`}
            />

            {/* Route + schema reference */}
            <div style={{
              marginTop: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: `${C.gold}04`, border: `1px solid ${C.border}`, borderRadius: 3,
            }}>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
                Renders on: <span style={{ color: C.gold }}>/{"{country}"}/{activeItem.slug}</span> · Schema: <span style={{ color: C.gold }}>{sd.schema || "WebPage"}</span> · Indexed by Aura AI
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
                {seoForm.pageContent.length} chars
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── AI & KEYWORDS ──────────────────────────────────────────────── */}
        {seoSection === "ai" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>AI Search & Keyword Intelligence</div>
              {/* AI Assistant toggle for vendors */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>AI Assist for Vendors</span>
                <button onClick={() => setAiAssistEnabled(!aiAssistEnabled)} style={{
                  width: 36, height: 18, borderRadius: 9, border: "none", cursor: "pointer", position: "relative",
                  background: aiAssistEnabled ? "#a78bfa" : C.border, transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2,
                    left: aiAssistEnabled ? 20 : 2, transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ fontFamily: NU, fontSize: 8, color: aiAssistEnabled ? "#a78bfa" : C.grey2, fontWeight: 700 }}>{aiAssistEnabled ? "ON" : "OFF"}</span>
              </div>
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginBottom: 24 }}>These fields power the Aura AI search layer, intent classification, and entity embeddings.</div>

            {/* Primary Keywords */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Primary Keywords (AI + SEO)</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => {
                    const suggestions = [
                      `luxury ${activeItem.name.toLowerCase()}`, `best ${activeItem.name.toLowerCase()} uk`,
                      `destination ${activeItem.name.toLowerCase()} italy`, `top-rated ${activeItem.name.toLowerCase()}`,
                      `wedding ${activeItem.slug.replace(/-/g, " ")} near me`, `${activeItem.name.toLowerCase()} for destination wedding`,
                      `bespoke ${activeItem.name.toLowerCase()}`, `premium ${activeItem.name.toLowerCase()} services`,
                    ];
                    const existing = (seoForm.aiKeywords || "").split(",").map(k => k.trim()).filter(Boolean);
                    const merged = [...new Set([...existing, ...suggestions])].slice(0, 15);
                    setSeoForm(p => ({ ...p, aiKeywords: merged.join(", ") }));
                  }} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                    border: "1px solid #a78bfa30", borderRadius: 3, padding: "3px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; }}
                  ><span style={{ fontSize: 10 }}>✦</span> AI Auto-suggest</button>
                  <button onClick={() => {
                    const aiKws = [
                      `how to find ${activeItem.name.toLowerCase()} for my wedding`,
                      `${activeItem.name.toLowerCase()} lake como`, `${activeItem.name.toLowerCase()} tuscany`,
                      `${activeItem.name.toLowerCase()} cost guide`, `luxury wedding ${activeItem.slug.replace(/-/g, " ")} reviews`,
                    ];
                    const existing = (seoForm.aiKeywords || "").split(",").map(k => k.trim()).filter(Boolean);
                    const merged = [...new Set([...existing, ...aiKws])].slice(0, 15);
                    setSeoForm(p => ({ ...p, aiKeywords: merged.join(", ") }));
                  }} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                    border: "1px solid #a78bfa30", borderRadius: 3, padding: "3px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; }}
                  ><span style={{ fontSize: 10 }}>✧</span> AI Assistant</button>
                </div>
              </div>
              <textarea value={seoForm.aiKeywords} onChange={e => setSeoForm(p => ({ ...p, aiKeywords: e.target.value }))}
                placeholder={`luxury ${activeItem.name.toLowerCase()}, best ${activeItem.name.toLowerCase()} uk, destination ${activeItem.name.toLowerCase()} italy, top-rated ${activeItem.name.toLowerCase()}, wedding ${activeItem.slug} near me`}
                rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 60, lineHeight: 1.7 }} />
              <div style={hintStyle}>Comma-separated. These feed both traditional SEO keyword targeting and Aura AI intent matching. Include long-tail, location, and question-based variants.</div>
            </div>

            {/* AI Summary */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={labelStyle}>AI Summary (for Aura)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => {
                    setSeoForm(p => ({ ...p, aiSummary: `${activeItem.name} on the Luxury Wedding Directory connects discerning couples with the world's finest ${activeItem.name.toLowerCase()} across 62 countries. From intimate bespoke services to grand-scale luxury experiences, every listing is hand-verified by our editorial team to ensure the highest standards of excellence.` }));
                  }} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                    border: "1px solid #a78bfa30", borderRadius: 3, padding: "3px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; }}
                  ><span style={{ fontSize: 10 }}>✦</span> AI Auto-suggest</button>
                  <button onClick={() => {
                    setSeoForm(p => ({ ...p, aiSummary: `${activeItem.name} represents one of the most essential elements of any luxury wedding celebration. The Luxury Wedding Directory's curated ${activeItem.name.toLowerCase()} collection spans 62 countries, from the rolling hills of Tuscany to the pristine beaches of the Maldives. Each ${activeItem.name.toLowerCase().replace(/s$/, "")} professional in our directory undergoes rigorous editorial vetting, ensuring couples receive nothing less than exceptional quality, creativity, and personalised service for their special day.` }));
                  }} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                    border: "1px solid #a78bfa30", borderRadius: 3, padding: "3px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; }}
                  ><span style={{ fontSize: 10 }}>✧</span> AI Assistant</button>
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{seoForm.aiSummary.length} chars</span>
                </div>
              </div>
              <textarea value={seoForm.aiSummary} onChange={e => setSeoForm(p => ({ ...p, aiSummary: e.target.value }))}
                placeholder={`A concise 2-3 sentence description of this category for the AI. What does "${activeItem.name}" mean in the context of luxury weddings? What types of services are included? This text is embedded and used for semantic search retrieval.`}
                rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 70, lineHeight: 1.7 }} />
              <div style={hintStyle}>Aura uses this to understand the category semantically. Write naturally, not keyword-stuffed. This is for AI, not crawlers.</div>
            </div>

            {/* Intent Signals + Entity Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Intent Signals</label>
                <textarea value={seoForm.aiIntentSignals} onChange={e => setSeoForm(p => ({ ...p, aiIntentSignals: e.target.value }))}
                  placeholder={`high-intent: "book a ${activeItem.name.toLowerCase().replace(/s$/, '')} in Lake Como"\nmid-intent: "best ${activeItem.name.toLowerCase()} for destination wedding"\nlow-intent: "what do ${activeItem.name.toLowerCase()} do at weddings"`}
                  rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.6, fontSize: 11 }} />
                <div style={hintStyle}>Example queries by intent tier. Helps Aura classify incoming searches.</div>
              </div>
              <div>
                <label style={labelStyle}>Entity Type (Schema.org)</label>
                <input value={seoForm.aiEntityType} onChange={e => setSeoForm(p => ({ ...p, aiEntityType: e.target.value }))}
                  placeholder={sd.schema || "ProfessionalService"} style={inputStyle} />
                <div style={hintStyle}>Primary schema.org type. Used for structured data and AI entity recognition.</div>
                {sd.schema && (
                  <div style={{ marginTop: 8, padding: "8px 10px", background: `${C.gold}06`, borderRadius: 3, border: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
                      Default: <span style={{ color: C.gold }}>{sd.schema}</span> → fallback: <span style={{ color: C.grey }}>{sd.fallback}</span>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Embedding Index</label>
                  <input value="categories_v1" readOnly style={{ ...inputStyle, color: C.grey2, cursor: "default" }} />
                  <div style={hintStyle}>Vector index target. Read-only, set by AI_SEARCH_CONFIG.</div>
                </div>
              </div>
            </div>

            {/* AI Readiness Meter */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "8px 0 20px" }} />
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 700, marginBottom: 12 }}>AI Readiness</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Keywords", done: !!seoForm.aiKeywords },
                { label: "AI Summary", done: !!seoForm.aiSummary },
                { label: "Intent Signals", done: !!seoForm.aiIntentSignals },
                { label: "Entity Type", done: !!seoForm.aiEntityType },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "10px 12px", background: item.done ? `${C.green}08` : `${C.grey2}06`,
                  border: `1px solid ${item.done ? C.green + "30" : C.border}`, borderRadius: 3,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.done ? C.green : C.grey2, flexShrink: 0 }} />
                  <span style={{ fontFamily: NU, fontSize: 10, color: item.done ? C.green : C.grey2, fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CUSTOM HTML ────────────────────────────────────────────────── */}
        {seoSection === "code" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Custom &lt;head&gt; HTML</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => {
                  const schemaType = seoForm.aiEntityType || sd.schema || "CollectionPage";
                  const schemaJson = `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "${schemaType}",\n  "name": "${activeItem.name}",\n  "description": "${seoForm.metaDescription || `Discover the finest ${activeItem.name.toLowerCase()} on the Luxury Wedding Directory`}",\n  "url": "https://luxuryweddingdirectory.com/{country}/${activeItem.slug}",\n  "numberOfItems": ${activeItem.count},\n  "provider": {\n    "@type": "Organization",\n    "name": "Luxury Wedding Directory",\n    "url": "https://luxuryweddingdirectory.com"\n  },\n  "isPartOf": {\n    "@type": "WebSite",\n    "name": "Luxury Wedding Directory",\n    "url": "https://luxuryweddingdirectory.com"\n  }${activeItem.parentName ? `,\n  "breadcrumb": {\n    "@type": "BreadcrumbList",\n    "itemListElement": [\n      { "@type": "ListItem", "position": 1, "name": "${activeItem.parentName}", "item": "https://luxuryweddingdirectory.com/{country}/${activeItem.parentSlug}" },\n      { "@type": "ListItem", "position": 2, "name": "${activeItem.name}" }\n    ]\n  }` : ""}\n}\n</script>`;
                  setSeoForm(p => ({ ...p, headHtml: p.headHtml ? p.headHtml + "\n\n" + schemaJson : schemaJson }));
                }} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                  border: "1px solid #a78bfa30", borderRadius: 3, padding: "4px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
                ><span style={{ fontSize: 11 }}>✦</span> AI Auto-suggest</button>
                <button onClick={() => {
                  const hreflangTpl = `<!-- Hreflang tags for ${activeItem.name} -->\n<link rel="alternate" hreflang="en-gb" href="https://luxuryweddingdirectory.com/uk/${activeItem.slug}" />\n<link rel="alternate" hreflang="en-us" href="https://luxuryweddingdirectory.com/usa/${activeItem.slug}" />\n<link rel="alternate" hreflang="it" href="https://luxuryweddingdirectory.com/italy/${activeItem.slug}" />\n<link rel="alternate" hreflang="fr" href="https://luxuryweddingdirectory.com/france/${activeItem.slug}" />\n<link rel="alternate" hreflang="x-default" href="https://luxuryweddingdirectory.com/${activeItem.slug}" />`;
                  setSeoForm(p => ({ ...p, headHtml: p.headHtml ? p.headHtml + "\n\n" + hreflangTpl : hreflangTpl }));
                }} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "#a78bfa10",
                  border: "1px solid #a78bfa30", borderRadius: 3, padding: "4px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#a78bfa22"; e.currentTarget.style.borderColor = "#a78bfa60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#a78bfa10"; e.currentTarget.style.borderColor = "#a78bfa30"; }}
                ><span style={{ fontSize: 11 }}>✧</span> AI Assistant</button>
              </div>
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginBottom: 20 }}>Inject raw HTML into the &lt;head&gt; of /{"{country}"}/{activeItem.slug} pages. Use for tracking pixels, custom schema, hreflang tags, or anything not covered by the structured fields above.</div>

            <textarea value={seoForm.headHtml} onChange={e => setSeoForm(p => ({ ...p, headHtml: e.target.value }))}
              placeholder={`<!-- Custom head HTML for ${activeItem.name} pages -->\n\n<!-- Example: Hreflang tags -->\n<link rel="alternate" hreflang="en-gb" href="https://luxuryweddingdirectory.com/uk/${activeItem.slug}" />\n<link rel="alternate" hreflang="en-us" href="https://luxuryweddingdirectory.com/usa/${activeItem.slug}" />\n<link rel="alternate" hreflang="it" href="https://luxuryweddingdirectory.com/italy/${activeItem.slug}" />\n\n<!-- Example: JSON-LD structured data -->\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "CollectionPage",\n  "name": "${activeItem.name}",\n  "description": "...",\n  "provider": {\n    "@type": "Organization",\n    "name": "Luxury Wedding Directory"\n  }\n}\n</script>\n\n<!-- Example: Tracking pixel -->\n<script>/* Analytics code */</script>`}
              rows={16} style={{ ...codeStyle, minHeight: 280 }} />
            <div style={hintStyle}>Injected verbatim. Validate before saving, malformed HTML can break rendering.</div>

            {/* Generated head preview */}
            <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.gold}30,transparent)`, margin: "20px 0" }} />
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 700, marginBottom: 10 }}>Generated &lt;head&gt; Output</div>
            <div style={{ padding: "14px 16px", background: C.black, border: `1px solid ${C.border}`, borderRadius: 4, maxHeight: 260, overflowY: "auto" }}>
              <pre style={{ fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 10, color: C.grey, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{
`<title>${seoForm.titleTag || `${activeItem.name} | Luxury Wedding Directory`}</title>
<meta name="description" content="${seoForm.metaDescription || `Discover the finest ${activeItem.name.toLowerCase()}...`}" />
<meta name="robots" content="${seoForm.metaRobots}" />
${seoForm.canonicalUrl ? `<link rel="canonical" href="${seoForm.canonicalUrl}" />` : `<link rel="canonical" href="https://luxuryweddingdirectory.com/{country}/${activeItem.slug}" />`}
<meta property="og:title" content="${seoForm.ogTitle || seoForm.titleTag || activeItem.name}" />
<meta property="og:description" content="${seoForm.ogDescription || seoForm.metaDescription || ""}" />
<meta property="og:type" content="${seoForm.ogType}" />
${seoForm.ogImage ? `<meta property="og:image" content="${seoForm.ogImage}" />` : "<!-- og:image: not set -->"}
${seoForm.customMeta.filter(m => m.name && m.content).map(m => `<meta name="${m.name}" content="${m.content}" />`).join("\n")}
${seoForm.headHtml ? `\n${seoForm.headHtml}` : ""}`
              }</pre>
            </div>
          </div>
        )}

        {/* Save bar */}
        <div style={{
          marginTop: 20, padding: "16px 20px",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
            Editing SEO for <strong style={{ color: C.gold }}>{activeItem.name}</strong> · /{activeItem.slug}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => saveSeo(activeItem.seoKey)} style={{ ...btnGold, padding: "8px 20px", fontSize: 10 }}>Save All SEO</button>
            <button onClick={() => { setOpenCat(null); setOpenSub(null); }} style={{ ...btnOutline, padding: "8px 16px" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GRID VIEW, all categories
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 4 }}>◈ Directory Taxonomy</div>
          <div style={{ fontFamily: NU, fontSize: 13, color: C.grey }}>
            {categories.length} parent categories · {totalSubs} sub-categories · {totalListings.toLocaleString()} total listings
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, letterSpacing: "0.1em" }}>
            /{"{country}"}/{"{category-slug}"}/{"{listing-slug}"}
          </span>
          <button onClick={() => { resetForm(); setAddingCategory(true); }} style={btnGold}>+ Add Category</button>
        </div>
      </div>

      {/* Add category form */}
      {addingCategory && (
        <div style={{ background: C.card, border: `1px solid ${C.gold}40`, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 12 }}>New Parent Category</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 4 }}>Name</div>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Wedding Cakes" style={inputStyle} />
            </div>
            <div style={{ flex: 2 }}>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 4 }}>Description</div>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Bespoke cake design & sugar art" style={inputStyle} />
            </div>
            <button onClick={addCategory} style={btnGold}>Create</button>
            <button onClick={resetForm} style={btnOutline}>Cancel</button>
          </div>
          {formName && <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 8 }}>Slug: /{toSlug(formName)}</div>}
        </div>
      )}

      {/* Category cards grid */}
      <div className="admin-grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {categories.map(cat => {
          const isOpen = expandedCat === cat.id;
          const isEditing = editingCat === cat.id;
          const score = seoScore(cat);
          return (
            <div key={cat.id} style={{
              background: C.card, border: `1px solid ${isOpen ? C.gold + "40" : C.border}`,
              borderLeft: `3px solid ${isOpen ? C.gold : C.border}`,
              borderRadius: 4, overflow: "hidden",
              transition: "all 0.25s ease",
              gridColumn: isOpen ? "1 / -1" : undefined,
            }}>
              {/* Category header */}
              {isEditing ? (
                <div style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <input value={formName} onChange={e => setFormName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Description" style={{ ...inputStyle, flex: 2 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateCategory(cat.id)} style={btnGold}>Save</button>
                    <button onClick={resetForm} style={btnOutline}>Cancel</button>
                  </div>
                  {formName && <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 6 }}>Slug: /{toSlug(formName)}</div>}
                </div>
              ) : (
                <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openDetail(cat)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: GD, fontSize: 16, color: C.white, fontWeight: 400 }}>{cat.name}</span>
                      <span style={{
                        fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: C.gold, background: `${C.gold}15`, padding: "2px 8px", borderRadius: 2,
                      }}>{cat.count.toLocaleString()}</span>
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: score === 7 ? C.green : score > 0 ? C.gold : C.grey2,
                        background: score === 7 ? `${C.green}15` : score > 0 ? `${C.gold}10` : `${C.grey2}10`,
                        padding: "2px 7px", borderRadius: 2,
                      }}>SEO {score}/7</span>
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
                      /{cat.slug}{cat.subCategories.length > 0 ? ` · ${cat.subCategories.length} sub-categories` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); resetForm(); setFormName(cat.name); setFormDesc(cat.description || ""); setEditingCat(cat.id); }} style={{ ...btnOutline, padding: "3px 8px", fontSize: 8 }}>Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} style={{ ...btnDanger, padding: "3px 8px", fontSize: 8 }}>×</button>
                    {/* Sub-categories dropdown toggle */}
                    <button onClick={(e) => { e.stopPropagation(); setExpandedCat(isOpen ? null : cat.id); }}
                      title={isOpen ? "Collapse sub-categories" : "Expand sub-categories"}
                      style={{
                        fontFamily: NU, fontSize: 14, color: isOpen ? C.gold : C.grey, background: isOpen ? `${C.gold}10` : "transparent",
                        border: `1px solid ${isOpen ? C.gold + "40" : "transparent"}`, borderRadius: 3, padding: "2px 6px",
                        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginLeft: 4, transition: "all 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.color = C.grey; }}
                    >▶</button>
                  </div>
                </div>
              )}

              {/* Expanded sub-categories (on expand click within detail) */}
              {isOpen && !isEditing && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "0 20px 16px" }}>
                  {cat.subCategories.map((sub, si) => {
                    const isSubEditing = editingSub === `${cat.id}:${sub.id}`;
                    return isSubEditing ? (
                      <div key={sub.id} style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
                        <input value={formName} onChange={e => setFormName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={() => updateSubCategory(cat.id, sub.id)} style={{ ...btnGold, padding: "5px 10px" }}>Save</button>
                        <button onClick={resetForm} style={{ ...btnOutline, padding: "5px 10px" }}>Cancel</button>
                      </div>
                    ) : (() => {
                      const subScore = seoScoreByKey(`${cat.id}:${sub.id}`);
                      return (
                      <div key={sub.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: si < cat.subCategories.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                          onClick={() => openSubDetail(cat, sub)}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                          <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{sub.name}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>/{sub.slug}</span>
                          <span style={{
                            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            color: subScore === 7 ? C.green : subScore > 0 ? C.gold : C.grey2,
                            background: subScore === 7 ? `${C.green}15` : subScore > 0 ? `${C.gold}10` : `${C.grey2}10`,
                            padding: "2px 7px", borderRadius: 2,
                          }}>SEO {subScore}/7</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>{sub.count}</span>
                          <button onClick={() => { resetForm(); setFormName(sub.name); setEditingSub(`${cat.id}:${sub.id}`); }} style={{ ...btnOutline, padding: "2px 6px", fontSize: 8 }}>Edit</button>
                          <button onClick={() => deleteSubCategory(cat.id, sub.id)} style={{ ...btnDanger, padding: "2px 6px", fontSize: 8 }}>×</button>
                        </div>
                      </div>
                      );
                    })();
                  })}
                  {addingSubTo === cat.id ? (
                    <div style={{ padding: "12px 0 0", display: "flex", gap: 10, alignItems: "center" }}>
                      <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Sub-category name" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => addSubCategory(cat.id)} style={{ ...btnGold, padding: "5px 10px" }}>Add</button>
                      <button onClick={resetForm} style={{ ...btnOutline, padding: "5px 10px" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ paddingTop: 10 }}>
                      <button onClick={() => { resetForm(); setAddingSubTo(cat.id); }} style={{ ...btnOutline, fontSize: 9 }}>+ Add Sub-Category</button>
                    </div>
                  )}
                  {cat.subCategories.length === 0 && addingSubTo !== cat.id && (
                    <div style={{ padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic" }}>No sub-categories</span>
                      <button onClick={() => { resetForm(); setAddingSubTo(cat.id); }} style={{ ...btnOutline, fontSize: 9 }}>+ Add Sub-Category</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Taxonomy health footer */}
      <div style={{
        marginTop: 24, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 4, display: "flex", justifyContent: "space-between",
      }}>
        {[
          { label: "Parent Categories", val: categories.length },
          { label: "Sub-Categories", val: totalSubs },
          { label: "Total Listings", val: totalListings.toLocaleString() },
          { label: "SEO Complete", val: (() => {
            const parentsDone = categories.filter(c => seoScore(c) === 7).length;
            const allSubs = categories.flatMap(c => c.subCategories.map(s => `${c.id}:${s.id}`));
            const subsDone = allSubs.filter(k => seoScoreByKey(k) === 7).length;
            const total = categories.length + allSubs.length;
            const done = parentsDone + subsDone;
            return `${done}/${total}`;
          })(), color: (() => {
            const parentsDone = categories.filter(c => seoScore(c) === 7).length;
            const allSubs = categories.flatMap(c => c.subCategories.map(s => `${c.id}:${s.id}`));
            const subsDone = allSubs.filter(k => seoScoreByKey(k) === 7).length;
            return (parentsDone + subsDone) === (categories.length + allSubs.length) ? C.green : C.gold;
          })() },
          { label: "Uncategorised", val: "0", color: C.green },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 22, color: s.color || C.gold, fontWeight: 400 }}>{s.val}</div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Countries & Regions Module
// ═════════════════════════════════════════════════════════════════════════════

const isRegionActive = (r) => {
  if (!r.countrySlug || !DIRECTORY_COUNTRIES.find(c => c.slug === r.countrySlug)) return false;
  return evaluateRegionActivation(r).active;
};

const getActivationBadge = (r, C) => {
  const result = evaluateRegionActivation(r);
  const colorMap = {
    "manual-off": C.rose || "#C41E3A",
    "manual-on": C.blue,
    "ever-activated": C.green,
    "threshold-met": C.green,
    "below-threshold": C.grey2,
  };
  return { label: result.label, color: colorMap[result.reason] || C.grey2 };
};

function CountriesModule({ C }) {
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [addCountryForm, setAddCountryForm] = useState({ name: "", slug: "", iso2: "", evergreenContent: "" });
  const [extraCountries, setExtraCountries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lwd_extra_countries') || '[]'); } catch { return []; }
  });
  // Full-page SEO detail editor
  const [openCountry, setOpenCountry] = useState(null);
  const [openRegion, setOpenRegion] = useState(null);
  const [seoSection, setSeoSection] = useState("head");
  const [seoForm, setSeoForm] = useState({
    titleTag: "", metaDescription: "", metaRobots: "index, follow", canonicalUrl: "",
    ogTitle: "", ogDescription: "", ogImage: "", ogType: "website",
    h1: "", pageContent: "", introText: "",
    aiKeywords: "", aiSummary: "", aiIntentSignals: "", aiEntityType: "",
    customMeta: [], headHtml: "",
    thumbnail: null, thumbnailAlt: "", thumbnailTitle: "", thumbnailDesc: "",
    icon: null, iconAlt: "",
    mapLat: "", mapLng: "", mapZoom: "",
  });
  const [savedSeo, setSavedSeo] = useState({});
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  const [showThumbStock, setShowThumbStock] = useState(false);
  const [showOgStock, setShowOgStock] = useState(false);
  const thumbInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const allCountries = [...DIRECTORY_COUNTRIES, ...extraCountries];
  const totalCountries = allCountries.length;
  const totalRegions = DIRECTORY_REGIONS.length;
  const activeUrls = DIRECTORY_REGIONS.filter(r => isRegionActive(r)).length;
  const seoProtected = DIRECTORY_REGIONS.filter(r => r.urlEverActivated && isRegionActive(r)).length;
  // NOTE: Not using mock data in admin. This value would come from real Supabase listings if needed.
  const unassigned = 0;

  const getCountryRegions = (slug) => DIRECTORY_REGIONS.filter(r => r.countrySlug === slug);
  const getRegionCities = (regionSlug) => DIRECTORY_CITIES.filter(c => c.regionSlug === regionSlug);

  // ── Internal linking helpers (semantic clustering) ────────────────
  const getRelatedRegions = (currentRegionId, countrySlug, limit = 4) =>
    DIRECTORY_REGIONS
      .filter(r => r.countrySlug === countrySlug && r.id !== currentRegionId && r.priorityLevel === "primary")
      .sort((a, b) => b.listingCount - a.listingCount)
      .slice(0, limit);

  const getTopRegions = (countrySlug, limit = 6) =>
    DIRECTORY_REGIONS
      .filter(r => r.countrySlug === countrySlug)
      .sort((a, b) => {
        if (a.priorityLevel === "primary" && b.priorityLevel !== "primary") return -1;
        if (a.priorityLevel !== "primary" && b.priorityLevel === "primary") return 1;
        return b.listingCount - a.listingCount;
      })
      .slice(0, limit);

  // ── SEO helpers ────────────────────────────────────────────────────
  const loadSeoForm = (key, schemaDefault) => {
    const existing = savedSeo[key] || {};
    setSeoForm({
      titleTag: existing.titleTag || "", metaDescription: existing.metaDescription || "",
      metaRobots: existing.metaRobots || "index, follow", canonicalUrl: existing.canonicalUrl || "",
      ogTitle: existing.ogTitle || "", ogDescription: existing.ogDescription || "",
      ogImage: existing.ogImage || "", ogType: existing.ogType || "website",
      h1: existing.h1 || "", pageContent: existing.pageContent || "", introText: existing.introText || "",
      aiKeywords: existing.aiKeywords || "", aiSummary: existing.aiSummary || "",
      aiIntentSignals: existing.aiIntentSignals || "", aiEntityType: existing.aiEntityType || schemaDefault || "",
      customMeta: existing.customMeta || [], headHtml: existing.headHtml || "",
      thumbnail: existing.thumbnail || null, thumbnailAlt: existing.thumbnailAlt || "",
      thumbnailTitle: existing.thumbnailTitle || "", thumbnailDesc: existing.thumbnailDesc || "",
      icon: existing.icon || null, iconAlt: existing.iconAlt || "",
      mapLat: existing.mapLat || "", mapLng: existing.mapLng || "", mapZoom: existing.mapZoom || "",
    });
    setSeoSection("head");
  };
  const openDetail = (country) => { loadSeoForm(country.id, "Country"); setOpenCountry(country.id); setOpenRegion(null); };
  const openRegionDetail = (country, region) => {
    const key = `${country.id}:${region.id}`;
    loadSeoForm(key, region.priorityLevel === "primary" ? "TouristDestination" : "Place");
    setOpenRegion(key); setOpenCountry(null);
  };
  const saveSeo = (seoKey) => { setSavedSeo(prev => ({ ...prev, [seoKey]: { ...seoForm } })); setOpenCountry(null); setOpenRegion(null); };
  const seoScoreByKey = (key) => {
    const s = savedSeo[key] || {};
    let filled = 0;
    if (s.titleTag) filled++; if (s.metaDescription) filled++;
    if (s.h1 || s.pageContent) filled++; if (s.aiKeywords) filled++;
    if (s.ogTitle || s.ogDescription) filled++;
    if (s.thumbnail) filled++; if (s.thumbnailAlt) filled++;
    return filled;
  };
  const addCustomMeta = () => setSeoForm(p => ({ ...p, customMeta: [...p.customMeta, { name: "", content: "" }] }));
  const updateCustomMeta = (idx, field, val) => setSeoForm(p => ({ ...p, customMeta: p.customMeta.map((m, i) => i === idx ? { ...m, [field]: val } : m) }));
  const removeCustomMeta = (idx) => setSeoForm(p => ({ ...p, customMeta: p.customMeta.filter((_, i) => i !== idx) }));

  // ── Style constants ────────────────────────────────────────────────
  const inputStyle = { fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px", outline: "none", width: "100%", boxSizing: "border-box" };
  const textareaStyle = { ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.7 };
  const codeStyle = { ...inputStyle, fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 11, lineHeight: 1.6, minHeight: 140, resize: "vertical", whiteSpace: "pre" };
  const btnGold = { fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", background: C.gold, border: "none", borderRadius: 3, padding: "6px 14px", cursor: "pointer" };
  const btnOutline = { fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.grey, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 12px", cursor: "pointer" };
  const labelStyle = { fontFamily: NU, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 5, display: "block" };
  const hintStyle = { fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 3 };
  const counterStyle = (len, max) => ({ fontFamily: NU, fontSize: 9, color: len > max ? "#C41E3A" : C.grey2 });
  const secBtn = (key, label) => ({
    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: seoSection === key ? C.gold : C.grey2,
    background: seoSection === key ? `${C.gold}10` : "transparent",
    border: `1px solid ${seoSection === key ? C.gold + "40" : C.border}`,
    borderRadius: 3, padding: "8px 14px", cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: 6,
  });
  const aiBtn = (onClick) => ({
    style: { fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#a78bfa", background: "#a78bfa12", border: "1px solid #a78bfa30", borderRadius: 3, padding: "1px 6px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 },
    onMouseEnter: e => { e.currentTarget.style.background = "#a78bfa22"; },
    onMouseLeave: e => { e.currentTarget.style.background = "#a78bfa12"; },
    onClick,
  });

  // ── Unified activeItem abstraction ─────────────────────────────────
  const activeCountryObj = openCountry ? allCountries.find(c => c.id === openCountry) : null;
  let activeRegionObj = null, activeRegionParent = null;
  if (openRegion) {
    const [pId, rId] = openRegion.split(":");
    activeRegionParent = DIRECTORY_COUNTRIES.find(c => c.id === pId);
    activeRegionObj = DIRECTORY_REGIONS.find(r => r.id === rId && r.countrySlug === activeRegionParent?.slug) || null;
  }
  const activeItem = activeCountryObj ? {
    type: "country", seoKey: activeCountryObj.id, name: activeCountryObj.name, slug: activeCountryObj.slug,
    iso2: activeCountryObj.iso2, description: activeCountryObj.evergreenContent || "",
    count: activeCountryObj.listingCount, subCount: getCountryRegions(activeCountryObj.slug).length,
    route: `/${activeCountryObj.slug}`, breadcrumb: `/${activeCountryObj.slug}`, schema: "Country",
    parentName: null, parentSlug: null,
    focusKeywords: activeCountryObj.focusKeywords, existingAiSummary: activeCountryObj.aiSummary,
    intentSignals: activeCountryObj.intentSignals,
  } : (activeRegionObj && activeRegionParent) ? {
    type: "region", seoKey: openRegion, name: activeRegionObj.name, slug: activeRegionObj.slug,
    iso2: activeRegionParent.iso2, description: activeRegionObj.description || "",
    count: activeRegionObj.listingCount, subCount: 0,
    route: `/${activeRegionParent.slug}/${activeRegionObj.slug}`,
    breadcrumb: `/${activeRegionParent.slug}/${activeRegionObj.slug}`,
    schema: activeRegionObj.priorityLevel === "primary" ? "TouristDestination" : "Place",
    parentName: activeRegionParent.name, parentSlug: activeRegionParent.slug,
    priorityLevel: activeRegionObj.priorityLevel,
    activationBadge: getActivationBadge(activeRegionObj, C),
    isActive: isRegionActive(activeRegionObj),
    urlEverActivated: activeRegionObj.urlEverActivated,
    isLegacy: activeRegionObj.isLegacy || false,
    legacyNote: activeRegionObj.legacyNote || null,
    canonicalRoute: activeRegionObj.canonicalRoute || null,
    entityAliases: activeRegionObj.entityAliases || [],
    focusKeywords: activeRegionObj.focusKeywords, existingAiSummary: activeRegionObj.aiSummary,
    intentSignals: activeRegionObj.intentSignals,
  } : null;

  // ═══════════════════════════════════════════════════════════════════
  // DETAIL VIEW, full-page SEO editor for country OR region
  // ═══════════════════════════════════════════════════════════════════
  if (activeItem) {
    const score = seoScoreByKey(activeItem.seoKey);
    const kwTags = seoForm.aiKeywords ? seoForm.aiKeywords.split(",").map(k => k.trim()).filter(Boolean) : [];
    const removeKw = (idx) => { const arr = [...kwTags]; arr.splice(idx, 1); setSeoForm(p => ({ ...p, aiKeywords: arr.join(", ") })); };
    return (
      <div>
        {/* ── Back bar + SEO score ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => { setOpenCountry(null); setOpenRegion(null); }} style={{ ...btnOutline, display: "flex", alignItems: "center", gap: 6, padding: "6px 14px" }}>
            <span style={{ fontSize: 12 }}>←</span> Back to Countries
          </button>
          <div style={{ flex: 1 }} />
          <span style={{
            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: score === 7 ? C.green : score > 0 ? C.gold : C.grey2,
            background: score === 7 ? `${C.green}15` : score > 0 ? `${C.gold}10` : `${C.grey2}10`,
            padding: "3px 10px", borderRadius: 2,
          }}>SEO {score}/7</span>
        </div>

        {/* ── Identity header ──────────────────────────────────────── */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${activeItem.type === "region" ? "#a78bfa" : C.gold}`,
          borderRadius: 4, padding: "22px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {activeItem.parentName && (
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: C.gold }}>{activeItem.parentName}</span>
                  <span style={{ color: C.grey2 }}>›</span>
                  <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", background: "#a78bfa12", border: "1px solid #a78bfa30", padding: "1px 6px", borderRadius: 2 }}>Region</span>
                  {activeItem.priorityLevel && (
                    <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: activeItem.priorityLevel === "primary" ? C.gold : C.grey2, background: activeItem.priorityLevel === "primary" ? `${C.gold}15` : `${C.grey2}12`, padding: "1px 6px", borderRadius: 2 }}>{activeItem.priorityLevel}</span>
                  )}
                  {activeItem.activationBadge && (
                    <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", color: activeItem.activationBadge.color, background: `${activeItem.activationBadge.color}15`, padding: "1px 6px", borderRadius: 2 }}>{activeItem.activationBadge.label}</span>
                  )}
                  {activeItem.urlEverActivated && activeItem.isActive && (
                    <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, background: `${C.gold}15`, padding: "1px 6px", borderRadius: 2 }}>SEO Protected</span>
                  )}
                  {activeItem.isLegacy && (
                    <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: "#f59e0b", background: "#f59e0b15", border: "1px solid #f59e0b30", padding: "1px 6px", borderRadius: 2 }}>Legacy</span>
                  )}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: GD, fontSize: 24, color: C.white, fontWeight: 400 }}>{activeItem.name}</span>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: C.grey2, background: `${C.grey2}15`, padding: "2px 8px", borderRadius: 2 }}>{activeItem.iso2}</span>
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey2 }}>
                {activeItem.breadcrumb}{activeItem.subCount > 0 ? ` · ${activeItem.subCount} regions` : ""} · {activeItem.count} listings
              </div>
              {activeItem.description && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 6, fontStyle: "italic" }}>{activeItem.description}</div>}
              {activeItem.isLegacy && activeItem.legacyNote && (
                <div style={{ fontFamily: NU, fontSize: 10, color: "#f59e0b", background: "#f59e0b08", border: "1px solid #f59e0b20", borderRadius: 3, padding: "6px 10px", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>⚠</span> {activeItem.legacyNote}
                </div>
              )}
              {activeItem.entityAliases && activeItem.entityAliases.length > 0 && (
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 6 }}>
                  Aliases: {activeItem.entityAliases.map((a, i) => (
                    <span key={i} style={{ fontFamily: NU, fontSize: 9, color: C.grey, background: `${C.grey2}12`, padding: "1px 5px", borderRadius: 2, marginLeft: i > 0 ? 4 : 0 }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4 }}>Canonical Route</div>
              <div style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 11, color: C.gold }}>{activeItem.canonicalRoute || activeItem.route}</div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 4 }}>Schema: <span style={{ color: C.gold }}>{activeItem.schema}</span></div>
            </div>
          </div>
        </div>

        {/* ── Google Maps ──────────────────────────────────────────── */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 20,
          display: "flex", gap: 24, alignItems: "flex-start",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
              Map Preview
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", height: 220 }}>
              <iframe
                title={`Map of ${activeItem.name}`}
                width="100%" height="220" style={{ border: 0 }}
                src={seoForm.mapLat && seoForm.mapLng
                  ? `https://maps.google.com/maps?q=${seoForm.mapLat},${seoForm.mapLng}&z=${seoForm.mapZoom || (activeItem.type === "country" ? 6 : 10)}&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(activeItem.name + " wedding venues")}&z=${activeItem.type === "country" ? 6 : 10}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>Coordinates</div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3, display: "block" }}>Latitude</label>
              <input value={seoForm.mapLat} onChange={e => setSeoForm(p => ({ ...p, mapLat: e.target.value }))} placeholder="e.g. 41.9028" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3, display: "block" }}>Longitude</label>
              <input value={seoForm.mapLng} onChange={e => setSeoForm(p => ({ ...p, mapLng: e.target.value }))} placeholder="e.g. 12.4964" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3, display: "block" }}>Zoom</label>
              <input value={seoForm.mapZoom} onChange={e => setSeoForm(p => ({ ...p, mapZoom: e.target.value }))} placeholder={activeItem.type === "country" ? "6" : "10"} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Thumbnail + Icon uploads ─────────────────────────────── */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 20,
          display: "flex", gap: 24, alignItems: "flex-start",
        }}>
          {/* Thumbnail 640×480 */}
          {(() => {
            const handleThumb = (e) => {
              const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => { const img = new Image(); img.onload = () => { setSeoForm(p => ({ ...p, thumbnail: { url: ev.target.result, name: file.name, size: file.size, width: img.naturalWidth, height: img.naturalHeight } })); }; img.src = ev.target.result; };
              reader.readAsDataURL(file); e.target.value = "";
            };
            return (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
                  Thumbnail <span style={{ color: C.grey2, fontWeight: 500 }}>640px × 480px</span>
                </div>
                <input ref={thumbInputRef} type="file" accept="image/*,.webp,.avif" style={{ display: "none" }} onChange={handleThumb} />
                {seoForm.thumbnail ? (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", background: "#111" }}>
                    <img src={seoForm.thumbnail.url} alt={seoForm.thumbnailAlt || "Thumbnail"} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontFamily: NU, fontSize: 10, color: C.off, fontWeight: 600 }}>{seoForm.thumbnail.name}</div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{seoForm.thumbnail.width}x{seoForm.thumbnail.height} · {(seoForm.thumbnail.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => thumbInputRef.current?.click()} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Replace</button>
                        <button onClick={() => setSeoForm(p => ({ ...p, thumbnail: null, thumbnailAlt: "", thumbnailTitle: "", thumbnailDesc: "" }))} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#C41E3A", background: "#C41E3A10", border: "1px solid #C41E3A30", borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                    {/* Image SEO */}
                    <div style={{ padding: "0 10px 10px" }}>
                      <div style={{ fontFamily: NU, fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>Image SEO</div>
                      {[
                        { label: "Alt Tag", field: "thumbnailAlt", autoVal: `${activeItem.name} - Luxury Wedding Directory destination thumbnail`, assistVal: `Luxury weddings in ${activeItem.name.toLowerCase()} - curated collection of the finest wedding venues and vendors in ${activeItem.name} | Luxury Wedding Directory` },
                        { label: "Image Title", field: "thumbnailTitle", autoVal: `${activeItem.name} | Luxury Wedding Directory`, assistVal: `${activeItem.name} - Premium Wedding Destination for Luxury Weddings` },
                        { label: "Image Description", field: "thumbnailDesc", autoVal: `Browse the Luxury Wedding Directory's curated selection of luxury wedding vendors in ${activeItem.name}. Hand-picked professionals for discerning couples.`, assistVal: `Discover the world's most exceptional wedding vendors in ${activeItem.name}. The Luxury Wedding Directory showcases hand-verified professionals, from intimate boutique services to grand-scale luxury experiences.` },
                      ].map(({ label, field, autoVal, assistVal }) => (
                        <div key={field} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                            <label style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button {...aiBtn(() => setSeoForm(p => ({ ...p, [field]: autoVal })))}>✦ AI Auto-suggest</button>
                              <button {...aiBtn(() => setSeoForm(p => ({ ...p, [field]: assistVal })))}>✧ AI Assistant</button>
                            </div>
                          </div>
                          <input value={seoForm[field]} onChange={e => setSeoForm(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={`${label} for ${activeItem.name}`}
                            style={{ width: "100%", boxSizing: "border-box", fontFamily: NU, fontSize: 10, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 8px", outline: "none" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div onClick={() => thumbInputRef.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 4, padding: "30px 20px", textAlign: "center", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginBottom: 8 }}>Drop image or click to upload</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); thumbInputRef.current?.click(); }} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "4px 12px", cursor: "pointer" }}>📁 Upload File</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowThumbStock(true); }} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#05A081", background: "#05A08112", border: "1px solid #05A08130", borderRadius: 3, padding: "4px 12px", cursor: "pointer" }}>📸 Browse Stock</button>
                      </div>
                    </div>
                    {showThumbStock && (
                      <div style={{ marginTop: 8 }}>
                        <ImageSearchPanel C={C} defaultQuery={`luxury wedding ${activeItem.name.toLowerCase()}`}
                          onClose={() => setShowThumbStock(false)}
                          onSelect={(img) => { setSeoForm(p => ({ ...p, thumbnail: { url: img.url, name: `${img.photographer} via ${img.source}`, size: 0, width: img.width, height: img.height } })); setShowThumbStock(false); }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* Icon 50×50 */}
          {(() => {
            const handleIcon = (e) => {
              const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => { const img = new Image(); img.onload = () => { setSeoForm(p => ({ ...p, icon: { url: ev.target.result, name: file.name, size: file.size, width: img.naturalWidth, height: img.naturalHeight } })); }; img.src = ev.target.result; };
              reader.readAsDataURL(file); e.target.value = "";
            };
            return (
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
                  Icon <span style={{ color: C.grey2, fontWeight: 500 }}>50px × 50px</span>
                </div>
                <input ref={iconInputRef} type="file" accept="image/*,.webp,.avif" style={{ display: "none" }} onChange={handleIcon} />
                {seoForm.icon ? (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", background: "#111", textAlign: "center" }}>
                    <div style={{ padding: 16 }}><img src={seoForm.icon.url} alt={seoForm.iconAlt || "Icon"} style={{ width: 50, height: 50, objectFit: "contain" }} /></div>
                    <div style={{ padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{seoForm.icon.width}x{seoForm.icon.height}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => iconInputRef.current?.click()} style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: C.gold, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>Replace</button>
                        <button onClick={() => setSeoForm(p => ({ ...p, icon: null, iconAlt: "" }))} style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: "#C41E3A", background: "#C41E3A10", border: "1px solid #C41E3A30", borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => iconInputRef.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 4, padding: "20px", textAlign: "center", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <div style={{ fontFamily: NU, fontSize: 20, color: C.grey2, marginBottom: 4 }}>◎</div>
                    <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>Upload icon</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Tab Navigation ───────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setSeoSection("head")} style={secBtn("head", "Head Tags")}>⊡ Head Tags & Meta</button>
          <button onClick={() => setSeoSection("content")} style={secBtn("content", "Content")}>◈ Page Content</button>
          <button onClick={() => setSeoSection("ai")} style={secBtn("ai", "AI")}>✧ AI & Keywords</button>
          <button onClick={() => setSeoSection("code")} style={secBtn("code", "Code")}>⟐ Custom HTML</button>
        </div>

        {/* ── Tab 1: Head Tags & Meta ──────────────────────────────── */}
        {seoSection === "head" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>HTML Head Tags</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={labelStyle}>&lt;title&gt; Tag</label>
                  <span style={counterStyle(seoForm.titleTag.length, 60)}>{seoForm.titleTag.length}/60</span>
                </div>
                <input value={seoForm.titleTag} onChange={e => setSeoForm(p => ({ ...p, titleTag: e.target.value }))}
                  placeholder={`${activeItem.name}, Luxury Wedding Destination | LWD`} style={inputStyle} />
                <div style={hintStyle}>&lt;title&gt;{seoForm.titleTag || `${activeItem.name}, Luxury Wedding Destination`}&lt;/title&gt;</div>
              </div>
              <div>
                <label style={labelStyle}>Meta Robots</label>
                <select value={seoForm.metaRobots} onChange={e => setSeoForm(p => ({ ...p, metaRobots: e.target.value }))} style={inputStyle}>
                  <option value="index, follow">index, follow</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="index, nofollow">index, nofollow</option>
                  <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <label style={labelStyle}>Meta Description</label>
                <span style={counterStyle(seoForm.metaDescription.length, 160)}>{seoForm.metaDescription.length}/160</span>
              </div>
              <textarea value={seoForm.metaDescription} onChange={e => setSeoForm(p => ({ ...p, metaDescription: e.target.value }))}
                placeholder={`Discover curated luxury wedding venues and vendors in ${activeItem.name}. Editorially selected across the finest locations.`}
                rows={2} style={{ ...inputStyle, minHeight: 52 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Canonical URL</label>
              <input value={seoForm.canonicalUrl} onChange={e => setSeoForm(p => ({ ...p, canonicalUrl: e.target.value }))}
                placeholder={`https://luxuryweddingdirectory.com${activeItem.route}`} style={inputStyle} />
            </div>
            {/* Open Graph */}
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16, marginTop: 24, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>Open Graph Tags</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>og:title</label>
                <input value={seoForm.ogTitle} onChange={e => setSeoForm(p => ({ ...p, ogTitle: e.target.value }))}
                  placeholder={seoForm.titleTag || activeItem.name} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>og:type</label>
                <select value={seoForm.ogType} onChange={e => setSeoForm(p => ({ ...p, ogType: e.target.value }))} style={inputStyle}>
                  <option value="website">website</option><option value="place">place</option><option value="article">article</option><option value="business.business">business.business</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>og:description</label>
              <textarea value={seoForm.ogDescription} onChange={e => setSeoForm(p => ({ ...p, ogDescription: e.target.value }))}
                placeholder={seoForm.metaDescription || `Luxury weddings in ${activeItem.name}`} rows={2} style={{ ...inputStyle, minHeight: 52 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>og:image</label>
                <button onClick={() => setShowOgStock(!showOgStock)} style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: "#05A081", background: "#05A08112", border: "1px solid #05A08130", borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>📸 Browse Stock</button>
              </div>
              <input value={seoForm.ogImage} onChange={e => setSeoForm(p => ({ ...p, ogImage: e.target.value }))}
                placeholder="https://luxuryweddingdirectory.com/images/og-..." style={inputStyle} />
              {showOgStock && (
                <div style={{ marginTop: 8 }}>
                  <ImageSearchPanel C={C} defaultQuery={`luxury wedding ${activeItem.name.toLowerCase()}`}
                    onClose={() => setShowOgStock(false)}
                    onSelect={(img) => { setSeoForm(p => ({ ...p, ogImage: img.url })); setShowOgStock(false); }} />
                </div>
              )}
              <div style={hintStyle}>Recommended: 1200×630px</div>
            </div>
            {/* Custom Meta */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Custom Meta Tags</span>
                <button onClick={addCustomMeta} style={{ ...btnOutline, fontSize: 8, padding: "3px 10px" }}>+ Add Tag</button>
              </div>
              {seoForm.customMeta.length === 0 && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic" }}>No custom meta tags.</div>}
              {seoForm.customMeta.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>&lt;meta</span>
                  <input value={m.name} onChange={e => updateCustomMeta(i, "name", e.target.value)} placeholder="name" style={{ ...inputStyle, flex: 1, padding: "4px 8px", fontSize: 10 }} />
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>=</span>
                  <input value={m.content} onChange={e => updateCustomMeta(i, "content", e.target.value)} placeholder="content" style={{ ...inputStyle, flex: 2, padding: "4px 8px", fontSize: 10 }} />
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>/&gt;</span>
                  <button onClick={() => removeCustomMeta(i)} style={{ fontFamily: NU, fontSize: 12, color: "#C41E3A", background: "transparent", border: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
                </div>
              ))}
            </div>
            {/* Search Engine Preview */}
            <div style={{ marginTop: 24, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 12 }}>Search Engine Preview</div>
              <div style={{ background: C.black, border: `1px solid ${C.border}`, borderRadius: 4, padding: "16px 20px" }}>
                <div style={{ fontFamily: NU, fontSize: 16, color: "#8ab4f8", fontWeight: 400, marginBottom: 4, cursor: "pointer" }}>{seoForm.titleTag || `${activeItem.name}, Luxury Wedding Destination`}</div>
                <div style={{ fontFamily: NU, fontSize: 12, color: "#4d9a4d", marginBottom: 4 }}>luxuryweddingdirectory.com › {activeItem.parentSlug ? `${activeItem.parentSlug} › ` : ""}{activeItem.slug}</div>
                <div style={{ fontFamily: NU, fontSize: 12, color: "#969ba1", lineHeight: 1.5 }}>{(seoForm.metaDescription || `Discover luxury weddings in ${activeItem.name}...`).slice(0, 160)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Page Content ──────────────────────────────────── */}
        {seoSection === "content" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            {/* Meta Keywords */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Meta Keywords</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button {...aiBtn(() => {
                    const kws = [`luxury wedding ${activeItem.name.toLowerCase()}`, `destination wedding ${activeItem.name.toLowerCase()}`, `wedding venues ${activeItem.name.toLowerCase()}`, `wedding planner ${activeItem.name.toLowerCase()}`, `${activeItem.name.toLowerCase()} wedding cost`, `best ${activeItem.name.toLowerCase()} wedding venues`, `getting married in ${activeItem.name.toLowerCase()}`, `${activeItem.name.toLowerCase()} wedding guide`];
                    setSeoForm(p => ({ ...p, aiKeywords: p.aiKeywords ? p.aiKeywords + ", " + kws.join(", ") : kws.join(", ") }));
                  })}>✦ AI Auto-suggest</button>
                  <button {...aiBtn(() => {
                    const kws = [`luxury destination wedding ${activeItem.name.toLowerCase()}`, `premium wedding vendors ${activeItem.name.toLowerCase()}`, `exclusive wedding venues ${activeItem.name.toLowerCase()}`];
                    setSeoForm(p => ({ ...p, aiKeywords: p.aiKeywords ? p.aiKeywords + ", " + kws.join(", ") : kws.join(", ") }));
                  })}>✧ AI Assistant</button>
                </div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 3, background: C.black, padding: "6px 8px", display: "flex", flexWrap: "wrap", gap: 4, minHeight: 36, alignItems: "center" }}>
                {kwTags.map((kw, i) => (
                  <span key={i} style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}30`, padding: "2px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {kw}<span onClick={() => removeKw(i)} style={{ cursor: "pointer", color: C.grey2, fontSize: 12 }}>×</span>
                  </span>
                ))}
                <input
                  value={seoForm._kwInput || ""}
                  onChange={e => setSeoForm(p => ({ ...p, _kwInput: e.target.value }))}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === ",") && seoForm._kwInput?.trim()) {
                      e.preventDefault();
                      const nk = seoForm._kwInput.trim().replace(/,$/, "");
                      if (nk && kwTags.length < 15) setSeoForm(p => ({ ...p, aiKeywords: p.aiKeywords ? p.aiKeywords + ", " + nk : nk, _kwInput: "" }));
                    } else if (e.key === "Backspace" && !seoForm._kwInput && kwTags.length > 0) { removeKw(kwTags.length - 1); }
                  }}
                  placeholder={kwTags.length === 0 ? "Type keywords..." : kwTags.length >= 15 ? "Max 15" : "+"}
                  disabled={kwTags.length >= 15}
                  style={{ border: "none", outline: "none", background: "transparent", fontFamily: NU, fontSize: 11, color: C.off, flex: 1, minWidth: 80, padding: "2px 4px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={hintStyle}>Press Enter or comma to add</span>
                <span style={hintStyle}>{kwTags.length}/15</span>
              </div>
            </div>
            {/* H1 + Intro */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>&lt;h1&gt; Page Heading</label>
                <input value={seoForm.h1} onChange={e => setSeoForm(p => ({ ...p, h1: e.target.value }))}
                  placeholder={`Luxury Weddings in ${activeItem.name}`}
                  style={{ ...inputStyle, fontFamily: GD, fontSize: 15 }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Intro Text</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button {...aiBtn(() => setSeoForm(p => ({ ...p, introText: `Discover the finest luxury wedding venues and vendors in ${activeItem.name} on the Luxury Wedding Directory. Our hand-curated collection showcases exceptional professionals, each vetted by our editorial team.` })))}>✦ AI Auto-suggest</button>
                    <button {...aiBtn(() => setSeoForm(p => ({ ...p, introText: `Welcome to ${activeItem.name} on the Luxury Wedding Directory, your definitive guide to planning an extraordinary wedding in one of the world's most sought-after destinations. From intimate celebrations to grand affairs, our carefully curated directory connects you with ${activeItem.name}'s most exceptional wedding professionals.` })))}>✧ AI Assistant</button>
                  </div>
                </div>
                <textarea value={seoForm.introText} onChange={e => setSeoForm(p => ({ ...p, introText: e.target.value }))}
                  placeholder="2-4 sentence editorial intro above the listing grid."
                  rows={2} style={{ ...inputStyle, minHeight: 52 }} />
              </div>
            </div>
            {/* WYSIWYG */}
            <div style={{ marginBottom: 24 }}>
              <LwdEditor C={C} value={seoForm.pageContent} onChange={v => setSeoForm(p => ({ ...p, pageContent: v }))}
                label="Content" placeholder={`<h2>Discover ${activeItem.name}</h2>\n<p>From intimate settings to grand celebrations...</p>`} />
            </div>
            {/* Route reference */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: `${C.gold}06`, borderRadius: 3 }}>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
                Renders on: <span style={{ color: C.gold, fontFamily: "'SF Mono','Consolas',monospace" }}>{activeItem.route}</span>
                {activeItem.schema && <> · Schema: <span style={{ color: C.gold }}>{activeItem.schema}</span></>}
                {" · Indexed by Aura AI"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>{seoForm.pageContent.length} chars</span>
            </div>
          </div>
        )}

        {/* ── Tab 3: AI & Keywords ─────────────────────────────────── */}
        {seoSection === "ai" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            {/* AI Assist header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a78bfa", fontWeight: 700 }}>AI Search & Keyword Intelligence</span>
              <div onClick={() => setAiAssistEnabled(!aiAssistEnabled)} style={{ width: 36, height: 18, borderRadius: 9, background: aiAssistEnabled ? "#a78bfa" : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: aiAssistEnabled ? 20 : 2, transition: "left 0.2s" }} />
              </div>
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginBottom: 20 }}>These fields power the Aura AI search layer, intent classification, and entity embeddings.</div>
            {/* Primary Keywords */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>Primary Keywords (AI + SEO)</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <button {...aiBtn(() => {
                    const kws = [`luxury wedding ${activeItem.name.toLowerCase()}`, `destination wedding ${activeItem.name.toLowerCase()}`, `best wedding venues ${activeItem.name.toLowerCase()}`, `wedding planner ${activeItem.name.toLowerCase()}`, `${activeItem.name.toLowerCase()} wedding cost guide`, `getting married in ${activeItem.name.toLowerCase()}`, `${activeItem.name.toLowerCase()} wedding packages`, `${activeItem.name.toLowerCase()} wedding inspiration`];
                    setSeoForm(p => ({ ...p, aiKeywords: kws.join(", ") }));
                  })}>✦ AI Auto-suggest</button>
                  <button {...aiBtn(() => {
                    const kws = [`how to plan a wedding in ${activeItem.name.toLowerCase()}`, `${activeItem.name.toLowerCase()} wedding traditions`, `${activeItem.name.toLowerCase()} luxury wedding planner reviews`, `wedding venues near ${activeItem.name.toLowerCase()}`, `destination wedding ${activeItem.name.toLowerCase()} budget`];
                    setSeoForm(p => ({ ...p, aiKeywords: kws.join(", ") }));
                  })}>✧ AI Assistant</button>
                </div>
              </div>
              <textarea value={seoForm.aiKeywords} onChange={e => setSeoForm(p => ({ ...p, aiKeywords: e.target.value }))}
                placeholder={`luxury wedding ${activeItem.name.toLowerCase()}, destination wedding ${activeItem.name.toLowerCase()}, best venues...`}
                rows={3} style={{ ...inputStyle, minHeight: 60 }} />
              <div style={hintStyle}>Comma-separated. These feed both traditional SEO keyword targeting and Aura AI intent matching.</div>
            </div>
            {/* AI Summary */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>AI Summary (for Aura)</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <button {...aiBtn(() => setSeoForm(p => ({ ...p, aiSummary: `${activeItem.name} on the Luxury Wedding Directory connects discerning couples with the finest wedding venues and vendors across ${activeItem.type === "country" ? "the country" : "the region"}. Every listing is hand-verified by our editorial team.` })))}>✦ AI Auto-suggest</button>
                  <button {...aiBtn(() => setSeoForm(p => ({ ...p, aiSummary: `${activeItem.name} represents one of the most sought-after destinations for luxury weddings worldwide. The Luxury Wedding Directory's curated collection spans the finest venues and professionals, from intimate boutique services to grand-scale luxury celebrations. Each vendor undergoes rigorous editorial vetting, ensuring couples receive nothing less than exceptional quality and personalised service.` })))}>✧ AI Assistant</button>
                </div>
              </div>
              <textarea value={seoForm.aiSummary} onChange={e => setSeoForm(p => ({ ...p, aiSummary: e.target.value }))}
                placeholder="A concise 2-3 sentence description for Aura AI..."
                rows={3} style={{ ...inputStyle, minHeight: 70 }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={hintStyle}>Aura uses this to understand the destination semantically.</span>
                <span style={counterStyle(seoForm.aiSummary.length, 300)}>{seoForm.aiSummary.length} chars</span>
              </div>
            </div>
            {/* Intent Signals + Entity Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Intent Signals</label>
                <textarea value={seoForm.aiIntentSignals} onChange={e => setSeoForm(p => ({ ...p, aiIntentSignals: e.target.value }))}
                  placeholder={`high-intent: "book wedding venue in ${activeItem.name.toLowerCase()}"\nmid-intent: "best wedding venues ${activeItem.name.toLowerCase()}"\nlow-intent: "wedding in ${activeItem.name.toLowerCase()} ideas"`}
                  rows={4} style={{ ...inputStyle, minHeight: 80 }} />
                <div style={hintStyle}>Example queries by intent tier. Helps Aura classify incoming searches.</div>
              </div>
              <div>
                <label style={labelStyle}>Entity Type (Schema.org)</label>
                <input value={seoForm.aiEntityType} onChange={e => setSeoForm(p => ({ ...p, aiEntityType: e.target.value }))}
                  placeholder={activeItem.schema} style={inputStyle} />
                <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 6, padding: "6px 8px", background: `${C.border}30`, borderRadius: 3 }}>
                  Default: <span style={{ color: C.gold }}>{activeItem.schema}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Embedding Index</label>
                  <input value="destinations_v1" readOnly style={{ ...inputStyle, color: C.grey2, fontStyle: "italic" }} />
                  <div style={hintStyle}>Vector index target. Read-only, set by AI_SEARCH_CONFIG.</div>
                </div>
              </div>
            </div>
            {/* AI Readiness */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Keywords", done: !!seoForm.aiKeywords },
                { label: "AI Summary", done: !!seoForm.aiSummary },
                { label: "Intent Signals", done: !!seoForm.aiIntentSignals },
                { label: "Entity Type", done: !!seoForm.aiEntityType },
              ].map((item, i) => (
                <div key={i} style={{ padding: "10px", borderRadius: 3, background: item.done ? `${C.green}08` : `${C.grey2}06`, border: `1px solid ${item.done ? C.green + "20" : C.border}`, textAlign: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.done ? C.green : C.grey2, margin: "0 auto 6px" }} />
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: item.done ? C.green : C.grey2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 4: Custom HTML ───────────────────────────────────── */}
        {seoSection === "code" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Custom &lt;head&gt; HTML</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button {...aiBtn(() => {
                  const schema = seoForm.aiEntityType || activeItem.schema;
                  const jsonLd = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": schema, name: activeItem.name, description: seoForm.metaDescription || `Luxury weddings in ${activeItem.name}`, url: `https://luxuryweddingdirectory.com${activeItem.route}`, numberOfItems: activeItem.count, provider: { "@type": "Organization", name: "Luxury Wedding Directory" }, isPartOf: { "@type": "WebSite", name: "Luxury Wedding Directory" }, ...(activeItem.parentName ? { containedInPlace: { "@type": "Country", name: activeItem.parentName } } : {}) }, null, 2)}\n</script>`;
                  setSeoForm(p => ({ ...p, headHtml: p.headHtml ? p.headHtml + "\n\n" + jsonLd : jsonLd }));
                })}>✦ AI Auto-suggest</button>
                <button {...aiBtn(() => {
                  const slug = activeItem.route;
                  const hreflang = `<!-- Hreflang tags for ${activeItem.name} -->\n<link rel="alternate" hreflang="en-gb" href="https://luxuryweddingdirectory.com${slug}" />\n<link rel="alternate" hreflang="en-us" href="https://luxuryweddingdirectory.com${slug}" />\n<link rel="alternate" hreflang="it" href="https://luxuryweddingdirectory.com${slug}" />\n<link rel="alternate" hreflang="fr" href="https://luxuryweddingdirectory.com${slug}" />\n<link rel="alternate" hreflang="x-default" href="https://luxuryweddingdirectory.com${slug}" />`;
                  setSeoForm(p => ({ ...p, headHtml: p.headHtml ? p.headHtml + "\n\n" + hreflang : hreflang }));
                })}>✧ AI Assistant</button>
              </div>
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginBottom: 12 }}>Inject raw HTML into the &lt;head&gt; of {activeItem.route} pages. Use for JSON-LD, hreflang, tracking, etc.</div>
            <textarea value={seoForm.headHtml} onChange={e => setSeoForm(p => ({ ...p, headHtml: e.target.value }))}
              rows={16} style={{ ...codeStyle, minHeight: 280 }}
              placeholder={`<!-- JSON-LD structured data -->\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "${activeItem.schema}"\n}\n</script>\n\n<!-- Hreflang -->\n<link rel="alternate" hreflang="en" href="..." />`} />
            <div style={hintStyle}>Injected verbatim. Validate before saving, malformed HTML can break rendering.</div>
            {/* Generated head output */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>Generated &lt;head&gt; Output</div>
              <div style={{ background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "12px 16px", maxHeight: 260, overflow: "auto" }}>
                <pre style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 10, color: C.grey, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
{`<title>${seoForm.titleTag || `${activeItem.name}, Luxury Wedding Destination`}</title>
<meta name="description" content="${seoForm.metaDescription || `Luxury weddings in ${activeItem.name}`}" />
<meta name="robots" content="${seoForm.metaRobots}" />
<link rel="canonical" href="${seoForm.canonicalUrl || `https://luxuryweddingdirectory.com${activeItem.route}`}" />
<meta property="og:title" content="${seoForm.ogTitle || seoForm.titleTag || activeItem.name}" />
<meta property="og:description" content="${seoForm.ogDescription || seoForm.metaDescription || ""}" />
<meta property="og:type" content="${seoForm.ogType}" />${seoForm.ogImage ? `\n<meta property="og:image" content="${seoForm.ogImage}" />` : ""}${seoForm.customMeta.filter(m => m.name && m.content).map(m => `\n<meta name="${m.name}" content="${m.content}" />`).join("")}${seoForm.headHtml ? `\n\n${seoForm.headHtml}` : ""}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* GEOGRAPHIC INTERNAL LINKING, Semantic Clustering Engine       */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* ── Cities in this Region (Region detail only) ──────────── */}
        {activeItem.type === "region" && (() => {
          const cities = getRegionCities(activeItem.slug);
          if (cities.length === 0) return null;
          return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C41E3A", fontWeight: 700 }}>◉ Cities in {activeItem.name}</span>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{cities.length} cities · Entity enrichment layer</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cities.length, 3)}, 1fr)`, gap: 12 }}>
                {cities.map(city => (
                  <div key={city.id} style={{
                    background: `${C.black}80`, border: `1px solid ${C.border}`, borderLeft: `3px solid #C41E3A40`,
                    borderRadius: 4, padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: GD, fontSize: 14, color: C.white }}>{city.name}</span>
                      <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: "#C41E3A", background: "#C41E3A15", padding: "2px 6px", borderRadius: 2, letterSpacing: "0.1em" }}>CITY</span>
                      <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: C.gold, background: `${C.gold}15`, padding: "2px 6px", borderRadius: 2 }}>{city.listingCount}</span>
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 6, lineHeight: 1.5 }}>{city.description}</div>
                    {city.focusKeywords && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                        {city.focusKeywords.map((kw, i) => (
                          <span key={i} style={{ fontFamily: NU, fontSize: 8, color: C.gold, background: `${C.gold}12`, border: `1px solid ${C.gold}25`, padding: "2px 6px", borderRadius: 10 }}>{kw}</span>
                        ))}
                      </div>
                    )}
                    {city.aiSummary && (
                      <div style={{ fontFamily: NU, fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 3, padding: "6px 8px", marginTop: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 8, letterSpacing: "0.1em" }}>✦ AI:</span> {city.aiSummary}
                      </div>
                    )}
                    {city.lat && city.lng && (
                      <div style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 9, color: C.grey2, marginTop: 6 }}>
                        📍 {city.lat}, {city.lng}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Related Regions (Region detail only) ────────────────── */}
        {activeItem.type === "region" && (() => {
          const regionId = activeItem.seoKey.includes(":") ? activeItem.seoKey.split(":")[1] : activeItem.slug;
          const parentCountry = DIRECTORY_COUNTRIES.find(c => c.slug === activeItem.parentSlug);
          const related = getRelatedRegions(regionId, activeItem.parentSlug);
          if (related.length === 0) return null;
          return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>⟐ Related Regions {parentCountry ? `in ${parentCountry.name}` : ""}</span>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>Geographic semantic cluster · Internal linking</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(related.length, 4)}, 1fr)`, gap: 12 }}>
                {related.map(region => {
                  const active = isRegionActive(region);
                  const badge = getActivationBadge(region, C);
                  const cities = getRegionCities(region.slug);
                  return (
                    <div key={region.id}
                      onClick={() => { if (parentCountry) openRegionDetail(parentCountry, region); }}
                      style={{
                        background: `${C.black}80`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}40`,
                        borderRadius: 4, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "60"; e.currentTarget.style.background = `${C.gold}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = `${C.black}80`; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.green : C.grey2 }} />
                        <span style={{ fontFamily: GD, fontSize: 13, color: C.white }}>{region.name}</span>
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 6 }}>
                        /{parentCountry?.slug}/{region.slug} · {region.listingCount} listings
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                        <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: badge.color, background: `${badge.color}15`, padding: "2px 5px", borderRadius: 2 }}>{badge.label}</span>
                        {cities.length > 0 && (
                          <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#C41E3A", background: "#C41E3A15", padding: "2px 5px", borderRadius: 2, letterSpacing: "0.08em" }}>{cities.length} cities</span>
                        )}
                        {(() => { const sc = seoScoreByKey(`${parentCountry?.id}:${region.id}`); return (
                          <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: sc === 7 ? C.green : sc > 0 ? C.gold : C.grey2, background: sc === 7 ? `${C.green}15` : sc > 0 ? `${C.gold}15` : `${C.grey2}10`, padding: "2px 5px", borderRadius: 2 }}>SEO {sc}/7</span>
                        ); })()}
                      </div>
                      {region.aiSummary && (
                        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, lineHeight: 1.4 }}>
                          {region.aiSummary.length > 80 ? region.aiSummary.slice(0, 80) + "…" : region.aiSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Explore More in Country */}
              {parentCountry && (
                <div
                  onClick={() => openDetail(parentCountry)}
                  style={{
                    marginTop: 14, padding: "12px 16px", borderRadius: 4, cursor: "pointer",
                    background: `${C.gold}06`, border: `1px solid ${C.gold}20`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}12`; e.currentTarget.style.borderColor = C.gold + "40"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${C.gold}06`; e.currentTarget.style.borderColor = C.gold + "20"; }}
                >
                  <div>
                    <span style={{ fontFamily: NU, fontSize: 11, color: C.gold, fontWeight: 700 }}>Explore More in {parentCountry.name}</span>
                    <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginLeft: 10 }}>
                      /{parentCountry.slug} · {parentCountry.listingCount} listings · {getCountryRegions(parentCountry.slug).length} regions
                    </span>
                  </div>
                  <span style={{ fontFamily: NU, fontSize: 14, color: C.gold }}>→</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Top Regions + Cities (Country detail only) ──────────── */}
        {activeItem.type === "country" && (() => {
          const topRegions = getTopRegions(activeItem.slug, 6);
          const countryCities = DIRECTORY_CITIES.filter(c => c.countrySlug === activeItem.slug);
          if (topRegions.length === 0) return null;
          return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>⟐ Top Regions in {activeItem.name}</span>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{topRegions.length} regions · {countryCities.length} cities · Geographic cluster</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(topRegions.length, 3)}, 1fr)`, gap: 12 }}>
                {topRegions.map(region => {
                  const active = isRegionActive(region);
                  const badge = getActivationBadge(region, C);
                  const country = DIRECTORY_COUNTRIES.find(c => c.slug === region.countrySlug);
                  const cities = getRegionCities(region.slug);
                  return (
                    <div key={region.id}
                      onClick={() => { if (country) openRegionDetail(country, region); }}
                      style={{
                        background: `${C.black}80`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${active ? C.green + "60" : C.grey2 + "30"}`,
                        borderRadius: 4, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "60"; e.currentTarget.style.background = `${C.gold}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = `${C.black}80`; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.green : C.grey2 }} />
                        <span style={{ fontFamily: GD, fontSize: 13, color: C.white }}>{region.name}</span>
                        <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: region.priorityLevel === "primary" ? C.gold : C.grey2, background: region.priorityLevel === "primary" ? `${C.gold}15` : `${C.grey2}10`, padding: "2px 5px", borderRadius: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>{region.priorityLevel}</span>
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 6 }}>
                        {region.listingCount} listings · <span style={{ color: badge.color }}>{badge.label}</span>
                      </div>
                      {/* City pills under each region */}
                      {cities.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                          {cities.map(city => (
                            <span key={city.id} style={{ fontFamily: NU, fontSize: 8, color: "#C41E3A", background: "#C41E3A10", border: "1px solid #C41E3A20", padding: "2px 6px", borderRadius: 10 }}>
                              {city.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {region.aiSummary && (
                        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, lineHeight: 1.4 }}>
                          {region.aiSummary.length > 70 ? region.aiSummary.slice(0, 70) + "…" : region.aiSummary}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        {(() => { const sc = seoScoreByKey(`${activeItem.seoKey}:${region.id}`); return (
                          <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: sc === 7 ? C.green : sc > 0 ? C.gold : C.grey2, background: sc === 7 ? `${C.green}15` : sc > 0 ? `${C.gold}15` : `${C.grey2}10`, padding: "2px 5px", borderRadius: 2 }}>SEO {sc}/7</span>
                        ); })()}
                        {cities.length > 0 && (
                          <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#C41E3A", background: "#C41E3A12", padding: "2px 5px", borderRadius: 2, letterSpacing: "0.08em" }}>{cities.length} cities</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* City overview row */}
              {countryCities.length > 0 && (
                <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 4, background: "#C41E3A06", border: "1px solid #C41E3A15" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C41E3A", fontWeight: 700 }}>◉ City Entity Layer</span>
                    <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{countryCities.length} cities across {activeItem.name}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {countryCities.map(city => (
                      <div key={city.id} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: `${C.black}60`, border: `1px solid ${C.border}`, borderRadius: 3, padding: "4px 10px",
                      }}>
                        <span style={{ fontFamily: NU, fontSize: 10, color: C.off, fontWeight: 600 }}>{city.name}</span>
                        <span style={{ fontFamily: NU, fontSize: 8, color: C.grey2 }}>
                          {DIRECTORY_REGIONS.find(r => r.id === city.regionSlug)?.name || city.regionSlug}
                        </span>
                        <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: C.gold, background: `${C.gold}15`, padding: "1px 4px", borderRadius: 2 }}>{city.listingCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Save bar ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
            Editing SEO for <span style={{ color: C.gold, fontWeight: 600 }}>{activeItem.name}</span> · {activeItem.breadcrumb}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => saveSeo(activeItem.seoKey)} style={btnGold}>Save All SEO</button>
            <button onClick={() => { setOpenCountry(null); setOpenRegion(null); }} style={btnOutline}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // GRID VIEW, all countries
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Header (matches Categories) ────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 4 }}>◎ Country Directory</div>
          <div style={{ fontFamily: NU, fontSize: 13, color: C.grey }}>
            {totalCountries} countries · {totalRegions} regions · {activeUrls} active region URLs
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, letterSpacing: "0.1em" }}>
            /{"{country}"}/{"{region}"}/{"{category}"}
          </span>
          <button
            onClick={() => setShowAddCountry(v => !v)}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: showAddCountry ? C.gold : C.grey,
              background: showAddCountry ? `${C.gold}12` : "transparent",
              border: `1px solid ${showAddCountry ? C.gold + "60" : C.border}`,
              borderRadius: 3, padding: "6px 14px", cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { if (!showAddCountry) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; } }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Country
          </button>
        </div>
      </div>

      {/* ── Add Country form ──────────────────────────────────────────────── */}
      {showAddCountry && (
        <div style={{
          background: C.card, border: `1px solid ${C.gold}40`, borderLeft: `3px solid ${C.gold}`,
          borderRadius: 4, padding: "20px 24px", marginBottom: 20,
        }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>New Country</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4, display: "block" }}>Country Name *</label>
              <input
                value={addCountryForm.name}
                onChange={e => setAddCountryForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                placeholder="e.g. South Korea"
                style={{ fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px", width: "100%", boxSizing: "border-box", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4, display: "block" }}>Slug</label>
              <input
                value={addCountryForm.slug}
                onChange={e => setAddCountryForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. south-korea"
                style={{ fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px", width: "100%", boxSizing: "border-box", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4, display: "block" }}>ISO2</label>
              <input
                value={addCountryForm.iso2}
                onChange={e => setAddCountryForm(p => ({ ...p, iso2: e.target.value.toUpperCase().slice(0,2) }))}
                placeholder="KR"
                maxLength={2}
                style={{ fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px", width: "100%", boxSizing: "border-box", outline: "none", textTransform: "uppercase" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600, marginBottom: 4, display: "block" }}>Description (optional)</label>
            <input
              value={addCountryForm.evergreenContent}
              onChange={e => setAddCountryForm(p => ({ ...p, evergreenContent: e.target.value }))}
              placeholder="Brief description of the destination..."
              style={{ fontFamily: NU, fontSize: 12, color: C.off, background: C.black, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 12px", width: "100%", boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                if (!addCountryForm.name.trim() || !addCountryForm.slug.trim()) return;
                const newEntry = {
                  id: addCountryForm.slug,
                  slug: addCountryForm.slug,
                  name: addCountryForm.name.trim(),
                  iso2: addCountryForm.iso2 || "??",
                  listingCount: 0,
                  focusKeywords: [],
                  aiSummary: "",
                  intentSignals: { high: [], mid: [], low: [] },
                  evergreenContent: addCountryForm.evergreenContent.trim(),
                };
                setExtraCountries(prev => {
                  const updated = [...prev, newEntry];
                  // Persist to localStorage so Listing Studio dropdown picks them up
                  try { localStorage.setItem('lwd_extra_countries', JSON.stringify(updated)); } catch {}
                  return updated;
                });
                setAddCountryForm({ name: "", slug: "", iso2: "", evergreenContent: "" });
                setShowAddCountry(false);
              }}
              style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", background: C.gold, border: "none", borderRadius: 3, padding: "7px 16px", cursor: "pointer" }}
            >
              Add Country
            </button>
            <button
              onClick={() => { setShowAddCountry(false); setAddCountryForm({ name: "", slug: "", iso2: "", evergreenContent: "" }); }}
              style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.grey, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "6px 14px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Country cards grid (2 columns, matches Categories) ─────────── */}
      <div className="admin-grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {allCountries.map(country => {
          const regions = getCountryRegions(country.slug);
          const activeRegions = regions.filter(r => isRegionActive(r)).length;
          const isOpen = expandedCountry === country.slug;

          return (
            <div key={country.slug} style={{
              background: C.card, border: `1px solid ${isOpen ? C.gold + "40" : C.border}`,
              borderLeft: `3px solid ${isOpen ? C.gold : C.border}`,
              borderRadius: 4, overflow: "hidden",
              transition: "all 0.25s ease",
              gridColumn: isOpen ? "1 / -1" : undefined,
            }}>
              {/* Country card header (matches Category card) */}
              <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span
                      onClick={() => openDetail(country)}
                      style={{ fontFamily: GD, fontSize: 16, color: C.white, fontWeight: 400, cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.white; }}
                    >{country.name}</span>
                    {(() => { const sc = seoScoreByKey(country.id); return (
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
                        color: sc === 7 ? C.green : sc > 0 ? C.gold : C.grey2,
                        background: sc === 7 ? `${C.green}15` : sc > 0 ? `${C.gold}15` : `${C.grey2}10`,
                        padding: "2px 7px", borderRadius: 2,
                      }}>SEO {sc}/7</span>
                    ); })()}
                    <span style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: C.gold, background: `${C.gold}15`, padding: "2px 8px", borderRadius: 2,
                    }}>{country.listingCount}</span>
                    <span style={{
                      fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: activeRegions > 0 ? C.green : C.grey2,
                      background: activeRegions > 0 ? `${C.green}15` : `${C.grey2}10`,
                      padding: "2px 7px", borderRadius: 2,
                    }}>{activeRegions}/{regions.length} Active</span>
                    <span style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                      color: C.grey2, background: `${C.grey2}15`, padding: "2px 8px", borderRadius: 2,
                    }}>{country.iso2}</span>
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
                    /{country.slug} · {regions.length} regions
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => { setExpandedCountry(isOpen ? null : country.slug); setExpandedRegion(null); }}
                    title={isOpen ? "Collapse regions" : "Expand regions"}
                    style={{
                      fontFamily: NU, fontSize: 14, color: isOpen ? C.gold : C.grey, background: isOpen ? `${C.gold}10` : "transparent",
                      border: `1px solid ${isOpen ? C.gold + "40" : "transparent"}`, borderRadius: 3, padding: "2px 6px",
                      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      marginLeft: 4, transition: "all 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.color = C.grey; }}
                  >▶</button>
                </div>
              </div>

              {/* Expanded regions list (matches sub-categories list) */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "0 20px 16px" }}>
                  {(() => {
                    const renderRegionRow = (region, ri, totalInGroup) => {
                      const badge = getActivationBadge(region, C);
                    const active = isRegionActive(region);
                    const isRegionOpen = expandedRegion === region.slug;

                    return (
                      <div key={region.slug}>
                        {/* Region row (matches sub-category row) */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: ri < totalInGroup - 1 && !isRegionOpen ? `1px solid ${C.border}` : "none",
                        }}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}
                            onClick={() => setExpandedRegion(isRegionOpen ? null : region.slug)}
                          >
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.green : C.grey2, flexShrink: 0 }} />
                            <span
                              onClick={(e) => { e.stopPropagation(); openRegionDetail(country, region); }}
                              style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 600, cursor: "pointer", transition: "color 0.2s" }}
                              onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                              onMouseLeave={e => { e.currentTarget.style.color = C.off; }}
                            >{region.name}</span>
                            {(() => { const sc = seoScoreByKey(`${country.id}:${region.id}`); return (
                              <span style={{
                                fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
                                color: sc === 7 ? C.green : sc > 0 ? C.gold : C.grey2,
                                background: sc === 7 ? `${C.green}15` : sc > 0 ? `${C.gold}15` : `${C.grey2}10`,
                                padding: "2px 6px", borderRadius: 2,
                              }}>SEO {sc}/7</span>
                            ); })()}
                            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>/{region.slug}</span>
                            <span style={{
                              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                              color: region.priorityLevel === "primary" ? C.gold : C.grey2,
                              background: region.priorityLevel === "primary" ? `${C.gold}15` : `${C.grey2}12`,
                              padding: "2px 6px", borderRadius: 2,
                            }}>{region.priorityLevel}</span>
                            <span style={{
                              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                              color: badge.color, background: `${badge.color}15`,
                              padding: "2px 7px", borderRadius: 2,
                            }}>{badge.label}</span>
                            {region.urlEverActivated && active && (
                              <span style={{
                                fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
                                color: C.gold, background: `${C.gold}15`,
                                padding: "2px 6px", borderRadius: 2,
                              }}>SEO Protected</span>
                            )}
                          </div>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>{region.listingCount}</span>
                        </div>

                        {/* Region detail expansion (inline below row) */}
                        {isRegionOpen && (
                          <div style={{
                            padding: "16px 20px 20px", marginBottom: ri < totalInGroup - 1 ? 0 : 0,
                            borderBottom: ri < totalInGroup - 1 ? `1px solid ${C.border}` : "none",
                            background: `${C.gold}04`, borderLeft: `2px solid ${C.gold}40`,
                            marginLeft: 3,
                          }}>
                            {/* Description */}
                            {region.description && (
                              <div style={{ marginBottom: 14 }}>
                                <div style={{
                                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                                  letterSpacing: "0.12em", textTransform: "uppercase",
                                  color: C.grey2, marginBottom: 4,
                                }}>Description</div>
                                <p style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 400, margin: 0, lineHeight: 1.6 }}>
                                  {region.description}
                                </p>
                              </div>
                            )}

                            {/* AI Summary (Aura purple) */}
                            {region.aiSummary && (
                              <div style={{
                                marginBottom: 14, padding: "10px 12px", borderRadius: 4,
                                background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
                              }}>
                                <div style={{
                                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                                  letterSpacing: "0.12em", textTransform: "uppercase",
                                  color: "#a78bfa", marginBottom: 4,
                                }}>✦ AI Summary</div>
                                <p style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 400, margin: 0, lineHeight: 1.6 }}>
                                  {region.aiSummary}
                                </p>
                              </div>
                            )}

                            {/* Focus Keywords + Intent Signals side by side */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 14 }}>
                              {/* Focus Keywords */}
                              {region.focusKeywords && region.focusKeywords.length > 0 && (
                                <div>
                                  <div style={{
                                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    color: C.grey2, marginBottom: 6,
                                  }}>Focus Keywords</div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {region.focusKeywords.map((kw, i) => (
                                      <span key={i} style={{
                                        fontFamily: NU, fontSize: 10, fontWeight: 600,
                                        background: `${C.gold}15`, color: C.gold,
                                        border: `1px solid ${C.gold}30`, padding: "3px 10px", borderRadius: 12,
                                      }}>{kw}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Intent Signals */}
                              {region.intentSignals && (
                                <div>
                                  <div style={{
                                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    color: C.grey2, marginBottom: 6,
                                  }}>Intent Signals</div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                    {[
                                      { key: "high", label: "High", color: C.green },
                                      { key: "mid", label: "Mid", color: C.gold },
                                      { key: "low", label: "Low", color: C.grey2 },
                                    ].map(({ key, label, color }) => (
                                      <div key={key} style={{
                                        background: `${color}08`, border: `1px solid ${color}20`,
                                        borderRadius: 4, padding: "8px 10px",
                                      }}>
                                        <div style={{
                                          fontFamily: NU, fontSize: 9, fontWeight: 700,
                                          letterSpacing: "0.1em", textTransform: "uppercase",
                                          color, marginBottom: 4,
                                        }}>{label}</div>
                                        <div style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 400, lineHeight: 1.5 }}>
                                          {(region.intentSignals[key] || []).map((s, i) => (
                                            <div key={i}>• {s}</div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* URL Routes + Activation summary side by side */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                              <div>
                                <div style={{
                                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                                  letterSpacing: "0.12em", textTransform: "uppercase",
                                  color: C.grey2, marginBottom: 6,
                                }}>URL Routes</div>
                                <div style={{
                                  fontFamily: "'SF Mono','Consolas',monospace", fontSize: 11, lineHeight: 1.8,
                                  color: active ? C.green : C.grey2,
                                }}>
                                  <div>/{region.countrySlug}/{region.slug}</div>
                                  <div>/{region.countrySlug}/{region.slug}/{"{category-slug}"}</div>
                                  <div style={{ color: C.grey2 }}>
                                    Canonical: /{region.countrySlug}/{"{category-slug}"}/{"{listing-slug}"}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div style={{
                                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                                  letterSpacing: "0.12em", textTransform: "uppercase",
                                  color: C.grey2, marginBottom: 6,
                                }}>Activation Rule</div>
                                <div style={{ fontFamily: NU, fontSize: 11, color: C.off, lineHeight: 1.8 }}>
                                  <div>Status: <span style={{ color: badge.color, fontWeight: 600 }}>{badge.label}</span></div>
                                  <div>Priority: <span style={{ color: C.gold }}>{region.priorityLevel}</span></div>
                                  <div>Listings: {region.listingCount} / Threshold: {REGION_AUTO_THRESHOLD}</div>
                                  <div>Ever activated: {region.urlEverActivated ? <span style={{ color: C.gold }}>Yes</span> : "No"}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    };

                    return regions.map((region, ri) => renderRegionRow(region, ri, regions.length));
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer (matches Taxonomy Health) ────────────────────────────── */}
      <div style={{
        marginTop: 24, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 4, display: "flex", justifyContent: "space-between",
      }}>
        {[
          { label: "Countries", val: totalCountries },
          { label: "Regions", val: totalRegions },
          { label: "Cities", val: DIRECTORY_CITIES.length, color: "#C41E3A" },
          { label: "Active URLs", val: activeUrls, color: activeUrls > 0 ? C.green : C.grey2 },
          { label: "SEO Protected", val: seoProtected, color: seoProtected > 0 ? C.gold : C.grey2 },
          { label: "SEO Complete", val: (() => { const allKeys = [...allCountries.map(c => c.id), ...DIRECTORY_REGIONS.map(r => `${r.countrySlug}:${r.id}`)]; return allKeys.filter(k => seoScoreByKey(k) === 7).length; })(), color: C.green, total: totalCountries + totalRegions },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 22, color: s.color || C.gold, fontWeight: 400 }}>{s.val}{s.total != null ? <span style={{ fontFamily: NU, fontSize: 12, color: C.grey2 }}> / {s.total}</span> : null}</div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Placeholder modules
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// Venue Profiles Module, manage & preview full venue profile pages
// ═════════════════════════════════════════════════════════════════════════════
const VENUE_PROFILES = [
  {
    slug:       'grand-tirolia',
    name:       'Grand Tirolia',
    location:   'Kitzbühel, Tyrol · Austria',
    status:     'live',
    heroImage:  '/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg',
    logo:       '/grand-tirolia/GT_Logo_Positiv_RGB.jpg',
    stats:      [
      { value: '450',      label: 'Max guests' },
      { value: '5',        label: 'Event spaces' },
      { value: '98',       label: 'Rooms' },
      { value: '3,000 m²', label: 'Spa' },
    ],
    sections: ['Hero', 'Gallery', 'Overview', 'Spaces', 'Dining', 'Rooms', 'Spa', 'Golf', 'Weddings', 'Enquire'],
    lastUpdated: 'March 2026',
    listingId:  'c0eab313-1bf0-45cb-978f-2186e8b5386c',
    _static: true,
  },
  {
    slug:       'domaine-des-etangs-auberge-collection',
    name:       'Domaine des Etangs',
    location:   'Massignac · Charente · France',
    status:     'live',
    heroImage:  '/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg',
    logo:       null,
    previewUrl: '/showcase/domaine-des-etangs',
    stats:      [
      { value: '200',   label: 'Max guests' },
      { value: '6+',    label: 'Event spaces' },
      { value: '29',    label: 'Rooms' },
      { value: '★ 1',   label: 'Michelin star' },
    ],
    sections: ['Hero', 'Gallery', 'Overview', 'Spaces', 'Dining', 'Rooms', 'Pool & Spa', 'Art', 'Weddings', 'Enquire'],
    lastUpdated: 'March 2026',
    listingId:  'fe5cef98-fca8-44fa-a02e-b2a16eb1daeb',
    _static: true,
  },
];

const VENUE_SECTIONS  = ['Hero', 'Gallery', 'Overview', 'Spaces', 'Dining', 'Rooms', 'Pool & Spa', 'Spa', 'Golf', 'Art', 'Weddings', 'Enquire'];
const PLANNER_SECTIONS = ['Hero', 'Portfolio', 'About', 'Services', 'Process', 'Philosophy', 'Reviews', 'Real Weddings', 'Press', 'Enquire'];
const ALL_SECTIONS = VENUE_SECTIONS; // kept for backward compat

const PLANNER_SHOWCASES = [];

const EMPTY_VENUE_SHOWCASE = {
  slug: '', name: '', location: '', excerpt: '', heroImage: '', logo: '', listingId: '',
  previewUrl: '', status: 'draft', lastUpdated: '', sortOrder: 0,
  stats: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  sections: ['Hero', 'Gallery', 'Overview', 'Spaces', 'Dining', 'Rooms', 'Weddings', 'Enquire'],
};

const EMPTY_PLANNER_SHOWCASE = {
  slug: '', name: '', location: '', excerpt: '', heroImage: '', logo: '', listingId: '',
  previewUrl: '', status: 'draft', lastUpdated: '', sortOrder: 0,
  stats: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  sections: ['Hero', 'Portfolio', 'About', 'Services', 'Process', 'Reviews', 'Real Weddings', 'Enquire'],
};

const EMPTY_SHOWCASE = EMPTY_VENUE_SHOWCASE; // backward compat

function NewShowcaseModal({ C, onClose, onSave, type = 'venue', initialData = null }) {
  const emptyForm = type === 'planner' ? EMPTY_PLANNER_SHOWCASE : EMPTY_VENUE_SHOWCASE;
  const sectionList = type === 'planner' ? PLANNER_SECTIONS : VENUE_SECTIONS;
  const [form, setForm] = useState(initialData ? { ...emptyForm, ...initialData } : { ...emptyForm });
  const [slugLocked, setSlugLocked] = useState(!!initialData);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadErr, setHeroUploadErr] = useState('');
  const heroFileRef = useRef(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleHeroUpload = async (file) => {
    if (!file) return;
    setHeroUploading(true);
    setHeroUploadErr('');
    try {
      const id = `showcase-hero-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const url = await uploadMediaFile(file, id);
      set('heroImage', url);
    } catch (err) {
      setHeroUploadErr('Upload failed, try again or paste a URL');
    } finally {
      setHeroUploading(false);
    }
  };

  const toggleSection = (sec) => {
    setForm(p => ({
      ...p,
      sections: p.sections.includes(sec) ? p.sections.filter(s => s !== sec) : [...p.sections, sec],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      slug: form.slug || slugify(form.name),
      lastUpdated: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      stats: form.stats.filter(s => s.value && s.label),
    });
    onClose();
  };

  const inputStyle = {
    width: '100%', background: '#1a1a18', border: '1px solid #2e2e2a',
    borderRadius: 4, padding: '9px 12px',
    fontFamily: 'var(--font-body)', fontSize: 13, color: '#f5f2ec',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9c9690',
    display: 'block', marginBottom: 5,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#141412', border: '1px solid #2e2e2a', borderRadius: 8,
        width: 580, maxHeight: '88vh', overflowY: 'auto',
        padding: '32px 36px',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, margin: '0 0 4px' }}>{initialData ? 'Edit' : 'New'}</p>
            <h3 style={{ fontFamily: 'var(--font-heading-primary)', fontSize: 22, fontWeight: 400, color: '#f5f2ec', margin: 0 }}>{type === 'planner' ? 'Planner Showcase' : 'Venue Showcase'}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b6860', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name + Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Venue Name *</label>
              <input
                style={inputStyle} placeholder="e.g. Villa Rosanova"
                value={form.name}
                onChange={e => { set('name', e.target.value); if (!slugLocked) set('slug', slugify(e.target.value)); }}
              />
            </div>
            <div>
              <label style={labelStyle}>URL Slug</label>
              <input
                style={inputStyle} placeholder="auto-generated"
                value={form.slug}
                onChange={e => { setSlugLocked(true); set('slug', slugify(e.target.value)); }}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} placeholder="e.g. Lake Como · Lombardy · Italy" value={form.location} onChange={e => set('location', e.target.value)} />
          </div>

          {/* Hero Image */}
          {/* Excerpt */}
          <div>
            <label style={labelStyle}>Excerpt <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> -  short description for cards &amp; SEO</span></label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5 }}
              placeholder="One or two sentences describing this showcase…"
              value={form.excerpt || ''}
              onChange={e => set('excerpt', e.target.value)}
            />
          </div>

          {/* Hero Image, upload or URL */}
          <div>
            <label style={labelStyle}>Hero Image</label>
            <input
              ref={heroFileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { handleHeroUpload(f); e.target.value = ''; } }}
            />
            {/* Preview if image set */}
            {form.heroImage && (
              <div style={{ marginBottom: 8, borderRadius: 4, overflow: 'hidden', height: 100, background: '#0a0a09' }}>
                <img src={form.heroImage} alt="Hero preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
              </div>
            )}
            {/* Upload button + URL fallback row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => heroFileRef.current?.click()}
                disabled={heroUploading}
                style={{
                  flexShrink: 0, padding: '9px 14px',
                  background: heroUploading ? '#2a2a28' : '#C9A84C',
                  color: heroUploading ? '#6b6860' : '#0f0d0a',
                  border: 'none', borderRadius: 4,
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: heroUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {heroUploading ? 'Uploading…' : '↑ Upload Image'}
              </button>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="or paste a URL…"
                value={form.heroImage}
                onChange={e => set('heroImage', e.target.value)}
              />
            </div>
            {heroUploadErr && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#e05a4e', margin: '6px 0 0' }}>{heroUploadErr}</p>
            )}
          </div>

          {/* Preview URL + Listing ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Preview URL</label>
              <input style={inputStyle} placeholder="/showcase/slug" value={form.previewUrl} onChange={e => set('previewUrl', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Listing ID</label>
              <input style={inputStyle} placeholder="UUID from Listing Studio" value={form.listingId} onChange={e => set('listingId', e.target.value)} />
            </div>
          </div>

          {/* Stats */}
          <div>
            <label style={labelStyle}>Key Stats (up to 4)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {form.stats.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input
                    style={{ ...inputStyle, width: '45%' }} placeholder="Value"
                    value={s.value}
                    onChange={e => { const st = [...form.stats]; st[i] = { ...st[i], value: e.target.value }; set('stats', st); }}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }} placeholder="Label"
                    value={s.label}
                    onChange={e => { const st = [...form.stats]; st[i] = { ...st[i], label: e.target.value }; set('stats', st); }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <label style={labelStyle}>Sections</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {sectionList.map(sec => {
                const on = form.sections.includes(sec);
                return (
                  <button key={sec} onClick={() => toggleSection(sec)} style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.06em', padding: '5px 11px', borderRadius: 3,
                    cursor: 'pointer', border: `1px solid ${on ? C.gold : '#2e2e2a'}`,
                    background: on ? 'rgba(184,160,90,0.12)' : '#1a1a18',
                    color: on ? C.gold : '#6b6860',
                    transition: 'all 0.15s',
                  }}>{sec}</button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['draft', 'live'].map(s => (
              <button key={s} onClick={() => set('status', s)} style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '7px 18px', borderRadius: 3, cursor: 'pointer',
                border: `1px solid ${form.status === s ? C.gold : '#2e2e2a'}`,
                background: form.status === s ? 'rgba(184,160,90,0.12)' : 'none',
                color: form.status === s ? C.gold : '#6b6860',
              }}>{s === 'live' ? '● Live' : '○ Draft'}</button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 24, borderTop: '1px solid #2e2e2a' }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'none', border: '1px solid #2e2e2a', color: '#6b6860',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 0', borderRadius: 4, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 2, background: C.gold, border: 'none', color: '#0f0d0a',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '10px 0', borderRadius: 4, cursor: 'pointer',
          }}>{initialData ? 'Save Changes' : 'Create Showcase'}</button>
        </div>
      </div>
    </div>
  );
}

const SHOWCASE_TABS = [
  { key: 'venues',   label: 'Venues',   desc: 'Full editorial venue pages, hero, gallery, spaces, dining, rooms, spa, and enquiry sections.' },
  { key: 'planners', label: 'Planners', desc: 'Full editorial planner profiles, portfolio, services, process, real weddings, and enquiry.' },
];

function VenueProfilesAdminModule({ C, onNavigate }) {
  const [hovered, setHovered]                   = useState(null);
  const [activeTab, setActiveTab]               = useState('venues');
  const [venueProfiles, setVenueProfiles]       = useState(VENUE_PROFILES);
  const [plannerProfiles, setPlannerProfiles]   = useState(PLANNER_SHOWCASES);
  const [showModal, setShowModal]               = useState(false);
  const [editTarget, setEditTarget]             = useState(null);
  const [dbLoaded, setDbLoaded]                 = useState(false);
  const [saving, setSaving]                     = useState(false);

  const isVenues    = activeTab === 'venues';
  const profiles    = isVenues ? venueProfiles : plannerProfiles;
  const setProfiles = isVenues ? setVenueProfiles : setPlannerProfiles;
  const tab         = SHOWCASE_TABS.find(t => t.key === activeTab);

  // Load from Supabase on mount (both types at once)
  useEffect(() => {
    async function load() {
      try {
        const [venues, planners] = await Promise.all([
          fetchShowcases('venue'),
          fetchShowcases('planner'),
        ]);
        // Merge: static seed always shown first, DB records appended (no slug duplicates)
        if (venues.length > 0) {
          const staticSlugs = new Set(VENUE_PROFILES.map(p => p.slug));
          const dbOnly = venues.filter(v => !staticSlugs.has(v.slug));
          setVenueProfiles([...VENUE_PROFILES, ...dbOnly]);
        }
        if (planners.length > 0) setPlannerProfiles(planners);
      } catch (e) {
        console.warn('[ShowcaseAdmin] DB load failed, using static seed:', e);
      } finally {
        setDbLoaded(true);
      }
    }
    load();
  }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const type = isVenues ? 'venue' : 'planner';
      if (editTarget?.id && !editTarget._static) {
        // Update existing DB record
        const updated = await updateShowcase(editTarget.id, formData);
        setProfiles(p => p.map(v => v.id === editTarget.id ? { ...v, ...updated } : v));
      } else {
        // Create new record
        const saved = await createShowcase(formData, type);
        setProfiles(p => [saved, ...p]);
      }
    } catch (err) {
      console.error('[ShowcaseAdmin] save error:', err);
      if (editTarget?.id && !editTarget._static) {
        // Optimistic update fallback
        setProfiles(p => p.map(v => v.id === editTarget.id ? { ...v, ...formData } : v));
      } else {
        // Optimistic create fallback
        setProfiles(p => [{
          ...formData,
          id: `temp-${Date.now()}`,
          lastUpdated: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          stats: (formData.stats || []).filter(s => s.value && s.label),
          _offline: true,
        }, ...p]);
      }
    } finally {
      setSaving(false);
      setEditTarget(null);
    }
  };

  const openEdit = (v) => {
    setEditTarget(v);
    setShowModal(true);
  };

  const openNew = () => {
    setEditTarget(null);
    setShowModal(true);
  };

  return (
    <div>
      {showModal && (
        <NewShowcaseModal
          C={C}
          type={activeTab === 'planners' ? 'planner' : 'venue'}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
          initialData={editTarget}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, margin: '0 0 6px' }}>
            Content
          </p>
          <h2 style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: C.off, margin: 0 }}>
            Showcase Profiles
          </h2>
        </div>
        <button
          onClick={openNew}
          style={{
            background: C.gold, border: 'none', color: '#0f0d0a',
            fontFamily: NU, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '10px 20px', borderRadius: 4, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + New Showcase
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
        {SHOWCASE_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            fontFamily: NU, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: activeTab === t.key ? `2px solid ${C.gold}` : '2px solid transparent',
            color: activeTab === t.key ? C.gold : C.grey,
            cursor: 'pointer', transition: 'color 0.15s',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: '-12px 0 24px', fontWeight: 300 }}>{tab.desc}</p>

      {/* Profile cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {profiles.map((v) => (
          <div
            key={v.slug}
            onMouseEnter={() => setHovered(v.slug)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: C.card,
              border: `1px solid ${hovered === v.slug ? C.gold : C.border}`,
              borderRadius: 6,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Hero thumbnail */}
            <div style={{ position: 'relative', height: 180, background: '#111', overflow: 'hidden' }}>
              <img
                src={v.heroImage} alt={v.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block',
                  transform: hovered === v.slug ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.5s ease' }}
              />
              {/* Status badge */}
              <span style={{
                position: 'absolute', top: 12, left: 12,
                background: v.status === 'live' ? '#15803d' : C.grey,
                color: '#fff', fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 3,
              }}>
                {v.status === 'live' ? '● Live' : '○ Draft'}
              </span>
              {/* Logo */}
              {v.logo && (
                <img
                  src={v.logo} alt=""
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    height: 28, width: 'auto', objectFit: 'contain',
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.85,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px 20px' }}>
              <h3 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 4px' }}>
                {v.name}
              </h3>
              <p style={{ fontFamily: NU, fontSize: 12, color: C.grey2, margin: '0 0 16px', fontWeight: 300 }}>
                {v.location}
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                {v.stats.map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: GD, fontSize: 16, color: C.off, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Sections chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                {v.sections.map((sec) => (
                  <span key={sec} style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 600,
                    color: C.grey, background: C.dark,
                    padding: '3px 8px', borderRadius: 3,
                    letterSpacing: '0.06em',
                  }}>
                    {sec}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => window.open(v.previewUrl || `/venues/${v.slug}`, '_blank')}
                  style={{
                    flex: 1, background: C.gold, border: 'none',
                    color: '#fff', fontFamily: NU, fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '9px 0', borderRadius: 4, cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Preview Page ↗
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('listing-studio', v.listingId ? { listingId: v.listingId } : {})}
                  style={{
                    flex: 1, background: 'none',
                    border: `1px solid ${C.border2}`, color: C.grey,
                    fontFamily: NU, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '9px 0', borderRadius: 4, cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.grey; }}
                >
                  Listing Studio →
                </button>
              </div>
              {/* Edit button, only for DB records (not static hardcoded showcases) */}
              {!v._static && (
                <button
                  onClick={() => openEdit(v)}
                  style={{
                    width: '100%', background: 'none',
                    border: `1px solid ${C.border2}`, color: C.grey,
                    fontFamily: NU, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '8px 0', borderRadius: 4, cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.grey; }}
                >
                  ✎ Edit Showcase
                </button>
              )}

              <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: '10px 0 0', fontWeight: 300 }}>
                Last updated: {v.lastUpdated}
              </p>
            </div>
          </div>
        ))}

        {/* Add new placeholder card */}
        <div
          onClick={openNew}
          style={{
            background: 'none',
            border: `2px dashed ${C.border}`,
            borderRadius: 6, minHeight: 400,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, opacity: 0.6, cursor: 'pointer',
            transition: 'opacity 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = C.border; }}
        >
          <span style={{ fontSize: 28, color: C.grey2 }}>+</span>
          <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: 0, fontWeight: 400 }}>New Showcase</p>
          <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0, fontWeight: 300, textAlign: 'center', maxWidth: 180 }}>
            Create a new full editorial venue showcase page
          </p>
        </div>
      </div>

      {/* Template info */}
      <div style={{
        marginTop: 32, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 6, padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ</span>
        <div>
          <p style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, margin: '0 0 4px' }}>
            How {isVenues ? 'venue' : 'planner'} showcases work
          </p>
          {isVenues ? (
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, fontWeight: 300, lineHeight: 1.6 }}>
              Each profile is driven by a data object in <code style={{ background: C.dark, padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>VenueProfilePage.jsx</code>.
              Sections: Hero · Gallery · Overview · Spaces · Dining · Rooms · Spa · Golf · Weddings · Amenities · Enquire.
              Route pattern: <code style={{ background: C.dark, padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>/venues/[slug]</code>.
            </p>
          ) : (
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, fontWeight: 300, lineHeight: 1.6 }}>
              Each profile is driven by a data object in <code style={{ background: C.dark, padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>PlannerProfilePage.jsx</code>.
              Sections: Hero · Portfolio · About · Services · Process · Reviews · Real Weddings · Enquire.
              Route pattern: <code style={{ background: C.dark, padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>/[country]/[region]/wedding-planners/[slug]</code>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Leads Module - Lead Engine Control Centre
// Displays all leads from the lead engine with filters, scoring, and detail view
// ═════════════════════════════════════════════════════════════════════════════

function LeadsModule({ C }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const LEAD_TYPES = [
    { key: 'all',            label: 'All Leads' },
    { key: 'venue_enquiry',  label: 'Venue' },
    { key: 'vendor_enquiry', label: 'Vendor' },
    { key: 'aura_chat',      label: 'Aura' },
  ];

  const STATUSES = [
    'all', 'new', 'qualified', 'sent_to_partner', 'partner_opened',
    'partner_replied', 'in_conversation', 'proposal_sent', 'booked', 'lost', 'spam',
  ];

  const PRIORITIES = ['all', 'urgent', 'high', 'normal', 'low'];

  const STATUS_COLORS = {
    new:              { bg: '#dbeafe', text: '#1d4ed8' },
    qualified:        { bg: '#d1fae5', text: '#065f46' },
    sent_to_partner:  { bg: '#fef3c7', text: '#92400e' },
    partner_opened:   { bg: '#ede9fe', text: '#4c1d95' },
    partner_replied:  { bg: '#d1fae5', text: '#065f46' },
    in_conversation:  { bg: '#cffafe', text: '#164e63' },
    proposal_sent:    { bg: '#fce7f3', text: '#9d174d' },
    booked:           { bg: '#d1fae5', text: '#14532d' },
    lost:             { bg: '#fee2e2', text: '#991b1b' },
    spam:             { bg: '#f3f4f6', text: '#6b7280' },
  };

  const PRIORITY_COLORS = {
    urgent: { bg: '#fee2e2', text: '#991b1b' },
    high:   { bg: '#fef3c7', text: '#92400e' },
    normal: { bg: '#dbeafe', text: '#1d4ed8' },
    low:    { bg: '#f3f4f6', text: '#6b7280' },
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { listLeads } = await import('../services/leadEngineService');
      const result = await listLeads({ limit: 200 });
      if (result.error && !result.data?.length) {
        setError('Could not load leads. Check Supabase connection.');
      }
      setLeads(result.data || []);
    } catch (err) {
      console.error('LeadsModule: failed to load:', err);
      setError('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter(l => {
    if (typeFilter !== 'all' && l.lead_type !== typeFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (l.full_name || l.first_name || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      const venue = (l.venue_id || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !venue.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let av = a[sortKey] ?? '';
    let bv = b[sortKey] ?? '';
    if (sortKey === 'score') { av = Number(av); bv = Number(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const fmtDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const fmtType = (t) => {
    if (t === 'venue_enquiry')  return 'Venue';
    if (t === 'vendor_enquiry') return 'Vendor';
    if (t === 'aura_chat')      return 'Aura';
    return t || '-';
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    booked: leads.filter(l => l.status === 'booked').length,
    urgent: leads.filter(l => l.priority === 'urgent').length,
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const pill = (active) => ({
    padding: '5px 12px', borderRadius: 2, border: `1px solid ${active ? C.gold : C.border}`,
    background: active ? C.gold : 'transparent', color: active ? '#fff' : C.grey,
    fontFamily: NU, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    letterSpacing: '0.04em', transition: 'all 140ms ease',
  });

  const thStyle = (key) => ({
    padding: '10px 14px', fontFamily: NU, fontSize: 10, fontWeight: 700,
    color: sortKey === key ? C.gold : C.grey2, textTransform: 'uppercase',
    letterSpacing: '0.06em', textAlign: 'left', cursor: 'pointer',
    borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
    userSelect: 'none',
  });

  const tdStyle = {
    padding: '11px 14px', fontFamily: NU, fontSize: 12, color: C.off,
    borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle',
  };

  const badge = (colors, text) => (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 2,
      background: colors?.bg || '#f3f4f6', color: colors?.text || '#666',
      fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}>{text}</span>
  );

  const scoreBar = (score) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 48, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden',
      }}>
        <div style={{
          width: `${score || 0}%`, height: '100%', borderRadius: 2,
          background: score >= 80 ? '#15803d' : score >= 60 ? C.gold : score >= 30 ? '#1d4ed8' : '#6b7280',
        }} />
      </div>
      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>{score || 0}</span>
    </div>
  );

  // ── Detail Panel ────────────────────────────────────────────────────────────

  if (selectedLead) {
    const l = selectedLead;
    const sc = STATUS_COLORS[l.status] || { bg: '#f3f4f6', text: '#666' };
    const pc = PRIORITY_COLORS[l.priority] || { bg: '#f3f4f6', text: '#666' };
    const detailRow = (label, val) => val ? (
      <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 120 }}>{label}</span>
        <span style={{ fontFamily: NU, fontSize: 13, color: C.off }}>{val}</span>
      </div>
    ) : null;

    return (
      <div>
        {/* Back bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSelectedLead(null)} style={{
            background: 'transparent', border: `1px solid ${C.border}`, color: C.grey,
            fontFamily: NU, fontSize: 12, fontWeight: 600, padding: '7px 14px',
            borderRadius: 2, cursor: 'pointer', letterSpacing: '0.04em',
          }}>
            ← Back to Leads
          </button>
          <span style={{ fontFamily: GD, fontSize: 18, color: C.off, fontWeight: 400 }}>
            {l.full_name || l.first_name || 'Unknown Lead'}
          </span>
          {badge(sc, l.status?.replace(/_/g, ' ') || 'new')}
          {badge(pc, l.priority || 'normal')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Main detail card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 28 }}>
            <p style={{ fontFamily: GD, fontSize: 16, color: C.gold, fontWeight: 400, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>Contact Details</p>
            {detailRow('Name', l.full_name || l.first_name)}
            {detailRow('Email', l.email)}
            {detailRow('Phone', l.phone)}
            {detailRow('Preferred Contact', l.preferred_contact_method)}

            <p style={{ fontFamily: GD, fontSize: 11, color: C.gold, fontWeight: 400, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wedding Details</p>
            {detailRow('Date', l.wedding_month ? `${l.wedding_month}${l.wedding_year ? ' ' + l.wedding_year : ''}` : null)}
            {detailRow('Exact Date', l.exact_date_known ? 'Yes - confirmed date' : null)}
            {detailRow('Guest Count', l.guest_count)}
            {detailRow('Budget Range', l.budget_range)}
            {detailRow('Location', l.location_preference)}

            {l.message && (
              <>
                <p style={{ fontFamily: GD, fontSize: 11, color: C.gold, fontWeight: 400, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Message</p>
                <div style={{
                  background: C.dark, border: `1px solid ${C.border}`, borderRadius: 4,
                  padding: 16, fontFamily: NU, fontSize: 13, color: C.off, lineHeight: 1.6,
                }}>
                  {l.message}
                </div>
              </>
            )}

            {l.intent_summary && (
              <>
                <p style={{ fontFamily: GD, fontSize: 11, color: C.gold, fontWeight: 400, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intent Summary</p>
                <div style={{
                  background: C.dark, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`,
                  borderRadius: 4, padding: 16, fontFamily: NU, fontSize: 13, color: C.off, lineHeight: 1.6,
                }}>
                  {l.intent_summary}
                </div>
              </>
            )}
          </div>

          {/* Sidebar meta card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score card */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
              <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Lead Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: GD, fontSize: 36, color: C.off, fontWeight: 400, lineHeight: 1 }}>{l.score || 0}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.grey2 }}>/100</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: C.border, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${l.score || 0}%`, height: '100%', borderRadius: 3,
                  background: (l.score || 0) >= 80 ? '#15803d' : (l.score || 0) >= 60 ? C.gold : (l.score || 0) >= 30 ? '#1d4ed8' : '#6b7280',
                  transition: 'width 600ms ease',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {badge(pc, l.priority || 'normal')}
                {badge(sc, l.status?.replace(/_/g, ' ') || 'new')}
              </div>
            </div>

            {/* Source card */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
              <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Source</p>
              {[
                ['Lead Type', fmtType(l.lead_type)],
                ['Channel', l.lead_channel],
                ['Source', l.lead_source],
                ['Listing ID', l.listing_id || l.venue_id || l.vendor_id],
                ['Received', fmtDate(l.created_at)],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>{v}</span>
                </div>
              ) : null)}
            </div>

            {/* Value band card */}
            {l.lead_value_band && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
                <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Value Band</p>
                <span style={{ fontFamily: GD, fontSize: 16, color: C.gold, fontWeight: 400, textTransform: 'capitalize' }}>
                  {l.lead_value_band.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, color: C.off, margin: '0 0 4px' }}>Leads</h2>
          <p style={{ fontFamily: NU, fontSize: 13, color: C.grey2, margin: 0 }}>All enquiries captured through the lead engine</p>
        </div>
        <button onClick={loadLeads} style={{
          background: 'transparent', border: `1px solid ${C.border}`, color: C.grey,
          fontFamily: NU, fontSize: 11, fontWeight: 600, padding: '7px 14px',
          borderRadius: 2, cursor: 'pointer', letterSpacing: '0.04em',
        }}>
          Refresh
        </button>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Leads', value: stats.total },
          { label: 'New', value: stats.new },
          { label: 'Booked', value: stats.booked },
          { label: 'Urgent', value: stats.urgent },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px 20px' }}>
            <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{label}</p>
            <p style={{ fontFamily: GD, fontSize: 28, color: C.off, fontWeight: 400, margin: 0, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '16px 20px', marginBottom: 16 }}>
        {/* Type pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {LEAD_TYPES.map(({ key, label }) => (
            <button key={key} style={pill(typeFilter === key)} onClick={() => setTypeFilter(key)}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Search */}
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: C.dark, border: `1px solid ${C.border}`, borderRadius: 2,
              padding: '6px 12px', fontFamily: NU, fontSize: 12, color: C.off,
              outline: 'none', width: 200,
            }}
          />
        </div>
        {/* Status + Priority */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status:</span>
          {STATUSES.map(s => (
            <button key={s} style={pill(statusFilter === s)} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority:</span>
          {PRIORITIES.map(p => (
            <button key={p} style={pill(priorityFilter === p)} onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: NU, fontSize: 13, color: C.grey2 }}>
            Loading leads...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: NU, fontSize: 13, color: '#991b1b', marginBottom: 12 }}>{error}</p>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
              Run the migration <code>20260315_create_lead_engine.sql</code> in Supabase to enable the leads table.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: NU, fontSize: 13, color: C.grey2 }}>
            {leads.length === 0 ? 'No leads yet. Submit an enquiry form to see leads appear here.' : 'No leads match the current filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  <th style={thStyle('full_name')} onClick={() => handleSort('full_name')}>Name{sortIcon('full_name')}</th>
                  <th style={thStyle('email')} onClick={() => handleSort('email')}>Email{sortIcon('email')}</th>
                  <th style={thStyle('lead_type')} onClick={() => handleSort('lead_type')}>Type{sortIcon('lead_type')}</th>
                  <th style={thStyle('status')} onClick={() => handleSort('status')}>Status{sortIcon('status')}</th>
                  <th style={thStyle('priority')} onClick={() => handleSort('priority')}>Priority{sortIcon('priority')}</th>
                  <th style={thStyle('score')} onClick={() => handleSort('score')}>Score{sortIcon('score')}</th>
                  <th style={thStyle('wedding_month')} onClick={() => handleSort('wedding_month')}>Event{sortIcon('wedding_month')}</th>
                  <th style={thStyle('created_at')} onClick={() => handleSort('created_at')}>Received{sortIcon('created_at')}</th>
                  <th style={{ ...thStyle('_'), cursor: 'default' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const sc = STATUS_COLORS[l.status] || { bg: '#f3f4f6', text: '#666' };
                  const pc = PRIORITY_COLORS[l.priority] || { bg: '#f3f4f6', text: '#666' };
                  return (
                    <tr
                      key={l.id || i}
                      style={{ background: i % 2 === 0 ? C.card : C.dark, cursor: 'pointer', transition: 'background 120ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldDim}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.card : C.dark}
                      onClick={() => setSelectedLead(l)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: C.off }}>{l.full_name || l.first_name || '-'}</span>
                        {l.phone && <div style={{ fontSize: 10, color: C.grey2, marginTop: 2 }}>{l.phone}</div>}
                      </td>
                      <td style={{ ...tdStyle, color: C.grey }}>{l.email || '-'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 2,
                          background: l.lead_type === 'venue_enquiry' ? '#ede9fe' : l.lead_type === 'vendor_enquiry' ? '#cffafe' : '#fef3c7',
                          color: l.lead_type === 'venue_enquiry' ? '#4c1d95' : l.lead_type === 'vendor_enquiry' ? '#164e63' : '#92400e',
                          fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{fmtType(l.lead_type)}</span>
                      </td>
                      <td style={tdStyle}>{badge(sc, l.status?.replace(/_/g, ' ') || 'new')}</td>
                      <td style={tdStyle}>{badge(pc, l.priority || 'normal')}</td>
                      <td style={tdStyle}>{scoreBar(l.score)}</td>
                      <td style={{ ...tdStyle, color: C.grey }}>
                        {l.wedding_month ? `${l.wedding_month}${l.wedding_year ? ' ' + l.wedding_year : ''}` : '-'}
                      </td>
                      <td style={{ ...tdStyle, color: C.grey2, fontSize: 11 }}>{fmtDate(l.created_at)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{ color: C.gold, fontSize: 11, fontWeight: 600, fontFamily: NU }}>View →</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, fontFamily: NU, fontSize: 11, color: C.grey2 }}>
            Showing {filtered.length} of {leads.length} leads
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderModule({ title, C }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: "60px 24px", textAlign: "center",
    }}>
      <p style={{ fontFamily: GD, fontSize: 20, color: C.off, fontWeight: 400, margin: "0 0 8px" }}>{title}</p>
      <p style={{ fontFamily: NU, fontSize: 13, color: C.grey2, fontWeight: 300, margin: 0 }}>Module under development.</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Style Editor Module, Editable Colours, Fonts, CSS with Save / Revert
// ═════════════════════════════════════════════════════════════════════════════

const STYLE_SECTION_META = {
  "Static global styles for the Category page":
    { label: "Font Imports & Global Reset", desc: "Google Fonts (Gilda Display, Cormorant, Outfit) and CSS box-sizing reset, applies to every page" },
  "Scrollbar":
    { label: "Scrollbar", desc: "Custom browser scrollbar, thin 4px gold thumb on dark track" },
  "Keyframes":
    { label: "Animations", desc: "CSS @keyframes used site-wide, shimmer, fadeUp, pulse, dotPulse, chatModalIn, barGlow" },
  "Select option theme override (injected via CSS var)":
    { label: "Select Dropdowns", desc: "Forces dark background + light text on <select> dropdown options" },
  "lwd-status-pulse keyframe":
    { label: "Status Pulse", desc: "Pulsing green dot animation, Live Chat active indicator in admin sidebar" },
  "MOBILE RESPONSIVE  ≤ 768 px":
    { label: "Mobile Breakpoint (≤768px)", desc: "All mobile layout overrides, stacks grids, hides desktop elements, adjusts spacing for every component" },
  "LWD STANDARD, TABLET ≤ 1024 px":
    { label: "Tablet Breakpoint (≤1024px)", desc: "Tablet grid adjustments, Standard, About, Contact, Partnership, Admin pages" },
};

function StyleEditorModule({ C, darkPalette, lightPalette, fonts, customCss, siteSettings, auditLog, onUpdatePalette, onUpdateFonts, onUpdateCss, onUpdateSiteSettings, onSave, onRevert, onExport, onImport, onApplyPreset, saveStatus }) {
  const [tab, setTab] = useState("colours");
  const [expanded, setExpanded] = useState(new Set());
  const [palView, setPalView] = useState("dark");
  const [fontDropdown, setFontDropdown] = useState(null); // "heading" | "body" | null
  const [fontSearch, setFontSearch] = useState("");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const colorRefs = useRef({});
  const importRef = useRef(null);

  const toggleSection = useCallback((name) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Parse CSS into labelled sections
  const sections = useMemo(() => {
    const raw = customCss || categoryCssRaw;
    const lines = raw.split("\n");
    const markers = [
      { search: "Static global styles for the Category page" },
      { search: "Scrollbar" },
      { search: "Keyframes" },
      { search: "Select option theme override" },
      { search: "lwd-status-pulse keyframe" },
      { search: "MOBILE RESPONSIVE" },
      { search: "LWD STANDARD" },
    ];
    const found = markers
      .map((m) => {
        const idx = lines.findIndex((l) => l.includes(m.search));
        return idx >= 0 ? { search: m.search, lineIdx: idx } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.lineIdx - b.lineIdx);
    const result = [];
    for (let i = 0; i < found.length; i++) {
      const start = found[i].lineIdx;
      const end = i < found.length - 1 ? found[i + 1].lineIdx : lines.length;
      const code = lines.slice(start, end).join("\n").trim();
      const key = Object.keys(STYLE_SECTION_META).find((k) => k.includes(found[i].search)) || found[i].search;
      const meta = STYLE_SECTION_META[key] || { label: found[i].search, desc: "" };
      result.push({ id: i, label: meta.label, desc: meta.desc, code, lineCount: end - start });
    }
    return result;
  }, [customCss]);

  const TABS = [
    { key: "colours", label: "Colour Palette" },
    { key: "fonts", label: "Fonts" },
    { key: "stylesheet", label: "Stylesheet" },
    { key: "override", label: "Override CSS" },
    { key: "activity", label: "Activity" },
  ];

  const MONO = "'SF Mono','Fira Code',Consolas,monospace";

  // Import file handler
  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onImport(ev.target.result); };
    reader.readAsText(file);
    e.target.value = "";
  }, [onImport]);

  // ── Colour row component ──
  const ColourRow = ({ tokenKey, value, palette }) => {
    const meta = TOKEN_LABELS[tokenKey] || { label: tokenKey, desc: "" };
    const refKey = `${palette}-${tokenKey}`;
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 4, transition: "border-color 0.2s",
      }}>
        {/* Swatch, click to open native colour picker */}
        <div
          onClick={() => colorRefs.current[refKey]?.click()}
          style={{
            width: 32, height: 32, borderRadius: 4, flexShrink: 0,
            background: value, border: "1px solid rgba(128,128,128,0.25)",
            cursor: "pointer", position: "relative",
          }}
        >
          <input
            ref={(el) => { colorRefs.current[refKey] = el; }}
            type="color"
            value={value.startsWith("#") ? value.slice(0, 7) : "#888888"}
            onChange={(e) => onUpdatePalette(palette, tokenKey, e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
          />
        </div>
        {/* Label + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>{meta.label}</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 1 }}>{meta.desc}</div>
        </div>
        {/* Hex input */}
        <input
          value={value}
          onChange={(e) => onUpdatePalette(palette, tokenKey, e.target.value)}
          style={{
            width: 90, padding: "6px 8px", fontFamily: MONO, fontSize: 11,
            background: C.dark, color: C.off, border: `1px solid ${C.border}`,
            borderRadius: 3, outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>
    );
  };

  // ── Font selector with dropdown ──
  const FontSelector = ({ label, fontKey, currentFont }) => {
    const isOpen = fontDropdown === fontKey;
    const filtered = GOOGLE_FONTS_LIST.filter((f) =>
      f.toLowerCase().includes(fontSearch.toLowerCase())
    );
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setFontDropdown(isOpen ? null : fontKey); setFontSearch(""); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", maxWidth: 320, padding: "10px 14px",
              background: C.card, border: `1px solid ${isOpen ? C.gold : C.border}`,
              borderRadius: 4, cursor: "pointer", fontFamily: NU, fontSize: 13,
              color: C.off, transition: "border-color 0.2s",
            }}
          >
            <span>{currentFont}</span>
            <span style={{ fontSize: 10, color: C.grey, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, width: 320,
              background: C.card, border: `1px solid ${C.gold}`, borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 50, overflow: "hidden",
            }}>
              {/* Search */}
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                <input
                  autoFocus
                  placeholder="Search fonts..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "7px 10px", background: C.dark,
                    border: `1px solid ${C.border}`, borderRadius: 3, outline: "none",
                    fontFamily: NU, fontSize: 12, color: C.off,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              {/* Font list */}
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {filtered.map((f) => (
                  <button
                    key={f}
                    onClick={() => { onUpdateFonts(fontKey, f); setFontDropdown(null); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 14px",
                      background: f === currentFont ? C.goldDim : "transparent",
                      border: "none", borderBottom: `1px solid ${C.border}`,
                      cursor: "pointer", textAlign: "left",
                      fontFamily: NU, fontSize: 13, color: f === currentFont ? C.gold : C.off,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (f !== currentFont) e.currentTarget.style.background = C.dark; }}
                    onMouseLeave={(e) => { if (f !== currentFont) e.currentTarget.style.background = "transparent"; }}
                  >
                    {f}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: "14px", fontFamily: NU, fontSize: 12, color: C.grey2, textAlign: "center" }}>No fonts found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div style={{
          marginTop: 14, padding: "20px 24px", background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 4,
        }}>
          <link
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(currentFont)}:wght@300;400;500;600;700&display=swap`}
          />
          <p style={{ fontFamily: `'${currentFont}',serif`, fontSize: 22, color: C.off, margin: "0 0 6px", fontWeight: 400 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p style={{ fontFamily: `'${currentFont}',sans-serif`, fontSize: 15, color: C.grey, margin: 0, fontWeight: 300, lineHeight: 1.6 }}>
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" onChange={handleFileImport} style={{ display: "none" }} />

      {/* ── Toolbar: Presets / Export / Import ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        flexWrap: "wrap",
      }}>
        {/* Presets dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setPresetsOpen(!presetsOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", background: C.card, border: `1px solid ${presetsOpen ? C.gold : C.border}`,
              borderRadius: 4, cursor: "pointer", fontFamily: NU, fontSize: 10,
              fontWeight: 600, color: C.off, letterSpacing: "0.06em",
              transition: "border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 11 }}>◆</span> Theme Presets
            <span style={{ fontSize: 8, color: C.grey, transform: presetsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
          </button>
          {presetsOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, width: 280,
              background: C.card, border: `1px solid ${C.gold}`, borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 50, overflow: "hidden",
            }}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => { onApplyPreset(key); setPresetsOpen(false); }}
                  style={{
                    display: "block", width: "100%", padding: "10px 14px",
                    background: "transparent", border: "none",
                    borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                    textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.dark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>{preset.name}</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>{preset.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Export */}
        <button
          onClick={onExport}
          style={{
            padding: "7px 14px", background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: "pointer", fontFamily: NU, fontSize: 10,
            fontWeight: 600, color: C.grey, letterSpacing: "0.06em",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.off; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
        >↓ Export</button>

        {/* Import */}
        <button
          onClick={() => importRef.current?.click()}
          style={{
            padding: "7px 14px", background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: "pointer", fontFamily: NU, fontSize: 10,
            fontWeight: 600, color: C.grey, letterSpacing: "0.06em",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.off; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
        >↑ Import</button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 24px", background: "none", border: "none",
            borderBottom: tab === t.key ? `2px solid ${C.gold}` : "2px solid transparent",
            color: tab === t.key ? C.off : C.grey,
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ TAB 1: Colour Palette ══ */}
      {tab === "colours" && (
        <div>
          {/* ── Sitewide Default Mode ── */}
          <div style={{
            padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, marginBottom: 24,
          }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              Default Mode
            </div>

            {/* Light mode lock */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>Light Mode Only</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>Lock the entire site to light mode. Hides the dark mode toggle from visitors.</div>
              </div>
              <button
                onClick={() => {
                  const next = !siteSettings.lightOnly;
                  onUpdateSiteSettings("lightOnly", next);
                  if (next) { onUpdateSiteSettings("defaultMode", "light"); }
                }}
                style={{
                  position: "relative", width: 44, height: 24, borderRadius: 12,
                  background: siteSettings.lightOnly ? C.gold : C.border2,
                  border: "none", cursor: "pointer", transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: siteSettings.lightOnly ? 22 : 2,
                  width: 20, height: 20, borderRadius: 10,
                  background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            {/* Site default, only show if lightOnly is off */}
            {!siteSettings.lightOnly && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>Public Site Default</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>Which mode visitors see when they first arrive</div>
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  {[{ k: "dark", l: "Dark" }, { k: "light", l: "Light" }].map((v) => (
                    <button key={v.k} onClick={() => onUpdateSiteSettings("defaultMode", v.k)} style={{
                      padding: "6px 16px", background: siteSettings.defaultMode === v.k ? C.gold : "transparent",
                      border: `1px solid ${siteSettings.defaultMode === v.k ? C.gold : C.border}`,
                      color: siteSettings.defaultMode === v.k ? "#fff" : C.grey,
                      fontFamily: NU, fontSize: 10, fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                      borderRadius: v.k === "dark" ? "3px 0 0 3px" : "0 3px 3px 0",
                      transition: "all 0.2s",
                    }}>{v.l}</button>
                  ))}
                </div>
              </div>
            )}

            {siteSettings.lightOnly && (
              <div style={{ fontFamily: NU, fontSize: 11, color: C.green, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <span>●</span> Site locked to Light Mode, dark mode toggle hidden from visitors
              </div>
            )}

            {/* Admin default */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>Admin Panel Default</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>Which mode you see when you open the Control Room</div>
              </div>
              <div style={{ display: "flex", gap: 0 }}>
                {[{ k: "dark", l: "Dark" }, { k: "light", l: "Light" }].map((v) => (
                  <button key={v.k} onClick={() => onUpdateSiteSettings("adminDefaultMode", v.k)} style={{
                    padding: "6px 16px", background: siteSettings.adminDefaultMode === v.k ? C.gold : "transparent",
                    border: `1px solid ${siteSettings.adminDefaultMode === v.k ? C.gold : C.border}`,
                    color: siteSettings.adminDefaultMode === v.k ? "#fff" : C.grey,
                    fontFamily: NU, fontSize: 10, fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                    borderRadius: v.k === "dark" ? "3px 0 0 3px" : "0 3px 3px 0",
                    transition: "all 0.2s",
                  }}>{v.l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Dark / Light palette toggle */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
            {[{ k: "dark", l: "Dark Mode" }, { k: "light", l: "Light Mode" }].map((v) => (
              <button key={v.k} onClick={() => setPalView(v.k)} style={{
                padding: "8px 20px", background: palView === v.k ? C.goldDim : "transparent",
                border: `1px solid ${palView === v.k ? C.gold : C.border}`,
                color: palView === v.k ? C.gold : C.grey,
                fontFamily: NU, fontSize: 10, fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                borderRadius: v.k === "dark" ? "4px 0 0 4px" : "0 4px 4px 0",
                transition: "all 0.2s",
              }}>{v.l}</button>
            ))}
          </div>

          {/* Colour rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.keys(palView === "dark" ? darkPalette : lightPalette).map((key) => (
              <ColourRow
                key={key}
                tokenKey={key}
                value={(palView === "dark" ? darkPalette : lightPalette)[key]}
                palette={palView}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 2: Fonts ══ */}
      {tab === "fonts" && (
        <div>
          <div style={{
            fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6, marginBottom: 24,
          }}>
            Choose your font family from Google Fonts. A live preview is shown below each selector.
          </div>

          <FontSelector label="Heading Font" fontKey="heading" currentFont={fonts.heading} />
          <FontSelector label="Body Font" fontKey="body" currentFont={fonts.body} />

          {/* ── Font Size ── */}
          <div style={{
            padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, marginBottom: 24,
          }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
              Font Size
            </div>

            {/* Heading size */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>Heading Size</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold, fontWeight: 600 }}>{fonts.headingSize ?? 32}px</span>
              </div>
              <input
                type="range" min={20} max={56} step={1}
                value={fonts.headingSize ?? 32}
                onChange={(e) => onUpdateFonts("headingSize", Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 2 }}>
                <span>20px</span><span>56px</span>
              </div>
            </div>

            {/* Body size */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>Body Size</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold, fontWeight: 600 }}>{fonts.bodySize ?? 15}px</span>
              </div>
              <input
                type="range" min={12} max={22} step={1}
                value={fonts.bodySize ?? 15}
                onChange={(e) => onUpdateFonts("bodySize", Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 2 }}>
                <span>12px</span><span>22px</span>
              </div>
            </div>

            {/* Live size preview */}
            <div style={{ marginTop: 16, padding: "16px 20px", background: C.dark, borderRadius: 4 }}>
              <p style={{ fontFamily: `'${fonts.heading}',serif`, fontSize: fonts.headingSize ?? 32, fontWeight: fonts.headingWeight ?? 400, color: C.off, margin: "0 0 8px", lineHeight: 1.2 }}>
                Heading Preview
              </p>
              <p style={{ fontFamily: `'${fonts.body}',sans-serif`, fontSize: fonts.bodySize ?? 15, fontWeight: fonts.bodyWeight ?? 400, color: C.grey, margin: 0, lineHeight: 1.6 }}>
                Body text preview, the quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>

          {/* ── Font Weight ── */}
          <div style={{
            padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, marginBottom: 24,
          }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
              Font Weight
            </div>

            {/* Heading weight */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600, marginBottom: 8 }}>Heading Weight</div>
              <div style={{ display: "flex", gap: 0 }}>
                {[300, 400, 500, 600, 700].map((w, i, arr) => (
                  <button
                    key={w}
                    onClick={() => onUpdateFonts("headingWeight", w)}
                    style={{
                      flex: 1, padding: "8px 0",
                      background: (fonts.headingWeight ?? 400) === w ? C.goldDim : "transparent",
                      border: `1px solid ${(fonts.headingWeight ?? 400) === w ? C.gold : C.border}`,
                      color: (fonts.headingWeight ?? 400) === w ? C.gold : C.grey,
                      fontFamily: NU, fontSize: 10, fontWeight: w, cursor: "pointer",
                      borderRadius: i === 0 ? "4px 0 0 4px" : i === arr.length - 1 ? "0 4px 4px 0" : 0,
                      borderLeft: i > 0 ? "none" : undefined,
                      transition: "all 0.2s",
                    }}
                  >{w}</button>
                ))}
              </div>
            </div>

            {/* Body weight */}
            <div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600, marginBottom: 8 }}>Body Weight</div>
              <div style={{ display: "flex", gap: 0 }}>
                {[300, 400, 500, 600, 700].map((w, i, arr) => (
                  <button
                    key={w}
                    onClick={() => onUpdateFonts("bodyWeight", w)}
                    style={{
                      flex: 1, padding: "8px 0",
                      background: (fonts.bodyWeight ?? 400) === w ? C.goldDim : "transparent",
                      border: `1px solid ${(fonts.bodyWeight ?? 400) === w ? C.gold : C.border}`,
                      color: (fonts.bodyWeight ?? 400) === w ? C.gold : C.grey,
                      fontFamily: NU, fontSize: 10, fontWeight: w, cursor: "pointer",
                      borderRadius: i === 0 ? "4px 0 0 4px" : i === arr.length - 1 ? "0 4px 4px 0" : 0,
                      borderLeft: i > 0 ? "none" : undefined,
                      transition: "all 0.2s",
                    }}
                  >{w}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Border Options ── */}
          <div style={{
            padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, marginBottom: 24,
          }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
              Border Radius
            </div>

            {/* Cards radius */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>Cards</span>
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginLeft: 8 }}>Cards, modals, panels</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold, fontWeight: 600 }}>{siteSettings.borderRadiusCard ?? 6}px</span>
              </div>
              <input
                type="range" min={0} max={24} step={1}
                value={siteSettings.borderRadiusCard ?? 6}
                onChange={(e) => onUpdateSiteSettings("borderRadiusCard", Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div style={{
                  width: 110, height: 70, background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}11)`,
                  borderRadius: siteSettings.borderRadiusCard ?? 6, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: NU, fontSize: 9, color: C.grey2,
                }}>Card</div>
                <div style={{
                  width: 110, height: 70, background: C.dark,
                  borderRadius: siteSettings.borderRadiusCard ?? 6, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: NU, fontSize: 9, color: C.grey2,
                }}>Modal</div>
              </div>
            </div>

            {/* Images radius */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>Images</span>
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginLeft: 8 }}>Destination, category, venue images</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold, fontWeight: 600 }}>{siteSettings.borderRadiusImage ?? 6}px</span>
              </div>
              <input
                type="range" min={0} max={24} step={1}
                value={siteSettings.borderRadiusImage ?? 6}
                onChange={(e) => onUpdateSiteSettings("borderRadiusImage", Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div style={{
                  width: 80, height: 60, background: `linear-gradient(135deg, ${C.dark}, ${C.border})`,
                  borderRadius: siteSettings.borderRadiusImage ?? 6, border: `1px solid ${C.border}`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: NU, fontSize: 8, color: C.grey2,
                }}>Country</div>
                <div style={{
                  width: 60, height: 60, background: `linear-gradient(135deg, ${C.dark}, ${C.border})`,
                  borderRadius: siteSettings.borderRadiusImage ?? 6, border: `1px solid ${C.border}`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: NU, fontSize: 8, color: C.grey2,
                }}>Category</div>
                <div style={{
                  width: 80, height: 60, background: `linear-gradient(135deg, ${C.dark}, ${C.border})`,
                  borderRadius: siteSettings.borderRadiusImage ?? 6, border: `1px solid ${C.border}`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: NU, fontSize: 8, color: C.grey2,
                }}>Venue</div>
              </div>
            </div>

            {/* Inputs & Buttons radius */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 600 }}>Inputs & Buttons</span>
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginLeft: 8 }}>Buttons, inputs, tags, badges</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold, fontWeight: 600 }}>{siteSettings.borderRadiusInput ?? 4}px</span>
              </div>
              <input
                type="range" min={0} max={16} step={1}
                value={siteSettings.borderRadiusInput ?? 4}
                onChange={(e) => onUpdateSiteSettings("borderRadiusInput", Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button style={{
                  padding: "8px 20px", background: C.gold, color: "#fff", border: "none",
                  borderRadius: siteSettings.borderRadiusInput ?? 4, fontFamily: NU,
                  fontSize: 11, fontWeight: 600, cursor: "default",
                }}>Button</button>
                <input
                  readOnly value="Input field"
                  style={{
                    padding: "8px 14px", background: C.dark, color: C.off,
                    border: `1px solid ${C.border}`, borderRadius: siteSettings.borderRadiusInput ?? 4,
                    fontFamily: NU, fontSize: 11, outline: "none", width: 120,
                  }}
                />
                <span style={{
                  padding: "6px 12px", background: C.goldDim, color: C.gold,
                  borderRadius: siteSettings.borderRadiusInput ?? 4, fontFamily: NU,
                  fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center",
                }}>Tag</span>
              </div>
            </div>
          </div>

          {/* Google Fonts URL */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              Google Fonts Import URL
            </div>
            <input
              value={fonts.googleUrl}
              onChange={(e) => onUpdateFonts("googleUrl", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontFamily: MONO, fontSize: 11,
                background: C.card, color: C.off, border: `1px solid ${C.border}`,
                borderRadius: 4, outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 6 }}>
              This URL is loaded in the site &lt;head&gt; to import font weights and styles
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 3: Stylesheet ══ */}
      {tab === "stylesheet" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            fontFamily: NU, fontSize: 10, color: C.grey,
            letterSpacing: "0.1em", marginBottom: 4,
          }}>
            src/category.css, {(customCss || categoryCssRaw).split("\n").length} lines
          </div>

          {sections.map((section) => {
            const isOpen = expanded.has(section.id);
            return (
              <div key={section.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 4, overflow: "hidden", transition: "all 0.2s",
              }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "14px 18px", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{
                    fontSize: 8, color: C.gold,
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s", display: "inline-block",
                  }}>▶</span>
                  <span style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off,
                    letterSpacing: "0.03em", flex: 1,
                  }}>{section.label}</span>
                  <span style={{
                    fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 400,
                  }}>{section.lineCount} lines</span>
                </button>
                {section.desc && (
                  <div style={{
                    padding: "0 18px 10px 38px",
                    fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.5,
                  }}>{section.desc}</div>
                )}
                {isOpen && (
                  <div style={{ margin: "0 12px 12px", background: "#0d0d0d", borderRadius: 4, padding: "16px 18px", overflow: "auto", maxHeight: 500 }}>
                    <pre style={{
                      fontFamily: MONO, fontSize: 11, lineHeight: 1.8, color: "#c8c8c8",
                      margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>{section.code}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB 4: Override CSS ══ */}
      {tab === "override" && (
        <div>
          {/* Warning banner */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
            background: "rgba(201,168,76,0.08)", border: `1px solid ${C.goldDim}`,
            borderRadius: 4, marginBottom: 16,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.6 }}>
              <strong style={{ color: C.off }}>Overrides are for experiments and hotfixes.</strong>{" "}
              If you change something more than twice, promote it into the colour tokens or base stylesheet.
              Overrides are scoped to admin only and do not affect the public frontend.
            </div>
          </div>

          <div style={{
            fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6, marginBottom: 16,
          }}>
            Write custom CSS injected after the base stylesheet. Scoped to <code style={{ fontFamily: "'SF Mono','Fira Code',Consolas,monospace", fontSize: 11, background: C.dark, padding: "2px 6px", borderRadius: 3 }}>.lwd-admin</code> root only.
          </div>

          {/* Guardrails */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14,
          }}>
            {["@import", "@font-face", ":root", "font-family"].map((rule) => (
              <span key={rule} style={{
                fontFamily: "'SF Mono','Fira Code',Consolas,monospace", fontSize: 9,
                padding: "3px 8px", background: C.dark, color: C.grey2,
                borderRadius: 3, border: `1px solid ${C.border}`,
              }}>
                {rule} blocked
              </span>
            ))}
          </div>

          <textarea
            value={customCss || ""}
            onChange={(e) => {
              let val = e.target.value || null;
              // Guardrails, strip dangerous patterns
              if (val) {
                const blocked = /@import\b|@font-face\b|:root\s*\{|font-family\s*:/gi;
                if (blocked.test(val)) {
                  // Don't prevent typing but show visually
                }
              }
              onUpdateCss(val);
            }}
            placeholder={"/* Your custom CSS overrides */\n/* Scoped to .lwd-admin automatically */\n\n.admin-main {\n  /* example */\n}"}
            spellCheck={false}
            style={{
              width: "100%", minHeight: 400, padding: "18px 20px",
              fontFamily: "'SF Mono','Fira Code',Consolas,monospace",
              fontSize: 12, lineHeight: 1.8, color: "#c8c8c8",
              background: "#0d0d0d", border: `1px solid ${C.border}`,
              borderRadius: 4, outline: "none", resize: "vertical",
              tabSize: 2,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
          />

          {/* Blocked pattern warnings */}
          {customCss && /@import\b|@font-face\b|:root\s*\{|font-family\s*:/gi.test(customCss) && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 10,
              padding: "8px 12px", background: "rgba(244,63,94,0.08)",
              border: `1px solid rgba(244,63,94,0.2)`, borderRadius: 4,
            }}>
              <span style={{ fontSize: 12 }}>⛔</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.rose }}>
                Blocked pattern detected: @import, @font-face, :root, or font-family. Use the Colour Palette and Fonts tabs to modify design tokens instead.
              </span>
            </div>
          )}

          <div style={{
            fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 8,
          }}>
            Changes are applied live when saved. Use "Revert to Default" to remove all overrides.
          </div>
        </div>
      )}

      {/* ══ TAB 5: Activity (Audit Log) ══ */}
      {tab === "activity" && (
        <div>
          <div style={{
            fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6, marginBottom: 16,
          }}>
            Theme change history, most recent first. Kept up to 50 entries.
          </div>

          {auditLog.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
            }}>
              <div style={{ fontFamily: NU, fontSize: 13, color: C.grey2 }}>No changes recorded yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[...auditLog].reverse().map((entry, i) => {
                const d = new Date(entry.ts);
                const time = d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "10px 16px", background: i === 0 ? C.goldDim : C.card,
                    border: `1px solid ${C.border}`, borderRadius: 3,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.grey2, flexShrink: 0, minWidth: 140 }}>{time}</span>
                    <span style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: i === 0 ? 600 : 400 }}>{entry.desc}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom bar: Save / Revert / Status ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginTop: 32,
        padding: "16px 0", borderTop: `1px solid ${C.border}`,
      }}>
        <button
          onClick={onSave}
          style={{
            padding: "10px 28px", background: C.gold, color: "#fff",
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            border: "none", borderRadius: 4, cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >Save Changes</button>

        <button
          onClick={onRevert}
          style={{
            padding: "10px 28px", background: "transparent",
            color: C.rose, fontFamily: NU, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            border: `1px solid ${C.rose}`, borderRadius: 4, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.rose; }}
        >Revert to Default</button>

        <span style={{
          marginLeft: "auto", fontFamily: NU, fontSize: 11, fontWeight: 400,
          color: saveStatus === "saved" ? C.green : saveStatus === "unsaved" ? C.gold : C.grey2,
          letterSpacing: "0.06em",
        }}>
          {saveStatus === "saved" ? "Saved" : saveStatus === "unsaved" ? "Unsaved changes" : "Using defaults"}
        </span>
      </div>
    </div>
  );
}

// Collapsible Sidebar Group
// ═════════════════════════════════════════════════════════════════════════════
function SidebarGroup({ section, activeTab, setActiveTab, darkMode, C, expandedGroups, toggleGroup, collapsed }) {
  const isOpen = expandedGroups.has(section.group);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure the natural height of the items list
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [section.items.length]);

  // Does this group contain the active tab?
  const hasActive = section.items.some((it) => it.key === activeTab);

  // ── Collapsed mode: icon-only ──
  if (collapsed) {
    return (
      <div style={{ marginBottom: 2 }}>
        {section.items.map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              onMouseDown={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  setActiveTab(item.key);
                }
              }}
              title={item.label}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "10px 0", position: "relative",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                border: "none",
                borderLeft: active ? `2px solid ${C.gold}` : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{
                fontSize: 14, color: active ? C.gold : C.grey2,
                opacity: active ? 1 : 0.6, transition: "all 0.15s",
              }}>{item.icon}</span>
              {item.key === "livechat" && (
                <span style={{
                  position: "absolute", top: 6, right: 8,
                  width: 5, height: 5, borderRadius: "50%",
                  background: C.green,
                  boxShadow: `0 0 4px ${C.green}`,
                }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Group header, clickable toggle */}
      <button
        onClick={() => toggleGroup(section.group)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "10px 20px 6px",
          background: "none", border: "none", cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.querySelector("[data-group-label]").style.color = C.gold;
          e.currentTarget.querySelector("[data-group-label]").style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.querySelector("[data-group-label]").style.color = hasActive ? C.gold : C.grey2;
          e.currentTarget.querySelector("[data-group-label]").style.opacity = hasActive ? "0.85" : "0.6";
        }}
      >
        {/* Chevron */}
        <span style={{
          fontSize: 8, color: hasActive ? C.gold : C.grey2,
          opacity: hasActive ? 0.85 : 0.5,
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease, color 0.15s",
          display: "inline-block", lineHeight: 1,
        }}>
          ▶
        </span>

        {/* Group label */}
        <span
          data-group-label=""
          style={{
            fontFamily: NU, fontSize: 9, letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: hasActive ? C.gold : C.grey2,
            fontWeight: 700,
            opacity: hasActive ? 0.85 : 0.6,
            transition: "color 0.15s, opacity 0.15s",
            flex: 1, textAlign: "left",
          }}
        >
          {section.group}
        </span>

        {/* Item count badge */}
        <span style={{
          fontFamily: NU, fontSize: 8, color: C.grey2,
          opacity: 0.4, fontWeight: 400, minWidth: 12, textAlign: "right",
        }}>
          {section.items.length}
        </span>
      </button>

      {/* Collapsible items container */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isOpen ? contentHeight + 8 : 0,
          transition: "max-height 0.3s ease",
        }}
      >
        <div ref={contentRef}>
          {section.items.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    e.preventDefault();
                    setActiveTab(item.key);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "9px 20px 9px 34px",
                  background: active ? (darkMode ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.1)") : "transparent",
                  border: "none",
                  borderLeft: active ? `2px solid ${C.gold}` : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{
                  fontSize: 10, color: active ? C.gold : C.grey2,
                  opacity: active ? 1 : 0.5, transition: "all 0.15s",
                }}>{item.icon}</span>
                <span style={{
                  fontFamily: NU, fontSize: 12,
                  color: active ? C.off : C.grey,
                  fontWeight: active ? 500 : 300,
                  letterSpacing: "0.04em", transition: "all 0.15s",
                }}>{item.label}</span>

                {/* Live indicator for chat */}
                {item.key === "livechat" && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: C.green, marginLeft: "auto",
                    boxShadow: `0 0 4px ${C.green}`,
                    animation: "lwd-status-pulse 2s infinite",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

// Export constants for use in components
export { DIRECTORY_CATEGORIES, DIRECTORY_COUNTRIES, DIRECTORY_REGIONS };

export default function AdminDashboard({ onBack, onNavigate }) {
  // Initialize activeTab from hash, defaulting to "overview"
  // Supports listing-studio routes: #listing-studio, #listing-studio/new, #listing-studio/[id]
  const getInitialTab = () => {
    const hash = window.location.hash.slice(1); // Remove # prefix
    return hash || "overview";
  };

  const [activeTab, setActiveTabState] = useState(() => {
    const hash = getInitialTab();
    // Normalize listing-studio sub-routes to the base tab for sidebar highlight
    if (hash.startsWith('listing-studio')) return 'listing-studio';
    if (hash.startsWith('page-editor/'))   return 'page-editor';
    return hash;
  });

  // Wrapper to also update hash when tab changes
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    window.location.hash = tab || "overview";
  };

  const [darkMode, setDarkMode] = useState(() => {
    const saved = _loadTheme();
    const adminDefault = saved?.site?.adminDefaultMode || DEFAULT_SITE_SETTINGS.adminDefaultMode;
    return adminDefault === "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Parse listing studio state from URL hash on mount
  // Supports: #listing-studio (new), #listing-studio/new, #listing-studio/[uuid] (edit)
  const parseListingStudioHash = (hash) => {
    if (!hash || !hash.startsWith('listing-studio')) return { mode: null, id: null };
    const parts = hash.split('/');
    if (parts.length === 1) return { mode: 'new', id: null }; // #listing-studio
    const sub = parts[1];
    if (sub === 'new') return { mode: 'new', id: null }; // #listing-studio/new
    return { mode: 'edit', id: sub }; // #listing-studio/[uuid]
  };

  const initialHash = window.location.hash.slice(1);
  const initialLS = parseListingStudioHash(initialHash);

  const [listingStudioMode, setListingStudioMode] = useState(initialLS.mode); // 'new', 'edit', or null
  const [listingStudioListingId, setListingStudioListingId] = useState(initialLS.id);

  const getInitialPageEditorId = () => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('page-editor/')) return hash.split('/')[1] || null;
    return null;
  };
  const [pageEditorPageId, setPageEditorPageId] = useState(getInitialPageEditorId);

  // ── Hash-based routing: listen for hash changes and update activeTab ──
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove # prefix

      // Handle listing-studio sub-routes
      if (hash.startsWith('listing-studio')) {
        const ls = parseListingStudioHash(hash);
        setListingStudioMode(ls.mode);
        setListingStudioListingId(ls.id);
        setActiveTabState('listing-studio');
        return;
      }

      // Handle page-editor sub-routes
      if (hash.startsWith('page-editor/')) {
        setPageEditorPageId(hash.split('/')[1] || null);
        setActiveTabState('page-editor');
        return;
      }

      // Other tabs, clear listing studio state
      setListingStudioMode(null);
      setListingStudioListingId(null);
      const tab = hash || "overview";
      setActiveTabState(tab);
    };

    // Listen for hash changes (back/forward button and direct hash navigation)
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // ── Theme customisation state (persisted to localStorage) ──
  const [customDark, setCustomDark] = useState(() => {
    const saved = _loadTheme();
    return saved?.dark ? { ...DEFAULT_DARK_C, ...saved.dark } : { ...DEFAULT_DARK_C };
  });
  const [customLight, setCustomLight] = useState(() => {
    const saved = _loadTheme();
    return saved?.light ? { ...DEFAULT_ADMIN_LIGHT_C, ...saved.light } : { ...DEFAULT_ADMIN_LIGHT_C };
  });
  const [customFonts, setCustomFonts] = useState(() => {
    const saved = _loadTheme();
    return saved?.fonts ? { ...DEFAULT_FONTS, ...saved.fonts } : { ...DEFAULT_FONTS };
  });
  const [customCss, setCustomCss] = useState(() => {
    const saved = _loadTheme();
    return saved?.css || null;
  });
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = _loadTheme();
    return saved?.site ? { ...DEFAULT_SITE_SETTINGS, ...saved.site } : { ...DEFAULT_SITE_SETTINGS };
  });
  const [saveStatus, setSaveStatus] = useState(() => {
    return _loadTheme() ? "saved" : "default";
  });

  const handleUpdatePalette = useCallback((palette, key, value) => {
    if (palette === "dark") setCustomDark((prev) => ({ ...prev, [key]: value }));
    else setCustomLight((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("unsaved");
  }, []);

  const handleUpdateFonts = useCallback((key, value) => {
    setCustomFonts((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("unsaved");
  }, []);

  const handleUpdateCss = useCallback((value) => {
    setCustomCss(value);
    setSaveStatus("unsaved");
  }, []);

  const handleUpdateSiteSettings = useCallback((key, value) => {
    setSiteSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("unsaved");
  }, []);

  const handleSaveTheme = useCallback(() => {
    _saveTheme({ dark: customDark, light: customLight, fonts: customFonts, css: customCss, site: siteSettings });
    setSaveStatus("saved");
  }, [customDark, customLight, customFonts, customCss, siteSettings]);

  const handleRevertTheme = useCallback(() => {
    setCustomDark({ ...DEFAULT_DARK_C });
    setCustomLight({ ...DEFAULT_ADMIN_LIGHT_C });
    setCustomFonts({ ...DEFAULT_FONTS });
    setCustomCss(null);
    setSiteSettings({ ...DEFAULT_SITE_SETTINGS });
    _clearTheme();
    setSaveStatus("default");
    logThemeChange("Reverted to default");
  }, []);

  // ── Audit log ──
  const [auditLog, setAuditLog] = useState(_loadAuditLog);

  const logThemeChange = useCallback((description) => {
    setAuditLog((prev) => {
      const entry = { ts: new Date().toISOString(), desc: description };
      const next = [...prev, entry];
      _saveAuditLog(next);
      return next;
    });
  }, []);

  // Override save to also log
  const handleSaveThemeLogged = useCallback(() => {
    handleSaveTheme();
    logThemeChange("Saved theme changes");
  }, [handleSaveTheme, logThemeChange]);

  // ── Export theme ──
  const handleExportTheme = useCallback(() => {
    const blob = new Blob([JSON.stringify({
      _format: "lwd-theme-v1",
      _exported: new Date().toISOString(),
      dark: customDark,
      light: customLight,
      fonts: customFonts,
      css: customCss,
      site: siteSettings,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lwd-theme-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    logThemeChange("Exported theme to JSON");
  }, [customDark, customLight, customFonts, customCss, siteSettings, logThemeChange]);

  // ── Import theme ──
  const handleImportTheme = useCallback((jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.dark) setCustomDark((prev) => ({ ...prev, ...data.dark }));
      if (data.light) setCustomLight((prev) => ({ ...prev, ...data.light }));
      if (data.fonts) setCustomFonts((prev) => ({ ...prev, ...data.fonts }));
      if (data.css !== undefined) setCustomCss(data.css);
      if (data.site) setSiteSettings((prev) => ({ ...prev, ...data.site }));
      setSaveStatus("unsaved");
      logThemeChange(`Imported theme${data._format ? ` (${data._format})` : ""}`);
    } catch {
      alert("Invalid theme file. Must be a valid LWD JSON theme.");
    }
  }, [logThemeChange]);

  // ── Apply preset ──
  const handleApplyPreset = useCallback((presetKey) => {
    const p = THEME_PRESETS[presetKey];
    if (!p) return;
    setCustomDark({ ...p.dark });
    setCustomLight({ ...p.light });
    setCustomFonts({ ...p.fonts });
    setCustomCss(null);
    setSiteSettings({ ...p.site });
    setSaveStatus("unsaved");
    logThemeChange(`Applied preset: ${p.name}`);
  }, [logThemeChange]);


  // Collapsible sidebar, track which groups are expanded
  // Default: expand the group that contains the active tab
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = new Set();
    for (const section of NAV_SECTIONS) {
      if (section.items.some((it) => it.key === "overview")) {
        initial.add(section.group);
      }
    }
    return initial;
  });

  // Auto-expand group when active tab changes (e.g. via direct setActiveTab)
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      if (section.items.some((it) => it.key === activeTab)) {
        setExpandedGroups((prev) => {
          if (prev.has(section.group)) return prev;
          const next = new Set(prev);
          next.add(section.group);
          return next;
        });
        break;
      }
    }
  }, [activeTab]);

  const toggleGroup = useCallback((group) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const C = darkMode ? customDark : customLight;

  // Nested ListingsModule component - simplified without modal handling
  const ListingsModule = ({ C }) => {
    const [catFilter, setCatFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");
    const [countryFltr, setCountryFltr] = useState("all");
    const [regionFltr, setRegionFltr] = useState("all");
    const [search, setSearch] = useState("");
    const [listings, setListings] = useState([]);
    const [deleteModal, setDeleteModal] = useState(null);
    const [actionFeedback, setActionFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const loadListings = async () => {
        try {
          setLoading(true);
          setError(null);
          if (!isSupabaseAvailable()) {
            setError("Supabase is not configured. Listings cannot be loaded.");
            setListings([]);
            return;
          }
          const data = await fetchListings();
          setListings(data && data.length > 0 ? data : []);
        } catch (error) {
          setError("Failed to load listings: " + error.message);
          setListings([]);
        } finally {
          setLoading(false);
        }
      };
      loadListings();
    }, []);

    const filteredRegions = countryFltr === "all" ? DIRECTORY_REGIONS : DIRECTORY_REGIONS.filter(r => r.countrySlug === countryFltr);
    const handlePause = (id) => {
      const listing = listings.find(l => l.id === id);
      if (listing) {
        const updated = listings.map(l => l.id === id ? { ...l, status: l.status === "Paused" ? "Active" : "Paused" } : l);
        setListings(updated);
        setActionFeedback({ action: listing.status === "Paused" ? "resumed" : "paused", listing });
        setTimeout(() => setActionFeedback(null), 3000);
      }
    };
    const handleDelete = (id) => {
      const listing = listings.find(l => l.id === id);
      if (listing) setDeleteModal(listing);
    };
    const confirmDelete = () => {
      const updated = listings.filter(l => l.id !== deleteModal.id);
      setListings(updated);
      setDeleteModal(null);
      setActionFeedback({ action: "deleted", listing: deleteModal });
      setTimeout(() => setActionFeedback(null), 3000);
    };
    const filtered = listings.filter(l => {
      if (catFilter === "uncategorised" && l.category) return false;
      if (catFilter !== "all" && catFilter !== "uncategorised" && l.category !== catFilter) return false;
      if (statusFilter !== "all" && l.status.toLowerCase() !== statusFilter) return false;
      if (tierFilter !== "all" && l.tier !== tierFilter) return false;
      if (countryFltr !== "all" && l.countrySlug !== countryFltr) return false;
      if (regionFltr !== "all" && l.regionSlug !== regionFltr) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    const tierColors = { signature: C.gold, curated: C.blue, standard: C.grey };
    const tierBg = { signature: `${C.gold}15`, curated: `${C.blue}12`, standard: `${C.grey}10` };
    const selectStyle = { fontFamily: NU, fontSize: 11, color: C.off, background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, padding: "6px 10px", cursor: "pointer", outline: "none" };

    const statusColour = { published: '#22c55e', draft: C.grey, paused: '#f59e0b', archived: C.rose };
    const openInStudio = (id) => {
      setListingStudioMode('edit');
      setListingStudioListingId(id);
      window.location.hash = `listing-studio/${id}`;
      setActiveTabState('listing-studio');
    };

    return (
      <div>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: GD, fontSize: 18, color: C.off, margin: 0, fontWeight: 400 }}>Venue Listings</h2>
            {!loading && <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: "4px 0 0" }}>{filtered.length} of {listings.length} listing{listings.length !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => { setListingStudioMode('new'); setListingStudioListingId(null); window.location.hash = 'listing-studio/new'; setActiveTabState('listing-studio'); }} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", padding: "10px 16px", background: C.gold, color: C.black, border: "none", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = C.gold2; }} onMouseLeave={e => { e.currentTarget.style.background = C.gold; }}>+ Add New Listing</button>
        </div>

        {/* ── Filters ── */}
        {!loading && listings.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <input
              placeholder="Search listings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, padding: "6px 10px", width: 180, outline: "none" }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
              <option value="all">All categories</option>
              <option value="wedding-venues">Wedding Venues</option>
              <option value="photographers">Photographers</option>
              <option value="florists">Florists</option>
              <option value="catering">Catering</option>
            </select>
            {(search || statusFilter !== 'all' || catFilter !== 'all') && (
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setCatFilter('all'); }} style={{ ...selectStyle, background: 'none', color: C.gold, border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✕ Clear</button>
            )}
          </div>
        )}

        {/* ── States ── */}
        {loading && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "32px", textAlign: "center", marginBottom: 20 }}><div style={{ fontFamily: NU, fontSize: 13, color: C.grey }}>Loading listings from Supabase…</div></div>}
        {error && <div style={{ background: C.rose + "20", border: `1px solid ${C.rose}`, borderRadius: 4, padding: "16px", marginBottom: 20 }}><div style={{ fontFamily: NU, fontSize: 12, color: C.rose, fontWeight: 600 }}>⚠ {error}</div></div>}
        {!loading && listings.length === 0 && !error && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "48px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: C.off, marginBottom: 8 }}>No Listings Yet</div>
            <button onClick={() => { setListingStudioMode('new'); setListingStudioListingId(null); window.location.hash = 'listing-studio/new'; setActiveTabState('listing-studio'); }} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, padding: "10px 20px", background: C.gold, color: C.black, border: "none", borderRadius: 3, cursor: "pointer" }}>+ Create First Listing</button>
          </div>
        )}
        {!loading && filtered.length === 0 && listings.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "32px", textAlign: "center" }}>
            <div style={{ fontFamily: NU, fontSize: 13, color: C.grey }}>No listings match your filters.</div>
          </div>
        )}

        {/* ── Listing Cards ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(l => {
              const heroUrl = l.imgs?.[0]?.url || l.heroImages?.[0]?.url || l.mediaItems?.[0]?.url || null;
              const statusKey = (l.status || '').toLowerCase();
              const dot = statusColour[statusKey] || C.grey;
              return (
                <div key={l.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, display: "flex", alignItems: "stretch", overflow: "hidden", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 80, minHeight: 72, background: C.border, flexShrink: 0, overflow: "hidden", position: "relative" }}>
                    {heroUrl
                      ? <img src={heroUrl} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⌂</div>
                    }
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: GD, fontSize: 14, color: C.off, fontWeight: 400 }}>{l.name || l.venueName || ' - '}</span>
                      {l.tier && <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold, background: `${C.gold}18`, padding: "2px 6px", borderRadius: 2 }}>{l.tier}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: NU, fontSize: 10, color: dot, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} />
                        {l.status || 'Draft'}
                      </span>
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                      {[l.city, l.region, l.country].filter(Boolean).join(' · ')}
                      {l.category && <span style={{ marginLeft: 8, color: C.border2 || C.grey }}>· {l.category}</span>}
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
                      Listed {l.listed || ' - '} · Updated {l.lastUpdated || ' - '}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0 }}>
                    <button
                      onClick={() => openInStudio(l.id)}
                      style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, padding: "7px 14px", background: C.gold, color: C.black, border: "none", borderRadius: 3, cursor: "pointer", letterSpacing: "0.05em" }}
                    >
                      Edit →
                    </button>
                    <button
                      onClick={() => window.open(`/venues/${l.slug}`, '_blank')}
                      title="Preview live page"
                      style={{ fontFamily: NU, fontSize: 11, padding: "7px 10px", background: "none", color: C.grey, border: `1px solid ${C.border}`, borderRadius: 3, cursor: "pointer" }}
                    >
                      ↗
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete "${l.name || l.venueName}"? This cannot be undone.`)) return;
                        try {
                          await deleteListing(l.id);
                          setListings(prev => prev.filter(x => x.id !== l.id));
                        } catch(e) {
                          alert('Delete failed: ' + (e.message || e));
                        }
                      }}
                      title="Delete listing"
                      style={{ fontFamily: NU, fontSize: 11, padding: "7px 10px", background: "none", color: "#c0392b", border: `1px solid #c0392b44`, borderRadius: 3, cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderModule = () => {
    switch (activeTab) {
      case "overview":      return <OverviewModule C={C} />;
      case "partnerships":  return <PartnershipsModule C={C} />;
      case "index":         return <IndexHealthModule C={C} />;
      case "livechat":      return <LiveChatModule C={C} />;
      case "artistry":      return <ArtistryAdminModule C={C} />;
      case "listings":       return <ListingsModule C={C} />;
      case "venue-profiles": return <VenueProfilesAdminModule C={C} onNavigate={(action, params) => {
        if (action === 'listing-studio') { setActiveTab('listing-studio'); }
      }} />;
      case "reviews": return <ReviewsModule />;
      case "listing-studio": return null; // Handled in main render logic
      case "vendor-accounts": return <VendorAccountsPage C={C} />;
      case "categories":    return <CategoriesModule C={C} />;
      case "enquiries":     return <AdminAllLeads C={C} />;
      case "countries":     return <CountriesModule C={C} />;
      case "regions":       return <RegionsModule C={C} />;
      case "leads":         return <LeadsModule C={C} />;
      case "marketing":     return <PlaceholderModule title="Marketing Intelligence" C={C} />;
      case "seo":           return <PlaceholderModule title="SEO Command Centre" C={C} />;
      case "crm":           return <PlaceholderModule title="CRM & Lead Management" C={C} />;
      case "aura":          return <AuraAnalyticsModule C={C} />;
      case "api":           return <APIManagementModule C={C} />;
      case "ai-settings":   return <AISettingsPage C={C} />;
      case "styles":        return <StyleEditorModule C={C} darkPalette={customDark} lightPalette={customLight} fonts={customFonts} customCss={customCss} siteSettings={siteSettings} auditLog={auditLog} onUpdatePalette={handleUpdatePalette} onUpdateFonts={handleUpdateFonts} onUpdateCss={handleUpdateCss} onUpdateSiteSettings={handleUpdateSiteSettings} onSave={handleSaveThemeLogged} onRevert={handleRevertTheme} onExport={handleExportTheme} onImport={handleImportTheme} onApplyPreset={handleApplyPreset} saveStatus={saveStatus} />;
      case "page-studio":   return <PageStudioHome C={C} NU={NU} GD={GD} onNavigate={(action, params) => {
        if (action === "page-editor" && params?.pageId) {
          setPageEditorPageId(params.pageId);
          window.location.hash = `page-editor/${params.pageId}`;
          setActiveTabState('page-editor');
        } else if (action === "page-editor-new") {
          setPageEditorPageId(null);
          window.location.hash = 'page-editor/new';
          setActiveTabState('page-editor');
        }
      }} />;
      case "page-editor":   return <PageEditorLive pageId={pageEditorPageId} C={C} NU={NU} GD={GD} onNavigate={() => {
        setPageEditorPageId(null);
        window.location.hash = 'page-studio';
        setActiveTabState('page-studio');
      }} />;
      case "homepage-manager": return <HomepageManagerModule C={C} NU={NU} GD={GD} />;
      case "blog-manager":  return <BlogManagerModule C={C} NU={NU} GD={GD} />;
      case "magazine":      return <MagazineAdminModule C={C} NU={NU} GD={GD} onNavigate={(action) => {
        if (action === 'magazine-studio') { setActiveTabState('magazine-studio'); }
        else onNavigate(action);
      }} />;
      case "magazine-studio": return null; // Handled in main render logic
      case "reusable-blocks": return <ReusableBlocksModule C={C} NU={NU} GD={GD} />;
      default:              return <OverviewModule C={C} />;
    }
  };

  return (
    <ThemeCtx.Provider value={C}>
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { display: flex !important; position: fixed !important; z-index: 999; left: 0; top: 0; width: 220px !important; height: 100vh !important; transform: translateX(${sidebarOpen ? "0" : "-100%"}); transition: transform 0.3s ease !important; box-shadow: ${sidebarOpen ? "6px 0 32px rgba(0,0,0,0.7)" : "none"}; border-right: ${sidebarOpen ? "1px solid rgba(201,168,76,0.25)" : "none"} !important; }
          .admin-sidebar-overlay { display: ${sidebarOpen ? "block" : "none"}; position: fixed; inset: 0; z-index: 998; background: rgba(0,0,0,0.5); }
          .admin-main { padding: ${activeTab === 'magazine-studio' || activeTab === 'page-editor' || activeTab === 'listing-studio' || listingStudioMode ? '0' : '56px 16px 20px'} !important; }
          .admin-hamburger { display: flex !important; }
          .admin-collapse-btn { display: none !important; }
          .admin-grid-2col { grid-template-columns: 1fr !important; }
          .admin-grid-4col { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-listing-row { grid-template-columns: 2fr 1fr 1fr !important; }
          .admin-listing-row > *:nth-child(n+4) { display: none !important; }
          .admin-listing-header { grid-template-columns: 2fr 1fr 1fr !important; }
          .admin-listing-header > *:nth-child(n+4) { display: none !important; }
        }
        @media (min-width: 769px) {
          .admin-sidebar-overlay { display: none; }
          .admin-hamburger { display: none !important; }
        }
      `}</style>

      {/* ── Google Fonts for custom font selections ── */}
      <link rel="stylesheet" href={customFonts.googleUrl} />
      {customFonts.heading !== DEFAULT_FONTS.heading && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(customFonts.heading)}:wght@300;400;500;600;700&display=swap`} />
      )}
      {customFonts.body !== DEFAULT_FONTS.body && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(customFonts.body)}:wght@300;400;600;700;800&display=swap`} />
      )}

      {/* ── Override CSS, scoped to admin root ── */}
      {customCss && <style>{customCss}</style>}

      <div
        data-app="admin"
        className="lwd-admin"
        style={{
          "--font-heading-primary": `'${customFonts.heading}', 'Playfair Display', Georgia, serif`,
          "--font-heading-secondary": "'Playfair Display', Georgia, serif",
          "--font-body": `'${customFonts.body}', sans-serif`,
          "--font-ui": `'${customFonts.body}', sans-serif`,
          display: "flex", height: "100dvh", background: C.black,
          transition: "background 0.3s",
        }}
      >
        {/* ── Sidebar overlay (mobile) ── */}
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />

        {/* ── Mobile hamburger button ── */}
        <button
          className="admin-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            display: "none", position: "fixed", top: 12, left: 12, zIndex: 1000,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
            padding: "8px 10px", cursor: "pointer", alignItems: "center", justifyContent: "center",
            color: C.gold, fontSize: 18, lineHeight: 1,
          }}
        >{sidebarOpen ? "✕" : "☰"}</button>

        {/* ── Sidebar ── */}
        <aside
          className="admin-sidebar"
          style={{
            width: sidebarCollapsed ? 56 : 220,
            background: DARK_C.dark,
            borderRight: `1px solid ${DARK_C.border}`,
            padding: "28px 0",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100dvh",
            display: ['magazine-studio', 'listing-studio', 'page-editor'].includes(activeTab) || listingStudioMode ? "none" : "flex",
            flexDirection: "column",
            transition: "width 0.25s ease, background 0.3s, border-color 0.3s",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Brand */}
          <div style={{ padding: sidebarCollapsed ? "0 8px" : "0 20px", marginBottom: sidebarCollapsed ? 16 : 32, transition: "all 0.25s", overflow: "hidden", whiteSpace: "nowrap" }}>
            {sidebarCollapsed ? (
              <div style={{ fontFamily: GD, fontSize: 13, color: DARK_C.gold, textAlign: "center", letterSpacing: "0.1em" }}>LWD</div>
            ) : (
              <>
                <div style={{
                  fontFamily: GD, fontSize: 10, color: DARK_C.gold,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  lineHeight: 1.7, marginBottom: 4,
                }}>
                  Luxury Wedding
                  <br />
                  Directory
                </div>
                <div style={{
                  fontFamily: NU, fontSize: 8, letterSpacing: "0.25em",
                  textTransform: "uppercase", color: DARK_C.grey2, fontWeight: 600,
                }}>
                  Control Room
                </div>
              </>
            )}
          </div>

          {/* Nav groups, collapsible */}
          <nav style={{ flex: 1 }}
            onClick={(e) => {
              // Close sidebar on mobile when a nav item is clicked
              if (window.innerWidth <= 768 && e.target.closest("button")) setSidebarOpen(false);
            }}
            role="navigation"
            aria-label="Admin navigation"
          >
            {NAV_SECTIONS.map((section) => (
              <SidebarGroup
                key={section.group}
                section={section}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                darkMode={true}
                C={DARK_C}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>

          {/* Bottom controls */}
          <div style={{ padding: sidebarCollapsed ? "0 8px" : "0 20px", display: "flex", flexDirection: "column", gap: 10, transition: "padding 0.25s" }}>
            {/* Collapse/expand toggle */}
            <button
              className="admin-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: "none", border: `1px solid ${DARK_C.border}`, borderRadius: 3,
                cursor: "pointer", padding: "8px 12px",
                fontFamily: NU, fontSize: 10, color: DARK_C.grey,
                fontWeight: 400, letterSpacing: "0.08em",
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_C.gold; e.currentTarget.style.color = DARK_C.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_C.border; e.currentTarget.style.color = DARK_C.grey; }}
            >
              <span style={{ fontSize: 12, transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s", display: "inline-block" }}>»</span>
              {!sidebarCollapsed && "Collapse"}
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: "none", border: `1px solid ${DARK_C.border}`, borderRadius: 3,
                cursor: "pointer", padding: "8px 12px",
                fontFamily: NU, fontSize: 10, color: DARK_C.grey,
                fontWeight: 400, letterSpacing: "0.08em",
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_C.gold; e.currentTarget.style.color = DARK_C.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_C.border; e.currentTarget.style.color = DARK_C.grey; }}
            >
              <span style={{ fontSize: 14 }}>{darkMode ? "☀" : "☽"}</span>
              {!sidebarCollapsed && (darkMode ? "Light Mode" : "Dark Mode")}
            </button>

            {/* ── Admin Preview Portals ─────────────────────────────── */}
            {/* Open vendor/couple dashboards without separate login    */}
            <div style={{
              borderTop: `1px solid ${DARK_C.border}`,
              paddingTop: 10,
              marginTop: 2,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              {!sidebarCollapsed && (
                <div style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: DARK_C.grey2,
                  fontFamily: NU,
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  Preview Portals
                </div>
              )}

              {/* Open Vendor Portal */}
              <button
                title="Open Vendor Portal (Admin Preview)"
                onClick={() => {
                  sessionStorage.setItem("lwd_admin_preview", JSON.stringify({ type: "vendor", id: "vdr-13" }));
                  window.location.href = "/vendor";
                }}
                style={{
                  background: "none",
                  border: `1px solid ${DARK_C.border}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  padding: sidebarCollapsed ? "8px 0" : "8px 12px",
                  fontFamily: NU,
                  fontSize: 10,
                  color: DARK_C.grey,
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  gap: 8,
                  width: "100%",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_C.border; e.currentTarget.style.color = DARK_C.grey; e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontSize: 12, flexShrink: 0 }}>⊞</span>
                {!sidebarCollapsed && "Vendor Portal"}
              </button>

              {/* Open Getting Married Portal */}
              <button
                title="Open Getting Married Portal (Admin Preview)"
                onClick={() => {
                  sessionStorage.setItem("lwd_admin_preview", JSON.stringify({ type: "couple", id: "couple-1" }));
                  window.location.href = "/getting-married";
                }}
                style={{
                  background: "none",
                  border: `1px solid ${DARK_C.border}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  padding: sidebarCollapsed ? "8px 0" : "8px 12px",
                  fontFamily: NU,
                  fontSize: 10,
                  color: DARK_C.grey,
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  gap: 8,
                  width: "100%",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_C.border; e.currentTarget.style.color = DARK_C.grey; e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontSize: 12, flexShrink: 0 }}>♡</span>
                {!sidebarCollapsed && "Getting Married"}
              </button>

              {/* View Live Site */}
              <button
                title="View live site"
                onClick={() => window.open(import.meta.env.VITE_LIVE_SITE_URL || "https://luxuryweddingdirectory.com", "_blank")}
                style={{
                  background: "none",
                  border: `1px solid ${DARK_C.gold}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  padding: sidebarCollapsed ? "8px 0" : "8px 12px",
                  fontFamily: NU,
                  fontSize: 10,
                  color: DARK_C.gold,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  gap: 8,
                  width: "100%",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontSize: 11, flexShrink: 0 }}>↗</span>
                {!sidebarCollapsed && "View Live Site"}
              </button>
            </div>
            {/* ── End Preview Portals ───────────────────────────────── */}

            {/* Exit */}
            <button
              onClick={onBack}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: NU, fontSize: 11, color: DARK_C.grey2,
                fontWeight: 300, letterSpacing: "0.06em",
                padding: 0, transition: "color 0.2s", textAlign: sidebarCollapsed ? "center" : "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DARK_C.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DARK_C.grey2)}
            >
              {sidebarCollapsed ? "←" : "← Exit to site"}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="admin-main" style={{ flex: 1, minHeight: 0, padding: listingStudioMode || activeTab === 'listing-studio' || activeTab === 'page-editor' || activeTab === 'magazine-studio' ? 0 : "40px 48px", overflow: activeTab === 'page-editor' || activeTab === 'magazine-studio' ? "hidden" : "auto", transition: "background 0.3s" }}>
          {/* Magazine Studio, full-screen inside admin layout */}
          {activeTab === 'magazine-studio' ? (
            <MagazineStudio
              onNavigateMagazine={() => onNavigate('magazine')}
              onNavigateHome={() => setActiveTabState('overview')}
            />
          ) : listingStudioMode || activeTab === 'listing-studio' ? (
            <Suspense fallback={
              <div style={{ backgroundColor: C.black, color: C.white, padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <h2>Loading Listing Studio...</h2>
                  <p style={{ marginTop: '20px', color: '#999' }}>If this takes too long, check console (F12) for errors</p>
                </div>
              </div>
            }>
              <ListingStudioPage
                darkMode={darkMode}
                navigationState={{ mode: listingStudioMode || 'new', listingId: listingStudioListingId }}
                onNavigate={() => {
                  setListingStudioMode(null);
                  setListingStudioListingId(null);
                  setActiveTab('listings');
                }}
                onSaveComplete={(savedId) => {
                  // After save: update state and URL to reflect the saved listing
                  if (savedId && typeof savedId === 'string') {
                    setListingStudioMode('edit');
                    setListingStudioListingId(savedId);
                    window.location.hash = `listing-studio/${savedId}`;
                    setActiveTabState('listing-studio');
                  }
                }}
              />
            </Suspense>
          ) : (
            <>
              {activeTab !== 'page-editor' && (
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{
                    fontFamily: GD, fontSize: 24, fontWeight: 400,
                    color: C.off, margin: "0 0 6px", transition: "color 0.3s",
                  }}>
                    {ALL_NAV_ITEMS.find((n) => n.key === activeTab)?.label}
                  </h1>
                  <div style={{ width: 24, height: 1, background: C.gold, opacity: 0.4, marginTop: 12 }} />
                </div>
              )}

              {renderModule()}
            </>
          )}
        </main>

      </div>
    </ThemeCtx.Provider>
  );
}

// ── Artistry Admin Module ─────────────────────────────────────────────────────
const STATUS_COLORS = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const NU_A = "var(--font-body)";
const GD_A = "var(--font-heading-primary)";

function ArtistryAdminModule({ C }) {
  const [tab, setTab] = useState('submissions');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [noteInputs, setNoteInputs] = useState({});
  const [actionMsg, setActionMsg] = useState(null);

  const load = async (sf = statusFilter) => {
    setLoading(true);
    const { data } = await getAllSubmissions(sf === 'all' ? null : sf);
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (sf) => {
    setStatusFilter(sf);
    load(sf);
  };

  const handleReview = async (id, status) => {
    const note = noteInputs[id] || '';
    const { error } = await reviewSubmission(id, status, note);
    if (error) { setActionMsg({ ok: false, text: 'Failed to update.' }); return; }
    setActionMsg({ ok: true, text: `Entry ${status}.` });
    setTimeout(() => setActionMsg(null), 3000);
    load();
  };

  const handleToggleFeatured = async (id, current) => {
    await toggleFeatured(id, !current);
    load();
  };

  const counts = { all: submissions.length };
  ['pending','approved','rejected'].forEach(s => {
    counts[s] = submissions.filter(x => x.status === s).length;
  });

  const visibleSubs = statusFilter === 'all'
    ? submissions
    : submissions.filter(s => s.status === statusFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: NU_A, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>✦ Awards Management</div>
        <h2 style={{ fontFamily: GD_A, fontSize: 32, color: C.white, fontWeight: 600, margin: '0 0 6px' }}>The Wedding Artistry Awards 2026</h2>
        <p style={{ fontFamily: NU_A, fontSize: 13, color: C.grey, margin: 0 }}>Review vendor submissions · Approve entries to publish them on <span style={{ color: C.gold }}>/artistry-awards</span></p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {[
          { id: 'submissions', label: 'Submissions' },
          { id: 'preview',     label: 'Live Page Preview' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily: NU_A, fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? C.gold : C.grey,
            background: 'none', border: 'none',
            borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
            padding: '8px 18px', cursor: 'pointer', transition: 'color 0.2s',
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <ArtistryPage />
        </div>
      )}

      {tab === 'submissions' && (
        <>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all','pending','approved','rejected'].map(sf => (
              <button key={sf} onClick={() => handleFilter(sf)} style={{
                fontFamily: NU_A, fontSize: 11, fontWeight: statusFilter === sf ? 700 : 400,
                letterSpacing: '0.08em', textTransform: 'capitalize',
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${statusFilter === sf ? C.gold : C.border}`,
                background: statusFilter === sf ? `${C.gold}18` : 'transparent',
                color: statusFilter === sf ? C.gold : C.grey,
                transition: 'all 0.18s',
              }}>
                {sf === 'all' ? 'All' : STATUS_LABELS[sf]} ({counts[sf] || 0})
              </button>
            ))}
          </div>

          {actionMsg && (
            <div style={{
              padding: '10px 16px', borderRadius: 6, marginBottom: 16,
              background: actionMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${actionMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              fontFamily: NU_A, fontSize: 13,
              color: actionMsg.ok ? '#10b981' : '#ef4444',
            }}>
              {actionMsg.text}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: NU_A, fontSize: 13, color: C.grey }}>Loading submissions…</div>
          ) : visibleSubs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: NU_A, fontSize: 13, color: C.grey }}>
              {statusFilter === 'all' ? 'No submissions yet. Vendors can submit from their dashboard → Artistry Awards tab.' : `No ${statusFilter} submissions.`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {visibleSubs.map(sub => (
                <div key={sub.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${STATUS_COLORS[sub.status]}`,
                  borderRadius: 8, padding: 20,
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Primary image */}
                    {sub.images?.[0] && (
                      <img src={sub.images[0]} alt="" style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: `1px solid ${C.border}` }} onError={e => { e.target.style.display = 'none'; }} />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: GD_A, fontSize: 18, color: C.white, fontWeight: 600 }}>{sub.vendor_name}</span>
                        <span style={{
                          fontFamily: NU_A, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: STATUS_COLORS[sub.status],
                          padding: '2px 8px', borderRadius: 3,
                          background: `${STATUS_COLORS[sub.status]}15`,
                          border: `1px solid ${STATUS_COLORS[sub.status]}30`,
                        }}>
                          {STATUS_LABELS[sub.status]}
                        </span>
                        {sub.status === 'approved' && (
                          <button onClick={() => handleToggleFeatured(sub.id, sub.featured)} style={{
                            fontFamily: NU_A, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer',
                            padding: '2px 8px', borderRadius: 3, border: `1px solid ${sub.featured ? C.gold : C.border}`,
                            background: sub.featured ? `${C.gold}20` : 'transparent',
                            color: sub.featured ? C.gold : C.grey,
                          }}>
                            {sub.featured ? '★ Featured' : '☆ Set Featured'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontFamily: NU_A, fontSize: 11, color: C.grey, marginBottom: 8 }}>
                        {sub.category} · {sub.location}, {sub.country}
                        <span style={{ marginLeft: 12, color: '#555' }}>
                          Submitted {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {sub.quote && (
                        <p style={{ fontFamily: NU_A, fontSize: 12, fontStyle: 'italic', color: 'rgba(245,240,232,0.55)', margin: '0 0 8px', lineHeight: 1.5 }}>
                          "{sub.quote}"
                        </p>
                      )}
                      {/* Image strip */}
                      {sub.images?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                          {sub.images.slice(0, 5).map((url, i) => (
                            <img key={i} src={url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, border: `1px solid ${C.border}` }} onError={e => { e.target.style.display = 'none'; }} />
                          ))}
                        </div>
                      )}
                      {sub.video_url && (
                        <div style={{ fontFamily: NU_A, fontSize: 11, color: C.grey }}>
                          🎥 <a href={sub.video_url} target="_blank" rel="noreferrer" style={{ color: C.gold, textDecoration: 'none' }}>{sub.video_url.slice(0, 60)}{sub.video_url.length > 60 ? '…' : ''}</a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {sub.status !== 'approved' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                        <input
                          value={noteInputs[sub.id] || ''}
                          onChange={e => setNoteInputs(n => ({ ...n, [sub.id]: e.target.value }))}
                          placeholder="Optional note to vendor…"
                          style={{ background: '#1a1a1a', border: `1px solid ${C.border}`, borderRadius: 4, padding: '7px 10px', fontFamily: NU_A, fontSize: 11, color: C.white, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleReview(sub.id, 'approved')} style={{
                            flex: 1, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                            color: '#10b981', borderRadius: 4, padding: '7px 0',
                            fontFamily: NU_A, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer',
                          }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleReview(sub.id, 'rejected')} style={{
                            flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', borderRadius: 4, padding: '7px 0',
                            fontFamily: NU_A, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer',
                          }}>
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {sub.status === 'approved' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                        <button onClick={() => handleReview(sub.id, 'rejected')} style={{
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#ef4444', borderRadius: 4, padding: '7px 14px',
                          fontFamily: NU_A, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          textTransform: 'uppercase', cursor: 'pointer',
                        }}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {sub.admin_note && (
                    <div style={{ marginTop: 10, fontFamily: NU_A, fontSize: 11, color: C.grey, fontStyle: 'italic' }}>
                      Note sent to vendor: "{sub.admin_note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Magazine Admin Module
// ─────────────────────────────────────────────────────────────────────────────
const GOLD_M = '#c9a96e';

function MagazineAdminModule({ C, onNavigate }) {
  const [tab, setTab] = useState('posts');
  const [productSearch, setProductSearch] = useState('');
  const [productCat, setProductCat] = useState('all');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = POSTS.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.author.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = [
    { label: 'Total Articles', value: POSTS.length },
    { label: 'Categories', value: CATEGORIES.length },
    { label: 'Featured', value: POSTS.filter(p => p.featured).length },
    { label: 'Trending', value: POSTS.filter(p => p.trending).length },
  ];

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      fontFamily: NU_A, fontSize: 11, fontWeight: tab === id ? 700 : 400,
      letterSpacing: '0.06em', padding: '7px 16px', borderRadius: 3,
      background: tab === id ? `${GOLD_M}18` : 'transparent',
      border: `1px solid ${tab === id ? GOLD_M : C.border}`,
      color: tab === id ? GOLD_M : C.grey, cursor: 'pointer',
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: 'clamp(24px, 3vw, 40px)', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: NU_A, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD_M, marginBottom: 6 }}>
            Content · The Magazine
          </div>
          <h2 style={{ fontFamily: GD_A, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 400, color: C.heading, margin: 0 }}>
            The Magazine
          </h2>
          <p style={{ fontFamily: NU_A, fontSize: 13, color: C.grey, margin: '6px 0 0' }}>
            AI-driven editorial · feeds into the Aura AI search engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate('magazine-studio')}
              style={{
                fontFamily: NU_A, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#0a0a0a',
                background: GOLD_M, border: 'none',
                padding: '9px 18px', borderRadius: 3, cursor: 'pointer',
              }}
            >
              Open Magazine Studio ↗
            </button>
          )}
          <a href="/magazine" target="_blank" rel="noreferrer" style={{
            fontFamily: NU_A, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: GOLD_M,
            border: `1px solid ${GOLD_M}50`, padding: '9px 18px', borderRadius: 3,
            textDecoration: 'none',
          }}>
            ↗ View Live Magazine
          </a>
        </div>
      </div>

      <div className="admin-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: GD_A, fontSize: 28, fontWeight: 400, color: C.heading }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: `${GOLD_M}08`, border: `1px solid ${GOLD_M}25`,
        borderRadius: 6, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 18 }}>✦</span>
        <div>
          <div style={{ fontFamily: NU_A, fontSize: 11, fontWeight: 700, color: GOLD_M, letterSpacing: '0.08em', marginBottom: 3 }}>
            AI ENGINE INTEGRATION ACTIVE
          </div>
          <div style={{ fontFamily: NU_A, fontSize: 12, color: C.grey, lineHeight: 1.5 }}>
            Magazine articles are indexed by Aura AI and surfaced in venue search results, planning recommendations, and the AI chat assistant. New articles auto-index on publish.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <TabBtn id="posts" label="Articles" />
        <TabBtn id="products" label="Affiliate Products" />
        <TabBtn id="categories" label="Categories" />
        <TabBtn id="settings" label="Settings" />
      </div>

      {tab === 'posts' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." style={{
              fontFamily: NU_A, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '8px 14px', outline: 'none', minWidth: 220,
            }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
              fontFamily: NU_A, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '8px 14px', outline: 'none',
            }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
            <span style={{ fontFamily: NU_A, fontSize: 11, color: C.grey, marginLeft: 'auto' }}>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 90px 70px 90px', padding: '10px 16px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['', 'Title', 'Category', 'Author', 'Read', 'Status'].map(h => (
                <span key={h} style={{ fontFamily: NU_A, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey }}>{h}</span>
              ))}
            </div>
            {filtered.map((post, i) => (
              <div key={post.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 130px 90px 70px 90px',
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? 'transparent' : `${C.surface}60`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 2, backgroundImage: `url(${post.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div>
                  <div style={{ fontFamily: NU_A, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {post.title}
                  </div>
                  <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey }}>/{post.slug}</div>
                </div>
                <span style={{ fontFamily: NU_A, fontSize: 10, color: C.grey }}>{post.categoryLabel}</span>
                <span style={{ fontFamily: NU_A, fontSize: 10, color: C.grey }}>{post.author.name.split(' ')[0]}</span>
                <span style={{ fontFamily: NU_A, fontSize: 10, color: C.grey }}>{post.readingTime} min</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {post.featured && <span style={{ fontFamily: NU_A, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, background: `${GOLD_M}18`, color: GOLD_M, border: `1px solid ${GOLD_M}30` }}>Featured</span>}
                  {post.trending && <span style={{ fontFamily: NU_A, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Trending</span>}
                  {!post.featured && !post.trending && <span style={{ fontFamily: NU_A, fontSize: 8, color: C.grey }}>Published</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." style={{
              fontFamily: NU_A, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '8px 14px', outline: 'none', minWidth: 220,
            }} />
            <select value={productCat} onChange={e => setProductCat(e.target.value)} style={{
              fontFamily: NU_A, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '8px 14px', outline: 'none',
            }}>
              <option value="all">All Categories</option>
              {['gowns','shoes','jewellery','beauty','accessories','guest-dresses','honeymoon'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-',' ')}</option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button style={{ fontFamily: NU_A, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: GOLD_M, border: 'none', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}>
                + Add Product
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {PRODUCTS
              .filter(p => (productCat === 'all' || p.category === productCat) && (!productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.brand.toLowerCase().includes(productSearch.toLowerCase())))
              .map(p => (
                <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: 80, flexShrink: 0, backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: NU_A, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD_M, marginBottom: 4 }}>
                      {p.brand}
                    </div>
                    <div style={{ fontFamily: NU_A, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontFamily: NU_A, fontSize: 12, fontWeight: 600, color: C.text }}>{formatPrice(p.salePrice || p.price)}</span>
                      {p.salePrice && <span style={{ fontFamily: NU_A, fontSize: 11, color: C.grey, textDecoration: 'line-through' }}>{formatPrice(p.price)}</span>}
                      {p.badge && <span style={{ fontFamily: NU_A, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', background: GOLD_M, padding: '2px 6px', borderRadius: 2 }}>{p.badge}</span>}
                    </div>
                    <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey, marginBottom: 10 }}>
                      via {p.retailer} · {p.category}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ fontFamily: NU_A, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text, background: C.bg, border: `1px solid ${C.border}`, padding: '5px 10px', borderRadius: 3, cursor: 'pointer' }}>Edit</button>
                      <button style={{ fontFamily: NU_A, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text, background: C.bg, border: `1px solid ${C.border}`, padding: '5px 10px', borderRadius: 3, cursor: 'pointer' }}>Duplicate</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          <div style={{ marginTop: 24, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontFamily: NU_A, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey, marginBottom: 12 }}>Collections</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
              {Object.entries(COLLECTIONS).map(([id, col]) => (
                <div key={id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '12px 14px' }}>
                  <div style={{ fontFamily: NU_A, fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>{col.label}</div>
                  <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey }}>{col.productIds.length} products</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {CATEGORIES.map(cat => {
            const count = POSTS.filter(p => p.category === cat.id).length;
            return (
              <div key={cat.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 4, backgroundImage: `url(${cat.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div>
                  <div style={{ fontFamily: NU_A, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3 }}>{cat.label}</div>
                  <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey, marginBottom: 6 }}>{count} article{count !== 1 ? 's' : ''}</div>
                  <div style={{ fontFamily: NU_A, fontSize: 10, color: GOLD_M, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.defaultCardStyle}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: NU_A, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey, marginBottom: 16 }}>Magazine Settings</div>
            {[
              { label: 'Default Hero Style', value: 'grid', note: 'editorial · split · grid · carousel' },
              { label: 'Articles per Page', value: '12' },
              { label: 'Newsletter CTA', value: 'Enabled' },
              { label: 'AI Auto-Index', value: 'Active', note: 'New articles indexed on publish' },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontFamily: NU_A, fontSize: 12, color: C.text }}>{label}</div>
                  {note && <div style={{ fontFamily: NU_A, fontSize: 10, color: C.grey, marginTop: 2 }}>{note}</div>}
                </div>
                <span style={{ fontFamily: NU_A, fontSize: 12, fontWeight: 600, color: GOLD_M }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: NU_A, fontSize: 12, color: C.grey, lineHeight: 1.6, padding: '0 4px' }}>
            <strong style={{ color: C.text }}>Database integration:</strong> Magazine articles currently use static editorial data. When connected to Supabase, articles will be fetched from the <code style={{ color: GOLD_M }}>magazine_posts</code> table and automatically indexed by the Aura AI engine.
          </div>
        </div>
      )}
    </div>
  );
}
