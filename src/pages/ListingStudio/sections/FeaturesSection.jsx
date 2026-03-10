const FeaturesSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 16, padding: 20, borderRadius: 8, border: "1px solid rgba(229,221,208,0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}>
      <h3 style={{ marginBottom: 20 }}>Features & Amenities</h3>
      <textarea
        name="amenities"
        value={formData?.amenities || ""}
        onChange={(e) => onChange("amenities", e.target.value)}
        placeholder="List features, amenities, and highlights..."
        style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3, minHeight: 120, fontFamily: "inherit" }}
      />
      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Tip: List each feature on a new line</p>
    </section>
  );
};

export default FeaturesSection;
