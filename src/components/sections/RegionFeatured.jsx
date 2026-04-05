/**
 * RegionFeatured.jsx
 * Featured listings section for region pages
 */
export default function RegionFeatured({ region, listings }) {
  if (!listings || listings.length === 0) return null;

  return (
    <div style={{
      padding: '40px 20px',
      background: '#f9f7f3',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: 24 }}>
          Featured in {region?.name}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {listings.slice(0, 6).map(listing => (
            <div key={listing.id} style={{
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>
                {listing.name || listing.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {listing.type || 'Venue'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
