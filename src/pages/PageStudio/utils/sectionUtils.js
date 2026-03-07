/**
 * Utilities for managing page sections
 */

/**
 * Add a new section to a page
 */
export const addSection = (sections, newSection) => {
  const withPosition = {
    ...newSection,
    position: sections.length,
    id: `section_${Date.now()}`
  };
  return [...sections, withPosition];
};

/**
 * Update a section
 */
export const updateSection = (sections, sectionId, updates) => {
  return sections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
};

/**
 * Delete a section
 */
export const deleteSection = (sections, sectionId) => {
  const filtered = sections.filter(s => s.id !== sectionId);
  // Reorder positions
  return filtered.map((s, idx) => ({ ...s, position: idx }));
};

/**
 * Move section up
 */
export const moveSectionUp = (sections, sectionId) => {
  const section = sections.find(s => s.id === sectionId);
  if (!section || section.position === 0) return sections;

  const reordered = [...sections];
  const currentIdx = reordered.findIndex(s => s.id === sectionId);
  const prevIdx = currentIdx - 1;

  [reordered[currentIdx], reordered[prevIdx]] = [
    reordered[prevIdx],
    reordered[currentIdx]
  ];

  return reordered.map((s, idx) => ({ ...s, position: idx }));
};

/**
 * Move section down
 */
export const moveSectionDown = (sections, sectionId) => {
  const section = sections.find(s => s.id === sectionId);
  if (!section || section.position === sections.length - 1) return sections;

  const reordered = [...sections];
  const currentIdx = reordered.findIndex(s => s.id === sectionId);
  const nextIdx = currentIdx + 1;

  [reordered[currentIdx], reordered[nextIdx]] = [
    reordered[nextIdx],
    reordered[currentIdx]
  ];

  return reordered.map((s, idx) => ({ ...s, position: idx }));
};

/**
 * Duplicate a section
 */
export const duplicateSection = (sections, sectionId) => {
  const section = sections.find(s => s.id === sectionId);
  if (!section) return sections;

  const duplicate = {
    ...section,
    id: `section_${Date.now()}`,
    position: section.position + 1,
    sectionName: `${section.sectionName} (Copy)`
  };

  const updated = [...sections];
  updated.splice(duplicate.position, 0, duplicate);

  return updated.map((s, idx) => ({ ...s, position: idx }));
};

/**
 * Toggle section visibility
 */
export const toggleSectionVisibility = (sections, sectionId) => {
  return sections.map(s =>
    s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
  );
};

/**
 * Get section by ID
 */
export const getSectionById = (sections, sectionId) => {
  return sections.find(s => s.id === sectionId);
};

/**
 * Reorder sections (used for drag and drop)
 */
export const reorderSections = (sections, fromIdx, toIdx) => {
  const result = [...sections];
  const [removed] = result.splice(fromIdx, 1);
  result.splice(toIdx, 0, removed);

  return result.map((s, idx) => ({ ...s, position: idx }));
};
