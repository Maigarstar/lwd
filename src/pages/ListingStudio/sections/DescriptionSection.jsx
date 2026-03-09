const DescriptionSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #e5ddd0" }}>
      <h3 style={{ marginBottom: 20 }}>Description</h3>
      <textarea
        name="description"
        value={formData?.description || ""}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Enter detailed description..."
        style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3, minHeight: 150, fontFamily: "inherit" }}
      />
    </section>
  );
};

export default DescriptionSection;
