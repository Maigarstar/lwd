// ═══════════════════════════════════════════════════════════════════════════
// AdvertisePage — Partner with Luxury Wedding Directory
// Route: /advertise
//
// ARCHITECTURE:
// Ground Floor  — Cinematic hero, "Partner with the most discerning..."
// First Floor   — Why LWD — audience quality, not volume
// Second Floor  — Partnership tiers (Featured / Editorial / Collection)
// Third Floor   — Who reads LWD — couple demographics
// Fourth Floor  — Editorial credibility strip
// Fifth Floor   — Social proof / venue names
// Ground Close  — CTA — Request a media pack
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import HomeNav from "../components/nav/HomeNav";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_D = "rgba(201,168,76,0.22)";
const BG   = "#0d0b09";
const TEXT = "#f5f0e8";
const MUTED = "rgba(245,240,232,0.55)";
const SUBTLE = "rgba(245,240,232,0.28)";
const DIVIDER = "rgba(255,255,255,0.06)";

// ── Partnership tiers ─────────────────────────────────────────────────────
const TIERS = [
  {
    code:    "01",
    name:    "Featured Listing",
    for:     "Ideal for boutique venues and emerging luxury brands",
    colour:  GOLD,
    grad:    "linear-gradient(160deg, #2b1e14 0%, #1a120b 40%, #0d0b09 100%)",
    accent:  "rgba(201,168,76,0.55)",
    price:   "From £295 / mo",
    outcome: "Direct access to couples actively planning their wedding",
    lines: [
      "Priority placement in directory",
      "Gold tier badge on all cards",
      "Enhanced profile with full media gallery",
      "Enquiry analytics dashboard",
      "Verified listing badge",
    ],
  },
  {
    code:    "02",
    name:    "Editorial Spotlight",
    for:     "Best for venues seeking editorial authority and reach",
    colour:  "#A78BFA",
    grad:    "linear-gradient(160deg, #0e0e1d 0%, #090914 40%, #05050d 100%)",
    accent:  "rgba(167,139,250,0.55)",
    price:   "From £895 / feature",
    outcome: "Become the venue couples read about before they have decided",
    lines: [
      "Dedicated editorial feature in LWD Magazine",
      "Professional photography direction",
      "Distributed across social channels",
      "Permanent archive in Real Weddings",
      "Backlink from editorial content",
    ],
    highlight: true,
  },
  {
    code:    "03",
    name:    "Collection Partner",
    for:     "For top-tier properties seeking a full-stack presence",
    colour:  "#6BA3A3",
    grad:    "linear-gradient(160deg, #0e1a15 0%, #091310 40%, #050d0a 100%)",
    accent:  "rgba(107,163,163,0.55)",
    price:   "Bespoke",
    outcome: "Top of mind when couples ask who they should trust",
    lines: [
      "Named placement in curated collections",
      "Homepage feature rotation",
      "Aura AI recommendation inclusion",
      "Annual editorial partnership",
      "Dedicated account manager",
    ],
  },
];

// ── Audience stats ────────────────────────────────────────────────────────
const STATS = [
  { num: "94%",      label: "Plan 12+ months ahead",   desc: "Our couples are in the research phase, actively choosing. Not browsing passively." },
  { num: "£68k",     label: "Average wedding budget",   desc: "Luxury-tier couples who have already decided to invest. The question is who with." },
  { num: "62%",      label: "Destination weddings",     desc: "International couples who need trusted referrals. They cannot afford to get it wrong." },
];

// ── Social proof ──────────────────────────────────────────────────────────
const PARTNERS = [
  "Villa d'Este, Lake Como",
  "Château de Varennes",
  "Masseria Torre Coccaro",
  "The Ritz London",
  "Palazzo Vendramin",
  "Castello di Vicarello",
  "Four Seasons Florence",
  "Domaine de Patras",
];

