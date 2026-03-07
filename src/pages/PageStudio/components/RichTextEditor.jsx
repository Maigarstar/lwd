/**
 * Simple rich text editor with formatting toolbar
 */

import { useState } from "react";

const RichTextEditor = ({ value = "", onChange, placeholder = "", C, NU }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleChange = (e) => {
    onChange(e.currentTarget.innerHTML);
  };

  const toolbarButton = (label, command, value = null) => (
    <button
      key={label}
      onMouseDown={(e) => {
        e.preventDefault();
        applyFormat(command, value);
      }}
      title={label}
      style={{
        padding: "4px 8px",
        backgroundColor: C.dark,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        color: C.white,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: NU
      }}
    >
      {label}
    </button>
  );

  const editorStyle = {
    fontFamily: NU,
    fontSize: 12,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 120,
    maxHeight: isFullscreen ? "70vh" : 200,
    overflow: "auto",
    resize: "vertical",
    lineHeight: 1.6
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 8,
          padding: 8,
          backgroundColor: C.dark,
          borderRadius: 3,
          flexWrap: "wrap"
        }}
      >
        {toolbarButton("B", "bold")}
        {toolbarButton("I", "italic")}
        {toolbarButton("U", "underline")}
        <div style={{ width: 1, backgroundColor: C.border, margin: "0 4px" }} />
        {toolbarButton("H1", "formatBlock", "h1")}
        {toolbarButton("H2", "formatBlock", "h2")}
        {toolbarButton("P", "formatBlock", "p")}
        <div style={{ width: 1, backgroundColor: C.border, margin: "0 4px" }} />
        {toolbarButton("UL", "insertUnorderedList")}
        {toolbarButton("OL", "insertOrderedList")}
        {toolbarButton("Link", "createLink")}
        <div style={{ width: 1, backgroundColor: C.border, margin: "0 4px" }} />
        {toolbarButton("Clear", "removeFormat")}
      </div>

      {/* Editor */}
      <div
        contentEditable
        onInput={handleChange}
        suppressContentEditableWarning
        style={editorStyle}
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {/* Character count */}
      <div
        style={{
          fontSize: 9,
          color: C.grey2,
          marginTop: 4,
          textAlign: "right"
        }}
      >
        {value.replace(/<[^>]*>/g, "").length} characters
      </div>
    </div>
  );
};

export default RichTextEditor;
