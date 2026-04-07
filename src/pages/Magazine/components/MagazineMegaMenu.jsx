// MagazineMegaMenu.jsx
// Vogue/Condé Nast-style mega menu for magazine navigation
// Shows sections and featured content when hovering over categories
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SANS = "'Inter', 'Helvetica Neue', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = '#c9a84c';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function MagazineMegaMenu({
  isLight = false,
  activeCategoryId = null,
  onNavigateCategory,
  categories = [],
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [sectionsMap, setSectionsMap] = useState({}); // { categoryId: [sections] }
  const [loadingCategory, setLoadingCategory] = useState(null);

  // Load sections for a category when hovering
  const loadSectionsForCategory = async (categoryId) => {
    if (sectionsMap[categoryId]) {
      setHoveredCategory(categoryId);
      return; // Already cached
    }

    setLoadingCategory(categoryId);
    try {
      const { data, error } = await supabase
        .from('mag_sections')
        .select('*')
        .eq('mag_nav_item_id', categoryId)
        .eq('show_on_nav', true)
        .order('position', { ascending: true });

      if (error) throw error;

      setSectionsMap(prev => ({
        ...prev,
        [categoryId]: data || [],
      }));
      setHoveredCategory(categoryId);
    } catch (err) {
      console.error('Failed to load sections:', err);
    } finally {
      setLoadingCategory(null);
    }
  };

  const hoveredSections = hoveredCategory ? (sectionsMap[hoveredCategory] || []) : [];
  const BG = isLight ? '#ffffff' : '#0a0906';
  const TEXT = isLight ? '#1a1806' : '#f5f0e8';
  const BORDER = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(201,169,110,0.15)';
  const MUTED = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(245,240,232,0.5)';

  return (
    <div style={{ position: 'relative' }}>
      {/* Mega menu container */}
      {hoveredCategory && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: BG,
            borderBottom: `1px solid ${BORDER}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 199,
            animation: 'fadeInDown 0.25s ease-out',
          }}
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <style>{`
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Mega menu content */}
          <div style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(28px, 4vw, 48px) clamp(20px, 4vw, 60px)',
            display: 'grid',
            gridTemplateColumns: hoveredSections.length > 0 ? '1fr' : 'auto',
            gap: 40,
          }}>
            {/* Sections grid */}
            {loadingCategory === hoveredCategory ? (
              <div style={{ padding: '20px 0', color: MUTED, fontFamily: SANS, fontSize: 13 }}>
                Loading...
              </div>
            ) : hoveredSections.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 32,
              }}>
                {hoveredSections.map(section => (
                  <a
                    key={section.id}
                    href={`/magazine/category/${hoveredCategory}/${section.slug}`}
                    style={{
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {/* Section title */}
                    <div style={{
                      fontFamily: SERIF,
                      fontSize: 16,
                      fontWeight: 500,
                      color: TEXT,
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}>
                      {section.title}
                    </div>

                    {/* Hero subtitle */}
                    {section.hero_subtitle && (
                      <div style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        color: MUTED,
                        lineHeight: 1.5,
                      }}>
                        {section.hero_subtitle}
                      </div>
                    )}

                    {/* Display style badge */}
                    <div style={{
                      marginTop: 12,
                      fontFamily: SANS,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: GOLD,
                    }}>
                      {section.display_style}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px 0',
                color: MUTED,
                fontFamily: SANS,
                fontSize: 13,
              }}>
                No sections yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        position: 'relative',
      }}>
        {categories.map(cat => {
          const isActive = activeCategoryId === cat.id;
          const isHovered = hoveredCategory === cat.id;

          return (
            <button
              key={cat.id}
              onMouseEnter={() => loadSectionsForCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => onNavigateCategory?.(cat.id)}
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                color: isActive || isHovered ? TEXT : MUTED,
                padding: '12px 16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease',
                borderBottom: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
                position: 'relative',
              }}
            >
              {cat.label}
              {/* Dropdown indicator for categories with sections */}
              {cat.id !== 'all' && (
                <span style={{
                  marginLeft: 4,
                  fontSize: 8,
                  opacity: isHovered ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}>
                  ▾
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
