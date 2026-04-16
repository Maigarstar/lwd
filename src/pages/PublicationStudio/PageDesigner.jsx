import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, Textbox, FabricImage, Rect, Circle, Line } from 'fabric';
import { loadGoogleFont } from './templates/fontCatalog';
import { PAGE_SIZES, ELEMENT_DEFAULTS, GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import { TEMPLATES } from './templates/definitions';
import ElementsPanel from './PageDesigner/ElementsPanel';
import PropertiesPanel from './PageDesigner/PropertiesPanel';
import PageListPanel from './PageDesigner/PageListPanel';
import DesignerToolbar from './PageDesigner/DesignerToolbar';
import { canvasToJpegBlob, canvasToPrintJpegBlob, generatePrintPDF, downloadPDF } from './PageDesigner/exportUtils';
import { upsertPages, upsertPage, fetchPages, uploadPageImage, uploadThumbImage } from '../../services/magazinePageService';

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Template layout engine ────────────────────────────────────────────────────
function applyTemplate(fc, template, dims) {
  fc.clear();
  fc.backgroundColor = '#ffffff';

  const W = dims.w;
  const H = dims.h;
  const GOLD_C = '#C9A84C';
  const DARK_C = '#18120A';
  const MUTED_C = 'rgba(24,18,10,0.5)';

  const layouts = {
    'Cover': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      const rule = new Rect({ left: 40, top: 60, width: W - 80, height: 1, fill: GOLD_C });
      const masthead = new Textbox('LWD', { left: 40, top: 80, width: W - 80, fontSize: 72, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontWeight: '300', fontStyle: 'italic', textAlign: 'center' });
      const issueLabel = new Textbox('ISSUE 01 · SPRING 2026', { left: 40, top: 170, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 200, textAlign: 'center' });
      const title = new Textbox('THE BRIDAL\nEDITION', { left: 40, top: H * 0.55, width: W - 80, fontSize: 48, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontWeight: '300', fontStyle: 'italic', lineHeight: 1.1, textAlign: 'center' });
      const rule2 = new Rect({ left: 40, top: H - 80, width: W - 80, height: 1, fill: GOLD_C });
      const credits = new Textbox('Vera Wang · Elie Saab · Marchesa', { left: 40, top: H - 65, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.5)', textAlign: 'center' });
      [bg, rule, masthead, issueLabel, title, rule2, credits].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Editorial': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      const imgPlaceholder = new Rect({ left: 0, top: 0, width: W * 0.5, height: H, fill: '#E8E3D8' });
      const imgLabel = new Textbox('IMAGE', { left: W * 0.1, top: H * 0.47, width: W * 0.3, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C, textAlign: 'center', charSpacing: 150 });
      const headline = new Textbox('YOUR\nHEADLINE\nHERE', { left: W * 0.54, top: 80, width: W * 0.42, fontSize: 36, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontWeight: '300', fontStyle: 'italic', lineHeight: 1.1 });
      const rule = new Rect({ left: W * 0.54, top: 240, width: W * 0.42, height: 1, fill: GOLD_C });
      const body = new Textbox('Your editorial copy goes here. Write about the beautiful details, the venue, the couple — whatever makes this spread sing.', { left: W * 0.54, top: 254, width: W * 0.42, fontSize: 12, fontFamily: 'Jost', fill: DARK_C, lineHeight: 1.6 });
      const byline = new Textbox('Photography: Studio Name', { left: W * 0.54, top: H - 60, width: W * 0.42, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C });
      [bg, imgPlaceholder, imgLabel, headline, rule, body, byline].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Fashion': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      const colW = (W - 8) / 3;
      [0, 1, 2].forEach(i => {
        const col = new Rect({ left: i * (colW + 4), top: 0, width: colW, height: H * 0.78, fill: '#1A1612' });
        col.id = genId(); fc.add(col);
      });
      const rule = new Rect({ left: 40, top: H * 0.82, width: W - 80, height: 1, fill: GOLD_C });
      const heading = new Textbox('SPRING / SUMMER 2026', { left: 40, top: H * 0.85, width: W - 80, fontSize: 22, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center' });
      const designers = new Textbox('Elie Saab · Marchesa · Jenny Packham', { left: 40, top: H * 0.92, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: 'rgba(201,168,76,0.7)', textAlign: 'center', charSpacing: 100 });
      [rule, heading, designers].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Travel': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H * 0.65, fill: '#2A2B3E' });
      const gradient = new Rect({ left: 0, top: H * 0.45, width: W, height: H * 0.2, fill: 'rgba(26,27,46,0.8)' });
      const location = new Textbox('TUSCANY, ITALY', { left: 40, top: H * 0.68, width: W - 80, fontSize: 48, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '300', lineHeight: 1 });
      const tagline = new Textbox('Where rolling hills meet eternal love.', { left: 40, top: H * 0.82, width: W - 80, fontSize: 14, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.6)', lineHeight: 1.5 });
      [bg, imgPh, gradient, location, tagline].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Bridal': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const imgPh = new Rect({ left: W * 0.35, top: 0, width: W * 0.65, height: H, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 80, width: 2, height: 60, fill: GOLD_C });
      const dressName = new Textbox('THE MADELEINE', { left: 60, top: 80, width: W * 0.3, fontSize: 28, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.1 });
      const designer = new Textbox('Vera Wang', { left: 60, top: 158, width: W * 0.3, fontSize: 12, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 100 });
      const details = new Textbox('Duchess satin · bespoke\nmade to measure', { left: 60, top: 200, width: W * 0.3, fontSize: 11, fontFamily: 'Jost', fill: DARK_C, lineHeight: 1.6 });
      const price = new Textbox('POA', { left: 60, top: H - 80, width: 120, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: GOLD_C, fontStyle: 'italic' });
      [bg, imgPh, rule, dressName, designer, details, price].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Jewellery': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A0A0F', selectable: false });
      const circle = new Circle({ left: W / 2 - 180, top: H * 0.1, radius: 180, fill: '#2A1520', stroke: 'rgba(201,168,76,0.3)', strokeWidth: 1 });
      const name = new Textbox('THE MADELEINE RING', { left: 40, top: H * 0.65, width: W - 80, fontSize: 24, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center', charSpacing: 50 });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.73, width: 80, height: 1, fill: GOLD_C });
      const details = new Textbox('18ct white gold · 3.2ct round brilliant', { left: 40, top: H * 0.76, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.55)', textAlign: 'center', charSpacing: 80 });
      const brand = new Textbox('Graff, London', { left: 40, top: H * 0.82, width: W - 80, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: GOLD_C, textAlign: 'center', fontStyle: 'italic' });
      const price = new Textbox('£48,000', { left: 40, top: H * 0.88, width: W - 80, fontSize: 16, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', textAlign: 'center', fontStyle: 'italic' });
      [bg, circle, name, rule, details, brand, price].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Real Wedding': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#18120A', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#2A2016' });
      const overlay = new Rect({ left: 0, top: H * 0.6, width: W, height: H * 0.4, fill: 'rgba(24,18,10,0.75)' });
      const names = new Textbox('Isabella & James', { left: 40, top: H * 0.65, width: W - 80, fontSize: 42, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '300', textAlign: 'center' });
      const location = new Textbox('MARRIED IN TUSCANY', { left: 40, top: H * 0.78, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 200, textAlign: 'center' });
      const date = new Textbox('June 14 · 2026', { left: 40, top: H * 0.85, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.5)', textAlign: 'center' });
      [bg, imgPh, overlay, names, location, date].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Detail': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const colW = (W - 2 * 40 - 2 * 8) / 3;
      ['The Bouquet', 'The Ring', 'The Veil'].forEach((cap, i) => {
        const x = 40 + i * (colW + 8);
        const imgPh = new Rect({ left: x, top: 60, width: colW, height: H * 0.72, fill: '#EDE8E0' });
        imgPh.id = genId(); fc.add(imgPh);
        const capText = new Textbox(cap, { left: x, top: 60 + H * 0.72 + 12, width: colW, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C, textAlign: 'center', charSpacing: 80 });
        capText.id = genId(); fc.add(capText);
      });
      const rule = new Rect({ left: 40, top: H - 50, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.3)' });
      const credit = new Textbox('Photography: Studio Name', { left: 40, top: H - 35, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C });
      [rule, credit].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Navigation': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const rule = new Rect({ left: 40, top: 60, width: W - 80, height: 1, fill: GOLD_C });
      const issueLabel = new Textbox('I S S U E  0 1', { left: 40, top: 78, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 200, textAlign: 'center' });
      const rule2 = new Rect({ left: 40, top: 102, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.3)' });
      const subtitle = new Textbox('The Bridal Edition', { left: 40, top: 118, width: W - 80, fontSize: 28, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', textAlign: 'center' });
      // Contents entries as sample rows
      const entries = [
        '06  The Wedding Dress',
        '14  Jewellery Stories',
        '22  Venues of the Season',
        '34  Real Wedding: Isabella',
        '44  The Bridal Beauty Edit',
        '52  Destination: Tuscany',
      ];
      entries.forEach((entry, i) => {
        const row = new Textbox(entry, { left: 40, top: 200 + i * 52, width: W - 80, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: DARK_C });
        row.id = genId(); fc.add(row);
        if (i < entries.length - 1) {
          const divider = new Rect({ left: 40, top: 200 + i * 52 + 28, width: W - 80, height: 1, fill: 'rgba(24,18,10,0.1)' });
          divider.id = genId(); fc.add(divider);
        }
      });
      [bg, rule, issueLabel, rule2, subtitle].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Venue': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W * 0.52, height: H, fill: '#2A2B3E' });
      const rule = new Rect({ left: W * 0.56, top: 60, width: 2, height: 60, fill: GOLD_C });
      const venueName = new Textbox('HOTEL CIPRIANI', { left: W * 0.58, top: 60, width: W * 0.38, fontSize: 28, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', lineHeight: 1.1 });
      const location = new Textbox('Venice, Italy', { left: W * 0.58, top: 148, width: W * 0.38, fontSize: 11, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 80 });
      const desc = new Textbox('A palazzo suspended above the Grand Canal, where time slows to the pace of gondolas and wedding bells.', { left: W * 0.58, top: 190, width: W * 0.38, fontSize: 12, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.7)', lineHeight: 1.6 });
      const features = new Textbox('Private canal entrance\nIn-house floral studio\nDedicated wedding concierge', { left: W * 0.58, top: H * 0.6, width: W * 0.38, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.55)', lineHeight: 1.7 });
      [bg, imgPh, rule, venueName, location, desc, features].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Venue Portrait': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1612' });
      const overlay = new Rect({ left: 0, top: H * 0.55, width: W, height: H * 0.45, fill: 'rgba(10,9,8,0.8)' });
      const headline = new Textbox('Where Dreams Take Shape', { left: 40, top: H * 0.6, width: W - 80, fontSize: 36, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '300', lineHeight: 1.15 });
      const venueName = new Textbox('VENUE NAME', { left: 40, top: H * 0.75, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 150 });
      const location = new Textbox('Location · Up to 250 guests', { left: 40, top: H * 0.83, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.5)' });
      [bg, imgPh, overlay, headline, venueName, location].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Couple': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H * 0.55, fill: '#2A2B3E' });
      const rule = new Rect({ left: 40, top: H * 0.58, width: W - 80, height: 1, fill: GOLD_C });
      const names = new Textbox('Sophia & James', { left: 40, top: H * 0.62, width: W - 80, fontSize: 36, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '300' });
      const date = new Textbox('Wedding Date · Location', { left: 40, top: H * 0.74, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 100 });
      const story = new Textbox('Their love story begins here. Add your couple\'s narrative — the journey, the proposal, the day itself.', { left: 40, top: H * 0.81, width: W - 80, fontSize: 12, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.65)', lineHeight: 1.6 });
      [bg, imgPh, rule, names, date, story].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Beauty': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const imgPh = new Rect({ left: W * 0.4, top: 0, width: W * 0.6, height: H, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 60, width: 2, height: 50, fill: GOLD_C });
      const headline = new Textbox('The Art of\nBridal Beauty', { left: 60, top: 60, width: W * 0.32, fontSize: 28, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.15 });
      const divider = new Rect({ left: 40, top: 160, width: W * 0.35, height: 1, fill: 'rgba(201,168,76,0.3)' });
      const credits = new Textbox('Makeup Artist: Name\nHair Stylist: Name\nModel / Bride: Name', { left: 40, top: 178, width: W * 0.35, fontSize: 11, fontFamily: 'Jost', fill: DARK_C, lineHeight: 1.8 });
      const products = new Textbox('Key look description and products used. Add the details that make this beauty edit stand out.', { left: 40, top: H * 0.55, width: W * 0.35, fontSize: 11, fontFamily: 'Jost', fill: MUTED_C, lineHeight: 1.6 });
      [bg, imgPh, rule, headline, divider, credits, products].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Florals': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H * 0.68, fill: '#EDE8E0' });
      const overlay = new Rect({ left: 0, top: H * 0.5, width: W, height: H * 0.18, fill: 'rgba(250,248,245,0.7)' });
      const headline = new Textbox('In Full Bloom', { left: 40, top: H * 0.72, width: W - 80, fontSize: 36, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', fontWeight: '300', textAlign: 'center' });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.82, width: 80, height: 1, fill: GOLD_C });
      const florist = new Textbox('Florist Name · description of arrangement', { left: 40, top: H * 0.85, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: MUTED_C, textAlign: 'center' });
      [bg, imgPh, overlay, headline, rule, florist].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Reception': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H * 0.6, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: H * 0.63, width: W - 80, height: 1, fill: GOLD_C });
      const headline = new Textbox('Dressed to Perfection', { left: 40, top: H * 0.66, width: W - 80, fontSize: 32, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.15 });
      const credits = new Textbox('Venue: Name  ·  Table Stylist: Name  ·  Colour Palette: Ivory · Sage · Dusty Rose', { left: 40, top: H * 0.77, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C });
      const caption = new Textbox('Editorial caption describing the tablescape, the inspiration, and the styling choices that made this reception unforgettable.', { left: 40, top: H * 0.83, width: W - 80, fontSize: 12, fontFamily: 'Jost', fill: DARK_C, lineHeight: 1.6 });
      [bg, imgPh, rule, headline, credits, caption].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Ceremony': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      const imgPh = new Rect({ left: 0, top: 0, width: W, height: H * 0.62, fill: '#EDE8E0' });
      const headline = new Textbox('The Walk to\nForever', { left: 40, top: H * 0.65, width: W * 0.55, fontSize: 36, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.1 });
      const rule = new Rect({ left: W * 0.58, top: H * 0.65, width: 1, height: H * 0.28, fill: 'rgba(201,168,76,0.4)' });
      const story = new Textbox('Ceremony story goes here. The venue, the atmosphere, the emotional walk down the aisle.', { left: W * 0.62, top: H * 0.65, width: W * 0.34, fontSize: 11, fontFamily: 'Jost', fill: MUTED_C, lineHeight: 1.65 });
      const credit = new Textbox('Photography: Studio Name', { left: 40, top: H - 40, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C });
      [bg, imgPh, headline, rule, story, credit].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Stationery': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      const imgPh = new Rect({ left: W * 0.38, top: 0, width: W * 0.62, height: H, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 60, width: W * 0.32, height: 1, fill: GOLD_C });
      const headline = new Textbox('The Perfect\nFirst Impression', { left: 40, top: 76, width: W * 0.32, fontSize: 28, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.15 });
      const designer = new Textbox('Stationery Designer: Name', { left: 40, top: 178, width: W * 0.32, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 60 });
      const paper = new Textbox('Hot-press letterpress on cotton paper', { left: 40, top: 200, width: W * 0.32, fontSize: 11, fontFamily: 'Jost', fill: DARK_C });
      const desc = new Textbox('Suite description — the design concept, the paper choice, the printing technique.', { left: 40, top: H * 0.55, width: W * 0.32, fontSize: 11, fontFamily: 'Jost', fill: MUTED_C, lineHeight: 1.6 });
      [bg, imgPh, rule, headline, designer, paper, desc].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Food & Cake': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      const imgPh = new Rect({ left: W * 0.1, top: H * 0.1, width: W * 0.8, height: H * 0.55, fill: '#F0EBE0' });
      const rule = new Rect({ left: W / 2 - 60, top: H * 0.68, width: 120, height: 1, fill: GOLD_C });
      const headline = new Textbox('The Sweet Finale', { left: 40, top: H * 0.72, width: W - 80, fontSize: 32, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', textAlign: 'center' });
      const details = new Textbox('Cake Designer: Name  ·  Champagne sponge, elderflower cream, gold leaf', { left: 40, top: H * 0.82, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C, textAlign: 'center' });
      [bg, imgPh, rule, headline, details].forEach(o => { o.id = genId(); fc.add(o); });
    },
  };

  const defaultLayout = () => {
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
    const categoryLabel = new Textbox(template.category.toUpperCase(), { left: 40, top: 48, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 200 });
    const rule = new Rect({ left: 40, top: 70, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.3)' });
    const titleObj = new Textbox(template.name, { left: 40, top: 90, width: W - 80, fontSize: 40, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', fontWeight: '300', lineHeight: 1.15 });
    const desc = new Textbox(template.description || 'Add your content here', { left: 40, top: 200, width: W - 80, fontSize: 13, fontFamily: 'Jost', fill: 'rgba(24,18,10,0.6)', lineHeight: 1.65 });
    const imgPh = new Rect({ left: 40, top: 290, width: W - 80, height: H * 0.45, fill: '#F0EBE0' });
    const imgLabel = new Textbox('+ ADD IMAGE', { left: 40, top: 290 + (H * 0.45) / 2 - 10, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: MUTED_C, textAlign: 'center', charSpacing: 150 });
    [bg, categoryLabel, rule, titleObj, desc, imgPh, imgLabel].forEach(o => { o.id = genId(); fc.add(o); });
  };

  const layoutFn = layouts[template.category] || defaultLayout;
  layoutFn();
  fc.requestRenderAll();
}

// ── Spread pairing logic ──────────────────────────────────────────────────────
function getSpreadIndices(currentPageIndex, totalPages) {
  // currentPageIndex is 0-based
  if (currentPageIndex === 0) {
    // Cover — alone on right, blank grey on left
    return { leftIndex: null, rightIndex: 0 };
  }
  // Group pages into spreads: [1,2], [3,4], [5,6]...
  const spreadNum = Math.floor((currentPageIndex - 1) / 2);
  const leftIndex  = 1 + spreadNum * 2;       // e.g. 1, 3, 5
  const rightIndex = 1 + spreadNum * 2 + 1;   // e.g. 2, 4, 6
  return {
    leftIndex:  leftIndex  < totalPages ? leftIndex  : null,
    rightIndex: rightIndex < totalPages ? rightIndex : null,
  };
}

// ── Grid overlay ──────────────────────────────────────────────────────────────
function GridOverlay({ width, height, cellPx = 40 }) {
  const lines = [];
  for (let x = cellPx; x < width; x += cellPx) {
    lines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(201,169,110,0.12)" strokeWidth={0.5} />
    );
  }
  for (let y = cellPx; y < height; y += cellPx) {
    lines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y}
        stroke="rgba(201,169,110,0.12)" strokeWidth={0.5} />
    );
  }
  return (
    <svg
      width={width} height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      {lines}
    </svg>
  );
}

// ── Ruler ─────────────────────────────────────────────────────────────────────
function Ruler({ length, isVertical, scale = 1, onDragGuide }) {
  const TICK_EVERY = 40; // px
  const RULER_SIZE = 20;
  const ticks = [];
  const count = Math.ceil(length / TICK_EVERY);

  for (let i = 0; i <= count; i++) {
    const pos = i * TICK_EVERY;
    const isMajor = i % 5 === 0;
    const label = isMajor ? Math.round(pos / scale) : null;

    if (isVertical) {
      ticks.push(
        <g key={i}>
          <line
            x1={isMajor ? 0 : RULER_SIZE / 2} y1={pos}
            x2={RULER_SIZE} y2={pos}
            stroke="rgba(255,255,255,0.3)" strokeWidth={0.5}
          />
          {label !== null && (
            <text
              x={2} y={pos + 3}
              fill="rgba(255,255,255,0.35)"
              fontSize={7}
              fontFamily={NU}
              transform={`rotate(-90, 2, ${pos + 3})`}
            >
              {label}
            </text>
          )}
        </g>
      );
    } else {
      ticks.push(
        <g key={i}>
          <line
            x1={pos} y1={isMajor ? 0 : RULER_SIZE / 2}
            x2={pos} y2={RULER_SIZE}
            stroke="rgba(255,255,255,0.3)" strokeWidth={0.5}
          />
          {label !== null && (
            <text
              x={pos + 2} y={RULER_SIZE - 4}
              fill="rgba(255,255,255,0.35)"
              fontSize={7}
              fontFamily={NU}
            >
              {label}
            </text>
          )}
        </g>
      );
    }
  }

  if (isVertical) {
    return (
      <svg
        width={RULER_SIZE}
        height={length}
        style={{
          flexShrink: 0,
          background: '#111',
          cursor: onDragGuide ? 'ew-resize' : 'default',
          userSelect: 'none',
        }}
        onMouseDown={onDragGuide ? (e) => { e.preventDefault(); onDragGuide(e.clientX); } : undefined}
      >
        {ticks}
      </svg>
    );
  }
  return (
    <svg
      width={length}
      height={RULER_SIZE}
      style={{
        flexShrink: 0,
        background: '#111',
        cursor: onDragGuide ? 'ns-resize' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={onDragGuide ? (e) => { e.preventDefault(); onDragGuide(e.clientY); } : undefined}
    >
      {ticks}
    </svg>
  );
}

// ── Guide lines overlay ───────────────────────────────────────────────────────
function GuideLines({ guides, onMoveGuide }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {guides.h.map((y, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: 1,
            background: 'rgba(0,168,255,0.7)',
            pointerEvents: 'auto',
            cursor: 'ns-resize',
            // Extend hit area
            paddingTop: 3,
            paddingBottom: 3,
            marginTop: -3,
            marginBottom: -3,
            boxSizing: 'content-box',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMoveGuide('h', i, e);
          }}
        />
      ))}
      {guides.v.map((x, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x,
            width: 1,
            background: 'rgba(0,168,255,0.7)',
            pointerEvents: 'auto',
            cursor: 'ew-resize',
            paddingLeft: 3,
            paddingRight: 3,
            marginLeft: -3,
            marginRight: -3,
            boxSizing: 'content-box',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMoveGuide('v', i, e);
          }}
        />
      ))}
    </div>
  );
}

// ── Bleed overlay ─────────────────────────────────────────────────────────────
function BleedOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
      {/* Bleed line — 3mm ≈ 11px */}
      <div style={{ position: 'absolute', inset: 11, border: '1px dashed rgba(255,80,80,0.5)' }} />
      {/* Safe zone — 5mm ≈ 19px */}
      <div style={{ position: 'absolute', inset: 19, border: '1px dashed rgba(0,168,255,0.35)' }} />
    </div>
  );
}

// ── Page number helpers ───────────────────────────────────────────────────────
function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['m','cm','d','cd','c','xc','l','xl','x','ix','v','iv','i'];
  let result = '';
  vals.forEach((v, i) => { while (num >= v) { result += syms[i]; num -= v; } });
  return result;
}

function getPageDisplayNumber(pageIndex, settings, totalPages) {
  if (settings.excludeCover && pageIndex === 0) return '';
  if (settings.excludeBackCover && pageIndex === totalPages - 1 && totalPages > 1) return '';

  let num = pageIndex;
  const displayNum = num + (settings.startFrom - 1);

  if (displayNum <= 0) return '';

  let formatted;
  if (settings.format === 'roman') {
    formatted = toRoman(displayNum);
  } else if (settings.format === 'arabic') {
    formatted = String(displayNum);
  } else {
    return '';
  }

  return `${settings.prefix}${formatted}${settings.suffix}`;
}

// ── Layer helpers ─────────────────────────────────────────────────────────────
// Derive a human-readable label from a Fabric object
function getLayerLabel(obj) {
  if (obj.customType === 'pagenumber') return '№ Page Number';
  const type = (obj.type || '').toLowerCase();
  if (type === 'textbox' || type === 'text' || type === 'itext') {
    const text = (obj.text || '').trim().slice(0, 24);
    return text ? `"${text}${(obj.text || '').length > 24 ? '…' : ''}"` : 'Text';
  }
  if (type === 'image') return 'Image';
  if (type === 'rect') return 'Rectangle';
  if (type === 'circle') return 'Circle';
  if (type === 'line') return 'Line';
  if (type === 'triangle') return 'Triangle';
  return obj.type || 'Object';
}

// Build the serialisable layers array from a canvas instance
function buildLayers(fc) {
  if (!fc) return [];
  const objs = fc.getObjects();
  const activeObj = fc.getActiveObject?.();
  const activeId = activeObj?.id;
  // Reverse so topmost layer is first (matches Figma/Photoshop convention)
  return [...objs].reverse().map(obj => ({
    id: obj.id,
    type: (obj.type || '').toLowerCase(),
    customType: obj.customType,
    label: getLayerLabel(obj),
    visible: obj.visible !== false,
    locked: obj.selectable === false,
    selected: !!activeId && obj.id === activeId,
  }));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PageDesigner({ issue, onIssueUpdate }) {
  // Canvas element refs
  const canvasElRef     = useRef(null); // right / single
  const canvasElRefLeft = useRef(null); // left (spread view only)

  // Fabric instance refs
  const fabricRef     = useRef(null); // right / single
  const fabricRefLeft = useRef(null); // left (spread view only)

  // Canvas container refs (for guide coordinate calculations)
  const canvasContainerRef     = useRef(null); // right / single (or active in spread)
  const canvasContainerRefLeft = useRef(null); // left page in spread view

  // Canvas area ref (for auto-fit zoom)
  const canvasAreaRef = useRef(null);

  const initRef = useRef(false);

  const [pages, setPages] = useState([{
    id: genId(),
    pageNumber: 1,
    canvasJSON: null,
    thumbnailDataUrl: null,
    name: 'Page 1',
  }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedObject, setSelectedObject] = useState(null);
  const [pageSize, setPageSize] = useState(issue?.page_size || 'A4');
  const [layers, setLayers] = useState([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showBleed, setShowBleed] = useState(false);
  const [lightsOff, setLightsOff] = useState(false); // dim surroundings to focus on canvas
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null); // Date | null — most recent successful save
  const [exportingDigital, setExportingDigital] = useState(false);
  const [exportingPrint, setExportingPrint] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Spread view state — default ON for wide screens
  const [spreadView, setSpreadView] = useState(() => window.innerWidth >= 1400);
  const [activeSpreadSide, setActiveSpreadSide] = useState('right'); // 'left' | 'right'

  // Guide rails state
  const [guides, setGuides] = useState({ h: [], v: [] });
  const [draftGuide, setDraftGuide] = useState(null); // null | { axis: 'h'|'v', pos: number }

  // Page number settings
  const [pageNumberSettings, setPageNumberSettings] = useState({
    format: 'arabic',
    prefix: '',
    suffix: '',
    startFrom: 1,
    excludeCover: true,
    excludeBackCover: true,
    position: 'bottom-center',
  });

  // Snap-to-grid ref — lets Fabric event handlers read current state without stale closure
  const snapToGridRef = useRef(false);
  useEffect(() => { snapToGridRef.current = snapToGrid; }, [snapToGrid]);

  // Clipboard ref — stores a cloned Fabric object for copy/paste
  const clipboardRef = useRef(null);

  const SNAP_GRID = 40; // matches GridOverlay cell size

  const dims = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  // ── Auto-fit zoom ────────────────────────────────────────────────────────────
  // Note: fitToScreen only calls setZoom here. handleZoomChange (defined below)
  // updates the Fabric canvas sizes too. We use a ref to avoid circular deps.
  const SPINE_GAP = 4;

  const fitToScreenRaw = useCallback(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const availW = el.clientWidth  - 80;
    const availH = el.clientHeight - 80;
    const canvasW = spreadView ? (dims.w * 2 + SPINE_GAP) : dims.w;
    const canvasH = dims.h;
    const scaleW = availW / canvasW;
    const scaleH = availH / canvasH;
    const fit = Math.min(scaleW, scaleH, 1.5);
    return parseFloat(fit.toFixed(2));
  }, [dims.w, dims.h, spreadView]); // eslint-disable-line react-hooks/exhaustive-deps

  const fitToScreen = useCallback(() => {
    const fit = fitToScreenRaw();
    if (fit != null) setZoom(fit);
  }, [fitToScreenRaw]);

  useEffect(() => {
    fitToScreen();
    const ro = new ResizeObserver(fitToScreen);
    if (canvasAreaRef.current) ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, [dims.w, dims.h, spreadView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Active canvas helper ────────────────────────────────────────────────────
  const getActiveCanvas = useCallback(() => {
    if (!spreadView) return fabricRef.current;
    return activeSpreadSide === 'left' ? fabricRefLeft.current : fabricRef.current;
  }, [spreadView, activeSpreadSide]);

  // ── Undo helpers ────────────────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const json = fc.toJSON(['id']);
    setUndoStack(prev => [...prev.slice(-29), json]);
    setRedoStack([]);
  }, [getActiveCanvas]);

  // ── Canvas init helper ──────────────────────────────────────────────────────
  const initCanvas = useCallback((canvasEl, pageJSON, onSelect, onModify, onLayersChange) => {
    const fc = new Canvas(canvasEl, {
      width: dims.w,
      height: dims.h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });

    const syncL = () => onLayersChange?.(buildLayers(fc));

    fc.on('selection:created', (e) => { onSelect(e.selected?.[0] || null); syncL(); });
    fc.on('selection:updated', (e) => { onSelect(e.selected?.[0] || null); syncL(); });
    fc.on('selection:cleared', () => { onSelect(null); syncL(); });
    fc.on('object:modified', () => { onModify(); syncL(); });
    fc.on('object:added',    () => { onModify(); syncL(); });
    fc.on('object:removed',  () => { onModify(); syncL(); });

    // Snap to grid — reads live state via ref so no stale closures
    fc.on('object:moving', (e) => {
      if (!snapToGridRef.current) return;
      const obj = e.target;
      const g = SNAP_GRID;
      obj.set({
        left: Math.round(obj.left / g) * g,
        top:  Math.round(obj.top  / g) * g,
      });
    });
    fc.on('object:scaling', (e) => {
      if (!snapToGridRef.current) return;
      const obj = e.target;
      const g = SNAP_GRID;
      // Snap the scaled dimensions to grid increments
      const w = Math.round((obj.width * obj.scaleX) / g) * g;
      const h = Math.round((obj.height * obj.scaleY) / g) * g;
      obj.set({
        scaleX: w / obj.width,
        scaleY: h / obj.height,
      });
    });

    if (pageJSON) {
      fc.loadFromJSON(pageJSON).then(() => { fc.renderAll(); syncL(); });
    } else {
      syncL();
    }

    return fc;
  }, [dims.w, dims.h]);

  // ── Load saved pages from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    if (!issue?.id) { setPagesLoaded(true); return; }
    fetchPages(issue.id).then(({ data, error }) => {
      if (!error && data?.length) {
        setPages(data.map(row => ({
          pageNumber: row.page_number,
          canvasJSON: row.template_data?.canvasJSON ?? null,
          thumbnailDataUrl: row.thumbnail_url ?? null,
          name: row.name ?? `Page ${row.page_number}`,
        })));
        // Hydrate lastSaved from the most recent page update timestamp
        const maxTs = data.reduce((acc, row) => {
          const t = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          return t > acc ? t : acc;
        }, 0);
        if (maxTs > 0) setLastSaved(new Date(maxTs));
      }
      setPagesLoaded(true);
    });
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Canvas init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pagesLoaded) return; // wait until DB pages are loaded
    if (!spreadView) {
      // ── Single page mode ──
      if (!canvasElRef.current) return;

      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }

      const fc = initCanvas(
        canvasElRef.current,
        pages[currentPageIndex]?.canvasJSON,
        (obj) => setSelectedObject(obj),
        pushUndo,
        setLayers,
      );
      fabricRef.current = fc;

      return () => {
        if (fabricRef.current === fc) {
          fc.dispose();
          fabricRef.current = null;
        }
      };
    } else {
      // ── Spread mode ──
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);

      // Dispose existing instances
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (fabricRefLeft.current) {
        fabricRefLeft.current.dispose();
        fabricRefLeft.current = null;
      }

      // Init right canvas (always present)
      if (canvasElRef.current) {
        const fcRight = initCanvas(
          canvasElRef.current,
          rightIndex !== null ? pages[rightIndex]?.canvasJSON : null,
          (obj) => {
            setActiveSpreadSide('right');
            setSelectedObject(obj);
          },
          pushUndo,
          setLayers,
        );
        fabricRef.current = fcRight;
      }

      // Init left canvas (only when leftIndex is valid and element is mounted)
      if (leftIndex !== null && canvasElRefLeft.current) {
        const fcLeft = initCanvas(
          canvasElRefLeft.current,
          pages[leftIndex]?.canvasJSON,
          (obj) => {
            setActiveSpreadSide('left');
            setSelectedObject(obj);
          },
          pushUndo,
          setLayers,
        );
        fabricRefLeft.current = fcLeft;
      }

      return () => {
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }
        if (fabricRefLeft.current) {
          fabricRefLeft.current.dispose();
          fabricRefLeft.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadView, pageSize, currentPageIndex, pagesLoaded]);

  // ── Sync selectedObject when active spread side changes ────────────────────
  useEffect(() => {
    const fc = getActiveCanvas();
    if (fc) setSelectedObject(fc.getActiveObject() || null);
  }, [activeSpreadSide]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page switching (single mode) ────────────────────────────────────────────
  useEffect(() => {
    if (spreadView) return; // handled by canvas init effect
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = '#ffffff';
    const page = pages[currentPageIndex];
    if (page?.canvasJSON) {
      fc.loadFromJSON(page.canvasJSON).then(() => fc.renderAll());
    } else {
      fc.renderAll();
    }
    setSelectedObject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      // Don't intercept when typing in an input / textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Undo / Redo / Save
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (mod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
      if (mod && e.key === 's') { e.preventDefault(); handleSave(); }

      // Copy — Ctrl/Cmd+C
      if (mod && e.key === 'c') {
        const fc = getActiveCanvas();
        const obj = fc?.getActiveObject?.();
        if (!obj) return;
        e.preventDefault();
        obj.clone().then(cloned => {
          clipboardRef.current = cloned;
        });
      }

      // Cut — Ctrl/Cmd+X
      if (mod && e.key === 'x') {
        const fc = getActiveCanvas();
        const obj = fc?.getActiveObject?.();
        if (!obj) return;
        e.preventDefault();
        obj.clone().then(cloned => {
          clipboardRef.current = cloned;
          fc.remove(obj);
          fc.discardActiveObject();
          fc.requestRenderAll();
          pushUndo();
        });
      }

      // Paste — Ctrl/Cmd+V
      if (mod && e.key === 'v') {
        const fc = getActiveCanvas();
        if (!fc || !clipboardRef.current) return;
        e.preventDefault();
        clipboardRef.current.clone().then(cloned => {
          // Offset paste so it doesn't land exactly on top
          cloned.set({
            left: (cloned.left ?? 0) + 20,
            top:  (cloned.top  ?? 0) + 20,
            id:   genId(),
          });
          fc.add(cloned);
          fc.setActiveObject(cloned);
          fc.requestRenderAll();
          pushUndo();
          // Update clipboard to the new clone so repeated paste keeps offsetting
          clipboardRef.current = cloned;
        });
      }

      // Duplicate — Ctrl/Cmd+D
      if (mod && e.key === 'd') {
        const fc = getActiveCanvas();
        const obj = fc?.getActiveObject?.();
        if (!obj) return;
        e.preventDefault();
        obj.clone().then(cloned => {
          cloned.set({
            left: (obj.left ?? 0) + 20,
            top:  (obj.top  ?? 0) + 20,
            id:   genId(),
          });
          fc.add(cloned);
          fc.setActiveObject(cloned);
          fc.requestRenderAll();
          pushUndo();
        });
      }

      // Delete selected object — Backspace or Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const fc = getActiveCanvas();
        const obj = fc?.getActiveObject?.();
        if (!obj) return;
        // Don't intercept if Fabric textbox is in edit mode
        if (obj.isEditing) return;
        e.preventDefault();
        fc.remove(obj);
        fc.discardActiveObject();
        fc.requestRenderAll();
        pushUndo();
      }

      // Escape — deselect
      if (e.key === 'Escape') {
        const fc = getActiveCanvas();
        fc?.discardActiveObject?.();
        fc?.requestRenderAll?.();
      }

      // Tab switches active spread side in spread view
      if (e.key === 'Tab' && spreadView) {
        e.preventDefault();
        setActiveSpreadSide(s => s === 'left' ? 'right' : 'left');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack, spreadView]);

  // ── Save current page(s) to state ──────────────────────────────────────────
  const saveCurrentPageToState = useCallback(() => {
    if (!spreadView) {
      const fc = fabricRef.current;
      if (!fc) return;
      const json = fc.toJSON(['id', 'name', 'custom']);
      const thumb = fc.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
      setPages(prev => prev.map((p, i) =>
        i === currentPageIndex ? { ...p, canvasJSON: json, thumbnailDataUrl: thumb } : p
      ));
    } else {
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);
      setPages(prev => prev.map((p, i) => {
        if (i === leftIndex && fabricRefLeft.current) {
          const json  = fabricRefLeft.current.toJSON(['id', 'name', 'custom']);
          const thumb = fabricRefLeft.current.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
          return { ...p, canvasJSON: json, thumbnailDataUrl: thumb };
        }
        if (i === rightIndex && fabricRef.current) {
          const json  = fabricRef.current.toJSON(['id', 'name', 'custom']);
          const thumb = fabricRef.current.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
          return { ...p, canvasJSON: json, thumbnailDataUrl: thumb };
        }
        return p;
      }));
    }
  }, [spreadView, currentPageIndex, pages.length]);

  // ── Add elements ────────────────────────────────────────────────────────────
  const addElement = useCallback((variant, initialText) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const defaults = ELEMENT_DEFAULTS[variant] || ELEMENT_DEFAULTS.text;

    let text = initialText;
    if (!text) {
      if (variant === 'heading') text = 'Your Headline';
      else if (variant === 'pullquote') text = '"A beautiful quote goes here"';
      else if (variant === 'caption') text = 'PHOTO CAPTION';
      else if (variant === 'subheading') text = 'Subheading';
      else if (variant === 'aitext') text = initialText || 'AI generated text';
      else text = 'Your text here';
    }

    const tb = new Textbox(text, {
      left: 60,
      top: 60,
      width: defaults.width || 300,
      fontSize: defaults.fontSize || 24,
      fontFamily: defaults.fontFamily || 'Cormorant Garamond',
      fill: defaults.fill || '#18120A',
      fontWeight: defaults.fontWeight || '400',
      fontStyle: defaults.fontStyle || 'normal',
      charSpacing: defaults.charSpacing || 0,
      lineHeight: 1.3,
      splitByGrapheme: false,
    });

    loadGoogleFont(defaults.fontFamily || 'Cormorant Garamond');
    fc.add(tb);
    fc.setActiveObject(tb);
    fc.renderAll();
    pushUndo();
  }, [getActiveCanvas, pushUndo]);

  const addImage = useCallback(async (src) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    try {
      const img = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });
      const scale = (dims.w * 0.5) / img.width;
      img.set({ left: 60, top: 60, scaleX: scale, scaleY: scale });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
      pushUndo();
    } catch (e) {
      console.error('Failed to load image:', e);
    }
  }, [getActiveCanvas, dims, pushUndo]);

  const addShape = useCallback((type) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    let shape;
    if (type === 'rect') {
      shape = new Rect({ left: 60, top: 60, width: 200, height: 120, fill: GOLD, rx: 0 });
    } else if (type === 'circle') {
      shape = new Circle({ left: 60, top: 60, radius: 60, fill: GOLD });
    } else if (type === 'line' || type === 'divider') {
      shape = new Line([0, 0, 200, 0], {
        left: 60, top: 100,
        stroke: GOLD,
        strokeWidth: type === 'divider' ? 1 : 2,
      });
    }
    if (shape) {
      fc.add(shape);
      fc.setActiveObject(shape);
      fc.renderAll();
      pushUndo();
    }
  }, [getActiveCanvas, pushUndo]);

  const addPageNumber = useCallback(() => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const displayNum = getPageDisplayNumber(currentPageIndex, pageNumberSettings, pages.length);
    const tb = new Textbox(displayNum || '1', {
      left: dims.w / 2 - 30,
      top: dims.h - 50,
      width: 60,
      fontSize: 10,
      fontFamily: 'Jost',
      fill: '#18120A',
      fontWeight: '400',
      charSpacing: 60,
      textAlign: 'center',
    });
    tb.set('customType', 'pagenumber');
    loadGoogleFont('Jost');
    fc.add(tb);
    fc.setActiveObject(tb);
    fc.renderAll();
    pushUndo();
  }, [getActiveCanvas, currentPageIndex, pageNumberSettings, pages.length, dims, pushUndo]);

  function handleAddElement(variant, text) {
    if (['text', 'heading', 'caption', 'pullquote', 'subheading', 'aitext'].includes(variant)) {
      addElement(variant, text);
    } else if (['rect', 'circle', 'line', 'divider'].includes(variant)) {
      addShape(variant);
    } else if (variant === 'pagenumber') {
      addPageNumber();
    }
  }

  const handleApplyPageNumbers = useCallback(() => {
    saveCurrentPageToState();
    setPages(prev => prev.map((page, i) => {
      const displayNum = getPageDisplayNumber(i, pageNumberSettings, prev.length);
      if (!displayNum) return page;

      let canvasData = page.canvasJSON
        ? JSON.parse(JSON.stringify(page.canvasJSON))
        : { objects: [], version: '6.0.0' };
      if (canvasData.objects) {
        canvasData.objects = canvasData.objects.filter(o => o.customType !== 'pagenumber');
      } else {
        canvasData.objects = [];
      }

      const pnObj = {
        type: 'textbox',
        customType: 'pagenumber',
        left: dims.w / 2 - 30,
        top: dims.h - 50,
        width: 60,
        text: displayNum,
        fontSize: 10,
        fontFamily: 'Jost',
        fill: '#18120A',
        fontWeight: '400',
        charSpacing: 60,
        textAlign: 'center',
      };
      canvasData.objects.push(pnObj);

      return { ...page, canvasJSON: canvasData };
    }));
  }, [pageNumberSettings, dims, saveCurrentPageToState]);

  function handleAddTemplate(templateIndex) {
    const fc = getActiveCanvas();
    if (!fc) return;
    const template = TEMPLATES[templateIndex];
    if (!template) return;
    applyTemplate(fc, template, dims);
    pushUndo();
  }

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const fc = getActiveCanvas();
    if (!fc || undoStack.length < 2) return;
    const prev = undoStack[undoStack.length - 2];
    const current = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, current]);
    setUndoStack(s => s.slice(0, -1));
    fc.loadFromJSON(prev).then(() => fc.renderAll());
  }, [getActiveCanvas, undoStack]);

  const handleRedo = useCallback(() => {
    const fc = getActiveCanvas();
    if (!fc || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, next]);
    setRedoStack(r => r.slice(0, -1));
    fc.loadFromJSON(next).then(() => fc.renderAll());
  }, [getActiveCanvas, redoStack]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!issue?.id) return;
    setSaving(true);
    try {
      // Build a fresh snapshot: read live canvas JSON for currently-open page(s),
      // use cached canvasJSON for all other pages (they haven't changed).
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);
      const freshPages = pages.map((page, i) => {
        if (!spreadView && i === currentPageIndex && fabricRef.current) {
          return { ...page, canvasJSON: fabricRef.current.toJSON(['id', 'name', 'custom']) };
        }
        if (spreadView && i === leftIndex && fabricRefLeft.current) {
          return { ...page, canvasJSON: fabricRefLeft.current.toJSON(['id', 'name', 'custom']) };
        }
        if (spreadView && i === rightIndex && fabricRef.current) {
          return { ...page, canvasJSON: fabricRef.current.toJSON(['id', 'name', 'custom']) };
        }
        return page;
      });

      // Batch upsert all pages to Supabase (canvasJSON only — images are written on Publish)
      // updated_at is set explicitly here because Postgres DEFAULT now() only fires on INSERT,
      // not on UPDATE — without this, the timestamp would freeze at first insert.
      const savedAt = new Date();
      const { error } = await upsertPages(
        freshPages.map((page, i) => ({
          issue_id:    issue.id,
          page_number: i + 1,
          source_type: 'template',
          template_data: { engine: 'designer-v1', canvasJSON: page.canvasJSON ?? null },
          updated_at:  savedAt.toISOString(),
        }))
      );
      if (error) throw error;

      // Sync local state so further edits start from the saved snapshot
      setPages(freshPages);
      setLastSaved(savedAt);
    } catch (e) {
      console.error('Save failed:', e);
      alert('Save failed: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  }, [issue, pages, spreadView, currentPageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Digital Export ──────────────────────────────────────────────────────────
  const handleExportDigital = useCallback(async () => {
    if (!issue?.id) return;
    setExportingDigital(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 150));

      const renderVersion = (issue.render_version || 1) + 1;

      // Create a fresh off-screen Fabric canvas at true 1:1 scale for rendering.
      // We CANNOT reuse fabricRef.current because it is zoomed (e.g. 0.6×) and
      // would produce undersized images. An off-screen canvas always renders at
      // the real page dimensions regardless of the designer's current zoom level.
      const { Canvas: FabricCanvas } = await import('fabric');
      const offscreenEl = document.createElement('canvas');
      offscreenEl.width  = dims.w;
      offscreenEl.height = dims.h;
      const offscreen = new FabricCanvas(offscreenEl, {
        width: dims.w,
        height: dims.h,
        backgroundColor: '#ffffff',
        enableRetinaScaling: false,
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Clear and reload this page's canvas JSON
        offscreen.clear();
        offscreen.backgroundColor = '#ffffff';
        if (page.canvasJSON) {
          await offscreen.loadFromJSON(page.canvasJSON);
        }
        offscreen.renderAll();
        // Small settle time so fonts / images finish drawing
        await new Promise(r => setTimeout(r, 60));
        offscreen.renderAll();

        // Export at true size (multiplier:1 because canvas is already full-res)
        const pageBlob  = await canvasToJpegBlob(offscreen, 1);
        const thumbBlob = await canvasToJpegBlob(offscreen, 0.35);

        const { publicUrl: imageUrl, storagePath: imagePath } = await uploadPageImage(issue.id, renderVersion, i + 1, pageBlob);
        const { publicUrl: thumbUrl, storagePath: thumbPath } = await uploadThumbImage(issue.id, renderVersion, i + 1, thumbBlob);

        await upsertPage({
          issue_id: issue.id,
          page_number: i + 1,
          source_type: 'template',
          image_url: imageUrl,
          image_storage_path: imagePath,
          thumbnail_url: thumbUrl,
          thumbnail_storage_path: thumbPath,
          render_version: renderVersion,
          template_data: { engine: 'designer-v1', canvasJSON: page.canvasJSON },
        });
      }

      // Clean up off-screen canvas
      offscreen.dispose();

      onIssueUpdate?.({ render_version: renderVersion, page_count: pages.length, processing_state: 'ready' });
      alert(`✓ ${pages.length} page${pages.length !== 1 ? 's' : ''} published to reader`);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + e.message);
    } finally {
      setExportingDigital(false);
    }
  }, [issue, pages, dims, saveCurrentPageToState, onIssueUpdate]);

  // ── Print Export ────────────────────────────────────────────────────────────
  const handleExportPrint = useCallback(async () => {
    setExportingPrint(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 100));

      // Use right canvas (single canvas) for export iteration
      const fc = fabricRef.current;
      const printPages = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!fc) break;
        if (page.canvasJSON) {
          await fc.loadFromJSON(page.canvasJSON);
          fc.renderAll();
        }
        const blob = await canvasToPrintJpegBlob(fc);
        printPages.push({ blob, pageSize });
      }

      const pdf = await generatePrintPDF(printPages, issue?.title || 'Magazine Issue', pageSize);
      downloadPDF(pdf, `${issue?.slug || 'issue'}_PRINT_READY.pdf`);
    } catch (e) {
      alert('Print export failed: ' + e.message);
    } finally {
      setExportingPrint(false);
    }
  }, [issue, pages, pageSize, saveCurrentPageToState]);

  // ── Page management ─────────────────────────────────────────────────────────
  function handleSelectPage(i) {
    saveCurrentPageToState();
    setCurrentPageIndex(i);
    if (spreadView) {
      // Determine which side of the spread was clicked and activate it
      const { leftIndex } = getSpreadIndices(i, pages.length);
      if (i === leftIndex) setActiveSpreadSide('left');
      else setActiveSpreadSide('right');
    }
  }

  function handleAddPage() {
    saveCurrentPageToState();
    const newPage = {
      id: genId(),
      pageNumber: pages.length + 1,
      canvasJSON: null,
      thumbnailDataUrl: null,
      name: `Page ${pages.length + 1}`,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  }

  function handleDeletePage(i) {
    if (pages.length <= 1) return;
    setPages(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
  }

  function handleDuplicatePage(i) {
    saveCurrentPageToState();
    setPages(prev => {
      const clone = { ...prev[i], id: genId() };
      const next = [...prev.slice(0, i + 1), clone, ...prev.slice(i + 1)];
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(i + 1);
  }

  function handleReorderPage(from, to) {
    saveCurrentPageToState();
    setPages(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });
    setCurrentPageIndex(to);
  }

  // ── Page size change ────────────────────────────────────────────────────────
  function handlePageSizeChange(size) {
    saveCurrentPageToState();
    setPageSize(size);
  }

  // ── Zoom ────────────────────────────────────────────────────────────────────
  function handleZoomChange(z) {
    setZoom(z);
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setZoom(z);
    fc.setWidth(dims.w * z);
    fc.setHeight(dims.h * z);
    // Also update left canvas in spread view
    if (spreadView && fabricRefLeft.current) {
      fabricRefLeft.current.setZoom(z);
      fabricRefLeft.current.setWidth(dims.w * z);
      fabricRefLeft.current.setHeight(dims.h * z);
    }
  }

  // ── Properties update ───────────────────────────────────────────────────────
  function handlePropertiesUpdate() {
    // Trigger thumbnail refresh after property changes
    const fc = getActiveCanvas();
    if (!fc) return;
    const thumb = fc.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });

    if (!spreadView) {
      setPages(prev => prev.map((p, i) =>
        i === currentPageIndex ? { ...p, thumbnailDataUrl: thumb } : p
      ));
    } else {
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);
      const targetIndex = activeSpreadSide === 'left' ? leftIndex : rightIndex;
      if (targetIndex !== null) {
        setPages(prev => prev.map((p, i) =>
          i === targetIndex ? { ...p, thumbnailDataUrl: thumb } : p
        ));
      }
    }
  }

  // ── Guide rails ─────────────────────────────────────────────────────────────

  // Helper: get the active canvas container ref (left or right in spread, single otherwise)
  const getActiveContainerRef = useCallback(() => {
    if (spreadView && activeSpreadSide === 'left') return canvasContainerRefLeft;
    return canvasContainerRef;
  }, [spreadView, activeSpreadSide]);

  // Create horizontal guide by dragging from horizontal ruler
  const handleCreateHGuide = useCallback((startClientY) => {
    const onMove = (e) => {
      setDraftGuide({ axis: 'h', pos: e.clientY });
    };
    const onUp = (e) => {
      const canvasContainer = getActiveContainerRef().current;
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        const y = (e.clientY - rect.top) / zoom;
        if (y > 0 && y < dims.h) {
          setGuides(g => ({ ...g, h: [...g.h, Math.round(y)] }));
        }
      }
      setDraftGuide(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [zoom, dims, getActiveContainerRef]);

  // Create vertical guide by dragging from vertical ruler
  const handleCreateVGuide = useCallback((startClientX) => {
    const onMove = (e) => setDraftGuide({ axis: 'v', pos: e.clientX });
    const onUp = (e) => {
      const canvasContainer = getActiveContainerRef().current;
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        if (x > 0 && x < dims.w) {
          setGuides(g => ({ ...g, v: [...g.v, Math.round(x)] }));
        }
      }
      setDraftGuide(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [zoom, dims, getActiveContainerRef]);

  // Move or delete an existing guide
  const handleMoveGuide = useCallback((axis, index, e) => {
    e.preventDefault();
    const canvasContainer = getActiveContainerRef().current;
    const onMove = (ev) => {
      if (!canvasContainer) return;
      const rect = canvasContainer.getBoundingClientRect();
      const pos = axis === 'h'
        ? (ev.clientY - rect.top) / zoom
        : (ev.clientX - rect.left) / zoom;
      const maxPos = axis === 'h' ? dims.h : dims.w;
      const clamped = Math.max(0, Math.min(maxPos, Math.round(pos)));
      setGuides(g => {
        const arr = [...g[axis]];
        arr[index] = clamped;
        return { ...g, [axis]: arr };
      });
    };
    const onUp = (ev) => {
      // If dragged outside canvas bounds, delete the guide
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        const outX = ev.clientX < rect.left || ev.clientX > rect.right;
        const outY = ev.clientY < rect.top  || ev.clientY > rect.bottom;
        if ((axis === 'h' && outY) || (axis === 'v' && outX)) {
          setGuides(g => {
            const arr = g[axis].filter((_, i) => i !== index);
            return { ...g, [axis]: arr };
          });
        }
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [zoom, dims, getActiveContainerRef]);

  // Clear all guides
  const handleClearGuides = useCallback(() => setGuides({ h: [], v: [] }), []);

  // ── Layer panel actions ─────────────────────────────────────────────────────
  const handleSelectLayer = useCallback((id) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const obj = fc.getObjects().find(o => o.id === id);
    if (obj) { fc.setActiveObject(obj); fc.requestRenderAll(); }
  }, [getActiveCanvas]);

  const handleToggleLayerVisibility = useCallback((id) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const obj = fc.getObjects().find(o => o.id === id);
    if (!obj) return;
    obj.set('visible', !obj.visible);
    fc.requestRenderAll();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, [getActiveCanvas]);

  const handleToggleLayerLock = useCallback((id) => {
    const fc = getActiveCanvas();
    if (!fc) return;
    const obj = fc.getObjects().find(o => o.id === id);
    if (!obj) return;
    const nowLocked = obj.selectable !== false; // true → we are about to lock it
    obj.set({ selectable: !nowLocked, evented: !nowLocked });
    if (nowLocked && fc.getActiveObject?.() === obj) fc.discardActiveObject();
    fc.requestRenderAll();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: nowLocked } : l));
  }, [getActiveCanvas]);

  const handleReorderLayer = useCallback((draggedId, overId) => {
    if (draggedId === overId) return;
    const fc = getActiveCanvas();
    if (!fc) return;
    // _objects is bottom→top in Fabric; display list is reversed (top→bottom)
    const objs = fc._objects;
    const fromIdx = objs.findIndex(o => o.id === draggedId);
    const toIdx   = objs.findIndex(o => o.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [obj] = objs.splice(fromIdx, 1);
    objs.splice(toIdx, 0, obj);
    fc.requestRenderAll();
    pushUndo();
    setLayers(buildLayers(fc));
  }, [getActiveCanvas, pushUndo]);

  const RULER_SIZE = showRuler ? 20 : 0;

  // Compute spread indices for render
  const spreadIndices = getSpreadIndices(currentPageIndex, pages.length);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: '#141210',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <DesignerToolbar
        issue={issue}
        pages={pages}
        currentPageIndex={currentPageIndex}
        canUndo={undoStack.length >= 2}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onFitPage={fitToScreen}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(v => !v)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(v => !v)}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(v => !v)}
        showBleed={showBleed}
        onToggleBleed={() => setShowBleed(v => !v)}
        lightsOff={lightsOff}
        onToggleLightsOff={() => setLightsOff(v => !v)}
        spreadView={spreadView}
        onToggleSpread={() => {
          saveCurrentPageToState();
          setSpreadView(v => !v);
          setActiveSpreadSide('right');
        }}
        onSave={handleSave}
        saving={saving}
        lastSaved={lastSaved}
        onExportDigital={handleExportDigital}
        exportingDigital={exportingDigital}
        onExportPrint={handleExportPrint}
        exportingPrint={exportingPrint}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        currentDims={dims}
        hasGuides={guides.h.length > 0 || guides.v.length > 0}
        onClearGuides={handleClearGuides}
        pageNumberSettings={pageNumberSettings}
        onPageNumSettingsChange={setPageNumberSettings}
        onApplyPageNumbers={handleApplyPageNumbers}
      />

      {/* Main area: panels + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* Lights-off overlay — dims side panels, leaving canvas bright */}
        {lightsOff && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.72)',
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease',
            // Cut a hole in the centre where the canvas area is
            // Done via a mask: cover left panel + right panel only
          }} />
        )}

        {/* Elements panel */}
        <div style={{ position: 'relative', zIndex: lightsOff ? 0 : 'auto', flexShrink: 0 }}>
        <ElementsPanel
          onAddElement={handleAddElement}
          onAddImage={addImage}
          onAddTemplate={handleAddTemplate}
          issue={issue}
          layers={layers}
          onSelectLayer={handleSelectLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
          onReorderLayer={handleReorderLayer}
        />
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Ruler top row */}
          {showRuler && (
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <div style={{ width: RULER_SIZE, height: RULER_SIZE, background: '#0D0C0A', flexShrink: 0 }} />
              <Ruler
                length={dims.w * zoom + 200}
                isVertical={false}
                scale={zoom}
                onDragGuide={handleCreateHGuide}
              />
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Ruler left */}
            {showRuler && (
              <Ruler
                length={dims.h * zoom + 200}
                isVertical
                scale={zoom}
                onDragGuide={handleCreateVGuide}
              />
            )}

            {/* Scrollable canvas container */}
            <div
              ref={canvasAreaRef}
              style={{
                flex: 1,
                overflow: 'auto',
                background: lightsOff ? '#000' : '#141210',
                transition: 'background 0.4s ease',
              }}
            >
              {/* Inner centering wrapper — plain block div, NOT a flex scroll container.
                  Uses flex only internally for horizontal centering.
                  minHeight:100% + padding give breathing room. No flex centering on
                  the scroll container itself (avoids the snap-to-top bug where
                  justify-content:center resets scroll position on re-renders). */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: spreadView ? '40px 20px' : '40px',
                minHeight: '100%',
                boxSizing: 'border-box',
              }}>

              {spreadView ? (
                // ── SPREAD VIEW ────────────────────────────────────────────────
                <div style={{ position: 'relative' }}>
                  {/* Spread label — above the canvas, outside the transform */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: 8,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: "'Jost',sans-serif",
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    {spreadIndices.leftIndex === null
                      ? 'Cover'
                      : `Spread ${Math.ceil(spreadIndices.leftIndex / 2)} · Pages ${spreadIndices.leftIndex + 1}–${(spreadIndices.rightIndex ?? spreadIndices.leftIndex) + 1}`
                    }
                  </div>

                  {/* Pages container — one unified shadow for the whole spread */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      filter: 'drop-shadow(0 16px 64px rgba(0,0,0,0.7))',
                    }}
                  >
                    {/* LEFT PAGE */}
                    <div
                      style={{
                        position: 'relative',
                        cursor: spreadIndices.leftIndex !== null ? 'pointer' : 'default',
                        outline: activeSpreadSide === 'left' ? '2px solid #C9A96E' : '2px solid transparent',
                        outlineOffset: 0,
                      }}
                      onClick={() => {
                        if (spreadIndices.leftIndex !== null) setActiveSpreadSide('left');
                      }}
                    >
                      {/* Active indicator label */}
                      {activeSpreadSide === 'left' && spreadIndices.leftIndex !== null && (
                        <div style={{
                          position: 'absolute', top: -22, left: 0,
                          fontSize: 9, color: '#C9A96E',
                          fontFamily: "'Jost', sans-serif",
                          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}>
                          Page {(spreadIndices.leftIndex ?? 0) + 1} · editing
                        </div>
                      )}

                      {spreadIndices.leftIndex !== null ? (
                        // Real left page — show canvas
                        <div ref={canvasContainerRefLeft} style={{ position: 'relative' }}>
                          <canvas ref={canvasElRefLeft} style={{ display: 'block' }} />
                          {showGrid && activeSpreadSide === 'left' && (
                            <GridOverlay width={dims.w} height={dims.h} />
                          )}
                          {showBleed && <BleedOverlay />}
                          {activeSpreadSide === 'left' && (
                            <GuideLines
                              guides={guides}
                              onMoveGuide={handleMoveGuide}
                            />
                          )}
                        </div>
                      ) : (
                        // Cover — show grey placeholder
                        <div style={{
                          width: dims.w, height: dims.h,
                          background: '#1E1B17',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: 8,
                        }}>
                          <div style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.12)',
                            fontFamily: "'Jost',sans-serif", letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                          }}>Cover page</div>
                        </div>
                      )}
                    </div>

                    {/* SPINE — 4px dark gap between pages */}
                    <div style={{
                      width: 4, height: dims.h,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.15), rgba(0,0,0,0.4))',
                      flexShrink: 0,
                    }} />

                    {/* RIGHT PAGE */}
                    <div
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        outline: activeSpreadSide === 'right' ? '2px solid #C9A96E' : '2px solid transparent',
                        outlineOffset: 0,
                      }}
                      onClick={() => setActiveSpreadSide('right')}
                    >
                      {activeSpreadSide === 'right' && (
                        <div style={{
                          position: 'absolute', top: -22, left: 0,
                          fontSize: 9, color: '#C9A96E',
                          fontFamily: "'Jost', sans-serif",
                          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}>
                          Page {(spreadIndices.rightIndex ?? 0) + 1} · editing
                        </div>
                      )}

                      <div ref={canvasContainerRef} style={{ position: 'relative' }}>
                        <canvas ref={canvasElRef} style={{ display: 'block' }} />
                        {showGrid && activeSpreadSide === 'right' && (
                          <GridOverlay width={dims.w} height={dims.h} />
                        )}
                        {showBleed && <BleedOverlay />}
                        {activeSpreadSide === 'right' && (
                          <GuideLines
                            guides={guides}
                            onMoveGuide={handleMoveGuide}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // ── SINGLE PAGE VIEW ─────────────────────────────────────────────
                <div
                  ref={canvasContainerRef}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                  }}
                >
                  <canvas ref={canvasElRef} />
                  {showGrid && (
                    <GridOverlay
                      width={dims.w * zoom}
                      height={dims.h * zoom}
                    />
                  )}
                  {/* Bleed + safe zone guides */}
                  {showBleed && <BleedOverlay />}
                  {/* Guide lines overlay */}
                  <GuideLines
                    guides={guides}
                    onMoveGuide={handleMoveGuide}
                  />
                </div>
              )}
              </div>{/* end inner centering wrapper */}
            </div>{/* end canvasAreaRef */}
          </div>{/* end middle row (ruler + canvas area) */}
        </div>{/* end canvas column */}

        {/* Properties panel */}
        <div style={{ position: 'relative', zIndex: lightsOff ? 0 : 'auto', flexShrink: 0 }}>
          <PropertiesPanel
            selectedObject={selectedObject}
            canvas={getActiveCanvas()}
            onUpdate={handlePropertiesUpdate}
          />
        </div>
      </div>

      {/* Page list strip */}
      <PageListPanel
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onReorderPage={handleReorderPage}
      />

      {/* Draft guide preview (fixed overlay while dragging from ruler) */}
      {draftGuide && (
        <div style={{
          position: 'fixed',
          ...(draftGuide.axis === 'h'
            ? { left: 0, right: 0, top: draftGuide.pos, height: 1 }
            : { top: 0, bottom: 0, left: draftGuide.pos, width: 1 }),
          background: 'rgba(0,168,255,0.5)',
          pointerEvents: 'none',
          zIndex: 9999,
        }} />
      )}
    </div>
  );
}
