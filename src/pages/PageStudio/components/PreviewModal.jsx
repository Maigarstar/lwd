/**
 * Preview modal for pages
 */

const PreviewModal = ({ page, onClose, C, NU, GD }) => {
  if (!page) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: 6,
          width: "90%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <h2 style={{ fontFamily: GD, fontSize: 18, color: C.white, margin: 0 }}>
            Page Preview
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: C.grey2,
              cursor: "pointer",
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1, overflow: "auto" }}>
          {/* Page Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: GD, fontSize: 32, color: C.white, margin: "0 0 8px 0" }}>
              {page.title}
            </h1>
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey2, margin: 0 }}>
              Type: <strong>{page.pageType}</strong> • Status: <strong>{page.status}</strong>
            </p>
          </div>

          {/* Sections Preview */}
          {page.sections && page.sections.length > 0 ? (
            <div>
              <h3 style={{ fontFamily: NU, fontSize: 12, color: C.grey2, textTransform: "uppercase", marginBottom: 16 }}>
                Page Sections ({page.sections.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {page.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    style={{
                      padding: "12px 16px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      backgroundColor: C.black
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "flex",
                          width: 24,
                          height: 24,
                          backgroundColor: C.gold,
                          borderRadius: 3,
                          color: C.white,
                          fontSize: 12,
                          fontWeight: 600,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0, fontWeight: 600 }}>
                          {section.sectionName || section.sectionType}
                        </p>
                        <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: "4px 0 0 0" }}>
                          {section.sectionType}
                          {!section.isVisible && " • Hidden"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 24,
                backgroundColor: C.black,
                borderRadius: 4,
                textAlign: "center",
                color: C.grey2,
                fontFamily: NU,
                fontSize: 12
              }}
            >
              No sections added yet
            </div>
          )}

          {/* SEO Summary */}
          {page.seo && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: NU, fontSize: 12, color: C.grey2, textTransform: "uppercase", marginBottom: 12 }}>
                SEO
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {page.seo.title && (
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>Title</p>
                    <p style={{ fontFamily: NU, fontSize: 11, color: C.white, margin: 0 }}>{page.seo.title}</p>
                  </div>
                )}
                {page.seo.metaDescription && (
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>Description</p>
                    <p style={{ fontFamily: NU, fontSize: 11, color: C.white, margin: 0 }}>{page.seo.metaDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button
            onClick={onClose}
            style={{
              fontFamily: NU,
              fontSize: 9,
              fontWeight: 700,
              color: C.white,
              background: C.gold,
              border: "none",
              borderRadius: 3,
              padding: "6px 14px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
