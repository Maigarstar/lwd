/**
 * SEOSection — Meta title, description, and keywords (max 8)
 *
 * Keywords are used for:
 *   • HTML <meta name="keywords"> tag
 *   • AI search indexing / vector embeddings
 *
 * UX: tag-pill input — type keyword, press Enter / Tab / comma to add.
 *     Remove pills with × button. Counter shows X / 8.
 */

import { useRef, useState } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { SEO_SYSTEM, buildSeoTitlePrompt, buildSeoDescriptionPrompt, buildSeoKeywordsPrompt } from '../../../lib/aiPrompts';

const KEYWORD_MAX = 8;

// ── Shared label style ────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#1a1a1a',
  marginBottom: 6,
};

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13,
  lineHeight: 1.6,
  border: '1px solid #ddd4c8',
  borderRadius: 3,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  color: '#333',
  backgroundColor: '#fff',
};

const hintStyle = {
  fontSize: 10,
  color: '#aaa',
  margin: '4px 0 0',
};

// ── Keywords tag-input ────────────────────────────────────────────────────────
const KeywordsInput = ({ keywords = [], onChange }) => {
  const inputRef = useRef(null);

  const atMax = keywords.length >= KEYWORD_MAX;

  const addKeyword = (raw) => {
    const kw = raw.trim().toLowerCase().replace(/,+$/, '');
    if (!kw) return;
    if (atMax) return;
    if (keywords.includes(kw)) return; // no duplicates
    onChange([...keywords, kw]);
  };

  const removeKeyword = (kw) => onChange(keywords.filter(k => k !== kw));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      addKeyword(e.currentTarget.value);
      e.currentTarget.value = '';
    }
    if (e.key === 'Backspace' && e.currentTarget.value === '' && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  const handleBlur = (e) => {
    if (e.target.value.trim()) {
      addKeyword(e.target.value);
      e.target.value = '';
    }
  };

  return (
    <div>
      {/* Pills + input box */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          border: '1px solid #ddd4c8',
          borderRadius: 3,
          backgroundColor: '#fff',
          cursor: 'text',
          minHeight: 42,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {keywords.map(kw => (
          <span
            key={kw}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px 3px 10px',
              backgroundColor: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              color: '#7a5c10',
              whiteSpace: 'nowrap',
            }}
          >
            {kw}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 14, height: 14, padding: 0, margin: 0,
                border: 'none', background: 'none',
                color: '#9a7020', cursor: 'pointer',
                fontSize: 13, lineHeight: 1,
                opacity: 0.7,
              }}
              title={`Remove "${kw}"`}
            >
              ×
            </button>
          </span>
        ))}

        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            placeholder={keywords.length === 0 ? 'Type keyword, press Enter or comma…' : ''}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
              flex: '1 1 120px',
              minWidth: 80,
              border: 'none',
              outline: 'none',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#333',
              backgroundColor: 'transparent',
              padding: '2px 2px',
            }}
          />
        )}
      </div>

      {/* Counter + hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <p style={hintStyle}>
          Used for search engines and AI discovery. Press Enter, Tab, or comma to add.
        </p>
        <span style={{
          fontSize: 11,
          fontWeight: atMax ? 700 : 400,
          color: atMax ? '#dc2626' : keywords.length >= 6 ? '#f59e0b' : '#bbb',
          whiteSpace: 'nowrap',
          marginLeft: 12,
        }}>
          {keywords.length} / {KEYWORD_MAX}
        </span>
      </div>
    </div>
  );
};

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

// ── Main section ──────────────────────────────────────────────────────────────
const SEOSection = ({ formData, onChange }) => {
  const seoTitle       = formData?.seo_title || '';
  const seoDescription = formData?.seo_description || '';
  const seoKeywords    = formData?.seo_keywords || [];
  const [showTitleAI, setShowTitleAI]   = useState(false);
  const [showDescAI, setShowDescAI]     = useState(false);
  const [showKwAI, setShowKwAI]         = useState(false);

  const titleRemaining = 60 - seoTitle.length;
  const descRemaining  = 160 - seoDescription.length;
  const titleNearLimit = titleRemaining <= 15;
  const titleAtLimit   = titleRemaining <= 5;
  const descNearLimit  = descRemaining <= 30;
  const descAtLimit    = descRemaining <= 10;

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* ── Section header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px',
        }}>
          SEO Settings
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Optimise how this listing appears in Google and AI-powered search tools.
        </p>
      </div>

      {/* ── Meta Title ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Meta Title</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setShowTitleAI(v => !v)} style={aiLinkStyle}>
              ✦ Generate with AI
            </button>
            <span style={{
              fontSize: 11,
              fontWeight: titleAtLimit ? 700 : 400,
              color: titleAtLimit ? '#dc2626' : titleNearLimit ? '#f59e0b' : '#bbb',
            }}>
              {seoTitle.length} / 60
            </span>
          </div>
        </div>
        {showTitleAI && (
          <div style={{ marginBottom: 10 }}>
            <AIContentGenerator
              feature="seo_title"
              systemPrompt={SEO_SYSTEM}
              userPrompt={buildSeoTitlePrompt(formData?.venue_name || formData?.name || '', formData)}
              venueId={formData?.id}
              onInsert={(text) => { onChange('seo_title', text.slice(0, 60)); setShowTitleAI(false); }}
              label="Generate Meta Title"
            />
          </div>
        )}
        <input
          type="text"
          name="seo_title"
          value={seoTitle}
          onChange={(e) => { if (e.target.value.length <= 60) onChange('seo_title', e.target.value); }}
          placeholder="Page title shown in search engine results"
          maxLength={60}
          style={{ ...fieldStyle }}
        />
        <p style={hintStyle}>Aim for 50–60 characters. Include the venue name and location.</p>
      </div>

      {/* ── Meta Description ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Meta Description</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setShowDescAI(v => !v)} style={aiLinkStyle}>
              ✦ Generate with AI
            </button>
            <span style={{
              fontSize: 11,
              fontWeight: descAtLimit ? 700 : 400,
              color: descAtLimit ? '#dc2626' : descNearLimit ? '#f59e0b' : '#bbb',
            }}>
              {seoDescription.length} / 160
            </span>
          </div>
        </div>
        {showDescAI && (
          <div style={{ marginBottom: 10 }}>
            <AIContentGenerator
              feature="seo_description"
              systemPrompt={SEO_SYSTEM}
              userPrompt={buildSeoDescriptionPrompt(formData?.venue_name || formData?.name || '', formData)}
              venueId={formData?.id}
              onInsert={(text) => { onChange('seo_description', text.slice(0, 160)); setShowDescAI(false); }}
              label="Generate Meta Description"
            />
          </div>
        )}
        <textarea
          name="seo_description"
          value={seoDescription}
          onChange={(e) => { if (e.target.value.length <= 160) onChange('seo_description', e.target.value); }}
          placeholder="Page description shown beneath the title in search results"
          maxLength={160}
          style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }}
        />
        <p style={hintStyle}>Aim for 120–160 characters. Compelling copy improves click-through rate.</p>
      </div>

      {/* ── Meta Keywords ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Keywords</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setShowKwAI(v => !v)} style={aiLinkStyle}>
              ✦ Generate with AI
            </button>
            <span style={{ fontSize: 10, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.03em' }}>
              SEO + AI Search
            </span>
          </div>
        </div>
        {showKwAI && (
          <div style={{ marginBottom: 10 }}>
            <AIContentGenerator
              feature="seo_keywords"
              systemPrompt={SEO_SYSTEM}
              userPrompt={buildSeoKeywordsPrompt(formData?.venue_name || formData?.name || '', formData)}
              venueId={formData?.id}
              onInsert={(text) => {
                const parsed = text.split(',').map(k => k.trim().toLowerCase()).filter(Boolean).slice(0, 8);
                onChange('seo_keywords', parsed);
                setShowKwAI(false);
              }}
              label="Generate Keywords"
            />
          </div>
        )}
        <KeywordsInput
          keywords={seoKeywords}
          onChange={(kws) => onChange('seo_keywords', kws)}
        />
      </div>

    </section>
  );
};

export default SEOSection;
