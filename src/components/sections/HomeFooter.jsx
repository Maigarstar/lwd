// ─── src/components/sections/HomeFooter.jsx ─────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const SOCIALS = [
  ["IG", "◈"],
  ["TK", "▷"],
  ["YT", "▶"],
  ["FB", "ƒ"],
  ["PT", "⊕"],
];

const NAV_COLS = [
  [
    "Couples",
    [
      "Browse Venues",
      "Find Photographers",
      "Florists",
      "Music & DJs",
      "Wedding Planners",
      "Real Weddings",
      "Budget Calculator",
      "Planning Checklist",
    ],
  ],
  [
    "Vendors",
    [
      "List Your Business",
      "Pricing Plans",
      "Vendor Dashboard",
      "SEO Tools",
      "Success Stories",
      "Vendor Blog",
      "API Access",
    ],
  ],
  [
    "Company",
    [
      "About Us",
      "20 Years of LWD",
      "Editorial Standards",
      "Press & Media",
      "Careers",
      "Contact",
      "Privacy Policy",
      "Terms",
    ],
  ],
];

export default function HomeFooter({ onListBusiness, onNavigateStandard, onNavigateContact, onNavigatePartnership, onNavigateAdmin }) {
  const C = useTheme();

  return (
    <footer
      className="home-footer"
      style={{
        background: "#0c0c0a",
        borderTop: "1px solid rgba(201,168,76,0.12)",
        padding: "70px 60px 36px",
      }}
    >
      {/* Gold accent line */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: `linear-gradient(90deg,transparent,${C.gold},rgba(116,129,114,0.6),transparent)`,
          marginBottom: 60,
        }}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          className="home-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 52,
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                fontFamily: GD,
                fontSize: 10,
                color: C.gold,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                lineHeight: 1.7,
                marginBottom: 18,
              }}
            >
              Luxury Wedding
              <br />
              Directory
            </div>
            <p
              style={{
                fontFamily: NU,
                fontSize: 13,
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.85,
                maxWidth: 300,
              }}
            >
              The world's most trusted luxury wedding directory. Est. 2006.
              Connecting discerning couples with exceptional venues and
              professionals across 62 countries.
            </p>

            {/* Social icons */}
            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              {SOCIALS.map(([label, icon]) => (
                <div
                  key={label}
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
                    fontSize: 14,
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
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map(([title, links]) => (
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
              {links.map((l) => (
                <div
                  key={l}
                  role="link"
                  tabIndex={0}
                  onClick={() => { if (l === "List Your Business") onListBusiness?.(); if (l === "Contact") onNavigateContact?.(); if (l === "Pricing Plans") onNavigatePartnership?.(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && l === "List Your Business") onListBusiness?.(); }}
                  style={{
                    fontFamily: NU,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 9,
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                  }
                >
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legal bar */}
        <div
          className="home-footer-legal"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: NU,
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
            }}
          >
            © 2026 LuxuryWeddingDirectory.com · Est. 2006 · All rights reserved
          </span>
          <div className="home-footer-legal-links" style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Cookies", "Sitemap", "Admin"].map((l) => (
              <span
                key={l}
                role="link"
                tabIndex={0}
                onClick={() => { if (l === "Admin") onNavigateAdmin?.(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && l === "Admin") onNavigateAdmin?.(); }}
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
