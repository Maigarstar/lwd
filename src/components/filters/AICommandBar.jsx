// ─── src/components/filters/AICommandBar.jsx ─────────────────────────────────
// Phase 2 — AI-powered command bar.
// Sits above CountrySearchBar. Translates natural language into the existing
// filter dimensions. The filter engine underneath is unchanged.
//
// UX: concierge-led, calm, premium, precise.
// No mystery — shows exactly what was interpreted, lets users adjust manually.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { parseVenueQuery } from "../../services/aiSearchService";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

// Gold constants — same in both modes (gold is readable on cream and dark)
const GOLD      = "rgba(201,168,76,1)";
const GOLD_DIM  = "rgba(201,168,76,0.55)";
const GOLD_TINT = "rgba(201,168,76,0.10)";
const GOLD_RING = "rgba(201,168,76,0.30)";

// ── Dynamic suggestion builder ───────────────────────────────────────────────
// Generates context-aware prompts from whatever region/country/category the page has.
// No hardcoded maps needed — works automatically for any destination.
const TEMPLATES = {
  venue: [
    (r) => `Luxury ${r} venue for 150 guests`,
    (r) => `Intimate ${r} wedding under £30k`,
    (r) => `Grand ${r} venue with outdoor ceremony`,
  ],
  vendor: [
    (r) => `Top wedding photographer in ${r}`,
    (r) => `Luxury florist in ${r}`,
    (r) => `Wedding planner in ${r} for destination weddings`,
  ],
  default: [
    (r) => `Luxury venue in ${r} for 120 guests`,
    (r) => `Intimate outdoor ceremony in ${r}`,
    (r) => `${r} wedding with Michelin dining`,
  ],
};

function buildSuggestions(regionName, countryName, entityType) {
  const location = regionName || countryName || "your destination";
  const templates = TEMPLATES[entityType] || TEMPLATES.default;
  return templates.map(fn => fn(location));
}

function getRegionLabel(slug, regions) {
  const r = regions.find(r => r.slug === slug);
  return r ? r.name : slug;
}

// ── Single interpreted dimension chip ────────────────────────────────────────
function ParsedChip({ dimLabel, value, onRemove, isDark }) {
  const valueText = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.80)";
  const removeHoverColor = isDark ? "#fff" : "#000";

  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          0,
      background:   GOLD_TINT,
      border:       `1px solid ${GOLD_RING}`,
      borderRadius: 3,
      overflow:     "hidden",
      flexShrink:   0,
    }}>
      <span style={{
        padding:       "6px 9px 6px 11px",
        fontFamily:    NU,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color:         GOLD_DIM,
        borderRight:   `1px solid ${GOLD_RING}`,
        whiteSpace:    "nowrap",
      }}>
        {dimLabel}
      </span>
      <span style={{
        padding:    "6px 8px",
        fontFamily: NU,
        fontSize:   12,
        fontWeight: 500,
        color:      valueText,
        whiteSpace: "nowrap",
      }}>
        {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${dimLabel} filter`}
        style={{
          background: "none",
          border:     "none",
          borderLeft: `1px solid ${GOLD_RING}`,
          cursor:     "pointer",
          color:      GOLD_DIM,
          fontSize:   9,
          padding:    "6px 9px",
          lineHeight: 1,
          display:    "flex",
          alignItems: "center",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = removeHoverColor; e.currentTarget.style.background = GOLD_TINT; }}
        onMouseLeave={e => { e.currentTarget.style.color = GOLD_DIM;         e.currentTarget.style.background = "none"; }}
      >
        ✕
      </button>
    </span>
  );
}

// ── Loading animation ─────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <>
      <style>{`
        @keyframes lwd-dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40%            { opacity: 1;   transform: scale(1);    }
        }
        .lwd-ai-dot { animation: lwd-dot-pulse 1.2s ease-in-out infinite; display: inline-block; }
        .lwd-ai-dot:nth-child(2) { animation-delay: 0.2s; }
        .lwd-ai-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {[0,1,2].map(i => (
          <span key={i} className="lwd-ai-dot"
            style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />
        ))}
      </span>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AICommandBar
