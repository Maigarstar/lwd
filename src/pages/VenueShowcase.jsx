/**
 * VenueShowcase.jsx
 * /showcase/[slug], cinematic, full-media page for a venue
 *
 * Fetches listing by slug, shows all public media items in a
 * column-masonry grid with a full-screen hero, key stats, and
 * CTAs back to the venue profile and enquiry.
 */

import { useState, useEffect, useRef } from "react";
import { fetchListingBySlug } from "../services/listings";
import { getDefaultMode } from "../theme/tokens";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const LIGHT = {
  bg:        "#0a0a08",
  surface:   "#111110",
  border:    "#2a2a26",
  gold:      "#C9A84C",
  goldDim:   "rgba(201,168,76,0.15)",
  text:      "#f5f2ec",
  textMid:   "#c8c4bc",
  textLight: "#9c9890",
  navBg:     "rgba(10,10,8,0.88)",
};
// Showcase is always dark/cinematic
const C = LIGHT;
const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [bp]);
  return mobile;
}

// Extract public image URLs from media_items JSONB array
function getPublicImages(mediaItems = []) {
  return mediaItems
    .filter(
      (item) =>
        (item.type === "image" || !item.type) &&
        (item.visibility || "public") === "public" &&
        !(item.file instanceof File) &&
        (item.url || item.src)
    )
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    })
    .map((item) => ({
      id:      item.id || item.url,
      src:     item.url || item.src,
      alt:     item.alt_text || item.title || item.caption || "",
      caption: item.caption || item.title || "",
      credit:  item.show_credit
        ? item.credit_name || item.credit_camera || null
        : null,
    }));
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function ShowcaseLightbox({ images, idx, onClose, onPrev, onNext }) {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  if (idx === null || !images[idx]) return null;
  const img = images[idx];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.95)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <img
        src={img.src} alt={img.alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "90vh",
          objectFit: "contain",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      />

      {/* Caption */}
      {img.caption && (
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.04em", textAlign: "center",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: "70vw",
        }}>
          {img.caption}
          {img.credit && `, © ${img.credit}`}
        </div>
      )}

      {/* Nav arrows */}
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={arrowStyle("left")}>‹</button>
      )}
      {idx < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={arrowStyle("right")}>›</button>
      )}

      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 24,
        background: "none", border: "none",
        color: "rgba(255,255,255,0.6)", fontSize: 28,
        cursor: "pointer", lineHeight: 1,
      }}>✕</button>

      {/* Counter */}
      <div style={{
        position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)",
        fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.1em",
      }}>
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}

function arrowStyle(side) {
  return {
    position: "absolute",
    top: "50%", transform: "translateY(-50%)",
    [side]: 20,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "50%",
    width: 48, height: 48,
    color: "#fff", fontSize: 24,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.2s",
  };
}

