// ─── src/pages/LWDStandard.jsx ────────────────────────────────────────────────
// "The LWD Standard", strategic positioning page.
// Not a help page. A statement of authority.
// Two audiences: couples see trust, venues see opportunity.
// No numeric scores displayed publicly.

import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useChat } from "../chat/ChatContext";

import HomeNav from "../components/nav/HomeNav";
import Icon from "../chat/Icons";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Data constants ───────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", title: "Discover", body: "Search by destination, style, or guest experience. Or ask Aura, our intelligent discovery assistant, to guide you." },
  { num: "02", title: "Compare", body: "Each venue is evaluated across five measurable pillars. You are not comparing adjectives. You are comparing substance." },
  { num: "03", title: "Shortlist", body: "Save the venues that resonate. Refine by airport proximity, experiences, catering, or estate exclusivity." },
  { num: "04", title: "Enquire", body: "Contact venues directly. No hidden booking layers. No inflated pricing. Transparent connection." },
];

const PILLARS = [
  { icon: "camera",      title: "Presentation Quality",   body: "Depth of media, clarity of information, and narrative strength." },
  { icon: "star",        title: "Guest Experience Depth",  body: "The variety and richness of experiences offered, from vineyard tastings to private boat charters." },
  { icon: "clock",       title: "Response Performance",    body: "How consistently and quickly a venue replies to enquiries." },
  { icon: "sparkle",     title: "Catering Quality",        body: "Dining flexibility, sommelier services, dietary accommodation, and structured culinary detail." },
  { icon: "checkCircle", title: "Profile Completeness",    body: "A fully transparent, detailed venue profile." },
];

const IMPROVEMENTS = [
  "Expand structured guest experiences",
  "Maintain rapid, consistent response times",
  "Complete catering and dining profiles",
  "Upload high-quality imagery and media",
  "Provide full access and proximity details",
];

