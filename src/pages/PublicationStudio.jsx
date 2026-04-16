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
} from '../services/magazineIssuesService';
import { deleteAllPages, fetchPages } from '../services/magazinePageService';
import { processPdf }                 from '../services/pdfProcessorService';
import { supabase }                   from '../lib/supabaseClient';

// ── Re-used admin components ──────────────────────────────────────────────────
import PageGrid       from './AdminModules/components/PageGrid';
import PdfUploader    from './AdminModules/components/PdfUploader';

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

// PolishField wraps a textarea with native spellCheck + an AI polish button
function PolishField({ label, hint, value, onChange, rows = 4, charLimit }) {
  const [polishing,   setPolishing]   = useState(false);
  const [suggestion,  setSuggestion]  = useState(null);
  const [polishErr,   setPolishErr]   = useState('');

  const handlePolish = async () => {
    const text = (value || '').trim();
    if (!text) return;
    setPolishing(true); setPolishErr(''); setSuggestion(null);
    try {
      const { callAiGenerate } = await import('../lib/aiGenerate');
      const data = await callAiGenerate({
        feature:      'publication_polish',
        systemPrompt: POLISH_SYS,
        userPrompt:   text,
      });
      if (data?.text?.trim()) setSuggestion(data.text.trim());
      else setPolishErr('No suggestion returned.');
    } catch (e) {
      setPolishErr(e.message || 'AI unavailable');
    }
    setPolishing(false);
  };

  const len = (value || '').length;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <Lbl hint={hint}>{label}</Lbl>
        <PolishButton onClick={handlePolish} loading={polishing} disabled={!value?.trim()} />
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
      {polishErr && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>{polishErr}</div>}
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

function OverviewTab({ data, onChange, slugLocked, saving, onSave, coverUrl, onCoverUpload, coverUploading }) {
  const [slugTouched, setSlugTouched] = useState(false);
  const coverRef = useRef(null);

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
        <SectionHead>Issue Details</SectionHead>

        <Field label="Title" hint="required">
          <input spellCheck value={f.title ?? ''} onChange={e => onChange('title', e.target.value)}
            placeholder="e.g. The Grand Wedding Edition"
            style={INPUT} />
        </Field>

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

        <PolishField
          label="Introduction"
          hint="Shown on the public listing page"
          value={f.intro}
          onChange={v => onChange('intro', v)}
          rows={3}
        />

        <PolishField
          label="Editor's Note"
          hint="Personal note from the editor"
          value={f.editor_note}
          onChange={v => onChange('editor_note', v)}
          rows={5}
        />

        <Hr />
        <SectionHead>SEO</SectionHead>

        <Field label="SEO Title" hint="max 60 chars"
          counter={f.seo_title && <div style={{ fontFamily: NU, fontSize: 10, color: f.seo_title.length > 60 ? '#f87171' : MUTED, marginTop: 3 }}>{f.seo_title.length}/60</div>}>
          <input spellCheck value={f.seo_title ?? ''} onChange={e => onChange('seo_title', e.target.value)}
            placeholder="Leave blank to use issue title" style={INPUT} />
        </Field>

        <PolishField
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

      {/* ── Right: cover + stats ── */}
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

function SettingsTab({ issue, onPublish, onUnpublish, onArchive, onDelete, publishing, archiving, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 560 }}>
      <SectionHead>Publishing</SectionHead>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {issue?.status !== 'published' && (
          <Btn gold onClick={onPublish} disabled={publishing || issue?.processing_state !== 'ready'}>
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

      {issue?.status !== 'published' && issue?.processing_state !== 'ready' && (
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(248,197,105,0.7)', marginBottom: 24, background: 'rgba(248,197,105,0.06)', border: '1px solid rgba(248,197,105,0.15)', borderRadius: 4, padding: '8px 12px' }}>
          ⚠ Upload and process a PDF (or add pages manually) before publishing.
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

// ── Issue editor (main content area) ─────────────────────────────────────────

const TABS = [
  { key: 'overview',   label: 'Overview'   },
  { key: 'pages',      label: 'Pages'      },
  { key: 'pdf',        label: 'PDF'        },
  { key: 'analytics',  label: 'Analytics'  },
  { key: 'settings',   label: 'Settings'   },
];

function IssueWorkspace({ issueId, onDelete }) {
  const [issue,     setIssue]     = useState(null);
  const [formData,  setFormData]  = useState({});
  const [tab,       setTab]       = useState('overview');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [publishing,  setPublishing]  = useState(false);
  const [archiving,   setArchiving]   = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [coverUp,     setCoverUp]     = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  // load issue
  useEffect(() => {
    if (!issueId) return;
    fetchIssueById(issueId).then(({ data }) => {
      if (data) { setIssue(data); setFormData(data); }
    });
  }, [issueId]);

  const change = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handlePublish = async () => {
    setPublishing(true);
    const { data, error } = await publishIssue(issueId);
    if (!error && data) { setIssue(data); setFormData(data); }
    setPublishing(false);
  };

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

        {/* View on site */}
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
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
          />
        )}

        {tab === 'pages' && (
          <div style={{ padding: '20px 32px' }}>
            <PageGrid
              issueId={issueId}
              issue={issue}
              onPageCountChange={count => {
                setIssue(prev => ({ ...prev, page_count: count }));
                setFormData(prev => ({ ...prev, page_count: count }));
              }}
            />
          </div>
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
          <AnalyticsTab issueId={issueId} issue={issue} />
        )}

        {tab === 'settings' && (
          <SettingsTab
            issue={issue}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onArchive={handleArchive}
            onDelete={handleDelete}
            publishing={publishing}
            archiving={archiving}
            deleting={deleting}
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

export default function PublicationStudio({ onBack }) {
  const [issues,      setIssues]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeId,    setActiveId]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [filter,      setFilter]      = useState('all'); // all | draft | published | archived

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
          <div style={{ flex: 1, overflowY: 'auto' }}>
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
    </div>
  );
}
