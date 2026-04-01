import { useState, useEffect, useRef, useMemo } from 'react';
import CategoryAssignmentField from '../components/CategoryAssignmentField';
import { getCountryOptions } from '../utils/countryOptions';
import { fetchAccounts } from '../../../services/managedAccountsService';

// Level badge colours (Bronze / Silver / Gold)
const LEVEL_COLORS = {
  gold:   { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.3)',  text: '#7a5f10', dot: '#c9a84c' },
  silver: { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', text: '#475569', dot: '#94a3b8' },
  bronze: { bg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.3)',  text: '#92400e', dot: '#cd7f32' },
};
// Map legacy plan values to level keys
function normalisePlan(plan) {
  const map = { signature: 'gold', growth: 'silver', essentials: 'bronze', custom: 'gold' };
  return map[plan] || plan || 'bronze';
}

const STATUS_DOT = {
  active:     '#22c55e',
  onboarding: '#c9a84c',
  paused:     '#94a3b8',
  cancelled:  '#ef4444',
  churned:    '#ef4444',
  'at-risk':  '#f97316',
};

/**
 * PartnerAccountDropdown
 *
 * Single searchable dropdown that links a listing to a Partner Account.
 * Replaces the old separate Account Holder + Managed Account dropdowns.
 * Sets managed_account_id on the listing.
 */
function PartnerAccountDropdown({ value, onChange }) {
  const [accounts, setAccounts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const containerRef              = useRef(null);
  const valueRef                  = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchAccounts();
      const rows = result.success ? (result.data || []) : [];
      setAccounts(rows);
      if (valueRef.current) {
        const match = rows.find(a => a.id === valueRef.current);
        if (match) setSelected(match);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Pre-select when value changes after accounts loaded
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    const match = accounts.find(a => a.id === value);
    if (match) setSelected(match);
  }, [value, accounts]);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = accounts.filter(a => {
    const term = search.toLowerCase();
    return (a.name || '').toLowerCase().includes(term) ||
           (a.primaryContactEmail || '').toLowerCase().includes(term) ||
           (a.primaryContactName || '').toLowerCase().includes(term);
  });

  const handleSelect = (account) => {
    setSelected(account);
    onChange('managed_account_id', account.id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('managed_account_id', null);
    setSearch('');
  };

  const displayLabel = selected
    ? `${selected.name}${selected.primaryContactEmail ? ' · ' + selected.primaryContactEmail : ''}`
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: '1px solid #ddd4c8', borderRadius: 3,
        backgroundColor: '#fff', overflow: 'hidden',
      }}>
        <input
          type="text"
          placeholder={selected ? '' : 'Search partner accounts…'}
          value={open ? search : displayLabel}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            flex: 1, padding: '10px 12px', fontSize: 13,
            border: 'none', outline: 'none',
            color: selected && !open ? '#0a0a0a' : '#666',
            backgroundColor: 'transparent', cursor: 'text',
          }}
        />
        {loading && <span style={{ padding: '0 10px', fontSize: 11, color: '#999' }}>Loading…</span>}
        {selected && !loading && (
          <button type="button" onClick={handleClear} title="Clear"
            style={{ padding: '0 12px', border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 14, lineHeight: '40px' }}>
            ✕
          </button>
        )}
        {!selected && !loading && (
          <span style={{ padding: '0 12px', color: '#bbb', fontSize: 12, pointerEvents: 'none' }}>▾</span>
        )}
      </div>

      {/* Selected account badge */}
      {selected && (() => {
        const level = normalisePlan(selected.plan);
        const lc = LEVEL_COLORS[level] || LEVEL_COLORS.bronze;
        const dotColor = STATUS_DOT[selected.status] || '#94a3b8';
        return (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', backgroundColor: lc.bg,
              border: `1px solid ${lc.border}`, borderRadius: 20,
              fontSize: 11, color: lc.text, fontWeight: 600,
            }}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', backgroundColor: 'rgba(0,0,0,0.04)',
              border: '1px solid #e8e2db', borderRadius: 20,
              fontSize: 11, color: '#555',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block' }} />
              {selected.status || 'active'}
            </span>
          </div>
        );
      })()}

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, backgroundColor: '#fff',
          border: '1px solid #ddd4c8', borderRadius: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
          maxHeight: 280, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#999', textAlign: 'center' }}>
              {loading ? 'Loading…' : search ? 'No accounts match' : 'No partner accounts found'}
            </div>
          ) : (
            filtered.map((account, i) => {
              const level = normalisePlan(account.plan);
              const lc = LEVEL_COLORS[level] || LEVEL_COLORS.bronze;
              const dotColor = STATUS_DOT[account.status] || '#94a3b8';
              return (
                <button
                  key={account.id} type="button"
                  onClick={() => handleSelect(account)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 14px', border: 'none',
                    borderTop: i > 0 ? '1px solid #f0ece6' : 'none',
                    backgroundColor: selected?.id === account.id ? '#fffbf0' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fffbf0'; }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = selected?.id === account.id ? '#fffbf0' : '#fff';
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {account.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {account.primaryContactEmail || 'No email'}
                      <span style={{ color: lc.text, fontWeight: 600, marginLeft: 8 }}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </div>
                  </div>
                  {selected?.id === account.id && (
                    <span style={{ marginLeft: 'auto', color: '#7a5f10', fontSize: 14, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


/**
 * BasicDetailsSection
 *
 * Core listing identity fields:
 * - Account holder (searchable dropdown → vendor_account_id)
 * - Managed Account link (Social Studio client → managed_account_id)
 * - Listing name and slug
 * - Category and destination
 */
const BasicDetailsSection = ({ formData, onChange, darkMode = false }) => {
  const countryOptions = useMemo(() => getCountryOptions(), []);
  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <h3 style={{ marginBottom: 20 }}>Basic Details</h3>

      {/* ── PARTNER ACCOUNT ──────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'block', marginBottom: 6,
          fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
        }}>
          Partner Account
        </label>
        <PartnerAccountDropdown
          value={formData?.managed_account_id || null}
          onChange={onChange}
        />
        <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
          Link this listing to the business account that owns it
        </p>
      </div>

      {/* ── LISTING NAME + SLUG ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            Listing Name
          </label>
          <input
            type="text"
            name="venue_name"
            value={formData?.venue_name || ''}
            onChange={(e) => onChange('venue_name', e.target.value)}
            placeholder="e.g., Villa Balbiano"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              border: '1px solid #ddd4c8',
              borderRadius: 3,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Hero Tagline
          </label>
          <input
            type="text"
            name="hero_tagline"
            value={formData?.hero_tagline || ''}
            onChange={(e) => onChange('hero_tagline', e.target.value)}
            placeholder="e.g., A 13th-century château on 2,500 private acres in Charente, France"
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid #ddd4c8', borderRadius: 3 }}
          />
          <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Shown under the venue name in the listing hero. Keep to 1–2 lines.</p>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            URL
          </label>
          <input
            type="text"
            name="slug"
            value={formData?.slug || ''}
            onChange={(e) => onChange('slug', e.target.value.toLowerCase())}
            placeholder="villa-balbiano"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              border: '1px solid #ddd4c8',
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* ── CATEGORY ASSIGNMENTS ─────────────────────────── */}
      <div style={{ marginTop: 20 }}>
        <CategoryAssignmentField
          value={formData?.assigned_categories || []}
          onChange={(cats) => {
            onChange('assigned_categories', cats);
            // Keep primary category in sync (backwards compat)
            if (cats.length > 0) onChange('category', cats[0].slug);
          }}
          darkMode={darkMode}
        />
      </div>

      {/* ── DESTINATION ──────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <label style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          Destination
        </label>
        <select
          name="destination"
          value={formData?.destination || 'italy'}
          onChange={(e) => onChange('destination', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            backgroundColor: '#fff',
          }}
        >
          {countryOptions.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Showcase Page toggle */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #ede9e3' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div
            onClick={() => onChange('showcase_enabled', !formData?.showcase_enabled)}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
              background: formData?.showcase_enabled ? '#c9a84c' : '#d1c9bc',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: formData?.showcase_enabled ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3c3530' }}>Showcase Page</div>
            <div style={{ fontSize: 11, color: '#8c7b6e', marginTop: 2 }}>
              Show "A Showcase Property" badge on cards linking to /showcase/{formData?.slug || '…'}
            </div>
          </div>
        </label>

        {/* Showcase category, shown when enabled */}
        {formData?.showcase_enabled && (
          <div style={{ marginTop: 12, paddingLeft: 52 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5a4e44', marginBottom: 5 }}>
              Showcase Category
            </label>
            <select
              value={formData?.showcase_category || 'venue'}
              onChange={e => onChange('showcase_category', e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', fontSize: 12,
                border: '1px solid #ddd4c8', borderRadius: 4,
                background: '#fff', color: '#3c3530', cursor: 'pointer',
                appearance: 'auto',
              }}
            >
              <option value="venue">Venue</option>
              <option value="planner">Wedding Planner</option>
              <option value="photographer">Photographer</option>
              <option value="vendor">Vendor</option>
              <option value="florist">Florist</option>
              <option value="caterer">Caterer</option>
              <option value="stylist">Venue Stylist</option>
              <option value="entertainment">Entertainment</option>
              <option value="hair_makeup">Hair & Make-up</option>
            </select>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
              Determines the showcase page template used for this listing
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BasicDetailsSection;
