/**
 * Magazine global theme tokens.
 * Every magazine component should import getMagTheme(isLight)
 * and use T.bg, T.text, T.muted, T.border, T.gold, etc.
 * No hardcoded light-only or dark-only colours in magazine components.
 */

const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

export const MAG_LIGHT = {
  bg: '#fafaf8',
  surface: '#ffffff',
  card: '#ffffff',
  cardHover: '#f4f1ec',
  border: 'rgba(30,28,22,0.08)',
  border2: 'rgba(30,28,22,0.14)',
  text: '#1a1806',
  muted: 'rgba(30,28,22,0.52)',
  subtle: 'rgba(30,28,22,0.32)',
  gold: GOLD,
  goldHover: '#b8954d',
  goldDim: `${GOLD}28`,
  input: '#f4f1ec',
  inputBorder: 'rgba(30,28,22,0.18)',
  overlay: 'rgba(250,250,248,0.92)',
  navBg: 'rgba(250,250,248,0.94)',
  shadow: '0 2px 16px rgba(30,28,22,0.08)',
  categoryPill: 'rgba(30,28,22,0.06)',
  categoryPillActive: 'rgba(30,28,22,0.10)',
};

export const MAG_DARK = {
  bg: '#0a0a0a',
  surface: '#111111',
  card: '#131311',
  cardHover: '#1a1a18',
  border: 'rgba(245,240,232,0.07)',
  border2: 'rgba(245,240,232,0.12)',
  text: CREAM,
  muted: 'rgba(245,240,232,0.45)',
  subtle: 'rgba(245,240,232,0.30)',
  gold: GOLD,
  goldHover: '#d4b87e',
  goldDim: `${GOLD}28`,
  input: '#1a1a18',
  inputBorder: 'rgba(245,240,232,0.12)',
  overlay: 'rgba(10,10,10,0.92)',
  navBg: 'rgba(10,10,10,0.88)',
  shadow: '0 2px 24px rgba(0,0,0,0.4)',
  categoryPill: 'rgba(245,240,232,0.05)',
  categoryPillActive: 'rgba(245,240,232,0.10)',
};

/** Returns the correct theme token set for the given isLight flag */
export const getMagTheme = (isLight) => isLight ? MAG_LIGHT : MAG_DARK;

/** Shared constants that don't change with theme */
export const GOLD_CONST = GOLD;
export const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
export const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
/** Tighter tracking on display headings for luxury editorial feel */
export const FD_LS = '-0.02em';
