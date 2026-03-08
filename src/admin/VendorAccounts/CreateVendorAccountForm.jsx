// ─── src/admin/VendorAccounts/CreateVendorAccountForm.jsx ──────────────────
// Create Vendor Account Form Modal
// Fields: Name, Email, Listing Link, Category, Contact Name
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { getListingsForDropdown } from "./vendorAccountsService";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

export default function CreateVendorAccountForm({ C, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    vendorName: "",
    email: "",
    linkedListingId: "",
    category: "",
    contactName: "",
  });

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setListingsLoading(true);
    const { data } = await getListingsForDropdown();
    setListings(data || []);
    setListingsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleListingChange = (e) => {
    const selectedId = e.target.value;
    const selectedListing = listings.find((l) => String(l.id) === selectedId);
    setFormData((prev) => ({
      ...prev,
      linkedListingId: selectedId,
      category: selectedListing?.category || "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        vendorName: "",
        email: "",
        linkedListingId: "",
        category: "",
        contactName: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: "var(--lwd-radius-container)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
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
          <h2 style={{ fontFamily: GD, fontSize: 18, color: C.white, margin: 0 }}>Create Vendor Account</h2>
          <button
            onClick={onCancel}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {/* Vendor Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: NU, fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.white }}>
              Vendor Name *
            </label>
            <input
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              placeholder="e.g., The Grand Pavilion"
              style={inputStyle(C, errors.vendorName)}
            />
            {errors.vendorName && <div style={errorStyle(C)}>{errors.vendorName}</div>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: NU, fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.white }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="vendor@email.com"
              style={inputStyle(C, errors.email)}
            />
            {errors.email && <div style={errorStyle(C)}>{errors.email}</div>}
          </div>

          {/* Listing Link */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: NU, fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.white }}>
              Link to Listing
            </label>
            <select
              name="linkedListingId"
              value={formData.linkedListingId}
              onChange={handleListingChange}
              disabled={listingsLoading}
              style={inputStyle(C)}
            >
              <option value="">Select a listing (optional)</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.name} ({listing.category})
                </option>
              ))}
            </select>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>Admin can link vendor to an existing listing</p>
          </div>

          {/* Category (Auto-filled from Listing) */}
          {formData.category && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontFamily: NU, fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.white }}>
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                disabled
                style={inputStyle(C, false, true)}
              />
              <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>Auto-filled from listing selection</p>
            </div>
          )}

          {/* Contact Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: NU, fontSize: 12, fontWeight: 600, marginBottom: 6, color: C.white }}>
              Contact Name (Optional)
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="e.g., John Smith"
              style={inputStyle(C)}
            />
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>Primary contact person for this vendor</p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: `${C.grey}15`,
                border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)",
                fontFamily: NU,
                fontSize: 13,
                fontWeight: 600,
                color: C.white,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = `${C.grey}25`)}
              onMouseLeave={(e) => !submitting && (e.currentTarget.style.background = `${C.grey}15`)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: C.gold,
                border: "none",
                borderRadius: "var(--lwd-radius-input)",
                fontFamily: NU,
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                cursor: submitting || loading ? "not-allowed" : "pointer",
                opacity: submitting || loading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => !submitting && !loading && (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => !submitting && !loading && (e.currentTarget.style.opacity = "1")}
            >
              {submitting || loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputStyle(C, hasError = false, disabled = false) {
  return {
    width: "100%",
    padding: "10px 12px",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    border: `1px solid ${hasError ? C.rose : C.border}`,
    borderRadius: "var(--lwd-radius-input)",
    backgroundColor: disabled ? `${C.grey}10` : C.card,
    color: C.white,
    boxSizing: "border-box",
    transition: "all 0.15s",
  };
}

function errorStyle(C) {
  return {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    color: C.rose,
    marginTop: 4,
  };
}
