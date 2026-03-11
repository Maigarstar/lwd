// ─── src/components/modals/QuickViewModal.jsx ─────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import LoginGateModal from "./LoginGateModal";

// ── URL helpers ───────────────────────────────────────────────────────────────
const extractYouTubeId = (url) => {
  const m = url?.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m?.[1] || null;
};

const extractVimeoId = (url) =>
  url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || null;

// Determine the kind of a media URL
const mediaKind = (url) => {
  if (!url) return "unknown";
  if (extractYouTubeId(url)) return "youtube";
  if (extractVimeoId(url))   return "vimeo";
  return "direct"; // direct mp4 / webm etc.
};

// ── Arrow button style helper ─────────────────────────────────────────────────
function navBtn(side) {
  return {
    position:       "absolute",
    top:            "50%",
    [side]:         14,
    transform:      "translateY(-50%)",
    zIndex:         3,
    width:          36,
    height:         36,
    borderRadius:   "50%",
    background:     "rgba(0,0,0,0.52)",
    border:         "1px solid rgba(255,255,255,0.14)",
    color:          "rgba(255,255,255,0.82)",
    fontSize:       22,
    cursor:         "pointer",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    lineHeight:     1,
    transition:     "background 0.2s",
  };
}

// ── Online dot ────────────────────────────────────────────────────────────────
function OnlineDot({ online }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:        7,
        height:       7,
        borderRadius: "50%",
        background:   online ? "#22c55e" : "#4b5563",
        boxShadow:    online ? "0 0 0 2px rgba(34,197,94,0.22)" : "none",
        animation:    online ? "lwd-status-pulse 2s ease-in-out infinite" : "none",
        flexShrink:   0,
      }}
    />
  );
}

