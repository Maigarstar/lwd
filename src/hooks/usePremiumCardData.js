// ═══════════════════════════════════════════════════════════════════════════════
// usePremiumCardData Hook
// ═══════════════════════════════════════════════════════════════════════════════
// Unified hook for fetching and managing premium card listings
// Used by Latest/Signature/Featured sections and Listing Studio preview

import { useState, useEffect, useCallback } from "react";
import {
  getPremiumListings,
  getPremiumListingById,
  subscribeToAdminConfig,
} from "../services/premiumCardService";

/**
 * Fetch premium card listings for a given section
 * @param {Object} options
 * @param {string} options.sectionType - 'latest' | 'featured' | 'signature'
 * @param {string} options.listingType - 'venue' | 'vendor' | 'planner'
 * @param {boolean} options.subscribe - Subscribe to admin config changes (default: true)
 * @returns {Object} { listings, loading, error }
 */
export function usePremiumCardData({
  sectionType = "latest",
  listingType = "venue",
  subscribe = true,
} = {}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPremiumListings(sectionType, listingType);
        if (isMounted) {
          setListings(data);
        }
      } catch (err) {
        console.error("[usePremiumCardData] Error:", err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [sectionType, listingType]);

  // Subscribe to admin config changes
  useEffect(() => {
    if (!subscribe) return;

    let unsubscribe;

    const setupSubscription = async () => {
      try {
        unsubscribe = subscribeToAdminConfig(async (payload) => {
          // Refresh listings when admin config changes
          const data = await getPremiumListings(sectionType, listingType);
          setListings(data);
        });
      } catch (err) {
        console.error("[usePremiumCardData] Subscription failed:", err);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sectionType, listingType, subscribe]);

  return { listings, loading, error };
}

/**
 * Fetch a single listing by ID (for Listing Studio preview)
 * @param {number} id - Listing ID
 * @param {string} listingType - 'venue' | 'vendor' | 'planner'
 * @returns {Object} { listing, loading, error }
 */
export function usePremiumListingById(id, listingType = "venue") {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPremiumListingById(id, listingType);
        if (isMounted) {
          setListing(data);
        }
      } catch (err) {
        console.error("[usePremiumListingById] Error:", err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, listingType]);

  return { listing, loading, error };
}

/**
 * Fetch multiple listing sections at once (e.g., Latest + Signature for same page)
 * @param {Array<Object>} sections - Array of { sectionType, listingType }
 * @returns {Object} { sections: { [key]: { listings, loading, error } }, loading }
 */
export function usePremiumCardDataMultiple(sections = []) {
  const [allSections, setAllSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      const results = {};

      for (const section of sections) {
        const { sectionType, listingType, key } = section;
        const sectionKey = key || `${sectionType}-${listingType}`;

        try {
          const data = await getPremiumListings(sectionType, listingType);
          if (isMounted) {
            results[sectionKey] = {
              listings: data,
              loading: false,
              error: null,
            };
          }
        } catch (err) {
          if (isMounted) {
            results[sectionKey] = {
              listings: [],
              loading: false,
              error: err,
            };
          }
        }
      }

      if (isMounted) {
        setAllSections(results);
        setLoading(false);
      }
    };

    if (sections.length > 0) {
      fetchAll();
    } else {
      setAllSections({});
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(sections)]); // JSON.stringify to detect array changes

  return { sections: allSections, loading };
}
