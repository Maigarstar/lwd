// footer/FooterConfig.jsx
// Global footer configuration: design tokens, brand block, newsletter, bottom bar.
// Each change is applied instantly to the canvas via onConfigChange.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SANS, SERIF, LAYOUT_OPTIONS, DEFAULT_FOOTER_CONFIG } from "./footerUtils.js";

// ── Collapsible section wrapper ────────────────────────────────────────────
function Section({ title, defaultOpen = false, children, C }) {
  const [open, setOpen] = useState(defaultOpen);
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{ borderBottom: `1px solid ${C?.border || "#2a2218"}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          color: C?.off || "#d4c8b0",
        }}
      >
        <span style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a",
        }}>{title}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: open ? G : "#5a5045" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "4px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Color swatch input ─────────────────────────────────────────────────────
function ColorRow({ label, field, cfg, set, C }) {
  const lbl = { fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 4, display: "block" };
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={cfg[field] || "#000000"}
          onChange={e => set(field, e.target.value)}
          style={{ width: 32, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }}
        />
        <input
          value={cfg[field] || ""}
          onChange={e => set(field, e.target.value)}
          style={{
            flex: 1, background: C?.dark || "#0d0d0d",
            border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, color: C?.white || "#f5efe4",
            fontFamily: SANS, fontSize: 12, padding: "6px 10px", outline: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Text input row ─────────────────────────────────────────────────────────
function TextRow({ label, field, cfg, set, placeholder, type = "text", C }) {
  const lbl = { fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 4, display: "block" };
  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: SANS, fontSize: 13, padding: "7px 11px", outline: "none",
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={cfg[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────
function ToggleRow({ label, field, cfg, set, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        checked={!!cfg[field]}
        onChange={e => set(field, e.target.checked)}
        id={`fc-${field}`}
        style={{ accentColor: G }}
      />
      <label htmlFor={`fc-${field}`} style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", cursor: "pointer" }}>
        {label}
      </label>
    </div>
  );
}

// ── Number input row ───────────────────────────────────────────────────────
function NumRow({ label, field, cfg, set, min, max, C }) {
  const lbl = { fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 4, display: "block" };
  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: SANS, fontSize: 13, padding: "7px 11px", outline: "none",
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type="number" value={cfg[field] ?? ""} min={min} max={max} onChange={e => set(field, Number(e.target.value))} style={inp} />
    </div>
  );
}

// ── Main config component ──────────────────────────────────────────────────
export default function FooterConfig({ footerConfig, onConfigChange, onSave, saving, C }) {
  const G = C?.gold || "#c9a84c";
  const cfg = footerConfig || DEFAULT_FOOTER_CONFIG;

  const set = (k, v) => {
    const next = { ...cfg, [k]: v };
    onConfigChange(next);
  };

  const lbl = { fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 4, display: "block" };
  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: SANS, fontSize: 13, padding: "7px 11px", outline: "none",
  };

  return (
    <div style={{
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10, overflow: "hidden",
    }}>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      <Section title="Layout" defaultOpen C={C}>
        <div>
          <label style={lbl}>Layout Type</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LAYOUT_OPTIONS.map(opt => {
              const active = cfg.layout_type === opt.value;
              return (
                <button key={opt.value} onClick={() => set("layout_type", opt.value)} style={{
                  background: active ? G + "18" : "transparent",
                  border: `1px solid ${active ? G + "60" : C?.border || "#2a2218"}`,
                  borderRadius: 6, padding: "7px 10px", textAlign: "left",
                  cursor: "pointer", transition: "all 120ms",
                }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: active ? G : C?.off || "#d4c8b0" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: active ? G + "aa" : "#5a5045" }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={lbl}>Columns</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => set("layout_columns", n)} style={{
                flex: 1, background: cfg.layout_columns === n ? G + "18" : "transparent",
                border: `1px solid ${cfg.layout_columns === n ? G + "60" : C?.border || "#2a2218"}`,
                borderRadius: 6, padding: "7px 4px", cursor: "pointer",
                fontFamily: SANS, fontSize: 13, fontWeight: 700,
                color: cfg.layout_columns === n ? G : C?.grey || "#8a7d6a",
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <NumRow label="Padding X" field="pad_x" cfg={cfg} set={set} min={0} max={120} C={C} />
          <NumRow label="Padding Y" field="pad_y" cfg={cfg} set={set} min={0} max={120} C={C} />
        </div>
      </Section>

      {/* ── Design ──────────────────────────────────────────────────── */}
      <Section title="Design" C={C}>
        <ColorRow label="Background" field="bg_color" cfg={cfg} set={set} C={C} />
        <div>
          <label style={lbl}>Opacity</label>
          <input
            type="range" min={0} max={1} step={0.01}
            value={cfg.bg_opacity ?? 1}
            onChange={e => set("bg_opacity", Number(e.target.value))}
            style={{ width: "100%", accentColor: G }}
          />
          <div style={{ fontFamily: SANS, fontSize: 10, color: "#5a5045", textAlign: "right" }}>
            {Math.round((cfg.bg_opacity ?? 1) * 100)}%
          </div>
        </div>
        <ColorRow label="Text Color" field="text_color" cfg={cfg} set={set} C={C} />
        <ColorRow label="Accent Color" field="accent_color" cfg={cfg} set={set} C={C} />
        <ToggleRow label="Border top" field="border_top" cfg={cfg} set={set} C={C} />
        {cfg.border_top && <ColorRow label="Border Color" field="border_color" cfg={cfg} set={set} C={C} />}
      </Section>

      {/* ── Brand Block ─────────────────────────────────────────────── */}
      <Section title="Brand Block" C={C}>
        <ToggleRow label="Show logo" field="show_logo" cfg={cfg} set={set} C={C} />
        {cfg.show_logo && <NumRow label="Logo size (px)" field="logo_size" cfg={cfg} set={set} min={16} max={80} C={C} />}
        <ToggleRow label="Show tagline" field="show_tagline" cfg={cfg} set={set} C={C} />
        {cfg.show_tagline && <TextRow label="Tagline text" field="tagline_text" cfg={cfg} set={set} C={C} />}
        <ToggleRow label="Show social links" field="show_social" cfg={cfg} set={set} C={C} />
        {cfg.show_social && (
          <>
            <TextRow label="Instagram URL" field="social_instagram" cfg={cfg} set={set} placeholder="https://instagram.com/..." C={C} />
            <TextRow label="Pinterest URL" field="social_pinterest" cfg={cfg} set={set} placeholder="https://pinterest.com/..." C={C} />
            <TextRow label="TikTok URL" field="social_tiktok" cfg={cfg} set={set} placeholder="https://tiktok.com/..." C={C} />
          </>
        )}
      </Section>

      {/* ── Newsletter ──────────────────────────────────────────────── */}
      <Section title="Newsletter" C={C}>
        <ToggleRow label="Show newsletter section" field="show_newsletter" cfg={cfg} set={set} C={C} />
        {cfg.show_newsletter && (
          <>
            <TextRow label="Heading" field="newsletter_heading" cfg={cfg} set={set} placeholder="The LWD Edit" C={C} />
            <TextRow label="Subtext" field="newsletter_subtext" cfg={cfg} set={set} placeholder="Monthly inspiration..." C={C} />
            <TextRow label="Button label" field="newsletter_btn_label" cfg={cfg} set={set} placeholder="Subscribe" C={C} />
          </>
        )}
      </Section>

      {/* ── Bottom Bar ──────────────────────────────────────────────── */}
      <Section title="Bottom Bar" C={C}>
        <ToggleRow label="Show bottom bar" field="show_bottom_bar" cfg={cfg} set={set} C={C} />
        {cfg.show_bottom_bar && (
          <>
            <TextRow label="Copyright text" field="copyright_text" cfg={cfg} set={set} placeholder="2025 Luxury Wedding Directory" C={C} />
            <ColorRow label="Bottom bar background" field="bottom_bar_bg" cfg={cfg} set={set} C={C} />
            <ColorRow label="Bottom bar text color" field="bottom_bar_text" cfg={cfg} set={set} C={C} />
          </>
        )}
      </Section>

      {/* ── Visibility ──────────────────────────────────────────────── */}
      <Section title="Visibility" C={C}>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", lineHeight: 1.6, marginBottom: 8 }}>
          Control which pages this footer appears on.
        </div>
        {[
          { value: "all",       label: "Show on all pages",       desc: "Footer appears everywhere on the site" },
          { value: "editorial", label: "Show on editorial only",   desc: "Magazine, editorial, and blog pages only" },
          { value: "directory", label: "Show on directory pages",  desc: "Venue listings, search, and destination pages only" },
        ].map(opt => {
          const active = (cfg.visibility_mode || "all") === opt.value;
          return (
            <button key={opt.value} onClick={() => set("visibility_mode", opt.value)} style={{
              background: active ? G + "18" : "transparent",
              border: `1px solid ${active ? G + "60" : C?.border || "#2a2218"}`,
              borderRadius: 6, padding: "7px 10px", textAlign: "left",
              cursor: "pointer", transition: "all 120ms", width: "100%",
            }}>
              <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: active ? G : C?.off || "#d4c8b0" }}>
                {opt.label}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: active ? G + "aa" : "#5a5045" }}>
                {opt.desc}
              </div>
            </button>
          );
        })}
      </Section>

      {/* Save button */}
      <div style={{ padding: "14px 14px" }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            width: "100%", background: G, border: "none", borderRadius: 7,
            color: "#0a0906", padding: "10px 0",
            fontFamily: SANS, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
          }}
        >{saving ? "Saving..." : "Save Footer Config"}</button>
      </div>
    </div>
  );
}
