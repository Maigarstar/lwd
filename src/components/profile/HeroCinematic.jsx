import { useState, useEffect } from "react";
import { useTheme, useIsMobile, Stars, FB, FD } from "./ProfileDesignSystem";

function HeroSlider({ imgs, height, children }) {
  const C = useTheme();
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) return;
    const t = setInterval(() => setIdx(i => (i + 1) % imgs.length), 5000);
    return () => clearInterval(t);
  }, [hovered, imgs.length]);

  return (
    <div style={{ position: "relative", height, overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {imgs.map((img, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: i === idx ? 1 : 0,
          animation: i === idx ? "kenBurns 8s ease forwards" : "none",
          transition: "opacity 1.2s ease",
        }} />
      ))}
      {children}
      {[{ dir: "←", l: 16, r: "auto" }, { dir: "→", l: "auto", r: 16 }].map(a => (
        <button key={a.dir}
          onClick={() => setIdx(i => a.dir === "←" ? (i - 1 + imgs.length) % imgs.length : (i + 1) % imgs.length)}
          style={{
            position: "absolute", top: "50%", left: a.l, right: a.r,
            transform: "translateY(-50%)", width: 40, height: 40,
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--lwd-radius-input)",
            background: "rgba(0,0,0,0.22)",
            backdropFilter: "blur(8px)", color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{a.dir}</button>
      ))}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
        {imgs.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 20 : 6, height: 6, border: "none", cursor: "pointer",
            background: i === idx ? C.gold : "rgba(255,255,255,0.5)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

export default function HeroCinematic({ entity, onEnquire, featured = true }) {
  const C = useTheme();
  const imgs = entity.imgs || [];

  return (
    <div style={{ position: "relative" }}>
      <HeroSlider imgs={imgs} height="62vh">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 52px", animation: "fadeUp 0.8s ease both" }}>
          {featured && (
            <div style={{ display: "inline-flex", marginBottom: 12, padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(157,135,62,0.18)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
            </div>
          )}
          <h1 style={{ fontFamily: FD, fontSize: "clamp(38px, 5.3vw, 68px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.05, marginBottom: 12 }}>{entity.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{entity.flag || "📍"} {entity.location}</span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />
            <Stars rating={entity.rating} size={13} />
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{entity.rating}</span>
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>({entity.reviews} reviews)</span>
            {entity.verified && <span style={{ fontFamily: FB, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ LWD Verified</span>}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={onEnquire} style={{
              padding: "14px 28px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800,
              letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Check Availability →</button>
            <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
              From {entity.priceFrom} · Replies in {entity.responseTime}
            </span>
          </div>
        </div>
      </HeroSlider>
    </div>
  );
}
