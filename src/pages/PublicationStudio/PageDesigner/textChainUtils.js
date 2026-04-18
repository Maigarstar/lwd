// ════════════════════════════════════════════════════════════════════════════
// textChainUtils — Linked text frame engine
// ════════════════════════════════════════════════════════════════════════════
//
// Allows text to overflow automatically from one Fabric Textbox (frame A)
// into another (frame B) — identical to InDesign's "text frame chains".
//
// Data model (custom props stored on each Fabric Textbox):
//   chainId         — string UUID, same for every frame in the chain
//   chainOrder      — 0-based integer; determines flow sequence
//   chainFullText   — the complete master text (duplicated on every frame
//                     so it survives Fabric JSON serialisation / reload)
//   chainWordStart  — index of first word in master text that this frame owns
//   chainWordEnd    — index AFTER last word this frame owns (exclusive)
//   chainHasOverflow— true if text continues past this frame
//
// Public API:
//   distributeChainText(frames, fullText)  — fill frames sequentially
//   reconstructMasterText(frames)          — join all visible texts
//   getChainFrames(canvas, chainId)        — sorted frames on a canvas
//   linkFrames(frameA, frameB, canvas)     — create / extend a chain
//   unlinkFrame(frame, canvas)             — remove frame from chain
//
// Measurement strategy
// --------------------
// Fabric Textbox.initDimensions() (v7, line 83 in Textbox.mjs) contains:
//   this.height = this.calcTextHeight();
// We exploit this to measure text height but ALWAYS restore the original box
// height afterwards so the user's carefully sized frame is never disturbed.
// ════════════════════════════════════════════════════════════════════════════

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Text measurement ─────────────────────────────────────────────────────────

/**
 * Temporarily set `candidateText` on `frame`, call initDimensions() to
 * measure how tall the text would be, then restore the original box height.
 *
 * @param  {FabricTextbox} frame
 * @param  {string}        candidateText
 * @returns {number}  pixel height the text occupies at the frame's current width
 */
function measureTextHeight(frame, candidateText) {
  const savedHeight = frame.height;
  frame.set('text', candidateText);
  frame.initDimensions();          // ← sets frame.height = calcTextHeight()
  const textH = frame.height;      // capture the result
  frame.height = savedHeight;      // restore box height
  return textH;
}

/**
 * Binary-search for the longest prefix of `text` (word-boundary aligned)
 * that fits inside `frame`'s box height.
 *
 * Returns the substring that fits; may be '' if even one word overflows.
 * Does NOT leave `frame.text` or `frame.height` permanently changed.
 *
 * @param  {FabricTextbox} frame
 * @param  {string}        text
 * @returns {string}
 */
function measureWordsToFit(frame, text) {
  if (!text) return '';

  const boxH = frame.height;

  // Fast path: everything fits
  if (measureTextHeight(frame, text) <= boxH) {
    frame.height = boxH; // restore (measureTextHeight already does this, but be explicit)
    return text;
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  // Binary search: find the largest `lo` where words[0..lo-1] fits
  let lo = 0;
  let hi = words.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measureTextHeight(frame, words.slice(0, mid).join(' ')) <= boxH) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  frame.height = boxH; // final safety restore
  return lo === 0 ? '' : words.slice(0, lo).join(' ');
}

// ── Core distribution ────────────────────────────────────────────────────────

/**
 * Distribute `fullText` sequentially across `frames` (sorted by chainOrder).
 *
 * Each frame receives as many words as fit inside its box; the remainder
 * flows into the next frame. The last frame always gets all remaining text
 * (Fabric will clip anything that overflows the visible box).
 *
 * Side effects on each frame:
 *   • frame.text          updated with its slice
 *   • frame.chainFullText set to fullText (persistence across save/load)
 *   • frame.chainWordStart / chainWordEnd set for later reconstruction
 *   • frame.chainHasOverflow set if text continues past this frame
 *   • frame.height is PRESERVED (initDimensions reset is undone)
 *
 * @param {FabricTextbox[]} frames    — sorted array (chainOrder asc)
 * @param {string}          fullText  — complete master text
 */
