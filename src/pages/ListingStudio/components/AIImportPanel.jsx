import AIImportEngine, { isEmpty, stripHtml } from '../../../components/AIImportEngine/AIImportEngine';

/**
 * AIImportPanel — Listing Studio wrapper around AIImportEngine
 *
 * Provides the listing-specific:
 *   • Review section definitions (what to show + how to preview each field group)
 *   • Country / region normalisation (must match LocationSection.jsx SELECT values)
 *   • Field mapping logic (translates AI result → form onChange calls)
 *
 * All source-input UI, file processing, API call, and review panel chrome
 * live in AIImportEngine and are reusable across Listings, Pages, and Blogs.
 */

// ─── Country / region normalisation ──────────────────────────────────────────
// Must match exact values used in LocationSection.jsx

const COUNTRY_NORM = {
  'italy': 'italy', 'italia': 'italy',
  'france': 'france',
  'spain': 'spain', 'españa': 'spain', 'espana': 'spain',
  'greece': 'greece', 'hellas': 'greece',
  'portugal': 'portugal',
  'united kingdom': 'uk', 'uk': 'uk', 'england': 'uk', 'scotland': 'uk',
  'wales': 'uk', 'great britain': 'uk', 'britain': 'uk',
  'united states': 'us', 'usa': 'us', 'us': 'us', 'america': 'us',
  'united states of america': 'us',
  'caribbean': 'caribbean',
};

// Exact copy of REGIONS_BY_COUNTRY from LocationSection.jsx
const REGION_OPTIONS = {
  italy: ['Tuscany', 'Amalfi Coast', 'Lake Como', 'Lake Garda', 'Rome & Lazio',
          'Venice & Veneto', 'Sicily', 'Sardinia', 'Puglia', 'Umbria',
          'Piedmont', 'Lombardy', 'Campania', 'Emilia-Romagna', 'Marche', 'Liguria'],
  france: ["Paris & Île-de-France", 'Provence', "Côte d'Azur", 'Loire Valley',
           'Burgundy', 'Bordeaux & Aquitaine', 'Normandy', 'Alsace',
           'Dordogne', 'Brittany', 'Languedoc', 'Rhône-Alpes'],
  spain: ['Andalusia', 'Catalonia', 'Ibiza', 'Mallorca', 'Menorca',
          'Madrid', 'Valencia', 'Galicia', 'Basque Country', 'Canary Islands'],
  greece: ['Santorini', 'Mykonos', 'Crete', 'Athens & Attica',
           'Corfu', 'Rhodes', 'Zakynthos', 'Peloponnese', 'Paros', 'Naxos'],
  portugal: ['Lisbon & Surroundings', 'Algarve', 'Porto', 'Douro Valley',
             'Alentejo', 'Madeira', 'Azores', 'Sintra & Cascais'],
  uk: ['Cotswolds', 'London', 'Lake District', 'Yorkshire', 'Cornwall & Devon',
       'Kent & Surrey', 'Edinburgh & Lothians', 'Scottish Highlands',
       'Wales', 'Northern Ireland', 'Oxfordshire', 'Berkshire'],
  us: ['New York', 'California', 'Florida', 'Hawaii', 'Texas',
       'Georgia', 'Colorado', 'Vermont', 'Napa Valley', 'Hudson Valley',
       'The Hamptons', 'New England', 'North Carolina'],
  caribbean: ['Jamaica', 'Barbados', 'St Lucia', 'Turks & Caicos', 'Antigua',
              'Bahamas', 'Dominican Republic', 'US Virgin Islands', 'St Barts', 'Grenada'],
};

function normaliseCountry(raw) {
  if (!raw) return '';
  return COUNTRY_NORM[raw.toLowerCase().trim()] || '';
}

function normaliseRegion(raw, countryKey) {
  if (!raw || !countryKey) return '';
  const regions = REGION_OPTIONS[countryKey] || [];
  if (!regions.length) return raw; // free-text region (country has no fixed options)
  const lower = raw.toLowerCase().trim();
  return regions.find(r => r.toLowerCase() === lower)
    || regions.find(r => lower.includes(r.toLowerCase()) || r.toLowerCase().includes(lower))
    || ''; // ← return blank if no valid match — never set an invalid value on a select
}

// ─── Listing review sections ──────────────────────────────────────────────────

