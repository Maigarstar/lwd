/**
 * seo-studio/scoring.js — Quality scoring, analysis, and audit functions for SEO Studio
 */

import {
  CTA_WORDS, POWER_WORDS, EMOTIONAL_WORDS, STOP_WORDS,
  parseKeywords, getEntityTitle, getEntityDesc, getEntityOgImage,
} from './tokens';

// ══════════════════════════════════════════════════════════════════════════════
// ── QUALITY SCORING ENGINE ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function computeQualityScore(entity, type, allEntities, focusKeyword = '') {
  const title = getEntityTitle(entity, type);
  const desc  = getEntityDesc(entity, type);
  const kw    = type === 'listing' ? parseKeywords(entity.seo_keywords) : [];
  const ogImg = (type !== 'listing') ? getEntityOgImage(entity, type) : null;
  const name  = entity.name || entity.title || '';

  let score = 0;
  const issues = [];
  const passes = [];

  // ── Title scoring (0-35 pts) ───────────────────────────────────────────
  if (!title.trim()) {
    issues.push({ severity: 'critical', field: 'title', msg: 'SEO title is missing', tip: 'Add a compelling title with your primary keyword' });
  } else {
    const tLen = title.length;
    // Length check (0-15 pts)
    if (tLen >= 50 && tLen <= 60) {
      score += 15;
      passes.push('Title length is optimal (50-60 chars)');
    } else if (tLen >= 40 && tLen <= 65) {
      score += 10;
      issues.push({ severity: 'minor', field: 'title', msg: `Title is ${tLen} chars — aim for 50-60`, tip: tLen < 50 ? 'Expand with descriptive keywords' : 'Trim to prevent truncation in search results' });
    } else if (tLen > 0 && tLen < 40) {
      score += 5;
      issues.push({ severity: 'important', field: 'title', msg: `Title is too short (${tLen} chars)`, tip: 'Expand to 50-60 chars with location or category keywords' });
    } else if (tLen > 65) {
      score += 5;
      issues.push({ severity: 'important', field: 'title', msg: `Title too long (${tLen} chars) — will be truncated`, tip: 'Google cuts titles at ~60 chars. Move key info to the front' });
    }

    // Contains entity name (0-10 pts)
    if (name && title.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
      score += 10;
      passes.push('Title includes venue/article name');
    } else {
      score += 2;
      issues.push({ severity: 'minor', field: 'title', msg: 'Title doesn\'t include the entity name', tip: `Include "${name.split(' ').slice(0, 3).join(' ')}" in the title for brand recognition` });
    }

    // Uniqueness (0-10 pts)
    const dupes = allEntities.filter(e => e.id !== entity.id && getEntityTitle(e, type).toLowerCase() === title.toLowerCase());
    if (dupes.length === 0) {
      score += 10;
      passes.push('Title is unique across all entities');
    } else {
      issues.push({ severity: 'important', field: 'title', msg: `Duplicate title found (${dupes.length} other${dupes.length > 1 ? 's' : ''})`, tip: 'Each page needs a unique title for SEO. Add differentiating details' });
    }
  }

  // ── Description scoring (0-35 pts) ─────────────────────────────────────
  if (!desc.trim()) {
    issues.push({ severity: 'critical', field: 'desc', msg: 'Meta description is missing', tip: 'Write a compelling 150-160 char description with a call-to-action' });
  } else {
    const dLen = desc.length;
    // Length (0-15 pts)
    if (dLen >= 140 && dLen <= 160) {
      score += 15;
      passes.push('Description length is optimal (140-160 chars)');
    } else if (dLen >= 120 && dLen <= 170) {
      score += 10;
      issues.push({ severity: 'minor', field: 'desc', msg: `Description is ${dLen} chars — aim for 140-160`, tip: dLen < 140 ? 'Add more persuasive detail' : 'Trim to prevent truncation' });
    } else if (dLen > 0 && dLen < 120) {
      score += 5;
      issues.push({ severity: 'important', field: 'desc', msg: `Description too short (${dLen} chars)`, tip: 'Google may replace short descriptions with auto-generated snippets' });
    } else if (dLen > 170) {
      score += 5;
      issues.push({ severity: 'important', field: 'desc', msg: `Description too long (${dLen} chars)`, tip: 'Will be cut off. Put key info in the first 140 chars' });
    }

    // CTA words (0-10 pts)
    const descLower = desc.toLowerCase();
    const hasCta = CTA_WORDS.some(w => descLower.includes(w));
    if (hasCta) {
      score += 10;
      passes.push('Description includes a call-to-action');
    } else {
      score += 2;
      issues.push({ severity: 'minor', field: 'desc', msg: 'No call-to-action in description', tip: 'Add words like "Discover", "Explore", "Book", or "Enquire" to drive clicks' });
    }

    // Contains name reference (0-10 pts)
    if (name && descLower.includes(name.toLowerCase().split(' ')[0].toLowerCase())) {
      score += 10;
      passes.push('Description references the entity name');
    } else {
      score += 3;
      issues.push({ severity: 'minor', field: 'desc', msg: 'Description doesn\'t mention the entity name', tip: 'Include the name for relevance signals' });
    }
  }

  // ── Type-specific scoring (0-30 pts) ───────────────────────────────────
  if (type === 'listing') {
    // Keywords (0-30 pts)
    if (kw.length === 0) {
      issues.push({ severity: 'important', field: 'keywords', msg: 'No SEO keywords set', tip: 'Add 5-8 relevant keywords for search indexing' });
    } else if (kw.length >= 5 && kw.length <= 8) {
      score += 30;
      passes.push(`${kw.length} keywords set (optimal range)`);
    } else if (kw.length >= 3) {
      score += 20;
      issues.push({ severity: 'minor', field: 'keywords', msg: `Only ${kw.length} keywords — aim for 5-8`, tip: 'Add more specific long-tail keywords' });
    } else {
      score += 10;
      issues.push({ severity: 'minor', field: 'keywords', msg: `Only ${kw.length} keyword${kw.length === 1 ? '' : 's'}`, tip: 'Add at least 5 keywords for better coverage' });
    }
  } else {
    // OG Image (0-30 pts for showcases/articles)
    if (ogImg && ogImg.trim()) {
      score += 30;
      passes.push('OG image set for social sharing');
    } else {
      issues.push({ severity: 'important', field: 'og_image', msg: 'No OG image for social sharing', tip: 'Set a 1200x630px image for rich social media previews' });
    }
  }

  // ── Focus keyword scoring (optional, -10 pts max) ─────────────────────
  if (focusKeyword && focusKeyword.trim()) {
    const fk = focusKeyword.toLowerCase().trim();
    const titleLower = title.toLowerCase();
    const descLower = desc.toLowerCase();

    if (title.trim() && !titleLower.includes(fk)) {
      score -= 5;
      issues.push({ severity: 'important', field: 'title', msg: `Focus keyword "${focusKeyword}" missing from title`, tip: 'Include your target keyword in the SEO title for better rankings' });
    } else if (title.trim() && titleLower.includes(fk)) {
      passes.push('Focus keyword found in title');
    }
    if (desc.trim() && !descLower.includes(fk)) {
      score -= 5;
      issues.push({ severity: 'minor', field: 'desc', msg: `Focus keyword "${focusKeyword}" missing from description`, tip: 'Add your target keyword to the meta description for relevance signals' });
    } else if (desc.trim() && descLower.includes(fk)) {
      passes.push('Focus keyword found in description');
    }
  }

  // Opportunity assessment
  let opportunity = 'low';
  const hasContent = !!(entity.description || entity.body || entity.excerpt);
  const contentLen = (entity.description || entity.body || entity.excerpt || '').length;
  if (score < 60 && contentLen > 200) {
    opportunity = 'high'; // strong content, weak metadata = high upside
  } else if (score < 60 && contentLen < 100) {
    opportunity = 'low'; // thin content, weak metadata = limited upside
  } else if (score >= 60 && score < 85) {
    opportunity = 'medium'; // decent but improvable
  } else {
    opportunity = 'optimised'; // already strong
  }

  return {
    score: Math.min(100, score),
    issues: issues.sort((a, b) => {
      const sev = { critical: 0, important: 1, minor: 2 };
      return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
    }),
    passes,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 30 ? 'D' : 'F',
    opportunity,
  };
}