// ─── MASONRY GRID ─────────────────────────────────────────────────────────────
function MasonryGrid({ images, onOpen }) {
  const isMobile = useIsMobile();
  const cols = isMobile ? 2 : 3;

  // Distribute images into columns
  const columns = Array.from({ length: cols }, () => []);
  images.forEach((img, i) => columns[i % cols].push({ ...img, globalIdx: i }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {col.map((img) => (
            <div
              key={img.id}
              onClick={() => onOpen(img.globalIdx)}
              style={{
                overflow: "hidden",
                borderRadius: 2,
                cursor: "pointer",
                background: C.surface,
                position: "relative",
              }}
            >
              <img
                src={img.src} alt={img.alt}
                loading="lazy"
                style={{
                  width: "100%",
                  display: "block",
                  objectFit: "cover",
                  transition: "transform 0.4s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              />
              {img.caption && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  padding: "24px 10px 10px",
                  fontFamily: FB, fontSize: 10,
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.04em",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
                >
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function VenueShowcase({ slug, onBack }) {
  const isMobile = useIsMobile();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightIdx, setLightIdx] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef(null);

  // Fetch listing
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await fetchListingBySlug(slug);
        if (ignore) return;
        if (!data) { setNotFound(true); return; }
        setListing(data);
      } catch {
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [slug]);

  // Show sticky header after hero scrolls past
  useEffect(() => {
    const fn = () => {
      const heroH = heroRef.current?.offsetHeight || 500;
      setHeaderVisible(window.scrollY > heroH * 0.6);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `2px solid ${C.border}`,
          borderTopColor: C.gold,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        <div style={{ fontFamily: FD, fontSize: 32, color: C.text }}>Venue not found</div>
        <button onClick={onBack} style={{
          fontFamily: FB, fontSize: 13, color: C.gold,
          background: "none", border: `1px solid ${C.gold}`,
          borderRadius: 2, padding: "10px 24px", cursor: "pointer",
        }}>← Go back</button>
      </div>
    );
  }

  // Derive display values
  const images    = getPublicImages(listing.media_items || []);
  const heroImg   = images[0]?.src || null;
  const name      = listing.name || "Venue";
  const tagline   = listing.short_description || listing.card_summary || "";
  const location  = [listing.city, listing.region, listing.country].filter(Boolean).join(", ");
  const priceFrom = listing.price_from ? `From ${listing.price_from}` : null;
  const capacity  = listing.capacity_max ? `Up to ${listing.capacity_max} guests` : null;

  // SPA navigation, use onBack (goes to venue profile)
  const goProfile = onBack;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>

      {/* ── STICKY NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: headerVisible ? C.navBg : "transparent",
        backdropFilter: headerVisible ? "blur(16px)" : "none",
        borderBottom: headerVisible ? `1px solid ${C.border}` : "none",
        padding: isMobile ? "14px 20px" : "14px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.35s, border-color 0.35s, backdrop-filter 0.35s",
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "none", border: "none",
            fontFamily: FB, fontSize: 12, fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: "pointer", padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
        >
          ← Back to profile
        </button>

        {/* Name, only visible after hero scrolls off */}
        <div style={{
          fontFamily: FD, fontSize: 15,
          color: C.text,
          opacity: headerVisible ? 1 : 0,
          transition: "opacity 0.3s",
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap", overflow: "hidden",
          pointerEvents: "none",
        }}>
          {name}
        </div>

        {/* CTA */}
        <button
          onClick={goProfile}
          style={{
            fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#0a0a08",
            background: C.gold,
            padding: "9px 18px",
            borderRadius: 2,
            border: "none",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          View Full Profile
        </button>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          height: isMobile ? "70vh" : "92vh",
          overflow: "hidden",
          background: "#0a0a08",
        }}
      >
        {heroImg ? (
          <img
            src={heroImg} alt={name}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#1a1a18" }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(10,10,8,0.85) 0%, rgba(10,10,8,0.35) 40%, rgba(10,10,8,0.1) 70%, transparent 100%)",
        }} />

        {/* Text centred bottom */}
        <div style={{
          position: "absolute", bottom: isMobile ? 36 : 56,
          left: isMobile ? 20 : 64, right: isMobile ? 20 : 64,
          textAlign: "center",
        }}>
          {location && (
            <div style={{
              fontFamily: FB, fontSize: isMobile ? 10 : 11,
              fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
              color: C.gold, marginBottom: 12,
            }}>
              {location}
            </div>
          )}
          <h1 style={{
            fontFamily: FD, fontSize: isMobile ? 36 : 64,
            fontWeight: 400, lineHeight: 1.08,
            color: "#fff",
            margin: "0 0 16px",
            textShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}>
            {name}
          </h1>
          {tagline && (
            <p style={{
              fontFamily: FB, fontSize: isMobile ? 14 : 17,
              fontWeight: 300, lineHeight: 1.6,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 620, margin: "0 auto",
            }}>
              {tagline}
            </p>
          )}

          {/* Stats pills */}
          {(priceFrom || capacity) && (
            <div style={{
              display: "flex", justifyContent: "center",
              flexWrap: "wrap", gap: 10, marginTop: 24,
            }}>
              {priceFrom && (
                <span style={statPill}>{priceFrom}</span>
              )}
              {capacity && (
                <span style={statPill}>{capacity}</span>
              )}
              {listing.verified && (
                <span style={{ ...statPill, borderColor: C.gold, color: C.gold }}>
                  ✦ LWD Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          fontFamily: FB, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <span>Scroll to explore</span>
          <span style={{ fontSize: 16, lineHeight: 1 }}>↓</span>
        </div>
      </div>

      {/* ── IMAGE COUNT BAR ────────────────────────────────────────────── */}
      {images.length > 1 && (
        <div style={{
          padding: isMobile ? "14px 20px" : "16px 64px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: FB, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.textLight,
          }}>
            {images.length} images
          </span>
          <span style={{
            fontFamily: FB, fontSize: 10, color: C.textLight,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Click to enlarge
          </span>
        </div>
      )}

      {/* ── GALLERY GRID ───────────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? "16px 12px" : "24px 24px 0" }}>
        {images.length > 0 ? (
          <MasonryGrid images={images} onOpen={(i) => setLightIdx(i)} />
        ) : (
          <div style={{
            padding: "80px 0", textAlign: "center",
            fontFamily: FB, fontSize: 14, color: C.textLight,
          }}>
            No images available yet
          </div>
        )}
      </div>

      {/* ── FOOTER CTA ─────────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? "56px 20px" : "80px 64px",
        textAlign: "center",
        borderTop: `1px solid ${C.border}`,
        marginTop: 40,
      }}>
        <div style={{
          fontFamily: FB, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: C.gold, marginBottom: 16,
        }}>
          {name}
        </div>
        <h2 style={{
          fontFamily: FD, fontSize: isMobile ? 28 : 40,
          fontWeight: 400, color: C.text,
          margin: "0 0 12px",
        }}>
          Begin your story here
        </h2>
        <p style={{
          fontFamily: FB, fontSize: 14, color: C.textMid,
          fontWeight: 300, maxWidth: 480, margin: "0 auto 32px",
        }}>
          Explore the full venue profile, spaces, dining, and get in touch with the team.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={goProfile}
            style={{
              fontFamily: FB, fontSize: 13, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#0a0a08",
              background: C.gold,
              padding: "14px 32px",
              borderRadius: 2,
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            View Full Profile
          </button>
          <button
            onClick={goProfile}
            style={{
              fontFamily: FB, fontSize: 13, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: C.text,
              background: "transparent",
              border: `1px solid ${C.border}`,
              padding: "14px 32px",
              borderRadius: 2,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.textLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          >
            Begin Enquiry
          </button>
        </div>
      </div>

      {/* ── LIGHTBOX ───────────────────────────────────────────────────── */}
      <ShowcaseLightbox
        images={images}
        idx={lightIdx}
        onClose={() => setLightIdx(null)}
        onPrev={() => setLightIdx((i) => Math.max(0, i - 1))}
        onNext={() => setLightIdx((i) => Math.min(images.length - 1, i + 1))}
      />

    </div>
  );
}

const statPill = {
  padding: "6px 16px",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 20,
  fontFamily: FB,
  fontSize: 12,
  fontWeight: 500,
  color: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  background: "rgba(255,255,255,0.06)",
};
