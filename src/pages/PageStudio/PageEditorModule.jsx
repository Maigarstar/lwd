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
import AIPageImportPanel from "./components/AIPageImportPanel";
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
  const [mobileEditorTab, setMobileEditorTab] = useState("library"); // library, canvas, or settings (mobile only)
  const [showPreview, setShowPreview] = useState(false);
  const [showBlocksBrowser, setShowBlocksBrowser] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // split | editor | preview

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

  // Compute grid layout based on viewMode, matches Listing Studio pattern exactly
  const gridCols = viewMode === 'editor' ? '1fr' : viewMode === 'preview' ? '1fr' : '1fr 1fr';
  const showLeftPanel = viewMode !== 'preview';
  const showRightPanel = viewMode !== 'editor';

  if (!page) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: NU, fontSize: 12, color: C.grey2 }}>
        Loading page...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Responsive styles for mobile editor tabs */}
      <style>{`
        @media (max-width: 1023px) {
          .page-editor-mobile-tabs { display: flex !important; }
          .page-editor-library, .page-editor-canvas, .page-editor-settings { width: 100% !important; }
          .page-editor-canvas { min-height: calc(100vh - 300px); }
        }
        @media (min-width: 1024px) {
          .page-editor-mobile-tabs { display: none !important; }
          .page-editor-library { display: flex !important; width: 280px; flex-shrink: 0; }
          .page-editor-canvas { display: flex !important; flex: 1; }
          .page-editor-settings { display: flex !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          FULL-WIDTH ACTION BAR, matches Listing Studio exactly
      ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.dark,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Left: AI tools */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowAIImport(true)}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: C.white, color: C.dark,
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontFamily: NU,
            }}
          >
            Magic AI
          </button>
          <button
            type="button"
            onClick={() => setShowAIImport(true)}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: C.white,
              border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer',
              fontFamily: NU,
            }}
          >
            Fill with AI
          </button>
        </div>

        {/* Right: view mode links + save actions */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* View mode text links */}
          {['split', 'editor', 'preview'].map((mode) => {
            const isActive = viewMode === mode;
            return (
              <span
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: isActive ? C.white : C.grey2,
                  cursor: 'pointer',
                  borderBottom: isActive ? `1px solid ${C.white}` : '1px solid transparent',
                  paddingBottom: 1,
                  fontFamily: NU,
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            );
          })}

          {/* Divider */}
          <span style={{ width: 1, height: 16, backgroundColor: C.border, display: 'inline-block' }} />

          {/* Save actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onNavigate('all-pages')}
              style={{
                fontSize: 13, fontWeight: 500, padding: '7px 14px',
                backgroundColor: 'transparent', color: C.grey2,
                border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer',
                fontFamily: NU,
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => { handleSavePage({ ...page, updatedAt: new Date().toISOString() }); setUnsavedChanges(false); }}
              style={{
                fontSize: 13, fontWeight: 600, padding: '7px 14px',
                backgroundColor: C.white, color: C.dark,
                border: 'none', borderRadius: 6,
                cursor: unsavedChanges ? 'pointer' : 'not-allowed',
                opacity: unsavedChanges ? 1 : 0.35,
                fontFamily: NU,
              }}
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => { handleSavePage({ ...page, status: 'published', publishedAt: new Date().toISOString() }); setUnsavedChanges(false); }}
              style={{
                fontSize: 13, fontWeight: 600, padding: '7px 14px',
                backgroundColor: C.white, color: C.dark,
                border: 'none', borderRadius: 6, cursor: 'pointer',
                fontFamily: NU,
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SPLIT PANELS GRID, matches Listing Studio pattern
      ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0, flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL: Editor */}
        {showLeftPanel && (
          <div style={{
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRight: viewMode === 'split' ? `1px solid ${C.border}` : 'none',
          }}>

            {/* Tab Navigation (Page Builder | SEO) */}
            <div style={{
              display: 'flex', gap: 0, flexShrink: 0,
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.dark,
              paddingLeft: 20,
            }}>
              <button
                onClick={() => setActiveTab('canvas')}
                style={{
                  fontFamily: NU, fontSize: 10, padding: '12px 16px',
                  backgroundColor: activeTab === 'canvas' ? C.card : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'canvas' ? `3px solid ${C.gold}` : 'none',
                  color: activeTab === 'canvas' ? C.white : C.grey2,
                  cursor: 'pointer', textTransform: 'uppercase', fontWeight: 600,
                }}
              >
                Page Builder
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                style={{
                  fontFamily: NU, fontSize: 10, padding: '12px 16px',
                  backgroundColor: activeTab === 'seo' ? C.card : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'seo' ? `3px solid ${C.gold}` : 'none',
                  color: activeTab === 'seo' ? C.white : C.grey2,
                  cursor: 'pointer', textTransform: 'uppercase', fontWeight: 600,
                }}
              >
                SEO
              </button>
            </div>

            {/* Mobile Tab Navigation (hidden on desktop) */}
            <div style={{ display: 'none' }} className="page-editor-mobile-tabs">
              <div style={{
                display: 'flex', gap: 0,
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: C.dark,
                overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              }}>
                {['library', 'canvas', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMobileEditorTab(tab)}
                    style={{
                      fontFamily: NU, fontSize: 9, padding: '10px 12px',
                      backgroundColor: mobileEditorTab === tab ? C.card : 'transparent',
                      border: 'none',
                      borderBottom: mobileEditorTab === tab ? `3px solid ${C.gold}` : 'none',
                      color: mobileEditorTab === tab ? C.white : C.grey2,
                      cursor: 'pointer', textTransform: 'uppercase', fontWeight: 600,
                      flex: '0 0 auto', whiteSpace: 'nowrap',
                    }}
                  >
                    {tab === 'library' ? 'Sections' : tab === 'canvas' ? 'Canvas' : 'Settings'}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {activeTab === 'canvas' && (
                <>
                  {/* Section Library */}
                  <div className="page-editor-library" style={{ display: mobileEditorTab === 'library' ? 'block' : 'none' }}>
                    <SectionLibrary
                      onAddSection={handleAddSection}
                      onBrowseBlocks={() => setShowBlocksBrowser(true)}
                      C={C} NU={NU} GD={GD}
                    />
                  </div>

                  {/* Canvas */}
                  <div className="page-editor-canvas" style={{ display: mobileEditorTab === 'canvas' ? 'block' : 'none', flex: 1, overflow: 'auto' }}>
                    <SectionCanvas
                      sections={page.sections || []}
                      onSelectSection={setSelectedSectionId}
                      onDeleteSection={handleDeleteSection}
                      onDuplicateSection={handleDuplicateSection}
                      onMoveUp={handleMoveSectionUp}
                      onMoveDown={handleMoveSectionDown}
                      onToggleVisibility={handleToggleVisibility}
                      selectedSectionId={selectedSectionId}
                      C={C} NU={NU} GD={GD}
                    />
                  </div>

                  {/* Settings Panel */}
                  <div className="page-editor-settings" style={{ display: mobileEditorTab === 'settings' ? 'block' : 'none' }}>
                    {selectedSection ? (
                      <RightSettingsPanel
                        section={selectedSection}
                        onUpdate={(updated) => {
                          handleUpdateSection(updated.id, updated);
                          setSelectedSectionId(updated.id);
                        }}
                        C={C} NU={NU} GD={GD}
                      />
                    ) : (
                      <div style={{
                        width: 320, backgroundColor: C.dark,
                        borderLeft: `1px solid ${C.border}`,
                        padding: '16px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: C.grey2, fontFamily: NU, fontSize: 12, textAlign: 'center',
                      }}>
                        Select a section to edit
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <SEOPanel
                  page={page}
                  onUpdate={(updated) => handleSavePage(updated)}
                  C={C} NU={NU} GD={GD}
                />
              )}
            </div>
          </div>
        )}

        {/* RIGHT PANEL: Live Preview */}
        {showRightPanel && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            backgroundColor: C.dark,
            order: viewMode === 'preview' ? 1 : 2,
          }}>
            {/* Preview Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.card,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: C.grey2, textTransform: 'uppercase', fontFamily: NU }}>
                Live Preview
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  backgroundColor: 'transparent', color: C.grey2,
                  border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
                  fontFamily: NU, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                Full Preview
              </button>
            </div>

            {/* Preview Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <SectionCanvas
                sections={page.sections || []}
                onSelectSection={setSelectedSectionId}
                onDeleteSection={handleDeleteSection}
                onDuplicateSection={handleDuplicateSection}
                onMoveUp={handleMoveSectionUp}
                onMoveDown={handleMoveSectionDown}
                onToggleVisibility={handleToggleVisibility}
                selectedSectionId={selectedSectionId}
                C={C} NU={NU} GD={GD}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPreview && (
        <PreviewModal page={page} onClose={() => setShowPreview(false)} C={C} NU={NU} GD={GD} />
      )}
      {showBlocksBrowser && (
        <ReusableBlocksBrowser onInsertBlock={handleInsertBlock} onClose={() => setShowBlocksBrowser(false)} C={C} NU={NU} GD={GD} />
      )}
      {showAIImport && (
        <AIPageImportPanel
          page={page}
          onSavePage={(updatedPage) => { handleSavePage(updatedPage); setUnsavedChanges(false); }}
          onClose={() => setShowAIImport(false)}
        />
      )}
    </div>
  );
};

export default PageEditorModule;
