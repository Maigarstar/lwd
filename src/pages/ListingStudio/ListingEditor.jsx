import { useState, useCallback } from 'react';
import { useListingForm } from './hooks/useListingForm';
import useListingPreview from './hooks/useListingPreview';
import ListingLivePreview from './preview/ListingLivePreview';
import BasicDetailsSection from './sections/BasicDetailsSection';
import LocationSection from './sections/LocationSection';
import DescriptionSection from './sections/DescriptionSection';
import FeaturesSection from './sections/FeaturesSection';
import CommercialDetailsSection from './sections/CommercialDetailsSection';
import MediaSection from './sections/MediaSection';
import SpacesSection from './sections/SpacesSection';
import RoomsSection from './sections/RoomsSection';
import DiningSection from './sections/DiningSection';
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

  // Always use light palette
  const C = getLightPalette();

  // Determine which sections to show based on listing type
  const { showFeatures, showCommercial } = getSectionVisibility(formData.listing_type);

  // Handle save as draft
  const handleSaveDraftClick = useCallback(async () => {
    setSaveStatus('saving');
    const success = await handleSaveDraft();
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
      if (onSaveComplete) onSaveComplete(listingId);
    }
  }, [handleSaveDraft, listingId, onSaveComplete]);

  // Handle publish
  const handlePublishClick = useCallback(async () => {
    setSaveStatus('publishing');
    const success = await handlePublish();
    if (success) {
      setSaveStatus('published');
      setTimeout(() => setSaveStatus(null), 2000);
      if (onSaveComplete) onSaveComplete(listingId);
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '50% 50%',
      gap: 0,
      minHeight: '100vh',
      backgroundColor: '#fff',
      width: '100%',
    }}>
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL: Editor
      ═══════════════════════════════════════════════════════ */}
      <div style={{
        overflow: 'auto',
        maxHeight: '100vh',
        padding: '32px 24px 60px',
        backgroundColor: C.black,
        borderRight: `1px solid ${C.border}`,
      }}>

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

        {saveStatus === 'saved' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: 4,
            marginBottom: 20,
            border: '1px solid #bbf7d0',
            fontSize: 13,
          }}>
            ✓ Saved as draft
          </div>
        )}
        {saveStatus === 'published' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: 4,
            marginBottom: 20,
            border: '1px solid #bbf7d0',
            fontSize: 13,
          }}>
            ✓ Listing published successfully
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

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL: Live Preview
      ═══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#f9f7f3',
      }}>
        <ListingLivePreview formData={previewData} />
      </div>
    </div>
  );
};

export default ListingEditor;
