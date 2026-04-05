/**
 * RegionHero.jsx
 * Hero section for region pages
 */
export default function RegionHero({ region }) {
  return (
    <div style={{
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #c9a96e, #e8c89b)',
      color: '#1a1208',
      textAlign: 'center',
      minHeight: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>
          {region?.name || 'Region'}
        </h1>
        {region?.description && (
          <p style={{ margin: '12px 0 0', fontSize: '16px', opacity: 0.8 }}>
            {region.description}
          </p>
        )}
      </div>
    </div>
  );
}
