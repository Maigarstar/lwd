/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TAIGENIC CARD 2.0 — LOCKED DESIGN SPEC
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This component is a system primitive, not a feature card.
 * Structure is locked. Only content changes, never layout.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DIMENSIONS (immutable)
 * ─────────────────────────────────────────────────────────────────────────────
 * Desktop: 360px width × 560px height
 * Mobile: 100vw width × 100vh height
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STRUCTURE HIERARCHY (immutable, always this order)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. MEDIA AREA (70% of card)
 *    ├─ SwipeGallery / Video with touch + drag support
 *    ├─ GradientOverlay (vignette, subtle, top-bottom)
 *    ├─ ProgressBars (max 3, top-center, 8px from top)
 *    └─ ActionRail (right side, vertically centered lower)
 *
 * 2. BOTTOM BLOCK (30% of card)
 *    ├─ Title (22px, 600 weight, 1.15 line-height, max 2 lines, NO ITALIC)
 *    ├─ Subtitle (13–14px, 400–500 weight, 1 line max, ~70% opacity)
 *    ├─ Meta Row (12px, compact, no icons)
 *    ├─ Signal Line (11–12px, ONE only, never stack)
 *    ├─ Spacing (12px gap)
 *    └─ CTA Row (price left, buttons right, flex layout)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SPACING (locked, do not adjust)
 * ─────────────────────────────────────────────────────────────────────────────
 * BottomBlock padding: 18px 16px
 * Gap between content blocks: 6px to 8px
 * Action rail gap: 10px
 * Progress bar margin: 8px from top
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TYPOGRAPHY (locked scale)
 * ─────────────────────────────────────────────────────────────────────────────
 * Title: 22px, 600 weight, var(--font-heading-primary)
 * Subtitle: 13–14px, 400–500 weight, var(--font-body)
 * Meta: 12px, var(--font-body), semi-transparent
 * Signal: 11–12px, uppercase or small-caps, subtle color
 * CTA: 10px, 700 weight, var(--font-body)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SIGNALS (locked strategy — ONE ONLY, never stack)
 * ─────────────────────────────────────────────────────────────────────────────
 * Keep only:
 *   • Rating (stars + count)
 *   • Tier badge (if contentScore exists and meaningful)
 *   • Freshness (only if editorialApproved AND editorialLastReviewedAt)
 *   • ONE intelligent signal (rotate these):
 *       - "Trending this week"
 *       - "Saved by X couples"
 *       - "Planner favourite"
 *       - "High enquiry rate"
 *
 * FORBIDDEN:
 *   ✗ Multiple signals stacked
 *   ✗ Generic badges ("Featured", "New")
 *   ✗ Duplicate information
 *   ✗ Decorative icons without purpose
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CTA STRUCTURE (locked hierarchy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary: View / Profile (gold filled)
 * Secondary: Enquire (gold filled or outline)
 * Tertiary: Quick View (optional, ghost, smaller)
 *
 * Social actions on RIGHT side rail only:
 *   • Save / Shortlist (top)
 *   • Share (middle)
 *   • Compare (or Enquire shortcut, bottom)
 *
 * Layout: [ Price | — gap — | CTA buttons ]
 * Button height: 36px to 40px
 * No button stacking. Max 2 visible in footer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MOTION SYSTEM (locked timings — see MOTION object below)
 * ─────────────────────────────────────────────────────────────────────────────
 * Swipe: 0.35–0.40s, easeOutCubic
 * Image zoom: 1.03–1.05 scale only (not 1.2)
 * Text fade: 0.25s opacity transition
 * CTA pulse: 1 → 1.02 → 1 on card active state
 * Progress bar fill: animated, no jump transitions
 *
 * FORBIDDEN MOTION:
 *   ✗ Sharp cuts or instant changes
 *   ✗ Jump transitions without easing
 *   ✗ Inconsistent timing across interactions
 *   ✗ Aggressive zoom (>1.05)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEHAVIOR GOAL
 * ─────────────────────────────────────────────────────────────────────────────
 * When user scrolls to card, they should:
 *   1. Stop scrolling (visual lock-in)
 *   2. Absorb content instantly (clear hierarchy)
 *   3. Feel quality (smooth, premium, intentional)
 *   4. Swipe naturally (no friction)
 *   5. Repeat (feed behavior)
 *
 * No thinking. No analysis. Just flow.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// MOTION CONSTANTS (locked, centralized)
// ─────────────────────────────────────────────────────────────────────────────
const MOTION = {
  swipeDuration: 0.38, // seconds
  swipeEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // easeOutCubic
  textFade: 0.25, // seconds
  textFadeEasing: "ease-out",
  zoomScale: 1.04, // max 1.05
  zoomDuration: 1.2, // seconds
  zoomEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  pulseScale: 1.02,
  pulseDuration: 0.3, // seconds
};

const GOLD = "#C9A84C";
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT STRUCTURE (skeleton, no styling yet)
// ─────────────────────────────────────────────────────────────────────────────

export default function TaigenicCard({ v, variant = "grid", onView, onQuickView, onSave, saved }) {
  const C = useTheme();

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
  // MEDIA PREPARATION
  // ─────────────────────────────────────────────────────────────────────────
  const allMedia = (() => {
    // Build array: images first, video last
    // TODO: Extract and normalize media items (img strings vs objects)
    return [];
  })();

  const mediaCount = allMedia.length;
  const hasMultiple = mediaCount > 1;
  const hasVideo = allMedia.some((m) => m.type === "video");

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    // Clamp index, update slideIdx
    // TODO: Implement
  }, [mediaCount]);

  const goNext = useCallback(() => {
    // Navigate to next slide, wrap around
    // TODO: Implement
  }, [slideIdx, mediaCount, goTo]);

  const goPrev = useCallback(() => {
    // Navigate to prev slide, wrap around
    // TODO: Implement
  }, [slideIdx, mediaCount, goTo]);

  // ─────────────────────────────────────────────────────────────────────────
  // TOUCH HANDLERS (swipe support)
  // ─────────────────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    // TODO: Implement touch start
  }, []);

  const onTouchMove = useCallback((e) => {
    // TODO: Implement touch move with swipe detection
  }, []);

  const onTouchEnd = useCallback((e) => {
    // TODO: Implement touch end with threshold check
  }, [goNext, goPrev]);

  // ─────────────────────────────────────────────────────────────────────────
  // MOUSE HANDLERS (drag support)
  // ─────────────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    // TODO: Implement mouse down
  }, []);

  const onMouseMove = useCallback((e) => {
    // TODO: Implement mouse move
  }, []);

  const onMouseUp = useCallback((e) => {
    // TODO: Implement mouse up
  }, [goNext, goPrev]);

  const onMouseLeaveMedia = useCallback(() => {
    // TODO: Implement mouse leave (reset drag state)
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // VISIBILITY TRACKING (pause video when off-screen)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // TODO: Implement IntersectionObserver to track card visibility
    // Close Quick View and reset sound when card leaves viewport
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO PLAYBACK CONTROL
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // TODO: Control video refs based on slideIdx, isVisible, muted
    // Play active video if visible and muted, pause others
  }, [slideIdx, isVisible, muted]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: MAIN CARD CONTAINER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      ref={cardRef}
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        position: "relative",
        borderRadius: variant === "grid" ? "var(--lwd-radius-card)" : 0,
        overflow: "hidden",
        cursor: "pointer",
        // TODO: Add styling (background, border, shadow, transform, transition)
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MEDIA LAYER (70% of card height) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <MediaLayer
        allMedia={allMedia}
        slideIdx={slideIdx}
        mediaCount={mediaCount}
        hasMultiple={hasMultiple}
        hasVideo={hasVideo}
        muted={muted}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeaveMedia={onMouseLeaveMedia}
        hov={hov}
        videoRefs={videoRefs}
        variant={variant}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ACTION RAIL (right side, overlaid on media) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ActionRail
        v={v}
        saved={saved}
        onSave={() => onSave?.(v.id)}
        onMuteToggle={() => setMuted((m) => !m)}
        isMuted={muted}
        hasVideo={hasVideo && allMedia[slideIdx]?.type === "video"}
        hov={hov}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BOTTOM BLOCK (content, 30% of card) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <BottomBlock
        v={v}
        slideIdx={slideIdx}
        allMedia={allMedia}
        onView={onView}
        onQuickView={onQuickView}
        setShowEnquiry={setShowEnquiry}
      />

      {/* Enquiry modal */}
      {showEnquiry && (
        // TODO: Render enquiry modal
        null
      )}
    </article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (structure only, no implementation)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * MEDIA LAYER
 * Full-bleed swipeable gallery with images and video
 * Includes gradient overlay and progress bars
 */
function MediaLayer({
  allMedia,
  slideIdx,
  mediaCount,
  hasMultiple,
  hasVideo,
  muted,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeaveMedia,
  hov,
  videoRefs,
  variant,
}) {
  return (
    <div style={{ /* TODO: Style */ }}>
      {/* Swipe container */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeaveMedia}
        style={{ /* TODO: Style */ }}
      >
        {/* Media carousel */}
        <div style={{ /* TODO: Style with transform */ }}>
          {/* TODO: Map allMedia, render images + videos */}
        </div>
      </div>

      {/* Gradient overlay (vignette) */}
      <div style={{ /* TODO: Style */ }} />

      {/* Progress bars (top center) */}
      <ProgressBars slideIdx={slideIdx} mediaCount={mediaCount} hasMultiple={hasMultiple} />
    </div>
  );
}

/**
 * PROGRESS BARS
 * Max 3 bars at top-center, 8px from top
 */
function ProgressBars({ slideIdx, mediaCount, hasMultiple }) {
  if (!hasMultiple) return null;

  // TODO: Calculate bar count and active bar
  const barCount = Math.min(mediaCount, 3);

  return (
    <div style={{ /* TODO: Style */ }}>
      {/* TODO: Render barCount bars, highlight activeBar */}
    </div>
  );
}

/**
 * ACTION RAIL
 * Right side, vertically centered lower
 * Stack: save, share, compare/enquire
 */
function ActionRail({ v, saved, onSave, onMuteToggle, isMuted, hasVideo, hov }) {
  return (
    <div style={{ /* TODO: Style: position absolute, right: 12px, vertically centered */ }}>
      {/* Save / Shortlist button */}
      <button style={{ /* TODO: Style */ }} onClick={onSave}>
        {/* TODO: Save icon or heart */}
      </button>

      {/* Share button */}
      <button style={{ /* TODO: Style */ }} onClick={() => { /* TODO: Share handler */ }}>
        {/* TODO: Share icon */}
      </button>

      {/* Compare or Enquire shortcut */}
      <button style={{ /* TODO: Style */ }} onClick={() => { /* TODO: Handle */ }}>
        {/* TODO: Compare or Enquire icon */}
      </button>

      {/* Mute toggle (only on video slide) */}
      {hasVideo && (
        <button style={{ /* TODO: Style */ }} onClick={onMuteToggle}>
          {/* TODO: Mute/unmute icon */}
        </button>
      )}
    </div>
  );
}

/**
 * BOTTOM BLOCK
 * Content overlay at bottom: title, subtitle, meta, signal, CTA row
 * Padding: 18px 16px (locked)
 */
function BottomBlock({ v, slideIdx, allMedia, onView, onQuickView, setShowEnquiry }) {
  return (
    <div style={{ /* TODO: Style padding: 18px 16px */ }}>
      {/* Photographer credit (above title) */}
      {/* TODO: Conditional render if showCredit */}

      {/* Showcase indicator (above title) */}
      {/* TODO: Conditional render if v.showcaseUrl */}

      {/* TITLE (22px, 600, 1.15 line-height, max 2 lines, NO ITALIC) */}
      <h3 style={{ /* TODO: Style */ }}>{v.name}</h3>

      {/* SUBTITLE (13–14px, ~70% opacity, 1 line max) */}
      <div style={{ /* TODO: Style */ }}>{v.city}, {v.region}</div>

      {/* META ROW (12px, compact) */}
      <div style={{ /* TODO: Style */ }}>
        {/* Stars + rating */}
        {/* Tier badge (if contentScore exists) */}
        {/* Freshness text (if approved + has lastReviewedAt) */}
      </div>

      {/* SIGNAL LINE (11–12px, ONE only) */}
      <div style={{ /* TODO: Style */ }}>
        {/* TODO: Show ONE signal: Trending / Saved by X / Planner fav / High enquiry */}
        {/* NEVER stack multiple signals */}
      </div>

      {/* Description (optional, 2-line clamp) */}
      {/* TODO: Conditional render if v.desc */}

      {/* Capacity badge (venue-specific) */}
      {/* TODO: Conditional render if v.capacity */}

      {/* CTA ROW (price left, buttons right) */}
      <div style={{ /* TODO: Style flex layout */ }}>
        {/* Price (left) */}
        <div style={{ /* TODO: Style */ }}>
          From <span style={{ /* TODO: Style gold */ }}>{v.priceFrom}</span>
        </div>

        {/* CTA Buttons (right) */}
        <div style={{ /* TODO: Style flex layout */ }}>
          {/* Primary: View / Profile (gold filled) */}
          <button onClick={() => onView?.(v)} style={{ /* TODO: Style */ }}>
            View Profile
          </button>

          {/* Secondary: Enquire */}
          <button onClick={() => setShowEnquiry(true)} style={{ /* TODO: Style */ }}>
            Enquire
          </button>

          {/* Tertiary: Quick View (optional, ghost) */}
          <button onClick={() => onQuickView?.(v)} style={{ /* TODO: Style */ }}>
            QV
          </button>
        </div>
      </div>
    </div>
  );
}
