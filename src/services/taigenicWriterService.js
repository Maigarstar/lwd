/**
 * Taigenic Writer Service
 * Handles AI-powered article generation with editorial voice, NLP weaving, and block structuring.
 */

export const LOADING_MESSAGES = [
  'Taigenic is writing…',
  'Weaving NLP signals…',
  'Crafting editorial voice…',
  'Placing imagery…',
  'Polishing prose…',
];

// Word count targets by category
export const WORD_TARGETS = {
  'destinations': 800,
  'style': 700,
  'planning': 750,
  'wellness': 650,
  'real-weddings': 850,
  'inspiration': 700,
  'vendor-insights': 600,
  'trends': 650,
  'default': 700,
};

// Image placement targets
export const IMAGE_TARGETS = {
  'destinations': 4,
  'real-weddings': 5,
  'inspiration': 3,
  'default': 2,
};

/**
 * Generate full article with blocks, word count, and NLP terms
 */
export async function generateArticleBody({ brief, title, category, tone, focusKeyword, wordTarget, imageTarget }) {
  const catLabel = category?.toLowerCase() || 'default';
  const wTarget = wordTarget || WORD_TARGETS[catLabel] || WORD_TARGETS.default;
  const iTarget = imageTarget || IMAGE_TARGETS[catLabel] || IMAGE_TARGETS.default;

  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'full-article',
        brief: brief || title,
        title,
        category: catLabel,
        tone,
        focusKeyword,
        wordTarget: wTarget,
        imageTarget: iTarget,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `AI generation failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse blocks from AI response
    const blocks = parseBlocks(data.content || '');
    const wordCount = countBlockWords(blocks);
    const nlpTermsUsed = detectUsedNlpTerms(data.content || '', focusKeyword);

    return {
      blocks,
      wordCount,
      nlpTermsUsed,
      model: data.model || 'anthropic-claude-3',
    };
  } catch (err) {
    throw new Error(err.message || 'Failed to generate article');
  }
}

/**
 * Generate outline only (headings structure)
 */
export async function generateOutline({ brief, title, category }) {
  const catLabel = category?.toLowerCase() || 'default';

  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'outline-only',
        brief: brief || title,
        title,
        category: catLabel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Outline generation failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse headings into block structure
    const headings = (data.headings || []).map(h => ({
      id: crypto.randomUUID(),
      type: 'heading',
      level: h.level || 2,
      text: h.text || h,
    }));

    return headings;
  } catch (err) {
    throw new Error(err.message || 'Failed to generate outline');
  }
}

/**
 * Parse AI-generated content into typed blocks
 * Expects structured JSON or markdown-like content
 */
export function parseBlocks(content) {
  if (!content) return [];

  const blocks = [];

  // If it's a JSON array, parse directly
  if (content.startsWith('[')) {
    try {
      const arr = JSON.parse(content);
      return Array.isArray(arr) ? arr.map(b => ({
        ...b,
        id: b.id || crypto.randomUUID(),
      })) : [];
    } catch (e) {
      // Fall through to markdown parsing
    }
  }

  // Markdown-like parsing as fallback
  const lines = content.split('\n').filter(l => l.trim());
  let currentBlock = null;

  for (const line of lines) {
    // Detect heading (##, ###, etc.)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock?.type !== 'heading') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: crypto.randomUUID(),
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
        };
      }
      continue;
    }

    // Detect quote (starts with >)
    if (line.startsWith('>')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: crypto.randomUUID(),
        type: 'quote',
        text: line.replace(/^>\s*/, '').trim(),
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      if (currentBlock?.type !== 'paragraph') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: crypto.randomUUID(),
          type: 'paragraph',
          text: line.trim(),
        };
      } else {
        currentBlock.text += '\n' + line.trim();
      }
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

/**
 * Count total words across all blocks
 */
export function countBlockWords(blocks = []) {
  if (!Array.isArray(blocks)) return 0;
  return blocks.reduce((sum, block) => {
    if (block.text) {
      const words = block.text.split(/\s+/).filter(w => w).length;
      return sum + words;
    }
    return sum;
  }, 0);
}

/**
 * Detect which NLP terms were used in the generated content
 */
export function detectUsedNlpTerms(content, focusKeyword) {
  if (!content || !focusKeyword) return [];

  const terms = [];
  const keywords = Array.isArray(focusKeyword) ? focusKeyword : [focusKeyword];

  for (const kw of keywords) {
    if (!kw) continue;
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    if (regex.test(content)) {
      terms.push(kw);
    }
  }

  return terms;
}
