/**
 * useRealWeddings Hook
 * Custom hook for fetching and managing real weddings with pagination
 */

import { useState, useEffect } from "react";
import {
  getPaginatedRealWeddings,
  getAllRealWeddingLocations,
} from "../services/realWeddingService";

/**
 * useRealWeddings - Hook for real weddings data fetching
 * @param {number} pageSize - Number of weddings per page (default: 12)
 * @returns {Object} - { weddings, locations, loading, error, page, totalPages, filters, setFilters, goToPage }
 */
export const useRealWeddings = (pageSize = 12) => {
  const [weddings, setWeddings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    location: "",
    featured: false,
  });

  // Fetch locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      const { data, error: err } = await getAllRealWeddingLocations();
      if (!err) {
        setLocations(data);
      }
    };
    loadLocations();
  }, []);

  // Fetch weddings when page or filters change
  useEffect(() => {
    const loadWeddings = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, count, totalPages: pages, error: err } =
          await getPaginatedRealWeddings(page, pageSize, filters);

        if (err) throw err;

        setWeddings(data);
        setTotalCount(count);
        setTotalPages(pages);
      } catch (err) {
        console.error("Error loading weddings:", err);
        setError(err.message || "Failed to load weddings");
        setWeddings([]);
      } finally {
        setLoading(false);
      }
    };

    loadWeddings();
  }, [page, filters, pageSize]);

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  return {
    weddings,
    locations,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    filters,
    setFilters: updateFilters,
    goToPage,
  };
};
