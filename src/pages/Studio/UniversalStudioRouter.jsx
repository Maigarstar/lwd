/**
 * UniversalStudioRouter — Main router for /studio/edit/:entityType/:slug
 * Routes to the appropriate studio based on entityType
 */
import { useParams, useLocation } from 'react-router-dom';
import { isValidEntityType, ENTITY_TYPES, getReturnPathFromUrl } from '../../utils/editingUtils';

// Import studio components (update paths as needed based on actual locations)
import MagazineStudio from '../MagazineStudio';
// import ListingStudio from '../ListingStudio';
// import ShowcaseStudio from '../Showcases/ShowcaseStudio';
// import LocationStudio from '../LocationsModule/LocationStudio';
// import CategoryStudio from '../CategoryStudio';

export default function UniversalStudioRouter() {
  const { entityType, slug } = useParams();
  const location = useLocation();
  const returnPath = getReturnPathFromUrl();

  // Validate entity type
  if (!entityType || !isValidEntityType(entityType)) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(245, 240, 232, 0.6)',
        fontFamily: "'Nunito', 'Inter', sans-serif",
      }}>
        <h2>Unknown entity type: {entityType}</h2>
        <p>Valid types: article, listing, showcase, location, category</p>
      </div>
    );
  }

  // Validate slug
  if (!slug) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(245, 240, 232, 0.6)',
        fontFamily: "'Nunito', 'Inter', sans-serif",
      }}>
        <h2>Missing slug parameter</h2>
      </div>
    );
  }

  // Route to correct studio based on entityType
  switch (entityType) {
    case ENTITY_TYPES.ARTICLE:
      return <MagazineStudio slug={slug} returnPath={returnPath} />;

    case ENTITY_TYPES.LISTING:
      // return <ListingStudio slug={slug} returnPath={returnPath} />;
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'rgba(245, 240, 232, 0.6)',
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}>
          <h2>Listing Studio (Coming Soon)</h2>
          <p>Editing listings not yet integrated into universal studio system</p>
        </div>
      );

    case ENTITY_TYPES.SHOWCASE:
      // return <ShowcaseStudio slug={slug} returnPath={returnPath} />;
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'rgba(245, 240, 232, 0.6)',
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}>
          <h2>Showcase Studio (Coming Soon)</h2>
          <p>Editing showcases not yet integrated into universal studio system</p>
        </div>
      );

    case ENTITY_TYPES.LOCATION:
      // return <LocationStudio slug={slug} returnPath={returnPath} />;
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'rgba(245, 240, 232, 0.6)',
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}>
          <h2>Location Studio (Coming Soon)</h2>
          <p>Editing locations not yet integrated into universal studio system</p>
        </div>
      );

    case ENTITY_TYPES.CATEGORY:
      // return <CategoryStudio slug={slug} returnPath={returnPath} />;
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'rgba(245, 240, 232, 0.6)',
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}>
          <h2>Category Studio (Coming Soon)</h2>
          <p>Editing categories not yet integrated into universal studio system</p>
        </div>
      );

    default:
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'rgba(245, 240, 232, 0.6)',
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}>
          <h2>Unknown studio type</h2>
        </div>
      );
  }
}
