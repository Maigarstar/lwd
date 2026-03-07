// ─── src/pages/ShortlistPage.jsx ──────────────────────────────────────────
// Dedicated page for viewing and managing saved vendors and venues

import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import { GLOBAL_VENDORS } from "../data/globalVendors";
import ShortlistButton from "../components/buttons/ShortlistButton";
import { track } from "../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function ShortlistPage() {
  const C = useTheme();
  const { items, toggleItem } = useShortlist();
  const [filter, setFilter] = useState("all"); // 'all', 'venues', 'vendors'
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Map shortlist items to vendor/venue data
  const itemsWithData = items.map((item) => {
    const vendor = GLOBAL_VENDORS.find((v) => v.id === item.item_id);
    return {
      ...item,
      vendorData: vendor,
    };
  });

  // Filter items based on selected filter
  const filteredItems = itemsWithData.filter((item) => {
    if (filter === "all") return true;
    if (filter === "venues") return item.item_type === "venue" || item.vendorData?.cat === "venues";
    if (filter === "vendors") return item.item_type === "vendor" || item.vendorData?.cat !== "venues";
    return true;
  });

  const handleRemove = (itemId) => {
    track("shortlist_remove", { itemId });
    toggleItem({ id: itemId });
  };

  const handleClear = () => {
    if (window.confirm("Clear your entire shortlist? This cannot be undone.")) {
      track("shortlist_clear_all");
      items.forEach((item) => {
        toggleItem({ id: item.item_id });
      });
    }
  };

  // Empty state
  if (items.length === 0) {
    return (
      <main style={{ background: C.black, minHeight: "100vh", padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
              padding: "60px 40px",
            }}
          >
            <div style={{ fontSize: "48px" }}>♡</div>
            <div>
              <h1
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(28px, 4vw, 48px)",
                  color: C.off,
                  fontWeight: 400,
                  marginBottom: 16,
                }}
              >
                Your Shortlist is Empty
              </h1>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 16,
                  color: C.grey,
                  lineHeight: 1.6,
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                Start saving your favorite venues and vendors to build your perfect wedding story.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: C.gold,
                color: "#0a0906",
                border: "none",
                borderRadius: "var(--lwd-radius-input)",
                padding: "14px 40px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: NU,
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Browse Venues & Vendors
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: C.black, minHeight: "100vh", padding: "100px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontFamily: GD,
                fontSize: "clamp(32px, 4vw, 52px)",
                color: C.off,
                fontWeight: 400,
                margin: 0,
                marginBottom: 8,
              }}
            >
              My Shortlist
            </h1>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              {items.length} saved {items.length === 1 ? "item" : "items"}
            </p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
            {["all", "venues", "vendors"].map((tabFilter) => (
              <button
                key={tabFilter}
                onClick={() => setFilter(tabFilter)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  fontFamily: NU,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: filter === tabFilter ? C.gold : C.grey,
                  borderBottom: filter === tabFilter ? `2px solid ${C.gold}` : "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (filter !== tabFilter) e.currentTarget.style.color = C.off;
                }}
                onMouseLeave={(e) => {
                  if (filter !== tabFilter) e.currentTarget.style.color = C.grey;
                }}
              >
                {tabFilter.charAt(0).toUpperCase() + tabFilter.slice(1)}
                {tabFilter === "all" && ` (${items.length})`}
                {tabFilter === "venues" &&
                  ` (${items.filter((i) => i.item_type === "venue" || GLOBAL_VENDORS.find((v) => v.id === i.item_id)?.cat === "venues").length})`}
                {tabFilter === "vendors" &&
                  ` (${items.filter((i) => i.item_type === "vendor" || GLOBAL_VENDORS.find((v) => v.id === i.item_id)?.cat !== "venues").length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 32,
            marginBottom: 48,
          }}
        >
          {filteredItems.map((item) => (
            <ShortlistCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.item_id)}
              theme={C}
              toggleItem={toggleItem}
              isExpanded={expandedIds.has(item.item_id)}
              onToggleExpand={() => {
                const newExpanded = new Set(expandedIds);
                if (newExpanded.has(item.item_id)) {
                  newExpanded.delete(item.item_id);
                } else {
                  newExpanded.add(item.item_id);
                }
                setExpandedIds(newExpanded);
              }}
            />
          ))}
        </div>

        {/* Clear all button */}
        {items.length > 0 && (
          <div style={{ textAlign: "center", paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={handleClear}
              style={{
                background: "transparent",
                color: C.grey,
                border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)",
                padding: "12px 32px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: NU,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.rose;
                e.currentTarget.style.color = C.rose;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.grey;
              }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Mini card component for shortlist items
function ShortlistCard({ item, onRemove, theme: C, toggleItem, isExpanded, onToggleExpand }) {
  const vendor = item.vendorData;

  if (!vendor) {
    return (
      <div
        style={{
          background: C.card,
          borderRadius: 8,
          padding: 16,
          border: `1px solid ${C.border}`,
          textAlign: "center",
          opacity: 0.5,
        }}
      >
        <p style={{ color: C.grey, fontSize: 12 }}>Item not found</p>
      </div>
    );
  }

  const images = vendor.imgs || [];
  const mainImage = images[0];

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        transition: "all 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {/* Image */}
      {mainImage && (
        <div
          style={{
            width: "100%",
            height: 240,
            backgroundImage: `url(${mainImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <button
            onClick={onRemove}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.6)",
              border: "none",
              color: C.gold,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            }}
            title="Remove from shortlist"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* Name and location */}
        <h3
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: 18,
            color: C.off,
            margin: "0 0 8px 0",
            fontWeight: 400,
          }}
        >
          {vendor.name}
        </h3>

        {/* Location */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: C.grey,
            margin: "0 0 12px 0",
          }}
        >
          {vendor.city}, {vendor.country}
        </p>

        {/* Rating */}
        {vendor.rating && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: C.gold, fontSize: 12 }}>★★★★★</div>
            <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>{vendor.rating}</span>
            <span style={{ color: C.grey, fontSize: 12 }}>({vendor.reviews})</span>
          </div>
        )}

        {/* Price */}
        {vendor.price && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: C.gold,
              fontWeight: 600,
              margin: "0 0 12px 0",
            }}
          >
            From {vendor.price}
          </p>
        )}

        {/* Description preview */}
        {vendor.hook && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: C.grey,
              lineHeight: 1.5,
              margin: "0 0 12px 0",
              maxHeight: isExpanded ? "none" : "36px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vendor.hook}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => (window.location.href = `/vendor/${vendor.id}`)}
            style={{
              flex: 1,
              background: "transparent",
              color: C.gold,
              border: `1px solid rgba(201,168,76,0.4)`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "10px 16px",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.gold;
              e.currentTarget.style.color = "#0a0906";
              e.currentTarget.style.borderColor = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.gold;
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
            }}
          >
            View Profile
          </button>
          <ShortlistButton
            item={{ id: vendor.id }}
            isShortlisted={true}
            onToggle={() => {
              track("shortlist_remove_from_page", { itemId: vendor.id });
              toggleItem({ id: vendor.id });
            }}
            variant="icon"
            size="medium"
          />
        </div>
      </div>
    </div>
  );
}
