// ─── src/components/sections/SiteFooter.jsx ──────────────────────────────────
// Universal luxury footer, used on every page.
// Always dark. Continuous iconic-venues scroll band. Institutional tone.
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Iconic venue names (curated global luxury alliance, display only) ────────
const ICONIC_VENUES = [
  "Rosewood","Belmond","Aman","Six Senses","Mandarin Oriental","Oetker Collection",
  "Four Seasons","The Peninsula Hotels","Raffles","One and Only","Auberge Resorts",
  "The Dorchester","Waldorf Astoria","Conrad","Park Hyatt","Banyan Tree","Jumeirah",
  "Fairmont","The Ritz","Claridges","Hotel de Crillon","Le Bristol Paris",
  "Plaza Athenee","Grand Hotel Tremezzo","Villa d'Este","The Gritti Palace",
  "Ashford Castle","Adare Manor","Cliveden House","Castello di Casole",
];

// ── Social icons ─────────────────────────────────────────────────────────────
const SOCIALS = [
  { label: "Instagram", code: "IG" },
  { label: "TikTok", code: "TK" },
  { label: "YouTube", code: "YT" },
  { label: "Facebook", code: "FB" },
  { label: "Pinterest", code: "PT" },
];

const WA_URL =
  "https://wa.me/447960497211?text=Hello%20Luxury%20Wedding%20Directory%2C%20I%20would%20like%20more%20information";

// ── Navigation column definitions ────────────────────────────────────────────
const NAV_COLS = [
  {
    title: "Couples",
    links: [
      { text: "Browse Venues", action: "onViewCategory" },
      { text: "Find Photographers" },
      { text: "Florists" },
      { text: "Music & DJs" },
      { text: "Wedding Planners" },
      { text: "Real Weddings" },
      { text: "The Magazine", action: "onNavigateMagazine" },
      { text: "Artistry Awards", action: "onNavigateArtistryAwards" },
      { text: "Getting Married", action: "onNavigateGettingMarried" },
      { text: "Budget Calculator" },
      { text: "Planning Checklist" },
    ],
  },
  {
    title: "Vendors",
    links: [
      { text: "List Your Business", action: "onNavigatePartnership" },
      { text: "Advertise", action: "onNavigatePartnerEnquiry" },
      { text: "Pricing Plans", action: "onNavigatePartnership" },
      { text: "Vendor Dashboard" },
      { text: "SEO Tools" },
      { text: "Success Stories" },
      { text: "Vendor Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "About Us", action: "onNavigateAbout" },
      { text: "The LWD Standard", action: "onNavigateStandard" },
      { text: "Editorial Standards" },
      { text: "Press & Media" },
      { text: "Careers" },
      { text: "Contact", action: "onNavigateContact" },
      { text: "Privacy Policy" },
      { text: "Terms" },
    ],
  },
];

// ── WhatsApp SVG icon (monochrome, no green) ─────────────────────────────────
function WhatsAppIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
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

  // Map action keys to callbacks
  const actions = {
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
  };

  return (
    <footer
      className="site-footer"
      aria-label="Site footer"
      style={{
        background: "#0a0a08",
        borderTop: "1px solid rgba(201,168,76,0.12)",
        padding: "80px 60px 36px",
      }}
    >
      {/* ── Gold accent divider ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.gold}, rgba(116,129,114,0.6), transparent)`,
          marginBottom: 56,
        }}
      />

      {/* ── Iconic Venues Band (continuous scroll) ─────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", marginBottom: 56 }}>
        {/* Label */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              Iconic Venues
            </span>
            <div style={{ width: 28, height: 1, background: C.gold }} />
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
            style={{
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              width: "max-content",
            }}
          >
            {/* Two copies of the list for seamless infinite loop */}
            {[0, 1].map((copy) => (
              <span key={copy} style={{ display: "flex", alignItems: "center" }} aria-hidden={copy === 1 || undefined}>
                {ICONIC_VENUES.map((name, i) => (
                  <span key={`${copy}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: NU,
                        fontSize: 11,
                        fontWeight: 400,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        color: C.gold,
                        fontSize: 6,
                        opacity: 0.35,
                        margin: "0 18px",
                      }}
                    >
                      ✦
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 52,
          }}
          aria-hidden="true"
        />

        <div
          className="site-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 52,
          }}
        >
          {/* ── Brand column ── */}
          <div>
            <div
              style={{
                fontFamily: GD,
                fontSize: 10,
                color: C.gold,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                lineHeight: 1.7,
                marginBottom: 6,
              }}
            >
              Luxury Wedding
              <br />
              Directory
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 9,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 20,
              }}
            >
              Est. 2006 · Worldwide
            </div>

            {/* Gold divider */}
            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 1,
                background: `linear-gradient(90deg, ${C.gold}, transparent)`,
                marginBottom: 18,
              }}
            />

            <p
              style={{
                fontFamily: NU,
                fontSize: 13,
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.85,
                maxWidth: 300,
                margin: 0,
                marginBottom: 18,
              }}
            >
              The world's most trusted luxury wedding directory.
              Connecting discerning couples with exceptional venues and
              professionals across 62 countries.
            </p>

            {/* Office */}
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 4,
                }}
              >
                Office
              </div>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                }}
              >
                Worldwide · London Headquarters
              </div>
            </div>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SOCIALS.map(({ label, code }) => (
                <div
                  key={code}
                  role="link"
                  aria-label={label}
                  tabIndex={0}
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "var(--lwd-radius-input)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: NU,
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.35)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.gold;
                    e.currentTarget.style.color = C.gold;
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  {code}
                </div>
              ))}

              {/* WhatsApp, monochrome SVG icon */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat with us on WhatsApp"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--lwd-radius-input)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.color = C.gold;
                  e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <WhatsAppIcon size={16} color="currentColor" />
              </a>
            </div>
          </div>

          {/* ── Nav columns ── */}
          {NAV_COLS.map(({ title, links }) => (
            <div key={title}>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 18,
                  fontWeight: 600,
                }}
              >
                {title}
              </div>
              {links.map(({ text, action }) => {
                const cb = action ? actions[action] : null;
                return (
                  <div
                    key={text}
                    role="link"
                    tabIndex={0}
                    aria-disabled={!cb || undefined}
                    onClick={() => cb?.()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") cb?.();
                    }}
                    style={{
                      fontFamily: NU,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.3)",
                      marginBottom: 9,
                      cursor: cb ? "pointer" : "default",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = C.gold;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Legal bar ─────────────────────────────────────────────────── */}
        <div
          className="site-footer-legal"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              © {new Date().getFullYear()} Luxury Wedding Directory · Powered by Taigenic.ai
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                marginTop: 4,
              }}
            >
              Part of 5 Star Weddings Ltd 2006–{new Date().getFullYear()}
            </div>
          </div>

          <div
            className="site-footer-legal-links"
            style={{ display: "flex", gap: 20 }}
          >
            {["Privacy", "Terms", "Cookies", "Sitemap", "Admin"].map((l) => (
              <span
                key={l}
                role="link"
                tabIndex={0}
                onClick={() => {
                  if (l === "Admin") onNavigateAdmin?.();
                  if (l === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && l === "Admin") onNavigateAdmin?.();
                  if (e.key === "Enter" && l === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.2)")
                }
              >
                {l}
              </span>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
