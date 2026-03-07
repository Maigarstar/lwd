/**
 * Main canvas for displaying and managing page sections
 */

const SectionCanvas = ({
  sections,
  onSelectSection,
  onDeleteSection,
  onDuplicateSection,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  selectedSectionId,
  C,
  NU,
  GD
}) => {
  if (!sections || sections.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.grey2,
          fontFamily: NU,
          fontSize: 14,
          textAlign: "center",
          padding: 40
        }}
      >
        <div>
          <p style={{ margin: "0 0 8px 0" }}>No sections added yet</p>
          <p style={{ margin: 0, fontSize: 12, color: C.grey2 }}>
            Add your first section from the left sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: "20px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      {sections.map((section, idx) => {
        const isSelected = section.id === selectedSectionId;
        return (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            style={{
              padding: "12px 16px",
              backgroundColor: isSelected ? C.card : C.dark,
              border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = C.gold;
                e.currentTarget.style.backgroundColor = C.card;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.backgroundColor = C.dark;
              }
            }}
          >
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  display: "flex",
                  width: 24,
                  height: 24,
                  backgroundColor: isSelected ? C.gold : C.border,
                  borderRadius: 3,
                  color: isSelected ? "#000" : C.white,
                  fontSize: 11,
                  fontWeight: 600,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0, fontWeight: 600 }}>
                  {section.sectionName || section.sectionType}
                </p>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "2px 0 0 0" }}>
                  {section.sectionType}
                </p>
              </div>

              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(section.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: section.isVisible ? C.gold : C.grey2,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={section.isVisible ? "Hide section" : "Show section"}
              >
                {section.isVisible ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(section.id);
                }}
                disabled={idx === 0}
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  padding: "4px 8px",
                  backgroundColor: C.dark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 2,
                  color: idx === 0 ? C.grey2 : C.white,
                  cursor: idx === 0 ? "not-allowed" : "pointer",
                  opacity: idx === 0 ? 0.5 : 1
                }}
                title="Move up"
              >
                ↑
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(section.id);
                }}
                disabled={idx === sections.length - 1}
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  padding: "4px 8px",
                  backgroundColor: C.dark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 2,
                  color: idx === sections.length - 1 ? C.grey2 : C.white,
                  cursor: idx === sections.length - 1 ? "not-allowed" : "pointer",
                  opacity: idx === sections.length - 1 ? 0.5 : 1
                }}
                title="Move down"
              >
                ↓
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSection(section.id);
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  padding: "4px 8px",
                  backgroundColor: C.dark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 2,
                  color: C.white,
                  cursor: "pointer"
                }}
                title="Duplicate"
              >
                ⎇
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection(section.id);
                }}
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  padding: "4px 8px",
                  backgroundColor: C.rose,
                  border: `1px solid ${C.rose}`,
                  borderRadius: 2,
                  color: "#fff",
                  cursor: "pointer"
                }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SectionCanvas;
