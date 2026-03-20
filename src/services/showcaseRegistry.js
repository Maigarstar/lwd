// ─── src/services/showcaseRegistry.js ────────────────────────────────────────
// Section Registry for the Showcase Studio system.
// Defines every section type: component mapping, required/optional fields,
// validation rules, default content shape, and preview fallback behaviour.
//
// LOCKED ARCHITECTURE — do not add section types without updating this registry.
// ─────────────────────────────────────────────────────────────────────────────

// ── Section type definitions ──────────────────────────────────────────────────

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
    defaultLayout: () => ({ variant: 'default' }),
    previewFallback: 'Four-image mosaic with editorial overlay',
  },

  gallery: {
    label:     'Image Gallery',
    icon:      '▦',
    required:  ['images'],
    optional:  ['title'],
    validation: {
      images: { min: 1 },
    },
    defaultContent: () => ({
      title:  '',
      images: [{ url: '', caption: '' }],
    }),
    defaultLayout: () => ({}),
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
      items: [],   // array of listing_id strings
    }),
    defaultLayout: () => ({}),
    previewFallback: 'Related venue suggestions — manual curation',
  },
};

// ── Ordered list for the section picker UI ────────────────────────────────────
export const SECTION_TYPE_ORDER = [
  'hero', 'stats', 'intro', 'feature', 'quote',
  'mosaic', 'gallery', 'dining', 'spaces', 'wellness',
  'weddings', 'image-full', 'cta', 'related',
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

  // Check required fields are non-empty
  for (const field of (reg.required || [])) {
    const val = c[field];
    const isEmpty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
    if (isEmpty) {
      errors.push({ field, message: `${field} is required for ${section.type}` });
    }
  }

  // Check array validations
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
// Rule: every template creates fully valid starter sections — no empty shells.

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
      { ...createSection('hero'),      content: { title: 'Your Hotel Name', tagline: 'A grand stage for extraordinary celebrations', image: '', overlay_opacity: 0.5 } },
      { ...createSection('intro'),     content: { eyebrow: 'The Hotel', headline: 'Architecture That Speaks Before a Word Is Said', body: 'Introduce the hotel — its history, architectural character, and the sense of occasion it creates from the moment of arrival.' } },
      { ...createSection('stats'),     content: { eyebrow: '', items: [{ value: '200', label: 'Max Guests', sublabel: '' }, { value: '6+', label: 'Event Spaces', sublabel: '' }, { value: '98', label: 'Rooms & Suites', sublabel: '' }] } },
      { ...createSection('spaces'),    content: { eyebrow: 'Event Spaces', headline: 'Ballrooms, Galleries, and Private Salons', body: 'Describe the event spaces — their character, capacity, natural light, and what type of celebration suits each.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
      { ...createSection('feature'),   content: { eyebrow: 'Weddings', headline: 'Celebrations Written in History', body: 'Describe the wedding offering — ceremony rooms, reception spaces, planning team, and what couples experience.', image: '' }, layout: { variant: 'image-right', accentBg: '#0f0e0c' } },
      { ...createSection('dining'),    content: { eyebrow: 'Dining', headline: 'Tables Worth Celebrating', body: 'Describe the culinary offering — restaurants, private dining rooms, wedding banquets, and the chef philosophy.', image: '' }, layout: { variant: 'image-left', accentBg: '#0f0e0c' } },
      { ...createSection('quote'),     content: { text: 'There is no other room in the city that could have given us this.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('cta'),       content: { headline: 'Reserve Your Date at the Grand', subline: 'Limited dates available for exclusive venue hire.', background: '', venueName: '' } },
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
      { ...createSection('intro'),     content: { eyebrow: 'The Estate', headline: 'A Castle That Belongs in a Wedding Story', body: 'Describe the castle and its grounds — the history, the approach, the feeling of arrival, and what makes it unmistakably romantic.' } },
      { ...createSection('feature'),   content: { eyebrow: 'The Grounds', headline: 'Ceremony Beneath Open Skies', body: 'Describe the outdoor and indoor ceremony options — the landscapes, gardens, courtyards, or chapel.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
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
      { ...createSection('intro'),     content: { eyebrow: 'The Villa', headline: 'Small Guest Lists. Unforgettable Moments.', body: 'Introduce the villa — its character, the sense of arrival, and why intimate celebrations here are something you cannot replicate at scale.' } },
      { ...createSection('feature'),   content: { eyebrow: 'The Setting', headline: 'A View Worth Falling in Love With', body: 'Describe the grounds, pool, terrace, views, and the atmosphere that makes the villa extraordinary.', image: '' }, layout: { variant: 'image-left', accentBg: '#1a1209' } },
      { ...createSection('mosaic'),    content: { title: 'Every Detail Considered', body: 'A setting designed for moments that matter.', images: [{ url: '', alt: 'Villa exterior' }, { url: '', alt: 'Pool terrace' }, { url: '', alt: 'Interior' }, { url: '', alt: 'Garden' }] } },
      { ...createSection('weddings'),  content: { eyebrow: 'Weddings', headline: 'Your Day, Your Way', body: 'Describe the wedding experience — flexibility, exclusivity, ceremony locations, and what couples love most about marrying here.', image: '' }, layout: { variant: 'image-right', accentBg: '#131c14' } },
      { ...createSection('quote'),     content: { text: 'We had always dreamed of a wedding that felt like us. This was it.', attribution: 'Recent Couple', attributionRole: '' }, layout: { variant: 'centered', accentBg: '#1a1209' } },
      { ...createSection('cta'),       content: { headline: 'Enquire About Your Date', subline: 'The villa hosts a limited number of weddings each year.', background: '', venueName: '' } },
    ],
  },
};

// ── Helper: get template sections (returns fresh array each call) ──────────────
export function getTemplateSections(templateKey) {
  const tmpl = SHOWCASE_TEMPLATES[templateKey];
  if (!tmpl) return [];
  return tmpl.sections();
}
