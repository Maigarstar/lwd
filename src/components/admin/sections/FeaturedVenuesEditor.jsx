import { useTheme } from "../../../theme/ThemeContext";
import { FEATURED_VENUES } from "../../../data/featuredVenues";

export default function FeaturedVenuesEditor({ content, updateField }) {
  const C = useTheme();

  const toggleVenue = (venueId) => {
    const current = content.venues_ids || [];
    const updated = current.includes(venueId)
      ? current.filter((id) => id !== venueId)
      : [...current, venueId];
    updateField("venues_ids", updated);
  };

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.white, margin: "0 0 24px 0" }}>
        Featured Venues Section
      </h3>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 8, textTransform: "uppercase" }}>
          Section Heading
        </label>
        <input
          type="text"
          value={content.venues_heading || ""}
          onChange={(e) => updateField("venues_heading", e.target.value)}
          placeholder="The World's Most Beautiful Wedding Venues"
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
          value={content.venues_subtitle || ""}
          onChange={(e) => updateField("venues_subtitle", e.target.value)}
          placeholder="From coastal escapes to castle retreats..."
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
          Select Featured Venues
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
                  (content.venues_ids || []).includes(venue.id)
                    ? "#C9A84C"
                    : C.border
                }`,
                borderRadius: 6,
                background:
                  (content.venues_ids || []).includes(venue.id)
                    ? "rgba(201, 168, 76, 0.05)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={(content.venues_ids || []).includes(venue.id)}
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
              <div style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
                {venue.rating} ★
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", background: "rgba(201, 168, 76, 0.05)", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.grey }}>
        💡 Select venues that appear in the featured venues grid. These display as cards with images, names, and ratings.
      </div>
    </div>
  );
}
