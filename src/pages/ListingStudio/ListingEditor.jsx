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
import SEOSection from './sections/SEOSection';
import { getLightPalette } from '../../theme/tokens';

const NU = "'Nunito', sans-serif";
const GD = "'Playfair Display', Georgia, serif";

/**
 * Full-page split-panel listing editor
 * Left: Editor sections (45%)
 * Right: Live preview (55%)
 * Handles creating and editing venue listings
 */
const ListingEditor = ({ listingId = null, onCancel = null, onSaveComplete = null }) => {
  const { formData, handleChange, handleSaveDraft, handlePublish, loading, error, hasChanges } = useListingForm(listingId);
  const previewData = useListingPreview(formData);
  const [saveStatus, setSaveStatus] = useState(null);

  // Always use light palette
  const C = getLightPalette();

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '45% 55%',
      gap: 0,
      minHeight: '100vh',
      backgroundColor: '#fff',
      width: '100vw',
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    }}>
      {/* LEFT PANEL: Editor */}
      <div style={{
        overflow: 'auto',
        maxHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: C.black,
        borderRight: `1px solid ${C.border}`,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: C.white, marginBottom: 8 }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: 14, color: C.off }}>
            {isEditing ? 'Update your venue listing details' : 'Create a new venue listing'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: 4,
              marginBottom: 20,
              border: '1px solid #f5c6cb',
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Success message */}
        {saveStatus === 'saved' && (
          <div
            style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px 16px',
              borderRadius: 4,
              marginBottom: 20,
              border: '1px solid #c3e6cb',
              fontSize: 14,
            }}
          >
            ✓ Listing saved as draft
          </div>
        )}
        {saveStatus === 'published' && (
          <div
            style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px 16px',
              borderRadius: 4,
              marginBottom: 20,
              border: '1px solid #c3e6cb',
              fontSize: 14,
            }}
          >
            ✓ Listing published successfully
          </div>
        )}

        {/* Form sections - vertically stacked */}
        <form style={{ marginBottom: 40 }}>
          <BasicDetailsSection formData={formData} onChange={handleChange} />
          <LocationSection formData={formData} onChange={handleChange} />
          <DescriptionSection formData={formData} onChange={handleChange} />
          <FeaturesSection formData={formData} onChange={handleChange} />
          <CommercialDetailsSection formData={formData} onChange={handleChange} />
          <MediaSection formData={formData} onChange={handleChange} />
          <SEOSection formData={formData} onChange={handleChange} />

          {/* Action buttons */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 20,
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {/* Discard button */}
            <button
              type="button"
              onClick={handleDiscardClick}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                backgroundColor: 'transparent',
                color: C.textSecondary,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Discard
            </button>

            {/* Save as draft button */}
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={loading || !hasChanges}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                backgroundColor: '#555',
                color: C.white,
                border: 'none',
                borderRadius: 3,
                cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
                opacity: loading || !hasChanges ? 0.6 : 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && hasChanges) {
                  e.target.style.backgroundColor = '#777';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#555';
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save as Draft'}
            </button>

            {/* Publish button */}
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                backgroundColor: C.gold,
                color: C.black,
                border: 'none',
                borderRadius: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#e8c200';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = C.gold;
              }}
            >
              {saveStatus === 'publishing' ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#f9f7f3',
      }}>
        <ListingLivePreview formData={previewData} C={C} />
      </div>
    </div>
  );
};

export default ListingEditor;