// ── VideoSlide — renders YouTube / Vimeo iframe or direct <video> ──────────────
function VideoSlide({ src, isActive }) {
  const kind    = mediaKind(src);
  const ytId    = extractYouTubeId(src);
  const vimeoId = extractVimeoId(src);

  const sharedIframeStyle = {
    position: "absolute",
    inset:    0,
    width:    "100%",
    height:   "100%",
    border:   "none",
    display:  "block",
  };

  if (!isActive) return null; // unmount inactive video slides to prevent simultaneous playback

  if (kind === "youtube" && ytId) {
    return (
      <iframe
        key={src}
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        title="Video"
        style={sharedIframeStyle}
      />
    );
  }

  if (kind === "vimeo" && vimeoId) {
    return (
      <iframe
        key={src}
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Video"
        style={sharedIframeStyle}
      />
    );
  }

  // Direct video file
  return (
    <video
      key={src}
      src={src}
      autoPlay
      controls
      playsInline
      style={{ ...sharedIframeStyle, objectFit: "cover", backgroundColor: "#000" }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuickViewModal({ item, onClose, onViewFull }) {
  const [slideIdx,  setSlideIdx]  = useState(0);
  const [loginGate, setLoginGate] = useState(false);
  const [visible,   setVisible]   = useState(false);
  const timerRef                  = useRef(null);

  const isVendor = item?.type === "vendor";
  const features = isVendor
    ? (item?.specialties ?? [])
    : (item?.includes ?? item?.styles ?? []);

  const mapUrl = item?.lat && item?.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${item.lng - 0.025},${item.lat - 0.025},${item.lng + 0.025},${item.lat + 0.025}&layer=mapnik&marker=${item.lat},${item.lng}`
    : null;

  // ── Build combined media array: images first, then videos, then reels ────────
  const mediaItems = (() => {
    const items = [];
    // Images
    (item?.imgs || []).forEach(src => { if (src) items.push({ type: "image", src }); });
    // Single videoUrl (from LuxuryVenueCard / LuxuryVendorCard)
    if (item?.videoUrl) {
      items.push({ type: "video", src: item.videoUrl });
    }
    // Multiple video_urls (from card overrides — 4 slots)
    (item?.video_urls || []).forEach(src => {
      if (src && !items.some(m => m.src === src)) {
        items.push({ type: "video", src });
      }
    });
    // Reel URLs (4 slots)
    (item?.reel_urls || []).forEach(src => {
      if (src) items.push({ type: "reel", src });
    });
    return items.length > 0 ? items : [{ type: "image", src: "" }];
  })();

  const totalSlides  = mediaItems.length;
  const currentSlide = mediaItems[slideIdx] ?? { type: "image", src: "" };
  const isVideoSlide = currentSlide.type === "video" || currentSlide.type === "reel";

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => setVisible(false);
  }, []);

  // Auto-advance images only — pauses on video/reel slides
  useEffect(() => {
    clearInterval(timerRef.current);
    if (totalSlides <= 1 || isVideoSlide) return;
    timerRef.current = setInterval(
      () => setSlideIdx(i => (i + 1) % totalSlides),
      4000
    );
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSlides, slideIdx]);

  // ESC → close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && !loginGate) onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, loginGate]);

  const prevSlide = useCallback(() => {
    clearInterval(timerRef.current);
    setSlideIdx(i => (i - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    clearInterval(timerRef.current);
    setSlideIdx(i => (i + 1) % totalSlides);
  }, [totalSlides]);

  const jumpSlide = useCallback((i) => {
    clearInterval(timerRef.current);
    setSlideIdx(i);
  }, []);

  if (!item) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               1200,
          background:           "rgba(0,0,0,0.75)",
          backdropFilter:       "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          opacity:              visible ? 1 : 0,
          transition:           "opacity 0.3s ease",
        }}
      />

      {/* ── Modal ── */}
      <div
        className="lwd-quickview"
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${item.name}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position:      "fixed",
          top:           "50%",
          left:          "50%",
          transform:     visible
            ? "translate(-50%,-50%) scale(1)"
            : "translate(-50%,-50%) scale(0.96)",
          opacity:       visible ? 1 : 0,
          transition:    "transform 0.3s ease, opacity 0.3s ease",
          zIndex:        1201,
          width:         "min(94vw, 1100px)",
          maxHeight:     "90vh",
          display:       "flex",
          flexDirection: "column",
          background:    "#0f0d0a",
          border:        "1px solid rgba(201,168,76,0.18)",
          boxShadow:     "0 40px 90px rgba(0,0,0,0.72)",
          overflow:      "hidden",
          borderRadius:  "var(--lwd-radius-card)",
        }}
      >
        {/* ── Two-panel body ── */}
        <div className="lwd-quickview-body" style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ── Left: Gallery 55% ── */}
          <div
            className="lwd-quickview-gallery"
            style={{
              flex:       "0 0 55%",
              position:   "relative",
              background: "#0a0806",
              overflow:   "hidden",
            }}
          >
            {/* ── Slides ── */}
            {mediaItems.map((media, i) => {
              const isActive = i === slideIdx;

              if (media.type === "image") {
                return (
                  <img
                    key={i}
                    src={media.src}
                    alt={i === 0 ? item.name : `${item.name} photo ${i + 1}`}
                    style={{
                      position:   "absolute",
                      inset:      0,
                      width:      "100%",
                      height:     "100%",
                      objectFit:  "cover",
                      opacity:    isActive ? 1 : 0,
                      transition: "opacity 0.65s ease",
                    }}
                  />
                );
              }

              // Video / Reel slide
              return (
                <div
                  key={i}
                  style={{
                    position:      "absolute",
                    inset:         0,
                    opacity:       isActive ? 1 : 0,
                    transition:    "opacity 0.3s ease",
                    pointerEvents: isActive ? "auto" : "none",
                    background:    "#000",
                  }}
                >
                  <VideoSlide src={media.src} isActive={isActive} />

                  {/* ▶ / 📱 type label bottom-right */}
                  {isActive && (
                    <div style={{
                      position:      "absolute",
                      top:           12,
                      right:         12,
                      zIndex:        5,
                      padding:       "3px 8px",
                      borderRadius:  20,
                      background:    "rgba(0,0,0,0.55)",
                      border:        "1px solid rgba(201,168,76,0.3)",
                      color:         "#C9A84C",
                      fontSize:      9,
                      fontWeight:    700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}>
                      {media.type === "reel" ? "📱 Reel" : "▶ Video"}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom gradient (hidden behind video controls on video slides) */}
            {!isVideoSlide && (
              <div
                aria-hidden="true"
                style={{
                  position:   "absolute",
                  bottom:     0,
                  left:       0,
                  right:      0,
                  height:     "48%",
                  background: "linear-gradient(0deg,rgba(0,0,0,0.82) 0%,transparent 100%)",
                  zIndex:     1,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Prev / Next */}
            {totalSlides > 1 && (
              <>
                <button onClick={prevSlide} aria-label="Previous" style={{ ...navBtn("left"), zIndex: 4 }}>‹</button>
                <button onClick={nextSlide} aria-label="Next"     style={{ ...navBtn("right"), zIndex: 4 }}>›</button>
              </>
            )}

            {/* Slide indicators */}
            {totalSlides > 1 && (
              <div
                aria-hidden="true"
                style={{
                  position:       "absolute",
                  bottom:         14,
                  left:           0,
                  right:          0,
                  display:        "flex",
                  justifyContent: "center",
                  alignItems:     "center",
                  gap:            5,
                  zIndex:         2,
                  pointerEvents:  "none",
                }}
              >
                {mediaItems.map((media, i) => {
                  const isActive = i === slideIdx;
                  const isVid    = media.type === "video" || media.type === "reel";
                  return (
                    <div
                      key={i}
                      onClick={() => jumpSlide(i)}
                      style={{
                        width:        isActive ? (isVid ? 22 : 18) : 5,
                        height:       isVid ? 5 : 2,
                        background:   isActive
                          ? (isVid ? "#e8c97a" : "#C9A84C")
                          : "rgba(255,255,255,0.38)",
                        borderRadius: isVid ? 3 : 1,
                        transition:   "all 0.3s",
                        cursor:       "pointer",
                        pointerEvents: "auto",
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent: "center",
                        overflow:     "hidden",
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Stats pinned bottom-left (images only) */}
            {!isVideoSlide && (
              <div
                style={{
                  position: "absolute",
                  bottom:   22,
                  left:     22,
                  zIndex:   2,
                }}
              >
                {item.priceFrom && (
                  <div
                    style={{
                      fontFamily:   "var(--font-heading-primary)",
                      fontSize:     22,
                      fontWeight:   600,
                      color:        "#C9A84C",
                      lineHeight:   1,
                      marginBottom: 4,
                    }}
                  >
                    {item.priceFrom}
                  </div>
                )}
                {item.capacity && (
                  <div
                    style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      10,
                      color:         "rgba(255,255,255,0.6)",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    Up to {item.capacity} guests
                  </div>
                )}
              </div>
            )}

            {/* Close × top-left */}
            <button
              onClick={onClose}
              aria-label="Close quick view"
              style={{
                position:       "absolute",
                top:            12,
                left:           12,
                zIndex:         10,
                width:          30,
                height:         30,
                borderRadius:   "50%",
                background:     "rgba(0,0,0,0.52)",
                border:         "none",
                color:          "rgba(255,255,255,0.78)",
                fontSize:       18,
                cursor:         "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                lineHeight:     1,
              }}
            >
              ×
            </button>
          </div>

          {/* ── Right: Details + Map 45% ── */}
          <div
            className="lwd-quickview-details"
            style={{
              flex:          "0 0 45%",
              display:       "flex",
              flexDirection: "column",
              overflowY:     "auto",
              borderLeft:    "1px solid rgba(201,168,76,0.1)",
            }}
          >
            <div style={{ padding: "24px 24px 28px" }}>

              {/* Online status row */}
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  marginBottom:   18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <OnlineDot online={item.online} />
                  <span
                    style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      10,
                      color:         item.online ? "#22c55e" : "rgba(255,255,255,0.28)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.online ? "Online now" : "Currently offline"}
                  </span>
                </div>

                <button
                  onClick={() => setLoginGate(true)}
                  style={{
                    fontFamily:    "var(--font-body)",
                    fontSize:      10,
                    fontWeight:    700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    padding:       "6px 14px",
                    background:    item.online
                      ? "linear-gradient(135deg,#C9A84C,#e8c97a)"
                      : "none",
                    border:        item.online
                      ? "none"
                      : "1px solid rgba(255,255,255,0.12)",
                    color:         item.online ? "#0f0d0a" : "rgba(255,255,255,0.28)",
                    cursor:        "pointer",
                    borderRadius:  "var(--lwd-radius-input)",
                    transition:    "all 0.2s",
                  }}
                >
                  {item.online ? "💬 Chat now" : "Send message"}
                </button>
              </div>

              {/* Name */}
              <h2
                style={{
                  fontFamily:    "var(--font-heading-primary)",
                  fontSize:      26,
                  fontWeight:    500,
                  color:         "#f5f0e8",
                  lineHeight:    1.1,
                  marginBottom:  6,
                  letterSpacing: "-0.2px",
                }}
              >
                {item.name}
              </h2>

              {/* Location */}
              <div
                style={{
                  fontFamily:   "var(--font-body)",
                  fontSize:     12,
                  color:        "rgba(245,240,232,0.42)",
                  marginBottom: 12,
                  display:      "flex",
                  alignItems:   "center",
                  gap:          5,
                }}
              >
                <span aria-hidden="true" style={{ color: "#C9A84C", fontSize: 9 }}>◆</span>
                {item.city}, {item.region}
                {!isVendor && " · Italy"}
              </div>

              {/* Rating */}
              {item.rating > 0 && (
                <div
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          6,
                    marginBottom: 16,
                  }}
                  aria-label={`Rating: ${item.rating} out of 5`}
                >
                  <span style={{ color: "#C9A84C", fontSize: 12 }}>★★★★★</span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize:   12,
                      color:      "#C9A84C",
                      fontWeight: 700,
                    }}
                  >
                    {item.rating}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize:   11,
                      color:      "rgba(245,240,232,0.35)",
                    }}
                  >
                    ({item.reviews} reviews)
                  </span>
                </div>
              )}

              {/* Description */}
              <p
                style={{
                  fontFamily:   "var(--font-body)",
                  fontSize:     13,
                  color:        "rgba(245,240,232,0.55)",
                  lineHeight:   1.78,
                  fontWeight:   300,
                  marginBottom: 20,
                }}
              >
                {item.desc}
              </p>

              {/* Inclusions / Specialties */}
              {features.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      9,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color:         "rgba(245,240,232,0.28)",
                      marginBottom:  10,
                    }}
                  >
                    {isVendor ? "Specialties" : "Inclusions"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {features.slice(0, 5).map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display:    "flex",
                          alignItems: "center",
                          gap:        8,
                          fontFamily: "var(--font-body)",
                          fontSize:   12,
                          color:      "rgba(245,240,232,0.56)",
                        }}
                      >
                        <span aria-hidden="true" style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  height:       1,
                  background:   "rgba(201,168,76,0.1)",
                  marginBottom: 20,
                }}
              />

              {/* Map */}
              {mapUrl ? (
                <div>
                  <div
                    style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      9,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color:         "rgba(245,240,232,0.28)",
                      marginBottom:  10,
                    }}
                  >
                    Location
                  </div>
                  <div
                    style={{
                      borderRadius: "var(--lwd-radius-input)",
                      overflow:     "hidden",
                      border:       "1px solid rgba(201,168,76,0.1)",
                      height:       190,
                    }}
                  >
                    <iframe
                      title={`Map location of ${item.name}`}
                      src={mapUrl}
                      width="100%"
                      height="190"
                      style={{
                        border:  "none",
                        display: "block",
                        filter:  "grayscale(0.25) contrast(0.92) brightness(0.88)",
                      }}
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height:         120,
                    background:     "rgba(255,255,255,0.02)",
                    border:         "1px solid rgba(255,255,255,0.06)",
                    borderRadius:   "var(--lwd-radius-input)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontFamily:     "var(--font-body)",
                    fontSize:       11,
                    color:          "rgba(255,255,255,0.2)",
                  }}
                >
                  Map unavailable
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="lwd-quickview-footer"
          style={{
            flexShrink:     0,
            display:        "flex",
            justifyContent: "flex-end",
            alignItems:     "center",
            gap:            12,
            padding:        "14px 24px",
            borderTop:      "1px solid rgba(201,168,76,0.1)",
            background:     "#0f0d0a",
          }}
        >
          <button
            onClick={onClose}
            style={{
              fontFamily:    "var(--font-body)",
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding:       "9px 20px",
              background:    "none",
              border:        "1px solid rgba(255,255,255,0.1)",
              color:         "rgba(255,255,255,0.38)",
              cursor:        "pointer",
              borderRadius:  "var(--lwd-radius-input)",
              transition:    "all 0.2s",
            }}
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onViewFull?.(item); }}
            style={{
              fontFamily:    "var(--font-body)",
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding:       "9px 22px",
              background:    "linear-gradient(135deg,#C9A84C,#e8c97a)",
              border:        "none",
              color:         "#0f0d0a",
              cursor:        "pointer",
              borderRadius:  "var(--lwd-radius-input)",
              transition:    "opacity 0.2s",
            }}
          >
            Full Profile →
          </button>
        </div>
      </div>

      {/* Login gate — stacks on top (z-1300) */}
      {loginGate && (
        <LoginGateModal onClose={() => setLoginGate(false)} />
      )}
    </>
  );
}
