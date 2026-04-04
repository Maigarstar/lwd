// ═══════════════════════════════════════════════════════════════════════════
// PricingPage — LWD Membership Tiers
// Route: /pricing
// Three tiers: Standard · Featured · Showcase
// All content hardcoded — no external data fetching.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import HomeNav from "../components/nav/HomeNav";

// ── Tier definitions ─────────────────────────────────────────────────────────

const TIERS = [
  {
    key: "standard",
    name: "Standard",
    tagline: "Your foundation in the directory",
    monthlyPrice: 149,
    annualPrice: 1490,
    color: "#6b7280",
    highlight: false,
    badge: null,
    features: [
      "Listed across the LWD directory",
      "Up to 12 portfolio images",
      "Enquiry form + lead capture",
      "Basic analytics dashboard",
      "LWD verified badge",
      "Location & category placement",
    ],
    notIncluded: [
      "Priority search placement",
      "Video story embed",
      "Advanced analytics + ROI panel",
      "Monthly performance reports",
      "Showcase editorial feature",
    ],
    cta: "Apply for Standard",
  },
  {
    key: "featured",
    name: "Featured",
    tagline: "Stand out. Be chosen first.",
    monthlyPrice: 349,
    annualPrice: 3490,
    color: "#C9A84C",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Standard",
      "Priority placement in search results",
      "Up to 40 portfolio images",
      "Video story embed (1 video)",
      "Full analytics + ROI Intelligence panel",
      "Touch point funnel & media value",
      "Seasonal insights & booking windows",
      "Country & source traffic breakdown",
      "Featured badge on listing card",
    ],
    notIncluded: [
      "Showcase editorial feature",
      "Monthly branded PDF report",
      "Dedicated account manager",
    ],
    cta: "Apply for Featured",
  },
  {
    key: "showcase",
    name: "Showcase",
    tagline: "The pinnacle of visibility",
    monthlyPrice: 699,
    annualPrice: 6990,
    color: "#8b5cf6",
    highlight: false,
    badge: "Premium",
    features: [
      "Everything in Featured",
      "Top editorial placement",
      "Unlimited portfolio images",
      "Up to 3 video embeds",
      "Showcase editorial story + interview",
      "Monthly branded performance report (PDF)",
      "Quarterly strategy review call",
      "Dedicated account manager",
      "Priority enquiry routing",
      "Bespoke seasonal campaign",
      "LWD Showcase seal of excellence",
    ],
    notIncluded: [],
    cta: "Apply for Showcase",
  },
];

// ── Comparison table rows ────────────────────────────────────────────────────

const COMPARE_ROWS = [
  {
    label: "Profile images",
    standard: "Up to 12",
    featured: "Up to 40",
    showcase: "Unlimited",
  },
  {
    label: "Video embeds",
    standard: "—",
    featured: "1 video",
    showcase: "Up to 3",
  },
  {
    label: "Analytics tier",
    standard: "Basic",
    featured: "Full + ROI",
    showcase: "Full + ROI",
  },
  {
    label: "Performance reports",
    standard: "—",
    featured: "—",
    showcase: "Monthly PDF",
  },
  {
    label: "Account management",
    standard: "—",
    featured: "—",
    showcase: "Dedicated",
  },
  {
    label: "Seasonal insights",
    standard: "—",
    featured: true,
    showcase: true,
  },
  {
    label: "Editorial feature",
    standard: "—",
    featured: "—",
    showcase: "Showcase story",
  },
  {
    label: "Search placement",
    standard: "Standard",
    featured: "Priority",
    showcase: "Top placement",
  },
];

// ── ROI data ─────────────────────────────────────────────────────────────────

const ROI_DATA = [
  {
    tier: "Standard",
    cost: "£1,490/yr",
    breakeven: "1 booking = 12× return",
    color: "#6b7280",
    detail: "at £18k avg booking value",
  },
  {
    tier: "Featured",
    cost: "£3,490/yr",
    breakeven: "1 booking = 10× return",
    color: "#C9A84C",
    detail: "at £35k avg booking value",
  },
  {
    tier: "Showcase",
    cost: "£6,990/yr",
    breakeven: "1 booking = 10× return",
    color: "#8b5cf6",
    detail: "with editorial reach",
  },
];

// ── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Within three months of upgrading to Featured, we had enquiries from couples in New York, Dubai, and Sydney. LWD puts us in front of the right people.",
    name: "Valentina Moretti",
    role: "Villa Moretti, Lake Como",
  },
  {
    quote: "The analytics panel showed us exactly where our enquiries were coming from. We realigned our photography portfolio to match — bookings followed.",
    name: "James Arden",
    role: "Arden Photography, London",
  },
  {
    quote: "The Showcase editorial story brought in two seven-figure venue bookings within the first quarter. The ROI speaks for itself.",
    name: "Sophie Laurent",
    role: "Château Laurent, Provence",
  },
];

// ── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. You can upgrade your tier at any point and the new features activate immediately. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "Our annual plan offers the best value with no monthly billing. We also offer a monthly rolling option at a slightly higher rate. Both can be cancelled with 30 days' notice.",
  },
  {
    q: "How quickly will my listing go live?",
    a: "Once your application is approved, our editorial team typically has your listing live within 48 hours. Showcase listings take up to 5 business days as we craft your editorial story.",
  },
  {
    q: "Do you accept all applications?",
    a: "No. We review every application personally to ensure it meets LWD's editorial standard. This is intentional — a curated directory protects the value of your listing.",
  },
  {
    q: "What's included in the monthly reports?",
    a: "Showcase tier reports include: total views, enquiry volume, shortlists, outbound clicks, source breakdown by country, media value equivalent, ROI estimate, and a seasonal forward-look. Delivered as a branded PDF each month.",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function PricingPage({ onNavigateHome, onNavigateListYourBusiness, footerNav, onToggleDark, darkMode, onVendorLogin, onNavigateStandard, onNavigateAbout }) {
  const [billing, setBilling] = useState("annual"); // "monthly" | "annual"
  const [openFaq, setOpenFaq] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  const gold = "#C9A84C";
  const goldDim = "rgba(201,168,76,0.08)";
  const goldBorder = "rgba(201,168,76,0.25)";
  const textPrimary = "rgba(255,255,255,0.92)";
  const textMuted = "rgba(255,255,255,0.52)";
  const textSubtle = "rgba(255,255,255,0.35)";
  const cardBg = "#141210";
  const sectionBg = "#0d0b09";
  const dividerColor = "rgba(255,255,255,0.06)";
  const GD = "var(--font-heading-primary)";
  const NU = "var(--font-body)";

  function getPrice(tier) {
    return billing === "annual" ? tier.annualPrice : tier.monthlyPrice;
  }

  function getSaving(tier) {
    return tier.monthlyPrice * 12 - tier.annualPrice;
  }

  return (
    <div style={{ minHeight: "100vh", background: sectionBg, color: textPrimary, fontFamily: NU }}>
      <HomeNav
        onToggleDark={onToggleDark}
        darkMode={darkMode}
        onVendorLogin={onVendorLogin}
        onNavigateStandard={onNavigateStandard}
        onNavigateAbout={onNavigateAbout}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: sectionBg,
        padding: "120px 24px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* ambient glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            fontFamily: NU, fontSize: 11, letterSpacing: "0.25em",
            textTransform: "uppercase", color: gold, marginBottom: 24, opacity: 0.9,
          }}>
            LWD Membership
          </div>

          <h1 style={{
            fontFamily: GD, fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 400,
            fontStyle: "italic", color: textPrimary, margin: "0 0 24px",
            lineHeight: 1.2,
          }}>
            Be seen by the couples who matter
          </h1>

          <p style={{
            fontFamily: NU, fontSize: 18, color: textMuted, margin: "0 0 48px",
            lineHeight: 1.7, maxWidth: 560, marginLeft: "auto", marginRight: "auto",
          }}>
            Three tiers. One direction. Chosen by the world's finest wedding professionals.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 0,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${dividerColor}`,
            borderRadius: 40, padding: 4,
          }}>
            {["monthly", "annual"].map(opt => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                style={{
                  fontFamily: NU, fontSize: 13, fontWeight: billing === opt ? 600 : 400,
                  color: billing === opt ? "#0d0b09" : textMuted,
                  background: billing === opt ? gold : "transparent",
                  border: "none", borderRadius: 36, padding: "8px 24px",
                  cursor: "pointer", transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {opt === "monthly" ? "Monthly" : "Annual"}
                {opt === "annual" && (
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 700,
                    color: billing === "annual" ? "#0d0b09" : gold,
                    letterSpacing: "0.05em",
                  }}>
                    SAVE 2 MONTHS
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof strip ────────────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${dividerColor}`,
        borderBottom: `1px solid ${dividerColor}`,
        background: "rgba(255,255,255,0.015)",
        padding: "16px 24px",
        overflowX: "auto",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(20px, 4vw, 52px)", flexWrap: "wrap",
        }}>
          {[
            ["2,400+", "listings"],
            ["94%", "enquiry open rate"],
            ["14", "countries"],
            ["£28k", "avg booking value"],
            ["Est. £6.2M", "in leads generated"],
          ].map(([stat, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: GD, fontSize: 18, fontWeight: 600, color: gold }}>{stat}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tier cards ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          alignItems: "stretch",
        }}>
          {TIERS.map((tier) => {
            const price = getPrice(tier);
            const saving = getSaving(tier);
            return (
              <div
                key={tier.key}
                style={{
                  background: cardBg,
                  border: tier.highlight
                    ? `1px solid rgba(201,168,76,0.3)`
                    : `1px solid ${dividerColor}`,
                  borderRadius: 16,
                  padding: "36px 32px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: tier.highlight
                    ? "0 0 40px rgba(201,168,76,0.08)"
                    : "none",
                  transform: tier.highlight ? "scale(1.02)" : "scale(1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: tier.color, color: tier.highlight ? "#0d0b09" : "#fff",
                    fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", padding: "4px 16px", borderRadius: 20,
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Tier name + tagline */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: "inline-block",
                    width: 32, height: 2,
                    background: tier.color,
                    marginBottom: 14,
                    borderRadius: 1,
                  }} />
                  <div style={{
                    fontFamily: GD, fontSize: 26, fontWeight: 400,
                    color: textPrimary, marginBottom: 6,
                  }}>
                    {tier.name}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
                    {tier.tagline}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${dividerColor}` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: NU, fontSize: 15, color: textMuted }}>£</span>
                    <span style={{ fontFamily: GD, fontSize: 42, fontWeight: 700, color: textPrimary, lineHeight: 1 }}>
                      {price.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
                      {billing === "annual" ? "/ year" : "/ month"}
                    </span>
                  </div>
                  {billing === "annual" && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: "#4ade80" }}>
                      Saving £{saving.toLocaleString()} vs monthly
                    </div>
                  )}
                  {billing === "monthly" && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: textSubtle }}>
                      Or £{tier.annualPrice.toLocaleString()}/yr (save 2 months)
                    </div>
                  )}
                </div>

                {/* Features included */}
                <div style={{ flex: 1, marginBottom: 28 }}>
                  {tier.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <span style={{ color: "#4ade80", fontSize: 13, lineHeight: "20px", flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                  {tier.notIncluded.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <span style={{ color: textSubtle, fontSize: 13, lineHeight: "20px", flexShrink: 0 }}>—</span>
                      <span style={{ fontFamily: NU, fontSize: 13, color: textSubtle, lineHeight: 1.5, textDecoration: "line-through" }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={onNavigateListYourBusiness}
                  style={{
                    width: "100%",
                    fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                    color: tier.highlight ? "#0d0b09" : textPrimary,
                    background: tier.highlight
                      ? `linear-gradient(135deg, ${tier.color}, #e8c97a)`
                      : `rgba(255,255,255,0.05)`,
                    border: tier.highlight ? "none" : `1px solid ${tier.color}40`,
                    borderRadius: 8, padding: "14px 20px",
                    cursor: "pointer", transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {tier.cta} →
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ROI illustration ────────────────────────────────────────────────── */}
      <section style={{
        background: "rgba(255,255,255,0.015)",
        borderTop: `1px solid ${dividerColor}`,
        borderBottom: `1px solid ${dividerColor}`,
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              fontFamily: NU, fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: gold, marginBottom: 16, opacity: 0.8,
            }}>
              The case for listing
            </div>
            <h2 style={{
              fontFamily: GD, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400,
              fontStyle: "italic", color: textPrimary, margin: 0,
            }}>
              One booking covers your investment
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}>
            {ROI_DATA.map((row) => (
              <div key={row.tier} style={{
                background: cardBg,
                border: `1px solid ${dividerColor}`,
                borderTop: `3px solid ${row.color}`,
                borderRadius: 12,
                padding: "28px 24px",
              }}>
                <div style={{ fontFamily: NU, fontSize: 11, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: row.color, marginBottom: 12 }}>
                  {row.tier}
                </div>
                <div style={{ fontFamily: GD, fontSize: 18, color: textPrimary, marginBottom: 8 }}>
                  {row.cost}
                </div>
                <div style={{ fontFamily: NU, fontSize: 14, fontWeight: 600, color: "#4ade80", marginBottom: 8 }}>
                  {row.breakeven}
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                  {row.detail}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, textAlign: "center",
            fontFamily: NU, fontSize: 12, color: textSubtle, lineHeight: 1.6,
          }}>
            Based on average wedding booking values across LWD vendor categories. Actual results vary.
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontFamily: GD, fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 400,
            fontStyle: "italic", color: textPrimary, margin: "0 0 16px",
          }}>
            Full feature comparison
          </h2>
          {/* Mobile expand toggle */}
          <button
            onClick={() => setShowCompare(v => !v)}
            style={{
              fontFamily: NU, fontSize: 12, color: gold, background: "transparent",
              border: `1px solid ${goldBorder}`, borderRadius: 20,
              padding: "6px 18px", cursor: "pointer",
              display: "none",
            }}
            className="compare-toggle"
          >
            {showCompare ? "Hide comparison" : "View full comparison"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{
                  fontFamily: NU, fontSize: 11, fontWeight: 500,
                  color: textMuted, textAlign: "left", padding: "12px 16px",
                  borderBottom: `1px solid ${dividerColor}`, width: "40%",
                }}>
                  Feature
                </th>
                {TIERS.map(t => (
                  <th key={t.key} style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 600,
                    color: t.highlight ? gold : textPrimary,
                    textAlign: "center", padding: "12px 8px",
                    borderBottom: `1px solid ${dividerColor}`,
                  }}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.label} style={{
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}>
                  <td style={{
                    fontFamily: NU, fontSize: 13, color: textPrimary,
                    padding: "13px 16px", borderBottom: `1px solid ${dividerColor}`,
                  }}>
                    {row.label}
                  </td>
                  {["standard", "featured", "showcase"].map(key => {
                    const val = row[key];
                    const isCheck = val === true;
                    const isEmpty = val === "—" || val === false;
                    const tier = TIERS.find(t => t.key === key);
                    return (
                      <td key={key} style={{
                        fontFamily: NU, fontSize: 12, textAlign: "center",
                        padding: "13px 8px", borderBottom: `1px solid ${dividerColor}`,
                        color: isEmpty ? textSubtle : (isCheck ? "#4ade80" : textPrimary),
                      }}>
                        {isCheck ? "✓" : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile show/hide styles */}
        <style>{`
          @media (max-width: 640px) {
            .compare-toggle { display: inline-block !important; }
          }
        `}</style>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section style={{
        background: "rgba(255,255,255,0.015)",
        borderTop: `1px solid ${dividerColor}`,
        borderBottom: `1px solid ${dividerColor}`,
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              fontFamily: NU, fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: gold, opacity: 0.8,
            }}>
              Trusted by leading venues & vendors
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: cardBg,
                border: `1px solid ${dividerColor}`,
                borderRadius: 12,
                padding: "28px 26px",
              }}>
                <div style={{
                  fontFamily: GD, fontSize: 15, fontStyle: "italic",
                  color: textPrimary, lineHeight: 1.7, marginBottom: 20,
                  opacity: 0.88,
                }}>
                  "{t.quote}"
                </div>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: textPrimary }}>
                    {t.name}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 2 }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{
            fontFamily: GD, fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 400,
            fontStyle: "italic", color: textPrimary, margin: 0,
          }}>
            Common questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} style={{
                borderTop: `1px solid ${dividerColor}`,
                ...(i === FAQ_ITEMS.length - 1 ? { borderBottom: `1px solid ${dividerColor}` } : {}),
              }}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: "transparent", border: "none",
                    padding: "20px 0", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <span style={{ fontFamily: NU, fontSize: 15, fontWeight: 500, color: textPrimary }}>
                    {item.q}
                  </span>
                  <span style={{
                    fontFamily: NU, fontSize: 18, color: gold,
                    flexShrink: 0, transition: "transform 0.2s",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div style={{
                    fontFamily: NU, fontSize: 14, color: textMuted,
                    lineHeight: 1.75, paddingBottom: 20,
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #1a1208 0%, #0d0b09 60%)`,
        borderTop: `1px solid ${goldBorder}`,
        padding: "100px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 800, height: 500, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <div style={{
            fontFamily: NU, fontSize: 13, letterSpacing: "0.22em",
            textTransform: "uppercase", color: gold, marginBottom: 20, opacity: 0.8,
          }}>
            ✦ &nbsp; Ready to begin?
          </div>
          <h2 style={{
            fontFamily: GD, fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 400,
            fontStyle: "italic", color: textPrimary, margin: "0 0 20px", lineHeight: 1.25,
          }}>
            Ready to be discovered?
          </h2>
          <p style={{
            fontFamily: NU, fontSize: 16, color: textMuted,
            lineHeight: 1.7, margin: "0 0 40px",
          }}>
            Apply now — we review every application personally.
          </p>
          <button
            onClick={onNavigateListYourBusiness}
            style={{
              fontFamily: NU, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#0d0b09",
              background: `linear-gradient(135deg, ${gold}, #e8c97a)`,
              border: "none", borderRadius: 8, padding: "16px 40px",
              cursor: "pointer", transition: "opacity 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Apply to Join LWD →
          </button>
        </div>
      </section>
    </div>
  );
}
