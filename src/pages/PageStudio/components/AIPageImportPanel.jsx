import AIImportEngine, { isEmpty, stripHtml } from '../../../components/AIImportEngine/AIImportEngine';

/**
 * AIPageImportPanel, Page Studio wrapper around AIImportEngine
 *
 * Provides the page-specific:
 *   • Review section definitions (what to show + how to preview each field group)
 *   • Field mapping logic, translates AI result → page section mutations
 *
 * Page data is section-based: page.sections[] each with { id, sectionType, content, settings }.
 * The apply function finds or creates sections by type and calls onSavePage(updatedPage).
 *
 * All source-input UI, file processing, API call, and review panel chrome
 * live in AIImportEngine and are shared with Listing Studio.
 */

// ─── Page review sections ─────────────────────────────────────────────────────

const PAGE_REVIEW_SECTIONS = [
  {
    id: 'core',
    label: 'Page Details',
    icon: '📄',
    fields: ['title', 'excerpt'],
    preview: (r) => [r.title, r.excerpt && r.excerpt.slice(0, 80) + (r.excerpt?.length > 80 ? '…' : '')].filter(Boolean).join(' · '),
    details: (r) => [
      r.title   && { label: 'Title',   value: r.title },
      r.excerpt && { label: 'Excerpt', value: r.excerpt.length > 100 ? r.excerpt.slice(0, 100) + '…' : r.excerpt },
    ].filter(Boolean),
  },
  {
    id: 'hero',
    label: 'Hero Section',
    icon: '🌅',
    fields: ['hero_heading', 'hero_subheading', 'hero_cta_text', 'hero_cta_url'],
    preview: (r) => r.hero_heading || '',
    details: (r) => [
      r.hero_heading    && { label: 'Heading',    value: r.hero_heading },
      r.hero_subheading && { label: 'Subheading', value: r.hero_subheading.length > 100 ? r.hero_subheading.slice(0, 100) + '…' : r.hero_subheading },
      r.hero_cta_text   && { label: 'CTA Text',   value: r.hero_cta_text },
      r.hero_cta_url    && { label: 'CTA URL',    value: r.hero_cta_url },
    ].filter(Boolean),
    gated: (r) => !!(r.hero_heading || r.hero_subheading),
  },
  {
    id: 'intro',
    label: 'Intro Block',
    icon: '✍',
    fields: ['intro_heading', 'intro_body'],
    preview: (r) => r.intro_heading || (r.intro_body ? stripHtml(r.intro_body).slice(0, 80) + '…' : ''),
    details: (r) => [
      r.intro_heading && { label: 'Heading', value: r.intro_heading },
      r.intro_body    && { label: 'Body',    value: stripHtml(r.intro_body).slice(0, 120) + '…' },
    ].filter(Boolean),
    gated: (r) => !!(r.intro_heading || r.intro_body),
  },
  {
    id: 'body',
    label: 'Body Sections',
    icon: '📝',
    fields: ['body_sections'],
    isArray: true,
    count: (r) => r.body_sections?.length || 0,
    preview: (r) => {
      const sections = r.body_sections || [];
      if (!sections.length) return '';
      return sections.map(s => s.heading || 'Untitled section').slice(0, 3).join(', ') +
        (sections.length > 3 ? ` +${sections.length - 3} more` : '');
    },
    details: (r) => (r.body_sections || []).map((s, i) => ({
      label: `Section ${i + 1}`,
      value: [s.heading, s.body ? stripHtml(s.body).slice(0, 80) + '…' : ''].filter(Boolean).join(', '),
    })),
    gated: (r) => !!(r.body_sections?.length),
  },
  {
    id: 'cta',
    label: 'CTA Band',
    icon: '🔔',
    fields: ['cta_heading', 'cta_subheading', 'cta_text', 'cta_url'],
    preview: (r) => r.cta_heading || r.cta_text || '',
    details: (r) => [
      r.cta_heading    && { label: 'Heading',    value: r.cta_heading },
      r.cta_subheading && { label: 'Subheading', value: r.cta_subheading },
      r.cta_text       && { label: 'CTA Text',   value: r.cta_text },
      r.cta_url        && { label: 'CTA URL',    value: r.cta_url },
    ].filter(Boolean),
    gated: (r) => !!(r.cta_heading || r.cta_text),
  },
  {
    id: 'faq',
    label: 'FAQ Section',
    icon: '❓',
    fields: ['faq_items'],
    isArray: true,
    count: (r) => r.faq_items?.length || 0,
    preview: (r) => {
      const items = r.faq_items || [];
      return items.length ? `${items.length} Q&A${items.length > 1 ? 's' : ''}` : '';
    },
    details: (r) => (r.faq_items || []).slice(0, 4).map((item, i) => ({
      label: `Q${i + 1}`,
      value: item.question || '',
    })),
    gated: (r) => !!(r.faq_items?.length),
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: '🔍',
    fields: ['seo_title', 'seo_description', 'seo_keywords'],
    preview: (r) => r.seo_title || '',
    details: (r) => [
      r.seo_title       && { label: 'Title',       value: r.seo_title },
      r.seo_description && { label: 'Description', value: r.seo_description.length > 100 ? r.seo_description.slice(0, 100) + '…' : r.seo_description },
      r.seo_keywords?.length && { label: 'Keywords', value: r.seo_keywords.slice(0, 6).join(', ') },
    ].filter(Boolean),
  },
];

