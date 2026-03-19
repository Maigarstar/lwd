// ─── src/components/sections/SiteFooter.jsx ──────────────────────────────────
// Live footer driven by footer_config + footer_items in Supabase.
// Falls back gracefully to hardcoded content if DB is unavailable.
// Column IDs: 0=iconic strip, 1=brand(config), 2-6=nav cols, 99=bottom bar.
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const EDITORIAL_LINE = "The world's finest venues and vendors, carefully selected";

// ── Fallback content (used when Supabase unavailable) ─────────────────────────
const FALLBACK_ICONIC = [
  "The Peninsula Hotels","Raffles","One and Only","Auberge Resorts",
  "The Dorchester","Waldorf Astoria","Conrad","Park Hyatt","Banyan Tree","Jumeirah",
  "Rosewood","Belmond","Aman","Six Senses","Mandarin Oriental",
  "Four Seasons","Fairmont","The Ritz","Villa d'Este","Ashford Castle",
];

const FALLBACK_NAV = [
  {
    title: "Couples",
    links: [
      { label: "Browse Venues",      url: "/venues" },
      { label: "Find Photographers", url: "/vendors/photographers" },
      { label: "Wedding Planners",   url: "/vendors/wedding-planners" },
      { label: "Real Weddings",      url: "/real-weddings" },
      { label: "The Magazine",       url: "/magazine" },
      { label: "Planning Checklist", url: "/planning-checklist" },
    ],
  },
  {
    title: "Vendors",
    links: [
      { label: "List Your Business", url: "/list-your-business" },
      { label: "Advertise",          url: "/advertise" },
      { label: "Pricing Plans",      url: "/pricing" },
      { label: "Success Stories",    url: "/success-stories" },
      { label: "Vendor Dashboard",   url: "/vendor-dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us",            url: "/about" },
      { label: "Editorial Standards", url: "/editorial-standards" },
      { label: "Press & Media",       url: "/press" },
      { label: "Careers",             url: "/careers" },
      { label: "Contact",             url: "/contact" },
      { label: "Privacy Policy",      url: "/privacy-policy" },
    ],
  },
];

const FALLBACK_BOTTOM_LINKS = [
  { label: "Privacy", url: "/privacy" },
  { label: "Terms",   url: "/terms" },
  { label: "Cookies", url: "/cookies" },
  { label: "Sitemap", url: "/sitemap" },
  { label: "Admin",   url: "/admin" },
];

