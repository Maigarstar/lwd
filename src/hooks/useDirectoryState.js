// src/hooks/useDirectoryState.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all directory pages.
// Manages: filter state, view mode, map toggle, active listing, mobile detection.
// Pages consume this hook and pass the returned state/handlers to shared components.
// Phase 1: logic consolidation — no UI changes, same visual output.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { getInitialViewState, saveViewState } from "../components/maps/ViewStateManager";
import { PinSyncBus } from "../components/maps/PinSyncBus";

// ── Unified filter state model (platform standard) ────────────────────────────
// { query, country, region, city, category, styles[], capacity,
//   priceFrom, priceTo, viewMode, mapOn, sort }

export const DEFAULT_DIRECTORY_FILTERS = {
  query:     "",
  country:   null,   // countrySlug
  region:    null,   // regionSlug
  city:      null,   // citySlug
  category:  null,   // categorySlug
  styles:    [],     // array — multiple styles can be active
  capacity:  null,   // single value: "Up to 50" | "50–100" | "100–200" | "200+"
  priceFrom: null,   // number
  priceTo:   null,   // number
  sort:      "recommended",
};

// ── Sort options (platform standard) ─────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating",      label: "Top Rated" },
  { value: "price-asc",   label: "Price: Low to High" },
  { value: "price-desc",  label: "Price: High to Low" },
  { value: "newest",      label: "Newest" },
];

// ── Apply filters to a listings array ────────────────────────────────────────
export function applyDirectoryFilters(listings, filters) {
  if (!listings?.length) return [];

  return listings.filter((v) => {
    // Text query — match name, region, city
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchName   = v.name?.toLowerCase().includes(q);
      const matchRegion = v.region?.toLowerCase().includes(q);
      const matchCity   = v.city?.toLowerCase().includes(q);
      if (!matchName && !matchRegion && !matchCity) return false;
    }

    // Country
    if (filters.country && v.countrySlug && v.countrySlug !== filters.country) return false;

    // Region
    if (filters.region && filters.region !== "all") {
      if (v.regionSlug && v.regionSlug !== filters.region) return false;
    }

    // City
    if (filters.city && v.citySlug && v.citySlug !== filters.city) return false;

    // Category — only applies to mixed listings
    if (filters.category && v.category && v.category !== filters.category) return false;

    // Styles — listing must match at least one selected style
    if (filters.styles?.length > 0) {
      const hasStyle = filters.styles.some((s) => v.styles?.includes(s));
      if (!hasStyle) return false;
    }

    // Capacity
    if (filters.capacity && filters.capacity !== "All") {
      const cap = v.capacity;
      if (cap == null) return false;
      if (filters.capacity === "Up to 50"  && cap > 50)                    return false;
      if (filters.capacity === "50–100"    && (cap <= 50 || cap > 100))    return false;
      if (filters.capacity === "100–200"   && (cap <= 100 || cap > 200))   return false;
      if (filters.capacity === "200+"      && cap <= 200)                  return false;
    }

    // Price range
    if (filters.priceFrom != null && v.priceFromRaw != null && v.priceFromRaw < filters.priceFrom) return false;
    if (filters.priceTo   != null && v.priceFromRaw != null && v.priceFromRaw > filters.priceTo)   return false;

    return true;
  });
}

// ── Apply sort to a listings array ────────────────────────────────────────────
export function applyDirectorySort(listings, sort) {
  if (!listings?.length) return [];
  const arr = [...listings];

  switch (sort) {
    case "rating":
      return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "price-asc":
      return arr.sort((a, b) => (a.priceFromRaw ?? Infinity) - (b.priceFromRaw ?? Infinity));
    case "price-desc":
      return arr.sort((a, b) => (b.priceFromRaw ?? 0) - (a.priceFromRaw ?? 0));
    case "newest":
      return arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    case "recommended":
    default:
      // Featured first, then by lwdScore, then by rating
      return arr.sort((a, b) => {
        if (b.featured !== a.featured) return b.featured ? 1 : -1;
        if ((b.lwdScore ?? 0) !== (a.lwdScore ?? 0)) return (b.lwdScore ?? 0) - (a.lwdScore ?? 0);
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useDirectoryState({
  initialFilters = {},   // page-level defaults (e.g. { region: "tuscany", category: "wedding-venues" })
  storageKey = null,     // optional: custom localStorage key for this page's view state
} = {}) {

  // ── View state — persisted to localStorage ──────────────────────────────────
  const [viewMode, setViewMode] = useState(() => getInitialViewState(storageKey).viewMode);
  const [mapOn,    setMapOn]    = useState(() => getInitialViewState(storageKey).mapOn);
  const [mapTransitioning, setMapTransitioning] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    ...DEFAULT_DIRECTORY_FILTERS,
    ...initialFilters,
  });

  // ── Active listing (card ↔ pin sync) ────────────────────────────────────────
  const [activeListingId, setActiveListingId] = useState(null);

  // ── Mobile detection ────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── PinSyncBus: pin events → activeListingId ────────────────────────────────
  useEffect(() => {
    const offClick = PinSyncBus.on("pin:click", (id) => {
      setActiveListingId(id);
      const el = document.querySelector(`[data-listing-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const offHover = PinSyncBus.on("pin:hover", (id) => setActiveListingId(id));
    const offLeave = PinSyncBus.on("pin:leave", ()   => setActiveListingId(null));
    return () => { offClick(); offHover(); offLeave(); };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const setViewModePersisted = useCallback((mode) => {
    setViewMode(mode);
    saveViewState(mode, mapOn, storageKey);
  }, [mapOn, storageKey]);

  const toggleMap = useCallback(() => {
    setMapTransitioning(true);
    setTimeout(() => setMapTransitioning(false), 480);
    setMapOn((prev) => {
      const next = !prev;
      saveViewState(viewMode, next, storageKey);
      return next;
    });
  }, [viewMode, storageKey]);

  const setMapOnDirect = useCallback((val) => {
    setMapOn(val);
    saveViewState(viewMode, val, storageKey);
  }, [viewMode, storageKey]);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_DIRECTORY_FILTERS, ...initialFilters });
  }, [initialFilters]);

  // ── Derived: has any non-default filter active ────────────────────────────
  const hasActiveFilters = useMemo(() => {
    const base = { ...DEFAULT_DIRECTORY_FILTERS, ...initialFilters };
    return (
      (filters.query     && filters.query     !== base.query)     ||
      (filters.styles?.length > 0)                                ||
      (filters.capacity  && filters.capacity  !== base.capacity)  ||
      (filters.priceFrom != null)                                  ||
      (filters.priceTo   != null)                                  ||
      (filters.sort      && filters.sort      !== base.sort)
    );
  }, [filters, initialFilters]);

  return {
    // Filter state
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,

    // View state
    viewMode,
    setViewMode: setViewModePersisted,
    mapOn,
    toggleMap,
    setMapOn: setMapOnDirect,
    mapTransitioning,

    // Pin sync
    activeListingId,
    setActiveListingId,

    // Responsive
    isMobile,
  };
}
