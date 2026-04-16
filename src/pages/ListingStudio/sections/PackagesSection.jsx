/**
 * PackagesSection, Listing Studio editor for Wedding Packages
 *
 * Up to 5 wedding packages per listing. Each package is a structured
 * multi-day offering (e.g. Orchardleigh's "House Weddings" / "Estate
 * Weddings") with name, duration, price, capacities and inclusions.
 *
 * formData key: wedding_packages[]
 *
 * Includes "✦ Find packages with AI" lookup that researches the venue's
 * public website and pre-fills the cards.
 */

import { useState } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import {
  WEDDING_PACKAGES_LOOKUP_SYSTEM,
  buildWeddingPackagesLookupPrompt,
} from '../../../lib/aiPrompts';

const MAX_PACKAGES = 5;

// ── Shared primitives ─────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#1a1a1a',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '1px solid #ddd4c8',
  borderRadius: 3,
  fontFamily: 'inherit',
  color: '#333',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

const hintStyle = { fontSize: 10, color: '#aaa', margin: '4px 0 0' };

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

// ── ID generator ──────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

// ── Tolerant JSON extractor ──────────────────────────────────────────────────
function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const toIntOrZero = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

const SEASON_OPTIONS = [
  { value: '', label: 'Year-round / unspecified' },
  { value: 'year-round', label: 'Year-round' },
  { value: 'summer', label: 'Summer only' },
  { value: 'winter', label: 'Winter only' },
];

// ── Yes/No toggle for exclusive_use ──────────────────────────────────────────
const YesNoToggle = ({ value, onChange, label }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: 'flex', gap: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd4c8', width: 'fit-content' }}>
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          style={{
            padding: '7px 18px',
            fontSize: 12, fontWeight: 600,
            border: 'none',
            backgroundColor: value === v ? (v ? '#C9A84C' : '#888') : '#faf9f7',
            color: value === v ? '#fff' : '#555',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s',
          }}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  </div>
);

// ── Inclusion chip editor ─────────────────────────────────────────────────────
const InclusionsEditor = ({ items = [], onChange }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) { setDraft(''); return; }
    onChange([...items, v.slice(0, 60)]);
    setDraft('');
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <label style={labelStyle}>Inclusions</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {items.map((it, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px',
              backgroundColor: 'rgba(201,168,76,0.1)',
              border: '1px solid #ddd4c8',
              borderRadius: 20,
              fontSize: 11,
              color: '#9a6f0a',
              fontWeight: 600,
            }}
          >
            {it}
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', padding: 0, fontSize: 14, lineHeight: 1 }}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="e.g. Golf, Shooting, Hot Tubs, Dance til Dawn"
          style={{ ...inputStyle, flex: 1 }}
          maxLength={60}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: '9px 16px',
            backgroundColor: '#f5f3ef',
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            color: '#555',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >Add</button>
      </div>
      <p style={hintStyle}>Press Enter or click Add. These appear as tags on the package card.</p>
    </div>
  );
};

