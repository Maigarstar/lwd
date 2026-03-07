/**
 * Inquiry Form Component
 * Couples use this to send inquiries to vendors
 * Phase 1: localStorage persistence; Phase 2: Supabase integration
 */

import { useState } from "react";

const InquiryForm = ({ vendorName, vendorId, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    coupleName: "",
    coupleEmail: "",
    couplePhone: "",
    weddingDate: "",
    guestCount: "",
    budget: "",
    message: "",
  });

  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    // Validation
    if (
      !formData.coupleName ||
      !formData.coupleEmail ||
      !formData.weddingDate
    ) {
      setErrorMsg("Please fill in all required fields");
      setStatus("idle");
      return;
    }

    try {
      // Phase 1: Save to localStorage
      const inquiries = JSON.parse(
        localStorage.getItem("vendor_inquiries") || "[]"
      );

      const newInquiry = {
        id: `inquiry_${Date.now()}`,
        vendorId,
        vendorName,
        coupleName: formData.coupleName,
        coupleEmail: formData.coupleEmail,
        couplePhone: formData.couplePhone || "",
        weddingDate: formData.weddingDate,
        guestCount: formData.guestCount || "",
        budget: formData.budget || "",
        message: formData.message || "",
        status: "new",
        createdAt: new Date().toISOString(),
      };

      inquiries.push(newInquiry);
      localStorage.setItem("vendor_inquiries", JSON.stringify(inquiries));

      setStatus("success");
      if (onSuccess) onSuccess(newInquiry);

      // Reset form
      setFormData({
        coupleName: "",
        coupleEmail: "",
        couplePhone: "",
        weddingDate: "",
        guestCount: "",
        budget: "",
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorMsg("Failed to send inquiry. Please try again.");
      console.error("Inquiry submission error:", error);
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
    rose: "#be123c",
  };

  const fonts = {
    body: "var(--font-body, 'Nunito', sans-serif)",
    heading: "var(--font-heading, 'Gilda Display', serif)",
  };

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: "4px",
        padding: "32px",
        maxWidth: "600px",
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "28px",
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: "20px",
        }}
      >
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: 28,
            fontWeight: 400,
            color: colors.white,
            margin: "0 0 8px 0",
          }}
        >
          Send Inquiry to {vendorName}
        </h2>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.grey,
            margin: 0,
          }}
        >
          Tell {vendorName} about your special day
        </p>
      </div>

      {/* Success Message */}
      {status === "success" && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: `1px solid ${colors.green}`,
            borderRadius: "4px",
            padding: "16px",
            marginBottom: "24px",
            color: colors.green,
            fontFamily: fonts.body,
            fontSize: 14,
          }}
        >
          ✓ Inquiry sent successfully! {vendorName} will be in touch soon.
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: `1px solid ${colors.rose}`,
            borderRadius: "4px",
            padding: "16px",
            marginBottom: "24px",
            color: colors.rose,
            fontFamily: fonts.body,
            fontSize: 14,
          }}
        >
          ✗ {errorMsg}
        </div>
      )}

      {/* Form */}
      {status !== "success" ? (
        <form onSubmit={handleSubmit}>
          {/* Couple Name */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Your Name <span style={{ color: colors.rose }}>*</span>
            </label>
            <input
              type="text"
              name="coupleName"
              value={formData.coupleName}
              onChange={handleChange}
              placeholder="Full name"
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
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Email Address <span style={{ color: colors.rose }}>*</span>
            </label>
            <input
              type="email"
              name="coupleEmail"
              value={formData.coupleEmail}
              onChange={handleChange}
              placeholder="your@email.com"
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
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Phone Number (optional)
            </label>
            <input
              type="tel"
              name="couplePhone"
              value={formData.couplePhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
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
              }}
            />
          </div>

          {/* Wedding Date */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Wedding Date <span style={{ color: colors.rose }}>*</span>
            </label>
            <input
              type="date"
              name="weddingDate"
              value={formData.weddingDate}
              onChange={handleChange}
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
              }}
            />
          </div>

          {/* Guest Count */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Estimated Guest Count (optional)
            </label>
            <input
              type="number"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleChange}
              placeholder="e.g., 100"
              min="1"
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
              }}
            />
          </div>

          {/* Budget */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Budget Range (optional)
            </label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
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
              }}
            >
              <option value="">Select a budget range</option>
              <option value="under-5k">Under £5,000</option>
              <option value="5k-10k">£5,000 - £10,000</option>
              <option value="10k-25k">£10,000 - £25,000</option>
              <option value="25k-50k">£25,000 - £50,000</option>
              <option value="50k-100k">£50,000 - £100,000</option>
              <option value="100k+">£100,000+</option>
            </select>
          </div>

          {/* Message */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.white,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Message (optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell them about your vision, special requests, or any questions..."
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
                resize: "vertical",
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "12px 24px",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: colors.dark,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "3px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                padding: "12px 28px",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: colors.gold,
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: status === "submitting" ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                opacity: status === "submitting" ? 0.7 : 1,
              }}
            >
              {status === "submitting" ? "Sending..." : "Send Inquiry"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.grey,
              marginBottom: "20px",
            }}
          >
            We've sent your inquiry to {vendorName}. You should expect to hear
            from them within 24-48 hours.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "12px 24px",
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: colors.gold,
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InquiryForm;
