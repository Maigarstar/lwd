// ═══════════════════════════════════════════════════════════════════════════════
// HomepageEditor Component
// Admin interface for editing homepage content (high-level admin only)
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useHomepageContent } from "../../hooks/useHomepageContent";
import { DEFAULT_HOMEPAGE_CONTENT } from "../../data/homepageDefaults";
import HeroEditor from "./sections/HeroEditor";
import DestinationStripEditor from "./sections/DestinationStripEditor";
import FeaturedVenuesEditor from "./sections/FeaturedVenuesEditor";
import SignatureEditor from "./sections/SignatureEditor";
import VendorSectionEditor from "./sections/VendorSectionEditor";
import NewsletterEditor from "./sections/NewsletterEditor";

const SECTIONS = [
  { id: "hero", label: "Hero", icon: "🎬" },
  { id: "destinations", label: "Destinations", icon: "🌍" },
  { id: "venues", label: "Featured Venues", icon: "✨" },
  { id: "signature", label: "Signature Collection", icon: "👑" },
  { id: "vendors", label: "Vendors", icon: "💼" },
  { id: "newsletter", label: "Newsletter", icon: "📧" },
];

export default function HomepageEditor({ onClose }) {
  const C = useTheme();
  const {
    content,
    loading,
    error,
    isSaving,
    isPublishing,
    publishedStatus,
    updateField,
    saveDraft,
    publish,
  } = useHomepageContent();

  const [activeSection, setActiveSection] = useState("hero");
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          color: C.textSecondary,
        }}
      >
        Loading editor...
      </div>
    );
  }

  if (!content) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          color: C.textSecondary,
        }}
      >
        Failed to load editor
      </div>
    );
  }

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Publish these changes to the live homepage?")) {
      return;
    }
    try {
      await publish();
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err) {
      console.error("Publish failed:", err);
    }
  };

  const renderSectionEditor = () => {
    const props = { content, updateField };

    switch (activeSection) {
      case "hero":
        return <HeroEditor {...props} />;
      case "destinations":
        return <DestinationStripEditor {...props} />;
      case "venues":
        return <FeaturedVenuesEditor {...props} />;
      case "signature":
        return <SignatureEditor {...props} />;
      case "vendors":
        return <VendorSectionEditor {...props} />;
      case "newsletter":
        return <NewsletterEditor {...props} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.background }}>
      {/* Sidebar Navigation */}
      <div
        style={{
          width: 280,
          borderRight: `1px solid ${C.border}`,
          padding: "24px 0",
          maxHeight: "100vh",
          overflowY: "auto",
          background: C.card,
        }}
      >
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: C.text,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Homepage Editor
          </h2>
          <p
            style={{
              fontSize: 12,
              color: C.textSecondary,
              margin: 0,
            }}
          >
            Edit content sections
          </p>
        </div>

        {/* Status Badge */}
        {publishedStatus && (
          <div style={{ padding: "0 24px", marginBottom: 24 }}>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background:
                  publishedStatus === "published"
                    ? "rgba(76, 175, 125, 0.1)"
                    : "rgba(255, 193, 7, 0.1)",
                border: `1px solid ${
                  publishedStatus === "published"
                    ? "rgba(76, 175, 125, 0.3)"
                    : "rgba(255, 193, 7, 0.3)"
                }`,
                fontSize: 12,
                color:
                  publishedStatus === "published"
                    ? "#4caf7d"
                    : "#ffc107",
                fontWeight: 500,
              }}
            >
              {publishedStatus === "published" ? "✓ Published" : "📝 Draft"}
            </div>
          </div>
        )}

        {/* Section Navigation */}
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              width: "100%",
              padding: "12px 24px",
              background:
                activeSection === section.id ? "rgba(201, 168, 76, 0.1)" : "transparent",
              border: "none",
              borderLeft:
                activeSection === section.id
                  ? `3px solid #C9A84C`
                  : "3px solid transparent",
              color:
                activeSection === section.id ? C.text : C.textSecondary,
              textAlign: "left",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              fontWeight: activeSection === section.id ? 600 : 400,
            }}
          >
            <span style={{ marginRight: 8 }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 32px",
            borderBottom: `1px solid ${C.border}`,
            background: C.card,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: C.text }}>
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                color: C.text,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "rgba(201, 168, 76, 0.05)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              👁 Preview
            </button>

            {/* Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: `1px solid ${C.gold}`,
                borderRadius: 6,
                color: C.gold,
                cursor: isSaving ? "default" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: isSaving ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                !isSaving && (e.target.style.background = "rgba(201, 168, 76, 0.1)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              {isSaving ? "Saving..." : "💾 Save Draft"}
            </button>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                padding: "10px 20px",
                background: C.gold,
                border: "none",
                borderRadius: 6,
                color: "#0a0906",
                cursor: isPublishing ? "default" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                opacity: isPublishing ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                !isPublishing && (e.target.style.background = "#e8c97a")
              }
              onMouseLeave={(e) => (e.target.style.background = C.gold)}
            >
              {isPublishing ? "Publishing..." : "🚀 Publish"}
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: C.text,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Success Messages */}
        {saveSuccess && (
          <div
            style={{
              padding: "12px 32px",
              background: "rgba(76, 175, 125, 0.1)",
              borderBottom: "1px solid rgba(76, 175, 125, 0.3)",
              color: "#4caf7d",
              fontSize: 14,
            }}
          >
            ✓ Draft saved successfully
          </div>
        )}
        {publishSuccess && (
          <div
            style={{
              padding: "12px 32px",
              background: "rgba(76, 175, 125, 0.1)",
              borderBottom: "1px solid rgba(76, 175, 125, 0.3)",
              color: "#4caf7d",
              fontSize: 14,
            }}
          >
            ✓ Homepage published successfully
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px 32px",
              background: "rgba(244, 67, 54, 0.1)",
              borderBottom: "1px solid rgba(244, 67, 54, 0.3)",
              color: "#f44336",
              fontSize: 14,
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* Editor Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          <div style={{ maxWidth: 800 }}>
            {renderSectionEditor()}
          </div>
        </div>
      </div>

      {/* Preview Modal (TODO: implement) */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              padding: 24,
              maxWidth: "80vw",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Preview Coming Soon</h2>
            <p>Preview functionality will be implemented next</p>
            <button onClick={() => setShowPreview(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
