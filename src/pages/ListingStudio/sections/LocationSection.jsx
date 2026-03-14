import { useState, useMemo } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { SEO_SYSTEM, buildAddressLookupPrompt } from '../../../lib/aiPrompts';
import { getCountryOptions } from '../utils/countryOptions';

// ── Region options keyed by country value ────────────────────────────────────
const REGIONS_BY_COUNTRY = {
  italy: [
    'Tuscany', 'Amalfi Coast', 'Lake Como', 'Lake Garda', 'Rome & Lazio',
    'Venice & Veneto', 'Sicily', 'Sardinia', 'Puglia', 'Umbria',
    'Piedmont', 'Lombardy', 'Campania', 'Emilia-Romagna', 'Marche', 'Liguria',
  ],
  france: [
    "Paris & Île-de-France", 'Provence', "Côte d'Azur", 'Loire Valley',
    'Burgundy', 'Bordeaux & Aquitaine', 'Normandy', 'Alsace',
    'Dordogne', 'Brittany', 'Languedoc', 'Rhône-Alpes',
  ],
  spain: [
    'Andalusia', 'Catalonia', 'Ibiza', 'Mallorca', 'Menorca',
    'Madrid', 'Valencia', 'Galicia', 'Basque Country', 'Canary Islands',
  ],
  greece: [
    'Santorini', 'Mykonos', 'Crete', 'Athens & Attica',
    'Corfu', 'Rhodes', 'Zakynthos', 'Peloponnese', 'Paros', 'Naxos',
  ],
  portugal: [
    'Lisbon & Surroundings', 'Algarve', 'Porto', 'Douro Valley',
    'Alentejo', 'Madeira', 'Azores', 'Sintra & Cascais',
  ],
  uk: [
    'Cotswolds', 'London', 'Lake District', 'Yorkshire', 'Cornwall & Devon',
    'Kent & Surrey', 'Edinburgh & Lothians', 'Scottish Highlands',
    'Wales', 'Northern Ireland', 'Oxfordshire', 'Berkshire',
  ],
  us: [
    'New York', 'California', 'Florida', 'Hawaii', 'Texas',
    'Georgia', 'Colorado', 'Vermont', 'Napa Valley', 'Hudson Valley',
    'The Hamptons', 'New England', 'North Carolina',
  ],
  caribbean: [
    'Jamaica', 'Barbados', 'St Lucia', 'Turks & Caicos', 'Antigua',
    'Bahamas', 'Dominican Republic', 'US Virgin Islands', 'St Barts', 'Grenada',
  ],
};

// Replaced by dynamic getter below (see component body)

const FIELD = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13,
  border: '1px solid #ddd4c8',
  borderRadius: 3,
  backgroundColor: '#fff',
  color: '#0a0a0a',
  boxSizing: 'border-box',
  outline: 'none',
};

const LABEL = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#555',
};