export function distributeChainText(frames, fullText) {
  if (!frames || frames.length === 0) return;

  const allWords  = fullText.split(/\s+/).filter(Boolean);
  let   wordOff   = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame  = frames[i];
    const isLast = i === frames.length - 1;
    const savedH = frame.height;

    const remainingWords = allWords.slice(wordOff);
    const remainingText  = remainingWords.join(' ');

    let placed;
    if (isLast) {
      // Last frame absorbs everything
      placed = remainingWords.length;
      frame.set('text', remainingText || '');
    } else {
      const fitsText = measureWordsToFit(frame, remainingText);
      placed = fitsText ? fitsText.split(/\s+/).filter(Boolean).length : 0;
      frame.set('text', fitsText || '');
    }

    frame.chainWordStart   = wordOff;
    frame.chainWordEnd     = wordOff + placed;
    frame.chainFullText    = fullText;
    frame.chainHasOverflow = !isLast && wordOff + placed < allWords.length;

    // Run layout recalculation then restore box height
    frame.initDimensions();
    frame.height = savedH;

    wordOff += placed;
  }
}

/**
 * Reconstruct the full master text by joining each frame's current visible
 * text in chain order.  Use this when the user finishes editing a frame to
 * derive the updated master text before redistribution.
 *
 * @param  {FabricTextbox[]} frames
 * @returns {string}
 */
export function reconstructMasterText(frames) {
  return frames
    .map(f => (f.text || '').trim())
    .filter(Boolean)
    .join(' ');
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

/**
 * Return all Fabric objects on `canvas` that belong to `chainId`,
 * sorted ascending by chainOrder.
 *
 * @param  {FabricCanvas} canvas
 * @param  {string}       chainId
 * @returns {FabricTextbox[]}
 */
export function getChainFrames(canvas, chainId) {
  if (!canvas || !chainId) return [];
  return canvas
    .getObjects()
    .filter(o => o.chainId === chainId && o.type === 'textbox')
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));
}

/**
 * Return all frames in a chain across both canvases (for spread view).
 * Searches both leftCanvas and rightCanvas for frames with the given chainId.
 *
 * @param  {FabricCanvas} leftCanvas
 * @param  {FabricCanvas} rightCanvas
 * @param  {string}       chainId
 * @returns {FabricTextbox[]}
 */
export function getChainFramesAcrossCanvases(leftCanvas, rightCanvas, chainId) {
  if (!chainId) return [];
  const leftFrames = leftCanvas
    ? leftCanvas.getObjects()
        .filter(o => o.chainId === chainId && o.type === 'textbox')
    : [];
  const rightFrames = rightCanvas
    ? rightCanvas.getObjects()
        .filter(o => o.chainId === chainId && o.type === 'textbox')
    : [];
  const allFrames = [...leftFrames, ...rightFrames];
  allFrames.sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));
  return allFrames;
}

// ── Link / Unlink ─────────────────────────────────────────────────────────────

/**
 * Link `frameB` after `frameA` in a chain.
 *
 * • If `frameA` already belongs to a chain, `frameB` is appended to the end
 *   of that chain (even if `frameA` is not the last frame in it).
 * • If `frameA` has no chain, a new chain is created with frameA → frameB.
 * • After linking, the combined master text is redistributed.
 *
 * @param {FabricTextbox} frameA
 * @param {FabricTextbox} frameB
 * @param {FabricCanvas}  canvas
 */
export function linkFrames(frameA, frameB, canvas) {
  if (!frameA || !frameB || frameA === frameB) return;

  // Resolve or create chain
  const chainId = frameA.chainId || genId();

  const existingFrames = frameA.chainId
    ? getChainFrames(canvas, frameA.chainId)
    : [frameA];

  // Guard: frameB already in this chain
  if (existingFrames.includes(frameB)) return;

  // Bootstrap frameA if this is a new chain
  if (!frameA.chainId) {
    frameA.chainId    = chainId;
    frameA.chainOrder = 0;
  }

  // Append frameB
  frameB.chainId    = chainId;
  frameB.chainOrder = existingFrames.length; // place at end

  const allFrames = [...existingFrames, frameB]
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

  // Merge texts then redistribute
  const fullText = frameA.chainFullText || reconstructMasterText(allFrames);
  distributeChainText(allFrames, fullText);

  canvas?.requestRenderAll();
}