// ── Readability helpers ─────────────────────────────────────────────────────

export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  // Remove trailing silent e
  word = word.replace(/e$/, '');
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  return Math.max(1, count);
}

export function computeFleschKincaid(text) {
  if (!text || !text.trim()) return { grade: 0, label: 'N/A' };
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
  if (sentences.length === 0 || words.length === 0) return { grade: 0, label: 'N/A' };
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (totalSyllables / words.length) - 15.59;
  const rounded = Math.max(1, Math.round(grade * 10) / 10);
  return { grade: rounded, label: `Grade ${rounded.toFixed(0)}` };
}

// ── Schema.org check helpers ────────────────────────────────────────────────

export function checkSchemaOrg(entity, entityType, draft) {
  if (entityType === 'listing') {
    const name = entity.name || '';
    const address = entity.city || entity.region || entity.location || '';
    const image = entity.hero_image_url || entity.hero_image || '';
    const hasName = !!name.trim();
    const hasAddress = !!address.trim();
    const hasImage = !!image.trim();
    const pass = hasName && hasAddress && hasImage;
    return {
      schemaType: 'LocalBusiness',
      pass,
      checks: [
        { label: 'Name', pass: hasName },
        { label: 'Address/Location', pass: hasAddress },
        { label: 'Image', pass: hasImage },
      ],
    };
  } else if (entityType === 'article') {
    const titleVal = draft.seo_title || entity.seoTitle || entity.seo_title || '';
    const author = entity.author || entity.author_name || '';
    const date = entity.published_at || entity.publishedAt || entity.created_at || '';
    const image = draft.og_image || entity.ogImage || entity.og_image || entity.hero_image_url || '';
    const hasTitle = !!titleVal.trim();
    const hasAuthor = !!author.trim();
    const hasDate = !!date;
    const hasImage = !!image.trim();
    const pass = hasTitle && hasAuthor && hasDate && hasImage;
    return {
      schemaType: 'Article',
      pass,
      checks: [
        { label: 'Title', pass: hasTitle },
        { label: 'Author', pass: hasAuthor },
        { label: 'Date', pass: hasDate },
        { label: 'Image', pass: hasImage },
      ],
    };
  } else {
    // showcase => WebPage
    const titleVal = draft.seo_title || entity.seo_title || '';
    const desc = draft.seo_description || entity.seo_description || '';
    const image = draft.og_image || entity.og_image || entity.hero_image_url || '';
    const hasTitle = !!titleVal.trim();
    const hasDesc = !!desc.trim();
    const hasImage = !!image.trim();
    const pass = hasTitle && hasDesc && hasImage;
    return {
      schemaType: 'WebPage',
      pass,
      checks: [
        { label: 'Title', pass: hasTitle },
        { label: 'Description', pass: hasDesc },
        { label: 'Image', pass: hasImage },
      ],
    };
  }
}

