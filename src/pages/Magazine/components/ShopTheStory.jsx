import { useState, useRef } from 'react';
import ProductCard from './ProductCard';
import { getProductsByCollection, getProductById } from '../data/products';

const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const GOLD = '#c9a96e';

// ─── ShopTheStory ──────────────────────────────────────────────────────────────
// Used inline in fashion articles.
// Accepts either:
//   categories: [{ label, collectionId }] , grouped tabs with collection refs
//   products: Product[]                    , flat list (no tabs)
export default function ShopTheStory({
  headline = 'Shop the Story',
  categories = [],         // [{ label: 'Gowns', collectionId: 'silhouette-2026-gowns' }]
  products: flatProducts,  // flat override
  isLight = true,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef(null);

  const BG      = isLight ? '#fafaf8' : '#0d0d0b';
  const BORDER  = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  const TEXT    = isLight ? '#1a1806' : '#f5f0e8';
  const MUTED   = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const TAB_OFF = isLight ? 'rgba(30,28,22,0.4)' : 'rgba(245,240,232,0.4)';

  // Resolve products for current tab
  const activeProducts = (() => {
    if (flatProducts?.length) return flatProducts;
    if (!categories.length) return [];
    const cat = categories[activeTab];
    if (!cat) return [];
    return cat.collectionId
      ? getProductsByCollection(cat.collectionId)
      : (cat.products || []).map(id => getProductById(id)).filter(Boolean);
  })();

  const hasTabs = categories.length > 1;

  return (
    <aside style={{
      margin: '56px -32px',
      background: BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      <style>{`
        .sts-scroll { display:flex; gap:0; overflow-x:auto; scrollbar-width:none; }
        .sts-scroll::-webkit-scrollbar { display:none; }
        .sts-tab { font-family:${FU}; font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; background:none; border:none; padding:14px 20px; cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; transition:color 0.2s,border-color 0.2s; }
        .sts-tab:hover { color:${TEXT} !important; }
        .sts-tab.active { color:${GOLD} !important; border-bottom-color:${GOLD} !important; }
        .sts-products { display:flex; gap:0; overflow-x:auto; scrollbar-width:thin; scroll-snap-type:x mandatory; padding:0; }
        .sts-products::-webkit-scrollbar { height:3px; }
        .sts-products::-webkit-scrollbar-track { background:transparent; }
        .sts-products::-webkit-scrollbar-thumb { background:${GOLD}50; border-radius:2px; }
        .sts-item { flex:0 0 220px; scroll-snap-align:start; }
        @media (min-width:640px) { .sts-item { flex:0 0 240px; } }
        @media (min-width:1024px) { .sts-item { flex:0 0 260px; } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '24px 28px 0',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 18, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
            {headline}
          </span>
        </div>

        {/* Category Tabs */}
        {hasTabs && (
          <div className="sts-scroll">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`sts-tab${activeTab === i ? ' active' : ''}`}
                style={{ color: activeTab === i ? GOLD : TAB_OFF }}
                onClick={() => setActiveTab(i)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
        {!hasTabs && categories[0] && (
          <div style={{ paddingBottom: 12 }}>
            <span style={{ fontFamily: FD, fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 400, color: TEXT }}>
              {categories[0].label}
            </span>
          </div>
        )}
      </div>

      {/* Product scroll row */}
      <div ref={scrollRef} className="sts-products" style={{ padding: '24px 28px' }}>
        {activeProducts.length === 0 ? (
          <div style={{ fontFamily: FU, fontSize: 12, color: MUTED, padding: '20px 0' }}>
            No products in this edit yet.
          </div>
        ) : (
          activeProducts.map(p => (
            <div key={p.id} className="sts-item">
              <ProductCard product={p} variant="portrait" isLight={isLight} />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 28px 18px',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: FU, fontSize: 10, color: MUTED }}>
          {activeProducts.length} item{activeProducts.length !== 1 ? 's' : ''} in this edit
        </span>
        <span style={{ fontFamily: FU, fontSize: 9, color: MUTED, letterSpacing: '0.06em' }}>
          Affiliate links · Editorial selection
        </span>
      </div>
    </aside>
  );
}

// ─── Inline variant: ShopTheLook ───────────────────────────────────────────────
// Compact 3-item row for embedding mid-article
export function ShopTheLook({ products = [], headline = 'Shop the Look', isLight = true }) {
  const BG     = isLight ? '#fafaf8' : '#0d0d0b';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  const TEXT   = isLight ? '#1a1806' : '#f5f0e8';
  const MUTED  = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';

  const items = products.slice(0, 3);
  if (!items.length) return null;

  return (
    <div style={{
      margin: '48px 0',
      background: BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 2,
      padding: '28px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 16, height: 1, background: GOLD }} />
        <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
          {headline}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {items.map(p => (
          <ProductCard key={p.id} product={p} variant="portrait" isLight={isLight} />
        ))}
      </div>
    </div>
  );
}