// ── Individual Package Card ──────────────────────────────────────────────────
function PackageCard({ pkg, index, total, onUpdate, onRemove, onMove }) {
  const [open, setOpen] = useState(true);

  const set = (key, val) => onUpdate({ ...pkg, [key]: val });

  return (
    <div style={{
      border: '1px solid #ddd4c8', borderRadius: 3,
      backgroundColor: '#fff', overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', backgroundColor: '#f5f3ef',
        borderBottom: open ? '1px solid #ddd4c8' : 'none',
        cursor: 'pointer',
      }} onClick={() => setOpen(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 700, width: 18 }}>{index + 1}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            {pkg.name || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Untitled package</span>}
          </span>
          {pkg.price_from > 0 && (
            <span style={{ fontSize: 10, color: '#9a6f0a', padding: '2px 8px', border: '1px solid #ddd4c8', borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.08)' }}>
              From {pkg.price_currency || ''}{pkg.price_from.toLocaleString()}
            </span>
          )}
          {pkg.duration_days > 0 && (
            <span style={{ fontSize: 10, color: '#888', padding: '2px 8px', border: '1px solid #ddd4c8', borderRadius: 20 }}>
              {pkg.duration_days} day{pkg.duration_days === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={e => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
            style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 14 }}>↑</button>
          <button type="button" onClick={e => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
            style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 14 }}>↓</button>
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(pkg.id); }}
            style={{ border: '1px solid #e5ddd0', borderRadius: '50%', width: 22, height: 22, background: '#fff', color: '#999', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <span style={{ fontSize: 11, color: '#aaa', userSelect: 'none' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: 20 }}>

          {/* Row 1: Name + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Package Name</label>
              <input
                type="text"
                value={pkg.name || ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. House Weddings"
                style={inputStyle}
                maxLength={80}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (days)</label>
              <input
                type="number" min="0" max="14"
                value={pkg.duration_days || ''}
                onChange={e => set('duration_days', toIntOrZero(e.target.value))}
                placeholder="e.g. 4"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Row 2: Price + Currency + Season */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 1.5fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Price From</label>
              <input
                type="number" min="0"
                value={pkg.price_from || ''}
                onChange={e => set('price_from', toIntOrZero(e.target.value))}
                placeholder="e.g. 8889"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <input
                type="text"
                value={pkg.price_currency || ''}
                onChange={e => set('price_currency', e.target.value.slice(0, 3))}
                placeholder="£"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Season</label>
              <select
                value={pkg.season || ''}
                onChange={e => set('season', e.target.value)}
                style={selectStyle}
              >
                {SEASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Guests min/max + Exclusive Use */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Min Guests</label>
              <input
                type="number" min="0"
                value={pkg.min_guests || ''}
                onChange={e => set('min_guests', toIntOrZero(e.target.value))}
                placeholder="0"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Guests</label>
              <input
                type="number" min="0"
                value={pkg.max_guests || ''}
                onChange={e => set('max_guests', toIntOrZero(e.target.value))}
                placeholder="0"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
            <YesNoToggle
              label="Exclusive Use"
              value={!!pkg.exclusive_use}
              onChange={v => set('exclusive_use', v)}
            />
          </div>

          {/* Row 4: Dining + Accommodation capacities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Dining Capacity</label>
              <input
                type="number" min="0"
                value={pkg.dining_capacity || ''}
                onChange={e => set('dining_capacity', toIntOrZero(e.target.value))}
                placeholder="e.g. 144"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
              <p style={hintStyle}>Maximum seated dining for this package.</p>
            </div>
            <div>
              <label style={labelStyle}>Accommodation Capacity</label>
              <input
                type="number" min="0"
                value={pkg.accommodation_capacity || ''}
                onChange={e => set('accommodation_capacity', toIntOrZero(e.target.value))}
                placeholder="e.g. 95"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
              <p style={hintStyle}>Overnight guests included.</p>
            </div>
          </div>

          {/* Row 5: Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={pkg.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="One short factual sentence summarising the package, e.g. '1, 2, 3 or 4 day weddings with exclusive use of the main house.'"
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              maxLength={500}
            />
          </div>

          {/* Row 6: Inclusions */}
          <InclusionsEditor
            items={Array.isArray(pkg.inclusions) ? pkg.inclusions : []}
            onChange={v => set('inclusions', v)}
          />

        </div>
      )}
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────
const PackagesSection = ({ formData, onChange }) => {
  const packages   = formData?.wedding_packages || [];
  const venueId    = formData?.id;
  const venueName  = formData?.venue_name || formData?.name || '';
  const websiteUrl = formData?.website || formData?.website_url || '';
  const locationHint = [formData?.city, formData?.region, formData?.country]
    .filter(Boolean)
    .join(', ');
  const [showPackagesLookupAI, setShowPackagesLookupAI] = useState(false);

  const handlePackagesLookupInsert = (text) => {
    const parsed = extractJsonObject(text);
    if (!parsed) {
      alert('AI did not return valid JSON. Try again or add packages manually.');
      return;
    }

    if (!Array.isArray(parsed.packages) || parsed.packages.length === 0) {
      alert('AI did not find any wedding packages for this venue. Try again or add manually.');
      return;
    }

    const newPackages = parsed.packages
      .slice(0, MAX_PACKAGES)
      .map((p, i) => {
        if (!p || typeof p !== 'object') return null;
        const name = typeof p.name === 'string' ? p.name.trim().slice(0, 80) : '';
        const description = typeof p.description === 'string' ? p.description.trim().slice(0, 500) : '';
        const inclusions = Array.isArray(p.inclusions)
          ? p.inclusions.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 60)).slice(0, 12)
          : [];
        if (!name && !description && inclusions.length === 0) return null;
        return {
          id: genId(),
          name,
          duration_days: toIntOrZero(p.duration_days),
          exclusive_use: p.exclusive_use === true,
          price_from: toIntOrZero(p.price_from),
          price_currency: typeof p.price_currency === 'string' ? p.price_currency.slice(0, 3) : '',
          season: ['winter', 'summer', 'year-round'].includes(p.season) ? p.season : '',
          min_guests: toIntOrZero(p.min_guests),
          max_guests: toIntOrZero(p.max_guests),
          dining_capacity: toIntOrZero(p.dining_capacity),
          accommodation_capacity: toIntOrZero(p.accommodation_capacity),
          description,
          inclusions,
          sort_order: i,
        };
      })
      .filter(Boolean);

    if (newPackages.length === 0) {
      alert('AI returned packages but none had usable content. Try again.');
      return;
    }

    onChange('wedding_packages', newPackages);
    setShowPackagesLookupAI(false);
  };

  const addPackage = () => {
    if (packages.length >= MAX_PACKAGES) return;
    const newPkg = {
      id: genId(),
      name: '',
      duration_days: 0,
      exclusive_use: false,
      price_from: 0,
      price_currency: '£',
      season: '',
      min_guests: 0,
      max_guests: 0,
      dining_capacity: 0,
      accommodation_capacity: 0,
      description: '',
      inclusions: [],
      sort_order: packages.length,
    };
    onChange('wedding_packages', [...packages, newPkg]);
  };

  const updatePackage = (updated) => {
    onChange('wedding_packages', packages.map(p => p.id === updated.id ? updated : p));
  };

  const removePackage = (id) => {
    onChange('wedding_packages', packages.filter(p => p.id !== id));
  };

  const movePackage = (index, direction) => {
    const next = [...packages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange('wedding_packages', next.map((p, i) => ({ ...p, sort_order: i })));
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: 0 }}>
            Wedding Packages
          </h3>
          <button type="button" onClick={() => setShowPackagesLookupAI(v => !v)} style={aiLinkStyle}>
            ✦ Find packages with AI
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Up to {MAX_PACKAGES} structured wedding packages (e.g. "House Weddings", "Estate Weddings", "Winter Elopement"). Each package shows on the listing as a comparison card with price, duration, capacities and inclusions. Empty = section hidden.
        </p>
        {showPackagesLookupAI && (
          <div style={{ marginTop: 12 }}>
            <AIContentGenerator
              feature="wedding_packages_lookup"
              systemPrompt={WEDDING_PACKAGES_LOOKUP_SYSTEM}
              userPrompt={buildWeddingPackagesLookupPrompt(venueName, websiteUrl, locationHint)}
              venueId={venueId}
              onInsert={handlePackagesLookupInsert}
              label="Find Wedding Packages"
            />
            <p style={hintStyle}>
              AI will research the venue's published wedding packages and pre-fill the cards below. Existing packages will be replaced — review and edit before saving.
            </p>
          </div>
        )}
      </div>

      {/* Package cards */}
      {packages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {packages.map((pkg, i) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={i}
              total={packages.length}
              onUpdate={updatePackage}
              onRemove={removePackage}
              onMove={movePackage}
            />
          ))}
        </div>
      )}

      {/* Add Package button */}
      {packages.length < MAX_PACKAGES ? (
        <button
          type="button"
          onClick={addPackage}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            border: '1px dashed #C9A84C',
            borderRadius: 3,
            backgroundColor: 'rgba(201,168,76,0.04)',
            color: '#9a6f0a', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            width: '100%', justifyContent: 'center',
          }}
        >
          + Add Package {packages.length > 0 && `(${packages.length} / ${MAX_PACKAGES})`}
        </button>
      ) : (
        <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>
          Maximum {MAX_PACKAGES} packages reached
        </p>
      )}

    </section>
  );
};

export default PackagesSection;