// ── Focus Keyword Checks ────────────────────────────────────────────────────

export function computeFocusKeywordChecks(focusKeyword, title, description, slug, entity) {
  if (!focusKeyword || !focusKeyword.trim()) return [];
  const kw = focusKeyword.toLowerCase().trim();
  const checks = [];
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const slugLower = (slug || '').toLowerCase();

  checks.push({
    pass: titleLower.includes(kw),
    msg: titleLower.includes(kw)
      ? `Focus keyword found in title`
      : `Focus keyword "${focusKeyword}" not found in title`,
  });
  checks.push({
    pass: descLower.includes(kw),
    msg: descLower.includes(kw)
      ? `Focus keyword found in description`
      : `Focus keyword "${focusKeyword}" not found in description`,
  });
  // Check slug -- keywords may be hyphenated in slugs
  const kwSlug = kw.replace(/\s+/g, '-');
  const kwSlugAlt = kw.replace(/\s+/g, '');
  const slugMatch = slugLower.includes(kw) || slugLower.includes(kwSlug) || slugLower.includes(kwSlugAlt);
  checks.push({
    pass: slugMatch,
    msg: slugMatch
      ? `Focus keyword found in URL slug`
      : `Focus keyword "${focusKeyword}" not found in URL slug`,
  });
  // Check content/body for keyword density
  const bodyText = (entity?.description || entity?.body || entity?.excerpt || '').toLowerCase();
  if (bodyText.length > 50) {
    const bodyWords = bodyText.split(/\s+/).length;
    const kwOccurrences = bodyText.split(kw).length - 1;
    const density = bodyWords > 0 ? ((kwOccurrences / bodyWords) * 100).toFixed(1) : 0;
    checks.push({
      pass: kwOccurrences > 0,
      msg: kwOccurrences > 0
        ? `Focus keyword appears ${kwOccurrences}x in content (${density}% density)`
        : `Focus keyword "${focusKeyword}" not found in page content`,
    });
  }
  return checks;
}

