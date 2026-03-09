// ─── src/admin/VendorAccounts/VendorAccountsTable.jsx ──────────────────────
// Vendor Accounts Table Display Component
// Shows: Name, Listing, Email, Status, Last Login, Actions
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

const statusStyles = {
  "not-invited": { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: "Not Invited" },
  invited: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", label: "Invited" },
  activated: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Activated" },
  suspended: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Suspended" },
};

export default function VendorAccountsTable({ vendors, C, onAction, loading, currentPage, totalPages, onPageChange }) {
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: NU, fontSize: 14, color: C.grey }}>Loading vendor accounts...</p>
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: NU, fontSize: 14, color: C.grey }}>No vendor accounts found</p>
      </div>
    );
  }

  const handleActionClick = (action, vendor) => {
    if (onAction) {
      onAction(action, vendor);
    }
  };

  return (
    <div style={{ overflow: "auto", borderRadius: "var(--lwd-radius-container)" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: C.card,
          color: C.white,
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: `${C.gold}10`,
              borderBottom: `1px solid ${C.gold}30`,
            }}
          >
            <th style={tableHeaderStyle(NU)}>Vendor Name</th>
            <th style={tableHeaderStyle(NU)}>Email</th>
            <th style={tableHeaderStyle(NU)}>Status</th>
            <th style={tableHeaderStyle(NU)}>Last Login</th>
            <th style={tableHeaderStyle(NU)}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, idx) => (
            <tr
              key={vendor.id}
              style={{
                borderBottom: `1px solid ${C.grey}20`,
                backgroundColor: idx % 2 === 0 ? C.card : `${C.grey}05`,
              }}
            >
              {/* Vendor Name */}
              <td style={tableCellStyle(NU)}>
                <div style={{ fontWeight: 600, color: C.white }}>{vendor.name || "Unnamed"}</div>
                {vendor.contact_name && (
                  <div style={{ fontSize: 11, color: C.grey, marginTop: 2 }}>Contact: {vendor.contact_name}</div>
                )}
              </td>

              {/* Email */}
              <td style={tableCellStyle(NU)}>
                <div style={{ fontSize: 12, color: C.white }}>{vendor.email}</div>
              </td>

              {/* Status Badge */}
              <td style={tableCellStyle(NU)}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    backgroundColor: statusStyles[vendor.status]?.bg || statusStyles["not-invited"].bg,
                    color: statusStyles[vendor.status]?.color || statusStyles["not-invited"].color,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {statusStyles[vendor.status]?.label || vendor.status}
                </span>
              </td>

              {/* Last Login */}
              <td style={tableCellStyle(NU)}>
                <div style={{ fontSize: 12, color: C.grey }}>{vendor.last_login || "Never"}</div>
              </td>

              {/* Actions Dropdown */}
              <td style={tableCellStyle(NU)}>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
                    style={{
                      padding: "4px 8px",
                      background: `${C.gold}20`,
                      border: `1px solid ${C.gold}40`,
                      borderRadius: 4,
                      color: C.gold,
                      fontFamily: NU,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⋯ Actions
                  </button>

                  {/* Dropdown Menu */}
                  {expandedId === vendor.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: 4,
                        backgroundColor: C.card,
                        border: `1px solid ${C.grey}30`,
                        borderRadius: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 100,
                        minWidth: 180,
                      }}
                    >
                      {/* Send/Resend Activation */}
                      {vendor.status === "not-invited" || vendor.status === "invited" ? (
                        <button
                          onClick={() => {
                            handleActionClick(vendor.status === "invited" ? "resend" : "send", vendor);
                            setExpandedId(null);
                          }}
                          style={dropdownItemStyle(NU, C)}
                        >
                          {vendor.status === "invited" ? "📧 Resend Invite" : "📧 Send Invite"}
                        </button>
                      ) : null}

                      {/* Open as Vendor */}
                      {vendor.status === "activated" && (
                        <button
                          onClick={() => {
                            handleActionClick("open-as-vendor", vendor);
                            setExpandedId(null);
                          }}
                          style={dropdownItemStyle(NU, C)}
                        >
                          ⟶ Open as Vendor
                        </button>
                      )}

                      {/* Disable Account */}
                      {vendor.status === "activated" || vendor.status === "invited" ? (
                        <button
                          onClick={() => {
                            if (confirm(`Disable account for ${vendor.name}?`)) {
                              handleActionClick("disable", vendor);
                              setExpandedId(null);
                            }
                          }}
                          style={dropdownItemStyle(NU, C, true)}
                        >
                          🔒 Disable Account
                        </button>
                      ) : null}

                      {/* View Details */}
                      <button
                        onClick={() => {
                          handleActionClick("view-details", vendor);
                          setExpandedId(null);
                        }}
                        style={dropdownItemStyle(NU, C)}
                      >
                        👁 View Details
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            padding: "20px",
            backgroundColor: C.card,
            borderTop: `1px solid ${C.grey}20`,
          }}
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "4px 8px",
              background: currentPage === 1 ? `${C.grey}20` : `${C.gold}20`,
              border: `1px solid ${currentPage === 1 ? `${C.grey}30` : `${C.gold}40`}`,
              borderRadius: 4,
              color: currentPage === 1 ? C.grey : C.gold,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontFamily: NU,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "4px 8px",
              background: currentPage === totalPages ? `${C.grey}20` : `${C.gold}20`,
              border: `1px solid ${currentPage === totalPages ? `${C.grey}30` : `${C.gold}40`}`,
              borderRadius: 4,
              color: currentPage === totalPages ? C.grey : C.gold,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontFamily: NU,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function tableHeaderStyle(fontFamily) {
  return {
    padding: "12px 16px",
    textAlign: "left",
    fontFamily,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#6b7280",
  };
}

function tableCellStyle(fontFamily) {
  return {
    padding: "12px 16px",
    fontFamily,
    fontSize: 12,
    verticalAlign: "middle",
  };
}

function dropdownItemStyle(fontFamily, C, isDanger = false) {
  return {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    textAlign: "left",
    border: "none",
    background: "none",
    fontFamily,
    fontSize: 12,
    color: isDanger ? "#ef4444" : C.white,
    cursor: "pointer",
    transition: "all 0.15s",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  };
}
