const SEOSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
      <h3 style={{ marginBottom: 20 }}>SEO Settings</h3>
      <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>SEO tools and preview will be expanded in a future update</p>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Meta Title</label>
        <input
          type="text"
          name="seo_title"
          value={formData?.seo_title || ""}
          onChange={(e) => onChange("seo_title", e.target.value)}
          placeholder="Page title for search engines"
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Meta Description</label>
        <textarea
          name="seo_description"
          value={formData?.seo_description || ""}
          onChange={(e) => onChange("seo_description", e.target.value)}
          placeholder="Page description for search engines"
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3, minHeight: 80, fontFamily: "inherit" }}
        />
      </div>
    </section>
  );
};

export default SEOSection;
