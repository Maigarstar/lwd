import { useState } from "react";
import { useTheme, SectionHeading, FB, FD } from "./ProfileDesignSystem";

export default function FAQSection({ faqData, onAsk }) {
  const C = useTheme();
  const [openItems, setOpenItems] = useState({});

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!faqData || faqData.length === 0) return null;

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading
        title={`Your Guide to ${faqData[0]?.venueName || "Our Service"}`}
        subtitle="Curated answers to every question"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {faqData.map((cat, catIdx) => (
          <div key={cat.category} style={{
            background: C.bgAlt,
            border: `1px solid ${C.border}`,
            padding: "24px 28px",
          }}>
            {/* Category label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: 16, paddingBottom: 14,
              borderBottom: `1px solid ${C.goldBorder}`,
            }}>
              <span style={{
                fontFamily: FD,
                fontSize: 11,
                color: C.gold,
                letterSpacing: "2px",
                minWidth: 24,
                textAlign: "center",
                opacity: 0.9,
              }}>{cat.icon}</span>
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "1.8px", textTransform: "uppercase" }}>{cat.category}</span>
            </div>

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cat.questions.map((item, qIdx) => {
                const isOpen = openItems[`${catIdx}-${qIdx}`];
                return (
                  <div key={qIdx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => toggle(catIdx, qIdx)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 16,
                        padding: "21px 0", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left",
                        transition: "opacity 0.15s",
                      }}
                    >
                      <span style={{
                        fontFamily: FB, fontSize: 14, fontWeight: 600,
                        color: isOpen ? C.gold : C.text,
                        lineHeight: 1.4, flex: 1,
                        transition: "color 0.2s",
                      }}>{item.q}</span>
                      <span style={{
                        fontSize: 18, color: isOpen ? C.gold : C.textMuted,
                        flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease, color 0.2s",
                        display: "inline-block", fontWeight: 300,
                        lineHeight: 1,
                      }}>+</span>
                    </button>

                    <div style={{
                      overflow: "hidden",
                      maxHeight: isOpen ? 300 : 0,
                      transition: "max-height 0.4s ease",
                    }}>
                      <p style={{
                        fontFamily: FB, fontSize: 14, color: C.textLight,
                        lineHeight: 1.8, paddingBottom: 18,
                        margin: 0, paddingRight: 32,
                      }}>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CTA at bottom */}
      <div style={{
        marginTop: 32, padding: "20px 24px",
        background: C.goldLight, border: `1px solid ${C.goldBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 17, color: C.text, marginBottom: 4 }}>Still have a question?</div>
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>Our team responds within 2 hours, we'd love to help.</div>
        </div>
        <button style={{
          padding: "11px 24px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
          color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
          letterSpacing: "0.8px", textTransform: "uppercase", cursor: "pointer",
          flexShrink: 0, transition: "opacity 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onClick={onAsk}>Ask a question →</button>
      </div>
    </section>
  );
}