// ═════════════════════════════════════════════════════════════════════════════
export default function AICommandBar({
  countrySlug,
  countryName,
  regionSlug,
  regionName,
  categorySlug,
  entityType,
  availableRegions = [],
  filters,
  onFiltersChange,
  defaultFilters,
  onSummary,
  onClearSummary,
}) {
  const C = useTheme();
  const inputRef = useRef(null);

  const [query,            setQuery]            = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState(null);
  const [aiActive,         setAiActive]         = useState(false);
  const [aiAppliedFilters, setAiAppliedFilters] = useState(null);
  const [aiSummary,        setAiSummary]        = useState(null);

  const suggestions = buildSuggestions(regionName, countryName, entityType);

  // ── Theme-aware colour set ─────────────────────────────────────────────────
  const isDark = C.black === "#080808";
  // Generic alpha helper — still useful for uniform overlay values
  const a = isDark
    ? (alpha) => `rgba(255,255,255,${alpha})`
    : (alpha) => `rgba(0,0,0,${alpha})`;
  // Named tokens for surfaces that need specific light-mode values
  const barBg      = isDark ? C.black   : C.dark;     // section tint, distinct from page
  const inputBg    = isDark ? a(0.06)   : C.card;     // white input on cream = clear surface
  const inputBdr   = isDark ? a(0.20)   : C.border;   // warm token border
  const inputBdrFl = isDark ? a(0.28)   : C.border2;  // stronger when text is present
  const pillBg     = isDark ? a(0.02)   : "rgba(0,0,0,0.02)";     // more subtle pill background
  const pillBdr    = isDark ? a(0.10)   : "rgba(0,0,0,0.06)";   // lighter border on suggestions
  const pillText   = isDark ? a(0.45)   : "rgba(0,0,0,0.50)";    // lighter suggestion text
  const mutedText  = isDark ? a(0.35)   : "rgba(0,0,0,0.45)";    // lighter "Try:" label

  // ── Apply parsed result to filter state ───────────────────────────────────
  const applyParsed = useCallback((parsed) => {
    const next = {
      ...defaultFilters,
      ...(parsed.region   ? { region:   parsed.region   } : {}),
      ...(parsed.style    ? { style:    parsed.style    } : {}),
      ...(parsed.capacity ? { capacity: parsed.capacity } : {}),
      ...(parsed.price    ? { price:    parsed.price    } : {}),
      ...(parsed.services ? { services: parsed.services } : {}),
    };
    onFiltersChange(next);
    setAiAppliedFilters(parsed);
    setAiSummary(parsed.summary || null);
    setAiActive(true);
    onSummary?.(parsed.summary || null);
  }, [defaultFilters, onFiltersChange, onSummary]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (q) => {
    const trimmed = (q || query).trim();
    if (!trimmed || trimmed.length < 3 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseVenueQuery({
        query:   trimmed,
        countrySlug,
        countryName,
        regionSlug,
        regionName,
        categorySlug,
        entityType,
        availableRegions,
      });

      const hasResult = parsed.region || parsed.style || parsed.capacity || parsed.price || parsed.services;
      if (!hasResult) {
        setError("We couldn't identify specific filters — try adding a region, style, or guest count.");
        return;
      }
      applyParsed(parsed);
    } catch (err) {
      setError(
        err.message === "not_configured"
          ? "AI search isn't configured — use the filters below."
          : `Error: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, [query, loading, countrySlug, countryName, availableRegions, applyParsed]);

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setQuery("");
    setAiActive(false);
    setAiAppliedFilters(null);
    setAiSummary(null);
    setError(null);
    onFiltersChange(defaultFilters);
    onSummary?.(null);
    onClearSummary?.();
    inputRef.current?.focus();
  }, [defaultFilters, onFiltersChange, onSummary, onClearSummary]);

  // ── Remove single dimension ────────────────────────────────────────────────
  const removeDimension = useCallback((key) => {
    onFiltersChange({ ...filters, [key]: defaultFilters[key] ?? null });
    setAiAppliedFilters(prev => prev ? { ...prev, [key]: null } : null);
  }, [filters, defaultFilters, onFiltersChange]);

  // ── Build interpreted chips list ──────────────────────────────────────────
  const interpretedChips = (aiActive && aiAppliedFilters) ? [
    aiAppliedFilters.region   && { key: "region",   dim: "Region",  value: getRegionLabel(aiAppliedFilters.region, availableRegions) },
    aiAppliedFilters.style    && { key: "style",    dim: "Style",   value: aiAppliedFilters.style    },
    aiAppliedFilters.capacity && { key: "capacity", dim: "Guests",  value: aiAppliedFilters.capacity },
    aiAppliedFilters.price    && { key: "price",    dim: "Budget",  value: aiAppliedFilters.price    },
    aiAppliedFilters.services && { key: "services", dim: "Service", value: aiAppliedFilters.services },
  ].filter(Boolean) : [];

  const hasInterpretedChips = interpretedChips.length > 0;

  // Placeholder CSS — injected dynamically so it responds to theme
  const placeholderCss = `
    .lwd-ai-input::placeholder {
      color: ${a(0.38)};
      font-style: italic;
    }
    .lwd-ai-input:focus::placeholder {
      color: ${a(0.25)};
    }
  `;

  return (
    <div
      role="search"
      aria-label="AI venue search"
      style={{
        background:   barBg,
        borderLeft:   `3px solid ${GOLD_RING}`,
      }}
    >
      <style>{placeholderCss}</style>

      <div className="lwd-ai-bar-outer" style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 48px 12px" }}>

        {/* ── Eyebrow ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{
            fontFamily:    NU,
            fontSize:      9,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color:         GOLD,
            fontWeight:    700,
          }}>
            AI Concierge Search
          </span>
          <div style={{ width: 20, height: 1, background: GOLD }} />
        </div>

        {/* ── Input row ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>

          {/* Input wrapper */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <input
              ref={inputRef}
              type="text"
              className="lwd-ai-input"
              value={query}
              onChange={e => { setQuery(e.target.value); if (error) setError(null); }}
              onKeyDown={e => { if (e.key === "Enter" && !loading) handleSubmit(); }}
              placeholder="Describe your ideal venue, and we'll refine the search."
              disabled={loading}
              aria-label="Natural language venue search"
              style={{
                width:         "100%",
                padding:       "15px 52px 15px 20px",
                background:    inputBg,
                border:        `1px solid ${inputBdr}`,
                borderRadius:  3,
                color:         C.off,
                fontFamily:    GD,
                fontSize:      16,
                fontWeight:    300,
                letterSpacing: "0.01em",
                outline:       "none",
                transition:    "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                boxSizing:     "border-box",
                opacity:       loading ? 0.65 : 1,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = C.gold;
                e.currentTarget.style.background  = isDark ? a(0.08) : C.card;
                e.currentTarget.style.boxShadow   = `0 0 0 3px ${GOLD_RING}`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = query ? inputBdrFl : inputBdr;
                e.currentTarget.style.background  = inputBg;
                e.currentTarget.style.boxShadow   = "none";
              }}
            />

            {/* Arrow submit */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              aria-label="Search"
              style={{
                position:     "absolute",
                right:        12,
                top:          "50%",
                transform:    "translateY(-50%)",
                background:   query.trim() && !loading ? GOLD_TINT : "none",
                border:       `1px solid ${query.trim() && !loading ? GOLD_RING : "transparent"}`,
                borderRadius: 2,
                cursor:       loading || !query.trim() ? "default" : "pointer",
                color:        loading ? GOLD : (query.trim() ? GOLD : a(0.22)),
                fontSize:     13,
                padding:      "4px 8px",
                display:      "flex",
                alignItems:   "center",
                transition:   "all 0.2s",
                lineHeight:   1,
              }}
            >
              {loading ? <LoadingDots /> : "→"}
            </button>
          </div>

          {/* Clear AI search button — only when active */}
          {hasInterpretedChips && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background:    "none",
                border:        `1px solid ${inputBdr}`,
                borderRadius:  3,
                color:         mutedText,
                fontSize:      10,
                fontFamily:    NU,
                letterSpacing: "0.08em",
                padding:       "0 16px",
                cursor:        "pointer",
                whiteSpace:    "nowrap",
                transition:    "all 0.2s",
                flexShrink:    0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.off; e.currentTarget.style.borderColor = isDark ? a(0.4) : C.border2; }}
              onMouseLeave={e => { e.currentTarget.style.color = mutedText; e.currentTarget.style.borderColor = inputBdr; }}
            >
              Clear AI search
            </button>
          )}
        </div>

        {/* ── Interpreted output ───────────────────────────────────────────── */}
        {hasInterpretedChips && (
          <div style={{
            marginTop:  14,
            paddingTop: 14,
            borderTop:  `1px solid ${a(0.08)}`,
          }}>
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              marginBottom: 10,
            }}>
              <span style={{
                fontFamily:    NU,
                fontSize:      9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color:         GOLD_DIM,
                fontWeight:    700,
              }}>
                AI understood
              </span>
              <div style={{ flex: 1, height: 1, background: a(0.07) }} />
              <span style={{
                fontFamily: NU,
                fontSize:   10,
                color:      a(0.32),
                fontStyle:  "italic",
              }}>
                Remove any chip to adjust
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {interpretedChips.map(chip => (
                <ParsedChip
                  key={chip.key}
                  dimLabel={chip.dim}
                  value={chip.value}
                  isDark={isDark}
                  onRemove={() => removeDimension(chip.key)}
                />
              ))}
            </div>

            {/* AI summary line */}
            {aiSummary && (
              <div style={{
                marginTop:     10,
                display:       "flex",
                alignItems:    "center",
                gap:           8,
                fontFamily:    GD,
                fontSize:      13,
                fontStyle:     "italic",
                fontWeight:    300,
                letterSpacing: "0.01em",
                color:         a(0.45),
              }}>
                <span style={{ color: GOLD_DIM, fontSize: 9, flexShrink: 0 }}>✦</span>
                {aiSummary}
              </div>
            )}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div style={{
            marginTop:     10,
            fontFamily:    NU,
            fontSize:      12,
            color:         "rgba(220,165,75,0.9)",
            letterSpacing: "0.01em",
          }}>
            {error}
          </div>
        )}

        {/* ── Suggestion pills — idle state only ──────────────────────────── */}
        {!aiActive && !loading && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{
              fontFamily:    NU,
              fontSize:      10,
              color:         mutedText,
              letterSpacing: "0.06em",
              flexShrink:    0,
            }}>
              Try:
            </span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setQuery(s); handleSubmit(s); }}
                style={{
                  background:    pillBg,
                  border:        `1px solid ${pillBdr}`,
                  borderRadius:  3,
                  color:         pillText,
                  fontFamily:    NU,
                  fontSize:      11,
                  padding:       "5px 12px",
                  cursor:        "pointer",
                  transition:    "all 0.18s",
                  whiteSpace:    "nowrap",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = GOLD_DIM;
                  e.currentTarget.style.color       = isDark ? GOLD : C.gold;
                  e.currentTarget.style.background  = GOLD_TINT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = pillBdr;
                  e.currentTarget.style.color       = pillText;
                  e.currentTarget.style.background  = pillBg;
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
