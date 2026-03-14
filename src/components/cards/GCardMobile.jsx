// ─── src/components/cards/GCardMobile.jsx ────────────────────────────────────
// Image-dominant overlay card for mobile sliders.
// Full-bleed image with venue name, location & price overlaid on gradient.
// Tap anywhere → onView. Heart icon top-right. Clean editorial feel.
import { useTheme } from "../../theme/ThemeContext";
import { GoldBadge } from "../ui/Badges";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function GCardMobile({ v, saved, onSave, onView }) {
  const C = useTheme();

  return (
    <article
      aria-label={v.name}
      onClick={() => onView?.(v)}
      className="lwd-gcard-mobile"
      style={{
        position: "relative",
        borderRadius: "var(--lwd-radius-card)",
        overflow: "hidden",
        cursor: "pointer",
        background: "#0a0806",
        height: 320,
      }}
    >
      {/* ── Full image ── */}
      <img
        src={v.imgs?.[0] || v.image}
        alt={`${v.name} in ${v.region}`}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* ── Gradient overlay ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {/* ── Online badge, top left ── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: "4px 10px 4px 7px",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: v.online ? "#22c55e" : "#6b7280",
            animation: v.online
              ? "lwd-status-pulse 2s ease-in-out infinite"
              : "none",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: NU,
            fontSize: 8,
            color: v.online ? "#22c55e" : "rgba(255,255,255,0.4)",
            letterSpacing: "0.4px",
            fontWeight: 600,
          }}
        >
          {v.online ? "Online" : "Offline"}
        </span>
      </div>

      {/* ── Save heart, top right ── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSave?.(v.id);
        }}
        aria-label={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
        aria-pressed={saved}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: saved ? "rgba(201,168,76,0.9)" : "rgba(0,0,0,0.45)",
          border: "none",
          color: saved ? "#0f0d0a" : "rgba(255,255,255,0.85)",
          cursor: "pointer",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        {saved ? "♥" : "♡"}
      </button>

      {/* ── Category tag badge ── */}
      {v.tag && (
        <div style={{ position: "absolute", bottom: 90, left: 14 }}>
          <GoldBadge text={v.tag} />
        </div>
      )}

      {/* ── Bottom overlay content ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "56px 16px 16px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 100%)",
        }}
      >
        {/* Venue name */}
        {v.showcaseUrl && (
          <a href={v.showcaseUrl} onClick={(e) => e.stopPropagation()} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            marginBottom: 14, marginTop: -4,
            padding: "3px 9px", borderRadius: 20,
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.25)",
            textDecoration: "none",
          }}>
            <span style={{ color: "#fff", fontSize: 7, lineHeight: 1 }}>✦</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 8, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#fff" }}>A Showcase Property</span>
          </a>
        )}
        <h3
          style={{
            fontFamily: GD,
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: 6,
            letterSpacing: "-0.2px",
          }}
        >
          {v.name}
        </h3>

        {/* Location + price row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: NU,
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 300,
              letterSpacing: "0.3px",
            }}
          >
            {v.location
              ? `${v.location}${v.region ? ` · ${v.region}` : ""}`
              : v.region || ""}
          </span>

          {v.priceFrom && (
            <span
              style={{
                fontFamily: NU,
                fontSize: 11,
                color: "#C9A84C",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              from {v.priceFrom}
            </span>
          )}
        </div>

        {/* Capacity hint if available */}
        {v.capacity && (
          <div
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              marginTop: 4,
              letterSpacing: "0.5px",
            }}
          >
            Up to {v.capacity} guests
          </div>
        )}
      </div>
    </article>
  );
}
