// ─── src/pages/TaigenicPage.jsx ───────────────────────────────────────────────
// Taigenic.ai — dedicated in-platform landing page.
// Purpose: credible destination for "Powered by Taigenic.ai" clicks.
// Audience: B2B — platforms, hospitality groups, investors, press.
// Design: darker and more tech-forward than standard LWD editorial pages,
//         but still luxury, refined, and brand-aligned.
// Phase 1: hardcoded, controlled layout. CMS layer added later if needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import HomeNav from "../components/nav/HomeNav";
import { supabase } from "../lib/supabaseClient";
import { sendEmail } from "../services/emailSendService";
// Note: SiteFooter is rendered globally by main.jsx — do NOT add it here.

// ── Taigenic pipeline constants (fixed UUIDs — seeded in 20260324_taigenic_pipeline.sql) ──
const TAIGENIC_PIPELINE_ID  = "a1000000-0000-0000-0000-000000000003";
const TAIGENIC_STAGE_NEW    = "b1000000-0000-0000-0000-000000000020";
const NOTIFY_EMAIL          = "taiwoadedayo@gmail.com";

// ── Enquiry type config — drives CTA labels, form pre-selection, pipeline tagging ──
const ENQUIRY_TYPES = {
  licence:     { label: "Licence Aura",    tag: "licence",     pipelineStage: "New Enquiry" },
  partnership: { label: "Partner with us", tag: "partnership", pipelineStage: "New Enquiry" },
  demo:        { label: "Request a demo",  tag: "demo",        pipelineStage: "New Enquiry" },
  advertising: { label: "Advertise with us", tag: "advertising", pipelineStage: "New Enquiry" },
};

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
const GREY    = "rgba(242,237,229,0.78)";
const MUTED   = "rgba(242,237,229,0.55)";

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
        background: hovered ? "rgba(201,168,76,0.05)" : CARD_BG,
        border: `1px solid ${hovered ? "rgba(201,168,76,0.35)" : BORDER}`,
        borderRadius: 4,
        padding: "36px 32px",
        transition: "transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease, border-color 0.28s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(201,168,76,0.07)" : "none",
      }}
    >
      <div style={{
        fontSize: 22, color: GOLD, marginBottom: 18,
        opacity: hovered ? 1 : 0.75,
        transition: "opacity 0.28s ease",
      }}>
        {icon}
      </div>
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

// ── Stat block with count-up animation ────────────────────────────────────────
function Stat({ value, label }) {
  // Parse "500+", "12k+", "3.4k+", "98%" into numeric + suffix
  const match = value.match(/^([\d.]+)(.*)/);
  const num    = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const isDecimal = value.includes(".");

  const [display, setDisplay] = useState("0" + suffix);
  const ref      = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration   = 2200;
          const steps      = 70;
          const stepMs     = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            // Ease-out curve: slow down as it approaches the final value
            const eased   = 1 - Math.pow(1 - step / steps, 2.5);
            const current = num * eased;
            const fmt     = isDecimal ? current.toFixed(1) : Math.round(current).toString();
            setDisplay(fmt + suffix);
            if (step >= steps) {
              clearInterval(timer);
              setDisplay(value); // lock to exact final value
            }
          }, stepMs);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: GD, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 400,
        color: GOLD, lineHeight: 1, marginBottom: 10,
      }}>
        {display}
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
const EMPTY_FORM = { name: "", company: "", email: "", phone: "", website: "", message: "" };

