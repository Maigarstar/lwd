/**
 * Reusable Blocks module - Browse and manage reusable content blocks
 */

import { useState, useEffect } from "react";
import { MOCK_BLOCKS } from "./data/mockBlocks";
import { saveBlocks, loadBlocks, deleteBlock, addBlock } from "./utils/pageStorage";

const ReusableBlocksModule = ({ C, NU, GD }) => {
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    blockType: "cta_band",
    description: ""
  });

  useEffect(() => {
    const loaded = loadBlocks(MOCK_BLOCKS);
    setBlocks(loaded);
  }, []);

  // Filter blocks
  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch =
      !searchTerm ||
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || block.blockType === filterType;

    return matchesSearch && matchesType;
  });

  // Get unique block types
  const blockTypes = ["all", ...new Set(blocks.map((b) => b.blockType))];

  const handleDeleteBlock = (blockId) => {
    if (confirm("Delete this block?")) {
      const updated = deleteBlock(blocks, blockId);
      setBlocks(updated);
    }
  };

  const handleDuplicateBlock = (block) => {
    const newBlock = {
      ...block,
      id: `block_${Date.now()}`,
      name: `${block.name} (Copy)`
    };
    const updated = addBlock(blocks, newBlock);
    setBlocks(updated);
  };

  const handleCreateBlock = () => {
    if (!formData.name.trim()) {
      alert("Please enter a block name");
      return;
    }

    const newBlock = {
      id: `block_${Date.now()}`,
      name: formData.name,
      blockType: formData.blockType,
      description: formData.description,
      usageCount: 0,
      content: {},
      settings: {
        paddingTop: 40,
        paddingBottom: 40,
        backgroundColor: "",
        mobileVisible: true,
        desktopVisible: true
      },
      createdAt: new Date().toISOString()
    };

    const updated = addBlock(blocks, newBlock);
    setBlocks(updated);
    setFormData({ name: "", blockType: "cta_band", description: "" });
    setShowCreateForm(false);
  };

  const labelStyle = {
    fontFamily: NU,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.grey2,
    fontWeight: 600,
    marginBottom: 8,
    display: "block"
  };

  const inputStyle = {
    fontFamily: NU,
    fontSize: 12,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: GD, fontSize: 28, color: C.white, margin: "0 0 8px 0" }}>
              Reusable Blocks
            </h2>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0 }}>
              Manage reusable content blocks library
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              fontFamily: NU,
              fontSize: 9,
              fontWeight: 700,
              color: "#000",
              background: C.gold,
              border: "none",
              borderRadius: 3,
              padding: "8px 16px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            + Create Block
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
              width: 200
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
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{ padding: "20px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.black }}>
          <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
            Create New Block
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Block Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Newsletter CTA"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Block Type</label>
              <select
                value={formData.blockType}
                onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
                style={inputStyle}
              >
                <option value="cta_band">CTA Band</option>
                <option value="featured_cards">Featured Cards</option>
                <option value="testimonial">Testimonial</option>
                <option value="faq">FAQ</option>
                <option value="rich_text">Rich Text</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this block for?"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleCreateBlock}
              style={{
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 700,
                color: "#000",
                background: C.gold,
                border: "none",
                borderRadius: 3,
                padding: "6px 14px",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 700,
                color: C.gold,
                background: "transparent",
                border: `1px solid ${C.gold}`,
                borderRadius: 3,
                padding: "6px 14px",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blocks Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                style={{
                  padding: "16px",
                  backgroundColor: C.dark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
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
                <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: "0 0 8px 0", minHeight: 20 }}>
                  {block.description || "No description"}
                </p>

                {/* Usage Count */}
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 12px 0" }}>
                  Used on <strong>{block.usageCount}</strong> page{block.usageCount !== 1 ? "s" : ""}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleDuplicateBlock(block)}
                    style={{
                      flex: 1,
                      fontFamily: NU,
                      fontSize: 8,
                      padding: "4px 8px",
                      backgroundColor: "transparent",
                      color: C.gold,
                      border: `1px solid ${C.gold}`,
                      borderRadius: 2,
                      cursor: "pointer",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    Dup
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    style={{
                      flex: 1,
                      fontFamily: NU,
                      fontSize: 8,
                      padding: "4px 8px",
                      backgroundColor: C.rose,
                      color: "#fff",
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: `1px solid ${C.border}`,
          fontFamily: NU,
          fontSize: 10,
          color: C.grey2,
          backgroundColor: C.dark
        }}
      >
        Showing {filteredBlocks.length} of {blocks.length} blocks
      </div>
    </div>
  );
};

export default ReusableBlocksModule;
