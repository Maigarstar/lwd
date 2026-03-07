/**
 * localStorage helpers for Page Studio
 * Manages persistence of pages, blocks, and homepage config
 */

const STORAGE_KEYS = {
  pages: "ps_pages",
  blocks: "ps_blocks",
  homepage: "ps_homepage",
  blog: "ps_blog"
};

/**
 * Save all pages to localStorage
 */
export const savePages = (pages) => {
  try {
    localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(pages));
    return true;
  } catch (e) {
    console.error("Failed to save pages:", e);
    return false;
  }
};

/**
 * Load all pages from localStorage
 */
export const loadPages = (defaultPages) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.pages);
    return stored ? JSON.parse(stored) : defaultPages;
  } catch (e) {
    console.error("Failed to load pages:", e);
    return defaultPages;
  }
};

/**
 * Save a single page
 */
export const savePage = (pages, pageId, pageData) => {
  const updated = pages.map(p => p.id === pageId ? pageData : p);
  savePages(updated);
  return updated;
};

/**
 * Delete a page
 */
export const deletePage = (pages, pageId) => {
  const updated = pages.filter(p => p.id !== pageId);
  savePages(updated);
  return updated;
};

/**
 * Add a new page
 */
export const addPage = (pages, newPage) => {
  const updated = [...pages, newPage];
  savePages(updated);
  return updated;
};

/**
 * Save all reusable blocks
 */
export const saveBlocks = (blocks) => {
  try {
    localStorage.setItem(STORAGE_KEYS.blocks, JSON.stringify(blocks));
    return true;
  } catch (e) {
    console.error("Failed to save blocks:", e);
    return false;
  }
};

/**
 * Load all blocks
 */
export const loadBlocks = (defaultBlocks) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.blocks);
    return stored ? JSON.parse(stored) : defaultBlocks;
  } catch (e) {
    console.error("Failed to load blocks:", e);
    return defaultBlocks;
  }
};

/**
 * Save a single block
 */
export const saveBlock = (blocks, blockId, blockData) => {
  const updated = blocks.map(b => b.id === blockId ? blockData : b);
  saveBlocks(updated);
  return updated;
};

/**
 * Add a new block
 */
export const addBlock = (blocks, newBlock) => {
  const updated = [...blocks, newBlock];
  saveBlocks(updated);
  return updated;
};

/**
 * Delete a block
 */
export const deleteBlock = (blocks, blockId) => {
  const updated = blocks.filter(b => b.id !== blockId);
  saveBlocks(updated);
  return updated;
};

/**
 * Save homepage configuration
 */
export const saveHomepageConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.homepage, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Failed to save homepage config:", e);
    return false;
  }
};

/**
 * Load homepage configuration
 */
export const loadHomepageConfig = (defaultConfig) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.homepage);
    return stored ? JSON.parse(stored) : defaultConfig;
  } catch (e) {
    console.error("Failed to load homepage config:", e);
    return defaultConfig;
  }
};

/**
 * Save blog configuration
 */
export const saveBlogConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.blog, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Failed to save blog config:", e);
    return false;
  }
};

/**
 * Load blog configuration
 */
export const loadBlogConfig = (defaultConfig) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.blog);
    return stored ? JSON.parse(stored) : defaultConfig;
  } catch (e) {
    console.error("Failed to load blog config:", e);
    return defaultConfig;
  }
};
