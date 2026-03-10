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
import { getLightPalette } from '../../theme/tokens';

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
const ListingEditor = ({ listingId = null, onCancel = null, onSaveComplete = null }) => {
  const { formData, handleChange, handleSaveDraft, handlePublish, loading, error, hasChanges } = useListingForm(listingId);
  const previewData = useListingPreview(formData);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showAITools,    setShowAITools]    = useState(false);
  const [showAIImport,   setShowAIImport]   = useState(false);
  const [importToast,    setImportToast]    = useState(null); // { count: n }
  const [viewMode,       setViewMode]       = useState('split');

  // Always use light palette
  const C = getLightPalette();

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

  // Handle view mode change
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ls_view_mode', mode);
    } catch (e) {
      console.warn('Failed to save view mode preference:', e);
    }
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols,
      gap: 0,
      minHeight: '100vh',
      backgroundColor: '#fff',
      width: '100%',
    }}>
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL: Editor
      ═══════════════════════════════════════════════════════ */}
      {showLeftPanel && (
      <div style={{
        overflow: 'auto',
        maxHeight: '100vh',
        padding: '32px 24px 60px',
        backgroundColor: C.black,
        borderRight: viewMode === 'split' ? `1px solid ${C.border}` : 'none',
        order: viewMode === 'preview' ? 2 : 1,
        animation: 'slideInLeft 0.3s ease-out',
      }}>
        <style>{`
          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>

        {/* ── LISTING TYPE SELECTOR ─────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: C.grey,
            margin: '0 0 10px 0',
          }}>
            Listing Type
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LISTING_TYPES.map(type => {
              const isActive = formData.listing_type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('listing_type', type.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    border: `1px solid ${isActive ? C.gold : C.border}`,
                    borderRadius: 20,
                    backgroundColor: isActive ? C.gold : 'transparent',
                    color: isActive ? '#fff' : C.grey,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.2px',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{type.icon}</span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PAGE HEADER ───────────────────────────────────── */}
        <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.white,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: 13, color: C.grey, margin: 0 }}>
            {currentType.icon} {currentType.label} listing
            {isEditing ? ' — update details below' : ' — fill in the details below'}
          </p>
        </div>

        {/* ── TOP ACTION BAR (sticky) ─────────────────────────── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: C.black,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          {/* Discard */}
          <button
            type="button"
            onClick={handleDiscardClick}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              backgroundColor: 'transparent',
              color: C.grey,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            Discard
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            onClick={handleSaveDraftClick}
            disabled={loading || !hasChanges}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              backgroundColor: '#555',
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: loading || !hasChanges ? 0.5 : 1,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>

          {/* Populate with AI */}
          <button
            type="button"
            onClick={() => setShowAIImport(true)}
            disabled={loading}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              backgroundColor: C.gold,
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontWeight: 700,
              transition: 'all 0.2s ease',
              letterSpacing: '0.2px',
            }}
          >
            📂 Populate with AI
          </button>

          {/* AI Fill (quick, text-only) */}
          <button
            type="button"
            onClick={() => setShowAITools(true)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              backgroundColor: 'transparent',
              color: C.gold,
              border: `1px solid ${C.gold}`,
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              letterSpacing: '0.2px',
            }}
          >
            ✦ Fill
          </button>

          {/* View Mode Control — Split / Editor / Preview */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              paddingRight: 8,
              borderRight: `1px solid ${C.border}`,
            }}
          >
            {['split', 'editor', 'preview'].map((mode) => {
              const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleViewModeChange(mode)}
                  title={modeLabel}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    padding: '8px 10px',
                    backgroundColor: isActive ? C.gold : 'transparent',
                    color: isActive ? '#fff' : C.grey2,
                    border: `1px solid ${isActive ? C.gold : C.border}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isActive ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isActive ? C.gold2 : `${C.gold}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isActive ? C.gold : 'transparent';
                  }}
                >
                  {modeLabel}
                </button>
              );
            })}
          </div>

          {/* Publish */}
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: 12,
              backgroundColor: C.gold,
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 700,
              transition: 'all 0.2s ease',
              marginLeft: 'auto',
            }}
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
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: 4,
            marginBottom: 16,
            border: '1px solid #bbf7d0',
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
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 4,
            marginBottom: 20,
            border: '1px solid #fecaca',
            fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {(saveStatus === 'saved' || saveStatus === 'published') && (
          <div style={{
            backgroundColor: '#064e3b',
            color: '#ecfdf5',
            padding: '14px 20px',
            borderRadius: 6,
            marginBottom: 24,
            border: '1px solid #059669',
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
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            padding: '14px 20px',
            borderRadius: 6,
            marginBottom: 24,
            border: '1px solid #334155',
            fontSize: 13,
            fontWeight: 500,
          }}>
            Saving…
          </div>
        )}

        {/* ── FORM SECTIONS ─────────────────────────────────── */}
        <form style={{ marginBottom: 40 }}>

          {/* Always visible sections */}
          <BasicDetailsSection formData={formData} onChange={handleChange} />
          <LocationSection formData={formData} onChange={handleChange} />
          <DescriptionSection formData={formData} onChange={handleChange} />

          {/* Venue-only: Features & Amenities */}
          {showFeatures && (
            <FeaturesSection formData={formData} onChange={handleChange} />
          )}

          {/* All except General: Commercial Details */}
          {showCommercial && (
            <CommercialDetailsSection formData={formData} onChange={handleChange} />
          )}

          {/* Always visible sections */}
          <MediaSection formData={formData} onChange={handleChange} />

          {/* Venue-only: Spaces, Rooms & Dining */}
          {showFeatures && (
            <SpacesSection formData={formData} onChange={handleChange} />
          )}
          {showFeatures && (
            <RoomsSection formData={formData} onChange={handleChange} />
          )}
          {showFeatures && (
            <DiningSection formData={formData} onChange={handleChange} />
          )}
          {showFeatures && (
            <CateringCardsSection formData={formData} onChange={handleChange} />
          )}
          {showFeatures && (
            <ExclusiveUseSection formData={formData} onChange={handleChange} />
          )}

          {/* Venue-only: Wedding Weekend + Experiences + FAQ */}
          {showFeatures && (
            <WeddingWeekendSection formData={formData} onChange={handleChange} />
          )}
          {showFeatures && (
            <ExperiencesSection formData={formData} onChange={handleChange} />
          )}
          <FAQSectionEditor formData={formData} onChange={handleChange} />

          <SEOSection formData={formData} onChange={handleChange} />
          <ListingInfoSection formData={formData} onChange={handleChange} />

          {/* ── ACTION BUTTONS ─────────────────────────────── */}
          <div style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}>
            {/* Discard */}
            <button
              type="button"
              onClick={handleDiscardClick}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                backgroundColor: 'transparent',
                color: C.grey,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
            >
              Discard
            </button>

            {/* Save as Draft */}
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={loading || !hasChanges}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                backgroundColor: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
                opacity: loading || !hasChanges ? 0.5 : 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!loading && hasChanges) e.target.style.backgroundColor = '#333'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#555'; }}
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
            </button>

            {/* Publish */}
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: 13,
                backgroundColor: C.gold,
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 700,
                transition: 'all 0.2s ease',
                marginLeft: 'auto',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = C.gold2; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = C.gold; }}
            >
              {saveStatus === 'publishing' ? 'Publishing…' : '↑ Publish Listing'}
            </button>
          </div>
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
        backgroundColor: '#f9f7f3',
        order: viewMode === 'preview' ? 1 : 2,
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          minHeight: 50,
        }}>
          <span style={{ fontSize: 12, color: C.grey2 }}>
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
                    backgroundColor: isActive ? C.gold : 'transparent',
                    color: isActive ? '#fff' : C.grey2,
                    border: `1px solid ${isActive ? C.gold : C.border}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isActive ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? C.gold2 || '#7a5c0f' : `${C.gold}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? C.gold : 'transparent';
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
