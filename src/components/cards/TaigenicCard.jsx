/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TAIGENIC CARD 2.0 — LOCKED DESIGN SYSTEM PRIMITIVE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This component is a locked system primitive for the platform.
 * Structure, spacing, and behavior are IMMUTABLE.
 * Only content changes through props, never layout.
 *
 * TWO VARIANTS ONLY:
 * - variant="list" → 400px × 400px (horizontal, compact)
 * - variant="grid" → 360px × 560px (vertical, premium)
 *
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import Stars from "../ui/Stars";
import { GoldBadge } from "../ui/Badges";
import TierBadge from "../editorial/TierBadge";
import FreshnessText from "../editorial/FreshnessText";
import LuxeEnquiryModal from "../enquiry/LuxeEnquiryModal";
import { getQualityTier } from "../../services/listings";
import { track } from "../../utils/track";

// ─────────────────────────────────────────────────────────────────────────────
// MOTION CONSTANTS (2.0 spec — locked)
// ─────────────────────────────────────────────────────────────────────────────
const MOTION = {
  swipeDuration: 0.38,
  swipeEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  zoomScale: 1.04,
  zoomDuration: 1.2,
  textFade: 0.25,
  pulseScale: 1.02,
};

const GOLD = "#C9A84C";
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ─────────────────────────────────────────────────────────────────────────────
// TAIGENIC CARD (system primitive)
// ─────────────────────────────────────────────────────────────────────────────

