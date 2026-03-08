// ─── src/admin/VendorAccounts/VendorAccountsTable.jsx ──────────────────────
// Vendor Accounts Table Display Component
// Shows: Name, Listing, Email, Status, Last Login, Actions
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

// Status styles for 5-state model
function getStatusStyles(C) {
  return {
    "pending-approval": { bg: `${C.gold}15`, color: C.gold, label: "Pending Approval" },
    "approved": { bg: `${C.blue}15`, color: C.blue, label: "Approved" },
    "invited": { bg: `${C.blue}15`, color: C.blue, label: "Invited" },
    "activated": { bg: `${C.green}15`, color: C.green, label: "Activated" },
    "suspended": { bg: `${C.rose}15`, color: C.rose, label: "Suspended" },
    "rejected": { bg: `${C.grey}15`, color: C.grey, label: "Rejected" },
  };
}

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
            <th style={tableHeaderStyle(NU, C)}>Vendor Name</th>
            <th style={tableHeaderStyle(NU, C)}>Email</th>
            <th style={tableHeaderStyle(NU, C)}>Status</th>
            <th style={tableHeaderStyle(NU, C)}>Activation Status</th>
            <th style={tableHeaderStyle(NU, C)}>Last Login</th>
            <th style={tableHeaderStyle(NU, C)}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, idx) => (
            <tr
              key={vendor.id}
              style={{
                borderBottom: `1px solid ${C.grey}20`,
                backgroundColor: idx % 2 === 0 ? C.card : `${C.dark}`,
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
                {(() => {
                  const statusStyles = getStatusStyles(C);
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        backgroundColor: statusStyles[vendor.status]?.bg || statusStyles["pending-approval"].bg,
                        color: statusStyles[vendor.status]?.color || statusStyles["pending-approval"].color,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {statusStyles[vendor.status]?.label || vendor.status}
                    </span>
                  );
                })()}
              </td>

              {/* Activation Status with Countdown */}
              <td style={tableCellStyle(NU)}>
                {getActivationStatusDisplay(vendor, C)}
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
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 100,
                        minWidth: 180,
                      }}
                    >
                      {/* Approve Account (Pending Approval) */}
                      {vendor.status === "pending-approval" && (
                        <button
                          onClick={() => {
                            handleActionClick("approve", vendor);
                            setExpandedId(null);
                          }}
                          style={dropdownItemStyle(NU, C)}
                        >
                          ✓ Approve Account
                        </button>
                      )}

                      {/* Reject Account (Pending Approval) */}
                      {vendor.status === "pending-approval" && (
                        <button
                          onClick={() => {
                            if (confirm(`Reject account for ${vendor.name}? They will not be able to create an account.`)) {
                              handleActionClick("reject", vendor);
                              setExpandedId(null);
                            }
                          }}
                          style={dropdownItemStyle(NU, C, true)}
                        >
                          ✕ Reject Account
                        </button>
                      )}

                      {/* Send Activation Invite (Approved or invited) */}
                      {vendor.status === "approved" && (
                        <button
                          onClick={() => {
                            handleActionClick("send", vendor);
                            setExpandedId(null);
                          }}
                          style={dropdownItemStyle(NU, C)}
                        >
                          📧 Send Activation Email
                        </button>
                      )}

                      {/* Resend Activation (Already invited) */}
                      {vendor.status === "invited" && (
                        <button
                          onClick={() => {
                            handleActionClick("resend", vendor);
                            setExpandedId(null);
                          }}
                          style={dropdownItemStyle(NU, C)}
                        >
                          📧 Resend Activation Email
                        </button>
                      )}

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

                      {/* Suspend/Disable Account */}
                      {(vendor.status === "activated" || vendor.status === "invited" || vendor.status === "approved") && (
                        <button
                          onClick={() => {
                            if (confirm(`Disable account for ${vendor.name}? They will not be able to login.`)) {
                              handleActionClick("disable", vendor);
                              setExpandedId(null);
                            }
                          }}
                          style={dropdownItemStyle(NU, C, true)}
                        >
                          🔒 Suspend Account
                        </button>
                      )}

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
            borderTop: `1px solid ${C.border}`,
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

/**
 * Get activation status display with countdown for invited vendors
 */
function getActivationStatusDisplay(vendor, C) {
  // Pending approval - no activation yet
  if (vendor.status === "pending-approval") {
    return <div style={{ fontSize: 12, color: C.grey }}>Awaiting approval</div>;
  }

  // Approved - no activation yet
  if (vendor.status === "approved") {
    return <div style={{ fontSize: 12, color: C.grey }}>Ready to invite</div>;
  }

  // Activated - show green checkmark
  if (vendor.status === "activated") {
    return (
      <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
        ✓ Activated
      </div>
    );
  }

  // Suspended - show suspended label
  if (vendor.status === "suspended") {
    return (
      <div style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>
        🔒 Suspended
      </div>
    );
  }

  // Rejected - show rejected label
  if (vendor.status === "rejected") {
    return (
      <div style={{ fontSize: 12, color: C.grey, fontWeight: 600 }}>
        ✕ Rejected
      </div>
    );
  }

  // Invited - calculate days remaining
  if (vendor.status === "invited" && vendor.activation_token_expires_at) {
    const expiresAt = new Date(vendor.activation_token_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    let color = C.blue;
    let label = `${daysRemaining} days`;

    // Change color to warning if less than 1 day remaining
    if (daysRemaining <= 0) {
      color = C.rose; // red - expired
      label = "Expired";
    } else if (daysRemaining === 1) {
      color = C.gold; // orange - expires today
      label = "Expires today";
    } else if (daysRemaining < 3) {
      color = C.gold; // orange - warning
      label = `${daysRemaining} days left`;
    }

    return (
      <div style={{ fontSize: 12, color, fontWeight: 600 }}>
        ⏱ {label}
      </div>
    );
  }

  // Default
  return <div style={{ fontSize: 12, color: C.grey }}>—</div>;
}

function tableHeaderStyle(fontFamily, C) {
  return {
    padding: "12px 16px",
    textAlign: "left",
    fontFamily,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: C?.grey || "#6b7280",
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
    color: isDanger ? C.rose : C.white,
    cursor: "pointer",
    transition: "all 0.15s",
    borderBottom: `1px solid ${C.border}`,
  };
}
