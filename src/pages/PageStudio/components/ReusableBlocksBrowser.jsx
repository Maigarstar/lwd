/**
 * Reusable blocks browser modal for inserting blocks into pages
 */

import { useState } from "react";
import { MOCK_BLOCKS } from "../data/mockBlocks";

const ReusableBlocksBrowser = ({ onInsertBlock, onClose, C, NU, GD }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const blocks = MOCK_BLOCKS || [];

  // Filter blocks
  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch =
      !searchTerm ||
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (block.description && block.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === "all" || block.blockType === filterType;

    return matchesSearch && matchesType;
  });

  // Get unique block types
  const blockTypes = ["all", ...new Set(blocks.map((b) => b.blockType))];

  const handleInsertBlock = (block) => {
    onInsertBlock({
      ...block,
      id: `section_${Date.now()}`,
      sectionType: block.blockType,
      sectionName: block.name,
      position: 0
    });
    onClose();
  };

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
        zIndex: 1001
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: 6,
          width: "90%",
          maxWidth: 800,
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
            Browse Reusable Blocks
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

        {/* Filters */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.dark,
            display: "flex",
            gap: 12,
            alignItems: "center"
          }}
        >
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              fontFamily: NU,
              fontSize: 11,
              color: C.white,
              background: C.black,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "6px 12px",
              outline: "none",
              flex: 1
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              fontFamily: NU,
              fontSize: 11,
              color: C.white,
              background: C.black,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "6px 12px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {blockTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All Types" : type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Blocks Grid */}
        <div style={{ padding: "24px", flex: 1, overflow: "auto" }}>
          {filteredBlocks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.grey2,
                fontFamily: NU,
                fontSize: 12
              }}
            >
              No blocks found
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 16
              }}
            >
              {filteredBlocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    padding: "16px",
                    backgroundColor: C.dark,
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.gold;
                    e.currentTarget.style.backgroundColor = C.card;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.backgroundColor = C.dark;
                  }}
                >
                  {/* Block Name */}
                  <h4 style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: "0 0 4px 0", fontWeight: 600 }}>
                    {block.name}
                  </h4>

                  {/* Block Type Badge */}
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        backgroundColor: C.gold,
                        color: "#000",
                        fontSize: 8,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: "uppercase"
                      }}
                    >
                      {block.blockType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: "0 0 12px 0", minHeight: 20 }}>
                    {block.description || "No description"}
                  </p>

                  {/* Usage Count */}
                  <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 12px 0" }}>
                    Used on <strong>{block.usageCount || 0}</strong> page{(block.usageCount || 0) !== 1 ? "s" : ""}
                  </p>

                  {/* Insert Button */}
                  <button
                    onClick={() => handleInsertBlock(block)}
                    style={{
                      width: "100%",
                      fontFamily: NU,
                      fontSize: 9,
                      padding: "6px 12px",
                      backgroundColor: C.gold,
                      color: "#000",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    Insert
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReusableBlocksBrowser;
