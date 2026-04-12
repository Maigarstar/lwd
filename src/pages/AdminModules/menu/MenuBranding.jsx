// ─── src/pages/AdminModules/menu/MenuBranding.jsx ────────────────────────────
// Branding CMS — full brand identity, logo assets, sizing, header layout, and
// footer placement. Single source of truth for logo across header + footer.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SANS, SERIF, MONO } from "./menuUtils.js";


const DEFAULT_BRANDING = {
  brand_name:               "Luxury Wedding Directory",
  brand_tagline:            "",
  logo_alt_text:            "Luxury Wedding Directory",
  logo_link_target:         "/",
  logo_type:                "text",
  logo_variant:             "full",
  logo_text:                "Luxury Wedding Directory",
  logo_font:                "serif",
  logo_color:               "",
  logo_image_light:         "",
  logo_image_dark:          "",
  logo_image_mobile:        "",
  logo_image_footer:        "",
  transparent_bg_expected:  true,
  header_logo_size:         "medium",
  header_logo_width_desktop: 180,
  header_logo_width_mobile:  120,
  header_logo_rendering:    "contain",
  footer_logo_size:         "medium",
  footer_logo_width_desktop: 160,
  footer_logo_width_mobile:  110,
  logo_align_header:        "left",
  menu_align_header:        "right",
  header_layout:            "logo-left",
  show_logo_in_header:      true,
  footer_layout:            "logo-left-columns",
  show_logo_in_footer:      true,
  use_same_logo_everywhere: true,
};

// ── Reusable components ────────────────────────────────────────────────────

function Toggle({ label, desc, checked, onChange, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 12, cursor: "pointer",
    }}>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>{label}</div>
        {desc && <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", marginTop: 2 }}>{desc}</div>}
      </div>
      <span
        onClick={onChange}
        style={{
          display: "inline-block", width: 36, height: 20, borderRadius: 10, position: "relative",
          background: checked ? G : (C?.border || "#2a2218"),
          transition: "background 0.2s", flexShrink: 0, cursor: "pointer", marginTop: 2,
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

function FieldLabel({ children, C }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: C?.grey || "#8a7d6a", marginBottom: 5, display: "block",
    }}>{children}</span>
  );
}

function TextInput({ label, value, onChange, placeholder, C }) {
  return (
    <div>
      {label && <FieldLabel C={C}>{label}</FieldLabel>}
      <input
        type="text"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: C?.dark || "#0d0d0d",
          border: `1px solid ${C?.border || "#2a2218"}`,
          borderRadius: 6, color: C?.white || "#f5efe4",
          fontFamily: MONO, fontSize: 12, padding: "8px 12px",
          outline: "none", width: "100%", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function NumericInput({ label, value, onChange, min = 0, max = 400, unit = "px", C }) {
  return (
    <div>
      {label && <FieldLabel C={C}>{label}</FieldLabel>}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number" min={min} max={max}
          value={value ?? ""}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            background: C?.dark || "#0d0d0d",
            border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, color: C?.white || "#f5efe4",
            fontFamily: MONO, fontSize: 12, padding: "7px 10px",
            outline: "none", width: "80px", boxSizing: "border-box",
          }}
        />
        <span style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a" }}>{unit}</span>
      </div>
    </div>
  );
}

function UrlInput({ label, value, onChange, placeholder, C }) {
  const G = C?.gold || "#c9a84c";
  const hasValue = value && value.trim().length > 0;
  return (
    <div>
      {label && <FieldLabel C={C}>{label}</FieldLabel>}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "https://…"}
          style={{
            background: C?.dark || "#0d0d0d",
            border: `1px solid ${hasValue ? G + "44" : (C?.border || "#2a2218")}`,
            borderRadius: 6, color: C?.white || "#f5efe4",
            fontFamily: MONO, fontSize: 11, padding: "8px 12px",
            outline: "none", width: "100%", boxSizing: "border-box",
          }}
        />
        {hasValue && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              fontFamily: SANS, fontSize: 10, color: G, textDecoration: "none",
              opacity: 0.7,
            }}
          >preview ↗</a>
        )}
      </div>
    </div>
  );
}

function ChipRow({ value, options, onChange, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(({ value: v, label }) => (
        <button key={v} onClick={() => onChange(v)} style={{
          padding: "6px 14px", borderRadius: 6, cursor: "pointer",
          background: value === v ? G + "18" : "transparent",
          border: `1px solid ${value === v ? G : (C?.border || "#2a2218")}`,
          fontFamily: SANS, fontSize: 11, fontWeight: 600,
          color: value === v ? G : (C?.grey || "#8a7d6a"),
          transition: "all 0.15s",
        }}>{label}</button>
      ))}
    </div>
  );
}

