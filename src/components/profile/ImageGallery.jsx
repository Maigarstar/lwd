import { useState, useRef } from "react";
import { useTheme, useIsMobile, SectionHeading, FB } from "./ProfileDesignSystem";

export default function ImageGallery({ gallery, onOpenLight }) {
  const C = useTheme();
  const isMobile = useIsMobile();
  const [allOpen, setAllOpen] = useState(false);
  const scrollRef = useRef(null);
  const preview = gallery.slice(0, 6);
  const remaining = gallery.length - 5;

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Gallery" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginTop: -24 }}>
        <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.3px" }}>{gallery.length} photographs</span>
      </div>

      {isMobile && !allOpen && (
        <div>
          <div ref={scrollRef} className="vp-gallery-slider" style={{
            display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
            marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
          }}>
            {preview.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                flex: "0 0 280px", scrollSnapAlign: "start",
                overflow: "hidden", cursor: "pointer", position: "relative",
                borderRadius: 3, height: 340,
              }}>
                <img src={img.src} alt={img.alt || ""} loading="lazy" style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                }} />
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                  borderRadius: 20, padding: "3px 10px",
                  fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.5px",
                }}>{i + 1} / {gallery.length}</div>
              </div>
            ))}
            <div onClick={() => setAllOpen(true)} style={{
              flex: "0 0 180px", scrollSnapAlign: "start",
              borderRadius: 3, height: 340, cursor: "pointer",
              background: C.surface, border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 36, color: C.gold, fontWeight: 400, lineHeight: 1 }}>+{remaining}</div>
              <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>View all</div>
            </div>
          </div>
        </div>
      )}

      {!isMobile && !allOpen && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 6 }}>
            <div onClick={() => onOpenLight(0)} style={{
              gridRow: "1 / 3", overflow: "hidden", cursor: "pointer",
              position: "relative", minHeight: 360,
            }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[0]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => onOpenLight(1)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[1]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => setAllOpen(true)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[2]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
              }}>
                <span style={{ fontFamily: "var(--font-heading-primary)", fontSize: 32, color: "#fff", fontWeight: 400 }}>+{gallery.length - 3}</span>
                <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: "1px", textTransform: "uppercase" }}>View all photos</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setAllOpen(true)} style={{
              background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
              color: C.textLight, fontFamily: FB, fontSize: 12, fontWeight: 600,
              padding: "8px 18px", cursor: "pointer", letterSpacing: "0.3px",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textLight; }}>
              View all {gallery.length} photographs →
            </button>
          </div>
        </div>
      )}

      {allOpen && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ columns: isMobile ? 2 : 3, columnGap: 6, marginBottom: 16 }}>
            {gallery.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer",
                borderRadius: 2,
              }}
                onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
                <img src={img.src} alt="" loading="lazy" style={{ width: "100%", display: "block", transition: "transform 0.7s ease" }} />
              </div>
            ))}
          </div>
          <button onClick={() => setAllOpen(false)} style={{
            background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            color: C.textLight, fontFamily: FB, fontSize: 12,
            padding: "8px 18px", cursor: "pointer",
          }}>← Show less</button>
        </div>
      )}
    </section>
  );
}
