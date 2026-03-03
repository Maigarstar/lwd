// ─── src/components/ui/MediaGalleryModal.jsx ───────────────────────────────────
// Full-screen media gallery lightbox. Displays images + optional video
// with left/right arrow navigation, dot indicators, and swipe support.

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── Arrow button ──────────────────────────────────────────────────────────────
function ArrowBtn({ dir, onClick, isMobile }) {
  const [hov, setHov] = useState(false);
  const isLeft = dir === "left";
  return (
    <button
      aria-label={isLeft ? "Previous" : "Next"}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:       "absolute",
        top:            "50%",
        [isLeft ? "left" : "right"]: isMobile ? 8 : 20,
        transform:      "translateY(-50%)",
        zIndex:         20,
        width:          isMobile ? 40 : 48,
        height:         isMobile ? 40 : 48,
        borderRadius:   "50%",
        background:     hov ? "rgba(201,168,76,0.25)" : "rgba(0,0,0,0.55)",
        border:         `1px solid ${hov ? GOLD : "rgba(255,255,255,0.2)"}`,
        color:          hov ? GOLD : "rgba(255,255,255,0.85)",
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       isMobile ? 20 : 24,
        transition:     "all 0.25s",
        backdropFilter: "blur(8px)",
      }}
    >
      {isLeft ? "\u2039" : "\u203A"}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MediaGalleryModal({ imgs = [], videoUrl, startIndex = 0, onClose, plannerName }) {
  // Build media items array: video first (if exists), then images
  const items = [];
  if (videoUrl) items.push({ type: "video", src: videoUrl });
  imgs.forEach((src) => items.push({ type: "image", src }));

  const [idx, setIdx] = useState(videoUrl ? startIndex + 1 : startIndex);
  const [isMobile, setIsMobile] = useState(false);
  const vidRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  setIdx((p) => (p - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") setIdx((p) => (p + 1) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, items.length]);

  // Auto-play video when navigating to a video slide
  useEffect(() => {
    if (items[idx]?.type === "video" && vidRef.current) {
      vidRef.current.play().catch(() => {});
    }
  }, [idx, items]);

  // Touch swipe support
  const touchStart = useRef(null);
  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setIdx((p) => (p + 1) % items.length);
      else setIdx((p) => (p - 1 + items.length) % items.length);
    }
    touchStart.current = null;
  }, [items.length]);

  if (!items.length) return null;
  const cur = items[idx];

  return createPortal(
    <div
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(0,0,0,0.92)",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        cursor:         "pointer",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close gallery"
        style={{
          position:     "absolute",
          top:          isMobile ? 12 : 20,
          right:        isMobile ? 12 : 20,
          zIndex:       30,
          width:        36,
          height:       36,
          borderRadius: "50%",
          background:   "rgba(0,0,0,0.5)",
          border:       "1px solid rgba(255,255,255,0.2)",
          color:        "#fff",
          fontSize:     18,
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        ✕
      </button>

      {/* Planner name header */}
      {plannerName && (
        <div
          style={{
            position:       "absolute",
            top:            isMobile ? 14 : 22,
            left:           isMobile ? 14 : 24,
            zIndex:         30,
            fontFamily:     NU,
            fontSize:       12,
            fontWeight:     600,
            letterSpacing:  "1px",
            textTransform:  "uppercase",
            color:          "rgba(255,255,255,0.5)",
          }}
        >
          {plannerName}
        </div>
      )}

      {/* Main media area */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:     "relative",
          width:        isMobile ? "96vw" : "min(85vw, 1100px)",
          height:       isMobile ? "65vh" : "min(75vh, 680px)",
          borderRadius: "var(--lwd-radius-card)",
          overflow:     "hidden",
          boxShadow:    "0 24px 80px rgba(0,0,0,0.5)",
          cursor:       "default",
        }}
      >
        {cur.type === "video" ? (
          <video
            ref={vidRef}
            key={cur.src}
            src={cur.src}
            muted
            loop
            playsInline
            controls
            style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
          />
        ) : (
          <img
            key={cur.src}
            src={cur.src}
            alt={`Gallery image ${idx + 1}`}
            style={{
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              background: "#0a0806",
              userSelect: "none",
            }}
          />
        )}

        {/* Video badge overlay */}
        {cur.type === "video" && (
          <div
            style={{
              position:     "absolute",
              top:          12,
              left:         12,
              padding:      "4px 10px",
              borderRadius: 12,
              background:   "rgba(201,168,76,0.85)",
              color:        "#0f0d0a",
              fontFamily:   NU,
              fontSize:     9,
              fontWeight:   700,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Video
          </div>
        )}

        {/* Left arrow */}
        {items.length > 1 && (
          <ArrowBtn
            dir="left"
            isMobile={isMobile}
            onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)}
          />
        )}

        {/* Right arrow */}
        {items.length > 1 && (
          <ArrowBtn
            dir="right"
            isMobile={isMobile}
            onClick={() => setIdx((p) => (p + 1) % items.length)}
          />
        )}
      </div>

      {/* Dot indicators + counter */}
      {items.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        8,
            marginTop:  16,
            cursor:     "default",
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              aria-label={`Go to ${item.type === "video" ? "video" : `image ${i + 1}`}`}
              onClick={() => setIdx(i)}
              style={{
                width:        i === idx ? 24 : 8,
                height:       8,
                borderRadius: 4,
                background:   i === idx ? GOLD : "rgba(255,255,255,0.3)",
                border:       "none",
                cursor:       "pointer",
                padding:      0,
                transition:   "all 0.3s ease",
              }}
            />
          ))}
          <span
            style={{
              fontFamily:    NU,
              fontSize:      11,
              color:         "rgba(255,255,255,0.4)",
              marginLeft:    8,
              letterSpacing: "1px",
            }}
          >
            {String(idx + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>,
    document.body
  );
}
