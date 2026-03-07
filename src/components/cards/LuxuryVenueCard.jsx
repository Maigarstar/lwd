// ─── src/components/cards/LuxuryVenueCard.jsx ─────────────────────────────────
// Exact copy of PlannerCard GridCard — full-bleed swipeable media, cinematic
// gradient, content overlaid at bottom. Venue data swapped in for planner data.

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";
import EnquiryFormModal from "../ui/EnquiryFormModal";
import QuickViewModal from "../modals/QuickViewModal";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";

export default function LuxuryVenueCard({ v, onView, isMobile }) {
  const C = useTheme();
  const [hov, setHov]               = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [slideIdx, setSlideIdx]      = useState(0);
  const [muted, setMuted]            = useState(true);
  const cardRef  = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const videoRefs = useRef({});

  // ── Build media array: images first, video last ──
  const allMedia = (() => {
    const items = [];
    (v.imgs || []).forEach((src) => items.push({ type: "image", src }));
    if (v.videoUrl) items.push({ type: "video", src: v.videoUrl });
    return items.length > 0 ? items : [{ type: "image", src: "" }];
  })();

  const mediaCount  = allMedia.length;
  const hasMultiple = mediaCount > 1;
  const hasVideo    = allMedia.some((m) => m.type === "video");

  // ── Track visibility to pause video and close Quick View ──
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.3;
        setIsVisible(visible);
        // Close Quick View and reset sound when card leaves viewport
        if (!visible) {
          setQuickViewItem(null);
          setMuted(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, vid]) => {
      if (!vid) return;
      vid.muted = muted;
      if (parseInt(idx) === slideIdx && isVisible) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [slideIdx, isVisible, muted]);

  // ── Navigation ──
  const goTo   = useCallback((idx) => setSlideIdx(Math.max(0, Math.min(idx, mediaCount - 1))), [mediaCount]);
  const goNext = useCallback(() => goTo(slideIdx < mediaCount - 1 ? slideIdx + 1 : 0), [slideIdx, mediaCount, goTo]);
  const goPrev = useCallback(() => goTo(slideIdx > 0 ? slideIdx - 1 : mediaCount - 1), [slideIdx, mediaCount, goTo]);

  // ── Touch ──
  const onTouchStart = useCallback((e) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, swiping: false, isDrag: false };
  }, []);
  const onTouchMove = useCallback((e) => {
    if (!touchRef.current.startX) return;
    const dx = Math.abs(e.touches[0].clientX - touchRef.current.startX);
    const dy = Math.abs(e.touches[0].clientY - touchRef.current.startY);
    if (dx > dy && dx > 10) { touchRef.current.swiping = true; e.preventDefault(); }
  }, []);
  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current.swiping) return;
    const diff = touchRef.current.startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? goNext() : goPrev(); }
    touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, [goNext, goPrev]);

  // ── Mouse drag ──
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    touchRef.current = { startX: e.clientX, startY: e.clientY, swiping: false, isDrag: true };
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e) => {
    if (!touchRef.current.isDrag) return;
    if (Math.abs(e.clientX - touchRef.current.startX) > 8) touchRef.current.swiping = true;
  }, []);
  const onMouseUp = useCallback((e) => {
    if (!touchRef.current.isDrag) return;
    const diff = touchRef.current.startX - e.clientX;
    if (touchRef.current.swiping && Math.abs(diff) > 40) { diff > 0 ? goNext() : goPrev(); }
    touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, [goNext, goPrev]);
  const onMouseLeaveMedia = useCallback(() => {
    if (touchRef.current.isDrag) touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, []);

  const handleImageClick = useCallback((e) => {
    e.stopPropagation();
    if (touchRef.current.swiping) return;
    goNext();
  }, [goNext]);

  return (
    <article
      ref={cardRef}
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        position:        "relative",
        borderRadius:    isMobile ? 0 : "var(--lwd-radius-card)",
        overflow:        "hidden",
        cursor:          "pointer",
        transition:      "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transform:       hov && !isMobile ? "translateY(-4px)" : "translateY(0)",
        boxShadow:       hov && !isMobile ? "0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(201,168,76,0.08)" : "0 2px 12px rgba(0,0,0,0.1)",
        scrollSnapAlign: "start",
        scrollMarginTop: 0,
        margin:          isMobile ? 0 : undefined,
        height:          isMobile ? "calc(100dvh - 10px)" : 560,
        minHeight:       isMobile ? "calc(100dvh - 10px)" : 520,
        maxHeight:       isMobile ? "calc(100dvh - 10px)" : 580,
      }}
    >
      {/* ── Full-bleed swipeable media ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeaveMedia}
        onClick={handleImageClick}
        style={{
          position:   "absolute",
          inset:      0,
          overflow:   "hidden",
          background: "#0a0806",
          cursor:     hasMultiple ? "grab" : "default",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display:    "flex",
            width:      `${mediaCount * 100}%`,
            height:     "100%",
            transform:  `translateX(-${(slideIdx * 100) / mediaCount}%)`,
            transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {allMedia.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              style={{ width: `${100 / mediaCount}%`, height: "100%", flexShrink: 0, position: "relative", overflow: "hidden" }}
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={i === 0 ? `${v.name} – ${v.city}, ${v.region}` : `${v.name} photo ${i + 1}`}
                  loading="lazy"
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    transform:  hov && i === slideIdx ? "scale(1.03)" : "scale(1)",
                    transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                />
              ) : (
                <>
                  {v.imgs?.[0] && (
                    <img src={v.imgs[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={item.src} muted={muted} loop playsInline preload="metadata"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: slideIdx === i ? 1 : 0, transition: "opacity 0.6s ease" }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cinematic gradient ── */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          background:    "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
          zIndex:        1,
        }}
      />

      {/* ── Top badges ── */}
      {v.tag && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
          <GoldBadge text={v.tag} />
        </div>
      )}
      {v.verified && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4 }}>
          <VerifiedBadge />
        </div>
      )}

      {/* ── Swipe hint on hover ── */}
      {hov && hasMultiple && (
        <div
          style={{
            position: "absolute", top: v.verified ? 44 : 12, right: 12, zIndex: 4,
            padding: "5px 10px", borderRadius: 12, background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)", color: "#fff", fontSize: 9, fontFamily: NU,
            fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Swipe
        </div>
      )}


      {/* ── Dot indicators ── */}
      {hasMultiple && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
            zIndex: 5, display: "flex", alignItems: "center", gap: 5,
            padding: "4px 8px", borderRadius: 12,
            background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
          }}
        >
          {allMedia.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: slideIdx === i ? 18 : 6, height: 6, borderRadius: 3,
                background: slideIdx === i ? GOLD : "rgba(255,255,255,0.45)",
                border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Prev/Next arrows removed — SliderNav handles left/right nav ── */}
      {/* Image navigation via swipe/drag + dot indicators above */}

      {/* ── Mute toggle on video slide ── */}
      {hasVideo && allMedia[slideIdx]?.type === "video" && (
        <button
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            position: "absolute", top: isMobile ? 56 : 48, right: 12, zIndex: 5,
            width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)",
            color: muted ? "rgba(255,255,255,0.5)" : "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* ── Content overlaid at bottom ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          zIndex: 2, padding: isMobile ? "20px 16px 16px" : "20px 18px 18px",
        }}
      >
        {/* Name */}
        <div
          onClick={() => onView?.(v)}
          style={{
            fontFamily: GD, fontSize: isMobile ? 22 : 20, fontWeight: 500,
            fontStyle: "italic", color: "#ffffff", lineHeight: 1.2,
            marginBottom: 3, textShadow: "0 1px 4px rgba(0,0,0,0.3)", cursor: "pointer",
          }}
        >
          {v.name}
        </div>

        {/* Location */}
        <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
          {v.city}, {v.region}
        </div>

        {/* Style tier + Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {v.styles?.[0] && (
            <span
              style={{
                fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 20, padding: "3px 10px",
              }}
            >
              {v.styles[0]}
            </span>
          )}
          {v.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars r={v.rating} />
              <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                {v.rating} ({v.reviews})
              </span>
            </div>
          )}
        </div>

        {/* Capacity badge (venue-specific, replaces social icons) */}
        {v.capacity && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14, padding: "3px 10px",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Up to {v.capacity} guests
            </span>
          </div>
        )}

        {/* Description */}
        <p
          style={{
            fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5, margin: "0 0 10px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
          {v.desc}
        </p>

        {/* Footer: price + CTAs */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontFamily: GD, fontSize: 20, fontWeight: 600, color: GOLD, lineHeight: 1 }}>
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.45)", marginRight: 4, letterSpacing: "0.3px" }}>From</span>
            {v.priceFrom}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setQuickViewItem(v); }}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--lwd-radius-input)", padding: "8px 12px",
                cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap",
              }}
            >
              QV
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: "#0f0d0a",
                background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border: "none", borderRadius: "var(--lwd-radius-input)",
                padding: "8px 14px", cursor: "pointer", transition: "opacity 0.25s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Enquire
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--lwd-radius-input)", padding: "8px 14px",
                cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap",
              }}
            >
              Profile ›
            </button>
          </div>
        </div>
      </div>

      {/* ── Enquiry modal ── */}
      {showEnquiry && (
        <EnquiryFormModal planner={v} onClose={() => setShowEnquiry(false)} />
      )}

      {/* ── Quick View modal ── */}
      {quickViewItem && (
        <QuickViewModal
          item={quickViewItem}
          onClose={() => setQuickViewItem(null)}
          onViewFull={() => {
            setQuickViewItem(null);
            onView?.(quickViewItem);
          }}
        />
      )}
    </article>
  );
}
