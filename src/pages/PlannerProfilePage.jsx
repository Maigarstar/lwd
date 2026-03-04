// ─── src/pages/PlannerProfilePage.jsx ─────────────────────────────────────────
// Thin resolver: fetches planner by slug, applies defaults, renders template.
// ──────────────────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import VendorProfileTemplate from "./VendorProfileTemplate";

const DEFAULT_STEPS = [
  { title: "Discovery", description: "A calm, focused call to define the feeling, the guest journey, and the priorities." },
  { title: "Design", description: "Creative direction, vendor curation, and a plan that keeps everything aligned." },
  { title: "Execution", description: "On the day, they run point, protect the couple, and keep the room effortless." },
];

export default function PlannerProfilePage({
  plannerId = null,
  plannerSlug = null,
  getPlannerByIdOrSlug = null,
  onBack = () => {},
  onOpenChat = () => {},
  onSave = () => {},
  isSaved = false,
  similarPlanners = [],
  onViewPlanner,
  footerNav = {},
  countrySlug = null,
  regionSlug = null,
  onViewRegion = null,
  onViewRegionCategory = null,
}) {
  const planner = useMemo(() => {
    if (!getPlannerByIdOrSlug) return null;
    const p = getPlannerByIdOrSlug(plannerId || plannerSlug);
    if (!p) return null;
    // Apply planner-specific defaults for any missing fields
    return {
      ...p,
      approachSteps: p.approachSteps || DEFAULT_STEPS,
      languages: p.languages || ["English", "Italian"],
      planningStyle: p.planningStyle || "Modern, classic",
      travelPolicy: p.travelPolicy || "By arrangement",
      coverage: p.coverage || [p.region].filter(Boolean),
      editorial: p.editorial || p.desc,
    };
  }, [getPlannerByIdOrSlug, plannerId, plannerSlug]);

  return (
    <VendorProfileTemplate
      vendor={planner}
      vendorType="planner"
      similarVendors={similarPlanners}
      onBack={onBack}
      onViewVendor={onViewPlanner}
      countrySlug={countrySlug}
      regionSlug={regionSlug}
      onViewRegion={onViewRegion}
      footerNav={footerNav}
    />
  );
}
