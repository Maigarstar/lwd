import { useTheme, FD, FB } from "./ProfileDesignSystem";

export default function StatsStrip({ entity }) {
  const C = useTheme();

  // Build stats based on entity type (venue or planner)
  const stats = entity.capacity ? [
    { label: "From", value: entity.priceFrom, sub: "per event" },
    { label: "Ceremony", value: `Up to ${entity.capacity.ceremony}`, sub: "guests" },
    { label: "Dinner", value: `Up to ${entity.capacity.dinner}`, sub: "guests" },
    { label: "Sleeps", value: entity.accommodation?.maxGuests || "N/A", sub: entity.accommodation?.rooms ? `${entity.accommodation.rooms} rooms` : "" },
    { label: "Responds", value: entity.responseTime, sub: `${entity.responseRate}% response rate` },
    { label: "Rating", value: `${entity.rating} ★`, sub: `${entity.reviews} reviews` },
  ] : [
    { label: "From", value: entity.priceFrom, sub: "per event" },
    { label: "Responds", value: entity.responseTime, sub: `${entity.responseRate}% response rate` },
    { label: "Rating", value: `${entity.rating} ★`, sub: `${entity.reviews} reviews` },
    { label: "Weddings Planned", value: `${entity.weddingsPlanned || 0}+`, sub: "celebrations" },
  ];

  return (
    <div className="lwd-stats-outer" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 40px" }}>
      <div style={{ display: "flex", overflowX: "auto", gap: 0, scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {stats.map((s, i) => (
          <div key={i} className="lwd-stats-card" style={{
            flex: "0 0 auto", padding: "20px 28px",
            borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : "none",
            minWidth: 130,
          }}>
            <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 500, color: C.gold, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
