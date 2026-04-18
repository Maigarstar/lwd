// ════════════════════════════════════════════════════════════════════════════
// RunaroundTextbox — text wrap around images and shapes
// ════════════════════════════════════════════════════════════════════════════
//
// Subclasses Fabric Textbox to support InDesign-style text runaround:
// text automatically wraps around a designated obstacle object (an image,
// rect, circle or any Fabric object) placed on the same canvas.
//
// How it works
// ─────────────
// Fabric's _wrapText() calls _wrapLine() for each paragraph line with a
// single `desiredWidth`. We override _wrapText() to:
//   1. Resolve the obstacle's bounding rect in the textbox's local frame
//   2. For every original paragraph, estimate which wrapped visual lines
//      will fall in the obstacle's Y range (using fontSize × lineHeight)
//   3. For those lines, pass a narrowed desiredWidth AND a left-indent via
//      an internal per-line table (`_runaroundLineData`)
//   4. Override _getLineLeftOffset() to apply the left indent for lines
//      that sit beside a left-positioned obstacle
//
// Usage
// ─────
// 1. Import and register once (done at module load — see bottom of file)
// 2. Instantiate instead of a regular Textbox:
//      const tb = new RunaroundTextbox('Article text…', { left, top, width, height });
// 3. Set runaroundTargetId to the obstacle's `.id` custom property:
//      tb.runaroundTargetId = obstacleImage.id;
// 4. When the obstacle moves, call tb.initDimensions() to re-flow.
//
// Limitations (v1)
// ─────────────────
// • One obstacle per textbox. Multiple obstacles require separate frames.
// • Obstacle and textbox must not be rotated (rotation support is NYI).
// • Only rectangular exclusion zones are supported. The obstacle's
//   bounding rect (axis-aligned) is used as the exclusion region.
// • Very large font sizes relative to the obstacle height may produce
//   approximate results (inherent to the one-pass layout algorithm).
// ════════════════════════════════════════════════════════════════════════════

import { Textbox, classRegistry } from 'fabric';

const RUNAROUND_TYPE = 'runaround-textbox';
const DEFAULT_GAP    = 12; // px gap between text and obstacle edge

export class RunaroundTextbox extends Textbox {
  static type = RUNAROUND_TYPE;

  constructor(text, options = {}) {
    super(text, options);
    /** @type {string|null} — the `.id` of the obstacle Fabric object */
    this.runaroundTargetId = options.runaroundTargetId || null;
    /** @type {number} — px gap between text and obstacle edge */
    this.runaroundGap      = options.runaroundGap      ?? DEFAULT_GAP;

    // Internal table built by _wrapText, consumed by _getLineLeftOffset.
    // Index = visual line index. Value: { indent: number, width: number }
    this._runaroundLineData = {};
  }

  // ── Resolve the obstacle from the canvas ─────────────────────────────────

  /**
   * Returns the obstacle Fabric object (or null if not found).
   * @returns {FabricObject|null}
   */
  get runaroundObj() {
    if (!this.runaroundTargetId || !this.canvas) return null;
    return (
      this.canvas.getObjects().find(o => o.id === this.runaroundTargetId) || null
    );
  }

  // ── Core layout override ──────────────────────────────────────────────────