const LISTING_REVIEW_SECTIONS = [
  {
    id: 'core',
    label: 'Core Details',
    icon: '🏛',
    fields: ['venue_name', 'city', 'region', 'country', 'capacity', 'price_range'],
    preview: (r) => [r.venue_name, [r.city, r.region, r.country].filter(Boolean).join(', '), r.capacity && `${r.capacity} guests`, r.price_range].filter(Boolean).join(' · '),
    details: (r) => [
      r.venue_name  && { label: 'Name',     value: r.venue_name },
      r.city        && { label: 'City',     value: r.city },
      r.region      && { label: 'Region',   value: r.region },
      r.country     && { label: 'Country',  value: r.country },
      r.capacity    && { label: 'Capacity', value: `${r.capacity} guests` },
      r.price_range && { label: 'Price',    value: r.price_range },
    ].filter(Boolean),
  },
  {
    id: 'description',
    label: 'Description',
    icon: '✍',
    fields: ['summary', 'description'],
    preview: (r) => r.summary || '',
    details: (r) => [
      r.summary     && { label: 'Summary',     value: r.summary.length > 120 ? r.summary.slice(0, 120) + '…' : r.summary },
      r.description && { label: 'Description', value: stripHtml(r.description).slice(0, 120) + '…' },
    ].filter(Boolean),
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: '✓',
    fields: ['amenities'],
    preview: (r) => r.amenities ? r.amenities.split(',').slice(0, 4).join(', ') + (r.amenities.split(',').length > 4 ? '…' : '') : '',
    details: (r) => (r.amenities || '').split(',').map(a => a.trim()).filter(Boolean).slice(0, 12).map(a => ({ label: '·', value: a })),
  },
  {
    id: 'spaces',
    label: 'Spaces',
    icon: '🚪',
    fields: ['spaces'],
    isArray: true,
    preview: (r) => r.spaces?.length ? r.spaces.map(s => s.name).filter(Boolean).slice(0, 3).join(', ') : '',
    count: (r) => r.spaces?.length || 0,
    details: (r) => (r.spaces || []).map(s => ({
      label: s.name || 'Unnamed',
      value: [
        s.type && s.type !== 'other' && s.type,
        s.capacityReception && `${s.capacityReception} reception`,
        s.capacityCeremony  && `${s.capacityCeremony} ceremony`,
        s.indoor !== null   && (s.indoor ? 'Indoor' : 'Outdoor'),
      ].filter(Boolean).join(' · ') || (s.description ? stripHtml(s.description).slice(0, 60) : ''),
    })),
  },
  {
    id: 'rooms',
    label: 'Rooms & Accommodation',
    icon: '🛏',
    fields: ['rooms_total', 'rooms_suites', 'rooms_max_guests', 'rooms_description'],
    preview: (r) => [r.rooms_total && `${r.rooms_total} rooms`, r.rooms_suites && `${r.rooms_suites} suites`, r.rooms_max_guests && `sleeps ${r.rooms_max_guests}`].filter(Boolean).join(' · '),
    details: (r) => [
      r.rooms_total       && { label: 'Rooms',       value: String(r.rooms_total) },
      r.rooms_suites      && { label: 'Suites',      value: String(r.rooms_suites) },
      r.rooms_max_guests  && { label: 'Max guests',  value: String(r.rooms_max_guests) },
      r.rooms_description && { label: 'Description', value: stripHtml(r.rooms_description).slice(0, 100) + '…' },
    ].filter(Boolean),
  },
  {
    id: 'dining',
    label: 'Dining',
    icon: '🍽',
    fields: ['dining_style', 'dining_chef_name', 'dining_in_house', 'dining_description'],
    preview: (r) => [r.dining_style, r.dining_chef_name && `Chef ${r.dining_chef_name}`].filter(Boolean).join(' · '),
    details: (r) => [
      r.dining_style       && { label: 'Style',       value: r.dining_style },
      r.dining_chef_name   && { label: 'Chef',        value: r.dining_chef_name },
      r.dining_in_house != null && { label: 'In-house',   value: r.dining_in_house ? 'Yes' : 'No' },
      r.dining_description && { label: 'Description', value: stripHtml(r.dining_description).slice(0, 100) + '…' },
    ].filter(Boolean),
  },
  {
    id: 'exclusive_use',
    label: 'Exclusive Use',
    icon: '🔑',
    fields: ['exclusive_use_enabled', 'exclusive_use_title', 'exclusive_use_price', 'exclusive_use_subline', 'exclusive_use_description', 'exclusive_use_includes'],
    gated: (r) => r.exclusive_use_enabled,
    preview: (r) => [r.exclusive_use_price, r.exclusive_use_subline].filter(Boolean).join(' · '),
    details: (r) => [
      r.exclusive_use_title       && { label: 'Title',    value: r.exclusive_use_title },
      r.exclusive_use_price       && { label: 'Price',    value: r.exclusive_use_price },
      r.exclusive_use_subline     && { label: 'Subline',  value: r.exclusive_use_subline },
      r.exclusive_use_includes?.length && { label: 'Includes', value: `${r.exclusive_use_includes.length} items listed` },
    ].filter(Boolean),
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: '💬',
    fields: ['faq_enabled', 'faq_categories'],
    isArray: true,
    gated: (r) => r.faq_enabled,
    preview: (r) => r.faq_categories?.map(c => c.category).filter(Boolean).slice(0, 3).join(', ') || '',
    count: (r) => r.faq_categories?.reduce((n, c) => n + (c.questions?.length || 0), 0) || 0,
    details: (r) => (r.faq_categories || []).flatMap(cat => [
      { label: cat.category || 'Category', value: `${cat.questions?.length || 0} questions` },
      ...(cat.questions || []).slice(0, 2).map(q => ({ label: '  Q', value: q.q?.length > 70 ? q.q.slice(0, 70) + '…' : (q.q || '') })),
    ]),
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: '🔍',
    fields: ['seo_title', 'seo_description', 'seo_keywords'],
    preview: (r) => r.seo_title || '',
    details: (r) => [
      r.seo_title       && { label: 'Title',       value: r.seo_title },
      r.seo_description && { label: 'Description', value: r.seo_description.length > 80 ? r.seo_description.slice(0, 80) + '…' : r.seo_description },
      r.seo_keywords?.length && { label: 'Keywords', value: r.seo_keywords.slice(0, 6).join(', ') },
    ].filter(Boolean),
  },
  {
    id: 'contact_location',
    label: 'Contact & Location',
    icon: '📍',
    fields: ['address', 'postcode', 'contact_profile'],
    preview: (r) => [
      r.contact_profile?.name,
      r.address,
      r.contact_profile?.email || r.contact_profile?.phone,
    ].filter(Boolean).join(' · '),
    details: (r) => [
      r.contact_profile?.name      && { label: 'Contact',   value: r.contact_profile.name + (r.contact_profile.title ? ` · ${r.contact_profile.title}` : '') },
      r.contact_profile?.email     && { label: 'Email',     value: r.contact_profile.email },
      r.contact_profile?.phone     && { label: 'Phone',     value: r.contact_profile.phone },
      r.contact_profile?.website   && { label: 'Website',   value: r.contact_profile.website },
      r.contact_profile?.instagram && { label: 'Instagram', value: r.contact_profile.instagram },
      r.address                    && { label: 'Address',   value: [r.address, r.address_line2].filter(Boolean).join(', ') },
      r.postcode                   && { label: 'Postcode',  value: r.postcode },
      r.city                       && { label: 'City',      value: r.city },
      r.region                     && { label: 'Region',    value: r.region },
      r.country                    && { label: 'Country',   value: r.country },
    ].filter(Boolean),
  },
  {
    id: 'nearby',
    label: 'Nearby Experiences',
    icon: '🗺',
    fields: ['nearby_enabled', 'nearby_items'],
    isArray: true,
    gated: (r) => r.nearby_enabled,
    preview: (r) => r.nearby_items?.map(i => i.title).filter(Boolean).slice(0, 3).join(', ') || '',
    count: (r) => r.nearby_items?.length || 0,
    details: (r) => (r.nearby_items || []).map(item => ({
      label: item.icon || '·',
      value: item.title + (item.status ? ` · ${item.status}` : ''),
    })),
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: '🎬',
    fields: ['video_urls'],
    isArray: true,
    preview: (r) => r.video_urls?.slice(0, 2).join(', ') || '',
    count: (r) => r.video_urls?.length || 0,
    details: (r) => (r.video_urls || []).map((url, i) => ({
      label: `Video ${i + 1}`,
      value: url.length > 60 ? url.slice(0, 60) + '…' : url,
    })),
  },
];