function Section({ title, desc, children, open, onToggle, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{ border: `1px solid ${C?.border || "#2a2218"}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: open ? G + "0d" : "transparent",
          border: "none", cursor: "pointer", transition: "background 0.15s",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: open ? G : (C?.off || "#d4c8b0") }}>
            {title}
          </div>
          {desc && (
            <div style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 2 }}>
              {desc}
            </div>
          )}
        </div>
        <span style={{ color: C?.grey || "#8a7d6a", fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 12 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 18, borderTop: `1px solid ${C?.border || "#2a2218"}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Layout preset cards ────────────────────────────────────────────────────

const HEADER_LAYOUTS = [
  {
    value: "logo-left",
    label: "Logo Left",
    desc: "Logo left, menu right",
    preview: ({ G }) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "80%", gap: 4 }}>
        <div style={{ width: 26, height: 5, borderRadius: 2, background: G, opacity: 0.8 }} />
        <div style={{ display: "flex", gap: 3 }}>
          {[18, 14, 18, 10].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
      </div>
    ),
  },
  {
    value: "logo-center-stacked",
    label: "Centered Stack",
    desc: "Logo centered, menu below",
    preview: ({ G }) => (
      <>
        <div style={{ width: 32, height: 5, borderRadius: 2, background: G, opacity: 0.8, margin: "0 auto" }} />
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {[14, 18, 14, 18, 10].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
      </>
    ),
  },
  {
    value: "logo-above-centered",
    label: "Above Center",
    desc: "Logo + menu stacked, editorial",
    preview: ({ G }) => (
      <>
        <div style={{ width: 36, height: 5, borderRadius: 2, background: G, opacity: 0.8, margin: "0 auto 3px" }} />
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {[12, 18, 12, 16, 12, 18].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
      </>
    ),
  },
  {
    value: "split-center-logo",
    label: "Split + Center",
    desc: "Menu split, logo in center",
    preview: ({ G }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: "86%" }}>
        <div style={{ display: "flex", gap: 3, flex: 1 }}>
          {[18, 14].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
        <div style={{ width: 22, height: 5, borderRadius: 2, background: G, opacity: 0.8 }} />
        <div style={{ display: "flex", gap: 3, flex: 1, justifyContent: "flex-end" }}>
          {[14, 18, 10].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
      </div>
    ),
  },
  {
    value: "logo-left-center-menu",
    label: "Logo Left, Centre Nav",
    desc: "Logo left, links centered",
    preview: ({ G }) => (
      <div style={{ display: "flex", alignItems: "center", width: "86%", position: "relative" }}>
        <div style={{ width: 24, height: 5, borderRadius: 2, background: G, opacity: 0.8 }} />
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
          {[14, 18, 14].map((w, i) => <div key={i} style={{ width: w, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.28)" }} />)}
        </div>
      </div>
    ),
  },
];

const FOOTER_LAYOUTS = [
  { value: "logo-left-columns",       label: "Logo Left", desc: "Logo left, columns right" },
  { value: "logo-center-above-links", label: "Logo Center", desc: "Centered logo above links" },
  { value: "logo-center-newsletter",  label: "Logo + Newsletter", desc: "Logo above newsletter" },
  { value: "minimal-center",          label: "Minimal Centre", desc: "Brand only, no columns" },
];

// ── Logo preview ───────────────────────────────────────────────────────────

function LogoPreview({ b, C }) {
  const G = C?.gold || "#c9a84c";
  const fontFn = b.logo_font === "sans" ? "var(--font-body)" : "var(--font-heading-primary)";
  const showImg  = (b.logo_type === "image" || b.logo_type === "image+text") && b.logo_image_light;
  const showText = b.logo_type === "text" || b.logo_type === "image+text";
  const showIcon = b.logo_type === "icon";

  return (
    <div style={{
      background: "#080602", borderRadius: 8, padding: "16px 24px",
      display: "flex", alignItems: "center",
      justifyContent: b.header_layout?.includes("center") ? "center" : "flex-start",
      minHeight: 56, gap: 12,
      border: `1px solid ${C?.border || "#2a2218"}`,
    }}>
      {showImg && b.logo_image_light && (
        <img
          src={b.logo_image_light}
          alt="logo"
          style={{ height: b.header_logo_width_desktop ? Math.round(b.header_logo_width_desktop * 0.25) : 36, maxWidth: 180, objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; }}
        />
      )}
      {showIcon && (
        <div style={{ fontSize: 22, color: b.logo_color || G }}>✦</div>
      )}
      {showText && (
        <div style={{
          fontFamily: fontFn, fontSize: 17, fontWeight: 600,
          color: b.logo_color || G, letterSpacing: "0.3px",
        }}>
          {b.logo_text || "Luxury Wedding Directory"}
        </div>
      )}
      {!showImg && !showText && !showIcon && (
        <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a" }}>
          No logo configured
        </div>
      )}
    </div>
  );
}

// ── Size preset helper ─────────────────────────────────────────────────────
const SIZE_PRESETS = {
  small:  { desktop: 120, mobile: 90  },
  medium: { desktop: 180, mobile: 120 },
  large:  { desktop: 240, mobile: 160 },
};

// ── Main component ─────────────────────────────────────────────────────────
export default function MenuBranding({ C }) {
  const G = C?.gold || "#c9a84c";
  const [b,       setB]       = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [open,    setOpen]    = useState("identity");

  const set = (k, v) => setB(prev => ({ ...prev, [k]: v }));
  const tog = k => setB(prev => ({ ...prev, [k]: !prev[k] }));
  const section = s => setOpen(prev => prev === s ? null : s);

  useEffect(() => {
    supabase
      .from("site_branding")
      .select("*")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setB({ ...DEFAULT_BRANDING, ...data });
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_branding")
        .upsert({ ...b, id: "main", updated_at: new Date().toISOString() });
      if (error) throw error;
      setToast({ msg: "Branding saved", type: "success" });
    } catch (e) {
      setToast({ msg: "Save failed: " + e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) return (
    <div style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", padding: 24 }}>
      Loading branding…
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "error" ? "#2a1010" : "#0e1a0e",
          border: `1px solid ${toast.type === "error" ? "#f87171" : G}`,
          borderLeft: `3px solid ${toast.type === "error" ? "#f87171" : G}`,
          color: toast.type === "error" ? "#f87171" : "#4ade80",
          padding: "12px 20px", borderRadius: 8,
          fontFamily: SANS, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", lineHeight: 1.6, marginBottom: 14 }}>
        Manage your logo, brand identity, and header/footer placement. Single control point for all brand assets.
      </div>

      {/* ── 1. Brand Identity ─────────────────────────────────────────────── */}
      <Section title="Brand Identity" desc="Name, tagline, and accessibility fields" open={open === "identity"} onToggle={() => section("identity")} C={C}>
        <TextInput label="Brand Name" value={b.brand_name} onChange={v => set("brand_name", v)} placeholder="Luxury Wedding Directory" C={C} />
        <TextInput label="Brand Tagline" value={b.brand_tagline} onChange={v => set("brand_tagline", v)} placeholder="The world's finest venues, carefully selected" C={C} />
        <TextInput label="Logo Alt Text" value={b.logo_alt_text} onChange={v => set("logo_alt_text", v)} placeholder="Luxury Wedding Directory" C={C} />
        <TextInput label="Logo Link Target" value={b.logo_link_target} onChange={v => set("logo_link_target", v)} placeholder="/" C={C} />
      </Section>

      {/* ── 2. Logo Type & Variant ─────────────────────────────────────────── */}
      <Section title="Logo Type" desc="Image, text, combination, or icon mark" open={open === "type"} onToggle={() => section("type")} C={C}>

        <div>
          <FieldLabel C={C}>Logo Type</FieldLabel>
          <ChipRow value={b.logo_type} onChange={v => set("logo_type", v)} C={C} options={[
            { value: "text",       label: "Text Logo" },
            { value: "image",      label: "Image Logo" },
            { value: "image+text", label: "Image + Text" },
            { value: "icon",       label: "Icon Only" },
          ]} />
        </div>

        <div>
          <FieldLabel C={C}>Logo Variant</FieldLabel>
          <ChipRow value={b.logo_variant} onChange={v => set("logo_variant", v)} C={C} options={[
            { value: "full",      label: "Full Logo" },
            { value: "wordmark",  label: "Wordmark" },
            { value: "monogram",  label: "Monogram" },
            { value: "icon-mark", label: "Icon Mark" },
          ]} />
        </div>

        {/* Text logo */}
        {(b.logo_type === "text" || b.logo_type === "image+text") && (
          <>
            <TextInput label="Logo Text" value={b.logo_text} onChange={v => set("logo_text", v)} placeholder="Luxury Wedding Directory" C={C} />
            <div>
              <FieldLabel C={C}>Font Style</FieldLabel>
              <ChipRow value={b.logo_font} onChange={v => set("logo_font", v)} C={C} options={[
                { value: "serif", label: "Serif — Cormorant" },
                { value: "sans",  label: "Sans — Nunito" },
              ]} />
            </div>
            <div>
              <FieldLabel C={C}>Text Colour (blank = theme gold)</FieldLabel>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={b.logo_color || "#c9a84c"} onChange={e => set("logo_color", e.target.value)}
                  style={{ width: 34, height: 34, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 2 }} />
                <input type="text" value={b.logo_color || ""} onChange={e => set("logo_color", e.target.value)}
                  placeholder="Leave blank for gold"
                  style={{ background: C?.dark || "#0d0d0d", border: `1px solid ${C?.border || "#2a2218"}`, borderRadius: 6, color: C?.white || "#f5efe4", fontFamily: MONO, fontSize: 11, padding: "7px 10px", outline: "none", flex: 1 }} />
                {b.logo_color && (
                  <button onClick={() => set("logo_color", "")} style={{ background: "none", border: "none", color: C?.grey || "#8a7d6a", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Live preview */}
        <div>
          <FieldLabel C={C}>Preview</FieldLabel>
          <LogoPreview b={b} C={C} />
        </div>

      </Section>

      {/* ── 3. Logo Assets ────────────────────────────────────────────────── */}
      <Section title="Logo Assets" desc="Image uploads for header, footer, and dark mode" open={open === "assets"} onToggle={() => section("assets")} C={C}>

        <UrlInput label="Main Logo Image (light background / default)" value={b.logo_image_light} onChange={v => set("logo_image_light", v)} placeholder="https://…/logo.svg" C={C} />
        <UrlInput label="Dark Mode Logo Image (on dark / transparent header)" value={b.logo_image_dark} onChange={v => set("logo_image_dark", v)} placeholder="https://…/logo-white.svg (optional)" C={C} />
        <UrlInput label="Mobile Logo Image (compact mark)" value={b.logo_image_mobile} onChange={v => set("logo_image_mobile", v)} placeholder="https://…/logo-mark.svg (optional)" C={C} />

        <Toggle
          label="Transparent background expected"
          desc="Auto-switch to dark logo variant when nav is on transparent/hero background"
          checked={!!b.transparent_bg_expected}
          onChange={() => tog("transparent_bg_expected")}
          C={C}
        />

        <Toggle
          label="Use same logo everywhere"
          desc="Footer inherits header logo. Turn off to set a separate footer image."
          checked={!!b.use_same_logo_everywhere}
          onChange={() => tog("use_same_logo_everywhere")}
          C={C}
        />

        {!b.use_same_logo_everywhere && (
          <UrlInput label="Footer Logo Image (if different)" value={b.logo_image_footer} onChange={v => set("logo_image_footer", v)} placeholder="https://…/logo-footer.svg" C={C} />
        )}

      </Section>

      {/* ── 4. Header Logo Sizing ─────────────────────────────────────────── */}
      <Section title="Header Logo Sizing" desc="Size, width, and image rendering mode" open={open === "header-size"} onToggle={() => section("header-size")} C={C}>

        <div>
          <FieldLabel C={C}>Size Preset</FieldLabel>
          <ChipRow value={b.header_logo_size} onChange={v => {
            set("header_logo_size", v);
            if (v !== "custom" && SIZE_PRESETS[v]) {
              set("header_logo_width_desktop", SIZE_PRESETS[v].desktop);
              set("header_logo_width_mobile",  SIZE_PRESETS[v].mobile);
            }
          }} C={C} options={[
            { value: "small",  label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large",  label: "Large" },
            { value: "custom", label: "Custom" },
          ]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <NumericInput label="Desktop Width" value={b.header_logo_width_desktop} onChange={v => set("header_logo_width_desktop", v)} min={40} max={400} C={C} />
          <NumericInput label="Mobile Width"  value={b.header_logo_width_mobile}  onChange={v => set("header_logo_width_mobile", v)}  min={30} max={280} C={C} />
        </div>

        <div>
          <FieldLabel C={C}>Image Rendering</FieldLabel>
          <ChipRow value={b.header_logo_rendering} onChange={v => set("header_logo_rendering", v)} C={C} options={[
            { value: "contain",     label: "Contain" },
            { value: "original",    label: "Original Ratio" },
            { value: "fixed-height",label: "Fixed Height" },
            { value: "fixed-width", label: "Fixed Width" },
          ]} />
        </div>

      </Section>

      {/* ── 5. Footer Logo Sizing ─────────────────────────────────────────── */}
      <Section title="Footer Logo Sizing" open={open === "footer-size"} onToggle={() => section("footer-size")} C={C}>

        <div>
          <FieldLabel C={C}>Size Preset</FieldLabel>
          <ChipRow value={b.footer_logo_size} onChange={v => {
            set("footer_logo_size", v);
            if (v !== "custom" && SIZE_PRESETS[v]) {
              set("footer_logo_width_desktop", SIZE_PRESETS[v].desktop);
              set("footer_logo_width_mobile",  SIZE_PRESETS[v].mobile);
            }
          }} C={C} options={[
            { value: "small",  label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large",  label: "Large" },
            { value: "custom", label: "Custom" },
          ]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <NumericInput label="Desktop Width" value={b.footer_logo_width_desktop} onChange={v => set("footer_logo_width_desktop", v)} min={40} max={400} C={C} />
          <NumericInput label="Mobile Width"  value={b.footer_logo_width_mobile}  onChange={v => set("footer_logo_width_mobile", v)}  min={30} max={280} C={C} />
        </div>

      </Section>

      {/* ── 6. Header Layout ──────────────────────────────────────────────── */}
      <Section title="Header Layout" desc="Logo position and navigation placement" open={open === "header-layout"} onToggle={() => section("header-layout")} C={C}>

        <div>
          <FieldLabel C={C}>Layout Preset</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 2 }}>
            {HEADER_LAYOUTS.map(({ value, label, desc: d, preview: PreviewFn }) => {
              const selected = b.header_layout === value;
              return (
                <button
                  key={value}
                  onClick={() => set("header_layout", value)}
                  style={{
                    background: selected ? G + "12" : (C?.dark || "#0d0d0d"),
                    border: `1.5px solid ${selected ? G : (C?.border || "#2a2218")}`,
                    borderRadius: 8, cursor: "pointer", padding: "12px 10px 14px",
                    textAlign: "center", transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    height: 36, background: "rgba(255,255,255,0.03)", borderRadius: 4,
                    marginBottom: 8, overflow: "hidden",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  }}>
                    <PreviewFn G={G} />
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: selected ? G : (C?.off || "#d4c8b0"), marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a" }}>{d}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel C={C}>Logo Alignment</FieldLabel>
          <ChipRow value={b.logo_align_header} onChange={v => set("logo_align_header", v)} C={C} options={[
            { value: "left",   label: "Left" },
            { value: "center", label: "Center" },
            { value: "right",  label: "Right" },
          ]} />
        </div>

        <div>
          <FieldLabel C={C}>Menu Alignment</FieldLabel>
          <ChipRow value={b.menu_align_header} onChange={v => set("menu_align_header", v)} C={C} options={[
            { value: "left",   label: "Left" },
            { value: "center", label: "Center" },
            { value: "right",  label: "Right" },
            { value: "split",  label: "Split Navigation" },
          ]} />
        </div>

        <Toggle
          label="Show logo in header"
          checked={!!b.show_logo_in_header}
          onChange={() => tog("show_logo_in_header")}
          C={C}
        />

      </Section>

      {/* ── 7. Footer Layout ──────────────────────────────────────────────── */}
      <Section title="Footer Layout" desc="Footer logo placement and column arrangement" open={open === "footer-layout"} onToggle={() => section("footer-layout")} C={C}>

        <div>
          <FieldLabel C={C}>Layout Style</FieldLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FOOTER_LAYOUTS.map(({ value, label, desc: d }) => {
              const selected = b.footer_layout === value;
              return (
                <button
                  key={value}
                  onClick={() => set("footer_layout", value)}
                  style={{
                    background: selected ? G + "12" : "transparent",
                    border: `1px solid ${selected ? G : (C?.border || "#2a2218")}`,
                    borderRadius: 7, cursor: "pointer",
                    padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: selected ? G : (C?.off || "#d4c8b0") }}>{label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 2 }}>{d}</div>
                  </div>
                  {selected && <span style={{ color: G, fontSize: 14 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <Toggle
          label="Show logo in footer"
          checked={!!b.show_logo_in_footer}
          onChange={() => tog("show_logo_in_footer")}
          C={C}
        />

      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: saving ? (G + "60") : G,
          border: "none", borderRadius: 8,
          color: "#0a0906", padding: "12px 24px",
          fontFamily: SANS, fontSize: 12, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: saving ? "default" : "pointer",
          marginTop: 6,
          transition: "background 0.2s",
        }}
      >
        {saving ? "Saving…" : "Save Branding"}
      </button>

    </div>
  );
}
