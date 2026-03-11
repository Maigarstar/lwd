// ─── src/components/sections/SlimHeroStudio.jsx ────────────────────────────
// Studio variant of SlimHero — identical visuals, full-bleed YouTube/Vimeo fix.
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";
import { CATS, LOCATIONS } from "../../data/globalVendors";
import { COUNTRIES as GEO_COUNTRIES, getRegionSlugByName } from "../../data/geo";
import { SplitText } from "../ui/Animations";

// Hero CATS id → geo VENDOR_CATEGORIES slug
const CAT_ID_TO_GEO = {
  venues: "wedding-venues", planners: "wedding-planners", "hair-makeup": "hair-makeup",
  photographers: "photographers", videographers: "videographers", "bridal-dresses": "bridal-wear",
  flowers: "florists", "styling-decor": "event-design", cakes: "wedding-cakes",
  stationery: "stationery", caterers: "caterers", entertainment: "entertainment",
  "luxury-transport": "transport",
};

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

/* ── Clever-search location field (internal) ─────────────────────────────── */
function LocationSearchField({ value, onChange, placeholder, items, ariaLabel, onEnter, containerRef }) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const wrapRef = useRef(null);
  const fieldRef = useRef(null);
  const listRef = useRef(null);

  const q = inputText.toLowerCase().trim();

  const results = (() => {
    if (!q) return [];
    const out = [];
    items.forEach((group) => {
      group.items.forEach((loc) => {
        const cLow = loc.country.toLowerCase();
        const countryStarts = cLow.startsWith(q);
        const countryIncludes = !countryStarts && cLow.includes(q);
        if (countryStarts || countryIncludes) {
          out.push({
            label: loc.country,
            value: loc.country,
            type: "country",
            region: group.group,
            rank: countryStarts ? 0 : 1,
          });
        }
        loc.cities.forEach((city) => {
          const ciLow = city.toLowerCase();
          const cityStarts = ciLow.startsWith(q);
          const cityIncludes = !cityStarts && ciLow.includes(q);
          if (cityStarts || cityIncludes) {
            out.push({
              label: city,
              value: `${city}, ${loc.country}`,
              type: "city",
              country: loc.country,
              region: group.group,
              rank: cityStarts ? 2 : 3,
            });
          }
        });
      });
    });
    out.sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));
    return out.slice(0, 8);
  })();

  const hasResults = results.length > 0;

  useEffect(() => { setHlIdx(-1); }, [q]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        (!listRef.current || !listRef.current.contains(e.target))
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (hlIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hlIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [hlIdx]);

  const selectItem = (item) => {
    onChange(item.value);
    setInputText(item.label);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && q) setOpen(true);
      setHlIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHlIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hlIdx >= 0 && hlIdx < results.length) selectItem(results[hlIdx]);
      else if (onEnter) onEnter();
    } else if (e.key === "Escape") {
      setOpen(false);
      fieldRef.current?.blur();
    }
  };

  const displayValue = open
    ? inputText
    : value && value !== "all" && value !== "Worldwide" ? value : "";

  const getMegaPos = () => {
    if (!containerRef?.current || !wrapRef.current) return { left: 0, width: "100%" };
    const c = containerRef.current.getBoundingClientRect();
    const f = wrapRef.current.getBoundingClientRect();
    return { left: c.left - f.left, width: c.width };
  };
  const megaPos = open ? getMegaPos() : { left: 0, width: "100%" };

  const highlight = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: "#C9A84C", fontWeight: 600 }}>{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} className="home-hero-browse-field-wrap" style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        ref={fieldRef}
        value={displayValue}
        onChange={(e) => { setInputText(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setInputText(""); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open && hasResults}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        style={{
          width: "100%",
          background: "none",
          border: "none",
          outline: "none",
          color: "#f5f0e8",
          fontSize: 14,
          fontFamily: NU,
          padding: "18px 0",
          minWidth: 0,
        }}
      />
      {open && q && (
        <div
          ref={listRef}
          role="listbox"
          className="home-hero-browse-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: megaPos.left,
            width: megaPos.width,
            background: "rgba(12,11,8,0.82)",
            borderTop: "1.5px solid rgba(201,168,76,0.35)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 6,
            backdropFilter: "blur(32px) saturate(1.4)",
            WebkitBackdropFilter: "blur(32px) saturate(1.4)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 9999,
            textAlign: "left",
            padding: hasResults ? "8px 0" : "20px 24px",
          }}
        >
          {hasResults ? (
            results.map((item, idx) => {
              const isActive = idx === hlIdx;
              return (
                <div
                  key={`${item.value}-${idx}`}
                  data-idx={idx}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setHlIdx(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 18px",
                    cursor: "pointer",
                    fontFamily: NU,
                    fontSize: 13,
                    color: isActive ? "#C9A84C" : "rgba(245,240,232,0.85)",
                    background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid rgba(201,168,76,0.6)" : "2px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 10, color: isActive ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.35)", flexShrink: 0, transition: "color 0.15s" }}>
                      {item.type === "country" ? "◈" : "◎"}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {highlight(item.label)}
                      {item.type === "city" && (
                        <span style={{ color: "rgba(245,240,232,0.3)", fontWeight: 400, marginLeft: 8, fontSize: 11, letterSpacing: "0.2px" }}>
                          {item.country}
                        </span>
                      )}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 8,
                    color: "rgba(201,168,76,0.22)",
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}>
                    {item.region}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(245,240,232,0.3)", textAlign: "center", fontWeight: 300 }}>
              No destinations match "{inputText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PredictiveField for categories (internal) ───────────────────────────── */
function PredictiveField({ value, onChange, placeholder, items, ariaLabel, onEnter, containerRef }) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const wrapRef = useRef(null);
  const fieldRef = useRef(null);
  const listRef = useRef(null);

  const q = inputText.toLowerCase().trim();
  const filtered = items.filter((c) => !q || c.label.toLowerCase().includes(q));
  const flat = filtered.map((c) => ({ label: c.label, value: c.id, icon: c.icon }));

  useEffect(() => { setHlIdx(-1); }, [q]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        (!listRef.current || !listRef.current.contains(e.target))
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (hlIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hlIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [hlIdx]);

  const selectItem = (item) => {
    onChange(item.value);
    setInputText(item.label);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHlIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHlIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hlIdx >= 0 && hlIdx < flat.length) selectItem(flat[hlIdx]);
      else if (onEnter) onEnter();
    } else if (e.key === "Escape") {
      setOpen(false);
      fieldRef.current?.blur();
    }
  };

  const displayValue = open
    ? inputText
    : value && value !== "all"
      ? (items.find((c) => c.id === value)?.label || "")
      : "";

  const getMegaPos = () => {
    if (!containerRef?.current || !wrapRef.current) return { left: 0, width: "100%" };
    const c = containerRef.current.getBoundingClientRect();
    const f = wrapRef.current.getBoundingClientRect();
    return { left: c.left - f.left, width: c.width };
  };
  const megaPos = open ? getMegaPos() : { left: 0, width: "100%" };
  const catCols = flat.length <= 4 ? 1 : flat.length <= 9 ? 2 : 3;

  return (
    <div ref={wrapRef} className="home-hero-browse-field-wrap" style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        ref={fieldRef}
        value={displayValue}
        onChange={(e) => { setInputText(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setInputText(""); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        style={{
          width: "100%",
          background: "none",
          border: "none",
          outline: "none",
          color: "#f5f0e8",
          fontSize: 14,
          fontFamily: NU,
          padding: "18px 0",
          minWidth: 0,
        }}
      />
      {open && flat.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          className="home-hero-browse-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: megaPos.left,
            width: megaPos.width,
            background: "rgba(12,11,8,0.82)",
            borderTop: "1.5px solid rgba(201,168,76,0.35)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 6,
            backdropFilter: "blur(32px) saturate(1.4)",
            WebkitBackdropFilter: "blur(32px) saturate(1.4)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 9999,
            textAlign: "left",
          }}
        >
          <div
            className="home-hero-browse-cat-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${catCols}, 1fr)`,
              gap: 0,
              padding: "10px 6px",
            }}
          >
            {flat.map((item, idx) => (
              <div
                key={item.value}
                data-idx={idx}
                role="option"
                aria-selected={idx === hlIdx}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setHlIdx(idx)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: NU,
                  fontSize: 12,
                  color: idx === hlIdx ? "#C9A84C" : "rgba(245,240,232,0.85)",
                  background: idx === hlIdx ? "rgba(201,168,76,0.08)" : "transparent",
                  borderRadius: "var(--lwd-radius-input)",
                  transition: "background 0.12s, color 0.12s",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 13, color: "rgba(201,168,76,0.45)", width: 16, textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Utility functions ───────────────────────────────────────────────────── */
function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractVimeoId(url) {
  if (!url) return '';
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : '';
}

/* ── SlimHeroStudio ──────────────────────────────────────────────────────── */
export default function SlimHeroStudio({ venues = [], backgroundData = null, onViewRegion, onViewRegionCategory, onViewCategory }) {
  const C = useTheme();
  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("ai");
  const [activeCat, setActiveCat] = useState("all");
  const [activeCountry, setActiveCountry] = useState("Worldwide");
  const [parallaxY, setParallaxY] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const inputRef = useRef(null);
  const searchBarRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setHeroLoaded(true), 150); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const images = backgroundData?.backgroundImages || venues;
    if (!images || !images.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(t);
  }, [backgroundData?.backgroundImages, venues]);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom > 0 && rect.top < vh) {
        const progress = (vh - rect.top) / (vh + rect.height);
        setParallaxY((progress - 0.5) * rect.height * 0.15);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAuraSearch = () => {
    if (!query.trim()) {
      window.dispatchEvent(new CustomEvent("lwd:openAura"));
      return;
    }
    track("search_submit", { query, mode: "ai" });
    window.dispatchEvent(
      new CustomEvent("lwd:openAura", { detail: { query: query.trim() } })
    );
    setQuery("");
  };

  const handleBrowseSearch = () => {
    track("search_submit", { mode: "browse", cat: activeCat, country: activeCountry });

    let countrySlug = null, regionSlug = null;
    if (activeCountry && activeCountry !== "Worldwide") {
      const comma = activeCountry.lastIndexOf(", ");
      if (comma > 0) {
        const cityName = activeCountry.slice(0, comma);
        const countryName = activeCountry.slice(comma + 2);
        countrySlug = GEO_COUNTRIES.find(c => c.name === countryName)?.slug || null;
        const rSlug = getRegionSlugByName(cityName);
        regionSlug = rSlug !== "all" ? rSlug : null;
      } else {
        countrySlug = GEO_COUNTRIES.find(c => c.name === activeCountry)?.slug || null;
      }
    }

    const catSlug = activeCat && activeCat !== "all" ? (CAT_ID_TO_GEO[activeCat] || null) : null;

    if (countrySlug && regionSlug && catSlug) {
      onViewRegionCategory?.(countrySlug, regionSlug, catSlug);
    } else if (countrySlug && regionSlug) {
      onViewRegion?.(countrySlug, regionSlug);
    } else if (countrySlug || catSlug) {
      onViewCategory?.(activeCountry !== "Worldwide" ? { searchQuery: activeCountry } : undefined);
    } else {
      document.querySelector('[aria-label="Handpicked vendors"]')?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const browseCategories = CATS.filter((c) => c.id !== "all");

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      className="home-hero"
      style={{
        position: "relative",
        height: "calc(65vh + 120px)",
        minHeight: 600,
        background: "#040302",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "height 0.6s ease",
      }}
    >
      {/* Background container — overflow hidden here to clip parallax images */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
        {/* Custom background media — only render the ACTIVE backgroundType */}
        {backgroundData?.backgroundType ? (
          <>
            {/* Image carousel — only when type is 'image' */}
            {backgroundData.backgroundType === 'image' && backgroundData.backgroundImages?.length > 0 && (
              <>
                {backgroundData.backgroundImages.map((img, i) => (
                  <div
                    key={img.url}
                    style={{
                      position: "absolute",
                      inset: "-8% 0",
                      overflow: "hidden",
                      opacity: i === idx ? 1 : 0,
                      transition: "opacity 2s ease",
                      transform: `translateY(${parallaxY}px)`,
                      willChange: "transform",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Hero background ${i + 1}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: i === idx ? "scale(1.05)" : "scale(1)",
                        transition: "transform 8s ease",
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Video upload — only when type is 'video_upload' */}
            {backgroundData.backgroundType === 'video_upload' && backgroundData.backgroundVideos?.length > 0 && (
              <>
                {backgroundData.backgroundVideos.map((vid, i) => (
                  <div
                    key={vid.url}
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                      opacity: i === idx ? 1 : 0,
                      transition: "opacity 2s ease",
                    }}
                  >
                    <video
                      autoPlay={backgroundData.autoplay !== false}
                      muted={backgroundData.muted !== false}
                      loop={backgroundData.loop !== false}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center center",
                      }}
                    >
                      <source src={vid.url} type={`video/${vid.type}`} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </>
            )}

            {/* YouTube — full-bleed cover, no black bars */}
            {backgroundData.backgroundType === 'youtube' && backgroundData.backgroundVideoUrl && extractYouTubeId(backgroundData.backgroundVideoUrl) && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(backgroundData.backgroundVideoUrl)}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playlist=${extractYouTubeId(backgroundData.backgroundVideoUrl)}`}
                  style={{
                    position: "absolute",
                    width: "177.78vh",
                    height: "56.25vw",
                    minWidth: "100%",
                    minHeight: "100%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "none",
                    pointerEvents: "none",
                  }}
                  allow="autoplay"
                  title="YouTube video background"
                />
              </div>
            )}

            {/* Vimeo — full-bleed cover, no black bars */}
            {backgroundData.backgroundType === 'vimeo' && backgroundData.backgroundVideoUrl && extractVimeoId(backgroundData.backgroundVideoUrl) && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <iframe
                  src={`https://player.vimeo.com/video/${extractVimeoId(backgroundData.backgroundVideoUrl)}?autoplay=1&muted=1&loop=1&controls=0&background=1`}
                  style={{
                    position: "absolute",
                    width: "177.78vh",
                    height: "56.25vw",
                    minWidth: "100%",
                    minHeight: "100%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "none",
                    pointerEvents: "none",
                  }}
                  allow="autoplay"
                  title="Vimeo video background"
                />
              </div>
            )}
          </>
        ) : (
          /* Fallback: FEATURED_VENUES carousel — parallax layer */
          venues.map((v, i) => (
            <div
              key={v.id}
              style={{
                position: "absolute",
                inset: "-8% 0",
                overflow: "hidden",
                opacity: i === idx ? 1 : 0,
                transition: "opacity 2s ease",
                transform: `translateY(${parallaxY}px)`,
                willChange: "transform",
              }}
            >
              <img
                src={v.imgs[0]}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: i === idx ? "scale(1.05)" : "scale(1)",
                  transition: "transform 8s ease",
                }}
              />
            </div>
          ))
        )}

        {/* Cinematic overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to bottom, rgba(5,4,3,0.55) 0%, rgba(5,4,3,0.2) 40%, rgba(5,4,3,0.7) 80%, rgba(5,4,3,0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "radial-gradient(ellipse 85% 65% at 50% 45%, transparent 25%, rgba(5,4,3,0.4) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="home-hero-content"
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "0 24px",
          maxWidth: 860,
          width: "100%",
          animation: "fadeUp 0.8s ease both",
        }}
      >
        {/* Label badge */}
        <div
          className="home-hero-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.28)",
            borderRadius: "var(--lwd-radius-input)",
            padding: "7px 20px",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              background: "#4caf7d",
              borderRadius: "50%",
              display: "inline-block",
              animation: "pulse 2s infinite",
            }}
          />
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C9A84C",
              fontWeight: 600,
            }}
          >
            AI-Powered Wedding Discovery
          </span>
        </div>

        {/* Headline — word-by-word reveal */}
        <h1
          style={{
            fontFamily: GD,
            fontSize: "clamp(40px, 6vw, 86px)",
            fontWeight: 400,
            color: "#f5f0e8",
            lineHeight: 1.0,
            letterSpacing: "-1px",
            marginBottom: 0,
          }}
        >
          <SplitText trigger={heroLoaded} delay={100} stagger={100}>
            The World's Finest
          </SplitText>
        </h1>
        <h1
          style={{
            fontFamily: GD,
            fontSize: "clamp(40px, 6vw, 86px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#C9A84C",
            lineHeight: 1.0,
            letterSpacing: "-1px",
            marginBottom: 16,
          }}
        >
          <SplitText trigger={heroLoaded} delay={350} stagger={100}>
            Wedding Directory
          </SplitText>
        </h1>

        {/* Benefit subline */}
        <p
          className="home-hero-subline"
          style={{
            fontFamily: NU,
            fontSize: "clamp(14px, 1.6vw, 18px)",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 300,
            lineHeight: 1.6,
            marginBottom: 28,
            maxWidth: 540,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Intelligent discovery for modern luxury weddings — search by
          destination, style, guest count, and collection.
        </p>

        {/* Search mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: 2,
            borderRadius: "var(--lwd-radius-card)",
            maxWidth: 220,
            margin: "0 auto 10px",
            animation: "fadeUp 0.8s ease 0.25s both",
          }}
        >
          {[
            ["✦", "AI Search", "ai"],
            ["⌕", "Browse", "standard"],
          ].map(([icon, label, m]) => (
            <button
              key={m}
              onClick={() => setSearchMode(m)}
              style={{
                flex: 1,
                padding: "5px 16px",
                background: searchMode === m ? "#C9A84C" : "transparent",
                color: searchMode === m ? "#0a0906" : "rgba(255,255,255,0.5)",
                border: "none",
                borderRadius: "var(--lwd-radius-card)",
                cursor: "pointer",
                fontFamily: NU,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div
          ref={searchBarRef}
          className={`home-hero-search${searchMode === "ai" ? " home-hero-search--ai" : ""}`}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
            border: searchMode === "ai"
              ? "1px solid rgba(201,168,76,0.45)"
              : "1px solid rgba(201,168,76,0.35)",
            borderRadius: "var(--lwd-radius-card)",
            boxShadow: searchMode === "ai"
              ? "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.25), 0 0 30px rgba(201,168,76,0.08)"
              : "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.15)",
            display: "flex",
            alignItems: "stretch",
            animation: searchMode === "ai"
              ? "fadeUp 0.8s ease 0.3s both, barGlow 3s ease-in-out 1.2s infinite"
              : "fadeUp 0.8s ease 0.3s both",
            transition: "border-color 0.4s, box-shadow 0.4s",
          }}
        >
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "var(--lwd-radius-card)", background: "rgba(10,9,6,0.6)", backdropFilter: "blur(24px)", pointerEvents: "none", zIndex: 0 }} />
          {searchMode === "ai" ? (
            <>
              <span
                style={{
                  position: "relative", zIndex: 1,
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  color: "#C9A84C",
                  fontSize: 16,
                  flexShrink: 0,
                  animation: "pulse 2.5s ease-in-out infinite",
                }}
              >
                ✦
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuraSearch()}
                placeholder="Find me a Tuscan villa for 80 guests in June..."
                aria-label="Search with AI"
                style={{
                  position: "relative", zIndex: 1,
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#f5f0e8",
                  fontSize: 14,
                  fontFamily: NU,
                  padding: "18px 0",
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleAuraSearch}
                aria-label="Ask Aura AI"
                style={{
                  position: "relative", zIndex: 1,
                  background: "#C9A84C",
                  border: "none",
                  cursor: "pointer",
                  padding: "18px 30px",
                  color: "#0a0906",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: NU,
                  flexShrink: 0,
                  transition: "background 0.2s",
                  borderRadius: "0 4px 4px 0",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e8c97a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
              >
                Ask Aura
              </button>
            </>
          ) : (
            <div
              className="home-hero-browse-fields"
              style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "stretch", flex: 1, minWidth: 0 }}
            >
              <span
                style={{
                  padding: "0 12px 0 16px",
                  display: "flex",
                  alignItems: "center",
                  color: "rgba(201,168,76,0.5)",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                ⌕
              </span>
              <PredictiveField
                value={activeCat}
                onChange={setActiveCat}
                placeholder="Venues, planners, stylists..."
                items={browseCategories}
                ariaLabel="Search category"
                onEnter={handleBrowseSearch}
                containerRef={searchBarRef}
              />
              <div
                className="home-hero-browse-divider"
                style={{
                  width: 1,
                  background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.18) 30%, rgba(201,168,76,0.18) 70%, transparent)",
                  margin: "10px 0",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  padding: "0 10px 0 14px",
                  display: "flex",
                  alignItems: "center",
                  color: "rgba(201,168,76,0.3)",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                ◎
              </span>
              <LocationSearchField
                value={activeCountry}
                onChange={setActiveCountry}
                placeholder="Destination or city..."
                items={LOCATIONS}
                ariaLabel="Search location"
                onEnter={handleBrowseSearch}
                containerRef={searchBarRef}
              />
              <button
                onClick={handleBrowseSearch}
                aria-label="Search"
                style={{
                  background: "#C9A84C",
                  border: "none",
                  cursor: "pointer",
                  padding: "18px 30px",
                  color: "#0a0906",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: NU,
                  flexShrink: 0,
                  transition: "background 0.2s",
                  borderRadius: "0 4px 4px 0",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e8c97a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
              >
                Search
              </button>
            </div>
          )}
        </div>

        {/* Aura nudge */}
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            fontFamily: NU,
            fontWeight: 300,
          }}
        >
          Not sure where to start?{" "}
          <span
            role="button"
            tabIndex={0}
            onClick={() => window.dispatchEvent(new CustomEvent("lwd:openAura"))}
            onKeyDown={(e) => e.key === "Enter" && window.dispatchEvent(new CustomEvent("lwd:openAura"))}
            style={{
              color: "#C9A84C",
              cursor: "pointer",
              fontWeight: 600,
              borderBottom: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            Ask Aura
          </span>{" "}
          — get personalised venue suggestions instantly.
        </div>

        {/* Trust micro-line */}
        <div
          className="home-hero-trust"
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.14em",
            fontFamily: NU,
          }}
        >
          300+ Curated Venues · 120+ Verified Vendors · 25 Destinations
        </div>
      </div>
    </section>
  );
}
