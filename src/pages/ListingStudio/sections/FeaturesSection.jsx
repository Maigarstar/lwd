const FeaturesSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
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
