import AIImportEngine, { isEmpty, stripHtml } from '../../../components/AIImportEngine/AIImportEngine';

/**
 * HomepageAIImportPanel — Homepage-specific wrapper around AIImportEngine
 *
 * Maps AI extraction output into the homepage's fixed-section formData structure:
 *   sections[].id = 'hero' | 'destinations' | 'venues' | 'featured' |
 *                   'categories' | 'vendors' | 'newsletter' | 'directory'
 *
 * Uses onChange (flat fields) and onSectionChange (section fields) from usePageForm.
 *
 * Field mapping (AI result key → homepage formData location):
 *   title              → formData.title
 *   excerpt            → formData.excerpt
 *   hero_heading       → sections[hero].heading
 *   hero_subheading    → sections[hero].subheading
 *   hero_cta_text      → sections[hero].ctaText
 *   hero_cta_url       → sections[hero].ctaUrl
 *   section_headings.* → sections[id].heading (destinations, venues, featured, etc.)
 *   cta_heading        → sections[newsletter].heading
 *   cta_text           → sections[newsletter].ctaText
 *   cta_url            → sections[newsletter].ctaUrl
 *   seo_title          → seo.title
 *   seo_description    → seo.metaDescription
 *   seo_keywords       → seo.keywords
 */

// ─── Homepage review sections ────────────────────────────────────────────────

const HOMEPAGE_REVIEW_SECTIONS = [
  {
    id: 'core',
    label: 'Page Details',
    icon: '📄',
    fields: ['title', 'excerpt'],
    preview: (r) => r.title || '',
    details: (r) => [
      r.title   && { label: 'Title',   value: r.title },
      r.excerpt && { label: 'Excerpt', value: r.excerpt.length > 120 ? r.excerpt.slice(0, 120) + '…' : r.excerpt },
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
    id: 'section_headings',
    label: 'Section Headings',
    icon: '📝',
    fields: ['section_headings'],
    preview: (r) => {
      const sh = r.section_headings || {};
      const filled = Object.values(sh).filter(Boolean);
      return filled.length ? `${filled.length} heading${filled.length > 1 ? 's' : ''}` : '';
    },
    details: (r) => {
      const sh = r.section_headings || {};
      const labels = {
        destinations: 'Destinations',
        venues:       'Venues',
        featured:     'Featured',
        categories:   'Categories',
        vendors:      'Vendors',
        directory:    'Directory',
      };
      return Object.entries(labels)
        .filter(([key]) => sh[key])
        .map(([key, label]) => ({ label, value: sh[key] }));
    },
    gated: (r) => {
      const sh = r.section_headings || {};
      return Object.values(sh).some(Boolean);
    },
  },
  {
    id: 'newsletter',
    label: 'Newsletter CTA',
    icon: '📧',
    fields: ['cta_heading', 'cta_text', 'cta_url'],
    preview: (r) => r.cta_heading || r.cta_text || '',
    details: (r) => [
      r.cta_heading && { label: 'Heading',  value: r.cta_heading },
      r.cta_text    && { label: 'CTA Text', value: r.cta_text },
      r.cta_url     && { label: 'CTA URL',  value: r.cta_url },
    ].filter(Boolean),
    gated: (r) => !!(r.cta_heading || r.cta_text),
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

// ─── Apply function ──────────────────────────────────────────────────────────

/**
 * applyHomepageResult — Map AI extraction result to homepage formData.
 *
 * Uses onChange for flat fields (title, seo) and onSectionChange for
 * section-level fields (hero.heading, newsletter.ctaText, etc.).
 *
 * Does NOT auto-save. Sets hasChanges via onChange/onSectionChange calls.
 */
function applyHomepageResult(result, enabledSections, mergeOnly, formData, onChange, onSectionChange) {
  if (!result) return;

  const findSection = (id) => (formData.sections || []).find(s => s.id === id);

  const should = (currentVal, aiVal) => {
    if (isEmpty(aiVal)) return false;
    if (!mergeOnly) return true;
    return isEmpty(currentVal);
  };

  // ── Page title + excerpt ────────────────────────────────────────────────
  if (enabledSections.core) {
    if (should(formData.title, result.title))     onChange('title', result.title);
    if (should(formData.excerpt, result.excerpt)) onChange('excerpt', result.excerpt);
  }

  // ── Hero section ────────────────────────────────────────────────────────
  if (enabledSections.hero) {
    const hero = findSection('hero');
    if (hero) {
      if (should(hero.heading, result.hero_heading))       onSectionChange('hero', 'heading', result.hero_heading);
      if (should(hero.subheading, result.hero_subheading)) onSectionChange('hero', 'subheading', result.hero_subheading);
      if (should(hero.ctaText, result.hero_cta_text))      onSectionChange('hero', 'ctaText', result.hero_cta_text);
      if (should(hero.ctaUrl, result.hero_cta_url))        onSectionChange('hero', 'ctaUrl', result.hero_cta_url);
    }
  }

  // ── Section headings ────────────────────────────────────────────────────
  if (enabledSections.section_headings) {
    const sh = result.section_headings || {};
    const sectionIds = ['destinations', 'venues', 'featured', 'categories', 'vendors', 'directory'];
    for (const id of sectionIds) {
      if (sh[id]) {
        const section = findSection(id);
        if (section && should(section.heading, sh[id])) {
          onSectionChange(id, 'heading', sh[id]);
        }
      }
    }
  }

  // ── Newsletter CTA ──────────────────────────────────────────────────────
  if (enabledSections.newsletter) {
    const newsletter = findSection('newsletter');
    if (newsletter) {
      if (should(newsletter.heading, result.cta_heading)) onSectionChange('newsletter', 'heading', result.cta_heading);
      if (should(newsletter.ctaText, result.cta_text))    onSectionChange('newsletter', 'ctaText', result.cta_text);
      if (should(newsletter.ctaUrl, result.cta_url))      onSectionChange('newsletter', 'ctaUrl', result.cta_url);
    }
  }

  // ── SEO ─────────────────────────────────────────────────────────────────
  if (enabledSections.seo) {
    const seo = { ...(formData.seo || {}) };
    let changed = false;
    if (result.seo_title       && (!mergeOnly || isEmpty(seo.title)))           { seo.title = result.seo_title; changed = true; }
    if (result.seo_description && (!mergeOnly || isEmpty(seo.metaDescription))) { seo.metaDescription = result.seo_description; changed = true; }
    if (result.seo_keywords?.length && (!mergeOnly || isEmpty(seo.keywords)))   { seo.keywords = result.seo_keywords; changed = true; }
    if (changed) onChange('seo', seo);
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

const HomepageAIImportPanel = ({ formData, onChange, onSectionChange, onClose }) => {
  const handleApply = (result, enabledSections, mergeOnly) => {
    applyHomepageResult(result, enabledSections, mergeOnly, formData, onChange, onSectionChange);
  };

  return (
    <AIImportEngine
      functionName="ai-extract-page"
      entityName={formData?.title || 'Homepage'}
      entityType="homepage"
      entityId={formData?.id}
      reviewSections={HOMEPAGE_REVIEW_SECTIONS}
      emptyMessage="AI couldn't extract enough content from the source materials. Try adding more detailed files or paste your homepage copy."
      targetLabel="Homepage"
      onApply={handleApply}
      onClose={onClose}
    />
  );
};

export default HomepageAIImportPanel;
