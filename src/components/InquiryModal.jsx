/**
 * Inquiry Modal Component
 * Overlay modal for displaying the inquiry form
 */

import InquiryForm from "./InquiryForm.jsx";

const InquiryModal = ({ isOpen, vendorName, vendorId, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const colors = {
    bg: "#fbf7f4",
    dark: "#ede5db",
    card: "#ffffff",
    border: "#ddd4c8",
    gold: "#8a6d1b",
    white: "#1a1a1a",
    grey: "#5a5147",
    grey2: "#8a8078",
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bg,
          borderRadius: "4px",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "40px",
            height: "40px",
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "20px",
            color: colors.grey,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          ×
        </button>

        {/* Form */}
        <div style={{ padding: "40px 20px" }}>
          <InquiryForm
            vendorName={vendorName}
            vendorId={vendorId}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
