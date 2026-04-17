// ─── src/pages/PublicationStudio.jsx ─────────────────────────────────────────
// Dedicated creative workspace for building LWD flipbook publications.
// Route: /publication-studio
//
// Layout:
//   ┌─ TopBar ──────────────────────────────────────────────┐
//   ├─ Sidebar ──┬─ Main area ──────────────────────────────┤
//   │ Issue list │ [Overview][Pages][PDF][Analytics][Settings]│
//   │            │  tab content                              │
//   │ + New      │                                           │
//   └────────────┴───────────────────────────────────────────┘
//
// AI Polish: every prose field (intro, editor note, SEO desc) has a
// ✦ Polish button that calls the AI to fix spelling & grammar.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchIssues,
  fetchIssueById,
  createIssue,
  updateIssue,
  publishIssue,
  unpublishIssue,
  archiveIssue,
  deleteIssue,
  bumpRenderVersion,
  uploadIssueCover,
  uploadIssueBackCover,
} from '../services/magazineIssuesService';
import { deleteAllPages, fetchPages } from '../services/magazinePageService';
import { processPdf }                 from '../services/pdfProcessorService';
import { supabase }                   from '../lib/supabaseClient';
import { sendEmail, fetchNewsletterSubscribers } from '../services/emailSendService';

// ── Re-used admin components ──────────────────────────────────────────────────
import PageGrid       from './AdminModules/components/PageGrid';
import PdfUploader    from './AdminModules/components/PdfUploader';
import HotspotEditor    from './PublicationStudio/HotspotEditor';
import TemplatePicker  from './PublicationStudio/templates/TemplatePicker';
import TemplateEditor  from './PublicationStudio/templates/TemplateEditor';
import MonetizationTab        from './PublicationStudio/MonetizationTab';
import PageDesigner           from './PublicationStudio/PageDesigner';
import HeatmapPanel            from './PublicationStudio/HeatmapPanel';
import PageCommentsPanel       from './PublicationStudio/PageCommentsPanel';
import EditorialCalendarPanel  from './PublicationStudio/EditorialCalendarPanel';
import BrandKitPanel           from './PublicationStudio/BrandKitPanel';
import { uploadIssueAltCover, fetchRenderHistory } from '../services/magazineIssuesService';
import { fetchCommentCountsByPage } from '../services/magazineCommentsService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const BG     = '#0C0B09';
const SURF   = '#141210';
const SIDE   = '#100F0D';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.38)';
const INPUT  = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: '#fff',
  fontFamily: NU, fontSize: 13,
  padding: '8px 10px', outline: 'none',
};

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  published: { label: 'Published', color: '#34d399',                bg: 'rgba(52,211,153,0.1)'  },
  archived:  { label: 'Archived',  color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)' },
};

const SEASONS     = ['Spring', 'Summer', 'Autumn', 'Winter'];
const CURR_YEAR   = new Date().getFullYear();
const YEAR_OPTS   = Array.from({ length: 10 }, (_, i) => CURR_YEAR - 2 + i);
const POLISH_SYS  = 'You are a professional copy editor for a luxury wedding magazine. Fix all spelling, grammar, and punctuation errors in the text. Preserve the exact tone, style, and meaning. Return only the corrected text — no explanation, no quotes.';

// ── Editorial personas for AI generation ──────────────────────────────────────
const PERSONAS = [
  {
    id: 'luxury-editorial',
    label: 'Luxury Editorial',
    emoji: '✦',
    sys: 'You are a senior editor at a prestigious luxury wedding magazine in the style of Vogue and Condé Nast Bride. Write with sophistication, elegance, and aspiration. Use elevated vocabulary, evocative imagery, and a tone that feels exclusive yet warmly inviting. Every sentence should feel considered.',
  },
  {
    id: 'romantic-dreamy',
    label: 'Romantic',
    emoji: '◇',
    sys: 'You are a romantic editorial writer for a high-end bridal magazine. Write with warmth, poetry, and emotional depth. Evoke the feeling of love, beauty, and the magic of weddings. Use lyrical, gentle, and evocative language.',
  },
  {
    id: 'modern-bold',
    label: 'Modern & Bold',
    emoji: '◈',
    sys: "You are a bold, modern magazine editor in the style of Harper's Bazaar. Write with confidence, directness, and contemporary energy. Be stylish and authoritative — strong, current, and impactful without being cold.",
  },
  {
    id: 'playful-exciting',
    label: 'Playful',
    emoji: '⊕',
    sys: 'You are an enthusiastic and warm wedding magazine editor. Write with genuine excitement, charm, and approachable energy. Celebrate love joyfully. Be conversational but polished — like a brilliant friend who knows weddings inside out.',
  },
  {
    id: 'intimate-personal',
    label: 'Intimate',
    emoji: '◉',
    sys: 'You write in a personal, intimate editorial voice — warm, close, diary-like. Write as if the editor is speaking directly to the reader, sharing something meaningful and real. Vulnerable yet curated, personal yet universal.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    emoji: '▣',
    sys: 'You are a cinematic storyteller writing for a luxury publication. Write with visual, atmospheric language that paints vivid scenes. Think light, texture, movement, and emotion. Every sentence should feel like a still frame from a beautiful film.',
  },
  {
    id: 'minimal-refined',
    label: 'Minimal',
    emoji: '—',
    sys: 'You write in the Net-a-Porter / Bottega Veneta editorial style — spare, precise, and quietly confident. Never over-explain. Every word is deliberate. Restrained luxury. Say more with less.',
  },
];

const GENERATE_PROMPTS = {
  title: (f) =>
    `Write a single compelling editorial magazine issue title for a luxury wedding publication. Season: ${f.season || 'unspecified'}, Year: ${f.year || new Date().getFullYear()}${f.intro ? `. Theme hint: "${f.intro.slice(0, 120)}"` : ''}. Return ONLY the title, nothing else, no punctuation at the end unless it is a meaningful part of the title.`,
  intro: (f) =>
    `Write a 2–3 sentence editorial introduction for issue "${f.title || 'New Issue'}" of Luxury Wedding Directory magazine${f.season ? ` (${f.season} ${f.year || ''})` : ''}. This appears on the public issue listing page. Return ONLY the paragraph text.`,
  editor_note: (f) =>
    `Write an editor's note of 2–3 paragraphs for issue "${f.title || 'New Issue'}" of Luxury Wedding Directory magazine${f.intro ? `. Issue theme: "${f.intro.slice(0, 150)}"` : ''}. Write in first person as the editor. Return ONLY the editor's note text.`,
  seo_title: (f) =>
    `Write an SEO-optimised title strictly under 60 characters for this luxury wedding magazine issue titled "${f.title || 'New Issue'}"${f.season ? `, ${f.season} ${f.year}` : ''}. Return ONLY the title.`,
  seo_description: (f) =>
    `Write a meta description strictly under 155 characters for this luxury wedding magazine issue titled "${f.title || 'New Issue'}"${f.intro ? `. Theme: "${f.intro.slice(0, 80)}"` : ''}. Return ONLY the meta description text.`,
};

function fmt(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Primitive UI pieces ───────────────────────────────────────────────────────

function StatusPill({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color, background: s.bg, borderRadius: 10, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function Lbl({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</span>
      {hint && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>{hint}</span>}
    </div>
  );
}

function Field({ label, hint, children, counter }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Lbl hint={hint}>{label}</Lbl>
      {children}
      {counter}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 14, marginTop: 4 }}>
      {children}
    </div>
  );
}

function Hr() {
  return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '20px 0' }} />;
}

function Btn({ children, onClick, gold, danger, disabled, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: NU, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        border: 'none', borderRadius: 3,
        padding: small ? '5px 10px' : '7px 14px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        background: gold
          ? hov ? '#b8954d' : GOLD
          : danger
            ? hov ? 'rgba(248,113,113,0.25)' : 'rgba(248,113,113,0.1)'
            : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        color: gold ? '#1a1806' : danger ? '#f87171' : 'rgba(255,255,255,0.7)',
      }}
    >{children}</button>
  );
}

// ── AI Polish button + suggestion bar ─────────────────────────────────────────

