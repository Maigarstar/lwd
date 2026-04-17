import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, Textbox, FabricImage, Rect, Circle, Line, FabricObject, Group, loadSVGFromString, util as fabricUtil } from 'fabric';
import { callAiGenerate } from '../../lib/aiGenerate';
import { loadGoogleFont } from './templates/fontCatalog';

// ── Fabric v7 origin defaults ────────────────────────────────────────────────
// Fabric v7 changed the default originX/originY from 'left'/'top' to 'center'.
// All templates in this module are authored using the classic top-left
// convention (left:0, top:0 = corner). Restoring the legacy defaults once at
// module load keeps every object — whether placed by applyTemplate or created
// later by the toolbar — positioned by its top-left corner, which is what
// every coordinate in this file and in PageDesigner/* expects.
FabricObject.ownDefaults.originX = 'left';
FabricObject.ownDefaults.originY = 'top';
import { PAGE_SIZES, ELEMENT_DEFAULTS, GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import { TEMPLATES } from './templates/definitions';
import ElementsPanel from './PageDesigner/ElementsPanel';
import PropertiesPanel from './PageDesigner/PropertiesPanel';
import PageListPanel from './PageDesigner/PageListPanel';
import DesignerToolbar from './PageDesigner/DesignerToolbar';
import { canvasToJpegBlob, canvasToPrintJpegBlob, generatePrintPDF, generateScreenPDF, downloadPDF } from './PageDesigner/exportUtils';
import { upsertPages, upsertPage, fetchPages, uploadPageImage, uploadThumbImage } from '../../services/magazinePageService';
import { updateIssue } from '../../services/magazineIssuesService';
import { fetchBrandKit } from '../../services/magazineBrandKitService';
import ImagePickerModal from './PageDesigner/ImagePickerModal';
import BrandKitPanel from './BrandKitPanel';
import SpreadPreviewModal from './PageDesigner/SpreadPreviewModal';
import SmartFillPanel from './PageDesigner/SmartFillPanel';
import AIIssueBuilderPanel from './PageDesigner/AIIssueBuilderPanel';
import StudioVoicePanel from './PageDesigner/StudioVoicePanel';
import PageSlotPanel from './PageDesigner/PageSlotPanel';

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Template layout engine ────────────────────────────────────────────────────
// Templates are authored against a reference page (A4 portrait, 794×1123).
// All coordinates, fontSizes and margins assume that frame. After the layout
// function runs, every object is scaled proportionally to fit the actual
// page dims. This is what keeps a template looking right on A5 / Tabloid /
// Square pages instead of rendering the same absolute pixels on a bigger
// canvas (which made text look too small and sit too close to the edge).
export const TEMPLATE_REF_W = 794;
export const TEMPLATE_REF_H = 1123;

// ── Curated Unsplash image set ────────────────────────────────────────────────
// High-res editorial photography used as default placeholder imagery for each
// template. All URLs use the same pattern so resolution can be tuned centrally.
const UNSPLASH = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
const IMG = {
  bridePortrait:  UNSPLASH('1519741497674-611481863552'),
  coupleCeremony: UNSPLASH('1606216794074-735e91aa2c92'),
  venueInterior: UNSPLASH('1519167758481-83f550bb49b3'),
  florals:        UNSPLASH('1519225421980-715cb0215aed'),
  ring:           UNSPLASH('1605100804763-247f67b3557e'),
  tuscany:        UNSPLASH('1523531294919-4bcd7c65e216'),
  venetianPalazzo:UNSPLASH('1534445867742-43195f401b6c'),
  dressDetail:    UNSPLASH('1511285560929-80b456fea0bc'),
  beauty:         UNSPLASH('1487412720507-e7ab37603c6f'),
  cake:           UNSPLASH('1535254973040-607b474cb50d'),
  receptionTable: UNSPLASH('1465495976277-4387d4b0e4a6'),
  bouquet:        UNSPLASH('1587271636175-90d58cdad458'),
  stationery:     UNSPLASH('1606216794074-735e91aa2c92'),
  fashionEditorial: UNSPLASH('1523359346063-d879354c0ea5'),
};

// ── L-bracket corner markers ──────────────────────────────────────────────────
// Draws 4 gold L-shaped crop markers around an image placeholder Rect, so users
// can visually identify which objects are replaceable image slots. Each marker
// is tagged isPlaceholderMarker:true so they round-trip through save/load.
function buildPlaceholderMarkers(fc, rectLeft, rectTop, rectW, rectH) {
  const arm = 16;
  const stroke = 'rgba(201,169,110,0.6)';
  const strokeWidth = 1.5;
  const mkLine = (x1, y1, x2, y2) => new Line([x1, y1, x2, y2], {
    stroke, strokeWidth,
    selectable: false, evented: false,
  });

  const L = rectLeft;
  const T = rectTop;
  const R = rectLeft + rectW;
  const B = rectTop + rectH;

  const markers = [
    // Top-left ⌐
    mkLine(L, T, L + arm, T),
    mkLine(L, T, L, T + arm),
    // Top-right ¬
    mkLine(R - arm, T, R, T),
    mkLine(R, T, R, T + arm),
    // Bottom-left ⌊
    mkLine(L, B, L, B - arm),
    mkLine(L, B, L + arm, B),
    // Bottom-right ⌋
    mkLine(R - arm, B, R, B),
    mkLine(R, B - arm, R, B),
  ];
  markers.forEach(m => {
    m.set({ isPlaceholderMarker: true });
    m.id = genId();
    fc.add(m);
  });
}

// ── Image placeholder helper ──────────────────────────────────────────────────
// Creates a Rect backdrop + gold L-bracket markers + async Unsplash image.
// The Rect and FabricImage are both tagged isImagePlaceholder:true so the
// double-click handler can pick either up. The Rect is kept behind the image
// so when the image is swapped via the picker there is still a backdrop.
function addImagePlaceholder(fc, { left, top, width, height, imageUrl, fill = '#E8E3D8' }) {
  const rect = new Rect({
    left, top, width, height, fill,
    selectable: true,
  });
  rect.set({ isImagePlaceholder: true });
  rect.id = genId();
  fc.add(rect);

  buildPlaceholderMarkers(fc, left, top, width, height);

  if (imageUrl) {
    FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then(img => {
        if (!img) return;
        const scale = Math.max(width / img.width, height / img.height);
        img.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          // Crop to placeholder bounds
          clipPath: new Rect({
            left: left,
            top: top,
            width,
            height,
            absolutePositioned: true,
          }),
        });
        img.set({ isImagePlaceholder: true });
        img.id = genId();
        // Insert just above the placeholder Rect rather than appending to the
        // top of the stack. FabricImage.fromURL resolves asynchronously, so a
        // naive fc.add() would land the image above every overlay chrome
        // (shade rects, rules, text) added synchronously after this helper.
        // Finding the rect's current index and inserting at rect_index + 1
        // preserves the authored z-order: backdrop rect → image → overlay.
        const rectIndex = fc.getObjects().indexOf(rect);
        if (rectIndex >= 0 && typeof fc.insertAt === 'function') {
          fc.insertAt(rectIndex + 1, img);
        } else {
          fc.add(img);
        }
        fc.requestRenderAll();
      })
      .catch(() => { /* silently leave placeholder rect */ });
  }
}

// ── Brand kit overlay ─────────────────────────────────────────────────────────
// After a layout function runs, this walks every canvas object and substitutes
// the brand primary colour (gold) and brand fonts.  All templates are authored
// with the LWD gold #C9A84C and default fonts; this pass replaces them in one
// sweep without touching layout coordinates or object structure.
const DEFAULT_GOLD_HEX  = '#C9A84C';
const DEFAULT_GOLD_RGB  = '201,168,76';
const DEFAULT_GOLD_RGB2 = '201,169,110'; // addImagePlaceholder stroke variant

const HEADING_FONT_SET = new Set([
  'Bodoni Moda', 'Playfair Display', 'GFS Didot', 'Cinzel',
  'Abril Fatface', 'DM Serif Display', 'Cormorant Garamond',
  'Libre Baskerville', 'EB Garamond', 'Tenor Sans',
]);
const BODY_FONT_SET = new Set([
  'Jost', 'Montserrat', 'Raleway', 'Lato', 'Open Sans', 'Poppins', 'Inter',
]);

function applyBrandToCanvas(fc, brand) {
  if (!brand) return;

  // Pre-compute new gold rgba prefix
  let newRgb = null;
  const newHex = brand.primary_color;
  if (newHex && /^#[0-9A-Fa-f]{6}$/.test(newHex)) {
    const r = parseInt(newHex.slice(1, 3), 16);
    const g = parseInt(newHex.slice(3, 5), 16);
    const b = parseInt(newHex.slice(5, 7), 16);
    newRgb = `${r},${g},${b}`;
  }

  const hFont = brand.heading_font || null;
  const bFont = brand.body_font || null;

  if (!newHex && !hFont && !bFont) return;

  // Recursive visitor — descends into Groups so nested objects are also branded.
  // fabric.Group.getObjects() returns direct children; recurse for nested groups.
  function visitObj(obj) {
    // ── Color substitution ──────────────────────────────────────────────
    if (newHex && newRgb) {
      // fill
      if (obj.fill === DEFAULT_GOLD_HEX) obj.set('fill', newHex);
      if (typeof obj.fill === 'string') {
        if (obj.fill.startsWith(`rgba(${DEFAULT_GOLD_RGB},`)) {
          const a = obj.fill.match(/rgba\([^)]+,([\d.]+)\)/)?.[1];
          if (a) obj.set('fill', `rgba(${newRgb},${a})`);
        } else if (obj.fill.startsWith(`rgba(${DEFAULT_GOLD_RGB2},`)) {
          const a = obj.fill.match(/rgba\([^)]+,([\d.]+)\)/)?.[1];
          if (a) obj.set('fill', `rgba(${newRgb},${a})`);
        }
      }
      // stroke
      if (obj.stroke === DEFAULT_GOLD_HEX) obj.set('stroke', newHex);
      if (typeof obj.stroke === 'string') {
        if (obj.stroke.startsWith(`rgba(${DEFAULT_GOLD_RGB},`)) {
          const a = obj.stroke.match(/rgba\([^)]+,([\d.]+)\)/)?.[1];
          if (a) obj.set('stroke', `rgba(${newRgb},${a})`);
        } else if (obj.stroke.startsWith(`rgba(${DEFAULT_GOLD_RGB2},`)) {
          const a = obj.stroke.match(/rgba\([^)]+,([\d.]+)\)/)?.[1];
          if (a) obj.set('stroke', `rgba(${newRgb},${a})`);
        }
      }
    }
    // ── Font substitution (Textbox / IText) ──────────────────────────────
    if (obj.type === 'textbox' || obj.type === 'i-text') {
      if (hFont && HEADING_FONT_SET.has(obj.fontFamily)) {
        obj.set('fontFamily', hFont);
        try { loadGoogleFont(hFont); } catch { /* noop */ }
      } else if (bFont && BODY_FONT_SET.has(obj.fontFamily)) {
        obj.set('fontFamily', bFont);
        try { loadGoogleFont(bFont); } catch { /* noop */ }
      }
    }
    // ── Recurse into groups ───────────────────────────────────────────────
    if (obj.type === 'group' && typeof obj.getObjects === 'function') {
      obj.getObjects().forEach(visitObj);
    }
  }

  fc.getObjects().forEach(visitObj);
}

