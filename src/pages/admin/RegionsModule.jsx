import React, { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { getCountryBySlug } from "../../data/geo";
import { ITALY_REGIONS } from "../../data/italy/regions";
import { getRegionPageConfig, saveRegionPageConfig } from "../../services/regionPageConfig";

const NU = "'Nunito', sans-serif";
const GD = "'Gilda Display', serif";

// ════════════════════════════════════════════════════════════════
// WYSIWYG PAGE CONTENT EDITOR COMPONENT
// ════════════════════════════════════════════════════════════════

function PageContentEditor({ content, onChange, C, NU, GD }) {
  const imageInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const toolbarButtonStyle = {
    fontFamily: NU,
    fontSize: 11,
    fontWeight: 600,
    padding: "6px 12px",
    margin: "0 4px 8px 0",
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    cursor: "pointer",
    transition: "all 0.2s",
    color: C.off,
  };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", background: C.card }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.black, display: "flex", flexWrap: "wrap", gap: 4 }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("bold") ? C.gold : C.card,
            color: editor.isActive("bold") ? "#000" : C.off,
            fontWeight: editor.isActive("bold") ? 700 : 600,
          }}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("italic") ? C.gold : C.card,
            color: editor.isActive("italic") ? "#000" : C.off,
            fontStyle: editor.isActive("italic") ? "italic" : "normal",
          }}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("heading", { level: 2 }) ? C.gold : C.card,
            color: editor.isActive("heading", { level: 2 }) ? "#000" : C.off,
          }}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("heading", { level: 3 }) ? C.gold : C.card,
            color: editor.isActive("heading", { level: 3 }) ? "#000" : C.off,
          }}
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("bulletList") ? C.gold : C.card,
            color: editor.isActive("bulletList") ? "#000" : C.off,
          }}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("orderedList") ? C.gold : C.card,
            color: editor.isActive("orderedList") ? "#000" : C.off,
          }}
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("codeBlock") ? C.gold : C.card,
            color: editor.isActive("codeBlock") ? "#000" : C.off,
          }}
        >
          &lt;/&gt;
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={{
            ...toolbarButtonStyle,
            background: editor.isActive("blockquote") ? C.gold : C.card,
            color: editor.isActive("blockquote") ? "#000" : C.off,
          }}
        >
          " "
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={toolbarButtonStyle}
        >
          ─ HR
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          style={toolbarButtonStyle}
        >
          ← Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          style={toolbarButtonStyle}
        >
          Redo →
        </button>
        <button
          onClick={() => imageInputRef.current?.click()}
          style={{ ...toolbarButtonStyle, background: C.gold, color: "#000", fontWeight: 700 }}
        >
          🖼️ Image
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Editor */}
      <div style={{ padding: 16 }}>
        <style>{`
          .tiptap-editor-content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 12px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .tiptap-editor-content h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 16px 0 8px 0;
          }
          .tiptap-editor-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 12px 0 6px 0;
          }
          .tiptap-editor-content ul, .tiptap-editor-content ol {
            margin: 8px 0 8px 20px;
          }
          .tiptap-editor-content blockquote {
            border-left: 4px solid ${C.gold};
            padding-left: 12px;
            margin: 12px 0;
            color: ${C.grey};
          }
          .tiptap-editor-content code {
            background: ${C.black};
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', monospace;
            font-size: 12px;
          }
        `}</style>
        <div className="tiptap-editor-content" style={{
          fontFamily: NU,
          fontSize: 14,
          color: C.off,
          lineHeight: 1.6,
          minHeight: 200,
          maxHeight: 500,
          overflow: "auto",
          border: `1px dashed ${C.border}`,
          borderRadius: 4,
          padding: 12,
        }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "8px 16px", background: C.black, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2 }}>
          HTML output: <code style={{ fontFamily: "'SF Mono', monospace", fontSize: 9 }}>{content?.substring(0, 50)}...</code>
        </div>
      </div>
    </div>
  );
}

