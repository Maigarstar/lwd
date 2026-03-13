/**
 * HomepageEditor 2.0 — Visual Editorial Homepage Builder
 *
 * Three-panel layout:
 *   LEFT  (260px): Layout selector, cover story picker, compact section list, presets
 *   CENTER (flex):  Scaled live preview using ACTUAL layout components
 *   RIGHT (320px):  Slide-in context editor for selected section
 *
 * Feels like art directing a magazine, not managing database rows.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchHomepageConfig, saveHomepageConfig } from '../../services/magazineService';
import {
  getS, FU, FD, Field, Input, Textarea, Select, Toggle,
  GoldBtn, GhostBtn,
} from './StudioShared';
import MagazineMediaUploader from './MagazineMediaUploader';
import { POSTS, getFeaturedPosts, getTrendingPosts, getLatestPosts, getPostsByCategory } from '../Magazine/data/posts';
import { CATEGORIES } from '../Magazine/data/categories';

// Real layout components for live preview
import LayoutEditorial from '../Magazine/layouts/LayoutEditorial';
import LayoutGrid from '../Magazine/layouts/LayoutGrid';
import LayoutImmersive from '../Magazine/layouts/LayoutImmersive';
import LayoutCurated from '../Magazine/layouts/LayoutCurated';

const GOLD = '#c9a96e';

// ── Layout options ───────────────────────────────────────────────────────────
const LAYOUT_OPTIONS = [
  { key: 'editorial',  label: 'Editorial',  desc: 'Magazine Cover' },
  { key: 'grid',       label: 'Grid',       desc: 'Visual Grid' },
  { key: 'immersive',  label: 'Immersive',  desc: 'Cinematic' },
  { key: 'curated',    label: 'Curated',    desc: 'The Edit' },
];

const LAYOUT_COMPONENTS = {
  editorial: LayoutEditorial,
  grid:      LayoutGrid,
  immersive: LayoutImmersive,
  curated:   LayoutCurated,
};

// ── Per-section layout style options ─────────────────────────────────────────
const SECTION_LAYOUT_OPTIONS = [
  { value: 'grid',       label: 'Grid' },
  { value: 'carousel',   label: 'Carousel' },
  { value: 'editorial',  label: 'Editorial Feature' },
  { value: 'list',       label: 'Magazine List' },
];

// ── Viewport options ─────────────────────────────────────────────────────────
const VP_OPTIONS = [
  { key: 'desktop', label: '⊡',  width: 1280 },
  { key: 'tablet',  label: '▯',  width: 768 },
  { key: 'mobile',  label: '📱', width: 375 },
];

// ── Default sections (includes layout + cover meta-sections) ─────────────────
const DEFAULT_SECTIONS = [
  { id: 'layout',         label: 'Layout Style',      icon: '⊞', visible: true,  config: { style: 'curated' } },
  { id: 'cover',          label: 'Cover Story',       icon: '★', visible: true,  config: { slug: null } },
  { id: 'hero',           label: 'Hero',              icon: '◈', visible: true,  config: { style: 'editorial' } },
  { id: 'featured',       label: "Editor's Picks",    icon: '✦', visible: true,  config: { count: 4, title: "Editor's Picks" } },
  { id: 'latest',         label: 'Latest Stories',    icon: '▤', visible: true,  config: { count: 8, cardStyle: 'standard', title: 'Latest Stories' } },
  { id: 'trending',       label: 'Trending',          icon: '↑', visible: true,  config: { count: 5, title: 'Trending Now' } },
  { id: 'destinations',   label: 'Destinations',      icon: '✈', visible: true,  config: { count: 3, title: 'Destinations', category: 'destinations', layoutStyle: 'grid' } },
  { id: 'fashion',        label: 'Fashion & Beauty',  icon: '◇', visible: true,  config: { count: 3, title: 'Fashion & Beauty', category: 'fashion', layoutStyle: 'grid' } },
  { id: 'honeymoons',     label: 'Honeymoons',        icon: '♡', visible: true,  config: { count: 3, title: 'Honeymoon Inspiration', category: 'honeymoons', layoutStyle: 'editorial' } },
  { id: 'weddings',       label: 'Real Weddings',     icon: '◎', visible: true,  config: { count: 4, title: 'Real Weddings', category: 'real-weddings', layoutStyle: 'grid' } },
  { id: 'travel',          label: 'Travel',            icon: '✈', visible: true,  config: { count: 3, title: 'Travel', category: 'travel', layoutStyle: 'overlay' } },
  { id: 'home-living',     label: 'Home & Living',     icon: '⌂', visible: true,  config: { count: 3, title: 'Home & Living', category: 'home-living', layoutStyle: 'editorial' } },
  { id: 'affiliate',       label: 'Affiliate Showcase', icon: '◆', visible: false, config: { productCategory: '', productSubcategory: '', mode: 'curated', count: 6, sortOrder: 'featured', title: 'The Edit: Curated Picks' } },
  { id: 'category-strip',  label: 'Category Strip',    icon: '═', visible: true,  config: { categories: [] } },
  { id: 'banner',          label: 'Feature Banner',    icon: '▬', visible: false, config: { title: '', subtitle: '', image: '', ctaLabel: 'Discover More', ctaUrl: '' } },
  { id: 'newsletter',      label: 'Newsletter',        icon: '✉', visible: true,  config: { headline: 'Join the World of Luxury Weddings', subtext: 'Editorial stories, venue discoveries, and exclusive features — delivered with discretion.' } },
  { id: 'spotlight',       label: 'Category Spotlight', icon: '▩', visible: false, config: { categories: [] } },
];

// ── Built-in presets ─────────────────────────────────────────────────────────
const BUILT_IN_PRESETS = [
  { id: 'luxury-hero',      label: 'Luxury Hero',       icon: '◈', sectionId: 'hero',           config: { style: 'editorial' } },
  { id: 'featured-grid',    label: 'Featured Grid',     icon: '✦', sectionId: 'featured',       config: { count: 4, title: "Editor's Picks" } },
  { id: 'trending-row',     label: 'Trending Row',      icon: '↑', sectionId: 'trending',       config: { count: 5, title: 'Trending Now' } },
  { id: 'fashion-spotlight', label: 'Fashion Spotlight', icon: '◇', sectionId: 'fashion',       config: { title: 'Fashion & Beauty', category: 'fashion', layoutStyle: 'grid', count: 3 } },
  { id: 'category-strip',   label: 'Category Strip',   icon: '═', sectionId: 'category-strip',  config: { categories: CATEGORIES.map(c => c.id) } },
  { id: 'newsletter-break', label: 'Newsletter Break', icon: '✉', sectionId: 'newsletter',      config: { headline: 'Join the World of Luxury Weddings', subtext: '' } },
  { id: 'affiliate-picks',  label: 'Affiliate Picks', icon: '◆', sectionId: 'affiliate',       config: { productCategory: 'bridal-fashion', mode: 'curated', count: 6, sortOrder: 'featured', title: 'The Edit: Bridal Picks' } },
  { id: 'travel-section',   label: 'Travel Stories',  icon: '✈', sectionId: 'travel',           config: { count: 3, title: 'Travel', category: 'travel', layoutStyle: 'overlay' } },
];

// Content sections that support category assignment + layout style
const CONTENT_SECTIONS = new Set(['fashion', 'honeymoons', 'weddings', 'destinations', 'spotlight', 'travel', 'home-living']);

// ── Affiliate product categories ────────────────────────────────────────────
const AFFILIATE_CATEGORIES = [
  { value: '', label: '— All Categories —' },
  { value: 'bridal-fashion', label: 'Bridal Fashion' },
  { value: 'accessories', label: 'Accessories & Jewellery' },
  { value: 'beauty', label: 'Beauty & Fragrance' },
  { value: 'home-decor', label: 'Home & Decor' },
  { value: 'travel-gear', label: 'Travel & Luggage' },
  { value: 'gifts', label: 'Gifts & Registry' },
  { value: 'stationery', label: 'Stationery & Paper' },
  { value: 'tableware', label: 'Tableware & Dining' },
];

const AFFILIATE_SUBCATEGORIES = {
  'bridal-fashion': [
    { value: 'gowns', label: 'Wedding Gowns' },
    { value: 'veils', label: 'Veils & Headpieces' },
    { value: 'shoes', label: 'Bridal Shoes' },
    { value: 'lingerie', label: 'Bridal Lingerie' },
  ],
  'accessories': [
    { value: 'jewellery', label: 'Fine Jewellery' },
    { value: 'handbags', label: 'Handbags & Clutches' },
    { value: 'watches', label: 'Watches' },
  ],
  'beauty': [
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'fragrance', label: 'Fragrance' },
    { value: 'hair', label: 'Haircare' },
  ],
  'home-decor': [
    { value: 'candles', label: 'Candles & Scents' },
    { value: 'textiles', label: 'Luxury Textiles' },
    { value: 'art', label: 'Art & Prints' },
  ],
  'travel-gear': [
    { value: 'luggage', label: 'Luggage' },
    { value: 'accessories', label: 'Travel Accessories' },
  ],
  'gifts': [
    { value: 'couples', label: 'Couple Gifts' },
    { value: 'bridesmaids', label: 'Bridesmaid Gifts' },
    { value: 'groomsmen', label: 'Groomsmen Gifts' },
  ],
  'stationery': [
    { value: 'invitations', label: 'Invitations' },
    { value: 'save-dates', label: 'Save the Dates' },
  ],
  'tableware': [
    { value: 'china', label: 'Fine China' },
    { value: 'glassware', label: 'Glassware' },
    { value: 'cutlery', label: 'Cutlery & Flatware' },
  ],
};


/* ═══════════════════════════════════════════════════════════════════════════════
 * SECTION CONFIG EDITOR — per-section form controls (reused from v1, enhanced)
 * ═══════════════════════════════════════════════════════════════════════════════ */
