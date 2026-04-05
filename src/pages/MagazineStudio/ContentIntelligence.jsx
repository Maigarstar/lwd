import React, { useMemo } from 'react';

const GOLD = '#c9a96e';

/**
 * Compute content intelligence score (0-100)
 * Factors: word count, structure, keyword placement, readability, uniqueness
 */
export function computeContentIntelligence(post, focusKeyword) {
  if (!post) return { score: 0, grade: 'F', gradeColor: '#ef4444', issues: [] };

  let score = 50; // Base score
  const issues = [];
  const content = (post.content || []).map(b => b.text || '').join('\n').toLowerCase();
  const title = (post.title || '').toLowerCase();

  // Word count (ideal: 600-1200)
  const wordCount = content.split(/\s+/).filter(w => w).length;
  if (wordCount < 300) { issues.push('Too short'); score -= 15; }
  else if (wordCount > 2000) { issues.push('Too long'); score -= 10; }
  else if (wordCount >= 600 && wordCount <= 1200) { score += 15; }

  // Structure (heading count ideal: 2-4)
  const headingCount = (post.content || []).filter(b => b.type === 'heading').length;
  if (headingCount === 0) { issues.push('Add section headings'); score -= 10; }
  else if (headingCount >= 2 && headingCount <= 4) { score += 10; }

  // Has intro/body/conclusion
  const hasIntro = (post.content || []).some(b => b.type === 'intro');
  const hasParagraphs = (post.content || []).some(b => b.type === 'paragraph');
  if (!hasParagraphs) { issues.push('Add body paragraphs'); score -= 10; }
  if (!hasIntro) { issues.push('Add an intro'); score -= 5; }

  // Keyword placement (in title + content)
  if (focusKeyword) {
    const kwLower = focusKeyword.toLowerCase();
    const inTitle = title.includes(kwLower);
    const inContent = content.includes(kwLower);
    const keywordCount = (content.match(new RegExp(kwLower, 'g')) || []).length;

    if (!inTitle && !inContent) {
      issues.push('Use focus keyword');
      score -= 12;
    } else if (inTitle && inContent && keywordCount >= 2) {
      score += 12;
    } else if ((inTitle || inContent) && keywordCount >= 1) {
      score += 6;
    }
  }

  // Uniqueness (check for minimum content length — can be expanded with plagiarism check)
  if (wordCount > 150) { score += 5; }

  // Images
  const imageCount = (post.content || []).filter(b => b.type === 'image' || b.type === 'image_hint').length;
  if (imageCount === 0) { issues.push('Add images'); score -= 5; }
  else if (imageCount >= 2) { score += 5; }

  // Meta & excerpts
  if (!post.metaDescription || post.metaDescription.length < 50) {
    issues.push('Improve meta description');
    score -= 5;
  }
  if (!post.excerpt) {
    issues.push('Add excerpt');
    score -= 3;
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  // Grade mapping
  let grade = 'F';
  let gradeColor = '#ef4444';
  if (score >= 90) { grade = 'A'; gradeColor = '#22c55e'; }
  else if (score >= 80) { grade = 'B'; gradeColor = '#84cc16'; }
  else if (score >= 70) { grade = 'C'; gradeColor = '#eab308'; }
  else if (score >= 60) { grade = 'D'; gradeColor = '#f97316'; }
  else if (score >= 50) { grade = 'E'; gradeColor = '#fb923c'; }

  return {
    score: Math.round(score),
    grade,
    gradeColor,
    wordCount,
    headingCount,
    imageCount,
    issues: issues.slice(0, 2), // Top 2 issues
  };
}

/**
 * ContentScoreBadge component
 */
export const ContentScoreBadge = ({ score = 0, grade = 'F' }) => {
  const gradeColor = (() => {
    if (grade === 'A') return '#22c55e';
    if (grade === 'B') return '#84cc16';
    if (grade === 'C') return '#eab308';
    if (grade === 'D') return '#f97316';
    if (grade === 'E') return '#fb923c';
    return '#ef4444'; // F
  })();

  return (
    <div style={{
      padding: '8px 12px',
      background: `${gradeColor}15`,
      border: `1px solid ${gradeColor}40`,
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: '"Crimson Text", serif',
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: gradeColor }}>{score}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: gradeColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {grade}
      </span>
    </div>
  );
};

/**
 * ContentIntelligencePanel component
 * Full analysis panel for the Document sidebar
 */
export const ContentIntelligencePanel = ({ post, focusKeyword, onOpenFull }) => {
  const intel = useMemo(() => computeContentIntelligence(post, focusKeyword), [post, focusKeyword]);

  const S = {
    text: '#f5f0e8',
    muted: 'rgba(245,240,232,0.45)',
    faint: 'rgba(245,240,232,0.2)',
    border: 'rgba(245,240,232,0.07)',
    inputBg: 'rgba(245,240,232,0.04)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Score badge */}
      <ContentScoreBadge score={intel.score} grade={intel.grade} />

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '8px', background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{intel.wordCount}</div>
          <div style={{ fontSize: 8, color: S.faint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Words</div>
        </div>
        <div style={{ padding: '8px', background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{intel.headingCount}</div>
          <div style={{ fontSize: 8, color: S.faint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sections</div>
        </div>
        <div style={{ padding: '8px', background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{intel.imageCount}</div>
          <div style={{ fontSize: 8, color: S.faint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Images</div>
        </div>
        <div style={{ padding: '8px', background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{Math.ceil(intel.wordCount / 200)}</div>
          <div style={{ fontSize: 8, color: S.faint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Min Read</div>
        </div>
      </div>

      {/* Issues */}
      {intel.issues.length > 0 && (
        <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Improve:</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: '#ef4444', lineHeight: 1.5 }}>
            {intel.issues.map(issue => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}

      {/* CTA */}
      {onOpenFull && (
        <button onClick={onOpenFull} style={{
          padding: '6px 8px',
          background: 'none',
          border: `1px solid ${S.border}`,
          color: S.muted,
          fontFamily: '"Crimson Text", serif',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRadius: 2,
          cursor: 'pointer',
        }}>
          Full Analysis →
        </button>
      )}
    </div>
  );
};
