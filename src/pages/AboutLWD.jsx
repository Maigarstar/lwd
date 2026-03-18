// ─── src/pages/AboutLWD.jsx ────────────────────────────────────────────────────
// About LWD, institutional positioning page.
// Not a lifestyle page. Not a romantic page. A statement of authority.
// Reinforces: 20+ years, structured standard evolution, founders, vision.
// No vanity metrics. No emotional fluff. No numeric score exposure.
// Dark mode locked. This page speaks in one voice.

import { useEffect } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import HomeNav from "../components/nav/HomeNav";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const C = getDarkPalette();

// ── Shared patterns (consistent with LWDStandard) ──────────────────────────
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

// ── Differentiators data ───────────────────────────────────────────────────
const DIFFERENTIATORS = [
  "Structured data over vague description",
  "Deterministic evaluation over arbitrary ranking",
  "Hallmark recognition over gamified ratings",
  "Direct venue connection over layered intermediaries",
  "Industry experience guiding platform architecture",
];

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function AboutLWD({ onBack, onViewCategory, onViewStandard, onViewContact, onViewPartnership, footerNav }) {
  const { setChatContext } = useChat();

  useEffect(() => {
    setChatContext?.({ page: "about" });
  }, [setChatContext]);

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={true}
          onToggleDark={() => {}}
          onVendorLogin={onBack}
          onNavigateStandard={onViewStandard}
          onNavigateAbout={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />

        <main>
          {/* ──────────────────────────────────────────────────────────────────
              SECTION 1: Hero, Authoritative Opening
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
              <SectionLabel text="About LWD" />

              <h1 style={{
                fontFamily: GD, fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 400,
                color: C.off, margin: "0 0 48px", lineHeight: 1.15,
              }}>
                Built on two decades of luxury wedding expertise.
              </h1>

              <div style={{ maxWidth: 620, margin: "0 auto" }}>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 24px",
                }}>
                  Luxury wedding planning has evolved.
                  <br />
                  Discovery has not.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 18px",
                }}>
                  Over the past twenty years, the luxury wedding industry has
                  transformed. Venues have refined their offerings. Celebrations
                  have become more experiential. Expectations have risen.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 18px",
                }}>
                  Yet the way couples discover venues has largely remained unchanged.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.off, lineHeight: 1.85,
                  fontWeight: 400, margin: "0 0 24px",
                }}>
                  Listings. Paid placement. Fragmented information.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: 0,
                }}>
                  LWD was created to change that.
                </p>
              </div>

              {/* Gold divider */}
              <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.5, margin: "48px auto 0" }} />
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 2: The Foundation
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
              className="about-two-col"
              style={{
                maxWidth: 1100, margin: "0 auto",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80,
                alignItems: "start",
              }}
            >
              {/* Left column */}
              <div>
                <h2 style={{
                  fontFamily: GD, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400,
                  fontStyle: "italic", color: C.gold, margin: "0 0 28px", lineHeight: 1.2,
                }}>
                  The Foundation
                </h2>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 16px",
                }}>
                  LWD was founded by Yasmine and Taiwo under 5 Star Weddings Ltd,
                  a company operating in the luxury wedding industry for over
                  two decades.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 16px",
                }}>
                  Years of working closely with exceptional venues, planners,
                  and hospitality brands across multiple continents revealed
                  a clear insight:
                </p>
                <p style={{
                  fontFamily: GD, fontSize: 18, fontStyle: "italic",
                  color: C.gold, margin: "24px 0 0", lineHeight: 1.5,
                }}>
                  Luxury requires structure.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "24px 0 0",
                }}>
                  A remarkable venue deserves more than visibility.
                  A couple deserves more than marketing.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "16px 0 0",
                }}>
                  LWD represents the next evolution of that experience.
                </p>
              </div>

              {/* Right column, vertical gold accent */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
              }}>
                <div style={{
                  width: 1,
                  height: "60%",
                  minHeight: 200,
                  background: `linear-gradient(to bottom, transparent, ${C.gold}, transparent)`,
                  opacity: 0.3,
                }} />
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 3: From Visibility to Evaluation
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400,
                color: C.off, margin: "0 0 32px", lineHeight: 1.2,
              }}>
                From visibility to evaluation.
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                Traditional platforms prioritise exposure.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 24px",
              }}>
                LWD prioritises evaluation.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                At the core of the platform is the Curated Index, a structured
                framework assessing venues across measurable dimensions of quality,
                experience depth, responsiveness, catering, and completeness.
              </p>

              {/* Gold divider */}
              <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.5, margin: "32px auto" }} />

              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 8px",
              }}>
                This is not about popularity. It is about performance.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: 0,
              }}>
                This is not about sponsorship. It is about standards.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 4: The Founders
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400,
                fontStyle: "italic", color: C.gold, margin: "0 0 28px", lineHeight: 1.2,
              }}>
                The Founders
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                Yasmine and Taiwo bring over twenty years of experience in
                luxury wedding curation, venue partnerships, digital discovery
                strategy, and brand positioning.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 24px",
              }}>
                Their work has spanned continents and cultures, shaping how
                exceptional venues connect with discerning couples.
              </p>

              {/* Gold divider */}
              <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.5, margin: "32px auto 32px 0" }} />

              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 8px",
              }}>
                LWD reflects a deliberate progression.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.off, lineHeight: 1.85,
                fontWeight: 400, margin: 0,
              }}>
                Not simply a platform to showcase venues, but a system designed
                to elevate how luxury weddings are discovered.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 5: What Makes LWD Different
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400,
                color: C.off, margin: "0 0 40px", lineHeight: 1.2,
                textAlign: "center",
              }}>
                What makes LWD different
              </h2>

              {DIFFERENTIATORS.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "20px 0",
                    borderBottom: i < DIFFERENTIATORS.length - 1
                      ? `1px solid ${C.border}`
                      : "none",
                  }}
                >
                  <span style={{
                    color: C.gold, fontSize: 8, flexShrink: 0,
                    opacity: 0.7, lineHeight: 1,
                  }}>●</span>
                  <span style={{
                    fontFamily: NU, fontSize: 15, color: C.off,
                    fontWeight: 400, lineHeight: 1.6,
                  }}>
                    {item}
                  </span>
                </div>
              ))}

              <p style={{
                fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "32px 0 0", textAlign: "center",
              }}>
                These principles shape how the platform operates.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 6: The Vision
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.dark,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400,
                fontStyle: "italic", color: C.gold, margin: "0 0 32px", lineHeight: 1.2,
              }}>
                The Vision
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                Luxury hospitality continues to evolve.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                Standards will matter more than sponsorship.
                Structure will matter more than noise.
                Performance will matter more than visibility alone.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.off, lineHeight: 1.85,
                fontWeight: 400, margin: "0 0 40px",
              }}>
                LWD exists to define that standard.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "0 0 48px",
              }}>
                A measurable, evolving framework for luxury wedding discovery.
              </p>

              {/* Closing line */}
              <p style={{
                fontFamily: GD, fontSize: "clamp(18px, 2vw, 22px)", fontStyle: "italic",
                color: C.gold, margin: 0, lineHeight: 1.4,
              }}>
                A standard built on experience. Designed for the future.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 7: Single CTA
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
            <div
              className="lwd-standard-ctas"
              style={{ display: "flex", gap: 16, justifyContent: "center" }}
            >
              {/* Primary, Discover Venues */}
              <button
                onClick={onViewCategory}
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
                Discover Venues
              </button>

              {/* Secondary, The LWD Standard */}
              <button
                onClick={onViewStandard}
                style={{
                  background: "transparent", color: C.gold,
                  border: `1px solid ${C.gold}`, borderRadius: "var(--lwd-radius-input)",
                  padding: "14px 36px", cursor: "pointer",
                  fontFamily: NU, fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.gold;
                  e.currentTarget.style.color = "#0a0906";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.gold;
                }}
              >
                The LWD Standard
              </button>
            </div>
          </section>
        </main>

      </div>
    </ThemeCtx.Provider>
  );
}
