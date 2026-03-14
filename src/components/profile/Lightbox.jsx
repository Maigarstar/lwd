import { useState, useEffect, useRef } from "react";
import { useTheme, useIsMobile, Icon, FB, FD } from "./ProfileDesignSystem";

export default function Lightbox({ gallery, idx, onClose, onPrev, onNext, setLightIdx, engagement }) {
  const isMobile = useIsMobile();
  const [autoPlay, setAutoPlay] = useState(false);
  const [hovPrev, setHovPrev]   = useState(false);
  const [hovNext, setHovNext]   = useState(false);
  const [viewAll, setViewAll]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const thumbRef = useRef(null);

  const photo = gallery[idx];
  // Support both nested photographer object (legacy) and flat credit fields
  // (new media_items shape from Listing Studio / mediaMappers.js).
  const pg = photo?.photographer?.name
    ? photo.photographer
    : (photo?.credit_name ? {
        name:      photo.credit_name,
        instagram: photo.credit_instagram || '',
        website:   photo.credit_website   || '',
        camera:    photo.credit_camera    || '',
        area:      photo.location         || '',
      } : null);
  const eng = engagement?.[photo?.id] || { likes: 0, comments: [] };
  const isLiked = likedMap[photo?.id] || false;
  const likeCount = eng.likes + (isLiked ? 1 : 0);
  const allComments = [...(eng.comments || []), ...(commentsMap[photo?.id] || [])];

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") { if (viewAll) setViewAll(false); else onClose(); }
      if (e.key === "ArrowLeft" && !viewAll) onPrev();
      if (e.key === "ArrowRight" && !viewAll) onNext();
      if (e.key === " ") { e.preventDefault(); setAutoPlay((a) => !a); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext, viewAll]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => onNext(), 3000);
    return () => clearInterval(timer);
  }, [autoPlay, onNext]);

  useEffect(() => {
    if (thumbRef.current) {
      const active = thumbRef.current.children[idx];
      if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [idx]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href + `#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Photo ${idx + 1}`);
    const body = encodeURIComponent(`Check out this photo:\n${photo.alt || ""}\n\nPhotographer: ${pg?.name || "Unknown"}\n${window.location.href}#photo-${photo.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.href);
    const media = encodeURIComponent(photo.src);
    const desc = encodeURIComponent(`${photo.alt || "Photo"}, Photo by ${pg?.name || ""}`);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, "_blank", "width=600,height=400");
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href + `#photo-${photo.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(`${photo.alt || "Photo"}, Photo by ${pg?.name || ""}\n${window.location.href}#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open("https://www.instagram.com/", "_blank");
    });
  };

  if (idx === null) return null;

  const navBtn = (dir, hov, setHov) => (
    <button
      onClick={(e) => { e.stopPropagation(); dir === "prev" ? onPrev() : onNext(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous photo" : "Next photo"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: 16,
        width: 44, height: 44, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}`,
        backdropFilter: "blur(4px)",
        color: hov ? "#fff" : "rgba(255,255,255,0.7)",
        cursor: "pointer", fontSize: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", zIndex: 10,
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  const shareBtn = (label, icon, onClick, hov) => (
    <button
      onClick={onClick}
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

  if (viewAll) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(5,4,3,0.97)", zIndex: 2000,
        overflow: "auto", padding: "60px 40px 40px",
      }}>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "16px 40px", background: "rgba(5,4,3,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: FD, fontSize: 18, color: "#f5f2ec" }}>
            All Photos <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{gallery.length} photographs</span>
          </div>
          <button onClick={() => setViewAll(false)} aria-label="Close grid view"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        <div style={{ columns: 4, columnGap: 8 }}>
          {gallery.map((img, i) => (
            <div key={img.id} onClick={() => { setViewAll(false); setLightIdx?.(i); }}
              style={{ breakInside: "avoid", marginBottom: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <img src={img.src} alt={img.alt || ""} style={{ width: "100%", display: "block", transition: "transform 0.5s, opacity 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
              />
              {img.tags && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "24px 8px 6px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  display: "flex", flexWrap: "wrap", gap: 3, opacity: 0, transition: "opacity 0.3s",
                }}
                  className="lwd-tag-overlay"
                >
                  {img.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.8)",
                      background: "rgba(255,255,255,0.12)", padding: "2px 6px",
                      borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 2000,
      display: "flex", flexDirection: "column",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {gallery.length}</span>
          </span>
          {pg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>📷 {pg.name}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <button onClick={() => setAutoPlay((a) => !a)}
              style={{
                background: autoPlay ? "rgba(201,168,76,0.12)" : "none",
                border: `1px solid ${autoPlay ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: "var(--lwd-radius-input)", color: autoPlay ? "#C9A84C" : "rgba(255,255,255,0.5)",
                padding: "6px 14px", cursor: "pointer", fontFamily: FB, fontSize: 11,
                fontWeight: 600, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
              }}
            >
              {autoPlay ? "❚❚" : "▶"} {autoPlay ? "Pause" : "Slideshow"}
            </button>
          )}
          {!isMobile && (
            <button onClick={() => setViewAll(true)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--lwd-radius-input)",
                color: "rgba(255,255,255,0.5)", padding: "6px 14px", cursor: "pointer",
                fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              ⊞ View All
            </button>
          )}
          <button onClick={onClose} aria-label="Close gallery"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >✕</button>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        <div onClick={onClose} style={{
          flex: isMobile ? "none" : 1, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden", minWidth: 0,
          minHeight: isMobile ? "50vh" : undefined,
        }}>
          <img
            key={idx}
            src={photo.src}
            alt={photo.alt || ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "100%", maxWidth: "100%", objectFit: "contain",
              animation: "fadeIn 0.3s ease",
            }}
          />
          {isMobile ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </>
          ) : (
            <>
              {navBtn("prev", hovPrev, setHovPrev)}
              {navBtn("next", hovNext, setHovNext)}
            </>
          )}

          {autoPlay && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
              background: "rgba(255,255,255,0.08)",
            }}>
              <div style={{
                height: "100%", background: "#C9A84C",
                animation: "lightbox-progress 3s linear infinite",
              }} />
            </div>
          )}
        </div>

        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {photo.alt && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, fontWeight: 300 }}>{photo.alt}</div>
            </div>
          )}

          {pg && (
            <div style={{
              marginBottom: 20, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Photographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{pg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.45)" /> {pg.area}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pg.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "#C9A84C" }}>{pg.instagram}</span>
                  </div>
                )}
                {pg.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="globe" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pg.website}</span>
                  </div>
                )}
                {pg.camera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>📷</span>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{pg.camera}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {photo.tags && photo.tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {photo.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    transition: "all 0.2s", cursor: "default",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopyLink)}
              {shareBtn("Pin", "📌", handlePinterestShare)}
              {shareBtn("Email", "✉", handleEmailShare)}
              {shareBtn("Facebook", "📘", handleFacebookShare)}
              {shareBtn("Instagram", "📷", handleInstagramShare)}
            </div>
          </div>

          <div style={{
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Image Info</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Photo {idx + 1} of {gallery.length}<br />
              {pg ? `© ${pg.name}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 12px", overflow: "hidden",
      }}>
        <div ref={thumbRef} className="lwd-thumb-strip" style={{
          display: "flex", gap: 4, overflowX: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {gallery.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setLightIdx?.(i)}
              style={{
                flexShrink: 0, width: 72, height: 48, cursor: "pointer",
                border: i === idx ? "2px solid #C9A84C" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.4"; }}
            >
              <img src={img.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
