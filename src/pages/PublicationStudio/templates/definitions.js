import { PALETTES } from './palettes';

// ── 6 new template definitions (Editor's Letter, About, Back Cover, Ads) ────
// Kept as named const exports so they can be imported individually for tests or
// thumbnail generation scripts. The final TEMPLATES array interleaves them
// with the existing 18 entries in a magazine-reading order.
const EDITORS_LETTER_TEMPLATE = {
  id: 'editors-letter',
  name: "Editor's Letter",
  category: "Editor's Letter",
  palette: 'ivory',
  description: 'Circular portrait and editor\'s address — the issue\'s opening voice.',
  fields: [
    { id: 'portrait',    type: 'image',    label: 'Editor Portrait', required: true, hint: 'Head-and-shoulders portrait works best' },
    { id: 'kicker',      type: 'text',     label: 'Kicker',           default: 'FROM THE EDITOR' },
    { id: 'headline',    type: 'text',     label: 'Letter Headline',  default: 'A Season of Grace' },
    { id: 'body',        type: 'textarea', label: 'Letter Body',      hint: '4–5 short paragraphs', maxLength: 1400 },
    { id: 'signature',   type: 'text',     label: 'Signature Name',   default: 'Charlotte Ashford' },
    { id: 'title_line',  type: 'text',     label: 'Title Line',       default: 'EDITOR-IN-CHIEF' },
  ],
};

const ABOUT_PAGE_TEMPLATE = {
  id: 'about-page',
  name: 'About Page',
  category: 'About Page',
  palette: 'obsidian',
  description: 'Dark mission statement page with three columns of values.',
  fields: [
    { id: 'brand_mark',  type: 'text',     label: 'Brand Mark',  default: 'LUXURY WEDDING DIRECTORY' },
    { id: 'hero',        type: 'text',     label: 'Hero Title',  default: 'Our Story' },
    { id: 'lede',        type: 'textarea', label: 'Lede',        maxLength: 280 },
    { id: 'pillar1',     type: 'text',     label: 'Pillar 1',    default: 'Curation' },
    { id: 'pillar1_body',type: 'textarea', label: 'Pillar 1 body', maxLength: 220 },
    { id: 'pillar2',     type: 'text',     label: 'Pillar 2',    default: 'Craft' },
    { id: 'pillar2_body',type: 'textarea', label: 'Pillar 2 body', maxLength: 220 },
    { id: 'pillar3',     type: 'text',     label: 'Pillar 3',    default: 'Celebration' },
    { id: 'pillar3_body',type: 'textarea', label: 'Pillar 3 body', maxLength: 220 },
    { id: 'established', type: 'text',     label: 'Established', default: 'Established MMXXIV' },
  ],
};

const BACK_COVER_TEMPLATE = {
  id: 'back-cover',
  name: 'Back Cover',
  category: 'Back Cover',
  palette: 'obsidian',
  description: 'Next-issue teaser triptych with full masthead credits.',
  fields: [
    { id: 'kicker',    type: 'text',     label: 'Kicker',     default: 'IN THE NEXT ISSUE' },
    { id: 'headline',  type: 'text',     label: 'Headline',   default: 'Summer in Provence' },
    { id: 'teaser1_image', type: 'image',label: 'Teaser 1 Image' },
    { id: 'teaser1_caption', type: 'text', label: 'Teaser 1 Caption', default: 'A Lavender Wedding in Luberon' },
    { id: 'teaser2_image', type: 'image',label: 'Teaser 2 Image' },
    { id: 'teaser2_caption', type: 'text', label: 'Teaser 2 Caption', default: 'The Return of the Wildflower' },
    { id: 'teaser3_image', type: 'image',label: 'Teaser 3 Image' },
    { id: 'teaser3_caption', type: 'text', label: 'Teaser 3 Caption', default: 'Château d\'Estoublon · An Exclusive' },
    { id: 'masthead',  type: 'textarea', label: 'Masthead Credits', hint: 'Editor, Creative Director, Photography, etc.', maxLength: 600 },
  ],
};

const FULL_PAGE_AD_TEMPLATE = {
  id: 'full-page-ad',
  name: 'Full-Page Advertisement',
  category: 'Full-Page Advertisement',
  palette: 'obsidian',
  description: 'Full-bleed image ad with gold bar, brand mark and URL.',
  fields: [
    { id: 'image',    type: 'image', label: 'Ad Image',   required: true, hint: 'Full bleed, high-resolution' },
    { id: 'brand',    type: 'text',  label: 'Brand Name', default: 'VERA WANG', required: true },
    { id: 'tagline',  type: 'text',  label: 'Tagline',    default: 'COUTURE · NEW YORK · PARIS' },
    { id: 'url',      type: 'text',  label: 'URL / Handle', default: 'verawang.com' },
  ],
};

