// ─── src/components/cards/LuxuryVenueCard.jsx ─────────────────────────────────
// Exact copy of PlannerCard GridCard, full-bleed swipeable media, cinematic
// gradient, content overlaid at bottom. Venue data swapped in for planner data.

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import Stars from "../ui/Stars";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";
import MatchReasoning from "../badges/MatchReasoning";
import LuxeEnquiryModal from "../enquiry/LuxeEnquiryModal";
import ShortlistButton from "../buttons/ShortlistButton";
import CompareCheckbox from "../buttons/CompareCheckbox";
import { trackCompareAdd } from "../../services/userEventService";
import {
  trackMediaView,
  cancelMediaDwell,
  trackMediaClick,
  trackMediaSwipe,
  trackVideoPlay,
  trackVideoComplete,
} from "../../services/mediaEventService";

const COMPARE_KEY = "lwd_compare_list";
function loadCL() { try { return JSON.parse(sessionStorage.getItem(COMPARE_KEY)) || []; } catch { return []; } }
function saveCL(l) { try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify(l)); } catch {} }
import { track } from "../../utils/track";
import { getQualityTier } from "../../services/listings";
import TierBadge from "../editorial/TierBadge";
import ApprovalIndicators from "../editorial/ApprovalIndicators";
import FreshnessText from "../editorial/FreshnessText";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";