export default function AdvertisePage({ onNavigateHome, onNavigateListYourBusiness }) {
  const [heroVisible,  setHeroVisible]  = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [scrollY,      setScrollY]      = useState(false);
  const [formData,     setFormData]     = useState({ name: "", business: "", email: "", category: "", message: "" });
  const [submitted,    setSubmitted]    = useState(false);
  const [hovTier,      setHovTier]      = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: NU }}>

      <HomeNav
        hasHero={true}
        darkMode={true}
        onNavigateStandard={onNavigateHome}
        onNavigateAbout={onNavigateHome}
      />

      {/* ══════════════════════════════════════════════════════════════
          GROUND FLOOR — Cinematic hero
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position:   "relative",
        height:     "100vh",
        minHeight:  680,
        overflow:   "hidden",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Dark atmospheric background */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a1208 0%, #0d0b09 55%, #090706 100%)", zIndex: 0 }} />

        {/* Ambient gold bloom */}
        <div style={{
          position: "absolute", top: "20%", left: "55%", transform: "translate(-50%,-50%)",
          width: 900, height: 700, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%)",
          zIndex: 1, pointerEvents: "none",
        }} />
        {/* Secondary purple bloom */}
        <div style={{
          position: "absolute", top: "70%", left: "20%",
          width: 500, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(167,139,250,0.05) 0%, transparent 70%)",
          zIndex: 1, pointerEvents: "none",
        }} />

        {/* Grain texture */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }} />

        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          background: "linear-gradient(to bottom, rgba(13,11,9,0.3) 0%, rgba(13,11,9,0.05) 40%, rgba(13,11,9,0.3) 65%, rgba(13,11,9,0.95) 100%)",
        }} />

        {/* Large background watermark */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "50%", right: "-5%",
          transform: "translateY(-50%)",
          fontFamily: GD, fontSize: "clamp(180px, 26vw, 380px)", fontWeight: 700, fontStyle: "italic",
          color: TEXT, opacity: 0.025, letterSpacing: "-10px", lineHeight: 1,
          pointerEvents: "none", userSelect: "none", zIndex: 2, whiteSpace: "nowrap",
        }}>
          LWD
        </div>

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 5,
          textAlign: "center", maxWidth: 820, padding: "0 24px",
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(18px)",
          transition: "opacity 1.1s ease, transform 1.1s ease",
        }}>
          <div style={{
            fontFamily: NU, fontSize: 10, letterSpacing: "0.35em",
            textTransform: "uppercase", color: GOLD, marginBottom: 28, opacity: 0.75,
          }}>
            ✦ &nbsp; Partner with LWD &nbsp; ✦
          </div>

          <h1 style={{
            fontFamily: GD, fontSize: "clamp(38px, 5.5vw, 72px)", fontWeight: 400,
            color: TEXT, margin: "0 0 8px", lineHeight: 1.05, letterSpacing: "-0.02em",
            textShadow: "0 2px 32px rgba(0,0,0,0.6)",
          }}>
            Reach couples who
          </h1>
          <h1 style={{
            fontFamily: GD, fontSize: "clamp(38px, 5.5vw, 72px)", fontWeight: 400,
            fontStyle: "italic", color: GOLD, margin: "0 0 28px", lineHeight: 1.05,
            letterSpacing: "-0.02em", textShadow: "0 2px 32px rgba(0,0,0,0.6)",
          }}>
            refuse to compromise.
          </h1>

          <p style={{
            fontFamily: NU, fontSize: "clamp(14px, 1.8vw, 18px)",
            color: "rgba(245,240,232,0.60)", margin: "0 0 48px", lineHeight: 1.75,
            maxWidth: 540, marginLeft: "auto", marginRight: "auto",
            textShadow: "0 1px 12px rgba(0,0,0,0.5)",
          }}>
            LWD is not a directory. It is the reference point for couples planning weddings at the highest level, and for the professionals they choose to trust.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {/* Primary CTA — deliberately larger and brighter */}
            <button
              onClick={scrollToForm}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#0d0b09", background: "#D4AC50",
                border: "none", padding: "18px 44px", borderRadius: 2, cursor: "pointer",
                transition: "background 0.2s, box-shadow 0.2s",
                boxShadow: "0 8px 32px rgba(201,168,76,0.22)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F0CF76"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.38)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#D4AC50"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.22)"; }}
            >
              Request a Media Pack →
            </button>
            {/* Secondary CTA — intentionally quieter */}
            <button
              onClick={onNavigateListYourBusiness}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(245,240,232,0.42)", background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)", padding: "16px 24px",
                borderRadius: 2, cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.color = MUTED; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(245,240,232,0.42)"; }}
            >
              List Your Business
            </button>
          </div>

          {/* Trust signal — reduces hesitation */}
          <div style={{
            marginTop: 28, fontFamily: NU, fontSize: 11, letterSpacing: "0.06em",
            color: "rgba(245,240,232,0.32)", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10,
          }}>
            <span style={{ color: GOLD, opacity: 0.5, fontSize: 9 }}>✦</span>
            Trusted by leading venues across Europe
            <span style={{ color: GOLD, opacity: 0.5, fontSize: 9 }}>✦</span>
          </div>

          {/* Scroll cue */}
          <button
            onClick={scrollToForm}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 8, margin: "52px auto 0", opacity: 0.32, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.65"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.32"}
          >
            <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: TEXT }}>
              Discover
            </span>
            <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${TEXT}, transparent)` }} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FIRST FLOOR — Why LWD / audience quality
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: isMobile ? "60px 24px" : "100px 48px",
        maxWidth: 1440, margin: "0 auto", borderBottom: `1px solid ${DIVIDER}`,
      }}>
        <div style={{ maxWidth: 680, marginBottom: 72 }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, marginBottom: 16, opacity: 0.65 }}>
            The Audience
          </div>
          <h2 style={{ fontFamily: GD, fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 400, fontStyle: "italic", color: TEXT, margin: "0 0 20px", lineHeight: 1.15 }}>
            Not more couples. The right couples.
          </h2>
          <p style={{ fontFamily: NU, fontSize: 15, color: MUTED, lineHeight: 1.85, margin: 0 }}>
            Every couple who finds you through LWD has already decided they want the best. They are not comparing prices. They are choosing partners for the most important day of their lives.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: isMobile ? 48 : 0,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: isMobile ? "0 0 32px" : "0 52px",
              borderLeft: !isMobile && i > 0 ? `1px solid ${DIVIDER}` : "none",
            }}>
              <div style={{
                fontFamily: GD, fontSize: "clamp(56px, 6.5vw, 88px)", fontWeight: 400,
                fontStyle: "italic", color: GOLD, marginBottom: 4, lineHeight: 1, letterSpacing: "-0.01em",
              }}>
                {s.num}
              </div>
              <div style={{ width: 40, height: 1, background: "linear-gradient(to right, rgba(201,168,76,0.5), transparent)", marginBottom: 14 }} />
              <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: TEXT, marginBottom: 14, opacity: 0.65 }}>
                {s.label}
              </div>
              <p style={{ fontFamily: NU, fontSize: 13, color: SUBTLE, lineHeight: 1.8, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECOND FLOOR — Partnership tiers
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: isMobile ? "60px 24px" : "100px 48px",
        maxWidth: 1440, margin: "0 auto", borderBottom: `1px solid ${DIVIDER}`,
      }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, marginBottom: 12, opacity: 0.65 }}>
            Partnership Options
          </div>
          <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 400, fontStyle: "italic", color: TEXT, margin: 0, lineHeight: 1.15 }}>
            Choose your presence
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 16 : 24,
        }}>
          {TIERS.map((tier, i) => (
            <div
              key={tier.code}
              onMouseEnter={() => setHovTier(i)}
              onMouseLeave={() => setHovTier(null)}
              style={{
                position: "relative", borderRadius: 2, overflow: "hidden",
                background: tier.grad,
                border: hovTier === i
                  ? `1px solid ${tier.accent.replace("0.55", "0.4")}`
                  : tier.highlight
                    ? `1px solid ${tier.accent.replace("0.55", "0.2")}`
                    : "1px solid rgba(255,255,255,0.05)",
                padding: isMobile ? "36px 28px 40px" : "44px 36px 48px",
                cursor: "default",
                transform: hovTier === i ? "translateY(-5px)" : tier.highlight ? "translateY(-2px)" : "none",
                boxShadow: hovTier === i
                  ? `0 28px 70px rgba(0,0,0,0.55), 0 0 80px ${tier.accent.replace("0.55", "0.14")}`
                  : tier.highlight
                    ? `0 16px 48px rgba(0,0,0,0.4), 0 0 48px ${tier.accent.replace("0.55", "0.08")}`
                    : "none",
                transition: "all 0.4s ease",
              }}
            >
              {/* Accent glow top-right */}
              <div style={{
                position: "absolute", top: "-30%", right: "-20%", width: "70%", height: "70%",
                borderRadius: "50%", background: `radial-gradient(ellipse, ${tier.accent} 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {/* Grain */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
                backgroundSize: "160px 160px",
              }} />

              {/* Code watermark */}
              <div aria-hidden="true" style={{
                position: "absolute", bottom: -16, right: 4,
                fontFamily: GD, fontSize: isMobile ? 80 : 110, fontWeight: 700, fontStyle: "italic",
                color: TEXT, opacity: 0.05, letterSpacing: "-3px", lineHeight: 1,
                pointerEvents: "none", userSelect: "none",
              }}>
                {tier.code}
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {tier.highlight && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                    textTransform: "uppercase", color: "#0d0b09", background: tier.colour,
                    padding: "4px 12px", borderRadius: 1, marginBottom: 20,
                  }}>
                    ✦ Most Popular
                  </div>
                )}

                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: tier.colour, marginBottom: 8, opacity: 0.8 }}>
                  {tier.name}
                </div>

                {/* Self-selection label */}
                <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(245,240,232,0.35)", marginBottom: 16, lineHeight: 1.5 }}>
                  {tier.for}
                </div>

                <div style={{ fontFamily: GD, fontSize: isMobile ? 28 : 36, fontWeight: 400, fontStyle: "italic", color: TEXT, marginBottom: 8, lineHeight: 1.1 }}>
                  {tier.price}
                </div>

                <div style={{ width: 32, height: 1, background: `linear-gradient(to right, ${tier.colour}88, transparent)`, marginBottom: 20 }} />

                {/* Outcome line — sells the result, not the feature */}
                <div style={{
                  fontFamily: NU, fontSize: 12, color: tier.colour, opacity: 0.85,
                  marginBottom: 20, lineHeight: 1.55, fontStyle: "italic",
                }}>
                  {tier.outcome}
                </div>

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {tier.lines.map((line, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: NU, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                      <span style={{ color: tier.colour, opacity: 0.7, flexShrink: 0, marginTop: 1, fontSize: 10 }}>✦</span>
                      {line}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={scrollToForm}
                  style={{
                    marginTop: 36, width: "100%",
                    fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "#0d0b09",
                    background: `linear-gradient(135deg, ${tier.colour}, ${tier.colour}cc)`,
                    border: "none", padding: "14px 0", borderRadius: 2, cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Enquire →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scarcity — subtle, aligned with curated positioning */}
        <p style={{
          fontFamily: NU, fontSize: 12, color: SUBTLE, textAlign: "center",
          marginTop: 36, letterSpacing: "0.04em", lineHeight: 1.7,
        }}>
          Limited partner placements available per region. We work with a small number of businesses in each market to protect editorial integrity.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          THIRD FLOOR — Editorial credibility
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: isMobile ? "60px 24px" : "100px 48px",
        maxWidth: 1440, margin: "0 auto", borderBottom: `1px solid ${DIVIDER}`,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 48 : 80,
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(167,139,250,0.7)", marginBottom: 16 }}>
            Our Standard
          </div>
          <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 400, fontStyle: "italic", color: TEXT, margin: "0 0 24px", lineHeight: 1.15 }}>
            We edit. We do not aggregate.
          </h2>
          <p style={{ fontFamily: NU, fontSize: 15, color: MUTED, lineHeight: 1.85, margin: "0 0 20px" }}>
            Every professional in the LWD directory has been personally reviewed. We decline more applications than we approve. That exclusivity is exactly what makes our recommendation carry weight with couples.
          </p>
          <p style={{ fontFamily: NU, fontSize: 15, color: MUTED, lineHeight: 1.85, margin: 0 }}>
            When couples find you here, they already trust the recommendation. You are not fighting for attention. You are being introduced.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["Editorial review", "Every listing reviewed by a human editor before going live"],
            ["No pay-to-rank", "Placement reflects quality and editorial alignment, not spend"],
            ["Couple-first", "We optimise for couple trust, which in turn drives business value for you"],
            ["Permanent presence", "No seasonal cutoffs. Your listing compounds in value over time."],
          ].map(([title, desc]) => (
            <div key={title} style={{
              display: "flex", gap: 20, alignItems: "flex-start",
              padding: "20px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 2,
            }}>
              <span style={{ color: GOLD, fontSize: 10, marginTop: 3, flexShrink: 0 }}>✦</span>
              <div>
                <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: TEXT, marginBottom: 6 }}>{title}</div>
                <div style={{ fontFamily: NU, fontSize: 13, color: SUBTLE, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOURTH FLOOR — Partner names
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: isMobile ? "48px 24px" : "72px 48px",
        maxWidth: 1440, margin: "0 auto", borderBottom: `1px solid ${DIVIDER}`,
      }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: SUBTLE, marginBottom: 32, textAlign: "center" }}>
          Trusted by
        </div>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: isMobile ? 12 : 20,
          justifyContent: "center", alignItems: "center",
        }}>
          {PARTNERS.map((name, i) => (
            <div key={i} style={{
              fontFamily: GD, fontSize: isMobile ? 14 : 17, fontStyle: "italic",
              color: `rgba(245,240,232,${i % 2 === 0 ? "0.28" : "0.18"})`,
              letterSpacing: "0.01em", whiteSpace: "nowrap",
            }}>
              {name}
              {i < PARTNERS.length - 1 && (
                <span style={{ marginLeft: isMobile ? 12 : 20, color: GOLD_D, fontSize: 8 }}>✦</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GROUND CLOSE — Contact form
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={formRef}
        style={{
          padding: isMobile ? "60px 24px 80px" : "100px 48px 120px",
          maxWidth: 1440, margin: "0 auto",
        }}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 48 : 80,
          alignItems: "flex-start",
        }}>
          {/* Left — closing copy */}
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, marginBottom: 16, opacity: 0.65 }}>
              Get in Touch
            </div>
            <h2 style={{ fontFamily: GD, fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 400, fontStyle: "italic", color: TEXT, margin: "0 0 24px", lineHeight: 1.15 }}>
              Let's talk about your presence on LWD.
            </h2>
            <p style={{ fontFamily: NU, fontSize: 15, color: MUTED, lineHeight: 1.85, margin: "0 0 40px" }}>
              Tell us about your business and what you're looking to achieve. We'll send you our full media pack and suggest the partnership that fits best.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Response time", "Within 1 working day"],
                ["No commitment", "Media pack is free with no obligation"],
                ["Tailored advice", "We'll suggest the right tier for your goals"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ color: GOLD, fontSize: 10 }}>✦</span>
                  <div>
                    <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: TEXT, marginRight: 8 }}>{label}</span>
                    <span style={{ fontFamily: NU, fontSize: 12, color: SUBTLE }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          {submitted ? (
            <div style={{
              padding: "48px 40px", background: "rgba(201,168,76,0.04)",
              border: "1px solid rgba(201,168,76,0.18)", borderRadius: 2, textAlign: "center",
            }}>
              <div style={{ fontFamily: GD, fontSize: 32, fontStyle: "italic", color: GOLD, marginBottom: 16 }}>Thank you.</div>
              <p style={{ fontFamily: NU, fontSize: 14, color: MUTED, lineHeight: 1.8, margin: 0 }}>
                We've received your enquiry and will be in touch within one working day with our full media pack.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "name",     placeholder: "Your name",            type: "text" },
                { key: "business", placeholder: "Business name",        type: "text" },
                { key: "email",    placeholder: "Email address",        type: "email" },
              ].map(({ key, placeholder, type }) => (
                <input
                  key={key}
                  type={type}
                  required
                  value={formData[key]}
                  onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    fontFamily: NU, fontSize: 14, color: TEXT,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2, padding: "14px 18px", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = GOLD_D}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              ))}

              <select
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                style={{
                  fontFamily: NU, fontSize: 14,
                  color: formData.category ? TEXT : SUBTLE,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2, padding: "14px 18px", outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>Business category</option>
                {["Wedding Venue", "Wedding Planner", "Photographer", "Florist", "Videographer", "Caterer", "Entertainment", "Other"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <textarea
                value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                placeholder="Tell us briefly about your business and what you're hoping to achieve with LWD..."
                rows={4}
                style={{
                  fontFamily: NU, fontSize: 14, color: TEXT,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2, padding: "14px 18px", outline: "none",
                  resize: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.currentTarget.style.borderColor = GOLD_D}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              />

              {/* Reassurance — removes friction before submit */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: NU, fontSize: 12, color: "rgba(201,168,76,0.6)",
                marginTop: 4, marginBottom: 4,
              }}>
                <span style={{ fontSize: 9 }}>✦</span>
                We respond within 24 hours
              </div>

              <button
                type="submit"
                style={{
                  fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "#0d0b09", background: "#D4AC50",
                  border: "none", padding: "18px 0", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, cursor: "pointer",
                  transition: "background 0.2s, box-shadow 0.2s",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.2)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F0CF76"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.36)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#D4AC50"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.2)"; }}
              >
                Request Media Pack →
              </button>

              <p style={{ fontFamily: NU, fontSize: 11, color: SUBTLE, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                No commitment. No spam. Just a conversation.
              </p>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
