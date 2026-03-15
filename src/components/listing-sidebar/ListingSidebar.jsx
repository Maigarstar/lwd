/**
 * ListingSidebar
 *
 * Modular sidebar composer for public listing detail pages.
 * Stacks independent card modules in a flex column with consistent spacing.
 *
 * Each module is independently imported and self-manages its own null states  - 
 * if a module has nothing to render it returns null automatically.
 *
 * Module render order (top → bottom):
 *   1. SidebarEnquiryCard , pricing + primary CTA (always first)
 *   2. SidebarProfileCard , owner / contact person
 *   3. SidebarOfferCard   , featured package or offer
 *   4. SidebarNewsCard    , press features / awards
 *   5. SidebarMapCard     , location map
 *
 * ── ENQUIRY NOTE ──────────────────────────────────────────────────────────────
 * The full contact / enquiry form experience is NOT built here yet.
 * SidebarEnquiryCard is intentionally simple, it shows pricing, CTA, and
 * urgency signals only. The complete enquiry flow will be designed and built
 * in a dedicated future phase (multi-step, trust signals, CRM integration, etc).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props:
 *   entity      {object} , full listing / venue / vendor data object
 *   entityType  {string} , "venue" | "planner" | "photographer" | etc.
 *   C           {object} , colour palette (from getLightPalette / getDarkPalette)
 *   onEnquire   {fn}     , called when primary CTA clicked
 *   onSave      {fn}     , called when Save button clicked
 *   onCompare   {fn}     , called when Compare button clicked
 *   onViewMap   {fn}     , called when map CTA clicked
 *   isSaved     {bool}
 *   isCompared  {bool}
 *   modules     {array}  , optional explicit override of module order/visibility
 *                           e.g. ["enquiry", "profile", "map"] skips news/offer
 */

import SidebarEnquiryCard from "./SidebarEnquiryCard";
import SidebarProfileCard from "./SidebarProfileCard";
import SidebarNewsCard    from "./SidebarNewsCard";
import SidebarOfferCard   from "./SidebarOfferCard";
import SidebarMapCard     from "./SidebarMapCard";

// Default module order, every module is optional (self-nulls if no data)
const DEFAULT_MODULES = [
  "enquiry",
  "profile",
  "offer",
  "news",
  "map",
];

export default function ListingSidebar({
  entity     = {},
  entityType = "venue",
  C          = {},
  onEnquire,
  onSave,
  onCompare,
  onViewMap,
  isSaved    = false,
  isCompared = false,
  modules    = DEFAULT_MODULES,
}) {
  if (!entity || !C) return null;

  const renderModule = (key) => {
    switch (key) {
      case "enquiry":
        return (
          <SidebarEnquiryCard
            key="enquiry"
            entity={entity}
            C={C}
            onEnquire={onEnquire}
            onSave={onSave}
            onCompare={onCompare}
            isSaved={isSaved}
            isCompared={isCompared}
          />
        );

      case "profile":
        return (
          <SidebarProfileCard
            key="profile"
            entity={entity}
            C={C}
          />
        );

      case "offer":
        return (
          <SidebarOfferCard
            key="offer"
            entity={entity}
            C={C}
          />
        );

      case "news":
        return (
          <SidebarNewsCard
            key="news"
            entity={entity}
            C={C}
          />
        );

      case "map":
        return (
          <SidebarMapCard
            key="map"
            entity={entity}
            C={C}
            onViewMap={onViewMap}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="lwd-listing-sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {modules.map(renderModule)}
    </div>
  );
}
