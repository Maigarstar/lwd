// ─── src/pages/TaigenicPage.jsx ───────────────────────────────────────────────
// Taigenic.ai — dedicated in-platform landing page.
// Purpose: credible destination for "Powered by Taigenic.ai" clicks.
// Audience: B2B — platforms, hospitality groups, investors, press.
// Design: darker and more tech-forward than standard LWD editorial pages,
//         but still luxury, refined, and brand-aligned.
// Phase 1: hardcoded, controlled layout. CMS layer added later if needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import HomeNav from "../components/nav/HomeNav";
import SiteFooter from "../components/sections/SiteFooter";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const C  = getDarkPalette();

// ── Palette overrides — tighter/darker than standard LWD dark ─────────────────
const BG      = "#060504";          // deeper black for hero
const PANEL   = "#0d0c0a";          // dark panel sections
const CARD_BG = "rgba(255,255,255,0.03)";
const BORDER  = "rgba(255,255,255,0.06)";
const BORDER_GOLD = "rgba(201,168,76,0.2)";
const GOLD    = "#c9a84c";
const OFF     = "#f2ede5";
const GREY    = "rgba(242,237,229,0.55)";
const MUTED   = "rgba(242,237,229,0.3)";

// ── Shared label ──────────────────────────────────────────────────────────────
function Label({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, justifyContent: "center" }}>
      <div style={{ width: 24, height: 1, background: BORDER_GOLD }} />
      <span style={{
        fontFamily: NU, fontSize: 9, letterSpacing: "0.32em",
        textTransform: "uppercase", color: GOLD, fontWeight: 600,
      }}>
        {text}
      </span>
      <div style={{ width: 24, height: 1, background: BORDER_GOLD }} />
    </div>
  );
}

// ── Gold divider ──────────────────────────────────────────────────────────────
function Divider({ margin = "40px auto" }) {
  return <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.35, margin }} />;
}

// ── Capability card ───────────────────────────────────────────────────────────
function CapCard({ icon, title, body }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(201,168,76,0.04)" : CARD_BG,
        border: `1px solid ${hovered ? BORDER_GOLD : BORDER}`,
        borderRadius: 4,
        padding: "36px 32px",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ fontSize: 22, color: GOLD, marginBottom: 18, opacity: 0.85 }}>{icon}</div>
      <h3 style={{
        fontFamily: GD, fontSize: 17, fontWeight: 400, color: OFF,
        margin: "0 0 14px", lineHeight: 1.3,
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: NU, fontSize: 13, color: GREY,
        lineHeight: 1.8, margin: 0, fontWeight: 300,
      }}>
        {body}
      </p>
    </div>
  );
}

