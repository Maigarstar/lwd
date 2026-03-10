import { useState, useCallback } from 'react';
import ListingEditor from './ListingEditor';
import { getLightPalette } from '../../theme/tokens';

// Use light palette for listing studio
const C = getLightPalette();

/**
 * ListingStudio router page
 * Handles different modes: new, edit, preview, publishing
 * Can be expanded with additional views as features are added
 */
const ListingStudioPage = ({ navigationState = {}, onNavigate = () => {}, onSaveComplete: parentOnSaveComplete = null }) => {
  const { mode = 'new', listingId = null, returnTo = 'listings' } = navigationState;
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentListingId, setCurrentListingId] = useState(listingId);

  // Handle successful save — stay on page and switch to edit mode
  const handleSaveComplete = useCallback((savedListingId) => {
    if (savedListingId && typeof savedListingId === 'string') {
      console.log('ListingStudioPage: Save complete, switching to edit mode for:', savedListingId);
      // Switch from 'new' to 'edit' mode with the saved listing ID
      setCurrentMode('edit');
      setCurrentListingId(savedListingId);
      // Notify parent to update the URL hash
      if (parentOnSaveComplete) parentOnSaveComplete(savedListingId);
    }
  }, [parentOnSaveComplete]);

  // Handle cancel/discard — navigate back to listings
  const handleCancel = useCallback(() => {
    onNavigate();
  }, [onNavigate]);

  // Current mode determines which view to render
  if (!currentMode) {
    return (
      <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px', color: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1>Error: No mode set</h1>
          <p>currentMode is: {currentMode}, mode from navigationState is: {mode}</p>
        </div>
      </div>
    );
  }

  switch (currentMode) {
    case 'new':
      return (
        <ListingEditor
          listingId={null}
          onCancel={handleCancel}
          onSaveComplete={handleSaveComplete}
        />
      );

    case 'edit':
      return (
        <ListingEditor
          key={currentListingId}
          listingId={currentListingId}
          onCancel={handleCancel}
          onSaveComplete={handleSaveComplete}
        />
      );

    case 'preview':
      return (
        <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px', color: C.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ marginBottom: 20 }}>Preview Mode</h1>
            <p style={{ color: '#999', marginBottom: 20 }}>
              Preview functionality will be available in a future update.
            </p>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: C.gold,
                color: C.black,
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Back to Editor
            </button>
          </div>
        </div>
      );

    case 'publishing':
      return (
        <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px', color: C.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ marginBottom: 20 }}>Publishing Workflow</h1>
            <p style={{ color: '#999', marginBottom: 20 }}>
              Advanced publishing options will be available in a future update.
            </p>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: C.gold,
                color: C.black,
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Back to Editor
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px', color: C.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1>Unknown Mode</h1>
            <p style={{ color: '#999' }}>Mode "{currentMode}" not recognized</p>
          </div>
        </div>
      );
  }
};

export default ListingStudioPage;