// ─── Listing field schema ────────────────────────────────────────────────────
// Declarative definition of AI result → form field mappings.
// Simple fields use createApplyFn(LISTING_FIELD_SCHEMA, formData, onChange).
// Complex fields (marked below) are handled manually in applyListingResult().
//
// Other content types (Pages, Blogs, Vendors) follow the same schema format.

export const LISTING_FIELD_SCHEMA = [
  // ── Core details ──────────────────────────────────────────────────────────
  { aiKey: 'venue_name',  formKey: 'venue_name',  section: 'core', kind: 'fact',      merge: 'overwrite' },
  { aiKey: 'city',        formKey: 'city',        section: 'core', kind: 'fact',      merge: 'overwrite' },
  { aiKey: 'capacity',    formKey: 'capacity',    section: 'core', kind: 'fact',      merge: 'overwrite', stringify: true },
  { aiKey: 'price_range', formKey: 'price_range', section: 'core', kind: 'fact',      merge: 'overwrite' },
  // country + region: handled manually (normalisation against SELECT option lists)

  // ── Description ───────────────────────────────────────────────────────────
  { aiKey: 'summary',     formKey: 'summary',     section: 'description', kind: 'editorial', merge: 'overwrite' },
  { aiKey: 'description', formKey: 'description', section: 'description', kind: 'editorial', merge: 'overwrite' },

  // ── Amenities ─────────────────────────────────────────────────────────────
  { aiKey: 'amenities', formKey: 'amenities', section: 'amenities', kind: 'fact', merge: 'overwrite' },

  // ── Rooms ─────────────────────────────────────────────────────────────────
  { aiKey: 'rooms_total',       formKey: 'rooms_total',       section: 'rooms', kind: 'fact',      merge: 'overwrite', stringify: true },
  { aiKey: 'rooms_suites',      formKey: 'rooms_suites',      section: 'rooms', kind: 'fact',      merge: 'overwrite', stringify: true },
  { aiKey: 'rooms_max_guests',  formKey: 'rooms_max_guests',  section: 'rooms', kind: 'fact',      merge: 'overwrite', stringify: true },
  { aiKey: 'rooms_description', formKey: 'rooms_description', section: 'rooms', kind: 'editorial', merge: 'overwrite' },

  // ── Dining ────────────────────────────────────────────────────────────────
  { aiKey: 'dining_style',       formKey: 'dining_style',       section: 'dining', kind: 'fact',      merge: 'overwrite' },
  { aiKey: 'dining_chef_name',   formKey: 'dining_chef_name',   section: 'dining', kind: 'fact',      merge: 'overwrite' },
  { aiKey: 'dining_in_house',    formKey: 'dining_in_house',    section: 'dining', kind: 'fact',      merge: 'overwrite' },
  { aiKey: 'dining_description', formKey: 'dining_description', section: 'dining', kind: 'editorial', merge: 'overwrite' },

  // ── SEO ───────────────────────────────────────────────────────────────────
  { aiKey: 'seo_title',       formKey: 'seo_title',       section: 'seo', kind: 'editorial', merge: 'overwrite' },
  { aiKey: 'seo_description', formKey: 'seo_description', section: 'seo', kind: 'editorial', merge: 'overwrite' },
  { aiKey: 'seo_keywords',    formKey: 'seo_keywords',    section: 'seo', kind: 'editorial', merge: 'replace_if_empty' },

  // ── Contact & Location ────────────────────────────────────────────────────
  { aiKey: 'address',         formKey: 'address',         section: 'contact_location', kind: 'fact', merge: 'overwrite' },
  { aiKey: 'address_line2',   formKey: 'address_line2',   section: 'contact_location', kind: 'fact', merge: 'overwrite' },
  { aiKey: 'postcode',        formKey: 'postcode',        section: 'contact_location', kind: 'fact', merge: 'overwrite' },
  { aiKey: 'contact_profile', formKey: 'contact_profile', section: 'contact_location', kind: 'fact', merge: 'merge_object' },

  // ── Complex fields — handled manually in applyListingResult() ─────────────
  // country          — normalised against COUNTRY_NORM lookup
  // region           — normalised against REGION_OPTIONS[country] SELECT options
  // spaces[]         — ID injection + shape mapping
  // exclusive_use_*  — guarded by exclusive_use_enabled flag
  // faq_categories[] — guarded by faq_enabled flag, needs ID injection
  // nearby_items[]   — guarded by nearby_enabled flag, needs ID injection
  // video_urls[]     — mapped to media_items (different formKey + shape)
];

