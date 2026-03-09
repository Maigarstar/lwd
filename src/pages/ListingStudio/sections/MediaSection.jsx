const MediaSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
      <h3 style={{ marginBottom: 20 }}>Media</h3>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Hero Image URL</label>
        <input
          type="url"
          name="hero_image"
          value={formData?.hero_image || ""}
          onChange={(e) => onChange("hero_image", e.target.value)}
          placeholder="https://..."
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Gallery Images</label>
        <textarea
          name="gallery_images"
          value={formData?.gallery_images || ""}
          onChange={(e) => onChange("gallery_images", e.target.value)}
          placeholder="Enter image URLs, one per line"
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3, minHeight: 100, fontFamily: "inherit" }}
        />
      </div>
    </section>
  );
};

export default MediaSection;