function VenueGridCard({ v, onView, isMobile, quickViewItem, setQuickViewItem, matchedStyles = [], otherFilters = {} }) {
  const C = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();
  const [hov, setHov]               = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [slideIdx, setSlideIdx]      = useState(0);
  const [muted, setMuted]            = useState(true);
  const [compareList, setCompareList] = useState(loadCL);
  const cardRef  = useRef(null);

  useEffect(() => {
    const handler = () => setCompareList(loadCL());
    window.addEventListener("lwd:compare-bar", handler);
    return () => window.removeEventListener("lwd:compare-bar", handler);
  }, []);
  const isCompared = compareList.some((i) => i.id === v.id);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const videoRefs = useRef({});

  // ── Build media array: images first, video last ──
  // v.imgs may be plain URL strings OR objects { src/url, credit_name, credit_instagram }
  const allMedia = (() => {
    const items = [];
    (v.imgs || []).forEach((img) => {
      if (typeof img === "string") {
        items.push({ type: "image", src: img, alt_text: "", creditName: null, creditIG: null, showCredit: false });
      } else {
        items.push({
          type:        "image",
          src:         img.src || img.url || "",
          alt_text:    img.alt_text || "",
          creditName:  img.credit_name || null,
          creditIG:    img.credit_instagram || null,
          showCredit:  img.show_credit ?? false,
        });
      }
    });
    if (v.videoUrl) items.push({ type: "video", src: v.videoUrl, creditName: null, creditIG: null, showCredit: false });
    return items.length > 0 ? items : [{ type: "image", src: "", creditName: null, creditIG: null, showCredit: false }];
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

  // ── Media tracking: fire view + dwell on slide change ──
  useEffect(() => {
    if (!isVisible || !v?.id) return;
    const current = allMedia[slideIdx];
    if (!current?.src) return;
    const mediaId = current.src;
    cancelMediaDwell(mediaId);
    trackMediaView({
      mediaId,
      listingId: v.id,
      galleryPosition: slideIdx,
      isHero: slideIdx === 0,
      slideIndex: slideIdx,
    });
  }, [slideIdx, isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
      const nextIdx = diff > 0
        ? (slideIdx < mediaCount - 1 ? slideIdx + 1 : 0)
        : (slideIdx > 0 ? slideIdx - 1 : mediaCount - 1);
      const swiped = allMedia[nextIdx];
      if (swiped?.src && v?.id) {
        trackMediaSwipe({ mediaId: swiped.src, listingId: v.id, galleryPosition: nextIdx });
      }
    }
    touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, [goNext, goPrev, slideIdx, mediaCount, allMedia, v?.id]);

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
    const current = allMedia[slideIdx];
    if (current?.src && v?.id) {
      trackMediaClick({ mediaId: current.src, listingId: v.id, galleryPosition: slideIdx, isHero: slideIdx === 0 });
    }
    goNext();
  }, [goNext, allMedia, slideIdx, v?.id]);

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
                  alt={item.alt_text || (i === 0 ? `${v.name} – ${v.city}, ${v.region}` : `${v.name} photo ${i + 1}`)}
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
      {v.featured && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
          <GoldBadge text="Editor's Pick" />
        </div>
      )}

      {v.tag && !v.featured && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
          <GoldBadge text={v.tag} />
        </div>
      )}
      {v.verified && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4 }}>
          <VerifiedBadge />
        </div>
      )}

      {/* ── Right-side overlay column: SWIPE (top:44) → HEART (top:84) ── */}
      {/* Swipe hint, below verified badge, shows on hover when multiple slides */}
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

      {/* Heart, below swipe hint, shows on hover or when saved */}
      <div
        style={{
          position: "absolute", top: v.verified ? 84 : 52, right: 12, zIndex: 4,
          opacity: isShortlisted(v.id) ? 1 : hov ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ShortlistButton
          item={{ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" }}
          isShortlisted={isShortlisted(v.id)}
          onToggle={(itemId, newState) => {
            track(newState ? "shortlist_add" : "shortlist_remove", { itemId, itemName: v.name });
            toggleItem({ id: itemId, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" });
          }}
          variant="icon"
          size="medium"
          strokeColor="#ffffff"
        />
      </div>

      {/* Compare checkbox — top left */}
      <div
        style={{
          position: "absolute", top: 38, left: 12, zIndex: 4,
          opacity: isCompared ? 1 : hov ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CompareCheckbox
          item={{ id: v.id, name: v.name }}
          isCompared={isCompared}
          onToggle={() => {
            const current = loadCL();
            const alreadyIn = current.some((i) => i.id === v.id);
            let updated;
            if (alreadyIn) {
              updated = current.filter((i) => i.id !== v.id);
            } else {
              if (current.length >= 3) return;
              updated = [...current, { id: v.id, name: v.name }];
              trackCompareAdd({ venueId: v.id, venueName: v.name, compareList: current, sourceSurface: 'venue_card' });
            }
            saveCL(updated);
            setCompareList(updated);
            window.dispatchEvent(new CustomEvent("lwd:compare-bar", { detail: { active: updated.length > 0 } }));
          }}
        />
      </div>

      {/* ── Slide bar indicators, top-centre, max 3 bars ── */}
      {hasMultiple && (() => {
        const barCount = Math.min(mediaCount, 3);
        // Which of the 3 bars is active: first / middle / last
        const activeBar = mediaCount <= 3
          ? slideIdx
          : slideIdx === 0 ? 0
          : slideIdx === mediaCount - 1 ? 2
          : 1;
        return (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
              zIndex: 5, display: "flex", alignItems: "center", gap: 3,
              padding: "5px 8px", borderRadius: 20,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
            }}
          >
            {Array.from({ length: barCount }, (_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to the proportional slide for this bar
                  const target = mediaCount <= 3 ? i : Math.round((i / (barCount - 1)) * (mediaCount - 1));
                  goTo(target);
                }}
                aria-label={`Slide group ${i + 1}`}
                style={{
                  width: 16, height: 2, borderRadius: 2,
                  background: activeBar === i ? GOLD : "rgba(255,255,255,0.35)",
                  border: "none", padding: 0, cursor: "pointer",
                  transition: "background 0.3s ease", flexShrink: 0,
                }}
              />
            ))}
          </div>
        );
      })()}

      {/* ── Prev/Next arrows removed, SliderNav handles left/right nav ── */}
      {/* Image navigation via swipe/drag + dot indicators above */}

      {/* ── Mute toggle on video slide ── */}
      {hasVideo && allMedia[slideIdx]?.type === "video" && (
        <button
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          aria-label={muted ? "Unmute" : "Mute"}
          className="lwd-card-media-btn"
          style={{
            position: "absolute", top: isMobile ? 56 : 48, right: 12, zIndex: 5,
            width: isMobile ? 44 : 34, height: isMobile ? 44 : 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
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
          zIndex: 2, padding: isMobile ? "20px 14px 16px" : "20px 18px 18px",
        }}
      >
        {/* Photographer credit, bottom-right of image, above venue name */}
        {(() => {
          const cur = allMedia[slideIdx];
          if (!cur?.showCredit) return null;
          const label = cur?.creditIG
            ? `@${cur.creditIG.replace(/^@/, "")}`
            : cur?.creditName || null;
          return label ? (
            <div
              aria-hidden="true"
              style={{
                position: "absolute", top: 10, right: 12,
                display: "flex", alignItems: "center", gap: 3,
                fontSize: 9, fontFamily: NU,
                color: "rgba(255,255,255,0.48)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>{label}</span>
            </div>
          ) : null;
        })()}

        {/* Showcase indicator, above name */}
        {v.showcaseUrl && (
          <a
            href={v.showcaseUrl}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginBottom: 14, marginTop: -4,
              padding: "3px 9px", borderRadius: 20,
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.25)",
              textDecoration: "none", cursor: "pointer",
            }}
          >
            <span style={{ color: "#fff", fontSize: 7, lineHeight: 1 }}>✦</span>
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1.2px",
              textTransform: "uppercase", color: "#fff",
            }}>A Showcase Property</span>
          </a>
        )}

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

        {/* Style tier + Match Reasoning + Stars + Phase 4 Editorial Tier Badge */}
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
          {(matchedStyles && matchedStyles.length > 0) && (
            <MatchReasoning
              listing={v}
              matchedStyles={matchedStyles}
              otherFilters={otherFilters}
              darkMode={true}
            />
          )}
          {v.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars r={v.rating} />
              <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                {v.rating} ({v.reviews})
              </span>
            </div>
          )}
          {/* Phase 4a: Quality tier badge */}
          {v.contentScore !== undefined && (
            <TierBadge tier={getQualityTier(v.contentScore)} showLabel={true} size="sm" />
          )}
        </div>

        {/* Phase 4b: Editorial approval indicators */}
        {(v.editorialApproved || v.editorialFactChecked) && (
          <div style={{ marginBottom: 8 }}>
            <ApprovalIndicators
              approved={v.editorialApproved}
              factChecked={v.editorialFactChecked}
              layout="horizontal"
            />
          </div>
        )}

        {/* Phase 4b: Freshness indicator */}
        {v.editorialApproved && v.editorialLastReviewedAt && (
          <div style={{ marginBottom: 8 }}>
            <FreshnessText
              lastReviewedAt={v.editorialLastReviewedAt}
              color="rgba(255,255,255,0.6)"
              fontSize={10}
            />
          </div>
        )}

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
            display: "flex", alignItems: "center",
            paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Price, natural block; marginRight:auto creates the gap to buttons */}
          <div style={{
            fontFamily: GD, fontSize: 20, fontWeight: 600, color: GOLD, lineHeight: 1,
            flexShrink: 0, marginRight: "auto",
          }}>
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.45)", marginRight: 4, letterSpacing: "0.3px" }}>From</span>
            {v.priceFrom}
          </div>

          <div className="lwd-venue-card-ctas" style={{ display: "flex", gap: isMobile ? 8 : 6, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setQuickViewItem(v); }}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--lwd-radius-input)", padding: isMobile ? "12px 14px" : "8px 10px",
                cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap",
                minHeight: isMobile ? 44 : "auto",
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
                border: "1px solid transparent", borderRadius: "var(--lwd-radius-input)",
                padding: isMobile ? "12px 16px" : "8px 12px",
                cursor: "pointer", transition: "opacity 0.25s", whiteSpace: "nowrap",
                minHeight: isMobile ? 44 : "auto",
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
                  borderRadius: "var(--lwd-radius-input)", padding: isMobile ? "12px 14px" : "8px 10px",
                  cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap",
                  minHeight: isMobile ? 44 : "auto",
                }}
              >
                Profile ›
              </button>
          </div>
        </div>
      </div>

      {/* ── Enquiry modal ── */}
      {showEnquiry && (
        <LuxeEnquiryModal venue={v} onClose={() => setShowEnquiry(false)} entityType="venue" />
      )}
    </article>
  );
}

