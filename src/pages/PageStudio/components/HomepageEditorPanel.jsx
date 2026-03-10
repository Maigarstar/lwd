/**
 * HomepageEditorPanel — Left panel with section editors
 *
 * Phase 1b: Section Reordering with Drag-and-Drop
 * - Drag handle (≡) for dragging sections
 * - Move buttons (↑↓) as accessibility fallback
 * - Hero section locked (cannot move)
 * - Visual feedback during drag operations
 */

import { useState } from 'react';
import SlimHeroSection from './sections/SlimHeroSection';
import DestinationGridSection from './sections/DestinationGridSection';
import VenueGridSection from './sections/VenueGridSection';
import FeaturedSliderSection from './sections/FeaturedSliderSection';
import CategorySliderSection from './sections/CategorySliderSection';
import VendorPreviewSection from './sections/VendorPreviewSection';
import NewsletterBandSection from './sections/NewsletterBandSection';
import DirectoryBrandsSection from './sections/DirectoryBrandsSection';

const SECTION_CONFIG = [
  { id: 'hero', label: 'Hero Section', icon: '🌅', locked: true },
  { id: 'destinations', label: 'Destination Grid', icon: '🗺️', locked: false },
  { id: 'venues', label: 'Venue Grid', icon: '🏰', locked: false },
  { id: 'featured', label: 'Featured Slider', icon: '⭐', locked: false },
  { id: 'categories', label: 'Category Slider', icon: '◆', locked: false },
  { id: 'vendors', label: 'Vendor Preview', icon: '✓', locked: false },
  { id: 'newsletter', label: 'Newsletter Band', icon: '📧', locked: false },
  { id: 'directory', label: 'Directory Brands', icon: '🌐', locked: false },
];

export default function HomepageEditorPanel({
  formData,
  onSectionChange,
  C,
  NU,
  GD,
}) {
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!formData) return null;

  const sections = formData.sections || [];

  // Sort sections by order property
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Handle section move up/down (button controls)
  const handleMoveSection = (sectionId, direction) => {
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedSections.length) return;

    // Swap order values
    const orders = sortedSections.map(s => s.order || 0);
    [orders[currentIndex], orders[newIndex]] = [orders[newIndex], orders[currentIndex]];

    // Update both sections with new orders
    sortedSections[currentIndex].order = orders[currentIndex];
    sortedSections[newIndex].order = orders[newIndex];

    // Call onChange for each affected section
    onSectionChange(sectionId, 'order', orders[currentIndex]);
    onSectionChange(sortedSections[newIndex].id, 'order', orders[newIndex]);
  };

  // Handle drag start
  const handleDragStart = (e, sectionId, isLocked) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedIndex = sortedSections.findIndex(s => s.id === draggedId);

    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSection(null);
      return;
    }

    // Swap order values
    const orders = sortedSections.map(s => s.order || 0);
    [orders[draggedIndex], orders[targetIndex]] = [orders[targetIndex], orders[draggedIndex]];

    // Update both sections with new orders
    const draggedSectionObj = sortedSections[draggedIndex];
    const targetSection = sortedSections[targetIndex];

    draggedSectionObj.order = orders[draggedIndex];
    targetSection.order = orders[targetIndex];

    // Call onChange for each affected section
    onSectionChange(draggedId, 'order', orders[draggedIndex]);
    onSectionChange(targetSection.id, 'order', orders[targetIndex]);

    setDraggedSection(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverIndex(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Render sections sorted by order */}
      {sortedSections.map((section, index) => {
        const config = SECTION_CONFIG.find(c => c.id === section.id);
        if (!config || !section) return null;

        const isLocked = config.locked;
        const isFirst = index === 0;
        const isLast = index === sortedSections.length - 1;
        const isDragging = draggedSection === section.id;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={section.id}
            draggable={!isLocked}
            onDragStart={(e) => handleDragStart(e, section.id, isLocked)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              borderBottom: `1px solid ${C.border}`,
              padding: '16px',
              backgroundColor: isDragOver ? `${C.gold}15` : 'transparent',
              opacity: isDragging ? 0.5 : 1,
              transition: 'all 0.2s ease',
              cursor: isLocked ? 'default' : 'move',
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {/* Drag Handle (only for unlocked sections) */}
              {!isLocked && (
                <span
                  title="Drag to reorder sections"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.gold || '#FFD700',
                    cursor: 'grab',
                    userSelect: 'none',
                    padding: '0 4px',
                    transition: 'opacity 0.2s ease',
                    opacity: draggedSection === section.id ? 0.5 : 1,
                  }}
                  onMouseDown={(e) => {
                    // Visual feedback for drag handle on mouse down
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  ≡
                </span>
              )}

              <span style={{ fontSize: 16 }}>{config.icon}</span>
              <h3
                style={{
                  fontFamily: GD,
                  fontSize: 13,
                  fontWeight: 400,
                  color: C.white,
                  margin: 0,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {config.label}
                {isLocked && (
                  <span
                    title="This section is locked and cannot be moved"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.gold || '#FFD700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    🔒 Locked
                  </span>
                )}
              </h3>

              {/* Move Controls (only for unlocked sections) */}
              {!isLocked && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    onClick={() => handleMoveSection(section.id, 'up')}
                    disabled={isFirst}
                    title={isFirst ? 'Already at top' : 'Move section up'}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: isFirst ? C.grey : C.gold || '#FFD700',
                      color: isFirst ? C.grey2 : C.black,
                      border: 'none',
                      borderRadius: 3,
                      fontFamily: NU,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: isFirst ? 'not-allowed' : 'pointer',
                      opacity: isFirst ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => !isFirst && (e.target.style.opacity = '0.8')}
                    onMouseOut={(e) => !isFirst && (e.target.style.opacity = '1')}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveSection(section.id, 'down')}
                    disabled={isLast}
                    title={isLast ? 'Already at bottom' : 'Move section down'}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: isLast ? C.grey : C.gold || '#FFD700',
                      color: isLast ? C.grey2 : C.black,
                      border: 'none',
                      borderRadius: 3,
                      fontFamily: NU,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: isLast ? 'not-allowed' : 'pointer',
                      opacity: isLast ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => !isLast && (e.target.style.opacity = '0.8')}
                    onMouseOut={(e) => !isLast && (e.target.style.opacity = '1')}
                  >
                    ↓
                  </button>
                </div>
              )}

              {/* Enable/Disable Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(e) => onSectionChange(section.id, 'enabled', e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    width: 16,
                    height: 16,
                  }}
                />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    color: C.grey2,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {section.enabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>

            {/* Section Body — Render actual section editor */}
            {config.id === 'hero' && <SlimHeroSection section={section} onChange={onSectionChange} C={C} NU={NU} GD={GD} />}
            {config.id === 'destinations' && <DestinationGridSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'venues' && <VenueGridSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'featured' && <FeaturedSliderSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'categories' && <CategorySliderSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'vendors' && <VendorPreviewSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'newsletter' && <NewsletterBandSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
            {config.id === 'directory' && <DirectoryBrandsSection section={section} onChange={onSectionChange} C={C} NU={NU} />}
          </div>
        );
      })}
    </div>
  );
}