export default function TaigenicCard({
  v,
  variant = "grid", // "list" or "grid"
  onView,
  onQuickView,
  onSave,
  saved,
}) {
  const C = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [hov, setHov] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);

  const cardRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const videoRefs = useRef({});

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIA PREPARATION (images first, video last)
  // ─────────────────────────────────────────────────────────────────────────
  const allMedia = (() => {
    const items = [];
    (v.imgs || []).forEach((img) => {
      if (typeof img === "string") {
        items.push({
          type: "image",
          src: img,
          creditName: null,
          creditIG: null,
          showCredit: false,
        });
      } else {
        items.push({
          type: "image",
          src: img.src || img.url || "",
          creditName: img.credit_name || null,
          creditIG: img.credit_instagram || null,
          showCredit: img.show_credit ?? false,
        });
      }
    });
    if (v.videoUrl)
      items.push({
        type: "video",
        src: v.videoUrl,
        creditName: null,
        creditIG: null,
        showCredit: false,
      });
    return items.length > 0
      ? items
      : [{ type: "image", src: "", creditName: null, creditIG: null, showCredit: false }];
  })();

  const mediaCount = allMedia.length;
  const hasMultiple = mediaCount > 1;
  const hasVideo = allMedia.some((m) => m.type === "video");

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (idx) => setSlideIdx(Math.max(0, Math.min(idx, mediaCount - 1))),
    [mediaCount]
  );
  const goNext = useCallback(
    () => goTo(slideIdx < mediaCount - 1 ? slideIdx + 1 : 0),
    [slideIdx, mediaCount, goTo]
  );
  const goPrev = useCallback(
    () => goTo(slideIdx > 0 ? slideIdx - 1 : mediaCount - 1),
    [slideIdx, mediaCount, goTo]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TOUCH HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      swiping: false,
      isDrag: false,
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current.startX) return;
    const dx = Math.abs(e.touches[0].clientX - touchRef.current.startX);
    const dy = Math.abs(e.touches[0].clientY - touchRef.current.startY);
    if (dx > dy && dx > 10) {
      touchRef.current.swiping = true;
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchRef.current.swiping) return;
      const diff = touchRef.current.startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goNext() : goPrev();
      }
      touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
    },
    [goNext, goPrev]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MOUSE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    touchRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      swiping: false,
      isDrag: true,
    };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!touchRef.current.isDrag) return;
    if (Math.abs(e.clientX - touchRef.current.startX) > 8)
      touchRef.current.swiping = true;
  }, []);

  const onMouseUp = useCallback(
    (e) => {
      if (!touchRef.current.isDrag) return;
      const diff = touchRef.current.startX - e.clientX;
      if (touchRef.current.swiping && Math.abs(diff) > 40) {
        diff > 0 ? goNext() : goPrev();
      }
      touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
    },
    [goNext, goPrev]
  );

  const onMouseLeaveMedia = useCallback(() => {
    if (touchRef.current.isDrag)
      touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // VISIBILITY TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.3;
        setIsVisible(visible);
        if (!visible) {
          setMuted(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO CONTROL
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: GRID VARIANT (360×560, swipeable, premium)
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "grid") {
    return (
      <article
        ref={cardRef}
        aria-label={v.name}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => onView?.(v)}
        style={{
          position: "relative",
          borderRadius: "var(--lwd-radius-card)",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          transform: hov ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hov
            ? "0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(201,168,76,0.08)"
            : "0 2px 12px rgba(0,0,0,0.1)",
          height: 560,
          minHeight: 560,
          maxHeight: 560,
        }}
      >
        {/* ── MEDIA LAYER (70%) ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeaveMedia}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: "#0a0806",
            cursor: hasMultiple ? "grab" : "default",
            userSelect: "none",
          }}
        >
          {/* Media carousel */}
          <div
            style={{
              display: "flex",
              width: `${mediaCount * 100}%`,
              height: "100%",
              transform: `translateX(-${(slideIdx * 100) / mediaCount}%)`,
              transition: `transform ${MOTION.swipeDuration}s ${MOTION.swipeEasing}`,
              willChange: "transform",
            }}
          >
            {allMedia.map((item, i) => (
              <div
                key={`${item.type}-${i}`}
                style={{
                  width: `${100 / mediaCount}%`,
                  height: "100%",
                  flexShrink: 0,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {item.type === "image" ? (
                  <img
                    src={item.src}
                    alt={`${v.name} photo ${i + 1}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform:
                        hov && i === slideIdx
                          ? `scale(${MOTION.zoomScale})`
                          : "scale(1)",
                      transition: `transform ${MOTION.zoomDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                    }}
                  />
                ) : (
                  <>
                    {v.imgs?.[0] && (
                      <img
                        src={typeof v.imgs[0] === "string" ? v.imgs[0] : v.imgs[0].src || v.imgs[0].url}
                        alt=""
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                      }}
                      src={item.src}
                      muted={muted}
                      loop
                      playsInline
                      preload="metadata"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: slideIdx === i ? 1 : 0,
                        transition: `opacity ${MOTION.textFade}s ease`,
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── GRADIENT OVERLAY ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.88) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* ── PROGRESS BARS (top-center, max 3) ── */}
        {hasMultiple && (() => {
          const barCount = Math.min(mediaCount, 3);
          const activeBar =
            mediaCount <= 3
              ? slideIdx
              : slideIdx === 0
              ? 0
              : slideIdx === mediaCount - 1
              ? 2
              : 1;
          return (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "5px 8px",
                borderRadius: 20,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
              }}
            >
              {Array.from({ length: barCount }, (_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    const target =
                      mediaCount <= 3
                        ? i
                        : Math.round(((i / (barCount - 1)) * (mediaCount - 1)));
                    goTo(target);
                  }}
                  aria-label={`Slide ${i + 1}`}
                  style={{
                    width: 16,
                    height: 2,
                    borderRadius: 2,
                    background:
                      activeBar === i
                        ? GOLD
                        : "rgba(255,255,255,0.35)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "background 0.3s ease",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* ── ACTION RAIL (right side, stacked) ── */}
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            opacity: isShortlisted(v.id) ? 1 : hov ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        >
          {/* Save */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              track(isShortlisted(v.id) ? "shortlist_remove" : "shortlist_add", {
                itemId: v.id,
                itemName: v.name,
              });
              toggleItem({
                id: v.id,
                name: v.name,
                image: v.imgs?.[0],
                category: "venue",
                price: v.priceFrom,
                type: "venue",
              });
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: isShortlisted(v.id) ? GOLD : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label={isShortlisted(v.id) ? "Remove from shortlist" : "Save"}
          >
            {isShortlisted(v.id) ? "♥" : "♡"}
          </button>

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Share handler
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Share"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

          {/* Compare */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Compare handler
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Compare"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4m0 0H3m2 0V3m0 0h4M3 9v4a2 2 0 0 0 2 2h4m-6-2v4m0 0H3m2 0V9m12 12h4a2 2 0 0 0 2-2v-4m0 0h2m-2 0v4m0 0h-4m6-2v-4a2 2 0 0 0-2-2h-4m6 2v-4" />
            </svg>
          </button>
        </div>

        {/* ── Mute toggle (video only) ── */}
        {hasVideo && allMedia[slideIdx]?.type === "video" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            style={{
              position: "absolute",
              top: 48,
              right: 12,
              zIndex: 5,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: muted ? "rgba(255,255,255,0.5)" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            {muted ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        )}

        {/* ── BOTTOM BLOCK (30%, content overlay) ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            padding: "18px 16px",
          }}
        >
          {/* Title (22px, 600, no italic) */}
          <h3
            style={{
              fontFamily: GD,
              fontSize: 22,
              fontWeight: 600,
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: 6,
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
            onClick={() => onView?.(v)}
          >
            {v.name}
          </h3>

          {/* Subtitle (13px, ~70% opacity) */}
          <div
            style={{
              fontFamily: NU,
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
            }}
          >
            {v.city}, {v.region}
          </div>

          {/* Meta row (stars + tier) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {v.rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Stars r={v.rating} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {v.rating.toFixed(1)} ({v.reviews})
                </span>
              </div>
            )}
            {v.contentScore !== undefined && (
              <TierBadge
                tier={getQualityTier(v.contentScore)}
                showLabel={true}
                size="sm"
              />
            )}
          </div>

          {/* Freshness (if approved) */}
          {v.editorialApproved && v.editorialLastReviewedAt && (
            <div style={{ marginBottom: 8 }}>
              <FreshnessText
                lastReviewedAt={v.editorialLastReviewedAt}
                color="rgba(255,255,255,0.6)"
                fontSize={10}
              />
            </div>
          )}

          {/* Description (2-line clamp) */}
          {v.desc && (
            <p
              style={{
                fontFamily: NU,
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.5,
                margin: "0 0 10px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {v.desc}
            </p>
          )}

          {/* Footer: Price + CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Price (left) */}
            <div
              style={{
                fontFamily: GD,
                fontSize: 18,
                fontWeight: 600,
                color: GOLD,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  marginRight: 3,
                  letterSpacing: "0.3px",
                }}
              >
                From
              </span>
              {v.priceFrom}
            </div>

            {/* CTAs (right): Profile, Enquire, QV */}
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              {/* Primary: Profile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(v);
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#0f0d0a",
                  background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                  border: "1px solid transparent",
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "8px 12px",
                  cursor: "pointer",
                  transition: "opacity 0.25s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Profile
              </button>

              {/* Secondary: Enquire */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEnquiry(true);
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: GOLD,
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  whiteSpace: "nowrap",
                }}
              >
                Enquire
              </button>

              {/* Tertiary: QV (optional, ghost) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView?.(v);
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "6px 8px",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  whiteSpace: "nowrap",
                }}
              >
                QV
              </button>
            </div>
          </div>
        </div>

        {/* Enquiry modal */}
        {showEnquiry && (
          <LuxeEnquiryModal
            venue={v}
            onClose={() => setShowEnquiry(false)}
            entityType="venue"
          />
        )}
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LIST VARIANT (400×400, compact horizontal)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      ref={cardRef}
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        background: hov ? "rgba(201,168,76,0.04)" : C.card,
        border: `1px solid ${hov ? "rgba(201,168,76,0.3)" : C.border}`,
        borderRadius: "var(--lwd-radius-card)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hov ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
        flexShrink: 0,
        height: 400,
        width: 400,
      }}
    >
      {/* Image (left, 40%) */}
      <div
        style={{
          width: 160,
          minWidth: 160,
          height: 400,
          position: "relative",
          overflow: "hidden",
          background: "#0a0806",
          flexShrink: 0,
        }}
      >
        {v.imgs?.[0] && (
          <img
            src={typeof v.imgs[0] === "string" ? v.imgs[0] : v.imgs[0].src || v.imgs[0].url}
            alt={v.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hov ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.7s ease",
              display: "block",
            }}
          />
        )}
      </div>

      {/* Content (right, 60%) */}
      <div
        style={{
          flex: 1,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        {/* Title (22px) */}
        <div>
          <div
            style={{
              fontFamily: GD,
              fontSize: 22,
              fontWeight: 600,
              color: C.white,
              lineHeight: 1.15,
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {v.name}
          </div>

          {/* Location */}
          <div
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: C.grey,
              marginBottom: 8,
            }}
          >
            {v.city || v.region}{v.city && v.region ? `, ${v.region}` : ""}
          </div>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            {v.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Stars rating={v.rating} size={9} color={GOLD} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    color: C.grey,
                  }}
                >
                  {v.rating.toFixed(1)} ({v.reviews || 0})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA (bottom) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(v);
            }}
            style={{
              fontFamily: NU,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              border: "none",
              borderRadius: 4,
              padding: "5px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Profile
          </button>
        </div>
      </div>
    </article>
  );
}
