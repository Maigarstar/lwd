// ─── src/pages/MostLovedPage.jsx ─────────────────────────────────────────────
// Public-facing "Most Loved Wedding Moments" feed.
// Ranked by engagement score: views×1 + clicks×3 + dwell×2 + shares×5 + enquiries×8
// Three time lenses: This Month (30d) · Trending (7d) · Evergreen (90d)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import HomeNav from "../components/nav/HomeNav";
import ImageInteractionBar from "../components/media/ImageInteractionBar";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.08)";
const GOLD_BORDER = "rgba(201,168,76,0.22)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const LENSES = [
  { key: "30d", label: "Most Loved This Month",  days: 30, tagline: "What couples are saving right now"     },
  { key: "7d",  label: "Trending This Week",     days: 7,  tagline: "Rising fast across the platform"      },
  { key: "90d", label: "Evergreen Favourites",   days: 90, tagline: "Consistently loved over three months" },
];

// Label rules based on engagement characteristics
function deriveBadge(img, rank) {
  if (rank === 1)                                   return { text: "Most Loved",      color: GOLD };
  if (Number(img.shares) >= 5)                      return { text: "Most Shared",     color: "#a78bfa" };
  if (Number(img.enquiries) >= 3)                   return { text: "Driving Enquiries", color: "#4ade80" };
  if (Number(img.clicks) >= 20)                     return { text: "Trending Now",    color: "#f59e0b" };
  if (Number(img.views) >= 50)                      return { text: "Widely Seen",     color: "rgba(255,255,255,0.5)" };
  return null;
}