// ── Generates a simple unique ID ─────────────────────────────────────────────
const genId = () => `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Mini map embed for additional locations ──────────────────────────────────
function MiniMap({ lat, lng }) {
  if (!lat || !lng) return null;
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
  return (
    <div style={{ marginTop: 12, borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd4c8' }}>
      <iframe
        key={`${lat},${lng}`}
        src={src}
        width="100%"
        height="200"
        style={{ border: 'none', display: 'block' }}
        loading="lazy"
        title="Additional location map"
      />
    </div>
  );
}

// ── Single additional-location card ─────────────────────────────────────────
function AdditionalLocationCard({ loc, index, onChange: onLocChange, onRemove }) {
  const [coordPaste, setCoordPaste] = useState('');
  const [expanded, setExpanded] = useState(true);

  const update = (key, val) => onLocChange(loc.id, key, val);

  const applyCoords = () => {
    const clean = coordPaste.replace(/[()°\s]/g, '');
    const parts  = clean.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        update('lat', String(lat));
        update('lng', String(lng));
        setCoordPaste('');
      }
    }
  };

  return (
    <div style={{
      border: '1px solid #ddd4c8',
      borderRadius: 4,
      marginTop: 12,
      backgroundColor: '#fdfcfb',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        backgroundColor: '#f9f7f3',
        borderBottom: expanded ? '1px solid #e5ddd0' : 'none',
        gap: 10,
        cursor: 'pointer',
      }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize: 13, color: '#7a5f10', fontWeight: 700 }}>📍</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#333' }}>
          {loc.name || `Location ${index + 2}`}
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(loc.id); }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: '#999',
            padding: '2px 6px',
            borderRadius: 3,
          }}
          title="Remove location"
        >
          ✕
        </button>
        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Card body */}
      {expanded && (
        <div style={{ padding: '16px 14px' }}>
          {/* Location name */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Location Name</label>
            <input
              type="text"
              value={loc.name || ''}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Garden Ceremony Space, Annex Suite"
              style={FIELD}
            />
          </div>

          {/* City + Postcode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={LABEL}>City / Town</label>
              <input type="text" value={loc.city || ''} onChange={e => update('city', e.target.value)} placeholder="City" style={FIELD} />
            </div>
            <div>
              <label style={LABEL}>Postcode</label>
              <input type="text" value={loc.postcode || ''} onChange={e => update('postcode', e.target.value)} placeholder="Postcode" style={FIELD} />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Address</label>
            <input type="text" value={loc.address || ''} onChange={e => update('address', e.target.value)} placeholder="Street address" style={FIELD} />
          </div>

          {/* Coordinates */}
          <div style={{ marginBottom: 0 }}>
            <label style={LABEL}>Coordinates</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={coordPaste}
                onChange={e => setCoordPaste(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCoords()}
                placeholder="Paste: 51.9261745,-0.1550093"
                style={{ ...FIELD, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={applyCoords}
                style={{
                  padding: '10px 14px',
                  backgroundColor: coordPaste.trim() ? '#7a5f10' : '#f5f0e8',
                  color: coordPaste.trim() ? '#fff' : '#ccc',
                  border: '1px solid #ddd4c8',
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: coordPaste.trim() ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                Apply
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <input type="text" value={loc.lat || ''} onChange={e => update('lat', e.target.value)} placeholder="Latitude" style={{ ...FIELD, fontFamily: 'monospace', fontSize: 12 }} />
              </div>
              <div>
                <input type="text" value={loc.lng || ''} onChange={e => update('lng', e.target.value)} placeholder="Longitude" style={{ ...FIELD, fontFamily: 'monospace', fontSize: 12 }} />
              </div>
            </div>
            <MiniMap lat={loc.lat} lng={loc.lng} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Map placeholder shown when no primary coordinates set ────────────────────
function MapPlaceholder() {
  return (
    <div style={{
      marginTop: 16,
      height: 220,
      backgroundColor: '#f9f7f3',
      border: '1px dashed #ddd4c8',
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      gap: 8,
      userSelect: 'none',
    }}>
      <span style={{ fontSize: 28 }}>📍</span>
      <span style={{ fontSize: 12 }}>Enter coordinates above to pin the venue on the map</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main LocationSection component
// ═══════════════════════════════════════════════════════════════════════════
const COUNTRY_KEYS = ['italy', 'france', 'spain', 'greece', 'portugal', 'uk', 'us', 'caribbean'];

const LocationSection = ({ formData, onChange }) => {
  const COUNTRIES = useMemo(() => getCountryOptions(), []);
  const [coordPaste, setCoordPaste]         = useState('');
  const [showMultiLoc, setShowMultiLoc]     = useState(
    () => (formData?.additional_locations || []).length > 0
  );
  const [showAddressAI, setShowAddressAI]   = useState(false);

  const country        = formData?.country || '';
  const regions        = REGIONS_BY_COUNTRY[country] || [];
  const additionalLocs = formData?.additional_locations || [];
  const canAddMore     = additionalLocs.length < 3; // max 4 total (1 primary + 3)

  // When country changes, clear region if no longer in new list
  const handleCountryChange = (val) => {
    onChange('country', val);
    const newRegions = REGIONS_BY_COUNTRY[val] || [];
    if (formData?.region && !newRegions.includes(formData.region)) {
      onChange('region', '');
    }
  };

  // Parse pasted coordinate pair
  const handleCoordApply = () => {
    const clean = coordPaste.replace(/[()°\s]/g, '');
    const parts  = clean.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onChange('lat', String(lat));
        onChange('lng', String(lng));
        setCoordPaste('');
      }
    }
  };

  // Additional locations helpers
  const addLocation = () => {
    if (!canAddMore) return;
    const next = [...additionalLocs, { id: genId(), name: '', address: '', city: '', postcode: '', lat: '', lng: '' }];
    onChange('additional_locations', next);
  };

  const updateLocation = (id, key, val) => {
    const next = additionalLocs.map(loc => loc.id === id ? { ...loc, [key]: val } : loc);
    onChange('additional_locations', next);
  };

  const removeLocation = (id) => {
    const next = additionalLocs.filter(loc => loc.id !== id);
    onChange('additional_locations', next);
    if (next.length === 0) setShowMultiLoc(false);
  };

  const hasCoords = formData?.lat && formData?.lng;
  const mapSrc    = hasCoords
    ? `https://maps.google.com/maps?q=${formData.lat},${formData.lng}&z=15&output=embed`
    : null;

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Location</h3>
        <button
          type="button"
          onClick={() => setShowAddressAI(v => !v)}
          style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          ✦ Fill address with AI
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#999', marginBottom: showAddressAI ? 12 : 20, marginTop: 4 }}>
        Full venue address, region, and map pin
      </p>

      {showAddressAI && (
        <div style={{ marginBottom: 20 }}>
          <AIContentGenerator
            feature="address_lookup"
            systemPrompt={SEO_SYSTEM}
            userPrompt={buildAddressLookupPrompt(
              formData?.venue_name || formData?.name || '',
              formData?.website || formData?.website_url || formData?.url || ''
            )}
            venueId={formData?.id}
            onInsert={(text) => {
              try {
                const addr = JSON.parse(text);
                if (addr.address)       onChange('address', addr.address);
                if (addr.address_line2) onChange('address_line2', addr.address_line2);
                if (addr.city)          onChange('city', addr.city);
                if (addr.postcode)      onChange('postcode', addr.postcode);
                if (addr.region)        onChange('region', addr.region);
                if (addr.country && COUNTRY_KEYS.includes(addr.country)) onChange('country', addr.country);
              } catch { /* invalid JSON, ignore */ }
              setShowAddressAI(false);
            }}
            label="Find Address"
          />
        </div>
      )}

      {/* ── Row 1: Country + Region ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={LABEL}>Country</label>
          <select
            value={country}
            onChange={e => handleCountryChange(e.target.value)}
            style={FIELD}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={LABEL}>Region</label>
          {regions.length > 0 ? (
            <select
              value={formData?.region || ''}
              onChange={e => onChange('region', e.target.value)}
              style={FIELD}
            >
              <option value="">Select region…</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData?.region || ''}
              onChange={e => onChange('region', e.target.value)}
              placeholder="Region, county or area"
              style={FIELD}
            />
          )}
        </div>
      </div>

      {/* ── Row 2: City + Postcode ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div>
          <label style={LABEL}>City / Town</label>
          <input
            type="text"
            value={formData?.city || ''}
            onChange={e => onChange('city', e.target.value)}
            placeholder="e.g. Florence"
            style={FIELD}
          />
        </div>
        <div>
          <label style={LABEL}>Postcode / ZIP</label>
          <input
            type="text"
            value={formData?.postcode || ''}
            onChange={e => onChange('postcode', e.target.value)}
            placeholder="e.g. SG4 7DP"
            style={FIELD}
          />
        </div>
      </div>

      {/* ── Address lines ────────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <label style={LABEL}>Address Line 1</label>
        <input
          type="text"
          value={formData?.address || ''}
          onChange={e => onChange('address', e.target.value)}
          placeholder="Building name or street number and name"
          style={FIELD}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={LABEL}>
          Address Line 2{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional</span>
        </label>
        <input
          type="text"
          value={formData?.address_line2 || ''}
          onChange={e => onChange('address_line2', e.target.value)}
          placeholder="Estate, village or additional details"
          style={FIELD}
        />
      </div>

      {/* ── Multi-location toggle ────────────────────────────────── */}
      <div style={{
        marginTop: 20,
        padding: '14px 16px',
        backgroundColor: showMultiLoc ? '#fffbf0' : '#f9f7f3',
        border: `1px solid ${showMultiLoc ? 'rgba(201,168,76,0.35)' : '#e5ddd0'}`,
        borderRadius: 4,
        transition: 'all 0.2s',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
          {/* Toggle switch */}
          <span
            onClick={() => {
              const next = !showMultiLoc;
              setShowMultiLoc(next);
              if (!next) onChange('additional_locations', []);
            }}
            style={{
              display: 'inline-flex',
              width: 36,
              height: 20,
              borderRadius: 10,
              backgroundColor: showMultiLoc ? '#7a5f10' : '#ccc',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: showMultiLoc ? 19 : 3,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
            This listing has multiple locations
          </span>
          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 'auto' }}>
            Max 4 total
          </span>
        </label>

        {showMultiLoc && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 10, marginTop: 0 }}>
              Primary location is set above. Add up to {3 - additionalLocs.length} more location{3 - additionalLocs.length !== 1 ? 's' : ''} below.
            </p>

            {additionalLocs.map((loc, idx) => (
              <AdditionalLocationCard
                key={loc.id}
                loc={loc}
                index={idx}
                onChange={updateLocation}
                onRemove={removeLocation}
              />
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={addLocation}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px dashed #C9A84C',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  color: '#7a5f10',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                + Add Location ({additionalLocs.length + 1} of 3 additional)
              </button>
            )}

            {!canAddMore && (
              <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12 }}>
                Maximum of 4 locations reached
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Coordinates & Map ─────────────────────────────────────── */}
      <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px dashed #e5ddd0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Map Pin
          </h4>
          <span style={{ fontSize: 11, color: '#aaa' }}>
            Right-click on Google Maps → "What's here?"
          </span>
        </div>

        {/* Paste pair input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...LABEL, marginBottom: 6 }}>Paste Coordinates</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={coordPaste}
              onChange={e => setCoordPaste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCoordApply()}
              placeholder="e.g. 51.9261745,-0.1550093"
              style={{ ...FIELD, flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#555' }}
            />
            <button
              type="button"
              onClick={handleCoordApply}
              style={{
                padding: '10px 18px',
                backgroundColor: coordPaste.trim() ? '#7a5f10' : '#f5f0e8',
                color: coordPaste.trim() ? '#fff' : '#ccc',
                border: '1px solid #ddd4c8',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                cursor: coordPaste.trim() ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}
            >
              Apply
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#bbb', marginTop: 5, marginBottom: 0 }}>
            Paste a lat,lng pair, the fields below will populate automatically
          </p>
        </div>

        {/* Lat + Lng fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LABEL}>Latitude</label>
            <input
              type="text"
              value={formData?.lat || ''}
              onChange={e => onChange('lat', e.target.value)}
              placeholder="e.g. 51.9261745"
              style={{ ...FIELD, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={LABEL}>Longitude</label>
            <input
              type="text"
              value={formData?.lng || ''}
              onChange={e => onChange('lng', e.target.value)}
              placeholder="e.g. -0.1550093"
              style={{ ...FIELD, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </div>

        {/* Map preview */}
        {hasCoords ? (
          <div style={{ marginTop: 16, borderRadius: 4, overflow: 'hidden', border: '1px solid #ddd4c8' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f9f7f3',
              borderBottom: '1px solid #ddd4c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 600, fontFamily: 'monospace' }}>
                {formData.lat}, {formData.lng}
              </span>
              <a
                href={`https://www.google.com/maps?q=${formData.lat},${formData.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#7a5f10', textDecoration: 'none', fontWeight: 600 }}
              >
                Open in Google Maps ↗
              </a>
            </div>
            <iframe
              key={`${formData.lat},${formData.lng}`}
              src={mapSrc}
              width="100%"
              height="320"
              style={{ border: 'none', display: 'block' }}
              loading="lazy"
              title="Venue location map"
              allowFullScreen
            />
          </div>
        ) : (
          <MapPlaceholder />
        )}
      </div>
    </section>
  );
};

export default LocationSection;