function SectionConfigEditor({ section, onChange }) {
  const upd = (key, val) => onChange({ ...section, config: { ...section.config, [key]: val } });
  const { config } = section;

  const categoryOptions = [
    { value: '', label: '— Default —' },
    ...CATEGORIES.map(c => ({ value: c.id, label: c.label })),
  ];

  switch (section.id) {
    case 'hero':
      return (
        <Field label="Hero Style">
          <Select
            value={config.style || 'editorial'}
            onChange={v => upd('style', v)}
            options={[
              { value: 'editorial',    label: 'Editorial (full hero)' },
              { value: 'split',        label: 'Split Screen' },
              { value: 'grid',         label: 'Magazine Grid' },
              { value: 'carousel',     label: 'Carousel' },
              { value: 'portrait',     label: 'Portrait Cards' },
              { value: 'dual-feature', label: 'Dual Feature' },
            ]}
          />
        </Field>
      );

    case 'featured':
    case 'latest':
    case 'trending':
    case 'honeymoons':
    case 'weddings':
    case 'destinations':
    case 'fashion':
    case 'travel':
    case 'home-living':
      return (
        <>
          <Field label="Section Title">
            <Input value={config.title} onChange={v => upd('title', v)} placeholder="Section title" />
          </Field>

          <Field label="Stories to Display">
            <Select
              value={String(config.count || 4)}
              onChange={v => upd('count', Number(v))}
              options={['3', '4', '6', '8'].map(n => ({ value: n, label: `${n} stories` }))}
            />
          </Field>

          {CONTENT_SECTIONS.has(section.id) && (
            <Field label="Category Source">
              <Select
                value={config.category || ''}
                onChange={v => upd('category', v)}
                options={categoryOptions}
              />
            </Field>
          )}

          {CONTENT_SECTIONS.has(section.id) && (
            <Field label="Layout Style">
              <Select
                value={config.layoutStyle || 'grid'}
                onChange={v => upd('layoutStyle', v)}
                options={SECTION_LAYOUT_OPTIONS}
              />
            </Field>
          )}

          {section.id === 'latest' && (
            <Field label="Card Style">
              <Select
                value={config.cardStyle || 'standard'}
                onChange={v => upd('cardStyle', v)}
                options={[
                  { value: 'standard',   label: 'Standard cards' },
                  { value: 'overlay',    label: 'Overlay cards' },
                  { value: 'editorial',  label: 'Editorial cards' },
                  { value: 'horizontal', label: 'Horizontal list' },
                ]}
              />
            </Field>
          )}
        </>
      );

    case 'banner':
      return (
        <>
          <Field label="Banner Title">
            <Input value={config.title} onChange={v => upd('title', v)} placeholder="The new season begins" />
          </Field>
          <Field label="Banner Subtitle">
            <Textarea value={config.subtitle} onChange={v => upd('subtitle', v)} placeholder="A short editorial line" minHeight={60} />
          </Field>
          <Field label="Background Image">
            <MagazineMediaUploader
              value={config.image ? { src: config.image, alt: '', caption: '', credit: '', focal: 'center' } : null}
              onChange={v => upd('image', v?.src || '')}
              type="image"
              showMeta={false}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="CTA Label">
              <Input value={config.ctaLabel} onChange={v => upd('ctaLabel', v)} placeholder="Discover More" />
            </Field>
            <Field label="CTA URL">
              <Input value={config.ctaUrl} onChange={v => upd('ctaUrl', v)} placeholder="/magazine" />
            </Field>
          </div>
        </>
      );

    case 'newsletter':
      return (
        <>
          <Field label="Headline">
            <Input value={config.headline} onChange={v => upd('headline', v)} placeholder="Join the World of Luxury Weddings" />
          </Field>
          <Field label="Subtext">
            <Textarea value={config.subtext} onChange={v => upd('subtext', v)} placeholder="Editorial stories and venue discoveries…" minHeight={60} />
          </Field>
        </>
      );

    case 'category-strip':
    case 'spotlight':
      return (
        <Field label={section.id === 'category-strip' ? 'Categories to Display' : 'Categories to Spotlight'}>
          {CATEGORIES.map(cat => (
            <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={(config.categories || []).includes(cat.id)}
                onChange={e => {
                  const cats = config.categories || [];
                  upd('categories', e.target.checked ? [...cats, cat.id] : cats.filter(c => c !== cat.id));
                }}
                style={{ accentColor: GOLD }}
              />
              <span style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-text)' }}>{cat.label}</span>
            </label>
          ))}
        </Field>
      );

    case 'affiliate':
      return (
        <>
          <Field label="Section Title">
            <Input value={config.title} onChange={v => upd('title', v)} placeholder="The Edit: Curated Picks" />
          </Field>

          <Field label="Product Category">
            <Select
              value={config.productCategory || ''}
              onChange={v => { upd('productCategory', v); upd('productSubcategory', ''); }}
              options={AFFILIATE_CATEGORIES}
            />
          </Field>

          {config.productCategory && AFFILIATE_SUBCATEGORIES[config.productCategory] && (
            <Field label="Subcategory">
              <Select
                value={config.productSubcategory || ''}
                onChange={v => upd('productSubcategory', v)}
                options={[
                  { value: '', label: '— All —' },
                  ...AFFILIATE_SUBCATEGORIES[config.productCategory],
                ]}
              />
            </Field>
          )}

          <Field label="Display Mode">
            <Select
              value={config.mode || 'curated'}
              onChange={v => upd('mode', v)}
              options={[
                { value: 'curated',  label: 'Manual Curation' },
                { value: 'feed',     label: 'Auto Feed' },
                { value: 'trending', label: 'Trending Products' },
                { value: 'seasonal', label: 'Seasonal Picks' },
              ]}
            />
          </Field>

          <Field label="Products to Display">
            <Select
              value={String(config.count || 6)}
              onChange={v => upd('count', Number(v))}
              options={['3', '4', '6', '8', '12'].map(n => ({ value: n, label: `${n} products` }))}
            />
          </Field>

          <Field label="Sort Order">
            <Select
              value={config.sortOrder || 'featured'}
              onChange={v => upd('sortOrder', v)}
              options={[
                { value: 'featured',    label: 'Featured First' },
                { value: 'newest',      label: 'Newest Arrivals' },
                { value: 'price-asc',   label: 'Price: Low to High' },
                { value: 'price-desc',  label: 'Price: High to Low' },
                { value: 'bestselling', label: 'Bestselling' },
                { value: 'editorial',   label: 'Editor Picks' },
              ]}
            />
          </Field>
        </>
      );

    default:
      return null;
  }
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * LAYOUT SELECTOR — 2×2 visual layout cards
 * ═══════════════════════════════════════════════════════════════════════════════ */
