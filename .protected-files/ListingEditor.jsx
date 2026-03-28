import { useState, useCallback, useEffect } from 'react';
import { useListingForm } from './hooks/useListingForm';
import useListingPreview from './hooks/useListingPreview';
import ListingLivePreview from './preview/ListingLivePreview';
import AIContentTools from './components/AIContentTools';
import AIImportPanel from './components/AIImportPanel';
import BasicDetailsSection from './sections/BasicDetailsSection';
import LocationSection from './sections/LocationSection';
import DescriptionSection from './sections/DescriptionSection';
import FeaturesSection from './sections/FeaturesSection';
import CommercialDetailsSection from './sections/CommercialDetailsSection';
import MediaSection from './sections/MediaSection';
import SpacesSection from './sections/SpacesSection';
import ExclusiveUseSection from './sections/ExclusiveUseSection';
import CateringCardsSection from './sections/CateringCardsSection';
import RoomsSection from './sections/RoomsSection';
import DiningSection from './sections/DiningSection';
import WeddingWeekendSection from './sections/WeddingWeekendSection';
import ExperiencesSection from './sections/ExperiencesSection';
import FAQSectionEditor from './sections/FAQSectionEditor';
import SEOSection from './sections/SEOSection';
import ListingInfoSection from './sections/ListingInfoSection';
import CardsSection from './sections/CardsSection';
import EditorialContentSection from './sections/EditorialContentSection';
import ApprovalWorkflowSection from './sections/ApprovalWorkflowSection';
import ContentQualityStatusSection from './sections/ContentQualityStatusSection';
import { getLightPalette, getDarkPalette } from '../../theme/tokens';

/**
 * Listing type configuration, controls which sections are visible
 * and what label/icon represents each listing type.
 */
const LISTING_TYPES = [
  { value: 'venue',        label: 'Wedding Venues' },
  { value: 'planner',     label: 'Wedding Planners' },
  { value: 'photographer',label: 'Photographers' },
  { value: 'videographer',label: 'Videographers' },
  { value: 'general',     label: 'General' },
];

/**
 * Section configuration, maps each editor section to its component, label, icon,
 * lock status, and visibility condition (based on listing type).
 */
const LISTING_SECTIONS = [
  { id: 'basic',       label: 'Basic Details',        icon: '📋', Component: BasicDetailsSection,      locked: true,  condition: null },
  { id: 'location',    label: 'Location',             icon: '📍', Component: LocationSection,          locked: false, condition: null },
  { id: 'description', label: 'Description',          icon: '✎',  Component: DescriptionSection,       locked: false, condition: null },
  { id: 'editorial',   label: 'Editorial Content',    icon: '✎',  Component: EditorialContentSection,  locked: false, condition: null },
  { id: 'approval',    label: 'Approval Workflow',    icon: '✅', Component: ApprovalWorkflowSection,  locked: false, condition: null },
  { id: 'quality',     label: 'Content Quality',      icon: '⭐', Component: ContentQualityStatusSection, locked: false, condition: null },
  { id: 'features',    label: 'Features & Amenities', icon: '✦',  Component: FeaturesSection,          locked: false, condition: 'showFeatures' },
  { id: 'commercial',  label: 'Commercial Details',   icon: '£',  Component: CommercialDetailsSection, locked: false, condition: 'showCommercial' },
  { id: 'media',       label: 'Media',                icon: '🖼',  Component: MediaSection,             locked: false, condition: null },
  { id: 'spaces',      label: 'Spaces',               icon: '⊞',  Component: SpacesSection,            locked: false, condition: 'showFeatures' },
  { id: 'rooms',       label: 'Rooms',                icon: '🛏',  Component: RoomsSection,             locked: false, condition: 'showFeatures' },
  { id: 'dining',      label: 'Dining',               icon: '🍽',  Component: DiningSection,            locked: false, condition: 'showFeatures' },
  { id: 'catering',    label: 'Catering',             icon: '🍰',  Component: CateringCardsSection,     locked: false, condition: 'showFeatures' },
  { id: 'exclusive',   label: 'Exclusive Use',        icon: '👑',  Component: ExclusiveUseSection,      locked: false, condition: 'showFeatures' },
  { id: 'weekend',     label: 'Wedding Weekend',      icon: '📅',  Component: WeddingWeekendSection,    locked: false, condition: 'showFeatures' },
  { id: 'experiences', label: 'Experiences',          icon: '✧',  Component: ExperiencesSection,       locked: false, condition: 'showFeatures' },
  { id: 'faq',         label: 'FAQ',                  icon: '❓',  Component: FAQSectionEditor,         locked: false, condition: null },
  { id: 'seo',         label: 'SEO',                  icon: '🔍',  Component: SEOSection,               locked: false, condition: null },
  { id: 'cards',       label: 'Cards',                icon: '🃏',  Component: CardsSection,             locked: false, condition: null },
  { id: 'info',        label: 'Listing Info',         icon: 'ℹ️',  Component: ListingInfoSection,       locked: false, condition: null },
];

