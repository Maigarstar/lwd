// ─── src/chat/AuraChatImageStrip.jsx ─────────────────────────────────────────
// Horizontal scrollable image strip that attaches to Aura's chat messages.
// Shown when Aura responds with visual context (venue images, style references).
// Tap any thumbnail → full-screen lightbox with prev/next navigation.
// Tracks: impressions on mount, taps on thumbnail, nav in lightbox.
// After 2+ lightbox views, fires onDiscovery() → Aura asks "show similar venues?"
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import {
  trackAuraImpressions,
  trackAuraTap,
  trackAuraLightboxView,
} from "../services/mediaEventService";
import ImageInteractionBar from "../components/media/ImageInteractionBar";

const GOLD      = "#C9A84C";
const GOLD_DIM  = "rgba(201,168,76,0.12)";

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose, onDiscovery }) {
  const [idx, setIdx]           = useState(startIndex ?? 0);
  const navCount                = useRef(0); // nav events (separate from open)
  const discoveryFired          = useRef(false);
  const img = images[idx];

  // Track lightbox nav (skip re-firing the open image — already tracked on tap)
  const prev = () => {
    const next = Math.max(0, idx - 1);
    if (next !== idx) {
      setIdx(next);
      trackAuraLightboxView(images[next]?.media_id, images[next]?.listing_id);
      navCount.current++;
      if (navCount.current >= 2 && !discoveryFired.current && onDiscovery) {
        discoveryFired.current = true;
        // Small delay — let them finish looking first
        setTimeout(() => onDiscovery(images[idx]), 1800);
      }
    }
  };
  const next = () => {
    const ni = Math.min(images.length - 1, idx + 1);
    if (ni !== idx) {
      setIdx(ni);
      trackAuraLightboxView(images[ni]?.media_id, images[ni]?.listing_id);
      navCount.current++;
      if (navCount.current >= 2 && !discoveryFired.current && onDiscovery) {
        discoveryFired.current = true;
        setTimeout(() => onDiscovery(images[ni]), 1800);
      }
    }
  };

  // Keyboard nav (uses same prev/next so tracking fires)
  const handleKey = (e) => {
    if (e.key === "ArrowLeft")  { e.stopPropagation(); prev(); }
    if (e.key === "ArrowRight") { e.stopPropagation(); next(); }
    if (e.key === "Escape")     onClose();
  };

  // Dot navigation also tracks
  const goTo = (i) => {
    if (i !== idx) {
      setIdx(i);
      trackAuraLightboxView(images[i]?.media_id, images[i]?.listing_id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
      style={{
        position: "fixed", inset: 0, zIndex: 1600,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 900, width: "100%",
          borderRadius: 14,
          overflow: "hidden",
          background: "#0f0d0a",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* Main image */}
        <div style={{ position: "relative", maxHeight: "70vh", overflow: "hidden" }}>
          <img
            src={img.url}
            alt={img.title || img.listing_name || ""}
            style={{ width: "100%", maxHeight: "70vh",
              objectFit: "cover", display: "block" }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 180,
            background: "linear-gradient(to top, rgba(15,13,10,0.96) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />
          {/* Info overlay */}
          <div style={{
            position: "absolute", bottom: 18, left: 22, right: 60,
          }}>
            {img.listing_name && (
              <div style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: 18, fontWeight: 600, fontStyle: "italic",
                color: "#F5F0E8", marginBottom: 4,
              }}>
                {img.listing_name}
              </div>
            )}
            {(img.region || img.country || img.category) && (
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 11,
                color: "rgba(245,240,232,0.50)",
                display: "flex", gap: 8, alignItems: "center",
              }}>
                {img.category && (
                  <span style={{
                    background: GOLD_DIM, color: GOLD,
                    border: `1px solid rgba(201,168,76,0.28)`,
                    borderRadius: 20, padding: "1px 8px",
                    fontSize: 9, letterSpacing: "0.8px",
                    textTransform: "uppercase", fontWeight: 700,
                  }}>
                    {img.category}
                  </span>
                )}
                {[img.region, img.country].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button onClick={prev} disabled={idx === 0}
              aria-label="Previous image"
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: idx === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                fontSize: 18, cursor: idx === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              ‹
            </button>
            <button onClick={next} disabled={idx === images.length - 1}
              aria-label="Next image"
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: idx === images.length - 1 ? "rgba(255,255,255,0.2)" : "#fff",
                fontSize: 18, cursor: idx === images.length - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              ›
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", gap: 5,
            padding: "10px 0 12px",
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                style={{
                  width: i === idx ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === idx ? GOLD : "rgba(255,255,255,0.2)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Like · Rate · Share bar */}
        <div style={{
          padding: "10px 18px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <ImageInteractionBar
            mediaId={img.media_id}
            listingId={img.listing_id}
            imageUrl={img.url}
            listingName={img.listing_name}
          />
        </div>

        {/* Close */}
        <button onClick={onClose} aria-label="Close lightbox"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          ×
        </button>
      </div>
    </div>
  );
}

// ── Strip ─────────────────────────────────────────────────────────────────────
export default function AuraChatImageStrip({ images, onDiscovery }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Track impressions once on mount
  useEffect(() => {
    if (images?.length) trackAuraImpressions(images);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  if (!images?.length) return null;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // Check on mount
  const onMount = (el) => {
    if (!el) return;
    scrollRef.current = el;
    setCanScrollRight(el.scrollWidth > el.clientWidth + 4);
  };

  return (
    <>
      <div style={{ position: "relative", marginTop: 8 }}>
        {/* Scrollable row */}
        <div
          ref={onMount}
          onScroll={handleScroll}
          style={{
            display: "flex", gap: 8, overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: 2,
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.media_id || img.url || i}
              onClick={() => {
                trackAuraTap(img.media_id, img.listing_id);
                setLightboxIdx(i);
              }}
              aria-label={`View image: ${img.title || img.listing_name || "image"}`}
              style={{
                flexShrink: 0,
                width: 110,
                height: 78,
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                scrollSnapAlign: "start",
                border: "1px solid rgba(201,168,76,0.14)",
                cursor: "pointer",
                padding: 0,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <img
                src={img.url}
                alt={img.title || img.listing_name || ""}
                style={{ width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  transition: "transform 0.25s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                loading="lazy"
              />
              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(201,168,76,0)", borderRadius: 8,
                transition: "background 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0)"}
              />
              {/* Name overlay on last chip */}
              {img.listing_name && i === 0 && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "3px 6px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)",
                  fontFamily: "var(--font-body)", fontSize: 8,
                  color: "rgba(255,255,255,0.80)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {img.listing_name}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right fade + "more" hint */}
        {canScrollRight && (
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0,
            width: 28,
            background: "linear-gradient(to right, transparent, rgba(15,15,15,0.85))",
            pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: 4,
          }}>
            <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 10 }}>›</span>
          </div>
        )}
      </div>

      {/* "Tap to view" hint */}
      <div style={{
        fontFamily: "var(--font-body)", fontSize: 9,
        color: "rgba(255,255,255,0.30)",
        letterSpacing: "0.5px", marginTop: 5,
      }}>
        {images.length > 1
          ? `Tap any image to view full gallery · ${images.length} images`
          : "Tap to view full image"}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onDiscovery={onDiscovery}
        />
      )}
    </>
  );
}
