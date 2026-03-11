// ─── src/pages/ListingStudio/components/CreateCategoryModal.jsx ──────────────
// Modal for creating a new listing category on-the-spot inside Listing Studio.
// The new category is immediately available for assignment after creation.
import { useState, useEffect, useRef } from 'react';

export default function CreateCategoryModal({ allCategories, initialName = '', darkMode, onClose, onCreated }) {
  const [name, setName] = useState(initialName);
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const topLevelCategories = allCategories.filter(c => !c.parent);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Category name is required.'); return; }

    // Check for duplicate name (case-insensitive)
    const dup = allCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (dup) { setError('A category with this name already exists.'); return; }

    // Generate slug from name
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const parent = allCategories.find(c => c.id === parentId || c.slug === parentId);

    const newCategory = {
      id: slug,
      slug,
      name: trimmed,
      parent: parent ? parent.slug : null,
      _custom: true, // flag for custom-created categories
    };

    onCreated(newCategory);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const C = darkMode ? {
    overlay: 'rgba(0,0,0,0.7)',
    bg: '#1e1b14',
    border: '#3a3228',
    text: '#f5f0e8',
    sub: 'rgba(245,240,232,0.5)',
    input: '#141210',
    inputBorder: '#3a3228',
    inputFocus: '#c9a84c',
    label: 'rgba(245,240,232,0.6)',
    gold: '#c9a84c',
    cancelBg: 'rgba(255,255,255,0.06)',
    cancelText: 'rgba(245,240,232,0.7)',
    error: '#e88',
  } : {
    overlay: 'rgba(0,0,0,0.4)',
    bg: '#fff',
    border: '#e8e0d6',
    text: '#1a1812',
    sub: '#888',
    input: '#faf7f3',
    inputBorder: '#ddd4c8',
    inputFocus: '#c9a84c',
    label: '#666',
    gold: '#9a7a28',
    cancelBg: '#f5f0e8',
    cancelText: '#888',
    error: '#c0392b',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.overlay,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          width: 420,
          maxWidth: '90vw',
          padding: '32px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            Create Category
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
            New categories are available immediately after creation.
          </p>
        </div>

        {/* Category Name */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.label, marginBottom: 6 }}>
            Category Name *
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="e.g. Exclusive Use Wedding Venues"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: `1px solid ${error ? C.error : C.inputBorder}`,
              borderRadius: 4,
              background: C.input,
              color: C.text,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = error ? C.error : C.inputFocus; }}
            onBlur={e => { e.target.style.borderColor = error ? C.error : C.inputBorder; }}
          />
          {error && (
            <p style={{ margin: '5px 0 0', fontSize: 12, color: C.error }}>{error}</p>
          )}
        </div>

        {/* Parent Category */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.label, marginBottom: 6 }}>
            Parent Category <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              border: `1px solid ${C.inputBorder}`,
              borderRadius: 4,
              background: C.input,
              color: C.text,
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="">— No parent (top-level) —</option>
            {topLevelCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: C.sub }}>
            Choose a parent to nest this under an existing category group.
          </p>
        </div>

        {/* Preview slug */}
        {name.trim() && (
          <div style={{
            padding: '8px 12px',
            background: darkMode ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.06)',
            border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: 4,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: C.sub }}>Slug: </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.gold }}>
              {name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${C.inputBorder}`,
              borderRadius: 4,
              background: C.cancelBg,
              color: C.cancelText,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 4,
              background: name.trim() ? C.gold : (darkMode ? '#3a3228' : '#e8e0d6'),
              color: name.trim() ? (darkMode ? '#1a1812' : '#fff') : C.sub,
              cursor: name.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Create &amp; Assign
          </button>
        </div>
      </div>
    </div>
  );
}