const PRODUCT_SHOWCASE_AD_TEMPLATE = {
  id: 'product-showcase-ad',
  name: 'Product Showcase Ad',
  category: 'Product Showcase Ad',
  palette: 'ivory',
  description: 'Half-page product image, half-page cream panel with CTA.',
  fields: [
    { id: 'image',    type: 'image',    label: 'Product Image',  required: true, hint: 'Clean background preferred' },
    { id: 'featured', type: 'text',     label: 'Kicker',          default: 'FEATURED' },
    { id: 'product',  type: 'text',     label: 'Product Name',    default: 'The Madeleine Solitaire', required: true },
    { id: 'description', type: 'textarea', label: 'Description', maxLength: 120 },
    { id: 'price',    type: 'text',     label: 'Price',           default: '£48,000' },
    { id: 'cta',      type: 'text',     label: 'CTA Label',       default: 'SHOP NOW' },
    { id: 'brand',    type: 'text',     label: 'Brand Line',      default: 'GRAFF · LONDON' },
  ],
};

const VENUE_AD_TEMPLATE = {
  id: 'venue-advertisement',
  name: 'Venue Advertisement',
  category: 'Venue Advertisement',
  palette: 'obsidian',
  description: 'Full-bleed venue hero with appointment-only call to action.',
  fields: [
    { id: 'image',     type: 'image', label: 'Venue Image',  required: true },
    { id: 'venue',     type: 'text',  label: 'Venue Name',    default: 'HOTEL CIPRIANI', required: true },
    { id: 'tagline',   type: 'text',  label: 'Tagline',       default: 'A palazzo suspended above the Grand Canal' },
    { id: 'callout',   type: 'text',  label: 'Callout',       default: 'PRIVATE VIEWINGS BY APPOINTMENT' },
    { id: 'cta',       type: 'text',  label: 'CTA Label',     default: 'BOOK A VISIT' },
    { id: 'footer',    type: 'text',  label: 'Footer Contact',default: 'cipriani.com  ·  +39 041 520 7744' },
  ],
};

