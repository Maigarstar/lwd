// ═══════════════════════════════════════════════════════════════════════════
// AiDraftPreview.jsx — Per-section AI draft review
// Replaces the canvas when an AI draft is ready.
// Each block: accept / reject / regenerate individually.
// Score the draft before merging. Side-by-side writing companion.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { FU, FD, computeWordCount } from './StudioShared';
import { computeContentIntelligence } from './ContentIntelligence';

const GOLD = '#c9a96e';

// Block type display labels
const BLOCK_LABEL = {
  intro:      'Introduction',
  heading:    'Heading',
  subheading: 'Subheading',
  paragraph:  'Paragraph',
  quote:      'Pull Quote',
  image:      'Image Placement',
  image_hint: 'Image Suggestion',
  gallery:    'Gallery',
  callout:    'Callout',
  divider:    'Divider',
  video:      'Video',
  body_wysiwyg: 'Body',
  faq:        'FAQ',
};

// Block type icons
const BLOCK_ICON = {
  intro:      '¶',
  heading:    'H2',
  subheading: 'H3',
  paragraph:  '¶',
  quote:      '"',
  image:      '▣',
  image_hint: '▣',
  callout:    '◈',
  divider:    '—',
  body_wysiwyg: '¶',
  faq:        '?',
};

// ── Section grouping: consecutive paragraphs under a heading form a section ──
function groupBlocksIntoSections(blocks) {
  const sections = [];
  let current = null;

  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'subheading' || block.type === 'intro') {
      if (current) sections.push(current);
      current = { heading: block, blocks: [block], id: block.id };
    } else {
      if (!current) {
        current = { heading: null, blocks: [], id: block.id };
      }
      current.blocks.push(block);
    }
  }
  if (current) sections.push(current);
  return sections;
}

