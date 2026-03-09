const LocationSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
      <h3 style={{ marginBottom: 20 }}>Location</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Country</label>
          <select
            name="country"
            value={formData?.country || "italy"}
            onChange={(e) => onChange("country", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          >
            <option value="italy">Italy</option>
            <option value="france">France</option>
            <option value="uk">United Kingdom</option>
            <option value="spain">Spain</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Region</label>
          <input
            type="text"
            name="region"
            value={formData?.region || ""}
            onChange={(e) => onChange("region", e.target.value)}
            placeholder="e.g., Lake Como"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Address</label>
        <input
          type="text"
          name="address"
          value={formData?.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Street address"
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
        />
      </div>
    </section>
  );
};

export default LocationSection;
