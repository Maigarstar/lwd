import { useTheme } from "../../../theme/ThemeContext";
import { FEATURED_VENUES } from "../../../data/featuredVenues";

export default function SignatureEditor({ content, updateField }) {
  const C = useTheme();

  const toggleVenue = (venueId) => {
    const current = content.signature_venue_ids || [];
    const updated = current.includes(venueId)
      ? current.filter((id) => id !== venueId)
      : [...current, venueId];
    updateField("signature_venue_ids", updated);
  };

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.white, margin: "0 0 24px 0" }}>
        LWD Signature Collection
      </h3>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 8, textTransform: "uppercase" }}>
          Section Heading
        </label>
        <input
          type="text"
          value={content.signature_heading || ""}
          onChange={(e) => updateField("signature_heading", e.target.value)}
          placeholder="LWD Signature Collection"
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
      </div>

      {/* Subtitle */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 8, textTransform: "uppercase" }}>
          Subtitle
        </label>
        <textarea
          value={content.signature_subtitle || ""}
          onChange={(e) => updateField("signature_subtitle", e.target.value)}
          placeholder="Our most prestigious and exclusive venues"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.white,
            fontSize: 14,
            fontFamily: "inherit",
            minHeight: 60,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      {/* Venues Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 12, textTransform: "uppercase" }}>
          Select Signature Venues
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {FEATURED_VENUES.map((venue) => (
            <label
              key={venue.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px",
                border: `1px solid ${
                  (content.signature_venue_ids || []).includes(venue.id)
                    ? "#C9A84C"
                    : C.border
                }`,
                borderRadius: 6,
                background:
                  (content.signature_venue_ids || []).includes(venue.id)
                    ? "rgba(201, 168, 76, 0.05)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={(content.signature_venue_ids || []).includes(venue.id)}
                onChange={() => toggleVenue(venue.id)}
                style={{ marginRight: 12, cursor: "pointer", width: 18, height: 18 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontSize: 14, fontWeight: 500 }}>
                  {venue.name}
                </div>
                <div style={{ color: C.grey, fontSize: 12 }}>
                  {venue.city}, {venue.country}
                </div>
              </div>
              {venue.tag && (
                <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, background: "rgba(201, 168, 76, 0.1)", padding: "4px 8px", borderRadius: 4 }}>
                  {venue.tag}
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", background: "rgba(201, 168, 76, 0.05)", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.grey }}>
        👑 The Signature Collection showcases the most exclusive venues with premium styling and prominent placement on the homepage.
      </div>
    </div>
  );
}