// ─── Section helpers ──────────────────────────────────────────────────────────

/**
 * Find the first section of a given type, or return null.
 */
function findSection(sections, sectionType) {
  return sections.find(s => s.sectionType === sectionType) || null;
}

/**
 * Create a new page section stub of the given type.
 */
function makeSection(sectionType, content = {}, settings = {}) {
  const defaults = {
    hero_image: { heading: '', subheading: '', body: '', image: '', ctaText: '', ctaUrl: '' },
    rich_text:  { heading: '', body: '', image: '', ctaText: '', ctaUrl: '' },
    cta_band:   { heading: '', body: '', ctaText: '', ctaUrl: '', image: '' },
    faq:        { heading: 'Frequently Asked Questions', faqs: [] },
  };
  return {
    id: `section_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sectionType,
    sectionName: {
      hero_image: 'Hero Image', rich_text: 'Rich Text', cta_band: 'CTA Band', faq: 'FAQ'
    }[sectionType] || sectionType,
    content: { ...(defaults[sectionType] || {}), ...content },
    settings: {
      paddingTop: sectionType === 'hero_image' ? 60 : 40,
      paddingBottom: sectionType === 'hero_image' ? 40 : 40,
      backgroundColor: sectionType === 'cta_band' ? '#8a6d1b' : '',
      textAlign: sectionType === 'hero_image' || sectionType === 'cta_band' ? 'center' : 'left',
      mobileVisible: true,
      desktopVisible: true,
      ...settings,
    },
  };
}

// ─── Apply function ───────────────────────────────────────────────────────────

/**
 * applyPageResult, Map AI extraction result to page sections + flat fields.
 *
 * Differences from listing apply:
 *   - Page has sections[] not flat onChange fields
 *   - Sections are found or created by sectionType
 *   - Flat fields: page.title, page.excerpt, page.seo.*
 *   - Calls onSavePage(updatedPage) once with all mutations applied
 */
function applyPageResult(result, enabledSections, mergeOnly, page, onSavePage) {
  if (!result || !page) return;

  let updatedPage = { ...page, updatedAt: new Date().toISOString() };
  let sections = [...(page.sections || [])];

  const should = (fieldKey, aiVal) => {
    if (isEmpty(aiVal)) return false;
    if (!mergeOnly) return true;
    return isEmpty(updatedPage[fieldKey] ?? updatedPage.seo?.[fieldKey]);
  };

  // ── Core flat fields ───────────────────────────────────────────────────────
  if (enabledSections.core) {
    if (should('title',   result.title))   updatedPage.title   = result.title;
    if (should('excerpt', result.excerpt)) updatedPage.excerpt = result.excerpt;
  }

  // ── Hero section ───────────────────────────────────────────────────────────
  if (enabledSections.hero && (result.hero_heading || result.hero_subheading)) {
    let heroSection = findSection(sections, 'hero_image');
    const heroContent = heroSection ? { ...heroSection.content } : {};

    if (result.hero_heading    && (!mergeOnly || isEmpty(heroContent.heading)))    heroContent.heading    = result.hero_heading;
    if (result.hero_subheading && (!mergeOnly || isEmpty(heroContent.subheading))) heroContent.subheading = result.hero_subheading;
    if (result.hero_cta_text   && (!mergeOnly || isEmpty(heroContent.ctaText)))    heroContent.ctaText    = result.hero_cta_text;
    if (result.hero_cta_url    && (!mergeOnly || isEmpty(heroContent.ctaUrl)))     heroContent.ctaUrl     = result.hero_cta_url;

    if (heroSection) {
      sections = sections.map(s =>
        s.sectionType === 'hero_image' ? { ...s, content: heroContent } : s
      );
    } else {
      sections = [makeSection('hero_image', heroContent), ...sections];
    }
  }

  // ── Intro (first rich_text) ────────────────────────────────────────────────
  if (enabledSections.intro && (result.intro_heading || result.intro_body)) {
    const introContent = {};
    if (result.intro_heading) introContent.heading = result.intro_heading;
    if (result.intro_body)    introContent.body    = result.intro_body;

    const existingIntro = findSection(sections, 'rich_text');
    if (existingIntro) {
      sections = sections.map(s =>
        s.id === existingIntro.id
          ? { ...s, content: mergeOnly
              ? { ...s.content, ...(isEmpty(s.content.heading) && introContent.heading ? { heading: introContent.heading } : {}), ...(isEmpty(s.content.body) && introContent.body ? { body: introContent.body } : {}) }
              : { ...s.content, ...introContent }
            }
          : s
      );
    } else {
      // Insert after hero (or at start if no hero)
      const heroIdx = sections.findIndex(s => s.sectionType === 'hero_image');
      const insertAt = heroIdx >= 0 ? heroIdx + 1 : 0;
      sections = [
        ...sections.slice(0, insertAt),
        makeSection('rich_text', introContent),
        ...sections.slice(insertAt),
      ];
    }
  }

  // ── Body sections (additional rich_text blocks) ────────────────────────────
  if (enabledSections.body && result.body_sections?.length) {
    if (!mergeOnly) {
      // In overwrite mode, append new rich_text sections after intro (skip existing)
      const newBodySections = result.body_sections
        .filter(s => s.heading || s.body)
        .map(s => makeSection('rich_text', {
          heading: s.heading || '',
          body:    s.body    || '',
        }));
      // Insert before cta_band if it exists, else append
      const ctaIdx = sections.findIndex(s => s.sectionType === 'cta_band');
      if (ctaIdx >= 0) {
        sections = [
          ...sections.slice(0, ctaIdx),
          ...newBodySections,
          ...sections.slice(ctaIdx),
        ];
      } else {
        sections = [...sections, ...newBodySections];
      }
    }
    // In merge mode: skip body section injection (don't duplicate existing content)
  }

  // ── CTA Band ───────────────────────────────────────────────────────────────
  if (enabledSections.cta && (result.cta_heading || result.cta_text)) {
    let ctaSection = findSection(sections, 'cta_band');
    const ctaContent = ctaSection ? { ...ctaSection.content } : {};

    if (result.cta_heading    && (!mergeOnly || isEmpty(ctaContent.heading))) ctaContent.heading = result.cta_heading;
    if (result.cta_subheading && (!mergeOnly || isEmpty(ctaContent.body)))    ctaContent.body    = result.cta_subheading;
    if (result.cta_text       && (!mergeOnly || isEmpty(ctaContent.ctaText))) ctaContent.ctaText = result.cta_text;
    if (result.cta_url        && (!mergeOnly || isEmpty(ctaContent.ctaUrl)))  ctaContent.ctaUrl  = result.cta_url;

    if (ctaSection) {
      sections = sections.map(s =>
        s.sectionType === 'cta_band' ? { ...s, content: ctaContent } : s
      );
    } else {
      sections = [...sections, makeSection('cta_band', ctaContent)];
    }
  }

  // ── FAQ Section ────────────────────────────────────────────────────────────
  if (enabledSections.faq && result.faq_items?.length) {
    const faqItems = result.faq_items
      .filter(item => item.question)
      .map((item, i) => ({
        id:       `faq-import-${Date.now()}-${i}`,
        question: item.question || '',
        answer:   item.answer   || '',
      }));

    if (faqItems.length) {
      let faqSection = findSection(sections, 'faq');
      if (faqSection) {
        const existing = faqSection.content.faqs || [];
        sections = sections.map(s =>
          s.sectionType === 'faq'
            ? { ...s, content: { ...s.content, faqs: mergeOnly ? [...existing, ...faqItems] : faqItems } }
            : s
        );
      } else {
        sections = [...sections, makeSection('faq', { heading: 'Frequently Asked Questions', faqs: faqItems })];
      }
    }
  }

  // ── SEO fields ─────────────────────────────────────────────────────────────
  if (enabledSections.seo) {
    const seo = { ...(updatedPage.seo || {}) };
    if (result.seo_title       && (!mergeOnly || isEmpty(seo.title)))           seo.title           = result.seo_title;
    if (result.seo_description && (!mergeOnly || isEmpty(seo.metaDescription))) seo.metaDescription = result.seo_description;
    if (result.seo_keywords?.length && (!mergeOnly || isEmpty(seo.keywords)))   seo.keywords        = result.seo_keywords;
    updatedPage = { ...updatedPage, seo };
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  updatedPage = { ...updatedPage, sections };
  onSavePage(updatedPage);
}

// ─── Main component ───────────────────────────────────────────────────────────

const AIPageImportPanel = ({ page, onSavePage, onClose }) => {
  const handleApply = (result, enabledSections, mergeOnly) => {
    applyPageResult(result, enabledSections, mergeOnly, page, onSavePage);
  };

  return (
    <AIImportEngine
      functionName="ai-extract-page"
      entityName={page?.title || ''}
      entityType={page?.pageType || 'page'}
      entityId={page?.id}
      reviewSections={PAGE_REVIEW_SECTIONS}
      emptyMessage="AI couldn't extract enough content from the source materials. Try adding more detailed files or paste the page copy."
      targetLabel="Page"
      onApply={handleApply}
      onClose={onClose}
    />
  );
};

export default AIPageImportPanel;