/**
 * Returns which optional sections should be visible for the given listing type.
 * BasicDetails, Location, Description, Media, and SEO are always shown.
 */
const getSectionVisibility = (listingType) => ({
  showFeatures:    listingType === 'venue' || !listingType,
  showCommercial:  listingType !== 'general',
});

/**
 * Full-page split-panel listing editor
 * Left: Editor sections (50%)
 * Right: Live preview (50%)
 * Handles creating and editing venue listings
 */
const ListingEditor = ({ listingId = null, darkMode = false, onCancel = null, onSaveComplete = null }) => {
  const { formData, handleChange, handleSave, handleSaveDraft, handlePublish, loading, uploadProgress, error, hasChanges } = useListingForm(listingId);
  const previewData = useListingPreview(formData);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showAITools,    setShowAITools]    = useState(false);
  const [showAIImport,   setShowAIImport]   = useState(false);
  const [importToast,    setImportToast]    = useState(null); // { count: n }
  const [viewMode,       setViewMode]       = useState('split');

  // Section order and enabled state (persisted to localStorage)
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ls_section_prefs'));
      if (saved?.order?.length === LISTING_SECTIONS.length) return saved.order;
    } catch {}
    return LISTING_SECTIONS.map(s => s.id);
  });
  const [sectionEnabled, setSectionEnabled] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ls_section_prefs'));
      if (saved?.enabled) return { ...Object.fromEntries(LISTING_SECTIONS.map(s => [s.id, true])), ...saved.enabled };
    } catch {}
    return Object.fromEntries(LISTING_SECTIONS.map(s => [s.id, true]));
  });

  // Respect dark/light mode from admin sidebar toggle
  const C = darkMode ? getDarkPalette() : getLightPalette();

  // Determine which sections to show based on listing type
  const { showFeatures, showCommercial } = getSectionVisibility(formData.listing_type);

  // Load view mode preference from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('ls_view_mode');
      if (savedMode && ['split', 'editor', 'preview'].includes(savedMode)) {
        setViewMode(savedMode);
      }
    } catch (e) {
      console.warn('Failed to load view mode preference:', e);
    }
  }, []);

  // Persist section preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ls_section_prefs', JSON.stringify({ order: sectionOrder, enabled: sectionEnabled }));
    } catch {}
  }, [sectionOrder, sectionEnabled]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ls_view_mode', mode);
    } catch (e) {
      console.warn('Failed to save view mode preference:', e);
    }
  }, []);

  // Move section up or down in the order
  const handleMoveSection = useCallback((sectionId, direction) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(sectionId);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  // Toggle section on/off
  const handleToggleSection = useCallback((sectionId) => {
    setSectionEnabled(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  // Handle save (preserve current status)
  const handleSaveClick = useCallback(async () => {
    setSaveStatus('saving');
    const savedId = await handleSave(formData.status || 'draft');
    if (savedId) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      // Pass the real saved listing ID (important for new listings)
      if (onSaveComplete) onSaveComplete(typeof savedId === 'string' ? savedId : listingId);
    }
  }, [handleSave, formData.status, listingId, onSaveComplete]);

  // Handle save as draft
  const handleSaveDraftClick = useCallback(async () => {
    setSaveStatus('saving');
    const savedId = await handleSaveDraft();
    if (savedId) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      // Pass the real saved listing ID (important for new listings)
      if (onSaveComplete) onSaveComplete(typeof savedId === 'string' ? savedId : listingId);
    }
  }, [handleSaveDraft, listingId, onSaveComplete]);

  // Handle publish
  const handlePublishClick = useCallback(async () => {
    setSaveStatus('publishing');
    const savedId = await handlePublish();
    if (savedId) {
      setSaveStatus('published');
      setTimeout(() => setSaveStatus(null), 3000);
      // Pass the real saved listing ID (important for new listings)
      if (onSaveComplete) onSaveComplete(typeof savedId === 'string' ? savedId : listingId);
    }
  }, [handlePublish, listingId, onSaveComplete]);

  // Handle cancel/discard
  const handleDiscardClick = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Are you sure you want to discard your changes? This cannot be undone.'
      );
      if (!confirmed) return;
    }
    if (onCancel) {
      onCancel();
    }
  }, [hasChanges, onCancel]);

  const isEditing = !!listingId;
  const pageTitle = isEditing ? 'Edit Listing' : 'Create Your Business Profile';
  const currentType = LISTING_TYPES.find(t => t.value === formData.listing_type) || LISTING_TYPES[0];

  // Compute grid layout and panel visibility based on viewMode
  const gridCols = viewMode === 'editor' ? '1fr' : viewMode === 'preview' ? '1fr' : '50% 50%';
  const showLeftPanel = viewMode !== 'preview';
  const showRightPanel = viewMode !== 'editor';

  // Luxury Design System tokens, adapt to light/dark mode
  const LUX = darkMode ? {
    gold: '#C9A84C', goldHover: '#D4B85E',
    green: '#22C55E', greenHover: '#16A34A',
    red: '#EF4444', redHover: '#DC2626',
    bg: C.black, card: C.card,
    border: C.border,
    text: C.white, muted: C.grey,
  } : {
    gold: '#8A6A18', goldHover: '#A37C1E',
    green: '#0B5D3B', greenHover: '#0E7348',
    red: '#C8102E', redHover: '#A60F26',
    bg: '#F2EFE9', card: '#F8F6F2',
    border: '#D9D2C6',
    text: '#222222', muted: '#777777',
  };

  return (
    <div className={darkMode ? 'lse-dark' : ''} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: LUX.bg, width: '100%' }}>
      {darkMode && (
        <style>{`
          .lse-dark input,
          .lse-dark textarea,
          .lse-dark select {
            background-color: #1e1e1e !important;
            color: #ffffff !important;
            border-color: #2a2a2a !important;
          }
          .lse-dark input::placeholder,
          .lse-dark textarea::placeholder {
            color: #888888 !important;
          }
          .lse-dark option {
            background-color: #1e1e1e;
            color: #ffffff;
          }
          .lse-dark h1, .lse-dark h2, .lse-dark h3,
          .lse-dark h4, .lse-dark h5, .lse-dark h6 {
            color: #ffffff !important;
          }
          .lse-dark label {
            color: #aaaaaa !important;
          }
          .lse-dark p {
            color: #cccccc !important;
          }
        `}</style>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .ls-toolbar {
            flex-wrap: wrap !important;
            padding: 8px 12px !important;
            row-gap: 6px !important;
          }
          .ls-toolbar-vm {
            order: 3;
            width: 100%;
            justify-content: center;
            border-top: 1px solid rgba(0,0,0,0.08);
            padding-top: 6px;
          }
          .ls-toolbar-div { display: none !important; }
          .ls-toolbar-save {
            order: 2;
            flex-shrink: 0;
          }
          .ls-toolbar-save button {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .ls-editor-panel {
            padding: 16px 14px 40px !important;
          }
          .ls-panel-right[data-split="true"] {
            display: none !important;
          }
          .ls-panels-grid[data-split="true"] {
            grid-template-columns: 1fr !important;
          }
          .ls-hero-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .ls-section-header {
            padding: 8px 10px !important;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          FULL-WIDTH ACTION BAR (above the split panels)
      ═══════════════════════════════════════════════════════ */}
      <div className="ls-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: `1px solid ${LUX.border}`,
        backgroundColor: LUX.bg,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Left: AI tools */}
        <div className="ls-toolbar-left" style={{ display: 'flex', gap: 8, order: 1 }}>
          <button
            type="button"
            onClick={() => setShowAIImport(true)}
            disabled={loading}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: darkMode ? '#ffffff' : '#1a1a1a',
              color: darkMode ? '#0a0a0a' : '#ffffff',
              border: 'none',
              borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Magic AI
          </button>
          <button
            type="button"
            onClick={() => setShowAITools(true)}
            disabled={loading}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: LUX.text,
              border: `1px solid ${LUX.border}`, borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Fill with AI
          </button>
        </div>

        {/* Save actions, order:2 so they stay on row 1 next to AI tools on mobile */}
        <div className="ls-toolbar-save" style={{ display: 'flex', gap: 8, order: 2, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={handleDiscardClick}
            disabled={loading}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: LUX.muted,
              border: `1px solid ${LUX.border}`, borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={loading || !hasChanges}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: LUX.text,
              border: `1px solid ${LUX.border}`, borderRadius: 6,
              cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: loading || !hasChanges ? 0.35 : 1,
            }}
          >
            {uploadProgress || (saveStatus === 'saving' ? 'Saving…' : 'Save')}
          </button>
          <button
            type="button"
            onClick={handleSaveDraftClick}
            disabled={loading || !hasChanges}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: darkMode ? '#ffffff' : '#1a1a1a',
              color: darkMode ? '#0a0a0a' : '#ffffff',
              border: 'none',
              borderRadius: 6, cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: loading || !hasChanges ? 0.35 : 1,
            }}
          >
            {uploadProgress || (saveStatus === 'saving' ? 'Saving…' : 'Save Draft')}
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={loading}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: darkMode ? '#ffffff' : '#1a1a1a',
              color: darkMode ? '#0a0a0a' : '#ffffff',
              border: 'none',
              borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {saveStatus === 'publishing' ? 'Publishing…' : 'Publish'}
          </button>
        </div>

        {/* View mode text links, order:3 so they wrap to row 2 on mobile */}
        <div className="ls-toolbar-vm" style={{ display: 'flex', gap: 16, alignItems: 'center', order: 3 }}>
          {/* Divider, hidden on mobile */}
          <span className="ls-toolbar-div" style={{ width: 1, height: 16, backgroundColor: LUX.border, display: 'inline-block' }} />
          {['split', 'editor', 'preview'].map((mode) => {
            const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
            const isActive = viewMode === mode;
            return (
              <span
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: isActive ? LUX.text : LUX.muted,
                  cursor: 'pointer',
                  borderBottom: isActive ? `1px solid ${LUX.text}` : '1px solid transparent',
                  paddingBottom: 1,
                }}
              >
                {modeLabel}
              </span>
            );
          })}
          {/* View live page - only show when listing has a slug */}
          {formData.slug && (
            <>
              <span style={{ width: 1, height: 16, backgroundColor: LUX.border, display: 'inline-block' }} />
              <span
                onClick={() => {
                  const slug = formData.slug;
                  const listingType = formData.listing_type || 'venue';
                  // venue -> /venues/{slug}, others stay on /venues for now
                  const url = `/venues/${slug}`;
                  window.open(url, '_blank');
                }}
                title="Open live listing page in new tab"
                style={{
                  fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#c9a84c',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  paddingBottom: 1,
                  borderBottom: '1px solid transparent',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                View Page <span style={{ fontSize: 13, lineHeight: 1 }}>↗</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SPLIT PANELS GRID
      ═══════════════════════════════════════════════════════ */}
      <div className="ls-panels-grid" data-split={viewMode === 'split' ? 'true' : 'false'} style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: 0,
        flex: 1,
      }}>
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL: Editor
      ═══════════════════════════════════════════════════════ */}
      {showLeftPanel && (
      <div className="ls-editor-panel" style={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 48px)',
        padding: '28px 32px 60px',
        backgroundColor: LUX.bg,
        color: LUX.text,
        borderRight: viewMode === 'split' ? `1px solid ${LUX.border}40` : 'none',
        order: viewMode === 'preview' ? 2 : 1,
      }}>

        {/* ── PAGE HEADER ───────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 600,
            color: LUX.text,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: 14, color: LUX.muted, margin: 0, fontWeight: 400 }}>
            {currentType.label} listing
            {isEditing ? ', update details below' : ', fill in the details below'}
          </p>
        </div>



        {/* AI Import panel, Populate with AI */}
        {showAIImport && (
          <AIImportPanel
            formData={formData}
            onChange={handleChange}
            listingId={listingId}
            onClose={(appliedCount) => {
              setShowAIImport(false);
              if (appliedCount > 0) {
                setImportToast({ count: appliedCount });
                setTimeout(() => setImportToast(null), 5000);
              }
            }}
          />
        )}

        {/* AI Fill panel, quick text-only fill */}
        {showAITools && (
          <AIContentTools
            formData={formData}
            onChange={handleChange}
            listingId={listingId}
            darkMode={darkMode}
            onClose={() => setShowAITools(false)}
          />
        )}

        {/* ── AI IMPORT SUCCESS TOAST ──────────────────────── */}
        {importToast && (
          <div style={{
            backgroundColor: darkMode ? '#064e3b' : '#f0fdf4',
            color: darkMode ? '#bbf7d0' : LUX.green,
            padding: '12px 16px',
            borderRadius: 6,
            marginBottom: 16,
            border: `1px solid ${darkMode ? '#059669' : '#bbf7d0'}`,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div>
              <strong>Listing populated from {importToast.count} section{importToast.count !== 1 ? 's' : ''}.</strong>
              {' '}Review the form below, then click <strong>Save Draft</strong> to save your changes.
            </div>
          </div>
        )}

        {/* ── ERROR / SUCCESS MESSAGES ──────────────────────── */}
        {error && (
          <div style={{
            backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
            color: darkMode ? '#fecaca' : '#991b1b',
            padding: '12px 16px',
            borderRadius: 6,
            marginBottom: 20,
            border: `1px solid ${darkMode ? '#991b1b' : '#fecaca'}`,
            fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {(saveStatus === 'saved' || saveStatus === 'published') && (
          <div style={{
            backgroundColor: darkMode ? '#064e3b' : '#f0fdf4',
            color: darkMode ? '#ecfdf5' : LUX.green,
            padding: '14px 20px',
            borderRadius: 6,
            marginBottom: 24,
            border: `1px solid ${darkMode ? '#059669' : '#bbf7d0'}`,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <span>
              {saveStatus === 'saved'
                ? `Listing saved as draft, "${formData.venue_name || 'Untitled'}"`
                : `Listing published successfully, "${formData.venue_name || 'Untitled'}"`}
            </span>
          </div>
        )}
        {saveStatus === 'saving' && (
          <div style={{
            backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
            color: darkMode ? '#94a3b8' : LUX.muted,
            padding: '14px 20px',
            borderRadius: 6,
            marginBottom: 24,
            border: `1px solid ${darkMode ? '#334155' : LUX.border}`,
            fontSize: 13,
            fontWeight: 500,
          }}>
            Saving…
          </div>
        )}

        {/* ── LISTING TYPE SELECTOR ─────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <select
            value={formData.listing_type || 'venue'}
            onChange={(e) => handleChange('listing_type', e.target.value)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 32px 8px 12px',
              backgroundColor: darkMode ? LUX.card : '#F4EFE6',
              color: LUX.text,
              border: `1px solid ${LUX.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23777777'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            {LISTING_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── FORM SECTIONS (array-based with controls) ───── */}
        <form style={{ marginBottom: 40, padding: '0 4px' }}>
          {(() => {
            // Compute visible sections based on listing type conditions
            const visibleIds = sectionOrder.filter(id => {
              const cfg = LISTING_SECTIONS.find(s => s.id === id);
              if (!cfg) return false;
              if (cfg.condition === 'showFeatures' && !showFeatures) return false;
              if (cfg.condition === 'showCommercial' && !showCommercial) return false;
              return true;
            });

            return visibleIds.map((sectionId, visIdx) => {
              const config = LISTING_SECTIONS.find(s => s.id === sectionId);
              if (!config) return null;

              const isEnabled = sectionEnabled[sectionId];
              const isLocked = config.locked;
              const isFirst = visIdx === 0;
              const isLast = visIdx === visibleIds.length - 1;
              const SectionComponent = config.Component;

              return (
                <div key={sectionId} style={{ marginBottom: 24 }}>
                  {/* Section Header Bar */}
                  <div className="ls-section-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    backgroundColor: LUX.card,
                    border: `1px solid ${LUX.border}`,
                    borderRadius: isEnabled ? '8px 8px 0 0' : 8,
                    borderBottom: isEnabled ? 'none' : undefined,
                  }}>
                    {/* Move Up/Down, only for unlocked sections */}
                    {!isLocked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(sectionId, 'up')}
                          disabled={isFirst}
                          style={{
                            background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer',
                            fontSize: 10, lineHeight: 1, padding: '1px 4px',
                            color: isFirst ? LUX.border : LUX.muted, transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.color = LUX.gold; }}
                          onMouseLeave={(e) => { if (!isFirst) e.currentTarget.style.color = LUX.muted; }}
                        >▲</button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(sectionId, 'down')}
                          disabled={isLast}
                          style={{
                            background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer',
                            fontSize: 10, lineHeight: 1, padding: '1px 4px',
                            color: isLast ? LUX.border : LUX.muted, transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.color = LUX.gold; }}
                          onMouseLeave={(e) => { if (!isLast) e.currentTarget.style.color = LUX.muted; }}
                        >▼</button>
                      </div>
                    ) : (
                      <div style={{ width: 20 }} />
                    )}

                    {/* Icon */}
                    <span style={{ fontSize: 14 }}>{config.icon}</span>

                    {/* Label */}
                    <span style={{
                      flex: 1, fontSize: 15, fontWeight: 600, color: LUX.text,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {config.label}
                      {isLocked && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: LUX.gold,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          🔒 Locked
                        </span>
                      )}
                    </span>

                    {/* On/Off Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sectionId)}
                      disabled={isLocked}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 12, border: 'none',
                        backgroundColor: isEnabled ? `${LUX.gold}22` : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        color: isEnabled ? LUX.gold : LUX.muted,
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', cursor: isLocked ? 'default' : 'pointer',
                        transition: 'all 0.15s ease', opacity: isLocked ? 0.5 : 1,
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        backgroundColor: isEnabled ? LUX.gold : LUX.muted,
                        transition: 'background-color 0.15s ease',
                      }} />
                      {isEnabled ? 'On' : 'Off'}
                    </button>
                  </div>

                  {/* Section Content */}
                  {isEnabled && (
                    <div style={{
                      backgroundColor: darkMode ? C.card : '#ffffff',
                      color: LUX.text,
                      borderRadius: '0 0 8px 8px',
                      border: `1px solid ${LUX.border}`,
                      borderTop: 'none',
                    }}>
                      <SectionComponent
                        formData={formData}
                        onChange={handleChange}
                        darkMode={darkMode}
                        currentUserId={null}
                      />
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </form>
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL: Live Preview
      ═══════════════════════════════════════════════════════ */}
      {showRightPanel && (
      <div className="ls-panel-right" data-split={viewMode === 'split' ? 'true' : 'false'} style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        backgroundColor: darkMode ? C.black : '#f9f7f3',
        order: viewMode === 'preview' ? 1 : 2,
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${LUX.border}`,
          backgroundColor: LUX.card,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: LUX.muted, textTransform: 'uppercase' }}>
            LIVE PREVIEW
          </span>
        </div>

        {/* Scrollable Preview */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: darkMode ? LUX.bg : '#f9f7f3',
          pointerEvents: 'none',
        }}>
          <ListingLivePreview formData={previewData} />
        </div>
      </div>
      )}
      </div>
    </div>
  );
};

export default ListingEditor;
