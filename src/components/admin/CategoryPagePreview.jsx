// ─── CategoryPagePreview.jsx ──────────────────────────────────────────────────
// Live preview panel for a category SEO/content form — rendered inside the
// admin CategoriesModule detail editor.
// Props: form (seoForm shape), categoryName
// ─────────────────────────────────────────────────────────────────────────────

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

export default function CategoryPagePreview({ form = {}, categoryName = '' }) {
  const title   = form.h1 || form.titleTag || categoryName || 'Category';
  const intro   = form.introText || form.metaDescription || '';
  const body    = form.bodyHtml || form.pageContent || '';
  const ogImage = form.ogImage || form.thumbnail?.url || '';

  return (
    <div style={{
      background: '#faf9f6', borderRadius: 6,
      overflow: 'hidden', border: '1px solid #e4e0d8',
      fontFamily: NU,
    }}>
      {/* Browser chrome mockup */}
      <div style={{ background: '#f0ede6', borderBottom: '1px solid #e4e0d8', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e85d5d' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5a623' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf7d' }} />
        <div style={{
          marginLeft: 8, flex: 1, background: '#fff',
          borderRadius: 3, padding: '3px 10px',
          fontSize: 10, color: '#888', border: '1px solid #ddd',
        }}>
          luxuryweddingdirectory.com/category/{form.slug || '…'}
        </div>
      </div>

      {/* OG image preview (if set) */}
      {ogImage && (
        <div style={{ height: 120, overflow: 'hidden', background: '#111' }}>
          <img src={ogImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Content preview */}
      <div style={{ padding: '18px 20px' }}>
        {/* H1 */}
        <h1 style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: '#1a1a18', margin: '0 0 10px', lineHeight: 1.2 }}>
          {title}
        </h1>

        {/* Intro */}
        {intro && (
          <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.65, margin: '0 0 12px' }}>
            {intro.slice(0, 200)}{intro.length > 200 ? '…' : ''}
          </p>
        )}

        {/* Body snippet */}
        {body && (
          <div
            style={{ fontSize: 12, color: '#6b6560', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: body.slice(0, 400) }}
          />
        )}

        {!intro && !body && (
          <p style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic', margin: 0 }}>
            Add intro text or body content to see a preview.
          </p>
        )}
      </div>
    </div>
  );
}