// The full existing template library (unchanged definitions, reordered below).
const BASE_TEMPLATES = [
  {
    id: 'vogue-cover',
    name: 'The Cover',
    category: 'Cover',
    palette: 'obsidian',
    description: 'Full-bleed hero portrait with editorial masthead. Vogue-inspired.',
    fields: [
      { id: 'bgImage',     type: 'image',    label: 'Cover Image',    required: true, hint: 'Portrait orientation works best' },
      { id: 'masthead',    type: 'text',     label: 'Masthead',       default: 'LWD', maxLength: 6 },
      { id: 'issueLabel',  type: 'text',     label: 'Issue Label',    placeholder: 'Issue 01 · Spring 2026' },
      { id: 'title',       type: 'textarea', label: 'Cover Title',    placeholder: 'THE BRIDAL\nEDITION', required: true, hint: 'Use line breaks to split across 2 lines' },
      { id: 'credits',     type: 'text',     label: 'Credits / Designers', placeholder: 'Vera Wang · Elie Saab · Marchesa' },
    ],
  },
  {
    id: 'the-gown',
    name: 'The Gown',
    category: 'Bridal',
    palette: 'ivory',
    description: 'Full-length gown portrait with minimal editorial typography. Ivory palette.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Gown / Model Image', required: true, hint: 'Full-length portrait, vertical' },
      { id: 'dressName',   type: 'text',     label: 'Dress Name',     placeholder: 'The Madeleine', required: true },
      { id: 'designer',    type: 'text',     label: 'Designer',       placeholder: 'Vera Wang' },
      { id: 'details',     type: 'text',     label: 'Details',        placeholder: 'Duchess satin · bespoke · made to measure' },
      { id: 'price',       type: 'text',     label: 'Price',          placeholder: 'POA' },
    ],
  },
  {
    id: 'the-jewel',
    name: 'The Jewel',
    category: 'Jewellery',
    palette: 'claret',
    description: 'Floating product shot on deep velvet. Maximum drama for jewellery.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Jewellery Image', required: true, hint: 'Product on dark or transparent background' },
      { id: 'name',        type: 'text',     label: 'Piece Name',     placeholder: 'THE MADELEINE RING', required: true },
      { id: 'details',     type: 'text',     label: 'Details',        placeholder: '18ct white gold · 3.2ct round brilliant' },
      { id: 'brand',       type: 'text',     label: 'Brand',          placeholder: 'Graff, London' },
      { id: 'price',       type: 'text',     label: 'Price',          placeholder: '£48,000' },
      { id: 'bgPalette',   type: 'select',   label: 'Background',     options: ['claret','obsidian','midnight','white'], default: 'claret' },
    ],
  },
  {
    id: 'feature-spread',
    name: 'Feature Spread',
    category: 'Editorial',
    palette: 'white',
    description: 'Large hero image left, headline + editorial copy right. Clean and authoritative.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Hero Image',     required: true },
      { id: 'headline',    type: 'textarea', label: 'Headline',       placeholder: 'SOMETHING\nBORROWED,\nSOMETHING\nGOLD', required: true },
      { id: 'body',        type: 'textarea', label: 'Body Copy',      placeholder: 'Editorial copy goes here. Two to three paragraphs works well for this layout.' },
      { id: 'byline',      type: 'text',     label: 'Photography Credit', placeholder: 'Photography: Studio Name' },
    ],
  },
  {
    id: 'the-runway',
    name: 'The Runway',
    category: 'Fashion',
    palette: 'obsidian',
    description: 'Three-image filmstrip with editorial title below a gold rule. Fashion-forward.',
    fields: [
      { id: 'image1',      type: 'image',    label: 'Image 1 (left)',  required: true },
      { id: 'image2',      type: 'image',    label: 'Image 2 (centre)', required: true },
      { id: 'image3',      type: 'image',    label: 'Image 3 (right)',  required: true },
      { id: 'heading',     type: 'text',     label: 'Heading',          placeholder: 'SPRING / SUMMER 2026', required: true },
      { id: 'designers',   type: 'text',     label: 'Designers',        placeholder: 'Elie Saab · Marchesa · Jenny Packham' },
    ],
  },
  {
    id: 'the-destination',
    name: 'The Destination',
    category: 'Travel',
    palette: 'midnight',
    description: 'Full-bleed landscape with location name in huge italic serif below. Condé Nast Traveller energy.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Landscape / Aerial Image', required: true, hint: 'Landscape orientation works best' },
      { id: 'location',    type: 'text',     label: 'Location Name',  placeholder: 'TUSCANY', required: true },
      { id: 'subline',     type: 'text',     label: 'Subline',        placeholder: 'Italy · June 2026' },
      { id: 'description', type: 'textarea', label: 'Short Description', placeholder: 'Optional — a single atmospheric sentence.' },
    ],
  },
  {
    id: 'the-portrait',
    name: 'The Portrait',
    category: 'Real Wedding',
    palette: 'blush',
    description: 'Full-bleed couple portrait with name overlay. Perfect for real wedding features.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Couple / Portrait Image', required: true },
      { id: 'names',       type: 'text',     label: 'Couple Names',   placeholder: 'Isabella & James', required: true },
      { id: 'location',    type: 'text',     label: 'Wedding Location', placeholder: 'MARRIED IN TUSCANY' },
      { id: 'date',        type: 'text',     label: 'Date',           placeholder: 'June 14 · 2026' },
    ],
  },
  {
    id: 'the-triptych',
    name: 'The Triptych',
    category: 'Detail',
    palette: 'ivory',
    description: 'Three equal portrait images with individual captions. Perfect for detail shots.',
    fields: [
      { id: 'image1',      type: 'image',    label: 'Image 1',        required: true },
      { id: 'image2',      type: 'image',    label: 'Image 2',        required: true },
      { id: 'image3',      type: 'image',    label: 'Image 3',        required: true },
      { id: 'caption1',    type: 'text',     label: 'Caption 1',      placeholder: 'The Bouquet' },
      { id: 'caption2',    type: 'text',     label: 'Caption 2',      placeholder: 'The Ring' },
      { id: 'caption3',    type: 'text',     label: 'Caption 3',      placeholder: 'The Veil' },
      { id: 'credit',      type: 'text',     label: 'Photography Credit', placeholder: 'Photography: Studio Name' },
    ],
  },
  {
    id: 'pull-quote',
    name: 'The Pull Quote',
    category: 'Editorial',
    palette: 'obsidian',
    description: 'Pure typography — huge italic quote on dark. No image. Maximum impact between spreads.',
    fields: [
      { id: 'quote',       type: 'textarea', label: 'Quote',          placeholder: '"A wedding dress is not just a garment. It is an heirloom in waiting."', required: true },
      { id: 'attribution', type: 'text',     label: 'Attribution',    placeholder: '— Vera Wang' },
    ],
  },
  {
    id: 'product-page',
    name: 'Product Page',
    category: 'Fashion',
    palette: 'white',
    description: 'Centered product on white. Net-a-Porter editorial style. Clinical, confident.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Product Image',  required: true, hint: 'Product on white or transparent background' },
      { id: 'name',        type: 'text',     label: 'Product Name',   placeholder: 'MADELEINE PEARL NECKLACE', required: true },
      { id: 'brand',       type: 'text',     label: 'Brand',          placeholder: 'Mikimoto' },
      { id: 'price',       type: 'text',     label: 'Price',          placeholder: '£4,800' },
      { id: 'category',    type: 'text',     label: 'Category',       placeholder: 'Fine Jewellery' },
    ],
  },
  {
    id: 'the-hotel',
    name: 'The Hotel',
    category: 'Venue',
    palette: 'midnight',
    description: 'Split layout — venue image left, elegant description right. Perfect for venue features.',
    fields: [
      { id: 'image',       type: 'image',    label: 'Venue / Interior Image', required: true },
      { id: 'venueName',   type: 'text',     label: 'Venue Name',     placeholder: 'HOTEL CIPRIANI', required: true },
      { id: 'location',    type: 'text',     label: 'Location',       placeholder: 'Venice, Italy' },
      { id: 'description', type: 'textarea', label: 'Description',    placeholder: 'A palazzo suspended above the Grand Canal, where time slows to the pace of gondolas and wedding bells.' },
      { id: 'features',    type: 'textarea', label: 'Features (one per line)', placeholder: 'Private canal entrance\nIn-house floral studio\nDedicated wedding concierge' },
    ],
  },
  {
    id: 'table-of-contents',
    name: 'Contents',
    category: 'Navigation',
    palette: 'ivory',
    description: 'Numbered issue contents page with section titles. Elegant typographic layout.',
    fields: [
      { id: 'issueLabel',  type: 'text',     label: 'Issue Label',    placeholder: 'I S S U E  0 1', required: true },
      { id: 'entries',     type: 'textarea', label: 'Contents Entries (page|title per line)', placeholder: '06|The Wedding Dress\n14|Jewellery Stories\n22|Venues of the Season\n34|Real Wedding: Isabella\n44|The Bridal Beauty Edit\n52|Destination: Tuscany', required: true, hint: 'Format: page number | section title, one per line' },
      { id: 'subtitle',    type: 'text',     label: 'Issue Subtitle', placeholder: 'The Bridal Edition' },
    ],
  },

  // ── Templates 13–32 ─────────────────────────────────────────────────────────

  // 13 — The Masthead
  {
    id: 'masthead',
    name: 'The Masthead',
    category: 'Editorial',
    palette: 'ivory',
    description: 'Magazine masthead with editorial team credits and issue details',
    fields: [
      { id: 'publication',      type: 'text',  label: 'Publication Name',   default: 'LUXURY WEDDING DIRECTORY', required: true },
      { id: 'issue_line',       type: 'text',  label: 'Issue Line',         default: 'Issue No. 01 · Spring 2026' },
      { id: 'editor',           type: 'text',  label: 'Editor in Chief' },
      { id: 'creative_director',type: 'text',  label: 'Creative Director' },
      { id: 'photographer',     type: 'text',  label: 'Photography' },
      { id: 'stylist',          type: 'text',  label: 'Fashion & Styling' },
      { id: 'florist',          type: 'text',  label: 'Florals' },
      { id: 'venue_credit',     type: 'text',  label: 'Venue' },
      { id: 'tagline',          type: 'text',  label: 'Issue Tagline',      default: 'Exceptional Weddings for Discerning Couples' },
      { id: 'logo_url',         type: 'image', label: 'Publication Logo' },
    ],
  },

  // 14 — The Floral Spread
  {
    id: 'floral-spread',
    name: 'The Floral Spread',
    category: 'Florals',
    palette: 'blush',
    description: 'Full-bleed floral double-page with botanical detail',
    fields: [
      { id: 'image',        type: 'image',    label: 'Floral Image',   required: true },
      { id: 'headline',     type: 'text',     label: 'Headline',       default: 'In Full Bloom' },
      { id: 'florist_name', type: 'text',     label: 'Florist Name' },
      { id: 'description',  type: 'textarea', label: 'Description',    maxLength: 200 },
      { id: 'accent_color', type: 'color',    label: 'Accent Colour',  default: '#C9A96E' },
    ],
  },

  // 15 — The Reception Table
  {
    id: 'reception-table',
    name: 'The Reception Table',
    category: 'Reception',
    palette: 'ivory',
    description: 'Elegant tablescape editorial with styling credits',
    fields: [
      { id: 'image',        type: 'image',    label: 'Table Setting Image', required: true },
      { id: 'headline',     type: 'text',     label: 'Headline',            default: 'Dressed to Perfection' },
      { id: 'venue',        type: 'text',     label: 'Venue Name' },
      { id: 'stylist',      type: 'text',     label: 'Table Stylist' },
      { id: 'caption',      type: 'textarea', label: 'Editorial Caption',   maxLength: 180 },
      { id: 'palette_note', type: 'text',     label: 'Colour Palette Note', default: 'Ivory · Sage · Dusty Rose' },
    ],
  },

  // 16 — The Ceremony Aisle
  {
    id: 'ceremony-aisle',
    name: 'The Ceremony Aisle',
    category: 'Ceremony',
    palette: 'white',
    description: 'Romantic ceremony scene with atmospheric editorial framing',
    fields: [
      { id: 'image',        type: 'image',    label: 'Ceremony Image',    required: true },
      { id: 'venue',        type: 'text',     label: 'Ceremony Venue' },
      { id: 'headline',     type: 'text',     label: 'Headline',          default: 'The Walk to Forever' },
      { id: 'subhead',      type: 'text',     label: 'Subheading' },
      { id: 'story',        type: 'textarea', label: 'Ceremony Story',    maxLength: 300 },
      { id: 'photographer', type: 'text',     label: 'Photography Credit' },
    ],
  },

  // 17 — The Couple Story
  {
    id: 'couple-story',
    name: 'The Couple Story',
    category: 'Couple',
    palette: 'midnight',
    description: 'Cinematic couple portrait with love story narrative',
    fields: [
      { id: 'image',        type: 'image',    label: 'Portrait Image', required: true },
      { id: 'couple_names', type: 'text',     label: 'Couple Names',   default: 'Sophia & James' },
      { id: 'date',         type: 'text',     label: 'Wedding Date' },
      { id: 'location',     type: 'text',     label: 'Location' },
      { id: 'story',        type: 'textarea', label: 'Love Story',     maxLength: 400 },
      { id: 'photographer', type: 'text',     label: 'Photographer' },
    ],
  },

  // 18 — The Beauty Edit
  {
    id: 'beauty-edit',
    name: 'The Beauty Edit',
    category: 'Beauty',
    palette: 'blush',
    description: 'Bridal beauty close-up with makeup and hair credits',
    fields: [
      { id: 'image',        type: 'image',    label: 'Beauty Image',                   required: true },
      { id: 'headline',     type: 'text',     label: 'Headline',                        default: 'The Art of Bridal Beauty' },
      { id: 'makeup_artist',type: 'text',     label: 'Makeup Artist' },
      { id: 'hair_stylist', type: 'text',     label: 'Hair Stylist' },
      { id: 'products',     type: 'textarea', label: 'Key Products / Look Description', maxLength: 220 },
      { id: 'model',        type: 'text',     label: 'Model / Bride' },
    ],
  },

  // 19 — The Dress Detail
  {
    id: 'dress-detail',
    name: 'The Dress Detail',
    category: 'Fashion',
    palette: 'white',
    description: 'Close-up couture detail — fabric, embroidery, lace',
    fields: [
      { id: 'image',       type: 'image', label: 'Detail Image',        required: true },
      { id: 'designer',    type: 'text',  label: 'Designer / House',    required: true },
      { id: 'collection',  type: 'text',  label: 'Collection Name' },
      { id: 'detail_note', type: 'text',  label: 'Detail Description',  default: 'Hand-embroidered Chantilly lace' },
      { id: 'price',       type: 'text',  label: 'Price / On Request' },
      { id: 'stockist',    type: 'text',  label: 'Stockist / Contact' },
    ],
  },

  // 20 — The Invitation Suite
  {
    id: 'invitation-suite',
    name: 'The Invitation Suite',
    category: 'Stationery',
    palette: 'ivory',
    description: 'Flat-lay stationery suite with supplier details',
    fields: [
      { id: 'image',       type: 'image',    label: 'Stationery Image',          required: true },
      { id: 'headline',    type: 'text',     label: 'Headline',                   default: 'The Perfect First Impression' },
      { id: 'designer',    type: 'text',     label: 'Stationery Designer' },
      { id: 'paper_stock', type: 'text',     label: 'Paper / Printing Method',   default: 'Hot-press letterpress on cotton paper' },
      { id: 'description', type: 'textarea', label: 'Suite Description',         maxLength: 200 },
      { id: 'price_guide', type: 'text',     label: 'Price Guide' },
    ],
  },

  // 21 — The Cake Moment
  {
    id: 'cake-moment',
    name: 'The Cake Moment',
    category: 'Food & Cake',
    palette: 'white',
    description: 'Wedding cake hero shot with patissier credit',
    fields: [
      { id: 'image',        type: 'image',    label: 'Cake Image',       required: true },
      { id: 'headline',     type: 'text',     label: 'Headline',          default: 'The Sweet Finale' },
      { id: 'cake_designer',type: 'text',     label: 'Cake Designer / Patissier' },
      { id: 'flavour',      type: 'text',     label: 'Flavour Profile',   default: 'Champagne sponge, elderflower cream, gold leaf' },
      { id: 'tiers',        type: 'text',     label: 'Tiers / Servings' },
      { id: 'caption',      type: 'textarea', label: 'Editorial Note',    maxLength: 160 },
    ],
  },

  // 22 — The Venue Portrait
  {
    id: 'venue-portrait',
    name: 'The Venue Portrait',
    category: 'Venue Portrait',
    palette: 'obsidian',
    description: 'Grand venue hero shot with architectural framing',
    fields: [
      { id: 'image',      type: 'image',    label: 'Venue Image',         required: true },
      { id: 'venue_name', type: 'text',     label: 'Venue Name',          required: true },
      { id: 'location',   type: 'text',     label: 'Location' },
      { id: 'capacity',   type: 'text',     label: 'Capacity',            default: 'Up to 250 guests' },
      { id: 'style',      type: 'text',     label: 'Venue Style',         default: 'Chateau · Formal · Garden' },
      { id: 'headline',   type: 'text',     label: 'Editorial Headline',  default: 'Where Dreams Take Shape' },
      { id: 'body',       type: 'textarea', label: 'Venue Description',   maxLength: 280 },
    ],
  },

  // 23 — The Fashion Plate
  {
    id: 'fashion-plate',
    name: 'The Fashion Plate',
    category: 'Fashion',
    palette: 'midnight',
    description: 'Full-bleed fashion portrait in Vogue editorial style',
    fields: [
      { id: 'image',        type: 'image', label: 'Fashion Image', required: true },
      { id: 'look_title',   type: 'text',  label: 'Look Title',    default: 'Look I' },
      { id: 'dress',        type: 'text',  label: 'Gown',          required: true },
      { id: 'shoes',        type: 'text',  label: 'Shoes' },
      { id: 'jewellery',    type: 'text',  label: 'Jewellery' },
      { id: 'photographer', type: 'text',  label: 'Photography' },
      { id: 'model',        type: 'text',  label: 'Model' },
    ],
  },

  // 24 — The Honeymoon Edit
  {
    id: 'honeymoon-edit',
    name: 'The Honeymoon Edit',
    category: 'Editorial',
    palette: 'claret',
    description: 'Luxury honeymoon destination editorial',
    fields: [
      { id: 'image',       type: 'image',    label: 'Destination Image', required: true },
      { id: 'destination', type: 'text',     label: 'Destination',       required: true, default: 'The Maldives' },
      { id: 'property',    type: 'text',     label: 'Property / Hotel' },
      { id: 'headline',    type: 'text',     label: 'Headline',           default: 'For Two, With Love' },
      { id: 'intro',       type: 'textarea', label: 'Destination Intro',  maxLength: 300 },
      { id: 'price_guide', type: 'text',     label: 'Price Guide / From' },
      { id: 'website',     type: 'text',     label: 'Website' },
    ],
  },

  // 25 — The Ring Edit
  {
    id: 'ring-edit',
    name: 'The Ring Edit',
    category: 'Editorial',
    palette: 'obsidian',
    description: 'Jewellery close-up with goldsmith / atelier credits',
    fields: [
      { id: 'image',    type: 'image',    label: 'Jewellery Image',  required: true },
      { id: 'headline', type: 'text',     label: 'Headline',          default: 'The Stone That Starts It All' },
      { id: 'designer', type: 'text',     label: 'Jeweller / Atelier', required: true },
      { id: 'metal',    type: 'text',     label: 'Metal',              default: '18ct White Gold' },
      { id: 'stone',    type: 'text',     label: 'Stone',              default: '3ct Old European Cut Diamond' },
      { id: 'price',    type: 'text',     label: 'Price / POA' },
      { id: 'caption',  type: 'textarea', label: 'Editorial Note',    maxLength: 180 },
    ],
  },

  // 26 — The Interview
  {
    id: 'the-interview',
    name: 'The Interview',
    category: 'Editorial',
    palette: 'ivory',
    description: 'Q&A editorial format with portrait and pull quotes',
    fields: [
      { id: 'image',         type: 'image',    label: 'Portrait Image',    required: true },
      { id: 'subject_name',  type: 'text',     label: 'Subject Name',      required: true },
      { id: 'subject_title', type: 'text',     label: 'Subject Title / Role' },
      { id: 'question_1',    type: 'text',     label: 'Question 1' },
      { id: 'answer_1',      type: 'textarea', label: 'Answer 1',          maxLength: 300 },
      { id: 'question_2',    type: 'text',     label: 'Question 2' },
      { id: 'answer_2',      type: 'textarea', label: 'Answer 2',          maxLength: 300 },
      { id: 'pull_quote',    type: 'textarea', label: 'Pull Quote',        maxLength: 120 },
    ],
  },

  // 27 — The Dress Flat Lay
  {
    id: 'dress-flat-lay',
    name: 'The Dress Flat Lay',
    category: 'Fashion',
    palette: 'white',
    description: 'Overhead flat-lay of gown with accessories arrangement',
    fields: [
      { id: 'image',        type: 'image', label: 'Flat Lay Image',  required: true },
      { id: 'headline',     type: 'text',  label: 'Headline',         default: 'The Complete Look' },
      { id: 'gown',         type: 'text',  label: 'Gown',             required: true },
      { id: 'veil',         type: 'text',  label: 'Veil' },
      { id: 'shoes',        type: 'text',  label: 'Shoes' },
      { id: 'jewellery',    type: 'text',  label: 'Jewellery' },
      { id: 'bouquet',      type: 'text',  label: 'Bouquet / Florist' },
      { id: 'photographer', type: 'text',  label: 'Photography' },
    ],
  },

  // 28 — The Aerial View
  {
    id: 'aerial-venue',
    name: 'The Aerial View',
    category: 'Venue Portrait',
    palette: 'midnight',
    description: 'Drone/aerial venue or landscape with minimal text overlay',
    fields: [
      { id: 'image',        type: 'image', label: 'Aerial Image',      required: true },
      { id: 'location',     type: 'text',  label: 'Location',          required: true },
      { id: 'headline',     type: 'text',  label: 'Headline',           default: 'From Above' },
      { id: 'subline',      type: 'text',  label: 'Subline',            default: 'A new perspective on romance' },
      { id: 'photographer', type: 'text',  label: 'Aerial Photography' },
    ],
  },

  // 29 — The Lux Grid
  {
    id: 'lux-grid',
    name: 'The Lux Grid',
    category: 'Editorial',
    palette: 'obsidian',
    description: '6-image editorial grid for detail shots or product roundup',
    fields: [
      { id: 'image1',   type: 'image', label: 'Image 1', required: true },
      { id: 'image2',   type: 'image', label: 'Image 2' },
      { id: 'image3',   type: 'image', label: 'Image 3' },
      { id: 'image4',   type: 'image', label: 'Image 4' },
      { id: 'image5',   type: 'image', label: 'Image 5' },
      { id: 'image6',   type: 'image', label: 'Image 6' },
      { id: 'headline', type: 'text',  label: 'Section Headline', default: 'The Edit' },
      { id: 'caption',  type: 'text',  label: 'Grid Caption' },
    ],
  },

  // 30 — The Full Bleed
  {
    id: 'full-bleed',
    name: 'The Full Bleed',
    category: 'Editorial',
    palette: 'obsidian',
    description: 'Pure full-bleed image with minimal title overlay — maximum impact',
    fields: [
      { id: 'image',        type: 'image',  label: 'Full Bleed Image', required: true },
      { id: 'text_overlay', type: 'text',   label: 'Minimal Text Overlay' },
      { id: 'position',     type: 'select', label: 'Text Position',    default: 'bottom-left',
        options: [
          { value: 'top-left',     label: 'Top Left' },
          { value: 'top-right',    label: 'Top Right' },
          { value: 'bottom-left',  label: 'Bottom Left' },
          { value: 'bottom-right', label: 'Bottom Right' },
          { value: 'center',       label: 'Centred' },
        ],
      },
      { id: 'credit', type: 'text', label: 'Photo Credit' },
    ],
  },

  // 31 — The Venue Directory
  {
    id: 'venue-directory',
    name: 'The Venue Directory',
    category: 'Venue Portrait',
    palette: 'ivory',
    description: 'Directory-style venue listing page with 3 venues',
    fields: [
      { id: 'section_title',  type: 'text',  label: 'Section Title',      default: 'Venues of Distinction' },
      { id: 'venue1_name',    type: 'text',  label: 'Venue 1 Name',       required: true },
      { id: 'venue1_location',type: 'text',  label: 'Venue 1 Location' },
      { id: 'venue1_image',   type: 'image', label: 'Venue 1 Image' },
      { id: 'venue1_desc',    type: 'text',  label: 'Venue 1 Description' },
      { id: 'venue2_name',    type: 'text',  label: 'Venue 2 Name' },
      { id: 'venue2_location',type: 'text',  label: 'Venue 2 Location' },
      { id: 'venue2_image',   type: 'image', label: 'Venue 2 Image' },
      { id: 'venue2_desc',    type: 'text',  label: 'Venue 2 Description' },
      { id: 'venue3_name',    type: 'text',  label: 'Venue 3 Name' },
      { id: 'venue3_location',type: 'text',  label: 'Venue 3 Location' },
      { id: 'venue3_image',   type: 'image', label: 'Venue 3 Image' },
      { id: 'venue3_desc',    type: 'text',  label: 'Venue 3 Description' },
    ],
  },

  // 32 — The Planner Spotlight
  {
    id: 'planner-spotlight',
    name: 'The Planner Spotlight',
    category: 'Editorial',
    palette: 'claret',
    description: 'Feature profile of a luxury wedding planner',
    fields: [
      { id: 'image',           type: 'image',    label: 'Planner Portrait',        required: true },
      { id: 'planner_name',    type: 'text',     label: 'Planner Name',            required: true },
      { id: 'company',         type: 'text',     label: 'Company / Studio' },
      { id: 'based',           type: 'text',     label: 'Based In' },
      { id: 'headline',        type: 'text',     label: 'Feature Headline',        default: 'The Architect of Extraordinary Days' },
      { id: 'bio',             type: 'textarea', label: 'Profile Bio',             maxLength: 400 },
      { id: 'signature_style', type: 'text',     label: 'Signature Style' },
      { id: 'website',         type: 'text',     label: 'Website' },
    ],
  },
];

