import { useMemo, useState, useCallback } from "react";
import LightboxModal from "../components/ui/LightboxModal";
import SliderNav from "../components/ui/SliderNav";

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523438097201-512ae7d59c2a?auto=format&fit=crop&w=2000&q=80";

function clampNum(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function stars(r = 0) {
  const x = clampNum(Math.round(r), 0, 5);
  return "★".repeat(x) + "☆".repeat(5 - x);
}

const navBtnStyle = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: FD, fontSize: 28, color: "#111", lineHeight: 1.15 }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ fontFamily: FB, fontSize: 12, color: "#9a8a63", marginTop: 6 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function CardGrid3({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 16,
      }}
      className="lwd-stack900"
    >
      {children}
    </div>
  );
}

function SimilarGrid({ items, onView }) {
  return (
    <CardGrid3>
      {items.map((v) => (
        <div
          key={v.id || v.name}
          style={{
            border: "1px solid rgba(15,18,19,0.12)",
            background: "#fff",
            overflow: "hidden",
            cursor: "pointer",
            borderRadius: 18,
          }}
          onClick={() => onView?.(v)}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <div style={{ overflow: "hidden", aspectRatio: "1 / 1" }}>
            <img
              src={v.img || v.image || v.imgs?.[0] || FALLBACK_IMG}
              alt={v.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ fontFamily: FD, fontSize: 18, color: "#111", marginBottom: 6 }}>
              {v.name}
            </div>
            <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(0,0,0,0.55)", marginBottom: 10 }}>
              {v.location || v.region || v.city || ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FB, fontSize: 12, color: "#9a8a63" }}>{stars(v.rating || 0)}</span>
                <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                  {v.reviews ? `${v.reviews} reviews` : ""}
                </span>
              </div>
              {v.priceFrom || v.price ? (
                <span style={{ fontFamily: FD, fontSize: 16, color: "#9a8a63" }}>
                  From {v.priceFrom || v.price}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </CardGrid3>
  );
}

export default function ProfileTemplateBase({
  C,
  hero,
  sidebar,
  children,

  galleryTitle = "Gallery",
  galleryItems = [],
  videoUrl = null,
  videoThumb = null,

  similarTitle = "You Might Also Love",
  similarSubtitle = "✦ Curated by Aura based on your browsing",
  similarItems = [],
  onViewSimilar,

  recentTitle = "Recently Viewed",
  recentSubtitle = "✦ Based on your browsing history",
  recentItems = [],
  onViewRecent,

  maxWidth = 1280,
  sidebarWidth = 360,
  stickyTop = 56,
}) {
  const surface = "#fff";
  const border = "rgba(15,18,19,0.12)";
  const text = "#111";
  const textLight = "rgba(0,0,0,0.55)";
  const gold = "#9a8a63";

  const media = useMemo(() => {
    const items = [];
    if (videoUrl) items.push({ kind: "video", videoUrl, thumb: videoThumb });
    (galleryItems || []).forEach((src) => items.push({ kind: "image", src }));
    return items;
  }, [galleryItems, videoUrl, videoThumb]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const openMedia = useCallback((i) => {
    setLightboxIdx(i);
    setLightboxOpen(true);
  }, []);

  return (
    <div style={{ background: surface, minHeight: "100vh", color: text }}>
      {hero}

      <div
        style={{
          maxWidth,
          margin: "0 auto",
          padding: "clamp(28px, 4vw, 44px) clamp(16px, 4vw, 40px) 120px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `minmax(0, 1fr) ${sidebarWidth}px`,
            gap: 56,
            alignItems: "start",
          }}
        >
          <div>
            {children}

            {(media.length > 0) && (
              <section style={{ padding: "56px 0", borderTop: `1px solid ${border}` }}>
                <SectionHeading title={galleryTitle} subtitle="Tap to view" />

                <SliderNav cardWidth={480} gap={12}>
                  {media.map((m, i) => {
                    const isVideo = m.kind === "video";
                    const imgSrc = isVideo ? (m.thumb || FALLBACK_IMG) : m.src;

                    return (
                      <div
                        key={`${m.kind}-${i}`}
                        onClick={() => openMedia(i)}
                        style={{
                          flex: "0 0 480px",
                          borderRadius: 18,
                          overflow: "hidden",
                          border: `1px solid ${border}`,
                          background: surface,
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt={isVideo ? "Video preview" : `Gallery ${i + 1}`}
                          loading="lazy"
                          style={{ width: "100%", height: 340, objectFit: "cover", display: "block" }}
                        />
                        {isVideo ? (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(0,0,0,0.15)",
                            }}
                          >
                            <div
                              style={{
                                width: 54,
                                height: 54,
                                borderRadius: 999,
                                background: "rgba(0,0,0,0.6)",
                                border: "2px solid rgba(255,255,255,0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </SliderNav>
              </section>
            )}

            {(similarItems || []).length > 0 && (
              <section style={{ padding: "56px 0", borderTop: `1px solid ${border}` }}>
                <SectionHeading title={similarTitle} subtitle={similarSubtitle} />
                <SimilarGrid items={similarItems} onView={onViewSimilar} />
              </section>
            )}

            {(recentItems || []).length > 0 && (
              <section style={{ padding: "56px 0", borderTop: `1px solid ${border}` }}>
                <SectionHeading title={recentTitle} subtitle={recentSubtitle} />
                <SimilarGrid items={recentItems} onView={onViewRecent} />
              </section>
            )}
          </div>

          <div
            className="vpt-sidebar"
            style={{
              position: "sticky",
              top: stickyTop,
              alignSelf: "start",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {sidebar}
          </div>
        </div>
      </div>

      <LightboxModal isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={960} bare>
        {media[lightboxIdx] ? (
          <div style={{ position: "relative" }}>
            {media[lightboxIdx].kind === "video" ? (
              <video
                src={media[lightboxIdx].videoUrl}
                controls
                preload="metadata"
                style={{ width: "100%", maxHeight: "85vh", background: "#000", display: "block" }}
              />
            ) : (
              <img
                src={media[lightboxIdx].src}
                alt={`Gallery ${lightboxIdx + 1}`}
                style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }}
              />
            )}

            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-between",
                padding: "0 12px",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              {lightboxIdx > 0 ? (
                <button
                  onClick={() => setLightboxIdx((p) => p - 1)}
                  style={{ ...navBtnStyle, pointerEvents: "auto" }}
                  aria-label="Previous"
                >
                  ‹
                </button>
              ) : (
                <div />
              )}

              {lightboxIdx < media.length - 1 ? (
                <button
                  onClick={() => setLightboxIdx((p) => p + 1)}
                  style={{ ...navBtnStyle, pointerEvents: "auto" }}
                  aria-label="Next"
                >
                  ›
                </button>
              ) : (
                <div />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: FB,
                fontSize: 11,
                color: "rgba(255,255,255,0.75)",
                background: "rgba(0,0,0,0.55)",
                padding: "4px 12px",
                borderRadius: 999,
              }}
            >
              {lightboxIdx + 1} / {media.length}
            </div>
          </div>
        ) : null}
      </LightboxModal>
    </div>
  );
}