// ── Page-Level Content Audit ────────────────────────────────────────────────

export function computePageAudit(entity, entityType) {
  const checks = [];
  const name = entity.name || entity.title || '';

  // 1. Word count check
  let bodyText = '';
  if (entityType === 'listing') {
    bodyText = entity.description || '';
  } else if (entityType === 'article') {
    bodyText = (entity.excerpt || '') + ' ' + (entity.body || entity.content || '');
  } else {
    bodyText = entity.excerpt || '';
  }
  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const wordTarget = entityType === 'article' ? 300 : 100;
  checks.push({
    label: `Content word count (${wordCount} words)`,
    pass: wordCount >= wordTarget,
    detail: wordCount >= wordTarget ? `Sufficient content (${wordCount} words)` : `Only ${wordCount} words -- aim for ${wordTarget}+ for better rankings`,
  });

  // 2. Entity name in body
  const nameLower = name.toLowerCase();
  const bodyLower = bodyText.toLowerCase();
  const nameInBody = nameLower.length > 0 && bodyLower.includes(nameLower);
  checks.push({
    label: 'Entity name appears in body content',
    pass: nameInBody,
    detail: nameInBody ? 'Name is referenced in the content' : 'Mention the entity name in the body for relevance',
  });

  // 3. Location mentions
  const locations = [entity.city, entity.region, entity.country, entity.location].filter(Boolean);
  const hasLocationMention = locations.some(loc => bodyLower.includes(loc.toLowerCase()));
  checks.push({
    label: 'Location mentioned in content',
    pass: hasLocationMention || locations.length === 0,
    detail: hasLocationMention ? 'Location is referenced in the content' : locations.length === 0 ? 'No location data available' : 'Add location references for local SEO',
  });

  // 4. Image presence
  const hasImage = !!(entity.hero_image || entity.hero_image_url || entity.heroImage);
  checks.push({
    label: 'Hero image present',
    pass: hasImage,
    detail: hasImage ? 'Hero image is set' : 'Add a hero image for visual search and social sharing',
  });

  // 5. Multiple sentences in description
  const desc = entityType === 'listing' ? (entity.description || '') : entityType === 'article' ? (entity.excerpt || '') : (entity.excerpt || '');
  const sentenceCount = desc.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
  checks.push({
    label: 'Description has multiple sentences',
    pass: sentenceCount >= 2,
    detail: sentenceCount >= 2 ? `${sentenceCount} sentences -- good for rich snippets` : 'Add at least 2 sentences for better rich snippet eligibility',
  });

  const passCount = checks.filter(c => c.pass).length;
  const score = Math.round((passCount / checks.length) * 100);

  return { checks, score };
}

