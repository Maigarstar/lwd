/**
 * Homepage Manager module - Control homepage sections with reordering & scheduling
 */

import { useState, useEffect } from "react";
import { saveHomepageConfig, loadHomepageConfig } from "./utils/pageStorage";

const HOMEPAGE_SECTIONS = [
  {
    id: "hero_reel",
    name: "Hero Reel",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 0
  },
  {
    id: "search_bar",
    name: "Search/Discovery Bar",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 1
  },
  {
    id: "featured_collections",
    name: "Featured Collections",
    enabled: true,
    mode: "dynamic",
    visibleFrom: null,
    visibleUntil: null,
    position: 2
  },
  {
    id: "venue_spotlight",
    name: "Venue Spotlight Row",
    enabled: true,
    mode: "dynamic",
    visibleFrom: null,
    visibleUntil: null,
    position: 3
  },
  {
    id: "planner_spotlight",
    name: "Planner Spotlight Row",
    enabled: true,
    mode: "dynamic",
    visibleFrom: null,
    visibleUntil: null,
    position: 4
  },
  {
    id: "editorial_banner",
    name: "Editorial Banner",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 5
  },
  {
    id: "real_weddings",
    name: "Real Weddings Section",
    enabled: true,
    mode: "dynamic",
    visibleFrom: null,
    visibleUntil: null,
    position: 6
  },
  {
    id: "ai_concierge",
    name: "AI Concierge Entry",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 7
  },
  {
    id: "testimonials",
    name: "Testimonials/Trust Strip",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 8
  },
  {
    id: "blog_highlights",
    name: "Blog Highlights",
    enabled: true,
    mode: "dynamic",
    visibleFrom: null,
    visibleUntil: null,
    position: 9
  },
  {
    id: "footer_cta",
    name: "Footer CTA",
    enabled: true,
    mode: "manual",
    visibleFrom: null,
    visibleUntil: null,
    position: 10
  }
];