// ─── Listing apply function ───────────────────────────────────────────────────

function applyListingResult(result, enabledSections, mergeOnly, formData, onChange) {
  const r       = result;
  const enabled = enabledSections;

  // Normalise country/region once — used by both core and contact_location sections
  const countryKey       = normaliseCountry(r.country);
  const activeCountryKey = countryKey || formData.country || '';
  const normRegion       = r.region ? normaliseRegion(r.region, activeCountryKey) : '';

  // Write field only if AI has a value AND (not mergeOnly OR field is currently empty)
  const should = (formKey, aiVal) => !!aiVal && (!mergeOnly || isEmpty(formData[formKey]));

  // Core details
  if (enabled.core) {
    if (should('venue_name',  r.venue_name))  onChange('venue_name',  r.venue_name);
    if (should('city',        r.city))        onChange('city',        r.city);
    if (countryKey && (!mergeOnly || isEmpty(formData.country))) onChange('country', countryKey);
    if (normRegion && (!mergeOnly || isEmpty(formData.region)))  onChange('region',  normRegion);
    if (should('capacity',    r.capacity))    onChange('capacity',    String(r.capacity));
    if (should('price_range', r.price_range)) onChange('price_range', r.price_range);
  }

  // Description
  if (enabled.description) {
    if (should('summary',     r.summary))     onChange('summary',     r.summary);
    if (should('description', r.description)) onChange('description', r.description);
  }

  // Amenities
  if (enabled.amenities && should('amenities', r.amenities)) {
    onChange('amenities', r.amenities);
  }

  // Spaces
  if (enabled.spaces && r.spaces?.length && (!mergeOnly || isEmpty(formData.spaces))) {
    onChange('spaces', r.spaces.map((s, i) => ({
      id: `space-${Date.now()}-${i}`,
      name:              s.name               || '',
      type:              s.type               || 'other',
      description:       s.description        || '',
      capacityCeremony:  s.capacityCeremony   ?? null,
      capacityReception: s.capacityReception  ?? null,
      capacityDining:    s.capacityDining     ?? null,
      capacityStanding:  s.capacityStanding   ?? null,
      indoor:            s.indoor             ?? null,
      covered:           s.covered            ?? null,
      accessible:        null,
      img:               '',
      imgFile:           null,
      floorPlanFile:     null,
      floorPlanUrl:      '',
      sortOrder:         i,
    })));
  }

  // Rooms
  if (enabled.rooms) {
    if (should('rooms_total',       r.rooms_total))       onChange('rooms_total',       String(r.rooms_total));
    if (should('rooms_suites',      r.rooms_suites))      onChange('rooms_suites',      String(r.rooms_suites));
    if (should('rooms_max_guests',  r.rooms_max_guests))  onChange('rooms_max_guests',  String(r.rooms_max_guests));
    if (should('rooms_description', r.rooms_description)) onChange('rooms_description', r.rooms_description);
  }

  // Dining
  if (enabled.dining) {
    if (should('dining_style',       r.dining_style))       onChange('dining_style',       r.dining_style);
    if (should('dining_chef_name',   r.dining_chef_name))   onChange('dining_chef_name',   r.dining_chef_name);
    if (r.dining_in_house && (!mergeOnly || isEmpty(formData.dining_in_house))) onChange('dining_in_house', r.dining_in_house);
    if (should('dining_description', r.dining_description)) onChange('dining_description', r.dining_description);
  }

  // Exclusive Use
  if (enabled.exclusive_use && r.exclusive_use_enabled) {
    onChange('exclusive_use_enabled', true);
    if (should('exclusive_use_title',       r.exclusive_use_title))       onChange('exclusive_use_title',       r.exclusive_use_title);
    if (should('exclusive_use_price',       r.exclusive_use_price))       onChange('exclusive_use_price',       r.exclusive_use_price);
    if (should('exclusive_use_subline',     r.exclusive_use_subline))     onChange('exclusive_use_subline',     r.exclusive_use_subline);
    if (should('exclusive_use_description', r.exclusive_use_description)) onChange('exclusive_use_description', r.exclusive_use_description);
    if (r.exclusive_use_includes?.length && (!mergeOnly || isEmpty(formData.exclusive_use_includes))) {
      onChange('exclusive_use_includes', r.exclusive_use_includes);
    }
  }

  // FAQ
  if (enabled.faq && r.faq_enabled && r.faq_categories?.length && (!mergeOnly || isEmpty(formData.faq_categories))) {
    onChange('faq_enabled', true);
    onChange('faq_categories', r.faq_categories.map((cat, ci) => ({
      id:        `cat-${Date.now()}-${ci}`,
      icon:      ['I', 'II', 'III', 'IV'][ci] || 'I',
      category:  cat.category || '',
      sortOrder: ci,
      questions: (cat.questions || []).map((q, qi) => ({
        id:        `q-${Date.now()}-${ci}-${qi}`,
        q:         q.q || '',
        a:         q.a || '',
        sortOrder: qi,
      })),
    })));
  }

  // SEO
  if (enabled.seo) {
    if (should('seo_title',       r.seo_title))       onChange('seo_title',       r.seo_title);
    if (should('seo_description', r.seo_description)) onChange('seo_description', r.seo_description);
    if (r.seo_keywords?.length && (!mergeOnly || isEmpty(formData.seo_keywords))) {
      onChange('seo_keywords', r.seo_keywords);
    }
  }

  // Contact & Location
  if (enabled.contact_location) {
    if (should('address',       r.address))       onChange('address',       r.address);
    if (should('address_line2', r.address_line2)) onChange('address_line2', r.address_line2);
    if (should('postcode',      r.postcode))      onChange('postcode',      r.postcode);
    // City/region/country: only write if core section not enabled (avoid double-write)
    if (!enabled.core) {
      if (should('city', r.city)) onChange('city', r.city);
      if (countryKey && (!mergeOnly || isEmpty(formData.country))) onChange('country', countryKey);
      if (normRegion && (!mergeOnly || isEmpty(formData.region)))  onChange('region',  normRegion);
    }
    if (r.contact_profile) {
      const existing = formData.contact_profile || {};
      if (mergeOnly) {
        const merged = { ...existing };
        for (const [k, v] of Object.entries(r.contact_profile)) {
          if (v && isEmpty(existing[k])) merged[k] = v;
        }
        onChange('contact_profile', merged);
      } else {
        onChange('contact_profile', { ...existing, ...r.contact_profile });
      }
    }
  }

  // Nearby
  if (enabled.nearby && r.nearby_enabled && r.nearby_items?.length && (!mergeOnly || isEmpty(formData.nearby_items))) {
    onChange('nearby_enabled', true);
    onChange('nearby_items', r.nearby_items.map((item, i) => ({
      id:        `exp-${Date.now()}-${i}`,
      icon:      item.icon   || 'nature',
      title:     item.title  || '',
      status:    item.status || '',
      note:      item.note   || '',
      sortOrder: i,
    })));
  }

  // Videos → media_items
  if (enabled.videos && r.video_urls?.length) {
    const videoItems = r.video_urls.map((url, i) => ({
      id:               `video-import-${Date.now()}-${i}`,
      type:             'video',
      source_type:      url.includes('youtube') ? 'youtube' : url.includes('vimeo') ? 'vimeo' : 'external',
      url,
      title:            '',
      caption:          '',
      description:      '',
      credit_name:      '',
      credit_instagram: '',
      credit_website:   '',
      location:         '',
      tags:             [],
      sort_order:       (formData.media_items?.length || 0) + i,
      is_featured:      false,
    }));
    onChange('media_items', [...(formData.media_items || []), ...videoItems]);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

const AIImportPanel = ({ formData = {}, onChange, listingId = null, onClose }) => {
  const handleApply = (result, enabledSections, mergeOnly) => {
    applyListingResult(result, enabledSections, mergeOnly, formData, onChange);
  };

  return (
    <AIImportEngine
      functionName="ai-extract-listing"
      entityName={formData.venue_name || ''}
      entityType={formData.listing_type || 'venue'}
      entityId={listingId}
      reviewSections={LISTING_REVIEW_SECTIONS}
      emptyMessage="AI couldn't extract enough content from the source materials. Try adding more detailed files or paste the venue description."
      targetLabel="Listing"
      onApply={handleApply}
      onClose={onClose}
    />
  );
};

export default AIImportPanel;