export function applyTemplate(fc, template, dims, brand = {}) {
  fc.clear();
  fc.backgroundColor = '#ffffff';

  // Render template at the reference frame — post-scale does the adaptation.
  const W = TEMPLATE_REF_W;
  const H = TEMPLATE_REF_H;
  const GOLD_C = '#C9A84C';
  const DARK_C = '#18120A';
  const MUTED_C = 'rgba(24,18,10,0.5)';

  const layouts = {
    'Cover': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      // Full-bleed hero image behind all masthead/title chrome
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H, imageUrl: IMG.bridePortrait, fill: '#1A1612' });
      const shade = new Rect({ left: 0, top: 0, width: W, height: H, fill: 'rgba(10,9,8,0.35)', selectable: false });
      const rule = new Rect({ left: 40, top: 60, width: W - 80, height: 1, fill: GOLD_C });
      const masthead = new Textbox('LWD', { left: 40, top: 80, width: W - 80, fontSize: 84, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontWeight: '400', fontStyle: 'italic', textAlign: 'center' });
      const issueLabel = new Textbox('ISSUE 01 · SPRING 2026', { left: 40, top: 188, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300, textAlign: 'center' });
      const title = new Textbox('THE BRIDAL\nEDITION', { left: 40, top: H * 0.56, width: W - 80, fontSize: 54, fontFamily: 'Playfair Display', fill: '#F0EBE0', fontWeight: '400', fontStyle: 'italic', lineHeight: 1.05, textAlign: 'center' });
      const rule2 = new Rect({ left: 40, top: H - 80, width: W - 80, height: 1, fill: GOLD_C });
      const credits = new Textbox('Vera Wang · Elie Saab · Marchesa', { left: 40, top: H - 65, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.65)', charSpacing: 200, textAlign: 'center' });
      [shade, rule, masthead, issueLabel, title, rule2, credits].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Editorial': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.5, height: H, imageUrl: IMG.fashionEditorial });
      const category = new Textbox('EDITORIAL · SPRING', { left: W * 0.54, top: 72, width: W * 0.42, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 250 });
      const headline = new Textbox('Something\nBorrowed,\nSomething Gold', { left: W * 0.54, top: 100, width: W * 0.42, fontSize: 44, fontFamily: 'Bodoni Moda', fill: DARK_C, fontWeight: '400', fontStyle: 'italic', lineHeight: 1.05 });
      const rule = new Rect({ left: W * 0.54, top: 290, width: W * 0.42, height: 1, fill: GOLD_C });
      const body = new Textbox('For the modern bride, tradition becomes language — softened, re-tuned, reimagined. A veil inherited from a grandmother, a locket tucked in a bouquet; these are the gestures that carry love forward through time.\n\nThis season, we revisit the rituals that remain — and the ones that are quietly, gloriously new.', { left: W * 0.54, top: 306, width: W * 0.42, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.65 });
      const byline = new Textbox('Photography · Studio Name\nWords · Charlotte Ashford', { left: W * 0.54, top: H - 76, width: W * 0.42, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, lineHeight: 1.8, charSpacing: 100 });
      [category, headline, rule, body, byline].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Fashion': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      const colW = (W - 8) / 3;
      const imgs = [IMG.fashionEditorial, IMG.dressDetail, IMG.bridePortrait];
      [0, 1, 2].forEach(i => {
        addImagePlaceholder(fc, {
          left: i * (colW + 4), top: 0, width: colW, height: H * 0.78,
          imageUrl: imgs[i],
          fill: '#1A1612',
        });
      });
      const rule = new Rect({ left: 40, top: H * 0.82, width: W - 80, height: 1, fill: GOLD_C });
      const heading = new Textbox('SPRING / SUMMER 2026', { left: 40, top: H * 0.85, width: W - 80, fontSize: 26, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center', charSpacing: 120 });
      const designers = new Textbox('Elie Saab · Marchesa · Jenny Packham', { left: 40, top: H * 0.93, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: 'rgba(201,168,76,0.85)', textAlign: 'center', charSpacing: 200 });
      [rule, heading, designers].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Travel': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.65, imageUrl: IMG.tuscany, fill: '#2A2B3E' });
      const gradient = new Rect({ left: 0, top: H * 0.5, width: W, height: H * 0.18, fill: 'rgba(26,27,46,0.85)', selectable: false });
      const category = new Textbox('DESTINATION · JUNE 2026', { left: 40, top: H * 0.68, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300, textAlign: 'center' });
      const location = new Textbox('Tuscany', { left: 40, top: H * 0.72, width: W - 80, fontSize: 84, fontFamily: 'GFS Didot', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '400', lineHeight: 1, textAlign: 'center' });
      const rule = new Rect({ left: W / 2 - 30, top: H * 0.87, width: 60, height: 1, fill: GOLD_C });
      const tagline = new Textbox('Where rolling hills meet eternal love.', { left: 40, top: H * 0.89, width: W - 80, fontSize: 15, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.8)', fontStyle: 'italic', lineHeight: 1.5, textAlign: 'center' });
      [gradient, category, location, rule, tagline].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Bridal': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: W * 0.35, top: 0, width: W * 0.65, height: H, imageUrl: IMG.bridePortrait, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 80, width: 2, height: 64, fill: GOLD_C });
      const dressName = new Textbox('The Madeleine', { left: 60, top: 78, width: W * 0.3, fontSize: 34, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
      const designer = new Textbox('VERA WANG', { left: 60, top: 162, width: W * 0.3, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const details = new Textbox('Duchess satin · hand-draped bodice\nBespoke · made to measure in Paris', { left: 60, top: 196, width: W * 0.3, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.7 });
      const divider = new Rect({ left: 60, top: H - 112, width: 40, height: 1, fill: GOLD_C });
      const priceLabel = new Textbox('PRICE ON REQUEST', { left: 60, top: H - 98, width: W * 0.3, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 200 });
      const price = new Textbox('POA', { left: 60, top: H - 78, width: W * 0.3, fontSize: 18, fontFamily: 'Bodoni Moda', fill: GOLD_C, fontStyle: 'italic' });
      [rule, dressName, designer, details, divider, priceLabel, price].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Jewellery': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A0A0F', selectable: false });
      bg.id = genId(); fc.add(bg);
      // Circular product showcase area (kept as decorative circle; image placeholder sits within it)
      const circle = new Circle({ left: W / 2 - 180, top: H * 0.1, radius: 180, fill: '#2A1520', stroke: 'rgba(201,168,76,0.35)', strokeWidth: 1, selectable: false });
      circle.id = genId(); fc.add(circle);
      addImagePlaceholder(fc, { left: W / 2 - 160, top: H * 0.12, width: 320, height: 320, imageUrl: IMG.ring, fill: '#2A1520' });
      const name = new Textbox('THE MADELEINE RING', { left: 40, top: H * 0.65, width: W - 80, fontSize: 28, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center', charSpacing: 100 });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.735, width: 80, height: 1, fill: GOLD_C });
      const details = new Textbox('18ct white gold · 3.2ct round brilliant', { left: 40, top: H * 0.76, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.65)', textAlign: 'center', charSpacing: 150 });
      const brand = new Textbox('Graff, London', { left: 40, top: H * 0.82, width: W - 80, fontSize: 15, fontFamily: 'Cormorant Garamond', fill: GOLD_C, textAlign: 'center', fontStyle: 'italic' });
      const price = new Textbox('£48,000', { left: 40, top: H * 0.88, width: W - 80, fontSize: 18, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', textAlign: 'center', fontStyle: 'italic' });
      [name, rule, details, brand, price].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Real Wedding': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#18120A', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H, imageUrl: IMG.coupleCeremony, fill: '#2A2016' });
      const overlay = new Rect({ left: 0, top: H * 0.58, width: W, height: H * 0.42, fill: 'rgba(24,18,10,0.78)', selectable: false });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.63, width: 80, height: 1, fill: GOLD_C });
      const names = new Textbox('Isabella & James', { left: 40, top: H * 0.65, width: W - 80, fontSize: 52, fontFamily: 'Great Vibes', fill: '#F0EBE0', textAlign: 'center', lineHeight: 1.1 });
      const location = new Textbox('MARRIED IN TUSCANY', { left: 40, top: H * 0.8, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const date = new Textbox('The Fourteenth of June · MMXXVI', { left: 40, top: H * 0.86, width: W - 80, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.7)', fontStyle: 'italic', textAlign: 'center' });
      [overlay, rule, names, location, date].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Detail': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      const header = new Textbox('DETAILS OF THE DAY', { left: 40, top: 28, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300, textAlign: 'center' });
      header.id = genId(); fc.add(header);
      const colW = (W - 2 * 40 - 2 * 8) / 3;
      const captions = ['The Bouquet', 'The Ring', 'The Veil'];
      const imgs = [IMG.bouquet, IMG.ring, IMG.dressDetail];
      captions.forEach((cap, i) => {
        const x = 40 + i * (colW + 8);
        addImagePlaceholder(fc, { left: x, top: 72, width: colW, height: H * 0.7, imageUrl: imgs[i], fill: '#EDE8E0' });
        const capText = new Textbox(cap, { left: x, top: 72 + H * 0.7 + 18, width: colW, fontSize: 16, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', textAlign: 'center' });
        capText.id = genId(); fc.add(capText);
      });
      const rule = new Rect({ left: 40, top: H - 52, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.35)' });
      const credit = new Textbox('Photography · Studio Name', { left: 40, top: H - 38, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 200, textAlign: 'center' });
      [rule, credit].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Navigation': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      const contentsLabel = new Textbox('CONTENTS', { left: 40, top: 54, width: W - 80, fontSize: 11, fontFamily: 'Cinzel', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const rule = new Rect({ left: 40, top: 84, width: W - 80, height: 1, fill: GOLD_C });
      const issueLabel = new Textbox('ISSUE 01 · SPRING 2026', { left: 40, top: 100, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 300, textAlign: 'center' });
      const subtitle = new Textbox('The Bridal Edition', { left: 40, top: 132, width: W - 80, fontSize: 40, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', textAlign: 'center', fontWeight: '400' });
      const rule2 = new Rect({ left: W / 2 - 30, top: 206, width: 60, height: 1, fill: 'rgba(201,168,76,0.5)' });
      [contentsLabel, rule, issueLabel, subtitle, rule2].forEach(o => { o.id = genId(); fc.add(o); });
      // Contents entries: left page number (serif gold), right title
      const entries = [
        ['06', 'The Wedding Dress'],
        ['14', 'Jewellery Stories'],
        ['22', 'Venues of the Season'],
        ['34', 'Real Wedding · Isabella & James'],
        ['44', 'The Bridal Beauty Edit'],
        ['52', 'Destination · Tuscany'],
        ['64', 'The Planner Spotlight'],
      ];
      const startY = 250;
      const rowH = 62;
      entries.forEach(([num, title], i) => {
        const y = startY + i * rowH;
        const pageNo = new Textbox(num, { left: 60, top: y, width: 80, fontSize: 32, fontFamily: 'Bodoni Moda', fill: GOLD_C, fontStyle: 'italic' });
        pageNo.id = genId(); fc.add(pageNo);
        const titleObj = new Textbox(title, { left: 160, top: y + 8, width: W - 200, fontSize: 18, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic' });
        titleObj.id = genId(); fc.add(titleObj);
        if (i < entries.length - 1) {
          const divider = new Rect({ left: 60, top: y + rowH - 12, width: W - 120, height: 1, fill: 'rgba(24,18,10,0.08)' });
          divider.id = genId(); fc.add(divider);
        }
      });
    },
    'Venue': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.52, height: H, imageUrl: IMG.venetianPalazzo, fill: '#2A2B3E' });
      const rule = new Rect({ left: W * 0.58, top: 72, width: 2, height: 68, fill: GOLD_C });
      const category = new Textbox('VENUE OF THE MONTH', { left: W * 0.6, top: 72, width: W * 0.38, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const venueName = new Textbox('Hotel Cipriani', { left: W * 0.6, top: 96, width: W * 0.38, fontSize: 36, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', lineHeight: 1.05 });
      const location = new Textbox('Venice · Italy', { left: W * 0.6, top: 168, width: W * 0.38, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: GOLD_C, fontStyle: 'italic' });
      const desc = new Textbox('A palazzo suspended above the Grand Canal, where time slows to the pace of gondolas and the soft ring of distant wedding bells.', { left: W * 0.6, top: 210, width: W * 0.36, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.8)', lineHeight: 1.65, fontStyle: 'italic' });
      const ruleMid = new Rect({ left: W * 0.6, top: H * 0.55, width: 40, height: 1, fill: GOLD_C });
      const featuresLabel = new Textbox('AT A GLANCE', { left: W * 0.6, top: H * 0.57, width: W * 0.36, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const features = new Textbox('Private canal entrance\nIn-house floral studio\nDedicated wedding concierge\nUp to 160 guests seated', { left: W * 0.6, top: H * 0.62, width: W * 0.36, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.7)', lineHeight: 2 });
      [rule, category, venueName, location, desc, ruleMid, featuresLabel, features].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Venue Portrait': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H, imageUrl: IMG.venueInterior, fill: '#1A1612' });
      const overlay = new Rect({ left: 0, top: H * 0.52, width: W, height: H * 0.48, fill: 'rgba(10,9,8,0.82)', selectable: false });
      const category = new Textbox('EDITORIAL · THE GRAND VENUES', { left: 40, top: H * 0.58, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const headline = new Textbox('Where Dreams\nTake Shape', { left: 40, top: H * 0.62, width: W - 80, fontSize: 44, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', fontWeight: '400', lineHeight: 1.1, textAlign: 'center' });
      const rule = new Rect({ left: W / 2 - 30, top: H * 0.82, width: 60, height: 1, fill: GOLD_C });
      const venueName = new Textbox('VENUE NAME', { left: 40, top: H * 0.84, width: W - 80, fontSize: 11, fontFamily: 'Cinzel', fill: GOLD_C, charSpacing: 300, textAlign: 'center' });
      const location = new Textbox('Location · Up to 250 guests', { left: 40, top: H * 0.9, width: W - 80, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.7)', fontStyle: 'italic', textAlign: 'center' });
      [overlay, category, headline, rule, venueName, location].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Couple': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.55, imageUrl: IMG.coupleCeremony, fill: '#2A2B3E' });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.58, width: 80, height: 1, fill: GOLD_C });
      const names = new Textbox('Sophia & James', { left: 40, top: H * 0.6, width: W - 80, fontSize: 58, fontFamily: 'Great Vibes', fill: '#F0EBE0', textAlign: 'center', lineHeight: 1.1 });
      const date = new Textbox('WEDDING DATE · LOCATION', { left: 40, top: H * 0.75, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300, textAlign: 'center' });
      const story = new Textbox('Their love story begins here. Two worlds, braided quietly across seasons and cities — until a single, certain summer evening. Add your couple\'s narrative: the meeting, the proposal, the day itself, told in your own voice.', { left: 80, top: H * 0.81, width: W - 160, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.8)', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' });
      [rule, names, date, story].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Beauty': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: W * 0.4, top: 0, width: W * 0.6, height: H, imageUrl: IMG.beauty, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 68, width: 2, height: 56, fill: GOLD_C });
      const category = new Textbox('BEAUTY EDIT', { left: 60, top: 68, width: W * 0.3, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const headline = new Textbox('The Art of\nBridal Beauty', { left: 60, top: 92, width: W * 0.32, fontSize: 34, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.1 });
      const divider = new Rect({ left: 40, top: 208, width: W * 0.3, height: 1, fill: 'rgba(201,168,76,0.4)' });
      const creditsLabel = new Textbox('CREDITS', { left: 40, top: 220, width: W * 0.3, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const credits = new Textbox('Makeup · Marie-Claire Dupont\nHair · Sebastian Laurent\nBride · Isabella Moretti\nFragrance · Chanel No. 5', { left: 40, top: 240, width: W * 0.32, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.9, fontStyle: 'italic' });
      const productsLabel = new Textbox('THE LOOK', { left: 40, top: H * 0.55, width: W * 0.3, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const products = new Textbox('A soft focus palette — satin skin, a whisper of blush across the cheekbone, lips stained the colour of champagne roses. Timeless. Unfussy. Entirely her own.', { left: 40, top: H * 0.58, width: W * 0.32, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.7, fontStyle: 'italic' });
      [rule, category, headline, divider, creditsLabel, credits, productsLabel, products].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Florals': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.68, imageUrl: IMG.florals, fill: '#EDE8E0' });
      const category = new Textbox('THE FLORAL EDIT', { left: 40, top: H * 0.72, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const headline = new Textbox('In Full Bloom', { left: 40, top: H * 0.755, width: W - 80, fontSize: 48, fontFamily: 'DM Serif Display', fill: DARK_C, fontStyle: 'italic', textAlign: 'center' });
      const rule = new Rect({ left: W / 2 - 40, top: H * 0.86, width: 80, height: 1, fill: GOLD_C });
      const florist = new Textbox('Florals by Saipua · soft garden roses, sweet pea, and Italian ruscus, arranged in the tradition of seventeenth-century Dutch still life.', { left: 80, top: H * 0.88, width: W - 160, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic' });
      [category, headline, rule, florist].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Reception': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.6, imageUrl: IMG.receptionTable, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: H * 0.63, width: W - 80, height: 1, fill: GOLD_C });
      const category = new Textbox('THE RECEPTION', { left: 40, top: H * 0.645, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const headline = new Textbox('Dressed to Perfection', { left: 40, top: H * 0.68, width: W - 80, fontSize: 42, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
      const creditsRule = new Rect({ left: 40, top: H * 0.79, width: 40, height: 1, fill: GOLD_C });
      const credits = new Textbox('VENUE · AYNHOE PARK    STYLING · BLUEBIRD ATELIER\nPALETTE · IVORY · SAGE · DUSTY ROSE', { left: 40, top: H * 0.805, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 200, lineHeight: 2 });
      const caption = new Textbox('Long candlelit tables dressed in hand-dyed silk runners, antique porcelain, and low gardens of garden roses — the tablescape was conceived as a still-life, quietly unfolding course by course into the night.', { left: 40, top: H * 0.87, width: W - 80, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.65, fontStyle: 'italic' });
      [rule, category, headline, creditsRule, credits, caption].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Ceremony': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.62, imageUrl: IMG.coupleCeremony, fill: '#EDE8E0' });
      const category = new Textbox('THE CEREMONY', { left: 40, top: H * 0.65, width: W * 0.55, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const headline = new Textbox('The Walk to\nForever', { left: 40, top: H * 0.675, width: W * 0.55, fontSize: 44, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
      const rule = new Rect({ left: W * 0.58, top: H * 0.66, width: 1, height: H * 0.28, fill: 'rgba(201,168,76,0.5)' });
      const story = new Textbox('The chapel at the end of a cypress avenue. Afternoon light pouring through stained glass. The quiet moment before the aisle — a breath held by everyone who loves them. This is the architecture of a vow: place, light, patience.', { left: W * 0.62, top: H * 0.66, width: W * 0.34, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.7, fontStyle: 'italic' });
      const creditRule = new Rect({ left: 40, top: H - 52, width: 40, height: 1, fill: GOLD_C });
      const credit = new Textbox('PHOTOGRAPHY · STUDIO NAME', { left: 40, top: H - 38, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 300 });
      [category, headline, rule, story, creditRule, credit].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Stationery': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: W * 0.38, top: 0, width: W * 0.62, height: H, imageUrl: IMG.stationery, fill: '#EDE8E0' });
      const rule = new Rect({ left: 40, top: 64, width: W * 0.3, height: 1, fill: GOLD_C });
      const category = new Textbox('THE INVITATION SUITE', { left: 40, top: 74, width: W * 0.3, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const headline = new Textbox('The Perfect\nFirst Impression', { left: 40, top: 98, width: W * 0.32, fontSize: 32, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.1 });
      const designerLabel = new Textbox('DESIGNED BY', { left: 40, top: 232, width: W * 0.32, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const designer = new Textbox('Mr. Boddington\'s Studio', { left: 40, top: 248, width: W * 0.32, fontSize: 16, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic' });
      const paperRule = new Rect({ left: 40, top: 286, width: 40, height: 1, fill: 'rgba(201,168,76,0.5)' });
      const paperLabel = new Textbox('PAPER & PRINT', { left: 40, top: 296, width: W * 0.32, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const paper = new Textbox('Hot-press letterpress on 600gsm Italian cotton · hand-torn deckled edge · 18ct gold foil monogram.', { left: 40, top: 316, width: W * 0.32, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.6 });
      const descLabel = new Textbox('THE SUITE', { left: 40, top: H * 0.55, width: W * 0.32, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
      const desc = new Textbox('Six pieces in soft bone and ink: invitation, RSVP, details card, menu, place card, and thank-you. A single suite, entirely couture.', { left: 40, top: H * 0.58, width: W * 0.32, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.65, fontStyle: 'italic' });
      [rule, category, headline, designerLabel, designer, paperRule, paperLabel, paper, descLabel, desc].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Food & Cake': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
      bg.id = genId(); fc.add(bg);
      const category = new Textbox('THE SWEET FINALE', { left: 40, top: 54, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const ruleTop = new Rect({ left: W / 2 - 30, top: 80, width: 60, height: 1, fill: GOLD_C });
      addImagePlaceholder(fc, { left: W * 0.1, top: H * 0.11, width: W * 0.8, height: H * 0.55, imageUrl: IMG.cake, fill: '#F0EBE0' });
      const rule = new Rect({ left: W / 2 - 60, top: H * 0.69, width: 120, height: 1, fill: GOLD_C });
      const headline = new Textbox('La Pièce Montée', { left: 40, top: H * 0.72, width: W - 80, fontSize: 44, fontFamily: 'Abril Fatface', fill: DARK_C, textAlign: 'center' });
      const subhead = new Textbox('Champagne sponge · elderflower cream · 23ct gold leaf', { left: 40, top: H * 0.82, width: W - 80, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic', textAlign: 'center' });
      const details = new Textbox('CAKE BY LILY VANILLI · FIVE TIERS · FOR ONE HUNDRED AND SIXTY', { left: 40, top: H * 0.88, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 300, textAlign: 'center' });
      [category, ruleTop, rule, headline, subhead, details].forEach(o => { o.id = genId(); fc.add(o); });
    },
    // ── NEW TEMPLATES ────────────────────────────────────────────────────────
    "Editor's Letter": () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      // Right 55% portrait circle
      const portraitR = 180;
      const portraitCx = W * 0.725;
      const portraitCy = H * 0.3;
      const portraitCircle = new Circle({
        left: portraitCx - portraitR,
        top: portraitCy - portraitR,
        radius: portraitR,
        fill: '#EDE8E0',
        stroke: GOLD_C,
        strokeWidth: 1,
        selectable: false,
      });
      portraitCircle.id = genId(); fc.add(portraitCircle);
      // Image placeholder as square inscribed in the circle bounds
      addImagePlaceholder(fc, {
        left: portraitCx - portraitR,
        top: portraitCy - portraitR,
        width: portraitR * 2,
        height: portraitR * 2,
        imageUrl: IMG.bridePortrait,
        fill: '#EDE8E0',
      });
      const kicker = new Textbox('FROM THE EDITOR', { left: 40, top: 80, width: W * 0.42, fontSize: 11, fontFamily: 'Cinzel', fill: GOLD_C, charSpacing: 400 });
      const rule = new Rect({ left: 40, top: 108, width: 60, height: 1, fill: GOLD_C });
      const headline = new Textbox('A Season\nof Grace', { left: 40, top: 124, width: W * 0.42, fontSize: 48, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', fontWeight: '400', lineHeight: 1.05 });
      const body = new Textbox('There is a particular hush that settles over the world just before a wedding — a held breath between the arrangement of chairs and the first notes of music. This season, we found ourselves drawn again and again to that stillness.\n\nIt is the silence of the bride who pauses at the chapel door. The quiet between a vow made and a vow received. The moment, after the last guest has left, when two people sit alone among the candles and the roses, and understand that their life has changed.\n\nThese are the moments we chased — across Tuscan hillsides and Parisian ateliers, into the studios of couturiers and the gardens of florists who speak in blooms the way poets speak in metres.\n\nWhat follows is an edition made slowly, made carefully. It is, above all, a love letter.', { left: 40, top: 260, width: W * 0.42, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.75 });
      const signature = new Textbox('Charlotte Ashford', { left: 40, top: H - 170, width: W * 0.42, fontSize: 48, fontFamily: 'Great Vibes', fill: GOLD_C });
      const sigLine = new Rect({ left: 40, top: H - 108, width: 120, height: 1, fill: DARK_C });
      const sigTitle = new Textbox('EDITOR-IN-CHIEF', { left: 40, top: H - 96, width: W * 0.42, fontSize: 10, fontFamily: 'Jost', fill: DARK_C, charSpacing: 400 });
      [kicker, rule, headline, body, signature, sigLine, sigTitle].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'About Page': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      const mark = new Textbox('LUXURY WEDDING DIRECTORY', { left: 40, top: 68, width: W - 80, fontSize: 14, fontFamily: 'Cinzel', fill: GOLD_C, charSpacing: 500, textAlign: 'center' });
      const ruleTop = new Rect({ left: W / 2 - 40, top: 104, width: 80, height: 1, fill: GOLD_C });
      const hero = new Textbox('Our Story', { left: 40, top: 128, width: W - 80, fontSize: 72, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center', fontWeight: '400' });
      const lede = new Textbox('A curated directory of the world\'s most exceptional wedding venues, planners, and artisans — gathered, vetted, and celebrated by the editors who have spent a decade covering them.', { left: 100, top: 240, width: W - 200, fontSize: 15, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.8)', fontStyle: 'italic', lineHeight: 1.7, textAlign: 'center' });
      const colW = (W - 160) / 3;
      const columns = [
        { title: 'Curation', body: 'Every name in these pages has been chosen, not paid-for. We travel, we watch, we listen, and we only publish what we would entrust to those we love.' },
        { title: 'Craft', body: 'We champion the makers — the seamstress, the calligrapher, the florist, the chef — whose hands shape the quiet perfection of a great wedding day.' },
        { title: 'Celebration', body: 'We believe a wedding is the most public private moment of a life. These pages are made in service of couples who want theirs to feel unmistakably their own.' },
      ];
      columns.forEach((c, i) => {
        const x = 80 + i * (colW + 20);
        const title = new Textbox(c.title.toUpperCase(), { left: x, top: 380, width: colW, fontSize: 11, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
        const divider = new Rect({ left: x + colW / 2 - 20, top: 410, width: 40, height: 1, fill: GOLD_C });
        const body = new Textbox(c.body, { left: x, top: 424, width: colW, fontSize: 12, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.75)', lineHeight: 1.7, textAlign: 'center', fontStyle: 'italic' });
        [title, divider, body].forEach(o => { o.id = genId(); fc.add(o); });
      });
      const footerRule = new Rect({ left: W / 2 - 40, top: H - 88, width: 80, height: 1, fill: GOLD_C });
      const established = new Textbox('Established MMXXIV', { left: 40, top: H - 72, width: W - 80, fontSize: 16, fontFamily: 'GFS Didot', fill: 'rgba(240,235,224,0.6)', fontStyle: 'italic', textAlign: 'center' });
      [mark, ruleTop, hero, lede, footerRule, established].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Back Cover': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#18120A', selectable: false });
      bg.id = genId(); fc.add(bg);
      const kicker = new Textbox('IN THE NEXT ISSUE', { left: 40, top: 72, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 500, textAlign: 'center' });
      const headline = new Textbox('Summer in\nProvence', { left: 40, top: 100, width: W - 80, fontSize: 52, fontFamily: 'Bodoni Moda', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.05, fontWeight: '400' });
      const rule = new Rect({ left: W / 2 - 30, top: 244, width: 60, height: 1, fill: GOLD_C });
      // 3 teaser cards
      const cardW = (W - 2 * 40 - 2 * 16) / 3;
      const cardImgH = 200;
      const cardY = 280;
      const teasers = [
        { img: IMG.tuscany,        caption: 'A Lavender Wedding in Luberon' },
        { img: IMG.florals,        caption: 'The Return of the Wildflower' },
        { img: IMG.venueInterior,  caption: 'Château d\'Estoublon · An Exclusive' },
      ];
      teasers.forEach((t, i) => {
        const x = 40 + i * (cardW + 16);
        addImagePlaceholder(fc, { left: x, top: cardY, width: cardW, height: cardImgH, imageUrl: t.img, fill: '#2A2016' });
        const captionRule = new Rect({ left: x, top: cardY + cardImgH + 16, width: 30, height: 1, fill: GOLD_C });
        captionRule.id = genId(); fc.add(captionRule);
        const cap = new Textbox(t.caption, { left: x, top: cardY + cardImgH + 26, width: cardW, fontSize: 13, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', lineHeight: 1.4 });
        cap.id = genId(); fc.add(cap);
      });
      // Masthead credits block
      const mastheadY = H * 0.72;
      const mastheadRule = new Rect({ left: 40, top: mastheadY, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.35)' });
      const mastheadLabel = new Textbox('MASTHEAD', { left: 40, top: mastheadY + 16, width: W - 80, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 400, textAlign: 'center' });
      const credits = new Textbox(
        'EDITOR-IN-CHIEF · Charlotte Ashford    CREATIVE DIRECTOR · Isadora Valois    PHOTOGRAPHY EDITOR · Henry Asquith\n' +
        'FASHION EDITOR · Celine Moreau    FEATURES · Eleanor Whitmore    ART DIRECTION · Studio Fable\n' +
        'COPY · James Harrington    DIGITAL · Sophia Lin    PUBLISHER · LWD Media Group',
        { left: 40, top: mastheadY + 40, width: W - 80, fontSize: 8, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.55)', charSpacing: 200, lineHeight: 2.2, textAlign: 'center' }
      );
      const lwd = new Textbox('LWD', { left: 40, top: H - 64, width: W - 80, fontSize: 22, fontFamily: 'Bodoni Moda', fill: GOLD_C, fontStyle: 'italic', textAlign: 'center' });
      const yearLine = new Textbox('SPRING MMXXVI · ISSUE 01', { left: 40, top: H - 36, width: W - 80, fontSize: 8, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.4)', charSpacing: 500, textAlign: 'center' });
      [kicker, headline, rule, mastheadRule, mastheadLabel, credits, lwd, yearLine].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Full-Page Advertisement': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H, imageUrl: IMG.dressDetail, fill: '#1A1612' });
      // Thin gold bar at 80% height
      const barY = H * 0.8;
      const bar = new Rect({ left: W * 0.25, top: barY, width: W * 0.5, height: 1, fill: GOLD_C, selectable: false });
      bar.id = genId(); fc.add(bar);
      const brand = new Textbox('VERA WANG', { left: 40, top: barY + 20, width: W - 80, fontSize: 52, fontFamily: 'Abril Fatface', fill: '#F0EBE0', textAlign: 'center', charSpacing: 150 });
      const tagline = new Textbox('COUTURE · NEW YORK · PARIS', { left: 40, top: barY + 96, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 500, textAlign: 'center' });
      const url = new Textbox('verawang.com', { left: 40, top: H - 44, width: W - 80, fontSize: 11, fontFamily: 'Jost', fill: 'rgba(240,235,224,0.7)', charSpacing: 200, textAlign: 'center' });
      [brand, tagline, url].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Product Showcase Ad': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.5, height: H, imageUrl: IMG.ring, fill: '#EDE8E0' });
      // Right cream panel (matches bg, acts as logical right column)
      const panel = new Rect({ left: W * 0.5, top: 0, width: W * 0.5, height: H, fill: '#FAF8F5', selectable: false });
      panel.id = genId(); fc.add(panel);
      const featured = new Textbox('FEATURED', { left: W * 0.55, top: 120, width: W * 0.4, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 500 });
      const ruleTop = new Rect({ left: W * 0.55, top: 146, width: 40, height: 1, fill: GOLD_C });
      const product = new Textbox('The Madeleine\nSolitaire', { left: W * 0.55, top: 166, width: W * 0.4, fontSize: 38, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
      const desc = new Textbox('A 3.2ct old-European cut diamond set on a\nhand-forged 18ct gold band.', { left: W * 0.55, top: 286, width: W * 0.4, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: DARK_C, lineHeight: 1.6, fontStyle: 'italic' });
      const goldRule = new Rect({ left: W * 0.55, top: 360, width: 80, height: 1, fill: GOLD_C });
      const priceLabel = new Textbox('FROM', { left: W * 0.55, top: 376, width: W * 0.4, fontSize: 9, fontFamily: 'Jost', fill: MUTED_C, charSpacing: 300 });
      const price = new Textbox('£48,000', { left: W * 0.55, top: 392, width: W * 0.4, fontSize: 26, fontFamily: 'Cormorant Garamond', fill: DARK_C, fontStyle: 'italic' });
      // CTA
      const cta = new Rect({ left: W * 0.55, top: 460, width: 200, height: 50, fill: '#0A0908', selectable: true });
      cta.id = genId(); fc.add(cta);
      const ctaText = new Textbox('SHOP NOW', { left: W * 0.55, top: 478, width: 200, fontSize: 11, fontFamily: 'Jost', fill: '#F0EBE0', charSpacing: 500, textAlign: 'center' });
      const brand = new Textbox('GRAFF · LONDON', { left: W * 0.55, top: H - 68, width: W * 0.4, fontSize: 9, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 500 });
      [featured, ruleTop, product, desc, goldRule, priceLabel, price, ctaText, brand].forEach(o => { o.id = genId(); fc.add(o); });
    },
    'Venue Advertisement': () => {
      const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0A0908', selectable: false });
      bg.id = genId(); fc.add(bg);
      addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H, imageUrl: IMG.venetianPalazzo, fill: '#1A1612' });
      // Bottom dark gradient for text legibility
      const gradient = new Rect({ left: 0, top: H * 0.45, width: W, height: H * 0.55, fill: 'rgba(10,9,8,0.65)', selectable: false });
      gradient.id = genId(); fc.add(gradient);
      const ruleTop = new Rect({ left: W / 2 - 40, top: H * 0.56, width: 80, height: 1, fill: GOLD_C });
      const venueName = new Textbox('HOTEL CIPRIANI', { left: 40, top: H * 0.58, width: W - 80, fontSize: 34, fontFamily: 'Cinzel', fill: GOLD_C, charSpacing: 600, textAlign: 'center' });
      const tagline = new Textbox('A palazzo suspended above the Grand Canal', { left: 40, top: H * 0.66, width: W - 80, fontSize: 18, fontFamily: 'Cormorant Garamond', fill: '#F0EBE0', fontStyle: 'italic', textAlign: 'center' });
      const ruleMid = new Rect({ left: W / 2 - 30, top: H * 0.73, width: 60, height: 1, fill: GOLD_C });
      const callout = new Textbox('PRIVATE VIEWINGS BY APPOINTMENT', { left: 40, top: H * 0.75, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: '#F0EBE0', charSpacing: 500, textAlign: 'center' });
      // CTA button
      const ctaRect = new Rect({ left: W / 2 - 110, top: H * 0.8, width: 220, height: 52, fill: 'transparent', stroke: GOLD_C, strokeWidth: 1, selectable: true });
      ctaRect.id = genId(); fc.add(ctaRect);
      const ctaText = new Textbox('BOOK A VISIT', { left: W / 2 - 110, top: H * 0.8 + 19, width: 220, fontSize: 11, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 500, textAlign: 'center' });
      const footer = new Textbox('cipriani.com  ·  +39 041 520 7744', { left: 40, top: H - 48, width: W - 80, fontSize: 10, fontFamily: 'Cormorant Garamond', fill: 'rgba(240,235,224,0.7)', fontStyle: 'italic', textAlign: 'center', charSpacing: 100 });
      [ruleTop, venueName, tagline, ruleMid, callout, ctaText, footer].forEach(o => { o.id = genId(); fc.add(o); });
    },
  };

  const defaultLayout = () => {
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
    bg.id = genId(); fc.add(bg);
    const categoryLabel = new Textbox(template.category.toUpperCase(), { left: 40, top: 48, width: W - 80, fontSize: 10, fontFamily: 'Jost', fill: GOLD_C, charSpacing: 300 });
    const rule = new Rect({ left: 40, top: 70, width: W - 80, height: 1, fill: 'rgba(201,168,76,0.35)' });
    const titleObj = new Textbox(template.name, { left: 40, top: 90, width: W - 80, fontSize: 44, fontFamily: 'Bodoni Moda', fill: DARK_C, fontStyle: 'italic', fontWeight: '400', lineHeight: 1.1 });
    const desc = new Textbox(template.description || 'Add your content here', { left: 40, top: 200, width: W - 80, fontSize: 14, fontFamily: 'Cormorant Garamond', fill: 'rgba(24,18,10,0.7)', lineHeight: 1.65, fontStyle: 'italic' });
    addImagePlaceholder(fc, { left: 40, top: 300, width: W - 80, height: H * 0.5, imageUrl: IMG.fashionEditorial });
    [categoryLabel, rule, titleObj, desc].forEach(o => { o.id = genId(); fc.add(o); });
  };

  // Preload the fashion-editorial font matrix so template text renders with
  // correct metrics from the first paint instead of falling back to system serif.
  [
    'Bodoni Moda', 'Playfair Display', 'Abril Fatface', 'DM Serif Display',
    'Cinzel', 'GFS Didot', 'Cormorant Garamond', 'Great Vibes', 'Jost',
  ].forEach(f => { try { loadGoogleFont(f); } catch { /* noop */ } });

  // Try category match first, then template name (for new named templates),
  // and fall back to defaultLayout if neither is a registered layout.
  const layoutFn = layouts[template.category] || layouts[template.name] || defaultLayout;
  layoutFn();

  // Apply brand colours + fonts on top of the authored layout.
  if (brand && Object.keys(brand).length) applyBrandToCanvas(fc, brand);

  // Templates are authored at A4 (794×1123) — the locked standard page size.
  // No runtime scaling needed; objects render at their authored coordinates.
  fc.getObjects().forEach(o => o.setCoords());
  fc.requestRenderAll();
}

// ── Smart Fill — build an editorial page from a live listing row ─────────────
// `listing` is the raw Supabase row (snake_case). Builds a full-bleed editorial
// page with the real venue or planner data, then applies the brand kit on top.
function applySmartFill(fc, listing, brand = {}) {
  const W = TEMPLATE_REF_W;
  const H = TEMPLATE_REF_H;

  // Brand-aware gold colour (falls back to LWD gold)
  const GOLD_C  = brand?.primary_color || '#C9A84C';
  const DARK_C  = '#18120A';
  const CREAM   = '#F0EBE0';
  const hFont   = brand?.heading_font || 'Bodoni Moda';
  const bFont   = brand?.body_font    || 'Jost';
  const serif   = brand?.heading_font || 'Cormorant Garamond';

  // Preload fonts
  [hFont, bFont, serif, 'Cinzel', 'Jost', 'Cormorant Garamond', 'Bodoni Moda'].forEach(f => {
    try { loadGoogleFont(f); } catch { /* noop */ }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function heroImg(row) {
    try {
      const items = Array.isArray(row.media_items) ? row.media_items : JSON.parse(row.media_items || '[]');
      const feat = items.find(m => m.is_featured && m.type === 'image');
      if (feat?.url) return feat.url;
      const first = items.find(m => m.type === 'image');
      if (first?.url) return first.url;
    } catch { /* noop */ }
    try {
      const hi = Array.isArray(row.hero_images) ? row.hero_images : JSON.parse(row.hero_images || '[]');
      if (hi.length) { const img = hi[0]; return typeof img === 'string' ? img : img?.url || img?.src || ''; }
    } catch { /* noop */ }
    return null;
  }

  function locStr(row) {
    return [row.city, row.country].filter(Boolean).join(' · ') || row.region || '';
  }

  function featureLines(row) {
    const lines = [];
    if (row.capacity_max) lines.push(`Up to ${row.capacity_max} guests`);
    if (row.exclusive_use_enabled) lines.push('Exclusive use available');
    const amen = row.amenities;
    if (typeof amen === 'string') amen.split(/[,\n]/).slice(0, 3).forEach(a => { const t = a.trim(); if (t) lines.push(t); });
    else if (Array.isArray(amen)) amen.slice(0, 3).forEach(a => lines.push(a));
    return lines.slice(0, 4).join('\n') || 'Enquire for full details';
  }

  function shortDesc(row) {
    return row.short_description || (row.description || '').slice(0, 180) || 'An extraordinary setting for your most significant day.';
  }

  function plannerSpecialties(row) {
    try {
      const cp = typeof row.contact_profile === 'string' ? JSON.parse(row.contact_profile) : row.contact_profile;
      if (cp?.title) return cp.title;
    } catch { /* noop */ }
    return 'Wedding Planner';
  }

  // ── Layout by listing type ─────────────────────────────────────────────────
  fc.clear();
  fc.backgroundColor = '#ffffff';

  const imgUrl = heroImg(listing);
  const type   = listing.listing_type || 'venue';

  if (type === 'venue') {
    // ── VENUE: hero left, editorial text right ───────────────────────────────
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#1A1B2E', selectable: false });
    bg.id = genId(); fc.add(bg);

    addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.52, height: H, imageUrl: imgUrl, fill: '#2A2B3E' });

    const rule      = new Rect({ left: W * 0.58, top: 72, width: 2, height: 68, fill: GOLD_C });
    const kicker    = new Textbox('VENUE FEATURE', { left: W * 0.6, top: 72, width: W * 0.37, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const name      = new Textbox(listing.name || 'Venue Name', { left: W * 0.6, top: 96, width: W * 0.37, fontSize: 36, fontFamily: hFont, fill: CREAM, fontStyle: 'italic', lineHeight: 1.05 });
    const loc       = new Textbox(locStr(listing), { left: W * 0.6, top: 170, width: W * 0.37, fontSize: 14, fontFamily: serif, fill: GOLD_C, fontStyle: 'italic' });
    const desc      = new Textbox(shortDesc(listing), { left: W * 0.6, top: 210, width: W * 0.36, fontSize: 13, fontFamily: serif, fill: 'rgba(240,235,224,0.8)', lineHeight: 1.65, fontStyle: 'italic' });
    const ruleMid   = new Rect({ left: W * 0.6, top: H * 0.55, width: 40, height: 1, fill: GOLD_C });
    const glanceHdr = new Textbox('AT A GLANCE', { left: W * 0.6, top: H * 0.57, width: W * 0.36, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const features  = new Textbox(featureLines(listing), { left: W * 0.6, top: H * 0.62, width: W * 0.36, fontSize: 11, fontFamily: bFont, fill: 'rgba(240,235,224,0.7)', lineHeight: 2 });
    const footer    = new Textbox(`luxuryweddingdirectory.com/venues/${listing.slug || ''}`, { left: W * 0.6, top: H - 52, width: W * 0.36, fontSize: 9, fontFamily: bFont, fill: 'rgba(201,168,76,0.55)', charSpacing: 60 });
    [rule, kicker, name, loc, desc, ruleMid, glanceHdr, features, footer].forEach(o => { o.id = genId(); fc.add(o); });

  } else if (type === 'planner' || type === 'photographer' || type === 'videographer') {
    // ── PLANNER / PHOTOGRAPHER: portrait left, editorial bio right ───────────
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
    bg.id = genId(); fc.add(bg);

    addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.48, height: H, imageUrl: imgUrl, fill: '#EDE8E0' });

    const typeLabel = type === 'photographer' ? 'PHOTOGRAPHER' : type === 'videographer' ? 'VIDEOGRAPHER' : 'WEDDING PLANNER';
    const rule  = new Rect({ left: W * 0.54, top: 72, width: 2, height: 56, fill: GOLD_C });
    const kicker = new Textbox(typeLabel, { left: W * 0.56, top: 72, width: W * 0.38, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const name  = new Textbox(listing.name || 'Name', { left: W * 0.56, top: 92, width: W * 0.38, fontSize: 34, fontFamily: hFont, fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
    const title = new Textbox(plannerSpecialties(listing), { left: W * 0.56, top: 160, width: W * 0.38, fontSize: 11, fontFamily: bFont, fill: GOLD_C, charSpacing: 200 });
    const loc   = new Textbox(locStr(listing), { left: W * 0.56, top: 182, width: W * 0.38, fontSize: 13, fontFamily: serif, fill: 'rgba(24,18,10,0.55)', fontStyle: 'italic' });
    const ruleMid = new Rect({ left: W * 0.56, top: 218, width: 40, height: 1, fill: GOLD_C });
    const desc  = new Textbox(shortDesc(listing), { left: W * 0.56, top: 234, width: W * 0.38, fontSize: 13, fontFamily: serif, fill: DARK_C, lineHeight: 1.7, fontStyle: 'italic' });
    const enquireLabel = new Textbox('ENQUIRE', { left: W * 0.56, top: H - 80, width: W * 0.38, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 400 });
    const enquireRule  = new Rect({ left: W * 0.56, top: H - 62, width: W * 0.38, height: 1, fill: 'rgba(201,168,76,0.3)' });
    const enquireLink  = new Textbox(`luxuryweddingdirectory.com/${listing.slug || ''}`, { left: W * 0.56, top: H - 50, width: W * 0.38, fontSize: 10, fontFamily: bFont, fill: 'rgba(24,18,10,0.45)', charSpacing: 60 });
    [rule, kicker, name, title, loc, ruleMid, desc, enquireLabel, enquireRule, enquireLink].forEach(o => { o.id = genId(); fc.add(o); });

  } else if (type === 'article') {
    // ── MAGAZINE ARTICLE: full-bleed hero, editorial text overlay ───────────
    const imgSrc = listing.featured_image || listing.hero_image_url || null;
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#0D0B09', selectable: false });
    bg.id = genId(); fc.add(bg);
    addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.62, imageUrl: imgSrc, fill: '#2A2520' });
    // Dark gradient overlay over image bottom
    const overlay = new Rect({ left: 0, top: H * 0.38, width: W, height: H * 0.24, fill: 'rgba(13,11,9,0)', selectable: false });
    overlay.id = genId(); fc.add(overlay);
    const catLabel = (listing.category || 'EDITORIAL').toUpperCase();
    const kicker  = new Textbox(catLabel, { left: 40, top: H * 0.65, width: W - 80, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const rule    = new Rect({ left: 40, top: H * 0.68, width: 48, height: 1, fill: GOLD_C });
    const title   = new Textbox(listing.name || listing.title || 'Article Title', { left: 40, top: H * 0.7, width: W - 80, fontSize: 40, fontFamily: hFont, fill: '#FAF8F5', fontStyle: 'italic', lineHeight: 1.05 });
    const excerpt = new Textbox(listing.excerpt || listing.short_description || '', { left: 40, top: H * 0.84, width: W - 80, fontSize: 12, fontFamily: serif, fill: 'rgba(240,235,224,0.7)', lineHeight: 1.7, fontStyle: 'italic' });
    const footer  = new Textbox(`luxuryweddingdirectory.com/magazine/${listing.slug || ''}`, { left: 40, top: H - 40, width: W - 80, fontSize: 9, fontFamily: bFont, fill: 'rgba(201,168,76,0.5)', charSpacing: 60 });
    [kicker, rule, title, excerpt, footer].forEach(o => { o.id = genId(); fc.add(o); });

  } else if (type === 'showcase') {
    // ── REAL WEDDING / SHOWCASE: editorial split layout ──────────────────────
    const imgSrc = listing.hero_image_url || listing.preview_url || null;
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#FAF8F5', selectable: false });
    bg.id = genId(); fc.add(bg);
    addImagePlaceholder(fc, { left: 0, top: 0, width: W * 0.5, height: H, imageUrl: imgSrc, fill: '#EDE8E0' });
    const accent  = new Rect({ left: W * 0.55, top: 68, width: 2, height: 56, fill: GOLD_C });
    const kicker  = new Textbox('REAL WEDDING', { left: W * 0.57, top: 68, width: W * 0.38, fontSize: 9, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const title   = new Textbox(listing.name || listing.title || 'Wedding Feature', { left: W * 0.57, top: 92, width: W * 0.38, fontSize: 34, fontFamily: hFont, fill: DARK_C, fontStyle: 'italic', lineHeight: 1.05 });
    const loc     = new Textbox(listing.location || locStr(listing), { left: W * 0.57, top: 168, width: W * 0.38, fontSize: 13, fontFamily: serif, fill: GOLD_C, fontStyle: 'italic' });
    const ruleMid = new Rect({ left: W * 0.57, top: 200, width: 40, height: 1, fill: GOLD_C });
    const excerpt = new Textbox(listing.excerpt || shortDesc(listing), { left: W * 0.57, top: 216, width: W * 0.38, fontSize: 13, fontFamily: serif, fill: DARK_C, lineHeight: 1.7, fontStyle: 'italic' });
    const footer  = new Textbox(`luxuryweddingdirectory.com/showcases/${listing.slug || ''}`, { left: W * 0.57, top: H - 44, width: W * 0.38, fontSize: 9, fontFamily: bFont, fill: 'rgba(201,168,76,0.5)', charSpacing: 60 });
    [accent, kicker, title, loc, ruleMid, excerpt, footer].forEach(o => { o.id = genId(); fc.add(o); });

  } else {
    // ── GENERIC vendor / fallback ────────────────────────────────────────────
    const bg = new Rect({ left: 0, top: 0, width: W, height: H, fill: '#ffffff', selectable: false });
    bg.id = genId(); fc.add(bg);
    addImagePlaceholder(fc, { left: 0, top: 0, width: W, height: H * 0.55, imageUrl: imgUrl, fill: '#EDE8E0' });
    const kicker = new Textbox((listing.listing_type || 'VENDOR').toUpperCase(), { left: 40, top: H * 0.58, width: W - 80, fontSize: 10, fontFamily: bFont, fill: GOLD_C, charSpacing: 300 });
    const name   = new Textbox(listing.name || 'Listing Name', { left: 40, top: H * 0.61, width: W - 80, fontSize: 44, fontFamily: hFont, fill: DARK_C, fontStyle: 'italic', lineHeight: 1.1 });
    const loc    = new Textbox(locStr(listing), { left: 40, top: H * 0.74, width: W - 80, fontSize: 14, fontFamily: serif, fill: GOLD_C, fontStyle: 'italic' });
    const desc   = new Textbox(shortDesc(listing), { left: 80, top: H * 0.8, width: W - 160, fontSize: 13, fontFamily: serif, fill: 'rgba(24,18,10,0.7)', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' });
    [kicker, name, loc, desc].forEach(o => { o.id = genId(); fc.add(o); });
  }

  // Apply brand on top
  if (brand && Object.keys(brand).length) applyBrandToCanvas(fc, brand);

  fc.getObjects().forEach(o => o.setCoords());
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
export default function PageDesigner({ issue, onIssueUpdate, onPagesChange, onBack }) {
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
  const pendingTemplateRef    = useRef(null); // set by handleInsertTemplate, consumed by page-switch effect
  const pendingSmartFillRef   = useRef(null); // set by handleSmartFillSelect, consumed by page-switch effect

  // ── Imperative canvas creation helpers (Fabric v7 ↔ React DOM isolation) ──────
  // Each "host" div is empty from React's perspective — canvas created imperatively.
  // CRITICAL: Fabric disposal happens in the null-branch of these callback refs.
  // React's mutation phase calls ref(null) BEFORE removing the DOM element, so the
  // canvas is still attached when we call dispose() — avoiding the removeChild crash
  // that occurs when useEffect cleanup runs AFTER the DOM is already gone.
  const leftCanvasHostCallbackRef = useCallback((el) => {
    if (el) {
      const c = document.createElement('canvas');
      el.appendChild(c);
      canvasElRefLeft.current = c;
    } else {
      // DOM still attached here — safe to dispose Fabric
      if (fabricRefLeft.current) {
        try { fabricRefLeft.current.dispose(); } catch (_) {}
        fabricRefLeft.current = null;
      }
      canvasElRefLeft.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rightSpreadCanvasHostCallbackRef = useCallback((el) => {
    if (el) {
      const c = document.createElement('canvas');
      el.appendChild(c);
      canvasElRef.current = c;
    } else {
      // DOM still attached here — safe to dispose Fabric
      if (fabricRef.current) {
        try { fabricRef.current.dispose(); } catch (_) {}
        fabricRef.current = null;
      }
      canvasElRef.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Single-mode canvas host — same pattern as spread hosts.
  // Without this, toggling spread ON → OFF → ON leaves a stale Fabric instance
  // (disposal deferred to useEffect cleanup which runs after DOM removal),
  // corrupting state for the next spread mount → black screen.
  const singleCanvasHostCallbackRef = useCallback((el) => {
    if (el) {
      const c = document.createElement('canvas');
      el.appendChild(c);
      canvasElRef.current = c;
    } else {
      if (fabricRef.current) {
        try { fabricRef.current.dispose(); } catch (_) {}
        fabricRef.current = null;
      }
      canvasElRef.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [pages, setPages] = useState([{
    id: genId(),
    pageNumber: 1,
    canvasJSON: null,
    thumbnailDataUrl: null,
    name: 'Page 1',
    templateName: null,
    slot: null,
  }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Keep a ref in sync so the spread page-switch effect can read pages without stale closures
  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  // Notify parent whenever pages change (used by IssueWorkspace for Revenue panel)
  useEffect(() => {
    if (onPagesChange) onPagesChange(pages);
  }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [pageSize, setPageSize] = useState(issue?.page_size || 'A4');
  const [layers, setLayers] = useState([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showBleed, setShowBleed] = useState(false);
  const [lightsOff, setLightsOff] = useState(false); // dim surroundings to focus on canvas
  const [zoom, setZoom] = useState(1);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null); // Date | null — most recent successful save
  const [exportingDigital, setExportingDigital] = useState(false);
  const [exportingPrint, setExportingPrint] = useState(false);
  const [exportingScreen, setExportingScreen] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  // Dirty flag — true when canvas has unsaved edits. Triggers beforeunload + auto-save.
  const [isDirty, setIsDirty] = useState(false);
  // Publish progress — null when idle, { current, total } while publishing.
  const [publishProgress, setPublishProgress] = useState(null);

  // Page background colour
  const [pageBg, setPageBg] = useState('#ffffff');

  // Background removal
  const [removingBg, setRemovingBg] = useState(false);

  // Spread view state — default ON for wide screens
  const [spreadView, setSpreadView] = useState(() => window.innerWidth >= 1400);
  const [activeSpreadSide, setActiveSpreadSide] = useState('right'); // 'left' | 'right'

  // Spread preview modal (read-only rendered spread view)
  const [showSpreadPreview, setShowSpreadPreview] = useState(false);

  // Guide rails state
  const [guides, setGuides] = useState({ h: [], v: [] });
  const [draftGuide, setDraftGuide] = useState(null); // null | { axis: 'h'|'v', pos: number }

  // Brand kit — loaded on mount, applied to every template insert/replace
  const [brand, setBrand] = useState({});
  const [showBrandKit, setShowBrandKit] = useState(false);

  // Smart Fill panel
  const [showSmartFill, setShowSmartFill] = useState(false);

  // AI Issue Builder panel
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  // Voice Training panel
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  // Page Slot panel
  const [showSlotPanel, setShowSlotPanel] = useState(false);

  // Crop mode state (Feature C)
  const [cropMode, setCropMode] = useState(null); // null | { active: true, targetObj, cropRect }

  // AI Layout toast (Feature D)
  const [aiLayoutToast, setAiLayoutToast] = useState(null);

  useEffect(() => {
    fetchBrandKit().then(({ data }) => { if (data) setBrand(data); });
  }, []);

  // Image picker — opened by double-clicking any isImagePlaceholder object
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const imagePickerTargetRef = useRef(null); // the Fabric object to replace

  const openImagePicker = useCallback((target) => {
    imagePickerTargetRef.current = target || null;
    setImagePickerOpen(true);
  }, []);

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
    const json = fc.toJSON(['id', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']);
    setUndoStack(prev => [...prev.slice(-29), json]);
    setRedoStack([]);
    setIsDirty(true); // mark unsaved changes
  }, [getActiveCanvas]);

  // ── Image picker selection ─────────────────────────────────────────────────
  // When a URL is selected from ImagePickerModal, replace the tagged placeholder
  // (either backdrop Rect or previously-placed Image) with a fresh FabricImage
  // that inherits the original bounds, so the layout stays intact.
  // ── Place multiple images — cascaded from canvas centre ────────────────────
  const handleImagePickerSelectMultiple = useCallback(async (urls) => {
    const fc = getActiveCanvas();
    if (!fc || !urls?.length) return;
    setImagePickerOpen(false);
    imagePickerTargetRef.current = null;
    const OFFSET = 28; // px cascade step
    const startX = dims.w * 0.15;
    const startY = dims.h * 0.12;
    for (let i = 0; i < urls.length; i++) {
      try {
        const img = await FabricImage.fromURL(urls[i], { crossOrigin: 'anonymous' });
        const scale = (dims.w * 0.45) / img.width;
        img.set({
          left: startX + i * OFFSET,
          top:  startY + i * OFFSET,
          scaleX: scale, scaleY: scale,
          isImagePlaceholder: true,
        });
        img.id = genId();
        fc.add(img);
      } catch (e) {
        console.warn('Multi-place failed for', urls[i], e);
      }
    }
    fc.requestRenderAll();
    pushUndo();
  }, [getActiveCanvas, dims, pushUndo]);

  const handleImagePickerSelect = useCallback(async (url) => {
    const fc = getActiveCanvas();
    const target = imagePickerTargetRef.current;
    setImagePickerOpen(false);
    imagePickerTargetRef.current = null;
    if (!fc || !url) return;

    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      if (!img) return;

      if (target) {
        // ── Replace existing image / placeholder ──────────────────────────
        const left   = target.left;
        const top    = target.top;
        const width  = (target.width  ?? img.width)  * (target.scaleX ?? 1);
        const height = (target.height ?? img.height) * (target.scaleY ?? 1);
        const scale  = Math.max(width / img.width, height / img.height);
        img.set({
          left, top,
          scaleX: scale, scaleY: scale,
          clipPath: new Rect({ left, top, width, height, absolutePositioned: true }),
          isImagePlaceholder: true,
        });
        img.id = genId();
        fc.remove(target);
        fc.add(img);
      } else {
        // ── No target — add fresh image centred on canvas ─────────────────
        const scale = (dims.w * 0.5) / img.width;
        img.set({
          left: dims.w * 0.25, top: dims.h * 0.25,
          scaleX: scale, scaleY: scale,
          isImagePlaceholder: true,
        });
        img.id = genId();
        fc.add(img);
      }

      fc.setActiveObject(img);
      fc.requestRenderAll();
      pushUndo();
    } catch (e) {
      console.error('Image picker: failed to load', e);
    }
  }, [getActiveCanvas, dims, pushUndo]);

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
    // Track multi-selection
    fc.on('selection:created', (e) => { setSelectedObjects(fc.getActiveObjects?.() || []); });
    fc.on('selection:updated', (e) => { setSelectedObjects(fc.getActiveObjects?.() || []); });
    fc.on('selection:cleared', () => { setSelectedObjects([]); });
    fc.on('object:modified', () => { onModify(); syncL(); });
    fc.on('object:added',    () => { onModify(); syncL(); });
    fc.on('object:removed',  () => { onModify(); syncL(); });

    // Double-click on an image placeholder opens the picker modal so users can
    // swap the Unsplash default for their own uploaded or previously-used imagery.
    fc.on('mouse:dblclick', (e) => {
      const t = e.target;
      // Double-click any image (placeholder slot OR an already-placed image) → open picker
      if (t?.isImagePlaceholder || t?.type === 'image') {
        openImagePicker(t);
      }
    });

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

    // ── Feature B: Smart Guides ──────────────────────────────────────────────
    const SMART_SNAP_THRESHOLD = 8;
    let smartGuideLines = [];

    function clearSmartGuides() {
      smartGuideLines.forEach(l => { try { fc.remove(l); } catch { /* noop */ } });
      smartGuideLines = [];
    }

    fc.on('object:moving', ({ target }) => {
      clearSmartGuides();
      if (!target) return;
      const objs = fc.getObjects().filter(o => o !== target && !o.isPlaceholderMarker);
      const tl = target.getBoundingRect();
      const tCentreX = tl.left + tl.width / 2;
      const tCentreY = tl.top + tl.height / 2;

      objs.forEach(obj => {
        const ol = obj.getBoundingRect();
        const oCentreX = ol.left + ol.width / 2;
        const oCentreY = ol.top + ol.height / 2;

        // Vertical guides
        [[ol.left, 'left'], [oCentreX, 'centreX'], [ol.left + ol.width, 'right']].forEach(([x]) => {
          if (Math.abs(tl.left - x) < SMART_SNAP_THRESHOLD) {
            target.set('left', target.left + (x - tl.left));
            const ln = new Line([x, 0, x, fc.height], { stroke: 'rgba(201,168,76,0.7)', strokeWidth: 1, selectable: false, evented: false, strokeDashArray: [4, 4] });
            ln._isSmartGuide = true;
            fc.add(ln); smartGuideLines.push(ln);
          }
          if (Math.abs(tCentreX - x) < SMART_SNAP_THRESHOLD) {
            target.set('left', target.left + (x - tCentreX));
            const ln = new Line([x, 0, x, fc.height], { stroke: 'rgba(201,168,76,0.7)', strokeWidth: 1, selectable: false, evented: false, strokeDashArray: [4, 4] });
            ln._isSmartGuide = true;
            fc.add(ln); smartGuideLines.push(ln);
          }
        });

        // Horizontal guides
        [[ol.top, 'top'], [oCentreY, 'centreY'], [ol.top + ol.height, 'bottom']].forEach(([y]) => {
          if (Math.abs(tl.top - y) < SMART_SNAP_THRESHOLD) {
            target.set('top', target.top + (y - tl.top));
            const ln = new Line([0, y, fc.width, y], { stroke: 'rgba(201,168,76,0.7)', strokeWidth: 1, selectable: false, evented: false, strokeDashArray: [4, 4] });
            ln._isSmartGuide = true;
            fc.add(ln); smartGuideLines.push(ln);
          }
        });
      });
      fc.renderAll();
    });

    fc.on('object:modified', clearSmartGuides);
    fc.on('mouse:up', clearSmartGuides);
    // ── End Smart Guides ─────────────────────────────────────────────────────

    if (pageJSON) {
      fc.loadFromJSON(pageJSON).then(() => { fc.renderAll(); syncL(); });
    } else {
      syncL();
    }

    return fc;
  }, [dims.w, dims.h, openImagePicker]);

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
          slot: row.template_data?.slot ?? null,
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

  // ── Unsaved-changes guard ────────────────────────────────────────────────────
  // Warn before the browser navigates away when there are unsaved edits.
  // Works for tab-close, browser back, and navigation to a new page.
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // ── Canvas init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pagesLoaded) return; // wait until DB pages are loaded
    if (!spreadView) {
      // ── Single page mode ──
      if (!canvasElRef.current) return;

      // Note: single-mode canvas disposal happens in singleCanvasHostCallbackRef
      // null-branch (fires while DOM still attached). Guard here prevents double-dispose.
      if (fabricRef.current) { try { fabricRef.current.dispose(); } catch (_) {} fabricRef.current = null; }

      const fc = initCanvas(
        canvasElRef.current,
        pages[currentPageIndex]?.canvasJSON,
        (obj) => setSelectedObject(obj),
        pushUndo,
        setLayers,
      );
      fabricRef.current = fc;

      return () => {
        // Disposal already handled by callback ref while DOM is live.
        // Guarded null-assignment to prevent stale refs if cleanup somehow runs first.
        if (fabricRef.current === fc) {
          try { fc.dispose(); } catch (_) {}
          fabricRef.current = null;
        }
      };
    } else {
      // ── Spread mode: create canvas instances ──────────────────
      // Content is loaded by the separate spread page-switch effect below.

      // Note: spread canvas disposal happens in leftCanvasHostCallbackRef / rightSpreadCanvasHostCallbackRef
      // null-branches (fires while DOM still attached). Guards here prevent double-dispose.
      if (fabricRef.current)     { try { fabricRef.current.dispose(); } catch (_) {}     fabricRef.current = null; }
      if (fabricRefLeft.current) { try { fabricRefLeft.current.dispose(); } catch (_) {} fabricRefLeft.current = null; }

      // Init right canvas (always present)
      if (canvasElRef.current) {
        const fcRight = initCanvas(
          canvasElRef.current,
          null, // content loaded by page-switch effect
          (obj) => { setActiveSpreadSide('right'); setSelectedObject(obj); },
          pushUndo,
          setLayers,
        );
        fabricRef.current = fcRight;
      }

      // Init left canvas (always created so ref is always valid)
      if (canvasElRefLeft.current) {
        const fcLeft = initCanvas(
          canvasElRefLeft.current,
          null, // content loaded by page-switch effect
          (obj) => { setActiveSpreadSide('left'); setSelectedObject(obj); },
          pushUndo,
          setLayers,
        );
        fabricRefLeft.current = fcLeft;
      }

      return () => {
        // Disposal already handled by callback refs while DOM is live.
        // These null-assignments prevent stale references if effect cleanup
        // somehow runs before the callback ref null-branch (edge case guard).
        if (fabricRef.current)     { try { fabricRef.current.dispose(); } catch (_) {}     fabricRef.current = null; }
        if (fabricRefLeft.current) { try { fabricRefLeft.current.dispose(); } catch (_) {} fabricRefLeft.current = null; }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadView, pageSize, pagesLoaded]);

  // ── Spread page-switch: load page content when navigating in spread mode ──────
  useEffect(() => {
    if (!spreadView || !pagesLoaded) return;
    const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pagesRef.current.length);

    // Load into left canvas
    if (fabricRefLeft.current) {
      const fc = fabricRefLeft.current;
      try {
        fc.clear();
        fc.backgroundColor = '#ffffff';
        const leftJson = leftIndex !== null ? pagesRef.current[leftIndex]?.canvasJSON : null;
        if (leftJson) {
          fc.loadFromJSON(leftJson).then(() => {
            // Guard: canvas may have been disposed while Promise was in-flight
            if (fabricRefLeft.current === fc) { fc.renderAll?.(); setLayers(buildLayers(fc)); }
          }).catch(() => {});
        } else {
          fc.renderAll();
          setLayers([]);
        }
      } catch (_) {}
    }

    // Load into right canvas
    if (fabricRef.current) {
      const fc = fabricRef.current;
      try {
        fc.clear();
        fc.backgroundColor = '#ffffff';
        const rightJson = rightIndex !== null ? pagesRef.current[rightIndex]?.canvasJSON : null;
        if (rightJson) {
          fc.loadFromJSON(rightJson).then(() => {
            if (fabricRef.current === fc) { fc.renderAll?.(); setLayers(buildLayers(fc)); }
          }).catch(() => {});
        } else {
          fc.renderAll();
          setLayers([]);
          // Consume any pending Smart Fill or template (same as single-page effect)
          if (pendingSmartFillRef.current) {
            const listing = pendingSmartFillRef.current;
            pendingSmartFillRef.current = null;
            applySmartFill(fc, listing, brand);
            pushUndo();
          } else if (pendingTemplateRef.current) {
            const t = pendingTemplateRef.current;
            pendingTemplateRef.current = null;
            applyTemplate(fc, t, dims, brand);
            pushUndo();
          }
        }
      } catch (_) {}
    }
  }, [currentPageIndex, spreadView, pagesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Apply a pending template (set by handleInsertTemplate for blank new pages)
      if (pendingTemplateRef.current) {
        const t = pendingTemplateRef.current;
        pendingTemplateRef.current = null;
        applyTemplate(fc, t, dims, brand);
        pushUndo();
      }
      // Apply a pending Smart Fill listing (set by handleSmartFillSelect)
      if (pendingSmartFillRef.current) {
        const listing = pendingSmartFillRef.current;
        pendingSmartFillRef.current = null;
        applySmartFill(fc, listing, brand);
        pushUndo();
      }
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
      const json = fc.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']);
      const thumb = fc.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
      setPages(prev => prev.map((p, i) =>
        i === currentPageIndex ? { ...p, canvasJSON: json, thumbnailDataUrl: thumb } : p
      ));
    } else {
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);
      setPages(prev => prev.map((p, i) => {
        if (i === leftIndex && fabricRefLeft.current) {
          const json  = fabricRefLeft.current.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']);
          const thumb = fabricRefLeft.current.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.3 });
          return { ...p, canvasJSON: json, thumbnailDataUrl: thumb };
        }
        if (i === rightIndex && fabricRef.current) {
          const json  = fabricRef.current.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']);
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

  // ── Feature D: Group / Ungroup ────────────────────────────────────────────────
  function handleGroup() {
    const fc = getActiveCanvas();
    if (!fc) return;
    const objs = fc.getActiveObjects();
    if (objs.length < 2) return;
    const group = new Group(objs.slice(), { interactive: true });
    objs.forEach(o => fc.remove(o));
    fc.discardActiveObject();
    fc.add(group);
    fc.setActiveObject(group);
    fc.renderAll();
    pushUndo();
  }

  function handleUngroup() {
    const fc = getActiveCanvas();
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || active.type !== 'group') return;
    const items = active.getObjects().slice();
    // Apply group transform to each item before removing from group
    active.destroy?.();
    fc.remove(active);
    items.forEach(item => {
      fc.add(item);
    });
    fc.discardActiveObject();
    fc.renderAll();
    pushUndo();
  }

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

  function handleReplaceTemplate(templateIndex) {
    const fc = getActiveCanvas();
    if (!fc) return;
    const template = TEMPLATES[templateIndex];
    if (!template) return;
    applyTemplate(fc, template, dims, brand);
    pushUndo();
    setPages(prev => prev.map((p, i) =>
      i === currentPageIndex ? { ...p, templateName: template.name } : p,
    ));
    setActiveTemplateId(template.id);
  }

  function handleInsertTemplate(templateIndex) {
    saveCurrentPageToState();
    const template = TEMPLATES[templateIndex];
    if (!template) return;
    // Store pending template — consumed by the page-switching effect once the new canvas is ready
    pendingTemplateRef.current = template;
    const newPage = {
      id: genId(),
      pageNumber: pages.length + 1,
      canvasJSON: null,
      thumbnailDataUrl: null,
      name: `Page ${pages.length + 1}`,
      templateName: template.name,
      slot: null,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length); // pages.length = index of the newly appended page
    setActiveTemplateId(template.id);
  }

  // ── Smart Fill ──────────────────────────────────────────────────────────────
  // Called when user selects a listing from SmartFillPanel. Inserts a new page
  // (same pattern as handleInsertTemplate) with the listing data auto-filled.
  function handleSmartFillSelect(listing) {
    setShowSmartFill(false);
    saveCurrentPageToState();

    // Store listing in ref so the page-switch effect can apply it after the
    // new canvas is initialised — same pattern as pendingTemplateRef.
    pendingSmartFillRef.current = listing;

    const typeLabelMap = { venue: 'Venue Feature', planner: 'Planner Spotlight', photographer: 'Photographer Feature', videographer: 'Videographer Feature' };
    const pageName = typeLabelMap[listing.listing_type] || listing.name || 'Smart Fill Page';

    const newPage = {
      id: genId(),
      pageNumber: pages.length + 1,
      canvasJSON: null,
      thumbnailDataUrl: null,
      name: `Page ${pages.length + 1}`,
      templateName: pageName,
      slot: null,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  }

  // ── AI Issue Builder ────────────────────────────────────────────────────────
  // Builds all pages from the AI-generated structure off-screen, then inserts
  // them in one batch. Uses a SINGLE off-screen canvas reused across all pages
  // (same pattern as handleExportDigital) — creating + disposing one canvas per
  // page causes Fabric v7 DOM mutations that corrupt React's node tree.
  async function handleAIBuildIssue(structure, onProgress) {
    if (!structure?.length) return;
    saveCurrentPageToState();

    const dims = PAGE_SIZES['A4'];

    // Create ONE off-screen canvas at reference dimensions, reuse for all pages
    const offscreenEl = document.createElement('canvas');
    offscreenEl.width  = TEMPLATE_REF_W;
    offscreenEl.height = TEMPLATE_REF_H;
    const fc = new Canvas(offscreenEl, {
      width: TEMPLATE_REF_W,
      height: TEMPLATE_REF_H,
      enableRetinaScaling: false,
    });

    const newPages = [];
    try {
      for (let i = 0; i < structure.length; i++) {
        if (onProgress) onProgress(i + 1);

        const pageSpec = structure[i];
        const template = TEMPLATES.find(t => t.id === pageSpec.template_id);
        if (!template) continue;

        // applyTemplate calls fc.clear() internally — safe to reuse canvas
        applyTemplate(fc, template, dims, brand);

        // ── Text injection ───────────────────────────────────────────────────
        // Heuristic: identify text slots by fontSize + charSpacing + fontFamily.
        const textObjs = fc.getObjects().filter(o => o.type === 'textbox');
        textObjs.sort((a, b) => a.top - b.top);

        // Kicker: small (≤14px), high charSpacing, or already ALL-CAPS placeholder
        const kickerObj = textObjs.find(o =>
          o.fontSize <= 14 && (o.charSpacing > 150 || (o.text || '').toUpperCase() === (o.text || ''))
        );

        // Headline: largest fontSize
        const headlineObj = textObjs.reduce((max, o) =>
          (!max || o.fontSize > max.fontSize) ? o : max, null);

        // Body: medium (12-22px), italic or Cormorant font, different from headline/kicker
        const bodyObj = textObjs.find(o =>
          o !== headlineObj &&
          o !== kickerObj &&
          o.fontSize >= 12 && o.fontSize <= 22 &&
          ((o.fontStyle === 'italic') || (o.fontFamily || '').toLowerCase().includes('cormorant'))
        );

        // Byline: small (≤13px), near bottom, not kicker/headline/body
        const bylineObj = [...textObjs].sort((a, b) => b.top - a.top).find(o =>
          o !== headlineObj && o !== kickerObj && o !== bodyObj && o.fontSize <= 13
        );

        if (pageSpec.kicker   && kickerObj)   kickerObj.set('text',   pageSpec.kicker.toUpperCase());
        if (pageSpec.headline && headlineObj) headlineObj.set('text', pageSpec.headline.replace(/\\n/g, '\n'));
        if (pageSpec.body     && bodyObj)     bodyObj.set('text',     pageSpec.body);
        if (pageSpec.byline   && bylineObj)   bylineObj.set('text',   pageSpec.byline);

        fc.renderAll();
        await new Promise(r => setTimeout(r, 80)); // font settle
        fc.renderAll();

        const canvasJSON = fc.toJSON(['id']);

        const pageNumber = pages.length + newPages.length + 1;
        newPages.push({
          id: genId(),
          pageNumber,
          canvasJSON,
          thumbnailDataUrl: null,
          name: `Page ${pageNumber}`,
          templateName: pageSpec.page_label || template.name || template.id,
          slot: null,
        });
      }
    } finally {
      // Always dispose — exactly once, after all pages are done
      fc.dispose();
    }

    if (newPages.length === 0) return;

    // Batch insert + renumber everything
    const firstNewIndex = pages.length;
    setPages(prev => {
      const combined = [...prev, ...newPages];
      return combined.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Page ${idx + 1}` }));
    });

    // Navigate to first newly-inserted page after state settles
    // Panel stays open — user sees success state and can build more or close manually
    setTimeout(() => setCurrentPageIndex(firstNewIndex), 120);
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
  // ── Background removal ──────────────────────────────────────────────────────
  async function handleRemoveBg() {
    const fc = getActiveCanvas();
    const obj = fc?.getActiveObject();
    if (!obj || obj.type !== 'image') return;

    setRemovingBg(true);
    try {
      const { supabase: sb } = await import('./../../lib/supabaseClient');
      // Get the image src
      const src = obj.getSrc?.() || obj._element?.src;
      if (!src) throw new Error('No image source');

      const { data, error } = await sb.functions.invoke('remove-background', {
        body: { image_url: src },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || 'No result URL');

      // Replace image src with the background-removed version
      const { FabricImage } = await import('fabric');
      const newImg = await FabricImage.fromURL(data.url, { crossOrigin: 'anonymous' });
      newImg.set({ left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle });
      newImg.id = obj.id;
      fc.remove(obj);
      fc.add(newImg);
      fc.setActiveObject(newImg);
      fc.renderAll();
      pushUndo(fc.toJSON(['id']));
    } catch (e) {
      alert('Background removal failed: ' + e.message + '\n\nDeploy the remove-background edge function and add REMOVE_BG_API_KEY to Supabase secrets.');
    } finally {
      setRemovingBg(false);
    }
  }

  // ── Page background colour ──────────────────────────────────────────────────
  function handlePageBgChange(colour) {
    setPageBg(colour);
    const fc = getActiveCanvas();
    if (fc) { fc.backgroundColor = colour; fc.renderAll(); }
    // Also update the left canvas in spread view
    if (fabricRefLeft.current) { fabricRefLeft.current.backgroundColor = colour; fabricRefLeft.current.renderAll(); }
  }

  const handleSave = useCallback(async () => {
    if (!issue?.id) return;
    setSaving(true);
    try {
      // Build a fresh snapshot: read live canvas JSON for currently-open page(s),
      // use cached canvasJSON for all other pages (they haven't changed).
      const { leftIndex, rightIndex } = getSpreadIndices(currentPageIndex, pages.length);
      const freshPages = pages.map((page, i) => {
        if (!spreadView && i === currentPageIndex && fabricRef.current) {
          return { ...page, canvasJSON: fabricRef.current.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']) };
        }
        if (spreadView && i === leftIndex && fabricRefLeft.current) {
          return { ...page, canvasJSON: fabricRefLeft.current.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']) };
        }
        if (spreadView && i === rightIndex && fabricRef.current) {
          return { ...page, canvasJSON: fabricRef.current.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder', 'isPlaceholderMarker']) };
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
          template_data: { engine: 'designer-v1', canvasJSON: page.canvasJSON ?? null, slot: page.slot ?? null },
          updated_at:  savedAt.toISOString(),
        }))
      );
      if (error) throw error;

      // Sync local state so further edits start from the saved snapshot
      setPages(freshPages);
      setLastSaved(savedAt);
      setIsDirty(false); // clear unsaved-changes flag
    } catch (e) {
      console.error('Save failed:', e);
      const msg = e.message || String(e);
      const friendly = msg.includes('JWT') || msg.includes('auth')
        ? 'Save failed: session expired — please refresh and sign in again.'
        : msg.includes('network') || msg.includes('fetch')
        ? 'Save failed: network error — check your connection and try again.'
        : `Save failed: ${msg}`;
      alert(friendly);
    } finally {
      setSaving(false);
    }
  }, [issue, pages, spreadView, currentPageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Digital Export ──────────────────────────────────────────────────────────
  // Uploads all page + thumb images via the `upload-magazine-page` edge
  // function (server-side, service-role). Fails fast on the first upload
  // error — no silent retries, no partial-publish corruption.
  const handleExportDigital = useCallback(async () => {
    if (!issue?.id) return;
    setExportingDigital(true);
    setPublishProgress({ current: 0, total: pages.length });
    console.log('[publish] starting for issue', issue.id, 'pages:', pages.length);
    try {
      // ── Auth-context diagnostic ────────────────────────────────────────────
      // Log who is attempting the publish. If they're anon / unauthenticated
      // the edge function will reject with 401 — this line makes that obvious
      // in the console instead of requiring a Network-tab deep dive.
      try {
        const { supabase: sb } = await import('./../../lib/supabaseClient');
        const { data: sess } = await sb.auth.getSession();
        const u = sess?.session?.user;
        console.log('[publish] auth-context →', {
          authenticated: !!u,
          userId:        u?.id ?? null,
          email:         u?.email ?? null,
          role:          u?.role ?? (u ? 'authenticated' : 'anon'),
          hasToken:      !!sess?.session?.access_token,
        });
        if (!u) {
          throw new Error('You are not signed in. Please sign in with an admin account before publishing.');
        }
      } catch (authLogErr) {
        // Re-throw signed-out error; other errors are non-fatal diagnostics
        if (String(authLogErr.message || '').includes('not signed in')) throw authLogErr;
        console.warn('[publish] auth-context log failed:', authLogErr);
      }

      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 150));

      // ── Optimistic lock ──────────────────────────────────────────────────────
      // Record the current render_version before we start. At the end we do a
      // conditional DB update (WHERE render_version = expectedVersion) to detect
      // if another tab published between when we started and when we finish.
      const expectedVersion = issue.render_version || 1;
      const renderVersion = expectedVersion + 1;

      // Re-import supabase client for the conditional update at the end.
      const { supabase: sbClient } = await import('./../../lib/supabaseClient');

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

      // Capture page 1's public URL so we can auto-populate issue.cover_image
      // after the loop if the user hasn't uploaded a manual cover.
      let firstPagePublicUrl = null;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNumber = i + 1;
        setPublishProgress({ current: i, total: pages.length });
        console.log(`[publish] page ${pageNumber}/${pages.length}: rendering`);

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

        // Export at 3× for retina-crisp display on large/HiDPI displays.
        // A4 canvas is 794×1123 at multiplier 1.
        // 2× (1588×2246) softens on 27"+ panels; 3× → 2382×3369 stays sharp
        // even on 5K/6K iMac and Studio Display at full height.
        // Thumb stays at 0.35 (≈278×393) — fine for TOC/pages-panel.
        const pageBlob  = await canvasToJpegBlob(offscreen, 3);
        const thumbBlob = await canvasToJpegBlob(offscreen, 0.35);

        // ── Fail-fast uploads ────────────────────────────────────────────────
        // uploadPageImage/uploadThumbImage now return {error} on failure
        // instead of throwing. We check explicitly and abort the entire
        // publish on the first failure — no silent retries, no broken pages
        // in the DB.
        const pageRes  = await uploadPageImage(issue.id, renderVersion, pageNumber, pageBlob);
        if (pageRes.error) {
          offscreen.dispose();
          throw new Error(`Page ${pageNumber} upload failed — aborting publish.\n\n${pageRes.error.message || pageRes.error}`);
        }
        if (pageNumber === 1) firstPagePublicUrl = pageRes.publicUrl;
        const thumbRes = await uploadThumbImage(issue.id, renderVersion, pageNumber, thumbBlob);
        if (thumbRes.error) {
          offscreen.dispose();
          throw new Error(`Thumb ${pageNumber} upload failed — aborting publish.\n\n${thumbRes.error.message || thumbRes.error}`);
        }

        const dbRes = await upsertPage({
          issue_id: issue.id,
          page_number: pageNumber,
          source_type: 'template',
          image_url: pageRes.publicUrl,
          image_storage_path: pageRes.storagePath,
          thumbnail_url: thumbRes.publicUrl,
          thumbnail_storage_path: thumbRes.storagePath,
          render_version: renderVersion,
          template_data: { engine: 'designer-v1', canvasJSON: page.canvasJSON },
        });
        if (dbRes?.error) {
          offscreen.dispose();
          throw new Error(`Page ${pageNumber} DB row write failed.\n\n${dbRes.error.message || dbRes.error}`);
        }
        console.log(`[publish] page ${pageNumber} uploaded + DB row written`);
      }

      // Clean up off-screen canvas
      offscreen.dispose();
      setPublishProgress({ current: pages.length, total: pages.length });

      // Auto-populate issue cover from page 1 if no cover was uploaded manually.
      if (!issue.cover_image && firstPagePublicUrl) {
        try {
          await updateIssue(issue.id, { cover_image: firstPagePublicUrl });
          console.log('[publish] auto-set cover_image from page 1');
        } catch (coverErr) {
          console.warn('[publish] cover auto-set failed (pages still published):', coverErr);
        }
      }

      // ── Optimistic lock: conditional update ─────────────────────────────────
      // Only commits if render_version in DB still equals expectedVersion.
      // If another tab republished while this loop was running, rows-returned = 0
      // and we abort with an error — pages are already uploaded but the issue
      // metadata stays at the previous render_version, preventing version skew.
      const publishPatch = {
        render_version:   renderVersion,
        page_count:       pages.length,
        processing_state: 'ready',
        status:           'published',
        published_at:     new Date().toISOString(),
        ...(issue.cover_image ? {} : firstPagePublicUrl ? { cover_image: firstPagePublicUrl } : {}),
        // Always update og_image_url so social previews reflect the latest cover page
        ...(firstPagePublicUrl ? { og_image_url: firstPagePublicUrl } : {}),
      };
      const { data: lockData, error: lockErr } = await sbClient
        .from('magazine_issues')
        .update(publishPatch)
        .eq('id', issue.id)
        .eq('render_version', expectedVersion)
        .select('id');

      if (lockErr) {
        throw new Error(`Failed to save publish state: ${lockErr.message}`);
      }
      if (!lockData?.length) {
        throw new Error(
          'Publish conflict — this issue was republished in another tab or session while yours was running. ' +
          'Refresh and try again. Your pages have been uploaded but will appear on the next successful publish.'
        );
      }

      onIssueUpdate?.(publishPatch);
      setIsDirty(false); // pages are now published and match DB
      console.log('[publish] done');
      alert(`✓ ${pages.length} page${pages.length !== 1 ? 's' : ''} published to reader`);
    } catch (e) {
      console.error('[publish] fatal:', e);
      const msg = e.message || String(e);
      alert('Publish failed: ' + msg + (msg.includes('conflict') ? '' : '\n\nCheck browser console for details.'));
    } finally {
      setExportingDigital(false);
      setPublishProgress(null);
    }
  }, [issue, pages, dims, saveCurrentPageToState, onIssueUpdate]);

  // ── Print Export ────────────────────────────────────────────────────────────
  const handleExportPrint = useCallback(async () => {
    setExportingPrint(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 150));

      // Use a fresh off-screen Fabric canvas to avoid corrupting the designer view.
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

      const printPages = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        offscreen.clear();
        offscreen.backgroundColor = '#ffffff';
        if (page.canvasJSON) {
          await offscreen.loadFromJSON(page.canvasJSON);
        }
        offscreen.renderAll();
        await new Promise(r => setTimeout(r, 60));
        offscreen.renderAll();
        const blob = await canvasToPrintJpegBlob(offscreen);
        // Pass canvasJSON so generatePrintPDF can embed an invisible text layer
        // (enables PDF search / copy-paste of magazine text)
        printPages.push({ blob, pageSize, canvasJSON: page.canvasJSON ?? null });
      }

      offscreen.dispose();

      const pdf = await generatePrintPDF(printPages, issue?.title || 'Magazine Issue', pageSize);
      downloadPDF(pdf, `${issue?.slug || 'issue'}_PRINT_READY.pdf`);
    } catch (e) {
      alert('Print export failed: ' + e.message);
    } finally {
      setExportingPrint(false);
    }
  }, [issue, pages, pageSize, dims, saveCurrentPageToState]);

  // ── Screen PDF Export ────────────────────────────────────────────────────────
  const handleExportScreen = useCallback(async () => {
    setExportingScreen(true);
    try {
      saveCurrentPageToState();
      await new Promise(r => setTimeout(r, 150));

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

      const screenPages = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        offscreen.clear();
        offscreen.backgroundColor = '#ffffff';
        if (page.canvasJSON) {
          await offscreen.loadFromJSON(page.canvasJSON);
        }
        offscreen.renderAll();
        await new Promise(r => setTimeout(r, 60));
        offscreen.renderAll();
        const blob = await canvasToJpegBlob(offscreen, 2);
        // Pass canvasJSON so generateScreenPDF can embed an invisible text layer
        // (enables PDF search / copy-paste of magazine text)
        screenPages.push({ blob, pageSize, canvasJSON: page.canvasJSON ?? null });
      }

      offscreen.dispose();

      const pdf = await generateScreenPDF(screenPages, issue?.title || 'Magazine Issue', pageSize);
      downloadPDF(pdf, `${issue?.slug || 'issue'}_digital.pdf`);
    } catch (e) {
      alert('Screen PDF export failed: ' + e.message);
    } finally {
      setExportingScreen(false);
    }
  }, [issue, pages, pageSize, dims, saveCurrentPageToState]);

  // ── Page management ─────────────────────────────────────────────────────────
  function handleSelectPage(i) {
    saveCurrentPageToState();
    // Auto-save to DB when switching pages so edits aren't lost if the tab is
    // closed before the user clicks Save. Non-blocking — runs in background.
    if (isDirty) {
      handleSave().catch(e => console.warn('[auto-save on page switch]', e));
    }
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
      slot: null,
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

  // ── Page Slot ───────────────────────────────────────────────────────────────
  function handleSlotSave(slotData) {
    setPages(prev => prev.map((p, i) =>
      i === currentPageIndex ? { ...p, slot: slotData } : p,
    ));
    setShowSlotPanel(false);
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
        onBack={onBack}
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
        onSpreadPreview={() => {
          saveCurrentPageToState();
          setShowSpreadPreview(true);
        }}
        onSave={handleSave}
        saving={saving}
        lastSaved={lastSaved}
        onExportDigital={handleExportDigital}
        exportingDigital={exportingDigital}
        publishProgress={publishProgress}
        isDirty={isDirty}
        onExportScreen={handleExportScreen}
        exportingScreen={exportingScreen}
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
        onBrandKit={() => setShowBrandKit(true)}
        brandPrimaryColor={brand?.primary_color || null}
        onSmartFill={() => setShowSmartFill(true)}
        onAIBuild={() => setShowAIBuilder(true)}
        onVoice={() => setShowVoicePanel(true)}
        onSlot={() => setShowSlotPanel(true)}
        currentSlot={pages[currentPageIndex]?.slot ?? null}
        pageBg={pageBg}
        onPageBgChange={handlePageBgChange}
      />

      {/* Spread preview modal */}
      {showSpreadPreview && (
        <SpreadPreviewModal
          pages={pages}
          dims={dims}
          startPageIndex={currentPageIndex}
          onClose={() => setShowSpreadPreview(false)}
        />
      )}

      {/* Brand kit panel overlay */}
      {showBrandKit && (
        <BrandKitPanel
          onClose={() => {
            setShowBrandKit(false);
            fetchBrandKit().then(({ data }) => { if (data) setBrand(data); });
          }}
        />
      )}

      {/* Smart Fill panel overlay */}
      {showSmartFill && (
        <SmartFillPanel
          onSelect={handleSmartFillSelect}
          onClose={() => setShowSmartFill(false)}
        />
      )}

      {/* AI Issue Builder overlay */}
      {showAIBuilder && (
        <AIIssueBuilderPanel
          onBuild={handleAIBuildIssue}
          onClose={() => setShowAIBuilder(false)}
        />
      )}

      {/* Voice Training panel overlay */}
      {showVoicePanel && (
        <StudioVoicePanel onClose={() => setShowVoicePanel(false)} />
      )}

      {/* Page Slot panel overlay */}
      {showSlotPanel && (
        <PageSlotPanel
          slot={pages[currentPageIndex]?.slot ?? null}
          onSave={handleSlotSave}
          onClose={() => setShowSlotPanel(false)}
          issueName={issue?.title || issue?.slug || 'our next issue'}
          pageName={pages[currentPageIndex]?.templateName || pages[currentPageIndex]?.name || null}
          canvasJSON={pages[currentPageIndex]?.canvasJSON ?? null}
          issueId={issue?.id ?? null}
          pageNum={pages[currentPageIndex]?.pageNumber ?? (currentPageIndex + 1)}
        />
      )}

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
        <div style={{ position: 'relative', zIndex: lightsOff ? 0 : 'auto', flexShrink: 0, display: 'flex', minHeight: 0 }}>
        <ElementsPanel
          onAddElement={handleAddElement}
          onAddImage={addImage}
          onInsertTemplate={handleInsertTemplate}
          onReplaceTemplate={handleReplaceTemplate}
          activeTemplateId={activeTemplateId}
          issue={issue}
          layers={layers}
          onSelectLayer={handleSelectLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
          onReorderLayer={handleReorderLayer}
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
          pageSize={pageSize}
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
                      filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.6)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
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

                      <div
                        ref={canvasContainerRefLeft}
                        style={{ position: 'relative', width: dims.w, height: dims.h }}
                      >
                        {/* Fabric-isolated canvas host — empty div, canvas appended imperatively.
                            React never reconciles children here, so Fabric v7 cannot conflict. */}
                        <div ref={leftCanvasHostCallbackRef} style={{ position: 'absolute', top: 0, left: 0 }} />

                        {/* Overlays — React-managed siblings, safe to add/remove */}
                        {/* Cover page overlay — shown when this is the cover (left side is empty) */}
                        {spreadIndices.leftIndex === null && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: '#1E1B17', pointerEvents: 'none',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}>
                            <div style={{
                              fontSize: 11, color: 'rgba(255,255,255,0.12)',
                              fontFamily: "'Jost',sans-serif", letterSpacing: '0.15em',
                              textTransform: 'uppercase',
                            }}>Cover page</div>
                          </div>
                        )}
                        {showGrid && activeSpreadSide === 'left' && spreadIndices.leftIndex !== null && (
                          <GridOverlay width={dims.w} height={dims.h} />
                        )}
                        {showBleed && <BleedOverlay />}
                        {activeSpreadSide === 'left' && spreadIndices.leftIndex !== null && (
                          <GuideLines
                            guides={guides}
                            onMoveGuide={handleMoveGuide}
                          />
                        )}
                      </div>
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

                      <div
                        ref={canvasContainerRef}
                        style={{ position: 'relative', width: dims.w, height: dims.h }}
                      >
                        {/* Fabric-isolated canvas host */}
                        <div ref={rightSpreadCanvasHostCallbackRef} style={{ position: 'absolute', top: 0, left: 0 }} />

                        {/* Overlays */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    ref={canvasContainerRef}
                    style={{
                      position: 'relative',
                      flexShrink: 0,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.4)',
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <div ref={singleCanvasHostCallbackRef} />
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
                  {/* Page label */}
                  <div style={{
                    marginTop: 12,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s ease',
                  }}>
                    {(() => {
                      const p = pages[currentPageIndex];
                      const num = p ? `Page ${p.pageNumber}` : '';
                      const tpl = p?.templateName ? ` · ${p.templateName}` : '';
                      return num + tpl;
                    })()}
                  </div>
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
            selectedObjects={selectedObjects}
            canvas={getActiveCanvas()}
            onUpdate={handlePropertiesUpdate}
            onGroup={handleGroup}
            onUngroup={handleUngroup}
            onRemoveBg={handleRemoveBg}
            removingBg={removingBg}
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

      {/* Image picker modal — triggered by double-click on any placeholder */}
      {imagePickerOpen && (
        <ImagePickerModal
          issue={issue}
          onSelect={handleImagePickerSelect}
          onSelectMultiple={handleImagePickerSelectMultiple}
          onClose={() => {
            setImagePickerOpen(false);
            imagePickerTargetRef.current = null;
          }}
        />
      )}

      {/* Taigenic.ai Studio wordmark — fixed bottom-right */}
      <div style={{
        position: 'fixed', bottom: 14, right: 18,
        zIndex: 50,
        pointerEvents: 'none',
        lineHeight: 1,
        textAlign: 'right',
        userSelect: 'none',
      }}>
        <div style={{ fontFamily: "'Jost', 'Nunito Sans', sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(201,169,110,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          Taigenic.ai
        </div>
        <div style={{ fontFamily: "'Jost', 'Nunito Sans', sans-serif", fontSize: 7, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
          Studio
        </div>
      </div>
    </div>
  );
}
