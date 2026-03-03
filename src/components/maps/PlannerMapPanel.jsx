// src/components/maps/PlannerMapPanel.jsx
// Mocked planning map panel — no tile library required.
// Renders planner pins at deterministic positions (hashed from ID).
// Gold pins for verified planners, neutral for others.
// Hover sync: hoveredId highlights pin ↔ list item.

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── Deterministic hash → position ─────────────────────────────────────────────
function hashStr(str, salt = 0) {
  let h = (salt * 2654435761) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Map planner id to left/top percentage (bounded to keep pins visible)
function pinX(id) { return (hashStr(String(id), 0)  % 70) + 12; } // 12–82%
function pinY(id) { return (hashStr(String(id), 17) % 60) + 18; } // 18–78%

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlannerMapPanel({
  planners      = [],
  hoveredId,
  activePinnedId,
  onPinHover,
  onPinLeave,
  onPinClick,
  C,
}) {
  return (
    <div
      style={{
        position:        "relative",
        width:           "100%",
        height:          "100%",
        minHeight:       480,
        background:      "#131a14",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize:  "22px 22px",
        borderRadius:    "var(--lwd-radius-card)",
        overflow:        "hidden",
        border:          `1px solid ${C.border}`,
      }}
    >
      {/* Region watermark */}
      <div
        style={{
          position:      "absolute",
          top:           14,
          left:          14,
          fontFamily:    NU,
          fontSize:      9,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color:         "rgba(255,255,255,0.22)",
          zIndex:        2,
          userSelect:    "none",
          pointerEvents: "none",
        }}
      >
        Tuscany · Italy
      </div>

      {/* Decorative terrain blobs (rolling hills effect) */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          left:          "18%",
          top:           "28%",
          width:         "58%",
          height:        "44%",
          background:    "rgba(32,58,32,0.4)",
          borderRadius:  "62% 38% 52% 48% / 46% 54% 46% 54%",
          filter:        "blur(2.5px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          left:          "30%",
          top:           "38%",
          width:         "38%",
          height:        "30%",
          background:    "rgba(22,44,24,0.35)",
          borderRadius:  "52% 48% 58% 42% / 55% 45% 55% 45%",
          filter:        "blur(3px)",
          pointerEvents: "none",
        }}
      />

      {/* Planner pins */}
      {planners.map((p) => {
        const x         = pinX(p.id);
        const y         = pinY(p.id);
        const isHov     = hoveredId === p.id;
        const isActive  = activePinnedId === p.id;
        const isGold    = !!p.verified;
        const pinColor  = isGold ? GOLD : "rgba(200,200,200,0.65)";
        const highlight = isHov || isActive;

        return (
          <div
            key={p.id}
            title={p.name}
            onMouseEnter={() => onPinHover?.(p.id)}
            onMouseLeave={() => onPinLeave?.()}
            onClick={() => onPinClick?.(p.id)}
            style={{
              position:  "absolute",
              left:      `${x}%`,
              top:       `${y}%`,
              transform: "translate(-50%, -50%)",
              zIndex:    highlight ? 10 : 5,
              cursor:    "pointer",
            }}
          >
            {/* Pulse ring on hover / active */}
            {highlight && (
              <div
                aria-hidden="true"
                style={{
                  position:      "absolute",
                  inset:         -7,
                  borderRadius:  "50%",
                  border:        `1.5px solid ${pinColor}`,
                  animation:     "pinPulse 1.1s ease-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Pin dot */}
            <div
              style={{
                width:        highlight ? 13 : 9,
                height:       highlight ? 13 : 9,
                borderRadius: "50%",
                background:   pinColor,
                border:       `1.5px solid ${isGold ? "#e8c97a" : "rgba(255,255,255,0.8)"}`,
                boxShadow:    highlight ? `0 0 10px 2px ${pinColor}` : "none",
                transition:   "all 0.2s ease",
              }}
            />

            {/* Name tooltip on hover */}
            {isHov && (
              <div
                style={{
                  position:       "absolute",
                  bottom:         "calc(100% + 8px)",
                  left:           "50%",
                  transform:      "translateX(-50%)",
                  background:     "rgba(8,6,4,0.93)",
                  backdropFilter: "blur(10px)",
                  border:         `1px solid ${C.border}`,
                  borderRadius:   6,
                  padding:        "6px 11px",
                  whiteSpace:     "nowrap",
                  fontFamily:     NU,
                  fontSize:       10,
                  color:          "#fff",
                  pointerEvents:  "none",
                  zIndex:         20,
                }}
              >
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ color: GOLD, marginTop: 2, fontSize: 9 }}>{p.city}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          position:       "absolute",
          bottom:         14,
          right:          14,
          background:     "rgba(8,6,4,0.78)",
          backdropFilter: "blur(10px)",
          border:         `1px solid ${C.border}`,
          borderRadius:   8,
          padding:        "8px 12px",
          display:        "flex",
          flexDirection:  "column",
          gap:            5,
          zIndex:         3,
          userSelect:     "none",
        }}
      >
        {[
          { color: GOLD,                     label: "Verified" },
          { color: "rgba(200,200,200,0.65)", label: "Listed"   },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width:        7,
              height:       7,
              borderRadius: "50%",
              background:   color,
              flexShrink:   0,
            }} />
            <span style={{
              fontFamily:    NU,
              fontSize:      9,
              color:         "rgba(255,255,255,0.38)",
              letterSpacing: "0.3px",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Pin pulse keyframe */}
      <style>{`
        @keyframes pinPulse {
          0%   { transform: scale(0.7);  opacity: 0.9; }
          60%  { transform: scale(1.8);  opacity: 0.15; }
          100% { transform: scale(0.7);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}
