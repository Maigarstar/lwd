export const GOLD = '#C9A96E';
export const DARK = '#1A1814';
export const CARD = '#2A2520';
export const BORDER = '#3A3530';
export const MUTED = 'rgba(255,255,255,0.45)';
export const GD = "'Cormorant Garamond', Georgia, serif";
export const NU = "'Jost', sans-serif";

export const PAGE_SIZES = {
  A4:       { label: 'A4 (210×297mm)',        w: 794,  h: 1123, mmW: 210, mmH: 297 },
  A5:       { label: 'A5 (148×210mm)',        w: 559,  h: 794,  mmW: 148, mmH: 210 },
  US_LETTER:{ label: 'US Letter (8.5×11")',   w: 816,  h: 1056, mmW: 216, mmH: 279 },
  SQUARE:   { label: 'Square (200×200mm)',    w: 756,  h: 756,  mmW: 200, mmH: 200 },
  TABLOID:  { label: 'Tabloid (11×17")',      w: 1056, h: 816,  mmW: 279, mmH: 216 },
};

export const DEFAULT_PAGE_SIZE = 'A4';

export const ELEMENT_DEFAULTS = {
  text: {
    type: 'textbox',
    width: 300,
    fontSize: 24,
    fontFamily: 'Cormorant Garamond',
    fill: '#18120A',
    fontWeight: '400',
  },
  heading: {
    type: 'textbox',
    width: 500,
    fontSize: 52,
    fontFamily: 'Cormorant Garamond',
    fill: '#18120A',
    fontWeight: '400',
    charSpacing: 60,
  },
  caption: {
    type: 'textbox',
    width: 300,
    fontSize: 11,
    fontFamily: 'Jost',
    fill: '#18120A',
    charSpacing: 80,
    textTransform: 'uppercase',
  },
  pullquote: {
    type: 'textbox',
    width: 400,
    fontSize: 28,
    fontFamily: 'Cormorant Garamond',
    fill: '#C9A96E',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subheading: {
    type: 'textbox',
    width: 400,
    fontSize: 32,
    fontFamily: 'Cormorant Garamond',
    fill: '#18120A',
    fontWeight: '500',
    charSpacing: 30,
  },
  rect: { width: 200, height: 120, fill: '#C9A96E', rx: 0, ry: 0 },
  circle: { radius: 60, fill: '#C9A96E' },
  line: { width: 200, stroke: '#C9A96E', strokeWidth: 2 },
  divider: { width: 120, stroke: '#C9A96E', strokeWidth: 1 },
};