  /**
   * Override _wrapText to inject per-line width narrowing and left indents
   * for lines that overlap the obstacle's Y range.
   *
   * @param {string[]} lines       — array of paragraph strings (hard newlines)
   * @param {number}   desiredWidth — full textbox width
   * @returns {string[][]}          — visual lines (same contract as Textbox)
   */
  _wrapText(lines, desiredWidth) {
    const obs = this.runaroundObj;

    // ── No obstacle: behave exactly like a regular Textbox ────────────────
    if (!obs) {
      this._runaroundLineData = {};
      return super._wrapText(lines, desiredWidth);
    }

    // ── Compute obstacle bounds in this textbox's local coord system ──────
    //
    // Fabric object positions are in canvas (absolute) space.
    // The textbox's top-left is at (this.left, this.top).
    // We deliberately ignore rotation for v1 simplicity.
    const obsBounds = obs.getBoundingRect(true); // useCache=true for perf
    const myLeft    = this.left  || 0;
    const myTop     = this.top   || 0;
    const gap       = this.runaroundGap;

    // Obstacle extents in textbox-local coords
    const obsLocalTop    = obsBounds.top    - myTop;
    const obsLocalBottom = obsLocalTop      + obsBounds.height;
    const obsLocalLeft   = obsBounds.left   - myLeft;
    const obsLocalRight  = obsLocalLeft     + obsBounds.width;

    // Determine side: obstacle on the left or the right of the textbox midpoint?
    const midX       = desiredWidth / 2;
    const obsMidX    = (obsLocalLeft + obsLocalRight) / 2;
    const obsOnLeft  = obsMidX < midX;

    // ── Build pre-layout data (word widths) once ──────────────────────────
    this.isWrapping = true;
    const data      = this.getGraphemeDataForRender(lines);
    this.isWrapping = false;

    // ── Approximate line height for Y estimation ──────────────────────────
    // We use the textbox's fontSize × lineHeight as the per-visual-line height
    // estimate. This is accurate for single-font bodies; headings with mixed
    // sizes may show a 1-line offset in edge cases.
    const approxLineH = (this.fontSize || 16) * (this.lineHeight || 1.3);

    // ── Two-pass wrap ─────────────────────────────────────────────────────
    // Pass 1: wrap with full width to count visual lines and estimate Y positions.
    // Pass 2: for lines in the obstacle zone, re-wrap with narrowed width.
    //
    // This two-pass approach introduces a slight approximation for the
    // obstacle zone (because narrowing increases line count there), but
    // converges correctly for the common case of one horizontal obstacle band.

    this.isWrapping = true;

    // Pass 1 — full-width wrap to get approximate visual line Y positions
    const pass1 = [];
    for (let i = 0; i < data.wordsData.length; i++) {
      pass1.push(...this._wrapLine(i, desiredWidth, data));
    }

    // Build Y-center array for each visual line in pass 1
    const lineYCenters = [];
    let y = approxLineH / 2;
    for (let k = 0; k < pass1.length; k++) {
      lineYCenters.push(y);
      y += approxLineH;
    }

    // Determine which original paragraph lines (wordsData indices) fall in
    // the obstacle zone by mapping pass1 line indices back to paragraph lines.
    // We keep a running count of how many pass1 lines each paragraph produced.
    let pass1LineIdx = 0;
    const paraToPass1Start = new Array(data.wordsData.length).fill(0);
    const paraToPass1Count = new Array(data.wordsData.length).fill(0);

    // Re-run the wrap just to count how many visual lines each paragraph made
    // (we can't derive this from pass1 directly, so re-compute quickly)
    const pass1Counts = data.wordsData.map((_, i) => {
      const wrappedLines = this._wrapLine(i, desiredWidth, data);
      const count        = wrappedLines.length;
      paraToPass1Start[i] = pass1LineIdx;
      paraToPass1Count[i] = count;
      pass1LineIdx        += count;
      return count;
    });

    // ── Pass 2 — re-wrap with per-line narrowing ──────────────────────────
    this._runaroundLineData = {};
    const wrapped   = [];
    let visualIdx   = 0;  // running index into the final visual lines array

    for (let i = 0; i < data.wordsData.length; i++) {
      const p1Start = paraToPass1Start[i];
      const p1Count = paraToPass1Count[i];

      // Check if any pass1 visual line for this paragraph overlaps the obstacle
      let paraOverlaps = false;
      for (let k = p1Start; k < p1Start + p1Count; k++) {
        const lineY = lineYCenters[k] ?? y;
        if (lineY + approxLineH / 2 > obsLocalTop &&
            lineY - approxLineH / 2 < obsLocalBottom) {
          paraOverlaps = true;
          break;
        }
      }

      if (!paraOverlaps) {
        // Full-width paragraph — use as-is from pass 1
        const fullLines = this._wrapLine(i, desiredWidth, data);
        fullLines.forEach((_, k) => {
          this._runaroundLineData[visualIdx + k] = { indent: 0, maxWidth: desiredWidth };
        });
        wrapped.push(...fullLines);
        visualIdx += fullLines.length;
        continue;
      }

      // ── Paragraph crosses the obstacle zone — wrap line-by-line ─────────
      // Strategy: for each visual line we produce, check its estimated Y
      // against the obstacle zone and use the appropriate narrow width.
      //
      // We do this by wrapping the paragraph word-by-word, placing words
      // on a line until the current effective width is exceeded, then starting
      // a new line and re-evaluating the effective width for the new Y.

      const splitByGrapheme = this.splitByGrapheme;
      const infix            = splitByGrapheme ? '' : ' ';
      const allWords         = data.wordsData[i];  // [{word, width}]
      const additionalSpace  = this._getWidthOfCharSpacing();

      let currentLine   = [];
      let lineWidth     = 0;
      let lineJustStarted = true;
      let wordOffset    = 0;
      let infixWidth    = 0;
      let currentY      = (paraToPass1Start[i] === 0)
        ? approxLineH / 2
        : lineYCenters[paraToPass1Start[i]] ?? approxLineH / 2;

      // Compute effective width and indent for a given Y
      const getEffective = (yCenter) => {
        const inZone = yCenter + approxLineH / 2 > obsLocalTop &&
                       yCenter - approxLineH / 2 < obsLocalBottom;
        if (!inZone) return { width: desiredWidth, indent: 0 };

        if (obsOnLeft) {
          // Obstacle on LEFT: indent text to start after obstacle right edge
          const indent    = Math.max(0, obsLocalRight + gap);
          const available = Math.max(desiredWidth - indent, 1);
          return { width: available, indent };
        } else {
          // Obstacle on RIGHT: reduce max width to stop before obstacle left edge
          const available = Math.max(obsLocalLeft - gap, 1);
          return { width: available, indent: 0 };
        }
      };

      let { width: effectiveW, indent: effectiveIndent } = getEffective(currentY);
      const maxWidthForLine = () => Math.max(effectiveW, data.largestWordWidth, this.dynamicMinWidth);

      const flushLine = () => {
        if (currentLine.length === 0 && !lineJustStarted) return;
        this._runaroundLineData[visualIdx] = {
          indent:   effectiveIndent,
          maxWidth: effectiveW,
        };
        wrapped.push([...currentLine]);
        visualIdx++;
        currentLine      = [];
        lineWidth        = 0;
        lineJustStarted  = true;
        infixWidth       = 0;
        // Advance Y estimate for the next line
        currentY        += approxLineH;
        const eff        = getEffective(currentY);
        effectiveW       = eff.width;
        effectiveIndent  = eff.indent;
      };

      for (let j = 0; j < allWords.length; j++) {
        const { word, width: wordWidth } = allWords[j];
        wordOffset += word.length;

        lineWidth += infixWidth + wordWidth - additionalSpace;

        if (lineWidth > maxWidthForLine() && !lineJustStarted) {
          flushLine();
          lineWidth = wordWidth;
        } else {
          lineWidth += additionalSpace;
        }

        if (!lineJustStarted && !splitByGrapheme) {
          currentLine.push(infix);
        }
        currentLine = currentLine.concat(word);

        infixWidth       = splitByGrapheme
          ? 0
          : this._measureWord([infix], i, wordOffset);
        wordOffset++;
        lineJustStarted  = false;
      }

      // Push final line
      if (currentLine.length > 0) {
        this._runaroundLineData[visualIdx] = {
          indent:   effectiveIndent,
          maxWidth: effectiveW,
        };
        wrapped.push(currentLine);
        visualIdx++;
      }
    }

    this.isWrapping = false;
    return wrapped;
  }

  // ── Rendering: apply per-line left indent ─────────────────────────────────

  /**
   * Override to shift lines rightward for left-side runaround.
   * All other alignment modes are preserved (right-align, centre, justify).
   *
   * @param {number} lineIndex
   * @returns {number}
   */
  _getLineLeftOffset(lineIndex) {
    const base   = super._getLineLeftOffset(lineIndex);
    const ld     = this._runaroundLineData?.[lineIndex];
    return base + (ld?.indent || 0);
  }

  // ── Serialisation ─────────────────────────────────────────────────────────

  toObject(propertiesToInclude = []) {
    return super.toObject([
      'runaroundTargetId',
      'runaroundGap',
      ...propertiesToInclude,
    ]);
  }

  static fromObject(object) {
    return new RunaroundTextbox(object.text, object);
  }
}

// Register so Fabric's loadFromJSON can reconstruct this type
classRegistry.setClass(RunaroundTextbox, RUNAROUND_TYPE);
