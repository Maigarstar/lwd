import { getDarkPalette } from '../../../theme/tokens';

const C = getDarkPalette();

/**
 * Auto Listing Drop component - placeholder for future implementation
 * Will handle automatic listing publishing and scheduling features
 */
const AutoListingDrop = ({ listingId = null }) => {
  return (
    <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ color: C.white, marginBottom: 20 }}>Auto Listing Drop</h2>
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
            Automatic listing publishing and scheduling will be available in a future update
          </p>
          <p style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
            Schedule when your listing goes live and manage visibility automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoListingDrop;
