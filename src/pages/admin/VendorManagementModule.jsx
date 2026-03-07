/**
 * Vendor Management Module
 * Admin tool to manage vendor profiles and send login credentials
 */

import { useState } from "react";

const VendorManagementModule = ({ C, fonts }) => {
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Mock vendor data - in production, this would come from database
  const vendors = [
    { id: 1, name: "Villa Balbiano", location: "Lake Como, Italy", status: "profile-pending", email: "info@villabalbiano.com" },
    { id: 2, name: "Serena Ferrara Weddings", location: "Tuscany, Italy", status: "profile-complete", email: "contact@serenaferrara.com" },
    { id: 3, name: "Cielo & Co.", location: "Lake Como, Italy", status: "pending-email", email: "hello@cieloco.com" },
    { id: 4, name: "Rosa Selvatica", location: "Montepulciano, Italy", status: "profile-pending", email: "info@rosaselvatica.com" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "profile-complete":
        return C.green;
      case "profile-pending":
        return "#f97316"; // orange
      case "pending-email":
        return C.blue;
      default:
        return C.grey;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "profile-complete":
        return "Profile Complete ✓";
      case "profile-pending":
        return "Profile Pending";
      case "pending-email":
        return "Email Pending";
      default:
        return "Unknown";
    }
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 32, color: C.white, margin: 0, marginBottom: 8 }}>
          Vendor Management
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.grey, margin: 0 }}>
          Set up vendor profiles, configure their pages, and send login credentials
        </p>
      </div>

      {/* Vendors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => setSelectedVendor(vendor)}
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.2s",
              borderLeft: `4px solid ${getStatusColor(vendor.status)}`,
            }}
          >
            <h3 style={{ fontFamily: fonts.heading, fontSize: 18, color: C.white, margin: "0 0 8px 0" }}>
              {vendor.name}
            </h3>
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.grey, margin: "0 0 12px 0" }}>
              {vendor.location}
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.grey, margin: "0 0 16px 0" }}>
              {vendor.email}
            </p>
            <div
              style={{
                display: "inline-block",
                backgroundColor: getStatusColor(vendor.status),
                color: "white",
                padding: "6px 12px",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: fonts.body,
              }}
            >
              {getStatusLabel(vendor.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedVendor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 400,
            height: "100vh",
            backgroundColor: C.dark,
            borderLeft: `1px solid ${C.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <div style={{ padding: 24 }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedVendor(null)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "none",
                border: "none",
                fontSize: 24,
                color: C.gold,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Vendor Details */}
            <h3 style={{ fontFamily: fonts.heading, fontSize: 24, color: C.white, margin: "0 0 24px 0" }}>
              {selectedVendor.name}
            </h3>

            {/* Setup Steps */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontFamily: fonts.body, fontSize: 12, color: C.gold, textTransform: "uppercase", fontWeight: 600, margin: "0 0 16px 0" }}>
                Setup Steps
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ color: C.green, fontWeight: 700 }}>✓</div>
                  <div>
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.white, margin: 0, marginBottom: 4 }}>
                      Create Page Studio Profile
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.grey, margin: 0 }}>
                      Set up their profile page with sections, images, and content
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ color: selectedVendor.status !== "profile-complete" ? C.grey : C.green, fontWeight: 700 }}>
                    {selectedVendor.status === "profile-complete" ? "✓" : "○"}
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.white, margin: 0, marginBottom: 4 }}>
                      Send Login Credentials
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.grey, margin: 0 }}>
                      Email them their vendor dashboard login details
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ color: selectedVendor.status === "profile-complete" ? C.green : C.grey, fontWeight: 700 }}>
                    {selectedVendor.status === "profile-complete" ? "✓" : "○"}
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.white, margin: 0, marginBottom: 4 }}>
                      Launch to Directory
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.grey, margin: 0 }}>
                      Vendor appears on public directory and can receive inquiries
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: C.gold,
                  color: "white",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Edit Page Studio Profile
              </button>
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: C.dark,
                  color: C.gold,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Send Login Email
              </button>
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: C.dark,
                  color: C.gold,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                View Public Profile
              </button>
            </div>

            {/* Vendor Info */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <h5 style={{ fontFamily: fonts.body, fontSize: 11, color: C.gold, textTransform: "uppercase", fontWeight: 600, margin: "0 0 12px 0" }}>
                Contact Email
              </h5>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.white, margin: 0 }}>
                {selectedVendor.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagementModule;
