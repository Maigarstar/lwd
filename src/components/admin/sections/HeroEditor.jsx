// ═══════════════════════════════════════════════════════════════════════════════
// HeroEditor Component
// Edit hero section: title, subtitle, CTA text, link, image
// ═══════════════════════════════════════════════════════════════════════════════
import { useTheme } from "../../../theme/ThemeContext";

export default function HeroEditor({ content, updateField }) {
  const C = useTheme();

  return (
    <div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: C.white,
          marginBottom: 24,
          margin: "0 0 24px 0",
        }}
      >
        Hero Section
      </h3>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Hero Title (Main Headline)
        </label>
        <input
          type="text"
          value={content.hero_title || ""}
          onChange={(e) => updateField("hero_title", e.target.value)}
          placeholder="The World's Finest"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Primary headline displayed on hero background
        </p>
      </div>

      {/* Subtitle */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Hero Subtitle (Secondary Headline)
        </label>
        <input
          type="text"
          value={content.hero_subtitle || ""}
          onChange={(e) => updateField("hero_subtitle", e.target.value)}
          placeholder="Wedding Directory"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Secondary headline (often italicized in gold)
        </p>
      </div>

      {/* Benefit Description */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Benefit Description
        </label>
        <textarea
          value={content.hero_cta_text || ""}
          onChange={(e) => updateField("hero_cta_text", e.target.value)}
          placeholder="Intelligent discovery for modern luxury weddings..."
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            minHeight: 80,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Subheading describing the value proposition
        </p>
      </div>

      {/* CTA Text */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          CTA Button Text
        </label>
        <input
          type="text"
          value={content.hero_cta_text || ""}
          onChange={(e) => updateField("hero_cta_text", e.target.value)}
          placeholder="Ask Aura"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Primary call-to-action button text
        </p>
      </div>

      {/* CTA Link */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          CTA Link / Anchor
        </label>
        <input
          type="text"
          value={content.hero_cta_link || ""}
          onChange={(e) => updateField("hero_cta_link", e.target.value)}
          placeholder="#aura or /aura"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Where clicking CTA button navigates to
        </p>
      </div>

      {/* Hero Image URL */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: C.grey,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Hero Background Image URL (Optional)
        </label>
        <input
          type="url"
          value={content.hero_image_url || ""}
          onChange={(e) => updateField("hero_image_url", e.target.value)}
          placeholder="https://images.example.com/hero.jpg"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            marginTop: 6,
            margin: "6px 0 0 0",
          }}
        >
          Leave empty to use default carousel. Must be a valid image URL.
        </p>
      </div>

      <div
        style={{
          padding: "16px",
          background: "rgba(201, 168, 76, 0.05)",
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          fontSize: 12,
          color: C.grey,
        }}
      >
        💡 <strong>Tip:</strong> Hero backgrounds can be set to static image or
        default to the luxury venue carousel
      </div>
    </div>
  );
}
