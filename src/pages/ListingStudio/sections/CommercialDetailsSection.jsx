const CommercialDetailsSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <h3 style={{ marginBottom: 20 }}>Commercial Details</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Price Range</label>
          <input
            type="text"
            name="price_range"
            value={formData?.price_range || ""}
            onChange={(e) => onChange("price_range", e.target.value)}
            placeholder="€€€"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData?.capacity || ""}
            onChange={(e) => onChange("capacity", e.target.value)}
            placeholder="e.g., 150"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Starting From (number)</label>
          <input
            type="number"
            min="0"
            name="price_from"
            value={formData?.price_from || ""}
            onChange={(e) => onChange("price_from", e.target.value)}
            placeholder="e.g. 12000"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Currency Symbol</label>
          <input
            type="text"
            name="price_currency"
            value={formData?.price_currency || ""}
            onChange={(e) => onChange("price_currency", e.target.value)}
            placeholder="e.g. £ or $ or €"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>
    </section>
  );
};

export default CommercialDetailsSection;
