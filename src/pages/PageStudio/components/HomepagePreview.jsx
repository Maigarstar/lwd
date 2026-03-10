import { ThemeCtx } from '../../../theme/ThemeContext';
import SlimHero from '../../../components/sections/SlimHero';
import DestinationGrid from '../../../components/sections/DestinationGrid';
import VenueGrid from '../../../components/sections/VenueGrid';
import FeaturedSlider from '../../../components/sections/FeaturedSlider';
import CategorySlider from '../../../components/sections/CategorySlider';
import VendorPreview from '../../../components/sections/VendorPreview';
import NewsletterBand from '../../../components/sections/NewsletterBand';
import DirectoryBrands from '../../../components/sections/DirectoryBrands';
import CustomFieldsDisplay from './CustomFieldsDisplay';
import { FEATURED_VENUES } from '../../../data/featuredVenues';

/**
 * HomepagePreview — Right panel live preview
 *
 * Phase 1: Section Reordering
 * - Renders sections in the order specified by order property
 * - Each section renders with editable field values from formData.sections[]
 * - Only renders enabled sections
 */

// Map of section ID to component
const SECTION_COMPONENTS = {
  hero: SlimHero,
  destinations: DestinationGrid,
  venues: VenueGrid,
  featured: FeaturedSlider,
  categories: CategorySlider,
  vendors: VendorPreview,
  newsletter: NewsletterBand,
  directory: DirectoryBrands,
};

// Default props for each section component
const getSectionProps = (sectionId) => {
  switch (sectionId) {
    case 'hero':
    case 'venues':
    case 'featured':
      return { venues: FEATURED_VENUES };
    default:
      return {};
  }
};

export default function HomepagePreview({ formData, C }) {
  if (!formData) return null;

  const sections = formData.sections || [];

  // Sort sections by order property
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ backgroundColor: C.black, minHeight: '100vh' }}>
        {/* Render sections in sorted order */}
        {sortedSections.map((section) => {
          if (!section.enabled) return null;

          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;

          return (
            <div key={section.id}>
              <Component {...getSectionProps(section.id)} />
              {section.customFields?.length > 0 && (
                <CustomFieldsDisplay customFields={section.customFields} C={C} NU="system-ui" />
              )}
            </div>
          );
        })}
      </div>
    </ThemeCtx.Provider>
  );
}
