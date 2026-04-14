/**
 * Standardized grid layout styles for listing cards
 * Used consistently across all location pages (venues, planners, vendors)
 */

export const GRID_STYLES = {
  mobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 0,
    padding: "0",
    margin: "0",
    width: "100vw",
    marginLeft: "calc(-50vw + 50%)",
  },
  desktop: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 0,
    padding: "0",
  },
};

export const CARD_WRAPPER_STYLES = {
  mobile: {
    height: "auto",
    padding: "5px 0",
    borderRadius: "var(--lwd-radius-card, 8px)",
  },
  desktop: {
    height: "auto",
    padding: "0",
    borderRadius: "var(--lwd-radius-card, 8px)",
  },
};

/**
 * Returns grid styles based on screen size
 * @param {boolean} isMobile - Is mobile breakpoint
 * @returns {object} Grid container styles
 */
export const getGridStyles = (isMobile) => {
  return isMobile ? GRID_STYLES.mobile : GRID_STYLES.desktop;
};

/**
 * Returns card wrapper styles based on screen size
 * @param {boolean} isMobile - Is mobile breakpoint
 * @returns {object} Card wrapper styles
 */
export const getCardWrapperStyles = (isMobile) => {
  return isMobile ? CARD_WRAPPER_STYLES.mobile : CARD_WRAPPER_STYLES.desktop;
};