function LayoutSelector({ activeStyle, onChange, S }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: GOLD, marginBottom: 8,
      }}>
        Layout Style
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {LAYOUT_OPTIONS.map(lo => {
          const active = activeStyle === lo.key;
          return (
            <button
              key={lo.key}
              onClick={() => onChange(lo.key)}
              style={{
                background: active ? `${GOLD}12` : S.inputBg,
                border: `1.5px solid ${active ? GOLD : S.border}`,
                borderRadius: 3, padding: '8px 7px 7px', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${GOLD}60`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? GOLD : S.border; }}
            >
              {/* Mini layout thumbnail */}
              <div style={{
                height: 36, marginBottom: 5, borderRadius: 2,
                background: S.surface, border: `1px solid ${S.border}`,
                overflow: 'hidden', padding: 3,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                {lo.key === 'editorial' && (
                  <>
                    <div style={{ height: '60%', background: `${GOLD}30`, borderRadius: 1 }} />
                    <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                      <div style={{ flex: 1, background: `${GOLD}15`, borderRadius: 1 }} />
                      <div style={{ flex: 1, background: `${GOLD}15`, borderRadius: 1 }} />
                    </div>
                  </>
                )}
                {lo.key === 'grid' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, height: '100%' }}>
                    <div style={{ background: `${GOLD}30`, borderRadius: 1, gridRow: 'span 2' }} />
                    <div style={{ background: `${GOLD}15`, borderRadius: 1 }} />
                    <div style={{ background: `${GOLD}15`, borderRadius: 1 }} />
                  </div>
                )}
                {lo.key === 'immersive' && (
                  <>
                    <div style={{ height: '45%', background: `${GOLD}30`, borderRadius: 1 }} />
                    <div style={{ height: '25%', background: `${GOLD}20`, borderRadius: 1 }} />
                    <div style={{ flex: 1, background: `${GOLD}15`, borderRadius: 1 }} />
                  </>
                )}
                {lo.key === 'curated' && (
                  <div style={{ display: 'flex', gap: 2, height: '100%' }}>
                    <div style={{ flex: 1, background: `${GOLD}30`, borderRadius: 1 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ flex: 1, background: `${GOLD}15`, borderRadius: 1 }} />
                      <div style={{ flex: 1, background: `${GOLD}15`, borderRadius: 1 }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{
                fontFamily: FU, fontSize: 9, fontWeight: 600,
                color: active ? GOLD : S.text, lineHeight: 1,
              }}>
                {lo.label}
              </div>
              <div style={{ fontFamily: FU, fontSize: 7, color: S.muted, marginTop: 2 }}>
                {lo.desc}
              </div>
              {active && (
                <div style={{ fontSize: 8, color: GOLD, marginTop: 2 }}>✓ Active</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * COVER STORY PICKER — dropdown + thumbnail preview
 * ═══════════════════════════════════════════════════════════════════════════════ */
function CoverStoryPicker({ slug, allPosts, onChange, S }) {
  const candidates = useMemo(() => {
    if (!allPosts?.length) return [];
    return allPosts.filter(p => p.published || p.featured).slice(0, 30);
  }, [allPosts]);

  const selected = candidates.find(p => p.slug === slug);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: GOLD, marginBottom: 8,
      }}>
        Cover Story
      </div>

      {selected && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center',
          background: S.inputBg, border: `1px solid ${S.border}`,
          borderRadius: 2, padding: 6, overflow: 'hidden',
        }}>
          {selected.coverImage && (
            <img src={selected.coverImage} alt="" style={{
              width: 48, height: 32, objectFit: 'cover', borderRadius: 2, flexShrink: 0,
            }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontFamily: FD, fontSize: 11, color: S.text, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selected.title}
            </div>
          </div>
          <button
            onClick={() => onChange(null)}
            style={{
              background: 'none', border: 'none', color: S.muted,
              cursor: 'pointer', fontSize: 13, flexShrink: 0, padding: '0 4px',
            }}
            title="Clear cover story"
          >
            ✕
          </button>
        </div>
      )}

      <select
        value={slug || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: S.inputBg, border: `1px solid ${S.border}`,
          color: S.text, fontFamily: FU, fontSize: 11,
          padding: '6px 8px', borderRadius: 2, cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">— Default (first featured) —</option>
        {candidates.map(p => (
          <option key={p.id} value={p.slug}>{p.title}</option>
        ))}
      </select>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPACT SECTION ROW — ~36px, icon + label + visibility toggle
 * ═══════════════════════════════════════════════════════════════════════════════ */
function CompactSectionRow({ section, index, total, onChange, onMove, isActive, onSelect, S }) {
  if (section.id === 'layout' || section.id === 'cover') return null;

  return (
    <div
      onClick={() => onSelect(section.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 36, padding: '0 8px', cursor: 'pointer',
        background: isActive ? `${GOLD}12` : 'transparent',
        borderLeft: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
        borderRadius: 1, transition: 'all 0.15s',
        opacity: section.visible ? 1 : 0.45,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = S.inputBg; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? `${GOLD}12` : 'transparent'; }}
    >
      {/* Reorder arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onMove(-1); }}
          disabled={index === 0}
          style={{
            background: 'none', border: 'none', padding: '0 2px', lineHeight: 1,
            color: index === 0 ? S.border : S.muted,
            cursor: index === 0 ? 'default' : 'pointer', fontSize: 7,
          }}
        >▲</button>
        <button
          onClick={e => { e.stopPropagation(); onMove(1); }}
          disabled={index === total - 1}
          style={{
            background: 'none', border: 'none', padding: '0 2px', lineHeight: 1,
            color: index === total - 1 ? S.border : S.muted,
            cursor: index === total - 1 ? 'default' : 'pointer', fontSize: 7,
          }}
        >▼</button>
      </div>

      {/* Icon */}
      <span style={{ fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0 }}>
        {section.icon}
      </span>

      {/* Label */}
      <span style={{
        fontFamily: FU, fontSize: 10, fontWeight: isActive ? 600 : 400,
        color: isActive ? GOLD : S.text, flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {section.label}
      </span>

      {/* Visibility toggle */}
      <div onClick={e => e.stopPropagation()}>
        <Toggle
          value={section.visible}
          onChange={v => onChange({ ...section, visible: v })}
        />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * CONTEXT PANEL — right slide-in editor (320px)
 * ═══════════════════════════════════════════════════════════════════════════════ */
function ContextPanel({ section, onChange, onClose, S }) {
  if (!section) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 320, background: S.surface,
      borderLeft: `1px solid ${S.border}`,
      zIndex: 10, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.2)',
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(320px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px', borderBottom: `1px solid ${S.border}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 14 }}>{section.icon}</span>
        <span style={{
          fontFamily: FU, fontSize: 11, fontWeight: 600, color: S.text, flex: 1,
        }}>
          {section.label}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${S.border}`, borderRadius: 2,
            color: S.muted, cursor: 'pointer', fontSize: 13,
            padding: '2px 8px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {!section.visible && (
          <div style={{
            fontFamily: FU, fontSize: 10, color: S.muted, marginBottom: 12,
            padding: '8px 10px', background: S.inputBg, borderRadius: 2,
            border: `1px solid ${S.border}`,
          }}>
            Section hidden — toggle visibility to show on homepage.
          </div>
        )}
        <SectionConfigEditor section={section} onChange={onChange} />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * LIVE PREVIEW — renders actual layout components, ResizeObserver + scale
 * ═══════════════════════════════════════════════════════════════════════════════ */
function LivePreview({ sections, allPosts, viewport }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [contentHeight, setContentHeight] = useState(4000);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0]?.contentRect.width || 800);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure content height for accurate scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContentHeight(entries[0]?.contentRect.height || 4000);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Resolve layout
  const layoutStyle = sections.find(s => s.id === 'layout')?.config?.style || 'curated';
  const LayoutComponent = LAYOUT_COMPONENTS[layoutStyle] || LayoutCurated;

  // Derive post collections from allPosts (same logic as MagazineHomePage)
  const previewData = useMemo(() => {
    const posts = allPosts?.length > 0 ? allPosts : POSTS;
    const byCat = slug => posts.filter(p => (p.categorySlug || p.category) === slug);

    let featured = posts.filter(p => p.featured).slice(0, 5);
    if (featured.length < 2) featured = getFeaturedPosts(5);

    let trending = posts.filter(p => p.trending).slice(0, 5);
    if (trending.length < 2) trending = getTrendingPosts(5);

    const latest = (posts.length > 0 ? posts : POSTS).slice(0, 6);

    const destinations = byCat('destinations').length > 0
      ? byCat('destinations').slice(0, 3)
      : getPostsByCategory('destinations').slice(0, 3);
    const realWeddings = byCat('real-weddings').length > 0
      ? byCat('real-weddings').slice(0, 3)
      : getPostsByCategory('real-weddings').slice(0, 3);
    const honeymoons = byCat('honeymoons').length > 0
      ? byCat('honeymoons').slice(0, 3)
      : getPostsByCategory('honeymoons').slice(0, 3);
    const fashion = byCat('fashion').length > 0
      ? byCat('fashion').slice(0, 3)
      : getPostsByCategory('fashion').slice(0, 3);

    // Cover story override
    const coverSlug = sections.find(s => s.id === 'cover')?.config?.slug;
    let resolvedFeatured = [...featured];
    if (coverSlug) {
      const coverPost = posts.find(p => p.slug === coverSlug);
      if (coverPost) {
        resolvedFeatured = [coverPost, ...featured.filter(p => p.slug !== coverSlug)].slice(0, 5);
      }
    }

    return { featured: resolvedFeatured, trending, latest, destinations, realWeddings, honeymoons, fashion };
  }, [allPosts, sections]);

  const vpWidth = VP_OPTIONS.find(v => v.key === viewport)?.width || 1280;
  const scale = Math.min(1, (containerWidth - 4) / vpWidth); // -4 for padding
  const scaledHeight = contentHeight * scale;
  const noop = () => {};

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        background: '#0c0c0a',
        padding: 2,
      }}
    >
      {/* Height wrapper — ensures scroll area matches visual height */}
      <div style={{
        width: Math.ceil(vpWidth * scale),
        height: scaledHeight,
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
        borderRadius: 4,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div
          ref={contentRef}
          style={{
            width: vpWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0, left: 0,
          }}
        >
          <LayoutComponent
            featured={previewData.featured}
            trending={previewData.trending}
            latest={previewData.latest}
            destinations={previewData.destinations}
            realWeddings={previewData.realWeddings}
            honeymoons={previewData.honeymoons}
            fashion={previewData.fashion}
            goArticle={noop}
            goCategory={noop}
            isLight={false}
            isMobile={viewport === 'mobile'}
          />
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * PRESETS PANEL — auto-configure sections
 * ═══════════════════════════════════════════════════════════════════════════════ */
function PresetsPanel({ onApplyPreset, S }) {
  return (
    <div style={{
      padding: '10px 12px', borderTop: `1px solid ${S.border}`,
      background: S.surface, flexShrink: 0,
    }}>
      <div style={{
        fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: GOLD, marginBottom: 8,
      }}>
        Presets
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {BUILT_IN_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onApplyPreset(p)}
            style={{
              fontFamily: FU, fontSize: 7, fontWeight: 600, letterSpacing: '0.08em',
              background: S.inputBg, border: `1px solid ${S.border}`,
              color: S.muted, padding: '4px 8px', borderRadius: 1, cursor: 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * MAIN — HomepageEditor: three-panel visual builder
 * ═══════════════════════════════════════════════════════════════════════════════ */
export default function HomepageEditor({ onBack, isLight = false, allPosts = [] }) {
  const S = getS(isLight);
  const [sections, setSections] = useState(() =>
    DEFAULT_SECTIONS.map(s => ({ ...s, config: { ...s.config } }))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState('desktop');

  // ── Load config from DB ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchHomepageConfig().then(({ data }) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const merged = DEFAULT_SECTIONS.map(def => {
          const saved = data.find(s => s.id === def.id);
          return saved ? { ...def, ...saved, config: { ...def.config, ...saved.config } } : def;
        });
        setSections(merged);
      }
    });
  }, []);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateSection = (index, section) => {
    const next = [...sections]; next[index] = section;
    setSections(next); setDirty(true);
  };

  const updateSectionConfig = (id, configUpdates) => {
    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, config: { ...s.config, ...configUpdates } } : s
    ));
    setDirty(true);
  };

  const moveSection = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[index], next[j]] = [next[j], next[index]];
    setSections(next); setDirty(true);
  };

  const applyPreset = preset => {
    const idx = sections.findIndex(s => s.id === preset.sectionId);
    if (idx >= 0) {
      updateSection(idx, {
        ...sections[idx],
        visible: true,
        config: { ...sections[idx].config, ...preset.config },
      });
      setSelectedId(preset.sectionId);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await saveHomepageConfig(sections);
    setSaving(false);
    if (!error) {
      setSaved(true); setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const layoutStyle = sections.find(s => s.id === 'layout')?.config?.style || 'curated';
  const coverSlug = sections.find(s => s.id === 'cover')?.config?.slug || null;
  const selectedSection = sections.find(s => s.id === selectedId) || null;
  const contentSections = sections.filter(s => s.id !== 'layout' && s.id !== 'cover');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%',
      background: S.bg, overflow: 'hidden',
    }}>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
        height: 48, flexShrink: 0, background: S.surface,
        borderBottom: `1px solid ${S.border}`,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: S.muted, cursor: 'pointer',
            fontFamily: FU, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          ← Studio
        </button>
        <span style={{ fontFamily: FD, fontSize: 14, color: S.text }}>Homepage Builder</span>

        <div style={{ flex: 1 }} />

        {/* Viewport switcher */}
        <div style={{ display: 'flex', gap: 2 }}>
          {VP_OPTIONS.map(v => (
            <button
              key={v.key}
              onClick={() => setViewport(v.key)}
              title={`${v.key} (${v.width}px)`}
              style={{
                fontFamily: FU, fontSize: 11, padding: '3px 7px', borderRadius: 2,
                cursor: 'pointer', transition: 'all 0.15s',
                background: viewport === v.key ? `${GOLD}18` : 'none',
                border: `1px solid ${viewport === v.key ? `${GOLD}60` : S.border}`,
                color: viewport === v.key ? GOLD : S.muted,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: S.border }} />

        <span style={{
          fontFamily: FU, fontSize: 9,
          color: dirty ? S.warn : saved ? S.success : 'transparent',
        }}>
          {dirty ? '● Unsaved' : saved ? '✓ Saved' : '·'}
        </span>

        <GhostBtn small onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </GhostBtn>
        <GoldBtn small onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Publish'}
        </GoldBtn>
      </div>

      {/* ── Three-panel body ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* LEFT PANEL — Layout selector, cover picker, section list, presets */}
        <div style={{
          width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${S.border}`, overflow: 'hidden',
          background: S.bg,
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
            {/* Layout selector */}
            <LayoutSelector
              activeStyle={layoutStyle}
              onChange={style => updateSectionConfig('layout', { style })}
              S={S}
            />

            {/* Cover story picker */}
            <CoverStoryPicker
              slug={coverSlug}
              allPosts={allPosts}
              onChange={slug => updateSectionConfig('cover', { slug })}
              S={S}
            />

            {/* Divider */}
            <div style={{ height: 1, background: S.border, margin: '4px 0 10px' }} />

            {/* Sections label */}
            <div style={{
              fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: GOLD, marginBottom: 6,
            }}>
              Sections
            </div>

            {/* Compact section list */}
            {contentSections.map(section => {
              const realIndex = sections.findIndex(s => s.id === section.id);
              return (
                <CompactSectionRow
                  key={section.id}
                  section={section}
                  index={realIndex}
                  total={sections.length}
                  isActive={selectedId === section.id}
                  onSelect={setSelectedId}
                  onChange={s => updateSection(realIndex, s)}
                  onMove={dir => moveSection(realIndex, dir)}
                  S={S}
                />
              );
            })}
          </div>

          {/* Presets */}
          <PresetsPanel onApplyPreset={applyPreset} S={S} />
        </div>

        {/* CENTER PANEL — Live Preview */}
        <LivePreview
          sections={sections}
          allPosts={allPosts}
          viewport={viewport}
        />

        {/* RIGHT PANEL — Context Editor (slide-in overlay) */}
        {selectedSection && selectedSection.id !== 'layout' && selectedSection.id !== 'cover' && (
          <ContextPanel
            section={selectedSection}
            onChange={s => {
              const idx = sections.findIndex(sec => sec.id === s.id);
              if (idx >= 0) updateSection(idx, s);
            }}
            onClose={() => setSelectedId(null)}
            S={S}
          />
        )}
      </div>
    </div>
  );
}
