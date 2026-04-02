// ─── src/pages/LocationStudio/LocationBuilder.jsx ────────────────────────────
// Location Studio builder — left panel (section cards) + right panel (live preview)
// Two page types: "hub" (city/region/country) | "category" (region×category)
import { useState, useMemo, useCallback } from "react";
import LocationPage from "../LocationPage";
import RegionCategoryPage from "../RegionCategoryPage";
import {
  saveLocationContent,
  publishLocationContent,
  normaliseLocationRow,
  buildLocationKey,
} from "../../services/locationContentService";
import { COUNTRIES, REGIONS, CITIES, VENDOR_CATEGORIES } from "../../data/geo";
import { DIRECTORY_REGIONS } from "../../data/directoryRegions.js";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Light palette for left panel ─────────────────────────────────────────────
function lsPalette(darkMode) {
  if (darkMode) return {
    bg: "#0f0f0f", card: "#161616", border: "#2a2a2a", text: "#ffffff",
    muted: "#999999", gold: "#C9A84C", btn: "#ffffff", btnTxt: "#000000",
  };
  return {
    bg: "#F2EFE9", card: "#F8F6F2", border: "#D9D2C6", text: "#222222",
    muted: "#777777", gold: "#8A6A18", btn: "#1a1a1a", btnTxt: "#ffffff",
  };
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function SCard({ title, hint, children, visible, onToggle, LS }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: LS.card, border: `1px solid ${LS.border}`, borderRadius: 4, marginBottom: 12 }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: LS.gold }}>
            {title}
          </span>
          {onToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              style={{
                fontFamily: NU, fontSize: 9, padding: "2px 8px", borderRadius: 10,
                background: visible ? "rgba(95,173,122,0.2)" : "rgba(180,100,100,0.15)",
                color: visible ? "#5fad7a" : "#c46060",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              {visible ? "ON" : "OFF"}
            </button>
          )}
        </div>
        <span style={{ fontFamily: NU, fontSize: 10, color: LS.muted }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {hint && <p style={{ fontFamily: NU, fontSize: 11, color: LS.muted, margin: "0 0 12px", lineHeight: 1.5 }}>{hint}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function Field({ label, children, LS }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: LS.muted, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, LS }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 10px", fontFamily: NU, fontSize: 13,
        background: LS.bg, border: `1px solid ${LS.border}`, borderRadius: 3,
        color: LS.text, outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, LS }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "8px 10px", fontFamily: NU, fontSize: 13,
        background: LS.bg, border: `1px solid ${LS.border}`, borderRadius: 3,
        color: LS.text, outline: "none", resize: "vertical", boxSizing: "border-box",
      }}
    />
  );
}

