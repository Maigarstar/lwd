// ─── src/data/italy/country.js ────────────────────────────────────────────────
// Italy country entity, reference architecture for global entity graph.
// Schema: id, slug, name, iso2, seo fields, ai fields, intent signals, aliases.

export const ITALY_COUNTRY = {
  id: "italy",
  slug: "italy",
  name: "Italy",
  iso2: "IT",
  listingCount: 20,
  canonicalRoute: "/italy",
  seoTitleTemplate: "Luxury Wedding Vendors in Italy | LWD",
  metaDescriptionTemplate: "Discover curated luxury wedding venues, planners and vendors across Italy. From Lake Como to the Amalfi Coast, editorially selected.",
  evergreenContent: "Italy remains the world's most sought-after destination for luxury weddings. From the Renaissance grandeur of Tuscan villas to the dramatic cliffs of the Amalfi Coast, every region offers a distinct expression of la dolce vita.",
  focusKeywords: [
    "luxury wedding italy",
    "destination wedding italy",
    "italian wedding venues",
    "wedding planner italy",
    "lake como wedding",
  ],
  aiSummary: "Premier destination wedding market. Strongest demand in Lake Como, Tuscany, and Amalfi Coast. High-intent search volume year-round with peaks in spring/autumn.",
  intentSignals: {
    high: ["book wedding venue italy", "lake como wedding planner", "tuscany villa wedding cost"],
    mid: ["best wedding venues in italy", "italy destination wedding ideas", "amalfi coast wedding guide"],
    low: ["italian wedding traditions", "getting married in italy", "italy wedding inspiration"],
  },
  entityAliases: ["Italia", "Repubblica Italiana", "Italian Republic"],
};