export default function AiDraftPreview({
  draft,           // { blocks, wordCount, nlpTermsUsed, model }
  formData,        // current article formData (for score comparison)
  focusKeyword,
  tone,
  onAcceptAll,     // (blocks) => void — merge all into article
  onAcceptBlocks,  // (selectedBlocks) => void — merge selected
  onRegenerate,    // (sectionId, brief) => void — regenerate one section
  onRegenerateAll, // () => void — regenerate entire draft
  onDiscard,       // () => void — throw away draft
  isLight,
  S,
}) {
  // Per-block status: 'pending' | 'accepted' | 'rejected'
  const [blockStatus, setBlockStatus] = useState(() => {
    const m = {};
    (draft?.blocks || []).forEach(b => { m[b.id] = 'pending'; });
    return m;
  });
  const [regeneratingSection, setRegeneratingSection] = useState(null);

  const blocks = draft?.blocks || [];
  const sections = useMemo(() => groupBlocksIntoSections(blocks), [blocks]);

  // Score the draft as if it were the article content
  const draftIntel = useMemo(
    () => computeContentIntelligence({ ...formData, content: blocks }, focusKeyword),
    [formData, blocks, focusKeyword]
  );
  const currentIntel = useMemo(
    () => computeContentIntelligence(formData, focusKeyword),
    [formData, focusKeyword]
  );

  const acceptedBlocks = blocks.filter(b => blockStatus[b.id] !== 'rejected');
  const acceptedCount  = blocks.filter(b => blockStatus[b.id] === 'accepted').length;
  const rejectedCount  = blocks.filter(b => blockStatus[b.id] === 'rejected').length;
  const pendingCount   = blocks.filter(b => blockStatus[b.id] === 'pending').length;

  const toggleBlock = (id) => {
    setBlockStatus(prev => ({
      ...prev,
      [id]: prev[id] === 'accepted' ? 'rejected' : prev[id] === 'rejected' ? 'pending' : 'accepted',
    }));
  };

  const acceptSection = (section) => {
    setBlockStatus(prev => {
      const next = { ...prev };
      section.blocks.forEach(b => { next[b.id] = 'accepted'; });
      return next;
    });
  };

  const rejectSection = (section) => {
    setBlockStatus(prev => {
      const next = { ...prev };
      section.blocks.forEach(b => { next[b.id] = 'rejected'; });
      return next;
    });
  };

  const acceptAllPending = () => {
    setBlockStatus(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[k] === 'pending') next[k] = 'accepted'; });
      return next;
    });
  };

  const handleMerge = () => {
    const selected = blocks.filter(b => blockStatus[b.id] !== 'rejected')
      .map(b => ({ ...b, id: crypto.randomUUID() }));
    onAcceptBlocks(selected);
  };

  // Colours
  const bg      = '#0f0e0c';
  const surface = '#161513';
  const bdr     = 'rgba(201,169,110,0.1)';
  const text    = '#f5f0e8';
  const muted   = 'rgba(245,240,232,0.45)';
  const faint   = 'rgba(245,240,232,0.2)';

  const statusStyle = (status) => ({
    accepted: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', accent: '#10b981' },
    rejected: { bg: 'rgba(239,68,68,0.04)',   border: 'rgba(239,68,68,0.15)',  accent: '#ef4444' },
    pending:  { bg: surface,                   border: bdr,                     accent: muted },
  }[status]);

  const scoreColor = (s) => s >= 85 ? '#10b981' : s >= 70 ? GOLD : s >= 55 ? '#f59e0b' : '#ef4444';
  const scoreDiff = draftIntel.score - currentIntel.score;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: bg, overflow: 'hidden', minWidth: 0,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: surface, borderBottom: `1px solid ${bdr}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>✦ Taigenic Draft</span>
          <span style={{ fontFamily: FU, fontSize: 9, color: muted }}>
            {blocks.length} blocks · {draft?.wordCount || 0} words
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Score comparison */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: FU, fontSize: 8, color: faint }}>Score:</span>
            <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 600, color: scoreColor(draftIntel.score) }}>{draftIntel.score}</span>
            {currentIntel.wordCount > 0 && (
              <span style={{
                fontFamily: FU, fontSize: 8, fontWeight: 600,
                color: scoreDiff > 0 ? '#10b981' : scoreDiff < 0 ? '#ef4444' : muted,
              }}>
                {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff < 0 ? `${scoreDiff}` : '±0'} vs current
              </span>
            )}
          </div>
          {/* Counters */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {acceptedCount > 0 && <span style={{ fontFamily: FU, fontSize: 8, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 8 }}>✓ {acceptedCount}</span>}
            {rejectedCount > 0 && <span style={{ fontFamily: FU, fontSize: 8, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 6px', borderRadius: 8 }}>✗ {rejectedCount}</span>}
            {pendingCount > 0 && <span style={{ fontFamily: FU, fontSize: 8, color: muted, background: 'rgba(245,240,232,0.04)', padding: '2px 6px', borderRadius: 8 }}>◎ {pendingCount}</span>}
          </div>
        </div>
      </div>

      {/* ── Blocks ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}>
        {sections.map((section, si) => {
          const sectionStatus = section.blocks.every(b => blockStatus[b.id] === 'accepted') ? 'accepted'
            : section.blocks.every(b => blockStatus[b.id] === 'rejected') ? 'rejected' : 'pending';
          const ss = statusStyle(sectionStatus);

          return (
            <div key={section.id} style={{
              marginBottom: 12,
              background: ss.bg,
              border: `1px solid ${ss.border}`,
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}>
              {/* Section header with controls */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: `1px solid ${ss.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: FU, fontSize: 8, color: ss.accent, fontWeight: 700 }}>
                    {section.heading
                      ? `${BLOCK_ICON[section.heading.type] || '§'} ${section.heading.text?.replace(/<[^>]*>/g, '').slice(0, 50) || 'Section'}`
                      : `Section ${si + 1}`
                    }
                  </span>
                  <span style={{ fontFamily: FU, fontSize: 7, color: faint }}>
                    {section.blocks.length} block{section.blocks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => acceptSection(section)}
                    title="Accept section"
                    style={{ background: 'none', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 2, padding: '3px 7px', cursor: 'pointer', fontFamily: FU, fontSize: 7, fontWeight: 600, color: '#10b981', letterSpacing: '0.06em' }}>
                    ✓ Accept
                  </button>
                  <button onClick={() => {
                    if (onRegenerate && section.heading) {
                      setRegeneratingSection(section.id);
                      onRegenerate(section.id, section.heading?.text || '');
                    }
                  }}
                    title="Regenerate this section"
                    style={{ background: 'none', border: `1px solid ${GOLD}30`, borderRadius: 2, padding: '3px 7px', cursor: 'pointer', fontFamily: FU, fontSize: 7, fontWeight: 600, color: GOLD, letterSpacing: '0.06em' }}>
                    {regeneratingSection === section.id ? '…' : '↻'}
                  </button>
                  <button onClick={() => rejectSection(section)}
                    title="Reject section"
                    style={{ background: 'none', border: `1px solid rgba(239,68,68,0.15)`, borderRadius: 2, padding: '3px 7px', cursor: 'pointer', fontFamily: FU, fontSize: 7, fontWeight: 600, color: '#ef4444', letterSpacing: '0.06em' }}>
                    ✗
                  </button>
                </div>
              </div>

              {/* Individual blocks */}
              {section.blocks.map(block => {
                const bs = blockStatus[block.id];
                const bStyle = statusStyle(bs);
                const blockText = (block.text || block.body || block.tip || '').replace(/<[^>]*>/g, '');

                return (
                  <div key={block.id}
                    onClick={() => toggleBlock(block.id)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${bStyle.border}`,
                      cursor: 'pointer',
                      opacity: bs === 'rejected' ? 0.35 : 1,
                      textDecoration: bs === 'rejected' ? 'line-through' : 'none',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {/* Status indicator */}
                      <span style={{
                        fontSize: 8, color: bStyle.accent, flexShrink: 0, marginTop: 2,
                        fontWeight: 700,
                      }}>
                        {bs === 'accepted' ? '✓' : bs === 'rejected' ? '✗' : '○'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Block type label */}
                        <span style={{ fontFamily: FU, fontSize: 7, color: faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {BLOCK_LABEL[block.type] || block.type}
                        </span>
                        {/* Block content preview */}
                        {blockText && (
                          <div style={{
                            fontFamily: block.type === 'heading' || block.type === 'subheading' ? FD : FU,
                            fontSize: block.type === 'heading' ? 14 : block.type === 'subheading' ? 12 : block.type === 'intro' ? 11 : 10,
                            fontWeight: block.type === 'heading' || block.type === 'subheading' ? 500 : 400,
                            fontStyle: block.type === 'quote' ? 'italic' : 'normal',
                            color: block.type === 'heading' ? text : block.type === 'quote' ? GOLD : muted,
                            lineHeight: 1.5,
                            marginTop: 3,
                            display: '-webkit-box',
                            WebkitLineClamp: block.type === 'paragraph' || block.type === 'intro' ? 4 : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {blockText}
                          </div>
                        )}
                        {block.type === 'faq' && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, color: text, lineHeight: 1.4 }}>
                              Q: {block.question}
                            </div>
                            <div style={{ fontFamily: FU, fontSize: 9, color: muted, lineHeight: 1.5, marginTop: 3 }}>
                              A: {block.answer}
                            </div>
                          </div>
                        )}
                        {block.type === 'image' || block.type === 'image_hint' ? (
                          <div style={{ fontFamily: FU, fontSize: 9, color: GOLD, marginTop: 3, fontStyle: 'italic' }}>
                            {block.alt || block.caption || 'Image placement'}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Bottom action bar (fixed) ── */}
      <div style={{
        position: 'sticky', bottom: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px',
        background: surface, borderTop: `1px solid ${bdr}`,
        flexShrink: 0,
      }}>
        {pendingCount > 0 && (
          <button onClick={acceptAllPending}
            style={{ padding: '8px 14px', background: 'none', border: `1px solid ${GOLD}40`, borderRadius: 2, cursor: 'pointer', fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD }}>
            Accept All
          </button>
        )}
        <button onClick={handleMerge}
          style={{
            flex: 1, padding: '9px 14px',
            background: `linear-gradient(135deg, ${GOLD}, #b8922f)`,
            border: 'none', borderRadius: 2, cursor: 'pointer',
            fontFamily: FU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#1a1208',
          }}>
          ✦ Merge {acceptedBlocks.length} Block{acceptedBlocks.length !== 1 ? 's' : ''} into Article
        </button>
        <button onClick={onRegenerateAll}
          style={{ padding: '8px 10px', background: 'none', border: `1px solid ${bdr}`, borderRadius: 2, cursor: 'pointer', fontFamily: FU, fontSize: 8, fontWeight: 600, color: muted }}>
          ↻
        </button>
        <button onClick={onDiscard}
          style={{ padding: '8px 10px', background: 'none', border: `1px solid rgba(239,68,68,0.15)`, borderRadius: 2, cursor: 'pointer', fontFamily: FU, fontSize: 8, fontWeight: 600, color: '#ef4444' }}>
          ✗
        </button>
      </div>
    </div>
  );
}
