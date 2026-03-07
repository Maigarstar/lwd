/**
 * Vendor Inquiry Manager Component
 * Vendors use this to view and manage inquiries they receive
 * Shows in vendor dashboard
 * Phase 2: Supabase integration
 */

import { useState, useEffect } from "react";
import { getVendorInquiries, updateInquiryStatus, addVendorReply } from "../services/inquiryService";
import { sendVendorReplyToCouple } from "../utils/emailService";

const VendorInquiryManager = ({ vendorId }) => {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState("new"); // new, replied, closed, all
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vendorId) {
      // Fallback to localStorage if no vendorId provided
      const saved = JSON.parse(localStorage.getItem("vendor_inquiries") || "[]");
      setInquiries(saved);
      setLoading(false);
      return;
    }

    // Load inquiries from Supabase
    const loadInquiries = async () => {
      try {
        const { data, error: err } = await getVendorInquiries(String(vendorId));
        if (err) throw err;
        setInquiries(data);
      } catch (err) {
        console.error("Error loading inquiries:", err);
        setError("Failed to load inquiries");
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem("vendor_inquiries") || "[]");
        setInquiries(saved);
      } finally {
        setLoading(false);
      }
    };

    loadInquiries();
  }, [vendorId]);

  const filteredInquiries = inquiries.filter((inq) => {
    if (filter === "all") return true;
    return inq.status === filter;
  });

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    try {
      const { data, error: err } = await updateInquiryStatus(inquiryId, newStatus);
      if (err) throw err;

      // Update local state
      const updated = inquiries.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: newStatus } : inq
      );
      setInquiries(updated);
      setSelectedInquiry(updated.find((inq) => inq.id === inquiryId) || null);

      // Fallback to localStorage
      if (!vendorId) {
        localStorage.setItem("vendor_inquiries", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Error updating inquiry status:", err);
      alert("Failed to update inquiry status");
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedInquiry) return;

    try {
      const { data, error: err } = await addVendorReply(
        selectedInquiry.id,
        replyMessage
      );
      if (err) throw err;

      // Update local state
      const updated = inquiries.map((inq) =>
        inq.id === selectedInquiry.id
          ? {
              ...inq,
              status: "replied",
              vendor_reply: replyMessage,
              replied_at: new Date().toISOString(),
            }
          : inq
      );
      setInquiries(updated);
      setReplyMessage("");
      setSelectedInquiry(null);

      // Fallback to localStorage
      if (!vendorId) {
        localStorage.setItem("vendor_inquiries", JSON.stringify(updated));
      }

      // Send email to couple (non-blocking - don't wait for SendGrid response)
      sendVendorReplyToCouple(
        selectedInquiry.couple_email,
        selectedInquiry.couple_name,
        selectedInquiry.vendor_name,
        replyMessage
      ).catch((err) => console.error("Failed to send reply email:", err));
    } catch (err) {
      console.error("Error adding reply:", err);
      alert("Failed to send reply");
    }
  };

  const colors = {
    bg: "#fbf7f4",
    dark: "#ede5db",
    card: "#ffffff",
    border: "#ddd4c8",
    gold: "#8a6d1b",
    white: "#1a1a1a",
    grey: "#5a5147",
    grey2: "#8a8078",
    green: "#15803d",
    blue: "#1d4ed8",
    rose: "#be123c",
  };

  const fonts = {
    body: "var(--font-body, 'Nunito', sans-serif)",
    heading: "var(--font-heading, 'Gilda Display', serif)",
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      new: { bg: colors.blue, label: "New" },
      replied: { bg: colors.green, label: "Replied" },
      closed: { bg: colors.grey2, label: "Closed" },
    };
    return styles[status] || styles.new;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          fontFamily: fonts.heading,
          fontSize: 32,
          color: colors.white,
          margin: "0 0 28px 0",
        }}
      >
        Inquiries ({filteredInquiries.length})
      </h2>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
        {["new", "replied", "closed", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "10px 16px",
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: filter === status ? colors.gold : colors.dark,
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div
          style={{
            backgroundColor: colors.card,
            padding: "40px 20px",
            borderRadius: "4px",
            textAlign: "center",
            color: colors.grey,
            fontFamily: fonts.body,
          }}
        >
          No inquiries found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredInquiries.map((inquiry) => {
            const statusBadge = getStatusBadgeStyle(inquiry.status);
            return (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                style={{
                  backgroundColor:
                    selectedInquiry?.id === inquiry.id ? colors.dark : colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontFamily: fonts.heading,
                        fontSize: 16,
                        fontWeight: 400,
                        color: colors.white,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {inquiry.coupleName}
                    </h4>
                    <p
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        color: colors.grey,
                        margin: 0,
                      }}
                    >
                      Wedding: {new Date(inquiry.weddingDate).toLocaleDateString()}{" "}
                      • {inquiry.guestCount || "??"} guests
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: statusBadge.bg,
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "3px",
                        fontFamily: fonts.body,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                {!selectedInquiry || selectedInquiry.id !== inquiry.id ? (
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: colors.grey,
                      margin: "0 0 12px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {inquiry.message
                      ? inquiry.message.substring(0, 100) + "..."
                      : "No message"}
                  </p>
                ) : null}

                {/* Contact Info */}
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.grey,
                  }}
                >
                  {inquiry.coupleEmail && (
                    <p style={{ margin: "4px 0" }}>Email: {inquiry.coupleEmail}</p>
                  )}
                  {inquiry.couplePhone && (
                    <p style={{ margin: "4px 0" }}>Phone: {inquiry.couplePhone}</p>
                  )}
                </div>

                {/* Received Date */}
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.grey2,
                    margin: "12px 0 0 0",
                  }}
                >
                  Received {new Date(inquiry.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            style={{
              backgroundColor: colors.bg,
              borderRadius: "4px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: colors.dark,
                padding: "20px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 20,
                  color: colors.white,
                  margin: 0,
                }}
              >
                {selectedInquiry.coupleName}
              </h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: colors.gold,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "28px" }}>
              {/* Details Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "28px",
                  paddingBottom: "20px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Wedding Date
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.white,
                      margin: 0,
                    }}
                  >
                    {new Date(selectedInquiry.weddingDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Guest Count
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.white,
                      margin: 0,
                    }}
                  >
                    {selectedInquiry.guestCount || "Not specified"}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Budget Range
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.white,
                      margin: 0,
                    }}
                  >
                    {selectedInquiry.budget || "Not specified"}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {["new", "replied", "closed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedInquiry.id, status)}
                        style={{
                          padding: "6px 12px",
                          fontFamily: fonts.body,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            selectedInquiry.status === status
                              ? getStatusBadgeStyle(status).bg
                              : colors.dark,
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div
                style={{
                  marginBottom: "28px",
                  paddingBottom: "20px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <h4
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.grey2,
                    margin: "0 0 12px 0",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Contact Information
                </h4>
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.white,
                    margin: "0 0 8px 0",
                  }}
                >
                  <strong>Email:</strong> {selectedInquiry.coupleEmail}
                </p>
                {selectedInquiry.couplePhone && (
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.white,
                      margin: 0,
                    }}
                  >
                    <strong>Phone:</strong> {selectedInquiry.couplePhone}
                  </p>
                )}
              </div>

              {/* Message */}
              <div style={{ marginBottom: "28px" }}>
                <h4
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.grey2,
                    margin: "0 0 12px 0",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Message
                </h4>
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.white,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {selectedInquiry.message || "(No message provided)"}
                </p>
              </div>

              {/* Reply Section */}
              {selectedInquiry.status !== "closed" && (
                <div
                  style={{
                    paddingTop: "20px",
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <h4
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 12px 0",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Reply (In Phase 2, this will send an email)
                  </h4>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows="6"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontFamily: fonts.body,
                      fontSize: 14,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "3px",
                      boxSizing: "border-box",
                      color: colors.white,
                      backgroundColor: colors.bg,
                      marginBottom: "12px",
                      resize: "vertical",
                    }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyMessage.trim()}
                    style={{
                      padding: "12px 24px",
                      fontFamily: fonts.body,
                      fontSize: 13,
                      fontWeight: 600,
                      backgroundColor:
                        replyMessage.trim() ? colors.gold : colors.grey2,
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: replyMessage.trim() ? "pointer" : "not-allowed",
                      textTransform: "uppercase",
                    }}
                  >
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInquiryManager;
