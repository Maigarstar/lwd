// menu/MenuNavConfig.jsx
// Header design + mobile configuration panel for the navigation.
// Changes propagate instantly to the canvas via onConfigChange.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SANS, SERIF, MONO } from "./menuUtils.js";

function Toggle({ label, checked, onChange, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, cursor: "pointer",
      fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0",
    }}>
      <span>{label}</span>
      <span
        onClick={onChange}
        style={{
          display: "inline-block", width: 36, height: 20, borderRadius: 10, position: "relative",
          background: checked ? G : (C?.border || "#2a2218"),
          transition: "background 0.2s", flexShrink: 0, cursor: "pointer",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 18 : 3,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
        }} />
      </span>
    </label>
  );
}

function NumericInput({ label, value, onChange, min = 0, max = 200, unit = "px", C }) {
  const inp = {
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: MONO, fontSize: 12, padding: "7px 10px",
    outline: "none", width: "80px", boxSizing: "border-box",
  };
  const lbl = {
    fontFamily: SANS, fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    color: C?.grey || "#8a7d6a", marginBottom: 5, display: "block",
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number" min={min} max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={inp}
        />
        <span style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a" }}>{unit}</span>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange, C }) {
  const lbl = {
    fontFamily: SANS, fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    color: C?.grey || "#8a7d6a", marginBottom: 5, display: "block",
  };
  const inp = {
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: MONO, fontSize: 11, padding: "7px 10px",
    outline: "none", flex: 1, boxSizing: "border-box",
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color" value={value || "#000000"}
          onChange={e => onChange(e.target.value)}
          style={{ width: 34, height: 34, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 2 }}
        />
        <input value={value || ""} onChange={e => onChange(e.target.value)} style={inp} />
      </div>
    </div>
  );
}

function Section({ title, children, open, onToggle, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{ border: `1px solid ${C?.border || "#2a2218"}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: open ? G + "0d" : "transparent",
          border: "none", cursor: "pointer", transition: "background 0.15s",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: open ? G : (C?.off || "#d4c8b0") }}>
          {title}
        </span>
        <span style={{ color: C?.grey || "#8a7d6a", fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 18, borderTop: `1px solid ${C?.border || "#2a2218"}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function MenuNavConfig({ config, onConfigChange, onSave, saving, C }) {
  const G = C?.gold || "#c9a84c";
  const [openSection, setOpenSection] = useState("header");
  const set = (k, v) => onConfigChange(prev => ({ ...prev, [k]: v }));

  const toggleSection = s => setOpenSection(prev => prev === s ? null : s);

  const opacitySlider = (field, label) => (
    <div>
      <label style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 5, display: "block" }}>
        {label} ({Math.round((config[field] ?? 1) * 100)}%)
      </label>
      <input
        type="range" min={0} max={1} step={0.01}
        value={config[field] ?? 1}
        onChange={e => set(field, parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: G }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

      <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", lineHeight: 1.6, marginBottom: 12 }}>
        Configure global header appearance and mobile behaviour. Changes preview instantly in the canvas.
      </div>

      {/* ── Header Design ── */}
      <Section title="Header Design" open={openSection === "header"} onToggle={() => toggleSection("header")} C={C}>

        <Toggle label="Transparent header" checked={!!config.header_transparent} onChange={() => set("header_transparent", !config.header_transparent)} C={C} />

        {!config.header_transparent && (
          <ColorInput label="Background colour" value={config.header_bg_color} onChange={v => set("header_bg_color", v)} C={C} />
        )}

        {opacitySlider("header_bg_opacity", "Opacity")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <NumericInput label="Header height" value={config.header_height} onChange={v => set("header_height", v)} min={40} max={120} C={C} />
          <NumericInput label="Logo size" value={config.header_logo_size} onChange={v => set("header_logo_size", v)} min={16} max={72} C={C} />
        </div>

        <NumericInput label="Horizontal padding" value={config.header_pad_x} onChange={v => set("header_pad_x", v)} min={0} max={120} C={C} />

        <Toggle label="Shadow" checked={!!config.header_shadow} onChange={() => set("header_shadow", !config.header_shadow)} C={C} />
        <Toggle label="Bottom border" checked={!!config.header_border_bottom} onChange={() => set("header_border_bottom", !config.header_border_bottom)} C={C} />
        {config.header_border_bottom && (
          <ColorInput label="Border colour" value={config.header_border_color} onChange={v => set("header_border_color", v)} C={C} />
        )}
      </Section>

      {/* ── Sticky Header ── */}
      <Section title="Sticky Header" open={openSection === "sticky"} onToggle={() => toggleSection("sticky")} C={C}>

        <Toggle label="Enable sticky on scroll" checked={!!config.header_sticky} onChange={() => set("header_sticky", !config.header_sticky)} C={C} />

        {config.header_sticky && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <NumericInput label="Sticky height" value={config.header_sticky_height} onChange={v => set("header_sticky_height", v)} min={36} max={96} C={C} />
              <NumericInput label="Sticky logo size" value={config.sticky_logo_size} onChange={v => set("sticky_logo_size", v)} min={14} max={56} C={C} />
            </div>
            <ColorInput label="Sticky background" value={config.sticky_bg_color} onChange={v => set("sticky_bg_color", v)} C={C} />
            {opacitySlider("sticky_bg_opacity", "Sticky opacity")}
            <Toggle label="Shadow on sticky" checked={!!config.sticky_shadow} onChange={() => set("sticky_shadow", !config.sticky_shadow)} C={C} />
          </>
        )}
      </Section>

      {/* ── Mobile ── */}
      <Section title="Mobile" open={openSection === "mobile"} onToggle={() => toggleSection("mobile")} C={C}>

        <div>
          <label style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 8, display: "block" }}>
            Logo position
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["left", "Left"], ["center", "Center"]].map(([val, label]) => (
              <button key={val} onClick={() => set("mobile_logo_position", val)} style={{
                flex: 1, padding: "8px 12px", borderRadius: 7, cursor: "pointer",
                background: config.mobile_logo_position === val ? G + "18" : "transparent",
                border: `1px solid ${config.mobile_logo_position === val ? G : (C?.border || "#2a2218")}`,
                fontFamily: SANS, fontSize: 12, fontWeight: 600,
                color: config.mobile_logo_position === val ? G : (C?.grey || "#8a7d6a"),
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 8, display: "block" }}>
            Menu style
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["slide", "Slide In"], ["fullscreen", "Full Screen"]].map(([val, label]) => (
              <button key={val} onClick={() => set("mobile_menu_style", val)} style={{
                flex: 1, padding: "8px 12px", borderRadius: 7, cursor: "pointer",
                background: config.mobile_menu_style === val ? G + "18" : "transparent",
                border: `1px solid ${config.mobile_menu_style === val ? G : (C?.border || "#2a2218")}`,
                fontFamily: SANS, fontSize: 12, fontWeight: 600,
                color: config.mobile_menu_style === val ? G : (C?.grey || "#8a7d6a"),
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <NumericInput label="Mobile header height" value={config.mobile_header_height} onChange={v => set("mobile_header_height", v)} min={44} max={96} C={C} />
          <NumericInput label="Mobile logo size" value={config.mobile_logo_size} onChange={v => set("mobile_logo_size", v)} min={14} max={56} C={C} />
        </div>
      </Section>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          background: saving ? (G + "60") : G,
          border: "none", borderRadius: 8,
          color: "#0a0906", padding: "12px 24px",
          fontFamily: SANS, fontSize: 12, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: saving ? "default" : "pointer",
          marginTop: 4,
          transition: "background 0.2s",
        }}
      >
        {saving ? "Saving..." : "Save Nav Config"}
      </button>
    </div>
  );
}