// ── Shared section header pattern ────────────────────────────────────────────
function SectionLabel({ text, C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
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

function SectionHeading({ children, C }) {
  return (
    <h2 style={{
      fontFamily: GD, fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 400,
      color: C.off || C.white, margin: 0, lineHeight: 1.2,
    }}>
      {children}
    </h2>
  );
}

function Gold({ children }) {
  return <span style={{ fontStyle: "italic", color: "#C9A84C" }}>{children}</span>;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function LWDStandard({ onBack, onViewCategory, onViewAbout, onViewContact, onViewPartnership, footerNav }) {
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const C = themeCtx;
  const { setChatContext } = useChat();

  useEffect(() => {
    setChatContext?.({ page: "standard" });
  }, [setChatContext]);

  return (
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={darkMode}
          onToggleDark={themeCtx.toggleDark}
          onVendorLogin={onBack}
          onNavigateStandard={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onNavigateAbout={onViewAbout}
          hasHero={false}
        />

        <main>
          {/* ──────────────────────────────────────────────────────────────────
              SECTION 1: Hero, The LWD Standard
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
              <SectionLabel text="The LWD Standard" C={C} />

              <h1 style={{
                fontFamily: GD, fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 400,
                color: C.off || C.white, margin: "0 0 48px", lineHeight: 1.15,
              }}>
                Luxury wedding discovery,{" "}
                <br />
                powered by structure, not <Gold>sponsorship</Gold>.
              </h1>

              <div style={{ maxWidth: 620, margin: "0 auto" }}>
                <p style={{
                  fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 18px",
                }}>
                  Luxury wedding venues deserve more than a directory.
                  Couples deserve more than paid placements.
                </p>
                <p style={{
                  fontFamily: GD, fontSize: 18, color: C.off || C.white, lineHeight: 1.6,
                  fontStyle: "italic", margin: "0 0 24px",
                }}>
                  LWD was built differently.
                </p>

                <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.5, margin: "32px auto" }} />

                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: 0,
                }}>
                  Every venue on our platform is presented through a structured evaluation
                  system we call the{" "}
                  <span style={{ color: C.gold, fontWeight: 600 }}>Curated Index</span>.
                  It ensures that discovery is guided by quality, depth, and reliability, not noise.
                </p>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 2: For Couples, 4 Steps
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <SectionLabel text="For Couples" C={C} />
                <SectionHeading C={C}>
                  Discover with <Gold>clarity</Gold>
                </SectionHeading>
                <p style={{
                  fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.8,
                  maxWidth: 520, margin: "16px auto 0", fontWeight: 300,
                }}>
                  Search, compare, save, and enquire, guided by substance, not sponsorship.
                </p>
              </div>

              <div
                className="lwd-standard-steps"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 1,
                  background: C.border,
                  borderRadius: "var(--lwd-radius-card)",
                  overflow: "hidden",
                }}
              >
                {STEPS.map((s) => (
                  <div
                    key={s.num}
                    style={{
                      background: C.card,
                      padding: "44px 28px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{
                      fontFamily: GD, fontSize: 36, color: C.gold, opacity: 0.25,
                      fontWeight: 400, marginBottom: 16, lineHeight: 1,
                    }}>
                      {s.num}
                    </div>
                    <div style={{
                      fontFamily: GD, fontSize: 16, color: C.off || C.white,
                      marginBottom: 10, fontWeight: 400,
                    }}>
                      {s.title}
                    </div>
                    <div style={{
                      fontFamily: NU, fontSize: 13, color: C.grey,
                      lineHeight: 1.7, fontWeight: 300,
                    }}>
                      {s.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 3: The Curated Index, 5 Pillars
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "100px 60px",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <SectionLabel text="The Curated Index" C={C} />
                <SectionHeading C={C}>
                  Five pillars of <Gold>quality</Gold>
                </SectionHeading>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.8,
                  maxWidth: 640, margin: "16px auto 0", fontWeight: 300,
                }}>
                  Rather than ranking venues by sponsorship or editorial bias,
                  we evaluate them across five structured dimensions.
                </p>
              </div>

              <div
                className="lwd-standard-pillars"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 1,
                  background: C.border,
                  borderRadius: "var(--lwd-radius-card)",
                  overflow: "hidden",
                }}
              >
                {PILLARS.map((p) => (
                  <div
                    key={p.title}
                    style={{
                      background: C.black,
                      padding: "40px 24px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div style={{
                      width: 48, height: 48,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(201,168,76,0.06)",
                      border: "1px solid rgba(201,168,76,0.18)",
                      borderRadius: "var(--lwd-radius-card)", marginBottom: 18,
                    }}>
                      <Icon name={p.icon} size={20} color={C.gold} />
                    </div>
                    <div style={{
                      fontFamily: GD, fontSize: 14, color: C.off || C.white,
                      marginBottom: 10, fontWeight: 400, lineHeight: 1.3,
                    }}>
                      {p.title}
                    </div>
                    <div style={{
                      fontFamily: NU, fontSize: 12, color: C.grey,
                      lineHeight: 1.7, fontWeight: 300,
                    }}>
                      {p.body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Fairness statement */}
              <p style={{
                fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85,
                fontStyle: "italic", textAlign: "center",
                maxWidth: 640, margin: "40px auto 0", fontWeight: 300,
              }}>
                Missing information does not penalise a venue.
                If a dimension lacks sufficient data, it is excluded from the score
                rather than counted as a weakness.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 4: For Venues & Vendors
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div
              className="lwd-standard-vendors"
              style={{
                maxWidth: 1100, margin: "0 auto",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80,
                alignItems: "start",
              }}
            >
              {/* Left column */}
              <div>
                <SectionLabel text="For Venues & Vendors" C={C} />
                <SectionHeading C={C}>
                  A roadmap, not a <Gold>ranking</Gold>
                </SectionHeading>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "20px 0 0",
                }}>
                  Luxury is not only about location. It is about execution.
                  The LWD Standard provides a clear roadmap to improve visibility
                  and authority on the platform.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "16px 0 0",
                }}>
                  As profiles become more complete and responsive,
                  their position strengthens organically.
                </p>
                <p style={{
                  fontFamily: GD, fontSize: 18, fontStyle: "italic",
                  color: C.gold, margin: "32px 0 0", lineHeight: 1.5,
                }}>
                  This is not about paying to appear higher.
                  <br />
                  It is about performing higher.
                </p>
              </div>

              {/* Right column, improvement checklist */}
              <div style={{ paddingTop: 48 }}>
                {IMPROVEMENTS.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "18px 0",
                      borderBottom: i < IMPROVEMENTS.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    }}
                  >
                    <span style={{
                      color: C.gold, fontSize: 12, flexShrink: 0,
                      opacity: 0.7,
                    }}>✦</span>
                    <span style={{
                      fontFamily: NU, fontSize: 14, color: C.off || C.white,
                      fontWeight: 400, lineHeight: 1.5,
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 5: Why It Matters
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "100px 60px",
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <SectionLabel text="Philosophy" C={C} />
              <SectionHeading C={C}>
                Why it <Gold>matters</Gold>
              </SectionHeading>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "24px 0 0",
              }}>
                Luxury wedding planning is emotional.
                But discovery should be intelligent.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: "16px 0 0",
              }}>
                By separating presentation from evaluation, and aesthetics from
                measurable quality, LWD becomes more than a directory.
              </p>
              <p style={{
                fontFamily: GD, fontSize: 22, fontStyle: "italic",
                color: C.gold, margin: "40px 0 0", lineHeight: 1.4,
              }}>
                It becomes infrastructure.
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 6: Dual CTAs
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.dark || C.black,
              padding: "80px 60px",
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <p style={{
                fontFamily: GD, fontSize: 16, fontStyle: "italic",
                color: C.grey, margin: "0 0 36px",
              }}>
                Two paths. One standard.
              </p>

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

                {/* Secondary, List Your Venue */}
                <button
                  onClick={onBack}
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
                  List Your Venue
                </button>
              </div>
            </div>
          </section>
        </main>

      </div>
  );
}
