import { useState, useCallback, useEffect, useRef } from 'react';
import { CATEGORIES } from '../Magazine/data/categories';
import { getPostsByCategory } from '../Magazine/data/posts';
import { fetchCategories, saveCategory, deleteCategory } from '../../services/magazineService';
import {
  S, getS, FU, FD,
  Field, Input, Textarea, Select, Toggle,
  GoldBtn, GhostBtn, Divider, SectionLabel,
} from './StudioShared';
import MagazineMediaUploader from './MagazineMediaUploader';
import ContentGuidelinesEditor from './ContentGuidelinesEditor';
import CategoryLayoutCurated    from '../Magazine/categoryLayouts/CategoryLayoutCurated';
import CategoryLayoutEditorial  from '../Magazine/categoryLayouts/CategoryLayoutEditorial';
import CategoryLayoutGrid       from '../Magazine/categoryLayouts/CategoryLayoutGrid';
import CategoryLayoutImmersive  from '../Magazine/categoryLayouts/CategoryLayoutImmersive';
import CategoryLayoutPortrait   from '../Magazine/categoryLayouts/CategoryLayoutPortrait';
import CategoryLayoutDualFeature from '../Magazine/categoryLayouts/CategoryLayoutDualFeature';

const LAYOUT_COMPONENTS = {
  'curated':      CategoryLayoutCurated,
  'editorial':    CategoryLayoutEditorial,
  'grid':         CategoryLayoutGrid,
  'immersive':    CategoryLayoutImmersive,
  'portrait':     CategoryLayoutPortrait,
  'dual-feature': CategoryLayoutDualFeature,
};

// ── Colour palette for accent picker ──────────────────────────────────────────
const ACCENT_PALETTE = [
  '#c9a96e', '#7ba7bc', '#b8a9c9', '#d4a5a5',
  '#a0b4a0', '#c4956a', '#8ba8c4', '#b8c4a0',
  '#c4b8a0', '#a8a8a8', '#e8c4a0', '#a0c4b8',
];

const CARD_STYLE_OPTIONS = [
  { value: 'overlay',    label: 'Overlay' },
  { value: 'standard',   label: 'Standard' },
  { value: 'editorial',  label: 'Editorial' },
  { value: 'horizontal', label: 'Horizontal' },
];

const HERO_LAYOUT_OPTIONS = [
  { value: 'editorial', label: 'Editorial (full bleed)' },
  { value: 'split',     label: 'Split (text + image)' },
];

const PAGE_LAYOUTS = [
  { value: 'curated',       label: 'Curated',       icon: '⊞', desc: 'Split-screen hero + editorial well' },
  { value: 'editorial',     label: 'Editorial',     icon: '▤', desc: 'Full-screen hero + story river' },
  { value: 'grid',          label: 'Grid',          icon: '⊟', desc: 'Magazine grid + overlay cards' },
  { value: 'immersive',     label: 'Immersive',     icon: '◉', desc: 'Carousel + cinematic blocks' },
  { value: 'portrait',      label: 'Portrait',      icon: '▯', desc: 'Portrait hero, ideal for Fashion' },
  { value: 'dual-feature',  label: 'Dual Feature',  icon: '◧', desc: 'Two heroes, ideal for Travel / Weddings' },
];

const VIEWPORT_OPTIONS = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'tablet',  label: 'Tablet' },
  { key: 'mobile',  label: 'Mobile' },
];

// ── Colour picker ──────────────────────────────────────────────────────────────
function AccentPicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {ACCENT_PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 3, background: c, border: 'none',
              cursor: 'pointer', flexShrink: 0,
              outline: value === c ? `2px solid ${S.gold}` : '2px solid transparent',
              outlineOffset: 2,
            }}
          />
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          style={{
            width: 22, height: 22, borderRadius: 3, border: `1px dashed ${S.borderMid}`,
            background: 'none', cursor: 'pointer', color: S.muted,
            fontSize: 14, lineHeight: '20px', textAlign: 'center',
          }}
          title="Custom hex"
        >+</button>
      </div>
      {showCustom && (
        <Input
          value={value}
          onChange={onChange}
          placeholder="#c9a96e"
          style={{ marginTop: 4 }}
        />
      )}
    </div>
  );
}

// ── Featured post selector ─────────────────────────────────────────────────────
function FeaturedPostSelector({ categoryId, value, onChange }) {
  const posts = getPostsByCategory(categoryId);
  const options = [
    { value: '', label: ' -  None  - ' },
    ...posts.map(p => ({ value: p.slug, label: p.title })),
  ];
  return <Select value={value} onChange={onChange} options={options} />;
}

