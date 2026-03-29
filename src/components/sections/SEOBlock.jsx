// ─── src/components/sections/SEOBlock.jsx ────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

// Generate location-aware FAQs from the location name + evergreenContent
function buildFaqs(locationName) {
  return [
    {
      q: `When is the best time to get married in ${locationName}?`,
      a: `The ideal season varies by destination. We recommend consulting with our local experts who can advise on weather patterns, peak availability and local considerations specific to ${locationName}.`,
    },
    {
      q: `How far in advance should I book a ${locationName} venue?`,
      a: `Our most sought-after venues in ${locationName} typically book 18–24 months in advance for peak season dates. We recommend beginning your venue search at least 18 months before your intended wedding date.`,
    },
    {
      q: `Do I need a local or symbolic ceremony in ${locationName}?`,
      a: `Requirements vary by country. Many couples opt for a symbolic ceremony at the destination, making it truly special, followed by a legal ceremony at home. Our team can advise on the exact legal requirements for ${locationName}.`,
    },
    {
      q: `What is the average cost of a luxury wedding venue in ${locationName}?`,
      a: `Premium exclusive-use venues in ${locationName} typically range from £10,000 to £40,000 for venue hire alone, excluding catering, florals and accommodation. Pricing varies significantly by location and season.`,
    },
  ];
}

export default function SEOBlock({ title, seoHeading, content, regionNames = [], venueCount, regionCount, faqs }) {
  const C = useTheme();
  const [openFaq, setOpenFaq]     = useState(null);
  const [hovRegion, setHovRegion] = useState(null);

  const locationName = title || "this destination";
  // seoHeading overrides the full title; otherwise auto-generate from locationName
  const displayHeading = seoHeading || `Planning Your ${locationName} Wedding`;
  const displayFaqs = faqs && faqs.length > 0 ? faqs : buildFaqs(locationName);

  const STATS = [
    { val: venueCount != null ? String(venueCount) : "—", label: "Curated venues" },
    { val: regionCount != null ? String(regionCount) : "—", label: "Regions covered" },
    { val: "18–24mo", label: "Avg. booking lead" },
    { val: "100%",    label: "Personally verified" },
  ];

  return (
    <section
      aria-label={`${locationName} wedding planning guide and FAQ`}
      style={{ background: C.dark, borderTop: `1px solid ${C.border}` }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 48px" }}>
        <div className="lwd-seoblock-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>

          {/* ── Left: editorial ── */}
          <div>
            <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.18)" }} />
              <span style={{ fontSize: 9, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 700, fontFamily: "var(--font-body)" }}>
                Planning Guide
              </span>
            </div>

            <h2 style={{ fontFamily: "var(--font-heading-primary)", fontSize: 38, fontWeight: 400, color: C.white, lineHeight: 1.15, marginBottom: 24, letterSpacing: "-0.3px" }}>
              <em style={{ fontStyle: "italic" }}>{displayHeading}</em>
            </h2>

            <div aria-hidden="true" style={{ width: 40, height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 28 }} />

            {(() => {
              const paraStyle = { fontSize: 14, color: C.grey, lineHeight: 1.85, fontFamily: "var(--font-body)", fontWeight: 300, marginBottom: 18 };
              const isHtml = content && /<[a-z][\s\S]*>/i.test(content);
              if (isHtml) {
                return (
                  <div
                    style={{ ...paraStyle, marginBottom: 36 }}
                    dangerouslySetInnerHTML={{ __html: content }}
                    className="lwd-seo-prose"
                  />
                );
              }
              const paras = content
                ? content.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 3)
                : [`Our editorial team has personally visited every venue in this collection. We negotiate on your behalf with venue owners, recommend the finest local suppliers, and provide the guidance needed to plan your wedding in ${locationName} with confidence.`];
              return paras.map((p, i) => (
                <p key={i} style={{ ...paraStyle, marginBottom: i === paras.length - 1 ? 36 : 18 }}>{p}</p>
              ));
            })()}

            {/* Region quick links */}
            {regionNames.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.grey, marginBottom: 14, fontFamily: "var(--font-body)" }}>
                  Explore by Region
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {regionNames.map((r) => (
                    <span
                      key={r}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setHovRegion(r)}
                      onMouseLeave={() => setHovRegion(null)}
                      onKeyDown={(e) => e.key === "Enter" && setHovRegion(r)}
                      style={{ fontSize: 12, color: hovRegion === r ? C.gold : C.white, background: C.card, border: `1px solid ${hovRegion === r ? C.gold : C.border}`, borderRadius: "var(--lwd-radius-input)", padding: "6px 14px", cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)" }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: FAQ ── */}
          <div>
            <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.18)" }} />
              <span style={{ fontSize: 9, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 700, fontFamily: "var(--font-body)" }}>
                FAQ
              </span>
            </div>

            <h3 style={{ fontFamily: "var(--font-heading-primary)", fontSize: 30, fontWeight: 400, color: C.white, lineHeight: 1.2, marginBottom: 32 }}>
              Common Questions
            </h3>

            <div role="list">
              {displayFaqs.map((f, i) => (
                <div key={i} role="listitem" style={{ borderTop: `1px solid ${C.border}`, borderBottom: i === displayFaqs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <button
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", background: "none", border: "none", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit", gap: 12, textAlign: "left" }}
                  >
                    <span style={{ fontSize: 14, color: C.white, fontFamily: "var(--font-body)", fontWeight: 500, lineHeight: 1.4 }}>{f.q}</span>
                    <span aria-hidden="true" style={{ color: C.gold, fontSize: 18, flexShrink: 0, transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>+</span>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-label={f.q}
                    hidden={openFaq !== i}
                    style={{ padding: openFaq === i ? "0 0 20px" : "0", fontSize: 13, color: C.grey, lineHeight: 1.8, fontFamily: "var(--font-body)", fontWeight: 300, display: openFaq === i ? "block" : "none" }}
                  >
                    {f.a}
                  </div>
                </div>
              ))}
            </div>

            {/* Key stats */}
            <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} aria-label="Key statistics">
              {STATS.map((s, i) => (
                <div key={i} style={{ padding: "16px 20px", border: `1px solid ${C.border}`, background: C.card }}>
                  <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 28, color: C.white, fontWeight: 600, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginTop: 6, fontFamily: "var(--font-body)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
