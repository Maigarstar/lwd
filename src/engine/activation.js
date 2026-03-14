// ─── src/engine/activation.js ──────────────────────────────────────────────────
// Universal region activation logic.
// Not Italy-specific. Works for any country with regions.
//
// Evaluation order (per spec):
//   1. If manual === false → disabled
//   2. If manual === true  → enabled (manual override)
//   3. If everActivated     → enabled (auto, SEO-protected)
//   4. If listingCount >= threshold AND primary → enabled (auto, set everActivated)
//   5. Else → disabled
//
// Once auto-activated, region stays active unless manually disabled.

export const REGION_AUTO_THRESHOLD = 5;

/**
 * Evaluate region activation state.
 * Returns { active, label, reason }, UI-agnostic, no colour logic.
 *
 * @param {{ urlEnabledManual: boolean|null, urlEverActivated: boolean, listingCount: number, priorityLevel: string }} region
 * @returns {{ active: boolean, label: string, reason: string }}
 */
export function evaluateRegionActivation(region) {
  // 1. Manual OFF, always wins
  if (region.urlEnabledManual === false)
    return { active: false, label: "Manual OFF", reason: "manual-off" };

  // 2. Manual ON, always wins
  if (region.urlEnabledManual === true)
    return { active: true, label: "Enabled (Manual)", reason: "manual-on" };

  // 3. Sticky auto, SEO-protected, never auto-disables
  if (region.urlEverActivated === true)
    return { active: true, label: "Enabled (Auto)", reason: "ever-activated" };

  // 4. Threshold check, primary regions only
  if (region.listingCount >= REGION_AUTO_THRESHOLD && region.priorityLevel === "primary")
    return { active: true, label: "Enabled (Auto)", reason: "threshold-met" };

  // 5. Default, disabled
  return { active: false, label: "Disabled", reason: "below-threshold" };
}