/**
 * Link frames across two canvases (spread view). Works like linkFrames but
 * searches both canvases and renders both after linking.
 *
 * @param {FabricTextbox} frameA — frame on any canvas
 * @param {FabricTextbox} frameB — frame on any canvas
 * @param {FabricCanvas}  leftCanvas
 * @param {FabricCanvas}  rightCanvas
 */
export function linkFramesAcrossCanvases(frameA, frameB, leftCanvas, rightCanvas) {
  if (!frameA || !frameB || frameA === frameB) return;

  // Resolve or create chain
  const chainId = frameA.chainId || genId();

  const existingFrames = frameA.chainId
    ? getChainFramesAcrossCanvases(leftCanvas, rightCanvas, frameA.chainId)
    : [frameA];

  // Guard: frameB already in this chain
  if (existingFrames.includes(frameB)) return;

  // Bootstrap frameA if this is a new chain
  if (!frameA.chainId) {
    frameA.chainId    = chainId;
    frameA.chainOrder = 0;
  }

  // Append frameB
  frameB.chainId    = chainId;
  frameB.chainOrder = existingFrames.length; // place at end

  const allFrames = getChainFramesAcrossCanvases(leftCanvas, rightCanvas, chainId);

  // Merge texts then redistribute
  const fullText = frameA.chainFullText || reconstructMasterText(allFrames);
  distributeChainText(allFrames, fullText);

  // Render both canvases
  leftCanvas?.requestRenderAll();
  rightCanvas?.requestRenderAll();
}

/**
 * Remove `frame` from its chain (works across canvases too).
 *
 * • The frame keeps its currently visible text.
 * • Remaining frames are re-numbered and the master text is redistributed
 *   excluding the words that were in the removed frame.
 * • If only one frame would remain, the chain is dissolved entirely and that
 *   frame's chainFullText is restored as plain text.
 *
 * @param {FabricTextbox} frame
 * @param {FabricCanvas}  canvas
 */
export function unlinkFrame(frame, canvas) {
  if (!frame || !frame.chainId) return;

  const chainId   = frame.chainId;
  const allFrames = getChainFrames(canvas, chainId);
  const remaining = allFrames.filter(f => f !== frame);

  // Always clean up the removed frame's chain props
  const clearedText = frame.text;
  delete frame.chainId;
  delete frame.chainOrder;
  delete frame.chainWordStart;
  delete frame.chainWordEnd;
  delete frame.chainFullText;
  delete frame.chainHasOverflow;
  frame.set('text', clearedText); // keep visible text

  if (remaining.length <= 1) {
    // Dissolve: last frame gets the full master text
    remaining.forEach(f => {
      const savedH = f.height;
      const fullT  = f.chainFullText || f.text;
      delete f.chainId;
      delete f.chainOrder;
      delete f.chainWordStart;
      delete f.chainWordEnd;
      delete f.chainFullText;
      delete f.chainHasOverflow;
      f.set('text', fullT);
      f.initDimensions();
      f.height = savedH;
    });
    canvas?.requestRenderAll();
    return;
  }

  // Re-number and redistribute
  remaining.sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));
  remaining.forEach((f, i) => { f.chainOrder = i; });

  // Build new master text by skipping the removed frame's word slice
  const allWords   = (allFrames[0]?.chainFullText || reconstructMasterText(allFrames))
    .split(/\s+/).filter(Boolean);
  const ws = frame.chainWordStart ?? 0;
  const we = frame.chainWordEnd   ?? ws;
  const newWords = [...allWords.slice(0, ws), ...allWords.slice(we)];

  distributeChainText(remaining, newWords.join(' '));
  canvas?.requestRenderAll();
}
