// ─── src/pages/ListingStudio/components/CategoryAssignmentField.jsx ───────────
// Multi-category assignment field for Listing Studio.
// Replaces the single category dropdown with a searchable pill picker.
// Up to MAX_CATEGORIES assignments per listing.
import { useState, useRef, useEffect, useCallback } from 'react';
import CreateCategoryModal from './CreateCategoryModal';

// ── Default category tree ────────────────────────────────────────────────────
export const LISTING_CATEGORIES = [
  // ── Venue top-level ──────────────────────────────────────────────────────
  { id: 'wedding-venues',           slug: 'wedding-venues',           name: 'Wedding Venues',                        parent: null },
  { id: 'luxury-wedding-venues',    slug: 'luxury-wedding-venues',    name: 'Luxury Wedding Venues',                 parent: 'wedding-venues' },
  { id: 'exclusive-use',            slug: 'exclusive-use',            name: 'Exclusive Use Wedding Venues',          parent: 'wedding-venues' },
  { id: 'destination-weddings',     slug: 'destination-weddings',     name: 'Destination Weddings',                  parent: 'wedding-venues' },
  { id: 'international-luxury',     slug: 'international-luxury',     name: 'International Luxury Wedding Venues',   parent: 'wedding-venues' },
  { id: 'italian-wedding-venues',   slug: 'italian-wedding-venues',   name: 'Italian Wedding Venues',                parent: 'wedding-venues' },
  { id: 'french-wedding-venues',    slug: 'french-wedding-venues',    name: 'French Wedding Venues',                 parent: 'wedding-venues' },
  { id: 'castle-wedding-venues',    slug: 'castle-wedding-venues',    name: 'Castle Wedding Venues',                 parent: 'wedding-venues' },
  { id: 'vineyard-wedding-venues',  slug: 'vineyard-wedding-venues',  name: 'Vineyard Wedding Venues',               parent: 'wedding-venues' },
  { id: 'lake-wedding-venues',      slug: 'lake-wedding-venues',      name: 'Lake Wedding Venues',                   parent: 'wedding-venues' },
  { id: 'villa-wedding-venues',     slug: 'villa-wedding-venues',     name: 'Villa Wedding Venues',                  parent: 'wedding-venues' },
  { id: 'coastal-wedding-venues',   slug: 'coastal-wedding-venues',   name: 'Coastal Wedding Venues',                parent: 'wedding-venues' },
  { id: 'rustic-wedding-venues',    slug: 'rustic-wedding-venues',    name: 'Rustic & Countryside Venues',           parent: 'wedding-venues' },
  { id: 'small-intimate-venues',    slug: 'small-intimate-venues',    name: 'Small & Intimate Venues',               parent: 'wedding-venues' },
  { id: 'hotel-wedding-venues',     slug: 'hotel-wedding-venues',     name: 'Hotel Wedding Venues',                  parent: 'wedding-venues' },
  { id: 'new-wedding-venues',       slug: 'new-wedding-venues',       name: 'New Wedding Venues',                    parent: 'wedding-venues' },
  // ── Vendors top-level ────────────────────────────────────────────────────
  { id: 'wedding-planners',         slug: 'wedding-planners',         name: 'Wedding Planners',                      parent: null },
  { id: 'luxury-wedding-planners',  slug: 'luxury-wedding-planners',  name: 'Luxury Wedding Planners',               parent: 'wedding-planners' },
  { id: 'destination-planners',     slug: 'destination-planners',     name: 'Destination Wedding Planners',          parent: 'wedding-planners' },
  { id: 'photographers',            slug: 'photographers',            name: 'Wedding Photographers',                 parent: null },
  { id: 'luxury-photographers',     slug: 'luxury-photographers',     name: 'Luxury Wedding Photographers',          parent: 'photographers' },
  { id: 'destination-photographers',slug: 'destination-photographers','name': 'Destination Wedding Photographers',    parent: 'photographers' },
  { id: 'videographers',            slug: 'videographers',            name: 'Wedding Videographers',                 parent: null },
  { id: 'florists',                 slug: 'florists',                 name: 'Wedding Florists',                      parent: null },
  { id: 'catering',                 slug: 'catering',                 name: 'Wedding Catering',                      parent: null },
  { id: 'entertainment',            slug: 'entertainment',            name: 'Wedding Entertainment',                 parent: null },
  { id: 'hair-makeup',              slug: 'hair-makeup',              name: 'Hair & Makeup',                         parent: null },
  { id: 'wedding-cakes',            slug: 'wedding-cakes',            name: 'Wedding Cakes',                         parent: null },
  { id: 'private-villas',           slug: 'private-villas',           name: 'Private Villas',                        parent: null },
  { id: 'stays-rentals',            slug: 'stays-rentals',            name: 'Stays & Rentals',                       parent: null },
];

