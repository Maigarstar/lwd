import { useTheme } from "../../../theme/ThemeContext";

export default function NewsletterEditor({ content, updateField }) {
  const C = useTheme();

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 24px 0" }}>
        Newsletter Block
      </h3>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase" }}>
          Heading
        </label>
        <input
          type="text"
          value={content.newsletter_heading || ""}
          onChange={(e) => updateField("newsletter_heading", e.target.value)}
          placeholder="Stay Updated"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Subtitle */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase" }}>
          Subtitle / Description
        </label>
        <textarea
          value={content.newsletter_subtitle || ""}
          onChange={(e) => updateField("newsletter_subtitle", e.target.value)}
          placeholder="Get the latest venue discoveries and wedding inspiration delivered to your inbox."
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            minHeight: 80,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      {/* Button Text */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase" }}>
          Subscription Button Text
        </label>
        <input
          type="text"
          value={content.newsletter_button_text || ""}
          onChange={(e) => updateField("newsletter_button_text", e.target.value)}
          placeholder="Subscribe"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 6, margin: "6px 0 0 0" }}>
          Text displayed on the subscription button
        </p>
      </div>

      <div style={{ padding: "16px", background: "rgba(201, 168, 76, 0.05)", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSecondary }}>
        📧 The newsletter block encourages visitor email signup for updates and inspiration.
      </div>
    </div>
  );
}
