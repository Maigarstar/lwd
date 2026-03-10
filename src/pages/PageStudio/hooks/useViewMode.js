import { useState, useEffect } from 'react';

/**
 * useViewMode — Shared view mode state management for studios
 *
 * Manages split/editor/preview view modes with localStorage persistence.
 * Used by both Page Studio and Listing Studio.
 *
 * @param {string} storageKey - localStorage key (e.g., 'ps_view_mode', 'ls_view_mode')
 * @param {string} defaultMode - Default mode if not in localStorage (default: 'split')
 * @returns {object} { viewMode, setViewMode, gridCols, showLeftPanel, showRightPanel, handleViewModeChange }
 */
export default function useViewMode(storageKey = 'view_mode', defaultMode = 'split') {
  const [viewMode, setViewModeState] = useState(defaultMode);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && ['split', 'editor', 'preview'].includes(saved)) {
        setViewModeState(saved);
      }
    } catch (e) {
      console.warn(`Failed to load view mode from ${storageKey}:`, e);
    }
  }, [storageKey]);

  // Handle mode change with persistence
  const handleViewModeChange = (mode) => {
    if (!['split', 'editor', 'preview'].includes(mode)) return;
    setViewModeState(mode);
    try {
      localStorage.setItem(storageKey, mode);
    } catch (e) {
      console.warn(`Failed to save view mode to ${storageKey}:`, e);
    }
  };

  // Compute layout based on view mode
  const gridCols = viewMode === 'editor' ? '1fr' : viewMode === 'preview' ? '1fr' : '1fr 1fr';
  const showLeftPanel = viewMode !== 'preview';
  const showRightPanel = viewMode !== 'editor';

  return {
    viewMode,
    setViewMode: handleViewModeChange,
    gridCols,
    showLeftPanel,
    showRightPanel,
    handleViewModeChange,
  };
}