function PolishButton({ onClick, loading, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Fix spelling & grammar with AI"
      style={{
        fontFamily: NU, fontSize: 8, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        background: 'none',
        border: `1px solid ${hov && !disabled ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 2, padding: '3px 8px',
        color: loading ? GOLD : hov && !disabled ? GOLD : MUTED,
        cursor: disabled || loading ? 'default' : 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      {loading ? '⟳ Polishing…' : '✦ Polish'}
    </button>
  );
}

function SuggestionBar({ polished, onAccept, onDismiss }) {
  return (
    <div style={{
      marginTop: 8, background: 'rgba(201,168,76,0.06)',
      border: `1px solid rgba(201,168,76,0.25)`,
      borderRadius: 4, padding: '10px 12px',
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        ✦ AI Suggestion
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
        {polished}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn small gold onClick={onAccept}>Accept</Btn>
        <Btn small onClick={onDismiss}>Dismiss</Btn>
      </div>
    </div>
  );
}

// ── Persona selector ──────────────────────────────────────────────────────────

function PersonaSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
        ✦ AI Writing Persona
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PERSONAS.map(p => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              title={p.sys.slice(0, 100) + '…'}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '5px 11px',
                borderRadius: 2,
                border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`,
                background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                color: active ? GOLD : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.emoji} {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// AIField — textarea with both Generate (new content) and Polish (grammar fix) buttons
function AIField({ label, hint, value, onChange, rows = 4, charLimit, field, issueData, persona }) {
  const [polishing,  setPolishing]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [aiErr,      setAiErr]      = useState('');

  const runAI = async (mode) => {
    const personaConfig = PERSONAS.find(p => p.id === persona) || PERSONAS[0];
    const isSetter = mode === 'generate' ? setGenerating : setPolishing;
    isSetter(true); setAiErr(''); setSuggestion(null);
    try {
      const { callAiGenerate } = await import('../lib/aiGenerate');
      const systemPrompt = mode === 'generate'
        ? personaConfig.sys
        : POLISH_SYS;
      const userPrompt = mode === 'generate'
        ? (GENERATE_PROMPTS[field]?.(issueData || {}) || (value || '').trim())
        : (value || '').trim();
      if (!userPrompt) { isSetter(false); return; }
      const data = await callAiGenerate({ feature: `pub_${mode}_${field}`, systemPrompt, userPrompt });
      if (data?.text?.trim()) setSuggestion(data.text.trim());
      else setAiErr('No content returned.');
    } catch (e) {
      setAiErr(e.message || 'AI unavailable');
    }
    isSetter(false);
  };

  const len = (value || '').length;
  const busy = polishing || generating;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <Lbl hint={hint}>{label}</Lbl>
        <div style={{ display: 'flex', gap: 5 }}>
          {/* Generate button — creates new content in selected persona */}
          {field && GENERATE_PROMPTS[field] && (
            <button
              onClick={() => runAI('generate')}
              disabled={busy}
              title={`Generate ${label} in ${PERSONAS.find(p => p.id === persona)?.label || 'Luxury Editorial'} style`}
              style={{
                fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: generating ? 'rgba(201,168,76,0.12)' : 'none',
                border: `1px solid ${generating ? GOLD : 'rgba(201,168,76,0.4)'}`,
                borderRadius: 2, padding: '3px 8px',
                color: generating ? GOLD : 'rgba(201,168,76,0.7)',
                cursor: busy ? 'default' : 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {generating ? '⟳ Generating…' : '✦ Generate'}
            </button>
          )}
          {/* Polish button — grammar/spelling fix only */}
          <button
            onClick={() => runAI('polish')}
            disabled={busy || !value?.trim()}
            title="Fix spelling & grammar"
            style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'none',
              border: `1px solid ${polishing ? GOLD : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 2, padding: '3px 8px',
              color: polishing ? GOLD : (!value?.trim() ? 'rgba(255,255,255,0.2)' : MUTED),
              cursor: (busy || !value?.trim()) ? 'default' : 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {polishing ? '⟳ Polishing…' : '✦ Polish'}
          </button>
        </div>
      </div>
      <textarea
        value={value ?? ''}
        onChange={e => { onChange(e.target.value); setSuggestion(null); }}
        rows={rows}
        spellCheck
        style={{ ...INPUT, resize: 'vertical' }}
      />
      {charLimit && (
        <div style={{ fontFamily: NU, fontSize: 10, color: len > charLimit ? '#f87171' : MUTED, marginTop: 3 }}>
          {len}/{charLimit}
        </div>
      )}
      {aiErr && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>{aiErr}</div>}
      {suggestion && (
        <SuggestionBar
          polished={suggestion}
          onAccept={() => { onChange(suggestion); setSuggestion(null); }}
          onDismiss={() => setSuggestion(null)}
        />
      )}
    </div>
  );
}

// AIInputField — single-line input with Generate button
function AIInputField({ label, hint, value, onChange, placeholder, field, issueData, persona, monospace, charLimit }) {
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [aiErr,      setAiErr]      = useState('');

  const handleGenerate = async () => {
    const personaConfig = PERSONAS.find(p => p.id === persona) || PERSONAS[0];
    setGenerating(true); setAiErr(''); setSuggestion(null);
    try {
      const { callAiGenerate } = await import('../lib/aiGenerate');
      const userPrompt = GENERATE_PROMPTS[field]?.(issueData || {});
      if (!userPrompt) { setGenerating(false); return; }
      const data = await callAiGenerate({ feature: `pub_generate_${field}`, systemPrompt: personaConfig.sys, userPrompt });
      if (data?.text?.trim()) setSuggestion(data.text.trim());
      else setAiErr('No content returned.');
    } catch (e) {
      setAiErr(e.message || 'AI unavailable');
    }
    setGenerating(false);
  };

  const len = (value || '').length;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <Lbl hint={hint}>{label}</Lbl>
        {field && GENERATE_PROMPTS[field] && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: generating ? 'rgba(201,168,76,0.12)' : 'none',
              border: `1px solid ${generating ? GOLD : 'rgba(201,168,76,0.4)'}`,
              borderRadius: 2, padding: '3px 8px',
              color: generating ? GOLD : 'rgba(201,168,76,0.7)',
              cursor: generating ? 'default' : 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {generating ? '⟳ Generating…' : '✦ Generate'}
          </button>
        )}
      </div>
      <input
        spellCheck
        value={value ?? ''}
        onChange={e => { onChange(e.target.value); setSuggestion(null); }}
        placeholder={placeholder}
        style={{ ...INPUT, ...(monospace ? { fontFamily: 'monospace', fontSize: 12 } : {}) }}
      />
      {charLimit && (
        <div style={{ fontFamily: NU, fontSize: 10, color: len > charLimit ? '#f87171' : MUTED, marginTop: 3 }}>
          {len}/{charLimit}
        </div>
      )}
      {aiErr && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>{aiErr}</div>}
      {suggestion && (
        <SuggestionBar
          polished={suggestion}
          onAccept={() => { onChange(suggestion); setSuggestion(null); }}
          onDismiss={() => setSuggestion(null)}
        />
      )}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ data, onChange, slugLocked, saving, onSave, coverUrl, onCoverUpload, coverUploading, backCoverUrl, onBackCoverUpload, backCoverUploading, altCoverUrl, onAltCoverUpload, altCoverUploading, persona, onPersonaChange }) {
  const [slugTouched, setSlugTouched] = useState(false);
  const coverRef     = useRef(null);
  const backCoverRef = useRef(null);
  const altCoverRef  = useRef(null);

  // Auto-slug from title
  useEffect(() => {
    if (slugTouched || slugLocked || !data?.title) return;
    const base = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const yr   = data.year ? `-${data.year}` : '';
    onChange('slug', `${base}${yr}`);
  }, [data?.title, data?.year]);

  const f = data || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, padding: '28px 32px' }}>

      {/* ── Left: form ── */}
      <div>
        <PersonaSelector value={persona} onChange={onPersonaChange} />

        <SectionHead>Issue Details</SectionHead>

        <AIInputField
          field="title"
          issueData={f}
          persona={persona}
          label="Title"
          hint="required"
          value={f.title}
          onChange={v => onChange('title', v)}
          placeholder="e.g. The Grand Wedding Edition"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Issue No.">
            <input type="number" spellCheck={false} value={f.issue_number ?? ''} onChange={e => onChange('issue_number', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="01" style={INPUT} />
          </Field>
          <Field label="Season">
            <select value={f.season ?? ''} onChange={e => onChange('season', e.target.value || null)}
              style={{ ...INPUT, cursor: 'pointer' }}>
              <option value="" style={{ background: '#1a1a18' }}>— None —</option>
              {SEASONS.map(s => <option key={s} value={s} style={{ background: '#1a1a18' }}>{s}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <select value={f.year ?? CURR_YEAR} onChange={e => onChange('year', parseInt(e.target.value))}
              style={{ ...INPUT, cursor: 'pointer' }}>
              {YEAR_OPTS.map(y => <option key={y} value={y} style={{ background: '#1a1a18' }}>{y}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Slug" hint={slugLocked ? '(locked after first publish)' : '(auto-generated)'}>
          <input spellCheck={false} value={f.slug ?? ''} disabled={slugLocked}
            onChange={e => { setSlugTouched(true); onChange('slug', e.target.value); }}
            placeholder="grand-wedding-edition-2026"
            style={{ ...INPUT, opacity: slugLocked ? 0.45 : 1, fontFamily: 'monospace', fontSize: 12 }} />
        </Field>

        <Field label="Featured">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => onChange('is_featured', !f.is_featured)}
              style={{ width: 36, height: 20, borderRadius: 10, background: f.is_featured ? GOLD : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: f.is_featured ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontFamily: NU, fontSize: 12, color: MUTED }}>Featured on publications listing</span>
          </label>
        </Field>

        <Hr />
        <SectionHead>Editorial Content</SectionHead>

        <AIField
          field="intro"
          issueData={f}
          persona={persona}
          label="Introduction"
          hint="Shown on the public listing page"
          value={f.intro}
          onChange={v => onChange('intro', v)}
          rows={3}
        />

        <AIField
          field="editor_note"
          issueData={f}
          persona={persona}
          label="Editor's Note"
          hint="Personal note from the editor"
          value={f.editor_note}
          onChange={v => onChange('editor_note', v)}
          rows={5}
        />

        <Hr />
        <SectionHead>SEO</SectionHead>

        <AIInputField
          field="seo_title"
          issueData={f}
          persona={persona}
          label="SEO Title"
          hint="max 60 chars"
          value={f.seo_title}
          onChange={v => onChange('seo_title', v)}
          placeholder="Leave blank to use issue title"
          charLimit={60}
        />

        <AIField
          field="seo_description"
          issueData={f}
          persona={persona}
          label="SEO Description"
          hint="max 155 chars"
          value={f.seo_description}
          onChange={v => onChange('seo_description', v)}
          rows={3}
          charLimit={155}
        />

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn gold onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
        </div>
      </div>

      {/* ── Right: cover + back cover + stats ── */}
      <div>
        {/* Cover upload */}
        <div style={{ marginBottom: 24 }}>
          <SectionHead>Cover Image</SectionHead>
          <div
            onClick={() => !coverUploading && coverRef.current?.click()}
            style={{
              cursor: coverUploading ? 'default' : 'pointer',
              borderRadius: 4, overflow: 'hidden',
              border: `1px solid ${BORDER}`,
              background: '#1A1612',
              paddingBottom: '141.4%',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
          >
            {coverUrl
              ? <img src={coverUrl} alt="Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, opacity: 0.2 }}>◈</span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center' }}>{coverUploading ? 'Uploading…' : 'Click to upload cover'}</span>
                </div>
            }
            {coverUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: GOLD }}>Uploading…</span>
              </div>
            )}
          </div>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onCoverUpload(f); e.target.value = ''; } }} />
          {coverUrl && (
            <button onClick={() => coverRef.current?.click()}
              style={{ marginTop: 8, width: '100%', fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 0', borderRadius: 3, cursor: 'pointer' }}>
              Replace cover
            </button>
          )}
        </div>

        {/* Back cover upload */}
        <div style={{ marginBottom: 24 }}>
          <SectionHead>Back Cover</SectionHead>
          <div
            onClick={() => !backCoverUploading && backCoverRef.current?.click()}
            style={{
              cursor: backCoverUploading ? 'default' : 'pointer',
              borderRadius: 4, overflow: 'hidden',
              border: `1px solid ${BORDER}`,
              background: '#1A1612',
              paddingBottom: '141.4%',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
          >
            {backCoverUrl
              ? <img src={backCoverUrl} alt="Back Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, opacity: 0.2 }}>◈</span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center' }}>{backCoverUploading ? 'Uploading…' : 'Click to upload back cover'}</span>
                </div>
            }
            {backCoverUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: GOLD }}>Uploading…</span>
              </div>
            )}
          </div>
          <input ref={backCoverRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onBackCoverUpload(f); e.target.value = ''; } }} />
          {backCoverUrl && (
            <button onClick={() => backCoverRef.current?.click()}
              style={{ marginTop: 8, width: '100%', fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 0', borderRadius: 3, cursor: 'pointer' }}>
              Replace back cover
            </button>
          )}
        </div>

        {/* A/B Test Cover */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionHead>✦ A/B Test Cover</SectionHead>
            {/* Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14 }}>
              <div
                onClick={() => onChange('ab_test_active', !f.ab_test_active)}
                style={{
                  width: 32, height: 18, borderRadius: 9,
                  background: f.ab_test_active ? GOLD : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <div style={{ position: 'absolute', top: 2, left: f.ab_test_active ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontFamily: NU, fontSize: 10, color: f.ab_test_active ? GOLD : MUTED }}>
                {f.ab_test_active ? 'Active' : 'Off'}
              </span>
            </label>
          </div>

          {f.ab_test_active && (
            <>
              {/* Alt cover upload */}
              <div
                onClick={() => !altCoverUploading && altCoverRef.current?.click()}
                style={{
                  cursor: altCoverUploading ? 'default' : 'pointer',
                  borderRadius: 4, overflow: 'hidden',
                  border: `1px solid ${GOLD}40`,
                  background: '#1A1612',
                  paddingBottom: '141.4%',
                  position: 'relative',
                  transition: 'border-color 0.2s',
                }}
              >
                {altCoverUrl
                  ? <img src={altCoverUrl} alt="Variant B Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22, opacity: 0.2 }}>◈</span>
                      <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, textAlign: 'center', padding: '0 8px' }}>
                        {altCoverUploading ? 'Uploading…' : 'Click to upload Variant B cover'}
                      </span>
                    </div>
                }
                {altCoverUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: GOLD }}>Uploading…</span>
                  </div>
                )}
              </div>
              <input ref={altCoverRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (file) { onAltCoverUpload(file); e.target.value = ''; } }} />
              {altCoverUrl && (
                <button onClick={() => altCoverRef.current?.click()}
                  style={{ marginTop: 6, width: '100%', fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 0', borderRadius: 3, cursor: 'pointer' }}>
                  Replace Variant B
                </button>
              )}

              {/* A/B Stats */}
              {(f.ab_variant_impressions || f.ab_variant_clicks) && (() => {
                const impr = f.ab_variant_impressions || { a: 0, b: 0 };
                const clks = f.ab_variant_clicks      || { a: 0, b: 0 };
                const ctrA = impr.a > 0 ? Math.round((clks.a / impr.a) * 100) : 0;
                const ctrB = impr.b > 0 ? Math.round((clks.b / impr.b) * 100) : 0;
                return (
                  <div style={{ marginTop: 10, background: 'rgba(201,168,76,0.05)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>A/B Stats</div>
                    {[
                      { label: 'Variant A (original)', impr: impr.a || 0, clicks: clks.a || 0, ctr: ctrA },
                      { label: 'Variant B (alt cover)', impr: impr.b || 0, clicks: clks.b || 0, ctr: ctrB },
                    ].map(v => (
                      <div key={v.label} style={{ marginBottom: 6 }}>
                        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 2 }}>{v.label}</div>
                        <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                          {v.impr} impressions · {v.clicks} clicks · <span style={{ color: GOLD }}>{v.ctr}% CTR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {!f.ab_test_active && (
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.6 }}>
              Enable to test two cover images. 50% of visitors see the alternate cover (Variant B).
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 16 }}>
          <SectionHead>Info</SectionHead>
          {[
            ['Pages',     data?.page_count || 0],
            ['Views',     data?.view_count || 0],
            ['Downloads', data?.download_count || 0],
            ['Published', fmt(data?.published_at)],
            ['Created',   fmt(data?.created_at)],
            ['Version',   `v${data?.render_version || 1}`],
          ].filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>{k}</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

// ── Pre-flight checklist ──────────────────────────────────────────────────────

function runPreflight(issue, pages) {
  const pg = pages?.length || 0;
  return [
    {
      id: 'pages',
      label: 'Has at least one page',
      critical: true,
      pass: pg >= 1,
      detail: pg === 0 ? 'Upload a PDF or add pages in the Pages tab' : `${pg} page${pg !== 1 ? 's' : ''} ready`,
    },
    {
      id: 'processing',
      label: 'Pages processed and ready',
      critical: true,
      pass: issue?.processing_state === 'ready',
      detail: issue?.processing_state === 'processing' ? 'PDF is still processing…'
            : issue?.processing_state === 'failed'     ? 'Processing failed — re-upload PDF'
            : issue?.processing_state === 'idle'       ? 'No PDF processed yet'
            : 'Ready ✓',
    },
    {
      id: 'slug',
      label: 'URL slug is valid',
      critical: true,
      pass: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(issue?.slug || ''),
      detail: issue?.slug ? `/publications/${issue.slug}` : 'No slug — set one in Overview',
    },
    {
      id: 'title',
      label: 'Issue title set',
      critical: false,
      pass: !!(issue?.title?.trim()),
      detail: issue?.title?.trim() || 'Set a title in the Overview tab',
    },
    {
      id: 'cover',
      label: 'Cover image uploaded',
      critical: false,
      pass: !!issue?.cover_image,
      detail: issue?.cover_image ? 'Cover ready ✓' : 'No cover — upload in Overview tab',
    },
    {
      id: 'seo_desc',
      label: 'SEO description filled',
      critical: false,
      pass: !!(issue?.seo_description?.trim()),
      detail: issue?.seo_description ? `${issue.seo_description.length} / 155 chars` : 'Add in Overview → SEO section',
    },
    {
      id: 'min_pages',
      label: '5+ pages for a complete issue',
      critical: false,
      pass: pg >= 5,
      detail: pg < 5 ? `Only ${pg} page${pg !== 1 ? 's' : ''} — readers expect more content` : `${pg} pages ✓`,
    },
    {
      id: 'intro',
      label: 'Introduction text added',
      critical: false,
      pass: !!(issue?.intro?.trim()),
      detail: issue?.intro?.trim() ? 'Intro ready ✓' : 'Add in Overview → Editorial Content',
    },
  ];
}

function PreflightPanel({ issue, pages }) {
  const checks = runPreflight(issue, pages);
  const criticalFails = checks.filter(c => c.critical && !c.pass);
  const warnFails     = checks.filter(c => !c.critical && !c.pass);
  const allPass       = checks.every(c => c.pass);

  const statusColor = criticalFails.length > 0 ? '#f87171'
                    : warnFails.length > 0      ? '#fbbf24'
                    : '#34d399';
  const statusLabel = criticalFails.length > 0 ? `${criticalFails.length} critical issue${criticalFails.length > 1 ? 's' : ''} — cannot publish`
                    : warnFails.length > 0      ? `${warnFails.length} warning${warnFails.length > 1 ? 's' : ''} — publish with caution`
                    : 'All checks passed — ready to publish';

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <SectionHead>Pre-flight Checklist</SectionHead>
        <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, borderRadius: 10, padding: '3px 10px', whiteSpace: 'nowrap', marginBottom: 14 }}>
          {statusLabel}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {checks.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 12px', borderRadius: 4,
            background: c.pass ? 'rgba(52,211,153,0.04)' : c.critical ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.05)',
            border: `1px solid ${c.pass ? 'rgba(52,211,153,0.15)' : c.critical ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.18)'}`,
          }}>
            <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>
              {c.pass ? '✓' : c.critical ? '✕' : '⚠'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: c.pass ? '#34d399' : c.critical ? '#f87171' : '#fbbf24', marginBottom: 2 }}>
                {c.label}{c.critical && !c.pass && <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, marginLeft: 6, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>REQUIRED</span>}
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ issue, pages, onPublish, onUnpublish, onArchive, onDelete, publishing, archiving, deleting, onSchedule, onPageFormat, renderHistory }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduleDate, setScheduleDate]   = useState(issue?.scheduled_publish_at ? new Date(issue.scheduled_publish_at).toISOString().slice(0, 16) : '');
  const [scheduling, setScheduling]       = useState(false);

  const preflight      = runPreflight(issue, pages);
  const criticalFails  = preflight.filter(c => c.critical && !c.pass);
  const canPublish     = criticalFails.length === 0;

  const handleSchedule = async () => {
    if (!scheduleDate || !onSchedule) return;
    setScheduling(true);
    await onSchedule(scheduleDate);
    setScheduling(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 600 }}>

      {/* Pre-flight */}
      <PreflightPanel issue={issue} pages={pages} />

      <Hr />
      <SectionHead>Publish Now</SectionHead>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {issue?.status !== 'published' && (
          <Btn gold onClick={onPublish} disabled={publishing || !canPublish}>
            {publishing ? 'Publishing…' : '↑ Publish Issue'}
          </Btn>
        )}
        {issue?.status === 'published' && (
          <Btn onClick={onUnpublish} disabled={publishing}>
            {publishing ? 'Reverting…' : '↓ Unpublish'}
          </Btn>
        )}
        {issue?.status !== 'archived' && (
          <Btn onClick={onArchive} disabled={archiving}>
            {archiving ? 'Archiving…' : 'Archive'}
          </Btn>
        )}
      </div>

      {!canPublish && (
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(248,113,113,0.8)', marginBottom: 8, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 4, padding: '8px 12px' }}>
          Fix the critical issues above before publishing.
        </div>
      )}

      <Hr />
      <SectionHead>Schedule Publish</SectionHead>
      <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
        Set a future date and time. The issue will go live automatically and send the launch email to subscribers.
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <input
          type="datetime-local"
          value={scheduleDate}
          min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
          onChange={e => setScheduleDate(e.target.value)}
          style={{ ...INPUT, width: 'auto', flex: 1, colorScheme: 'dark' }}
        />
        <Btn gold onClick={handleSchedule} disabled={!scheduleDate || scheduling || !canPublish}>
          {scheduling ? 'Scheduling…' : '⏱ Schedule'}
        </Btn>
        {issue?.scheduled_publish_at && (
          <Btn onClick={() => { setScheduleDate(''); onSchedule(null); }} disabled={scheduling}>Clear</Btn>
        )}
      </div>
      {issue?.scheduled_publish_at && (
        <div style={{ fontFamily: NU, fontSize: 10, color: GOLD }}>
          Scheduled: {new Date(issue.scheduled_publish_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      )}

      <Hr />
      <SectionHead>Page Format</SectionHead>
      <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
        Set the physical page size and how pages appear in the reader. Applied to all pages in this issue.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        <Field label="Page Size">
          <select
            value={issue?.page_size || 'A4'}
            onChange={e => onSchedule && onPageFormat?.({ page_size: e.target.value })}
            style={{ ...INPUT, cursor: 'pointer' }}
          >
            {[
              { v: 'A4',        l: 'A4  — 210 × 297 mm  (standard)' },
              { v: 'A5',        l: 'A5  — 148 × 210 mm  (compact)' },
              { v: 'US_LETTER', l: 'US Letter — 8.5 × 11 in' },
              { v: 'SQUARE',    l: 'Square — 210 × 210 mm' },
              { v: 'TABLOID',   l: 'Tabloid — 11 × 17 in  (large format)' },
            ].map(o => <option key={o.v} value={o.v} style={{ background: '#1a1a18' }}>{o.l}</option>)}
          </select>
        </Field>
        <Field label="Reader Layout">
          <select
            value={issue?.spread_layout || 'double'}
            onChange={e => onPageFormat?.({ spread_layout: e.target.value })}
            style={{ ...INPUT, cursor: 'pointer' }}
          >
            <option value="double" style={{ background: '#1a1a18' }}>Double spread — left + right pages</option>
            <option value="single" style={{ background: '#1a1a18' }}>Single page — one at a time</option>
          </select>
        </Field>
      </div>
      {/* Page size visual hint */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        {[
          { id: 'A4',    ratio: 1.414, label: 'A4' },
          { id: 'A5',    ratio: 1.414, label: 'A5' },
          { id: 'SQUARE',ratio: 1.0,   label: '■' },
          { id: 'US_LETTER', ratio: 1.294, label: 'Letter' },
          { id: 'TABLOID',   ratio: 1.545, label: 'Tabloid' },
        ].map(s => (
          <div key={s.id} onClick={() => onPageFormat?.({ page_size: s.id })}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
            }}>
            <div style={{
              width: 28, height: 28 * s.ratio,
              border: `2px solid ${(issue?.page_size || 'A4') === s.id ? GOLD : 'rgba(255,255,255,0.15)'}`,
              background: (issue?.page_size || 'A4') === s.id ? 'rgba(201,168,76,0.1)' : 'transparent',
              borderRadius: 2, transition: 'all 0.15s',
            }} />
            <span style={{ fontFamily: NU, fontSize: 8, color: (issue?.page_size || 'A4') === s.id ? GOLD : MUTED }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Hr />
      <SectionHead>Output Formats</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        {/* Digital card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '16px 14px' }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>✦ Digital</div>
          <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Flipbook</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>Reader URL</div>
          {issue?.slug ? (
            <a
              href={`/publications/${issue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: NU, fontSize: 9, color: GOLD, textDecoration: 'none', wordBreak: 'break-all' }}
            >
              /publications/{issue.slug} ↗
            </a>
          ) : (
            <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>No slug set</span>
          )}
          <div style={{ marginTop: 10 }}>
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: issue?.status === 'published' ? '#34d399' : MUTED,
              background: issue?.status === 'published' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: 10, padding: '3px 8px',
            }}>
              {issue?.status === 'published' ? '✓ Live' : issue?.status === 'draft' ? 'Draft' : issue?.status || 'Draft'}
            </span>
          </div>
        </div>

        {/* Print card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '16px 14px' }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>✦ Print</div>
          <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>PDF Export</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>300 DPI ready</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
            {issue?.pdf_url
              ? `Current PDF: ${issue.pdf_url.split('/').pop() || 'original.pdf'}`
              : 'Not uploaded'
            }
          </div>
          {issue?.pdf_url ? (
            <a
              href={issue.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: '#1a1806', background: GOLD, borderRadius: 3, padding: '5px 12px', textDecoration: 'none',
              }}
            >
              ↓ Download PDF
            </a>
          ) : (
            <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Upload PDF first</span>
          )}
          <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
            For professional print: ensure images are 300 DPI.
          </div>
        </div>
      </div>

      <Hr />
      <SectionHead>Render History</SectionHead>
      {(!renderHistory || renderHistory.length === 0) ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, padding: '12px 0' }}>No render history yet.</div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 100px 1fr', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}`, padding: '7px 12px' }}>
            {['Version', 'Pages', 'Date', 'Triggered By', 'Notes'].map(h => (
              <div key={h} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{h}</div>
            ))}
          </div>
          {renderHistory.map((row, i) => (
            <div key={row.id} style={{
              display: 'grid',
              gridTemplateColumns: '60px 60px 1fr 100px 1fr',
              padding: '8px 12px',
              borderBottom: i < renderHistory.length - 1 ? `1px solid ${BORDER}` : 'none',
              background: i === 0 ? 'rgba(201,168,76,0.04)' : 'transparent',
            }}>
              <div style={{ fontFamily: NU, fontSize: 11, color: i === 0 ? GOLD : 'rgba(255,255,255,0.7)', fontWeight: i === 0 ? 700 : 400 }}>v{row.render_version}</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{row.page_count}</div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
                {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textTransform: 'capitalize' }}>{row.triggered_by || '—'}</div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.notes || '—'}</div>
            </div>
          ))}
        </div>
      )}

      <Hr />
      <SectionHead>Danger Zone</SectionHead>

      {!confirmDelete ? (
        <Btn danger onClick={() => setConfirmDelete(true)}>Delete Issue</Btn>
      ) : (
        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: '#f87171', marginBottom: 12 }}>
            This will permanently delete the issue, all pages, and all storage files. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn danger onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Yes, delete permanently'}</Btn>
            <Btn onClick={() => setConfirmDelete(false)}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics tab (inline, mirrors MagazineIssueEditor version) ───────────────

function AnalyticsTab({ issueId, issue }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issueId) return;
    setLoading(true);
    supabase.from('magazine_analytics').select('*').eq('issue_id', issueId)
      .order('created_at', { ascending: false }).limit(2000)
      .then(({ data }) => { setRows(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [issueId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: NU, fontSize: 12, color: MUTED }}>Loading analytics…</div>;

  const views     = rows.filter(r => r.event_type === 'view');
  const turns     = rows.filter(r => r.event_type === 'page_turn');
  const downloads = rows.filter(r => r.event_type === 'download');
  const dwells    = rows.filter(r => r.event_type === 'dwell');
  const sessions  = new Set(rows.map(r => r.session_id).filter(Boolean)).size;
  const avgDwell  = dwells.length ? Math.round(dwells.reduce((s, r) => s + (r.duration_ms || 0), 0) / dwells.length / 1000) : 0;

  const pageHits = {};
  turns.forEach(r => { if (r.page_number) pageHits[r.page_number] = (pageHits[r.page_number] || 0) + 1; });
  const topPages   = Object.entries(pageHits).map(([p, c]) => ({ page: +p, count: c })).sort((a, b) => b.count - a.count).slice(0, 20);
  const maxHits    = topPages[0]?.count || 1;

  const deviceMap  = {};
  views.forEach(r => { if (r.device_type) deviceMap[r.device_type] = (deviceMap[r.device_type] || 0) + 1; });
  const devTotal   = Object.values(deviceMap).reduce((s, v) => s + v, 0) || 1;

  const Tile = ({ label, value, sub }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '16px 18px', flex: 1 }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: GD, fontSize: 30, fontWeight: 300, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 5 }}>{sub}</div>}
    </div>
  );

  if (!rows.length) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 14 }}>◈</div>
      <div style={{ fontFamily: NU, fontSize: 13, color: MUTED }}>No analytics yet.</div>
      <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
        Data appears once readers open this issue at /publications/{issue?.slug}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 860 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Tile label="Views"      value={views.length}  sub={`${sessions} unique session${sessions !== 1 ? 's' : ''}`} />
        <Tile label="Page Turns" value={turns.length}  sub={turns.length ? `avg ${Math.round(turns.length / Math.max(views.length, 1))} per visit` : null} />
        <Tile label="Downloads"  value={downloads.length} />
        <Tile label="Avg Dwell"  value={avgDwell ? `${avgDwell}s` : '—'} sub="per page" />
      </div>

      {topPages.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 12 }}>
            Page popularity
          </div>
          {topPages.map(({ page, count }) => (
            <div key={page} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ fontFamily: NU, fontSize: 10, color: MUTED, width: 40, textAlign: 'right', flexShrink: 0 }}>p.{page}</span>
              <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / maxHits) * 100}%`, background: `linear-gradient(to right, ${GOLD}, rgba(201,168,76,0.45))`, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: NU, fontSize: 10, color: MUTED, width: 24, flexShrink: 0 }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {Object.keys(deviceMap).length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(deviceMap).map(([d, c]) => (
            <div key={d} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '12px 16px', minWidth: 90 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 5 }}>{d}</div>
              <div style={{ fontFamily: GD, fontSize: 22, color: '#fff', fontWeight: 300 }}>{c}</div>
              <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 3 }}>{Math.round((c / devTotal) * 100)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Distribution tab ─────────────────────────────────────────────────────────
function DistributionTab({ issue }) {
  const BASE_URL = 'https://luxuryweddingdirectory.co.uk';
  const [embedSize, setEmbedSize] = useState('tall');
  const [copied,    setCopied]    = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const HEIGHT_MAP = { standard: '600', tall: '800', fullscreen: '100vh' };
  const height = HEIGHT_MAP[embedSize] || '800';

  const embedCode = issue
    ? `<iframe\n  src="${BASE_URL}/publications/embed/${issue.slug}"\n  width="100%"\n  height="${height}"\n  frameborder="0"\n  allowfullscreen\n  title="${issue.title} · Luxury Wedding Directory">\n</iframe>`
    : '';

  const directLink = issue ? `${BASE_URL}/publications/${issue.slug}` : '';

  const copyEmbed = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyLink = () => {
    if (!directLink) return;
    navigator.clipboard.writeText(directLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  if (!issue) return null;

  if (issue.status !== 'published') {
    return (
      <div style={{ padding: '32px 32px', maxWidth: 640 }}>
        <div style={{
          fontFamily: NU, fontSize: 12, color: MUTED, lineHeight: 1.7,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
          padding: '16px 20px',
        }}>
          Publish this issue to access distribution options.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 640 }}>

      {/* Section A — Embed */}
      <SectionHead>✦ Embed This Issue</SectionHead>
      <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
        Paste this code into any website to embed this issue.
      </div>

      {/* Size presets */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        {[
          { key: 'standard',   label: 'Standard',   sub: 'height 600' },
          { key: 'tall',       label: 'Tall',        sub: 'height 800' },
          { key: 'fullscreen', label: 'Fullscreen',  sub: 'height 100vh' },
        ].map(opt => (
          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="embedSize"
              value={opt.key}
              checked={embedSize === opt.key}
              onChange={() => setEmbedSize(opt.key)}
              style={{ accentColor: GOLD, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: NU, fontSize: 11, color: embedSize === opt.key ? '#fff' : MUTED }}>
              {opt.label}
              <span style={{ display: 'block', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                {opt.sub}
              </span>
            </span>
          </label>
        ))}
      </div>

      {/* Code textarea */}
      <textarea
        readOnly
        value={embedCode}
        onClick={e => e.target.select()}
        rows={8}
        style={{
          ...INPUT,
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          lineHeight: 1.7,
          resize: 'none',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 10,
        }}
      />

      <button
        onClick={copyEmbed}
        style={{
          fontFamily: NU, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(201,168,76,0.12)',
          border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(201,168,76,0.35)'}`,
          color: copied ? '#34d399' : GOLD,
          padding: '8px 20px', borderRadius: 3, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {copied ? 'Copied!' : '✦ Copy Code'}
      </button>

      <Hr />

      {/* Section B — Direct reader link */}
      <SectionHead>✦ Direct Reader Link</SectionHead>
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        padding: '10px 14px',
        marginBottom: 12,
        wordBreak: 'break-all',
        lineHeight: 1.5,
      }}>
        {directLink}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={copyLink}
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: linkCopied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${linkCopied ? 'rgba(52,211,153,0.35)' : BORDER}`,
            color: linkCopied ? '#34d399' : MUTED,
            padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {linkCopied ? 'Copied!' : 'Copy Link'}
        </button>
        <a
          href={directLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: GOLD, textDecoration: 'none',
            border: `1px solid rgba(201,168,76,0.3)`,
            padding: '7px 16px', borderRadius: 3,
            transition: 'opacity 0.15s',
          }}
        >
          Open →
        </a>
      </div>

      <Hr />

      {/* Section C — Partner Distribution (display only) */}
      <SectionHead>✦ Partner Distribution</SectionHead>
      <div style={{
        fontFamily: NU, fontSize: 12, color: MUTED, lineHeight: 1.7,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        padding: '16px 20px',
      }}>
        Coming soon — send this issue directly to venues and planners
        in the directory for them to embed on their profiles.
      </div>

    </div>
  );
}

// ── Issue editor (main content area) ─────────────────────────────────────────

const TABS = [
  { key: 'design',       label: '✦ Design'      },
  { key: 'overview',     label: 'Overview'      },
  { key: 'pages',        label: 'Pages'         },
  { key: 'pdf',          label: 'PDF'           },
  { key: 'analytics',    label: 'Analytics'     },
  { key: 'monetize',     label: '✦ Monetize'    },
  { key: 'distribution', label: 'Distribution'  },
  { key: 'settings',     label: 'Settings'      },
];

function IssueWorkspace({ issueId, onDelete, onReadIssue }) {
  const [issue,     setIssue]     = useState(null);
  const [formData,  setFormData]  = useState({});
  const [tab,       setTab]       = useState('overview');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [publishing,  setPublishing]  = useState(false);
  const [archiving,   setArchiving]   = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [coverUp,           setCoverUp]           = useState(false);
  const [backCoverUploading, setBackCoverUploading] = useState(false);
  const [altCoverUploading,  setAltCoverUploading]  = useState(false);
  const [persona,          setPersona]          = useState('luxury-editorial');
  const [reprocessing, setReprocessing] = useState(false);
  const [pages,              setPages]              = useState([]);
  const [hotspotPage,        setHotspotPage]        = useState(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [activeTemplate,     setActiveTemplate]     = useState(null);
  const [commentsPage,       setCommentsPage]       = useState(null); // page_number for PageCommentsPanel
  const [commentCounts,      setCommentCounts]      = useState({});   // { [pageNumber]: count }
  const [renderHistory,      setRenderHistory]      = useState([]);

  // load issue
  useEffect(() => {
    if (!issueId) return;
    fetchIssueById(issueId).then(({ data }) => {
      if (data) { setIssue(data); setFormData(data); }
    });
  }, [issueId]);

  // load pages when pages or analytics tab is active
  useEffect(() => {
    if ((tab !== 'pages' && tab !== 'analytics') || !issueId) return;
    fetchPages(issueId).then(({ data }) => {
      if (data) setPages(data);
    });
  }, [tab, issueId]);

  // load render history when settings tab is active
  useEffect(() => {
    if (tab !== 'settings' || !issueId) return;
    fetchRenderHistory(issueId).then(({ data }) => {
      if (data) setRenderHistory(data);
    });
  }, [tab, issueId]);

  // load comment counts when pages tab is active
  useEffect(() => {
    if (tab !== 'pages' || !issueId) return;
    fetchCommentCountsByPage(issueId).then(({ data }) => {
      if (data) setCommentCounts(data);
    });
  }, [tab, issueId]);

  const change = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Called by child tabs (e.g. MonetizationTab) after they save a partial update
  const handleIssueUpdate = useCallback((updatedFields) => {
    setIssue(prev => ({ ...prev, ...updatedFields }));
    setFormData(prev => ({ ...prev, ...updatedFields }));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    const { error } = await updateIssue(issueId, formData);
    if (!error) {
      setIssue(prev => ({ ...prev, ...formData }));
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2500);
    } else {
      setSaveMsg('Save failed');
    }
    setSaving(false);
  };

  const handleCoverUpload = async (file) => {
    setCoverUp(true);
    const { publicUrl, error } = await uploadIssueCover(issueId, file);
    if (!error && publicUrl) {
      setIssue(prev => ({ ...prev, cover_image: publicUrl }));
      setFormData(prev => ({ ...prev, cover_image: publicUrl }));
    }
    setCoverUp(false);
  };

  const handleBackCoverUpload = useCallback(async (file) => {
    if (!issue?.id) return;
    setBackCoverUploading(true);
    const { publicUrl, error } = await uploadIssueBackCover(issue.id, file);
    if (!error && publicUrl) {
      setIssue(prev => ({ ...prev, back_cover_image: publicUrl, back_cover_storage_path: `${issue.id}/back-cover.jpg` }));
      setFormData(prev => ({ ...prev, back_cover_image: publicUrl, back_cover_storage_path: `${issue.id}/back-cover.jpg` }));
    }
    setBackCoverUploading(false);
  }, [issue?.id]);

  const handleAltCoverUpload = useCallback(async (file) => {
    if (!issue?.id) return;
    setAltCoverUploading(true);
    const { publicUrl, error } = await uploadIssueAltCover(issue.id, file);
    if (!error && publicUrl) {
      setIssue(prev => ({ ...prev, alt_cover_image: publicUrl }));
      setFormData(prev => ({ ...prev, alt_cover_image: publicUrl }));
    }
    setAltCoverUploading(false);
  }, [issue?.id]);

  const sendIssueEmail = useCallback(async (publishedIssue) => {
    try {
      const subscribers = await fetchNewsletterSubscribers();
      if (!subscribers.length) return;

      const coverImg = publishedIssue.cover_image || '';
      const issueLabel = [
        publishedIssue.issue_number && `Issue ${publishedIssue.issue_number}`,
        publishedIssue.season,
        publishedIssue.year,
      ].filter(Boolean).join(' · ');

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;background:#0A0908;padding:40px 32px;">
    <div style="text-align:center;margin-bottom:8px;">
      <span style="font-family:'Georgia',serif;font-size:11px;color:#C9A84C;letter-spacing:0.2em;text-transform:uppercase;">Luxury Wedding Directory</span>
    </div>
    <div style="border-top:1px solid rgba(201,168,76,0.3);margin-bottom:32px;"></div>
    ${coverImg ? `<div style="text-align:center;margin-bottom:28px;"><img src="${coverImg}" alt="Issue Cover" style="max-height:400px;max-width:100%;object-fit:contain;box-shadow:0 12px 48px rgba(0,0,0,0.6);"></div>` : ''}
    <div style="text-align:center;margin-bottom:8px;">
      <span style="font-family:'Georgia',serif;font-size:11px;color:#C9A84C;letter-spacing:0.15em;text-transform:uppercase;">${issueLabel}</span>
    </div>
    <h1 style="font-family:'Georgia',serif;font-size:32px;font-weight:400;font-style:italic;color:#F0EBE0;text-align:center;margin:0 0 16px;">${publishedIssue.title || 'New Issue'}</h1>
    ${publishedIssue.intro ? `<p style="font-family:'Georgia',serif;font-size:16px;line-height:1.7;color:rgba(240,235,224,0.75);text-align:center;margin:0 0 32px;">${publishedIssue.intro.slice(0,200)}${publishedIssue.intro.length > 200 ? '…' : ''}</p>` : ''}
    <div style="text-align:center;margin-bottom:40px;">
      <a href="https://luxuryweddingdirectory.com/publications/${publishedIssue.slug}" style="display:inline-block;background:#C9A84C;color:#0A0908;font-family:'Georgia',serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:2px;">Read the Issue ✦</a>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;text-align:center;">
      <span style="font-size:11px;color:rgba(255,255,255,0.3);font-family:sans-serif;">© ${new Date().getFullYear()} Luxury Wedding Directory · <a href="https://luxuryweddingdirectory.com/unsubscribe" style="color:rgba(255,255,255,0.3);">Unsubscribe</a></span>
    </div>
  </div>
</body>
</html>`;

      await sendEmail({
        subject:    `New Issue: ${publishedIssue.title || 'The Latest Edition'} — LWD`,
        fromName:   'Luxury Wedding Directory',
        fromEmail:  'editorial@luxuryweddingdirectory.com',
        html,
        recipients: subscribers.map(s => ({ email: s.email, name: [s.first_name, s.last_name].filter(Boolean).join(' ') || undefined })),
        type:       'campaign',
      });
      console.log('[PublicationStudio] Launch email sent to', subscribers.length, 'subscribers');
    } catch (err) {
      console.warn('[PublicationStudio] Launch email failed (non-blocking):', err.message);
    }
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    const { data, error } = await publishIssue(issueId);
    if (!error && data) {
      setIssue(data);
      setFormData(data);
      sendIssueEmail(data).catch(() => {}); // fire and forget
    }
    setPublishing(false);
  };

  const handleSchedule = useCallback(async (isoDateOrNull) => {
    const { data, error } = await updateIssue(issueId, {
      scheduled_publish_at: isoDateOrNull ? new Date(isoDateOrNull).toISOString() : null,
    });
    if (!error && data) { setIssue(data); setFormData(data); }
  }, [issueId]);

  const handlePageFormat = useCallback(async (patch) => {
    const { data, error } = await updateIssue(issueId, patch);
    if (!error && data) { setIssue(data); setFormData(data); }
  }, [issueId]);

  const handleUnpublish = async () => {
    setPublishing(true);
    const { data, error } = await unpublishIssue(issueId);
    if (!error && data) { setIssue(data); setFormData(data); }
    setPublishing(false);
  };

  const handleArchive = async () => {
    setArchiving(true);
    const { data, error } = await archiveIssue(issueId);
    if (!error && data) { setIssue(data); setFormData(data); }
    setArchiving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteIssue(issueId);
    if (!error) onDelete(issueId);
    setDeleting(false);
  };

  const handleReprocess = async () => {
    if (!issue) return;
    setReprocessing(true);
    const { data: bumped } = await bumpRenderVersion(issueId, issue.render_version || 1);
    if (bumped) {
      setIssue(bumped); setFormData(bumped);
      await deleteAllPages(issueId);
      if (issue.pdf_url) {
        const { processPdf } = await import('../services/pdfProcessorService');
        await processPdf({ issueId, renderVersion: bumped.render_version, file: null });
      }
    }
    setReprocessing(false);
  };

  if (!issue) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: NU, fontSize: 12 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Issue top bar ── */}
      <div style={{ height: 52, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
        {/* Cover mini */}
        <div style={{ width: 28, height: 36, borderRadius: 2, overflow: 'hidden', background: '#1a1612', flexShrink: 0, border: `1px solid ${BORDER}` }}>
          {issue.cover_image && <img src={issue.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GD, fontSize: 16, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {issue.title || 'Untitled Issue'}
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
            {[issue.issue_number && `Issue ${issue.issue_number}`, issue.season, issue.year].filter(Boolean).join(' · ')}
          </div>
        </div>

        <StatusPill status={issue.status} />
        {saveMsg && (
          <span style={{ fontFamily: NU, fontSize: 10, color: saveMsg === 'Saved' ? '#34d399' : '#f87171' }}>
            {saveMsg === 'Saved' ? '✓ Saved' : '✕ Failed'}
          </span>
        )}

        {/* Read / View buttons */}
        {issue.slug && (
          <button
            onClick={() => onReadIssue?.(issue.slug)}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#0A0908',
              background: GOLD, border: 'none',
              padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
            }}
          >
            ▶ Read
          </button>
        )}
        {issue.status === 'published' && (
          <a href={`/publications/${issue.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none', border: `1px solid rgba(201,168,76,0.3)`, padding: '4px 10px', borderRadius: 2 }}>
            View ↗
          </a>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ height: 40, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 2 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 3, cursor: 'pointer',
              background: tab === t.key ? 'rgba(201,168,76,0.1)' : 'none',
              border: `1px solid ${tab === t.key ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
              color: tab === t.key ? GOLD : MUTED,
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {tab === 'design' && (
          <PageDesigner issue={issue} onIssueUpdate={handleIssueUpdate} />
        )}

        {tab === 'overview' && (
          <OverviewTab
            data={formData}
            onChange={change}
            slugLocked={issue.slug_locked}
            saving={saving}
            onSave={handleSave}
            coverUrl={formData.cover_image}
            onCoverUpload={handleCoverUpload}
            coverUploading={coverUp}
            backCoverUrl={formData.back_cover_image}
            onBackCoverUpload={handleBackCoverUpload}
            backCoverUploading={backCoverUploading}
            altCoverUrl={formData.alt_cover_image}
            onAltCoverUpload={handleAltCoverUpload}
            altCoverUploading={altCoverUploading}
            persona={persona}
            onPersonaChange={setPersona}
          />
        )}

        {tab === 'pages' && (
          <div style={{ padding: '20px 32px' }}>

            {/* ── Add page from template ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={() => setTemplatePickerOpen(true)}
                style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.35)',
                  color: GOLD, padding: '8px 18px', borderRadius: 3, cursor: 'pointer',
                }}
              >
                ✦ Add Page from Template
              </button>
            </div>

            <PageGrid
              issueId={issueId}
              issue={issue}
              onPageCountChange={count => {
                setIssue(prev => ({ ...prev, page_count: count }));
                setFormData(prev => ({ ...prev, page_count: count }));
                // Refresh pages list after count change
                fetchPages(issueId).then(({ data }) => { if (data) setPages(data); });
              }}
            />

            {/* Hotspot quick-access list */}
            {pages.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Page Hotspots & Credits
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pages.map(pg => (
                    <div key={pg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: MUTED, minWidth: 32 }}>p{pg.page_number}</span>
                      {pg.link_targets?.length > 0 && <span style={{ fontFamily: NU, fontSize: 9, color: GOLD }}>✦ {pg.link_targets.length} hotspot{pg.link_targets.length > 1 ? 's' : ''}</span>}
                      {pg.vendor_credits?.length > 0 && <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>◈ {pg.vendor_credits.length} credit{pg.vendor_credits.length > 1 ? 's' : ''}</span>}
                      {commentCounts[pg.page_number] > 0 && (
                        <span style={{ fontFamily: NU, fontSize: 9, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '2px 7px' }}>
                          ✎ {commentCounts[pg.page_number]}
                        </span>
                      )}
                      <button onClick={() => setCommentsPage(pg.page_number)} style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, background: 'none', border: `1px solid rgba(255,255,255,0.12)`, padding: '5px 10px', borderRadius: 2, cursor: 'pointer' }}>
                        Notes
                      </button>
                      <button onClick={() => setHotspotPage(pg)} style={{ marginLeft: 'auto', fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, background: 'none', border: `1px solid rgba(201,168,76,0.3)`, padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}>
                        ✦ Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PageCommentsPanel overlay */}
        {commentsPage !== null && (
          <PageCommentsPanel
            issue={issue}
            currentPageNumber={commentsPage}
            onClose={() => setCommentsPage(null)}
          />
        )}

        {/* HotspotEditor overlay */}
        {hotspotPage && (
          <HotspotEditor
            page={hotspotPage}
            onSave={(updatedPage) => {
              setPages(ps => ps.map(p => p.id === updatedPage.id ? updatedPage : p));
              setHotspotPage(null);
            }}
            onClose={() => setHotspotPage(null)}
          />
        )}

        {/* TemplatePicker overlay */}
        {templatePickerOpen && !activeTemplate && (
          <TemplatePicker
            onSelect={(tpl) => { setActiveTemplate(tpl); setTemplatePickerOpen(false); }}
            onClose={() => setTemplatePickerOpen(false)}
          />
        )}

        {/* TemplateEditor overlay */}
        {activeTemplate && (
          <TemplateEditor
            template={activeTemplate}
            issueData={issue}
            persona={persona}
            onAdd={(newPage) => {
              setPages(prev => [...prev, newPage].sort((a, b) => a.page_number - b.page_number));
              setActiveTemplate(null);
            }}
            onClose={() => { setActiveTemplate(null); setTemplatePickerOpen(true); }}
          />
        )}

        {tab === 'pdf' && (
          <div style={{ padding: '28px 32px', maxWidth: 600 }}>
            <SectionHead>PDF Import</SectionHead>
            <PdfUploader
              issueId={issueId}
              issue={issue}
              onProcessingStart={() => {}}
              onProcessingComplete={(pageCount) => {
                setIssue(prev => ({ ...prev, processing_state: 'ready', page_count: pageCount }));
                setFormData(prev => ({ ...prev, processing_state: 'ready', page_count: pageCount }));
              }}
              onError={() => {}}
            />
            {issue.pdf_url && (
              <>
                <Hr />
                <SectionHead>Reprocess</SectionHead>
                <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
                  Re-render all pages from the stored PDF. This bumps the render version and deletes existing pages.
                </div>
                <Btn onClick={handleReprocess} disabled={reprocessing}>
                  {reprocessing ? '⟳ Reprocessing…' : '↻ Reprocess PDF'}
                </Btn>
              </>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <>
            <AnalyticsTab issueId={issueId} issue={issue} />
            <div style={{ padding: '0 0 8px', borderTop: `1px solid ${BORDER}` }} />
            <HeatmapPanel issue={issue} pages={pages} />
          </>
        )}

        {tab === 'monetize' && (
          <MonetizationTab issue={issue} onIssueUpdate={handleIssueUpdate} />
        )}

        {tab === 'distribution' && (
          <DistributionTab issue={issue} />
        )}

        {tab === 'settings' && (
          <SettingsTab
            issue={issue}
            pages={pages}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onSchedule={handleSchedule}
            onPageFormat={handlePageFormat}
            publishing={publishing}
            archiving={archiving}
            deleting={deleting}
            renderHistory={renderHistory}
          />
        )}
      </div>
    </div>
  );
}

// ── Create issue modal ─────────────────────────────────────────────────────────

function CreateModal({ onCreated, onClose }) {
  const [title, setTitle]   = useState('');
  const [num,   setNum]     = useState('');
  const [year,  setYear]    = useState(CURR_YEAR);
  const [busy,  setBusy]    = useState(false);
  const [err,   setErr]     = useState('');

  const handleCreate = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr('');
    const { data, error } = await createIssue({ title: title.trim(), issue_number: num ? parseInt(num) : null, year });
    if (error) { setErr(error.message); setBusy(false); return; }
    onCreated(data);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 400, background: SURF, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 28 }}>
        <div style={{ fontFamily: GD, fontSize: 22, color: '#fff', marginBottom: 20 }}>New Issue</div>

        <Field label="Title" hint="required">
          <input autoFocus spellCheck value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. The Spring Edition" style={INPUT} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Issue No.">
            <input type="number" spellCheck={false} value={num} onChange={e => setNum(e.target.value)}
              placeholder="01" style={INPUT} />
          </Field>
          <Field label="Year">
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              style={{ ...INPUT, cursor: 'pointer' }}>
              {YEAR_OPTS.map(y => <option key={y} value={y} style={{ background: '#1a1a18' }}>{y}</option>)}
            </select>
          </Field>
        </div>

        {err && <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn gold onClick={handleCreate} disabled={busy}>{busy ? 'Creating…' : 'Create Issue'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Main Publication Studio ───────────────────────────────────────────────────

export default function PublicationStudio({ onBack, onReadIssue }) {
  const [issues,          setIssues]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeId,        setActiveId]        = useState(null);
  const [showCreate,      setShowCreate]      = useState(false);
  const [filter,          setFilter]          = useState('all'); // all | draft | published | archived
  const [showCalendar,    setShowCalendar]    = useState(false);
  const [showBrandKit,    setShowBrandKit]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchIssues();
    setIssues(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);

  const handleCreated = (issue) => {
    setIssues(prev => [issue, ...prev]);
    setActiveId(issue.id);
    setShowCreate(false);
  };

  const handleDeleted = (id) => {
    setIssues(prev => prev.filter(i => i.id !== id));
    setActiveId(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: BG, display: 'flex', flexDirection: 'column', fontFamily: NU }}>

      {/* ── Top bar ── */}
      <div style={{ height: 52, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, background: SURF }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>
          ←
        </button>
        <div style={{ fontFamily: GD, fontSize: 18, fontWeight: 400, fontStyle: 'italic', color: '#fff' }}>
          Publication Studio
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD }}>
          ✦ LWD
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowBrandKit(true)}
          style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 3, color: MUTED, padding: '7px 14px', cursor: 'pointer' }}>
          ✦ Brand Kit
        </button>
        <button onClick={() => setShowCalendar(true)}
          style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 3, color: MUTED, padding: '7px 14px', cursor: 'pointer' }}>
          📅 Calendar
        </button>
        <button onClick={() => setShowCreate(true)}
          style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: GOLD, border: 'none', borderRadius: 3, color: '#1a1806', padding: '7px 16px', cursor: 'pointer' }}>
          + New Issue
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${BORDER}`, background: SIDE, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filter pills */}
          <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'published', 'draft', 'archived'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '3px 8px', borderRadius: 10, cursor: 'pointer',
                  background: filter === f ? `${GOLD}18` : 'none',
                  border: `1px solid ${filter === f ? GOLD : BORDER}`,
                  color: filter === f ? GOLD : MUTED,
                  transition: 'all 0.15s',
                }}
              >{f}</button>
            ))}
          </div>

          {/* Issue list */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '24px 16px', fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center' }}>Loading…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: '24px 16px', fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center' }}>
                {filter === 'all' ? 'No issues yet.' : `No ${filter} issues.`}
              </div>
            )}
            {filtered.map(issue => {
              const active = activeId === issue.id;
              const sc = STATUS_CFG[issue.status] || STATUS_CFG.draft;
              return (
                <div key={issue.id} onClick={() => setActiveId(issue.id)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', transition: 'background 0.12s',
                    background: active ? 'rgba(201,168,76,0.07)' : 'transparent',
                    borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Cover thumb */}
                    <div style={{ width: 28, height: 36, borderRadius: 2, overflow: 'hidden', background: '#1a1612', flexShrink: 0, border: `1px solid ${BORDER}` }}>
                      {issue.cover_image
                        ? <img src={issue.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>◈</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {issue.title || 'Untitled'}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
                        {[issue.issue_number && `#${issue.issue_number}`, issue.season, issue.year].filter(Boolean).join(' · ')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: NU, fontSize: 9, color: sc.color }}>{sc.label}</span>
                        {issue.page_count > 0 && (
                          <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>· {issue.page_count}pp</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''} total
          </div>
        </div>

        {/* ── Main content ── */}
        {activeId ? (
          <IssueWorkspace
            key={activeId}
            issueId={activeId}
            onDelete={handleDeleted}
            onReadIssue={onReadIssue}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ fontSize: 48, opacity: 0.1 }}>◈</div>
            <div style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
              Select an issue to edit
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: MUTED }}>or</div>
            <button onClick={() => setShowCreate(true)}
              style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: `${GOLD}14`, border: `1px solid ${GOLD}`, color: GOLD, padding: '9px 24px', borderRadius: 3, cursor: 'pointer' }}>
              + Create First Issue
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {showCalendar && (
        <EditorialCalendarPanel
          onSelectIssue={(issueId) => {
            setShowCalendar(false);
            if (issueId) {
              setActiveId(issueId);
            } else {
              setShowCreate(true);
            }
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showBrandKit && (
        <BrandKitPanel onClose={() => setShowBrandKit(false)} />
      )}
    </div>
  );
}