// ── SEO panel ─────────────────────────────────────────────────────────────────
function SEOPanel({ data, onChange }) {
  const titleLen = (data.seoTitle || data.label || '').length;
  const descLen  = (data.metaDescription || data.description || '').length;

  const warn = (cond, msg) => cond ? (
    <div style={{ fontFamily: FU, fontSize: 10, color: S.warn, marginTop: 3 }}>⚠ {msg}</div>
  ) : null;

  return (
    <div>
      <SectionLabel>SEO</SectionLabel>

      <Field label="SEO Title" hint={`${titleLen}/60 chars`}>
        <Input
          value={data.seoTitle ?? ''}
          onChange={v => onChange({ ...data, seoTitle: v })}
          placeholder={data.label}
        />
        {warn(!data.seoTitle, 'Will default to category label')}
        {warn(titleLen > 60, 'Title too long, Google will truncate')}
      </Field>

      <Field label="Meta Description" hint={`${descLen}/160 chars`}>
        <Textarea
          value={data.metaDescription ?? ''}
          onChange={v => onChange({ ...data, metaDescription: v })}
          placeholder={data.description}
          minHeight={70}
        />
        {warn(!data.metaDescription, 'Will default to category description')}
        {warn(descLen > 160, 'Description too long, Google will truncate')}
      </Field>

      <Field label="OG Image URL" hint="Social share preview image (1200×630)">
        <Input
          value={data.ogImage ?? ''}
          onChange={v => onChange({ ...data, ogImage: v })}
          placeholder={data.heroImage || 'https://...'}
        />
      </Field>
    </div>
  );
}

// ── Aura & AI Panel ────────────────────────────────────────────────────────────
function AuraAIPanel({ data, onChange }) {
  return (
    <div>
      <SectionLabel>Aura & AI</SectionLabel>

      <Toggle
        label="Enable Aura Discovery"
        hint="Allow Aura to recommend this category to users"
        value={data.aiDiscoveryEnabled !== false}
        onChange={v => onChange({ ...data, aiDiscoveryEnabled: v })}
      />

      <Field label="AI Curator Prompt" hint="Custom instructions for Aura when curating this category">
        <Textarea
          value={data.aiCuratorPrompt ?? ''}
          onChange={v => onChange({ ...data, aiCuratorPrompt: v })}
          placeholder="e.g., Fashion-forward luxury wedding dresses with emphasis on sustainable materials..."
          minHeight={70}
        />
      </Field>

      <Field label="Editorial Voice" hint="How this category should sound and feel">
        <Input
          value={data.editorialVoice ?? ''}
          onChange={v => onChange({ ...data, editorialVoice: v })}
          placeholder="e.g., elegant, luxury-focused, expert-led"
        />
      </Field>

      <Field label="Discovery Keywords" hint="Keywords for matching users to this category (comma-separated)">
        <Textarea
          value={(data.discoveryKeywords || []).join(', ')}
          onChange={v => onChange({ ...data, discoveryKeywords: v.split(',').map(k => k.trim()).filter(k => k) })}
          placeholder="wedding dress, bridal, luxury fashion"
          minHeight={50}
        />
      </Field>

      <Field label="Target Audience" hint="Who is this category primarily for?">
        <Input
          value={data.targetAudience ?? ''}
          onChange={v => onChange({ ...data, targetAudience: v })}
          placeholder="e.g., luxury brides, age 25-40, destination couples"
        />
      </Field>

      <Field label="Aura Priority (0-100)" hint="Higher = Aura will promote this category more aggressively">
        <Input
          type="number"
          min="0"
          max="100"
          value={data.auraPriority ?? 50}
          onChange={v => onChange({ ...data, auraPriority: parseInt(v) || 50 })}
        />
      </Field>
    </div>
  );
}

// ── Content Rules Panel ────────────────────────────────────────────────────────
function ContentRulesPanel({ data, onChange }) {
  return (
    <div>
      <SectionLabel>Content Guidelines</SectionLabel>
      <ContentGuidelinesEditor
        value={data.contentGuidelines || {}}
        onChange={v => onChange({ ...data, contentGuidelines: v })}
      />
    </div>
  );
}

// ── Homepage & Promotion Panel ─────────────────────────────────────────────────
function HomepagePromotionPanel({ data, onChange }) {
  return (
    <div>
      <SectionLabel>Homepage & Promotion</SectionLabel>

      <Toggle
        label="Featured on Homepage"
        hint="Display this category on the magazine homepage"
        value={data.featuredOnHomepage === true}
        onChange={v => onChange({ ...data, featuredOnHomepage: v })}
      />

      {data.featuredOnHomepage && (
        <>
          <Field label="Homepage Sort Order" hint="Lower number = earlier on page">
            <Input
              type="number"
              min="0"
              value={data.homepageSortOrder ?? 0}
              onChange={v => onChange({ ...data, homepageSortOrder: parseInt(v) || 0 })}
            />
          </Field>

          <Field label="Featured Until (Optional)" hint="When should the featured status expire? Leave empty for indefinite.">
            <Input
              type="datetime-local"
              value={data.featuredUntil?.slice(0, 16) ?? ''}
              onChange={v => onChange({ ...data, featuredUntil: v ? new Date(v).toISOString() : null })}
            />
          </Field>
        </>
      )}

      <Toggle
        label="Category Active"
        hint="Inactive categories won't appear in navigation or Aura discovery"
        value={data.isActive !== false}
        onChange={v => onChange({ ...data, isActive: v })}
      />

      <Field label="Icon (Optional)" hint="Emoji or icon name for visual branding">
        <Input
          value={data.icon ?? ''}
          onChange={v => onChange({ ...data, icon: v })}
          placeholder="e.g., 👗, 💍, ✈️"
          maxLength={2}
        />
      </Field>
    </div>
  );
}

