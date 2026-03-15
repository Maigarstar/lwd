// ─── src/admin/VendorAccounts/VendorAccountsPage.jsx ────────────────────────
// Vendor Accounts Management Page
// Admin section for creating, inviting, and managing vendor accounts
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import VendorAccountsTable from "./VendorAccountsTable";
import CreateVendorAccountForm from "./CreateVendorAccountForm";
import {
  getAllVendorAccounts,
  createVendorAccount,
  sendActivationEmail,
  resendActivationEmail,
  disableVendorAccount,
  getVendorDetails,
  approveVendorAccount,
  rejectVendorAccount,
} from "./vendorAccountsService";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";
const FB = "var(--font-button)";

export default function VendorAccountsPage({ C }) {
  // State
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [formLoading, setFormLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const itemsPerPage = 20;

  // Load vendors on mount and when filters/page changes
  useEffect(() => {
    loadVendors();
  }, [statusFilter, searchTerm, currentPage]);

  // Auto-hide messages after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadVendors = async () => {
    setLoading(true);
    const filters = {
      status: statusFilter === "all" ? null : statusFilter,
      search: searchTerm || null,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    };

    const { data, total, error } = await getAllVendorAccounts(filters);

    if (error) {
      showMessage("Error loading vendor accounts", "error");
      console.error(error);
    } else {
      setVendors(data || []);
      setTotalPages(Math.ceil(total / itemsPerPage));
    }

    setLoading(false);
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Handle Create Account
  const handleCreateAccount = async (formData) => {
    setFormLoading(true);

    const { data, error } = await createVendorAccount(formData);

    if (error) {
      showMessage(`Error creating account: ${error.message || "Unknown error"}`, "error");
      console.error(error);
    } else {
      showMessage(`Account created for ${formData.vendorName}. Invitation email sent.`, "success");
      setShowCreateForm(false);
      setCurrentPage(1);
      await loadVendors();
    }

    setFormLoading(false);
  };

  // Handle Send/Resend Activation
  const handleSendActivation = async (vendor, isResend = false) => {
    const { error } = isResend
      ? await resendActivationEmail(vendor.id)
      : await sendActivationEmail(vendor.id, vendor.email, vendor.name);

    if (error) {
      showMessage(`Error sending email: ${error.message || "Unknown error"}`, "error");
    } else {
      showMessage(`Activation email ${isResend ? "resent" : "sent"} to ${vendor.email}`, "success");
      await loadVendors();
    }
  };

  // Handle Approve Account
  const handleApproveAccount = async (vendor) => {
    // Get current user ID (from auth context or session)
    const adminId = null; // TODO: Get from auth context
    const { error } = await approveVendorAccount(vendor.id, adminId);

    if (error) {
      showMessage(`Error approving account: ${error.message || "Unknown error"}`, "error");
    } else {
      showMessage(`Account for ${vendor.name} has been approved`, "success");
      await loadVendors();
    }
  };

  // Handle Reject Account
  const handleRejectAccount = async (vendor) => {
    // Get current user ID (from auth context or session)
    const adminId = null; // TODO: Get from auth context
    const { error } = await rejectVendorAccount(vendor.id, adminId);

    if (error) {
      showMessage(`Error rejecting account: ${error.message || "Unknown error"}`, "error");
    } else {
      showMessage(`Account for ${vendor.name} has been rejected`, "success");
      await loadVendors();
    }
  };

  // Handle Disable Account
  const handleDisableAccount = async (vendor) => {
    const { error } = await disableVendorAccount(vendor.id);

    if (error) {
      showMessage(`Error disabling account: ${error.message || "Unknown error"}`, "error");
    } else {
      showMessage(`Account for ${vendor.name} has been disabled`, "success");
      await loadVendors();
    }
  };

  // Handle Open as Vendor
  const handleOpenAsVendor = (vendor) => {
    sessionStorage.setItem(
      "lwd_admin_preview",
      JSON.stringify({
        type: "vendor",
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
      })
    );
    window.location.href = "/vendor";
  };

  // Handle View Details
  const handleViewDetails = async (vendor) => {
    const { data, error } = await getVendorDetails(vendor.id);
    if (error) {
      showMessage("Error loading vendor details", "error");
    } else {
      setSelectedVendor(data);
      setShowDetailsModal(true);
    }
  };

  // Main action dispatcher
  const handleTableAction = (action, vendor) => {
    switch (action) {
      case "approve":
        handleApproveAccount(vendor);
        break;
      case "reject":
        handleRejectAccount(vendor);
        break;
      case "send":
        handleSendActivation(vendor, false);
        break;
      case "resend":
        handleSendActivation(vendor, true);
        break;
      case "open-as-vendor":
        handleOpenAsVendor(vendor);
        break;
      case "disable":
        handleDisableAccount(vendor);
        break;
      case "view-details":
        handleViewDetails(vendor);
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: C.black }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: GD, fontSize: 24, fontWeight: 600, color: C.white, margin: "0 0 8px 0" }}>
          Vendor Accounts
        </h1>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: 0 }}>
          Create and manage vendor login accounts. Vendors are invited via email with activation links.
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            backgroundColor: messageType === "success" ? `${C.green}15` : `${C.rose}15`,
            border: `1px solid ${messageType === "success" ? C.green : C.rose}`,
            borderRadius: "var(--lwd-radius-input)",
            color: messageType === "success" ? C.green : C.rose,
            fontFamily: NU,
            fontSize: 12,
          }}
        >
          {message}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Create Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 16px",
            background: C.gold,
            border: "none",
            borderRadius: "var(--lwd-radius-input)",
            fontFamily: FB || NU,
            fontSize: 13,
            fontWeight: 700,
            color: "#ffffff",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          + Create Vendor Account
        </button>

        {/* Status Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "pending-approval", label: "Pending Approval" },
            { key: "approved", label: "Approved" },
            { key: "invited", label: "Invited" },
            { key: "activated", label: "Activated" },
            { key: "suspended", label: "Suspended" },
            { key: "rejected", label: "Rejected" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                setStatusFilter(filter.key);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                background: statusFilter === filter.key ? `${C.gold}30` : `${C.grey}20`,
                border: `1px solid ${statusFilter === filter.key ? `${C.gold}50` : `${C.grey}30`}`,
                borderRadius: 4,
                fontFamily: NU,
                fontSize: 11,
                fontWeight: 600,
                color: statusFilter === filter.key ? C.gold : C.grey,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: "var(--lwd-radius-input)",
            fontFamily: NU,
            fontSize: 12,
            color: C.white,
            background: C.card,
            flex: "0 1 250px",
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: "var(--lwd-radius-container)",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <VendorAccountsTable
          vendors={vendors}
          C={C}
          loading={loading}
          onAction={handleTableAction}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Create Account Form Modal */}
      {showCreateForm && (
        <CreateVendorAccountForm
          C={C}
          onSubmit={handleCreateAccount}
          onCancel={() => setShowCreateForm(false)}
          loading={formLoading}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVendor && (
        <VendorDetailsModal
          vendor={selectedVendor}
          C={C}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
}

function VendorDetailsModal({ vendor, C, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: "var(--lwd-radius-container)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-heading-primary)", fontSize: 18, color: C.white, margin: 0 }}>
            Vendor Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: C.grey,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
              Vendor Name
            </p>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>{vendor.name || "N/A"}</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
              Email
            </p>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>{vendor.email}</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
              Status
            </p>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>{vendor.status || "N/A"}</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
              Created
            </p>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>
              {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
              Last Updated
            </p>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>
              {vendor.updated_at ? new Date(vendor.updated_at).toLocaleDateString() : "N/A"}
            </p>
          </div>

          {vendor.contact_name && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, margin: "0 0 4px 0", textTransform: "uppercase" }}>
                Contact Name
              </p>
              <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>{vendor.contact_name}</p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: C.gold,
              border: "none",
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: "var(--font-button)" || NU,
              fontSize: 13,
              fontWeight: 700,
              color: C.white,
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
