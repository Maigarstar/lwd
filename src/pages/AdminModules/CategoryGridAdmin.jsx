// ─── CategoryGridAdmin.jsx ────────────────────────────────────────────────────
// Admin module: visual grid view of venue/service categories.
// Companion to CategoriesModule (list view) and CategoriesStudioModule (builder).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

export default function CategoryGridAdmin({ C }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('categories')
          .select('id, name, slug, description, icon, listing_count, is_active, parent_id, sort_order')
          .is('parent_id', null)
          .order('sort_order', { ascending: true })
          .order('name',       { ascending: true });
        if (err) throw err;
        setCategories(data || []);
      } catch (e) {
        console.error('[CategoryGridAdmin] load error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = categories.filter(cat =>
    !search || cat.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg      = C?.bg      || '#0a0a08';
  const surface = C?.surface || '#111110';
  const border  = C?.border  || '#2a2a26';
  const text     = C?.text   || '#f5f0e8';
  const muted    = C?.muted  || 'rgba(245,240,232,0.55)';
  const gold     = C?.accent || '#C9A84C';

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: bg }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, margin: '0 0 6px' }}>
            Admin · Categories
          </p>
          <h1 style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: text, margin: 0 }}>
            Category Grid
          </h1>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories…"
          style={{
            background: surface, border: `1px solid ${border}`,
            color: text, fontFamily: NU, fontSize: 13,
            padding: '8px 14px', borderRadius: 4, width: 220,
            outline: 'none',
          }}
        />
      </div>

      {/* States */}
      {loading && (
        <p style={{ fontFamily: NU, fontSize: 13, color: muted }}>Loading categories…</p>
      )}
      {error && (
        <p style={{ fontFamily: NU, fontSize: 13, color: '#e85d5d' }}>Error: {error}</p>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          <p style={{ fontFamily: NU, fontSize: 12, color: muted, marginBottom: 20 }}>
            {filtered.length} top-level {filtered.length === 1 ? 'category' : 'categories'}
            {search ? ` matching "${search}"` : ''}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(cat => (
              <div
                key={cat.id}
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  padding: '20px 22px',
                  cursor: 'default',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = border}
              >
                {/* Icon / emoji */}
                {cat.icon && (
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{cat.icon}</div>
                )}

                {/* Name */}
                <p style={{ fontFamily: GD, fontSize: 15, color: text, margin: '0 0 4px', fontWeight: 400 }}>
                  {cat.name}
                </p>

                {/* Slug */}
                <p style={{ fontFamily: NU, fontSize: 10, color: gold, letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  /{cat.slug}
                </p>

                {/* Description */}
                {cat.description && (
                  <p style={{ fontFamily: NU, fontSize: 12, color: muted, lineHeight: 1.55, margin: '0 0 12px' }}>
                    {cat.description.slice(0, 80)}{cat.description.length > 80 ? '…' : ''}
                  </p>
                )}

                {/* Footer meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: cat.is_active !== false ? '#4caf7d' : '#e85d5d',
                  }}>
                    {cat.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  {cat.listing_count != null && (
                    <span style={{ fontFamily: NU, fontSize: 11, color: muted }}>
                      {cat.listing_count} listing{cat.listing_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <p style={{ fontFamily: NU, fontSize: 13, color: muted, gridColumn: '1 / -1' }}>
                No categories found{search ? ` for "${search}"` : ''}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