// ── Live category layout preview ───────────────────────────────────────────────
function CategoryPreview({ data, viewport }) {
  const posts = getPostsByCategory(data.id);
  const scale = viewport === 'mobile' ? 0.4 : viewport === 'tablet' ? 0.62 : 1;
  const previewWidth = viewport === 'mobile' ? 390 : viewport === 'tablet' ? 768 : null;

  const layoutKey = data.defaultLayout || 'curated';
  const LayoutComponent = LAYOUT_COMPONENTS[layoutKey] || CategoryLayoutCurated;
  const coverPost = data.coverSlug
    ? posts.find(p => p.slug === data.coverSlug) || posts[0]
    : posts[0];

  const inner = (
    <div style={{
      transformOrigin: 'top left',
      transform: scale < 1 ? `scale(${scale})` : 'none',
      width: previewWidth || '100%',
      minHeight: scale < 1 ? `${100 / scale}%` : '100%',
      background: '#0a0a0a',
      pointerEvents: 'none',
    }}>
      {/* Mini nav strip */}
      <div style={{
        height: 44, background: 'rgba(10,10,8,0.97)',
        borderBottom: '1px solid rgba(245,240,232,0.07)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16, flexShrink: 0,
      }}>
        <span style={{ fontFamily: FD, fontSize: 16, color: '#f5f0e8', letterSpacing: '0.06em' }}>LDW</span>
        <span style={{ fontFamily: FU, fontSize: 8, color: 'rgba(245,240,232,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginLeft: 'auto' }}>
          {data.label}
        </span>
      </div>

      {/* Live layout render */}
      <LayoutComponent
        category={{ ...data, id: data.id || data.slug }}
        posts={posts}
        coverPost={coverPost}
        onRead={() => {}}
        onNavigateCategory={() => {}}
        isLight={false}
      />
    </div>
  );

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      {scale < 1 ? (
        <div style={{
          width: previewWidth * scale + 2,
          overflow: 'hidden',
          height: '100%',
        }}>
          {inner}
        </div>
      ) : inner}
    </div>
  );
}

// ── Layout thumbnail SVGs ──────────────────────────────────────────────────────
const LAYOUT_THUMBS = {
  curated: (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="52" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="1" width="37" height="16" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="20" width="37" height="10" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="33" width="37" height="10" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="46" width="37" height="7" rx="1" fill="#161614"/>
    </svg>
  ),
  editorial: (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="78" height="28" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="32" width="78" height="8" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="43" width="37" height="10" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="43" width="37" height="10" rx="1" fill="#1e1e1b"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="78" height="20" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="24" width="24" height="15" rx="1" fill="#1e1e1b"/>
      <rect x="28" y="24" width="24" height="15" rx="1" fill="#1e1e1b"/>
      <rect x="55" y="24" width="24" height="15" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="42" width="24" height="11" rx="1" fill="#1e1e1b"/>
      <rect x="28" y="42" width="24" height="11" rx="1" fill="#1e1e1b"/>
      <rect x="55" y="42" width="24" height="11" rx="1" fill="#1e1e1b"/>
    </svg>
  ),
  immersive: (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="78" height="16" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="20" width="78" height="16" rx="1" fill="#1e1e1b"/>
      <rect x="1" y="39" width="78" height="14" rx="1" fill="#1e1e1b"/>
    </svg>
  ),
  portrait: (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="40" height="52" rx="1" fill="#1e1e1b"/>
      <rect x="44" y="1" width="16" height="25" rx="1" fill="#1e1e1b"/>
      <rect x="63" y="1" width="16" height="25" rx="1" fill="#1e1e1b"/>
      <rect x="44" y="28" width="16" height="25" rx="1" fill="#1e1e1b"/>
      <rect x="63" y="28" width="16" height="25" rx="1" fill="#1e1e1b"/>
    </svg>
  ),
  'dual-feature': (
    <svg viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="37" height="52" rx="1" fill="#1e1e1b"/>
      <rect x="42" y="1" width="37" height="52" rx="1" fill="#1e1e1b"/>
    </svg>
  ),
};

// ── Layout picker (visual thumbnail cards) ────────────────────────────────────
function LayoutPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
      {PAGE_LAYOUTS.map(layout => {
        const active = value === layout.value;
        return (
          <button
            key={layout.value}
            onClick={() => onChange(layout.value)}
            title={layout.desc}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '8px 6px 6px', borderRadius: 4, cursor: 'pointer',
              background: active ? `${S.gold}10` : S.surfaceUp,
              border: `1.5px solid ${active ? S.gold : S.border}`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${S.gold}40`; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = S.border; }}
          >
            {/* SVG thumbnail */}
            <div style={{
              width: '100%',
              background: active ? `${S.gold}08` : S.bg,
              borderRadius: 2, overflow: 'hidden', padding: '4px 3px',
            }}>
              <div style={{ opacity: active ? 1 : 0.55, transition: 'opacity 0.15s' }}>
                {LAYOUT_THUMBS[layout.value]}
              </div>
              {/* Accent bar on active */}
              {active && (
                <div style={{ height: 2, background: S.gold, borderRadius: 1, margin: '3px 0 0' }} />
              )}
            </div>
            {/* Label */}
            <span style={{
              fontFamily: FU, fontSize: 8, fontWeight: active ? 700 : 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: active ? S.gold : S.muted,
              lineHeight: 1,
            }}>
              {layout.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Subcategory pills editor ───────────────────────────────────────────────────
function SubcategoryEditor({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput('');
  };

  const remove = (pill) => onChange(value.filter(v => v !== pill));

  const handleDrop = (targetIdx) => {
    if (dragIdx !== null && dragIdx !== targetIdx) {
      const next = [...value];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      onChange(next);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div>
      {/* existing pills, draggable */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: value.length ? 8 : 0 }}>
        {value.map((pill, idx) => (
          <div
            key={pill}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: FU, fontSize: 10,
              color: overIdx === idx ? S.gold : S.text,
              background: overIdx === idx ? `${S.gold}15` : S.surfaceUp,
              border: `1px solid ${overIdx === idx ? `${S.gold}60` : S.border}`,
              borderRadius: 20, padding: '3px 10px',
              cursor: 'grab', transition: 'all 0.12s',
              opacity: dragIdx === idx ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: 8, color: S.faint, marginRight: 2, cursor: 'grab' }}>⠿</span>
            {pill}
            <button
              onClick={() => remove(pill)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: S.muted, fontSize: 11, lineHeight: 1, padding: '0 0 0 2px',
              }}
            >×</button>
          </div>
        ))}
      </div>
      {/* add input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add pill label…"
          style={{
            flex: 1, fontFamily: FU, fontSize: 11,
            background: S.inputBg, border: `1px solid ${S.inputBorder}`,
            color: S.text, padding: '6px 10px', borderRadius: 2, outline: 'none',
          }}
        />
        <button
          onClick={add}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '5px 10px', borderRadius: 2,
            background: S.gold, border: 'none', color: '#0a0a0a', cursor: 'pointer',
          }}
        >+ Add</button>
      </div>
      <div style={{ fontFamily: FU, fontSize: 9, color: S.faint, marginTop: 5 }}>
        Press Enter or click Add. Drag pills to reorder.
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function CategoryEditor({ categoryId: initialId, onBack, isLight = false }) {
  const S = getS(isLight);
  const [selectedId, setSelectedId] = useState(initialId || CATEGORIES[0].id);
  const [overrides, setOverrides] = useState({});   // keyed by category id
  const [viewport, setViewport] = useState('desktop');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCatData, setNewCatData] = useState({
    slug: '', label: '', description: '', accentColor: '#c9a96e', cardStyle: 'standard', parentSlug: '',
    // New AI/Aura fields
    aiDiscoveryEnabled: true, aiCuratorPrompt: '', editorialVoice: '', discoveryKeywords: [], targetAudience: '', auraPriority: 50,
    // Homepage promotion
    featuredOnHomepage: false, homepageSortOrder: 0, isActive: true, icon: '',
    // Content guidelines
    contentGuidelines: { tone: '', formality: '', topics: [], rules: [], avoid: [] }, featuredUntil: null,
  });
  const [newCatError, setNewCatError] = useState(null);
  const [newCatSuccess, setNewCatSuccess] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);  // Track DB categories for validation
  const autosaveRef = useRef(null);

  // Load DB category configs on mount, merge with static CATEGORIES
  useEffect(() => {
    fetchCategories().then(({ data: dbCats }) => {
      if (!dbCats || dbCats.length === 0) {
        setDbCategories([]);
        return;
      }
      // Store DB categories for parent validation
      setDbCategories(dbCats);

      const merged = {};
      dbCats.forEach(dbCat => {
        const staticCat = CATEGORIES.find(c => c.id === dbCat.slug);
        if (staticCat) merged[dbCat.slug] = dbCat;
      });
      if (Object.keys(merged).length > 0) setOverrides(merged);
    });
  }, []);

  // Merge static CATEGORIES with DB-only categories (e.g. newly created ones)
  const allCategories = (() => {
    const staticIds = new Set(CATEGORIES.map(c => c.id));
    const dbOnly = dbCategories
      .filter(c => !staticIds.has(c.slug))
      .map(c => ({
        id: c.slug,
        label: c.name || c.label || c.slug,
        description: c.description || '',
        accentColor: c.accentColor || '#c9a96e',
        defaultCardStyle: c.cardStyle || 'standard',
        parentSlug: c.parentCategorySlug || null,
      }));
    return [...CATEGORIES, ...dbOnly];
  })();

  const baseCategory = allCategories.find(c => c.id === selectedId) || CATEGORIES[0];
  const data = { ...baseCategory, ...(overrides[selectedId] || {}) };

  const update = useCallback((patch) => {
    setOverrides(prev => ({
      ...prev,
      [selectedId]: { ...(prev[selectedId] || {}), ...patch },
    }));
    setDirty(true);
  }, [selectedId]);

  const save = useCallback(async () => {
    setSaving(true);
    const catData = { ...baseCategory, ...(overrides[selectedId] || {}), slug: selectedId };
    await saveCategory(catData);
    setSaving(false);
    setDirty(false);
    setLastSaved(new Date());
  }, [baseCategory, overrides, selectedId]);

  // Check if current category is DB-only (not a static hardcoded category)
  const isDbOnlyCategory = !CATEGORIES.some(c => c.id === selectedId);

  const handleDeleteCategory = useCallback(async () => {
    if (!isDbOnlyCategory) return;
    if (!window.confirm(`Delete category "${baseCategory.label || selectedId}"? This cannot be undone.`)) return;
    setSaving(true);
    const result = await deleteCategory(selectedId);
    setSaving(false);
    if (result.error) {
      alert(`Failed to delete: ${result.error.message}`);
      return;
    }
    // Refresh DB categories and select the first static category
    const refreshed = await fetchCategories();
    if (refreshed.data) setDbCategories(refreshed.data);
    setSelectedId(CATEGORIES[0].id);
    setOverrides(prev => { const next = { ...prev }; delete next[selectedId]; return next; });
  }, [selectedId, isDbOnlyCategory, baseCategory]);

  // Autosave every 25s when dirty
  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    autosaveRef.current = setInterval(() => {
      if (dirty) save();
    }, 25000);
    return () => clearInterval(autosaveRef.current);
  }, [dirty, save]);

  const savedLabel = lastSaved
    ? `✓ Saved ${lastSaved.getHours()}:${String(lastSaved.getMinutes()).padStart(2, '0')}`
    : null;

  const categoryOptions = allCategories.map(c => ({ value: c.id, label: c.label }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: S.bg, overflow: 'hidden' }}>
      {/* ── Toolbar ── */}
      <div style={{
        height: 48, flexShrink: 0,
        background: S.surface, borderBottom: `1px solid ${S.border}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: S.muted, background: 'none',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ← Categories
        </button>

        <div style={{ width: 1, height: 20, background: S.border }} />

        {/* Category selector with hierarchy */}
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); }}
          style={{
            background: S.surfaceUp, border: `1px solid ${S.border}`, color: S.text,
            fontFamily: FU, fontSize: 10, padding: '4px 8px', borderRadius: 2, cursor: 'pointer',
            outline: 'none',
          }}
        >
          {allCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.parentSlug ? `  └─ ${c.label}` : c.label}
            </option>
          ))}
        </select>

        {/* Create new category button */}
        <GoldBtn small onClick={() => setCreatingNew(true)}>+ NEW CATEGORY</GoldBtn>

        {/* Delete category button, only for DB-created categories, not static ones */}
        {isDbOnlyCategory && (
          <button
            onClick={handleDeleteCategory}
            title={`Delete "${baseCategory.label || selectedId}"`}
            style={{
              fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
              background: 'none', border: `1px solid ${S.error}50`,
              color: S.error, cursor: 'pointer',
            }}
          >
            ✕ Delete
          </button>
        )}

        {/* Viewport toggle (centre) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
          {VIEWPORT_OPTIONS.map(v => (
            <button
              key={v.key}
              onClick={() => setViewport(v.key)}
              style={{
                fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
                background: viewport === v.key ? `${S.gold}18` : 'none',
                border: `1px solid ${viewport === v.key ? `${S.gold}60` : S.border}`,
                color: viewport === v.key ? S.gold : S.muted,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Save state + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {dirty && (
            <span style={{ fontFamily: FU, fontSize: 9, color: S.warn, letterSpacing: '0.08em' }}>
              ● Unsaved changes
            </span>
          )}
          {!dirty && savedLabel && (
            <span style={{ fontFamily: FU, fontSize: 9, color: S.success, letterSpacing: '0.08em' }}>
              {savedLabel}
            </span>
          )}
          <GoldBtn small onClick={save} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </GoldBtn>

          <div style={{ width: 1, height: 20, background: S.border }} />

          {/* View live category page */}
          <button
            onClick={() => {
              window.history.pushState(null, '', `/magazine/category/${selectedId}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            title={`View live: /magazine/category/${selectedId}`}
            style={{
              fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
              background: 'none', border: `1px solid ${S.border}`,
              color: S.muted, cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.color = S.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; }}
          >
            View Page ↗
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT panel, Page Builder ── */}
        <div style={{
          width: 300, flexShrink: 0,
          background: S.surface, borderRight: `1px solid ${S.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Panel heading */}
          <div style={{
            height: 36, flexShrink: 0,
            borderBottom: `1px solid ${S.border}`,
            display: 'flex', alignItems: 'center', padding: '0 16px',
          }}>
            <span style={{
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: S.muted,
            }}>
              Page Builder
            </span>
          </div>

          {/* Scrollable form area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <SectionLabel>Identity</SectionLabel>

            <Field label="Category Label">
              <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, padding: '6px 0' }}>
                {data.label} <span style={{ color: S.faint }}>(ID: {data.id})</span>
              </div>
            </Field>

            <Field label="Description / Intro Text">
              <Textarea
                value={data.description ?? ''}
                onChange={v => update({ description: v })}
                placeholder="Short editorial intro shown on the category hero…"
                minHeight={80}
              />
            </Field>

            <Divider />
            <SectionLabel>Page Layout</SectionLabel>

            <Field label="Default Layout" hint="How the whole category page is structured">
              <LayoutPicker
                value={data.defaultLayout ?? 'curated'}
                onChange={v => update({ defaultLayout: v })}
              />
            </Field>

            <Divider />
            <SectionLabel>Subcategory Navigation</SectionLabel>

            <Field label="Subcategory Pills" hint="Shown in the sticky controls bar on the category page">
              <SubcategoryEditor
                value={data.subcategories ?? []}
                onChange={v => update({ subcategories: v })}
              />
            </Field>

            <Divider />
            <SectionLabel>Hero</SectionLabel>

            <Field label="Hero Image">
              <MagazineMediaUploader
                value={data.heroImage ? { src: data.heroImage, alt: '', caption: '', credit: '', focal: data.heroFocal || 'center' } : null}
                onChange={v => update({ heroImage: v?.src || '', heroFocal: v?.focal || 'center' })}
                type="image"
                showMeta
              />
            </Field>

            <Divider />
            <SectionLabel>Cover Story</SectionLabel>

            <Field label="Pinned Cover Post" hint="Overrides the default (latest post) as the hero story">
              <FeaturedPostSelector
                categoryId={selectedId}
                value={data.coverSlug ?? ''}
                onChange={v => update({ coverSlug: v })}
              />
            </Field>

            <Divider />
            <SectionLabel>Style</SectionLabel>

            <Field label="Default Card Style">
              <Select
                value={data.defaultCardStyle ?? 'standard'}
                onChange={v => update({ defaultCardStyle: v })}
                options={CARD_STYLE_OPTIONS}
              />
            </Field>

            <Field label="Accent Colour">
              <AccentPicker
                value={data.accentColor ?? S.gold}
                onChange={v => update({ accentColor: v })}
              />
            </Field>
          </div>
        </div>

        {/* ── CENTER, Live preview ── */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: S.bg }}>
          {/* Viewport label */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            fontFamily: FU, fontSize: 8, color: S.faint, letterSpacing: '0.14em',
            textTransform: 'uppercase', zIndex: 10, pointerEvents: 'none',
            background: `${S.surface}cc`, padding: '3px 8px', borderRadius: 2,
            border: `1px solid ${S.border}`,
          }}>
            {viewport === 'desktop' ? 'Desktop Preview'
              : viewport === 'tablet' ? 'Tablet · 768px'
              : 'Mobile · 390px'}
          </div>

          <div style={{
            height: '100%', overflowY: 'auto',
            display: 'flex',
            justifyContent: viewport !== 'desktop' ? 'flex-start' : 'stretch',
            padding: viewport !== 'desktop' ? '40px 24px 24px' : 0,
          }}>
            <div style={{
              width: viewport === 'mobile' ? 390 * 0.45 + 2
                   : viewport === 'tablet' ? 768 * 0.65 + 2
                   : '100%',
              flexShrink: 0,
              ...(viewport !== 'desktop' ? {
                border: `1px solid ${S.borderMid}`,
                borderRadius: 4,
                overflow: 'hidden',
              } : {}),
            }}>
              <CategoryPreview data={data} viewport={viewport} />
            </div>
          </div>
        </div>

        {/* ── RIGHT panel, SEO & Meta ── */}
        <div style={{
          width: 260, flexShrink: 0,
          background: S.surface, borderLeft: `1px solid ${S.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Panel heading */}
          <div style={{
            height: 36, flexShrink: 0,
            borderBottom: `1px solid ${S.border}`,
            display: 'flex', alignItems: 'center', padding: '0 16px',
          }}>
            <span style={{
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: S.muted,
            }}>
              SEO &amp; Meta
            </span>
          </div>

          {/* Scrollable form with 6 editorial sections */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <SEOPanel data={data} onChange={d => update(d)} />
            <Divider style={{ margin: '32px 0' }} />
            <AuraAIPanel data={data} onChange={d => update(d)} />
            <Divider style={{ margin: '32px 0' }} />
            <ContentRulesPanel data={data} onChange={d => update(d)} />
            <Divider style={{ margin: '32px 0' }} />
            <HomepagePromotionPanel data={data} onChange={d => update(d)} />
          </div>
        </div>

      </div>

      {/* Create New Category Modal */}
      {creatingNew && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
        onClick={() => setCreatingNew(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 4, width: '100%', maxWidth: 480, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ padding: 32, paddingBottom: 0 }}>
              <h2 style={{ fontFamily: FD, fontSize: 24, color: S.text, margin: '0 0 24px 0' }}>
                Create New Category
              </h2>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px' }}>

            <Field label="Category Name">
              <Input
                value={newCatData.label}
                onChange={v => setNewCatData(prev => ({ ...prev, label: v }))}
                placeholder="e.g., Your Category"
              />
            </Field>

            <Field label="Category Slug (URL)">
              <Input
                value={newCatData.slug}
                onChange={v => setNewCatData(prev => ({ ...prev, slug: v }))}
                placeholder="e.g., your-category"
              />
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginTop: 6 }}>
                Leave empty to auto-generate from category name
              </div>
            </Field>

            <Field label="Description">
              <Textarea
                value={newCatData.description}
                onChange={v => setNewCatData(prev => ({ ...prev, description: v }))}
                placeholder="Brief description for this category..."
                minHeight={80}
              />
            </Field>

            <Field label="Parent Category (optional)">
              <Select
                value={newCatData.parentSlug || ''}
                onChange={v => setNewCatData(prev => ({ ...prev, parentSlug: v }))}
                options={[
                  { value: '', label: ' -  None (Top-level)  - ' },
                  ...allCategories.filter(c => !c.parentSlug).map(c => ({
                    value: c.id,  // id is already in slug format (e.g. 'destinations', 'photography')
                    label: c.label
                  }))
                ]}
              />
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginTop: 6 }}>
                Leave empty to create a top-level category. Select a parent to create a subcategory.
              </div>
            </Field>

            <Field label="Card Style">
              <Select
                value={newCatData.cardStyle}
                onChange={v => setNewCatData(prev => ({ ...prev, cardStyle: v }))}
                options={CARD_STYLE_OPTIONS}
              />
            </Field>

            <Field label="Accent Colour">
              <AccentPicker
                value={newCatData.accentColor}
                onChange={v => setNewCatData(prev => ({ ...prev, accentColor: v }))}
              />
            </Field>

            <Divider />

            <Field label="Enable Aura Discovery">
              <Toggle
                label="Allow Aura to recommend this category"
                value={newCatData.aiDiscoveryEnabled !== false}
                onChange={v => setNewCatData(prev => ({ ...prev, aiDiscoveryEnabled: v }))}
              />
            </Field>

            <Field label="AI Curator Prompt">
              <Textarea
                value={newCatData.aiCuratorPrompt ?? ''}
                onChange={v => setNewCatData(prev => ({ ...prev, aiCuratorPrompt: v }))}
                placeholder="e.g., Fashion-forward luxury wedding dresses..."
                minHeight={60}
              />
            </Field>

            <Field label="Editorial Voice">
              <Input
                value={newCatData.editorialVoice ?? ''}
                onChange={v => setNewCatData(prev => ({ ...prev, editorialVoice: v }))}
                placeholder="e.g., elegant, luxury-focused, expert-led"
              />
            </Field>

            <Field label="Discovery Keywords">
              <Textarea
                value={(newCatData.discoveryKeywords || []).join(', ')}
                onChange={v => setNewCatData(prev => ({ ...prev, discoveryKeywords: v.split(',').map(k => k.trim()).filter(k => k) }))}
                placeholder="wedding, luxury, exclusive (comma-separated)"
                minHeight={50}
              />
            </Field>

            <Field label="Target Audience">
              <Input
                value={newCatData.targetAudience ?? ''}
                onChange={v => setNewCatData(prev => ({ ...prev, targetAudience: v }))}
                placeholder="e.g., luxury brides, age 25-40"
              />
            </Field>

            <Field label="Aura Priority (0-100)">
              <Input
                type="number"
                min="0"
                max="100"
                value={newCatData.auraPriority ?? 50}
                onChange={v => setNewCatData(prev => ({ ...prev, auraPriority: parseInt(v) || 50 }))}
              />
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginTop: 3 }}>
                Higher = more aggressive promotion by Aura
              </div>
            </Field>

            <Divider />

            <Field label="Featured on Homepage">
              <Toggle
                label="Display on magazine homepage"
                value={newCatData.featuredOnHomepage === true}
                onChange={v => setNewCatData(prev => ({ ...prev, featuredOnHomepage: v }))}
              />
            </Field>

            {newCatData.featuredOnHomepage && (
              <>
                <Field label="Homepage Sort Order">
                  <Input
                    type="number"
                    min="0"
                    value={newCatData.homepageSortOrder ?? 0}
                    onChange={v => setNewCatData(prev => ({ ...prev, homepageSortOrder: parseInt(v) || 0 }))}
                  />
                  <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginTop: 3 }}>
                    Lower = earlier on homepage
                  </div>
                </Field>

                <Field label="Featured Until (Optional)">
                  <Input
                    type="datetime-local"
                    value={newCatData.featuredUntil?.slice(0, 16) ?? ''}
                    onChange={v => setNewCatData(prev => ({ ...prev, featuredUntil: v ? new Date(v).toISOString() : null }))}
                  />
                </Field>
              </>
            )}

            <Field label="Category Active">
              <Toggle
                label="Active (live and editable)"
                value={newCatData.isActive !== false}
                onChange={v => setNewCatData(prev => ({ ...prev, isActive: v }))}
              />
            </Field>

            <Field label="Icon (Optional)">
              <Input
                value={newCatData.icon ?? ''}
                onChange={v => setNewCatData(prev => ({ ...prev, icon: v }))}
                placeholder="e.g., 👗, 💍, ✈️"
                maxLength={2}
              />
            </Field>

              {newCatError && (
                <div style={{
                  background: `${S.error}20`,
                  border: `1px solid ${S.error}`,
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 16,
                  fontFamily: FU,
                  fontSize: 12,
                  color: S.error,
                  lineHeight: 1.5,
                }}>
                  {newCatError}
                </div>
              )}

              {newCatSuccess && (
                <div style={{
                  background: `${S.success}20`,
                  border: `1px solid ${S.success}`,
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 16,
                  fontFamily: FU,
                  fontSize: 12,
                  color: S.success,
                  lineHeight: 1.5,
                }}>
                  ✓ {newCatSuccess}
                </div>
              )}
            </div>

            {/* Button footer */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, padding: '0 32px 32px' }}>
              <GoldBtn onClick={async () => {
                setNewCatError(null);
                setNewCatSuccess(null);

                // Validate required fields
                if (!newCatData.label || newCatData.label.trim() === '') {
                  setNewCatError('Category Name is required');
                  return;
                }

                // Validate parent category exists if selected
                if (newCatData.parentSlug && newCatData.parentSlug.trim() !== '') {
                  const parentExists = dbCategories.some(c => c.slug === newCatData.parentSlug);
                  if (!parentExists) {
                    setNewCatError(`Parent category "${newCatData.parentSlug}" does not exist. Please select an existing parent category or leave empty for top-level.`);
                    return;
                  }
                }

                // Auto-generate slug from label if not provided
                const finalSlug = newCatData.slug?.trim() ||
                  newCatData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                if (!finalSlug) {
                  setNewCatError('Could not generate valid slug from name. Please enter a slug manually.');
                  return;
                }

                setSaving(true);
                const catDataToSave = { ...newCatData, slug: finalSlug };
                const result = await saveCategory(catDataToSave);
                setSaving(false);

                if (result.error) {
                  setNewCatError(`Failed to create category: ${result.error?.message || 'Unknown error'}`);
                  return;
                }

                setNewCatSuccess(`Category "${newCatData.label}" created successfully!`);

                // Refresh DB categories so new category appears in dropdown
                const refreshed = await fetchCategories();
                if (refreshed.data) setDbCategories(refreshed.data);

                // Reset form and close modal after brief delay
                setTimeout(() => {
                  setCreatingNew(false);
                  setNewCatData({ slug: '', label: '', description: '', accentColor: '#c9a96e', cardStyle: 'standard', parentSlug: '' });
                  setNewCatError(null);
                  setNewCatSuccess(null);
                  setSelectedId(finalSlug);
                }, 800);
              }} disabled={saving}>
                {saving ? 'Creating...' : 'Create Category'}
              </GoldBtn>
              <GhostBtn onClick={() => {
                setCreatingNew(false);
                setNewCatError(null);
                setNewCatSuccess(null);
                setNewCatData({ slug: '', label: '', description: '', accentColor: '#c9a96e', cardStyle: 'standard', parentSlug: '' });
              }}>Cancel</GhostBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
