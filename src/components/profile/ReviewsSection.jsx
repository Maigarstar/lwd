import { useState } from "react";
import { useTheme, useIsMobile, Stars, SectionHeading, FB, FD } from "./ProfileDesignSystem";

export default function ReviewsSection({ testimonials, entity }) {
  const C = useTheme();
  const isMobile = useIsMobile();
  const PER_PAGE = 3;
  const pages = Math.ceil(testimonials.length / PER_PAGE);
  const [page, setPage] = useState(0);
  const visible = testimonials.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const navBtn = (dir) => ({
    width: 36, height: 36, borderRadius: "var(--lwd-radius-input)", border: `1px solid ${C.border2}`,
    background: "none", color: C.textMuted, cursor: "pointer",
    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s", flexShrink: 0,
  });

  const reviewCard = (r) => (
    <div key={r.id} style={{ padding: isMobile ? 20 : 24, border: `1px solid ${C.border}`, background: C.surface, borderTop: `3px solid ${C.gold}`, animation: "fadeUp 0.35s ease both", flex: isMobile ? "0 0 280px" : undefined, scrollSnapAlign: isMobile ? "start" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontSize: 16, color: C.gold, flexShrink: 0 }}>{r.avatar}</div>
        <div>
          <div style={{ fontFamily: FD, fontSize: 16, color: C.text }}>{r.names}</div>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>{r.date} · {r.location}</div>
        </div>
      </div>
      <Stars rating={r.rating} size={12} />
      <p style={{ fontFamily: FB, fontSize: 13, color: C.textMid, lineHeight: 1.75, marginTop: 12, ...(isMobile ? { display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}) }}>{r.text}</p>
      <div style={{ marginTop: 14 }}>
        <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Verified Review</span>
      </div>
    </div>
  );

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Reviews" />

      {/* Summary bar with star distribution */}
      <div className="vp-reviews-summary" style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "200px 1fr", gap: isMobile ? 20 : 40, marginBottom: 28, padding: isMobile ? 20 : 32, border: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ textAlign: "center", borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : "none", paddingRight: isMobile ? 0 : 40, paddingBottom: isMobile ? 16 : 0 }}>
          <div style={{ fontFamily: FD, fontSize: isMobile ? 56 : 78, fontWeight: 400, color: C.gold, lineHeight: 1 }}>{entity.rating}</div>
          <Stars rating={entity.rating} size={18} />
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginTop: 8 }}>{entity.reviews} verified reviews</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          {[5,4,3,2,1].map(star => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, width: 16 }}>{star}</span>
              <span style={{ fontSize: 11, color: C.gold }}>★</span>
              <div style={{ flex: 1, height: 6, background: C.border, overflow: "hidden" }}>
                <div style={{ width: star === 5 ? "89%" : star === 4 ? "8%" : "3%", height: "100%", background: C.gold, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, width: 28 }}>{star === 5 ? "113" : star === 4 ? "10" : "4"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      {isMobile ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginBottom: 20, scrollbarWidth: "none", msOverflowStyle: "none" }} className="vp-reviews-slider">
          {testimonials.map(reviewCard)}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            {visible.map(reviewCard)}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  width: i === page ? 20 : 8, height: 8, borderRadius: 4,
                  background: i === page ? C.gold : C.border2,
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>
                {page * PER_PAGE + 1}–{Math.min(page * PER_PAGE + PER_PAGE, testimonials.length)} of {testimonials.length}
              </span>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ ...navBtn(), opacity: page === 0 ? 0.35 : 1 }}
              >←</button>
              <button
                onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                disabled={page === pages - 1}
                style={{ ...navBtn(), opacity: page === pages - 1 ? 0.35 : 1 }}
              >→</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