// ── Cannibalisation Detection ──────────────────────────────────────────────

export function getContentWords(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function detectCannibalisation(entity, entityType, allEntitiesMap) {
  const conflicts = [];
  const entityName = (entity.name || entity.title || '').toLowerCase().trim();
  const entitySlug = (entity.slug || '').toLowerCase();
  const entityTitle = (getEntityTitle(entity, entityType) || '').toLowerCase();
  const entityTitleWords = getContentWords(entityTitle);

  if (!entityName) return { conflicts };

  // Get name words for fuzzy match (first 2+ words)
  const entityNameWords = entityName.split(/\s+/).filter(Boolean);

  const typesToCheck = ['listing', 'showcase', 'article'].filter(t => t !== entityType);

  typesToCheck.forEach(otherType => {
    const otherEntities = allEntitiesMap[otherType] || [];
    otherEntities.forEach(other => {
      const otherName = (other.name || other.title || '').toLowerCase().trim();
      const otherSlug = (other.slug || '').toLowerCase();
      const otherTitle = (getEntityTitle(other, otherType) || '').toLowerCase();
      const otherTitleWords = getContentWords(otherTitle);

      // Check 1: Fuzzy name match (first 2+ words match)
      const otherNameWords = otherName.split(/\s+/).filter(Boolean);
      if (entityNameWords.length >= 2 && otherNameWords.length >= 2) {
        const matchCount = entityNameWords.filter(w => otherNameWords.includes(w)).length;
        if (matchCount >= 2 && matchCount >= Math.min(entityNameWords.length, otherNameWords.length) * 0.5) {
          conflicts.push({ type: otherType, name: other.name || other.title || '', slug: otherSlug, reason: `Similar name -- "${otherName}" shares ${matchCount} words` });
          return;
        }
      }

      // Check 2: SEO title keyword overlap >50%
      if (entityTitleWords.length >= 3 && otherTitleWords.length >= 3) {
        const overlap = entityTitleWords.filter(w => otherTitleWords.includes(w)).length;
        const overlapPct = overlap / Math.min(entityTitleWords.length, otherTitleWords.length);
        if (overlapPct > 0.5) {
          conflicts.push({ type: otherType, name: other.name || other.title || '', slug: otherSlug, reason: `SEO title keyword overlap (${Math.round(overlapPct * 100)}%)` });
          return;
        }
      }

      // Check 3: Slug containment
      if (entitySlug && otherSlug && entitySlug.length > 3 && otherSlug.length > 3) {
        if (entitySlug.includes(otherSlug) || otherSlug.includes(entitySlug)) {
          conflicts.push({ type: otherType, name: other.name || other.title || '', slug: otherSlug, reason: 'URL slug overlap -- may confuse search engines' });
        }
      }
    });
  });

  return { conflicts };
}

// ── Internal Linking Recommendations ────────────────────────────────────────

export function suggestInternalLinks(entity, entityType, allEntitiesMap) {
  const suggestions = [];
  const entityName = (entity.name || entity.title || '').toLowerCase().trim();
  const entitySlug = (entity.slug || '').toLowerCase();

  if (!entityName) return { suggestions };

  if (entityType === 'listing') {
    // Link to related showcases (same name/slug)
    (allEntitiesMap.showcase || []).forEach(sc => {
      const scName = (sc.name || sc.title || '').toLowerCase();
      const scSlug = (sc.slug || '').toLowerCase();
      if (scName.includes(entityName.split(' ')[0]) || entityName.includes(scName.split(' ')[0]) || (entitySlug && scSlug && scSlug.includes(entitySlug.split('-')[0]))) {
        suggestions.push({ label: 'Related Showcase', targetType: 'showcase', targetName: sc.name || sc.title || '', targetSlug: sc.slug, url: `/showcase/${sc.slug}`, reason: 'Showcase appears related by name' });
      }
    });
    // Link to articles mentioning the venue
    (allEntitiesMap.article || []).forEach(art => {
      const artBody = ((art.body || '') + ' ' + (art.excerpt || '') + ' ' + (art.title || '')).toLowerCase();
      if (artBody.includes(entityName.split(' ')[0]) && entityName.split(' ')[0].length > 3) {
        suggestions.push({ label: 'Mentioned in Article', targetType: 'article', targetName: art.name || art.title || '', targetSlug: art.slug, url: `/magazine/${art.slug}`, reason: 'Article may reference this venue' });
      }
    });
  } else if (entityType === 'showcase') {
    // Link to the listing
    (allEntitiesMap.listing || []).forEach(lst => {
      const lstName = (lst.name || lst.title || '').toLowerCase();
      if (lstName.includes(entityName.split(' ')[0]) || entityName.includes(lstName.split(' ')[0])) {
        suggestions.push({ label: 'Venue Listing', targetType: 'listing', targetName: lst.name || lst.title || '', targetSlug: lst.slug, url: `/venue/${lst.slug}`, reason: 'Link to the venue listing page' });
      }
    });
    // Link to region page
    const region = entity.location || entity.region || '';
    if (region) {
      suggestions.push({ label: 'Region Page', targetType: 'region', targetName: region, targetSlug: region.toLowerCase().replace(/\s+/g, '-'), url: `/destinations/${region.toLowerCase().replace(/\s+/g, '-')}`, reason: 'Link to the region for geographic context' });
    }
  } else if (entityType === 'article') {
    // Link to mentioned venues
    (allEntitiesMap.listing || []).forEach(lst => {
      const lstName = (lst.name || lst.title || '').toLowerCase();
      const artBody = ((entity.body || '') + ' ' + (entity.excerpt || '') + ' ' + (entity.title || '')).toLowerCase();
      if (lstName.length > 3 && artBody.includes(lstName.split(' ')[0])) {
        suggestions.push({ label: 'Mentioned Venue', targetType: 'listing', targetName: lst.name || lst.title || '', targetSlug: lst.slug, url: `/venue/${lst.slug}`, reason: 'Venue appears to be referenced in article' });
      }
    });
    // Link to related showcases
    (allEntitiesMap.showcase || []).forEach(sc => {
      const scName = (sc.name || sc.title || '').toLowerCase();
      const artTitle = (entity.name || entity.title || '').toLowerCase();
      if (scName.length > 3 && artTitle.includes(scName.split(' ')[0]) && scName.split(' ')[0].length > 3) {
        suggestions.push({ label: 'Related Showcase', targetType: 'showcase', targetName: sc.name || sc.title || '', targetSlug: sc.slug, url: `/showcase/${sc.slug}`, reason: 'Showcase may be related to this article' });
      }
    });
  }

  // Deduplicate by targetSlug
  const seen = new Set();
  const unique = suggestions.filter(s => {
    const key = `${s.targetType}-${s.targetSlug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { suggestions: unique.slice(0, 8) };
}

// ── CTR Optimisation Analysis ──────────────────────────────────────────────

export function analyseCTR(title, entityType, entityName) {
  if (!title || !title.trim()) return { ctrScore: 0, tips: ['Add an SEO title to begin CTR analysis'], strengths: [] };

  const titleLower = title.toLowerCase();
  const titleWords = titleLower.split(/\s+/);
  const tips = [];
  const strengths = [];
  let score = 40; // base score

  // 1. Emotional/power words
  const powerFound = POWER_WORDS.filter(w => titleLower.includes(w));
  const emotionalFound = EMOTIONAL_WORDS.filter(w => titleLower.includes(w));
  if (powerFound.length > 0) {
    score += 15;
    strengths.push(`Power words: ${powerFound.join(', ')}`);
  } else {
    tips.push('Add a power word (luxury, exclusive, stunning, bespoke) to increase click appeal');
  }
  if (emotionalFound.length > 0) {
    score += 10;
    strengths.push(`Emotional triggers: ${emotionalFound.join(', ')}`);
  }

  // 2. Specificity (numbers, year, location)
  const hasNumber = /\d/.test(title);
  const hasYear = /20\d{2}/.test(title);
  if (hasNumber || hasYear) {
    score += 10;
    strengths.push(hasYear ? 'Contains current year for freshness' : 'Contains numbers for specificity');
  } else {
    tips.push('Add a number or year (e.g. "2026", "Top 10") for higher click-through rates');
  }

  // 3. Location prominence (in first half)
  const firstHalf = title.slice(0, Math.ceil(title.length / 2)).toLowerCase();
  const entityLoc = entityName ? entityName.toLowerCase().split(' ').slice(-1)[0] : '';
  const locationTerms = ['italy','france','spain','uk','london','paris','rome','tuscany','amalfi','lake como','puglia','sicily','provence','santorini','greece','portugal','bali','maldives','caribbean','mexico'];
  const hasLocationInFirstHalf = locationTerms.some(loc => firstHalf.includes(loc));
  if (hasLocationInFirstHalf) {
    score += 10;
    strengths.push('Location appears early in title');
  } else {
    const hasLocationAnywhere = locationTerms.some(loc => titleLower.includes(loc));
    if (hasLocationAnywhere) {
      score += 5;
      tips.push('Move location closer to the start of the title for better CTR');
    } else {
      tips.push('Consider adding a location for geographic intent matching');
    }
  }

  // 4. Brand uniqueness (doesn't start with generic words)
  const genericStarters = ['best','top','the best','the top','great','good','nice','list of','our'];
  const startsGeneric = genericStarters.some(g => titleLower.startsWith(g));
  if (startsGeneric) {
    tips.push('Avoid starting with generic words like "Best" or "Top" -- lead with your brand or unique angle');
  } else {
    score += 10;
    strengths.push('Title has a unique, non-generic opening');
  }

  // 5. Luxury language density
  const LUXURY_TERMS = ['luxury','luxurious','exclusive','bespoke','curated','refined','timeless','elegant','opulent','prestigious','premier','world-class','award-winning','five-star','5-star','haute','couture','artisan','handcrafted','heritage','estate','chateau','palazzo','villa','manor','castle','premium','high-end','fine','upscale','lavish','sumptuous','grand'];
  const luxCount = LUXURY_TERMS.filter(term => titleLower.includes(term)).length;
  if (luxCount >= 2) {
    score += 10;
    strengths.push(`Strong luxury positioning (${luxCount} premium terms)`);
  } else if (luxCount === 1) {
    score += 5;
    strengths.push(`Luxury language present: ${LUXURY_TERMS.filter(t => titleLower.includes(t)).join(', ')}`);
  } else {
    tips.push('Include luxury-signalling language to match searcher expectations');
  }

  return { ctrScore: Math.min(100, Math.max(0, score)), tips, strengths };
}

// ── Impact estimation (for Priority Actions) ───────────────────────────────

export function estimateImpact(action) {
  if (action.source === 'seo') {
    if (action.impact === 'high') return { min: 10, max: 15 };
    if (action.impact === 'medium') return { min: 5, max: 10 };
    return { min: 2, max: 5 };
  }
  if (action.source === 'cannibal') return { min: 0, max: 5 };
  if (action.source === 'ctr') return { min: 3, max: 8 };
  if (action.source === 'focus') return { min: 3, max: 7 };
  return { min: 1, max: 5 };
}

// ── CSV export helper ───────────────────────────────────────────────────────

export function exportEntitiesCsv(entities, entityType) {
  const rows = [['Name', 'Slug', 'Score', 'Grade', 'Title', 'Description', 'Issues Count']];
  entities.forEach(e => {
    const q = computeQualityScore(e, entityType, entities);
    const name = e.name || e.title || 'Untitled';
    const title = getEntityTitle(e, entityType);
    const desc = getEntityDesc(e, entityType);
    // Escape CSV fields
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    rows.push([esc(name), esc(e.slug || ''), q.score, q.grade, esc(title), esc(desc), q.issues.length]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seo-${entityType}s-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
