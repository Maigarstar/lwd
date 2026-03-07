// ─── src/components/VendorLeadInbox.jsx ───────────────────────────────────
// Vendor Lead Inbox - Mini CRM showing enquiries in four pipeline stages
// States: New, Replied, Booked, Archived

import { useState, useEffect } from "react";
import { getVendorEnquiries } from "../services/vendorMetricsService";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

export default function VendorLeadInbox({ vendorId, C, isMobile }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("new"); // new, replied, booked, archived

  // Load enquiries on mount
  useEffect(() => {
    const loadEnquiries = async () => {
      setLoading(true);
      const result = await getVendorEnquiries(vendorId, 50);
      if (!result.error) {
        setEnquiries(result.data);
      }
      setLoading(false);
    };

    loadEnquiries();
  }, [vendorId]);

  // Filter enquiries by status
  const filteredEnquiries = enquiries.filter(e => {
    if (selectedFilter === "new") return e.status === "new";
    if (selectedFilter === "replied") return e.status === "replied";
    if (selectedFilter === "booked") return e.status === "booked";
    if (selectedFilter === "archived") return e.status === "archived";
    return true;
  });

  // Count by status
  const counts = {
    new: enquiries.filter(e => e.status === "new").length,
    replied: enquiries.filter(e => e.status === "replied").length,
    booked: enquiries.filter(e => e.status === "booked").length,
    archived: enquiries.filter(e => e.status === "archived").length,
  };

  const statusColors = {
    new: C?.gold || "#C9A84C",
    replied: C?.blue || "#4f9ff0",
    booked: C?.green || "#10b981",
    archived: C?.grey || "#888888",
  };

  const FilterButton = ({ status, label, count }) => (
    <button
      onClick={() => setSelectedFilter(status)}
      style={{
        padding: "10px 14px",
        background: selectedFilter === status ? "rgba(201,168,76,0.1)" : "none",
        border: selectedFilter === status ? `1px solid ${C?.gold || "#C9A84C"}` : `1px solid ${C?.border || "#333333"}`,
        borderRadius: "var(--lwd-radius-input)",
        color: selectedFilter === status ? C?.gold || "#C9A84C" : C?.grey || "#888888",
        fontFamily: NU,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "1px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
      onMouseEnter={(e) => {
        if (selectedFilter !== status) {
          e.currentTarget.style.borderColor = C?.border2 || "#444444";
        }
      }}
      onMouseLeave={(e) => {
        if (selectedFilter !== status) {
          e.currentTarget.style.borderColor = C?.border || "#333333";
        }
      }}
    >
      {label}
      <span style={{
        background: statusColors[status],
        color: C?.white || "#ffffff",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: "3px",
        minWidth: "20px",
        textAlign: "center",
      }}>
        {count}
      </span>
    </button>
  );

  const EnquiryCard = ({ enquiry }) => (
    <div
      style={{
        background: C?.card || "#1a1a1a",
        border: `1px solid ${enquiry.status === "new" ? (C?.gold || "#C9A84C") + "20" : C?.border || "#333333"}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: isMobile ? "12px 14px" : "16px 18px",
        marginBottom: 10,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C?.border2 || "#444444";
        e.currentTarget.style.background = C?.card || "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = enquiry.status === "new" ? (C?.gold || "#C9A84C") + "20" : C?.border || "#333333";
      }}
    >
      {/* Status Indicator */}
      <div
        style={{
          width: 4,
          height: "100%",
          background: statusColors[enquiry.status],
          borderRadius: "2px",
          minHeight: 60,
          opacity: 0.8,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <p style={{ fontFamily: GD, fontSize: 14, color: C?.white || "#ffffff", margin: "0 0 2px 0", fontWeight: 600 }}>
              {enquiry.couple_name || "Unknown Couple"}
            </p>
            <p style={{ fontFamily: NU, fontSize: 11, color: C?.grey || "#888888", margin: 0, letterSpacing: "0.5px" }}>
              {enquiry.couple_email || "no-email@example.com"}
            </p>
          </div>
          <span style={{
            background: statusColors[enquiry.status],
            color: C?.white || "#ffffff",
            fontSize: 9,
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: "3px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            whiteSpace: "nowrap",
          }}>
            {enquiry.status}
          </span>
        </div>

        {/* Enquiry Details */}
        <p style={{ fontFamily: NU, fontSize: 12, color: C?.grey || "#888888", margin: "6px 0", lineHeight: 1.4 }}>
          {enquiry.message || "No message provided"}
        </p>

        {/* Meta Info */}
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: C?.grey2 || "#666666" }}>
          {enquiry.guest_count && (
            <div>👥 {enquiry.guest_count} guests</div>
          )}
          {enquiry.budget && (
            <div>💰 {enquiry.budget}</div>
          )}
          {enquiry.event_date && (
            <div>📅 {new Date(enquiry.event_date).toLocaleDateString()}</div>
          )}
        </div>

        {/* Timestamp */}
        <p style={{ fontFamily: NU, fontSize: 10, color: C?.grey2 || "#666666", margin: "6px 0 0 0", fontStyle: "italic" }}>
          {enquiry.created_at ? new Date(enquiry.created_at).toLocaleDateString() : "Recently"}
        </p>
      </div>

      {/* Action Button */}
      <button
        style={{
          padding: "8px 12px",
          background: "none",
          border: `1px solid ${C?.border2 || "#444444"}`,
          borderRadius: "var(--lwd-radius-input)",
          color: C?.grey || "#888888",
          fontFamily: NU,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          minWidth: "80px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C?.gold || "#C9A84C";
          e.currentTarget.style.color = C?.gold || "#C9A84C";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C?.border2 || "#444444";
          e.currentTarget.style.color = C?.grey || "#888888";
        }}
      >
        View ›
      </button>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "16px 0" : "20px 0" }}>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: GD, fontSize: 24, color: C?.white || "#ffffff", margin: "0 0 12px 0" }}>
          Lead Inbox
        </h3>
        <p style={{ fontFamily: NU, fontSize: 12, color: C?.grey || "#888888", margin: 0, letterSpacing: "0.5px" }}>
          Manage enquiries through the pipeline
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}>
        <FilterButton status="new" label="New" count={counts.new} />
        <FilterButton status="replied" label="Replied" count={counts.replied} />
        <FilterButton status="booked" label="Booked" count={counts.booked} />
        <FilterButton status="archived" label="Archived" count={counts.archived} />
      </div>

      {/* Enquiry List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C?.grey || "#888888" }}>
          Loading enquiries...
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontFamily: NU, fontSize: 14, color: C?.grey || "#888888", margin: 0 }}>
            No {selectedFilter} enquiries yet
          </p>
        </div>
      ) : (
        <div>
          {filteredEnquiries.map((enquiry) => (
            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
          ))}
        </div>
      )}
    </div>
  );
}
