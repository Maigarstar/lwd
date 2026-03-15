/**
 * HomepageEditorPanel, Left panel with section editors
 *
 * - Drag handle (≡) for reordering sections
 * - Hero section locked (cannot move)
 * - ON/OFF toggle per section with pill-style control
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
        gap: 12,
        padding: '12px 12px',
      }}
    >
      {/* Render sections sorted by order */}
      {sortedSections.map((section, index) => {
        const config = SECTION_CONFIG.find(c => c.id === section.id);
        if (!config || !section) return null;

        const isLocked = config.locked;
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
              padding: '16px',
              backgroundColor: isDragOver ? `${C.gold}15` : C.card || 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: `1px solid ${isDragOver ? C.gold + '44' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
              opacity: isDragging ? 0.5 : 1,
              transition: 'all 0.2s ease',
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
                  title="Drag to reorder"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.grey2,
                    cursor: 'grab',
                    userSelect: 'none',
                    padding: '2px 4px',
                    transition: 'color 0.15s ease',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.grey2; }}
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

              {/* Enable/Disable Toggle */}
              <button
                onClick={() => onSectionChange(section.id, 'enabled', !section.enabled)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: section.enabled ? `${C.gold}22` : 'rgba(255,255,255,0.05)',
                  color: section.enabled ? C.gold : C.grey2,
                  fontFamily: NU,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: section.enabled ? C.gold : C.grey2,
                  transition: 'background-color 0.15s ease',
                }} />
                {section.enabled ? 'On' : 'Off'}
              </button>
            </div>

            {/* Section Body, Render actual section editor */}
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
