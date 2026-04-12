// footer/FooterBlockEditor.jsx
// Inline block editor — opens when a block row is selected in FooterColumnPanel.
// Syncs every keystroke to the canvas via onFormChange.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  SANS, SERIF,
  BLOCK_TYPE_OPTIONS, BLOCK_BADGE_DEF,
  LINK_TYPE_OPTIONS, INTERNAL_PAGES, buildLinkUrl,
  itemToFooterForm, blankFooterItem,
  ICONIC_STRIP_COL, BRAND_COL, BOTTOM_BAR_COL,
} from "./footerUtils.js";


// ── Empty state (nothing selected) ────────────────────────────────────────
function EmptyState({ C }) {
  return (
    <div style={{
      padding: "32px 20px", textAlign: "center",
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10,
    }}>
      <div style={{ fontFamily: SERIF, fontSize: 18, color: C?.off || "#d4c8b0", marginBottom: 8 }}>
        Select a block to edit
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", lineHeight: 1.6 }}>
        Click any block in the panel above, or click a section in the canvas.
      </div>
    </div>
  );
}

// ── Auto block info note ───────────────────────────────────────────────────
function AutoNote({ text, C }) {
  return (
    <div style={{
      background: "#0a2218", border: "1px solid #1a5c3a",
      borderRadius: 7, padding: "12px 14px",
      fontFamily: SANS, fontSize: 12, color: "#4ade80", lineHeight: 1.6,
    }}>{text}</div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
export default function FooterBlockEditor({
  item,           // null = nothing selected
  onSave,
  onClose,
  onFormChange,
  C,
}) {
  const G = C?.gold || "#c9a84c";
  const [form, setForm]               = useState(item ? itemToFooterForm(item) : null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [venueCategories, setVenueCategories] = useState([]);
  const [countries, setCountries]       = useState([]);
  const [magCategories, setMagCategories] = useState([]);

  // Reset form when selection changes
  useEffect(() => {
    if (!item) { setForm(null); return; }
    setForm(itemToFooterForm(item));
    setSaved(false);
    setRecordSearch("");
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync every keystroke to canvas
  useEffect(() => {
    if (onFormChange && form) onFormChange(form);
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load dynamic records for link types
  useEffect(() => {
    if (!form) return;
    const lt = form.link_type;
    if (lt === "category") {
      supabase.from("listings").select("category").not("category", "is", null)
        .then(({ data }) => {
          setVenueCategories([...new Set((data || []).map(r => r.category))].filter(Boolean).sort());
        });
    } else if (lt === "country") {
      supabase.from("listings").select("country").not("country", "is", null)
        .then(({ data }) => {
          setCountries([...new Set((data || []).map(r => r.country))].filter(Boolean).sort());
        });
    } else if (lt === "mag_category") {
      supabase.from("magazine_categories").select("id, slug, name")
        .is("parent_category_slug", null)
        .order("name", { ascending: true })
        .then(({ data }) => setMagCategories(data || []));
    }
  }, [form?.link_type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !form) return <EmptyState C={C} />;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLinkTypeChange = val => {
    setRecordSearch("");
    setForm(f => ({
      ...f,
      link_type: val,
      link_record_slug: "",
      url: val === "parent_only" ? "" : f.url,
    }));
  };

  const handleRecordSelect = (slug) => {
    const url = buildLinkUrl(form.link_type, slug);
    setForm(f => ({ ...f, link_record_slug: slug, url }));
  };

  async function handleSave() {
    setSaving(true); setSaved(false);
    await onSave({ ...item, ...form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  // ── Style tokens ──────────────────────────────────────────────────────
  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: SANS, fontSize: 13, padding: "7px 11px", outline: "none",
  };
  const lbl = {
    fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 4, display: "block",
  };
  const hint = { fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 3, lineHeight: 1.5 };
  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  const isLink    = form.block_type === "link";
  const isHeading = form.block_type === "heading";
  const isText    = form.block_type === "text";
  const isIconic  = form.block_type === "iconic_venues";
  const isAuto    = ["category_list", "country_list", "mag_list"].includes(form.block_type);
  const isBottomBar = form.column_id === BOTTOM_BAR_COL;

  // Block type badge
  const badgeDef = BLOCK_BADGE_DEF[form.block_type] || BLOCK_BADGE_DEF.link;

  // ── Searchable record picker ──────────────────────────────────────────
  function renderRecordPicker(records, displayFn = x => x, slugFn = x => x) {
    const filtered = records.filter(r =>
      displayFn(r).toLowerCase().includes(recordSearch.toLowerCase())
    );
    return (
      <div>
        <input
          value={recordSearch}
          onChange={e => setRecordSearch(e.target.value)}
          placeholder="Search..."
          style={{ ...inp, marginBottom: 8 }}
        />
        <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.length === 0 && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", padding: 8 }}>
              No results
            </div>
          )}
          {filtered.map((r, i) => {
            const slug = slugFn(r);
            const display = displayFn(r);
            const isActive = form.link_record_slug === slug;
            return (
              <button key={i} onClick={() => handleRecordSelect(slug)} style={{
                background: isActive ? G + "18" : "transparent",
                border: `1px solid ${isActive ? G + "50" : C?.border || "#2a2218"}`,
                borderRadius: 5, padding: "6px 10px", textAlign: "left",
                color: isActive ? G : C?.off || "#d4c8b0",
                fontFamily: SANS, fontSize: 12, cursor: "pointer",
              }}>{display}</button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Iconic Venues editorial editor ────────────────────────────────────
  function renderVenueManualEditor() {
    const entries = form.iconic_venues || [];

    const updateEntry = (i, field, val) => {
      const next = entries.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
      set("iconic_venues", next);
    };
    const removeEntry = (i) => set("iconic_venues", entries.filter((_, idx) => idx !== i));
    const moveUp   = (i) => {
      if (i === 0) return;
      const next = [...entries];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      set("iconic_venues", next);
    };
    const moveDown = (i) => {
      if (i === entries.length - 1) return;
      const next = [...entries];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      set("iconic_venues", next);
    };
    const addEntry = () => set("iconic_venues", [...entries, { name: "", url: "" }]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", lineHeight: 1.6 }}>
          A curated selection of venues presented as a brand showcase. Add venue names and optional links.
        </div>

        {entries.map((entry, i) => (
          <div key={i} style={{
            background: C?.dark || "#0d0d0d",
            border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 7, padding: "10px 12px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: SANS, fontSize: 9, color: "#5a5045", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Venue {i + 1}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#2a2218" : "#5a5045", fontSize: 11, padding: "1px 3px" }}>▲</button>
                <button onClick={() => moveDown(i)} disabled={i === entries.length - 1} style={{ background: "none", border: "none", cursor: i === entries.length - 1 ? "default" : "pointer", color: i === entries.length - 1 ? "#2a2218" : "#5a5045", fontSize: 11, padding: "1px 3px" }}>▼</button>
                <button onClick={() => removeEntry(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5a3030", fontSize: 13, padding: "1px 4px", lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "#5a3030"}
                >✕</button>
              </div>
            </div>
            <input
              value={entry.name}
              onChange={e => updateEntry(i, "name", e.target.value)}
              placeholder="Venue name (e.g. Villa d'Este)"
              style={inp}
            />
            <input
              value={entry.url || ""}
              onChange={e => updateEntry(i, "url", e.target.value)}
              placeholder="Link (optional — /path or https://...)"
              style={{ ...inp, opacity: 0.7 }}
            />
          </div>
        ))}

        <button
          onClick={addEntry}
          style={{
            background: "none", border: `1px dashed ${G}40`,
            borderRadius: 7, padding: "9px 0", textAlign: "center",
            color: G, fontFamily: SANS, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.06em", cursor: "pointer",
            transition: "border-color 120ms, background 120ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G + "80"; e.currentTarget.style.background = G + "08"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G + "40"; e.currentTarget.style.background = "none"; }}
        >
          + Add Venue
        </button>
      </div>
    );
  }

  // ── Block type picker ─────────────────────────────────────────────────
  // Only shown for columns 2-4 and bottom bar (not iconic strip)
  const showBlockTypePicker = form.column_id !== ICONIC_STRIP_COL;
  // Bottom bar only allows link blocks
  const availableBlockTypes = isBottomBar
    ? BLOCK_TYPE_OPTIONS.filter(b => b.value === "link")
    : BLOCK_TYPE_OPTIONS.filter(b => b.value !== "iconic_venues" || form.column_id === ICONIC_STRIP_COL);

  return (
    <div style={{
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10, overflow: "hidden",
    }}>

      {/* Editor header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: `1px solid ${C?.border || "#2a2218"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: badgeDef.color,
            background: badgeDef.bg, border: `1px solid ${badgeDef.border}`,
            borderRadius: 4, padding: "2px 7px",
          }}>{badgeDef.label}</span>
          <span style={{ fontFamily: SERIF, fontSize: 16, color: C?.off || "#d4c8b0" }}>
            {form.label || form.content?.slice(0, 28) || form.block_type}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C?.grey || "#8a7d6a", fontSize: 16, lineHeight: 1,
          }}>✕</button>
        )}
      </div>

      {/* Editor body */}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Block type picker — not for iconic strip */}
        {showBlockTypePicker && (
          <div>
            <label style={lbl}>Block Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
              {availableBlockTypes.map(opt => {
                const active = form.block_type === opt.value;
                const bdef = BLOCK_BADGE_DEF[opt.value] || BLOCK_BADGE_DEF.link;
                return (
                  <button key={opt.value} onClick={() => set("block_type", opt.value)} style={{
                    background: active ? bdef.bg : "transparent",
                    border: `1px solid ${active ? bdef.border : C?.border || "#2a2218"}`,
                    borderRadius: 6, padding: "7px 8px", textAlign: "left",
                    cursor: "pointer", transition: "all 120ms",
                  }}>
                    <div style={{
                      fontFamily: SANS, fontSize: 10, fontWeight: 700,
                      color: active ? bdef.color : C?.grey || "#8a7d6a",
                      marginBottom: 2,
                    }}>{opt.label}</div>
                    <div style={{
                      fontFamily: SANS, fontSize: 9,
                      color: active ? bdef.color + "aa" : "#5a5045",
                    }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto block info */}
        {isAuto && (
          <AutoNote
            text={
              form.block_type === "category_list"
                ? "Auto-populated from venue categories in the database. No configuration needed."
                : form.block_type === "country_list"
                  ? "Auto-populated from destinations in the database. No configuration needed."
                  : "Auto-populated from magazine sections in the database. No configuration needed."
            }
            C={C}
          />
        )}

        {/* Iconic venues editorial editor */}
        {isIconic && renderVenueManualEditor()}

        {/* Heading / Text content */}
        {(isHeading || isText) && (
          <div>
            <label style={lbl}>{isHeading ? "Heading Text" : "Text Content"}</label>
            <textarea
              value={form.content}
              onChange={e => set("content", e.target.value)}
              rows={isHeading ? 1 : 3}
              placeholder={isHeading ? "e.g. For Couples" : "Free text content..."}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>
        )}

        {/* Link block fields */}
        {isLink && (
          <>
            <div>
              <label style={lbl}>Label</label>
              <input
                value={form.label}
                onChange={e => set("label", e.target.value)}
                placeholder="Link label"
                style={inp}
              />
            </div>

            {/* Link type grid */}
            <div>
              <label style={lbl}>Link Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5, marginBottom: 12 }}>
                {LINK_TYPE_OPTIONS.filter(o => o.value !== "spa_action" && o.value !== "parent_only").map(opt => {
                  const active = form.link_type === opt.value;
                  return (
                    <button key={opt.value} onClick={() => handleLinkTypeChange(opt.value)} style={{
                      background: active ? G + "18" : "transparent",
                      border: `1px solid ${active ? G + "70" : C?.border || "#2a2218"}`,
                      borderRadius: 6, padding: "7px 10px", textAlign: "left",
                      cursor: "pointer", transition: "all 120ms",
                    }}>
                      <div style={{
                        fontFamily: SANS, fontSize: 10, fontWeight: 700,
                        color: active ? G : C?.off || "#d4c8b0", marginBottom: 2,
                      }}>{opt.label}</div>
                      <div style={{
                        fontFamily: SANS, fontSize: 9,
                        color: active ? G + "aa" : C?.grey2 || "#5a5045",
                      }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Manual URL */}
              {form.link_type === "manual" && (
                <div>
                  <label style={lbl}>URL</label>
                  <input
                    value={form.url}
                    onChange={e => set("url", e.target.value)}
                    placeholder="https://... or /path"
                    style={inp}
                  />
                </div>
              )}

              {/* Internal page picker */}
              {form.link_type === "internal" && (
                <div>
                  <label style={lbl}>Select Page</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {INTERNAL_PAGES.map(pg => {
                      const active = form.link_record_slug === pg.slug;
                      return (
                        <button key={pg.slug} onClick={() => handleRecordSelect(pg.slug)} style={{
                          background: active ? G + "18" : "transparent",
                          border: `1px solid ${active ? G + "50" : C?.border || "#2a2218"}`,
                          borderRadius: 5, padding: "6px 10px", textAlign: "left",
                          color: active ? G : C?.off || "#d4c8b0",
                          fontFamily: SANS, fontSize: 12, cursor: "pointer",
                        }}>{pg.label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category picker */}
              {form.link_type === "category" && (
                <div>
                  <label style={lbl}>Select Category</label>
                  {renderRecordPicker(venueCategories, x => x, x => x)}
                </div>
              )}

              {/* Country picker */}
              {form.link_type === "country" && (
                <div>
                  <label style={lbl}>Select Country</label>
                  {renderRecordPicker(countries, x => x, x => x)}
                </div>
              )}

              {/* Magazine category picker */}
              {form.link_type === "mag_category" && (
                <div>
                  <label style={lbl}>Select Magazine Section</label>
                  {renderRecordPicker(magCategories, r => r.name, r => r.slug)}
                </div>
              )}
            </div>

            {/* Open in new tab */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.open_new_tab}
                onChange={e => set("open_new_tab", e.target.checked)}
                id="footer-newtab"
                style={{ accentColor: G }}
              />
              <label htmlFor="footer-newtab" style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", cursor: "pointer" }}>
                Open in new tab
              </label>
            </div>
          </>
        )}

        {/* Visible toggle (all block types) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={e => set("visible", e.target.checked)}
            id="footer-visible"
            style={{ accentColor: G }}
          />
          <label htmlFor="footer-visible" style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", cursor: "pointer" }}>
            Visible
          </label>
        </div>

      </div>

      {/* Save footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        borderTop: `1px solid ${C?.border || "#2a2218"}`,
        marginTop: 14,
      }}>
        <div style={{ fontFamily: SANS, fontSize: 11, color: saved ? "#4ade80" : "transparent" }}>
          {saved ? "Saved" : ""}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: G, border: "none", borderRadius: 7,
            color: "#0a0906", padding: "9px 22px",
            fontFamily: SANS, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >{saving ? "Saving..." : "Save Block"}</button>
      </div>
    </div>
  );
}