// ── New location form ─────────────────────────────────────────────────────────
function NewLocationForm({ LS, onCreated }) {
  const [pageType, setPageType] = useState("hub");
  const [locationType, setLocationType] = useState("city");
  const [countrySlug, setCountrySlug] = useState("");
  const [regionSlug, setRegionSlug] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      let locationKey, locationSlug;
      if (pageType === "hub") {
        if (locationType === "country")  { locationKey = buildLocationKey("country", countrySlug); locationSlug = countrySlug; }
        else if (locationType === "region") { locationKey = buildLocationKey("region", regionSlug, countrySlug); locationSlug = regionSlug; }
        else { locationKey = buildLocationKey("city", citySlug, countrySlug, regionSlug); locationSlug = citySlug; }
      } else {
        locationKey = buildLocationKey("category", categorySlug, countrySlug, regionSlug);
        locationSlug = categorySlug;
      }

      if (!locationKey) { setError("Please fill in all required fields."); setSaving(false); return; }

      const result = await saveLocationContent({
        locationKey,
        locationType: pageType === "category" ? "region" : locationType,
        pageType,
        countrySlug,
        regionSlug: regionSlug || null,
        citySlug: citySlug || null,
        categorySlug: pageType === "category" ? categorySlug : null,
        heroTitle: heroTitle || locationSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      });

      if (result.error) { setError("Failed to create location."); setSaving(false); return; }
      onCreated(result.data);
    } catch (e) {
      setError("An error occurred.");
    }
    setSaving(false);
  }

  const selectStyle = {
    width: "100%", padding: "8px 10px", fontFamily: NU, fontSize: 13,
    background: LS.bg, border: `1px solid ${LS.border}`, borderRadius: 3,
    color: LS.text, outline: "none", cursor: "pointer",
  };

  const hubTypes = [
    { v: "country", l: "Country" }, { v: "region", l: "Region" },
    { v: "city", l: "City / Area" },
  ];
  const catCategories = VENDOR_CATEGORIES || [];

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontFamily: GD, fontSize: 20, fontStyle: "italic", color: LS.text, margin: "0 0 24px" }}>
        Create new location
      </p>

      <Field label="Page type" LS={LS}>
        <select value={pageType} onChange={(e) => setPageType(e.target.value)} style={selectStyle}>
          <option value="hub">Location Hub — city, region, country pages</option>
          <option value="category">Location Category — region × category pages</option>
        </select>
      </Field>

      {pageType === "hub" && (
        <Field label="Location type" LS={LS}>
          <select value={locationType} onChange={(e) => setLocationType(e.target.value)} style={selectStyle}>
            {hubTypes.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </Field>
      )}

      <Field label="Country slug" LS={LS}>
        <Input value={countrySlug} onChange={setCountrySlug} placeholder="e.g. italy, england, france" LS={LS} />
      </Field>

      {(pageType === "category" || locationType === "region" || locationType === "city") && (
        <Field label="Region slug" LS={LS}>
          <Input value={regionSlug} onChange={setRegionSlug} placeholder="e.g. tuscany, lake-como, london" LS={LS} />
        </Field>
      )}

      {pageType === "hub" && locationType === "city" && (
        <Field label="City slug" LS={LS}>
          <Input value={citySlug} onChange={setCitySlug} placeholder="e.g. florence, siena" LS={LS} />
        </Field>
      )}

      {pageType === "category" && (
        <Field label="Category slug" LS={LS}>
          {catCategories.length > 0 ? (
            <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} style={selectStyle}>
              <option value="">Select category…</option>
              {catCategories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          ) : (
            <Input value={categorySlug} onChange={setCategorySlug} placeholder="e.g. wedding-planners, photographers" LS={LS} />
          )}
        </Field>
      )}

      <Field label="Display name" LS={LS}>
        <Input value={heroTitle} onChange={setHeroTitle} placeholder="e.g. Weddings in London" LS={LS} />
      </Field>

      {error && <p style={{ fontFamily: NU, fontSize: 12, color: "#c46060", margin: "0 0 12px" }}>{error}</p>}

      <button
        onClick={handleCreate}
        disabled={saving}
        style={{
          fontFamily: NU, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "10px 24px",
          background: LS.btn, color: LS.btnTxt, border: "none", borderRadius: 3,
          cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Creating…" : "Create Location"}
      </button>
    </div>
  );
}

// ── Hub section cards ─────────────────────────────────────────────────────────
function HubSections({ form, set, LS }) {
  const upd = (key) => (val) => set((f) => ({ ...f, [key]: val }));
  const toggleSection = (key) => () => set((f) => ({ ...f, [key]: !f[key] }));

  return (
    <>
      {/* Hero */}
      <SCard title="Hero" hint="Full-bleed background image or video with title and stats." LS={LS}>
        <Field label="Display title" LS={LS}>
          <Input value={form.heroTitle} onChange={upd("heroTitle")} placeholder="e.g. Weddings in London" LS={LS} />
        </Field>
        <Field label="Subtitle" LS={LS}>
          <Textarea value={form.heroSubtitle} onChange={upd("heroSubtitle")} placeholder="A short editorial line under the title." rows={2} LS={LS} />
        </Field>
        <Field label="Hero image URL" LS={LS}>
          <Input value={form.heroImage} onChange={upd("heroImage")} placeholder="https://…" LS={LS} />
        </Field>
        <Field label="Hero video URL (optional)" LS={LS}>
          <Input value={form.heroVideo} onChange={upd("heroVideo")} placeholder="https://…" LS={LS} />
        </Field>
        <Field label="CTA button text" LS={LS}>
          <Input value={form.ctaText} onChange={upd("ctaText")} placeholder="Explore Venues" LS={LS} />
        </Field>
        <Field label="CTA link" LS={LS}>
          <Input value={form.ctaLink} onChange={upd("ctaLink")} placeholder="#" LS={LS} />
        </Field>
      </SCard>

      {/* Editorial Split */}
      <SCard
        title="Editorial Split"
        hint="Left-side editorial copy paired with a venue image."
        visible={form.showEditorialSplit}
        onToggle={toggleSection("showEditorialSplit")}
        LS={LS}
      >
        <Field label="Eyebrow label" LS={LS}>
          <Input value={form.editorialEyebrow} onChange={upd("editorialEyebrow")} placeholder="e.g. The Art of the London Wedding" LS={LS} />
        </Field>
        <Field label="Heading prefix" LS={LS}>
          <Input value={form.editorialHeadingPrefix} onChange={upd("editorialHeadingPrefix")} placeholder="e.g. The Capital of" LS={LS} />
        </Field>
        <Field label="CTA text" LS={LS}>
          <Input value={form.editorialCtaText} onChange={upd("editorialCtaText")} placeholder="e.g. Browse all London venues →" LS={LS} />
        </Field>
        <Field label="Paragraph 1" LS={LS}>
          <Textarea value={form.editorialPara1} onChange={upd("editorialPara1")} rows={4} LS={LS} />
        </Field>
        <Field label="Paragraph 2" LS={LS}>
          <Textarea value={form.editorialPara2} onChange={upd("editorialPara2")} rows={4} LS={LS} />
        </Field>
      </SCard>

      {/* Latest Venues */}
      <SCard
        title="Latest Venues Strip"
        visible={form.showLatestVenues}
        onToggle={toggleSection("showLatestVenues")}
        LS={LS}
      >
        <Field label="Heading" LS={LS}>
          <Input value={form.latestVenuesHeading} onChange={upd("latestVenuesHeading")} placeholder="Latest Venues." LS={LS} />
        </Field>
        <Field label="Subtext" LS={LS}>
          <Textarea value={form.latestVenuesSub} onChange={upd("latestVenuesSub")} rows={2} LS={LS} />
        </Field>
        <Field label="Card style" LS={LS}>
          <select
            value={form.latestVenuesCardStyle || "luxury"}
            onChange={(e) => set((f) => ({ ...f, latestVenuesCardStyle: e.target.value }))}
            style={{ width: "100%", padding: "8px 10px", fontFamily: NU, fontSize: 13, background: LS.bg, border: `1px solid ${LS.border}`, borderRadius: 3, color: LS.text }}
          >
            <option value="luxury">Luxury</option>
            <option value="standard">Standard</option>
          </select>
        </Field>
      </SCard>

      {/* Latest Vendors */}
      <SCard
        title="Latest Vendors Strip"
        visible={form.showLatestVendors}
        onToggle={toggleSection("showLatestVendors")}
        LS={LS}
      >
        <Field label="Heading" LS={LS}>
          <Input value={form.latestVendorsHeading} onChange={upd("latestVendorsHeading")} placeholder="Latest Vendors." LS={LS} />
        </Field>
        <Field label="Subtext" LS={LS}>
          <Textarea value={form.latestVendorsSub} onChange={upd("latestVendorsSub")} rows={2} LS={LS} />
        </Field>
        <Field label="Card style" LS={LS}>
          <select
            value={form.latestVendorsCardStyle || "luxury"}
            onChange={(e) => set((f) => ({ ...f, latestVendorsCardStyle: e.target.value }))}
            style={{ width: "100%", padding: "8px 10px", fontFamily: NU, fontSize: 13, background: LS.bg, border: `1px solid ${LS.border}`, borderRadius: 3, color: LS.text }}
          >
            <option value="luxury">Luxury</option>
            <option value="standard">Standard</option>
          </select>
        </Field>
      </SCard>

      {/* Featured */}
      <SCard title="Featured" hint="Pin up to 6 specific venues and vendors to appear in the featured slots." LS={LS}>
        <Field label="Featured venues section title" LS={LS}>
          <Input value={form.featuredVenuesTitle} onChange={upd("featuredVenuesTitle")} placeholder="Signature Venues" LS={LS} />
        </Field>
        <Field label="Featured venue IDs (comma-separated)" LS={LS}>
          <Textarea
            value={(form.featuredVenueIds || []).join(", ")}
            onChange={(v) => set((f) => ({ ...f, featuredVenueIds: v.split(",").map((s) => s.trim()).filter(Boolean) }))}
            rows={2} LS={LS}
          />
        </Field>
        <Field label="Featured vendors section title" LS={LS}>
          <Input value={form.featuredVendorsTitle} onChange={upd("featuredVendorsTitle")} placeholder="Top Wedding Planners" LS={LS} />
        </Field>
        <Field label="Featured vendor IDs (comma-separated)" LS={LS}>
          <Textarea
            value={(form.featuredVendorIds || []).join(", ")}
            onChange={(v) => set((f) => ({ ...f, featuredVendorIds: v.split(",").map((s) => s.trim()).filter(Boolean) }))}
            rows={2} LS={LS}
          />
        </Field>
      </SCard>

      {/* Motto */}
      <SCard
        title="Motto Strip"
        visible={form.showMotto}
        onToggle={toggleSection("showMotto")}
        LS={LS}
      >
        <Field label="Quote" LS={LS}>
          <Textarea value={form.motto} onChange={upd("motto")} placeholder="The world's finest venues…" rows={2} LS={LS} />
        </Field>
        <Field label="Sub line" LS={LS}>
          <Input value={form.mottoSubline} onChange={upd("mottoSubline")} placeholder="Personally vetted. Always editorial." LS={LS} />
        </Field>
        <Field label="Background image URL" LS={LS}>
          <Input value={form.mottoBgImage} onChange={upd("mottoBgImage")} placeholder="https://…" LS={LS} />
        </Field>
        <Field label="Overlay opacity (0–1)" LS={LS}>
          <Input value={form.mottoOverlay} onChange={(v) => set((f) => ({ ...f, mottoOverlay: parseFloat(v) || 0.55 }))} placeholder="0.55" LS={LS} />
        </Field>
      </SCard>

      {/* SEO Block */}
      <SCard
        title="Planning Guide / SEO Block"
        visible={form.showPlanningGuide}
        onToggle={toggleSection("showPlanningGuide")}
        LS={LS}
      >
        <Field label="Section heading" LS={LS}>
          <Input value={form.seoHeading} onChange={upd("seoHeading")} placeholder="e.g. Planning your London wedding" LS={LS} />
        </Field>
        <Field label="Body content" LS={LS}>
          <Textarea value={form.seoContent} onChange={upd("seoContent")} rows={6} LS={LS} />
        </Field>
      </SCard>

      {/* SEO */}
      <SCard title="SEO" hint="Meta title and description for search engines." LS={LS}>
        <Field label="Page title" LS={LS}>
          <Input value={form.seoTitle} onChange={upd("seoTitle")} placeholder="Luxury Wedding Venues in London | LWD" LS={LS} />
        </Field>
        <Field label="Meta description" LS={LS}>
          <Textarea value={form.seoDescription} onChange={upd("seoDescription")} rows={3} LS={LS} />
        </Field>
      </SCard>
    </>
  );
}

// ── Category section cards ────────────────────────────────────────────────────
function CategorySections({ form, set, LS }) {
  const upd = (key) => (val) => set((f) => ({ ...f, [key]: val }));
  const toggleSection = (key) => () => set((f) => ({ ...f, [key]: !f[key] }));

  return (
    <>
      {/* Hero */}
      <SCard title="Hero" hint="Overrides the auto-generated hero title and background image." LS={LS}>
        <Field label="Hero title (optional override)" LS={LS}>
          <Input value={form.heroTitle} onChange={upd("heroTitle")} placeholder="Auto: '{Category} in {Region}'" LS={LS} />
        </Field>
        <Field label="Hero image URL" LS={LS}>
          <Input value={form.heroImage} onChange={upd("heroImage")} placeholder="https://… (defaults to region hero)" LS={LS} />
        </Field>
      </SCard>

      {/* Why Hire */}
      <SCard
        title="Why Hire Section"
        hint="Editorial section explaining the value of this vendor category."
        visible={form.showWhyHire}
        onToggle={toggleSection("showWhyHire")}
        LS={LS}
      >
        <Field label="Section label" LS={LS}>
          <Input value={form.whyHireLabel} onChange={upd("whyHireLabel")} placeholder="e.g. Why Hire a Wedding Planner" LS={LS} />
        </Field>
        <Field label="Headline" LS={LS}>
          <Input value={form.whyHireHeadline} onChange={upd("whyHireHeadline")} placeholder="e.g. The difference between a wedding and an" LS={LS} />
        </Field>
        <Field label="Headline (italic ending)" LS={LS}>
          <Input value={form.whyHireHeadlineItalic} onChange={upd("whyHireHeadlineItalic")} placeholder="e.g. unforgettable celebration" LS={LS} />
        </Field>
        <Field label="Paragraph 1" LS={LS}>
          <Textarea value={form.whyHirePara1} onChange={upd("whyHirePara1")} rows={4} LS={LS} />
        </Field>
        <Field label="Paragraph 2" LS={LS}>
          <Textarea value={form.whyHirePara2} onChange={upd("whyHirePara2")} rows={4} LS={LS} />
        </Field>
        <Field label="Trust badges (JSON array)" LS={LS}>
          <Textarea
            value={typeof form.whyHireBadges === "string" ? form.whyHireBadges : JSON.stringify(form.whyHireBadges || [], null, 2)}
            onChange={(v) => {
              let parsed = v;
              try { parsed = JSON.parse(v); } catch (e) {}
              set((f) => ({ ...f, whyHireBadges: parsed }));
            }}
            placeholder='[{"label":"Personally Vetted","desc":"Every planner…"}]'
            rows={5}
            LS={LS}
          />
        </Field>
      </SCard>

      {/* Editorial Intro */}
      <SCard
        title="Editorial Intro"
        visible={form.showCategoryEditorial}
        onToggle={toggleSection("showCategoryEditorial")}
        LS={LS}
      >
        <Field label="Section label" LS={LS}>
          <Input value={form.categoryEditorialLabel} onChange={upd("categoryEditorialLabel")} placeholder="Editorial" LS={LS} />
        </Field>
        <Field label="Heading (optional override)" LS={LS}>
          <Input value={form.categoryEditorialHeading} onChange={upd("categoryEditorialHeading")} placeholder="Auto: '{Category} in {Region}'" LS={LS} />
        </Field>
        <Field label="Body copy" LS={LS}>
          <Textarea value={form.categoryEditorialBody} onChange={upd("categoryEditorialBody")} rows={6} LS={LS} />
        </Field>
      </SCard>

      {/* Featured Strip */}
      <SCard title="Featured Strip" hint="Pin specific listings to appear in the featured horizontal slider." LS={LS}>
        <Field label="Heading" LS={LS}>
          <Input value={form.categoryFeaturedHeading} onChange={upd("categoryFeaturedHeading")} placeholder="Featured Planners" LS={LS} />
        </Field>
        <Field label="Subtext" LS={LS}>
          <Textarea value={form.categoryFeaturedSub} onChange={upd("categoryFeaturedSub")} rows={2} LS={LS} />
        </Field>
        <Field label="Pinned listing IDs (comma-separated)" LS={LS}>
          <Textarea
            value={(form.categoryFeaturedIds || []).join(", ")}
            onChange={(v) => set((f) => ({ ...f, categoryFeaturedIds: v.split(",").map((s) => s.trim()).filter(Boolean) }))}
            rows={2} LS={LS}
          />
        </Field>
      </SCard>

      {/* Real Weddings */}
      <SCard
        title="Real Weddings Gallery"
        visible={form.showRealWeddings}
        onToggle={toggleSection("showRealWeddings")}
        LS={LS}
      >
        <Field label="Section label" LS={LS}>
          <Input value={form.realWeddingsLabel} onChange={upd("realWeddingsLabel")} placeholder="The Latest Masterpieces" LS={LS} />
        </Field>
        <Field label="Heading" LS={LS}>
          <Input value={form.realWeddingsHeading} onChange={upd("realWeddingsHeading")} placeholder="Real Weddings by Our Featured Planners" LS={LS} />
        </Field>
        <Field label="Post IDs (comma-separated)" LS={LS}>
          <Textarea
            value={(form.realWeddingsPostIds || []).join(", ")}
            onChange={(v) => set((f) => ({ ...f, realWeddingsPostIds: v.split(",").map((s) => s.trim()).filter(Boolean) }))}
            rows={2} LS={LS}
          />
        </Field>
      </SCard>

      {/* SEO */}
      <SCard title="SEO" hint="Meta title and description for search engines." LS={LS}>
        <Field label="Page title" LS={LS}>
          <Input value={form.seoTitle} onChange={upd("seoTitle")} placeholder="Wedding Planners in Lake Como | LWD" LS={LS} />
        </Field>
        <Field label="Meta description" LS={LS}>
          <Textarea value={form.seoDescription} onChange={upd("seoDescription")} rows={3} LS={LS} />
        </Field>
      </SCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────────────────────────────────────────
export default function LocationBuilder({ record, darkMode, C, onBack }) {
  const LS = lsPalette(darkMode);

  const isNew = !record;
  const [created, setCreated] = useState(isNew ? null : record);

  // Initialise form from record
  const [form, setForm] = useState(() => {
    if (!record) return {};
    return normaliseLocationRow(record);
  });

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [viewMode, setViewMode] = useState("split"); // "split" | "editor" | "preview"

  const activeRecord = created || record;
  const pageType = activeRecord?.page_type || form.pageType || "hub";

  // ── When a new record is created, seed the form ──────────────────────────
  function handleCreated(row) {
    setCreated(row);
    setForm(normaliseLocationRow(row));
  }

  // ── Save draft ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!activeRecord) return;
    setSaving(true);
    setSaveMsg(null);
    const result = await saveLocationContent({
      ...form,
      locationKey: activeRecord.location_key,
      locationType: activeRecord.location_type,
      pageType: pageType,
      countrySlug: activeRecord.country_slug,
      regionSlug: activeRecord.region_slug || null,
      citySlug: activeRecord.city_slug || null,
      categorySlug: activeRecord.category_slug || null,
    });
    setSaving(false);
    setSaveMsg(result.error ? "Save failed." : "Saved.");
    setTimeout(() => setSaveMsg(null), 2000);
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!activeRecord) return;
    setPublishing(true);
    // Save first, then publish
    await saveLocationContent({
      ...form,
      locationKey: activeRecord.location_key,
      locationType: activeRecord.location_type,
      pageType, countrySlug: activeRecord.country_slug,
      regionSlug: activeRecord.region_slug || null,
      citySlug: activeRecord.city_slug || null,
      categorySlug: activeRecord.category_slug || null,
    });
    await publishLocationContent(activeRecord.location_key);
    setPublishing(false);
    setSaveMsg("Published!");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  // ── Build live preview content ────────────────────────────────────────────
  // For LocationPage: pass as locationContent prop
  // For RegionCategoryPage: pass as studioContent prop
  const liveContent = useMemo(() => ({
    ...form,
    featuredVenueIds:  form.featuredVenueIds  || [],
    featuredVendorIds: form.featuredVendorIds || [],
  }), [form]);

  // ── Toolbar styles ────────────────────────────────────────────────────────
  const btnFill = { fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 18px", background: LS.btn, color: LS.btnTxt, border: "none", borderRadius: 3, cursor: "pointer" };
  const btnOutline = { ...btnFill, background: "transparent", color: LS.text, border: `1px solid ${LS.border}` };
  const btnText = { fontFamily: NU, fontSize: 11, color: LS.muted, background: "none", border: "none", cursor: "pointer", padding: "8px 4px" };
  const btnTextActive = { ...btnText, color: LS.gold, textDecoration: "underline" };

  // ── Sizing ────────────────────────────────────────────────────────────────
  const showLeft    = viewMode !== "preview";
  const showRight   = viewMode !== "editor";
  const leftWidth   = showLeft && showRight ? "380px" : showLeft ? "100%" : "0";
  const rightWidth  = showLeft && showRight ? "calc(100% - 380px)" : showRight ? "100%" : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52, flexShrink: 0,
        background: LS.card, borderBottom: `1px solid ${LS.border}`,
      }}>
        {/* Left: back + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ ...btnText, padding: "8px 0" }}>← Back</button>
          <div style={{ width: 1, height: 20, background: LS.border }} />
          <span style={{ fontFamily: NU, fontSize: 13, color: LS.text, fontWeight: 500 }}>
            {activeRecord?.hero_title || form.heroTitle || (isNew ? "New Location" : "Untitled Location")}
          </span>
          {activeRecord && (
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: 2,
              background: pageType === "category" ? "rgba(95,173,122,0.15)" : "rgba(201,168,76,0.15)",
              color: pageType === "category" ? "#5fad7a" : LS.gold,
            }}>
              {pageType === "category" ? "Category" : "Hub"}
            </span>
          )}
        </div>
        {/* Right: actions + view mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveMsg && <span style={{ fontFamily: NU, fontSize: 11, color: saveMsg.includes("!") || saveMsg === "Saved." ? "#5fad7a" : "#c46060" }}>{saveMsg}</span>}
          <button onClick={onBack} style={btnOutline}>Discard</button>
          <button onClick={handleSave} disabled={saving || !activeRecord} style={{ ...btnFill, opacity: saving || !activeRecord ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button onClick={handlePublish} disabled={publishing || !activeRecord} style={{ ...btnFill, background: LS.gold, color: "#1a1a1a", opacity: publishing || !activeRecord ? 0.5 : 1 }}>
            {publishing ? "Publishing…" : "Publish"}
          </button>
          <div style={{ width: 1, height: 20, background: LS.border, margin: "0 4px" }} />
          <button onClick={() => setViewMode("split")}  style={viewMode === "split"  ? btnTextActive : btnText}>Split</button>
          <button onClick={() => setViewMode("editor")} style={viewMode === "editor" ? btnTextActive : btnText}>Editor</button>
          <button onClick={() => setViewMode("preview")} style={viewMode === "preview" ? btnTextActive : btnText}>Preview</button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left panel */}
        {showLeft && (
          <div style={{
            width: leftWidth, minWidth: leftWidth, flexShrink: 0,
            background: LS.bg, borderRight: `1px solid ${LS.border}`,
            overflowY: "auto", padding: "24px 20px 80px",
          }}>
            {/* New location form */}
            {isNew && !activeRecord && (
              <NewLocationForm LS={LS} onCreated={handleCreated} />
            )}

            {/* Section cards — shown after record exists */}
            {activeRecord && (
              <>
                <p style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: LS.muted, margin: "0 0 16px" }}>
                  {pageType === "category" ? "Location Category" : "Location Hub"} · Sections
                </p>
                {pageType === "category" ? (
                  <CategorySections form={form} set={setForm} LS={LS} />
                ) : (
                  <HubSections form={form} set={setForm} LS={LS} />
                )}
              </>
            )}
          </div>
        )}

        {/* Right panel — live preview */}
        {showRight && (
          <div style={{ flex: 1, overflow: "auto", background: "#f5f5f5" }}>
            {!activeRecord ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
                <p style={{ fontFamily: GD, fontSize: 22, fontStyle: "italic", color: "#aaa", margin: 0 }}>Live preview will appear here</p>
                <p style={{ fontFamily: NU, fontSize: 13, color: "#bbb", margin: 0 }}>Create the location first →</p>
              </div>
            ) : pageType === "hub" ? (
              <LocationPage
                key={activeRecord.location_key}
                locationType={activeRecord.location_type || "city"}
                locationSlug={activeRecord.city_slug || activeRecord.region_slug || activeRecord.country_slug || ""}
                locationContent={liveContent}
                hideNav
              />
            ) : (
              <RegionCategoryPage
                key={activeRecord.location_key}
                countrySlug={activeRecord.country_slug}
                regionSlug={activeRecord.region_slug}
                categorySlug={activeRecord.category_slug}
                studioContent={liveContent}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
