// ─── src/components/sections/MottoStrip.jsx ──────────────────────────────────
// Full-width editorial quote/motto strip — sits below SEO block, above footer.
// Supports: plain dark bg OR background image with overlay density control.
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function MottoStrip({
  motto,
  subline,
  backgroundImage,       // optional URL — if set, used as bg
  overlayOpacity = 0.55, // 0–1  (0 = transparent, 1 = fully dark)
}) {
  const C = useTheme();

  if (!motto) return null;

  const hasImage = !!backgroundImage;

  return (
    <section
      aria-label="Location motto"
      style={{
        position: "relative",
        overflow: "hidden",
        background: hasImage ? "transparent" : C.dark,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Background image */}
      {hasImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
          {/* Density overlay */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `rgba(4,3,2,${overlayOpacity})`,
            }}
          />
        </>
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "80px 48px",
          textAlign: "center",
        }}
      >
        {/* Top decorative rule */}
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 1,
            background: "rgba(201,168,76,0.5)",
            margin: "0 auto 36px",
          }}
        />

        {/* Opening quote mark */}
        <div
          aria-hidden="true"
          style={{
            fontFamily: GD,
            fontSize: 72,
            color: "rgba(201,168,76,0.3)",
            lineHeight: 0.6,
            marginBottom: 28,
            fontStyle: "italic",
          }}
        >
          "
        </div>

        {/* Motto text */}
        <p
          style={{
            fontFamily: GD,
            fontSize: "clamp(22px, 3.5vw, 44px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "#ffffff",
            lineHeight: 1.3,
            letterSpacing: "-0.3px",
            maxWidth: 860,
            margin: "0 auto",
          }}
        >
          {motto}
        </p>

        {/* Optional sub-line */}
        {subline && (
          <p
            style={{
              fontFamily: NU,
              fontSize: 11,
              letterSpacing: "3.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginTop: 32,
            }}
          >
            {subline}
          </p>
        )}

        {/* Bottom decorative rule */}
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 1,
            background: "rgba(201,168,76,0.5)",
            margin: "36px auto 0",
          }}
        />
      </div>
    </section>
  );
}