const WA_URL =
  "https://wa.me/447960497211?text=Hello%20Luxury%20Wedding%20Directory%2C%20I%20would%20like%20more%20information";

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Social SVG icons ──────────────────────────────────────────────────────────
function SocialSvg({ platform, size = 20, color = "currentColor" }) {
  if (platform === "instagram") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17" cy="7" r="1" fill={color} stroke="none" />
    </svg>
  );
  if (platform === "pinterest") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.39 1.27-5.39s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.21-2.47 3.21-5.39 0-2.23-1.51-3.79-3.66-3.79-2.49 0-3.96 1.87-3.96 3.8 0 .75.29 1.56.65 2 .07.09.08.17.06.26-.07.27-.21.87-.24.99-.04.16-.13.19-.3.12-1.12-.52-1.82-2.17-1.82-3.49 0-2.84 2.06-5.44 5.94-5.44 3.12 0 5.54 2.22 5.54 5.19 0 3.1-1.95 5.59-4.66 5.59-.91 0-1.77-.47-2.06-1.03l-.56 2.09c-.2.78-.75 1.75-1.12 2.34.84.26 1.74.4 2.67.4 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  );
  if (platform === "tiktok") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34v-7a8.27 8.27 0 0 0 4.84 1.55V6.41a4.85 4.85 0 0 1-1.07-.28z"/>
    </svg>
  );
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SiteFooter({
  onNavigateHome,
  onNavigateContact,
  onNavigatePartnership,
  onNavigateAdmin,
  onNavigateAbout,
  onNavigateStandard,
  onViewCategory,
  onNavigateGettingMarried,
  onNavigateArtistryAwards,
  onNavigateMagazine,
  onNavigatePartnerEnquiry,
}) {
  const C = useTheme();
  const [cfg, setCfg]     = useState(null);
  const [items, setItems] = useState(null); // null = still loading

  useEffect(() => {
    async function load() {
      try {
        const [cfgRes, itemsRes] = await Promise.all([
          supabase.from("footer_config").select("*").eq("id", "homepage").maybeSingle(),
          supabase.from("footer_items").select("*").eq("visible", true).order("position"),
        ]);
        if (!cfgRes.error && cfgRes.data)   setCfg(cfgRes.data);
        if (!itemsRes.error && itemsRes.data) setItems(itemsRes.data);
      } catch {
        // Supabase unavailable - keep null, render fallback below
      }
    }
    load();
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const gold      = cfg?.accent_color  || C.gold || "#c9a84c";
  const textColor = cfg?.text_color    || "#d4c8b0";
  const bgColor   = cfg?.bg_color      || "#0a0a08";
  const bbBg      = cfg?.bottom_bar_bg || "#080604";
  const bbText    = cfg?.bottom_bar_text || "rgba(255,255,255,0.3)";
  const padX      = cfg?.pad_x ?? 64;

  // Group visible items by column_id, sorted by position
  const grouped = {};
  (items || []).forEach(item => {
    if (!grouped[item.column_id]) grouped[item.column_id] = [];
    grouped[item.column_id].push(item);
  });

  // Iconic strip names
  const iconicBlock = (grouped[0] || []).find(i => i.block_type === "iconic_venues");
  const iconicNames = iconicBlock?.iconic_venues?.length
    ? iconicBlock.iconic_venues.map(e => e.name).filter(Boolean)
    : FALLBACK_ICONIC;

  // Repeat for seamless marquee (min 3x to fill any viewport)
  const reps = Math.max(3, Math.ceil(30 / iconicNames.length));
  const marqueeNames = Array.from({ length: reps }, () => iconicNames).flat();

  // Nav columns (2-6): build from DB when loaded, else use fallback
  let navCols;
  if (items !== null) {
    navCols = [2, 3, 4, 5, 6]
      .map(colId => {
        const colItems = grouped[colId] || [];
        const heading  = colItems.find(i => i.block_type === "heading");
        const links    = colItems.filter(i => i.block_type === "link");
        return heading ? { colId, title: heading.content || heading.label, links } : null;
      })
      .filter(Boolean);
    // Fall back to FALLBACK_NAV if DB returned nothing for nav cols
    if (!navCols.length) navCols = FALLBACK_NAV.map((c, i) => ({ colId: i + 2, ...c }));
  } else {
    navCols = FALLBACK_NAV.map((c, i) => ({ colId: i + 2, ...c }));
  }

  // Bottom bar links (col 99)
  const bottomLinks = (grouped[99] || []).length
    ? grouped[99]
    : FALLBACK_BOTTOM_LINKS;

  // Social (only real URLs)
  const socials = [];
  if (cfg?.social_instagram) socials.push({ platform: "instagram", url: cfg.social_instagram, label: "Instagram" });
  if (cfg?.social_pinterest) socials.push({ platform: "pinterest", url: cfg.social_pinterest, label: "Pinterest" });
  if (cfg?.social_tiktok)    socials.push({ platform: "tiktok",    url: cfg.social_tiktok,    label: "TikTok" });

  // Strip label
  const stripLabel    = cfg?.strip_label || "Iconic Venues";
  const showNewsletter = cfg ? cfg.show_newsletter : false;
  const showBottomBar   = cfg ? cfg.show_bottom_bar : true;
  const copyrightText   = cfg?.copyright_text || "2026 LuxuryWeddingDirectory.com · Est. 2006 · All rights reserved";
  const showTaigenic    = cfg ? cfg.show_taigenic !== false : true;
  const taigenicLabel   = cfg?.taigenic_label   || "Powered by Taigenic.AI";
  const taigenicTagline = cfg?.taigenic_tagline || "AI systems for luxury brands";
  const taigenicUrl     = cfg?.taigenic_url     || "/taigenic";
  const taigenicSymbol  = cfg?.taigenic_symbol  || "✦";

  // Grid columns: brand (wider) + one per nav col
  const gridTemplateColumns = `2fr ${navCols.map(() => "1fr").join(" ")}`;

  // Link click handler: URL-first, then callback fallback
  function handleLinkClick(item) {
    if (item.url && item.url !== "#") {
      window.location.href = item.url;
      return;
    }
  }

  const linkStyle = (hovered) => ({
    fontFamily: NU,
    fontSize: 12,
    color: hovered ? gold : "rgba(255,255,255,0.3)",
    marginBottom: 9,
    cursor: "pointer",
    transition: "color 0.2s",
    textDecoration: "none",
    display: "block",
  });

  return (
    <footer
      className="site-footer"
      aria-label="Site footer"
      style={{ background: bgColor, borderTop: `1px solid rgba(201,168,76,0.12)` }}
    >
      {/* ── Editorial line ──────────────────────────────────────────────── */}
      <div className="site-footer-tagline" style={{
        textAlign: "center",
        padding: "52px 0 36px",
        background: bgColor,
      }}>
        <p style={{
          fontFamily: GD,
          fontSize: 20,
          fontWeight: 400,
          fontStyle: "italic",
          color: textColor,
          opacity: 0.55,
          letterSpacing: "0.02em",
          lineHeight: 1.5,
          margin: 0,
        }}>
          {EDITORIAL_LINE}
        </p>
      </div>

      {/* ── Separator before strip ──────────────────────────────────────── */}
      <div aria-hidden="true" style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${gold}, rgba(116,129,114,0.6), transparent)`,
        margin: `0 ${padX}px 0`,
      }} />

      {/* ── Iconic Venues marquee strip ─────────────────────────────────── */}
      <div style={{ maxWidth: "100%", margin: "0 auto", padding: `${cfg?.strip_pad_y ?? 20}px 0` }}>
        {/* Label */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 48, height: 1, background: gold, opacity: 0.45 }} />
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 600,
              letterSpacing: "0.28em", textTransform: "uppercase",
              color: gold, opacity: 0.85,
            }}>{stripLabel}</span>
            <div style={{ width: 48, height: 1, background: gold, opacity: 0.45 }} />
          </div>
        </div>

        {/* Scroll band */}
        <div
          className="site-footer-scroll-band"
          style={{
            overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          <div
            className="site-footer-scroll-track"
            style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", width: "max-content" }}
          >
            {marqueeNames.map((name, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                <span style={{
                  fontFamily: NU, fontSize: 11, fontWeight: 400,
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}>{name}</span>
                <span aria-hidden="true" style={{
                  color: gold, fontSize: 6, opacity: 0.4, margin: "0 40px",
                }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer grid ────────────────────────────────────────────── */}
      <div className="site-footer-body" style={{ maxWidth: "100%", padding: `0 ${padX}px` }}>
        <div aria-hidden="true" style={{
          height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 52,
        }} />

        <div
          className="site-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns,
            gap: 48,
            marginBottom: 52,
            alignItems: "start",
          }}
        >
          {/* ── Brand column ── */}
          <div className="site-footer-brand">
            {(cfg?.show_logo ?? true) && (
              cfg?.logo_type === "image" && cfg?.logo_url ? (
                <img
                  src={cfg.logo_url}
                  alt="Luxury Wedding Directory"
                  style={{
                    height: cfg?.logo_size || 48,
                    maxWidth: "100%",
                    objectFit: "contain",
                    display: "block",
                    marginBottom: 6,
                  }}
                />
              ) : (
                <div style={{
                  fontFamily: GD, fontSize: cfg?.logo_size || 10,
                  color: gold, letterSpacing: "0.22em",
                  textTransform: "uppercase", lineHeight: 1.7, marginBottom: 6,
                }}>
                  {(() => {
                    const words = (cfg?.logo_text || "Luxury Wedding Directory").split(" ");
                    return words.length > 1
                      ? <>{words.slice(0, -1).join(" ")}<br />{words[words.length - 1]}</>
                      : words[0];
                  })()}
                </div>
              )
            )}
            <div style={{
              fontFamily: NU, fontSize: 9, letterSpacing: "3px",
              textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 20,
            }}>
              {cfg?.brand_est_text || "Est. 2006 · Worldwide"}
            </div>

            {/* Gold divider */}
            <div aria-hidden="true" style={{
              width: 40, height: 1,
              background: `linear-gradient(90deg, ${gold}, transparent)`,
              marginBottom: 18,
            }} />

            {(cfg?.show_tagline ?? true) && (
              <p style={{
                fontFamily: NU, fontSize: 13,
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.85, maxWidth: 300,
                margin: 0, marginBottom: 18,
              }}>
                {cfg?.tagline_text || "The world's most trusted luxury wedding directory. Connecting discerning couples with exceptional venues and professionals across 62 countries."}
              </p>
            )}

            {/* Office */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                fontFamily: NU, fontSize: 10, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 4,
              }}>Office</div>
              <div style={{
                fontFamily: NU, fontSize: 12,
                color: "rgba(255,255,255,0.6)", lineHeight: 1.6,
              }}>{cfg?.brand_office_text || "Worldwide · London Headquarters"}</div>
            </div>

            {/* Social links (only real URLs) */}
            {(cfg?.show_social ?? true) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {socials.map(({ platform, url, label }) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    style={{
                      width: 36, height: 36,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "var(--lwd-radius-input)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.35)",
                      cursor: "pointer", transition: "all 0.2s", textDecoration: "none",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = gold;
                      e.currentTarget.style.color = gold;
                      e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                  >
                    <SocialSvg platform={platform} size={18} color="currentColor" />
                  </a>
                ))}

                {/* WhatsApp always shown */}
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Chat with us on WhatsApp"
                  style={{
                    width: 36, height: 36,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "var(--lwd-radius-input)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.35)",
                    cursor: "pointer", transition: "all 0.2s", textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = gold;
                    e.currentTarget.style.color = gold;
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <WhatsAppIcon size={16} color="currentColor" />
                </a>
              </div>
            )}
          </div>

          {/* ── Nav columns (DB-driven) ── */}
          {navCols.map(({ colId, title, links }) => (
            <div key={colId}>
              <div style={{
                fontFamily: NU, fontSize: 9, letterSpacing: "0.25em",
                textTransform: "uppercase", color: gold,
                opacity: 0.75, marginBottom: 18, fontWeight: 600,
              }}>
                {title}
              </div>
              {links.map(item => {
                const label = item.label || item.text || "";
                const href  = item.url && item.url !== "" ? item.url : null;
                return href ? (
                  <a
                    key={item.id || label}
                    href={href}
                    style={linkStyle(false)}
                    onMouseEnter={e => (e.currentTarget.style.color = gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >
                    {label}
                  </a>
                ) : (
                  <div
                    key={item.id || label}
                    role="link"
                    tabIndex={0}
                    style={linkStyle(false)}
                    onMouseEnter={e => (e.currentTarget.style.color = gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                    onClick={() => handleLinkClick(item)}
                    onKeyDown={e => e.key === "Enter" && handleLinkClick(item)}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Newsletter strip ────────────────────────────────────────────── */}
      {showNewsletter && (
        <div style={{
          background: cfg?.newsletter_bg || "#000000",
          borderTop: `1px solid ${cfg?.newsletter_border_color || "#2d2d2d"}`,
          borderBottom: `1px solid ${cfg?.newsletter_border_color || "#2d2d2d"}`,
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Content — 60px padding matches footer grid */}
          <div className="site-footer-newsletter" style={{
            padding: `${cfg?.newsletter_pad_y ?? 20}px ${padX}px`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            position: "relative",
          }}>
            {/* Editorial copy */}
            <div>
              <div style={{
                fontFamily: NU, fontSize: 8, fontWeight: 700,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: gold, opacity: 0.8, marginBottom: 8,
              }}>{cfg?.newsletter_label || "The Editorial"}</div>
              <div style={{
                fontFamily: GD, fontSize: 24,
                color: textColor, marginBottom: 6, lineHeight: 1.2,
              }}>
                {cfg?.newsletter_heading || "The LWD Edit, monthly inspiration for couples"}
              </div>
              <div style={{
                fontFamily: NU, fontSize: 13,
                color: textColor, opacity: 0.55, lineHeight: 1.6,
                maxWidth: 420,
              }}>
                {cfg?.newsletter_subtext || "Extraordinary venues, real weddings, and planning guides. No spam."}
              </div>
            </div>

            {/* Subscribe row */}
            <div className="site-footer-subscribe" style={{ display: "flex", flexShrink: 0, alignItems: "stretch", width: 380 }}>
              <input
                type="email"
                placeholder="Your email address"
                aria-label="Email address for newsletter"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  borderTop: `1px solid ${gold}45`,
                  borderBottom: `1px solid ${gold}45`,
                  borderLeft: `1px solid ${gold}45`,
                  borderRight: "none",
                  color: textColor, fontFamily: NU, fontSize: 13,
                  padding: "13px 16px", outline: "none",
                  letterSpacing: "0.01em",
                }}
              />
              <button style={{
                background: `linear-gradient(135deg, ${gold} 0%, #9a7832 100%)`,
                border: "none",
                color: "#0a0800", fontFamily: NU, fontSize: 10,
                fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", padding: "13px 22px",
                cursor: "pointer", flexShrink: 0,
                whiteSpace: "nowrap",
              }}>
                {cfg?.newsletter_btn_label || "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      {showBottomBar && (
        <div
          className="site-footer-legal"
          style={{
            background: bbBg,
            padding: `14px ${padX}px 8px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            textAlign: "center",
          }}
        >
          {/* Copyright */}
          <div>
            <div style={{ fontFamily: NU, fontSize: 11, color: bbText }}>
              &copy; {copyrightText}
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
              Luxury Wedding Directory is a brand of 5 Star Weddings Ltd, United Kingdom.
            </div>
          </div>

          {/* Policy links — centred */}
          <div className="site-footer-legal-links" style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {bottomLinks.map(item => {
              const label = item.label || item.text || "";
              return (
                <span
                  key={item.id || label}
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    if (label === "Admin")   onNavigateAdmin?.();
                    if (label === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
                    else if (item.url && item.url !== "") window.location.href = item.url;
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && label === "Admin") onNavigateAdmin?.();
                  }}
                  style={{
                    fontFamily: NU, fontSize: 11,
                    color: bbText, cursor: "pointer", transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = bbText)}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Taigenic signature ───────────────────────────────────────────── */}
      {showBottomBar && showTaigenic && (
        <div style={{ background: bbBg, padding: "6px 0 20px", textAlign: "center" }}>
          <a
            href={taigenicUrl}
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "8px 24px",
              borderRadius: 6,
              transition: "background 0.3s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(201,168,76,0.06)";
              e.currentTarget.querySelector(".tai-line1").style.color = gold;
              e.currentTarget.querySelector(".tai-line2").style.opacity = "0.65";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.querySelector(".tai-line1").style.color = "rgba(255,255,255,0.48)";
              e.currentTarget.querySelector(".tai-line2").style.opacity = "1";
            }}
          >
            <span className="tai-line1" style={{
              display: "block",
              fontFamily: NU,
              fontSize: 11,
              fontVariant: "small-caps",
              letterSpacing: "2.5px",
              color: "rgba(255,255,255,0.48)",
              transition: "color 0.3s",
            }}>
              {taigenicSymbol} {taigenicLabel}
            </span>
            <span className="tai-line2" style={{
              display: "block",
              fontFamily: NU,
              fontSize: 9,
              letterSpacing: "1.5px",
              color: "rgba(255,255,255,0.26)",
              marginTop: 2,
              transition: "opacity 0.3s",
            }}>
              {taigenicTagline}
            </span>
          </a>
        </div>
      )}
    </footer>
  );
}
