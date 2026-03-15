// ─── src/utils/track.js ──────────────────────────────────────────────────────
// Lightweight analytics utility.  Logs to console in dev; swap the body of
// `track()` for your real analytics provider (Segment, Plausible, GA4, etc.)

const DEV = import.meta.env?.DEV ?? true;

/**
 * Fire a named analytics event.
 * @param {string} name , event identifier, e.g. "search_submit"
 * @param {object} [payload], optional key/value context
 */
export function track(name, payload = {}) {
  if (DEV) {
    // eslint-disable-next-line no-console
    console.log(`[LWD Track] ${name}`, payload);
  }

  // TODO: wire to real analytics endpoint
  // e.g. window.analytics?.track(name, payload);
}
