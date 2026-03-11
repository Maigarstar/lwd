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
import { getLightPalette, getDarkPalette } from '../../theme/tokens';

/**
 * Listing type configuration — controls which sections are visible
 * and what label/icon represents each listing type.
 */
const LISTING_TYPES = [
  { value: 'venue',        label: 'Venue',         icon: '🏛' },
  { value: 'planner',     label: 'Planner',       icon: '📋' },
  { value: 'photographer',label: 'Photographer',  icon: '📸' },
  { value: 'videographer',label: 'Videographer',  icon: '🎬' },
  { value: 'general',     label: 'General',       icon: '📌' },
];

/**
 * Section configuration — maps each editor section to its component, label, icon,
 * lock status, and visibility condition (based on listing type).
 */
const LISTING_SECTIONS = [
  { id: 'basic',       label: 'Basic Details',        icon: '📋', Component: BasicDetailsSection,      locked: true,  condition: null },
  { id: 'location',    label: 'Location',             icon: '📍', Component: LocationSection,          locked: false, condition: null },
  { id: 'description', label: 'Description',          icon: '✎',  Component: DescriptionSection,       locked: false, condition: null },
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
  const { formData, handleChange, handleSaveDraft, handlePublish, loading, error, hasChanges } = useListingForm(listingId);
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
  const pageTitle = isEditing ? 'Edit Listing' : 'Create New Listing';
  const currentType = LISTING_TYPES.find(t => t.value === formData.listing_type) || LISTING_TYPES[0];

  // Compute grid layout and panel visibility based on viewMode
  const gridCols = viewMode === 'editor' ? '1fr' : viewMode === 'preview' ? '1fr' : '50% 50%';
  const showLeftPanel = viewMode !== 'preview';
  const showRightPanel = viewMode !== 'editor';

  // Luxury Design System tokens — adapt to light/dark mode
  const LUX = darkMode ? {
    gold: '#C9A84C', goldHover: '#D4B85E',
    green: '#22C55E', greenHover: '#16A34A',
    red: '#EF4444', redHover: '#DC2626',
    bg: C.black, card: C.card,
    border: C.border,
    text: C.white, muted: C.grey2,
  } : {
    gold: '#8A6A18', goldHover: '#A37C1E',
    green: '#0B5D3B', greenHover: '#0E7348',
    red: '#C8102E', redHover: '#A60F26',
    bg: '#F2EFE9', card: '#F8F6F2',
    border: '#D9D2C6',
    text: '#222222', muted: '#777777',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols,
      gap: 0,
      minHeight: '100vh',
      backgroundColor: LUX.bg,
      width: '100%',
    }}>
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL: Editor
      ═══════════════════════════════════════════════════════ */}
      {showLeftPanel && (
      <div style={{
        overflow: 'auto',
        maxHeight: '100vh',
        padding: '32px 32px 60px',
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
            {currentType.icon} {currentType.label} listing
            {isEditing ? ' — update details below' : ' — fill in the details below'}
          </p>
        </div>

        {/* ── WORKSPACE BAR (sticky, light) ─────────────────── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 21,
          backgroundColor: LUX.bg,
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            borderRadius: 6,
            overflow: 'hidden',
            border: `1px solid ${LUX.border}`,
          }}>
            {['split', 'editor', 'preview'].map((mode) => {
              const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleViewModeChange(mode)}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '10px 18px',
                    backgroundColor: isActive ? LUX.gold : '#F4F1EA',
                    color: isActive ? '#FFFFFF' : LUX.muted,
                    border: 'none',
                    borderRight: mode !== 'preview' ? `1px solid ${LUX.border}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#EDE9E0'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#F4F1EA'; }}
                >
                  {modeLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LISTING ACTION BAR (sticky below workspace bar) ── */}
        <div style={{
          position: 'sticky',
          top: 48,
          zIndex: 20,
          backgroundColor: LUX.bg,
          padding: '12px 0 16px',
          borderBottom: `1px solid ${LUX.border}40`,
          marginBottom: 32,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          {/* Left group: Venue selector + AI tools */}
          <select
            value={formData.listing_type || 'venue'}
            onChange={(e) => handleChange('listing_type', e.target.value)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 18px',
              backgroundColor: '#F4EFE6',
              color: LUX.text,
              border: `1px solid ${LUX.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.14s ease',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23777777'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: 32,
            }}
          >
            {LISTING_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAIImport(true)}
            disabled={loading}
            style={{
              fontSize: 14, fontWeight: 600, padding: '10px 18px',
              backgroundColor: LUX.gold, color: '#fff', border: 'none',
              borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = LUX.goldHover; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = LUX.gold; }}
          >
            ★ Magic AI
          </button>

          <button
            type="button"
            onClick={() => setShowAITools(true)}
            disabled={loading}
            style={{
              fontSize: 14, fontWeight: 600, padding: '10px 18px',
              backgroundColor: '#F4EFE6', color: LUX.text,
              border: `1px solid ${LUX.border}`, borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#EDE9E0'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#F4EFE6'; }}
          >
            ✦ Fill
          </button>

          {/* Right group: Save actions */}
          <div style={{ marginLeft: 'auto' }} />

          <button
            type="button"
            onClick={handleDiscardClick}
            disabled={loading}
            style={{
              fontSize: 14, fontWeight: 600, padding: '10px 18px',
              backgroundColor: '#F3F1EC', color: LUX.muted,
              border: `1px solid ${LUX.border}`, borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#EDE9E0'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#F3F1EC'; }}
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSaveDraftClick}
            disabled={loading || !hasChanges}
            style={{
              fontSize: 14, fontWeight: 600, padding: '10px 18px',
              backgroundColor: LUX.green, color: '#fff', border: 'none',
              borderRadius: 6, cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: loading || !hasChanges ? 0.5 : 1, transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => { if (!loading && hasChanges) e.currentTarget.style.backgroundColor = LUX.greenHover; }}
            onMouseLeave={(e) => { if (!loading && hasChanges) e.currentTarget.style.backgroundColor = LUX.green; }}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handlePublishClick}
            disabled={loading}
            style={{
              fontSize: 14, fontWeight: 600, padding: '10px 18px',
              backgroundColor: LUX.gold, color: '#fff', border: 'none',
              borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = LUX.goldHover; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = LUX.gold; }}
          >
            {saveStatus === 'publishing' ? 'Publishing…' : '↑ Publish'}
          </button>
        </div>

        {/* AI Import panel — Populate with AI */}
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

        {/* AI Fill panel — quick text-only fill */}
        {showAITools && (
          <AIContentTools
            formData={formData}
            onChange={handleChange}
            listingId={listingId}
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
                ? `Listing saved as draft — "${formData.venue_name || 'Untitled'}"`
                : `Listing published successfully — "${formData.venue_name || 'Untitled'}"`}
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    backgroundColor: LUX.card,
                    border: `1px solid ${LUX.border}`,
                    borderRadius: isEnabled ? '8px 8px 0 0' : 8,
                    borderBottom: isEnabled ? 'none' : undefined,
                  }}>
                    {/* Move Up/Down — only for unlocked sections */}
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

                  {/* Section Content — always light card for form readability */}
                  {isEnabled && (
                    <div style={{
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      borderRadius: '0 0 8px 8px',
                      border: `1px solid ${LUX.border}`,
                      borderTop: 'none',
                    }}>
                      <SectionComponent formData={formData} onChange={handleChange} />
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: darkMode ? C.black : '#f9f7f3',
        order: viewMode === 'preview' ? 1 : 2,
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${LUX.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'space-between',
          backgroundColor: LUX.card,
          minHeight: 50,
        }}>
          <span style={{ fontSize: 12, color: LUX.muted }}>
            LIVE PREVIEW
          </span>

          {/* View Mode Control — Only visible in Preview-Only mode */}
          {viewMode === 'preview' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {['split', 'editor', 'preview'].map((mode) => {
              const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  title={modeLabel}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '6px 8px',
                    backgroundColor: isActive ? LUX.gold : 'transparent',
                    color: isActive ? '#fff' : LUX.muted,
                    border: `1px solid ${isActive ? LUX.gold : LUX.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isActive ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? LUX.goldHover : `${LUX.gold}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? LUX.gold : 'transparent';
                  }}
                >
                  {modeLabel}
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Scrollable Preview */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#f9f7f3',
        }}>
          <ListingLivePreview formData={previewData} />
        </div>
      </div>
      )}
    </div>
  );
};

export default ListingEditor;
