import { getDarkPalette } from '../../../theme/tokens';

const C = getDarkPalette();

/**
 * Listing preview component - placeholder for future implementation
 * Will show how the listing appears to users on the platform
 */
const ListingPreview = ({ listingId = null }) => {
  return (
    <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ color: C.white, marginBottom: 20 }}>Live Preview</h2>
        <div
          style={{
            backgroundColor: C.darkGray,
            border: `1px solid ${C.lightBorder}`,
            borderRadius: 8,
            padding: 20,
            color: C.textSecondary,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14 }}>
            Preview functionality will be available in a future update
          </p>
          <p style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
            Shows how your listing will appear to visitors
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingPreview;
