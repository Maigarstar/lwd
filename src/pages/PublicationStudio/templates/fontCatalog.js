// ─── fontCatalog.js ───────────────────────────────────────────────────────────
// Comprehensive Google Fonts catalog for the Publication Studio font picker.

export const FONT_CATALOG = [
  // ── Display / Serif ─────────────────────────────────────────────────────────
  { family: 'Bodoni Moda',         category: 'Display',    weights: [400, 500, 600, 700, 900], italic: true },
  { family: 'Cormorant Garamond',  category: 'Serif',      weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Cormorant',           category: 'Serif',      weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Playfair Display',    category: 'Serif',      weights: [400, 500, 600, 700, 800, 900], italic: true },
  { family: 'EB Garamond',         category: 'Serif',      weights: [400, 500, 600, 700, 800], italic: true },
  { family: 'Libre Baskerville',   category: 'Serif',      weights: [400, 700], italic: true },
  { family: 'Lora',                category: 'Serif',      weights: [400, 500, 600, 700], italic: true },
  { family: 'Merriweather',        category: 'Serif',      weights: [300, 400, 700, 900], italic: true },
  { family: 'Crimson Text',        category: 'Serif',      weights: [400, 600, 700], italic: true },
  { family: 'Source Serif 4',      category: 'Serif',      weights: [300, 400, 600, 700], italic: true },
  { family: 'Cinzel',              category: 'Display',    weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Abril Fatface',       category: 'Display',    weights: [400] },
  { family: 'DM Serif Display',    category: 'Display',    weights: [400], italic: true },
  { family: 'Spectral',            category: 'Serif',      weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'GFS Didot',           category: 'Display',    weights: [400] },
  { family: 'Tenor Sans',          category: 'Sans-serif', weights: [400] },
  // ── Script / Calligraphy ────────────────────────────────────────────────────
  { family: 'Great Vibes',         category: 'Script',     weights: [400] },
  { family: 'Alex Brush',          category: 'Script',     weights: [400] },
  { family: 'Pinyon Script',       category: 'Script',     weights: [400] },
  { family: 'Tangerine',           category: 'Script',     weights: [400, 700] },
  { family: 'Pacifico',            category: 'Script',     weights: [400] },
  { family: 'Dancing Script',      category: 'Script',     weights: [400, 500, 600, 700] },
  { family: 'Sacramento',          category: 'Script',     weights: [400] },
  { family: 'Allura',              category: 'Script',     weights: [400] },
  // ── Sans-serif / Modern ─────────────────────────────────────────────────────
  { family: 'Jost',                category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Josefin Sans',        category: 'Sans-serif', weights: [100, 200, 300, 400, 600, 700] },
  { family: 'Montserrat',          category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Raleway',             category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800] },
  { family: 'Lato',                category: 'Sans-serif', weights: [300, 400, 700, 900] },
  { family: 'Open Sans',           category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Nunito',              category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Poppins',             category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Inter',               category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Didact Gothic',       category: 'Sans-serif', weights: [400] },
  { family: 'Oswald',              category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  // ── Slab ────────────────────────────────────────────────────────────────────
  { family: 'Roboto Slab',         category: 'Slab',       weights: [300, 400, 500, 700] },
  { family: 'Zilla Slab',          category: 'Slab',       weights: [300, 400, 500, 600, 700], italic: true },
];

export const FONT_CATEGORIES = [...new Set(FONT_CATALOG.map(f => f.category))];

export function loadGoogleFont(family) {
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
