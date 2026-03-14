/**
 * Simple rich text editor with formatting toolbar.
 * Uses a ref-based approach for contentEditable to prevent cursor jumping
 * caused by dangerouslySetInnerHTML resetting the DOM on every re-render.
 */

import { useState, useRef, useEffect } from "react";

const RichTextEditor = ({ value = "", onChange, placeholder = "", C, NU }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef(null);
  const isEditingRef = useRef(false);

  // Set initial content on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes only when the editor is not focused
  useEffect(() => {
    if (editorRef.current && !isEditingRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const applyFormat = (command, val = null) => {
    document.execCommand(command, false, val);
  };

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
  };

  const toolbarButton = (label, command, val = null) => (
    <button
      key={label}
      onMouseDown={(e) => {
        e.preventDefault();
        applyFormat(command, val);
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

      {/* Editor, ref-based, no dangerouslySetInnerHTML to prevent cursor jumps */}
      <div
        ref={editorRef}
        contentEditable
        onFocus={() => { isEditingRef.current = true; }}
        onBlur={() => { isEditingRef.current = false; }}
        onInput={handleInput}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{
          ...editorStyle,
          // Show placeholder via CSS when empty
          ...(value === '' ? { color: C.grey2 } : {})
        }}
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
