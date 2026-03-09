/**
 * SidebarNewsCard
 *
 * Shows press mentions, awards, and editorial features for the listing.
 * Keeps the venue feeling credible and editorially validated.
 *
 * Props:
 *   entity  {object} — listing data (entity.news, entity.awards, entity.pressFeatures)
 *   C       {object} — colour palette
 *   items   {array}  — optional explicit override: [{title, outlet, year, url}]
 */

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

// Default items shown when no press data exists
const DEFAULT_ITEMS = [];

export default function SidebarNewsCard({ entity = {}, C = {}, items }) {
  // Resolve items from entity data or prop override
  const pressItems = items
    || entity.pressFeatures
    || entity.news
    || entity.awards
    || DEFAULT_ITEMS;

  if (!pressItems || pressItems.length === 0) return null;

  const displayItems = pressItems.slice(0, 4);

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface || C.card,
      padding: "18px 22px",
    }}>
      {/* Header */}
      <div style={{
        fontFamily: FB,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: C.gold,
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ fontSize: 12 }}>✦</span>
        As featured in
      </div>

      {/* Press items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {displayItems.map((item, i) => (
          <div key={i} style={{
            padding: "10px 0",
            borderTop: i > 0 ? `1px solid ${C.border}` : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
            {/* Icon */}
            <div style={{
              flexShrink: 0,
              width: 28, height: 28,
              borderRadius: "50%",
              background: C.goldDim || "rgba(201,168,76,0.08)",
              border: `1px solid ${C.goldBorder || "rgba(201,168,76,0.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>
              📰
            </div>

            <div style={{ minWidth: 0 }}>
              {/* Outlet name */}
              <div style={{
                fontFamily: FB,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: 2,
              }}>
                {item.outlet || item.source || "Press"}
                {item.year && (
                  <span style={{ color: C.textMuted || C.grey, fontWeight: 400, marginLeft: 6 }}>
                    {item.year}
                  </span>
                )}
              </div>

              {/* Article title or feature description */}
              {item.title && (
                item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: FB,
                      fontSize: 12,
                      color: C.text,
                      textDecoration: "none",
                      lineHeight: 1.4,
                      display: "block",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.text; }}
                  >
                    {item.title}
                  </a>
                ) : (
                  <div style={{
                    fontFamily: FB, fontSize: 12,
                    color: C.text, lineHeight: 1.4,
                  }}>
                    {item.title}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
