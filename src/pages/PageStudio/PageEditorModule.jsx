/**
 * Page Editor module - Main page builder
 */

import { useState, useEffect } from "react";
import SectionLibrary from "./components/SectionLibrary";
import SectionCanvas from "./components/SectionCanvas";
import RightSettingsPanel from "./components/RightSettingsPanel";
import SEOPanel from "./components/SEOPanel";
import PreviewModal from "./components/PreviewModal";
import ReusableBlocksBrowser from "./components/ReusableBlocksBrowser";
import PageStatusBadge from "./components/PageStatusBadge";
import { MOCK_PAGES, getPageById } from "./data/mockPages";
import { savePages, loadPages } from "./utils/pageStorage";
import {
  addSection,
  updateSection,
  deleteSection,
  moveSectionUp,
  moveSectionDown,
  duplicateSection,
  toggleSectionVisibility
} from "./utils/sectionUtils";
import { getSectionTemplate } from "./data/mockSections";

const PageEditorModule = ({ pageId, C, NU, GD, onNavigate }) => {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState("canvas"); // canvas or seo
  const [showPreview, setShowPreview] = useState(false);
  const [showBlocksBrowser, setShowBlocksBrowser] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load page on mount
  useEffect(() => {
    const loaded = loadPages(MOCK_PAGES);
    setPages(loaded);
    const foundPage = loaded.find((p) => p.id === pageId);
    if (foundPage) {
      setPage({ ...foundPage });
    } else if (pageId && pageId.startsWith("listing_")) {
      // Handle synthetic listing pageId - create a temporary page
      const listingId = pageId.replace("listing_", "");
      const tempPage = {
        id: pageId,
        title: `Listing ${listingId} Page`,
        slug: `listing-${listingId}`,
        pageType: "vendor_profile",
        templateKey: "hero_image",
        status: "draft",
        excerpt: "Vendor profile page created from listing",
        featuredImage: "",
        heroVideoUrl: null,
        seo: {
          title: "",
          metaDescription: "",
          canonicalUrl: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
          noindex: false,
          structuredDataType: "WebPage"
        },
        sections: [],
        author: "Admin",
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        scheduledAt: null
      };
      setPage(tempPage);
    }
  }, [pageId]);

  // Save page to localStorage
  const handleSavePage = (updatedPage) => {
    setPage(updatedPage);
    const updated = pages.map((p) => (p.id === updatedPage.id ? updatedPage : p));
    savePages(updated);
    setPages(updated);
    setUnsavedChanges(false);
  };

  // Add section
  const handleAddSection = (sectionType) => {
    if (!page) return;
    const template = getSectionTemplate(sectionType);
    if (!template) return;

    const newSection = {
      ...template,
      id: `section_${Date.now()}`
    };

    const newSections = addSection(page.sections || [], newSection);
    const updatedPage = { ...page, sections: newSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
    setUnsavedChanges(true);
  };

  // Update section
  const handleUpdateSection = (sectionId, updates) => {
    if (!page) return;
    const updatedSections = page.sections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
    setUnsavedChanges(true);
  };

  // Delete section
  const handleDeleteSection = (sectionId) => {
    if (!page || !confirm("Delete this section?")) return;
    const updatedSections = deleteSection(page.sections || [], sectionId);
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
    setSelectedSectionId(null);
  };

  // Duplicate section
  const handleDuplicateSection = (sectionId) => {
    if (!page) return;
    const updatedSections = duplicateSection(page.sections || [], sectionId);
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
  };

  // Move section up/down
  const handleMoveSectionUp = (sectionId) => {
    if (!page) return;
    const updatedSections = moveSectionUp(page.sections || [], sectionId);
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
  };

  const handleMoveSectionDown = (sectionId) => {
    if (!page) return;
    const updatedSections = moveSectionDown(page.sections || [], sectionId);
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
  };

  // Toggle visibility
  const handleToggleVisibility = (sectionId) => {
    if (!page) return;
    const updatedSections = toggleSectionVisibility(page.sections || [], sectionId);
    const updatedPage = { ...page, sections: updatedSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
  };

  // Insert reusable block as section
  const handleInsertBlock = (blockData) => {
    if (!page) return;

    const newSection = {
      ...blockData,
      content: blockData.content || {},
      settings: blockData.settings || {}
    };

    const newSections = addSection(page.sections || [], newSection);
    const updatedPage = { ...page, sections: newSections, updatedAt: new Date().toISOString() };
    handleSavePage(updatedPage);
    setUnsavedChanges(true);
  };

  const selectedSection = page?.sections?.find((s) => s.id === selectedSectionId);

  if (!page) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontFamily: NU,
          fontSize: 12,
          color: C.grey2
        }}
      >
        Loading page...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => onNavigate("all-pages")}
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: C.gold,
              background: "none",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            ← Pages
          </button>
          <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
            <h3 style={{ fontFamily: GD, fontSize: 16, color: C.white, margin: 0 }}>
              {page.title}
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unsavedChanges && (
            <span style={{ fontFamily: NU, fontSize: 9, color: C.rose }}>
              UNSAVED
            </span>
          )}
          <button
            onClick={() => setShowPreview(true)}
            style={{
              fontFamily: NU,
              fontSize: 9,
              padding: "6px 12px",
              backgroundColor: C.dark,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              color: C.white,
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            Preview
          </button>
          <button
            onClick={() => {
              handleSavePage({ ...page, status: "published", publishedAt: new Date().toISOString() });
            }}
            style={{
              fontFamily: NU,
              fontSize: 9,
              padding: "6px 12px",
              backgroundColor: C.green,
              border: "none",
              borderRadius: 3,
              color: "#fff",
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark,
          paddingLeft: 20
        }}
      >
        <button
          onClick={() => setActiveTab("canvas")}
          style={{
            fontFamily: NU,
            fontSize: 10,
            padding: "12px 16px",
            backgroundColor: activeTab === "canvas" ? C.card : "transparent",
            border: "none",
            borderBottom: activeTab === "canvas" ? `3px solid ${C.gold}` : "none",
            color: activeTab === "canvas" ? C.white : C.grey2,
            cursor: "pointer",
            textTransform: "uppercase",
            fontWeight: 600
          }}
        >
          Page Builder
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          style={{
            fontFamily: NU,
            fontSize: 10,
            padding: "12px 16px",
            backgroundColor: activeTab === "seo" ? C.card : "transparent",
            border: "none",
            borderBottom: activeTab === "seo" ? `3px solid ${C.gold}` : "none",
            color: activeTab === "seo" ? C.white : C.grey2,
            cursor: "pointer",
            textTransform: "uppercase",
            fontWeight: 600
          }}
        >
          SEO
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {activeTab === "canvas" && (
          <>
            {/* Left Sidebar - Section Library */}
            <SectionLibrary
              onAddSection={handleAddSection}
              onBrowseBlocks={() => setShowBlocksBrowser(true)}
              C={C}
              NU={NU}
              GD={GD}
            />

            {/* Center Canvas */}
            <SectionCanvas
              sections={page.sections || []}
              onSelectSection={setSelectedSectionId}
              onDeleteSection={handleDeleteSection}
              onDuplicateSection={handleDuplicateSection}
              onMoveUp={handleMoveSectionUp}
              onMoveDown={handleMoveSectionDown}
              onToggleVisibility={handleToggleVisibility}
              selectedSectionId={selectedSectionId}
              C={C}
              NU={NU}
              GD={GD}
            />

            {/* Right Settings Panel */}
            {selectedSection ? (
              <RightSettingsPanel
                section={selectedSection}
                onUpdate={(updated) => {
                  handleUpdateSection(updated.id, updated);
                  setSelectedSectionId(updated.id);
                }}
                C={C}
                NU={NU}
                GD={GD}
              />
            ) : (
              <div
                style={{
                  width: 320,
                  backgroundColor: C.dark,
                  borderLeft: `1px solid ${C.border}`,
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.grey2,
                  fontFamily: NU,
                  fontSize: 12,
                  textAlign: "center"
                }}
              >
                Select a section to edit
              </div>
            )}
          </>
        )}

        {activeTab === "seo" && (
          <SEOPanel
            page={page}
            onUpdate={(updated) => {
              handleSavePage(updated);
            }}
            C={C}
            NU={NU}
            GD={GD}
          />
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          page={page}
          onClose={() => setShowPreview(false)}
          C={C}
          NU={NU}
          GD={GD}
        />
      )}

      {/* Reusable Blocks Browser Modal */}
      {showBlocksBrowser && (
        <ReusableBlocksBrowser
          onInsertBlock={handleInsertBlock}
          onClose={() => setShowBlocksBrowser(false)}
          C={C}
          NU={NU}
          GD={GD}
        />
      )}
    </div>
  );
};

export default PageEditorModule;