// Helper: pick a template from BASE_TEMPLATES by id — keeps the magazine-order
// assembly below readable, and surfaces a clear runtime error if a referenced
// template is ever removed from BASE_TEMPLATES.
function byId(id) {
  const t = BASE_TEMPLATES.find(t => t.id === id);
  if (!t) throw new Error(`Missing template: ${id}`);
  return t;
}

// ── Magazine-reading order ──────────────────────────────────────────────────
// Cover → Editor's Letter → About Page → Contents → Full-Page Ad →
// Editorial → Travel → Fashion → Bridal → Jewellery → Beauty → Florals →
// Stationery → Cake → Couple → Real Wedding → Ceremony → Reception →
// Venue → Venue Portrait → Product Showcase Ad → Venue Ad → Detail → Back Cover.
//
// Remaining BASE_TEMPLATES that aren't specifically called out in the
// ordering above are appended at the end in their original sequence so no
// template is lost from the picker.
const ORDERED_IDS = [
  'vogue-cover',                // Cover
  'editors-letter',             // Editor's Letter
  'about-page',                 // About Page
  'table-of-contents',          // Navigation / Contents
  'full-page-ad',               // Full-Page Advertisement
  'feature-spread',             // Editorial
  'the-destination',            // Travel
  'the-runway',                 // Fashion
  'the-gown',                   // Bridal
  'the-jewel',                  // Jewellery
  'beauty-edit',                // Beauty
  'floral-spread',              // Florals
  'invitation-suite',           // Stationery
  'cake-moment',                // Food & Cake
  'couple-story',               // Couple
  'the-portrait',               // Real Wedding
  'ceremony-aisle',             // Ceremony
  'reception-table',            // Reception
  'the-hotel',                  // Venue
  'venue-portrait',             // Venue Portrait
  'product-showcase-ad',        // Product Showcase Ad
  'venue-advertisement',        // Venue Advertisement
  'the-triptych',               // Detail
  'back-cover',                 // Back Cover
];

const NEW_TEMPLATES_BY_ID = {
  'editors-letter':       EDITORS_LETTER_TEMPLATE,
  'about-page':           ABOUT_PAGE_TEMPLATE,
  'back-cover':           BACK_COVER_TEMPLATE,
  'full-page-ad':         FULL_PAGE_AD_TEMPLATE,
  'product-showcase-ad':  PRODUCT_SHOWCASE_AD_TEMPLATE,
  'venue-advertisement':  VENUE_AD_TEMPLATE,
};

// Build the ordered list, then append any BASE_TEMPLATES that weren't
// referenced in ORDERED_IDS (editorial extras — pull quote, masthead, etc.)
const orderedPrimary = ORDERED_IDS.map((id) =>
  NEW_TEMPLATES_BY_ID[id] || byId(id)
);
const orderedIdsSet = new Set(ORDERED_IDS);
const extras = BASE_TEMPLATES.filter(t => !orderedIdsSet.has(t.id));

export const TEMPLATES = [...orderedPrimary, ...extras];

export const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))];
export default TEMPLATES;
