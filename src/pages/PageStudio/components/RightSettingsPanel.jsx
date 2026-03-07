/**
 * Right settings panel for editing selected section properties
 * Now driven by sectionRegistry - dynamically renders fields based on section type
 * Includes AI-assisted content generation and rich text editing
 */

import { useState } from "react";
import {
  getSectionType,
  getSectionFields,
  getFieldGroups,
  FIELD_TYPES_EXPORT
} from "../data/sectionRegistry";
import { generateContent } from "../utils/aiUtils";
import RichTextEditor from "./RichTextEditor";

const RightSettingsPanel = ({
  section,
  onUpdate,
  C,
  NU,
  GD
}) => {
  const [activeTab, setActiveTab] = useState("content");
  const [aiGenerating, setAiGenerating] = useState(null);
  const [aiError, setAiError] = useState(null);

  if (!section) {
    return (
      <div
        style={{
          width: 320,
          backgroundColor: C.dark,
          borderLeft: `1px solid ${C.border}`,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.grey2,
          fontFamily: NU,
          fontSize: 12,
          textAlign: "center"
        }}
      >
        Select a section to edit
      </div>
    );
  }

  const sectionType = getSectionType(section.sectionType);
  if (!sectionType) {
    return (
      <div style={{ width: 320, padding: "16px", color: C.grey2 }}>
        Unknown section type
      </div>
    );
  }

  const fieldGroups = getFieldGroups(section.sectionType);
  const fieldsInTab = getSectionFields(section.sectionType, activeTab);

  const handleFieldChange = (field, value) => {
    const fieldDef = sectionType.fields.find((f) => f.name === field.name);
    if (!fieldDef) return;

    // Determine if field is in content or settings
    const isContentField = section.content.hasOwnProperty(field.name);
    const isSettingsField = section.settings.hasOwnProperty(field.name);

    if (isContentField) {
      onUpdate({
        ...section,
        content: {
          ...section.content,
          [field.name]: value
        }
      });
    } else if (isSettingsField) {
      onUpdate({
        ...section,
        settings: {
          ...section.settings,
          [field.name]: value
        }
      });
    }
  };

  const handleGenerateContent = async (fieldDef) => {
    setAiGenerating(fieldDef.name);
    setAiError(null);

    try {
      const result = await generateContent(fieldDef.name, section.sectionType, section.sectionName);

      if (result.success) {
        handleFieldChange(fieldDef, result.content);
        // Clear after successful generation
        setTimeout(() => setAiGenerating(null), 1000);
      } else {
        setAiError(result.error);
        setAiGenerating(null);
      }
    } catch (error) {
      setAiError(error.message);
      setAiGenerating(null);
    }
  };

  const labelStyle = {
    fontFamily: NU,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.grey2,
    fontWeight: 600,
    marginBottom: 6,
    display: "block"
  };

  const inputStyle = {
    fontFamily: NU,
    fontSize: 12,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "7px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 12
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "8px 12px",
    fontFamily: NU,
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    backgroundColor: isActive ? C.gold : "transparent",
    color: isActive ? "#000" : C.grey2,
    border: "none",
    borderRadius: 3,
    cursor: "pointer"
  });

  const renderField = (fieldDef) => {
    const currentValue = section.content[fieldDef.name] ?? section.settings[fieldDef.name];

    switch (fieldDef.type) {
      case FIELD_TYPES_EXPORT.TEXT:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={labelStyle}>
                {fieldDef.label}
                {fieldDef.characterCount && (
                  <span style={{ fontSize: 9, color: C.grey2, marginLeft: 8 }}>
                    {currentValue?.length || 0}/{fieldDef.maxLength || "—"}
                  </span>
                )}
              </label>
              {fieldDef.aiEnabled && (
                <button
                  onClick={() => handleGenerateContent(fieldDef)}
                  disabled={aiGenerating === fieldDef.name}
                  style={{
                    fontFamily: NU,
                    fontSize: 8,
                    padding: "3px 6px",
                    backgroundColor: aiGenerating === fieldDef.name ? C.grey2 : C.gold,
                    color: aiGenerating === fieldDef.name ? C.grey2 : "#000",
                    border: "none",
                    borderRadius: 2,
                    cursor: aiGenerating === fieldDef.name ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap"
                  }}
                >
                  {aiGenerating === fieldDef.name ? "✨..." : "✨"}
                </button>
              )}
            </div>
            <input
              type="text"
              value={currentValue || ""}
              onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
              placeholder={fieldDef.placeholder}
              maxLength={fieldDef.maxLength}
              style={inputStyle}
              title={fieldDef.tooltip}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.TEXTAREA:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={labelStyle}>{fieldDef.label}</label>
              {fieldDef.aiEnabled && (
                <button
                  onClick={() => handleGenerateContent(fieldDef)}
                  disabled={aiGenerating === fieldDef.name}
                  style={{
                    fontFamily: NU,
                    fontSize: 8,
                    padding: "3px 6px",
                    backgroundColor: aiGenerating === fieldDef.name ? C.grey2 : C.gold,
                    color: aiGenerating === fieldDef.name ? C.grey2 : "#000",
                    border: "none",
                    borderRadius: 2,
                    cursor: aiGenerating === fieldDef.name ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}
                >
                  {aiGenerating === fieldDef.name ? "✨ Generating..." : "✨ Generate"}
                </button>
              )}
            </div>
            <textarea
              value={currentValue || ""}
              onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
              placeholder={fieldDef.placeholder}
              maxLength={fieldDef.maxLength}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              title={fieldDef.tooltip}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.RICHTEXT:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={labelStyle}>{fieldDef.label}</label>
              {fieldDef.aiEnabled && (
                <button
                  onClick={() => handleGenerateContent(fieldDef)}
                  disabled={aiGenerating === fieldDef.name}
                  style={{
                    fontFamily: NU,
                    fontSize: 8,
                    padding: "3px 6px",
                    backgroundColor: aiGenerating === fieldDef.name ? C.grey2 : C.gold,
                    color: aiGenerating === fieldDef.name ? C.grey2 : "#000",
                    border: "none",
                    borderRadius: 2,
                    cursor: aiGenerating === fieldDef.name ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}
                >
                  {aiGenerating === fieldDef.name ? "✨ Generating..." : "✨ Generate"}
                </button>
              )}
            </div>
            <RichTextEditor
              value={currentValue || ""}
              onChange={(value) => handleFieldChange(fieldDef, value)}
              placeholder={fieldDef.placeholder}
              C={C}
              NU={NU}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.NUMBER:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{fieldDef.label}</label>
            <input
              type="number"
              value={currentValue ?? ""}
              onChange={(e) => handleFieldChange(fieldDef, parseInt(e.target.value) || fieldDef.default)}
              min={fieldDef.min}
              max={fieldDef.max}
              style={inputStyle}
              title={fieldDef.tooltip}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.COLOR:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{fieldDef.label}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="color"
                value={currentValue || fieldDef.default}
                onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
                style={{ width: 50, height: 36, border: `1px solid ${C.border}`, cursor: "pointer" }}
                title={fieldDef.tooltip}
              />
              <input
                type="text"
                value={currentValue || ""}
                onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
                placeholder={fieldDef.placeholder}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
            </div>
          </div>
        );

      case FIELD_TYPES_EXPORT.SELECT:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{fieldDef.label}</label>
            <select
              value={currentValue || fieldDef.default}
              onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
              style={inputStyle}
              title={fieldDef.tooltip}
            >
              {fieldDef.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.CHECKBOX:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={currentValue ?? fieldDef.default}
                onChange={(e) => handleFieldChange(fieldDef, e.target.checked)}
                style={{ cursor: "pointer" }}
                title={fieldDef.tooltip}
              />
              <span style={{ fontFamily: NU, fontSize: 11, color: C.white }}>
                {fieldDef.label}
              </span>
            </label>
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "6px 0 0 28px" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.IMAGE:
      case FIELD_TYPES_EXPORT.VIDEO:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{fieldDef.label}</label>
            <input
              type="text"
              value={currentValue || ""}
              onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
              placeholder="Paste URL or upload file"
              style={inputStyle}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      case FIELD_TYPES_EXPORT.URL:
        return (
          <div key={fieldDef.name} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{fieldDef.label}</label>
            <input
              type="url"
              value={currentValue || ""}
              onChange={(e) => handleFieldChange(fieldDef, e.target.value)}
              placeholder={fieldDef.placeholder}
              style={inputStyle}
              title={fieldDef.tooltip}
            />
            {fieldDef.help && (
              <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "4px 0 0 0" }}>
                {fieldDef.help}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: 320,
        backgroundColor: C.dark,
        borderLeft: `1px solid ${C.border}`,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: GD, fontSize: 12, color: C.white, margin: "0 0 8px 0" }}>
          Section Settings
        </h3>
        <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
          {sectionType.name}
        </p>
      </div>

      {/* Tabs - render only available tabs */}
      {fieldGroups.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {fieldGroups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveTab(group)}
              style={tabStyle(activeTab === group)}
            >
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {fieldsInTab.length > 0 ? (
          <div>
            {fieldsInTab.map((field) => renderField(field))}
          </div>
        ) : (
          <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
            No fields for this tab
          </p>
        )}
      </div>
    </div>
  );
};

export default RightSettingsPanel;