const MAX_CATEGORIES = 8;

// ── CategoryAssignmentField ──────────────────────────────────────────────────
export default function CategoryAssignmentField({ value = [], onChange, darkMode = false }) {
  // `value` is an array of category objects: [{ id, slug, name, parentSlug, parentName }]
  const [allCategories, setAllCategories] = useState([...LISTING_CATEGORIES]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [dropdownOpen]);

  // Filtered category list — exclude already-assigned, match search
  const assigned = Array.isArray(value) ? value : [];
  const assignedIds = new Set(assigned.map(c => c.id));

  const filtered = allCategories.filter(cat => {
    if (assignedIds.has(cat.id)) return false;
    if (!search.trim()) return true;
    return cat.name.toLowerCase().includes(search.toLowerCase());
  });

  // Group by parent for display
  const grouped = (() => {
    const roots = filtered.filter(c => !c.parent);
    const children = filtered.filter(c => c.parent);
    const result = [];
    roots.forEach(root => {
      result.push({ ...root, _type: 'parent' });
      children.filter(c => c.parent === root.slug || c.parent === root.id).forEach(child => {
        result.push({ ...child, _type: 'child' });
      });
    });
    // Orphan children (parent not in filtered but child matches search)
    children.forEach(child => {
      const parentInResult = result.find(r => r.id === child.parent || r.slug === child.parent);
      if (!parentInResult) result.push({ ...child, _type: 'child' });
    });
    return result;
  })();

  const addCategory = useCallback((cat) => {
    if (assigned.length >= MAX_CATEGORIES) return;
    const parent = allCategories.find(c => c.slug === cat.parent || c.id === cat.parent);
    const newEntry = {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      parentSlug: cat.parent || null,
      parentName: parent?.name || null,
    };
    onChange([...assigned, newEntry]);
    setSearch('');
    if (assigned.length + 1 >= MAX_CATEGORIES) setDropdownOpen(false);
  }, [assigned, onChange, allCategories]);

  const removeCategory = useCallback((id) => {
    onChange(assigned.filter(c => c.id !== id));
  }, [assigned, onChange]);

  const handleCategoryCreated = useCallback((newCat) => {
    setAllCategories(prev => [...prev, newCat]);
    addCategory(newCat);
    setCreateModalOpen(false);
  }, [addCategory]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const C = darkMode ? {
    bg: '#1a1812',
    border: '#3a3228',
    text: '#f5f0e8',
    sub: 'rgba(245,240,232,0.5)',
    pill: 'rgba(201,168,76,0.18)',
    pillBorder: 'rgba(201,168,76,0.4)',
    pillText: '#c9a84c',
    pillRemove: 'rgba(201,168,76,0.6)',
    dropBg: '#242018',
    dropBorder: '#3a3228',
    dropHover: 'rgba(201,168,76,0.1)',
    input: 'rgba(255,255,255,0.06)',
    inputText: '#f5f0e8',
    parentLabel: 'rgba(245,240,232,0.35)',
    childText: '#f5f0e8',
    counter: 'rgba(245,240,232,0.4)',
    createBtn: '#c9a84c',
    placeholder: 'rgba(245,240,232,0.35)',
  } : {
    bg: '#fff',
    border: '#ddd4c8',
    text: '#1a1812',
    sub: '#888',
    pill: 'rgba(201,168,76,0.12)',
    pillBorder: 'rgba(201,168,76,0.5)',
    pillText: '#9a7a28',
    pillRemove: '#c9a84c',
    dropBg: '#fff',
    dropBorder: '#ddd4c8',
    dropHover: 'rgba(201,168,76,0.08)',
    input: '#f8f5f0',
    inputText: '#1a1812',
    parentLabel: '#999',
    childText: '#1a1812',
    counter: '#bbb',
    createBtn: '#9a7a28',
    placeholder: '#bbb',
  };

  const atMax = assigned.length >= MAX_CATEGORIES;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Label row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
          Category Assignments
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.counter }}>
            {assigned.length}/{MAX_CATEGORIES} assigned
          </span>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.createBtn,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> Create category
          </button>
        </div>
      </div>

      {/* ── Field box: pills + search trigger ──────────────────────────── */}
      <div
        onClick={() => { if (!atMax) setDropdownOpen(true); }}
        style={{
          minHeight: 44,
          padding: '6px 8px',
          border: `1px solid ${dropdownOpen ? '#c9a84c' : C.border}`,
          borderRadius: 4,
          backgroundColor: C.bg,
          cursor: atMax ? 'default' : 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Pills */}
        {assigned.map(cat => (
          <span
            key={cat.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px 4px 10px',
              background: C.pill,
              border: `1px solid ${C.pillBorder}`,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              color: C.pillText,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            {cat.name}
            <span
              onClick={(e) => { e.stopPropagation(); removeCategory(cat.id); }}
              style={{
                fontSize: 14,
                lineHeight: 1,
                color: C.pillRemove,
                cursor: 'pointer',
                fontWeight: 400,
                marginLeft: 2,
                opacity: 0.7,
              }}
              title="Remove"
            >
              ×
            </span>
          </span>
        ))}

        {/* Placeholder or search input */}
        {dropdownOpen ? (
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Search categories…"
            style={{
              flex: 1,
              minWidth: 160,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: C.inputText,
              padding: '2px 4px',
            }}
          />
        ) : assigned.length === 0 ? (
          <span style={{ fontSize: 13, color: C.placeholder, padding: '2px 4px' }}>
            {atMax ? `Maximum ${MAX_CATEGORIES} categories assigned` : 'Click to assign categories…'}
          </span>
        ) : null}

        {/* Dropdown arrow */}
        {!atMax && (
          <span style={{ marginLeft: 'auto', color: C.sub, fontSize: 11, paddingLeft: 4, flexShrink: 0 }}>
            {dropdownOpen ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* ── Dropdown ───────────────────────────────────────────────────── */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 200,
            marginTop: 4,
            background: C.dropBg,
            border: `1px solid ${C.dropBorder}`,
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {grouped.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: C.sub, textAlign: 'center' }}>
              {search ? 'No categories match your search.' : 'All categories assigned.'}
              {search && (
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  style={{
                    display: 'block',
                    margin: '8px auto 0',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.createBtn,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ＋ Create "{search}"
                </button>
              )}
            </div>
          ) : (
            grouped.map(cat => (
              <div
                key={cat.id}
                onClick={() => addCategory(cat)}
                style={{
                  padding: cat._type === 'parent' ? '8px 14px 6px' : '7px 14px 7px 28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: `1px solid ${C.dropBorder}`,
                  backgroundColor: 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.dropHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {cat._type === 'parent' ? (
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.parentLabel }}>
                    {cat.name}
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: 10, color: C.parentLabel, flexShrink: 0 }}>└</span>
                    <span style={{ fontSize: 13, color: C.childText }}>{cat.name}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Create Category Modal ───────────────────────────────────────── */}
      {createModalOpen && (
        <CreateCategoryModal
          allCategories={allCategories}
          initialName={search}
          darkMode={darkMode}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}
