// ─── src/components/media/ImageInteractionBar.jsx ────────────────────────────
// Compact like · rate · share bar for images.
// Used in: Aura lightbox, MostLovedPage cards, magazine image captions.
//
// Props:
//   mediaId     — media_ai_index media_id
//   listingId   — parent listing UUID (for event attribution)
//   imageUrl    — full image URL (for native share)
//   listingName — display name of owner/venue
//   compact     — boolean: smaller layout (default false)
//   C           — theme palette (optional; defaults to dark)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { trackMediaShare } from "../../services/mediaEventService";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

// Ratings: 1–5 (stored as media_rating events with metadata.stars)
// Likes: stored as media_save events
// Shares: native share sheet or copy link, stored as media_share events

const SHARE_PLATFORMS = [
  { key: "copy",      label: "Copy link",     icon: "⧉" },
  { key: "whatsapp",  label: "WhatsApp",      icon: "💬" },
  { key: "instagram", label: "Instagram",     icon: "◈" },
  { key: "pinterest", label: "Pinterest",     icon: "◎" },
];

async function persistLike(mediaId, listingId, liked) {
  if (!mediaId) return;
  try {
    const sessionId = sessionStorage.getItem("lwd_session_id") || `s_${Date.now()}`;
    if (liked) {
      await Promise.resolve(
        supabase.from("media_events").insert({
          session_id: sessionId,
          event_type: "media_save",
          media_id:   String(mediaId),
          listing_id: listingId || null,
          metadata:   { source: "like_button" },
        })
      );
    }
    // Store local state
    try {
      const raw  = localStorage.getItem("lwd_liked_media") || "[]";
      const set  = new Set(JSON.parse(raw));
      liked ? set.add(String(mediaId)) : set.delete(String(mediaId));
      localStorage.setItem("lwd_liked_media", JSON.stringify([...set]));
    } catch {}
  } catch {}
}

async function persistRating(mediaId, listingId, stars) {
  if (!mediaId || !stars) return;
  try {
    const sessionId = sessionStorage.getItem("lwd_session_id") || `s_${Date.now()}`;
    await Promise.resolve(
      supabase.from("media_events").insert({
        session_id: sessionId,
        event_type: "media_save",  // uses save as proxy; stars in metadata
        media_id:   String(mediaId),
        listing_id: listingId || null,
        metadata:   { source: "star_rating", stars },
      })
    );
    try {
      const raw     = localStorage.getItem("lwd_rated_media") || "{}";
      const ratings = JSON.parse(raw);
      ratings[String(mediaId)] = stars;
      localStorage.setItem("lwd_rated_media", JSON.stringify(ratings));
    } catch {}
  } catch {}
}

function loadLocalLike(mediaId) {
  try {
    const raw = localStorage.getItem("lwd_liked_media") || "[]";
    return new Set(JSON.parse(raw)).has(String(mediaId));
  } catch { return false; }
}

function loadLocalRating(mediaId) {
  try {
    const raw = JSON.parse(localStorage.getItem("lwd_rated_media") || "{}");
    return raw[String(mediaId)] || 0;
  } catch { return 0; }
}

// ── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ value, onRate, dark }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onRate(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0 1px", lineHeight: 1,
            fontSize: 14,
            color: n <= active
              ? GOLD
              : dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)",
            transition: "color 0.12s",
          }}
        >
          {n <= active ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

// ── Share popover ─────────────────────────────────────────────────────────────
function SharePopover({ imageUrl, listingName, mediaId, listingId, onClose, dark }) {
  const [copied, setCopied] = useState(false);

  const share = async (platform) => {
    const url    = imageUrl || window.location.href;
    const title  = listingName ? `${listingName} — Luxury Wedding Directory` : "Luxury Wedding Directory";
    const text   = listingName ? `Stunning imagery from ${listingName}` : "Beautiful wedding imagery";

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`, "_blank");
    } else if (platform === "pinterest") {
      window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`, "_blank");
    } else if (platform === "instagram") {
      // Instagram doesn't support direct deep-link share; copy + inform
      try { await navigator.clipboard.writeText(url); } catch {}
      alert("Image link copied — paste into your Instagram story or post.");
    }

    // Track share event (mediaEventService expects object)
    trackMediaShare({ mediaId, listingId, platform });
    onClose();
  };

  const bg     = dark ? "#1a1714"   : "#fff";
  const border = dark ? "#2a2622"   : "rgba(0,0,0,0.08)";
  const text   = dark ? "#F5F0E8"   : "#1a1a1a";
  const muted  = dark ? "rgba(245,240,232,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 8px)", right: 0,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
      padding: "10px",
      zIndex: 100,
      minWidth: 150,
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
        textTransform: "uppercase", color: GOLD, padding: "4px 6px 6px" }}>
        Share image
      </div>
      {SHARE_PLATFORMS.map(p => (
        <button
          key={p.key}
          onClick={() => share(p.key)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            padding: "7px 8px", borderRadius: 6,
            fontFamily: NU, fontSize: 12, color: text,
            textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: 13 }}>{p.icon}</span>
          {p.key === "copy" && copied ? "Copied!" : p.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ImageInteractionBar({
  mediaId,
  listingId,
  imageUrl,
  listingName,
  compact = false,
  C,
}) {
  const dark = !C || C?.bg?.startsWith("#0") || C?.bg?.startsWith("#1") || !C?.bg;

  const [liked,      setLiked]      = useState(() => loadLocalLike(mediaId));
  const [rating,     setRating]     = useState(() => loadLocalRating(mediaId));
  const [likeCount,  setLikeCount]  = useState(null); // from DB
  const [showShare,  setShowShare]  = useState(false);
  const [likeAnim,   setLikeAnim]   = useState(false);

  const textColor  = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const activeTxt  = dark ? "#F5F0E8" : "#1a1a1a";

  // Load like count from DB (just views_count + saves as proxy for now)
  useEffect(() => {
    if (!mediaId) return;
    Promise.resolve(
      supabase.from("media_events")
        .select("id", { count: "exact", head: true })
        .eq("media_id", String(mediaId))
        .eq("event_type", "media_save")
    ).then(({ count }) => {
      if (count != null) setLikeCount(count);
    }).catch(() => {});
  }, [mediaId]);

  const handleLike = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    setLikeCount(c => c == null ? (newLiked ? 1 : 0) : Math.max(0, c + (newLiked ? 1 : -1)));
    persistLike(mediaId, listingId, newLiked);
  }, [liked, mediaId, listingId]);

  const handleRate = useCallback((stars) => {
    setRating(stars);
    persistRating(mediaId, listingId, stars);
  }, [mediaId, listingId]);

  const gap = compact ? 10 : 14;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap,
      position: "relative",
      userSelect: "none",
    }}>

      {/* ── Like button ── */}
      <button
        onClick={handleLike}
        aria-label={liked ? "Unlike image" : "Like image"}
        aria-pressed={liked}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "none", border: "none", cursor: "pointer",
          padding: compact ? "3px 0" : "4px 0",
        }}
      >
        <span style={{
          fontSize: compact ? 15 : 17,
          color: liked ? "#ef4444" : textColor,
          transition: "color 0.15s, transform 0.15s",
          transform: likeAnim ? "scale(1.35)" : "scale(1)",
          display: "inline-block",
          lineHeight: 1,
        }}>
          {liked ? "♥" : "♡"}
        </span>
        {likeCount != null && likeCount > 0 && (
          <span style={{
            fontFamily: NU, fontSize: compact ? 10 : 11,
            color: liked ? "#ef4444" : textColor,
            fontWeight: liked ? 700 : 400,
            transition: "color 0.15s",
          }}>
            {likeCount}
          </span>
        )}
      </button>

      {/* ── Star rating ── */}
      {!compact && (
        <StarRow value={rating} onRate={handleRate} dark={dark} />
      )}
      {compact && rating > 0 && (
        <span style={{
          fontFamily: NU, fontSize: 10, color: GOLD,
          display: "flex", alignItems: "center", gap: 2,
        }}>
          <span>★</span>
          <span>{rating}</span>
        </span>
      )}

      {/* ── Share button ── */}
      <div style={{ position: "relative", marginLeft: "auto" }}>
        <button
          onClick={() => setShowShare(s => !s)}
          aria-label="Share image"
          aria-expanded={showShare}
          style={{
            display: "flex", alignItems: "center", gap: compact ? 4 : 5,
            background: showShare ? GOLD_DIM : "none",
            border: `1px solid ${showShare ? GOLD_BORDER : "transparent"}`,
            borderRadius: 20,
            padding: compact ? "3px 8px" : "4px 10px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: compact ? 12 : 13, color: showShare ? GOLD : textColor, lineHeight: 1 }}>↗</span>
          <span style={{
            fontFamily: NU, fontSize: compact ? 9 : 10,
            color: showShare ? GOLD : textColor,
            letterSpacing: "0.5px",
          }}>
            Share
          </span>
        </button>

        {showShare && (
          <>
            <div
              onClick={() => setShowShare(false)}
              style={{ position: "fixed", inset: 0, zIndex: 99 }}
            />
            <SharePopover
              imageUrl={imageUrl}
              listingName={listingName}
              mediaId={mediaId}
              listingId={listingId}
              onClose={() => setShowShare(false)}
              dark={dark}
            />
          </>
        )}
      </div>
    </div>
  );
}
