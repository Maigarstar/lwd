// ─── src/services/venueService.js ────────────────────────────────────────────
// Venue access helpers — always import venues through here, never directly
// from a country-specific data file.
import { VENUES } from "../data/venues";

/**
 * Return all venues whose regionSlug matches, with a fallback to region name.
 * Case-insensitive — so "London" and "london" both work.
 */
export function getVenuesByRegion(regionSlug) {
  if (!regionSlug) return [];
  const slug = regionSlug.toLowerCase();
  const bySlug = VENUES.filter((v) => v.regionSlug?.toLowerCase() === slug);
  if (bySlug.length > 0) return bySlug;
  // Fallback: match on region name for legacy records
  return VENUES.filter((v) => v.region?.toLowerCase() === slug);
}

/**
 * Return all venues for a country.
 */
export function getVenuesByCountry(countrySlug) {
  if (!countrySlug) return [];
  const slug = countrySlug.toLowerCase();
  return VENUES.filter((v) => v.countrySlug?.toLowerCase() === slug);
}

/**
 * Return all venues for a city (citySlug or city name fallback).
 */
export function getVenuesByCity(citySlug) {
  if (!citySlug) return [];
  const slug = citySlug.toLowerCase();
  const bySlug = VENUES.filter((v) => v.citySlug?.toLowerCase() === slug);
  if (bySlug.length > 0) return bySlug;
  return VENUES.filter((v) => v.city?.toLowerCase() === slug);
}

/**
 * Return all venues for a region + city combination.
 */
export function getVenuesByRegionAndCity(regionSlug, citySlug) {
  const regional = getVenuesByRegion(regionSlug);
  if (!citySlug) return regional;
  const slug = citySlug.toLowerCase();
  return regional.filter(
    (v) => v.citySlug?.toLowerCase() === slug || v.city?.toLowerCase() === slug
  );
}
