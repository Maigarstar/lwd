// ─── src/components/admin/AdminAllLeads.jsx ──────────────────────────────────
// Enhanced Admin Lead Dashboard with intelligence features
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { getAllEnquiries, getEnquiryStats, getVendorsWithLeadCounts, updateEnquiryStatus } from "../../services/adminLeadService";

const GD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

const BUDGET_OPTIONS = ["£10k–£20k", "£20k–£50k", "£50k+", "£100k+"];
const LEAD_SOURCES = ["Venue Profile", "Vendor Page", "Homepage Contact", "Search Results", "Shortlist Page", "Featured Listing", "AI Concierge"];

export default function AdminAllLeads({ C }) {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState(null); // For detail modal
  const [page, setPage] = useState(0);
  const limit = 20;

  // Advanced filters
  const [filters, setFilters] = useState({
    status: "",
    vendorId: "",
    budget: "",
    leadSource: "",
    searchEmail: "",
    searchName: "",
  });

  // Load data
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
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({ status: "", vendorId: "", budget: "", leadSource: "", searchEmail: "", searchName: "" });
    setPage(0);
  };

  const handleStatusUpdate = async (leadId, newStatus) => {
    await updateEnquiryStatus(leadId, newStatus);
    // Refresh the list
    const { data } = await getAllEnquiries({ ...filters, limit, offset: page * limit });
    setEnquiries(data);
    if (selectedLead?.id === leadId) {
      setSelectedLead(null); // Close modal
    }
  };

  const statusStyles = {
    new: { bg: "rgba(201,168,76,0.15)", color: "#d4af37" },
    replied: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    booked: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    archived: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  };

  const responseTimeColor = (responseTime) => {
    if (responseTime === "Pending") return C.grey;
    const mins = parseInt(responseTime);
    if (mins < 60) return "#22c55e"; // Green - fast
    if (mins < 240) return "#d4af37"; // Gold - normal
    return "#f43f5e"; // Red - slow
  };

  return (
    <div style={{ padding: "20px", background: C.black, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: GD, fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 8 }}>
          All Leads
        </h1>
        <p style={{ fontFamily: FB, fontSize: 13, color: C.grey }}>
          Marketplace intelligence dashboard — track high-value leads, vendor response times & conversion metrics
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 30 }}>
          {[
            { label: "Total Leads", value: stats.total, color: C.gold },
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
              <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      <div
        style={{
          padding: 16,
          background: C.card,
          borderRadius: "var(--lwd-radius-input)",
          border: `1px solid ${C.border}`,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 12, letterSpacing: 1 }}>
          Filters
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 12 }}>
          {/* Status */}
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

          {/* Vendor */}
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

          {/* Budget */}
          <select
            value={filters.budget}
            onChange={(e) => handleFilterChange("budget", e.target.value)}
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
            <option value="">All Budgets</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Lead Source */}
          <select
            value={filters.leadSource}
            onChange={(e) => handleFilterChange("leadSource", e.target.value)}
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
            <option value="">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
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

      {/* Leads Table */}
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
          <p style={{ fontFamily: FB, fontSize: 13 }}>No leads found</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: C.card, borderRadius: "var(--lwd-radius-input)", border: `1px solid ${C.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Couple
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email / Phone
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Vendor
                </th>
                <th style={{ textAlign: "center", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Guests / Budget
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Wedding Date
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Source
                </th>
                <th style={{ textAlign: "left", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Submitted
                </th>
                <th style={{ textAlign: "center", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Response Time
                </th>
                <th style={{ textAlign: "center", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Status
                </th>
                <th style={{ textAlign: "center", padding: 12, fontFamily: FB, fontSize: 10, color: C.grey, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text, fontWeight: 600 }}>
                    {enq.couple_name}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    <div>{enq.couple_email}</div>
                    {enq.couple_phone && <div style={{ fontSize: 11, color: C.grey }}>{enq.couple_phone}</div>}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.vendor_name}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text, textAlign: "center" }}>
                    <div>{enq.guest_count || "—"}</div>
                    {enq.budget_range && <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{enq.budget_range}</div>}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {enq.event_date ? new Date(enq.event_date).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 11, color: C.grey }}>
                    {enq.lead_source || "Venue Profile"}
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: C.text }}>
                    {new Date(enq.created_at).toLocaleDateString()}
                    <br />
                    <span style={{ fontSize: 11, color: C.grey }}>{new Date(enq.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </td>
                  <td style={{ padding: 12, fontFamily: FB, fontSize: 12, color: responseTimeColor(enq.response_time), fontWeight: 600, textAlign: "center" }}>
                    {enq.response_time}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
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
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedLead(enq)}
                      style={{
                        padding: "4px 8px",
                        background: C.gold,
                        border: "none",
                        borderRadius: "var(--lwd-radius-input)",
                        color: "#fff",
                        fontFamily: FB,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View →
                    </button>
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

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card,
              borderRadius: "var(--lwd-radius-input)",
              border: `1px solid ${C.border}`,
              maxWidth: 600,
              maxHeight: "90vh",
              overflow: "auto",
              width: "100%",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: GD, fontSize: 20, color: C.text, margin: 0 }}>
                Lead Details
              </h2>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: C.grey,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 20 }}>
              {/* Couple Info */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 8, letterSpacing: 1 }}>
                  Couple Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>NAME</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.couple_name}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>EMAIL</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.couple_email}</div>
                  </div>
                  {selectedLead.couple_phone && (
                    <div>
                      <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>PHONE</div>
                      <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.couple_phone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Info */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 8, letterSpacing: 1 }}>
                  Event Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>WEDDING DATE</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>
                      {selectedLead.event_date ? new Date(selectedLead.event_date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>GUESTS</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.guest_count || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>BUDGET</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.gold, fontWeight: 600 }}>
                      {selectedLead.budget_range || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, marginBottom: 4 }}>SOURCE</div>
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.lead_source || "Venue Profile"}</div>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 8, letterSpacing: 1 }}>
                  Vendor
                </h3>
                <div style={{ fontFamily: FB, fontSize: 13, color: C.text }}>{selectedLead.vendor_name}</div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 8, letterSpacing: 1 }}>
                    Couple Message
                  </h3>
                  <div style={{ fontFamily: FB, fontSize: 13, color: C.text, lineHeight: 1.6, padding: 12, background: C.dark, borderRadius: "var(--lwd-radius-input)", border: `1px solid ${C.border}` }}>
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 12, letterSpacing: 1 }}>
                  Timeline
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, minWidth: 80 }}>Submitted</div>
                    <div style={{ fontFamily: FB, fontSize: 12, color: C.text }}>
                      {new Date(selectedLead.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedLead.replied_at && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, minWidth: 80 }}>Replied</div>
                      <div style={{ fontFamily: FB, fontSize: 12, color: C.text }}>
                        {new Date(selectedLead.replied_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, minWidth: 80 }}>Response Time</div>
                    <div style={{ fontFamily: FB, fontSize: 12, color: responseTimeColor(selectedLead.response_time), fontWeight: 600 }}>
                      {selectedLead.response_time}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div style={{ marginBottom: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: C.grey, marginBottom: 12, letterSpacing: 1 }}>
                  Admin Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => {
                      const subject = `Follow-up: ${selectedLead.couple_name}'s Enquiry`;
                      const body = `Hi ${selectedLead.vendor_name},\n\nThis is a reminder about the enquiry from ${selectedLead.couple_name} submitted on ${new Date(selectedLead.created_at).toLocaleDateString()}.\n\nLead Details:\n- Couple: ${selectedLead.couple_name}\n- Email: ${selectedLead.couple_email}\n- Wedding Date: ${selectedLead.event_date ? new Date(selectedLead.event_date).toLocaleDateString() : 'Not specified'}\n- Guests: ${selectedLead.guest_count || 'Not specified'}\n- Budget: ${selectedLead.budget_range || 'Not specified'}\n\nPlease respond promptly to increase booking chances.\n\nBest regards,\nLuxury Wedding Directory`;
                      window.location.href = `mailto:${selectedLead.vendor_email || 'vendor@example.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                    style={{
                      padding: "10px 16px",
                      background: C.gold,
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--lwd-radius-input)",
                      fontFamily: FB,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Email Vendor
                  </button>
                  {selectedLead.status !== "archived" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedLead.id, "archived")}
                      style={{
                        padding: "10px 16px",
                        background: C.border,
                        color: C.grey,
                        border: "none",
                        borderRadius: "var(--lwd-radius-input)",
                        fontFamily: FB,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Archive Lead
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
