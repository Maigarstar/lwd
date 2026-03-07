/**
 * Section library sidebar for adding sections to pages
 */

import { SECTION_TYPES } from "../data/pageTypes";

const SectionLibrary = ({ onAddSection, onBrowseBlocks, C, NU, GD }) => {
  const handleAddSection = (sectionType) => {
    onAddSection(sectionType);
  };

  // Group sections by category
  const groupedSections = {};
  Object.values(SECTION_TYPES).forEach((section) => {
    const category = section.category || "other";
    if (!groupedSections[category]) groupedSections[category] = [];
    groupedSections[category].push(section);
  });

  const categoryOrder = ["hero", "content", "features", "social", "tools"];

  return (
    <div
      style={{
        width: 300,
        backgroundColor: C.dark,
        borderRight: `1px solid ${C.border}`,
        padding: "16px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
    >
      <h3 style={{ fontFamily: GD, fontSize: 12, color: C.white, margin: "0 0 16px 0", textTransform: "uppercase" }}>
        Add Section
      </h3>

      <div style={{ flex: 1 }}>
        {categoryOrder.map((category) => {
          const sections = groupedSections[category] || [];
          if (sections.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  color: C.grey2,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontWeight: 600
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>

              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleAddSection(section.id)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: 6,
                    backgroundColor: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontFamily: NU,
                    fontSize: 11,
                    color: C.white,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    ":hover": {
                      backgroundColor: C.gold,
                      color: "#000"
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.gold;
                    e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = C.card;
                    e.currentTarget.style.color = C.white;
                  }}
                >
                  + {section.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div
        style={{
          paddingTop: 16,
          borderTop: `1px solid ${C.border}`,
          marginTop: "auto"
        }}
      >
        <button
          onClick={onBrowseBlocks}
          style={{
            width: "100%",
            padding: "8px 12px",
            backgroundColor: "transparent",
            border: `1px solid ${C.gold}`,
            borderRadius: 3,
            fontFamily: NU,
            fontSize: 10,
            color: C.gold,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600
          }}
        >
          Browse Blocks
        </button>
      </div>
    </div>
  );
};

export default SectionLibrary;
