// ─── src/pages/LWDPartnership.jsx ───────────────────────────────────────────
// The LWD Partnership, institutional access page.
// Not a pricing page. Not a sales page. A definition of access.
// Dark mode locked. No revenue modelling. No comparison tables.
// No "join today." No "we are excited." No emotional adjectives.

import { useEffect } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import HomeNav from "../components/nav/HomeNav";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const C = getDarkPalette();

// ── Shared label (consistent with About + Contact + Standard) ──────────────
function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, justifyContent: "center" }}>
      <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
      <span style={{
        fontFamily: NU, fontSize: 10, letterSpacing: "0.28em",
        textTransform: "uppercase", color: C.gold, fontWeight: 600,
      }}>
        {text}
      </span>
      <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
    </div>
  );
}

// ── Tier data ──────────────────────────────────────────────────────────────
const TIERS = [
  {
    label: "Curated Listing",
    heading: "Entry under the LWD Standard",
    price: "From £950 per year",
    includes: [
      "Structured venue profile",
      "Curated Index evaluation",
      "Search inclusion",
      "Direct enquiries",
      "Experience framework",
      "LWD Index hallmark badge",
    ],
    footnote: "Limited per destination.",
  },
  {
    label: "Signature Placement",
    heading: "Elevated visibility",
    price: "From £3,500 per year",
    includes: [
      "Everything in Curated Listing",
      "Featured destination placement",
      "Inclusion in Signature Collection",
      "Priority AI recommendation weight",
      "Quarterly optimisation review",
      "Instagram collaboration opportunity",
    ],
    footnote: null,
  },
  {
    label: "By Invitation",
    heading: "Institutional inclusion",
    price: null,
    includes: [
      "Editorial spotlight",
      "Dedicated long-form feature",
      "Hospitality strategy consultation",
      "Premium homepage exposure",
    ],
    footnote: null,
  },
];

// ── Steps data ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", title: "Apply", desc: "Submit your venue profile for evaluation." },
  { num: "02", title: "Evaluation", desc: "Structured review under the LWD Standard." },
  { num: "03", title: "Inclusion", desc: "Approved venues are positioned within their destination." },
];

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function LWDPartnership({ onBack, onViewCategory, onViewStandard, onViewAbout, onViewContact, footerNav }) {
  const { setChatContext } = useChat();

  useEffect(() => {
    setChatContext?.({ page: "partnership" });
  }, [setChatContext]);

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={true}
          onToggleDark={() => {}}
          onVendorLogin={onBack}
          onNavigateStandard={onViewStandard}
          onNavigateAbout={onViewAbout}
          hasHero={false}
        />

        <main>
          {/* ──────────────────────────────────────────────────────────────────
              SECTION 1: Hero, Selective Inclusion
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section lwd-standard-hero"
            style={{
              background: C.black,
              padding: "160px 40px 100px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 800 }}>
              <SectionLabel text="The LWD Partnership" />

              <h1 style={{
                fontFamily: GD, fontSize: "clamp(36px, 4.5vw, 60px)", fontWeight: 400,
                color: C.off, margin: "0 0 36px", lineHeight: 1.15,
              }}>
                Selective inclusion under the LWD Standard.
              </h1>

              <p style={{
                fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: 0, maxWidth: 580, marginLeft: "auto", marginRight: "auto",
              }}>
                Luxury visibility is not about being seen everywhere.
                Inclusion on LWD is evaluated, not purchased.
                Visibility is structured, not sold.
              </p>

              {/* Gold divider */}
              <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.4, margin: "48px auto 0" }} />
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 2: Tiers
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div
              className="lwd-partnership-tiers"
              style={{
                maxWidth: 1100, margin: "0 auto",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40,
                alignItems: "start",
              }}
            >
              {TIERS.map((tier, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${C.border}`,
                    padding: "48px 32px",
                    borderRadius: "var(--lwd-radius-card)",
                    background: C.card,
                  }}
                >
                  {/* Tier label */}
                  <span style={{
                    fontFamily: NU, fontSize: 9, letterSpacing: "0.25em",
                    textTransform: "uppercase", color: C.gold, fontWeight: 700,
                    display: "block", marginBottom: 16,
                  }}>
                    {tier.label}
                  </span>

                  {/* Heading */}
                  <h3 style={{
                    fontFamily: GD, fontSize: 22, fontWeight: 400,
                    color: C.off, margin: "0 0 20px", lineHeight: 1.3,
                  }}>
                    {tier.heading}
                  </h3>

                  {/* Price */}
                  {tier.price ? (
                    <p style={{
                      fontFamily: NU, fontSize: 15, color: C.off, lineHeight: 1.6,
                      fontWeight: 500, margin: "0 0 28px",
                    }}>
                      {tier.price}
                    </p>
                  ) : (
                    <p style={{
                      fontFamily: NU, fontSize: 13, fontStyle: "italic",
                      color: C.grey, lineHeight: 1.6,
                      fontWeight: 300, margin: "0 0 28px",
                    }}>
                      Pricing available upon request.
                    </p>
                  )}

                  {/* Divider */}
                  <div style={{
                    width: "100%", height: 1,
                    background: `rgba(201,168,76,0.15)`,
                    margin: "0 0 24px",
                  }} />

                  {/* Includes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {tier.includes.map((item, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <span style={{
                          color: C.gold, fontSize: 6, flexShrink: 0,
                          opacity: 0.7, lineHeight: 1, marginTop: 6,
                        }}>●</span>
                        <span style={{
                          fontFamily: NU, fontSize: 13, color: C.grey,
                          fontWeight: 300, lineHeight: 1.6,
                        }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footnote */}
                  {tier.footnote && (
                    <p style={{
                      fontFamily: NU, fontSize: 11, color: C.grey2,
                      fontWeight: 300, fontStyle: "italic",
                      margin: "24px 0 0", lineHeight: 1.5,
                    }}>
                      {tier.footnote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 3: Integrity Statement
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "80px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <p style={{
                fontFamily: NU, fontSize: 14, fontStyle: "italic",
                color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: 0,
              }}>
                The Curated Index score cannot be purchased. It reflects
                structured profile depth and measurable responsiveness.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 4: How Inclusion Works
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <SectionLabel text="How Inclusion Works" />

            <div
              className="lwd-partnership-steps"
              style={{
                maxWidth: 1000, margin: "48px auto 0",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48,
              }}
            >
              {STEPS.map((step) => (
                <div key={step.num} style={{ textAlign: "center" }}>
                  {/* Number watermark */}
                  <span style={{
                    fontFamily: GD, fontSize: 36, color: C.gold,
                    opacity: 0.2, display: "block", marginBottom: 16,
                    lineHeight: 1,
                  }}>
                    {step.num}
                  </span>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: GD, fontSize: 20, fontWeight: 400,
                    color: C.off, margin: "0 0 12px", lineHeight: 1.3,
                  }}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.75,
                    fontWeight: 300, margin: 0,
                  }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 5: CTA
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.dark,
              padding: "80px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              textAlign: "center",
            }}
          >
            <button
              onClick={onViewContact}
              style={{
                background: C.gold, color: "#0a0906", border: "none",
                borderRadius: "var(--lwd-radius-input)", padding: "14px 36px", cursor: "pointer",
                fontFamily: NU, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Apply for Inclusion
            </button>

            <p style={{
              fontFamily: NU, fontSize: 12, color: C.grey2, lineHeight: 1.6,
              fontWeight: 300, margin: "20px 0 0", textAlign: "center",
            }}>
              All submissions are reviewed personally.
            </p>
          </section>
        </main>

      </div>
    </ThemeCtx.Provider>
  );
}