function ImageCard({ img, rank, onListingClick }) {
  const [imgError, setImgError]   = useState(false);
  const [hovered,  setHovered]    = useState(false);
  const badge = deriveBadge(img, rank);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1a1714",
        border: `1px solid ${hovered ? GOLD_BORDER : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 36px rgba(201,168,76,0.10)" : "none",
        display: "flex", flexDirection: "column",
      }}
      onClick={() => img.listing_id && onListingClick(img)}
    >
      {/* Thumbnail */}
      <div style={{ width: "100%", aspectRatio: "4/3",
        overflow: "hidden", position: "relative",
        background: "rgba(255,255,255,0.04)" }}>
        {img.image_url && !imgError ? (
          <img
            src={img.image_url}
            alt={img.title || "wedding image"}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              display: "block",
              transition: "transform 0.4s ease",
              transform: hovered ? "scale(1.05)" : "scale(1)" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, opacity: 0.15 }}>🖼</div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(20,15,10,0.80) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Rank */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: rank === 1 ? GOLD : "rgba(0,0,0,0.60)",
          backdropFilter: "blur(4px)",
          color: rank === 1 ? "#1a1714" : "rgba(255,255,255,0.85)",
          fontFamily: GD, fontSize: 11, fontWeight: 700,
          borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          #{rank}
        </div>

        {/* Badge */}
        {badge && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            borderRadius: 20, padding: "3px 10px",
            fontFamily: NU, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.5px", color: badge.color,
          }}>
            {badge.text}
          </div>
        )}

        {/* Engagement score (bottom right) */}
        {Number(img.engagement_score) > 0 && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            borderRadius: 20, padding: "3px 10px",
            fontFamily: GD, fontSize: 11, fontWeight: 700, color: GOLD,
          }}>
            ✦ {Math.round(Number(img.engagement_score))}
          </div>
        )}

        {/* Listing name overlay (bottom left) */}
        {img.listing_name && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.90)",
            maxWidth: "calc(100% - 80px)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {img.listing_name}
          </div>
        )}
      </div>

      {/* Info strip */}
      <div style={{ padding: "12px 14px 14px",
        display: "flex", flexDirection: "column", gap: 6 }}>

        {/* Title */}
        {img.title && img.title !== img.media_id && (
          <div style={{
            fontFamily: NU, fontSize: 13, fontWeight: 600,
            color: "rgba(255,255,255,0.85)", lineHeight: 1.3,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {img.title}
          </div>
        )}

        {/* Meta row: category + location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {img.category && (
            <span style={{
              fontFamily: NU, fontSize: 9, letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "2px 8px",
            }}>
              {img.category}
            </span>
          )}
          {(img.region || img.country) && (
            <span style={{ fontFamily: NU, fontSize: 10,
              color: "rgba(255,255,255,0.35)" }}>
              {[img.region, img.country].filter(Boolean).join(", ")}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
          {[
            { v: img.views,     l: "views"     },
            { v: img.clicks,    l: "clicks"    },
            { v: img.enquiries, l: "enquiries" },
          ].map(s => Number(s.v) > 0 && (
            <span key={s.l} style={{ fontFamily: NU, fontSize: 10,
              color: "rgba(255,255,255,0.35)" }}>
              <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.60)" }}>
                {s.v}
              </span>{" "}{s.l}
            </span>
          ))}
        </div>

        {/* Like · Rate · Share */}
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <ImageInteractionBar
            mediaId={img.media_id}
            listingId={img.listing_id}
            imageUrl={img.image_url}
            listingName={img.listing_name}
            compact
          />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MostLovedPage({ onViewVenue }) {
  const [lens,    setLens]    = useState("30d");
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const currentLens = LENSES.find(l => l.key === lens) || LENSES[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const days = LENSES.find(l => l.key === lens)?.days || 30;
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    const to   = new Date().toISOString();

    try {
      const res = await Promise.resolve(
        supabase.rpc("get_top_platform_images", { p_from: from, p_to: to, p_limit: 30 })
      );

      if (res?.data?.length) {
        setImages(res.data);
      } else {
        // Fallback: featured + recent images from media_ai_index
        const fb = await Promise.resolve(
          supabase.from("media_ai_index")
            .select("media_id, url, title, alt_text, listing_name, listing_id, category, region, country, is_featured, created_at")
            .not("url", "is", null)
            .order("is_featured", { ascending: false })
            .order("created_at",  { ascending: false })
            .limit(30)
        );
        setImages((fb?.data || []).map(r => ({
          media_id:         r.media_id,
          image_url:        r.url,
          title:            r.title || r.alt_text || "",
          listing_name:     r.listing_name,
          listing_id:       r.listing_id,
          category:         r.category,
          region:           r.region,
          country:          r.country,
          is_featured:      r.is_featured,
          views: 0, clicks: 0, shares: 0, enquiries: 0,
          engagement_score: 0,
          created_at:       r.created_at,
        })));
      }
    } catch (err) {
      setError("Something went wrong loading images. Please try again.");
    }

    setLoading(false);
  }, [lens]);

  useEffect(() => { load(); }, [load]);

  function handleListingClick(img) {
    if (!img.listing_id) return;
    if (onViewVenue) onViewVenue(img.listing_id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#100e0c", color: "#F5F0E8" }}>
      <HomeNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 120, paddingBottom: 56, textAlign: "center", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 280,
          background: "radial-gradient(ellipse, rgba(201,168,76,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "4px",
          textTransform: "uppercase", color: GOLD, marginBottom: 16, position: "relative" }}>
          ✦ Curated by the Platform
        </div>
        <h1 style={{
          fontFamily: GD, fontSize: "clamp(32px, 5vw, 54px)",
          fontWeight: 700, fontStyle: "italic",
          color: "#F5F0E8", marginBottom: 14, lineHeight: 1.15,
          position: "relative",
        }}>
          Most Loved Wedding Moments
        </h1>
        <p style={{ fontFamily: NU, fontSize: 15, color: "rgba(245,240,232,0.55)",
          maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6, position: "relative" }}>
          The images couples are saving, sharing, and enquiring about — ranked by real engagement across the platform.
        </p>

        {/* Lens selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, position: "relative" }}>
          {LENSES.map(l => (
            <button
              key={l.key}
              onClick={() => setLens(l.key)}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 600,
                padding: "8px 18px",
                border: `1px solid ${lens === l.key ? GOLD : "rgba(255,255,255,0.12)"}`,
                background: lens === l.key ? GOLD_DIM : "transparent",
                color: lens === l.key ? GOLD : "rgba(255,255,255,0.50)",
                borderRadius: 40,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        {/* Lens tagline */}
        <div style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.28)",
          marginTop: 12, letterSpacing: "0.5px", position: "relative" }}>
          {currentLens.tagline}
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 80px" }}>

        {error && (
          <div style={{
            textAlign: "center", padding: "32px",
            fontFamily: NU, fontSize: 13, color: "rgba(255,255,255,0.40)",
          }}>
            {error}{" "}
            <button onClick={load} style={{
              color: GOLD, background: "none", border: "none",
              fontFamily: NU, fontSize: 13, cursor: "pointer",
              textDecoration: "underline",
            }}>Try again</button>
          </div>
        )}

        {loading && (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
                <div style={{ aspectRatio: "4/3",
                  background: "rgba(255,255,255,0.04)",
                  animation: "shimmer 1.4s ease infinite" }} />
                <div style={{ background: "#1a1714", padding: "14px", height: 60 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {images.map((img, i) => (
              <ImageCard
                key={img.media_id || i}
                img={img}
                rank={i + 1}
                onListingClick={handleListingClick}
              />
            ))}
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: "italic",
              color: "rgba(245,240,232,0.40)", marginBottom: 10 }}>
              Images loading soon
            </div>
            <div style={{ fontFamily: NU, fontSize: 13,
              color: "rgba(245,240,232,0.25)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
              As couples engage with listings, the most loved images will surface here — ranked by real platform activity.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
