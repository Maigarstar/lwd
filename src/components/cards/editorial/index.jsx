// ─── src/components/cards/editorial/index.jsx ────────────────────────────────
// Barrel export + router component for the editorial card system.
//
// Usage (router):
//   <EditorialCard type="standard" data={{ ... }} />
//
// Usage (direct imports):
//   import { StandardCard, QuoteCard } from '@/components/cards/editorial';
// ─────────────────────────────────────────────────────────────────────────────
export { default as StandardCard }              from './StandardCard';
export { default as EditorialProductCard }      from './EditorialProductCard';
export { default as ImageOverlayCard }          from './ImageOverlayCard';
export { default as FeatureCard }               from './FeatureCard';
export { default as MosaicCard }                from './MosaicCard';
export { default as QuoteCard }                 from './QuoteCard';
export { default as CategoryTileCard }          from './CategoryTileCard';
export { default as CarouselCard, CarouselRow } from './CarouselCard';
export { default as EditorialFeatureCard }      from './EditorialFeatureCard';
export { default as VenueStatsCard }            from './VenueStatsCard';
export { default as AmenitiesCard }             from './AmenitiesCard';
export { default as TwoColumnEditorialCard }    from './TwoColumnEditorialCard';
export { default as ParallaxBannerCard }        from './ParallaxBannerCard';
export { default as PhotoGalleryGrid }          from './PhotoGalleryGrid';
export { default as VenueEnquireCard }          from './VenueEnquireCard';

// Shared tokens (useful if parent needs to reference spacing/colours)
export { GD, NU, T, S, RATIO, GOLD, resolvePalette, BookmarkIcon, MetaRow, ImageBox } from './cardTokens';

// ── Router ────────────────────────────────────────────────────────────────────
import StandardCard              from './StandardCard';
import EditorialProductCard      from './EditorialProductCard';
import ImageOverlayCard          from './ImageOverlayCard';
import FeatureCard               from './FeatureCard';
import MosaicCard                from './MosaicCard';
import QuoteCard                 from './QuoteCard';
import CategoryTileCard          from './CategoryTileCard';
import CarouselCard              from './CarouselCard';
import EditorialFeatureCard      from './EditorialFeatureCard';
import VenueStatsCard            from './VenueStatsCard';
import AmenitiesCard             from './AmenitiesCard';
import TwoColumnEditorialCard    from './TwoColumnEditorialCard';
import ParallaxBannerCard        from './ParallaxBannerCard';
import PhotoGalleryGrid          from './PhotoGalleryGrid';
import VenueEnquireCard          from './VenueEnquireCard';

const CARD_MAP = {
  standard:           StandardCard,
  product:            EditorialProductCard,
  'image-overlay':    ImageOverlayCard,
  feature:            FeatureCard,
  mosaic:             MosaicCard,
  quote:              QuoteCard,
  'category-tile':    CategoryTileCard,
  carousel:           CarouselCard,
  'feature-hero':     EditorialFeatureCard,
  'venue-stats':      VenueStatsCard,
  amenities:          AmenitiesCard,
  'two-col-editorial':TwoColumnEditorialCard,
  'parallax-banner':  ParallaxBannerCard,
  'photo-gallery':    PhotoGalleryGrid,
  'venue-enquire':    VenueEnquireCard,
};

export default function EditorialCard({ type, data = {} }) {
  const Component = CARD_MAP[type];
  if (!Component) {
    console.warn(`[EditorialCard] Unknown type: "${type}". Valid types: ${Object.keys(CARD_MAP).join(', ')}`);
    return null;
  }
  return <Component data={data} />;
}
