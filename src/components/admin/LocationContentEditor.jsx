// ─── src/components/admin/LocationContentEditor.jsx ───────────────────────────
// Location Studio content editing component for hero, featured, geography tabs
// Integrated into CountriesModule detail view for location content curation

import ImageUploadField from './ImageUploadField';

const GD = "'Neue Haas Display', serif";
const NU = "'Neue Haas Grotesk Text', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Render Hero section editor tab
 */
export function HeroEditor({ contentForm, setContentForm, activeItem, C, inputStyle, labelStyle, hintStyle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>
        Hero Section
      </div>

      {/* Hero Title */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Hero Title</label>
        <input
          value={contentForm.heroTitle || activeItem.name}
          onChange={e => setContentForm(p => ({ ...p, heroTitle: e.target.value }))}
          placeholder={activeItem.name}
          style={inputStyle}
        />
        <div style={hintStyle}>Displayed prominently over hero image. Defaults to location name.</div>
      </div>

      {/* Hero Subtitle */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Hero Subtitle</label>
        <textarea
          value={contentForm.heroSubtitle || ""}
          onChange={e => setContentForm(p => ({ ...p, heroSubtitle: e.target.value }))}
          placeholder="A curated guide to luxury wedding celebrations..."
          rows={3}
          style={{ ...inputStyle, minHeight: 80 }}
        />
        <div style={hintStyle}>Supporting tagline or description. 1-2 sentences max for impact.</div>
      </div>

      {/* Hero Image */}
      <div style={{ marginBottom: 20 }}>
        <ImageUploadField
          label="Hero Image"
          value={contentForm.heroImage || ""}
          onChange={url => setContentForm(p => ({ ...p, heroImage: url }))}
          bucket="listing-media"
          folder="locations/heroes"
          hint="Full-bleed background image. Recommended: 1920×1080px. Supports WebP."
          palette={C}
          previewHeight={140}
        />
      </div>

      {/* CTA Button */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>CTA Button Text</label>
          <input
            value={contentForm.ctaText || "Explore Venues"}
            onChange={e => setContentForm(p => ({ ...p, ctaText: e.target.value }))}
            placeholder="Explore Venues"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>CTA Button Link</label>
          <input
            value={contentForm.ctaLink || "#"}
            onChange={e => setContentForm(p => ({ ...p, ctaLink: e.target.value }))}
            placeholder="#"
            style={inputStyle}
          />
          <div style={hintStyle}>Relative path (#search) or full URL</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render Featured section editor tab
 */
export function FeaturedEditor({ contentForm, setContentForm, activeItem, allVenues, allVendors, C, inputStyle, labelStyle, hintStyle, btnOutline, btnGold }) {
  const featuredVenueIds = contentForm.featuredVenueIds || [];
  const featuredVendorIds = contentForm.featuredVendorIds || [];

  const toggleVenue = (id) => {
    setContentForm(p => ({
      ...p,
      featuredVenueIds: featuredVenueIds.includes(id)
        ? featuredVenueIds.filter(v => v !== id)
        : [...featuredVenueIds, id],
    }));
  };

  const toggleVendor = (id) => {
    setContentForm(p => ({
      ...p,
      featuredVendorIds: featuredVendorIds.includes(id)
        ? featuredVendorIds.filter(v => v !== id)
        : [...featuredVendorIds, id],
    }));
  };

  // Filter venues/vendors to current location
  let locationVenues = [];
  let locationVendors = [];

  if (activeItem.type === "country") {
    locationVenues = allVenues.filter(v => v.countrySlug === activeItem.slug);
    locationVendors = allVendors.filter(v => v.countrySlug === activeItem.slug);
  } else if (activeItem.type === "region") {
    locationVenues = allVenues.filter(v => v.regionSlug === activeItem.slug);
    locationVendors = allVendors.filter(v => v.regionSlug === activeItem.slug);
  } else if (activeItem.type === "city") {
    locationVenues = allVenues.filter(v => v.citySlug === activeItem.slug);
    locationVendors = allVendors.filter(v => v.citySlug === activeItem.slug);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>
        Featured Content Curation
      </div>

      {/* Featured Venues Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Featured Venues Title</label>
          <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{featuredVenueIds.length} selected</span>
        </div>
        <input
          value={contentForm.featuredVenuesTitle || "Signature Venues"}
          onChange={e => setContentForm(p => ({ ...p, featuredVenuesTitle: e.target.value }))}
          placeholder="Signature Venues"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 12, background: `${C.gold}08`, border: `1px solid ${C.gold}15`, borderRadius: 3, padding: 10 }}>
          Select up to 6 venues to feature. These will be displayed prominently with full media galleries.
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 3, padding: 12, background: `${C.black}40` }}>
          {locationVenues.length === 0 ? (
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic" }}>No venues in this location.</div>
          ) : (
            locationVenues.map(venue => (
              <div
                key={venue.id}
                onClick={() => featuredVenueIds.length < 6 || featuredVenueIds.includes(venue.id) ? toggleVenue(venue.id) : null}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 10, marginBottom: 6,
                  background: featuredVenueIds.includes(venue.id) ? `${C.gold}15` : `transparent`,
                  border: `1px solid ${featuredVenueIds.includes(venue.id) ? C.gold : C.border}`,
                  borderRadius: 3, cursor: featuredVenueIds.length < 6 || featuredVenueIds.includes(venue.id) ? "pointer" : "not-allowed",
                  opacity: featuredVenueIds.length < 6 || featuredVenueIds.includes(venue.id) ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={featuredVenueIds.includes(venue.id)}
                  onChange={() => toggleVenue(venue.id)}
                  style={{ cursor: "pointer", width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 600 }}>{venue.name}</div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{venue.description?.slice(0, 60)}...</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Featured Vendors Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Featured Vendors Title</label>
          <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{featuredVendorIds.length} selected</span>
        </div>
        <input
          value={contentForm.featuredVendorsTitle || "Top Wedding Planners"}
          onChange={e => setContentForm(p => ({ ...p, featuredVendorsTitle: e.target.value }))}
          placeholder="Top Wedding Planners"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 12, background: `${C.gold}08`, border: `1px solid ${C.gold}15`, borderRadius: 3, padding: 10 }}>
          Select up to 6 wedding planners or vendors. Featured vendors appear as curated premium partners.
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 3, padding: 12, background: `${C.black}40` }}>
          {locationVendors.length === 0 ? (
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, fontStyle: "italic" }}>No vendors in this location.</div>
          ) : (
            locationVendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => featuredVendorIds.length < 6 || featuredVendorIds.includes(vendor.id) ? toggleVendor(vendor.id) : null}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 10, marginBottom: 6,
                  background: featuredVendorIds.includes(vendor.id) ? `${C.gold}15` : `transparent`,
                  border: `1px solid ${featuredVendorIds.includes(vendor.id) ? C.gold : C.border}`,
                  borderRadius: 3, cursor: featuredVendorIds.length < 6 || featuredVendorIds.includes(vendor.id) ? "pointer" : "not-allowed",
                  opacity: featuredVendorIds.length < 6 || featuredVendorIds.includes(vendor.id) ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={featuredVendorIds.includes(vendor.id)}
                  onChange={() => toggleVendor(vendor.id)}
                  style={{ cursor: "pointer", width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 600 }}>{vendor.name}</div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{vendor.specialty || "Wedding services"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render Geography section editor tab
 */
export function GeographyEditor({ contentForm, setContentForm, activeItem, C, inputStyle, labelStyle, hintStyle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px" }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>
        Geography & Map Configuration
      </div>

      {/* Map Preview */}
      {contentForm.mapLat && contentForm.mapLng && (
        <div style={{ marginBottom: 20, borderRadius: 4, overflow: "hidden", height: 240, border: `1px solid ${C.border}` }}>
          <iframe
            title={`Map of ${activeItem.name}`}
            width="100%"
            height="240"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${contentForm.mapLat},${contentForm.mapLng}&z=${contentForm.mapZoom || 8}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {/* Map Coordinates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Latitude</label>
          <input
            value={contentForm.mapLat || ""}
            onChange={e => setContentForm(p => ({ ...p, mapLat: e.target.value }))}
            placeholder="43.2965"
            type="number"
            step="0.0001"
            style={inputStyle}
          />
          <div style={hintStyle}>Map center latitude</div>
        </div>
        <div>
          <label style={labelStyle}>Longitude</label>
          <input
            value={contentForm.mapLng || ""}
            onChange={e => setContentForm(p => ({ ...p, mapLng: e.target.value }))}
            placeholder="11.8726"
            type="number"
            step="0.0001"
            style={inputStyle}
          />
          <div style={hintStyle}>Map center longitude</div>
        </div>
        <div>
          <label style={labelStyle}>Zoom Level</label>
          <input
            value={contentForm.mapZoom || 8}
            onChange={e => setContentForm(p => ({ ...p, mapZoom: parseInt(e.target.value) }))}
            type="number"
            min="1"
            max="20"
            style={inputStyle}
          />
          <div style={hintStyle}>1–20 scale</div>
        </div>
      </div>

      {/* Discovery Filters Config */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 20 }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 12 }}>
          Discovery Filters
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 12, background: `${C.gold}08`, border: `1px solid ${C.gold}15`, borderRadius: 3, padding: 10 }}>
          Configure which filter options appear to users on this location page.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { key: "showCapacityFilter", label: "Capacity Filter", hint: "Show guest capacity options (50, 100, 200+)" },
            { key: "showStyleFilter", label: "Style Filter", hint: "Show wedding style tags (Modern, Garden, etc)" },
            { key: "showPriceFilter", label: "Price Filter", hint: "Show budget ranges" },
          ].map(({ key, label, hint }) => (
            <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: 8, borderRadius: 3, background: `${C.gold}03`, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.gold}08`}
              onMouseLeave={e => e.currentTarget.style.background = `${C.gold}03`}>
              <input
                type="checkbox"
                checked={(contentForm.discoveryFilters?.[key]) !== false}
                onChange={e => setContentForm(p => ({
                  ...p,
                  discoveryFilters: { ...(p.discoveryFilters || {}), [key]: e.target.checked }
                }))}
                style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontFamily: NU, fontSize: 11, color: C.off, fontWeight: 600 }}>{label}</div>
                <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>{hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
