import { useTheme } from "../../../theme/ThemeContext";

export default function VendorSectionEditor({ content, updateField }) {
  const C = useTheme();

  // TODO: Replace with actual vendor list from database
  const AVAILABLE_VENDORS = [
    { id: 1, name: "Elegant Florals" },
    { id: 2, name: "Timeless Photography" },
    { id: 3, name: "Luxury Catering Co." },
    { id: 4, name: "Artisan Cakes Studio" },
    { id: 5, name: "Event Styling Pros" },
  ];

  const toggleVendor = (vendorId) => {
    const current = content.vendor_ids || [];
    const updated = current.includes(vendorId)
      ? current.filter((id) => id !== vendorId)
      : [...current, vendorId];
    updateField("vendor_ids", updated);
  };

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 24px 0" }}>
        Vendor Section
      </h3>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase" }}>
          Section Heading
        </label>
        <input
          type="text"
          value={content.vendor_heading || ""}
          onChange={(e) => updateField("vendor_heading", e.target.value)}
          placeholder="Trusted Wedding Professionals"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Subtitle */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase" }}>
          Subtitle
        </label>
        <input
          type="text"
          value={content.vendor_subtitle || ""}
          onChange={(e) => updateField("vendor_subtitle", e.target.value)}
          placeholder="Expert vendors curated for luxury weddings"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: C.card,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Vendors Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 12, textTransform: "uppercase" }}>
          Select Featured Vendors
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {AVAILABLE_VENDORS.map((vendor) => (
            <label
              key={vendor.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                border: `1px solid ${
                  (content.vendor_ids || []).includes(vendor.id)
                    ? "#C9A84C"
                    : C.border
                }`,
                borderRadius: 6,
                background:
                  (content.vendor_ids || []).includes(vendor.id)
                    ? "rgba(201, 168, 76, 0.05)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={(content.vendor_ids || []).includes(vendor.id)}
                onChange={() => toggleVendor(vendor.id)}
                style={{ marginRight: 8, cursor: "pointer" }}
              />
              <span style={{ color: C.text, fontSize: 14 }}>{vendor.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", background: "rgba(201, 168, 76, 0.05)", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSecondary }}>
        💡 Select vendors to feature in the vendor section. These should be your most trusted, premium partners.
      </div>
    </div>
  );
}