// ── Stat block (designed for live data later) ─────────────────────────────────
function Stat({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: GD, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 400,
        color: GOLD, lineHeight: 1, marginBottom: 10,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: NU, fontSize: 11, color: MUTED,
        letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Tech pillar row ───────────────────────────────────────────────────────────
function Pillar({ number, title, desc }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "48px 1fr",
      gap: "0 20px", alignItems: "start",
      padding: "24px 0",
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{
        fontFamily: GD, fontSize: 13, color: GOLD, opacity: 0.5,
        paddingTop: 3, fontStyle: "italic",
      }}>
        {String(number).padStart(2, "0")}
      </div>
      <div>
        <div style={{
          fontFamily: GD, fontSize: 16, color: OFF, marginBottom: 8,
          fontWeight: 400, lineHeight: 1.3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: NU, fontSize: 13, color: GREY,
          lineHeight: 1.75, fontWeight: 300,
        }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TaigenicPage({ onBack, footerNav }) {
  const { setChatContext } = useChat();

  useEffect(() => {
    setChatContext?.({ page: "taigenic" });
  }, [setChatContext]);

  function handleEnquiry(type) {
    const subject = encodeURIComponent(`Taigenic Partnership — ${type}`);
    window.open(`mailto:contact@5starweddingdirectory.com?subject=${subject}`, "_blank");
  }

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: BG, minHeight: "100vh" }}>
        <HomeNav
          darkMode={true}
          onToggleDark={() => {}}
          onVendorLogin={onBack}
          hasHero={false}
        />

        <main>

          {/* ────────────────────────────────────────────────────────────────────
              SECTION 1 — Hero
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: BG,
            // Subtle tech grid overlay
            backgroundImage: [
              "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "60px 60px",
            padding: "160px 40px 120px",
            textAlign: "center",
            borderBottom: `1px solid ${BORDER_GOLD}`,
          }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <Label text="Taigenic.ai" />

              {/* ✦ icon */}
              <div style={{
                fontSize: 20, color: GOLD, marginBottom: 28,
                letterSpacing: 12, opacity: 0.7,
              }}>
                ✦
              </div>

              <h1 style={{
                fontFamily: GD,
                fontSize: "clamp(36px, 4.5vw, 66px)",
                fontWeight: 400,
                color: OFF,
                margin: "0 0 32px",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}>
                The AI layer for luxury hospitality.
              </h1>

              <p style={{
                fontFamily: NU, fontSize: 16, color: GREY,
                lineHeight: 1.85, fontWeight: 300,
                maxWidth: 560, margin: "0 auto 20px",
              }}>
                Taigenic powers intelligent discovery, lead routing, and
                personalised guidance across the Luxury Wedding Directory platform.
              </p>

              <p style={{
                fontFamily: NU, fontSize: 14, color: MUTED,
                lineHeight: 1.75, fontWeight: 300,
                maxWidth: 480, margin: "0 auto",
              }}>
                Built for hospitality. Designed for high-intent audiences.
                Available to licence.
              </p>

              <Divider margin="52px auto 0" />
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────
              SECTION 2 — What Taigenic Does
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: PANEL,
            padding: "100px 60px",
            borderBottom: `1px solid ${BORDER_GOLD}`,
          }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <Label text="Capabilities" />
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(26px, 2.8vw, 40px)", fontWeight: 400,
                color: OFF, textAlign: "center", margin: "0 0 56px", lineHeight: 1.2,
              }}>
                Three layers of intelligence.
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20,
              }}>
                <CapCard
                  icon="◈"
                  title="Conversational Discovery"
                  body="Aura helps users navigate venues, suppliers, and options through natural language. No filters. No forms. Intelligent, contextual guidance that responds to intent, style, and budget — in the moment."
                />
                <CapCard
                  icon="⟡"
                  title="Lead Intelligence"
                  body="Taigenic scores, routes, and surfaces leads based on signal quality, not volume. Every enquiry is assessed for intent, enriched with context, and routed to the right destination — in real time."
                />
                <CapCard
                  icon="◇"
                  title="Platform Matching"
                  body="Connecting users with the right venues and vendors based on intent, style, capacity, and context. Not keyword matching. Semantic understanding of what a couple or client actually needs."
                />
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────
              SECTION 3 — Proof (stat slots — live data ready)
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: BG,
            padding: "100px 60px",
            borderBottom: `1px solid ${BORDER_GOLD}`,
            textAlign: "center",
          }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Label text="Powering LWD" />
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(26px, 2.8vw, 40px)", fontWeight: 400,
                color: OFF, margin: "0 0 16px", lineHeight: 1.2,
              }}>
                Already live. Already working.
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 14, color: GREY,
                lineHeight: 1.75, fontWeight: 300,
                maxWidth: 500, margin: "0 auto 72px",
              }}>
                Taigenic is not a prototype. It is the active intelligence layer
                behind every Aura interaction and every lead on Luxury Wedding Directory.
              </p>

              {/* Stat grid — replace values with live metrics when ready */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "48px 32px",
                padding: "56px 48px",
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
              }}>
                <Stat value="500+" label="Luxury venues" />
                <Stat value="12k+"  label="Aura conversations" />
                <Stat value="3.4k+" label="Leads routed" />
                <Stat value="98%"   label="Lead delivery rate" />
              </div>

              <p style={{
                fontFamily: NU, fontSize: 11, color: MUTED,
                marginTop: 16, letterSpacing: "0.05em",
              }}>
                Metrics updated quarterly. Last reviewed Q1 2026.
              </p>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────
              SECTION 4 — The Technology
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: PANEL,
            padding: "100px 60px",
            borderBottom: `1px solid ${BORDER_GOLD}`,
          }}>
            <div style={{
              maxWidth: 1000, margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 100px",
              alignItems: "start",
            }}
            className="taigenic-tech-grid"
            >
              {/* Left — positioning */}
              <div>
                <Label text="The Technology" />
                <h2 style={{
                  fontFamily: GD, fontSize: "clamp(26px, 2.8vw, 40px)", fontWeight: 400,
                  color: OFF, margin: "0 0 24px", lineHeight: 1.2,
                }}>
                  Sophisticated.
                  <br />
                  <span style={{ color: GOLD, fontStyle: "italic" }}>Not complicated.</span>
                </h2>
                <p style={{
                  fontFamily: NU, fontSize: 14, color: GREY,
                  lineHeight: 1.85, fontWeight: 300, margin: "0 0 16px",
                }}>
                  Taigenic is built on a layered architecture that separates
                  understanding from delivery — so every interaction feels
                  natural, and every lead arrives qualified.
                </p>
                <p style={{
                  fontFamily: NU, fontSize: 14, color: GREY,
                  lineHeight: 1.85, fontWeight: 300, margin: 0,
                }}>
                  The system integrates with your existing platform, data, and
                  workflows without requiring structural change.
                </p>
              </div>

              {/* Right — pillars */}
              <div>
                <Pillar
                  number={1}
                  title="Conversational AI"
                  desc="Large language model layer trained on hospitality context. Handles intent recognition, disambiguation, and structured output generation."
                />
                <Pillar
                  number={2}
                  title="Lead Routing Engine"
                  desc="Scores enquiries by intent signal and qualification weight. Routes in real time to partner, internal, or hybrid destinations."
                />
                <Pillar
                  number={3}
                  title="Knowledge Graph"
                  desc="Structured data layer connecting venues, vendors, availability, pricing, and content. Enables precision matching rather than keyword search."
                />
                <Pillar
                  number={4}
                  title="Platform Intelligence"
                  desc="Behavioural analytics layer that tracks session signals, shortlist patterns, and engagement depth to surface higher-intent users."
                />
                <div style={{ height: 1, background: BORDER, marginTop: 0 }} />
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────
              SECTION 5 — Licensing / Partnership CTA
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: BG,
            padding: "120px 60px",
            textAlign: "center",
            // Subtle gold radial glow at centre
            backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,168,76,0.05) 0%, transparent 70%)",
          }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <Label text="Licence & Partnership" />

              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 48px)", fontWeight: 400,
                color: OFF, margin: "0 0 24px", lineHeight: 1.15,
              }}>
                Bring Aura to your platform.
              </h2>

              <p style={{
                fontFamily: NU, fontSize: 15, color: GREY,
                lineHeight: 1.85, fontWeight: 300,
                maxWidth: 520, margin: "0 auto 16px",
              }}>
                Taigenic is available to licence for premium hospitality platforms,
                wedding directories, event businesses, and luxury brands.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 14, color: MUTED,
                lineHeight: 1.75, fontWeight: 300,
                maxWidth: 460, margin: "0 auto 56px",
              }}>
                Integration is handled by our team. Go live in weeks, not months.
              </p>

              {/* Three CTA options */}
              <div style={{
                display: "flex", gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
                {/* Primary */}
                <button
                  onClick={() => handleEnquiry("Licence Enquiry")}
                  style={{
                    background: GOLD, color: "#0a0805",
                    border: "none", borderRadius: 3,
                    padding: "14px 32px", cursor: "pointer",
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Licence Aura
                </button>

                {/* Secondary */}
                <button
                  onClick={() => handleEnquiry("Partnership")}
                  style={{
                    background: "transparent", color: GOLD,
                    border: `1px solid ${BORDER_GOLD}`,
                    borderRadius: 3,
                    padding: "14px 32px", cursor: "pointer",
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                    e.currentTarget.style.borderColor = GOLD;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = BORDER_GOLD;
                  }}
                >
                  Partner with us
                </button>

                {/* Tertiary */}
                <button
                  onClick={() => handleEnquiry("Demo Request")}
                  style={{
                    background: "transparent", color: MUTED,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 3,
                    padding: "14px 32px", cursor: "pointer",
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = OFF;
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = MUTED;
                    e.currentTarget.style.borderColor = BORDER;
                  }}
                >
                  Request a demo
                </button>
              </div>

              <Divider margin="60px auto 0" />

              {/* Small print */}
              <p style={{
                fontFamily: NU, fontSize: 11, color: MUTED,
                margin: "20px 0 0", lineHeight: 1.6,
              }}>
                Enquiries are handled directly by the Taigenic team.
                Response within 2 business days.
              </p>
            </div>
          </section>

        </main>

        {/* Standard LWD footer — keeps the experience connected to the platform */}
        <SiteFooter {...footerNav} />

      </div>

      {/* Responsive: collapse tech grid to single column on narrow screens */}
      <style>{`
        @media (max-width: 768px) {
          .taigenic-tech-grid {
            grid-template-columns: 1fr !important;
            gap: 60px 0 !important;
          }
        }
      `}</style>

    </ThemeCtx.Provider>
  );
}
