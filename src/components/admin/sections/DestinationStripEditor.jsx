import { useTheme } from "../../../theme/ThemeContext";

export default function DestinationStripEditor({ content, updateField }) {
  const C = useTheme();

  const AVAILABLE_DESTINATIONS = [
    { id: "italy", label: "Italy" },
    { id: "france", label: "France" },
    { id: "spain", label: "Spain" },
    { id: "portugal", label: "Portugal" },
    { id: "greece", label: "Greece" },
    { id: "england", label: "England" },
    { id: "scotland", label: "Scotland" },
    { id: "wales", label: "Wales" },
    { id: "switzerland", label: "Switzerland" },
  ];

  const toggleDestination = (destinationId) => {
    const current = content.destination_ids || [];
    const updated = current.includes(destinationId)
      ? current.filter((id) => id !== destinationId)
      : [...current, destinationId];
    updateField("destination_ids", updated);
  };

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.white, margin: "0 0 24px 0" }}>
        Destination Strip
      </h3>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 8, textTransform: "uppercase" }}>
          Section Heading
        </label>
        <input
          type="text"
          value={content.destination_heading || ""}
          onChange={(e) => updateField("destination_heading", e.target.value)}
          placeholder="Explore Iconic Destinations"
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
          Subtitle (Optional)
        </label>
        <input
          type="text"
          value={content.destination_subtitle || ""}
          onChange={(e) => updateField("destination_subtitle", e.target.value)}
          placeholder="Curated wedding destinations across Europe..."
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

      {/* Destinations Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.grey, marginBottom: 12, textTransform: "uppercase" }}>
          Select Destinations
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {AVAILABLE_DESTINATIONS.map((dest) => (
            <label
              key={dest.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                border: `1px solid ${
                  (content.destination_ids || []).includes(dest.id)
                    ? "#C9A84C"
                    : C.border
                }`,
                borderRadius: 6,
                background:
                  (content.destination_ids || []).includes(dest.id)
                    ? "rgba(201, 168, 76, 0.05)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={(content.destination_ids || []).includes(dest.id)}
                onChange={() => toggleDestination(dest.id)}
                style={{ marginRight: 8, cursor: "pointer" }}
              />
              <span style={{ color: C.white, fontSize: 14 }}>{dest.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", background: "rgba(201, 168, 76, 0.05)", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.grey }}>
        💡 Select which destinations appear in the destination strip carousel
      </div>
    </div>
  );
}
