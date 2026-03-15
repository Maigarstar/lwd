// ─── src/components/sections/SEOBlock.jsx ────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const FAQS = [
  {
    q: "When is the best time to get married in Italy?",
    a: "Late April through June and September through October offer the finest weather, warm, dry days with a golden light that photographers love. August can be intensely hot, particularly in Tuscany and Puglia, so consider early morning or late evening ceremonies.",
  },
  {
    q: "Do I need a civil or religious ceremony in Italy?",
    a: "Both options are available. Civil ceremonies at the Comune (town hall) are legally binding in Italy. Religious ceremonies require additional legal paperwork. Many couples opt for a symbolic ceremony abroad followed by a legal ceremony at home.",
  },
  {
    q: "How far in advance should I book an Italian venue?",
    a: "Our top venues, particularly those in Tuscany, Lake Como and the Amalfi Coast, book 18–24 months in advance for peak season dates. We recommend beginning your venue search at least 18 months before your intended wedding date.",
  },
  {
    q: "What is the average cost of an Italian wedding venue?",
    a: "Premium exclusive-use villa estates typically range from £12,000 to £35,000 for venue hire alone, excluding catering, florals and accommodation. Intimate properties in Puglia and Umbria can be more accessible from £8,000.",
  },
];

const REGIONS = [
  "Tuscany", "Lake Como", "Venice", "Amalfi Coast",
  "Puglia", "Sicily", "Rome", "Umbria",
];

const STATS = [
  { val: "142",   label: "Curated venues" },
  { val: "9",     label: "Italian regions" },
  { val: "18–24mo", label: "Avg. booking lead" },
  { val: "100%",  label: "Personally verified" },
];

export default function SEOBlock() {
  const C = useTheme();
  const [openFaq, setOpenFaq]       = useState(null);
  const [hovRegion, setHovRegion]   = useState(null);

  return (
    <section
      aria-label="Italian wedding planning guide and FAQ"
      style={{ background: C.dark, borderTop: `1px solid ${C.border}` }}
    >
      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 48px" }}
      >
        <div className="lwd-seoblock-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>

          {/* ── Left: editorial ── */}
          <div>
            <div
              aria-hidden="true"
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}
            >
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.18)" }} />
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                Planning Guide
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: 38,
                fontWeight: 400,
                color: C.white,
                lineHeight: 1.15,
                marginBottom: 24,
                letterSpacing: "-0.3px",
              }}
            >
              Planning Your
              <br />
              <em style={{ fontStyle: "italic" }}>Italian Wedding</em>
            </h2>

            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 1,
                background: "rgba(255,255,255,0.08)",
                marginBottom: 28,
              }}
            />

            <p
              style={{
                fontSize: 14,
                color: C.grey,
                lineHeight: 1.85,
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                marginBottom: 18,
              }}
            >
              Italy's enduring appeal as a wedding destination lies not just in its beauty, but in
              its culture. A country that has celebrated love, feasting and family for millennia, it
              brings an unparalleled depth to any wedding celebration.
            </p>
            <p
              style={{
                fontSize: 14,
                color: C.grey,
                lineHeight: 1.85,
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                marginBottom: 18,
              }}
            >
              Whether you dream of a candlelit dinner among Brunello vines, a ceremony on a
              clifftop above the Mediterranean, or a black-tie reception in a Venetian palazzo,
              Italy holds a setting for every vision and every scale.
            </p>
            <p
              style={{
                fontSize: 14,
                color: C.grey,
                lineHeight: 1.85,
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                marginBottom: 36,
              }}
            >
              Our editorial team has personally visited every venue in this collection. We negotiate
              on your behalf with venue owners, recommend the finest local suppliers, and provide the
              legal guidance needed to marry in Italy with confidence.
            </p>

            {/* Region quick links */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: C.grey,
                  marginBottom: 14,
                  fontFamily: "var(--font-body)",
                }}
              >
                Explore by Region
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {REGIONS.map((r) => (
                  <span
                    key={r}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHovRegion(r)}
                    onMouseLeave={() => setHovRegion(null)}
                    onKeyDown={(e) => e.key === "Enter" && setHovRegion(r)}
                    style={{
                      fontSize: 12,
                      color: hovRegion === r ? C.gold : C.white,
                      background: C.card,
                      border: `1px solid ${hovRegion === r ? C.gold : C.border}`,
                      borderRadius: "var(--lwd-radius-input)",
                      padding: "6px 14px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: FAQ ── */}
          <div>
            <div
              aria-hidden="true"
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}
            >
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.18)" }} />
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                FAQ
              </span>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: 30,
                fontWeight: 400,
                color: C.white,
                lineHeight: 1.2,
                marginBottom: 32,
              }}
            >
              Common Questions
            </h3>

            <div role="list">
              {FAQS.map((f, i) => (
                <div
                  key={i}
                  role="listitem"
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    borderBottom: i === FAQS.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <button
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "20px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      gap: 12,
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: C.white,
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {f.q}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        color: C.gold,
                        fontSize: 18,
                        flexShrink: 0,
                        transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.3s",
                      }}
                    >
                      +
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-label={f.q}
                    hidden={openFaq !== i}
                    style={{
                      padding: openFaq === i ? "0 0 20px" : "0",
                      fontSize: 13,
                      color: C.grey,
                      lineHeight: 1.8,
                      fontFamily: "var(--font-body)",
                      fontWeight: 300,
                      display: openFaq === i ? "block" : "none",
                    }}
                  >
                    {f.a}
                  </div>
                </div>
              ))}
            </div>

            {/* Key stats */}
            <div
              style={{
                marginTop: 40,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
              aria-label="Key statistics"
            >
              {STATS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 20px",
                    border: `1px solid ${C.border}`,
                    background: C.card,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-heading-primary)",
                      fontSize: 28,
                      color: C.white,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: C.grey,
                      marginTop: 6,
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
