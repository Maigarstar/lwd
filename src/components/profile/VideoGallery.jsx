import { useState, useRef, useEffect } from "react";
import { useTheme, useIsMobile, SectionHeading, FB, FD } from "./ProfileDesignSystem";

const GOLD = "#C9A84C";

function VideoPlayModal({ video, videos, onSelect, onClose }) {
  const isMobile = useIsMobile();
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [ytPaused, setYtPaused] = useState(false);
  const iframeRef = useRef(null);

  const idx = videos.findIndex((v) => v.id === video.id);
  const hasPrev = idx > 0;
  const hasNext = idx < videos.length - 1;
  const vg = video.videographer;
  const isLiked = likedMap[video.id] || false;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = video.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : video.vimeoId
    ? `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1`
    : null;

  // Reset paused state when video changes
  useEffect(() => { setYtPaused(false); }, [video.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onSelect?.(videos[idx - 1]);
      if (e.key === "ArrowRight" && hasNext) onSelect?.(videos[idx + 1]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, hasPrev, hasNext, idx, videos, onSelect]);

  // YouTube auto-advance
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !video.youtubeId) return;
    const onLoad = () => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
        iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
      } catch (_) {}
    };
    iframe.addEventListener("load", onLoad);
    const onMessage = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "onStateChange") {
          if (data.info === 0 && hasNext) onSelect?.(videos[idx + 1]);
          setYtPaused(data.info === 2 || data.info === 0);
          if (data.info === 1) setYtPaused(false);
        }
      } catch (_) {}
    };
    window.addEventListener("message", onMessage);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
    };
  }, [video.youtubeId, hasNext, idx, videos, onSelect]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href + `#film-${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const navBtn = (dir, enabled, hov, setHov) => (
    <button
      onClick={() => enabled && onSelect?.(videos[dir === "prev" ? idx - 1 : idx + 1])}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous video" : "Next video"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: -52,
        width: 40, height: 40, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
        color: enabled ? (hov ? "#fff" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.15)",
        cursor: enabled ? "pointer" : "default",
        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  const shareBtn = (label, icon, onClick) => (
    <button onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 0", background: "none",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--lwd-radius-input)",
        color: "rgba(255,255,255,0.5)", fontFamily: FB, fontSize: 10,
        fontWeight: 600, letterSpacing: "0.4px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label={`Play ${video.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {videos.length}</span>
          </span>
          {vg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>🎬 {vg.name}</span>}
        </div>
        <button onClick={onClose} aria-label="Close video"
          style={{
            background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
            color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
            fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >✕</button>
      </div>

      {/* Main content: video + info panel */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        {/* Video area */}
        <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          {!isMobile && videos.length > 1 && navBtn("prev", hasPrev, hovPrev, setHovPrev)}
          {!isMobile && videos.length > 1 && navBtn("next", hasNext, hovNext, setHovNext)}

          {embedUrl ? (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative", background: "#000",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <iframe
                ref={iframeRef}
                key={video.id}
                src={embedUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
              {ytPaused && (
                <div
                  onClick={() => {
                    try {
                      iframeRef.current?.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
                      setYtPaused(false);
                    } catch (_) {}
                  }}
                  style={{
                    position: "absolute", bottom: 52, left: 0, right: 0,
                    height: "calc(100% - 100px)", zIndex: 2,
                    background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, transparent 100%)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                    paddingBottom: 40, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 20, color: "#fff", marginLeft: 3 }}>▶</span>
                  </div>
                  <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>Click to resume</div>
                </div>
              )}
            </div>
          ) : video.url ? (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative", background: "#000",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <video
                key={video.id}
                src={video.url}
                controls
                autoPlay
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
              />
            </div>
          ) : (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <img src={video.thumb} alt={video.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.2 }} />
              <div style={{ position: "relative", textAlign: "center", padding: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
                  border: `1px solid ${GOLD}59`, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${GOLD}14`,
                }}>
                  <span style={{ fontSize: 18, color: GOLD, marginLeft: 3 }}>▶</span>
                </div>
                <div style={{ fontFamily: FD, fontSize: 15, color: `${GOLD}d9`, letterSpacing: "1.5px" }}>Film Coming Soon</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 300, lineHeight: 1.65, marginTop: 8 }}>
                  This film will be available shortly.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 19 : 17, color: "#f5f2ec", lineHeight: 1.3, marginBottom: 4 }}>{video.title}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {video.duration} · {video.type === "wedding" ? "Wedding Film" : video.type === "tour" ? "Estate Tour" : "Highlights"}
            </div>
          </div>

          {/* Description */}
          {video.desc && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>About This Film</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, fontWeight: 300 }}>{video.desc}</div>
            </div>
          )}

          {/* Videographer */}
          {vg && (
            <div style={{
              marginBottom: 18, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>📍 {vg.area}</div>
              {vg.instagram && (
                <div style={{ fontFamily: FB, fontSize: 11, color: GOLD, marginBottom: 4 }}>📸 {vg.instagram}</div>
              )}
              {vg.camera && (
                <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🎥 {vg.camera}</div>
              )}
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {video.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopy)}
              {shareBtn("Email", "✉", () => {
                const s = encodeURIComponent(video.title);
                const b = encodeURIComponent(`${video.title}\n${window.location.href}#film-${video.id}`);
                window.open(`mailto:?subject=${s}&body=${b}`);
              })}
              {shareBtn("Facebook", "📘", () => {
                const u = encodeURIComponent(window.location.href + `#film-${video.id}`);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank", "width=600,height=400");
              })}
            </div>
          </div>

          {/* Appreciation */}
          <div>
            <button
              onClick={() => setLikedMap(m => ({ ...m, [video.id]: !m[video.id] }))}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: isLiked ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isLiked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "var(--lwd-radius-input)", padding: "6px 12px", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 13, transition: "transform 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>{isLiked ? "❤️" : "🤍"}</span>
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, color: isLiked ? GOLD : "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                {isLiked ? "Appreciated" : "Appreciate this film"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail strip — always shown when multiple videos */}
      {videos.length > 1 && (
        <div onClick={(e) => e.stopPropagation()} style={{
          flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: isMobile ? "8px 8px" : "8px 12px", overflow: "hidden",
        }}>
          <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "flex-start" : "center", overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none" }}>
          {videos.map((v) => (
            <div key={v.id} onClick={() => onSelect(v)}
              onMouseEnter={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.4"; }}
              style={{
                width: isMobile ? 90 : 120, height: isMobile ? 52 : 68,
                flexShrink: 0, cursor: "pointer",
                border: v.id === video.id ? `2px solid ${GOLD}` : "2px solid transparent",
                opacity: v.id === video.id ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden", position: "relative",
                borderRadius: isMobile ? 2 : 0,
              }}
            >
              <img src={v.thumb} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {v.id === video.id && (
                <div style={{
                  position: "absolute", bottom: 3, left: 0, right: 0, textAlign: "center",
                  fontFamily: FB, fontSize: 7, fontWeight: 700, letterSpacing: "0.8px",
                  textTransform: "uppercase", color: GOLD, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}>Playing</div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoGallery({ videos }) {
  const C = useTheme();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(null);
  const vg = videos[active].videographer;

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Films" subtitle="Real weddings, estate tours and highlights" />

      <div
        style={{ marginBottom: 0, position: "relative", background: "#000", cursor: "pointer", aspectRatio: "16/9", overflow: "hidden", borderRadius: isMobile ? 3 : 0 }}
        onClick={() => setPlaying(videos[active])}
        role="button"
        aria-label={`Play ${videos[active].title}`}
      >
        <img src={videos[active].thumb} alt={videos[active].title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.85 }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
          }}>
            <span style={{ fontSize: isMobile ? 16 : 20, color: "#fff", marginLeft: 3 }}>▶</span>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "32px 16px 14px" : "40px 20px 16px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          <div style={{ fontFamily: FD, fontSize: isMobile ? 17 : 20, color: "#fff" }}>{videos[active].title}</div>
          <div style={{ fontFamily: FB, fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{videos[active].duration} · {videos[active].type === "wedding" ? "Wedding Film" : videos[active].type === "tour" ? "Estate Tour" : "Highlights"}</div>
        </div>
      </div>

      <div className="vp-video-info" style={{
        padding: isMobile ? "14px 0" : "16px 20px", background: isMobile ? "transparent" : C.surface,
        border: isMobile ? "none" : `1px solid ${C.border}`, borderTop: "none",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 24, alignItems: isMobile ? "stretch" : "flex-start",
        marginBottom: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {videos[active].desc && (
            <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight, lineHeight: 1.7, marginBottom: 10 }}>{videos[active].desc}</p>
          )}
          {videos[active].tags && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {videos[active].tags.map(t => (
                <span key={t} style={{
                  fontFamily: FB, fontSize: 9, color: C.textMuted,
                  background: C.bgAlt, border: `1px solid ${C.border}`,
                  padding: "2px 7px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        {vg && (
          <div style={{
            flexShrink: 0, width: isMobile ? "100%" : 200,
            padding: "10px 14px", background: C.bgAlt,
            border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)",
            display: "flex", flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "stretch",
            gap: isMobile ? 12 : 0,
          }}>
            <div style={{ flex: isMobile ? 1 : undefined }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 15, color: C.text }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, marginTop: 2 }}>📍 {vg.area}</div>
              {vg.instagram && <div style={{ fontFamily: FB, fontSize: 11, color: C.gold || GOLD, marginTop: 2 }}>📸 {vg.instagram}</div>}
            </div>
          </div>
        )}
      </div>

      {videos.length > 1 && (isMobile ? (
        <div className="vp-films-slider" style={{
          display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          marginTop: 16, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start", cursor: "pointer" }}
              onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden", borderRadius: 3,
                border: i === active ? `2px solid ${C.gold || GOLD}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.6,
                }} />
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    padding: "12px 8px 6px", textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold || GOLD,
                  }}>Now Playing</div>
                )}
                <div onClick={(e) => { e.stopPropagation(); setPlaying(v); }} style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "6px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vp-films-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(videos.length, 4)}, 1fr)`, gap: 10, marginTop: 20 }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ cursor: "pointer" }} onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden",
                border: i === active ? `2px solid ${C.gold || GOLD}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.5, transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.5"; }}
                />
                <div
                  onClick={(e) => { e.stopPropagation(); setPlaying(v); }}
                  style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold || GOLD, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  }}>Now Playing</div>
                )}
              </div>
              <div style={{ padding: "8px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration} · {v.videographer?.name || ""}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {playing && (
        <VideoPlayModal
          video={playing}
          videos={videos}
          onSelect={(v) => setPlaying(v)}
          onClose={() => setPlaying(null)}
        />
      )}
    </section>
  );
}
