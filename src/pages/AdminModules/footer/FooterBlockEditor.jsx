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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
  const [venueSearch, setVenueSearch]   = useState("");
  const [venueCategories, setVenueCategories] = useState([]);
  const [countries, setCountries]       = useState([]);
  const [magCategories, setMagCategories] = useState([]);
  const [allListings, setAllListings]   = useState([]); // for iconic_venues multi-select

  // Reset form when selection changes
  useEffect(() => {
    if (!item) { setForm(null); return; }
    setForm(itemToFooterForm(item));
    setSaved(false);
    setRecordSearch("");
    setVenueSearch("");
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

  // Load listings for iconic_venues multi-select
  useEffect(() => {
    if (!form || form.block_type !== "iconic_venues") return;
    supabase.from("listings").select("slug, name, country")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(200)
      .then(({ data }) => setAllListings(data || []));
  }, [form?.block_type]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Iconic Venues multi-select ─────────────────────────────────────────
  function renderVenueMultiSelect() {
    const selected = form.venue_slugs || [];
    const filtered = allListings.filter(l =>
      (l.name || "").toLowerCase().includes(venueSearch.toLowerCase()) ||
      (l.country || "").toLowerCase().includes(venueSearch.toLowerCase())
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={lbl}>Selected Venues ({selected.length})</label>
        {selected.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            {selected.map(slug => {
              const listing = allListings.find(l => l.slug === slug);
              const name = listing?.name || slug;
              return (
                <span key={slug} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: G + "18", border: `1px solid ${G}40`,
                  borderRadius: 5, padding: "3px 8px",
                  fontFamily: SANS, fontSize: 11, color: G,
                }}>
                  {name}
                  <button onClick={() => set("venue_slugs", selected.filter(s => s !== slug))} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: G, fontSize: 12, padding: 0, lineHeight: 1,
                  }}>✕</button>
                </span>
              );
            })}
          </div>
        )}
        <label style={lbl}>Add venues</label>
        <input
          value={venueSearch}
          onChange={e => setVenueSearch(e.target.value)}
          placeholder="Search venues..."
          style={inp}
        />
        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {filtered.slice(0, 50).map(l => {
            const isIn = selected.includes(l.slug);
            return (
              <button key={l.slug} onClick={() => {
                if (isIn) {
                  set("venue_slugs", selected.filter(s => s !== l.slug));
                } else {
                  set("venue_slugs", [...selected, l.slug]);
                }
              }} style={{
                background: isIn ? G + "14" : "transparent",
                border: `1px solid ${isIn ? G + "50" : C?.border || "#2a2218"}`,
                borderRadius: 5, padding: "6px 10px", textAlign: "left",
                color: isIn ? G : C?.off || "#d4c8b0",
                fontFamily: SANS, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  width: 14, height: 14, border: `1px solid ${isIn ? G : "#5a5045"}`,
                  borderRadius: 3, background: isIn ? G : "transparent",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 9, color: "#0a0906",
                }}>{isIn ? "✓" : ""}</span>
                <span>{l.name}</span>
                {l.country && (
                  <span style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginLeft: "auto" }}>
                    {l.country}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", padding: 8 }}>
              No venues found
            </div>
          )}
        </div>
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

        {/* Iconic venues multi-select */}
        {isIconic && renderVenueMultiSelect()}

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