export function RegionsModule({ C }) {
  // ════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ════════════════════════════════════════════════════════════════

  // Local regions (from ITALY_REGIONS for now, can extend to other countries)
  const [regions, setRegions] = useState(() => JSON.parse(JSON.stringify(ITALY_REGIONS)));

  // Detail editor state
  const [openRegion, setOpenRegion] = useState(null); // region slug when detail is open
  const [seoSection, setSeoSection] = useState("head"); // "head" | "content" | "ai" | "code"
  const [seoForm, setSeoForm] = useState({
    titleTag: "",
    metaDescription: "",
    metaRobots: "index, follow",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogType: "website",
    h1: "",
    pageContent: "",
    introText: "",
    aiKeywords: "",
    aiSummary: "",
    aiIntentSignals: "",
    aiEntityType: "TouristDestination",
    customMeta: [],
    headHtml: "",
    thumbnail: null,
    thumbnailAlt: "",
    thumbnailTitle: "",
    thumbnailDesc: "",
    icon: null,
    iconAlt: "",
  });
  const [savedSeo, setSavedSeo] = useState({}); // { regionSlug: seoForm }
  const [savedPageConfig, setSavedPageConfig] = useState({}); // { regionSlug: pageConfigForm }

  // Page config editor state (for premium page fields)
  const [pageConfigForm, setPageConfigForm] = useState({
    hero: {
      title: "",
      intro: "",
      image: "",
      stats: [
        { label: "", value: "" },
        { label: "", value: "" },
        { label: "", value: "" },
      ],
    },
    featured: {
      enabled: true,
      itemIds: [],
      count: 6,
      displayType: "carousel",
      title: "",
    },
    realWeddings: {
      enabled: false,
      title: "",
      source: "auto",
      selectedIds: [],
    },
    layout: {
      defaultViewMode: "grid",
      itemsPerPage: 12,
    },
  });

  const [showThumbStock, setShowThumbStock] = useState(false);
  const thumbInputRef = useRef(null);
  const iconInputRef = useRef(null);

  // TipTap editor instance for page content
  const pageContentEditorRef = useRef(null);

  // ════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ════════════════════════════════════════════════════════════════

  const loadSeoForm = (regionSlug) => {
    const existing = savedSeo[regionSlug] || {};
    setSeoForm({
      titleTag: existing.titleTag || "",
      metaDescription: existing.metaDescription || "",
      metaRobots: existing.metaRobots || "index, follow",
      canonicalUrl: existing.canonicalUrl || "",
      ogTitle: existing.ogTitle || "",
      ogDescription: existing.ogDescription || "",
      ogImage: existing.ogImage || "",
      ogType: existing.ogType || "website",
      h1: existing.h1 || "",
      pageContent: existing.pageContent || "",
      introText: existing.introText || "",
      aiKeywords: existing.aiKeywords || "",
      aiSummary: existing.aiSummary || "",
      aiIntentSignals: existing.aiIntentSignals || "",
      aiEntityType: existing.aiEntityType || "TouristDestination",
      customMeta: existing.customMeta || [],
      headHtml: existing.headHtml || "",
      thumbnail: existing.thumbnail || null,
      thumbnailAlt: existing.thumbnailAlt || "",
      thumbnailTitle: existing.thumbnailTitle || "",
      thumbnailDesc: existing.thumbnailDesc || "",
      icon: existing.icon || null,
      iconAlt: existing.iconAlt || "",
    });
    setSeoSection("head");
  };

  const loadPageConfigForm = (regionSlug) => {
    // Load from regionPageConfig service (Phase 1: in-memory, Phase 2: Supabase)
    const config = getRegionPageConfig(regionSlug);
    setPageConfigForm(JSON.parse(JSON.stringify(config)));
  };

  const openDetail = (region) => {
    loadSeoForm(region.slug);
    loadPageConfigForm(region.slug);
    setOpenRegion(region.slug);
  };

  const saveSeo = () => {
    setSavedSeo((prev) => ({
      ...prev,
      [openRegion]: { ...seoForm },
    }));
  };

  const savePageConfig = () => {
    // Save to regionPageConfig service (Phase 1: in-memory, Phase 2: Supabase)
    saveRegionPageConfig(openRegion, pageConfigForm);

    // Also update local state for UI feedback
    setSavedPageConfig((prev) => ({
      ...prev,
      [openRegion]: { ...pageConfigForm },
    }));
  };

  const saveAll = () => {
    saveSeo();
    savePageConfig();
    setOpenRegion(null);
  };

  const seoScoreByKey = (key) => {
    const s = savedSeo[key] || {};
    let filled = 0;
    if (s.titleTag) filled++;
    if (s.metaDescription) filled++;
    if (s.h1 || s.pageContent) filled++;
    if (s.aiKeywords) filled++;
    if (s.ogTitle || s.ogDescription) filled++;
    if (s.thumbnail) filled++;
    if (s.thumbnailAlt) filled++;
    return filled;
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  if (openRegion) {
    const activeRegion = regions.find((r) => r.slug === openRegion);
    if (!activeRegion) return <div>Region not found</div>;

    const inputStyle = {
      fontFamily: NU,
      fontSize: 12,
      color: C.off,
      background: C.black,
      border: `1px solid ${C.border}`,
      borderRadius: 3,
      padding: "7px 12px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
    };

    const tabStyle = (isActive) => ({
      fontFamily: NU,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: isActive ? C.gold : C.grey2,
      background: "transparent",
      border: "none",
      borderBottom: isActive ? `2px solid ${C.gold}` : `2px solid transparent`,
      padding: "8px 16px",
      cursor: "pointer",
      transition: "all 0.2s",
    });

    return (
      <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: C.card, borderRadius: 6, width: "90%", maxWidth: 900, maxHeight: "90vh", overflow: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
          {/* Header */}
          <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.grey2, marginBottom: 4 }}>Edit Region</div>
              <h2 style={{ fontFamily: GD, fontSize: 28, color: C.off, margin: 0 }}>{activeRegion.name}</h2>
            </div>
            <button
              onClick={() => setOpenRegion(null)}
              style={{ background: "none", border: "none", fontSize: 24, color: C.grey2, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", paddingLeft: 20 }}>
            <button style={tabStyle(seoSection === "head")} onClick={() => setSeoSection("head")}>
              ⊙ Head Tags & Meta
            </button>
            <button style={tabStyle(seoSection === "content")} onClick={() => setSeoSection("content")}>
              ◈ Page Content
            </button>
            <button style={tabStyle(seoSection === "pageConfig")} onClick={() => setSeoSection("pageConfig")}>
              ✦ Premium Page Config
            </button>
            <button style={tabStyle(seoSection === "ai")} onClick={() => setSeoSection("ai")}>
              ✧ AI & Keywords
            </button>
            <button style={tabStyle(seoSection === "code")} onClick={() => setSeoSection("code")}>
              ⟐ Custom HTML
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 20, maxHeight: "calc(90vh - 180px)", overflow: "auto" }}>
            {seoSection === "head" && (
              <div>
                <h3 style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginTop: 0 }}>HTML Head Tags</h3>

                {/* Title Tag */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    &lt;TITLE&gt; TAG <span style={{ color: C.grey2, fontWeight: 400 }}>({seoForm.titleTag.length || 0}/60)</span>
                  </label>
                  <input
                    value={seoForm.titleTag}
                    onChange={(e) => setSeoForm((p) => ({ ...p, titleTag: e.target.value.slice(0, 60) }))}
                    placeholder={`${activeRegion.name} - Luxury Wedding Destination | LWD`}
                    style={inputStyle}
                  />
                </div>

                {/* Meta Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    META DESCRIPTION <span style={{ color: C.grey2, fontWeight: 400 }}>({seoForm.metaDescription.length || 0}/160)</span>
                  </label>
                  <textarea
                    value={seoForm.metaDescription}
                    onChange={(e) => setSeoForm((p) => ({ ...p, metaDescription: e.target.value.slice(0, 160) }))}
                    placeholder={`Discover curated luxury wedding venues and vendors in ${activeRegion.name}. Editorially selected across the finest locations.`}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 60, lineHeight: 1.5 }}
                  />
                </div>

                {/* Meta Robots */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    META ROBOTS
                  </label>
                  <select
                    value={seoForm.metaRobots}
                    onChange={(e) => setSeoForm((p) => ({ ...p, metaRobots: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option>index, follow</option>
                    <option>noindex, follow</option>
                    <option>index, nofollow</option>
                    <option>noindex, nofollow</option>
                  </select>
                </div>

                {/* Canonical URL */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    CANONICAL URL
                  </label>
                  <input
                    value={seoForm.canonicalUrl}
                    onChange={(e) => setSeoForm((p) => ({ ...p, canonicalUrl: e.target.value }))}
                    placeholder={`https://luxuryweddingdirectory.com/italy/${activeRegion.slug}`}
                    style={inputStyle}
                  />
                  <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, marginTop: 4 }}>← Leave blank for auto-generated</div>
                </div>
              </div>
            )}

            {seoSection === "content" && (
              <div>
                <h3 style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginTop: 0 }}>Page Content</h3>

                {/* H1 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    &lt;H1&gt; Page Heading
                  </label>
                  <input
                    value={seoForm.h1}
                    onChange={(e) => setSeoForm((p) => ({ ...p, h1: e.target.value }))}
                    placeholder={`Luxury Weddings in ${activeRegion.name}`}
                    style={inputStyle}
                  />
                </div>

                {/* Intro Text */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Intro Text (2-4 sentences above listing grid)
                  </label>
                  <textarea
                    value={seoForm.introText}
                    onChange={(e) => setSeoForm((p) => ({ ...p, introText: e.target.value }))}
                    placeholder={`2-4 sentence editorial intro describing the region's wedding appeal...`}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.5 }}
                  />
                </div>

                {/* Page Content (WYSIWYG editor) */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Page Content (optional long-form, WYSIWYG editor)
                  </label>
                  <PageContentEditor
                    content={seoForm.pageContent}
                    onChange={(html) => setSeoForm((p) => ({ ...p, pageContent: html }))}
                    C={C}
                    NU={NU}
                    GD={GD}
                  />
                </div>
              </div>
            )}

            {seoSection === "pageConfig" && (
              <div>
                <h3 style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginTop: 0 }}>Premium Page Configuration</h3>
                <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 20 }}>
                  Grouped panels for hero, featured items, real weddings, and layout. Customize page design per region.
                </p>

                {/* ─── GROUPED PANELS ─── */}

                {/* PANEL: About Section */}
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ background: C.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ▾ About Section
                    </div>
                  </div>
                  <div style={{ padding: 16, background: C.card, borderTop: `1px solid ${C.border}` }}>
                    {/* About Title */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Section Title
                      </label>
                      <input
                        value={pageConfigForm.about?.title || "About"}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, about: { ...p.about, title: e.target.value } }))}
                        placeholder={`e.g., "About ${activeRegion.name}"`}
                        style={inputStyle}
                      />
                    </div>

                    {/* About Content */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        About Text (SEO-optimized)
                      </label>
                      <textarea
                        value={pageConfigForm.about?.content || ""}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, about: { ...p.about, content: e.target.value } }))}
                        placeholder={`Write a detailed, SEO-rich description of the region...`}
                        rows={5}
                        style={{ ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.5 }}
                      />
                      <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, marginTop: 4 }}>← Include keywords, location names, and unique selling points for better search visibility</div>
                    </div>
                  </div>
                </div>

                {/* PANEL: Hero Section */}
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ background: C.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ▾ Hero Section
                    </div>
                  </div>
                  <div style={{ padding: 16, background: C.card, borderTop: `1px solid ${C.border}` }}>
                    {/* Hero Title */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Hero Title
                      </label>
                      <input
                        value={pageConfigForm.hero.title}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, hero: { ...p.hero, title: e.target.value } }))}
                        placeholder={`e.g., "Discover ${activeRegion.name}'s Finest Wedding Venues"`}
                        style={inputStyle}
                      />
                    </div>

                    {/* Hero Intro */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Hero Intro Text
                      </label>
                      <textarea
                        value={pageConfigForm.hero.intro}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, hero: { ...p.hero, intro: e.target.value } }))}
                        placeholder={`Brief description of the region and wedding experience...`}
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical", minHeight: 60, lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Hero Image */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Hero Image URL
                      </label>
                      <input
                        value={pageConfigForm.hero.image}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, hero: { ...p.hero, image: e.target.value } }))}
                        placeholder={`https://...`}
                        style={inputStyle}
                      />
                      <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, marginTop: 4 }}>← Full-width hero background image</div>
                    </div>

                    {/* Hero Stats */}
                    <div>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                        Hero Stats (up to 3)
                      </label>
                      {pageConfigForm.hero.stats.map((stat, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <input
                            value={stat.label}
                            onChange={(e) => {
                              const newStats = [...pageConfigForm.hero.stats];
                              newStats[idx].label = e.target.value;
                              setPageConfigForm((p) => ({ ...p, hero: { ...p.hero, stats: newStats } }));
                            }}
                            placeholder={`Label (e.g., "Venues")`}
                            style={inputStyle}
                          />
                          <input
                            value={stat.value}
                            onChange={(e) => {
                              const newStats = [...pageConfigForm.hero.stats];
                              newStats[idx].value = e.target.value;
                              setPageConfigForm((p) => ({ ...p, hero: { ...p.hero, stats: newStats } }));
                            }}
                            placeholder={`Value (e.g., "150+")`}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PANEL: Featured Items */}
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ background: C.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ▾ Featured Items
                    </div>
                  </div>
                  <div style={{ padding: 16, background: C.card, borderTop: `1px solid ${C.border}` }}>
                    {/* Enabled Toggle */}
                    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={pageConfigForm.featured.enabled}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, featured: { ...p.featured, enabled: e.target.checked } }))}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <label style={{ fontFamily: NU, fontSize: 10, color: C.off, fontWeight: 600 }}>
                        Show featured items carousel on region page
                      </label>
                    </div>

                    {pageConfigForm.featured.enabled && (
                      <>
                        {/* Featured Title */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Section Title
                          </label>
                          <input
                            value={pageConfigForm.featured.title}
                            onChange={(e) => setPageConfigForm((p) => ({ ...p, featured: { ...p.featured, title: e.target.value } }))}
                            placeholder={`e.g., "Signature Wedding Venues"`}
                            style={inputStyle}
                          />
                        </div>

                        {/* Item Count */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Items to Display
                          </label>
                          <select
                            value={pageConfigForm.featured.count}
                            onChange={(e) => setPageConfigForm((p) => ({ ...p, featured: { ...p.featured, count: parseInt(e.target.value) } }))}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            <option value={3}>3 items</option>
                            <option value={6}>6 items</option>
                            <option value={9}>9 items</option>
                            <option value={12}>12 items</option>
                          </select>
                        </div>

                        {/* Display Type */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Display Type
                          </label>
                          <select
                            value={pageConfigForm.featured.displayType}
                            onChange={(e) => setPageConfigForm((p) => ({ ...p, featured: { ...p.featured, displayType: e.target.value } }))}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            <option value="carousel">Carousel (horizontal scroll)</option>
                            <option value="grid">Grid (responsive)</option>
                          </select>
                        </div>

                        {/* Featured Items Selector */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Featured Venues to Display
                          </label>
                          <div style={{ fontSize: 9, color: C.grey2, background: `${C.gold}10`, border: `1px dashed ${C.gold}30`, borderRadius: 4, padding: 12, lineHeight: 1.6 }}>
                            <strong>ℹ️ Featured Item Selection</strong><br/>
                            In Phase 2, you'll be able to select specific venues from the Puglia listings to feature here.<br/>
                            For now, featured items are auto-populated from the top-rated venues in this region.
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* PANEL: Real Weddings */}
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ background: C.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ▾ Real Weddings Section
                    </div>
                  </div>
                  <div style={{ padding: 16, background: C.card, borderTop: `1px solid ${C.border}` }}>
                    {/* Enabled Toggle */}
                    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={pageConfigForm.realWeddings.enabled}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, realWeddings: { ...p.realWeddings, enabled: e.target.checked } }))}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <label style={{ fontFamily: NU, fontSize: 10, color: C.off, fontWeight: 600 }}>
                        Show real weddings gallery on region page
                      </label>
                    </div>

                    {pageConfigForm.realWeddings.enabled && (
                      <>
                        {/* Title */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Section Title
                          </label>
                          <input
                            value={pageConfigForm.realWeddings.title}
                            onChange={(e) => setPageConfigForm((p) => ({ ...p, realWeddings: { ...p.realWeddings, title: e.target.value } }))}
                            placeholder={`e.g., "Real ${activeRegion.name} Weddings"`}
                            style={inputStyle}
                          />
                        </div>

                        {/* Source */}
                        <div>
                          <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Data Source
                          </label>
                          <select
                            value={pageConfigForm.realWeddings.source}
                            onChange={(e) => setPageConfigForm((p) => ({ ...p, realWeddings: { ...p.realWeddings, source: e.target.value } }))}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            <option value="auto">Auto (all region weddings)</option>
                            <option value="manual">Manual (select specific)</option>
                          </select>
                          <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, marginTop: 4 }}>← Coming soon: manual selection</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* PANEL: Layout Controls */}
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ background: C.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ▾ Layout Controls
                    </div>
                  </div>
                  <div style={{ padding: 16, background: C.card, borderTop: `1px solid ${C.border}` }}>
                    {/* Default View Mode */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Default View Mode
                      </label>
                      <select
                        value={pageConfigForm.layout.defaultViewMode}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, layout: { ...p.layout, defaultViewMode: e.target.value } }))}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value="grid">Grid View (cards)</option>
                        <option value="list">List View (detailed)</option>
                        <option value="map">Map View (geographic)</option>
                      </select>
                    </div>

                    {/* Items Per Page */}
                    <div>
                      <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Items Per Page
                      </label>
                      <select
                        value={pageConfigForm.layout.itemsPerPage}
                        onChange={(e) => setPageConfigForm((p) => ({ ...p, layout: { ...p.layout, itemsPerPage: parseInt(e.target.value) } }))}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value={6}>6 items</option>
                        <option value={12}>12 items</option>
                        <option value={24}>24 items</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div style={{ padding: 12, background: `${C.blue}10`, border: `1px solid ${C.blue}30`, borderRadius: 4 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, color: C.blue, lineHeight: 1.5 }}>
                    <strong>ℹ️ Page Config Status:</strong> Settings above are in-memory for Phase 1. Will migrate to Supabase JSON columns in Phase 2.
                  </div>
                </div>
              </div>
            )}

            {seoSection === "ai" && (
              <div>
                <h3 style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginTop: 0 }}>AI & Keywords</h3>

                {/* AI Keywords */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Keywords (comma-separated)
                  </label>
                  <input
                    value={seoForm.aiKeywords}
                    onChange={(e) => setSeoForm((p) => ({ ...p, aiKeywords: e.target.value }))}
                    placeholder={`${activeRegion.name.toLowerCase()} wedding, luxury venues, destination wedding...`}
                    style={inputStyle}
                  />
                </div>

                {/* AI Summary */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    AI Summary (internal)
                  </label>
                  <textarea
                    value={seoForm.aiSummary}
                    onChange={(e) => setSeoForm((p) => ({ ...p, aiSummary: e.target.value }))}
                    placeholder={`Key characteristics and appeal of this region for weddings...`}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.5 }}
                  />
                </div>

                {/* Intent Signals */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Intent Signals (for Aura AI)
                  </label>
                  <textarea
                    value={seoForm.aiIntentSignals}
                    onChange={(e) => setSeoForm((p) => ({ ...p, aiIntentSignals: e.target.value }))}
                    placeholder={`High intent: "...  booking"  |  Mid: "... venue ideas"  |  Low: "... inspiration"`}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.5 }}
                  />
                </div>
              </div>
            )}

            {seoSection === "code" && (
              <div>
                <h3 style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginTop: 0 }}>Custom HTML & Meta Tags</h3>

                {/* Custom Head HTML */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Custom &lt;head&gt; HTML
                  </label>
                  <textarea
                    value={seoForm.headHtml}
                    onChange={(e) => setSeoForm((p) => ({ ...p, headHtml: e.target.value }))}
                    placeholder={`<meta name="..." content="..." />`}
                    rows={6}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120, fontFamily: "'Monaco', monospace", fontSize: 10, lineHeight: 1.5 }}
                  />
                  <div style={{ fontFamily: NU, fontSize: 8, color: C.grey2, marginTop: 4 }}>Advanced: Add any custom meta tags or scripts to the page head</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setOpenRegion(null)}
              style={{
                fontFamily: NU,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.grey2,
                background: `${C.off}08`,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveAll}
              style={{
                fontFamily: NU,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#000",
                background: C.gold,
                border: "none",
                borderRadius: 3,
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main regions list view
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: GD, fontSize: 24, color: C.off, margin: "0 0 4px 0" }}>Regions Management</h2>
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0 }}>
          {regions.length} regions · Configure page content, SEO, and premium page design
        </p>
      </div>

      {/* Regions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {regions.map((region) => {
          const seoScore = seoScoreByKey(region.slug);
          return (
            <div
              key={region.slug}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: 16,
                background: C.card,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.gold;
                e.currentTarget.style.background = `${C.gold}06`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.card;
              }}
              onClick={() => openDetail(region)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.off, margin: 0, marginBottom: 2 }}>
                    {region.name}
                  </h3>
                  <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: 0 }}>
                    /{region.slug} · {region.listingCount} listings
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, marginBottom: 4 }}>
                    SEO {seoScore}/7
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      background: `${C.grey2}20`,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(seoScore / 7) * 100}%`,
                        height: "100%",
                        background: C.gold,
                        transition: "width 0.2s",
                      }}
                    />
                  </div>
                </div>
              </div>

              <p style={{ fontFamily: NU, fontSize: 10, color: C.off, margin: 0, marginBottom: 12, lineHeight: 1.4 }}>
                {region.description?.substring(0, 100)}...
              </p>

              <button
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.gold,
                  background: `${C.gold}10`,
                  border: `1px solid ${C.gold}30`,
                  borderRadius: 3,
                  padding: "6px 12px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Edit Region →
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: `${C.gold}06`,
          border: `1px solid ${C.gold}30`,
          borderRadius: 4,
        }}
      >
        <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
          📊 Summary
        </div>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.off }}>
          {regions.length} regions configured · {regions.reduce((a, r) => a + r.listingCount, 0)} total listings
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginTop: 8 }}>
          Each region can have its own premium page design, hero content, featured items, and layout preferences. Currently managing Italy regions; expandable to other countries.
        </div>
      </div>
    </div>
  );
}
