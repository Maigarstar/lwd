/**
 * SidebarMapCard
 *
 * Shows the listing's location with a map preview and address details.
 * When no map/coordinates are available, shows a clean location text card.
 *
 * Props:
 *   entity       {object}, listing data
 *   C            {object}, colour palette
 *   onViewMap    {fn}    , callback to open full map view
 */

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

/**
 * Static Google Maps embed URL for a rough location pin.
 * Uses Maps Embed API, requires no API key for basic static display.
 * Falls back to an Open Street Map iframe if preferred.
 */
function StaticMapEmbed({ lat, lng, label }) {
  if (!lat || !lng) return null;
  // Using OpenStreetMap iframe, no API key needed
  const bbox = `${lng - 0.01},${lat - 0.007},${lng + 0.01},${lat + 0.007}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div style={{
      width: "100%",
      height: 160,
      overflow: "hidden",
      position: "relative",
      borderRadius: "2px 2px 0 0",
      pointerEvents: "none", // prevent interaction inside sidebar
    }}>
      <iframe
        title={`Map of ${label}`}
        src={src}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

/**
 * Placeholder map tile when no coordinates are available.
 */
function MapPlaceholder({ C }) {
  return (
    <div style={{
      width: "100%",
      height: 120,
      background: C.dark || C.bgAlt || "#f3ede6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "2px 2px 0 0",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>🗺</div>
        <div style={{
          fontFamily: FB, fontSize: 11,
          color: C.textMuted || C.grey,
          letterSpacing: "0.5px",
        }}>
          Location preview
        </div>
      </div>
    </div>
  );
}

export default function SidebarMapCard({ entity = {}, C = {}, onViewMap }) {
  const city       = entity.city || entity.location || null;
  const region     = entity.region || null;
  const country    = entity.country || null;
  const address    = entity.address || null;
  const lat        = entity.latitude  || entity.lat || null;
  const lng        = entity.longitude || entity.lng || null;
  const locationLabel = [city, region, country].filter(Boolean).join(", ");

  // Don't render if no location data at all
  if (!locationLabel && !address) return null;

  const hasCoordinates = !!(lat && lng);

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface || C.card,
      overflow: "hidden",
    }}>
      {/* Map or placeholder */}
      {hasCoordinates ? (
        <StaticMapEmbed lat={lat} lng={lng} label={locationLabel || "Venue"} />
      ) : (
        <MapPlaceholder C={C} />
      )}

      {/* Location details */}
      <div style={{ padding: "14px 18px" }}>
        {/* Location label */}
        {locationLabel && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: address ? 6 : 0 }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>📍</span>
            <div style={{
              fontFamily: FD,
              fontSize: 14,
              color: C.text,
              lineHeight: 1.3,
            }}>
              {locationLabel}
            </div>
          </div>
        )}

        {/* Full address (if different from location label) */}
        {address && address !== locationLabel && (
          <div style={{
            fontFamily: FB,
            fontSize: 12,
            color: C.textLight || C.grey,
            lineHeight: 1.5,
            marginLeft: 21,
            marginBottom: 10,
          }}>
            {address}
          </div>
        )}

        {/* View on map CTA */}
        <button
          onClick={onViewMap}
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 14px",
            background: "transparent",
            border: `1px solid ${C.border2 || C.border}`,
            borderRadius: "var(--lwd-radius-input, 3px)",
            color: C.textLight || C.grey,
            fontFamily: FB,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.gold;
            e.currentTarget.style.color = C.gold;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border2 || C.border;
            e.currentTarget.style.color = C.textLight || C.grey;
          }}
        >
          <span style={{ fontSize: 12 }}>🗺</span>
          View on map
        </button>
      </div>
    </div>
  );
}
