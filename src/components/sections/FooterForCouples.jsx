// ─── src/components/sections/FooterForCouples.jsx ──────────────────────────────────
// Couples-focused footer — appears on GettingMarriedDashboard and couple-oriented pages
// Emphasizes planning tools, vendor discovery, and wedding journey features
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Navigation columns (couples-focused) ──────────────────────────────────────
const NAV_COLS = [
  {
    title: "Plan Your Wedding",
    links: [
      { text: "Browse Venues", action: "onViewCategory" },
      { text: "Find Photographers" },
      { text: "Florists & Decorators" },
      { text: "Music & DJs" },
      { text: "Wedding Planners" },
      { text: "Catering Services" },
      { text: "Planning Checklist" },
      { text: "Budget Calculator" },
    ],
  },
  {
    title: "Get Inspired",
    links: [
      { text: "Real Weddings" },
      { text: "Style Guide" },
      { text: "Vendor Tips" },
      { text: "Wedding Blog" },
      { text: "Trends & Ideas" },
      { text: "Couple Stories" },
    ],
  },
  {
    title: "Your Account",
    links: [
      { text: "My Shortlist" },
      { text: "My Enquiries" },
      { text: "Account Settings" },
      { text: "Saved Searches" },
      { text: "Help & Support" },
    ],
  },
];

// ── Social icons ────────────────────────────────────────────────────────────
const SOCIALS = [
  { label: "Instagram", code: "IG" },
  { label: "Pinterest", code: "PT" },
  { label: "TikTok", code: "TK" },
  { label: "Facebook", code: "FB" },
];

const WA_URL =
  "https://wa.me/447960497211?text=Hello%20Luxury%20Wedding%20Directory%2C%20I%20would%20like%20to%20plan%20my%20wedding";

// ── Component ────────────────────────────────────────────────────────────────
export default function FooterForCouples({ onViewCategory = () => {} }) {
  const C = useTheme();

  const actions = { onViewCategory };

  return (
    <footer
      className="footer-couples"
      aria-label="Couples footer"
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "#0a0a08",
        color: "rgba(255,255,255,0.7)",
        borderTop: "1px solid rgba(201,168,76,0.12)",
        padding: "60px 60px 36px",
        marginTop: 0,
      }}
    >
      {/* ── Accent divider ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.gold}, rgba(116,129,114,0.6), transparent)`,
          marginBottom: 48,
        }}
      />

      {/* ── Main Footer Grid ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          className="footer-couples-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 48,
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
              Your Wedding
              <br />
              Journey Starts Here
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
              Trusted by Couples Worldwide
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
              Discover, save, and connect with the world's finest luxury wedding
              venues and professionals. Plan your dream wedding with confidence.
            </p>

            {/* Quick stats */}
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 8,
                }}
              >
                Why Couples Love Us
              </div>
              <ul
                style={{
                  fontFamily: NU,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.8,
                  margin: 0,
                  paddingLeft: 0,
                  listStyle: "none",
                }}
              >
                <li>✦ Curated luxury venues</li>
                <li>✦ Save & compare shortlists</li>
                <li>✦ Direct vendor messaging</li>
                <li>✦ Real wedding inspiration</li>
              </ul>
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

              {/* WhatsApp */}
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
                  fontSize: 16,
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
                💬
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
          className="footer-couples-legal"
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
              © 2026 LuxuryWeddingDirectory.com · All rights reserved
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                marginTop: 4,
              }}
            >
              Helping couples plan their dream weddings worldwide.
            </div>
          </div>

          <div
            className="footer-couples-legal-links"
            style={{ display: "flex", gap: 20 }}
          >
            {["Privacy", "Terms", "Cookies", "Help"].map((l) => (
              <span
                key={l}
                role="link"
                tabIndex={0}
                onClick={() => {
                  if (l === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
                }}
                onKeyDown={(e) => {
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
