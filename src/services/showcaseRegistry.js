// ─── src/services/showcaseRegistry.js ────────────────────────────────────────
// Section Registry for the Showcase Studio system.
// Defines every section type: component mapping, required/optional fields,
// validation rules, default content shape, and preview fallback behaviour.
//
// LOCKED ARCHITECTURE — do not add section types without updating this registry.
//
// VARIANT SYSTEM
// Most section types support a layout.variant field that controls visual style.
// Always drive visual differences through type + content + layout.
// Never add per-venue conditional logic to the renderer.
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_REGISTRY = {

  hero: {
    label:     'Hero',
    icon:      '◈',
    required:  ['title', 'image'],
    optional:  ['tagline', 'overlay_opacity'],
    validation: {},
    defaultContent: () => ({
      title:           '',
      tagline:         '',
      image:           '',
      overlay_opacity: 0.45,
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Cinematic full-screen hero section',
  },

  stats: {
    label:     'Key Stats',
    icon:      '◆',
    // layout.variant: 'strip' | 'table'
    // strip — horizontal bar of large numbers (default)
    // table — key-value rows, editorial register, useful for detailed specs
    required:  ['items'],
    optional:  ['eyebrow', 'variant'],
    validation: {
      items: { min: 2, max: 6, eachRequires: ['value', 'label'] },
    },
    defaultContent: () => ({
      eyebrow: '',
      items: [
        { value: '', label: '', sublabel: '' },
        { value: '', label: '', sublabel: '' },
        { value: '', label: '', sublabel: '' },
      ],
    }),
    defaultLayout: () => ({ variant: 'strip', accentBg: '#1a1209' }),
    previewFallback: 'Venue key statistics strip',
  },

  intro: {
    label:     'Editorial Intro',
    icon:      '¶',
    // layout.variant: 'centered' | 'left-aligned' | 'narrow'
    // centered     — heading + body centred, full-width dark/light block (default)
    // left-aligned — heading left, body flows naturally, more editorial/newspaper
    // narrow       — constrained max-width ~640px, intimate feel, cream bg
    required:  ['headline', 'body'],
    optional:  ['eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  '',
      headline: '',
      body:     '',
    }),
    defaultLayout: () => ({ variant: 'centered', accentBg: '#0f0e0c' }),
    previewFallback: 'Editorial introduction — headline and opening paragraph',
  },

  feature: {
    label:     'Feature Section',
    icon:      '▣',
    // layout.variant: 'image-left' | 'image-right' | 'dark-block' | 'centered'
    // image-left   — 60% image left, 40% dark text panel right (default)
    // image-right  — 40% dark text panel left, 60% image right
    // dark-block   — full-width dark storytelling block, image optional below text
    // centered     — image behind as background, text centred with overlay
    required:  ['headline', 'image'],
    optional:  ['body', 'eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  '',
      headline: '',
      body:     '',
      image:    '',
    }),
    defaultLayout: () => ({ variant: 'image-left', accentBg: '#1a1209' }),
    previewFallback: 'Split-screen editorial feature — 60% image, 40% text panel',
  },

  'highlight-band': {
    label:     'Highlight Band',
    icon:      '◼',
    // Full-width dark (or light) storytelling block.
    // Used for emotional emphasis, narrative transitions, brand statements.
    // Examples: "A Standard of Unparalleled Elegance", pre-section atmosphere builders.
    // layout.theme: 'dark' | 'light' — overrides accentBg auto-detection
    // layout.align: 'center' | 'left' — text alignment (default: center)
    // layout.size: 'standard' | 'large' — heading size (large for impact moments)
    required:  ['headline'],
    optional:  ['eyebrow', 'body', 'divider'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  '',
      headline: '',
      body:     '',
      divider:  true,
    }),
    defaultLayout: () => ({ accentBg: '#0f0e0c', theme: 'dark', align: 'center', size: 'standard' }),
    previewFallback: 'Dark luxury storytelling band — emotional emphasis and narrative transitions',
  },

  quote: {
    label:     'Pull Quote',
    icon:      '"',
    required:  ['text'],
    optional:  ['attribution', 'attributionRole', 'image'],
    validation: {},
    defaultContent: () => ({
      text:            '',
      attribution:     '',
      attributionRole: '',
      image:           '',
    }),
    defaultLayout: () => ({ variant: 'centered', accentBg: '#1a1209' }),
    previewFallback: 'Editorial pull quote with decorative quotation mark',
  },

  mosaic: {
    label:     'Mosaic Gallery',
    icon:      '⊞',
    // layout.pattern: 'grid' | 'asymmetrical' | 'stacked'
    // grid          — 2×2 equal grid (default)
    // asymmetrical  — 1 large portrait left + 2 stacked right (dramatic 2+1)
    // stacked       — 4 images in a vertical column strip (editorial pacing)
    required:  ['images'],
    optional:  ['title', 'body'],
    validation: {
      images: { min: 2, max: 4 },
    },
    defaultContent: () => ({
      title:  '',
      body:   '',
      images: [
        { url: '', alt: '' },
        { url: '', alt: '' },
        { url: '', alt: '' },
        { url: '', alt: '' },
      ],
    }),
    defaultLayout: () => ({ pattern: 'grid' }),
    previewFallback: 'Four-image mosaic with editorial overlay',
  },

  gallery: {
    label:     'Image Gallery',
    icon:      '▦',
    // layout.variant: 'carousel' | 'grid' | 'mixed'
    // carousel — horizontal scroll carousel (default)
    // grid     — 2+2 or 3-col responsive image grid
    // mixed    — featured hero image above + carousel strip below
    required:  ['images'],
    optional:  ['title'],
    validation: {
      images: { min: 1 },
    },
    defaultContent: () => ({
      title:  '',
      images: [{ url: '', caption: '' }],
    }),
    defaultLayout: () => ({ variant: 'carousel' }),
    previewFallback: 'Horizontal image carousel',
  },

  dining: {
    label:     'Dining',
    icon:      '◉',
    required:  ['headline'],
    optional:  ['body', 'image', 'eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  'Dining',
      headline: '',
      body:     '',
      image:    '',
    }),
    defaultLayout: () => ({ variant: 'image-right', accentBg: '#0f0e0c' }),
    previewFallback: 'Dining section — culinary story and imagery',
  },

  spaces: {
    label:     'Event Spaces',
    icon:      '⊡',
    required:  ['headline'],
    optional:  ['body', 'image', 'eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  'Event Spaces',
      headline: '',
      body:     '',
      image:    '',
    }),
    defaultLayout: () => ({ variant: 'image-left', accentBg: '#1a1209' }),
    previewFallback: 'Event spaces and capacity section',
  },

  wellness: {
    label:     'Wellness & Spa',
    icon:      '✦',
    required:  ['headline'],
    optional:  ['body', 'image', 'eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  'Wellness',
      headline: '',
      body:     '',
      image:    '',
    }),
    defaultLayout: () => ({ variant: 'image-right', accentBg: '#0f0e0c' }),
    previewFallback: 'Wellness and spa section',
  },

  weddings: {
    label:     'Weddings',
    icon:      '◇',
    required:  ['headline'],
    optional:  ['body', 'image', 'eyebrow'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  'Weddings',
      headline: '',
      body:     '',
      image:    '',
    }),
    defaultLayout: () => ({ variant: 'image-left', accentBg: '#131c14' }),
    previewFallback: 'Wedding story and ceremony imagery',
  },

  'image-full': {
    label:     'Full-Width Image',
    icon:      '▭',
    required:  ['url'],
    optional:  ['alt', 'caption', 'height'],
    validation: {},
    defaultContent: () => ({
      url:     '',
      alt:     '',
      caption: '',
      height:  '60vh',
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Full-width cinematic image break',
  },

  cta: {
    label:     'Enquiry CTA',
    icon:      '⊛',
    required:  ['headline'],
    optional:  ['subline', 'background', 'venueName'],
    validation: {},
    defaultContent: () => ({
      headline:   '',
      subline:    '',
      background: '',
      venueName:  '',
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Full-width enquiry call to action',
  },

  related: {
    label:     'Related Venues',
    icon:      '⊕',
    required:  ['items'],
    optional:  ['title'],
    validation: {
      items: { max: 3 },
    },
    defaultContent: () => ({
      title: 'You may also love',
      items: [],
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Related venue suggestions — manual curation',
  },

  pricing: {
    label:     'Pricing',
    icon:      '£',
    // Full pricing breakdown with includes/excludes lists and editorial guidance.
    // price_from:    starting price (e.g. "£1,500,000")
    // typical_min/max: range for typical total spend
    // includes/excludes: arrays of strings
    // guidance: closing editorial paragraph
    required:  ['headline'],
    optional:  ['eyebrow', 'body', 'price_from', 'price_context', 'typical_min', 'typical_max', 'typical_label', 'includes', 'excludes', 'guidance'],
    validation: {},
    defaultContent: () => ({
      eyebrow:       'Pricing & What to Expect',
      headline:      '',
      body:          '',
      price_from:    '',
      price_context: 'Venue hire from',
      typical_min:   '',
      typical_max:   '',
      typical_label: 'Typical total investment',
      includes:      [],
      excludes:      [],
      guidance:      '',
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Pricing section — venue hire, typical investment, includes/excludes, editorial guidance',
  },

  verified: {
    label:     'At a Glance',
    icon:      '✓',
    // Structured venue intelligence summary — capacity, pricing, style, best-for.
    // Displayed as a 2-column key-value grid with a verified date badge.
    required:  ['headline'],
    optional:  ['eyebrow', 'venue_hire_from', 'typical_spend_min', 'typical_spend_max', 'ceremony_capacity', 'dining_capacity', 'reception_capacity', 'bedrooms', 'exclusive_use', 'catering', 'outdoor_ceremony', 'accommodation', 'location_summary', 'style', 'best_for', 'verified_date', 'verification_notes'],
    validation: {},
    defaultContent: () => ({
      eyebrow:            'At a Glance',
      headline:           'Venue Intelligence',
      venue_hire_from:    '',
      typical_spend_min:  '',
      typical_spend_max:  '',
      ceremony_capacity:  '',
      dining_capacity:    '',
      reception_capacity: '',
      bedrooms:           '',
      exclusive_use:      '',
      catering:           '',
      outdoor_ceremony:   '',
      accommodation:      '',
      location_summary:   '',
      style:              '',
      best_for:           '',
      verified_date:      '',
      verification_notes: '',
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Verified venue intelligence — structured capacity, pricing, and style summary',
  },

  films: {
    label:     'Films',
    icon:      '▶',
    // Video gallery section — uses VideoGallery component.
    // Each video: { id, youtubeId?, vimeoId?, title, thumb, duration?, type? }
    required:  [],
    optional:  ['eyebrow', 'videos'],
    validation: {},
    defaultContent: () => ({
      eyebrow: 'Films',
      videos:  [],
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Video gallery — wedding films, estate tours and highlights',
  },

  faq: {
    label:     'FAQs',
    icon:      '?',
    // FAQ accordion section — collapses by default, JSON-LD FAQPage schema on mount.
    // Each faq item: { question: string, answer: string }
    required:  [],
    optional:  ['eyebrow', 'headline', 'faqs'],
    validation: {},
    defaultContent: () => ({
      eyebrow:  'Frequently Asked Questions',
      headline: '',
      faqs: [
        { question: 'What is the maximum capacity?', answer: '' },
        { question: 'Is exclusive use available?',  answer: '' },
      ],
    }),
    defaultLayout: () => ({}),
    previewFallback: 'FAQ accordion — questions and answers with JSON-LD schema',
  },
};

// ── Ordered list for the section picker UI ────────────────────────────────────
export const SECTION_TYPE_ORDER = [
  'hero', 'stats', 'intro', 'highlight-band', 'feature', 'quote',
  'mosaic', 'gallery', 'films', 'dining', 'spaces', 'wellness',
  'weddings', 'faq', 'pricing', 'verified', 'image-full', 'cta', 'related',
];

// ── Create a fresh section with defaults ──────────────────────────────────────
export function createSection(type) {
  const reg = SECTION_REGISTRY[type];
  if (!reg) throw new Error(`Unknown section type: ${type}`);
  return {
    id:      crypto.randomUUID(),
    type,
    content: reg.defaultContent(),
    layout:  reg.defaultLayout(),
  };
}

// ── Validate a section against its registry rules ─────────────────────────────
export function validateSection(section) {
  const reg = SECTION_REGISTRY[section.type];
  if (!reg) return [{ field: 'type', message: 'Unknown section type' }];

  const errors = [];
  const c = section.content || {};

  for (const field of (reg.required || [])) {
    const val = c[field];
    const isEmpty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
    if (isEmpty) {
      errors.push({ field, message: `${field} is required for ${section.type}` });
    }
  }

  const v = reg.validation || {};
  for (const [field, rules] of Object.entries(v)) {
    const arr = c[field];
    if (!Array.isArray(arr)) continue;
    if (rules.min && arr.length < rules.min) {
      errors.push({ field, message: `${field} requires at least ${rules.min} item(s)` });
    }
    if (rules.max && arr.length > rules.max) {
      errors.push({ field, message: `${field} allows a maximum of ${rules.max} item(s)` });
    }
    if (rules.eachRequires) {
      arr.forEach((item, i) => {
        for (const req of rules.eachRequires) {
          if (!item[req]) {
            errors.push({ field, message: `Item ${i + 1}: ${req} is required` });
          }
        }
      });
    }
  }

  return errors;
}

// ── Validate all sections in a showcase (returns map of id → errors) ──────────
export function validateShowcase(sections) {
  const result = {};
  let hasErrors = false;
  for (const s of sections) {
    const errs = validateSection(s);
    if (errs.length) {
      result[s.id] = errs;
      hasErrors = true;
    }
  }
  return { errors: result, hasErrors };
}

// ── Template definitions ───────────────────────────────────────────────────────
export const SHOWCASE_TEMPLATES = {

  island_resort: {
    key:   'island_resort',
    label: 'Island Resort',
    description: 'Private island or remote tropical destination. Strong on wellness, barefoot luxury, and exclusivity.',
    icon:  '🏝',
    theme: 'dark',
    sections: () => [
      { ...createSection('hero'),      content: { title: 'Your Venue Name', tagline: 'A private island sanctuary where nature meets barefoot luxury', image: '', overlay_opacity: 0.45 } },
      { ...createSection('stats'),     content: { eyebrow: 'The Numbers', items: [{ value: '40', label: 'Private Villas', sublabel: 'overwater & beachfront' }, { value: '100', label: 'Max Guests', sublabel: 'for celebrations' }, { value: '100%', label: 'Private Island', sublabel: 'exclusively yours' }, { value: '5 km', label: 'From Mainland', sublabel: '' }] } },
      { ...createSection('intro'),     content: { eyebrow: 'The Island', headline: 'A Complete Private Retreat', body: 'Describe the island setting, the arrival experience, and what makes this venue unique as a wedding destination.' } },
      { ...createSection('feature'),   content: { eyebrow: 'The Villas', headline: 'Overwater Seclusion', body: 'Describe the accommodation — villa types, private pools, views, and the sense of space guests experience.', image: '' }, layout: { variant: 'image-left', accentBg: '#0f0e0c' } },
      { ...createSection('mosaic'),    content: { title: 'Island Life', body: 'Where every view is yours alone.', images: [{ url: '', alt: 'Aerial view' }, { url: '', alt: 'Villa at sunset' }, { url: '', alt: 'Pool deck' }, { url: '', alt: 'Ocean views' }] } },
      { ...createSection('weddings'),  content: { eyebrow: 'Weddings', headline: 'An Island to Yourselves', body: 'Describe the wedding experience — ceremony locations, how many guests, what makes a celebration here unforgettable.', image: '' }, layout: { variant: 'image-right', accentBg: '#131c14' } },
      { ...createSection('quote'),     content: { text: 'The moment we arrived, we knew. This was the only place in the world for our wedding.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('dining'),    content: { eyebrow: 'Dining', headline: 'Chef-Driven, Island-Inspired', body: 'Describe the dining philosophy, signature restaurants, private dining options, and culinary highlights.', image: '' }, layout: { variant: 'image-left', accentBg: '#0f0e0c' } },
      { ...createSection('wellness'),  content: { eyebrow: 'Wellness', headline: 'A Spa Built on Island Healing', body: 'Describe the spa, wellness philosophy, treatments, and how it complements the wedding journey.', image: '' }, layout: { variant: 'image-right', accentBg: '#0f0e0c' } },
      { ...createSection('cta'),       content: { headline: 'Begin Your Island Wedding Story', subline: 'Our team is ready to design something extraordinary around you.', background: '', venueName: '' } },
    ],
  },

  grand_hotel: {
    key:   'grand_hotel',
    label: 'Grand Hotel',
    description: 'Historic grand hotel or palace property. Emphasises architectural grandeur, impeccable service, and legacy.',
    icon:  '🏛',
    theme: 'dark',
    sections: () => [
      { ...createSection('hero'),            content: { title: 'Your Hotel Name', tagline: 'A grand stage for extraordinary celebrations', image: '', overlay_opacity: 0.5 } },
      { ...createSection('intro'),           content: { eyebrow: 'The Hotel', headline: 'Architecture That Speaks Before a Word Is Said', body: 'Introduce the hotel — its history, architectural character, and the sense of occasion it creates from the moment of arrival.' }, layout: { variant: 'centered', accentBg: '#0f0e0c' } },
      { ...createSection('stats'),           content: { eyebrow: '', items: [{ value: '200', label: 'Max Guests', sublabel: '' }, { value: '6+', label: 'Event Spaces', sublabel: '' }, { value: '98', label: 'Rooms & Suites', sublabel: '' }] } },
      { ...createSection('highlight-band'), content: { eyebrow: 'The Standard', headline: 'A Standard of Unparalleled Elegance', body: 'Every detail considered. Every moment orchestrated. Every guest attended to as if they were the only one.', divider: true }, layout: { accentBg: '#0a0a08', theme: 'dark', align: 'center', size: 'large' } },
      { ...createSection('spaces'),          content: { eyebrow: 'Event Spaces', headline: 'Ballrooms, Galleries, and Private Salons', body: 'Describe the event spaces — their character, capacity, natural light, and what type of celebration suits each.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
      { ...createSection('feature'),         content: { eyebrow: 'Weddings', headline: 'Celebrations Written in History', body: 'Describe the wedding offering — ceremony rooms, reception spaces, planning team, and what couples experience.', image: '' }, layout: { variant: 'image-right', accentBg: '#0f0e0c' } },
      { ...createSection('dining'),          content: { eyebrow: 'Dining', headline: 'Tables Worth Celebrating', body: 'Describe the culinary offering — restaurants, private dining rooms, wedding banquets, and the chef philosophy.', image: '' }, layout: { variant: 'image-left', accentBg: '#0f0e0c' } },
      { ...createSection('quote'),           content: { text: 'There is no other room in the city that could have given us this.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('cta'),             content: { headline: 'Reserve Your Date at the Grand', subline: 'Limited dates available for exclusive venue hire.', background: '', venueName: '' } },
    ],
  },

  castle_wedding: {
    key:   'castle_wedding',
    label: 'Castle Wedding',
    description: 'Historic castle, estate, or stately home. Emphasis on heritage, romance, and dramatic landscape.',
    icon:  '🏰',
    theme: 'dark',
    sections: () => [
      { ...createSection('hero'),      content: { title: 'Your Castle Name', tagline: 'Where heritage meets romance in the heart of the countryside', image: '', overlay_opacity: 0.5 } },
      { ...createSection('intro'),     content: { eyebrow: 'The Estate', headline: 'A Castle That Belongs in a Wedding Story', body: 'Describe the castle and its grounds — the history, the approach, the feeling of arrival, and what makes it unmistakably romantic.' }, layout: { variant: 'left-aligned', accentBg: '#1a1209' } },
      { ...createSection('feature'),   content: { eyebrow: 'The Grounds', headline: 'Ceremony Beneath Open Skies', body: 'Describe the outdoor and indoor ceremony options — the landscapes, gardens, courtyards, or chapel.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
      { ...createSection('highlight-band'), content: { eyebrow: '', headline: 'Some places carry centuries of love stories. Yours begins here.', body: '', divider: false }, layout: { accentBg: '#0a0a08', theme: 'dark', align: 'center', size: 'large' } },
      { ...createSection('quote'),     content: { text: 'Walking through those gates on our wedding morning, I understood what people meant by once in a lifetime.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('spaces'),    content: { eyebrow: 'Reception Spaces', headline: 'Grand Halls, Intimate Drawing Rooms', body: 'Describe the reception options — great halls, banqueting rooms, private dining spaces, and outdoor terraces.', image: '' }, layout: { variant: 'image-right', accentBg: '#0f0e0c' } },
      { ...createSection('dining'),    content: { eyebrow: 'Dining', headline: 'A Feast Worthy of the Setting', body: 'Describe the catering approach — estate produce, private chef partnerships, or preferred caterer relationships.', image: '' }, layout: { variant: 'image-left', accentBg: '#0f0e0c' } },
      { ...createSection('cta'),       content: { headline: 'Begin Your Castle Wedding Story', subline: 'A rare setting deserves an extraordinary event.', background: '', venueName: '' } },
    ],
  },

  intimate_villa: {
    key:   'intimate_villa',
    label: 'Intimate Villa',
    description: 'Boutique villa or private estate for smaller, immersive celebrations. Emphasises exclusivity, setting, and personal service.',
    icon:  '🏡',
    theme: 'dark',
    sections: () => [
      { ...createSection('hero'),      content: { title: 'Your Villa Name', tagline: 'An intimate estate for celebrations that feel entirely yours', image: '', overlay_opacity: 0.45 } },
      { ...createSection('stats'),     content: { eyebrow: '', items: [{ value: '50', label: 'Max Guests', sublabel: 'intimate celebrations' }, { value: 'Private', label: 'Estate', sublabel: 'exclusively yours' }, { value: '7', label: 'Bedrooms', sublabel: '' }] } },
      { ...createSection('intro'),     content: { eyebrow: 'The Villa', headline: 'Small Guest Lists. Unforgettable Moments.', body: 'Introduce the villa — its character, the sense of arrival, and why intimate celebrations here are something you cannot replicate at scale.' }, layout: { variant: 'narrow', accentBg: '#1a1209' } },
      { ...createSection('feature'),   content: { eyebrow: 'The Setting', headline: 'A View Worth Falling in Love With', body: 'Describe the grounds, pool, terrace, views, and the atmosphere that makes the villa extraordinary.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
      { ...createSection('mosaic'),    content: { title: 'Every Detail Considered', body: 'A setting designed for moments that matter.', images: [{ url: '', alt: 'Villa exterior' }, { url: '', alt: 'Pool terrace' }, { url: '', alt: 'Interior' }, { url: '', alt: 'Garden' }] }, layout: { pattern: 'asymmetrical' } },
      { ...createSection('weddings'),  content: { eyebrow: 'Weddings', headline: 'Your Day, Your Way', body: 'Describe the wedding experience — flexibility, exclusivity, ceremony locations, and what couples love most about marrying here.', image: '' }, layout: { variant: 'image-right', accentBg: '#131c14' } },
      { ...createSection('quote'),     content: { text: 'We had always dreamed of a wedding that felt like us. This was it.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('cta'),       content: { headline: 'Enquire About Your Date', subline: 'The villa hosts a limited number of weddings each year.', background: '', venueName: '' } },
    ],
  },

  luxury_london_hotel: {
    key:   'luxury_london_hotel',
    label: 'Luxury London Hotel',
    description: 'Five-star London hotel with Michelin dining, royal warrant, and iconic address. The Ritz-style editorial layout with highlight bands, dark dining section, and cream wedding section.',
    icon:  '👑',
    theme: 'light',
    sections: () => [
      { ...createSection('hero'),           content: { title: 'Your Hotel Name', tagline: '150 [Street] · [District] · London · Est. [Year]', image: '', overlay_opacity: 0.5 } },
      { ...createSection('gallery'),        content: { title: 'Your Hotel Name', images: [{ url: '', caption: '' }, { url: '', caption: '' }, { url: '', caption: '' }, { url: '', caption: '' }] }, layout: { variant: 'grid' } },
      { ...createSection('intro'),          content: { eyebrow: '[District] · London · Est. [Year]', headline: "London's [Superlative] Address", body: 'Introduce the hotel — its history, address, defining characteristics, and what places it in a category of its own.' }, layout: { variant: 'left-aligned', accentBg: '#faf9f6' } },
      { ...createSection('stats'),          content: { eyebrow: '', items: [{ value: '136', label: 'Rooms & Suites', sublabel: '' }, { value: '1906', label: 'Established', sublabel: '' }, { value: '★★', label: 'Michelin Stars', sublabel: '' }, { value: 'Royal', label: 'Warrant', sublabel: '' }] }, layout: { variant: 'strip', accentBg: '#ffffff' } },
      { ...createSection('feature'),        content: { eyebrow: 'The Story', headline: 'A Standard of Extraordinary', body: 'The deeper narrative — what this hotel stands for, who it serves, and why it has endured. The values behind the façade.', image: '' }, layout: { variant: 'image-left', accentBg: '#faf9f6' } },
      { ...createSection('highlight-band'), content: { eyebrow: 'Accommodation', headline: '[N] Rooms. [Superlative] in the Heart of London.', body: 'Describe the rooms — the design inspiration, materials, details, and the sense of sanctuary each one creates.', divider: true }, layout: { accentBg: '#ffffff', theme: 'light', align: 'left', size: 'standard' } },
      { ...createSection('feature'),        content: { eyebrow: 'Deluxe Rooms · [Service Included]', headline: 'Rooms of Extraordinary Refinement', body: 'Describe the standard rooms — their design, views, and service.', image: '' }, layout: { variant: 'image-left', accentBg: '#1C1828' } },
      { ...createSection('feature'),        content: { eyebrow: 'Suites · [Flagship Suite Name]', headline: 'The [Flagship Suite]', body: 'Describe the suites — their scale, identity, and the story of who has stayed in them.', image: '' }, layout: { variant: 'image-right', accentBg: '#130f1e' } },
      { ...createSection('mosaic'),         content: { title: 'Every Room a Private World', body: 'The details that define every room.', images: [{ url: '', alt: '' }, { url: '', alt: '' }, { url: '', alt: '' }, { url: '', alt: '' }] }, layout: { pattern: 'grid' } },
      { ...createSection('highlight-band'), content: { eyebrow: 'Dining · [Awards] · [Restaurants]', headline: 'A Kitchen That Defines London', body: 'The dining philosophy — awards, chefs, restaurants, and what makes the table here an experience in its own right.', divider: true }, layout: { accentBg: '#1C1828', theme: 'dark', align: 'left', size: 'large' } },
      { ...createSection('dining'),         content: { eyebrow: '[Restaurant Name] · [Awards] · [Chef]', headline: 'The Most Beautiful Dining Room in the City', body: 'The flagship restaurant — describe the room, the chef, the menu philosophy, and what makes a table here a complete occasion.', image: '' }, layout: { variant: 'image-right', accentBg: '#1a1525' } },
      { ...createSection('quote'),          content: { text: '[Founder or iconic figure quote about the hotel]', attribution: '[Name]', attributionRole: '[Title, Year]' }, layout: { variant: 'centered', accentBg: '#130f1e' } },
      { ...createSection('image-full'),     content: { url: '', alt: '[Iconic space name]', caption: '[Iconic space name] · [One line]', height: '400px' }, layout: {} },
      { ...createSection('highlight-band'), content: { eyebrow: 'Weddings & Private Celebrations', headline: "London's Most Celebrated Wedding Address", body: 'The opening statement for the weddings section — what makes a wedding here singular.', divider: true }, layout: { accentBg: '#faf9f6', theme: 'light', align: 'center', size: 'large' } },
      { ...createSection('image-full'),     content: { url: '', alt: 'Wedding at [Hotel Name]', height: '520px' }, layout: {} },
      { ...createSection('weddings'),       content: { eyebrow: '[Wedding Room] · Private Dining & Celebrations', headline: 'An Occasion Unlike Any Other', body: 'The wedding experience — the private dining room, the planning team, the menu, the florals. Every detail.', image: '' }, layout: { variant: 'image-right', accentBg: '#f5f0e8' } },
      { ...createSection('mosaic'),         content: { title: '', body: '', images: [{ url: '', alt: 'Wedding ceremony' }, { url: '', alt: 'Wedding couple' }, { url: '', alt: 'Wedding setup' }, { url: '', alt: 'Wedding detail' }] }, layout: { pattern: 'asymmetrical' } },
      { ...createSection('cta'),            content: { headline: 'Begin Your [Hotel Name] Wedding Story', subline: 'Contact our dedicated wedding team to arrange a private consultation.', background: '', venueName: '' } },
    ],
  },
  luxury_venue_inc_video: {
    key:   'luxury_venue_inc_video',
    label: 'Luxury Venue-inc-Video',
    description: 'Full-format luxury resort or destination venue. Hero with address + stats, At a Glance, Weddings, Feature, two Gallery sections, inline Film player, Spaces, Wellness, Understanding the Investment, and Enquiry form. Use for hotels, resorts, and large-scale destination venues with video content.',
    icon:  '▶',
    theme: 'light',
    sections: () => [
      {
        ...createSection('hero'),
        content: {
          eyebrow:  'Destination · Country',
          title:    'Your Venue Name',
          address:  'Street Address · City · Region',
          tagline:  'A single evocative sentence that captures the spirit of this venue and why couples choose it.',
          image:    '',
          overlay_opacity: 0.40,
          stats: [
            { value: '000',     label: 'Rooms & Suites' },
            { value: '00,000',  label: 'Sq Metres Estate' },
            { value: '000',     label: 'Wedding Guests' },
            { value: '',        label: 'Signature Feature' },
          ],
        },
      },
      {
        ...createSection('verified'),
        content: {
          eyebrow:           'At a Glance',
          headline:          'Your Venue Name',
          ceremony_capacity: '000 (Main Hall) · Outdoor option',
          dining_capacity:   '000',
          reception_capacity:'000',
          bedrooms:          'Describe room types and count',
          exclusive_use:     'Available on request',
          catering:          'in_house_only',
          outdoor_ceremony:  true,
          accommodation:     true,
          location_summary:  'City, Region, Country',
          style:             'Describe the style and concept',
          best_for:          'Destination weddings, large celebrations',
          verified_date:     '',
        },
      },
      {
        ...createSection('weddings'),
        content: {
          eyebrow:  'Ceremonies',
          headline: 'Your Perfect Setting',
          body:     'Describe the ceremony options — indoor and outdoor, capacities, what makes each setting special, and the moments couples remember most.',
          image:    '',
        },
        layout: { variant: 'image-right', accentBg: '#ffffff' },
      },
      {
        ...createSection('feature'),
        content: {
          eyebrow:  'Tailored Perfection',
          headline: 'Crafted by Expert Hands',
          body:     'Describe the planning team, bespoke services, culinary offering, and how the venue makes every celebration feel uniquely personal.',
          image:    '',
        },
        layout: { variant: 'image-left', accentBg: '#f5f7fc' },
      },
      {
        ...createSection('gallery'),
        content: {
          title:  'The Estate',
          images: [
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
          ],
        },
      },
      {
        ...createSection('films'),
        content: {
          eyebrow: 'Films',
          videos: [
            {
              id:         'film-1',
              youtubeId:  '',
              title:      'Venue Name — Wedding Film',
              thumb:      '',
              duration:   '',
              type:       'wedding',
            },
          ],
        },
      },
      {
        ...createSection('spaces'),
        content: {
          eyebrow:  'Stay',
          headline: 'Luxury Reimagined',
          body:     'Describe the accommodation — room categories, suite highlights, views, and what the all-inclusive or overnight experience means for wedding guests.',
          image:    '',
        },
        layout: { variant: 'image-right', accentBg: '#ffffff' },
      },
      {
        ...createSection('wellness'),
        content: {
          eyebrow:  'Experience',
          headline: 'Entertainment & Exquisite Experiences',
          body:     'Describe the spa, entertainment, unique experiences — what guests do beyond the ceremony to make the whole celebration memorable.',
          image:    '',
        },
        layout: { variant: 'image-left', accentBg: '#f5f7fc' },
      },
      {
        ...createSection('gallery'),
        content: {
          title:  'Rooms & Details',
          images: [
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
            { url: '', caption: '' },
          ],
        },
      },
      {
        ...createSection('pricing'),
        content: {
          eyebrow:  'Investment',
          headline: 'Understanding the Investment',
          guidance: 'Describe the pricing model — all-inclusive, bespoke packages, minimum spends. Give context so couples understand what shapes the investment.',
          includes: [
            'Full venue hire for ceremony and reception',
            'Accommodation for all guests',
            'Dedicated wedding planning specialists',
            'Gourmet dining and premium beverages',
            'Entertainment and evening programming',
            'Spa, wellness and leisure access',
          ],
          excludes: [
            'International travel and transfers',
            'Bespoke floral and décor upgrades',
            'Private excursions and special experiences',
            'Premium spirits and fine wine upgrades',
          ],
        },
      },
      {
        ...createSection('cta'),
        content: {
          headline:  'Begin Your Story at [Venue Name]',
          subline:   'Speak with our dedicated wedding specialists to start planning your celebration.',
          venueName: '',
        },
      },
    ],
  },

};

// ── Helper: get template sections (returns fresh array each call) ──────────────
export function getTemplateSections(templateKey) {
  const tmpl = SHOWCASE_TEMPLATES[templateKey];
  if (!tmpl) return [];
  return tmpl.sections();
}
