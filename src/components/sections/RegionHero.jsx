// ════════════════════════════════════════════════════════════════════════════════
// RegionHero.jsx - Premium Hero Section for Region Pages
// Renders customizable hero content: title, intro, image, and stats
// Data-driven from regionPageConfig
// ════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useInView, revealStyle } from "../ui/Animations";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function RegionHero({ config, region, C }) {
  if (!config || !region) return null;

  const { title, intro, image, stats } = config;
  const heroImage = image || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

  const [inView, setInView] = useState(true); // Hero is above-the-fold, visible immediately
  const ref = useInView((isVisible) => setInView(isVisible), 0.2);

  return (
    <section ref={ref} style={{ position: "relative", overflow: "hidden", marginBottom: 60 }}>
      {/* Hero Background Image */}
      <div
        style={{
          position: "relative",
          height: "500px",
          background: `url('${heroImage}') center/cover no-repeat`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Dark overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 1,
          }}
        />

        {/* Hero Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: "800px",
            padding: "40px 20px",
            color: "#fff",
          }}
        >
          {/* Title */}
          {title && (
            <h1
              style={{
                fontFamily: GD,
                fontSize: "clamp(32px, 8vw, 56px)",
                fontWeight: 400,
                margin: "0 0 16px 0",
                lineHeight: 1.2,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.8s ease 0.2s",
              }}
            >
              {title}
            </h1>
          )}

          {/* Intro */}
          {intro && (
            <p
              style={{
                fontFamily: NU,
                fontSize: "clamp(14px, 3vw, 18px)",
                fontWeight: 300,
                margin: 0,
                lineHeight: 1.6,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.8s ease 0.4s",
              }}
            >
              {intro}
            </p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats && stats.some((s) => s.label || s.value) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 24,
            maxWidth: "1200px",
            margin: "-40px auto 60px",
            padding: "40px 20px",
            position: "relative",
            zIndex: 3,
            background: "transparent",
          }}
        >
          {stats.map((stat, idx) =>
            stat.label || stat.value ? (
              <div
                key={idx}
                style={{
                  textAlign: "center",
                  padding: "24px 20px",
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  backdropFilter: "blur(10px)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.8s ease ${0.2 + idx * 0.15}s`,
                }}
              >
                {stat.value && (
                  <div
                    style={{
                      fontFamily: GD,
                      fontSize: "32px",
                      fontWeight: 400,
                      color: C.gold,
                      margin: "0 0 8px 0",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                )}
                {stat.label && (
                  <div
                    style={{
                      fontFamily: NU,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.grey2,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: 0,
                    }}
                  >
                    {stat.label}
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      )}
    </section>
  );
}
