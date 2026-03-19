// footer/FooterConfig.jsx
// Global footer configuration: design tokens, brand block, newsletter, bottom bar.
// Each change is applied instantly to the canvas via onConfigChange.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { SANS, SERIF, LAYOUT_OPTIONS, DEFAULT_FOOTER_CONFIG } from "./footerUtils.js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const set = (k, v) => {
    const next = { ...cfg, [k]: v };
    onConfigChange(next);
  };

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setUploadError("Accepted formats: PNG, JPEG, WebP, SVG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `logo/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
      set("logo_url",  data.publicUrl);
      set("logo_type", "image");
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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

      {/* ── Iconic Strip ────────────────────────────────────────────── */}
      <Section title="Iconic Strip" defaultOpen C={C}>
        <ToggleRow label="Show iconic strip" field="show_iconic_strip" cfg={cfg} set={set} C={C} />
        <ToggleRow label="Show editorial tagline" field="show_editorial_tagline" cfg={cfg} set={set} C={C} />
        {cfg.show_iconic_strip !== false && (
          <>
            <TextRow label="Strip label" field="strip_label" cfg={cfg} set={set} placeholder="Iconic Venues" C={C} />
            <NumRow label="Strip height (px)" field="strip_pad_y" cfg={cfg} set={set} min={0} max={80} C={C} />
          </>
        )}
      </Section>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      <Section title="Layout" C={C}>
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
            {[2, 3, 4, 5, 6].map(n => (
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
        <button
          onClick={() => {
            const d = DEFAULT_FOOTER_CONFIG;
            onConfigChange({
              ...cfg,
              bg_color: d.bg_color, bg_opacity: d.bg_opacity,
              text_color: d.text_color, accent_color: d.accent_color,
              border_top: d.border_top, border_color: d.border_color,
            });
          }}
          style={{
            background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            fontFamily: SANS, fontSize: 10, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: C?.grey || "#8a7d6a", width: "100%",
            transition: "border-color 120ms, color 120ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C?.border || "#2a2218"; e.currentTarget.style.color = C?.grey || "#8a7d6a"; }}
        >
          Reset to defaults
        </button>
      </Section>

      {/* ── Brand Block ─────────────────────────────────────────────── */}
      <Section title="Brand Block" C={C}>
        <ToggleRow label="Show logo" field="show_logo" cfg={cfg} set={set} C={C} />

        {cfg.show_logo && (
          <>
            {/* Logo type toggle */}
            <div>
              <label style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 6, display: "block" }}>Logo Type</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { value: "text",  label: "Text" },
                  { value: "image", label: "Image" },
                ].map(opt => {
                  const active = (cfg.logo_type || "text") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => set("logo_type", opt.value)}
                      style={{
                        flex: 1, padding: "7px 8px", cursor: "pointer",
                        background: active ? G + "18" : "transparent",
                        border: `1px solid ${active ? G + "60" : C?.border || "#2a2218"}`,
                        borderRadius: 6,
                        fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 400,
                        color: active ? G : C?.grey || "#8a7d6a",
                      }}
                    >{opt.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Text logo: text + size controls */}
            {(cfg.logo_type || "text") === "text" && (
              <>
                <TextRow label="Logo text" field="logo_text" cfg={cfg} set={set} placeholder="Luxury Wedding Directory" C={C} />
                <NumRow label="Text size (px)" field="logo_size" cfg={cfg} set={set} min={16} max={80} C={C} />
              </>
            )}

            {/* Image logo: upload + preview */}
            {cfg.logo_type === "image" && (
              <div>
                <label style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 6, display: "block" }}>Logo Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />

                {cfg.logo_url ? (
                  /* Preview */
                  <div style={{
                    background: C?.dark || "#0d0d0d",
                    border: `1px solid ${C?.border || "#2a2218"}`,
                    borderRadius: 8, padding: 12,
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{
                      background: "#1a1510", borderRadius: 6, padding: "16px 12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      minHeight: 64,
                    }}>
                      <img
                        src={cfg.logo_url}
                        alt="Logo preview"
                        style={{ maxHeight: cfg.logo_size || 48, maxWidth: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                          flex: 1, padding: "6px 0", cursor: "pointer",
                          background: "transparent",
                          border: `1px solid ${C?.border || "#2a2218"}`,
                          borderRadius: 6,
                          fontFamily: SANS, fontSize: 10, fontWeight: 600,
                          color: C?.grey || "#8a7d6a",
                        }}
                      >{uploading ? "Uploading..." : "Replace"}</button>
                      <button
                        onClick={() => { set("logo_url", ""); set("logo_type", "text"); }}
                        style={{
                          flex: 1, padding: "6px 0", cursor: "pointer",
                          background: "transparent",
                          border: "1px solid #5a2a2a",
                          borderRadius: 6,
                          fontFamily: SANS, fontSize: 10, fontWeight: 600,
                          color: "#b04040",
                        }}
                      >Remove</button>
                    </div>
                  </div>
                ) : (
                  /* Upload dropzone */
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: uploading ? G + "08" : "transparent",
                      border: `1.5px dashed ${uploading ? G + "60" : C?.border || "#2a2218"}`,
                      borderRadius: 8, padding: "20px 12px",
                      cursor: uploading ? "wait" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}
                  >
                    <span style={{ fontFamily: SANS, fontSize: 20, color: C?.grey || "#8a7d6a", opacity: 0.5 }}>+</span>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a" }}>
                      {uploading ? "Uploading..." : "Click to upload logo"}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 9, color: "#5a5045" }}>PNG, JPEG, WebP, SVG — max 5 MB</span>
                  </button>
                )}

                {uploadError && (
                  <div style={{ fontFamily: SANS, fontSize: 10, color: "#b04040", marginTop: 4 }}>{uploadError}</div>
                )}

                <NumRow label="Display size (px)" field="logo_size" cfg={cfg} set={set} min={20} max={200} C={C} />
              </div>
            )}
          </>
        )}

        <TextRow label="Est. line" field="brand_est_text" cfg={cfg} set={set} placeholder="Est. 2006 · Worldwide" C={C} />
        <TextRow label="Office location" field="brand_office_text" cfg={cfg} set={set} placeholder="Worldwide · London Headquarters" C={C} />
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
            <ColorRow label="Background" field="newsletter_bg" cfg={cfg} set={set} C={C} />
            <ColorRow label="Border color" field="newsletter_border_color" cfg={cfg} set={set} C={C} />
            <NumRow label="Padding top/bottom (px)" field="newsletter_pad_y" cfg={cfg} set={set} min={0} max={80} C={C} />
            <TextRow label="Label" field="newsletter_label" cfg={cfg} set={set} placeholder="The Editorial" C={C} />
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

      {/* ── Taigenic Signature ──────────────────────────────────────── */}
      <Section title="Taigenic Signature" C={C}>
        <ToggleRow label="Show signature" field="show_taigenic" cfg={cfg} set={set} C={C} />
        {cfg.show_taigenic && (
          <>
            <TextRow label="Symbol" field="taigenic_symbol" cfg={cfg} set={set} placeholder="✦" C={C} />
            <TextRow label="Top line" field="taigenic_label" cfg={cfg} set={set} placeholder="Powered by Taigenic.AI" C={C} />
            <TextRow label="Tagline" field="taigenic_tagline" cfg={cfg} set={set} placeholder="AI systems for luxury brands" C={C} />
            <TextRow label="Link URL" field="taigenic_url" cfg={cfg} set={set} placeholder="/taigenic" C={C} />
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
