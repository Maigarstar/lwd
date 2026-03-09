import { useState, useCallback } from 'react';
import ListingEditor from './ListingEditor';
import { C } from '../../theme/tokens';

/**
 * ListingStudio router page
 * Handles different modes: new, edit, preview, publishing
 * Can be expanded with additional views as features are added
 */
const ListingStudioPage = ({ navigationState = {}, onNavigate = () => {} }) => {
  const { mode = 'new', listingId = null, returnTo = 'listings' } = navigationState;
  const [currentMode, setCurrentMode] = useState(mode);

  // Handle successful save
  const handleSaveComplete = useCallback((savedListingId) => {
    console.log('Listing saved:', savedListingId);
    // Could add more complex logic here for post-save actions
    // For now, just show success and optionally navigate back
  }, []);

  // Handle cancel/discard
  const handleCancel = useCallback(() => {
    // Navigate back to listings module
    onNavigate('page', 'admin', 'listings');
  }, [onNavigate]);

  // Current mode determines which view to render
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
          listingId={listingId}
          onCancel={handleCancel}
          onSaveComplete={handleSaveComplete}
        />
      );

    case 'preview':
      // Preview mode - placeholder for future implementation
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
      // Publishing workflow - placeholder for future implementation
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
