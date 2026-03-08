// ─── src/components/admin/AdminAllLeads.jsx ──────────────────────────────────
// Admin view: All enquiries across all vendors with filtering & search
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getAllEnquiries, getEnquiryStats, getVendorsWithLeadCounts } from "../../services/adminLeadService";

const GD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

export default function AdminAllLeads({ C }) {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    vendorId: "",
    searchEmail: "",
    searchName: "",
  });
  const [page, setPage] = useState(0);
  const limit = 25;

  // Load enquiries and stats
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      const { data: enqData, error: enqErr } = await getAllEnquiries({
        ...filters,
        limit,
        offset: page * limit,
      });

      const { data: statsData } = await getEnquiryStats();
      const { data: vendorData } = await getVendorsWithLeadCounts();

      if (enqErr) {
        setError("Failed to load enquiries");
      } else {
        setEnquiries(enqData);
        setStats(statsData);
        setVendors(vendorData);
      }
      setLoading(false);
    };

    loadData();
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({ status: "", vendorId: "", searchEmail: "", searchName: "" });
    setPage(0);
  };

  const statusStyles = {
    new: { bg: "rgba(201,168,76,0.15)", color: "#d4af37" },
    replied: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    booked: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    archived: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  };

  return (
    <div style={{ padding: "20px", background: C.black, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: GD, fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 12 }}>
          All Leads
        </h1>
        <p style={{ fontFamily: FB, fontSize: 13, color: C.grey }}>
          View and manage enquiries from across all vendors
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 30 }}>
          {[
            { label: "Total", value: stats.total, color: C.gold },
            { label: "New", value: stats.new, color: "#d4af37" },
            { label: "Replied", value: stats.replied, color: "#3b82f6" },
            { label: "Booked", value: stats.booked, color: "#22c55e" },
            { label: "Archived", value: stats.archived, color: "#9ca3af" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: 12,
                background: C.card,
                borderRadius: "var(--lwd-radius-input)",
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontFamily: FB, fontSize: 11, color: C.grey, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          padding: 16,
          background: C.card,
          borderRadius: "var(--lwd-radius-input)",
          border: `1px solid ${C.border}`,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{
              padding: "8px 12px",
              background: C.dark,
              color: C.text,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 12,
            }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="booked">Booked</option>
            <option value="archived">Archived</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={filters.vendorId}
            onChange={(e) => handleFilterChange("vendorId", e.target.value)}
            style={{
              padding: "8px 12px",
              background: C.dark,
              color: C.text,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 12,
            }}
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.vendorName} ({v.count})
              </option>
            ))}
          </select>

          {/* Email Search */}
          <input
            type="email"
            placeholder="Search by email..."
            value={filters.searchEmail}
            onChange={(e) => handleFilterChange("searchEmail", e.target.value)}
            style={{
              padding: "8px 12px",
              background: C.dark,
              color: C.text,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 12,
            }}
          />

          {/* Name Search */}
          <input
            type="text"
            placeholder="Search by couple name..."
            value={filters.searchName}
            onChange={(e) => handleFilterChange("searchName", e.target.value)}
            style={{
              padding: "8px 12px",
              background: C.dark,
              color: C.text,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 12,
            }}
          />
        </div>

        {/* Clear Filters Button */}
        {Object.values(filters).some((v) => v) && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: "6px 12px",
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: "var(--lwd-radius-input)",
              color: "#dc2626",
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Enquiries Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.grey }}>
          <p style={{ fontFamily: FB, fontSize: 13 }}>Loading...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: 40, color: "#dc2626" }}>
          <p style={{ fontFamily: FB, fontSize: 13 }}>{error}</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.grey }}>
          <p style={{ fontFamily: FB, fontSize: 13 }}>No enquiries found</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Couple
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Vendor
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Guests
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 11, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.couple_name}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.couple_email}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.vendor_name}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.guest_count || "—"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        background: statusStyles[enq.status]?.bg || statusStyles.new.bg,
                        color: statusStyles[enq.status]?.color || statusStyles.new.color,
                      }}
                    >
                      {enq.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.grey }}>
                    {new Date(enq.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {enquiries.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "6px 12px",
              background: page === 0 ? C.border : C.gold,
              color: page === 0 ? C.grey : "#fff",
              border: "none",
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 600,
              cursor: page === 0 ? "default" : "pointer",
            }}
          >
            Previous
          </button>
          <span style={{ padding: "6px 12px", color: C.grey, fontFamily: FB, fontSize: 12 }}>
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "6px 12px",
              background: C.gold,
              color: "#fff",
              border: "none",
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
