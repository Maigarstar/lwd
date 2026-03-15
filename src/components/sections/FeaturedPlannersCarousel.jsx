// ─── src/components/sections/FeaturedPlannersCarousel.jsx ───────────────────────
// Shows 3 randomly selected planners from 7 featured, in the same reel card design
// as GridCard. Selection rotates on each page load so all featured get visibility.
// Includes description, Profile button, and sound on/off toggle for video.

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";
import Stars from "../ui/Stars";
import { SocialRow } from "../cards/PlannerCard";
import EnquiryFormModal from "../ui/EnquiryFormModal";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── SVG icons for mute/unmute ───────────────────────────────────────────────
const SpeakerOnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const SpeakerOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

// ── Fisher-Yates shuffle (deterministic per page load) ──────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Featured Reel Card, matches GridCard design exactly ────────────────────
function FeaturedReelCard({ v, isMobile, onView }) {
  const [hov, setHov]             = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [slideIdx, setSlideIdx]   = useState(0);
  const [muted, setMuted]         = useState(true);
  const cardRef   = useRef(null);
  const touchRef  = useRef({ startX: 0, startY: 0, swiping: false, isDrag: false });
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

  // ── Track card visibility (pause video when scrolled away) ──
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Auto-play/pause video + sync muted state ──
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

  // ── Swipe navigation (within card media) ──
  const goTo   = useCallback((i) => setSlideIdx(Math.max(0, Math.min(i, mediaCount - 1))), [mediaCount]);
  const goNext = useCallback(() => goTo(slideIdx < mediaCount - 1 ? slideIdx + 1 : 0), [slideIdx, mediaCount, goTo]);
  const goPrev = useCallback(() => goTo(slideIdx > 0 ? slideIdx - 1 : mediaCount - 1), [slideIdx, mediaCount, goTo]);

  // ── Touch handlers ──
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

  // ── Mouse drag handlers ──
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

  // ── Is the current slide a video? ──
  const isVideoSlide = allMedia[slideIdx]?.type === "video";

  return (
    <article
      ref={cardRef}
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        position:     "relative",
        borderRadius: "var(--lwd-radius-card)",
        overflow:     "hidden",
        cursor:       "pointer",
        transition:   "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transform:    hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow:    hov
          ? "0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(201,168,76,0.08)"
          : "0 2px 12px rgba(0,0,0,0.1)",
        height:       isMobile ? "85vh" : 520,
        minHeight:    isMobile ? 560 : 520,
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
          position: "absolute", inset: 0, overflow: "hidden",
          background: "#0a0806",
          cursor: hasMultiple ? "grab" : "default",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "flex", width: `${mediaCount * 100}%`, height: "100%",
            transform: `translateX(-${(slideIdx * 100) / mediaCount}%)`,
            transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {allMedia.map((item, i) => (
            <div key={`${item.type}-${i}`} style={{ width: `${100 / mediaCount}%`, height: "100%", flexShrink: 0, position: "relative", overflow: "hidden" }}>
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={i === 0 ? `${v.name} – ${v.city}, ${v.region}` : `${v.name} photo ${i + 1}`}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov && i === slideIdx ? "scale(1.03)" : "scale(1)", transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                />
              ) : (
                <>
                  {v.imgs?.[0] && <img src={v.imgs[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={item.src} muted={muted} loop playsInline preload="metadata"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: slideIdx === i ? 1 : 0, transition: "opacity 0.6s ease" }}
                  />
                  {slideIdx !== i && (
                    <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="8,5 20,12 8,19" /></svg>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cinematic gradient ── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.88) 100%)", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Top badges ── */}
      {v.tag && <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}><GoldBadge text={v.tag} /></div>}
      {v.verified && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4 }}><VerifiedBadge /></div>}

      {/* Swipe dot indicators (within card) */}
      {hasMultiple && (
        <div aria-hidden="true" style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 5, display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 12, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          {allMedia.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }} aria-label={`Slide ${i + 1}`} style={{ width: slideIdx === i ? 18 : 6, height: 6, borderRadius: 3, background: slideIdx === i ? GOLD : "rgba(255,255,255,0.45)", border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s ease" }} />
          ))}
        </div>
      )}

      {/* Desktop prev/next arrows (within card media) */}
      {hasMultiple && hov && !isMobile && (
        <>
          {[
            { dir: "prev", icon: "15 18 9 12 15 6", pos: "left", fn: goPrev },
            { dir: "next", icon: "9 18 15 12 9 6", pos: "right", fn: goNext },
          ].map(({ dir, icon, pos, fn }) => (
            <button key={dir} onClick={(e) => { e.stopPropagation(); fn(); }} aria-label={`${dir === "prev" ? "Previous" : "Next"} photo`}
              style={{ position: "absolute", top: "40%", [pos]: 10, transform: "translateY(-50%)", zIndex: 5, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: 0.85 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.35)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={icon} /></svg>
            </button>
          ))}
        </>
      )}

      {/* ── Sound on/off toggle (visible on video slide) ── */}
      {hasVideo && isVideoSlide && (
        <button
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          style={{
            position:       "absolute",
            bottom:         isMobile ? "auto" : "auto",
            top:            isMobile ? 56 : 48,
            right:          12,
            zIndex:         5,
            width:          34,
            height:         34,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            border:         "1px solid rgba(255,255,255,0.2)",
            color:          muted ? "rgba(255,255,255,0.5)" : "#fff",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            transition:     "all 0.2s",
          }}
        >
          {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
        </button>
      )}

      {/* ── Content overlaid at bottom (matches GridCard exactly) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom:   0,
          left:     0,
          right:    0,
          zIndex:   2,
          padding:  isMobile ? "20px 16px 16px" : "20px 18px 18px",
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
        >{v.name}</div>

        {/* Location */}
        <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
          {v.city}, {v.region}
        </div>

        {/* Service tier + Stars row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {v.serviceTier && (
            <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: GOLD, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "3px 10px" }}>
              {v.serviceTier}
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

        {/* Social + contact icons */}
        <SocialRow socials={v.socials} color="rgba(255,255,255,0.5)" phone={v.phone} whatsapp={v.whatsapp} email={v.email} darkMode />

        {/* Description, 2-line clamp */}
        <p
          style={{
            fontFamily:      NU,
            fontSize:        12,
            color:           "rgba(255,255,255,0.6)",
            lineHeight:      1.5,
            margin:          "0 0 10px",
            display:         "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow:        "hidden",
          }}
        >{v.desc}</p>

        {/* Footer: price + CTAs */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            paddingTop:     10,
            borderTop:      "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontFamily: GD, fontSize: 20, fontWeight: 600, color: GOLD, lineHeight: 1 }}>
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.45)", marginRight: 4, letterSpacing: "0.3px" }}>From</span>
            {v.priceFrom}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
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
            >Enquire</button>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--lwd-radius-input)",
                padding: "8px 14px", cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap",
              }}
            >Profile ›</button>
          </div>
        </div>
      </div>

      {showEnquiry && <EnquiryFormModal planner={v} onClose={() => setShowEnquiry(false)} />}
    </article>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component: randomly pick 3 from 7 featured on each page load
// ══════════════════════════════════════════════════════════════════════════════
export default function FeaturedPlannersCarousel({ featured, isMobile, onView }) {
  // Shuffle once on mount, pick first 3
  const displayPlanners = useMemo(
    () => shuffleArray(featured).slice(0, 3),
    [] // intentionally empty, shuffle once per mount
  );

  return (
    <section
      aria-label="Featured planners"
      style={{
        background: "#0a0806",
        padding:    isMobile ? "48px 16px" : "56px 32px",
        position:   "relative",
      }}
    >
      {/* Gold shimmer border */}
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 10, background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section label */}
        <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: GOLD, marginBottom: 24 }}>
          ✦ Featured Planners
        </div>

        {/* 3 randomly selected reel cards */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap:                 isMobile ? 20 : 16,
          }}
        >
          {displayPlanners.map((p) => (
            <FeaturedReelCard key={p.id} v={p} isMobile={isMobile} onView={onView} />
          ))}
        </div>
      </div>
    </section>
  );
}
