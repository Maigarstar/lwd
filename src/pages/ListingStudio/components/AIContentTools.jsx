import { getLightPalette } from '../../../theme/tokens';

const C = getLightPalette();

/**
 * AI Content Tools component - placeholder for future implementation
 * Will provide AI-powered content generation and optimization tools
 */
const AIContentTools = ({ listingId = null }) => {
  return (
    <div style={{ backgroundColor: C.black, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ color: C.white, marginBottom: 20 }}>AI Content Tools</h2>
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
            AI-powered content generation tools will be available in a future update
          </p>
          <p style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
            Generate descriptions, SEO content, and more with AI assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIContentTools;