// ── List Card (horizontal) — used in list+map view ───────────────────────────
function VenueListCard({ v, onView, isHighlighted }) {
  const C = useTheme();
  const [hov, setHov] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);

  const imgSrc = typeof v.imgs?.[0] === "string" ? v.imgs?.[0] : v.imgs?.[0]?.src || v.imgs?.[0]?.url || "";

  const active = hov || isHighlighted;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display:             "grid",
        gridTemplateColumns: "clamp(320px, 42%, 520px) 1fr",
        gridTemplateRows:    "minmax(0, 1fr)",
        columnGap:           24,
        maxHeight:           420,
        background:          active ? "rgba(201,168,76,0.04)" : C.card,
        border:              "none",
        borderBottom:        `1px solid ${C.border}`,
        cursor:              "pointer",
        transition:          "background 0.25s",
        overflow:            "hidden",
      }}
    >
      {/* Left: image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 160,
          overflow: "hidden",
          background: "#0a0806",
        }}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            alt={v.name}
            loading="lazy"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: active ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.7s ease",
            }}
          />
        )}
        {/* Featured badge */}
        {v.featured && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              borderRadius: 20, padding: "3px 9px",
            }}>Editor's Pick</span>
          </div>
        )}
      </div>

      {/* Right: content */}
      <div style={{
        padding:       "16px 20px",
        display:       "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth:       0,
        overflowY:      "auto",
      }}>
        {/* Name */}
        <div style={{
          fontFamily: GD, fontSize: 17, fontWeight: 500, fontStyle: "italic",
          color: C.white, lineHeight: 1.25, marginBottom: 3,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {v.name}
        </div>

        {/* Location */}
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginBottom: 8 }}>
          {v.city}{v.region ? `, ${v.region}` : ""}
        </div>

        {/* Style + Rating row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {v.styles?.[0] && (
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 20, padding: "3px 8px",
            }}>{v.styles[0]}</span>
          )}
          {v.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars r={v.rating} />
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
                {v.rating} ({v.reviews})
              </span>
            </div>
          )}
          {v.capacity && (
            <span style={{
              fontFamily: NU, fontSize: 9, color: C.grey,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Up to {v.capacity}
            </span>
          )}
        </div>

        {/* Description */}
        <p style={{
          fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.55,
          margin: "0 0 10px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {v.desc}
        </p>

        {/* Footer: price + CTAs */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap",
          gap: "6px 10px", marginTop: "auto",
          borderTop: `1px solid ${C.border}`, paddingTop: 10,
        }}>
          {v.priceFrom && (
            <div style={{ fontFamily: GD, fontSize: 16, fontWeight: 600, color: GOLD, marginRight: "auto" }}>
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 400, color: C.grey, marginRight: 3 }}>From</span>
              {v.priceFrom}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              border: "1px solid transparent", borderRadius: "var(--lwd-radius-input)",
              padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Enquire
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView?.(v); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "var(--lwd-radius-input)", padding: "6px 10px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Profile ›
          </button>
        </div>
      </div>

      {showEnquiry && (
        <LuxeEnquiryModal venue={v} onClose={() => setShowEnquiry(false)} entityType="venue" />
      )}
    </article>
  );
}

// ── Public Export — supports mode="grid" (default) and mode="list" ────────────
export default function LuxuryVenueCard(props) {
  if (props.mode === "list") {
    return <VenueListCard v={props.v} onView={props.onView} isHighlighted={props.isHighlighted} />;
  }
  return <VenueGridCard {...props} />;
}
