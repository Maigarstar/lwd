import { useState, useRef } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import {
  LISTING_INFO_LOOKUP_SYSTEM,
  buildListingInfoLookupPrompt,
} from '../../../lib/aiPrompts';

// Tolerant JSON extractor — strips markdown fences and falls back to first {...}
// block. Mirrors the helper used in CateringCardsSection / DiningSection / etc.
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

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

const aiHintStyle = { fontSize: 10, color: '#aaa', margin: '4px 0 0' };

const ALLOWED_HOUR_TYPES = ['open', 'closed', 'by_appointment'];
const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'pinterest', 'youtube'];

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

// Half-hour time slots 06:00 → 23:30
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) continue;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      opts.push(`${hh}:${mm}`);
    }
  }
  return opts;
})();

const DEFAULT_HOURS = {
  mon: { type: 'open', from: '09:00', to: '17:00' },
  tue: { type: 'open', from: '09:00', to: '17:00' },
  wed: { type: 'open', from: '09:00', to: '17:00' },
  thu: { type: 'open', from: '09:00', to: '17:00' },
  fri: { type: 'open', from: '09:00', to: '17:00' },
  sat: { type: 'closed' },
  sun: { type: 'closed' },
};

const genId = () => `info-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SectionCard – collapsible accordion wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon, defaultOpen = true, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: '1px solid #ddd4c8',
      borderRadius: 6,
      marginBottom: 20,
      overflow: 'hidden',
      backgroundColor: '#fdfcfb',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          backgroundColor: '#f9f7f3',
          border: 'none',
          borderBottom: open ? '1px solid #e5ddd0' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#222', display: 'block' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 11, color: '#999', display: 'block', marginTop: 1 }}>{subtitle}</span>}
        </div>
        {badge && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: 'rgba(201,168,76,0.12)',
            color: '#7a5f10',
            border: '1px solid rgba(201,168,76,0.25)',
          }}>
            {badge}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '20px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT PROFILE card editor
// ─────────────────────────────────────────────────────────────────────────────
function ContactProfileEditor({ profile = {}, onChange }) {
  const fileInputRef = useRef(null);

  const update = (key, val) => onChange({ ...profile, [key]: val });

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...profile, photo_file: file, photo_url: url });
  };

  const photoSrc = profile.photo_url || null;

  return (
    <div>
      {/* Photo + Name row */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
        {/* Circular photo */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '2px solid #ddd4c8',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f0e8',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
            title="Click to upload photo"
          >
            {photoSrc ? (
              <img src={photoSrc} alt="Contact" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28, color: '#ccc' }}>👤</span>
            )}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
              fontSize: 18,
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              📷
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={handlePhotoFile}
          />
          <p style={{ fontSize: 10, color: '#aaa', marginTop: 6, marginBottom: 0 }}>Click to upload</p>
        </div>

        {/* Name + Title */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Full Name</label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Isabella Rossi"
              style={FIELD}
            />
          </div>
          <div>
            <label style={LABEL}>Title / Role</label>
            <input
              type="text"
              value={profile.title || ''}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Venue Director, Wedding Coordinator"
              style={FIELD}
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>About</label>
        <textarea
          value={profile.bio || ''}
          onChange={e => update('bio', e.target.value)}
          placeholder="A brief introduction about this person, shown on the public listing sidebar…"
          rows={4}
          style={{ ...FIELD, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Response metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={LABEL}>Response Time</label>
          <select value={profile.response_time || ''} onChange={e => update('response_time', e.target.value)} style={FIELD}>
            <option value="">Select…</option>
            <option value="Within 1 hour">Within 1 hour</option>
            <option value="Within 4 hours">Within 4 hours</option>
            <option value="Within 24 hours">Within 24 hours</option>
            <option value="Within 48 hours">Within 48 hours</option>
            <option value="Within a week">Within a week</option>
          </select>
        </div>
        <div>
          <label style={LABEL}>Response Rate</label>
          <select value={profile.response_rate || ''} onChange={e => update('response_rate', e.target.value)} style={FIELD}>
            <option value="">Select…</option>
            <option value="100%">100%</option>
            <option value="98%">98%</option>
            <option value="95%">95%</option>
            <option value="90%">90%</option>
            <option value="85%">85%</option>
          </select>
        </div>
      </div>

      {/* Contact details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={LABEL}>Email Address</label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={e => update('email', e.target.value)}
            placeholder="contact@venue.com"
            style={FIELD}
          />
        </div>
        <div>
          <label style={LABEL}>Phone Number</label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={e => update('phone', e.target.value)}
            placeholder="+44 7700 900000"
            style={FIELD}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>
          WhatsApp Number{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional, for WhatsApp enquiry button</span>
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>💬</span>
          <input
            type="tel"
            value={profile.whatsapp || ''}
            onChange={e => update('whatsapp', e.target.value)}
            placeholder="+44 7700 900000 (include country code)"
            style={{ ...FIELD, paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Website */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Website</label>
        <input
          type="text"
          value={profile.website || ''}
          onChange={e => update('website', e.target.value)}
          placeholder="https://…"
          style={FIELD}
        />
      </div>

      {/* Social links */}
      <div style={{ borderTop: '1px solid #ede8e1', paddingTop: 16, marginTop: 4 }}>
        <p style={{ ...LABEL, marginBottom: 12 }}>Social Media Links</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/venuename', icon: '📸' },
            { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/venuename', icon: '📘' },
            { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/venuename', icon: '💼' },
            { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@venuename', icon: '🎵' },
            { key: 'twitter',   label: 'X (Twitter)', placeholder: 'https://x.com/venuename', icon: '𝕏' },
            { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/venuename', icon: '📌' },
            { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@venuename', icon: '▶️' },
          ].map(({ key, label, placeholder, icon }) => {
            const social = profile.social || {};
            return (
              <div key={key}>
                <label style={LABEL}>
                  <span style={{ marginRight: 5 }}>{icon}</span>{label}
                </label>
                <input
                  type="url"
                  value={social[key] || ''}
                  onChange={e => update('social', { ...social, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={FIELD}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENING HOURS editor
// ─────────────────────────────────────────────────────────────────────────────
function OpeningHoursEditor({ hours = DEFAULT_HOURS, onChange }) {
  const updateDay = (dayKey, patch) => {
    onChange({ ...hours, [dayKey]: { ...(hours[dayKey] || {}), ...patch } });
  };

  const DAY_TYPES = [
    { value: 'open',           label: 'Open' },
    { value: 'closed',         label: 'Closed' },
    { value: 'by_appointment', label: 'By appointment' },
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        rowGap: 2,
      }}>
        {DAYS.map(({ key, label }) => {
          const day = hours[key] || { type: 'closed' };
          const isOpen = day.type === 'open';

          return (
            <div
              key={key}
              style={{
                display: 'contents',
              }}
            >
              {/* Day label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '7px 0',
                fontSize: 13,
                fontWeight: 600,
                color: day.type === 'closed' ? '#bbb' : '#333',
                borderBottom: key !== 'sun' ? '1px solid #f5f0e8' : 'none',
              }}>
                {label.slice(0, 3)}
              </div>

              {/* Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0 6px 12px',
                borderBottom: key !== 'sun' ? '1px solid #f5f0e8' : 'none',
              }}>
                {/* Type selector (pill buttons) */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {DAY_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      type="button"
                      onClick={() => {
                        const patch = { type: dt.value };
                        if (dt.value === 'open' && !hours[key]?.from) {
                          patch.from = '09:00';
                          patch.to   = '17:00';
                        }
                        updateDay(key, patch);
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        border: `1px solid ${day.type === dt.value ? '#7a5f10' : '#ddd4c8'}`,
                        borderRadius: 20,
                        backgroundColor: day.type === dt.value ? '#7a5f10' : 'transparent',
                        color: day.type === dt.value ? '#fff' : '#888',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>

                {/* Time range (only when open) */}
                {isOpen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    <select
                      value={day.from || '09:00'}
                      onChange={e => updateDay(key, { from: e.target.value })}
                      style={{ ...FIELD, width: 80, padding: '4px 8px', fontSize: 12 }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ fontSize: 12, color: '#aaa' }}>to</span>
                    <select
                      value={day.to || '17:00'}
                      onChange={e => updateDay(key, { to: e.target.value })}
                      style={{ ...FIELD, width: 80, padding: '4px 8px', fontSize: 12 }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes field */}
      <div style={{ marginTop: 16 }}>
        <label style={LABEL}>
          Additional Hours Note{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional</span>
        </label>
        <input
          type="text"
          value={hours._note || ''}
          onChange={e => onChange({ ...hours, _note: e.target.value })}
          placeholder="e.g. Extended hours available for private viewings by request"
          style={FIELD}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESS & NEWS editor
// ─────────────────────────────────────────────────────────────────────────────
function PressEditor({ items = [], onChange }) {
  const addItem = () => {
    if (items.length >= 6) return;
    onChange([...items, { id: genId(), outlet: '', year: '', title: '', url: '', logo_url: '', body: '' }]);
  };

  const updateItem = (id, key, val) => {
    onChange(items.map(it => it.id === id ? { ...it, [key]: val } : it));
  };

  const removeItem = (id) => onChange(items.filter(it => it.id !== id));

  const OUTLETS = [
    'Vogue', 'Harper\'s Bazaar', 'Martha Stewart Weddings', 'The Knot',
    'Brides Magazine', 'Tatler', 'Condé Nast Traveler', 'Forbes',
    'Town & Country', 'Hello! Magazine', 'Style Me Pretty', 'Rock My Wedding',
    'Junebug Weddings', 'Green Wedding Shoes', 'Magnolia Rouge',
  ];

  return (
    <div>
      {items.length === 0 && (
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, marginTop: 0 }}>
          No press features added yet. These appear as "As Featured In" on the public listing.
        </p>
      )}

      {items.map((item, idx) => (
        <div
          key={item.id}
          style={{
            padding: '14px',
            border: '1px solid #e5ddd0',
            borderRadius: 4,
            marginBottom: 10,
            backgroundColor: '#fdfcfb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7a5f10' }}>Feature #{idx + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#bbb', padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 10 }}>
            <div>
              <label style={LABEL}>Publication / Outlet</label>
              <input
                type="text"
                list={`outlets-${item.id}`}
                value={item.outlet || ''}
                onChange={e => updateItem(item.id, 'outlet', e.target.value)}
                placeholder="e.g. Vogue, Harper's Bazaar"
                style={FIELD}
              />
              <datalist id={`outlets-${item.id}`}>
                {OUTLETS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>
            <div>
              <label style={LABEL}>Year</label>
              <input
                type="text"
                value={item.year || ''}
                onChange={e => updateItem(item.id, 'year', e.target.value)}
                placeholder="2024"
                style={FIELD}
                maxLength={4}
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>Article Title</label>
            <input
              type="text"
              value={item.title || ''}
              onChange={e => updateItem(item.id, 'title', e.target.value)}
              placeholder="e.g. 10 Most Spectacular Italian Wedding Venues"
              style={FIELD}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={LABEL}>
                Article URL{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional</span>
              </label>
              <input
                type="text"
                value={item.url || ''}
                onChange={e => updateItem(item.id, 'url', e.target.value)}
                placeholder="https://…"
                style={FIELD}
              />
            </div>
            <div>
              <label style={LABEL}>
                Logo / Badge URL{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional</span>
              </label>
              <input
                type="text"
                value={item.logo_url || ''}
                onChange={e => updateItem(item.id, 'logo_url', e.target.value)}
                placeholder="https://… (publication logo)"
                style={FIELD}
              />
            </div>
          </div>

          {/* Editorial excerpt, rich text */}
          <div>
            <label style={LABEL}>
              Editorial Excerpt{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional, shown on listing</span>
            </label>
            <RichTextEditor
              value={item.body || ''}
              onChange={html => updateItem(item.id, 'body', html)}
              placeholder="Brief editorial excerpt or quote from the article…"
              minHeight={80}
              minimal
            />
          </div>
        </div>
      ))}

      {items.length < 6 ? (
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: items.length > 0 ? 4 : 0,
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
          + Add Press Feature ({items.length}/6)
        </button>
      ) : (
        <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 }}>Maximum of 6 press features</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AWARDS & RECOGNITIONS editor
// ─────────────────────────────────────────────────────────────────────────────
function AwardsEditor({ items = [], onChange }) {
  const addItem = () => {
    if (items.length >= 8) return;
    onChange([...items, { id: genId(), award: '', year: '', issuer: '', icon: '🏆', description: '' }]);
  };

  const updateItem = (id, key, val) => onChange(items.map(it => it.id === id ? { ...it, [key]: val } : it));
  const removeItem = (id) => onChange(items.filter(it => it.id !== id));

  const ICONS = ['🏆', '⭐', '🥇', '🎖', '🏅', '🌟', '💎', '✨'];

  return (
    <div>
      {items.length === 0 && (
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, marginTop: 0 }}>
          No awards added yet. These appear as badges on the public listing.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{ padding: '14px', border: '1px solid #e5ddd0', borderRadius: 4, backgroundColor: '#fdfcfb' }}
          >
            {/* Header row: icon + year + name + issuer + remove */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
              <select
                value={item.icon || '🏆'}
                onChange={e => updateItem(item.id, 'icon', e.target.value)}
                style={{ ...FIELD, width: 50, padding: '6px', fontSize: 16, flexShrink: 0 }}
              >
                {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input
                type="text"
                value={item.year || ''}
                onChange={e => updateItem(item.id, 'year', e.target.value)}
                placeholder="Year"
                style={{ ...FIELD, width: 70, flexShrink: 0 }}
                maxLength={4}
              />
              <input
                type="text"
                value={item.award || ''}
                onChange={e => updateItem(item.id, 'award', e.target.value)}
                placeholder="Award name"
                style={{ ...FIELD, flex: 1 }}
              />
              <input
                type="text"
                value={item.issuer || ''}
                onChange={e => updateItem(item.id, 'issuer', e.target.value)}
                placeholder="Issuing organisation"
                style={{ ...FIELD, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#bbb', padding: '4px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Description, rich text */}
            <div>
              <label style={{ ...LABEL, marginBottom: 4 }}>
                Description{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>optional</span>
              </label>
              <RichTextEditor
                value={item.description || ''}
                onChange={html => updateItem(item.id, 'description', html)}
                placeholder="Citation, description or context for this award…"
                minHeight={72}
                minimal
              />
            </div>
          </div>
        ))}
      </div>

      {items.length < 8 && (
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: items.length > 0 ? 10 : 0,
            width: '100%',
            padding: '10px 16px',
            border: '1px dashed #C9A84C',
            borderRadius: 4,
            backgroundColor: 'transparent',
            color: '#7a5f10',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Award ({items.length}/8)
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ListingInfoSection
// ─────────────────────────────────────────────────────────────────────────────
const ListingInfoSection = ({ formData, onChange }) => {
  // Getters / setters for each sub-field
  const profile      = formData?.contact_profile  || {};
  const openHours    = formData?.opening_hours     || { ...DEFAULT_HOURS };
  const pressItems   = formData?.press_features    || [];
  const awards       = formData?.awards            || [];

  const [hoursEnabled, setHoursEnabled] = useState(
    () => !!(formData?.opening_hours_enabled)
  );

  // ── AI Lookup ─────────────────────────────────────────────────────────────
  const venueId      = formData?.id;
  const venueName    = formData?.venue_name || formData?.name || '';
  const websiteUrl   = formData?.website || formData?.website_url || profile?.website || '';
  const locationHint = [formData?.city, formData?.region, formData?.country]
    .filter(Boolean)
    .join(', ');
  const [showListingInfoLookupAI, setShowListingInfoLookupAI] = useState(false);

  const handleListingInfoLookupInsert = (text) => {
    const parsed = extractJsonObject(text);
    if (!parsed || typeof parsed !== 'object') {
      alert('AI did not return valid JSON. Try again or fill in the fields manually.');
      return;
    }

    let appliedAny = false;

    // ── contact_profile ─────────────────────────────────────────────
    if (parsed.contact_profile && typeof parsed.contact_profile === 'object') {
      const p = parsed.contact_profile;
      const cleanStr = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const incomingSocial = (p.social && typeof p.social === 'object') ? p.social : {};
      const mergedSocial = { ...(profile.social || {}) };
      SOCIAL_KEYS.forEach(k => {
        const val = cleanStr(incomingSocial[k], 300);
        if (val) mergedSocial[k] = val;
      });

      const merged = {
        ...profile,
        // Preserve photo_url / photo_file — AI cannot supply these
        photo_url: profile.photo_url || '',
        name:          cleanStr(p.name, 80)        || profile.name || '',
        title:         cleanStr(p.title, 80)       || profile.title || '',
        bio:           cleanStr(p.bio, 600)        || profile.bio || '',
        response_time: profile.response_time || '',
        response_rate: profile.response_rate || '',
        email:         cleanStr(p.email, 200)      || profile.email || '',
        phone:         cleanStr(p.phone, 60)       || profile.phone || '',
        whatsapp:      cleanStr(p.whatsapp, 60)    || profile.whatsapp || '',
        website:       cleanStr(p.website, 300)    || profile.website || '',
        social:        mergedSocial,
      };
      onChange('contact_profile', merged);
      appliedAny = true;
    }

    // ── opening_hours ───────────────────────────────────────────────
    if (parsed.opening_hours && typeof parsed.opening_hours === 'object') {
      const incoming = parsed.opening_hours;
      const nextHours = { ...DEFAULT_HOURS };
      DAYS.forEach(({ key }) => {
        const day = incoming[key];
        if (!day || typeof day !== 'object') return;
        const type = ALLOWED_HOUR_TYPES.includes(day.type) ? day.type : 'by_appointment';
        const from = (typeof day.from === 'string' && TIME_OPTIONS.includes(day.from)) ? day.from : '09:00';
        const to   = (typeof day.to   === 'string' && TIME_OPTIONS.includes(day.to))   ? day.to   : '17:00';
        nextHours[key] = { type, from, to };
      });
      onChange('opening_hours', nextHours);
      // Auto-enable the toggle so user sees the values land
      if (!hoursEnabled) {
        setHoursEnabled(true);
        onChange('opening_hours_enabled', true);
      }
      appliedAny = true;
    }

    // ── press_features ──────────────────────────────────────────────
    if (Array.isArray(parsed.press_features)) {
      const newPress = parsed.press_features
        .slice(0, 6)
        .map((p, i) => {
          if (!p || typeof p !== 'object') return null;
          const outlet = typeof p.outlet === 'string' ? p.outlet.trim().slice(0, 80) : '';
          const title  = typeof p.title  === 'string' ? p.title.trim().slice(0, 200) : '';
          const url    = typeof p.url    === 'string' ? p.url.trim().slice(0, 500)   : '';
          const yearNum = Number(p.year);
          const year = Number.isFinite(yearNum) && yearNum > 1900 && yearNum < 2100
            ? String(Math.trunc(yearNum))
            : '';
          if (!outlet && !title) return null;
          return {
            id: genId(),
            outlet,
            year,
            title,
            url,
            logo_url: '',
            body: '',
          };
        })
        .filter(Boolean);
      if (newPress.length > 0) {
        onChange('press_features', newPress);
        appliedAny = true;
      }
    }

    // ── awards ──────────────────────────────────────────────────────
    if (Array.isArray(parsed.awards)) {
      const newAwards = parsed.awards
        .slice(0, 8)
        .map(a => {
          if (!a || typeof a !== 'object') return null;
          const award  = typeof a.award  === 'string' ? a.award.trim().slice(0, 120) : '';
          const issuer = typeof a.issuer === 'string' ? a.issuer.trim().slice(0, 120) : '';
          const yearNum = Number(a.year);
          const year = Number.isFinite(yearNum) && yearNum > 1900 && yearNum < 2100
            ? String(Math.trunc(yearNum))
            : '';
          if (!award) return null;
          return {
            id: genId(),
            award,
            year,
            issuer,
            icon: '🏆',
            description: '',
          };
        })
        .filter(Boolean);
      if (newAwards.length > 0) {
        onChange('awards', newAwards);
        appliedAny = true;
      }
    }

    if (!appliedAny) {
      alert('AI returned a valid response but no usable listing info. Try again or fill manually.');
      return;
    }

    setShowListingInfoLookupAI(false);
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>Listing Info</h3>
        <button type="button" onClick={() => setShowListingInfoLookupAI(v => !v)} style={aiLinkStyle}>
          ✦ Find listing info with AI
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 16, marginTop: 4 }}>
        Profile card, opening hours, press features and awards, shown in the public listing sidebar
      </p>
      {showListingInfoLookupAI && (
        <div style={{ marginBottom: 20 }}>
          <AIContentGenerator
            feature="listing_info_lookup"
            systemPrompt={LISTING_INFO_LOOKUP_SYSTEM}
            userPrompt={buildListingInfoLookupPrompt(venueName, websiteUrl, locationHint)}
            venueId={venueId}
            onInsert={handleListingInfoLookupInsert}
            label="Find Listing Info"
          />
          <p style={aiHintStyle}>
            AI will research the venue's public profile, opening hours, press coverage and awards. Existing photos and notes are preserved. Review every field before saving — never publish unverified contact details.
          </p>
        </div>
      )}

      {/* ── Contact / Profile card ───────────────────────────────── */}
      <SectionCard
        icon="👤"
        title="Contact Profile"
        subtitle="Shown as the owner / contact card on the public listing"
        defaultOpen
      >
        <ContactProfileEditor
          profile={profile}
          onChange={val => onChange('contact_profile', val)}
        />

        {/* Weddings Held + Partner Since */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <label style={LABEL}>
              Weddings Held{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>shown as "X+" on listing</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData?.weddings_hosted || ''}
              onChange={e => onChange('weddings_hosted', e.target.value)}
              placeholder="e.g. 150"
              style={FIELD}
            />
          </div>
          <div>
            <label style={LABEL}>
              Partner Since{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#bbb' }}>year joined LWD</span>
            </label>
            <input
              type="text"
              value={formData?.member_since || ''}
              onChange={e => onChange('member_since', e.target.value)}
              placeholder="e.g. 2022"
              style={FIELD}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Opening hours ────────────────────────────────────────── */}
      <SectionCard
        icon="🕐"
        title="Opening Hours"
        subtitle="Viewings, appointments and show-round availability"
        defaultOpen={false}
        badge={hoursEnabled ? 'Enabled' : null}
      >
        {/* Enable toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
          <span
            onClick={() => {
              const next = !hoursEnabled;
              setHoursEnabled(next);
              onChange('opening_hours_enabled', next);
            }}
            style={{
              display: 'inline-flex',
              width: 36,
              height: 20,
              borderRadius: 10,
              backgroundColor: hoursEnabled ? '#7a5f10' : '#ccc',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: hoursEnabled ? 19 : 3,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </span>
          <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
            Show opening hours on listing
          </span>
        </label>

        {hoursEnabled && (
          <OpeningHoursEditor
            hours={openHours}
            onChange={val => onChange('opening_hours', val)}
          />
        )}

        {!hoursEnabled && (
          <p style={{ fontSize: 12, color: '#bbb', margin: 0, fontStyle: 'italic' }}>
            Enable above to set viewings and appointment availability
          </p>
        )}
      </SectionCard>

      {/* ── Press & News ─────────────────────────────────────────── */}
      <SectionCard
        icon="📰"
        title="Press & News"
        subtitle="'As Featured In', publication features and editorial coverage"
        defaultOpen={false}
        badge={pressItems.length > 0 ? `${pressItems.length} feature${pressItems.length !== 1 ? 's' : ''}` : null}
      >
        <PressEditor
          items={pressItems}
          onChange={val => onChange('press_features', val)}
        />
      </SectionCard>

      {/* ── Awards & Recognition ─────────────────────────────────── */}
      <SectionCard
        icon="🏆"
        title="Awards & Recognition"
        subtitle="Industry awards, certifications and accolades"
        defaultOpen={false}
        badge={awards.length > 0 ? `${awards.length} award${awards.length !== 1 ? 's' : ''}` : null}
      >
        <AwardsEditor
          items={awards}
          onChange={val => onChange('awards', val)}
        />
      </SectionCard>
    </section>
  );
};

export default ListingInfoSection;