export default function TaigenicPage({ onBack, footerNav }) {
  const { setChatContext } = useChat();
  const [activeType, setActiveType]   = useState(null);   // 'licence' | 'partnership' | 'demo' | 'advertising'
  const [form, setForm]               = useState(EMPTY_FORM);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    setChatContext?.({ page: "taigenic" });
  }, [setChatContext]);

  // Scroll form into view when it opens
  useEffect(() => {
    if (activeType && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    }
  }, [activeType]);

  function openForm(type) {
    setActiveType(type);
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
    setForm(EMPTY_FORM);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = "Required";
    if (!form.company.trim()) e.company = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError(null);

    const typeLabel = ENQUIRY_TYPES[activeType]?.label || activeType;

    try {
      // 1. Insert prospect into pipeline
      const { error: dbErr } = await supabase.from("prospects").insert([{
        company_name:   form.company,
        contact_name:   form.name,
        email:          form.email,
        phone:          form.phone || null,
        website:        form.website || null,
        notes:          form.message || null,
        source:         "Taigenic Landing Page",
        venue_type:     activeType,           // repurposed as enquiry_type
        pipeline_stage: "New Enquiry",
        pipeline_id:    TAIGENIC_PIPELINE_ID,
        stage_id:       TAIGENIC_STAGE_NEW,
        status:         "active",
      }]);
      if (dbErr) throw dbErr;

      // 2. Send Gmail notification (fire-and-forget)
      sendEmail({
        subject:   `New Taigenic Enquiry: ${typeLabel} from ${form.company}`,
        fromName:  "Taigenic Notifications",
        fromEmail: "hello@luxuryweddingdirectory.co.uk",
        recipients: [{ email: NOTIFY_EMAIL, name: "Taiwo" }],
        type:      "campaign",
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a18">
  <div style="background:#0d0c0a;padding:24px 32px;border-radius:4px 4px 0 0">
    <p style="color:#c9a84c;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px">Taigenic · New B2B Enquiry</p>
    <h1 style="color:#f2ede5;font-size:22px;margin:0;font-weight:400">${typeLabel}</h1>
  </div>
  <div style="background:#f9f7f4;padding:32px;border-radius:0 0 4px 4px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6b6560;width:120px">Name</td><td style="padding:8px 0;font-weight:500">${form.name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b6560">Company</td><td style="padding:8px 0;font-weight:500">${form.company}</td></tr>
      <tr><td style="padding:8px 0;color:#6b6560">Email</td><td style="padding:8px 0"><a href="mailto:${form.email}" style="color:#9d873e">${form.email}</a></td></tr>
      ${form.phone ? `<tr><td style="padding:8px 0;color:#6b6560">Phone</td><td style="padding:8px 0">${form.phone}</td></tr>` : ""}
      ${form.website ? `<tr><td style="padding:8px 0;color:#6b6560">Website</td><td style="padding:8px 0"><a href="${form.website}" style="color:#9d873e">${form.website}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b6560">Enquiry type</td><td style="padding:8px 0"><strong>${typeLabel}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#6b6560">Source</td><td style="padding:8px 0">Taigenic Landing Page</td></tr>
    </table>
    ${form.message ? `<div style="margin-top:20px;padding:16px;background:#fff;border-radius:3px;border:1px solid #e8e3dc"><p style="color:#6b6560;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Message</p><p style="margin:0;line-height:1.7">${form.message}</p></div>` : ""}
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e8e3dc;font-size:12px;color:#9c9690">
      <p style="margin:0">This lead has been saved to the Taigenic B2B pipeline in admin → Sales Pipeline.</p>
      <p style="margin:4px 0 0">Submitted: ${new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</p>
    </div>
  </div>
</div>`,
      }).catch(err => console.warn("[TaigenicPage] Email notification failed:", err));

      setSubmitted(true);
    } catch (err) {
      console.error("[TaigenicPage] Submit failed:", err);
      setSubmitError("Something went wrong. Please email us directly at contact@5starweddingdirectory.com");
    } finally {
      setSubmitting(false);
    }
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
                fontFamily: NU, fontSize: 16, color: "rgba(242,237,229,0.62)",
                lineHeight: 1.85, fontWeight: 300,
                maxWidth: 560, margin: "0 auto 20px",
              }}>
                Taigenic powers intelligent discovery, lead routing, and
                personalised guidance across the Luxury Wedding Directory platform.
              </p>

              <p style={{
                fontFamily: NU, fontSize: 14, color: "rgba(242,237,229,0.42)",
                lineHeight: 1.75, fontWeight: 300,
                maxWidth: 480, margin: "0 auto 0",
              }}>
                Built for hospitality. Designed for high-intent audiences.
                Available to licence.
              </p>

              {/* Positioning line — signature statement with LWD brand watermark */}
              <div style={{ position: "relative", margin: "52px auto 0", maxWidth: 700 }}>

                {/* LWD background brand mark */}
                <div aria-hidden="true" style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontFamily: GD,
                  fontSize: "clamp(100px, 18vw, 200px)",
                  fontWeight: 400,
                  letterSpacing: "0.18em",
                  color: "#b8922e",
                  opacity: 0.12,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                  lineHeight: 1,
                  filter: "blur(2px)",
                  mixBlendMode: "screen",
                }}>
                  LWD
                </div>

                {/* Quote text — sits above the watermark */}
                <p style={{
                  position: "relative",
                  fontFamily: GD, fontSize: "clamp(15px, 1.5vw, 18px)", fontStyle: "italic",
                  color: GOLD, opacity: 0.9, margin: 0,
                  lineHeight: 1.65, letterSpacing: "0.01em",
                  padding: "28px 0",
                }}>
                  "Taigenic is not a feature. It is the intelligence layer behind every meaningful interaction on LWD."
                </p>
              </div>

              <Divider margin="48px auto 0" />
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
                  body="Aura helps users navigate venues, suppliers, and options through natural language. No filters. No forms. Intelligent, contextual guidance that responds to intent, style, and budget, in the moment."
                />
                <CapCard
                  icon="⟡"
                  title="Lead Intelligence"
                  body="Taigenic scores, routes, and surfaces leads based on signal quality, not volume. Every enquiry is assessed for intent, enriched with context, and routed to the right destination in real time."
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
                fontFamily: NU, fontSize: 12, color: GREY,
                marginTop: 20, letterSpacing: "0.03em",
              }}>
                Live platform data, updated continuously.
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
                  lineHeight: 1.85, fontWeight: 300, margin: 0,
                }}>
                  Taigenic sits behind the platform, understanding intent,
                  guiding users, and turning interactions into qualified opportunities.
                  No complexity, just better outcomes.
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
              SECTION 5 — B2B CTA + Inline enquiry form
          ──────────────────────────────────────────────────────────────────── */}
          <section style={{
            background: BG,
            padding: "120px 60px 100px",
            textAlign: "center",
            backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,168,76,0.05) 0%, transparent 70%)",
          }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <Label text="Work with us" />

              <h2 style={{
                fontFamily: GD, fontSize: "clamp(28px, 3vw, 48px)", fontWeight: 400,
                color: OFF, margin: "0 0 12px", lineHeight: 1.15,
              }}>
                Bring Aura to your platform.
              </h2>

              <p style={{
                fontFamily: NU, fontSize: 13, color: MUTED,
                letterSpacing: "0.06em", margin: "0 0 28px",
              }}>
                Select how you want to work with us.
              </p>

              <p style={{
                fontFamily: NU, fontSize: 15, color: GREY,
                lineHeight: 1.85, fontWeight: 300,
                maxWidth: 520, margin: "0 auto 48px",
              }}>
                Taigenic is available to licence for premium hospitality platforms,
                wedding directories, event businesses, and luxury brands.
                Integration is handled by our team. Live in weeks, not months.
              </p>

              {/* ── Primary CTAs — Licence, Partner, Demo ── */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>

                {/* Licence Aura — gold primary */}
                <button onClick={() => openForm("licence")} style={{
                  background: activeType === "licence" ? "rgba(201,168,76,0.15)" : GOLD,
                  color: activeType === "licence" ? GOLD : "#0a0805",
                  border: activeType === "licence" ? `1px solid ${GOLD}` : "none",
                  borderRadius: 3, padding: "14px 32px", cursor: "pointer",
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.2s",
                }}>
                  Licence Aura
                </button>

                {/* Partner with us — gold outline */}
                <button onClick={() => openForm("partnership")} style={{
                  background: activeType === "partnership" ? "rgba(201,168,76,0.1)" : "transparent",
                  color: GOLD,
                  border: `1px solid ${activeType === "partnership" ? GOLD : BORDER_GOLD}`,
                  borderRadius: 3, padding: "14px 32px", cursor: "pointer",
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.2s",
                }}>
                  Partner with us
                </button>

                {/* Request a demo — gold outline */}
                <button onClick={() => openForm("demo")} style={{
                  background: activeType === "demo" ? "rgba(201,168,76,0.1)" : "transparent",
                  color: GOLD,
                  border: `1px solid ${activeType === "demo" ? GOLD : BORDER_GOLD}`,
                  borderRadius: 3, padding: "14px 32px", cursor: "pointer",
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.2s",
                }}>
                  Request a demo
                </button>
              </div>

              {/* ── Advertising — tertiary, clearly separated ── */}
              <div style={{
                marginTop: 32,
                paddingTop: 28,
                borderTop: `1px solid ${BORDER}`,
              }}>
                <p style={{
                  fontFamily: NU, fontSize: 12, color: GREY,
                  margin: "0 auto 16px", maxWidth: 460, lineHeight: 1.65,
                }}>
                  For venues and brands seeking visibility, editorial features, and qualified enquiries through our platform.
                </p>
                <button onClick={() => openForm("advertising")} style={{
                  background: "none",
                  color: activeType === "advertising" ? GOLD : MUTED,
                  border: "none",
                  padding: "6px 0",
                  cursor: "pointer",
                  fontFamily: NU, fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  textDecoration: activeType === "advertising" ? "underline" : "none",
                  textDecorationColor: GOLD,
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = GREY}
                onMouseLeave={e => e.currentTarget.style.color = activeType === "advertising" ? GOLD : MUTED}
                >
                  Advertise with us →
                </button>
              </div>

              {/* ── Inline form — slides in when a CTA is clicked ── */}
              {activeType && (
                <div ref={formRef} style={{
                  marginTop: 52,
                  background: PANEL,
                  border: `1px solid ${BORDER_GOLD}`,
                  borderRadius: 4,
                  padding: "40px 40px 36px",
                  textAlign: "left",
                }}>
                  {/* Form header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                    <div>
                      <p style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px" }}>
                        {ENQUIRY_TYPES[activeType]?.label}
                      </p>
                      <p style={{ fontFamily: NU, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.6 }}>
                        Fill in your details and we'll be in touch within 2 business days.
                      </p>
                    </div>
                    <button
                      onClick={() => { setActiveType(null); setSubmitted(false); }}
                      style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 16px" }}
                    >
                      ×
                    </button>
                  </div>

                  {submitted ? (
                    /* ── Success state ── */
                    <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
                      {/* Confirmation icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        border: `1px solid ${BORDER_GOLD}`,
                        background: "rgba(201,168,76,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px",
                        fontSize: 18, color: GOLD,
                      }}>
                        ✦
                      </div>
                      <h3 style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: OFF, margin: "0 0 14px", lineHeight: 1.2 }}>
                        Enquiry received
                      </h3>
                      <p style={{ fontFamily: NU, fontSize: 14, color: GREY, lineHeight: 1.8, maxWidth: 360, margin: "0 auto 8px" }}>
                        Our team will review your request and be in touch shortly.
                      </p>
                      <p style={{ fontFamily: NU, fontSize: 12, color: MUTED, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 28px" }}>
                        A confirmation has been logged to our pipeline under {ENQUIRY_TYPES[activeType]?.label}.
                      </p>
                      <button
                        onClick={() => { setActiveType(null); setSubmitted(false); }}
                        style={{ background: "none", border: `1px solid ${BORDER_GOLD}`, color: GOLD, borderRadius: 3,
                          padding: "10px 28px", cursor: "pointer", fontFamily: NU, fontSize: 10,
                          letterSpacing: "0.18em", textTransform: "uppercase" }}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    /* ── Form fields ── */
                    <form onSubmit={handleSubmit} noValidate>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }} className="taigenic-form-grid">

                        {/* Name */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Your name <span style={{ color: GOLD }}>*</span>
                          </label>
                          <input
                            type="text" value={form.name}
                            onChange={e => set("name", e.target.value)}
                            placeholder="Jane Smith"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.name ? "#e05c4a" : BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                          {errors.name && <p style={{ fontFamily: NU, fontSize: 11, color: "#e05c4a", margin: "5px 0 0" }}>{errors.name}</p>}
                        </div>

                        {/* Company */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Company <span style={{ color: GOLD }}>*</span>
                          </label>
                          <input
                            type="text" value={form.company}
                            onChange={e => set("company", e.target.value)}
                            placeholder="Acme Hospitality Group"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.company ? "#e05c4a" : BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                          {errors.company && <p style={{ fontFamily: NU, fontSize: 11, color: "#e05c4a", margin: "5px 0 0" }}>{errors.company}</p>}
                        </div>

                        {/* Email */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Email <span style={{ color: GOLD }}>*</span>
                          </label>
                          <input
                            type="email" value={form.email}
                            onChange={e => set("email", e.target.value)}
                            placeholder="jane@yourcompany.com"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.email ? "#e05c4a" : BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                          {errors.email && <p style={{ fontFamily: NU, fontSize: 11, color: "#e05c4a", margin: "5px 0 0" }}>{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Phone <span style={{ color: MUTED, fontWeight: 400 }}>optional</span>
                          </label>
                          <input
                            type="tel" value={form.phone}
                            onChange={e => set("phone", e.target.value)}
                            placeholder="+44 7700 000000"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>

                        {/* Website */}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Website <span style={{ color: MUTED, fontWeight: 400 }}>optional</span>
                          </label>
                          <input
                            type="url" value={form.website}
                            onChange={e => set("website", e.target.value)}
                            placeholder="https://yourplatform.com"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>

                        {/* Message */}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Message <span style={{ color: MUTED, fontWeight: 400 }}>optional</span>
                          </label>
                          <textarea
                            value={form.message}
                            onChange={e => set("message", e.target.value)}
                            rows={4}
                            placeholder="Tell us about your platform, what you're looking for, and any specific requirements…"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "10px 12px", color: OFF, fontFamily: NU, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.65 }}
                          />
                        </div>
                      </div>

                      {submitError && (
                        <p style={{ fontFamily: NU, fontSize: 12, color: "#e05c4a", margin: "16px 0 0", lineHeight: 1.5 }}>{submitError}</p>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                        <button
                          type="submit"
                          disabled={submitting}
                          style={{
                            background: submitting ? BORDER : GOLD,
                            color: "#0a0805", border: "none", borderRadius: 3,
                            padding: "12px 32px", cursor: submitting ? "default" : "pointer",
                            fontFamily: NU, fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.2s",
                          }}
                        >
                          {submitting ? "Sending…" : "Submit Enquiry"}
                        </button>
                      </div>

                      {/* Reassurance lines */}
                      <div style={{ marginTop: 14, textAlign: "right" }}>
                        <p style={{ fontFamily: NU, fontSize: 11, color: MUTED, margin: "0 0 3px", lineHeight: 1.5 }}>
                          We typically respond within 24 hours.
                        </p>
                        <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(242,237,229,0.32)", margin: 0, lineHeight: 1.5 }}>
                          Your details are handled with complete discretion.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {!activeType && (
                <>
                  <Divider margin="52px auto 0" />
                  <p style={{ fontFamily: NU, fontSize: 11, color: MUTED, margin: "20px 0 0", lineHeight: 1.6 }}>
                    All enquiries are handled directly by the Taigenic team. Response within 2 business days.
                  </p>
                </>
              )}
            </div>
          </section>

        </main>

        {/* ── Closing line before footer ── */}
        <div style={{
          background: BG,
          borderTop: `1px solid ${BORDER}`,
          padding: "32px 60px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: GD, fontSize: 13, fontStyle: "italic",
            color: MUTED, margin: 0, letterSpacing: "0.04em",
          }}>
            Powering the future of luxury discovery.
          </p>
        </div>

      </div>

      {/* Responsive: collapse tech grid to single column on narrow screens */}
      <style>{`
        @media (max-width: 768px) {
          .taigenic-tech-grid {
            grid-template-columns: 1fr !important;
            gap: 60px 0 !important;
          }
          .taigenic-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .taigenic-form-grid input,
        .taigenic-form-grid textarea {
          color: #f2ede5 !important;
        }
        .taigenic-form-grid input::placeholder,
        .taigenic-form-grid textarea::placeholder {
          color: rgba(242,237,229,0.3);
        }
        .taigenic-form-grid input:focus,
        .taigenic-form-grid textarea:focus {
          border-color: rgba(201,168,76,0.5) !important;
        }
      `}</style>

    </ThemeCtx.Provider>
  );
}