const HomepageManagerModule = ({ C, NU, GD }) => {
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => {
    const loaded = loadHomepageConfig(HOMEPAGE_SECTIONS);
    // Sort by position
    const sorted = [...loaded].sort((a, b) => (a.position || 0) - (b.position || 0));
    setSections(sorted);
  }, []);

  const handleSave = (updatedSections = sections) => {
    saveHomepageConfig(updatedSections);
  };

  const handleToggleSection = (sectionId) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updated);
    handleSave(updated);
  };

  const handleToggleMode = (sectionId) => {
    const updated = sections.map((s) =>
      s.id === sectionId
        ? { ...s, mode: s.mode === "dynamic" ? "manual" : "dynamic" }
        : s
    );
    setSections(updated);
    handleSave(updated);
  };

  const handleMoveUp = (sectionId) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx <= 0) return;

    const updated = [...sections];
    [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
    // Update positions
    updated.forEach((s, i) => {
      s.position = i;
    });
    setSections(updated);
    handleSave(updated);
  };

  const handleMoveDown = (sectionId) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx >= sections.length - 1) return;

    const updated = [...sections];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    // Update positions
    updated.forEach((s, i) => {
      s.position = i;
    });
    setSections(updated);
    handleSave(updated);
  };

  const handleScheduleChange = (sectionId, field, value) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, [field]: value || null } : s
    );
    setSections(updated);
    handleSave(updated);
  };

  const editingInfo = sections.find((s) => s.id === editingSection);

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: GD, fontSize: 28, color: C.white, margin: "0 0 8px 0" }}>
          Homepage Manager
        </h2>
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0 }}>
          Manage sections, reorder, toggle visibility, and schedule visibility windows
        </p>
      </div>

      {/* Main Layout: Sections List + Edit Panel */}
      <div style={{ display: "flex", gap: 20, flex: 1, overflow: "hidden" }}>
        {/* Left: Sections List */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sections Table */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              borderTop: `1px solid ${C.border}`,
              paddingTop: 12,
              marginBottom: 16
            }}
          >
            {sections.map((section, idx) => (
              <div
                key={section.id}
                onClick={() => setEditingSection(section.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.4fr 1.5fr 0.8fr 0.8fr 1.2fr",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: `1px solid ${C.border}`,
                  alignItems: "center",
                  backgroundColor: editingSection === section.id ? C.card : C.dark,
                  marginBottom: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (editingSection !== section.id) {
                    e.currentTarget.style.backgroundColor = C.card;
                  }
                }}
                onMouseLeave={(e) => {
                  if (editingSection !== section.id) {
                    e.currentTarget.style.backgroundColor = C.dark;
                  }
                }}
              >
                {/* Position Drag Handles */}
                <div style={{ display: "flex", gap: 2 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(section.id);
                    }}
                    disabled={idx === 0}
                    style={{
                      fontFamily: NU,
                      fontSize: 10,
                      padding: "3px 4px",
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
                      handleMoveDown(section.id);
                    }}
                    disabled={idx === sections.length - 1}
                    style={{
                      fontFamily: NU,
                      fontSize: 10,
                      padding: "3px 4px",
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
                </div>

                {/* Name */}
                <div style={{ fontFamily: NU, fontSize: 12, color: C.white, fontWeight: 500 }}>
                  {section.name}
                </div>

                {/* Status Toggle */}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSection(section.id);
                    }}
                    style={{
                      fontFamily: NU,
                      fontSize: 8,
                      padding: "3px 6px",
                      backgroundColor: section.enabled ? C.green : C.grey2,
                      color: "#fff",
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      fontWeight: 600
                    }}
                  >
                    {section.enabled ? "On" : "Off"}
                  </button>
                </div>

                {/* Mode Toggle */}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMode(section.id);
                    }}
                    style={{
                      fontFamily: NU,
                      fontSize: 8,
                      padding: "3px 6px",
                      backgroundColor: C.dark,
                      border: `1px solid ${C.gold}`,
                      color: C.gold,
                      borderRadius: 2,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      fontWeight: 600
                    }}
                  >
                    {section.mode === "dynamic" ? "Dynamic" : "Manual"}
                  </button>
                </div>

                {/* Visibility Status */}
                <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2 }}>
                  {section.visibleFrom || section.visibleUntil ? (
                    <span>
                      📅{" "}
                      {section.visibleFrom && new Date(section.visibleFrom).toLocaleDateString()}
                      {section.visibleFrom && section.visibleUntil && " → "}
                      {section.visibleUntil && new Date(section.visibleUntil).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: C.grey2 }}>No schedule</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: 12,
              borderTop: `1px solid ${C.border}`,
              fontFamily: NU,
              fontSize: 10,
              color: C.grey2
            }}
          >
            <span style={{ fontWeight: 600 }}>{sections.filter((s) => s.enabled).length}</span>
            {" "}of {sections.length} sections enabled
          </div>
        </div>

        {/* Right: Edit Panel */}
        {editingInfo && (
          <div
            style={{
              width: 320,
              backgroundColor: C.dark,
              borderLeft: `1px solid ${C.border}`,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              overflow: "hidden"
            }}
          >
            <h3 style={{ fontFamily: GD, fontSize: 14, color: C.white, margin: "0 0 16px 0" }}>
              {editingInfo.name}
            </h3>

            {/* Scheduling Section */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Visibility Window</label>

              <div style={{ marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Visible From</label>
                <input
                  type="datetime-local"
                  value={editingInfo.visibleFrom ? editingInfo.visibleFrom.slice(0, 16) : ""}
                  onChange={(e) => handleScheduleChange(editingSection, "visibleFrom", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Visible Until</label>
                <input
                  type="datetime-local"
                  value={editingInfo.visibleUntil ? editingInfo.visibleUntil.slice(0, 16) : ""}
                  onChange={(e) => handleScheduleChange(editingSection, "visibleUntil", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setEditingSection(null)}
              style={{
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 700,
                color: C.white,
                background: C.gold,
                border: "none",
                borderRadius: 3,
                padding: "8px 12px",
                cursor: "pointer",
                textTransform: "uppercase",
                marginTop: "auto"
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomepageManagerModule;
