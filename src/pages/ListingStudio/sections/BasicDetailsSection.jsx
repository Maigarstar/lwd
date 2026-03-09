const BasicDetailsSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
      <h3 style={{ marginBottom: 20 }}>Basic Details</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Venue Name</label>
          <input
            type="text"
            name="venue_name"
            value={formData?.venue_name || ""}
            onChange={(e) => onChange("venue_name", e.target.value)}
            placeholder="e.g., Villa Balbiano"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Slug</label>
          <input
            type="text"
            name="slug"
            value={formData?.slug || ""}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="villa-balbiano"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Category</label>
          <select
            name="category"
            value={formData?.category || "wedding-venues"}
            onChange={(e) => onChange("category", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          >
            <option value="wedding-venues">Wedding Venues</option>
            <option value="wedding-planners">Wedding Planners</option>
            <option value="photographers">Photographers</option>
            <option value="florists">Florists</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Destination</label>
          <select
            name="destination"
            value={formData?.destination || "italy"}
            onChange={(e) => onChange("destination", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          >
            <option value="italy">Italy</option>
            <option value="france">France</option>
            <option value="spain">Spain</option>
            <option value="greece">Greece</option>
            <option value="uk">United Kingdom</option>
            <option value="us">United States</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default BasicDetailsSection;
