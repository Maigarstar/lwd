/**
 * SidebarProfileCard
 *
 * Shows the listing owner / contact person with photo, name, bio quote,
 * member since badge, and a compact stats grid (response rate, weddings, etc).
 *
 * Props:
 *   entity  {object} — listing/venue/vendor data
 *   C       {object} — colour palette
 */

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

function MiniStat({ label, value, C, borderRight }) {
  return (
    <div style={{
      padding: "10px 0",
      borderRight: borderRight ? `1px solid ${C.border}` : "none",
      paddingRight: borderRight ? 14 : 0,
      paddingLeft: borderRight ? 0 : 14,
    }}>
      <div style={{
        fontFamily: FB,
        fontSize: 10,
        color: C.textMuted || C.grey,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: FD, fontSize: 16, color: C.text, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

export default function SidebarProfileCard({ entity = {}, C = {} }) {
  const owner = entity.owner || {};
  const name   = owner.name || entity.name || "";
  const title  = owner.title || entity.serviceTier || entity.category || "";
  const photo  = owner.photo || entity.imgs?.[0] || entity.heroImage || null;
  const bio    = owner.bio || entity.tagline || null;
  const memberSince = owner.memberSince || entity.memberSince || null;
  const verified = entity.verified || owner.verified || false;

  // Build stats — only include items that have data
  const stats = [
    entity.responseTime  && { label: "Responds in",     value: entity.responseTime },
    entity.responseRate  && { label: "Response rate",   value: `${entity.responseRate}%` },
    entity.weddingsPlanned && { label: "Weddings",      value: `${entity.weddingsPlanned}+` },
    memberSince          && { label: "Partner since",   value: String(memberSince) },
  ].filter(Boolean).slice(0, 4);

  if (!name) return null;

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface || C.card,
      overflow: "hidden",
    }}>
      {/* Gold + green gradient accent line at top */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${C.gold}, ${C.green || "#22c55e"})`,
      }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Photo + name header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {photo ? (
              <img
                src={photo}
                alt={name}
                loading="lazy"
                style={{
                  width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
                  border: `2px solid ${C.gold}`,
                  display: "block",
                }}
              />
            ) : (
              // Avatar placeholder if no photo
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: C.goldDim || "rgba(201,168,76,0.12)",
                border: `2px solid ${C.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FD, fontSize: 22, color: C.gold,
              }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            {verified && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 18, height: 18, borderRadius: "50%",
                background: C.gold,
                border: `2px solid ${C.surface || C.card}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#fff", fontWeight: 700,
              }}>✓</div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: FD, fontSize: 16, color: C.text,
              lineHeight: 1.2, marginBottom: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {name}
            </div>
            {title && (
              <div style={{
                fontFamily: FB, fontSize: 12,
                color: C.textLight || C.grey,
                marginBottom: memberSince ? 3 : 0,
              }}>
                {title}
              </div>
            )}
            {memberSince && (
              <div style={{
                fontFamily: FB, fontSize: 11,
                color: C.gold, fontWeight: 600, letterSpacing: "0.2px",
              }}>
                ✦ LWD Partner since {memberSince}
              </div>
            )}
          </div>
        </div>

        {/* Bio / quote */}
        {bio && (
          <div style={{
            borderLeft: `2px solid ${C.goldBorder || `${C.gold}33`}`,
            paddingLeft: 14,
            marginBottom: 16,
          }}>
            <p style={{
              fontFamily: FD, fontSize: 13,
              fontStyle: "italic", color: C.textMid || C.grey,
              lineHeight: 1.75, margin: 0,
            }}>
              "{bio}"
            </p>
          </div>
        )}

        {/* Stats grid */}
        {stats.length >= 2 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 14,
          }}>
            {stats.map((s, i) => (
              <MiniStat
                key={s.label}
                label={s.label}
                value={s.value}
                C={C}
                borderRight={i % 2 === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
